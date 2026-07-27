import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ClipboardList, Gift, Users, Bot, X } from 'lucide-react';
import { useApp } from '@/hooks/useAppContext';
import type { TabName } from '@/types';

interface BottomNavProps {
  isAIOpen: boolean;
  onToggleAI: () => void;
}

const tabs: { key: TabName; icon: React.ElementType; label: string; path: string }[] = [
  { key: 'home', icon: Home, label: 'Home', path: '/home' },
  { key: 'orders', icon: ClipboardList, label: 'Orders', path: '/orders' },
  { key: 'offers', icon: Gift, label: 'Offers', path: '/offers' },
  { key: 'group', icon: Users, label: 'Group', path: '/group-order' },
];

export default function BottomNav({ isAIOpen, onToggleAI }: BottomNavProps) {
  const { dispatch } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab =
    tabs.find((t) => location.pathname.startsWith(t.path))?.key || 'home';

  const renderTab = (tab: { key: TabName; icon: React.ElementType; label: string; path: string }, index: number, offset: number) => {
    const isActive = activeTab === tab.key;
    const Icon = tab.icon;
    return (
      <motion.button
        key={tab.key}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 + (index + offset) * 0.05, type: 'spring', stiffness: 260, damping: 20 }}
        onClick={() => {
          dispatch({ type: 'SET_TAB', tab: tab.key });
          navigate(tab.path);
        }}
        className="flex flex-col items-center justify-center gap-1 w-14 sm:w-20 h-14 relative"
      >
        {isActive && (
          <motion.div
            layoutId="activeTabBg"
            className="absolute inset-0 mx-auto w-10 h-10 rounded-xl"
            style={{
              background: 'rgba(217, 74, 90, 0.12)',
              filter: 'blur(4px)',
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          />
        )}
        <motion.div
          animate={isActive ? { scale: 1.1, y: -1 } : { scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          className="relative"
        >
          <Icon
            size={20}
            strokeWidth={isActive ? 2.5 : 1.5}
            className={isActive ? 'text-white' : 'text-[#6B4D5A]'}
            style={isActive ? { filter: 'drop-shadow(0 0 6px rgba(217, 74, 90, 0.5))' } : {}}
          />
        </motion.div>
        <span
          className={`text-[10px] font-medium transition-colors duration-200 ${
            isActive ? 'text-white' : 'text-[#6B4D5A]'
          }`}
        >
          {tab.label}
        </span>
        {isActive && (
          <motion.div
            layoutId="activeTabIndicator"
            className="absolute -bottom-0.5 w-6 h-[2px] rounded-full"
            style={{
              background: 'linear-gradient(135deg, #D94A5A, #B83042)',
              boxShadow: '0 0 8px rgba(217, 74, 90, 0.5)',
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          />
        )}
      </motion.button>
    );
  };

  return (
    <motion.nav
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.1 }}
      className="flex-shrink-0 w-full z-50"
    >
      <div
        style={{
          background: 'rgba(10, 5, 9, 0.97)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(217, 74, 90, 0.08)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="nav-container flex items-center justify-around sm:justify-center sm:gap-6 md:gap-10 lg:gap-16 h-14 px-2 md:px-4">
          {/* First 2 tabs: Home, Orders */}
          {tabs.slice(0, 2).map((tab, i) => renderTab(tab, i, 0))}

          {/* AI Chatbot Center Button */}
          <motion.button
            initial={{ y: 20, opacity: 0, scale: 0.85 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ delay: 0.35, type: 'spring', stiffness: 300, damping: 18 }}
            onClick={onToggleAI}
            whileTap={{ scale: 0.92 }}
            className="flex flex-col items-center justify-center gap-1 w-14 sm:w-20 h-14 relative"
          >
            <motion.div
              animate={isAIOpen ? {
                boxShadow: [
                  '0 0 16px rgba(232, 63, 77, 0.5)',
                  '0 0 28px rgba(232, 63, 77, 0.3)',
                  '0 0 16px rgba(232, 63, 77, 0.5)',
                ],
              } : {
                boxShadow: [
                  '0 0 8px rgba(232, 63, 77, 0.15)',
                  '0 0 16px rgba(232, 63, 77, 0.08)',
                  '0 0 8px rgba(232, 63, 77, 0.15)',
                ],
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="w-11 h-11 rounded-full food-gradient flex items-center justify-center border-2 border-white/15"
            >
              <AnimatePresence mode="wait">
                {isAIOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X size={18} className="text-white" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="bot"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="relative"
                  >
                    <Bot size={18} className="text-white" />
                    <motion.span
                      animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 1.8, repeat: Infinity }}
                      className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-white"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            <span className="text-[10px] font-medium text-[#D94A5A]">
              AI Chef
            </span>
          </motion.button>

          {/* Last 2 tabs: Offers, Group */}
          {tabs.slice(2).map((tab, i) => renderTab(tab, i, 3))}
        </div>
      </div>
    </motion.nav>
  );
}
