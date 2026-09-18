'use client';

import React, { useRef, useEffect } from 'react';

export default function TerminalConsole({ 
  title, 
  logs = [], 
  badge 
}: { 
  title: string; 
  logs: any[]; 
  badge: string; 
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom when a new tick or log arrives
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  // Render logs in chronological order so new ticks print at the bottom
  const displayLogs = [...logs].reverse();

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono h-64 flex flex-col justify-between shadow-xl overflow-hidden text-xs">
      
      {/* 1. TERMINAL HEADER */}
      <div className="border-b border-slate-800 pb-1.5 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-2 h-2 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-2 h-2 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <span className={`font-bold tracking-wide text-[11px] ${badge}`}>{title}</span>
        </div>
        <span className="text-slate-500 text-[10px] font-semibold">{logs.length} LINES</span>
      </div>

      {/* 2. REAL-TIME STREAMING LOG TERMINAL */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-1 my-1.5 pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent"
      >
        <div className="text-slate-600 font-mono text-[10px] pb-1 border-b border-slate-900/60">
          [SYSTEM] Terminal socket online. Streaming ticks & execution logs...
        </div>

        {displayLogs.map((log, idx) => {
          const isTicker = log.type === 'TICK' || log.currentAsset;
          const pnlNum = Number(log.pnlPercentage || 0);

          return (
            <div 
              key={log.id || idx} 
              className="w-full flex items-start gap-2 py-0.5 border-b border-slate-900/40 text-[11px] font-mono leading-tight hover:bg-slate-900/30 transition-colors"
            >
              {/* Timestamp */}
              <span className="text-slate-500 shrink-0 select-none">
                [{log.timestamp || 'LIVE'}]
              </span>

              {/* Status Tag */}
              <span className={`font-black shrink-0 px-1 py-0.2 rounded text-[9px] uppercase ${
                log.type === 'BUY' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                log.type === 'STOP_LOSS' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                log.type === 'TAKE_PROFIT' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 
                'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              }`}>
                {log.type || 'TICK'}
              </span>

              {/* Dynamic Log Line: Tickers vs Message Logs */}
              {isTicker ? (
                <div className="flex-1 flex items-center justify-between gap-2">
                  <span className="text-slate-300 font-bold">
                    {log.currentAsset || log.symbol}
                  </span>
                  <span className="text-slate-400">
                    $<span className="text-emerald-400">{log.currentPrice || log.price}</span>
                  </span>
                  <span className={`font-semibold ${pnlNum >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ({pnlNum >= 0 ? `+${pnlNum}` : pnlNum}%)
                  </span>
                </div>
              ) : (
                <div className="text-slate-200 font-medium break-all flex-1">
                  {typeof log.message === 'string' ? log.message : JSON.stringify(log.message)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 3. TERMINAL CLI PROMPT FOOTER */}
      <div className="pt-1.5 border-t border-slate-900 flex items-center text-[10px] text-slate-500 font-mono shrink-0">
        <span className="text-emerald-500 font-bold mr-1.5">root@weex-bot:~#</span>
        <span className="animate-pulse text-emerald-400 font-bold">█</span>
      </div>
    </div>
  );
}