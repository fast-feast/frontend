import { memo, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppProvider } from '@/hooks/AppProvider';
import BottomNav from '@/components/BottomNav';
import Toast from '@/components/Toast';
import StickyCartBar from '@/components/StickyCartBar';
import GeminiAssistant from '@/components/GeminiAssistant';
import PwaInstallPrompt from '@/components/PwaInstallPrompt';
import UpdatePrompt from '@/components/UpdatePrompt';
import AppRoutes from '@/routes';
import { PageActiveProvider } from '@/hooks/PageActiveProvider';

/** Screens that should show the bottom navigation bar. */
const TAB_ROOTS = ['/home', '/orders', '/offers', '/group-order'];

// ─── Page Keep-Alive Cache ─────────────────────────────
// Renders ALL visited pages simultaneously but only the current
// page is visible. This prevents remounting when navigating back.
// Max 5 cached pages to limit memory usage.

const MAX_CACHED_PAGES = 5;

function AnimatedOutlet() {
  const location = useLocation();
  const pathname = location.pathname;
  const prevPathname = useRef(pathname);

  // Track visited page paths — order=most-recent-last
  const [cachedPaths, setCachedPaths] = useState<string[]>(() => [pathname]);

  useEffect(() => {
    if (pathname === prevPathname.current) return;
    prevPathname.current = pathname;

    setCachedPaths((prev) => {
      // Remove duplicate if exists, then add to end
      const next = prev.filter((p) => p !== pathname);
      next.push(pathname);
      // Keep only the last MAX_CACHED_PAGES
      return next.length > MAX_CACHED_PAGES
        ? next.slice(next.length - MAX_CACHED_PAGES)
        : next;
    });
  }, [pathname]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {cachedPaths.map((path) => {
        const isActive = path === pathname;
        return (
          <motion.div
            key={path}
            className="absolute inset-0 overflow-y-auto no-scrollbar"
            initial={false}
            animate={{
              opacity: isActive ? 1 : 0,
              x: isActive ? 0 : '-4%',
              pointerEvents: isActive ? 'auto' : 'none' as const,
            }}
            transition={{
              opacity: { duration: 0.25, ease: 'easeInOut' },
              x: { type: 'tween', duration: 0.3, ease: [0.65, 0, 0.35, 1] },
            }}
            style={{ zIndex: isActive ? 1 : 0 }}
          >
            {/*
              Every layer renders the live router location so redirect routes
              (e.g. '/' → '/login') always fire exactly once, while the cached
              layers keep their motion state for animated back-navigation.
            */}
            <PageActiveProvider active={isActive}>
              <AppRoutes />
            </PageActiveProvider>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Memoized static utility components ─────────────────

/** Sticky cart bar wrapper — only renders when pathname allows cart visibility. */
const CartBarWrapper = memo(function CartBarWrapper({ pathname }: { pathname: string }) {
  const show = TAB_ROOTS.includes(pathname) && pathname !== '/cart';
  if (!show) return null;
  return <StickyCartBar pathname={pathname} />;
});

/** Bottom nav wrapper — only renders on tab root pages. */
function NavBarRenderer({ pathname, isAIOpen, onToggleAI }: {
  pathname: string;
  isAIOpen: boolean;
  onToggleAI: () => void;
}): ReactNode {
  if (!TAB_ROOTS.includes(pathname)) return null;
  return <BottomNav pathname={pathname} isAIOpen={isAIOpen} onToggleAI={onToggleAI} />;
}
const NavBarWrapper = memo(NavBarRenderer);

// ─── App Shell ─────────────────────────────────────────

function AppShell() {
  const location = useLocation();
  const pathname = location.pathname;
  const [isAIOpen, setIsAIOpen] = useState(false);

  const handleToggleAI = useCallback(() => setIsAIOpen((v) => !v), []);
  const handleCloseAI = useCallback(() => setIsAIOpen(false), []);

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
        {/* Main content area — pages stay alive via AnimatedOutlet cache */}
        <main className="flex-1 overflow-hidden relative">
          <AnimatedOutlet />
        </main>

        {/* Sticky Cart Bar — memoized, only renders on valid paths */}
        <CartBarWrapper pathname={pathname} />

        {/* Bottom Navigation — memoized, only renders on tab roots */}
        <NavBarWrapper pathname={pathname} isAIOpen={isAIOpen} onToggleAI={handleToggleAI} />

        {/* Toast Notifications — lightweight, always rendered */}
        <Toast />

        {/* PWA Install Prompt */}
        <PwaInstallPrompt />

        {/* PWA Update Prompt */}
        <UpdatePrompt />

        {/* Gemini Food Assistant */}
        <GeminiAssistant pathname={pathname} isOpen={isAIOpen} onClose={handleCloseAI} />
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
