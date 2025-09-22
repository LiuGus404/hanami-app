'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import CourseCard from '@/components/CourseCard';
import FeatureMenu from '@/components/FeatureMenu';
import MobileSidebar from '@/components/MobileSidebar';
import TestimonialCard from '@/components/TestimonialCard';
import { getUserSession } from '@/lib/authUtils';

export default function MusicEducationHome() {
  const router = useRouter();
  const sessionChecked = useRef(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    // 防止重複檢查
    if (sessionChecked.current) return;
    sessionChecked.current = true;

    // 檢查是否已有登入會話，但不自動重定向
    const userSession = getUserSession();
    if (userSession) {
      console.log('用戶已登入:', userSession.role);
      // 不再自動重定向，讓用戶自己選擇
    }
  }, []); // 移除 router 依賴

  const handleLoginClick = (userType: 'admin' | 'teacher' | 'parent') => {
    // 檢查用戶是否已登入
    const userSession = getUserSession();
    
    if (userSession) {
      // 如果已登入，直接跳轉到對應的儀表板
      switch (userType) {
        case 'admin':
          if (userSession.role === 'admin') {
            router.push('/admin');
          } else {
            alert('您沒有管理員權限');
          }
          break;
        case 'teacher':
          if (userSession.role === 'teacher') {
            router.push('/teacher/dashboard');
          } else {
            alert('您沒有教師權限');
          }
          break;
        case 'parent':
          if (userSession.role === 'parent') {
            router.push('/parent/dashboard');
          } else {
            alert('您沒有家長權限');
          }
          break;
      }
    } else {
      // 如果未登入，跳轉到統一的登入頁面
      router.push('/login');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // 處理搜尋邏輯
    console.log('搜尋:', searchQuery);
  };

  return (
    <div className="min-h-screen bg-[#FFF9F2] flex">
      {/* 左側邊欄 - 固定寬度 */}
      <div className="w-64 bg-white border-r border-[#EADBC8] hidden lg:flex flex-col">
        {/* Logo 區域 */}
        <div className="p-6 border-b border-[#EADBC8]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-lg flex items-center justify-center shadow-md">
              <svg className="w-6 h-6 text-[#4B4036]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-[#4B4036]">花見音樂</span>
          </div>
        </div>

        {/* 導航選單 */}
        <div className="flex-1 p-4">
          {/* 功能區 */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-[#4B4036] mb-4 uppercase tracking-wide">功能</h3>
            <nav className="space-y-2">
              <Link href="/music/dashboard" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-[#FFF9F2] transition-colors group">
                <div className="w-6 h-6 text-[#4B4036] group-hover:text-[#FFD59A] transition-colors">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <span className="text-[#4B4036] group-hover:text-[#FFD59A] transition-colors">對話</span>
              </Link>
              
              <Link href="/music/tools" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-[#FFF9F2] transition-colors group">
                <div className="w-6 h-6 text-[#4B4036] group-hover:text-[#FFD59A] transition-colors">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-[#4B4036] group-hover:text-[#FFD59A] transition-colors">工具</span>
              </Link>
              
              <Link href="/music/settings" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-[#FFF9F2] transition-colors group">
                <div className="w-6 h-6 text-[#4B4036] group-hover:text-[#FFD59A] transition-colors">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className="text-[#4B4036] group-hover:text-[#FFD59A] transition-colors">設定</span>
              </Link>
            </nav>
          </div>

          {/* 帳戶區 */}
          <div>
            <h3 className="text-sm font-semibold text-[#4B4036] mb-4 uppercase tracking-wide">帳戶</h3>
            <nav className="space-y-2">
              <Link href="/login" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-[#FFF9F2] transition-colors group">
                <div className="w-6 h-6 text-[#4B4036] group-hover:text-[#FFD59A] transition-colors">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <span className="text-[#4B4036] group-hover:text-[#FFD59A] transition-colors">登入</span>
              </Link>
              
              <Link href="/register" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-[#FFF9F2] transition-colors group">
                <div className="w-6 h-6 text-[#4B4036] group-hover:text-[#FFD59A] transition-colors">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span className="text-[#4B4036] group-hover:text-[#FFD59A] transition-colors">註冊</span>
              </Link>
            </nav>
          </div>
        </div>

        {/* 底部通知 */}
        <div className="p-4 border-t border-[#EADBC8]">
          <div className="bg-red-500 text-white rounded-full px-3 py-1 text-sm flex items-center space-x-2">
            <span className="w-2 h-2 bg-white rounded-full"></span>
            <span>1 Issue</span>
            <span className="ml-auto">×</span>
          </div>
        </div>
      </div>

      {/* 主內容區域 */}
      <div className="flex-1 flex flex-col">
        {/* 頂部導航欄 */}
        <header className="bg-white border-b border-[#EADBC8] px-6 py-4 flex items-center justify-between">
          {/* 移動端選單按鈕 */}
          <button 
            className="lg:hidden p-2 rounded-lg hover:bg-[#FFF9F2] transition-colors"
            onClick={() => setIsMobileSidebarOpen(true)}
          >
            <svg className="w-6 h-6 text-[#4B4036]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* 桌面端 Logo */}
          <div className="hidden lg:flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-lg flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-[#4B4036]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-[#4B4036]">花見音樂</span>
          </div>

          {/* 右側按鈕 */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="px-4 py-2 text-[#4B4036] bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
              HanamiEcho 主站
            </Link>
            <button className="px-4 py-2 text-[#4B4036] bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
              升級
            </button>
            <button className="px-4 py-2 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] rounded-lg hover:from-[#EBC9A4] hover:to-[#FDE6B8] transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 text-sm font-medium flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>開始使用</span>
            </button>
          </div>
        </header>

        {/* 主內容 */}
        <main className="flex-1 p-6 bg-[#FFF9F2]">
          <div className="max-w-4xl mx-auto">
            {/* 問候語 */}
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-[#4B4036] mb-4">
                歡迎來到花見音樂教育
              </h1>
              
              {/* 主要圖標 */}
              <div className="w-24 h-24 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg className="w-12 h-12 text-[#4B4036]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            {/* 搜尋欄 */}
            <div className="mb-8">
              <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="如何協助您今天的音樂學習？"
                  className="w-full px-6 py-4 bg-white border border-[#EADBC8] rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent text-[#4B4036] placeholder-[#4B4036]/60"
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center hover:from-[#EBC9A4] hover:to-[#FDE6B8] transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  <svg className="w-5 h-5 text-[#4B4036]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </form>
            </div>

            {/* 功能解鎖區域 */}
            <div className="bg-white border border-[#EADBC8] rounded-2xl p-6 shadow-sm mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-[#4B4036] mb-1">解鎖所有功能</h3>
                  <p className="text-[#4B4036]/70">和專業音樂教育服務</p>
                </div>
                <button className="px-4 py-2 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] rounded-lg hover:from-[#EBC9A4] hover:to-[#FDE6B8] transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 text-sm font-medium">
                  升級
                </button>
              </div>
            </div>

            {/* 系統入口 */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-[#4B4036] mb-6 text-center">系統入口</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 管理員登入 */}
                <div
                  className="bg-white rounded-2xl p-6 shadow-lg border border-[#EADBC8] hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105"
                  onClick={() => handleLoginClick('admin')}
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                      <svg className="w-8 h-8 text-[#4B4036]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-[#4B4036] mb-2">管理員</h3>
                    <p className="text-sm text-[#4B4036]/70 mb-4">系統管理與監控</p>
                  </div>
                </div>

                {/* 老師登入 */}
                <div
                  className="bg-white rounded-2xl p-6 shadow-lg border border-[#EADBC8] hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105"
                  onClick={() => handleLoginClick('teacher')}
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                      <svg className="w-8 h-8 text-[#4B4036]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-[#4B4036] mb-2">合作老師</h3>
                    <p className="text-sm text-[#4B4036]/70 mb-4">學生管理與課程記錄</p>
                  </div>
                </div>

                {/* 家長登入 */}
                <div
                  className="bg-white rounded-2xl p-6 shadow-lg border border-[#EADBC8] hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105"
                  onClick={() => handleLoginClick('parent')}
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                      <svg className="w-8 h-8 text-[#4B4036]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-[#4B4036] mb-2">家長</h3>
                    <p className="text-sm text-[#4B4036]/70 mb-4">查看孩子學習進度</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 推薦課程與商品 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#4B4036] mb-6">課程與商品</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <CourseCard
                  bgColor="#FFD59A"
                  description="適合3-6歲，啟發音樂潛能，快樂學習。"
                  icon="⭐"
                  title="Pre-K Class"
                />
                <CourseCard
                  bgColor="#BFE3FF"
                  description="精選錄音教材，隨時隨地快樂唱。"
                  icon="🎸"
                  title="Recorded Songs"
                />
              </div>
            </section>

            {/* 家長好評 Testimonials */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#4B4036] mb-6">🌟 家長真心推薦</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <TestimonialCard
                  avatar="👩"
                  comment="第一次見到女兒咁投入唱歌，真係感動～"
                  name="小彤媽媽"
                />
                <TestimonialCard
                  avatar="👨"
                  comment="老師好有愛心，小朋友學得開心又專心。"
                  name="浩浩爸爸"
                />
                <TestimonialCard
                  avatar="👩"
                  comment="本來怕分離，依家返學都笑笑口！"
                  name="思樂媽媽"
                />
              </div>
            </section>
          </div>
        </main>
      </div>

      {/* 移動端側邊欄 */}
      <MobileSidebar 
        isOpen={isMobileSidebarOpen} 
        onClose={() => setIsMobileSidebarOpen(false)} 
      />
    </div>
  );
}
