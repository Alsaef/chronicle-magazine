/**
 * Security utilities for URL validation, Open Redirect prevention, and SSRF protection.
 */

const BASE_INTERNAL_ORIGIN = 'https://chronicle-magazine.vercel.app';

/**
 * Checks whether a redirect target is strictly a safe internal relative path.
 * Rejects protocol-relative URLs (//evil.com), backslash bypasses (/\evil.com),
 * external schemes (http:, https:, javascript:, data:), and control characters.
 */
export function isSafeRedirectPath(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return false;
  }

  const trimmed = rawUrl.trim();

  // Must begin with a single forward slash and NOT '//' or '/\'
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return false;
  }

  // Reject control characters, backslashes, or scheme colons in the path prefix
  if (/[\x00-\x1f\\]/.test(trimmed) || /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return false;
  }

  try {
    const parsed = new URL(trimmed, BASE_INTERNAL_ORIGIN);
    if (parsed.origin !== BASE_INTERNAL_ORIGIN) {
      return false;
    }
    if (parsed.pathname.startsWith('//') || parsed.pathname.startsWith('/\\')) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns a sanitized internal redirect path, or the provided fallback if unsafe.
 */
export function getSafeRedirectPath(rawUrl, fallback = '/profile') {
  if (!isSafeRedirectPath(rawUrl)) {
    return fallback;
  }
  const parsed = new URL(rawUrl.trim(), BASE_INTERNAL_ORIGIN);
  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}
