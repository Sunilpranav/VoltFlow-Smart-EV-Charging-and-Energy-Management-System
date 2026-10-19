import React from 'react';

interface EnergyFlowProps {
  active?: boolean;
  powerKw?: number;
  fromLabel?: string;
  toLabel?: string;
  className?: string;
}

export const EnergyFlow: React.FC<EnergyFlowProps> = ({
  active = true,
  powerKw = 50,
  fromLabel = 'EVSE Supercharger',
  toLabel = 'Vehicle Battery',
  className = '',
}) => {
  return (
    <div className={`relative p-5 rounded-2xl bg-gradient-to-r from-blue-950 via-slate-900 to-sky-950 border border-blue-500/30 overflow-hidden text-white shadow-xl ${className}`}>
      {/* Ambient background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-600/15 via-transparent to-transparent pointer-events-none" />

      {/* Top Status Header */}
      <div className="flex items-center justify-between text-xs mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-mono text-cyan-300 font-bold uppercase tracking-wider text-[11px]">
            Energy Conduit Active
          </span>
        </div>
        <div className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-200">
          {active ? `${powerKw} kW Live Transfer` : 'Standby'}
        </div>
      </div>

      {/* Flowing SVG Line and Nodes */}
      <div className="relative z-10 py-2">
        <svg viewBox="0 0 400 60" className="w-full h-14 overflow-visible" fill="none">
          <defs>
            {/* Linear gradient for energetic beam */}
            <linearGradient id="energyBeamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>

            {/* Glowing filter */}
            <filter id="energyGlow" x="-20%" y="-50%" width="140%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#38bdf8" floodOpacity="0.8" />
            </filter>
          </defs>

          {/* Background conduit path */}
          <path
            d="M 30 30 Q 200 15 370 30"
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth="6"
            strokeLinecap="round"
          />

          {/* Animated Electric Dashes */}
          {active && (
            <path
              d="M 30 30 Q 200 15 370 30"
              stroke="url(#energyBeamGrad)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="10 14"
              filter="url(#energyGlow)"
              className="animate-electric-flow"
            />
          )}

          {/* Moving Energy Photon Particles */}
          {active && (
            <>
              <circle r="4" fill="#67e8f9" filter="url(#energyGlow)">
                <animateMotion
                  path="M 30 30 Q 200 15 370 30"
                  dur="1.8s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle r="3" fill="#a7f3d0" filter="url(#energyGlow)">
                <animateMotion
                  path="M 30 30 Q 200 15 370 30"
                  dur="1.8s"
                  begin="0.9s"
                  repeatCount="indefinite"
                />
              </circle>
            </>
          )}

          {/* Start Node: Charger */}
          <circle cx="30" cy="30" r="12" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="2" />
          <circle cx="30" cy="30" r="5" fill="#38bdf8" className={active ? 'animate-ping' : ''} />
          <text x="30" y="34" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">⚡</text>

          {/* End Node: EV Battery */}
          <circle cx="370" cy="30" r="12" fill="#064e3b" stroke="#34d399" strokeWidth="2" />
          <circle cx="370" cy="30" r="5" fill="#10b981" />
          <text x="370" y="34" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">🔋</text>
        </svg>

        {/* Labels under nodes */}
        <div className="flex justify-between text-[11px] font-mono text-slate-300 mt-1">
          <span className="flex items-center gap-1 font-semibold text-blue-200">
            <span>{fromLabel}</span>
          </span>
          <span className="text-slate-400 text-[10px] hidden sm:inline">Ultra-Fast CC/CV Phase</span>
          <span className="flex items-center gap-1 font-semibold text-emerald-300">
            <span>{toLabel}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default EnergyFlow;
