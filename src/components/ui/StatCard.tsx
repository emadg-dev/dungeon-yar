import React from 'react';
import { Card } from './Card';

export interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string | number;
  modifier?: string | number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subValue,
  modifier,
  icon,
  onClick,
  className = '',
}) => {
  return (
    <Card
      variant="surface-2"
      padding="sm"
      interactive={Boolean(onClick)}
      onClick={onClick}
      className={`flex flex-col items-center justify-center text-center p-3 sm:p-4 rounded-xl relative ${className}`}
    >
      <span className="text-xs font-semibold text-text-muted mb-1">{label}</span>
      <div className="flex items-baseline justify-center gap-1 font-bold text-lg sm:text-xl text-text-primary">
        {icon && <span className="text-accent shrink-0 self-center">{icon}</span>}
        <span className="font-mono tabular-nums">{value}</span>
        {subValue !== undefined && (
          <span className="text-xs text-text-muted font-mono">/ {subValue}</span>
        )}
      </div>
      {modifier !== undefined && (
        <span className="text-xs font-mono font-bold text-accent mt-0.5">
          {typeof modifier === 'number' && modifier > 0 ? `+${modifier}` : modifier}
        </span>
      )}
    </Card>
  );
};
