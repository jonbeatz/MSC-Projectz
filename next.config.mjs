import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  /** Browsers still request /favicon.ico; forward to the same mark as app metadata (./media via /media/… route). */
  async rewrites() {
    return [
      {
        source: '/favicon.ico',
        destination: '/media/msc-icon.png',
      },
    ]
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      /** Vault thumbnails + reference files are posted via Server Actions (`msc_*` actions) */
      bodySizeLimit: '20mb',
    },
    /** Request bodies to the app (incl. Payload REST proxy paths) */
    proxyClientMaxBodySize: '20mb',
  },
}

export default withPayload(nextConfig)
