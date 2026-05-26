import React, { useState } from 'react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fallbackSrc?: string;
  sizes?: string;
  /**
   * Whether this image is above the fold / a candidate for LCP.
   * If true, sets `loading="eager"` and `fetchpriority="high"`.
   */
  priority?: boolean;
}

const WIDTHS = [200, 400, 600, 800];

function buildUnsplashSrcSet(baseSrc: string): string {
  return WIDTHS.map(w => `${baseSrc}&fm=webp&q=75&w=${w} ${w}w`).join(', ');
}

/**
 * Detect whether a src is a local public/ asset we control (so we can serve
 * pre-generated WebP/AVIF variants alongside the JPG/PNG fallback).
 * Matches "/foo.jpg", "/foo.png" — not data: URLs, not http(s) remotes.
 */
function localAssetBase(src: string): string | null {
  if (!src.startsWith('/')) return null;
  const m = src.match(/^(.+)\.(jpg|jpeg|png)$/i);
  return m ? m[1] : null;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  fallbackSrc,
  sizes,
  className = '',
  priority = false,
  ...rest
}) => {
  const [hasError, setHasError] = useState(false);

  const isUnsplash = !hasError && src.includes('images.unsplash.com');
  const localBase = !hasError ? localAssetBase(src) : null;

  // Common <img> attrs (used in both branches below)
  const commonImgProps = {
    alt,
    width,
    height,
    loading: priority ? ('eager' as const) : ('lazy' as const),
    decoding: 'async' as const,
    // fetchpriority is a real HTML attribute but TS DOM lib lags behind
    ...(priority ? { fetchpriority: 'high' } : {}),
    className,
    onError: () => {
      if (!hasError) setHasError(true);
    },
    ...rest,
  };

  // -- Branch 1: local /public asset → serve <picture> with avif + webp + jpg
  if (localBase) {
    return (
      <picture>
        <source srcSet={`${localBase}.avif`} type="image/avif" />
        <source srcSet={`${localBase}.webp`} type="image/webp" />
        <img src={src} {...commonImgProps} />
      </picture>
    );
  }

  // -- Branch 2: Unsplash → existing query-param based optimization
  if (isUnsplash) {
    const optimizedSrc = `${src}&fm=webp&q=75${width ? `&w=${width}` : ''}`;
    return (
      <img
        src={optimizedSrc}
        srcSet={buildUnsplashSrcSet(src)}
        sizes={sizes || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'}
        {...commonImgProps}
      />
    );
  }

  // -- Branch 3: fallback path on error, or unknown remote → plain <img>
  const finalSrc = hasError && fallbackSrc ? fallbackSrc : src;
  return (
    <img src={finalSrc} {...commonImgProps} />
  );
};

export default OptimizedImage;
