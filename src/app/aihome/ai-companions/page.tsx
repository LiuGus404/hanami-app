'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { SparklesIcon, AcademicCapIcon, PaintBrushIcon } from '@heroicons/react/24/outline';
import AppSidebar from '@/components/AppSidebar';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import Image from 'next/image';

interface AICompanion {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  specialty: string;
  icon: any;
  imagePath: string;
  personality: string;
  abilities: string[];
  color: string;
}

export default function AICompanionsPage() {
  const { user } = useSaasAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCompanion, setSelectedCompanion] = useState<AICompanion | null>(null);

  const companions: AICompanion[] = [
    {
      id: 'mori',
      name: '墨墨',
      nameEn: 'Mori',
      description: '一隻充滿智慧的貓頭鷹，專精於研究和學習',
      specialty: '研究專用',
      icon: AcademicCapIcon,
      imagePath: '/3d-character-backgrounds/studio/Mori/Mori.png',
      personality: '智慧、沉穩、博學',
      abilities: ['學術研究', '知識解答', '學習指導', '資料分析', '工作協助'],
      color: 'from-amber-400 to-orange-500'
    },
    {
      id: 'pico',
      name: '皮可',
      nameEn: 'Pico',
      description: '一隻熱愛繪畫創作的水瀨，專精於藝術創作',
      specialty: '繪圖專用',
      icon: PaintBrushIcon,
      imagePath: '/3d-character-backgrounds/studio/Pico/Pico.png',
      personality: '創意、活潑、藝術',
      abilities: ['繪畫創作', '視覺設計', '創意發想', '藝術指導', '工作設計'],
      color: 'from-blue-400 to-cyan-500'
    }
  ];

  const handleCompanionSelect = (companion: AICompanion) => {
    setSelectedCompanion(companion);
  };

  const handleStartChat = (companion: AICompanion) => {
    // TODO: 實現與AI伙伴的聊天功能
    console.log(`開始與 ${companion.name} 聊天`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#F8F5EC]">
      {/* 頂部導航欄 */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-[#EADBC8] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              {/* 選單按鈕 */}
              <motion.button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg hover:bg-[#FFD59A]/20 transition-colors relative z-40"
                title={sidebarOpen ? "關閉選單" : "開啟選單"}
              >
                <Bars3Icon className="w-6 h-6 text-[#4B4036]" />
              </motion.button>
              
              <div className="w-10 h-10 relative">
                <Image
                  src="/@hanami.png"
                  alt="HanamiEcho Logo"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#4B4036]">HanamiEcho</h1>
                <p className="text-sm text-[#2B3A3B]">兒童與成人的智能伙伴</p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* 側邊欄 */}
      <AppSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        currentPath="/aihome/ai-companions"
      />

      {/* 主要內容 */}
      <main className="px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* 頁面標題 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center mb-4">
              <SparklesIcon className="w-8 h-8 text-[#FFB6C1] mr-3" />
              <h1 className="text-4xl font-bold text-[#4B4036]">AI伙伴</h1>
            </div>
            <p className="text-lg text-[#2B3A3B] max-w-2xl mx-auto">
              AI伙伴是幫助您的工作和學習的智能助手，讓您的學習和工作更高效！
            </p>
          </motion.div>

          {/* AI伙伴卡片網格 */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {companions.map((companion, index) => (
              <motion.div
                key={companion.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="relative"
              >
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-[#EADBC8]">
                  {/* 角色圖片 */}
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${companion.color} p-1`}>
                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                          <Image
                            src={companion.imagePath}
                            alt={companion.name}
                            width={120}
                            height={120}
                            className="w-30 h-30 object-cover"
                          />
                        </div>
                      </div>
                      <div className="absolute -top-2 -right-2 bg-[#FFB6C1] rounded-full p-2">
                        <companion.icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* 角色資訊 */}
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-[#4B4036] mb-2">
                      {companion.name} ({companion.nameEn})
                    </h3>
                    <p className="text-[#2B3A3B] mb-3">{companion.description}</p>
                    <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r ${companion.color} text-white`}>
                      {companion.specialty}
                    </span>
                  </div>

                  {/* 個性特徵 */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-[#4B4036] mb-3">個性特徵</h4>
                    <p className="text-[#2B3A3B]">{companion.personality}</p>
                  </div>

                  {/* 能力列表 */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-[#4B4036] mb-3">專長能力</h4>
                    <div className="flex flex-wrap gap-2">
                      {companion.abilities.map((ability, abilityIndex) => (
                        <span
                          key={abilityIndex}
                          className="px-3 py-1 bg-[#F8F5EC] text-[#4B4036] rounded-full text-sm border border-[#EADBC8]"
                        >
                          {ability}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 互動按鈕 */}
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleCompanionSelect(companion)}
                      className="flex-1 px-4 py-3 bg-[#FFD59A] hover:bg-[#EBC9A4] text-[#4B4036] rounded-xl font-medium transition-colors"
                    >
                      了解更多
                    </button>
                    <button
                      onClick={() => handleStartChat(companion)}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] hover:from-[#FFA0B4] hover:to-[#EBC9A4] text-white rounded-xl font-medium transition-all"
                    >
                      開始對話
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* 使用說明 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white/50 backdrop-blur-sm rounded-2xl p-8 border border-[#EADBC8]"
          >
            <h2 className="text-2xl font-bold text-[#4B4036] mb-4 text-center">AI伙伴如何幫助您</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AcademicCapIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-[#4B4036] mb-2">學習研究助手</h3>
                <p className="text-[#2B3A3B]">墨墨幫助您進行學術研究，提供專業知識解答，提升學習效率</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PaintBrushIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-[#4B4036] mb-2">創作工作助手</h3>
                <p className="text-[#2B3A3B]">皮可幫助您進行藝術創作和視覺設計，提升工作效率和創意品質</p>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* 詳細資訊模態框 */}
      {selectedCompanion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#4B4036]">
                {selectedCompanion.name} 詳細介紹
              </h2>
              <button
                onClick={() => setSelectedCompanion(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              <div className="text-center">
                <div className="relative inline-block mb-4">
                  <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${selectedCompanion.color} p-1`}>
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                      <Image
                        src={selectedCompanion.imagePath}
                        alt={selectedCompanion.name}
                        width={80}
                        height={80}
                        className="w-20 h-20 object-cover"
                      />
                    </div>
                  </div>
                </div>
                <p className="text-[#2B3A3B] text-lg">{selectedCompanion.description}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[#4B4036] mb-3">個性特徵</h3>
                <p className="text-[#2B3A3B]">{selectedCompanion.personality}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[#4B4036] mb-3">專長能力</h3>
                <div className="grid grid-cols-2 gap-2">
                  {selectedCompanion.abilities.map((ability, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 bg-[#F8F5EC] text-[#4B4036] rounded-lg text-sm border border-[#EADBC8]"
                    >
                      {ability}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => {
                    setSelectedCompanion(null);
                    handleStartChat(selectedCompanion);
                  }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] hover:from-[#FFA0B4] hover:to-[#EBC9A4] text-white rounded-xl font-medium transition-all"
                >
                  開始對話
                </button>
                <button
                  onClick={() => setSelectedCompanion(null)}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-medium transition-colors"
                >
                  關閉
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
