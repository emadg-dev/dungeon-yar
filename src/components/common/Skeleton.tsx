import React from 'react';

interface SkeletonProps {
  className?: string;
  count?: number;
  variant?: 'card' | 'row' | 'stat' | 'banner';
}

/**
 * Shimmer skeletons (Jib-be-jib §4): rounded-xl translucent blocks with a
 * soft amber sweep. Use `variant` for common layouts or `className` for one-offs.
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  count = 1,
  variant = 'card',
}) => {
  const items = Array.from({ length: count });

  if (variant === 'stat') {
    return <StatsCardSkeleton count={count} />;
  }

  if (variant === 'row') {
    return (
      <div className="space-y-2.5 animate-pulse">
        {items.map((_, i) => (
          <div key={i} className="skeleton h-16" />
        ))}
      </div>
    );
  }

  if (variant === 'banner') {
    return <div className="skeleton h-32" />;
  }

  return <CardSkeleton count={count} className={className} />;
};

/** Rounded card skeleton with a title bar + body block */
export const CardSkeleton: React.FC<{ count?: number; className?: string }> = ({
  count = 1,
  className = '',
}) => (
  <div className={`space-y-3 ${className}`}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="skeleton h-28 p-4 space-y-2.5">
        <div className="h-3.5 w-1/3 rounded-lg bg-[#E0A030]/10" />
        <div className="h-3 w-3/4 rounded-lg bg-white/5" />
        <div className="h-3 w-1/2 rounded-lg bg-white/5" />
      </div>
    ))}
  </div>
);

/** 2x2 / 4x1 stats grid skeleton (DM dashboard & character overview) */
export const StatsCardSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="skeleton h-20 p-3 space-y-2">
        <div className="h-2.5 w-1/2 rounded-md bg-[#E0A030]/10" />
        <div className="h-4 w-2/3 rounded-md bg-white/5" />
      </div>
    ))}
  </div>
);

/** Full-page loading skeleton */
export const PageSkeleton: React.FC = () => (
  <div className="space-y-4 p-2 animate-pulse" dir="rtl">
    <div className="skeleton h-28" />
    <StatsCardSkeleton />
    <div className="skeleton h-44" />
  </div>
);
