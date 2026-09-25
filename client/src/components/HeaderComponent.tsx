'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LogOut, User as UserIcon } from 'lucide-react';
import NavbarComponent from './NavbarComponent';
import ConnectWeexModal from '@/components/ConnectWeexModal';
import AuthModal from '@/components/AuthModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://server.bigviewbot.online';

interface UserData {
  id?: string;
  email?: string;
  freeUsdtBalance?: number;
}

export default function HeaderComponent() {
  const [isConnectWeexOpen, setIsConnectWeexOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);

  // Restore user session on refresh keeps a seamless interaction.
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.user) setUser(data.user);
        })
        .catch(() => localStorage.removeItem('token'));
    }
  }, []);

  const handleLogout = () => {
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  };

  return (
    <header className="w-full bg-slate-950 border-b border-slate-800 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Left: Logo + Navigation */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo.svg"
              alt="Logo"
              width={32}
              height={32}
              className="w-8 h-8 object-contain"
              priority
            />
            <span className="font-bold text-slate-100 text-lg hidden sm:inline">
              Trading Control Center
            </span>
          </Link>

          <NavbarComponent />
        </div>

        {/* Right: User Profile Controls */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3 bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 rounded-lg">
              <div className="flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium text-slate-200">
                  {user.email || 'Trader'}
                </span>
              </div>

              <button
                onClick={() => setIsConnectWeexOpen(true)}
                className="text-xs px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded hover:bg-amber-500/20 transition"
              >
                {user.email ? 'WEEX Active' : 'Connect WEEX'}
              </button>

              <button
                onClick={handleLogout}
                className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-4 py-2 text-sm font-medium bg-amber-500 text-slate-950 rounded-lg hover:bg-amber-400 transition-colors"
            >
              Sign In
            </button>
          )}
        </div>

      </div>

      {/* Modals placed inside Header */}
      <ConnectWeexModal
        isOpen={isConnectWeexOpen}
        onClose={() => setIsConnectWeexOpen(false)}
      />
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(userData) => setUser(userData)}
      />
    </header>
  );
}
