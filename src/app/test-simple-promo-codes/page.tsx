'use client';

import React, { useState } from 'react';
import SimplePromoCodeInput from '@/components/payment/SimplePromoCodeInput';
import { SimpleDiscountInfo } from '@/types/simple-promo-codes';

export default function TestSimplePromoCodesPage() {
  const [discountInfo, setDiscountInfo] = useState<SimpleDiscountInfo | null>(null);

  const handleDiscountApplied = (discount: SimpleDiscountInfo | null) => {
    setDiscountInfo(discount);
    console.log('簡化版折扣應用:', discount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A]/10 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl p-8 shadow-lg border border-[#EADBC8]">
          <h1 className="text-2xl font-bold text-[#4B4036] mb-6 text-center">
            簡化版優惠碼功能測試
          </h1>
          
          <div className="space-y-6">
            {/* 測試資訊 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">測試資訊</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 原價: $500 HKD</li>
                <li>• 測試優惠碼: HANAMI10 (HanamiEcho 機構 10% 折扣)</li>
                <li>• 測試優惠碼: SAVE100 (HanamiEcho 機構 減 $100)</li>
                <li>• 測試優惠碼: MUSIC20 (Hanami Music Academy 20% 折扣)</li>
              </ul>
            </div>

            {/* 簡化版優惠碼輸入組件 */}
            <SimplePromoCodeInput
              originalAmount={500}
              currency="HKD"
              userId="test-user-123"
              userEmail="test@example.com"
              onDiscountApplied={handleDiscountApplied}
            />

            {/* 結果顯示 */}
            {discountInfo && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">折扣應用成功！</h3>
                <div className="space-y-2 text-sm text-green-700">
                  <p><strong>優惠碼:</strong> {discountInfo.code}</p>
                  <p><strong>機構:</strong> {discountInfo.institution_name}</p>
                  <p><strong>折扣類型:</strong> {discountInfo.discount_type === 'percentage' ? '百分比' : '固定金額'}</p>
                  <p><strong>折扣值:</strong> {discountInfo.discount_type === 'percentage' ? `${discountInfo.discount_value}%` : `$${discountInfo.discount_value}`}</p>
                  <p><strong>折扣金額:</strong> ${discountInfo.discount_amount}</p>
                  <p><strong>原價:</strong> ${discountInfo.original_amount}</p>
                  <p><strong>最終價格:</strong> ${discountInfo.final_amount}</p>
                  {discountInfo.notes && (
                    <p><strong>備註:</strong> {discountInfo.notes}</p>
                  )}
                </div>
              </div>
            )}

            {/* 簡化版功能說明 */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">簡化版功能特點</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• <strong>機構管理:</strong> 每個優惠碼都屬於特定機構</li>
                <li>• <strong>使用追蹤:</strong> 記錄使用過的用戶ID和郵箱</li>
                <li>• <strong>次數限制:</strong> 設定總使用次數限制</li>
                <li>• <strong>限期管理:</strong> 設定優惠碼有效期</li>
                <li>• <strong>備註欄位:</strong> 可添加額外說明</li>
                <li>• <strong>簡化結構:</strong> 所有資訊集中在一個表格中</li>
              </ul>
            </div>

            {/* 資料庫結構說明 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">資料庫結構</h3>
              <div className="text-sm text-yellow-700 space-y-1">
                <p><strong>核心欄位:</strong></p>
                <ul className="ml-4 space-y-1">
                  <li>• institution_name: 所屬機構</li>
                  <li>• total_usage_limit: 能使用次數</li>
                  <li>• used_by_user_ids: 記錄誰使用過的ID</li>
                  <li>• used_by_emails: 記錄誰使用過的郵箱</li>
                  <li>• valid_until: 限期</li>
                  <li>• notes: 備註欄位</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
