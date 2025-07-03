import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '學生管理',
  description: 'Hanami 音樂教育學生管理系統 - 管理常規學生、試堂學生、查看學生資訊、課程安排等',
  keywords: ['學生管理', '常規學生', '試堂學生', '課程安排', '學生資訊', 'Hanami 音樂教育'],
  openGraph: {
    title: '學生管理 | Hanami 音樂教育',
    description: '管理常規學生、試堂學生、查看學生資訊、課程安排等',
  }
}

export default function StudentsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 