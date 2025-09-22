import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: '花見音樂教育 | 專業兒童音樂課程',
    template: '%s | 花見音樂教育',
  },
  description: '花見音樂教育 ｜專業兒童音樂課程 ｜Pre-K音樂啟蒙 ｜音樂錄音教材',
  keywords: ['兒童音樂課程', '音樂教育', 'Pre-K音樂', '音樂啟蒙', '兒童音樂班', '音樂錄音教材', '花見音樂'],
  openGraph: {
    type: 'website',
    locale: 'zh_TW',
    url: 'https://hanamiecho.com/music',
    title: '花見音樂教育 | 專業兒童音樂課程',
    description: '花見音樂教育 ｜專業兒童音樂課程 ｜Pre-K音樂啟蒙 ｜音樂錄音教材',
    siteName: '花見音樂教育',
  },
  twitter: {
    card: 'summary_large_image',
    title: '花見音樂教育 | 專業兒童音樂課程',
    description: '花見音樂教育 ｜專業兒童音樂課程 ｜Pre-K音樂啟蒙 ｜音樂錄音教材',
  },
};

export default function MusicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
