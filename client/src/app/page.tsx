'use client';

import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  Zap, 
  Activity, 
  LogOut, 
  ShieldCheck, 
  Key, 
  User, 
  Terminal 
} from 'lucide-react';
import TerminalConsole from '@/components/TerminalConsole';
import ConnectWeexModal from '@/components/ConnectWeexModal';
import AuthModal from '@/components/AuthModal';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://bot.bigviewbot.online';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://server.bigviewbot.online';

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: true,
  transports: ['websocket', 'polling'],
  withCredentials: true,
});

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

  //  2 Engine Terminals (Major Pairs vs Altcoins)
  const [engine1Logs, setEngine1Logs] = useState<any[]>([]);
  const [engine2Logs, setEngine2Logs] = useState<any[]>([]);
  const [isSocketConnected, setIsSocketConnected] = useState(false);


  const freeUsdt = user?.freeUsdtBalance ?? 0;
  const allocatedUsdt = user?.allocatedUsdtBalance ?? 0;

  useEffect(() => {
  const onConnect = () => setIsSocketConnected(true);
  const onDisconnect = () => setIsSocketConnected(false);

  socket.on('connect', onConnect);
  socket.on('disconnect', onDisconnect);

  if (socket.connected) {
    setIsSocketConnected(true);
  }

  // 1️⃣ Handle explicit trade & system logs
  const handleEngineLog = (logPayload: any) => {
    if (!logPayload) return;

    const engineIdentifier = String(logPayload.engine || logPayload.engineId || '').toUpperCase();

    const isEngine1 = 
      engineIdentifier.includes('ENGINE_1') || 
      engineIdentifier.includes('BTC') || 
      engineIdentifier.includes('ETH') || 
      engineIdentifier.includes('SOL');

    if (isEngine1) {
      setEngine1Logs((prev) => [logPayload, ...prev].slice(0, 100));
    } else {
      setEngine2Logs((prev) => [logPayload, ...prev].slice(0, 100));
    }
  };

  // 2️⃣ Handle live ticks & state updates (Push directly into terminal streams)
  const handleStateUpdate = (statePayload: any) => {
    if (!statePayload) return;

    // Convert raw price payload into a terminal tick entry
    const tickEntry = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
      timestamp: new Date().toLocaleTimeString(),
      type: 'TICK',
      ...statePayload,
    };

    if (statePayload.engineId === 'ENGINE_1') {
      setEngine1Logs((prev) => [tickEntry, ...prev].slice(0, 100));
    } else if (statePayload.engineId === 'ENGINE_2') {
      setEngine2Logs((prev) => [tickEntry, ...prev].slice(0, 100));
    }
  };

  socket.on('engine_log', handleEngineLog);
  socket.on('engine_state_update', handleStateUpdate);

  return () => {
    socket.off('connect', onConnect);
    socket.off('disconnect', onDisconnect);
    socket.off('engine_log', handleEngineLog);
    socket.off('engine_state_update', handleStateUpdate);
  };
}, []);

  const handleLogout = () => {
    setUser(null);
    setEngine1Logs([]);
    setEngine2Logs([]);
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

      {/* HEADER */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <Zap className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-wide text-white">
                WEEX <span className="text-amber-500">AI BOT</span>
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">Automated Dual-Engine Trading Vaults</p>
            </div>
          </div>

          {/* Balance & Auth Actions */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
              <Activity className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-slate-400">Available:</span>
              <span className="font-semibold text-xs text-white">${freeUsdt.toFixed(2)} USDT</span>
            </div>

            <div className="hidden sm:flex items-center space-x-2 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/30">
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-amber-400">Active Pool:</span>
              <span className="font-semibold text-xs text-amber-500">${allocatedUsdt.toFixed(2)} USDT</span>
            </div>

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
        </div>
      </header>

      {/* ENGINE TERMINALS SECTION */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <section className="mt-6">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-amber-500" /> Live Engine Terminal Logs
            </h3>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isSocketConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <span className="text-xs font-mono text-slate-400">
                {isSocketConnected ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
          </div>

          {!user ? (
            <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-xl text-slate-400 text-sm">
               Log in to view live real-time execution logs for Engine 1 and Engine 2.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TerminalConsole 
                title="ENGINE 1: MAJOR ASSETS" 
                logs={engine1Logs} 
                badge="text-amber-400" 
              />
              <TerminalConsole 
                title="ENGINE 2: ALTCOIN MOMENTUM" 
                logs={engine2Logs} 
                badge="text-cyan-400" 
              />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
