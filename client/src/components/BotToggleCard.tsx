'use client';

import React, { useState, useEffect } from 'react';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || '';

interface UserProfileResponse {
  user: {
    isBotActive?: boolean;
    [key: string]: any;
  };
  isBotActive?: boolean;
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
  
  // New state to control the confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [pendingState, setPendingState] = useState<boolean>(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      const response = await fetch(`${apiBaseUrl}/api/user/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data: UserProfileResponse = await response.json();
      if (response.ok) {
        const botStatus = data.user?.isBotActive ?? data.isBotActive ?? false;
        setIsBotActive(Boolean(botStatus));
      }
    } catch (err) {
      console.error('Failed to load user profile', err);
    }
  };

  // Intercept the click to check if we are turning it OFF
  const handleToggleClick = () => {
    const nextState = !isBotActive;
    
    // If turning OFF, prompt the user for confirmation to prevent accidental liquidations
    if (!nextState) {
      setPendingState(false);
      setShowConfirmModal(true);
    } else {
      // If turning ON, execute right away (or add confirmation here too if desired)
      executeToggle(true);
    }
  };

  const executeToggle = async (activate: boolean) => {
    setLoading(true);
    setError('');
    setShowConfirmModal(false);

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      const response = await fetch(`${apiBaseUrl}/api/bot/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ activate })
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
    <>
      <div className="bg-[var(--background)] border rounded-2xl p-6 shadow-xl max-w-md w-full relative">
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
            onClick={handleToggleClick}
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

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--background)] border border-black/20 dark:border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4">
            <h4 className="text-lg font-bold text-rose-500">Stop Trading Engine?</h4>
            <p className="text-sm opacity-80 leading-relaxed">
              Are you sure you want to pause the engine? This will halt all active automated execution loops and may close or freeze your active trades depending on your engine parameters.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-sm font-medium border rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => executeToggle(false)}
                className="px-4 py-2 text-sm font-medium bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition cursor-pointer"
              >
                Yes, Stop Bot
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
