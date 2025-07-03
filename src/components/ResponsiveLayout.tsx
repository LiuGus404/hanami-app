'use client';

import { ReactNode } from 'react';

interface ResponsiveLayoutProps {
  children: ReactNode;
  className?: string;
}

export default function ResponsiveLayout({ children, className = '' }: ResponsiveLayoutProps) {
  return (
    <div className={`min-h-screen ${className}`}>
      {/* 手機直向顯示 */}
      <div className="block md:hidden">
        <div className="max-w-sm mx-auto min-h-screen bg-gray-50">
          {children}
        </div>
      </div>
      
      {/* 電腦橫向顯示 */}
      <div className="hidden md:block">
        <div className="max-w-7xl mx-auto min-h-screen bg-gray-50">
          {children}
        </div>
      </div>
    </div>
  );
}

// 手機專用容器
export function MobileContainer({ children, className = '' }: ResponsiveLayoutProps) {
  return (
    <div className={`max-w-sm mx-auto bg-white min-h-screen ${className}`}>
      {children}
    </div>
  );
}

// 桌面專用容器
export function DesktopContainer({ children, className = '' }: ResponsiveLayoutProps) {
  return (
    <div className={`max-w-7xl mx-auto ${className}`}>
      {children}
    </div>
  );
}

// 響應式網格
export function ResponsiveGrid({ children, className = '' }: ResponsiveLayoutProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 ${className}`}>
      {children}
    </div>
  );
}

// 響應式卡片
export function ResponsiveCard({ children, className = '' }: ResponsiveLayoutProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm md:shadow border border-gray-200 p-4 md:p-6 ${className}`}>
      {children}
    </div>
  );
}

// 響應式導航
export function ResponsiveNav({ children, className = '' }: ResponsiveLayoutProps) {
  return (
    <nav className={`bg-white shadow-sm border-b sticky top-0 z-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </nav>
  );
}

// 響應式標籤
export function ResponsiveTabs({ children, className = '' }: ResponsiveLayoutProps) {
  return (
    <div className={`bg-white border-b overflow-x-auto ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8 min-w-max">
          {children}
        </div>
      </div>
    </div>
  );
}

// 響應式按鈕
export function ResponsiveButton({ children, className = '', ...props }: any) {
  return (
    <button 
      className={`w-full md:w-auto px-4 py-2 md:py-2 text-sm font-medium rounded-lg transition-colors ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// 響應式文字
export function ResponsiveText({ children, className = '' }: ResponsiveLayoutProps) {
  return (
    <div className={`text-sm md:text-base ${className}`}>
      {children}
    </div>
  );
}

// 響應式標題
export function ResponsiveTitle({ children, className = '' }: ResponsiveLayoutProps) {
  return (
    <h1 className={`text-xl md:text-2xl lg:text-3xl font-semibold ${className}`}>
      {children}
    </h1>
  );
}

// 響應式副標題
export function ResponsiveSubtitle({ children, className = '' }: ResponsiveLayoutProps) {
  return (
    <h2 className={`text-lg md:text-xl font-medium ${className}`}>
      {children}
    </h2>
  );
} 