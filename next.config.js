/** @type {import('next').NextConfig} */
const nextConfig = {
  // 圖片優化配置
  images: {
    domains: [
      'localhost',
      'hanami-music.com',
      'supabase.co',
      'avatars.githubusercontent.com',
      'lh3.googleusercontent.com',
      'platform-lookaside.fbsbx.com',
      'graph.facebook.com'
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  
  // 重定向配置
  async redirects() {
    return [
      {
        source: '/teacher',
        destination: '/teacher/dashboard',
        permanent: true,
      },
      {
        source: '/parent',
        destination: '/parent/dashboard',
        permanent: true,
      },
    ];
  },
  
  // Webpack 配置
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // 處理 SVG 文件
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    
    return config;
  },
  
  // 環境變數
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
    // SAAS 專案 Supabase 配置
    NEXT_PUBLIC_SUPABASE_SAAS_URL: 'https://laowyqplcthwqckyigiy.supabase.co',
    NEXT_PUBLIC_SUPABASE_SAAS_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxhb3d5cXBsY3Rod3Fja3lpZ2l5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczMDE0MjYsImV4cCI6MjA3Mjg3NzQyNn0.LU37G9rZSBP5_BoAGQ_1QncFS2wemcI1w2J-wZzC-cI',
    SUPABASE_SAAS_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxhb3d5cXBsY3Rod3Fja3lpZ2l5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzMwMTQyNiwiZXhwIjoyMDcyODc3NDI2fQ.B2z_5vPpMJi8FAwlrsYd-KLLfKD-gt0Qv_9qvpMmQkk'
  },
  
  // 壓縮配置
  compress: true,
  
  // 電源效率
  poweredByHeader: false,
  
  // 嚴格模式
  reactStrictMode: true,
  
  // 類型檢查
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // ESLint 配置
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // 調試配置
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
};

module.exports = nextConfig;