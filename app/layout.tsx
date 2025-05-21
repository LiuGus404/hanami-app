export const metadata = {
  title: 'Hanami Web',
  description: 'Hanami Web Application',
  manifest: '/manifest.json',
  icons: {
    apple: [
      { url: '/icon/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icon/icon-144x144.png', sizes: '144x144', type: 'image/png' },
      { url: '/icon/icon-128x128.png', sizes: '128x128', type: 'image/png' },
      { url: '/icon/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon/icon-384x384.png', sizes: '384x384', type: 'image/png' },
      { url: '/icon/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    other: [
      { url: '/icon/icon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/icon/icon-72x72.png', sizes: '72x72', type: 'image/png' },
    ],
    shortcut: ['/icon/favicon.ico'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Hanami Web',
    startupImage: [
      '/icon/icon-512x512.png'
    ]
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false
  },
  themeColor: '#FFFFFF',
} 