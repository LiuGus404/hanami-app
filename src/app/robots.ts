import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/login',
        '/teacher/login', 
        '/parent/login',
        '/api/',
        '/_next/',
        '/admin/account-test/',
        '/admin/button-showcase/',
        '/admin/test-permissions/',
      ],
    },
    sitemap: 'https://hanami-music.com/sitemap.xml',
  }
} 