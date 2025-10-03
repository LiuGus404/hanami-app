import React from 'react';
import { Metadata } from 'next';
import SimplePromoCodeManager from '@/components/admin/SimplePromoCodeManager';

export const metadata: Metadata = {
  title: '優惠碼管理 | HanamiEcho 管理後台',
  description: '管理 HanamiEcho 系統的優惠碼和折扣活動',
};

export default function SimplePromoCodeManagementPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A]/10 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#4B4036] mb-2">優惠碼管理</h1>
          <p className="text-[#2B3A3B]/70">
            管理系統中的優惠碼、折扣活動和使用統計
          </p>
        </div>

        <SimplePromoCodeManager />
      </div>
    </div>
  );
}
