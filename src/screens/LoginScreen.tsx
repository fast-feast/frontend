import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Phone, ShieldCheck, UserRound, UtensilsCrossed,
  Mail, Lock, Eye, EyeOff, ArrowLeft,
} from 'lucide-react';
import { useApp } from '@/hooks/useAppContext';
import { login, sendOtp, verifyOtp } from '@/services/auth';
import { extractErrorMessage } from '@/services/api';
import { SpinnerLoader } from '@/components/ui/loading-animation';
import { ROUTES } from '@/routes/paths';

type LoginMethod = 'email' | 'otp';

export default function LoginScreen() {
  const { loginWithToken, showToast } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  // This screen serves BOTH the student login (/login) and the canteen
  // owner login (/canteen/login). The canteen variant rejects accounts
  // that are not canteen owners and links back to the student login.
  const isCanteenRoute = location.pathname === ROUTES.LOGIN_CANTEEN;

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
    setLoading(true);
    try {
      const res = await login({ email: email.trim(), password });
      const { user, token } = res.data;

      // Canteen login admits canteen owners only — reject everyone else
      // before storing the token.
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
      showToast(`Welcome back, ${user.name}!`);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
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

        {/* Method Tabs */}
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
                onClick={() => showToast('Forgot password - Contact admin for reset')}
                className="text-[10px] text-[#FF6B35] font-medium hover:underline"
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
              ) : <>Sign In <ArrowRight size={18} /></>}
            </motion.button>

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
                    placeholder="Enter 6 digit OTP"
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
            onClick={() => navigate(ROUTES.ADMIN_LOGIN)}
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