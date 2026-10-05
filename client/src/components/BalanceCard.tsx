'use client';

import React, { useState, useEffect } from 'react';
import { Wallet, RefreshCw } from 'lucide-react';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || '';

export default function BalanceCard() {
  const [balance, setBalance] = useState<{ free: number; total: number } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const fetchBalance = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      const response = await fetch(`${apiBaseUrl}/api/user/balance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load balance');
      }

      setBalance({ free: data.free, total: data.total });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  return (
    <div className="bg-[var(--background)] border border-black/10 dark:border-white/10 rounded-2xl p-6 shadow-xl max-w-md w-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-emerald-500" />
          <h3 className="text-lg font-semibold">Account Balance</h3>
        </div>
        <button
          onClick={fetchBalance}
          disabled={loading}
          className="p-1.5 rounded-lg border hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
          title="Refresh Balance"
        >
          <RefreshCw className={`w-4 h-4 opacity-70 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error ? (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs rounded-lg">
          {error} (Make sure your WEEX API keys are connected)
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="bg-black/5 dark:bg-white/5 p-3 rounded-xl">
            <span className="text-xs opacity-60 block">Free USDT</span>
            <span className="text-lg font-bold text-emerald-500">
              {loading && !balance ? '...' : `$${Number(balance?.free || 0).toFixed(2)}`}
            </span>
          </div>
          <div className="bg-black/5 dark:bg-white/5 p-3 rounded-xl">
            <span className="text-xs opacity-60 block">Total USDT</span>
            <span className="text-lg font-bold">
              {loading && !balance ? '...' : `$${Number(balance?.total || 0).toFixed(2)}`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
