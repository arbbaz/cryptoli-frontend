import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Next 16 uses top-level `turbopack`, not `experimental.turbo`.
  turbopack: {
    // Force Turbopack's workspace root to this app directory
    root: __dirname,
    resolveAlias: {
      'next-intl/config': './i18n/request.ts'
    }
  },
  webpack(config) {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'next-intl/config': path.resolve(process.cwd(), './i18n/request.ts')
    };
    return config;
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()'
          }
        ]
      }
    ];
  }
};

export default nextConfig;
