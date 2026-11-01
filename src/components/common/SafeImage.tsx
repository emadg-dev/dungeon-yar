/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

export interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string | null;
  alt: string;
  width?: number | string;
  height?: number | string;
  aspectRatio?: string;
  fallbackIcon?: React.ReactNode;
  containerClassName?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  width,
  height,
  aspectRatio,
  className = '',
  containerClassName = '',
  fallbackIcon,
  style,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-[#171513] text-[#A39A89] border border-[#2F2A23] ${containerClassName || className}`}
        style={{ width, height, aspectRatio, ...style }}
        role="img"
        aria-label={alt}
      >
        {fallbackIcon || <span className="text-[10px] text-[#A39A89] select-none">{alt.slice(0, 2)}</span>}
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden ${containerClassName}`}
      style={{ width, height, aspectRatio, ...style }}
    >
      {!isLoaded && (
        <div
          className="absolute inset-0 skeleton animate-pulse bg-[#201D19]"
          style={{ width: '100%', height: '100%' }}
        />
      )}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`${className} transition-opacity duration-200 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        {...props}
      />
    </div>
  );
};
