import React, { useMemo } from 'react';

interface ChargingRingProps {
  percentage?: number; // 0 to 100
  kwh: number;
  powerKw?: number;
  status: 'CHARGING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | string;
  size?: number;
  strokeWidth?: number;
  subLabel?: string;
}

export const ChargingRing: React.FC<ChargingRingProps> = ({
  percentage = 0,
  kwh,
  powerKw = 50,
  status,
  size = 280,
  strokeWidth = 14,
  subLabel = 'kWh Delivered',
}) => {
  const isCharging = status === 'CHARGING';
  const isCompleted = status === 'COMPLETED';
  const isFailed = status === 'FAILED' || status === 'CANCELLED';

  const clampedPercent = Math.min(100, Math.max(0, percentage));
  const center = size / 2;
  const radius = center - strokeWidth - 12; // Leave room for outer tick marks
  const circumference = 2 * Math.PI * radius;

  // If charging but percentage is 0 (meter-based session), calculate dynamic visual percent based on delivered energy
  const visualPercent = clampedPercent > 0 ? clampedPercent : (isCharging ? Math.min(95, Math.max(8, (kwh / 60) * 100)) : 100);
  const strokeDashoffset = circumference - (visualPercent / 100) * circumference;

  // Determine theme colors based on session status
  const primaryColor = isCompleted ? '#10b981' : isFailed ? '#ef4444' : '#2563eb';
  const secondaryColor = isCompleted ? '#059669' : isFailed ? '#dc2626' : '#0284c7';
  const glowColor = isCompleted ? 'rgba(16, 185, 129, 0.45)' : isFailed ? 'rgba(239, 68, 68, 0.35)' : 'rgba(37, 99, 235, 0.5)';

  // Calculate tip position of the progress arc for the glowing photon head
  // Arc starts at -90deg (top). Progress angle in radians:
  const progressAngleDeg = -90 + (visualPercent / 100) * 360;
  const progressAngleRad = (progressAngleDeg * Math.PI) / 180;
  const headX = center + radius * Math.cos(progressAngleRad);
  const headY = center + radius * Math.sin(progressAngleRad);

  // Generate 60 chronograph tick marks
  const tickMarks = useMemo(() => {
    const ticks = [];
    const tickCount = 60;
    const outerR = center - 2;
    const innerR = center - 8;

    for (let i = 0; i < tickCount; i++) {
      const angleDeg = (i / tickCount) * 360 - 90;
      const angleRad = (angleDeg * Math.PI) / 180;
      const x1 = center + innerR * Math.cos(angleRad);
      const y1 = center + innerR * Math.sin(angleRad);
      const x2 = center + outerR * Math.cos(angleRad);
      const y2 = center + outerR * Math.sin(angleRad);

      const tickPercent = (i / tickCount) * 100;
      const isLit = tickPercent <= visualPercent;
      const isMajor = i % 5 === 0;

      ticks.push({
        id: i,
        x1,
        y1,
        x2,
        y2,
        isLit,
        isMajor,
      });
    }
    return ticks;
  }, [center, visualPercent]);

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={Math.round(visualPercent)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Charging progress: ${kwh.toFixed(2)} kWh`}
    >
      {/* Outer ambient pulsing glow aura */}
      <div
        className={`absolute inset-3 rounded-full pointer-events-none transition-all duration-1000 ${
          isCharging ? 'animate-pulse-ring' : ''
        }`}
        style={{
          boxShadow: isCharging ? `0 0 55px -6px ${glowColor}` : isCompleted ? '0 0 40px -8px rgba(16, 185, 129, 0.4)' : 'none',
        }}
      />

      {/* Rotating faint electric ring backdrop */}
      {isCharging && (
        <div
          className="absolute inset-4 rounded-full border border-cyan-400/25 border-dashed animate-spin-slow pointer-events-none"
        />
      )}

      {/* SVG Meter with Chronograph Ticks and Arc */}
      <svg
        width={size}
        height={size}
        className="relative z-10 overflow-visible"
      >
        <defs>
          {/* Active Charging Linear/Angular Gradient */}
          <linearGradient id="voltExtremeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor={primaryColor} />
            <stop offset="100%" stopColor={secondaryColor} />
          </linearGradient>

          {/* Electric Glow Filter */}
          <filter id="voltExtremeGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#38bdf8" floodOpacity="0.8" />
          </filter>
        </defs>

        {/* 60 Chronograph Radial Ticks */}
        <g opacity="0.85">
          {tickMarks.map((tick) => (
            <line
              key={tick.id}
              x1={tick.x1}
              y1={tick.y1}
              x2={tick.x2}
              y2={tick.y2}
              stroke={
                tick.isLit
                  ? isCompleted
                    ? '#10b981'
                    : isFailed
                    ? '#f87171'
                    : '#0284c7'
                  : '#cbd5e1'
              }
              strokeWidth={tick.isMajor ? (tick.isLit ? 2.5 : 2) : 1.2}
              strokeLinecap="round"
              className="transition-colors duration-300"
            />
          ))}
        </g>

        {/* Inactive Background Track (-90deg rotated) */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={isCompleted ? '#d1fae5' : isFailed ? '#fee2e2' : '#f1f5f9'}
          strokeWidth={strokeWidth}
          className="transition-colors duration-500"
        />

        {/* Secondary subtle energy trace track */}
        {isCharging && (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(37, 99, 235, 0.15)"
            strokeWidth={strokeWidth + 6}
            className="animate-pulse"
          />
        )}

        {/* Active Progress Foreground Track */}
        <g transform={`rotate(-90 ${center} ${center})`}>
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="url(#voltExtremeGradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            filter={isCharging ? 'url(#voltExtremeGlow)' : undefined}
            style={{
              transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        </g>

        {/* Orbiting Energetic Photon Particle at tip of arc */}
        {isCharging && visualPercent > 0 && (
          <g>
            <circle
              cx={headX}
              cy={headY}
              r={strokeWidth / 2 + 2}
              fill="#ffffff"
              filter="url(#voltExtremeGlow)"
            />
            <circle
              cx={headX}
              cy={headY}
              r={strokeWidth / 2 - 1}
              fill="#38bdf8"
              className="animate-ping"
            />
          </g>
        )}
      </svg>

      {/* Center Digital Cockpit Information */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-20 px-4">
        {/* Animated Icon / Checkmark */}
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-1.5 transition-all duration-500 ${
            isCharging
              ? 'bg-gradient-to-tr from-blue-600 to-sky-500 text-white shadow-lg shadow-blue-500/35 animate-energy'
              : isCompleted
              ? 'bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-lg shadow-emerald-500/35 animate-scale-in'
              : 'bg-rose-600 text-white shadow-lg shadow-rose-500/30'
          }`}
        >
          {isCharging ? (
            <svg className="w-6 h-6 fill-current animate-pulse" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          ) : isCompleted ? (
            <svg className="w-6 h-6 stroke-current fill-none stroke-[2.5]" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-6 h-6 stroke-current fill-none stroke-2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>

        {/* Live Energy Delivery / Status Readout */}
        <div className="space-y-0.5">
          <div className="text-3xl font-black font-mono tracking-tight text-slate-900 tabular-nums">
            {kwh.toFixed(2)}
          </div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
            {subLabel}
          </div>
        </div>

        {/* Dynamic Energy Waveform (Sine wave undulating while charging) */}
        {isCharging && (
          <div className="mt-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50/90 border border-blue-200/80 shadow-xs">
            {/* 4 Equalizer pulse bars */}
            <div className="flex items-end gap-0.5 h-3">
              <span className="w-0.5 bg-blue-600 rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-2" />
              <span className="w-0.5 bg-blue-600 rounded-full animate-[pulse_0.8s_ease-in-out_infinite] h-3" />
              <span className="w-0.5 bg-sky-500 rounded-full animate-[pulse_0.5s_ease-in-out_infinite] h-1.5" />
              <span className="w-0.5 bg-cyan-400 rounded-full animate-[pulse_0.7s_ease-in-out_infinite] h-2.5" />
            </div>
            <span className="text-[10px] font-mono font-bold text-blue-700">
              {powerKw} kW Rate
            </span>
          </div>
        )}

        {isCompleted && (
          <div className="mt-2 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Session Complete
          </div>
        )}
      </div>
    </div>
  );
};

export default ChargingRing;
