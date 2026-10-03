'use client';

import React, { useState } from 'react';
import { useAuth } from "@/provider/AuthContext";
import { X, AlertCircle, Loader2, Lock, Mail, UserPlus } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiBaseUrl?: string;
}

export default function AuthModal({ 
  isOpen, 
  onClose, 
  apiBaseUrl = process.env.NEXT_PUBLIC_API_URL
}: AuthModalProps) {
  const { login } = useAuth();

  // UI & Form Mode States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Account Credentials States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  if (!isOpen) return null;

  // 1. Handle Registration
  const handleAccountRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${apiBaseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Server returned non-JSON response (${res.status} ${res.statusText}). Check if backend process is running.`);
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed.');
      }

      login(data.token, data.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Standard Email/Password Login
  const handleAccountLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Server returned non-JSON response (${res.status} ${res.statusText}). Check if backend process is running.`);
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials.');
      }

      login(data.token, data.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-[var(--background)] text-foreground border border-black/25 dark:border-white/10 rounded-2xl shadow-2xl p-6 sm:p-8 overflow-hidden">
        {/* Ambient Background Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close Modal Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 text-foreground/60 hover:text-foreground transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Dynamic Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-500 mb-3">
            {authMode === 'login' && <Lock className="w-6 h-6" />}
            {authMode === 'register' && <UserPlus className="w-6 h-6" />}
          </div>
          <h3 className="text-xl font-bold tracking-wide">
            {authMode === 'login' && 'Sign In to Account'}
            {authMode === 'register' && 'Create New Account'}
          </h3>
          <p className="text-xs text-foreground/60 mt-1">
            {authMode === 'login' && 'Log in using your registered platform credentials'}
            {authMode === 'register' && 'Register an email and password to manage your bot settings'}
          </p>
        </div>

        {/* 2-Tab Auth Switcher */}
        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl mb-6 border border-black/25 dark:border-white/10 text-[11px]">
          <button
            type="button"
            onClick={() => { setAuthMode('login'); setError(null); }}
            className={`py-2 rounded-lg font-semibold transition-all cursor-pointer ${
              authMode === 'login'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('register'); setError(null); }}
            className={`py-2 rounded-lg font-semibold transition-all cursor-pointer ${
              authMode === 'register'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            Register
          </button>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-400 text-xs p-3 rounded-xl mb-6">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* TAB 1: ACCOUNT LOGIN FORM */}
        {authMode === 'login' && (
          <form onSubmit={handleAccountLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-foreground/40" />
                <input
                  type="email"
                  required
                  placeholder="trader@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-black/25 dark:border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-foreground focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-foreground/40" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-black/25 dark:border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-foreground focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>
        )}

        {/* TAB 2: ACCOUNT REGISTER FORM */}
        {authMode === 'register' && (
          <form onSubmit={handleAccountRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-foreground/40" />
                <input
                  type="email"
                  required
                  placeholder="trader@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-black/25 dark:border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-foreground focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-foreground/40" />
                <input
                  type="password"
                  required
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-black/25 dark:border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-foreground focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-foreground/40" />
                <input
                  type="password"
                  required
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-black/25 dark:border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-foreground focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Create Account</span>
              )}
            </button>
          </form>
        )}

        <p className="text-[11px] text-center text-foreground/50 mt-6">
          API credentials are encrypted and proxied directly to WEEX via CCXT.
        </p>
      </div>
    </div>
  );
}
