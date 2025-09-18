import createNextIntlPlugin from 'next-intl/plugin';
import {withContentlayer} from 'next-contentlayer';

const withNextIntl = createNextIntlPlugin('./lib/i18n.ts');

const cspDirectives = [
  "default-src 'self'",
  "frame-ancestors 'none'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://images.unsplash.com",
  "font-src 'self' data:",
  "connect-src 'self' https://plausible.io https://hcaptcha.com https://*.hcaptcha.com https://challenges.cloudflare.com",
  "frame-src https://hcaptcha.com https://*.hcaptcha.com https://challenges.cloudflare.com",
  "script-src 'self' 'unsafe-inline' https://plausible.io"
];

const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'geolocation=(), microphone=(), camera=(), interest-cohort=()'
  },
  {
    key: 'Content-Security-Policy',
    value: cspDirectives.join('; ')
  }
];

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true
  },
  images: {
    formats: ['image/avif', 'image/webp']
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders
      }
    ];
  }
};

export default withContentlayer(withNextIntl(nextConfig));
