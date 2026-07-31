import React, { useState } from 'react';
import { Terminal, Mail, Key, UserCheck, AlertTriangle, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import confetti from 'canvas-confetti';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register' | 'forgot';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const { loginMockUser } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSupabaseConfigured) {
        if (mode === 'login') {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          confetti({ particleCount: 40, spread: 60 });
          onClose();
        } else if (mode === 'register') {
          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { name } },
          });
          if (error) throw error;
          setMessage('VERIFICATION EMAIL SENT. CHECK YOUR INBOX TO CONFIRM NODE.');
        } else if (mode === 'forgot') {
          const { error } = await supabase.auth.resetPasswordForEmail(email);
          if (error) throw error;
          setMessage('PASSWORD RESET LINK DISPATCHED TO REGISTERED EMAIL.');
        }
      } else {
        loginMockUser(email || 'cyber.operator@node.net', name || 'Operator-7');
        confetti({ particleCount: 40, spread: 60 });
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'AUTHENTICATION PROTOCOL FAILURE');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = () => {
    loginMockUser('tactical.guest@cyber-hub.io', 'Tactical Guest');
    confetti({ particleCount: 50, spread: 70 });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-mono">
      <div className="relative w-full max-w-md bg-cyber-bg border border-cyber-teal/60 rounded-xl p-6 shadow-neon-teal">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyber-teal/30 pb-3 mb-5">
          <div className="flex items-center gap-2 text-cyber-teal font-bold text-sm">
            <Terminal className="w-5 h-5 text-cyber-teal" />
            <span>
              {mode === 'login' && 'OPERATOR AUTHENTICATION'}
              {mode === 'register' && 'REGISTER NEW OPERATOR'}
              {mode === 'forgot' && 'CREDENTIAL RECOVERY'}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-cyber-teal">✕</button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-cyber-red/20 border border-cyber-red/50 rounded text-cyber-red text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 bg-cyber-green/20 border border-cyber-green/50 rounded text-cyber-green text-xs flex items-center gap-2">
            <UserCheck className="w-4 h-4 shrink-0" /> {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {mode === 'register' && (
            <div>
              <label className="block text-gray-300 mb-1">OPERATOR NAME</label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Agent Specter"
                  className="w-full bg-black/60 border border-cyber-border rounded px-3 py-2 pl-9 text-cyber-teal focus:outline-none focus:border-cyber-teal"
                  required
                />
                <Shield className="w-4 h-4 text-gray-500 absolute left-2.5 top-2.5" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-gray-300 mb-1">COMMUNICATION EMAIL</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@location-share.io"
                className="w-full bg-black/60 border border-cyber-border rounded px-3 py-2 pl-9 text-cyber-teal focus:outline-none focus:border-cyber-teal"
                required
              />
              <Mail className="w-4 h-4 text-gray-500 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <label className="block text-gray-300 mb-1">SECURITY PASSCODE</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-black/60 border border-cyber-border rounded px-3 py-2 pl-9 text-cyber-teal focus:outline-none focus:border-cyber-teal"
                  required
                />
                <Key className="w-4 h-4 text-gray-500 absolute left-2.5 top-2.5" />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-cyber-teal/20 border border-cyber-teal hover:bg-cyber-teal/30 text-cyber-teal font-bold rounded shadow-neon-teal transition-all uppercase"
          >
            {loading ? 'AUTHENTICATING...' : mode === 'login' ? 'ACCESS DASHBOARD' : mode === 'register' ? 'CREATE PROFILE' : 'SEND RECOVERY LINK'}
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-cyber-border flex flex-col items-center gap-2 text-xs">
          <button
            type="button"
            onClick={handleDemoAccess}
            className="w-full py-2 bg-cyber-green/10 border border-cyber-green/40 hover:bg-cyber-green/20 text-cyber-green font-bold rounded text-center transition-all"
          >
            ⚡ INSTANT MOCK ACCESS (DEMO)
          </button>

          <div className="flex gap-4 text-[11px] text-gray-400 mt-2">
            {mode === 'login' ? (
              <>
                <button onClick={() => setMode('register')} className="hover:text-cyber-teal">New Operator? Sign Up</button>
                <span>•</span>
                <button onClick={() => setMode('forgot')} className="hover:text-cyber-teal">Forgot Passcode?</button>
              </>
            ) : (
              <button onClick={() => setMode('login')} className="hover:text-cyber-teal">Return to Login</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
