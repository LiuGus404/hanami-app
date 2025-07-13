'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

import CourseCard from '@/components/CourseCard';
import FeatureMenu from '@/components/FeatureMenu';
import TestimonialCard from '@/components/TestimonialCard';
import { getUserSession } from '@/lib/authUtils';


export default function Home() {
  const router = useRouter();
  const sessionChecked = useRef(false);

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

  return (
    <div className="bg-[#FFF9F2] min-h-screen pb-20 flex flex-col">
      {/* 歡迎區 */}
      <section className="text-center mt-6 px-4">
        <h1 className="text-3xl md:text-4xl font-bold text-brown-700">Hello!</h1>
        <p className="text-sm md:text-base text-brown-500 mt-2">
          歡迎來到 Hanami 音樂，讓我們一起陪孩子快樂成長 🎶
        </p>
      </section>

      {/* 開心學習插圖 */}
      <div className="mt-4 px-6">
        <div className="w-full h-48 bg-gradient-to-r from-[#FFD59A] to-[#BFE3FF] rounded-2xl shadow-md flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-2">🎵</div>
            <div className="text-lg font-semibold text-[#4B4036]">開心學習音樂</div>
          </div>
        </div>
      </div>

      {/* 搜尋欄 */}
      <div className="flex justify-center mt-6 px-4">
        <div className="relative w-full max-w-md">
          <input
            className="w-full rounded-full border border-[#E0E0E0] py-2 pl-5 pr-10 text-brown-700 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FFD59A]"
            placeholder="Search"
            type="text"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            <span className="text-[#4B4036] opacity-60">🔍</span>
          </span>
        </div>
      </div>

      {/* 功能選單 */}
      <FeatureMenu />

      {/* 限時優惠 Banner */}
      <div className="mt-6 mx-4 rounded-xl bg-[#D2E0AA] px-4 py-3 shadow">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🦉</span>
          <div className="text-brown-700 font-semibold text-sm md:text-base">
            限時優惠：10% off 所有課程
          </div>
        </div>
      </div>

      {/* 推薦課程與商品 */}
      <section className="mt-8 px-4">
        <h2 className="text-xl md:text-2xl font-semibold text-brown-700 mb-4">課程與商品</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      {/* 更多優惠專區 */}
      <section className="mt-10 px-4">
        <h2 className="text-xl md:text-2xl font-semibold text-brown-700 mb-4">🎁 更多精彩優惠</h2>
        <ul className="space-y-3">
          <li className="bg-[#FCCEB4] rounded-lg p-3 shadow-sm text-sm md:text-base">🎶 購買 5 堂送 1 堂</li>
          <li className="bg-[#ABD7FB] rounded-lg p-3 shadow-sm text-sm md:text-base">🎨 報讀音樂班送色彩遊戲組</li>
          <li className="bg-[#F9F2EF] rounded-lg p-3 shadow-sm text-sm md:text-base">👨‍👩‍👧‍👦 推薦朋友再享課程折扣</li>
        </ul>
      </section>

      {/* 家長好評 Testimonials */}
      <section className="mt-10 px-4">
        <h2 className="text-xl md:text-2xl font-semibold text-brown-700 mb-4">🌟 家長真心推薦</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      {/* 登入入口區 */}
      <section className="mt-12 px-4">
        <h2 className="text-xl md:text-2xl font-semibold text-brown-700 mb-6 text-center">系統入口</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {/* 管理員登入 */}
          <div
            className="bg-white rounded-2xl p-6 shadow-lg border border-[#EADBC8] hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => handleLoginClick('admin')}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-[#FDE6B8] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#A64B2A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-brown-700 mb-2">管理員</h3>
              <p className="text-sm text-brown-500 mb-4">系統管理與監控</p>
            </div>
          </div>

          {/* 老師登入 */}
          <div
            className="bg-white rounded-2xl p-6 shadow-lg border border-[#EADBC8] hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => handleLoginClick('teacher')}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-[#FDE6B8] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#A64B2A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-brown-700 mb-2">合作老師</h3>
              <p className="text-sm text-brown-500 mb-4">學生管理與課程記錄</p>
            </div>
          </div>

          {/* 家長登入 */}
          <div
            className="bg-white rounded-2xl p-6 shadow-lg border border-[#EADBC8] hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => handleLoginClick('parent')}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-[#FDE6B8] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#A64B2A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-brown-700 mb-2">家長</h3>
              <p className="text-sm text-brown-500 mb-4">查看孩子學習進度</p>
            </div>
          </div>
        </div>
      </section>

      {/* 頁腳 */}
      <footer className="mt-16 text-center text-brown-500 text-sm">
        <p>© 2024 Hanami 音樂. All rights reserved.</p>
      </footer>
    </div>
  );
} 