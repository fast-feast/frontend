import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Store, ClipboardList, LogOut, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useApp } from '@/hooks/useAppContext';
import { ROUTES } from '@/routes/paths';

const NAV_ITEMS = [
  { path: ROUTES.ADMIN_DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
  { path: ROUTES.ADMIN_USERS, label: 'Users', icon: Users },
  { path: ROUTES.ADMIN_CANTEENS, label: 'Canteens', icon: Store },
  { path: ROUTES.ADMIN_ORDERS, label: 'Orders', icon: ClipboardList },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { state, logout } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  // logout() is role-aware and already routes admins to /admin/login.
  const handleLogout = () => {
    logout();
  };

  const isActive = (path: string) =>
    path === ROUTES.ADMIN_DASHBOARD
      ? location.pathname === ROUTES.ADMIN_DASHBOARD
      : location.pathname.startsWith(path);

  return (
    <div className="h-full w-full flex flex-col md:flex-row bg-[#0C070A]">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex w-60 lg:w-64 flex-shrink-0 flex-col border-r border-white/[0.06] bg-[#0A0508]/90">
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.06]">
          <div className="w-9 h-9 rounded-xl food-gradient flex items-center justify-center">
            <ShieldCheck size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">Admin Panel</p>
            <p className="text-[10px] text-[#6B6B6B]">FastFeast</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? 'bg-card text-white border border-white/[0.08]'
                    : 'text-[#8A8A8A] hover:text-white hover:bg-card/60'
                }`}
              >
                <Icon size={17} className={active ? 'text-[#FF6B35]' : ''} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-white/[0.06] space-y-2">
          <div className="px-3.5">
            <p className="text-xs font-semibold text-white truncate">{state.user.name}</p>
            <p className="text-[10px] text-[#6B6B6B] truncate">{state.user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </aside>

      {/* Top bar (mobile) */}
      <header className="md:hidden flex-shrink-0 border-b border-white/[0.06] bg-[#0A0508]/90 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg food-gradient flex items-center justify-center">
              <ShieldCheck size={15} className="text-white" />
            </div>
            <p className="text-sm font-bold text-white">Admin Panel</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-8 h-8 rounded-lg bg-card flex items-center justify-center text-red-400"
            aria-label="Logout"
          >
            <LogOut size={15} />
          </button>
        </div>
        <nav className="flex gap-1.5 mt-3 overflow-x-auto no-scrollbar">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  active ? 'food-gradient text-white' : 'bg-card text-[#8A8A8A]'
                }`}
              >
                <Icon size={13} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Content */}
      <main className="flex-1 min-w-0 h-full overflow-y-auto no-scrollbar">{children}</main>
    </div>
  );
}

// Re-exported helper so screens can navigate back to the admin home easily.
export function AdminBackButton() {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(ROUTES.ADMIN_DASHBOARD)}
      className="w-9 h-9 rounded-full bg-card flex items-center justify-center hover:bg-card-elevated transition-colors"
      aria-label="Back to dashboard"
    >
      <ArrowLeft size={18} className="text-white" />
    </button>
  );
}
