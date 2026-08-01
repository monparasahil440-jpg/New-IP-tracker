import React, { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured, getLocalShares } from '../lib/supabase';
import type { ShareItem } from '../lib/supabase';
import { useLocationTracker } from '../hooks/useLocationTracker';
import { CyberMap } from '../components/CyberMap';
import { QRCodeModal } from '../components/QRCodeModal';
import {
  Shield,
  Radio,
  Lock,
  BatteryCharging,
  Battery,
  Wifi,
  WifiOff,
  QrCode,
  Copy,
  Check,
  AlertTriangle,
  Play,
  Square,
  Volume2,
  VolumeX,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ShareViewerPageProps {
  uuid: string;
  onBack: () => void;
}

export const ShareViewerPage: React.FC<ShareViewerPageProps> = ({ uuid, onBack }) => {
  const [shareNode, setShareNode] = useState<ShareItem | null>(null);
  const [loadingShare, setLoadingShare] = useState(true);
  const [passcodeAttempt, setPasscodeAttempt] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passcodeError, setPasscodeError] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mockSimulatorActive, setMockSimulatorActive] = useState(false);
  const [audioBeep, setAudioBeep] = useState(true);

  useEffect(() => {
    const loadShare = async () => {
      setLoadingShare(true);
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('shares')
          .select('*')
          .eq('uuid', uuid)
          .single();

        if (data && !error) {
          setShareNode(data as ShareItem);
          if (!data.password_hash) setIsUnlocked(true);
        } else {
          const local = getLocalShares().find((s) => s.uuid === uuid);
          if (local) {
            setShareNode(local);
            if (!local.password_hash) setIsUnlocked(true);
          }
        }
      } else {
        const local = getLocalShares().find((s) => s.uuid === uuid);
        if (local) {
          setShareNode(local);
          if (!local.password_hash) setIsUnlocked(true);
        }
      }
      setLoadingShare(false);
    };

    loadShare();
  }, [uuid]);

  const {
    location,
    isTracking,
    isOnline,
    battery,
    startTracking,
    stopTracking,
    setLocation,
  } = useLocationTracker(shareNode?.id || null, true, shareNode?.mode !== 'once');

  // Instant redirect when share is loaded and unlocked with target URL
  useEffect(() => {
    if (isUnlocked && shareNode && shareNode.target_url) {
      // Validate and fix the URL before redirecting
      let redirectUrl = shareNode.target_url;
      
      // Fix malformed URLs like 'https:google.com' -> 'https://google.com'
      if (redirectUrl.match(/^https?:[^/]/i)) {
        redirectUrl = redirectUrl.replace(/^https?:/i, 'https://');
      }
      
      // Remove duplicate protocols like 'https://https://google.com' -> 'https://google.com'
      if (redirectUrl.match(/^https?:\/\/https?:\/\//i)) {
        redirectUrl = redirectUrl.replace(/^https?:\/\/https?:\/\//i, 'https://');
      }
      
      startTracking();
      const timer = setTimeout(() => {
        window.location.href = redirectUrl;
      }, 100); // Small delay to ensure GPS tracking starts
      return () => clearTimeout(timer);
    }
  }, [isUnlocked, shareNode, startTracking]);

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (shareNode?.password_hash === passcodeAttempt.trim()) {
      setIsUnlocked(true);
      setPasscodeError(false);
      confetti({ particleCount: 30, spread: 50 });
    } else {
      setPasscodeError(true);
    }
  };

  useEffect(() => {
    let interval: any;
    if (mockSimulatorActive && location) {
      interval = setInterval(() => {
        const latDelta = (Math.random() - 0.5) * 0.0008;
        const lngDelta = (Math.random() - 0.5) * 0.0008;
        const newLoc = {
          ...location,
          latitude: location.latitude + latDelta,
          longitude: location.longitude + lngDelta,
          updated_at: new Date().toISOString(),
        };
        setLocation(newLoc);

        if (audioBeep) {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          osc.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.05);
        }
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [mockSimulatorActive, location, audioBeep, setLocation]);

  const shareUrl = window.location.href;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loadingShare) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center space-y-4 font-mono">
        <Radio className="w-10 h-10 text-cyber-teal animate-spin" />
        <p className="text-sm text-cyber-teal animate-pulse">ESTABLISHING ENCRYPTED TELEMETRY LINK...</p>
      </div>
    );
  }

  if (!shareNode) {
    return (
      <div className="p-8 max-w-md mx-auto text-center bg-cyber-glass-panel border border-cyber-red/50 rounded-xl space-y-4 font-mono my-12">
        <AlertTriangle className="w-12 h-12 text-cyber-red mx-auto" />
        <h2 className="text-xl font-bold text-white">404 - SHARE NODE NOT FOUND OR EXPIRED</h2>
        <p className="text-xs text-gray-400">The requested UUID telemetry stream does not exist or has self-destructed.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-cyber-teal/20 border border-cyber-teal text-cyber-teal rounded text-xs"
        >
          RETURN TO COMMAND CENTER
        </button>
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div className="p-8 max-w-md mx-auto bg-cyber-glass-panel border border-cyber-teal/60 rounded-xl space-y-6 font-mono my-12 shadow-neon-teal">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-full bg-cyber-teal/10 border border-cyber-teal flex items-center justify-center text-cyber-teal">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">PASSCODE PROTECTED TELEMETRY NODE</h2>
          <p className="text-xs text-gray-400">This location share link requires security verification to view.</p>
        </div>

        {passcodeError && (
          <div className="p-3 bg-cyber-red/20 border border-cyber-red/50 text-cyber-red text-xs rounded text-center">
            [ACCESS DENIED] INVALID SECURITY PASSCODE
          </div>
        )}

        <form onSubmit={handlePasscodeSubmit} className="space-y-4">
          <input
            type="password"
            value={passcodeAttempt}
            onChange={(e) => setPasscodeAttempt(e.target.value)}
            placeholder="Enter security passcode..."
            className="w-full bg-black/60 border border-cyber-border rounded px-4 py-3 text-cyber-teal text-center text-sm font-bold focus:outline-none focus:border-cyber-teal"
            autoFocus
            required
          />
          <button
            type="submit"
            className="w-full py-3 bg-cyber-teal text-black font-bold rounded shadow-neon-teal hover:bg-cyber-teal/90 text-xs"
          >
            UNLOCK TELEMETRY STREAM
          </button>
        </form>
      </div>
    );
  }

  const defaultLat = location?.latitude ?? 37.7749;
  const defaultLng = location?.longitude ?? -122.4194;

  return (
    <div className="space-y-4 font-mono py-2">
      <div className="bg-cyber-teal/10 border border-cyber-teal/40 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-cyber-teal">
          <Shield className="w-4 h-4 shrink-0" />
          <span className="font-bold">
            This location is shared by the owner with your permission.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAudioBeep(!audioBeep)}
            className="p-1.5 border border-cyber-border rounded text-gray-400 hover:text-cyber-teal"
            title="Toggle Audio Radar Beep"
          >
            {audioBeep ? <Volume2 className="w-4 h-4 text-cyber-teal" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={handleCopyLink}
            className="px-3 py-1 bg-black/60 border border-cyber-border hover:border-cyber-teal text-cyber-teal rounded flex items-center gap-1 text-[11px]"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-cyber-green" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'COPIED' : 'SHARE LINK'}
          </button>

          <button
            onClick={() => setShowQr(true)}
            className="px-3 py-1 bg-cyber-purple/10 border border-cyber-purple/40 text-cyber-purple hover:bg-cyber-purple/20 rounded flex items-center gap-1 text-[11px]"
          >
            <QrCode className="w-3.5 h-3.5" /> MATRIX QR
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-[480px] rounded-xl overflow-hidden relative border border-cyber-teal/40 shadow-neon-teal">
            <CyberMap
              latitude={defaultLat}
              longitude={defaultLng}
              accuracy={location?.accuracy ?? 20}
              updatedAt={location?.updated_at}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-5 bg-cyber-glass-panel border border-cyber-teal/40 rounded-xl space-y-4 shadow-neon-teal">
            <div className="flex items-center justify-between border-b border-cyber-border pb-2">
              <span className="font-bold text-white text-sm uppercase">{shareNode.title}</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-cyber-green/20 text-cyber-green border border-cyber-green/40 uppercase">
                {shareNode.mode}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 bg-black/40 rounded border border-cyber-border">
                <span className="text-gray-400">LATITUDE:</span>
                <span className="font-bold text-cyber-teal">{location ? location.latitude.toFixed(6) : 'SEARCHING...'}</span>
              </div>

              <div className="flex items-center justify-between p-2 bg-black/40 rounded border border-cyber-border">
                <span className="text-gray-400">LONGITUDE:</span>
                <span className="font-bold text-cyber-teal">{location ? location.longitude.toFixed(6) : 'SEARCHING...'}</span>
              </div>

              <div className="flex items-center justify-between p-2 bg-black/40 rounded border border-cyber-border">
                <span className="text-gray-400">ACCURACY:</span>
                <span className="font-bold text-cyber-green">{location ? `±${Math.round(location.accuracy)} m` : 'N/A'}</span>
              </div>

              <div className="flex items-center justify-between p-2 bg-black/40 rounded border border-cyber-border">
                <span className="text-gray-400">LAST SYNC:</span>
                <span className="text-gray-200">
                  {location ? new Date(location.updated_at).toLocaleTimeString() : 'AWAITING PING'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2">
              <div className="p-2.5 bg-black/50 border border-cyber-border rounded flex items-center gap-2">
                {isOnline ? <Wifi className="w-4 h-4 text-cyber-green" /> : <WifiOff className="w-4 h-4 text-cyber-red" />}
                <div>
                  <div className="text-[10px] text-gray-400">SIGNAL</div>
                  <div className="font-bold text-white text-[11px]">{isOnline ? 'ONLINE' : 'OFFLINE'}</div>
                </div>
              </div>

              <div className="p-2.5 bg-black/50 border border-cyber-border rounded flex items-center gap-2">
                {battery?.charging ? (
                  <BatteryCharging className="w-4 h-4 text-cyber-teal animate-pulse" />
                ) : (
                  <Battery className="w-4 h-4 text-cyber-yellow" />
                )}
                <div>
                  <div className="text-[10px] text-gray-400">BATTERY</div>
                  <div className="font-bold text-white text-[11px]">
                    {battery ? `${battery.level}%` : 'UNKNOWN'}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-cyber-border space-y-2">
              {!isTracking ? (
                <button
                  onClick={startTracking}
                  className="w-full py-2.5 bg-cyber-green/20 border border-cyber-green text-cyber-green font-bold rounded shadow-neon-green hover:bg-cyber-green/30 text-xs flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" /> BROADCAST MY GPS LOCATION
                </button>
              ) : (
                <button
                  onClick={stopTracking}
                  className="w-full py-2.5 bg-cyber-red/20 border border-cyber-red text-cyber-red font-bold rounded hover:bg-cyber-red/30 text-xs flex items-center justify-center gap-2"
                >
                  <Square className="w-4 h-4 fill-current" /> STOP BROADCASTING
                </button>
              )}

              <button
                onClick={() => setMockSimulatorActive(!mockSimulatorActive)}
                className={`w-full py-2 border rounded text-xs transition-all flex items-center justify-center gap-2 ${
                  mockSimulatorActive
                    ? 'bg-cyber-purple/20 border-cyber-purple text-cyber-purple font-bold'
                    : 'bg-black/40 border-cyber-border text-gray-400'
                }`}
              >
                {mockSimulatorActive ? '⚡ GPS MOTION SIMULATOR ACTIVE' : 'TEST MOTION SIMULATOR'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showQr && (
        <QRCodeModal
          url={shareUrl}
          title={shareNode.title}
          isOpen={true}
          onClose={() => setShowQr(false)}
        />
      )}
    </div>
  );
};
