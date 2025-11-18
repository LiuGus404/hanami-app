'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  SparklesIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ChartBarIcon,
  CalendarIcon,
  DocumentTextIcon,
  ArrowRightIcon,
  BuildingOffice2Icon,
  PlusIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import { HanamiButton } from '@/components/ui/HanamiButton';

interface OrganizationOnboardingPageProps {
  onCreateOrganization: () => void;
  onJoinOrganization: () => void;
}

export function OrganizationOnboardingPage({
  onCreateOrganization,
  onJoinOrganization,
}: OrganizationOnboardingPageProps) {
  const router = useRouter();
  // 重點推薦功能（放在最前面）
  const featuredFeatures = [
    {
      icon: SparklesIcon,
      title: 'AI 多角色智能助手',
      description: 'Hibi、墨墨、皮可等多個 AI 角色協助教學規劃、學習分析和創意設計，讓教學更智能',
      iconPath: '/icons/penguin-face.PNG',
      highlight: true,
    },
    {
      icon: ChartBarIcon,
      title: '自由畫布學習路徑',
      description: '視覺化學習路徑設計，自由拖拽節點，創建個性化學習旅程，讓每個學生都能找到最適合的成長路徑',
      iconPath: '/icons/elephant.PNG',
      highlight: true,
    },
  ];

  // 其他功能
  const otherFeatures = [
    {
      icon: UserGroupIcon,
      title: '學生管理',
      description: '輕鬆管理學生資料、課程記錄和學習進度',
      iconPath: '/icons/bear-face.PNG',
    },
    {
      icon: CalendarIcon,
      title: '課程排程',
      description: '智能排課系統，自動優化課程安排',
      iconPath: '/icons/clock.PNG',
    },
    {
      icon: ChartBarIcon,
      title: '學習追蹤',
      description: '詳細的學習進度分析和能力評估',
      iconPath: '/icons/elephant.PNG',
    },
    {
      icon: DocumentTextIcon,
      title: '教案管理',
      description: '建立和管理您的教學資源庫',
      iconPath: '/icons/book-elephant.PNG',
    },
    {
      icon: AcademicCapIcon,
      title: '教師協作',
      description: '與團隊成員共享資源和協作教學',
      iconPath: '/icons/music.PNG',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFF3E6] to-[#FFE1F0]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-10">
        {/* 主標題區域 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-[32px] border border-white/60 bg-gradient-to-br from-white/80 via-[#FFEFE2] to-[#FFE4F5] shadow-[0_32px_80px_rgba(228,192,155,0.35)]"
        >
          <div className="absolute -right-14 top-10 h-48 w-48 rounded-full bg-white/40 blur-2xl" aria-hidden="true" />
          <div className="absolute -bottom-16 left-10 h-40 w-40 rounded-full bg-[#FFD6E7]/60 blur-3xl" aria-hidden="true" />
          <div className="relative grid gap-8 px-8 py-10 lg:grid-cols-[3fr_2fr]">
            <div className="space-y-4 text-[#4B4036]">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-[#D48347] shadow-sm">
                歡迎來到 HanamiEcho
              </span>
              <h1 className="text-3xl font-extrabold leading-snug tracking-wide lg:text-4xl">
                創建您的專屬課程平台
              </h1>
              <p className="text-sm leading-relaxed text-[#6E5A4A] lg:text-base">
                使用 Hanami 智能教學管理系統，打造屬於您的專業教育機構。整合學生管理、課程排程、學習追蹤與 AI 多角色智能助手，讓教學管理變得簡單高效。
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="rounded-full bg-white/80 px-4 py-2 text-xs font-medium text-[#84624A] shadow">
                  ✔️ AI 多角色智能協助
                </span>
                <span className="rounded-full bg-white/80 px-4 py-2 text-xs font-medium text-[#84624A] shadow">
                  ✔️ 自由畫布學習路徑
                </span>
                <span className="rounded-full bg-white/80 px-4 py-2 text-xs font-medium text-[#84624A] shadow">
                  ✔️ 100% 數據安全保護
                </span>
                <span className="rounded-full bg-white/80 px-4 py-2 text-xs font-medium text-[#84624A] shadow">
                  ✔️ 24/7 隨時隨地訪問
                </span>
              </div>
              
              {/* 快速行動按鈕 */}
              <div className="flex flex-wrap gap-3 pt-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onCreateOrganization}
                  className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] px-5 py-2.5 text-sm font-semibold text-[#4B4036] shadow-md hover:shadow-lg transition-all"
                >
                  <BuildingOffice2Icon className="w-4 h-4" />
                  創建新機構
                  <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/aihome/teacher-link/create/join-organization')}
              className="group inline-flex items-center gap-2 rounded-full bg-white/90 border-2 border-[#EADBC8] px-5 py-2.5 text-sm font-semibold text-[#4B4036] shadow-sm hover:border-[#FFD59A] hover:shadow-md transition-all"
            >
              <LinkIcon className="w-4 h-4" />
              加入現有機構
              <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </motion.button>
              </div>
            </div>
            <div className="relative flex items-end justify-end">
              <div className="relative h-48 w-48 overflow-hidden rounded-3xl border border-white/60 bg-white/70 shadow-xl sm:h-56 sm:w-56">
                <Image
                  src="/@hanami.png"
                  alt="Hanami Logo"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </motion.section>

        {/* 重點推薦功能 */}
        <section className="grid gap-6 md:grid-cols-2">
          {featuredFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <div className="relative overflow-hidden rounded-[28px] border-2 border-[#FFD59A] bg-gradient-to-br from-[#FFF9F2] via-white to-[#FFF4DF] px-6 py-6 shadow-[0_24px_60px_rgba(231,200,166,0.28)] hover:shadow-[0_32px_80px_rgba(231,200,166,0.35)] transition-all">
                <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#FFD59A]/20 blur-3xl" aria-hidden="true" />
                <div className="absolute -left-8 -bottom-8 h-24 w-24 rounded-full bg-[#EBC9A4]/20 blur-2xl" aria-hidden="true" />
                <div className="relative flex items-start gap-5">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] flex-shrink-0 shadow-lg">
                    <Image
                      src={feature.iconPath}
                      alt={feature.title}
                      width={40}
                      height={40}
                      className="object-contain"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xl font-bold text-[#D48347]">
                        {feature.title}
                      </h3>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#FFD59A] text-[#4B4036] px-3 py-1 text-xs font-semibold shadow-sm">
                        <SparklesIcon className="w-3 h-3" />
                        推薦
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-[#6E5A4A]">{feature.description}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </section>

        {/* 其他功能特色展示 */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-[#4B4036] mb-1">更多功能</h2>
            <p className="text-sm text-[#786355]">完整的教學管理工具集</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {otherFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
              >
                <div className="flex items-start gap-4 rounded-2xl border border-[#F1E4D3] bg-white/90 px-4 py-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFF4ED] flex-shrink-0">
                    <Image
                      src={feature.iconPath}
                      alt={feature.title}
                      width={32}
                      height={32}
                      className="object-contain"
                    />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-[#4B4036]">{feature.title}</h3>
                    <p className="text-sm leading-relaxed text-[#786355]">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 用戶評價與信賴指標 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid gap-6 md:grid-cols-2"
        >
          {/* 用戶評價 */}
          <div className="rounded-[28px] border border-[#F1E4D3] bg-white/90 px-5 py-6 shadow-[0_24px_60px_rgba(231,200,166,0.28)]">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-[#4B4036] mb-2">用戶評價</h2>
              <p className="text-sm text-[#786355]">看看其他老師怎麼說</p>
            </div>
            <div className="space-y-4">
              {[
                {
                  name: '陳老師',
                  role: '音樂教室負責人',
                  org: '陽光音樂教室',
                  rating: 5,
                  comment: '使用 Hanami 後，學生管理和課程排程變得非常簡單。AI 智能助手幫我節省了很多時間，強烈推薦！',
                  avatar: '陳',
                },
                {
                  name: '李老師',
                  role: '鋼琴教師',
                  org: '彩虹音樂學院',
                  rating: 5,
                  comment: '學習追蹤功能非常實用，可以清楚看到每個學生的進步。家長也很滿意這個系統。',
                  avatar: '李',
                },
                {
                  name: '王老師',
                  role: '機構管理員',
                  org: '星星音樂中心',
                  rating: 5,
                  comment: '多機構管理功能讓我們可以輕鬆協調不同分校的資源，效率提升了很多。',
                  avatar: '王',
                },
              ].map((review, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                  className="flex gap-3 p-4 rounded-xl bg-gradient-to-br from-[#FFF9F2] to-white border border-[#EADBC8]"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] flex items-center justify-center flex-shrink-0 shadow-md">
                    <span className="text-sm font-semibold text-[#4B4036]">{review.avatar}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-[#4B4036]">{review.name}</span>
                      <span className="text-xs text-[#786355]">·</span>
                      <span className="text-xs text-[#786355]">{review.role}</span>
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(review.rating)].map((_, i) => (
                        <span key={i} className="text-yellow-400 text-xs">★</span>
                      ))}
                      <span className="text-xs text-[#786355] ml-1">{review.org}</span>
                    </div>
                    <p className="text-sm text-[#6E5A4A] leading-relaxed">{review.comment}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* 多機構信賴指標 */}
          <div className="rounded-[28px] border border-[#F1E4D3] bg-white/90 px-5 py-6 shadow-[0_24px_60px_rgba(231,200,166,0.28)]">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-[#4B4036] mb-2">信賴指標</h2>
              <p className="text-sm text-[#786355]">眾多機構的選擇</p>
            </div>
            <div className="space-y-6">
              {/* 統計數據 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-[#FFF9F2] to-white border border-[#EADBC8]">
                  <div className="text-3xl font-bold text-[#D48347] mb-1">500+</div>
                  <div className="text-xs text-[#786355]">使用機構</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-[#FFF9F2] to-white border border-[#EADBC8]">
                  <div className="text-3xl font-bold text-[#D48347] mb-1">10K+</div>
                  <div className="text-xs text-[#786355]">活躍學生</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-[#FFF9F2] to-white border border-[#EADBC8]">
                  <div className="text-3xl font-bold text-[#D48347] mb-1">98%</div>
                  <div className="text-xs text-[#786355]">滿意度</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-[#FFF9F2] to-white border border-[#EADBC8]">
                  <div className="text-3xl font-bold text-[#D48347] mb-1">24/7</div>
                  <div className="text-xs text-[#786355]">技術支援</div>
                </div>
              </div>

              {/* 知名機構示例 */}
              <div>
                <h3 className="text-sm font-semibold text-[#4B4036] mb-3">使用機構範例</h3>
                <div className="space-y-2">
                  {[
                    { name: '陽光音樂教室', type: '連鎖音樂教育', students: '500+ 學生' },
                    { name: '彩虹音樂學院', type: '專業音樂培訓', students: '300+ 學生' },
                    { name: '星星音樂中心', type: '多分校管理', students: '800+ 學生' },
                    { name: '夢想音樂工作室', type: '個人工作室', students: '50+ 學生' },
                  ].map((org, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-white to-[#FFF9F2] border border-[#EADBC8]"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] flex items-center justify-center flex-shrink-0 shadow-sm">
                        <span className="text-xs font-semibold text-[#4B4036]">
                          {org.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-[#4B4036] truncate">
                          {org.name}
                        </div>
                        <div className="text-xs text-[#786355]">
                          {org.type} · {org.students}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* 認證與保障 */}
              <div className="pt-4 border-t border-[#F1E4D3]">
                <h3 className="text-sm font-semibold text-[#4B4036] mb-3">安全保障</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'ISO 27001 認證', icon: '🔒' },
                    { label: '數據加密', icon: '🛡️' },
                    { label: '定期備份', icon: '💾' },
                    { label: '隱私保護', icon: '🔐' },
                  ].map((item, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#FFF4DF] text-xs font-medium text-[#D48347] shadow-sm"
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* 行動呼籲 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="rounded-[28px] border border-[#F1E4D3] bg-white/90 px-5 py-6 shadow-[0_24px_60px_rgba(231,200,166,0.28)]"
        >
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-[#4B4036] mb-2">
              準備開始了嗎？
            </h2>
            <p className="text-lg text-[#6E5A4A]">
              立即創建您的機構，開始使用 Hanami 智能教學管理系統
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onCreateOrganization}
              className="group relative overflow-hidden rounded-2xl border-2 border-[#EADBC8] bg-gradient-to-br from-white to-[#FFF9F2] p-6 text-left shadow-sm hover:border-[#FFD59A] hover:shadow-md transition-all"
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#FFD59A]/20 blur-2xl" aria-hidden="true" />
              <div className="relative flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] flex items-center justify-center flex-shrink-0 shadow-md">
                  <BuildingOffice2Icon className="w-6 h-6 text-[#4B4036]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[#4B4036] mb-1 flex items-center gap-2">
                    創建新機構
                    <ArrowRightIcon className="w-5 h-5 text-[#8A7C70] group-hover:text-[#FFD59A] transition-colors" />
                  </h3>
                  <p className="text-sm text-[#786355]">
                    如果您是機構的負責人或管理員，您可以從這裡開始建立您的專屬平台。
                  </p>
                </div>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/aihome/teacher-link/create/join-organization')}
              className="group relative overflow-hidden rounded-2xl border-2 border-[#EADBC8] bg-gradient-to-br from-white to-[#FFF9F2] p-6 text-left shadow-sm hover:border-[#FFD59A] hover:shadow-md transition-all"
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-200/20 blur-2xl" aria-hidden="true" />
              <div className="relative flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-300 to-purple-300 flex items-center justify-center flex-shrink-0 shadow-md">
                  <LinkIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[#4B4036] mb-1 flex items-center gap-2">
                    加入現有機構
                    <ArrowRightIcon className="w-5 h-5 text-[#8A7C70] group-hover:text-[#FFD59A] transition-colors" />
                  </h3>
                  <p className="text-sm text-[#786355]">
                    如果您是現有機構的老師或成員，可以輸入機構提供的邀請碼或ID加入。
                  </p>
                </div>
              </div>
            </motion.button>
          </div>
        </motion.section>
      </div>
    </div>
  );
}

