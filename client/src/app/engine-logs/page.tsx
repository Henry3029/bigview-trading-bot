'use client';

import React, { useState, useEffect } from 'react';
import { Terminal } from 'lucide-react';
import TerminalConsole from '@/components/TerminalConsole';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://bot.bigviewbot.online';
export const socket: Socket = io(SOCKET_URL, {
  autoConnect: true,
  transports: ['websocket', 'polling'],
  withCredentials: true,
});

export default function EngineLogs() {
  // EngineOne Terminal (Major assets)
  const [engineLogs, setEngineLogs] = useState<any[]>([]);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

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
      setEngineLogs((prev) => [logPayload, ...prev].slice(0, 100));
    };

    // 2️⃣ Handle live ticks & state updates
    const handleStateUpdate = (statePayload: any) => {
      if (!statePayload) return;

      const tickEntry = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
        timestamp: new Date().toLocaleTimeString(),
        ...statePayload,
      };

      setEngineLogs((prev) => [tickEntry, ...prev].slice(0, 100));
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

  return (
    <div className="w-full flex-1 flex flex-col gap-4 text-foreground min-w-0 overflow-x-hidden">
      {/* ENGINE TERMINALS SECTION */}
      <main className="w-full mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-8 min-w-0">
        <section className="mt-4 sm:mt-6 min-w-0">
          
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-4 border-b border-black/20 dark:border-white/10 pb-3 min-w-0">
            <h3 className="text-base sm:text-lg font-bold flex items-center gap-2 min-w-0">
              <Terminal className="w-5 h-5 text-amber-500 shrink-0" />
              <span className="truncate">Live Logs</span>
            </h3>
            
            <div className="flex items-center gap-2 shrink-0">
              <span className={`w-2.5 h-2.5 rounded-full ${isSocketConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <span className="text-xs font-mono text-foreground/60">
                {isSocketConnected ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
          </div>

          {/* Terminal Console */}
          <div className="w-full min-w-0">
            <TerminalConsole 
              title="ENGINE LOGS" 
              logs={engineLogs} 
              badge="text-amber-500 dark:text-amber-400" 
            />
          </div>

        </section>
      </main>
    </div>
  );
}
