import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';
import { useApp } from '@/hooks/useAppContext';
import { login } from '@/services/auth';
import { extractErrorMessage } from '@/services/api';
import { ROUTES } from '@/routes/paths';

/**
 * Dedicated admin login page.
 * Uses the existing auth API; only accounts with role === 'admin' are admitted.
 * Non-admin accounts are rejected here and never reach the admin dashboard.
 */
export default function AdminLoginScreen() {
  const { loginWithToken, showToast } = useApp();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) { setError('Email is required'); return; }
    if (!password) { setError('Password is required'); return; }
    setLoading(true);
    try {
      const res = await login({ email: email.trim(), password });
      const { user, token } = res.data;

      // Only allow admin role — reject everyone else before storing the token.
      if (user.role !== 'admin') {
        setError('This account does not have admin access.');
        return;
      }

      // loginWithToken routes admins to /admin/dashboard automatically.
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

  return (
    <div className="screen-surface h-full flex flex-col px-5 md:px-8 lg:px-12 py-8 relative overflow-y-auto no-scrollbar">
      <div className="absolute inset-x-0 top-0 h-64 pointer-events-none bg-gradient-to-b from-[#E83F4D]/15 via-[#B8303E]/6 to-transparent" />

      <div className="relative flex-1 flex flex-col justify-center w-full max-w-[420px] mx-auto">
        <button
          onClick={() => navigate(ROUTES.LOGIN, { replace: true })}
          className="self-start mb-6 text-xs text-[#6B6B6B] hover:text-white transition-colors flex items-center gap-1.5"
        >
          <ArrowLeft size={14} />
          Back to FastFeast
        </button>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-6"
        >
          <div className="w-16 h-16 rounded-2xl food-gradient flex items-center justify-center shadow-lg mb-5">
            <ShieldCheck size={30} className="text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Admin <span className="text-[#FF6B35]">Login</span>
          </h1>
          <p className="mt-2 text-sm text-[#A0A0A0] leading-relaxed">
            Restricted area. Only administrator accounts can sign in.
          </p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 mb-4"
          >
            <p className="text-xs text-red-400">{error}</p>
          </motion.div>
        )}

        <motion.form
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onSubmit={handleSubmit}
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
                placeholder="admin@fastfeast.app"
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
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>

          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={loading}
            className="w-full h-14 rounded-full food-gradient text-white font-semibold text-base shadow-glow-orange flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? 'Signing in...' : <>Sign In <ArrowRight size={18} /></>}
          </motion.button>

          <p className="text-[10px] text-center text-[#6B6B6B] mt-2">
            Demo admin: admin@fastfeast.app / password123
          </p>
        </motion.form>
      </div>
    </div>
  );
}
