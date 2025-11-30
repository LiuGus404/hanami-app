import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import './globals.css';
import './layout.css';
import { cookies } from 'next/headers';
import { Toaster } from 'react-hot-toast';

import SessionProviderWrapper from '@/components/SessionProviderWrapper';
import SaasProviderWrapper from '@/components/SaasProviderWrapper';
import LoadingScreen from '@/components/ui/LoadingScreen';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'HanamiEcho | 您的工作和成長夥伴 | 為您工作的AI團隊',
    template: '%s | HanamiEcho',
  },
  description: 'HanamiEcho ｜您的工作和成長夥伴 ｜為您工作的AI團隊｜智能AI助手，為兒童和成人提供個性化的協作體驗和情感支持',
  keywords: ['AI助手', '智能伙伴', '工作助手', '學習陪伴', '情感支持', '個性化AI', 'HanamiEcho', '兒童AI', '成人AI'],
  authors: [{ name: 'HanamiEcho' }],
  creator: 'HanamiEcho',
  publisher: 'HanamiEcho',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://hanamiecho.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'zh_TW',
    url: 'https://hanamiecho.com',
    title: 'HanamiEcho | 您的工作和成長夥伴 | 為您工作的AI團隊',
    description: 'HanamiEcho ｜您的工作和成長夥伴 ｜為您工作的AI團隊｜智能AI助手，為兒童和成人提供個性化的協作體驗和情感支持',
    siteName: 'HanamiEcho',
    images: [
      {
        url: '/favicon-192.png',
        width: 192,
        height: 192,
        alt: 'HanamiEcho Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HanamiEcho | 您的工作和成長夥伴 | 為您工作的AI團隊',
    description: 'HanamiEcho ｜您的工作和成長夥伴 ｜為您工作的AI團隊｜智能AI助手，為兒童和成人提供個性化的協作體驗和情感支持',
    images: ['/favicon-192.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'HanamiEcho',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#fcf6f2',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 獲取自定義會話
  const cookieStore = await cookies();
  const customSession = cookieStore.get('hanami_user_session')?.value;
  let userSession = null;

  if (customSession) {
    try {
      const sessionData = JSON.parse(customSession);
      // 檢查會話是否過期 (24小時)
      if (Date.now() - sessionData.timestamp < 24 * 60 * 60 * 1000) {
        userSession = sessionData.user;
      }
    } catch (error) {
      console.error('Error parsing custom session:', error);
    }
  }

  console.log('[RootLayout] 包裹 children:', children);

  return (
    <html lang="zh-TW">
      <head>
        {/* Favicon - 使用優化過的小尺寸 PNG */}
        <link rel="icon" type="image/png" sizes="192x192" href="/favicon-192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-32.png" />
        <link rel="shortcut icon" href="/favicon-32.png" />

        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon-180x180.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/apple-touch-icon-167x167.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/apple-touch-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/apple-touch-icon-120x120.png" />

        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#fcf6f2" />

        {/* 結構化資料 */}
        <script
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'TechArticle',
              'name': 'HanamiEcho',
              'description': 'HanamiEcho ｜您的工作和成長夥伴 ｜為您工作的AI團隊｜智能AI助手，為兒童和成人提供個性化的協作體驗和情感支持',
              'url': 'https://hanamiecho.com',
              'logo': 'https://hanamiecho.com/favicon-192.png',
              'address': {
                '@type': 'PostalAddress',
                'addressCountry': 'TW',
              },
              'contactPoint': {
                '@type': 'ContactPoint',
                'contactType': 'customer service',
              },
              'sameAs': [],
            }),
          }}
          type="application/ld+json"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <SessionProviderWrapper initialSession={userSession}>
          <SaasProviderWrapper>
            <LoadingScreen />
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#FFFDF8',
                  color: '#4B4036',
                  border: '1px solid #EADBC8',
                },
              }}
            />
          </SaasProviderWrapper>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
