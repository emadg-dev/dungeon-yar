import React from 'react';

interface EntityCardProps {
  title: string;
  subtitle?: string;
  avatarUrl?: string;
  regionAccent?: string; // hex or CSS color
  rarityBorderColor?: string;
  badges?: React.ReactNode;
  stats?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  hasGoldTop?: boolean;
}

export const EntityCard: React.FC<EntityCardProps> = ({
  title,
  subtitle,
  avatarUrl,
  regionAccent,
  rarityBorderColor,
  badges,
  stats,
  actions,
  children,
  onClick,
  className = '',
  hasGoldTop = false,
}) => {
  return (
    <div
      onClick={onClick}
      className={`surface-card p-3.5 sm:p-4 flex flex-col justify-between transition-all duration-150 relative overflow-hidden ${
        hasGoldTop ? 'card-gold-top' : ''
      } ${onClick ? 'cursor-pointer hover:border-[#E0A030]/40 active:scale-[0.99]' : ''} ${className}`}
      style={{
        borderColor: rarityBorderColor || undefined,
        borderTopColor: regionAccent || undefined,
        borderTopWidth: regionAccent ? '3px' : undefined,
      }}
      dir="rtl"
    >
      {/* Region Accent Color Bar (if specified) */}
      {regionAccent && (
        <div
          className="absolute top-0 inset-x-0 h-1 pointer-events-none"
          style={{ backgroundColor: regionAccent }}
        />
      )}

      {/* Main Header Area */}
      <div>
        <div className="flex items-start justify-between gap-2.5 mb-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {avatarUrl && (
              <img
                src={avatarUrl}
                alt={title}
                loading="lazy"
                decoding="async"
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-[10px] object-cover border border-[#2F2A23] shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <h4 className="font-extrabold text-sm sm:text-base text-[#EDE6D8] truncate">{title}</h4>
              {subtitle && <p className="text-xs text-[#A39A89] truncate mt-0.5">{subtitle}</p>}
            </div>
          </div>

          {badges && <div className="flex items-center gap-1.5 flex-wrap shrink-0">{badges}</div>}
        </div>

        {/* Stats Row (HP, AC, CR, etc.) */}
        {stats && <div className="py-2 border-t border-[#2F2A23]/60 mb-2">{stats}</div>}

        {/* Custom Body / Description Content */}
        {children && <div className="text-xs text-[#A39A89] leading-relaxed mb-3">{children}</div>}
      </div>

      {/* Bottom Actions Bar */}
      {actions && (
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#2F2A23]/80">
          {actions}
        </div>
      )}
    </div>
  );
};
