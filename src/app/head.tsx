export default function Head() {
    return (
      <>
        <title>Hanami Music</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#fffaf5" />
        <meta name="description" content="Hanami Music - 讓我們一起陪孩子快樂成長" />
        
        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Safari/iOS specific */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Hanami Music" />
        
        {/* Icons for iOS */}
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180.png" />
        
        {/* Favicon */}
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icons/icon-512.png" />
        
        {/* Safari specific */}
        <link rel="mask-icon" href="/icons/icon-512.png" color="#fffaf5" />
        
        {/* Microsoft */}
        <meta name="msapplication-TileColor" content="#fffaf5" />
        <meta name="msapplication-TileImage" content="/icons/icon-144.png" />
      </>
    );
  }