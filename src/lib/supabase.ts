import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zdnpadhlblyazzzwserr.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_zo1mrKN61gpDnlZNBnxzKg_BFLQed-E';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export interface ShareItem {
  id: string;
  user_id?: string;
  uuid: string;
  title: string;
  target_url?: string | null; // Optional target website to proxy/redirect
  mode: 'once' | 'continuous';
  active: boolean;
  created_at: string;
  expires_at?: string | null;
  password_hash?: string | null;
  passcode_hint?: string | null;
}

export interface LocationItem {
  id: string;
  share_id: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  heading?: number | null;
  speed?: number | null;
  battery_level?: number | null;
  is_charging?: boolean | null;
  updated_at: string;
}

const LOCAL_STORAGE_SHARES_KEY = 'location_share_nodes_v1';
const LOCAL_STORAGE_LOCS_KEY = 'location_share_telemetry_v1';

export const getLocalShares = (): ShareItem[] => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_SHARES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveLocalShares = (shares: ShareItem[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_SHARES_KEY, JSON.stringify(shares));
  } catch (e) {
    console.error('Failed to save to local storage', e);
  }
};

export const getLocalLocations = (shareId: string): LocationItem[] => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_LOCS_KEY);
    const locs: LocationItem[] = data ? JSON.parse(data) : [];
    return locs.filter(l => l.share_id === shareId);
  } catch {
    return [];
  }
};

export const saveLocalLocation = (loc: LocationItem) => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_LOCS_KEY);
    const locs: LocationItem[] = data ? JSON.parse(data) : [];
    const updated = [loc, ...locs.filter(l => l.share_id !== loc.share_id)];
    localStorage.setItem(LOCAL_STORAGE_LOCS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save local location', e);
  }
};
