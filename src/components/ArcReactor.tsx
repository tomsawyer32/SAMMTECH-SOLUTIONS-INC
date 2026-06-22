import React from 'react';

interface ArcReactorProps {
  btcTrend: 'up' | 'down' | 'stable';
  isActive: boolean;
  intensity: number; // 0 to 100 representing gameplay intensity
  btcPrice: number;
}

export default function ArcReactor({ btcTrend, isActive, intensity, btcPrice }: ArcReactorProps) {
  // Rotate speed increases with gameplay intensity
  const rotateSpeedClass = isActive 
    ? 'animate-[spin_2s_linear_infinite]' 
    : intensity > 60 
    ? 'animate-[spin_4s_linear_infinite]' 
    : 'animate-[spin_10s_linear_infinite]';

  // Liquid gold level linked to BTC price fluctuation
  const goldFlowHue = btcTrend === 'up' 
    ? 'text-liquid-gold-light drop-shadow-[0_0_15px_#ffd700]' 
    : btcTrend === 'down' 
    ? 'text-amber-700' 
    : 'text-liquid-gold';

  return (
    <div className="relative flex flex-col items-center justify-center p-6 bg-slate-950/80 rounded-2xl border border-slate-800 backdrop-blur-md overflow-hidden glow-box-blue group">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-radial from-reactor-cyan/5 via-transparent to-transparent pointer-events-none" />
      
      {/* Onion.share safe badge */}
      <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 bg-black/60 border border-emerald-500/30 rounded-full">
        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
        <span className="font-mono text-[10px] text-emerald-400 font-bold uppercase tracking-widest">onion.share v2.6 // E2E ENCRYPTED</span>
      </div>

      <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-0.5 bg-black/60 border border-reactor-cyan/30 rounded-full">
        <span className="font-mono text-[10px] text-reactor-cyan tracking-wider">SECURE NODE</span>
      </div>

      {/* Main Reactor Body */}
      <div className="relative w-48 h-48 flex items-center justify-center my-4 select-none">
        {/* Outer glowing ring */}
        <div className={`absolute inset-0 rounded-full border-2 border-dashed border-reactor-cyan/30 duration-1000 ${isActive ? 'scale-110 rotate-45 border-reactor-cyan' : ''}`} />
        
        {/* Dual outer gold coils */}
        <div className="absolute w-[92%] h-[92%] rounded-full border border-liquid-gold/20 animate-[spin_30s_linear_infinite_reverse]" />
        
        {/* Core Ring */}
        <svg viewBox="0 0 100 100" className="w-[85%] h-[85%] transition-transform duration-300">
          {/* Circular grid lines */}
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" className="text-slate-900" strokeWidth="2" />
          <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" className="text-reactor-blue/20" strokeWidth="1" />
          <circle cx="50" cy="50" r="28" fill="none" stroke="currentColor" className="text-reactor-cyan/20" strokeWidth="1" strokeDasharray="2, 2" />

          {/* Copper Core Segments (Magnetized Segments) */}
          <g className={rotateSpeedClass} style={{ transformOrigin: '50px 50px' }}>
            {Array.from({ length: 10 }).map((_, i) => {
              const angle = (i * 36) * (Math.PI / 180);
              const x1 = 50 + 32 * Math.cos(angle);
              const y1 = 50 + 32 * Math.sin(angle);
              const x2 = 50 + 44 * Math.cos(angle);
              const y2 = 50 + 44 * Math.sin(angle);
              
              return (
                <g key={i}>
                  {/* Copper Ring Segment Coil */}
                  <line 
                    x1={x1} 
                    y1={y1} 
                    x2={x2} 
                    y2={y2} 
                    stroke="url(#arcGoldGrad)"
                    strokeWidth="3.5" 
                    strokeLinecap="round" 
                    className="opacity-90 drop-shadow-[0_0_2px_rgba(229,169,59,0.5)]"
                  />
                  {/* Energy discharge element */}
                  <line 
                    x1={x1 - 1} 
                    y1={y1 - 1} 
                    x2={x1 + 1} 
                    y2={y1 + 1}
                    stroke="#00ffff" 
                    strokeWidth="1.5" 
                    className={isActive ? 'opacity-100 animate-ping' : 'opacity-40'}
                  />
                </g>
              );
            })}
          </g>

          {/* Internal Energy ring */}
          <circle 
            cx="50" 
            cy="50" 
            r="23" 
            fill="none" 
            stroke="url(#arcBlueGrad)" 
            strokeWidth="3" 
            className="animate-pulse" 
          />

          {/* Golden energy core emitters */}
          <g className="animate-[spin_15s_linear_infinite]" style={{ transformOrigin: '50px 50px' }}>
            {Array.from({ length: 3 }).map((_, i) => {
              const angle = (i * 120) * (Math.PI / 180);
              const cx = 50 + 16 * Math.cos(angle);
              const cy = 50 + 16 * Math.sin(angle);
              return (
                <circle 
                  key={i} 
                  cx={cx} 
                  cy={cy} 
                  r="3.5" 
                  fill={btcTrend === 'up' ? '#ffd700' : '#e5a93b'} 
                  className="drop-shadow-[0_0_5px_rgba(229,169,59,0.8)]" 
                />
              );
            })}
          </g>

          {/* Reactor Center Unibeam node */}
          <circle cx="50" cy="50" r="10" fill="#ffffff" className="drop-shadow-[0_0_12px_#00f0ff]" />
          <circle cx="50" cy="50" r="7" fill="#00f0ff" opacity="0.6" className="animate-ping" style={{ transformOrigin: '50px 50px' }} />
          <circle cx="50" cy="50" r="6" fill="#00f0ff" className="mix-blend-screen" />

          {/* Defs for Premium Gradients */}
          <defs>
            <linearGradient id="arcBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f0ff" />
              <stop offset="100%" stopColor="#0072ff" />
            </linearGradient>
            <linearGradient id="arcGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffd700" />
              <stop offset="50%" stopColor="#e5a93b" />
              <stop offset="100%" stopColor="#8c5b05" />
            </linearGradient>
          </defs>
        </svg>

        {/* Outer UI Rings (Measuring grid dials) */}
        <div className="absolute w-[80%] h-[80%] rounded-full border border-dashed border-reactor-cyan/15 animate-[spin_60s_linear_infinite]" />
      </div>

      {/* Liquid Gold Battery Chambers */}
      <div className="w-full mt-2 flex flex-col gap-1.5 font-mono text-xs">
        <div className="flex justify-between items-center px-1">
          <span className="text-slate-400 text-[10px] tracking-wider font-bold">ARC HYDRO-GOLD CORE</span>
          <span className={`text-[11px] font-bold ${goldFlowHue}`}>
            {btcTrend === 'up' ? '▲ HYPER-STABLE' : '● STABILIZED'}
          </span>
        </div>
        
        {/* Visual progress bar representing BTC Register integration and energy levels */}
        <div className="h-2 w-full bg-slate-950 rounded-full border border-slate-800/80 p-0.5 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-liquid-gold-dark via-liquid-gold to-liquid-gold-light rounded-full transition-all duration-1000 animate-gold-wave"
            style={{ 
              width: `${Math.min(100, Math.max(30, (btcPrice - 90000) / 100))}%`, 
              backgroundSize: '200% 100%' 
            }}
          />
        </div>

        {/* Dynamic telemetry details */}
        <div className="grid grid-cols-2 gap-4 mt-2 bg-slate-900/60 p-2 border border-slate-800/40 rounded-lg text-[10px]">
          <div>
            <span className="text-slate-500 font-bold tracking-wider">IONIC FLOW REFLUX</span>
            <div className="text-reactor-cyan font-bold text-[11px]">{isActive ? 'HIGH DISCHARGE' : `${intensity}% ENERGY`}</div>
          </div>
          <div>
            <span className="text-slate-500 font-bold tracking-wider">BTC BASELINE REFERENCE</span>
            <div className="text-white font-bold text-[11px]">
              ${btcPrice.toLocaleString()} 
              <span className={`ml-1 ${btcTrend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {btcTrend === 'up' ? '↗' : '↘'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
