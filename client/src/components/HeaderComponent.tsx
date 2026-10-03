'use client';

import React, { useState } from 'react';
import { useAuth } from "@/provider/AuthContext";
import Link from 'next/link';
import Image from 'next/image';
import { User as UserIcon } from 'lucide-react';
import NavbarComponent from './NavbarComponent';
import ConnectWeexModal from '@/components/ConnectWeexModal';
import UserProfileDrawer from './UserProfileDrawer';
import AuthModal from '@/components/AuthModal';

export default function HeaderComponent() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isConnectWeexOpen, setIsConnectWeexOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // WEEX connection success handler
  const handleWeexSuccess = (weexData: any) => {
    console.log('WEEX Connected successfully:', weexData);
    setIsConnectWeexOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-[var(--background)] border-b border-solid border-slate-200 dark:border-white/10 shadow-sm px-5 py-1 text-foreground transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Left: User Profile / Auth Action */}
        <div className="flex items-center gap-3">
          {isLoading ? (
            /* Loading pulse skeleton while verifying token on startup */
            <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-zinc-800 animate-pulse" />
          ) : isAuthenticated ? (
            <button
              onClick={() => setIsProfileOpen(true)}
              className="group p-2 rounded-full border border-slate-300 dark:border-white/20 bg-blue-500/10 hover:bg-blue-500/20 hover:border-blue-500/60 transition-all cursor-pointer"
            >
              <UserIcon className="w-5 h-5 text-blue-500 dark:text-blue-400 group-hover:text-blue-600" />
            </button>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>
        
        {/* Right: Logo + Navigation */}
        <div className="flex items-center gap-6">
          <Image
            src="/bigview-image.jpg"
            alt="bigviewLogo"
            width={32}
            height={32}
            className="w-8 h-8 object-contain"
            priority
          />

          <NavbarComponent user={user} onLogout={logout} />
        </div>

      </div>
      
      {/* User Profile Slide-over Drawer */}
      <UserProfileDrawer
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        onOpenConnectWeex={() => setIsConnectWeexOpen(true)}
        onLogout={logout}
      />

      {/* Modals placed inside Header */}
      <ConnectWeexModal
        isOpen={isConnectWeexOpen}
        onClose={() => setIsConnectWeexOpen(false)}
        onSuccess={handleWeexSuccess}
      />
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </header>
  );
}
