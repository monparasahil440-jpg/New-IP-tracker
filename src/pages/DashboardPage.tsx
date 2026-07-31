import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured, getLocalShares, saveLocalShares } from '../lib/supabase';
import type { ShareItem } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { QRCodeModal } from '../components/QRCodeModal';
import { Radio, Copy, QrCode, Trash2, ExternalLink, ShieldAlert, Clock, Check, RefreshCw, Plus } from 'lucide-react';

interface DashboardPageProps {
  onOpenCreate: () => void;
  onOpenShareView: (uuid: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onOpenCreate, onOpenShareView }) => {
  const { user } = useAuth();
  const [shares, setShares] = useState<ShareItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedQrUrl, setSelectedQrUrl] = useState<{ url: string; title: string } | null>(null);

  const fetchShares = async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        let query = supabase.from('shares').select('*').order('created_at', { ascending: false });
        if (user) {
          query = query.eq('user_id', user.id);
        }
        const { data, error } = await query;
        if (!error && data) {
          setShares(data as ShareItem[]);
        } else {
          setShares(getLocalShares());
        }
      } else {
        setShares(getLocalShares());
      }
    } catch (e) {
      setShares(getLocalShares());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShares();
  }, [user]);

  const handleDelete = async (share: ShareItem) => {
    if (!confirm(`Confirm deletion of location share node: "${share.title}"?`)) return;

    if (isSupabaseConfigured) {
      await supabase.from('shares').delete().eq('id', share.id);
    }
    const updated = shares.filter((s) => s.id !== share.id);
    setShares(updated);
    saveLocalShares(updated);
  };

  const buildShareUrl = (uuid: string) => {
    const origin = window.location.origin + window.location.pathname;
    return `${origin}#/share/${uuid}`;
  };

  const handleCopyLink = (uuid: string, id: string) => {
    const url = buildShareUrl(uuid);
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const isExpired = (expiresAt?: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt).getTime() < Date.now();
  };

  const activeShares = shares.filter((s) => s.active && !isExpired(s.expires_at));
  const expiredShares = shares.filter((s) => !s.active || isExpired(s.expires_at));

  return (
    <div className="space-y-8 py-4 font-mono">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyber-teal/30 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Radio className="w-6 h-6 text-cyber-teal animate-pulse" />
            LOCATION NODES DASHBOARD
          </h1>
          <p className="text-xs text-gray-400">Manage active GPS broadcast links, copy matrix keys, or purge expired shares.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchShares}
            className="p-2 bg-black/60 border border-cyber-border hover:border-cyber-teal text-cyber-teal rounded"
            title="Refresh Nodes"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenCreate}
            className="px-4 py-2 bg-cyber-teal text-black font-bold rounded shadow-neon-teal hover:bg-cyber-teal/90 transition-all text-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> LAUNCH SHARE NODE
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-cyber-glass-panel border border-cyber-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-cyber-teal text-sm font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-cyber-green animate-ping" />
              <span>ACTIVE BROADCAST NODES ({activeShares.length})</span>
            </div>

            {activeShares.length === 0 ? (
              <div className="p-8 text-center bg-cyber-glass-panel border border-cyber-border rounded-xl space-y-3">
                <p className="text-xs text-gray-400">NO ACTIVE LOCATION SHARE NODES FOUND.</p>
                <button
                  onClick={onOpenCreate}
                  className="px-4 py-2 text-xs bg-cyber-teal/10 border border-cyber-teal text-cyber-teal hover:bg-cyber-teal/20 rounded"
                >
                  Create Your First Location Link
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeShares.map((share) => {
                  const shareUrl = buildShareUrl(share.uuid);
                  return (
                    <div
                      key={share.id}
                      className="p-5 bg-cyber-glass-panel border border-cyber-teal/40 rounded-xl space-y-4 hover:border-cyber-teal shadow-neon-teal transition-all relative"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-white text-base">{share.title}</h3>
                          <div className="text-[11px] text-cyber-teal flex items-center gap-2 mt-0.5">
                            <span>UUID: {share.uuid.slice(0, 18)}...</span>
                            {share.password_hash && <span className="text-cyber-green">[PASSCODE PROTECTED]</span>}
                          </div>
                        </div>
                        <span className="px-2 py-0.5 text-[10px] rounded bg-cyber-green/20 text-cyber-green border border-cyber-green/40 uppercase">
                          {share.mode}
                        </span>
                      </div>

                      <div className="text-[11px] text-gray-400 space-y-1">
                        <div>Created: {new Date(share.created_at).toLocaleString()}</div>
                        {share.expires_at && (
                          <div className="text-cyber-yellow flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Expiring: {new Date(share.expires_at).toLocaleString()}
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-cyber-border flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopyLink(share.uuid, share.id)}
                            className="p-2 bg-cyber-teal/10 border border-cyber-teal/40 text-cyber-teal hover:bg-cyber-teal/20 rounded flex items-center gap-1"
                            title="Copy Link"
                          >
                            {copiedId === share.id ? <Check className="w-4 h-4 text-cyber-green" /> : <Copy className="w-4 h-4" />}
                          </button>

                          <button
                            onClick={() => setSelectedQrUrl({ url: shareUrl, title: share.title })}
                            className="p-2 bg-cyber-purple/10 border border-cyber-purple/40 text-cyber-purple hover:bg-cyber-purple/20 rounded"
                            title="Generate QR Code"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onOpenShareView(share.uuid)}
                            className="p-2 bg-cyber-green/10 border border-cyber-green/40 text-cyber-green hover:bg-cyber-green/20 rounded flex items-center gap-1"
                            title="Open Map Viewer"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>

                        <button
                          onClick={() => handleDelete(share)}
                          className="p-2 text-cyber-red hover:bg-cyber-red/20 border border-cyber-red/30 rounded"
                          title="Delete Node"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {expiredShares.length > 0 && (
            <section className="space-y-4 pt-4 border-t border-cyber-border">
              <div className="flex items-center gap-2 text-cyber-red text-sm font-bold">
                <ShieldAlert className="w-4 h-4 text-cyber-red" />
                <span>EXPIRED / TERMINATED NODES ({expiredShares.length})</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-60">
                {expiredShares.map((share) => (
                  <div key={share.id} className="p-4 bg-black/40 border border-cyber-red/30 rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="font-bold text-gray-300">{share.title}</span>
                      <span className="text-[10px] text-cyber-red">EXPIRED</span>
                    </div>
                    <div className="text-[10px] text-gray-500">UUID: {share.uuid}</div>
                    <button
                      onClick={() => handleDelete(share)}
                      className="text-[10px] text-cyber-red hover:underline"
                    >
                      [PURGE LOG]
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {selectedQrUrl && (
        <QRCodeModal
          url={selectedQrUrl.url}
          title={selectedQrUrl.title}
          isOpen={true}
          onClose={() => setSelectedQrUrl(null)}
        />
      )}
    </div>
  );
};
