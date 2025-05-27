export default function Head() {
    return (
      <>
        <title>Hanami Music</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon.png" />
        <meta name="apple-mobile-web-app-title" content="Hanami Music" />
        {/* 你也可以加 favicon 或其他 meta */}
      </>
    );
  }