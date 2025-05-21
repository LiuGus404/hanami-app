export const metadata = {
  title: 'Hanami Web',
  description: 'Hanami Web Application',
  manifest: '/manifest.json',
  icons: {
    apple: [
      { url: '/icon/icon-192x192.png' },
      { url: '/icon/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: ['/icon/favicon.ico'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Hanami Web',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: '#FFFFFF',
} 