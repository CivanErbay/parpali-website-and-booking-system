import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

/**
 * Embedding policy (ADR-0012/0013): the /embed widget is iframe-embeddable —
 * allowed framers come from EMBED_ALLOWED_ORIGINS (space-separated), default
 * open. Every other route stays SAMEORIGIN to prevent clickjacking.
 */
const embedOrigins = process.env.EMBED_ALLOWED_ORIGINS?.trim()
const frameAncestors = embedOrigins ? `'self' ${embedOrigins}` : '*'

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'eu-assets.i.posthog.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/embed/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: `frame-ancestors ${frameAncestors};` },
        ],
      },
      {
        // Everything except /embed keeps the clickjacking guard.
        source: '/((?!embed).*)',
        headers: [{ key: 'X-Frame-Options', value: 'SAMEORIGIN' }],
      },
    ]
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
