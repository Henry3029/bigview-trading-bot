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
    <div className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-emerald-500" />
          <span className="text-xs font-semibold uppercase tracking-wider opacity-70">Exchange Balance</span>
        </div>
        <button
          onClick={fetchBalance}
          disabled={loading}
          className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition cursor-pointer"
          title="Refresh Balance"
        >
          <RefreshCw className={`w-3.5 h-3.5 opacity-60 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error ? (
        <div className="flex items-start gap-2 text-amber-500 text-xs bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Keys not connected or invalid</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[var(--background)] p-2.5 rounded-lg border border-black/5 dark:border-white/5">
            <span className="text-[10px] uppercase opacity-60 block">Free USDT</span>
            <span className="text-sm font-bold text-emerald-500">
              {loading && !balance ? '...' : `$${Number(balance?.free || 0).toFixed(2)}`}
            </span>
          </div>
          <div className="bg-[var(--background)] p-2.5 rounded-lg border border-black/5 dark:border-white/5">
            <span className="text-[10px] uppercase opacity-60 block">Total USDT</span>
            <span className="text-sm font-bold">
              {loading && !balance ? '...' : `$${Number(balance?.total || 0).toFixed(2)}`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
