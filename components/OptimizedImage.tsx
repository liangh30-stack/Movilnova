import React, { useState } from 'react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fallbackSrc?: string;
  sizes?: string;
}

const WIDTHS = [200, 400, 600, 800];

function buildUnsplashSrcSet(baseSrc: string): string {
  return WIDTHS.map(w => `${baseSrc}&fm=webp&q=75&w=${w} ${w}w`).join(', ');
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  fallbackSrc,
  sizes,
  className = '',
  ...rest
}) => {
  const [hasError, setHasError] = useState(false);

  const isUnsplash = !hasError && src.includes('images.unsplash.com');

  const optimizedSrc = isUnsplash
    ? `${src}&fm=webp&q=75${width ? `&w=${width}` : ''}`
    : hasError && fallbackSrc
      ? fallbackSrc
      : src;

  return (
    <img
      src={optimizedSrc}
      srcSet={isUnsplash ? buildUnsplashSrcSet(src) : undefined}
      sizes={isUnsplash ? (sizes || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw') : undefined}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      className={className}
      onError={() => {
        if (!hasError) setHasError(true);
      }}
      {...rest}
    />
  );
};

export default OptimizedImage;
