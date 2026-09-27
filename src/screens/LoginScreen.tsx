import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Phone, ShieldCheck, UserRound, UtensilsCrossed,
  Mail, Lock, Eye, EyeOff, ArrowLeft,
} from 'lucide-react';
import { useApp } from '@/hooks/useAppContext';
import { login, sendOtp, verifyOtp, firebaseSession } from '@/services/auth';
import {
  firebaseSignIn,
  firebaseSignUp,
  firebaseGoogleSignIn,
  firebaseSendPasswordReset,
} from '@/services/firebaseAuth';
import { extractErrorMessage } from '@/services/api';
import { SpinnerLoader } from '@/components/ui/loading-animation';
import { ROUTES } from '@/routes/paths';

type LoginMethod = 'email' | 'otp';

/** Standard Google brand mark (inline so no icon package is added). */
function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  );
}

export default function LoginScreen() {
  const { loginWithToken, showToast } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  // This screen serves BOTH the student login (/login) and the canteen
  // owner login (/canteen/login). The canteen variant rejects accounts
  // that are not canteen owners and links back to the student login.
  const isCanteenRoute = location.pathname === ROUTES.LOGIN_CANTEEN;

  // Students authenticate through Firebase (Google or email/password —
  // never phone/SMS). Owners keep the existing backend login — including the
  // Mobile OTP tab, which is hidden on the student route.
  const isStudentLogin = !isCanteenRoute;

  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email');

  // Email/Password login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // OTP login
  const [userName, setUserName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [rememberMeOtp, setRememberMeOtp] = useState(false);

  // Student signup / password reset (Firebase Google + email/password only)
  const [isSignUp, setIsSignUp] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  // Global
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidIndianMobile = /^[6-9]\d{9}$/.test(mobileNumber);

  const handleMobileChange = (value: string) => {
    setMobileNumber(value.replace(/\D/g, '').slice(0, 10));
    setOtpSent(false);
    setOtp('');
  };

  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) { setError('Email is required'); return; }
    if (!password) { setError('Password is required'); return; }
    if (isStudentLogin && isSignUp) {
      if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
      if (confirmPassword !== password) { setError('Passwords do not match'); return; }
    }
    setLoading(true);
    try {
      if (isStudentLogin) {
        // Students: Firebase (Google/email) → ID token → backend session
        // bridge → existing FastFeast { user, token }. The UI, session shape
        // and post-login navigation are identical to before.
        const session = isSignUp
          ? await firebaseSignUp(email.trim(), password)
          : await firebaseSignIn(email.trim(), password);
        const res = await firebaseSession(session.idToken);
        const { user, token } = res.data;
        loginWithToken(token, {
          name: user.name,
          phone: user.phone,
          email: user.email,
          role: user.role,
        });
        showToast(isSignUp ? `Welcome to Fast Feast, ${user.name}!` : `Welcome back, ${user.name}!`);
      } else {
        // Canteen owners: unchanged backend authentication.
        const res = await login({ email: email.trim(), password });
        const { user, token } = res.data;

        // Canteen login admits canteen owners only — reject everyone else
        // before storing the token.
        if (user.role !== 'canteen_owner') {
          setError('This account does not have canteen access.');
          return;
        }

        loginWithToken(token, {
          name: user.name,
          phone: user.phone,
          email: user.email,
          role: user.role,
        });
        showToast(`Welcome back, ${user.name}!`);
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Students only: Firebase Google sign-in → session bridge.
  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const session = await firebaseGoogleSignIn();
      const res = await firebaseSession(session.idToken);
      const { user, token } = res.data;
      loginWithToken(token, {
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
      });
      showToast(`Welcome back, ${user.name}!`);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Students: Firebase's standard reset email — no custom reset backend.
  // Owners keep the original behavior (admin-assisted reset).
  const handleForgotPassword = async () => {
    if (!isStudentLogin) {
      showToast('Forgot password - Contact admin for reset');
      return;
    }
    setError(null);
    if (!email.trim()) { setError('Enter your email first, then tap Forgot Password'); return; }
    setResetting(true);
    try {
      await firebaseSendPasswordReset(email.trim());
      showToast('Password reset email sent');
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setResetting(false);
    }
  };

  const handleOtpLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!otpSent) {
      if (!userName.trim()) { setError('Enter your name'); return; }
      if (!isValidIndianMobile) { setError('Enter a valid 10 digit mobile number'); return; }
    } else {
      if (otp.length !== 6) { setError('Enter the 6 digit OTP'); return; }
    }
    setLoading(true);
    try {
      if (!otpSent) {
        await sendOtp({ phone: `+91 ${mobileNumber}` });
        setOtpSent(true);
        showToast(`OTP sent to +91 ${mobileNumber}`);
      } else {
        const res = await verifyOtp({ phone: `+91 ${mobileNumber}`, otp, name: userName.trim() });
        const { user, token } = res.data;

        // Canteen login admits canteen owners only.
        if (isCanteenRoute && user.role !== 'canteen_owner') {
          setError('This account does not have canteen access.');
          return;
        }

        loginWithToken(token, {
          name: user.name,
          phone: user.phone,
          email: user.email,
          role: user.role,
        });
        showToast('Welcome to Fast Feast!');
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen-surface h-full flex flex-col px-5 md:px-8 lg:px-12 py-8 relative overflow-y-auto no-scrollbar">
      <div className="absolute inset-x-0 top-0 h-64 pointer-events-none bg-gradient-to-b from-[#E83F4D]/15 via-[#B8303E]/6 to-transparent" />
      <div className="absolute top-[40%] right-[5%] w-[250px] h-[250px] rounded-full bg-[#E83F4D]/8 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[10%] w-[200px] h-[200px] rounded-full bg-[#1A1A2E]/6 blur-[70px] pointer-events-none" />

      <div className="relative flex-1 flex flex-col justify-center w-full max-w-[420px] lg:max-w-[480px] mx-auto">
        {isCanteenRoute && (
          <button
            onClick={() => navigate(ROUTES.LOGIN)}
            className="self-start mb-6 text-xs text-[#6B6B6B] hover:text-white transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft size={14} />
            Back to FastFeast
          </button>
        )}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-6"
        >
          <div className="w-16 h-16 rounded-2xl food-gradient flex items-center justify-center shadow-lg mb-5">
            <UtensilsCrossed size={30} className="text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
            {isCanteenRoute ? (
              <>Canteen <span className="text-[#FF6B35]">Login</span></>
            ) : (
              <>Login to <span className="text-[#FF6B35]">FastFeast</span></>
            )}
          </h1>
          <p className="mt-2 text-sm text-[#A0A0A0] leading-relaxed">
            {isCanteenRoute ? 'Sign in to manage your canteen.' : 'Sign in to order your favorites.'}
          </p>
        </motion.div>

        {/* Method Tabs — OTP is owner-only now; students use Firebase email login */}
        {!isStudentLogin && (
          <div className="flex bg-card rounded-xl p-1 mb-5">
            <button
              onClick={() => { setLoginMethod('email'); setError(null); }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                loginMethod === 'email' ? 'food-gradient text-white' : 'text-[#6B6B6B]'
              }`}
            >
              <Mail size={14} className="inline mr-1.5" /> Email
            </button>
            <button
              onClick={() => { setLoginMethod('otp'); setError(null); }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                loginMethod === 'otp' ? 'food-gradient text-white' : 'text-[#6B6B6B]'
              }`}
            >
              <Phone size={14} className="inline mr-1.5" /> Mobile OTP
            </button>
          </div>
        )}

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 mb-4"
            >
              <p className="text-xs text-red-400">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Login Forms with cross-fade transition */}
        <AnimatePresence mode="wait">
        {loginMethod === 'email' && (
          <motion.form
            key="email-form"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            onSubmit={handleEmailLogin}
            className="space-y-4"
          >
            {isStudentLogin && (
              <>
                {/* Students: Continue with Google (Firebase popup) */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full h-14 rounded-full bg-card border border-white/[0.08] text-white font-semibold text-sm flex items-center justify-center gap-3 hover:border-white/20 transition-all disabled:opacity-70"
                >
                  <GoogleIcon size={20} />
                  Continue with Google
                </button>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-[10px] text-[#6B6B6B] uppercase tracking-wider">or</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>
              </>
            )}

            <label className="block">
              <span className="text-xs font-semibold text-[#A0A0A0] uppercase tracking-wide">Email</span>
              <div className="mt-2 h-14 rounded-2xl bg-card border border-white/[0.08] flex items-center gap-3 px-4 focus-within:border-[#FF6B35]/50 focus-within:shadow-[0_0_0_3px_rgba(255,107,53,0.12)] transition-all">
                <Mail size={19} className="text-[#FF6B35] flex-shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="flex-1 min-w-0 bg-transparent outline-none text-white text-sm placeholder:text-[#6B6B6B]"
                  autoComplete="email"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-[#A0A0A0] uppercase tracking-wide">Password</span>
              <div className="mt-2 h-14 rounded-2xl bg-card border border-white/[0.08] flex items-center gap-3 px-4 focus-within:border-[#FF6B35]/50 focus-within:shadow-[0_0_0_3px_rgba(255,107,53,0.12)] transition-all">
                <Lock size={19} className="text-[#FF6B35] flex-shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="flex-1 min-w-0 bg-transparent outline-none text-white text-sm placeholder:text-[#6B6B6B]"
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-[#6B6B6B] hover:text-white transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            {isStudentLogin && isSignUp && (
              <label className="block">
                <span className="text-xs font-semibold text-[#A0A0A0] uppercase tracking-wide">Confirm Password</span>
                <div className="mt-2 h-14 rounded-2xl bg-card border border-white/[0.08] flex items-center gap-3 px-4 focus-within:border-[#FF6B35]/50 focus-within:shadow-[0_0_0_3px_rgba(255,107,53,0.12)] transition-all">
                  <Lock size={19} className="text-[#FF6B35] flex-shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="flex-1 min-w-0 bg-transparent outline-none text-white text-sm placeholder:text-[#6B6B6B]"
                    autoComplete="new-password"
                  />
                </div>
              </label>
            )}

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-[#6B6B6B] bg-card text-[#FF6B35] focus:ring-[#FF6B35]/50"
                />
                <span className="text-[10px] text-[#6B6B6B]">Remember me</span>
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={resetting}
                className="text-[10px] text-[#FF6B35] font-medium hover:underline disabled:opacity-60"
              >
                Forgot Password?
              </button>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-full food-gradient text-white font-semibold text-base shadow-glow-orange flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <SpinnerLoader size="sm" />
                  <span>Signing in...</span>
                </div>
              ) : isStudentLogin && isSignUp ? <>Create Account <ArrowRight size={18} /></> : <>Sign In <ArrowRight size={18} /></>}
            </motion.button>

            {isStudentLogin && (
              <button
                type="button"
                onClick={() => { setIsSignUp(!isSignUp); setConfirmPassword(''); setError(null); }}
                className="w-full text-center text-xs text-[#6B6B6B] hover:text-[#FF6B35] transition-colors"
              >
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Create Account"}
              </button>
            )}

          </motion.form>
        )}
        {loginMethod === 'otp' && (
          <motion.form
            key="otp-form"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            onSubmit={handleOtpLogin}
            className="space-y-4"
          >
            <label className="block">
              <span className="text-xs font-semibold text-[#A0A0A0] uppercase tracking-wide">User Name</span>
              <div className="mt-2 h-14 rounded-2xl bg-card border border-white/[0.08] flex items-center gap-3 px-4 focus-within:border-[#FF6B35]/50 focus-within:shadow-[0_0_0_3px_rgba(255,107,53,0.12)] transition-all">
                <UserRound size={19} className="text-[#FF6B35] flex-shrink-0" />
                <input
                  type="text"
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  placeholder="Enter your name"
                  className="flex-1 min-w-0 bg-transparent outline-none text-white text-sm placeholder:text-[#6B6B6B]"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-[#A0A0A0] uppercase tracking-wide">Mobile Number</span>
              <div className="mt-2 h-14 rounded-2xl bg-card border border-white/[0.08] flex items-center gap-3 px-4 focus-within:border-[#FF6B35]/50 focus-within:shadow-[0_0_0_3px_rgba(255,107,53,0.12)] transition-all">
                <Phone size={19} className="text-[#FF6B35] flex-shrink-0" />
                <span className="text-sm font-semibold text-white">+91</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={mobileNumber}
                  onChange={e => handleMobileChange(e.target.value)}
                  placeholder="9876543210"
                  className="flex-1 min-w-0 bg-transparent outline-none text-white text-sm placeholder:text-[#6B6B6B]"
                />
              </div>
              {mobileNumber.length > 0 && !isValidIndianMobile && (
                <p className="mt-1.5 text-[10px] text-amber-400">Use 10 digits starting with 6, 7, 8, or 9</p>
              )}
            </label>

            {otpSent && (
              <motion.label
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="block"
              >
                <span className="text-xs font-semibold text-[#A0A0A0] uppercase tracking-wide">OTP</span>
                <div className="mt-2 h-14 rounded-2xl bg-card border border-white/[0.08] flex items-center gap-3 px-4 focus-within:border-[#FF6B35]/50 focus-within:shadow-[0_0_0_3px_rgba(255,107,53,0.12)] transition-all">
                  <ShieldCheck size={19} className="text-[#FF6B35] flex-shrink-0" />
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6 digit OTP(123456)"
                    className="flex-1 min-w-0 bg-transparent outline-none text-white text-sm placeholder:text-[#6B6B6B] tracking-[0.28em]"
                  />
                </div>
                <button type="button" onClick={() => { setOtp(''); showToast('OTP resent'); }} className="mt-2 text-xs font-semibold text-[#FF6B35]">
                  Resend OTP
                </button>
              </motion.label>
            )}

            {/* Remember Me for OTP */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMeOtp}
                onChange={e => setRememberMeOtp(e.target.checked)}
                className="w-4 h-4 rounded border-[#6B6B6B] bg-card text-[#FF6B35] focus:ring-[#FF6B35]/50"
              />
              <span className="text-[10px] text-[#6B6B6B]">Remember me</span>
            </label>

            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-full food-gradient text-white font-semibold text-base shadow-glow-orange flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <SpinnerLoader size="sm" />
                  <span>Processing...</span>
                </div>
              ) : otpSent ? <>Verify & Login <ArrowRight size={18} /></> : <>Send OTP <ArrowRight size={18} /></>}
            </motion.button>
          </motion.form>
        )}
        </AnimatePresence>

        {/* Admin access */}
        {!isCanteenRoute && (
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setError(null);
              navigate(ROUTES.ADMIN_LOGIN);
            }}
            className="mt-6 w-full text-center text-xs text-[#6B6B6B] hover:text-[#FF6B35] transition-colors flex items-center justify-center gap-1.5"
          >
            <ShieldCheck size={13} />
            Admin Login
          </button>
        )}
      </div>
    </div>
  );
}