import { NextResponse } from 'next/server';
import { isSafeRedirectPath } from './lib/security';

const ALLOWED_ORIGINS = new Set([
  'https://chronicle-magazine.vercel.app',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  ...(process.env.NEXT_PUBLIC_SITE_URL ? [process.env.NEXT_PUBLIC_SITE_URL.trim()] : []),
]);

const REDIRECT_PARAM_NAMES = [
  'redirect',
  'return',
  'returnUrl',
  'return_to',
  'next',
  'url',
  'dest',
  'destination',
  'continue',
];

const SSRF_BLOCK_PATTERNS = /169\.254\.\d+\.\d+|metadata\.google\.internal|127\.\d+\.\d+\.\d+|0\.0\.0\.0|\[::1\]|file:\/\/|gopher:\/\/|dict:\/\//i;

function isPrivateOrInternalHost(urlStr) {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'https:') return true;
    const host = parsed.hostname.toLowerCase();
    return (
      host === 'localhost' ||
      host.endsWith('.local') ||
      host.endsWith('.internal') ||
      host === '[::1]' ||
      /^127\./.test(host) ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^169\.254\./.test(host) ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host) ||
      /^0\./.test(host)
    );
  } catch {
    return true;
  }
}

export function middleware(request) {
  const { pathname, searchParams } = request.nextUrl;

  // 1. Block CVE-2025-29927 middleware subrequest header spoofing
  if (
    request.headers.has('x-middleware-subrequest') ||
    request.headers.has('x-middleware-invoke')
  ) {
    return new NextResponse(
      JSON.stringify({ error: 'Forbidden: Invalid request headers.' }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // 2. Block SSRF probes in URL or query string (e.g. 169.254.169.254 metadata endpoints)
  let decodedUrl = request.url || '';
  try {
    decodedUrl = decodeURIComponent(decodedUrl);
  } catch {
    // Ignore malformed percent encoding and inspect raw string
  }

  if (SSRF_BLOCK_PATTERNS.test(decodedUrl)) {
    return new NextResponse(
      JSON.stringify({ error: 'Bad Request: Disallowed target address.' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // 2b. Protect /_next/image optimizer against internal/private IP SSRF while allowing all valid public HTTPS hosts
  if (pathname === '/_next/image') {
    const imageUrl = searchParams.get('url');
    if (imageUrl && !imageUrl.startsWith('/') && isPrivateOrInternalHost(imageUrl)) {
      return new NextResponse(
        JSON.stringify({ error: 'Bad Request: Image URL must be a public HTTPS address.' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    return NextResponse.next();
  }

  // 3. Enforce Strict Origin / CORS Validation (Prevent Open CORS Access-Control-Allow-Origin: *)
  const origin = request.headers.get('origin');
  const isTrustedOrigin = !origin || ALLOWED_ORIGINS.has(origin);

  if (!isTrustedOrigin) {
    // Reject cross-origin preflight or data/API exfiltration requests from untrusted origins
    if (
      request.method === 'OPTIONS' ||
      pathname.startsWith('/_next/data') ||
      pathname.startsWith('/api/')
    ) {
      return new NextResponse(
        JSON.stringify({ error: 'CORS policy does not allow access from this origin.' }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            'Vary': 'Origin',
          },
        }
      );
    }
  }

  // 4. Prevent Open Redirect & URL Manipulation (?redirect=..., ?return=..., etc.)
  let strippedUnsafeRedirect = false;
  const sanitizedUrl = request.nextUrl.clone();

  for (const param of REDIRECT_PARAM_NAMES) {
    if (searchParams.has(param)) {
      const val = searchParams.get(param);
      if (!isSafeRedirectPath(val)) {
        sanitizedUrl.searchParams.delete(param);
        strippedUnsafeRedirect = true;
      }
    }
  }

  if (strippedUnsafeRedirect) {
    return NextResponse.redirect(sanitizedUrl, 307);
  }

  const response = NextResponse.next();

  // 5. Explicitly set strict CORS & Security Headers (override any wildcard *)
  const primaryOrigin = process.env.NEXT_PUBLIC_SITE_URL || 'https://chronicle-magazine.vercel.app';
  response.headers.set(
    'Access-Control-Allow-Origin',
    origin && ALLOWED_ORIGINS.has(origin) ? origin : primaryOrigin
  );
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Vary', 'Origin');

  // Hardened HTTP Security Headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  );
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), browsing-topics=()'
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths including /_next/image except static bundle files:
     */
    '/((?!_next/static|favicon.ico).*)',
  ],
};
