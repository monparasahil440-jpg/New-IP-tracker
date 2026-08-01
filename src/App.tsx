import { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';
import { ShareViewerPage } from './pages/ShareViewerPage';
import { SettingsPage } from './pages/SettingsPage';
import { TrackingPage } from './pages/TrackingPage';
import { CreateShareModal } from './components/CreateShareModal';
import { AuthModal } from './components/AuthModal';
import type { ShareItem } from './lib/supabase';
import { Terminal } from 'lucide-react';

export function App() {
  const [activeNav, setActiveNav] = useState<'home' | 'dashboard' | 'settings' | 'share' | 'tracking'>('home');
  const [shareUuid, setShareUuid] = useState<string | null>(null);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      
      // Tracking route: /r/{trackingCode} - redirect to standalone HTML
      if (hash.startsWith('#/r/')) {
        const code = hash.replace('#/r/', '');
        if (code) {
          // Redirect to standalone tracking HTML page
          const baseUrl = window.location.origin + window.location.pathname.replace(/\/$/, '');
          window.location.href = `${baseUrl}/tracking.html?code=${code}`;
          return;
        }
      }
      // Dashboard route: /dashboard/{trackingCode}
      else if (hash.startsWith('#/dashboard/')) {
        const code = hash.replace('#/dashboard/', '');
        if (code) {
          setTrackingCode(code);
          setActiveNav('dashboard');
        }
      }
      // Legacy share route for backward compatibility
      else if (hash.startsWith('#/share/')) {
        const uuid = hash.replace('#/share/', '');
        if (uuid) {
          setShareUuid(uuid);
          setActiveNav('share');
        }
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleOpenShareView = (uuid: string) => {
    setShareUuid(uuid);
    window.location.hash = `#/share/${uuid}`;
    setActiveNav('share');
  };

  const handleOpenDashboard = (trackingCode: string) => {
    setTrackingCode(trackingCode);
    window.location.hash = `#/dashboard/${trackingCode}`;
    setActiveNav('dashboard');
  };

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleShareCreated = (share: ShareItem) => {
    handleOpenShareView(share.uuid);
  };

  const handleTrackingLinkCreated = (trackingCode: string) => {
    handleOpenDashboard(trackingCode);
  };

  return (
    <AuthProvider>
      <div className="min-h-screen bg-cyber-bg text-cyber-text relative flex flex-col font-sans selection:bg-cyber-teal selection:text-black">
        <div className="fixed inset-0 cyber-scanline pointer-events-none z-[3000] opacity-40" />
        <div className="fixed inset-0 cyber-grid pointer-events-none z-[0] opacity-30" />

        <Navbar
          onOpenAuth={handleOpenAuth}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
          activeNav={activeNav}
          setActiveNav={(nav) => {
            if (nav !== 'share') window.location.hash = '';
            setActiveNav(nav as any);
          }}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 z-10">
          {activeNav === 'home' && (
            <HomePage
              onOpenCreate={() => setIsCreateModalOpen(true)}
              onOpenAuth={() => handleOpenAuth('login')}
              onNavigateDashboard={() => setActiveNav('dashboard')}
            />
          )}

          {activeNav === 'dashboard' && (
            <DashboardPage
              trackingCode={trackingCode}
              onOpenCreate={() => setIsCreateModalOpen(true)}
              onOpenShareView={handleOpenShareView}
              onOpenTrackingDashboard={handleOpenDashboard}
              onBackToMainDashboard={() => {
                setTrackingCode(null);
                window.location.hash = '';
              }}
            />
          )}

          {activeNav === 'tracking' && trackingCode && (
            <TrackingPage trackingCode={trackingCode} />
          )}

          {activeNav === 'settings' && <SettingsPage />}

          {activeNav === 'share' && shareUuid && (
            <ShareViewerPage
              uuid={shareUuid}
              onBack={() => {
                window.location.hash = '';
                setActiveNav('dashboard');
              }}
            />
          )}
        </main>

        <footer className="z-10 border-t border-cyber-teal/20 bg-cyber-bg/95 py-4 font-mono text-xs">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-gray-500">
            <div className="flex items-center gap-2 text-cyber-teal">
              <Terminal className="w-4 h-4 text-cyber-teal" />
              <span>LOCATION SHARE TAC-OS v2.4</span>
            </div>
            <div className="text-[11px]">
              SUPABASE REALTIME • LEAFLET GIS • PWA COMPATIBLE • GITHUB PAGES READY
            </div>
          </div>
        </footer>

        <CreateShareModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={handleShareCreated}
          onTrackingLinkCreated={handleTrackingLinkCreated}
        />

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          initialMode={authMode}
        />
      </div>
    </AuthProvider>
  );
}

export default App;
