export const metadata = {
  title: 'Hanami Music',
  description: 'Hanami Music Web App',
  manifest: '/manifest.json',
  icons: {
    apple: [
      { url: '/icons/Hanami.png', sizes: '512x512', type: 'image/png' }
    ],
    other: [
      { url: '/icons/Hanami.png', sizes: '512x512', type: 'image/png' }
    ],
    shortcut: ['/icons/Hanami.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Hanami Music',
    startupImage: [
      '/icons/Hanami.png'
    ]
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false
  },
  themeColor: '#fffaf5',
} 