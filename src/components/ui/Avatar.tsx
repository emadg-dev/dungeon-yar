import React, { useState } from 'react';
import { User as UserIcon } from 'lucide-react';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  src?: string | null;
  alt: string;
  name?: string;
  size?: AvatarSize;
  shape?: 'circle' | 'square';
  className?: string;
}

const sizeStyles: Record<AvatarSize, string> = {
  xs: 'w-7 h-7 text-[10px]',
  sm: 'w-9 h-9 text-xs',
  md: 'w-11 h-11 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-lg',
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  name,
  size = 'md',
  shape = 'circle',
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);

  const roundedClass = shape === 'circle' ? 'rounded-full' : 'rounded-2xl';

  const initials = name
    ? name
        .trim()
        .split(' ')
        .slice(0, 2)
        .map((p) => p[0])
        .join('')
    : alt.slice(0, 2);

  return (
    <div
      className={`relative inline-flex items-center justify-center bg-stone-850 text-stone-200 border border-stone-800 shrink-0 font-bold overflow-hidden select-none shadow-md ${
        sizeStyles[size]
      } ${roundedClass} ${className}`}
    >
      {src && !hasError ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setHasError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <span>{initials || <UserIcon className="w-1/2 h-1/2 text-stone-400" />}</span>
      )}
    </div>
  );
};
