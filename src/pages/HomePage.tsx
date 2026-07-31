import React from 'react';
import { Shield, Lock, Zap, Terminal, ArrowRight, Radio, Navigation } from 'lucide-react';

interface HomePageProps {
  onOpenCreate: () => void;
  onOpenAuth: () => void;
  onNavigateDashboard: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onOpenCreate, onNavigateDashboard }) => {
  return (
    <div className="space-y-12 py-6 font-mono">
      {/* Hero Cyber HUD Section */}
      <section className="relative overflow-hidden rounded-2xl border border-cyber-teal/40 bg-cyber-glass-panel p-8 md:p-12 shadow-neon-teal">
        {/* Real-time Radar Sweep Graphic */}
        <div className="absolute right-4 bottom-4 md:right-12 md:bottom-6 w-72 h-72 rounded-full border border-cyber-teal/30 pointer-events-none flex items-center justify-center bg-black/40">
          <div className="w-52 h-52 rounded-full border border-cyber-teal/30 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full border border-cyber-teal/40 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border border-cyber-teal/60" />
            </div>
          </div>

          {/* Crosshair Lines */}
          <div className="absolute w-full h-[1px] bg-cyber-teal/20" />
          <div className="absolute h-full w-[1px] bg-cyber-teal/20" />

          {/* Smooth Conic Gradient Radar Scanner */}
          <div className="absolute inset-0 conic-radar-sweep pointer-events-none" />

          {/* Radar Blip Targets */}
          <div className="absolute top-16 left-20 w-2 h-2 rounded-full bg-cyber-green animate-ping" />
          <div className="absolute bottom-20 right-16 w-2 h-2 rounded-full bg-cyber-teal animate-pulse" />
        </div>

        <div className="relative z-10 max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyber-teal/10 border border-cyber-teal/40 text-cyber-teal text-xs">
            <Radio className="w-3.5 h-3.5 animate-pulse text-cyber-teal" />
            <span>REAL-TIME ENCRYPTED GPS TELEMETRY PROTOCOL</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-wide">
            VOLUNTARY LIVE <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyber-teal via-cyber-green to-cyber-purple">
              LOCATION STREAMING
            </span>
          </h1>

          <p className="text-sm text-gray-300 leading-relaxed font-sans">
            Broadcast encrypted GPS coordinates via unique secure UUID sharing links. Configure auto-destruct timers, password protection, and real-time battery & telemetry monitoring.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <button
              onClick={onOpenCreate}
              className="px-6 py-3 bg-cyber-teal text-black font-bold rounded-lg hover:bg-cyber-teal/90 shadow-neon-teal transition-all flex items-center gap-2 text-sm"
            >
              <Navigation className="w-4 h-4 fill-current" />
              CREATE LOCATION SHARE NODE
            </button>

            <button
              onClick={onNavigateDashboard}
              className="px-6 py-3 bg-black/50 border border-cyber-border hover:border-cyber-teal text-cyber-teal rounded-lg transition-all flex items-center gap-2 text-sm"
            >
              NODES DASHBOARD <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl bg-cyber-glass-panel border border-cyber-border hover:border-cyber-teal/60 transition-all space-y-3 group">
          <div className="p-3 w-fit rounded-lg bg-cyber-teal/10 border border-cyber-teal/30 text-cyber-teal group-hover:shadow-neon-teal">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">Cryptographic UUID & Passcode</h3>
          <p className="text-xs text-gray-400 font-sans leading-relaxed">
            Every share link generates a cryptographically random UUID. Add optional password protection for confidential tracking.
          </p>
        </div>

        <div className="p-6 rounded-xl bg-cyber-glass-panel border border-cyber-border hover:border-cyber-green/60 transition-all space-y-3 group">
          <div className="p-3 w-fit rounded-lg bg-cyber-green/10 border border-cyber-green/30 text-cyber-green group-hover:shadow-neon-green">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">10s Supabase Realtime Sync</h3>
          <p className="text-xs text-gray-400 font-sans leading-relaxed">
            Stream continuous coordinates, speed, heading, device battery percentage, and online status directly to viewers' interactive dark tactical maps.
          </p>
        </div>

        <div className="p-6 rounded-xl bg-cyber-glass-panel border border-cyber-border hover:border-cyber-yellow/60 transition-all space-y-3 group">
          <div className="p-3 w-fit rounded-lg bg-cyber-yellow/10 border border-cyber-yellow/30 text-cyber-yellow">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">Full Privacy Controls</h3>
          <p className="text-xs text-gray-400 font-sans leading-relaxed">
            Choose single-ping snapshot or continuous broadcast. Set auto-destruction timers (10m, 1h, 24h) or revoke sharing instantly anytime.
          </p>
        </div>
      </section>

      {/* Terminal Command Specs */}
      <section className="p-6 rounded-xl bg-black/80 border border-cyber-teal/30 font-mono text-xs space-y-3">
        <div className="flex items-center gap-2 text-cyber-teal font-bold border-b border-cyber-border pb-2">
          <Terminal className="w-4 h-4" /> SYSTEM TELEMETRY PROTOCOL LOG
        </div>
        <div className="text-gray-400 space-y-1 text-[11px]">
          <p className="text-cyber-green">[✓] Leaflet Dark Matter GIS Canvas Engine Mounted</p>
          <p className="text-cyber-teal">[✓] Supabase Realtime Socket Channel: Online & Published</p>
          <p className="text-cyber-yellow">[!] HTML5 Geolocation API: High Precision Mode Standing By</p>
        </div>
      </section>
    </div>
  );
};
