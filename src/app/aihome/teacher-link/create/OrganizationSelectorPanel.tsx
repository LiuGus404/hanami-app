'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { PlusIcon, ArrowRightIcon, UserIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';

import type { UserOrganizationIdentity } from '@/lib/organizationUtils';
import type { OrganizationProfile } from '@/lib/authUtils';

type OrganizationSelectorPanelProps = {
  organizations: UserOrganizationIdentity[];
  onSelect: (org: OrganizationProfile) => void;
  onCreateNew: () => void;
  onJoinExisting: () => void;
  currentOrgId?: string | null;
};

const roleLabels: Record<string, string> = {
  owner: '創建者',
  admin: '管理員',
  teacher: '教師',
  member: '成員',
  parent: '家長',
  student: '學生',
};

const roleColors: Record<string, string> = {
  owner: 'bg-gradient-to-r from-yellow-400 to-orange-400',
  admin: 'bg-gradient-to-r from-blue-400 to-purple-400',
  teacher: 'bg-gradient-to-r from-green-400 to-teal-400',
  member: 'bg-gradient-to-r from-gray-300 to-gray-400',
  parent: 'bg-gradient-to-r from-pink-300 to-rose-300',
  student: 'bg-gradient-to-r from-indigo-300 to-blue-300',
};

const sourceLabels: Record<string, string> = {
  created: '我創建的',
  identity: '身份記錄',
  membership: '成員身份',
  employee: '員工身份',
};

