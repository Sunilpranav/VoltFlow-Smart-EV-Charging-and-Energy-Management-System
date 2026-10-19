import React from 'react';

interface SkeletonProps {
  className?: string;
  rounded?: 'rounded' | 'rounded-lg' | 'rounded-xl' | 'rounded-2xl' | 'rounded-full';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = 'h-4 w-full',
  rounded = 'rounded-xl',
}) => {
  return (
    <div
      className={`skeleton-shimmer border border-slate-200/50 ${rounded} ${className}`}
      aria-hidden="true"
    />
  );
};

export const MetricCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-8 rounded-xl" />
      </div>
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-3 w-40" />
    </div>
  );
};

export default Skeleton;
