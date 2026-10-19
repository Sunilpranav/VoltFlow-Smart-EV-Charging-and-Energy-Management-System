import React from 'react';

interface AnimatedProgressBarProps {
  value: number; // 0 to 100
  height?: string; // e.g. "h-2.5"
  showShimmer?: boolean;
  color?: 'blue' | 'emerald' | 'amber' | 'rose' | 'gradient';
  className?: string;
  label?: string;
  showPercent?: boolean;
}

export const AnimatedProgressBar: React.FC<AnimatedProgressBarProps> = ({
  value,
  height = 'h-2.5',
  showShimmer = true,
  color = 'gradient',
  className = '',
  label,
  showPercent = false,
}) => {
  const clamped = Math.min(100, Math.max(0, isNaN(value) ? 0 : value));

  const getColorClasses = () => {
    switch (color) {
      case 'emerald':
        return 'bg-emerald-500';
      case 'amber':
        return 'bg-amber-500';
      case 'rose':
        return 'bg-rose-500';
      case 'blue':
        return 'bg-blue-600';
      case 'gradient':
      default:
        return 'bg-gradient-to-r from-blue-600 via-sky-500 to-blue-400';
    }
  };

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {(label || showPercent) && (
        <div className="flex items-center justify-between text-xs font-semibold">
          {label && <span className="text-slate-600">{label}</span>}
          {showPercent && (
            <span className="font-mono text-slate-800 tabular-nums font-bold">
              {clamped.toFixed(0)}%
            </span>
          )}
        </div>
      )}
      <div className={`w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/80 p-0.5 ${height}`}>
        <div
          className={`${getColorClasses()} h-full rounded-full relative transition-all duration-700 ease-out`}
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={Math.round(clamped)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          {showShimmer && clamped > 0 && (
            <div className="absolute inset-0 bg-white/35 animate-shimmer rounded-full pointer-events-none" />
          )}
        </div>
      </div>
    </div>
  );
};

export default AnimatedProgressBar;
