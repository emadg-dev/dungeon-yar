import React from 'react';

interface SkeletonProps {
  className?: string;
  count?: number;
  variant?: 'card' | 'row' | 'stat' | 'banner';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  count = 1,
  variant = 'card',
}) => {
  const items = Array.from({ length: count });

  if (variant === 'stat') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-pulse">
        {items.map((_, i) => (
          <div key={i} className="h-20 surface-card bg-[#201D19]/40 border border-[#2F2A23]" />
        ))}
      </div>
    );
  }

  if (variant === 'row') {
    return (
      <div className="space-y-2.5 animate-pulse">
        {items.map((_, i) => (
          <div key={i} className="h-16 surface-card bg-[#201D19]/40 border border-[#2F2A23]" />
        ))}
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className="h-32 surface-card bg-[#201D19]/50 border border-[#2F2A23] animate-pulse" />
    );
  }

  return (
    <div className={`space-y-3 animate-pulse ${className}`}>
      {items.map((_, i) => (
        <div key={i} className="h-28 surface-card bg-[#201D19]/50 border border-[#2F2A23]" />
      ))}
    </div>
  );
};
