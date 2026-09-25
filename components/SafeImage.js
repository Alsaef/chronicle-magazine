'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

const DEFAULT_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=80';

export default function SafeImage({
  src,
  alt,
  fallbackSrc = DEFAULT_FALLBACK_IMAGE,
  ...props
}) {
  const initialSrc = src && typeof src === 'string' && src.trim() ? src.trim() : fallbackSrc;
  const [imgSrc, setImgSrc] = useState(initialSrc);
  const [isUnoptimized, setIsUnoptimized] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const nextSrc = src && typeof src === 'string' && src.trim() ? src.trim() : fallbackSrc;
    setImgSrc(nextSrc);
    setIsUnoptimized(false);
    setHasError(false);
  }, [src, fallbackSrc]);

  const handleError = () => {
    // Stage 1: If /_next/image optimizer failed (e.g. blocked upstream fetch), retry loading directly in the browser
    if (!isUnoptimized) {
      setIsUnoptimized(true);
      return;
    }
    // Stage 2: If direct browser load also fails, fall back to default editorial cover
    if (!hasError && imgSrc !== fallbackSrc) {
      setHasError(true);
      setImgSrc(fallbackSrc);
      setIsUnoptimized(false);
    }
  };

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt || 'Chronicle Magazine biography portrait'}
      unoptimized={isUnoptimized}
      referrerPolicy="no-referrer"
      onError={handleError}
    />
  );
}
