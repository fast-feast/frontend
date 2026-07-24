import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, Home } from 'lucide-react';
import { ROUTES } from '@/routes/paths';

export default function NotFoundScreen() {
  const navigate = useNavigate();

  return (
    <div className="screen-surface h-full flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#E83F4D]/10 via-transparent to-transparent pointer-events-none" />

      <motion.div
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="w-20 h-20 rounded-2xl food-gradient flex items-center justify-center shadow-glow-orange mb-6"
      >
        <UtensilsCrossed size={36} className="text-white" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-6xl font-extrabold text-white tracking-tight"
      >
        404
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-sm text-[#A0A0A0] mt-2 text-center"
      >
        This page is not on the menu.
      </motion.p>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate(ROUTES.HOME, { replace: true })}
        className="mt-8 h-12 px-6 rounded-full food-gradient text-white font-semibold text-sm flex items-center gap-2"
      >
        <Home size={16} />
        Go Home
      </motion.button>
    </div>
  );
}
