'use client';

import React, { useState } from 'react';
import PromoCodeInput from '@/components/payment/PromoCodeInput';
import { DiscountInfo } from '@/types/promo-codes';

export default function TestPromoCodesPage() {
  const [discountInfo, setDiscountInfo] = useState<DiscountInfo | null>(null);

  const handleDiscountApplied = (discount: DiscountInfo | null) => {
    setDiscountInfo(discount);
    console.log('折扣應用:', discount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A]/10 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl p-8 shadow-lg border border-[#EADBC8]">
          <h1 className="text-2xl font-bold text-[#4B4036] mb-6 text-center">
            優惠碼功能測試
          </h1>
          
          <div className="space-y-6">
            {/* 測試資訊 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">測試資訊</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 原價: $500 HKD</li>
                <li>• 測試優惠碼: WELCOME10 (10% 折扣)</li>
                <li>• 測試優惠碼: SAVE50 (減 $50)</li>
                <li>• 測試優惠碼: PIANO20 (20% 折扣，最大 $200)</li>
              </ul>
            </div>

            {/* 優惠碼輸入組件 */}
            <PromoCodeInput
              originalAmount={500}
              currency="HKD"
              userId="test-user-123"
              userEmail="test@example.com"
              courseType="piano"
              onDiscountApplied={handleDiscountApplied}
            />

            {/* 結果顯示 */}
            {discountInfo && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">折扣應用成功！</h3>
                <div className="space-y-2 text-sm text-green-700">
                  <p><strong>優惠碼:</strong> {discountInfo.code}</p>
                  <p><strong>折扣類型:</strong> {discountInfo.discount_type === 'percentage' ? '百分比' : '固定金額'}</p>
                  <p><strong>折扣值:</strong> {discountInfo.discount_type === 'percentage' ? `${discountInfo.discount_value}%` : `$${discountInfo.discount_value}`}</p>
                  <p><strong>折扣金額:</strong> ${discountInfo.discount_amount}</p>
                  <p><strong>原價:</strong> ${discountInfo.original_amount}</p>
                  <p><strong>最終價格:</strong> ${discountInfo.final_amount}</p>
                </div>
              </div>
            )}

            {/* 功能說明 */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">功能說明</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• 支援百分比折扣和固定金額折扣</li>
                <li>• 自動驗證優惠碼格式和有效性</li>
                <li>• 即時計算折扣金額和最終價格</li>
                <li>• 支援用戶使用次數限制</li>
                <li>• 支援最低訂單金額限制</li>
                <li>• 支援優惠碼有效期檢查</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