export function OrganizationSelectorPanel({
  organizations,
  onSelect,
  onCreateNew,
  onJoinExisting,
  currentOrgId,
}: OrganizationSelectorPanelProps) {
  const router = useRouter();
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(currentOrgId || null);

  const handleSelect = (identity: UserOrganizationIdentity) => {
    setSelectedOrgId(identity.orgId);
    onSelect({
      id: identity.orgId,
      name: identity.orgName,
      slug: identity.orgSlug,
      status: identity.status === 'active' ? 'active' : null,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFF3E6] to-[#FFE1F0]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-10">
        {/* 標題區域 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-[32px] border border-white/60 bg-gradient-to-br from-white/80 via-[#FFEFE2] to-[#FFE4F5] shadow-[0_32px_80px_rgba(228,192,155,0.35)]"
        >
          <div className="absolute -right-14 top-10 h-48 w-48 rounded-full bg-white/40 blur-2xl" aria-hidden="true" />
          <div className="absolute -bottom-16 left-10 h-40 w-40 rounded-full bg-[#FFD6E7]/60 blur-3xl" aria-hidden="true" />
          <div className="relative px-8 py-10">
            <div className="text-center space-y-4 text-[#4B4036]">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-[#D48347] shadow-sm">
                機構選擇
              </span>
              <h1 className="text-3xl font-extrabold leading-snug tracking-wide lg:text-4xl">
                選擇您的機構
              </h1>
              <p className="text-sm leading-relaxed text-[#6E5A4A] lg:text-base max-w-2xl mx-auto">
                您在多個機構中擁有身份。請選擇您要管理的機構，或創建/加入新機構。
              </p>
            </div>
          </div>
        </motion.section>

        {/* 機構列表 */}
        <div className="rounded-[28px] border border-[#F1E4D3] bg-white/90 px-5 py-6 shadow-[0_24px_60px_rgba(231,200,166,0.28)]">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-[#4B4036] mb-2">我的機構</h2>
            <p className="text-sm text-[#786355]">點擊機構卡片以選擇</p>
          </div>

          {organizations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <AnimatePresence>
                {organizations.map((identity) => {
                  const isSelected = selectedOrgId === identity.orgId;
                  const roleLabel = roleLabels[identity.role] || identity.role;
                  const roleColor = roleColors[identity.role] || 'bg-gray-300';
                  const sourceLabel = sourceLabels[identity.source] || identity.source;

                  return (
                    <motion.button
                      key={identity.orgId}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelect(identity)}
                      className={`
                        group relative overflow-hidden rounded-2xl border-2 transition-all text-left
                        ${
                          isSelected
                            ? 'border-[#FFD59A] bg-gradient-to-br from-[#FFF9F2] to-white shadow-lg'
                            : 'border-[#F1E4D3] bg-white/90 hover:border-[#FFD59A]/50 hover:shadow-md'
                        }
                      `}
                    >
                      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#FFD59A]/10 blur-2xl" aria-hidden="true" />
                      {isSelected && (
                        <div className="absolute top-3 right-3 z-10">
                          <div className="w-6 h-6 rounded-full bg-[#FFD59A] flex items-center justify-center shadow-md">
                            <CheckIcon className="w-4 h-4 text-[#4B4036]" />
                          </div>
                        </div>
                      )}

                      <div className="relative p-5">
                        <div className="flex items-start gap-4">
                          <div
                            className={`
                              w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0 shadow-md
                              ${roleColor}
                            `}
                          >
                            {identity.orgName.charAt(0).toUpperCase()}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-[#4B4036] mb-2 truncate">
                              {identity.orgName}
                            </h3>
                            <div className="flex flex-wrap gap-2 mb-2">
                              <span
                                className={`
                                  px-2 py-1 rounded-lg text-xs font-medium text-white shadow-sm
                                  ${roleColor}
                                `}
                              >
                                {roleLabel}
                              </span>
                              <span className="px-2 py-1 rounded-lg text-xs font-medium bg-[#FFF4DF] text-[#D48347] shadow-sm">
                                {sourceLabel}
                              </span>
                              {identity.isPrimary && (
                                <span className="px-2 py-1 rounded-lg text-xs font-medium bg-blue-100 text-blue-700 shadow-sm">
                                  主要
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-[#786355] truncate">@{identity.orgSlug}</p>
                          </div>
                        </div>

                        {isSelected && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-4 pt-4 border-t border-[#EADBC8] flex items-center justify-between"
                          >
                            <span className="text-sm text-[#4B4036] font-medium">已選中</span>
                            <ArrowRightIcon className="w-5 h-5 text-[#FFD59A]" />
                          </motion.div>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-8 text-[#786355]">
              <p>您目前沒有關聯的機構</p>
            </div>
          )}

          {/* 其他選項 */}
          <div className="border-t border-[#F1E4D3] pt-6">
            <h2 className="text-lg font-semibold text-[#4B4036] mb-4">其他選項</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onCreateNew}
                className="group relative overflow-hidden rounded-2xl border-2 border-[#F1E4D3] bg-white/90 p-6 text-left shadow-sm hover:border-[#FFD59A] hover:shadow-md transition-all"
              >
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#FFD59A]/10 blur-2xl" aria-hidden="true" />
                <div className="relative flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] flex items-center justify-center flex-shrink-0 shadow-md">
                    <PlusIcon className="w-6 h-6 text-[#4B4036]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[#4B4036] mb-1 flex items-center gap-2">
                      創建新機構
                      <ArrowRightIcon className="w-5 h-5 text-[#786355] group-hover:text-[#FFD59A] transition-colors" />
                    </h3>
                    <p className="text-sm text-[#786355]">建立一個全新的機構並成為創建者</p>
                  </div>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/aihome/teacher-link/create/join-organization')}
                className="group relative overflow-hidden rounded-2xl border-2 border-[#F1E4D3] bg-white/90 p-6 text-left shadow-sm hover:border-[#FFD59A] hover:shadow-md transition-all"
              >
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-200/10 blur-2xl" aria-hidden="true" />
                <div className="relative flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-300 to-purple-300 flex items-center justify-center flex-shrink-0 shadow-md">
                    <UserIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[#4B4036] mb-1 flex items-center gap-2">
                      加入已有機構
                      <ArrowRightIcon className="w-5 h-5 text-[#786355] group-hover:text-[#FFD59A] transition-colors" />
                    </h3>
                    <p className="text-sm text-[#786355]">通過機構 ID 或邀請碼加入現有機構</p>
                  </div>
                </div>
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

