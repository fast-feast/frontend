import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AppProvider, useApp } from '@/hooks/useAppContext';
import BottomNav from '@/components/BottomNav';
import Toast from '@/components/Toast';
import StickyCartBar from '@/components/StickyCartBar';
import GeminiAssistant from '@/components/GeminiAssistant';
import PwaInstallPrompt from '@/components/PwaInstallPrompt';
import UpdatePrompt from '@/components/UpdatePrompt';
import AppRoutes from '@/routes';

/** Screens that should show the bottom navigation bar. */
const TAB_ROOTS = ['/home', '/orders', '/offers', '/group-order'];

const pageVariants = {
  enter: (pathname: string) => ({
    x: pathname === '/' ? 0 : '100%',
    y: 0,
    opacity: pathname === '/' ? 0 : 0.8,
  }),
  center: {
    x: 0,
    y: 0,
    opacity: 1,
  },
  exit: (pathname: string) => ({
    x: pathname === '/' ? 0 : '-30%',
    y: 0,
    opacity: pathname === '/' ? 0 : 0.5,
  }),
};

function AnimatedOutlet() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        custom={location.pathname}
        variants={pageVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{
          x: { type: 'tween', duration: 0.3, ease: [0.65, 0, 0.35, 1] },
          y: { type: 'spring', stiffness: 300, damping: 30 },
          opacity: { duration: 0.2 },
        }}
        className="h-full w-full responsive-screen"
      >
        <AppRoutes />
      </motion.div>
    </AnimatePresence>
  );
}

function AppShell() {
  useApp();
  const location = useLocation();
  const pathname = location.pathname;
  const [isAIOpen, setIsAIOpen] = useState(false);

  const showNav = TAB_ROOTS.includes(pathname);
  const showCartBar = TAB_ROOTS.includes(pathname) && pathname !== '/cart';

  const handleToggleAI = () => setIsAIOpen((v) => !v);
  const handleCloseAI = () => setIsAIOpen(false);

  return (
    <div className="min-h-[100dvh] w-full bg-[#100B0E] flex justify-center items-stretch p-0 md:p-4">
      {/* Responsive app container */}
      <div
        className="food-theme-bg w-full h-[100dvh] md:h-[calc(100dvh-2rem)] md:max-w-[1120px] lg:max-w-[1024px] xl:max-w-[1280px] rounded-none md:rounded-2xl overflow-hidden shadow-2xl relative isolate flex flex-col"
        style={{
          boxShadow:
            '0 0 0 1px rgba(232, 63, 77, 0.08), 0 0 60px rgba(232, 63, 77, 0.04), 0 25px 80px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Main content area with route transitions */}
        <main className="flex-1 overflow-hidden relative">
          <AnimatedOutlet />
        </main>

        {/* Sticky Cart Bar */}
        {showCartBar && <StickyCartBar />}

        {/* Bottom Navigation */}
        {showNav && <BottomNav isAIOpen={isAIOpen} onToggleAI={handleToggleAI} />}

        {/* Toast Notifications */}
        <Toast />

        {/* PWA Install Prompt */}
        <PwaInstallPrompt />

        {/* PWA Update Prompt */}
        <UpdatePrompt />

        {/* Gemini Food Assistant */}
        <GeminiAssistant isOpen={isAIOpen} onClose={handleCloseAI} />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
