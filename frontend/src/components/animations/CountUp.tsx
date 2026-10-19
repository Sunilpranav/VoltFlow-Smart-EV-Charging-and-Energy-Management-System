import React, { useEffect, useState, useRef } from 'react';

interface CountUpProps {
  value?: number;
  end?: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export const CountUp: React.FC<CountUpProps> = ({
  value,
  end,
  duration = 800,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
}) => {
  const numericTarget = end !== undefined ? end : (value ?? 0);
  const [displayValue, setDisplayValue] = useState<number>(() => (isNaN(numericTarget) ? 0 : numericTarget));
  const prevValueRef = useRef<number>(numericTarget);
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // If numericTarget is not a valid finite number, fallback
    const targetVal = (typeof numericTarget === 'number' && isFinite(numericTarget) && !isNaN(numericTarget)) ? numericTarget : 0;

    // Check prefers-reduced-motion
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      animationFrameRef.current = requestAnimationFrame(() => {
        setDisplayValue(targetVal);
        prevValueRef.current = targetVal;
      });
      return;
    }

    const startVal = prevValueRef.current;
    const endVal = targetVal;

    // If starting and ending values are identical, no need to animate
    if (startVal === endVal) {
      return;
    }

    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      
      // Ease out cubic: 1 - pow(1 - progress, 3)
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (endVal - startVal) * easeProgress;

      setDisplayValue(current);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endVal);
        prevValueRef.current = endVal;
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [numericTarget, duration]);

  const formatted = displayValue.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span className={`tabular-nums ${className}`}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
};

export default CountUp;
