'use client';

import React from 'react';
import { X, User as UserIcon, Key, LogOut } from 'lucide-react';
import BotToggleCard from './BotToggleCard';
import BalanceCard from '@/components/BalanceCard';

interface User {
  email?: string;
  username?: string;
  id?: string;
  isBotActive?: boolean;
  hasConnectedKeys?: boolean; // <-- Added here
}

interface UserProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onOpenConnectWeex: () => void;
  onLogout?: () => void;
}

export default function UserProfileDrawer({
  isOpen,
  onClose,
  user,
  onOpenConnectWeex,
  onLogout,
}: UserProfileDrawerProps) {
  if (!user) return null;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
        />
      )}

      {/* Sliding Drawer */}
      <aside
        className={`fixed top-0 right-0 bottom-0 w-[85vw] max-w-sm bg-[var(--background)] text-foreground border-l border-black/20 dark:border-white/10 p-6 z-50 flex flex-col justify-between transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col gap-6">
          {/* Drawer Header */}
          <div className="flex items-center justify-between pb-4 border-b border-black/20 dark:border-white/10">
            <div className="flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-amber-500" />
              <span className="text-sm font-bold uppercase tracking-wider">Account Profile</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-foreground/60 hover:text-foreground rounded-md cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Information */}
          <div className="flex flex-col gap-4">
            <div className="p-3 border border-black/10 dark:border-white/10 rounded-lg bg-black/5 dark:bg-white/5">
              <span className="text-xs text-foreground/50 block font-mono uppercase mb-1">Email</span>
              <span className="text-sm font-medium break-all">{user.email || 'Trader'}</span>
            </div>

            {user.username && (
              <div className="p-3 border border-black/10 dark:border-white/10 rounded-lg bg-black/5 dark:bg-white/5">
                <span className="text-xs text-foreground/50 block font-mono uppercase mb-1">Username</span>
                <span className="text-sm font-medium">{user.username}</span>
              </div>
            )}
            
            <BalanceCard />

            {/* API Key Action Status */}
            <div className="p-3 border border-black/10 dark:border-white/10 rounded-lg flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Key className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="text-xs font-medium truncate">API Key Status</span>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenConnectWeex();
                }}
                className={`text-xs px-2.5 py-1 border rounded transition cursor-pointer shrink-0 ${
                  user.hasConnectedKeys
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                }`}
              >
                {user.hasConnectedKeys ? 'Update Keys' : 'Connect Key'}
              </button>
            </div>
          </div>

          <BotToggleCard />
        </div>

        {/* Footer Logout Action */}
        {onLogout && (
          <div className="pt-4 border-t border-black/20 dark:border-white/10">
            <button
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-lg hover:bg-rose-500/20 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
