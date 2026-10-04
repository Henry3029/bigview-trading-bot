import React, { useState } from 'react';
import { X, Key, Server, Lock, Shield, Loader2, AlertCircle } from 'lucide-react';

interface ConnectWeexModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (weexData: { balance: number }) => void;
  apiBaseUrl?: string;
}

export default function ConnectWeexModal({
  isOpen,
  onClose,
  onSuccess,
  apiBaseUrl =process.env.NEXT_PUBLIC_API_URL
}: ConnectWeexModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConnectApiKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('You must be logged in to connect exchange keys.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${apiBaseUrl}/api/auth/weex-keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`, // Pass the JWT token!
        },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          apiSecret: apiSecret.trim(),
          passphrase: passphrase.trim(),
        }),
      });

      // 1. Check if the response content is actually JSON before parsing
const contentType = res.headers.get('content-type');
if (!contentType || !contentType.includes('application/json')) {
  throw new Error(`Server returned non-JSON response (${res.status} ${res.statusText}). Check if backend process is running on AWS.`);
}

const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to connect exchange API keys.');

      onSuccess(data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Connection failed. Please check your exchange keys.');
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
    <div className="relative w-full max-w-md bg-[var(--background)] text-foreground border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl p-6 sm:p-8">
      <button 
        onClick={onClose} 
        disabled={loading} 
        className="absolute top-4 right-4 text-foreground/60 hover:text-foreground transition-colors cursor-pointer"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 mb-3">
          <Key className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold tracking-wide">Connect WEEX Exchange</h3>
        <p className="text-xs text-foreground/60 mt-1">
          Provide your API keys so the automated trading bot can execute trades on your account.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-400 text-xs p-3 rounded-xl mb-4">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleConnectApiKeys} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-foreground/80 mb-1">WEEX API Key</label>
          <div className="relative">
            <Server className="w-4 h-4 absolute left-3 top-3 text-foreground/40" />
            <input
              type="text"
              required
              placeholder="wx_live_..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full border border-black/10 dark:border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-foreground font-mono focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground/80 mb-1">WEEX Secret Key</label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3 top-3 text-foreground/40" />
            <input
              type="password"
              required
              placeholder="••••••••••••••••••••"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              className="w-full border border-black/10 dark:border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-foreground font-mono focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground/80 mb-1">Passphrase (Optional)</label>
          <div className="relative">
            <Shield className="w-4 h-4 absolute left-3 top-3 text-foreground/40" />
            <input
              type="password"
              placeholder="Optional passphrase"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              className="w-full border border-black/10 dark:border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-foreground font-mono focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Link Exchange Keys</span>}
        </button>
      </form>
    </div>
  </div>
);
}