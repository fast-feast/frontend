import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, Store, LogIn, UtensilsCrossed, Sparkles } from 'lucide-react';
import { getStoredToken } from '@/services/api';
import { ROUTES } from '@/routes/paths';

const floatingEmojis = ['🍔', '🍕', '🌮', '🥗', '🍜', '🍩', '☕', '🍰'];

export default function AuthLandingScreen() {
  const navigate = useNavigate();
  const hasToken = !!getStoredToken();

  const handleContinueAs = (role: 'student' | 'canteen_owner') => {
    navigate(ROUTES.LOGIN, {
      state: { role },
    });
  };

  const handlePreviousLogin = () => {
    // Navigate to splash which handles session restoration via getMe()
    navigate(ROUTES.SPLASH, { replace: true });
  };

  return (
    <div className="screen-surface h-full flex flex-col items-center justify-center relative overflow-hidden px-6">
      {/* Ambient glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#E83F4D]/15 via-[#B8303E]/6 to-transparent pointer-events-none" />
      <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-[450px] h-[450px] rounded-full bg-[#E83F4D]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[15%] right-[10%] w-[200px] h-[200px] rounded-full bg-[#FF6B35]/8 blur-[80px] pointer-events-none" />

      {/* Floating food emojis decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {floatingEmojis.map((emoji, i) => (
          <motion.span
            key={i}
            className="absolute text-xl opacity-[0.08]"
            style={{
              left: `${12 + (i * 11) % 76}%`,
              top: `${8 + (i * 13) % 80}%`,
            }}
            animate={{
              y: [0, -12, 0],
              opacity: [0.06, 0.12, 0.06],
            }}
            transition={{
              duration: 3 + (i % 3),
              repeat: Infinity,
              delay: i * 0.4,
              ease: 'easeInOut',
            }}
          >
            {emoji}
          </motion.span>
        ))}
      </div>

      {/* Brand Header */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 text-center mb-10"
      >
        <div className="w-20 h-20 rounded-2xl food-gradient flex items-center justify-center shadow-glow-orange mx-auto mb-5">
          <UtensilsCrossed size={38} className="text-white" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
          Fast<span className="text-[#FF6B35]">Feast</span>
        </h1>
        <p className="mt-3 text-sm text-[#A0A0A0] max-w-[280px] mx-auto leading-relaxed">
          Your campus canteen, reimagined. Order ahead and skip the queue.
        </p>
      </motion.div>

      {/* Action Cards */}
      <div className="relative z-10 w-full max-w-[400px] space-y-3.5">
        {/* Continue as Student */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleContinueAs('student')}
          className="w-full group relative overflow-hidden rounded-2xl bg-card border border-white/[0.06] p-5 flex items-center gap-4 text-left transition-all hover:border-[#FF6B35]/30 hover:shadow-[0_0_30px_rgba(255,107,53,0.08)]"
        >
          <div className="w-14 h-14 rounded-xl food-gradient flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-105 transition-transform">
            <GraduationCap size={26} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-white">Continue as Student</h3>
            <p className="text-xs text-[#6B6B6B] mt-0.5">Browse menus, order food, track deliveries</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center flex-shrink-0 group-hover:bg-[#FF6B35]/20 group-hover:scale-110 transition-all">
            <Sparkles size={16} className="text-[#FF6B35]" />
          </div>
        </motion.button>

        {/* Continue as Canteen Owner */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleContinueAs('canteen_owner')}
          className="w-full group relative overflow-hidden rounded-2xl bg-card border border-white/[0.06] p-5 flex items-center gap-4 text-left transition-all hover:border-[#E83F4D]/30 hover:shadow-[0_0_30px_rgba(232,63,77,0.08)]"
        >
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#E83F4D] to-[#B8303E] flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-105 transition-transform">
            <Store size={26} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-white">Canteen Owner</h3>
            <p className="text-xs text-[#6B6B6B] mt-0.5">Manage orders, update menu, track operations</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center flex-shrink-0 group-hover:bg-[#E83F4D]/20 group-hover:scale-110 transition-all">
            <Sparkles size={16} className="text-[#E83F4D]" />
          </div>
        </motion.button>

        {/* Continue with Previous Login (only if token exists) */}
        {hasToken && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePreviousLogin}
            className="w-full rounded-xl p-4 flex items-center justify-center gap-2.5 text-sm font-semibold text-white/70 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.12] transition-all"
          >
            <LogIn size={17} />
            Continue with Previous Login
          </motion.button>
        )}
      </div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="relative z-10 mt-10 text-[10px] text-[#6B6B6B] text-center"
      >
        By continuing, you agree to our Terms & Privacy Policy
      </motion.p>
    </div>
  );
}
