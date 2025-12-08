'use client';

import { ReactNode, useState } from 'react';
import {
  Bars3Icon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import UnifiedNavbar from '@/components/UnifiedNavbar';
import AppSidebar from '@/components/AppSidebar';

export interface ParentShellAction {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  variant?: 'primary' | 'ghost';
}

export interface ParentShellProps {
  children: ReactNode;
  currentPath: string;
  pageTitle?: string;
  pageSubtitle?: string;
  action?: ParentShellAction;
  user: {
    full_name?: string | null;
    email?: string | null;
  } | null;
  onLogout: () => void;
  onLogin: () => void;
  onRegister: () => void;
}


import { motion } from 'framer-motion';
import UnifiedRightContent from '@/components/UnifiedRightContent';
import { useRouter } from 'next/navigation';

export default function ParentShell({
  children,
  currentPath,
  pageTitle,
  pageSubtitle,
  action,
  user,
  onLogout,
  onLogin,
  onRegister,
}: ParentShellProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A]">
      <UnifiedNavbar
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        user={user}
        onLogout={onLogout}
        onLogin={onLogin}
        onRegister={onRegister}
        customRightContent={<UnifiedRightContent user={user} onLogout={onLogout} />}
      />

      <div className="flex">
        <AppSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentPath={currentPath}
        />

        <div className="flex-1 flex flex-col">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1">
            {pageTitle && (
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                  <h1 className="text-3xl font-semibold text-[#4B4036]">{pageTitle}</h1>
                  {pageSubtitle && (
                    <p className="text-sm text-[#2B3A3B]">{pageSubtitle}</p>
                  )}
                </div>
                {action && (
                  <button
                    onClick={action.onClick}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-colors shadow-sm ${action.variant === 'ghost'
                      ? 'bg-white border border-[#EADBC8] text-[#4B4036]'
                      : 'bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036]'
                      }`}
                  >
                    {action.icon}
                    {action.label}
                  </button>
                )}
              </div>
            )}

            <div className="flex-1">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

