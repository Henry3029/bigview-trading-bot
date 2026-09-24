'use client';

import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Activity, 
  LogOut, 
  ShieldCheck, 
  Key, 
  User
} from 'lucide-react';
import ConnectWeexModal from '@/components/ConnectWeexModal';
import AuthModal from '@/components/AuthModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://server.bigviewbot.online';


interface UserData {
  id?: string;
  email?: string;
  username?: string;
  weexConnected?: boolean;
  freeUsdtBalance?: number;
  allocatedUsdtBalance?: number;
  [key: string]: any;
}

export default function App() {
  const [isConnectWeexOpen, setIsConnectWeexOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12">
      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(userData) => setUser(userData)}
        apiBaseUrl={API_URL}
      />

      <ConnectWeexModal
        isOpen={isConnectWeexOpen}
        onClose={() => setIsConnectWeexOpen(false)}
        onSuccess={(userData) => {
          setUser((prev) => (prev ? { ...prev, ...userData, weexConnected: true } : null));
        }}
        apiBaseUrl={API_URL}
      />

            <div className="flex items-center space-x-3">
              {user ? (
                <div className="flex items-center space-x-3 border-l border-slate-800 pl-4">
                  <div className="text-right">
                    <p className="text-xs font-semibold text-white">
                      {user.email || user.username || 'Trader Account'}
                    </p>
                    {user.weexConnected ? (
                      <button
                        onClick={() => setIsConnectWeexOpen(true)}
                        className="text-[11px] font-medium text-emerald-400 hover:underline flex items-center justify-end gap-1 ml-auto"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        WEEX Connected
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsConnectWeexOpen(true)}
                        className="text-[11px] font-semibold text-amber-500 hover:text-amber-400 hover:underline flex items-center justify-end gap-1 ml-auto"
                      >
                        <Key className="w-3 h-3" /> Connect Keys
                      </button>
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-rose-400 bg-slate-800 hover:bg-slate-700/80 rounded-lg transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-lg shadow-amber-500/10"
                >
                  <User className="w-4 h-4" /> Sign In / Register
                </button>
              )}
            </div>
          </div>
  );
}
