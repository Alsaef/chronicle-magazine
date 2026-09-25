'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

const DEFAULT_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=80';

// Domains that block server-side Node/undici proxy fetches or use dynamic non-extension paths
const DIRECT_BROWSER_DOMAINS = [
  'wikia.nocookie.net',
  'fandom.com',
  'wikimedia.org',
  'wikipedia.org',
  'gstatic.com',
  'googleusercontent.com',
  'litci.org',
  'pmnewsnigeria.com',
  'fcbarcelona.com',
  'britannica.com',
  'ibb.co',
  'imgur.com',
];

function shouldBypassProxy(urlStr) {
  if (!urlStr || typeof urlStr !== 'string') return false;
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'https:') return true;
    const host = parsed.hostname.toLowerCase();
    if (DIRECT_BROWSER_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`))) {
      return true;
    }
    // Bypass proxy if pathname contains revision/thumbnail segments without ending in a standard image extension
    if (!/\.(jpe?g|png|webp|avif|gif)$/i.test(parsed.pathname) && !host.includes('unsplash.com')) {
      return true;
    }
    return false;
  } catch {
    return true;
  }
}

export default function SafeImage({
  src,
  alt,
  fallbackSrc = DEFAULT_FALLBACK_IMAGE,
  ...props
}) {
  const initialSrc = src && typeof src === 'string' && src.trim() ? src.trim() : fallbackSrc;
  const [imgSrc, setImgSrc] = useState(initialSrc);
  const [unoptimized, setUnoptimized] = useState(() => shouldBypassProxy(initialSrc));
  const [triedDirect, setTriedDirect] = useState(() => shouldBypassProxy(initialSrc));

  useEffect(() => {
    const nextSrc = src && typeof src === 'string' && src.trim() ? src.trim() : fallbackSrc;
    setImgSrc(nextSrc);
    const bypass = shouldBypassProxy(nextSrc);
    setUnoptimized(bypass);
    setTriedDirect(bypass);
  }, [src, fallbackSrc]);

  const handleError = () => {
    // Stage 1: If Next.js /_next/image optimizer failed, retry loading the original URL directly in the browser
    if (!triedDirect) {
      setTriedDirect(true);
      setUnoptimized(true);
      return;
    }
    // Stage 2: If direct browser load also failed, fall back to the default editorial cover image
    if (imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
      setUnoptimized(false);
    }
  };

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt || 'Chronicle Magazine biography portrait'}
      unoptimized={unoptimized}
      referrerPolicy="no-referrer"
      onError={handleError}
    />
  );
}
