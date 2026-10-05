import React, { useState, useEffect } from 'react';
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || '';

interface UserProfileResponse {
  isBotActive: boolean;
  [key: string]: any;
}

interface ToggleResponse {
  success: boolean;
  isBotActive: boolean;
  message: string;
  error?: string;
}

export default function BotToggleCard() {
  const [isBotActive, setIsBotActive] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data: UserProfileResponse = await response.json();
      if (response.ok) {
        setIsBotActive(data.isBotActive);
      }
    } catch (err) {
      console.error('Failed to load user profile', err);
    }
  };

  const handleToggle = async () => {
    setLoading(true);
    setError('');
    const nextState = !isBotActive;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiBaseUrl}/api/bot/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ activate: nextState })
      });

      const data: ToggleResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update bot state');
      }

      setIsBotActive(data.isBotActive);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[var(--background)] border rounded-2xl p-6 shadow-xl max-w-md w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Automated Trading Bot</h3>
          <p className="text-sm opacity-70">Control your live 5-engine multi-asset strategy.</p>
        </div>
        
        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 border ${
          isBotActive 
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
            : 'opacity-60 border-current'
        }`}>
          <span className={`w-2 h-2 rounded-full ${isBotActive ? 'bg-emerald-400 animate-pulse' : 'bg-gray-400'}`} />
          {isBotActive ? 'Active' : 'Paused'}
        </span>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t">
        <span className="text-sm font-medium opacity-80">
          {isBotActive ? 'Bot is running in background' : 'Bot is currently offline'}
        </span>

        <button
          onClick={handleToggle}
          disabled={loading}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
            isBotActive ? 'bg-emerald-500' : 'bg-gray-600 dark:bg-gray-700'
          } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isBotActive ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
