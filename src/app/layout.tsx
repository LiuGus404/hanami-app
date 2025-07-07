import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import { cookies } from "next/headers";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Hanami 音樂教育 | 專業兒童音樂課程",
    template: "%s | Hanami 音樂教育"
  },
  description: "Hanami 音樂教育提供專業的兒童音樂課程，包括Pre-K音樂啟蒙、錄音教材等。讓孩子在快樂中學習音樂，培養藝術天賦。",
  keywords: ["兒童音樂課程", "音樂教育", "Pre-K音樂", "音樂啟蒙", "兒童音樂班", "音樂錄音教材"],
  authors: [{ name: "Hanami 音樂教育" }],
  creator: "Hanami 音樂教育",
  publisher: "Hanami 音樂教育",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://hanami-music.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'zh_TW',
    url: 'https://hanami-music.com',
    title: 'Hanami 音樂教育 | 專業兒童音樂課程',
    description: 'Hanami 音樂教育提供專業的兒童音樂課程，讓孩子在快樂中學習音樂，培養藝術天賦。',
    siteName: 'Hanami 音樂教育',
    images: [
      {
        url: '/icons/icon-512x512.png',
        width: 512,
        height: 512,
        alt: 'Hanami 音樂教育 Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hanami 音樂教育 | 專業兒童音樂課程',
    description: 'Hanami 音樂教育提供專業的兒童音樂課程，讓孩子在快樂中學習音樂，培養藝術天賦。',
    images: ['/icons/icon-512x512.png'],
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
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Hanami 音樂教育",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#FFF9F2",
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

  console.log("[RootLayout] 包裹 children:", children);

  return (
    <html lang="zh-TW">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#FFF9F2" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-192x192.png" />
        
        {/* 結構化資料 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "EducationalOrganization",
              "name": "Hanami 音樂教育",
              "description": "專業的兒童音樂教育機構，提供Pre-K音樂啟蒙課程",
              "url": "https://hanami-music.com",
              "logo": "https://hanami-music.com/icons/icon-512x512.png",
              "address": {
                "@type": "PostalAddress",
                "addressCountry": "TW"
              },
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer service"
              },
              "sameAs": []
            })
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProviderWrapper initialSession={userSession}>
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
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
