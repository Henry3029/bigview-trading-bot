import {
  RefreshCw,
  Sliders,
  Zap,
  TrendingUp,
  Activity,
  Server,
  ArrowUpRight,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';

export default function Homepage() {
  return (
    <div className="space-y-8 pb-12 text-foreground">
      
      {/* 1. HERO / SYSTEM BANNER */}
      <section className="border border-black/10 dark:border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-500 dark:text-emerald-400">
                Core Engine Online
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Algorithmic Execution & Risk Dashboard
            </h1>
            <p className="text-sm text-foreground/70 max-w-2xl">
              Real-time monitoring hub for WEEX automated trading strategies, order book execution rates, and wallet treasury allocation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium border border-black/10 dark:border-white/10 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer">
              <RefreshCw className="w-3.5 h-3.5" />
              Sync Engine
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold bg-amber-500 text-slate-950 rounded-xl hover:bg-amber-400 transition cursor-pointer">
              <Sliders className="w-3.5 h-3.5" />
              Manage Parameters
            </button>
          </div>
        </div>
      </section>

      {/* 2. KEY METRICS GRID */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1 */}
        <div className="border border-black/10 dark:border-white/10 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between text-foreground/60">
            <span className="text-xs font-medium uppercase tracking-wide">Total Allocated</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">$12,450.00</span>
            <span className="text-xs text-emerald-500 dark:text-emerald-400 font-medium flex items-center">
              <ArrowUpRight className="w-3 h-3" /> +4.2%
            </span>
          </div>
          <p className="text-xs text-foreground/50">Active capital in WEEX sub-accounts</p>
        </div>

        {/* Metric 2 */}
        <div className="border border-black/10 dark:border-white/10 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between text-foreground/60">
            <span className="text-xs font-medium uppercase tracking-wide">24h Realized PnL</span>
            <TrendingUp className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-500 dark:text-emerald-400">+$384.12</span>
            <span className="text-xs text-emerald-500 dark:text-emerald-400 font-medium flex items-center">
              <ArrowUpRight className="w-3 h-3" /> +1.8%
            </span>
          </div>
          <p className="text-xs text-foreground/50">Across Engine-1 & Engine-2</p>
        </div>

        {/* Metric 3 */}
        <div className="border border-black/10 dark:border-white/10 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between text-foreground/60">
            <span className="text-xs font-medium uppercase tracking-wide">Active Positions</span>
            <Activity className="w-4 h-4 text-blue-500 dark:text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">3 Open</span>
            <span className="text-xs text-foreground/60 font-medium">BTC & ETH</span>
          </div>
          <p className="text-xs text-foreground/50">Max drawdown limit set to 2.5%</p>
        </div>

        {/* Metric 4 */}
        <div className="border border-black/10 dark:border-white/10 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between text-foreground/60">
            <span className="text-xs font-medium uppercase tracking-wide">Execution Latency</span>
            <Server className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">18ms</span>
            <span className="text-xs text-emerald-500 dark:text-emerald-400 font-medium">Optimal</span>
          </div>
          <p className="text-xs text-foreground/50">WebSocket connection latency</p>
        </div>

      </section>

      {/* 3. ENGINE STRATEGY STATUS SECTION */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Active Execution Engines</h2>
          <span className="text-xs text-foreground/60">Running WEEX Orderbook Models</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Engine 1 Card */}
          <div className="border border-black/10 dark:border-white/10 rounded-xl p-6 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono text-amber-500 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  ENGINE_01
                </span>
                <h3 className="text-lg font-bold mt-2">BTC/USDT Momentum Scalper</h3>
              </div>
              <span className="px-2.5 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3" /> Active
              </span>
            </div>

            <p className="text-xs text-foreground/70 leading-relaxed">
              Monitors order book imbalance and micro-volatility shifts on WEEX perpetual contracts. Fires short-horizon limit orders with stop loss tracking.
            </p>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-black/10 dark:border-white/10 text-xs">
              <div>
                <span className="text-foreground/50 block">Capital</span>
                <span className="font-semibold">$7,500</span>
              </div>
              <div>
                <span className="text-foreground/50 block">Win Rate</span>
                <span className="font-semibold text-emerald-500 dark:text-emerald-400">68.4%</span>
              </div>
              <div>
                <span className="text-foreground/50 block">Trades (24h)</span>
                <span className="font-semibold">42</span>
              </div>
            </div>
          </div>

          {/* Engine 2 Card */}
          <div className="border border-black/10 dark:border-white/10 rounded-xl p-6 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono text-blue-500 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  ENGINE_02
                </span>
                <h3 className="text-lg font-bold mt-2">ETH/USDT Mean Reversion</h3>
              </div>
              <span className="px-2.5 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3" /> Active
              </span>
            </div>

            <p className="text-xs text-foreground/70 leading-relaxed">
              Detects standard deviation stretch from VWAP on 5-minute candles. Automatically hedges positions when market-wide correlation spikes.
            </p>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-black/10 dark:border-white/10 text-xs">
              <div>
                <span className="text-foreground/50 block">Capital</span>
                <span className="font-semibold">$4,950</span>
              </div>
              <div>
                <span className="text-foreground/50 block">Win Rate</span>
                <span className="font-semibold text-emerald-500 dark:text-emerald-400">62.1%</span>
              </div>
              <div>
                <span className="text-foreground/50 block">Trades (24h)</span>
                <span className="font-semibold">19</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 4. ACTIVE ORDERS / POSITIONS TABLE */}
      <section className="border border-black/10 dark:border-white/10 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Live Active Positions</h2>
          <span className="text-xs text-foreground/60">3 Open Trades</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/5 dark:bg-white/5 text-foreground/70 uppercase font-mono border-b border-black/10 dark:border-white/10">
              <tr>
                <th className="py-3 px-4">Market</th>
                <th className="py-3 px-4">Side</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Entry Price</th>
                <th className="py-3 px-4">Mark Price</th>
                <th className="py-3 px-4">Unrealized PnL</th>
                <th className="py-3 px-4 text-right">Engine</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10 dark:divide-white/10">
              <tr>
                <td className="py-3.5 px-4 font-bold">BTC-USDT-PERP</td>
                <td className="py-3.5 px-4 font-semibold text-emerald-500 dark:text-emerald-400">LONG 10x</td>
                <td className="py-3.5 px-4">0.45 BTC</td>
                <td className="py-3.5 px-4 font-mono">$92,140.00</td>
                <td className="py-3.5 px-4 font-mono">$92,850.50</td>
                <td className="py-3.5 px-4 font-semibold text-emerald-500 dark:text-emerald-400 font-mono">+$319.72 (+3.4%)</td>
                <td className="py-3.5 px-4 text-right font-mono text-foreground/60">ENGINE_01</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-bold">ETH-USDT-PERP</td>
                <td className="py-3.5 px-4 font-semibold text-rose-500 dark:text-rose-400">SHORT 5x</td>
                <td className="py-3.5 px-4">3.20 ETH</td>
                <td className="py-3.5 px-4 font-mono">$3,410.20</td>
                <td className="py-3.5 px-4 font-mono">$3,395.00</td>
                <td className="py-3.5 px-4 font-semibold text-emerald-500 dark:text-emerald-400 font-mono">+$48.64 (+1.1%)</td>
                <td className="py-3.5 px-4 text-right font-mono text-foreground/60">ENGINE_02</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-bold">SOL-USDT-PERP</td>
                <td className="py-3.5 px-4 font-semibold text-emerald-500 dark:text-emerald-400">LONG 5x</td>
                <td className="py-3.5 px-4">25.0 SOL</td>
                <td className="py-3.5 px-4 font-mono">$188.50</td>
                <td className="py-3.5 px-4 font-mono">$187.10</td>
                <td className="py-3.5 px-4 font-semibold text-rose-500 dark:text-rose-400 font-mono">-$35.00 (-0.7%)</td>
                <td className="py-3.5 px-4 text-right font-mono text-foreground/60">ENGINE_01</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. RISK & SAFETY SUMMARY */}
      <section className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-500 dark:text-amber-400 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold">Automated Risk Safeguards Active</h3>
            <p className="text-xs text-foreground/70">
              Emergency Kill-Switch will trigger automatic market position liquidation if global account drawdown exceeds 5.0%.
            </p>
          </div>
        </div>

        <button className="px-4 py-2 text-xs font-semibold bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-400 rounded-lg hover:bg-rose-500/20 transition whitespace-nowrap self-start md:self-auto cursor-pointer">
          Arm Emergency Stop
        </button>
      </section>

    </div>
  );
}
