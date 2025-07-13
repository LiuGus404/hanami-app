'use client';

import { useRouter } from 'next/navigation';
import React from 'react';

import AccountIcon from './AccountIcon';

import { HanamiCard, HanamiButton } from './index';


interface Tab {
  id: string;
  name: string;
  icon: string;
}

interface HanamiDashboardLayoutProps {
  title: string;
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
  extraHeaderContent?: React.ReactNode;
}

export default function HanamiDashboardLayout({
  title,
  tabs,
  activeTab,
  onTabChange,
  onLogout,
  children,
  extraHeaderContent,
}: HanamiDashboardLayoutProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#FFF9F2] font-['Quicksand',_sans-serif]">
      {/* 頂部導航欄 */}
      <HanamiCard className="mb-4 mx-4 mt-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-[#FFD59A] rounded-full flex items-center justify-center mr-3">
              <span className="text-brown-700 text-xl">👤</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-brown-700">{title}</h1>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {extraHeaderContent}
            <HanamiButton
              size="sm"
              variant="secondary"
              onClick={onLogout}
            >
              登出
            </HanamiButton>
          </div>
        </div>
      </HanamiCard>

      {/* 標籤導航 */}
      <HanamiCard className="mb-4 mx-4">
        <nav className="flex space-x-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`flex items-center px-4 py-2 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[#FFD59A] text-brown-700'
                  : 'text-brown-500 hover:bg-[#F9F2EF]'
              }`}
              onClick={() => onTabChange(tab.id)}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </HanamiCard>

      {/* 主要內容區域 */}
      <div className="px-4 pb-8">
        <div className="w-full flex justify-center">
          <div style={{ width: '420px' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
} 