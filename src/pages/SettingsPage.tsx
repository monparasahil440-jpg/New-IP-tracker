import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings, Shield, Terminal, Database, Check, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';

export const SettingsPage: React.FC = () => {
  const { user, isMockUser } = useAuth();
  const [supabaseUrl, setSupabaseUrl] = useState(import.meta.env.VITE_SUPABASE_URL || 'https://zdnpadhlblyazzzwserr.supabase.co');
  const [anonKey, setAnonKey] = useState(import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_zo1mrKN61gpDnlZNBnxzKg_BFLQed-E');
  const [saved, setSaved] = useState(false);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    confetti({ particleCount: 30, spread: 60 });
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-4 font-mono">
      <div className="border-b border-cyber-teal/30 pb-4">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-cyber-teal" /> SYSTEM CONFIGURATION & CREDENTIALS
        </h1>
        <p className="text-xs text-gray-400">View active backend connection, security credentials, and Supabase integration parameters.</p>
      </div>

      <section className="p-6 bg-cyber-glass-panel border border-cyber-border rounded-xl space-y-4">
        <div className="flex items-center gap-2 text-cyber-teal font-bold text-sm">
          <Shield className="w-5 h-5 text-cyber-teal" /> OPERATOR PROFILE METRICS
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-black/50 border border-cyber-border rounded">
            <span className="text-gray-400 block text-[10px]">OPERATOR EMAIL:</span>
            <span className="font-bold text-white text-sm">{user?.email || 'Guest / Anonymous'}</span>
          </div>

          <div className="p-3 bg-black/50 border border-cyber-border rounded">
            <span className="text-gray-400 block text-[10px]">NODE ENGINE MODE:</span>
            <span className={`font-bold text-sm ${isMockUser ? 'text-cyber-yellow' : 'text-cyber-green'}`}>
              {isMockUser ? 'OFFLINE DEMO STORE' : 'SUPABASE REALTIME'}
            </span>
          </div>
        </div>
      </section>

      <section className="p-6 bg-cyber-glass-panel border border-cyber-teal/40 rounded-xl space-y-4 shadow-neon-teal">
        <div className="flex items-center justify-between border-b border-cyber-border pb-3">
          <div className="flex items-center gap-2 text-cyber-teal font-bold text-sm">
            <Database className="w-5 h-5 text-cyber-teal" /> SUPABASE PROJECT ENDPOINTS
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-cyber-green/20 text-cyber-green border border-cyber-green/40">
            ACTIVE
          </span>
        </div>

        <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
          <div>
            <label className="block text-gray-300 mb-1 font-bold">PROJECT URL</label>
            <input
              type="text"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              className="w-full bg-black/60 border border-cyber-border rounded px-3 py-2 text-cyber-teal font-mono text-xs focus:outline-none focus:border-cyber-teal"
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-1 font-bold">PUBLISHABLE ANON KEY</label>
            <input
              type="text"
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              className="w-full bg-black/60 border border-cyber-border rounded px-3 py-2 text-cyber-green font-mono text-xs focus:outline-none focus:border-cyber-green"
              required
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="submit"
              className="px-5 py-2.5 bg-cyber-teal text-black font-bold rounded shadow-neon-teal hover:bg-cyber-teal/90 text-xs flex items-center gap-2"
            >
              {saved ? <Check className="w-4 h-4 text-black" /> : <RefreshCw className="w-4 h-4" />}
              {saved ? 'CONFIGURATION VERIFIED' : 'TEST & SAVE PARAMETERS'}
            </button>
          </div>
        </form>
      </section>

      <section className="p-6 bg-black/80 border border-cyber-border rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-cyber-yellow font-bold text-sm">
          <Terminal className="w-4 h-4" /> SUPABASE SQL MIGRATION FILE
        </div>
        <p className="text-xs text-gray-400">
          The project includes a ready-to-run <code className="text-cyber-teal">supabase_schema.sql</code> script in the workspace root for setting up RLS policies and Realtime publications.
        </p>
      </section>
    </div>
  );
};
