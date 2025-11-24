'use client';

import Link from 'next/link';
import { useState } from 'react';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  return (
    <>
      {/* 背景遮罩 */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* 側邊欄 */}
      <div className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-[#EADBC8] z-50 transform transition-transform duration-300 ease-in-out lg:hidden flex flex-col ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Logo 區域 */}
        <div className="p-6 border-b border-[#EADBC8] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-lg flex items-center justify-center shadow-md">
              <svg className="w-6 h-6 text-[#4B4036]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-[#4B4036]">Hanami</span>
          </div>
          
          {/* 關閉按鈕 */}
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#FFF9F2] transition-colors"
          >
            <svg className="w-6 h-6 text-[#4B4036]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 導航選單 */}
        <div className="flex-1 p-4 overflow-y-auto">
          {/* 功能區 */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-[#4B4036] mb-4 uppercase tracking-wide">功能</h3>
            <nav className="space-y-2">
              <Link 
                href="/dashboard" 
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-[#FFF9F2] transition-colors group"
                onClick={onClose}
              >
                <div className="w-6 h-6 text-[#4B4036] group-hover:text-[#FFD59A] transition-colors">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <span className="text-[#4B4036] group-hover:text-[#FFD59A] transition-colors">對話</span>
              </Link>
              
              <Link 
                href="/tools" 
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-[#FFF9F2] transition-colors group"
                onClick={onClose}
              >
                <div className="w-6 h-6 text-[#4B4036] group-hover:text-[#FFD59A] transition-colors">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-[#4B4036] group-hover:text-[#FFD59A] transition-colors">工具</span>
              </Link>
              
              <Link 
                href="/settings" 
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-[#FFF9F2] transition-colors group"
                onClick={onClose}
              >
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
              <Link 
                href="/login" 
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-[#FFF9F2] transition-colors group"
                onClick={onClose}
              >
                <div className="w-6 h-6 text-[#4B4036] group-hover:text-[#FFD59A] transition-colors">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <span className="text-[#4B4036] group-hover:text-[#FFD59A] transition-colors">登入</span>
              </Link>
              
              <Link 
                href="/register" 
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-[#FFF9F2] transition-colors group"
                onClick={onClose}
              >
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
    </>
  );
} 