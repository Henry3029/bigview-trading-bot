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
	
	  //  EngineOne Terminal (Major assets)
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
  }
    
  
    // 2️⃣ Handle live ticks & state updates (Push directly into terminal streams)
  const handleStateUpdate = (statePayload: any) => {
    if (!statePayload) return;

    // Convert raw price payload into a terminal tick entry
    const tickEntry = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
      timestamp: new Date().toLocaleTimeString(),
      ...statePayload,
    };

      setEngineLogs((prev) => [tickEntry, ...prev].slice(0, 100));
  }

  socket.on('engine_log', handleEngineLog);
  socket.on('engine_state_update', handleStateUpdate);

  return () => {
    socket.off('connect', onConnect);
    socket.off('disconnect', onDisconnect);
    socket.off('engine_log', handleEngineLog);
    socket.off('engine_state_update', handleStateUpdate);
  };
}, [])

return (
<div className="w-full flex-1 flex flex-col gap-4">
{/* ENGINE TERMINALS SECTION */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <section className="mt-6">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-amber-500" /> Engine 1 live Terminal Logs
            </h3>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isSocketConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <span className="text-xs font-mono text-slate-400">
                {isSocketConnected ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
          </div>

            <div className="w-full flex-1 min-h-[500px] bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-sm overflow-y-auto">
              <TerminalConsole 
                title="ENGINE LOGS" 
                logs={engineLogs} 
                badge="text-amber-400" 
              />
            </div>
          
        </section>
      </main>
  </div>
  )
  }