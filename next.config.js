/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Configuración de imágenes
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },

  // Variables de entorno expuestas al cliente
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },

  // Configuración experimental
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Webpack config personalizado (si es necesario)
  webpack: (config, { isServer }) => {
    // Configuraciones personalizadas de webpack aquí
    return config;
  },
};

module.exports = nextConfig;
