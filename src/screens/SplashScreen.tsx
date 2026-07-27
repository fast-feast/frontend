import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/hooks/useAppContext';
import { UtensilsCrossed } from 'lucide-react';
import { getMe } from '@/services/auth';

const splashStyles = `
@keyframes splash-fade-in {
  0% { opacity: 0; transform: scale(0.85); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes splash-scale-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.06); }
}
@keyframes splash-orbit {
  0% { transform: rotate(0deg) translateX(70px) rotate(0deg); }
  100% { transform: rotate(360deg) translateX(70px) rotate(-360deg); }
}
@keyframes splash-slide-up {
  0% { transform: translateY(12px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}
@keyframes splash-text-pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}
`;

const EMOJIS = ['🍔', '🍕', '☕', '🍩'];

export default function SplashScreen() {
  const { state, loginWithToken } = useApp();
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      if (state.token) {
        try {
          const res = await getMe();
          const { user, canteen } = res.data;
          loginWithToken(state.token, {
            name: user.name,
            phone: user.phone,
            email: user.email,
          }, canteen);
        } catch {
          // Token invalid, stay logged out
        }
      }
      setAuthChecked(true);
    }
    checkAuth();
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    const timer = setTimeout(() => {
      if (state.isOnboarded) {
        if (state.isLoggedIn) {
          const role = state.user.role;
          if (role === 'admin') navigate('/admin/dashboard', { replace: true });
          else if (role === 'canteen_owner') navigate('/canteen/dashboard', { replace: true });
          else navigate('/home', { replace: true });
        } else {
          navigate('/auth', { replace: true });
        }
      } else {
        navigate('/onboarding', { replace: true });
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [authChecked, state.isOnboarded, state.isLoggedIn, state.user.role, navigate]);

  return (
    <div className="screen-surface h-full flex flex-col items-center justify-center relative overflow-hidden">
      <style>{splashStyles}</style>

      {/* Ambient glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#E83F4D]/15 via-[#B8303E]/6 to-transparent pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-[#E83F4D]/10 blur-[100px] pointer-events-none" />
      <div className="absolute top-2/3 left-1/4 w-[250px] h-[250px] rounded-full bg-[#1A1A2E]/8 blur-[80px] pointer-events-none" />

      {/* Orbiting food animation */}
      <div
        className="relative w-[200px] h-[200px] flex items-center justify-center"
        style={{ animation: 'splash-fade-in 0.4s 0s cubic-bezier(0.16, 1, 0.3, 1) both' }}
      >
        {/* Center circle */}
        <div
          className="w-20 h-20 rounded-full food-gradient flex items-center justify-center shadow-glow-orange z-10"
          style={{ animation: 'splash-scale-pulse 2s 0.4s ease-in-out infinite' }}
        >
          <UtensilsCrossed size={32} className="text-white" />
        </div>

        {/* Orbiting items */}
        {EMOJIS.map((emoji, i) => (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 text-2xl"
            style={{
              animation: 'splash-orbit 3s linear infinite',
              animationDelay: `${i * 0.75}s`,
              marginLeft: '-0.5em',
              marginTop: '-0.5em',
            }}
          >
            {emoji}
          </div>
        ))}
      </div>

      {/* Logo */}
      <div
        className="mt-8 text-center"
        style={{ animation: 'splash-slide-up 0.4s 0.6s cubic-bezier(0.16, 1, 0.3, 1) both' }}
      >
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
          Fast <span className="text-[#FF6B35]">Feast</span>
        </h1>
      </div>

      {/* Loading text */}
      <p
        className="mt-4 text-xs text-[#6B6B6B] font-medium tracking-wide"
        style={{ animation: 'splash-text-pulse 2s 0.9s ease-in-out infinite' }}
      >
        Hungry? Let's fix that! 🍔
      </p>
    </div>
  );
}
