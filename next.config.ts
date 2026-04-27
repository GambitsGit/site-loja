import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone', // Necessário para Docker
  images: {
    remotePatterns: [
      {
        // Permite imagens do Supabase Storage
        protocol: 'https',
        hostname: 'abqqsirqalwsxbmcsigt.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    formats: ['image/avif', 'image/webp'], // Formatos modernos mais eficientes
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 dias de cache
  },
}

export default nextConfig
