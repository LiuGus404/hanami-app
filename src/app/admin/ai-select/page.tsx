'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'

const assistants = [
  {
    name: '希希 Hibi',
    avatar: '/owlui.png',
    title: '任務管理者',
    personality: '溫柔冷靜、有條理，像一位每天提醒你喝水的朋友',
    tasks: '任務整合、代辦追蹤、模型派發中樞',
    model: 'llama3-custom'
  },
  {
    name: '語語 Lulu',
    avatar: '/foxcat.png',
    title: '語言魔法師',
    personality: '聰明伶俐、愛說話，喜歡幫你修飾文字與說故事',
    tasks: '文案潤色、多語翻譯、社群語氣轉換',
    model: 'gemma-2b'
  },
  {
    name: '策策 Taku',
    avatar: '/polarbear.png',
    title: '分析天才',
    personality: '安靜可靠、理性分析，像藏著大腦圖表的北極熊',
    tasks: '資料分析、圖表邏輯、數據轉文字解釋',
    model: 'deepseek-r1-8b'
  },
  {
    name: '米米 Mimi',
    avatar: '/Rabbit.png',
    title: '圖像理解專家',
    personality: '靈巧觀察、熱情好奇，擅長從圖片中找出細節、並說出故事',
    tasks: '幫你解讀截圖、分析圖片內容、結合文字與視覺的回答',
    model: 'llava-v1.6-7b'
  }
]

export default function SelectAssistantPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)

  const handleSelect = (modelId: string, name: string) => {
    setSelected(modelId)
    setTimeout(() => {
      router.push(`/admin/ai-hub?model=${modelId}&name=${encodeURIComponent(name)}`)
    }, 300)
  }

  return (
    <div className="min-h-screen bg-[#FFFCF2] p-6 font-['Quicksand',_sans-serif] text-[#2B3A3B]">
      <h1 className="text-3xl font-bold text-center mb-6">選擇你的 AI 小幫手</h1>
      <div className="space-y-6 max-w-md mx-auto">
        {assistants.map((a) => (
          <motion.div
            whileTap={{ scale: 0.95 }}
            key={a.name}
            className={`bg-white rounded-2xl shadow-md p-4 flex items-center gap-4 border-2 ${
              selected === a.model ? 'border-[#F7EDEB] bg-[#F7EDEB]' : 'border-transparent'
            }`}
          >
            <div className="w-20 h-20 relative flex items-center justify-center">
              <Image
                src={a.avatar}
                alt={a.name}
                width={64}
                height={64}
                className="object-contain max-w-full max-h-full rounded-xl"
              />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold">{a.name}</h2>
              <p className="text-sm text-[#7B6E5D]">{a.title}</p>
              <p className="text-sm mt-1">🧠 {a.personality}</p>
              <p className="text-sm mt-1">📌 {a.tasks}</p>
              <button
                onClick={() => handleSelect(a.model, a.name)}
                className={`mt-3 inline-flex items-center gap-1 px-4 py-1.5 rounded-full text-sm transition-all duration-200 ${
                  selected === a.model
                    ? 'bg-pink-100 text-pink-600 border border-pink-300 shadow-inner'
                    : 'bg-yellow-50 hover:bg-yellow-100 text-[#5A4A32] border border-yellow-300 shadow'
                }`}
              >
                {selected === a.model ? '🌟 已選擇' : '🧸 開始對話'}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}