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
  <div className="w-full flex-1 min-h-[500px] border border-black/25 dark:border-white/10 rounded-lg p-3 sm:p-4 font-mono flex flex-col justify-between shadow-xl overflow-hidden text-xs text-foreground min-w-0">
    
    {/* 1. TERMINAL HEADER */}
    <div className="border-b border-black/20 dark:border-white/10 pb-2 shrink-0 flex items-center justify-between gap-2 min-w-0">
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex gap-1.5 shrink-0">
          <span className="w-2 h-2 rounded-full bg-rose-500/80 inline-block" />
          <span className="w-2 h-2 rounded-full bg-amber-500/80 inline-block" />
          <span className="w-2 h-2 rounded-full bg-emerald-500/80 inline-block" />
        </div>
        <span className={`font-bold tracking-wide text-[10px] sm:text-[11px] truncate ${badge}`}>{title}</span>
      </div>
      <span className="text-foreground/50 text-[10px] font-semibold shrink-0">{logs.length} LINES</span>
    </div>

    {/* 2. REAL-TIME STREAMING LOG TERMINAL */}
    <div 
      ref={scrollRef}
      className="flex-1 overflow-y-auto space-y-1.5 my-1.5 px-2 py-1 scrollbar-thin scrollbar-thumb-black/10 dark:scrollbar-thumb-white/10 scrollbar-track-transparent min-w-0"
    >
      <div className="text-foreground/50 font-mono text-[9px] sm:text-[10px] pb-1 border-b border-black/5 dark:border-white/5">
        [SYSTEM] Terminal socket online. Streaming ticks & execution logs...
      </div>

      {displayLogs.map((log, idx) => {
        const isTicker = log.type === 'TICK' || log.currentAsset;
        const pnlNum = Number(log.pnlPercentage || 0);

        return (
          <div 
            key={log.id || idx} 
            className="w-full flex items-start gap-2 py-1 px-1.5 rounded border-b border-black/5 dark:border-white/5 text-[10px] sm:text-[11px] font-mono leading-relaxed hover:bg-black/5 dark:hover:bg-white/5 transition-colors min-w-0"
          >
            {/* Timestamp */}
            <span className="text-foreground/50 shrink-0 select-none text-[9px] sm:text-[10px]">
              [{log.timestamp || 'LIVE'}]
            </span>

            {/* Status Tag */}
            <span className={`font-black shrink-0 px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] uppercase tracking-wider ${
              log.type === 'BUY' ? 'bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 border border-emerald-500/30' :
              log.type === 'STOP_LOSS' ? 'bg-rose-500/20 text-rose-500 dark:text-rose-400 border border-rose-500/30' :
              log.type === 'TAKE_PROFIT' ? 'bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/30' : 
              'bg-cyan-500/20 text-cyan-500 dark:text-cyan-400 border border-cyan-500/30'
            }`}>
              {log.type || 'TICK'}
            </span>

            {/* Dynamic Log Line: Tickers vs Message Logs */}
            {isTicker ? (
              <div className="flex-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 min-w-0">
                <span className="text-foreground font-bold shrink-0">
                  {log.currentAsset || log.symbol}
                </span>
                <span className="text-foreground/70 shrink-0">
                  $<span className="text-emerald-500 dark:text-emerald-400">{log.currentPrice || log.price}</span>
                </span>
                <span className={`font-semibold shrink-0 ${pnlNum >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                  ({pnlNum >= 0 ? `+${pnlNum}` : pnlNum}%)
                </span>
              </div>
            ) : (
              <div className="text-foreground/90 font-medium break-words whitespace-pre-wrap flex-1 min-w-0">
                {typeof log.message === 'string' ? log.message : JSON.stringify(log.message)}
              </div>
            )}
          </div>
        );
      })}
    </div>

    {/* 3. ANIMATED CLI PROMPT FOOTER */}
    <div className="pt-2 px-1 border-t border-black/20 dark:border-white/10 flex items-center justify-between text-[10px] text-foreground/60 font-mono shrink-0 min-w-0 select-none">
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-emerald-500 dark:text-emerald-400 font-bold shrink-0">
          root@weex-bot:~#
        </span>
        <span className="text-foreground/70 truncate">
          tail -f /var/log/engine.log
        </span>
        <span className="inline-block w-1.5 h-3 bg-emerald-500 dark:bg-emerald-400 animate-pulse shrink-0" />
      </div>

      <div className="hidden sm:flex items-center gap-2 text-[9px] text-foreground/40 shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span>TTY 1 (ACTIVE)</span>
      </div>
    </div>
  </div>
);
}
