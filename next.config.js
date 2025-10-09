/** @type {import('next').NextConfig} */
const nextConfig = {
  // 圖片優化配置
  images: {
    domains: [
      'localhost',
      'hanami-music.com',
      'supabase.co',
      'laowyqplcthwqckyigiy.supabase.co', // SaaS Supabase 域名
      'rvdvdfoyemsikuwqexhv.supabase.co', // 主要 Supabase 域名
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
      {
        source: '/hanami-music',
        destination: '/aihome/course-activities/hanami-music',
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
    // 主要 Supabase 配置 (hanami-ai-system)
    NEXT_PUBLIC_SUPABASE_URL: 'https://rvdvdfoyemsikuwqexhv.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2ZHZkZm95ZW1zaWt1d3FleGh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3NDQyMTIsImV4cCI6MjA2MTMyMDIxMn0.JfWxvb-uOPwg296uYvy7xks3sCzG_TEJoQmrvPofrJ4',
    SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_uRpGpWYB5Wi6DP02aiFTYA_5aNz5Naq',
    // SAAS 專案 Supabase 配置 (hanami-saas-system)
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
  
  // Content Security Policy 配置 - 修復 Airwallex 資源載入問題
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.airwallex.com https://static.airwallex.com https://js.stripe.com https://*.airwallex.com https://challenges.cloudflare.com",
              "style-src 'self' 'unsafe-inline' https://checkout.airwallex.com https://static.airwallex.com https://*.airwallex.com",
              "img-src 'self' data: https: blob: https://*.airwallex.com",
              "font-src 'self' data: https: https://*.airwallex.com",
              "connect-src 'self' https://api.airwallex.com https://checkout.airwallex.com https://static.airwallex.com https://o11y.airwallex.com https://*.airwallex.com https://laowyqplcthwqckyigiy.supabase.co https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com",
              "frame-src 'self' https://checkout.airwallex.com https://js.stripe.com https://*.airwallex.com https://challenges.cloudflare.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self' https://checkout.airwallex.com https://*.airwallex.com",
              "frame-ancestors 'none'"
            ].join('; ')
          }
        ]
      }
    ]
  },
  
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