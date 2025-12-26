import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '老師管理',
  description: 'Hanami 音樂教育老師管理系統 - 管理老師資訊、課程安排、薪資管理等',
  keywords: ['老師管理', '老師資訊', '課程安排', '薪資管理', 'Hanami 音樂教育'],
  openGraph: {
    title: '老師管理 | Hanami 音樂教育',
    description: '管理老師資訊、課程安排、薪資管理等',
  },
};

export default function TeachersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children;
}
































