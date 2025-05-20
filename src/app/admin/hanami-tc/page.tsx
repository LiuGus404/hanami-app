'use client'

import { useRouter } from 'next/navigation'
import HanamiTC from '@/components/ui/HanamiTC'

export default function HanamiTCPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#FFFCEB] font-['Quicksand',_sans-serif] px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl p-6 mb-6 border border-[#EADBC8]">
          <h1 className="text-2xl font-bold text-[#2B3A3B] mb-6">課堂管理</h1>
          <HanamiTC />
        </div>
      </div>
    </div>
  )
} 