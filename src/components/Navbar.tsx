import { useAuth } from '../context/AuthContext';
import { Radio, LogOut, Activity } from 'lucide-react';

interface NavbarProps {
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onOpenCreateModal: () => void;
  activeNav: string;
  setActiveNav: (nav: string) => void;
}

export const Navbar = ({
  onOpenAuth,
  onOpenCreateModal,
  activeNav,
  setActiveNav,
}: NavbarProps) => {
  const { user, logout, isMockUser } = useAuth();

  return (
    <header className="sticky top-0 z-[4000] bg-cyber-bg/90 backdrop-blur-md border-b border-cyber-teal/30 shadow-neon-teal font-mono">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setActiveNav('home')}
          className="flex items-center gap-3 group text-left"
        >
          <div className="relative p-2 bg-cyber-teal/10 border border-cyber-teal rounded-lg group-hover:shadow-neon-teal transition-all">
            <Radio className="w-6 h-6 text-cyber-teal animate-pulse" />
          </div>
          <div>
            <div className="text-base font-extrabold text-white tracking-wider flex items-center gap-2">
              LOCATION<span className="text-cyber-teal">SHARE</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/40">
                v2.4 TAC-OS
              </span>
            </div>
            <div className="text-[10px] text-gray-400">ENCRYPTED GPS STREAMING PROTOCOL</div>
          </div>
        </button>

        <nav className="hidden md:flex items-center gap-1 text-xs">
          <button
            onClick={() => setActiveNav('home')}
            className={`px-3 py-1.5 rounded transition-all ${
              activeNav === 'home'
                ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/50'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            COMMAND CENTER
          </button>
          <button
            onClick={() => setActiveNav('dashboard')}
            className={`px-3 py-1.5 rounded transition-all ${
              activeNav === 'dashboard'
                ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/50'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            NODES DASHBOARD
          </button>
          <button
            onClick={() => setActiveNav('settings')}
            className={`px-3 py-1.5 rounded transition-all ${
              activeNav === 'settings'
                ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/50'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            SYSTEM CONFIG
          </button>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenCreateModal}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-cyber-green/10 border border-cyber-green/50 text-cyber-green hover:bg-cyber-green/20 rounded text-xs font-bold transition-all shadow-neon-green"
          >
            <Activity className="w-4 h-4 animate-pulse" />
            + NEW SHARE LINK
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex flex-col text-right text-[11px]">
                <span className="text-cyber-teal font-bold truncate max-w-[120px]">
                  {user.user_metadata?.name || user.email || 'Operator'}
                </span>
                <span className="text-[9px] text-cyber-green flex items-center justify-end gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyber-green animate-ping" />
                  {isMockUser ? 'DEMO NODE' : 'ENCRYPTED'}
                </span>
              </div>
              <button
                onClick={() => logout()}
                className="p-2 border border-cyber-red/50 text-cyber-red hover:bg-cyber-red/20 rounded transition-all"
                title="Disconnect Operator"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-3 py-1.5 text-xs text-cyber-teal border border-cyber-teal/50 hover:bg-cyber-teal/20 rounded transition-all"
              >
                LOGIN
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="px-3 py-1.5 text-xs bg-cyber-teal text-black font-bold rounded hover:bg-cyber-teal/80 transition-all shadow-neon-teal"
              >
                REGISTER
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
