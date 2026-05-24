import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

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
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
