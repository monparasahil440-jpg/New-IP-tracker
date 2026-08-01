import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured, getLocalShares, saveLocalShares, type LocationItem, type TrackingLink, type TrackingLog } from '../lib/supabase';
import type { ShareItem } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { QRCodeModal } from '../components/QRCodeModal';
import { CyberMap } from '../components/CyberMap';
import { Radio, Copy, QrCode, Trash2, ExternalLink, ShieldAlert, Clock, Check, RefreshCw, Plus, MapPin, Wifi, WifiOff, Battery, BatteryCharging, Monitor, Smartphone, Tablet, ArrowLeft, Eye } from 'lucide-react';

interface DashboardPageProps {
  trackingCode?: string | null;
  onOpenCreate: () => void;
  onOpenShareView: (uuid: string) => void;
  onOpenTrackingDashboard?: (trackingCode: string) => void;
  onBackToMainDashboard?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ trackingCode, onOpenCreate, onOpenShareView, onOpenTrackingDashboard, onBackToMainDashboard }) => {
  const { user } = useAuth();
  const [shares, setShares] = useState<ShareItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedQrUrl, setSelectedQrUrl] = useState<{ url: string; title: string } | null>(null);
  const [shareLocations, setShareLocations] = useState<Record<string, LocationItem>>({});
  
  // Tracking link dashboard state
  const [trackingLink, setTrackingLink] = useState<TrackingLink | null>(null);
  const [trackingLogs, setTrackingLogs] = useState<TrackingLog[]>([]);
  const [loadingTracking, setLoadingTracking] = useState(true);
  
  // Main dashboard tracking links state
  const [trackingLinks, setTrackingLinks] = useState<TrackingLink[]>([]);
  const [loadingTrackingLinks, setLoadingTrackingLinks] = useState(true);
  const [trackingLinkStats, setTrackingLinkStats] = useState<Record<string, number>>({});

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

  // Fetch tracking link and logs when trackingCode is provided
  const fetchTrackingData = async () => {
    if (!trackingCode) return;
    
    setLoadingTracking(true);
    try {
      if (isSupabaseConfigured) {
        // Fetch tracking link
        const { data: linkData, error: linkError } = await supabase
          .from('tracking_links')
          .select('*')
          .eq('tracking_code', trackingCode)
          .single();

        if (linkError || !linkData) {
          console.error('Tracking link not found:', linkError);
          setLoadingTracking(false);
          return;
        }

        setTrackingLink(linkData as TrackingLink);

        // Fetch tracking logs
        const { data: logsData, error: logsError } = await supabase
          .from('tracking_logs')
          .select('*')
          .eq('tracking_link_id', linkData.id)
          .order('visited_at', { ascending: false });

        if (!logsError && logsData) {
          setTrackingLogs(logsData as TrackingLog[]);
        }
      }
    } catch (e) {
      console.error('Error fetching tracking data:', e);
    } finally {
      setLoadingTracking(false);
    }
  };

  // Fetch all tracking links for main dashboard
  const fetchTrackingLinks = async () => {
    setLoadingTrackingLinks(true);
    try {
      if (isSupabaseConfigured) {
        let query = supabase.from('tracking_links').select('*').order('created_at', { ascending: false });
        if (user) {
          query = query.eq('creator_id', user.id);
        }
        const { data, error } = await query;
        if (!error && data) {
          const links = data as TrackingLink[];
          setTrackingLinks(links);

          // Fetch visit counts for each tracking link
          const stats: Record<string, number> = {};
          for (const link of links) {
            const { count } = await supabase
              .from('tracking_logs')
              .select('*', { count: 'exact', head: true })
              .eq('tracking_link_id', link.id);
            stats[link.id] = count || 0;
          }
          setTrackingLinkStats(stats);
        }
      }
    } catch (e) {
      console.error('Error fetching tracking links:', e);
    } finally {
      setLoadingTrackingLinks(false);
    }
  };

  useEffect(() => {
    fetchShares();
  }, [user]);

  useEffect(() => {
    fetchTrackingLinks();
  }, [user]);

  useEffect(() => {
    fetchTrackingData();
  }, [trackingCode]);

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

  const buildTrackingUrl = (code: string) => {
    const origin = window.location.origin + window.location.pathname.replace(/\/$/, '');
    return `${origin}/tracking.html?code=${code}`;
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

  // Get device icon based on device type
  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="w-4 h-4" />;
      case 'tablet':
        return <Tablet className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  // Fetch latest locations for all active shares
  useEffect(() => {
    if (!isSupabaseConfigured || activeShares.length === 0) return;

    const fetchLocations = async () => {
      const locationData: Record<string, LocationItem> = {};
      
      for (const share of activeShares) {
        const { data } = await supabase
          .from('locations')
          .select('*')
          .eq('share_id', share.id)
          .order('updated_at', { ascending: false })
          .limit(1);
        
        if (data && data.length > 0) {
          locationData[share.id] = data[0] as LocationItem;
        }
      }
      
      setShareLocations(locationData);
    };

    fetchLocations();

    // Subscribe to real-time location updates
    const channels = activeShares.map(share => {
      const channel = supabase
        .channel(`location-dashboard-${share.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'locations',
            filter: `share_id=eq.${share.id}`,
          },
          (payload) => {
            setShareLocations(prev => ({
              ...prev,
              [share.id]: payload.new as LocationItem
            }));
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'locations',
            filter: `share_id=eq.${share.id}`,
          },
          (payload) => {
            setShareLocations(prev => ({
              ...prev,
              [share.id]: payload.new as LocationItem
            }));
          }
        );
      
      // Subscribe after adding all event listeners
      channel.subscribe();
      return channel;
    });

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [activeShares, isSupabaseConfigured]);

  // If trackingCode is provided, show tracking link dashboard
  if (trackingCode) {
    if (loadingTracking) {
      return (
        <div className="space-y-8 py-4 font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyber-teal/30 pb-4">
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-2">
                <Radio className="w-6 h-6 text-cyber-teal animate-pulse" />
                TRACKING LINK DASHBOARD
              </h1>
              <p className="text-xs text-gray-400">View collected tracking data for this link.</p>
            </div>
          </div>
          <div className="h-64 bg-cyber-glass-panel border border-cyber-border rounded-xl animate-pulse" />
        </div>
      );
    }

    if (!trackingLink) {
      return (
        <div className="space-y-8 py-4 font-mono">
          <div className="p-8 max-w-md mx-auto text-center bg-cyber-glass-panel border border-cyber-red/50 rounded-xl space-y-4">
            <ShieldAlert className="w-12 h-12 text-cyber-red mx-auto" />
            <h2 className="text-xl font-bold text-white">Tracking Link Not Found</h2>
            <p className="text-xs text-gray-400">The tracking link does not exist or has been deleted.</p>
          </div>
        </div>
      );
    }

    const trackingUrl = buildTrackingUrl(trackingCode);
    const latestLog = trackingLogs[0];

    return (
      <div className="space-y-8 py-4 font-mono">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyber-teal/30 pb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (onBackToMainDashboard) {
                  onBackToMainDashboard();
                } else {
                  window.location.hash = '';
                }
              }}
              className="p-2 bg-black/60 border border-cyber-border hover:border-cyber-teal text-cyber-teal rounded"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-2">
                <Radio className="w-6 h-6 text-cyber-teal animate-pulse" />
                TRACKING LINK DASHBOARD
              </h1>
              <p className="text-xs text-gray-400">Code: {trackingCode}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchTrackingData}
              className="p-2 bg-black/60 border border-cyber-border hover:border-cyber-teal text-cyber-teal rounded"
              title="Refresh Logs"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tracking Link Info */}
        <div className="bg-cyber-glass-panel border border-cyber-teal/40 rounded-xl p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-white text-base">Tracking Link Details</h3>
              <div className="text-[11px] text-cyber-teal mt-0.5">
                Target: {trackingLink.target_url}
              </div>
            </div>
            <span className="px-2 py-0.5 text-[10px] rounded bg-cyber-green/20 text-cyber-green border border-cyber-green/40 uppercase">
              {trackingLink.status}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigator.clipboard.writeText(trackingUrl)}
              className="px-3 py-1.5 bg-black/60 border border-cyber-border hover:border-cyber-teal text-cyber-teal rounded text-xs flex items-center gap-1.5"
            >
              <Copy className="w-3 h-3" /> Copy Tracking Link
            </button>
            <button
              onClick={() => window.open(trackingLink.target_url, '_blank')}
              className="px-3 py-1.5 bg-black/60 border border-cyber-border hover:border-cyber-teal text-cyber-teal rounded text-xs flex items-center gap-1.5"
            >
              <ExternalLink className="w-3 h-3" /> Open Target URL
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-cyber-glass-panel border border-cyber-border rounded-xl p-4">
            <div className="text-[10px] text-gray-400 mb-1">TOTAL VISITS</div>
            <div className="text-2xl font-bold text-cyber-teal">{trackingLogs.length}</div>
          </div>
          <div className="bg-cyber-glass-panel border border-cyber-border rounded-xl p-4">
            <div className="text-[10px] text-gray-400 mb-1">LATEST VISIT</div>
            <div className="text-sm font-bold text-white">
              {latestLog ? new Date(latestLog.visited_at).toLocaleString() : 'N/A'}
            </div>
          </div>
        </div>

        {/* Latest Location Map */}
        {latestLog && latestLog.latitude && latestLog.longitude && (
          <div className="bg-cyber-glass-panel border border-cyber-teal/40 rounded-xl p-5 space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyber-teal" />
              Latest Location
            </h3>
            <div className="h-64 rounded-lg overflow-hidden">
              <CyberMap
                latitude={latestLog.latitude}
                longitude={latestLog.longitude}
                accuracy={latestLog.accuracy || 25}
                updatedAt={latestLog.visited_at}
              />
            </div>
          </div>
        )}

        {/* Latest Device Info */}
        {latestLog && (
          <div className="bg-cyber-glass-panel border border-cyber-teal/40 rounded-xl p-5 space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Monitor className="w-4 h-4 text-cyber-teal" />
              Latest Device Information
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-black/40 rounded p-2">
                <div className="text-gray-400 text-[10px]">Device</div>
                <div className="text-white flex items-center gap-1">
                  {getDeviceIcon(latestLog.device_type)}
                  {latestLog.device_type}
                </div>
              </div>
              <div className="bg-black/40 rounded p-2">
                <div className="text-gray-400 text-[10px]">Browser</div>
                <div className="text-white">{latestLog.browser} {latestLog.browser_version}</div>
              </div>
              <div className="bg-black/40 rounded p-2">
                <div className="text-gray-400 text-[10px]">OS</div>
                <div className="text-white">{latestLog.os}</div>
              </div>
              <div className="bg-black/40 rounded p-2">
                <div className="text-gray-400 text-[10px]">Screen</div>
                <div className="text-white">{latestLog.screen_resolution}</div>
              </div>
              <div className="bg-black/40 rounded p-2">
                <div className="text-gray-400 text-[10px]">Battery</div>
                <div className="text-white flex items-center gap-1">
                  {latestLog.charging ? <BatteryCharging className="w-3 h-3 text-cyber-green" /> : <Battery className="w-3 h-3" />}
                  {latestLog.battery_level !== null ? `${latestLog.battery_level}%` : 'N/A'}
                </div>
              </div>
              <div className="bg-black/40 rounded p-2">
                <div className="text-gray-400 text-[10px]">Language</div>
                <div className="text-white">{latestLog.language}</div>
              </div>
              <div className="bg-black/40 rounded p-2">
                <div className="text-gray-400 text-[10px]">Timezone</div>
                <div className="text-white">{latestLog.timezone}</div>
              </div>
              <div className="bg-black/40 rounded p-2">
                <div className="text-gray-400 text-[10px]">IP Address</div>
                <div className="text-white">{latestLog.ip_address || 'N/A'}</div>
              </div>
              <div className="bg-black/40 rounded p-2">
                <div className="text-gray-400 text-[10px]">Location</div>
                <div className="text-white">
                  {latestLog.city && latestLog.country ? `${latestLog.city}, ${latestLog.country}` : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tracking Logs History */}
        <div className="bg-cyber-glass-panel border border-cyber-teal/40 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyber-teal" />
              Tracking History ({trackingLogs.length})
            </h3>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-400">Latest:</span>
              <span className="text-cyber-teal">
                {latestLog ? new Date(latestLog.visited_at).toLocaleString() : 'N/A'}
              </span>
            </div>
          </div>
          {trackingLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs">
              No tracking data collected yet. Share the tracking link to start collecting data.
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {trackingLogs.map((log, index) => (
                <div 
                  key={log.id} 
                  className={`bg-black/40 rounded-lg p-3 border transition-all ${
                    index === 0 
                      ? 'border-cyber-green/50 shadow-neon-teal' 
                      : 'border-cyber-border hover:border-cyber-teal/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-cyber-teal flex items-center gap-1">
                          {getDeviceIcon(log.device_type)}
                          {log.device_type}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="text-white">{log.browser}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-white">{log.os}</span>
                        {index === 0 && (
                          <span className="px-1.5 py-0.5 bg-cyber-green/20 text-cyber-green text-[10px] rounded border border-cyber-green/40">
                            LATEST
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {new Date(log.visited_at).toLocaleString()}
                      </div>
                      {log.latitude && log.longitude && (
                        <div className="text-[10px] text-cyber-teal">
                          📍 {log.latitude.toFixed(4)}, {log.longitude.toFixed(4)}
                        </div>
                      )}
                      {log.ip_address && (
                        <div className="text-[10px] text-gray-400">
                          IP: {log.ip_address} {log.city && `• ${log.city}, ${log.country}`}
                        </div>
                      )}
                    </div>
                    {log.battery_level !== null && (
                      <div className="text-xs text-white flex items-center gap-1">
                        {log.charging ? <BatteryCharging className="w-3 h-3 text-cyber-green" /> : <Battery className="w-3 h-3" />}
                        {log.battery_level}%
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

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

                      {/* Live Location Display */}
                      {shareLocations[share.id] && (
                        <div className="p-3 bg-black/60 border border-cyber-green/30 rounded-lg space-y-2">
                          <div className="flex items-center gap-2 text-cyber-green text-xs font-bold">
                            <MapPin className="w-3.5 h-3.5 animate-pulse" />
                            <span>LIVE LOCATION ACTIVE</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div className="bg-black/40 p-2 rounded">
                              <div className="text-gray-400">LATITUDE</div>
                              <div className="text-cyber-teal font-bold">
                                {shareLocations[share.id].latitude.toFixed(6)}
                              </div>
                            </div>
                            <div className="bg-black/40 p-2 rounded">
                              <div className="text-gray-400">LONGITUDE</div>
                              <div className="text-cyber-teal font-bold">
                                {shareLocations[share.id].longitude.toFixed(6)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-gray-300">
                            <div className="flex items-center gap-1">
                              <Wifi className="w-3 h-3 text-cyber-green" />
                              <span>Updated: {new Date(shareLocations[share.id].updated_at).toLocaleTimeString()}</span>
                            </div>
                            {shareLocations[share.id].battery_level && (
                              <div className="flex items-center gap-1">
                                <Battery className="w-3 h-3 text-cyber-yellow" />
                                <span>{shareLocations[share.id].battery_level}%</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {!shareLocations[share.id] && (
                        <div className="p-3 bg-black/40 border border-cyber-border/30 rounded-lg text-center">
                          <div className="text-[10px] text-gray-500 flex items-center justify-center gap-2">
                            <WifiOff className="w-3 h-3" />
                            <span>WAITING FOR LOCATION SIGNAL...</span>
                          </div>
                        </div>
                      )}

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

          {/* Tracking Links Section */}
          {isSupabaseConfigured && (
            <section className="space-y-4 pt-4 border-t border-cyber-border">
              <div className="flex items-center gap-2 text-cyber-purple text-sm font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-cyber-purple animate-pulse" />
                <span>TRACKING LINKS ({trackingLinks.length})</span>
              </div>

              {loadingTrackingLinks ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-24 bg-cyber-glass-panel border border-cyber-border rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : trackingLinks.length === 0 ? (
                <div className="p-8 text-center bg-cyber-glass-panel border border-cyber-border rounded-xl space-y-3">
                  <p className="text-xs text-gray-400">NO TRACKING LINKS FOUND.</p>
                  <p className="text-[10px] text-gray-500">Create a tracking link to silently collect device information and redirect visitors.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {trackingLinks.map((link) => {
                    const trackingUrl = buildTrackingUrl(link.tracking_code);
                    const visitCount = trackingLinkStats[link.id] || 0;
                    
                    return (
                      <div
                        key={link.id}
                        className="p-4 bg-cyber-glass-panel border border-cyber-purple/30 rounded-xl hover:border-cyber-purple transition-all cursor-pointer group"
                        onClick={() => onOpenTrackingDashboard?.(link.tracking_code)}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-white text-sm truncate">
                                  {link.target_url}
                                </h3>
                                <span className="px-2 py-0.5 text-[10px] rounded bg-cyber-purple/20 text-cyber-purple border border-cyber-purple/40 uppercase whitespace-nowrap">
                                  {link.status}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-[11px] text-gray-400">
                              <span className="flex items-center gap-1">
                                <Radio className="w-3 h-3 text-cyber-purple" />
                                {link.tracking_code.slice(0, 12)}...
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(link.created_at).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1 text-cyber-green">
                                <MapPin className="w-3 h-3" />
                                {visitCount} visit{visitCount !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(trackingUrl);
                              }}
                              className="p-2 bg-cyber-purple/10 border border-cyber-purple/40 text-cyber-purple hover:bg-cyber-purple/20 rounded flex items-center gap-1"
                              title="Copy Tracking Link"
                            >
                              <Copy className="w-4 h-4" />
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenTrackingDashboard?.(link.tracking_code);
                              }}
                              className="p-2 bg-cyber-green/10 border border-cyber-green/40 text-cyber-green hover:bg-cyber-green/20 rounded flex items-center gap-1"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Delete tracking link: ${link.tracking_code.slice(0, 18)}...?`)) {
                                  supabase.from('tracking_links').delete().eq('id', link.id);
                                  setTrackingLinks(prev => prev.filter(l => l.id !== link.id));
                                }
                              }}
                              className="p-2 text-cyber-red hover:bg-cyber-red/20 border border-cyber-red/30 rounded"
                              title="Delete Link"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

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
