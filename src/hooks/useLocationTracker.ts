import { useEffect, useState, useRef } from 'react';
import { supabase, isSupabaseConfigured, saveLocalLocation, getLocalLocations } from '../lib/supabase';
import type { LocationItem } from '../lib/supabase';

export interface BatteryStatus {
  level: number;
  charging: boolean;
}

export function useLocationTracker(shareId: string | null, _isOwner: boolean = false, isContinuous: boolean = true) {
  const [location, setLocation] = useState<LocationItem | null>(null);
  const [history, setHistory] = useState<LocationItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [battery, setBattery] = useState<BatteryStatus | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const watchIdRef = useRef<number | null>(null);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Monitor device battery if API available
  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((bat: any) => {
        const updateBattery = () => {
          setBattery({
            level: Math.round(bat.level * 100),
            charging: bat.charging,
          });
        };
        updateBattery();
        bat.addEventListener('levelchange', updateBattery);
        bat.addEventListener('chargingchange', updateBattery);
      });
    }
  }, []);

  // Subscribe to Realtime location updates
  useEffect(() => {
    if (!shareId) return;

    const fetchLatestLocation = async () => {
      if (isSupabaseConfigured) {
        const { data } = await supabase
          .from('locations')
          .select('*')
          .eq('share_id', shareId)
          .order('updated_at', { ascending: false })
          .limit(10);

        if (data && data.length > 0) {
          setLocation(data[0]);
          setHistory(data);
        }
      } else {
        const local = getLocalLocations(shareId);
        if (local.length > 0) {
          setLocation(local[0]);
          setHistory(local);
        }
      }
    };

    fetchLatestLocation();

    let channel: any;
    if (isSupabaseConfigured) {
      channel = supabase
        .channel(`location-stream-${shareId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'locations',
            filter: `share_id=eq.${shareId}`,
          },
          (payload) => {
            const newLoc = payload.new as LocationItem;
            setLocation(newLoc);
            setHistory((prev) => [newLoc, ...prev.slice(0, 19)]);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'locations',
            filter: `share_id=eq.${shareId}`,
          },
          (payload) => {
            const updatedLoc = payload.new as LocationItem;
            setLocation(updatedLoc);
          }
        )
        .subscribe();
    } else {
      const interval = setInterval(() => {
        const local = getLocalLocations(shareId);
        if (local.length > 0 && local[0].updated_at !== location?.updated_at) {
          setLocation(local[0]);
          setHistory(local);
        }
      }, 3000);
      return () => clearInterval(interval);
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [shareId]);

  const startTracking = async () => {
    if (!shareId) return;
    if (!navigator.geolocation) {
      setError('GPS Telemetry module not supported by browser.');
      return;
    }

    setIsTracking(true);
    setError(null);

    const handleSuccess = async (pos: GeolocationPosition) => {
      const locData: Omit<LocationItem, 'id'> = {
        share_id: shareId,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        heading: pos.coords.heading,
        speed: pos.coords.speed,
        battery_level: battery?.level ?? null,
        is_charging: battery?.charging ?? null,
        updated_at: new Date().toISOString(),
      };

      if (isSupabaseConfigured) {
        await supabase.from('locations').insert([locData]);
      } else {
        const fakeId = 'loc-' + Date.now();
        const fullLoc: LocationItem = { id: fakeId, ...locData };
        saveLocalLocation(fullLoc);
        setLocation(fullLoc);
        setHistory((prev) => [fullLoc, ...prev]);
      }
    };

    const handleError = (err: GeolocationPositionError) => {
      setError(`GPS Error (${err.code}): ${err.message}`);
      setIsTracking(false);
    };

    if (isContinuous) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        handleSuccess,
        handleError,
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    } else {
      navigator.geolocation.getCurrentPosition(
        handleSuccess,
        handleError,
        { enableHighAccuracy: true }
      );
    }
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  };

  return {
    location,
    history,
    error,
    isTracking,
    isOnline,
    battery,
    startTracking,
    stopTracking,
    setLocation,
  };
}
