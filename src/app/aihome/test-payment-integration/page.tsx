'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import PaymentMethodSelector from '@/components/payment/PaymentMethodSelector';

export default function TestPaymentIntegrationPage() {
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState('');
  const [amount, setAmount] = useState(168);
  const [description, setDescription] = useState('測試支付 - 試堂報名');

  const handlePaymentSuccess = (data: any) => {
    console.log('支付成功:', data);
    alert('支付成功！請檢查控制台查看詳細資訊。');
  };

  const handlePaymentError = (error: string) => {
    console.error('支付錯誤:', error);
    alert(`支付錯誤: ${error}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A]">
      {/* 頂部導航 */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-[#EADBC8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <motion.button
                onClick={() => router.back()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg hover:bg-[#FFD59A]/20 transition-colors"
                title="返回"
              >
                <ArrowLeftIcon className="w-6 h-6 text-[#4B4036]" />
              </motion.button>
              <h1 className="text-xl font-bold text-[#4B4036]">支付系統整合測試</h1>
            </div>
          </div>
        </div>
      </nav>

      {/* 主內容 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-[#EADBC8] mb-8">
          <h2 className="text-2xl font-bold text-[#4B4036] mb-4">測試配置</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[#4B4036] mb-2">
                支付金額
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border-2 border-[#EADBC8] focus:border-[#FFD59A] focus:outline-none"
                min="1"
                step="1"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#4B4036] mb-2">
                支付說明
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-[#EADBC8] focus:border-[#FFD59A] focus:outline-none"
                placeholder="請輸入支付說明"
              />
            </div>
          </div>
        </div>

        {/* 支付組件 */}
        <PaymentMethodSelector
          selectedMethod={selectedMethod}
          onMethodChange={setSelectedMethod}
          amount={amount}
          currency="HKD"
          description={description}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentError={handlePaymentError}
          showPaymentActions={true}
        />

        {/* 測試說明 */}
        <div className="bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A]/20 rounded-xl p-6 border border-[#EADBC8] mt-8">
          <h3 className="text-lg font-bold text-[#4B4036] mb-4">測試說明</h3>
          <div className="space-y-3 text-sm text-[#2B3A3B]">
            <div>
              <h4 className="font-semibold text-[#4B4036]">截圖上傳測試：</h4>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>選擇「上傳付款截圖」</li>
                <li>上傳一張圖片檔案 (JPG, PNG, GIF, WebP)</li>
                <li>點擊「上傳付款截圖」按鈕</li>
                <li>檢查控制台和 Supabase Storage</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-[#4B4036]">Airwallex 支付測試：</h4>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>選擇「Airwallex 線上支付」</li>
                <li>點擊「前往 Airwallex 支付」按鈕</li>
                <li>系統會重定向到 Airwallex 支付頁面</li>
                <li>在 Airwallex 頁面可以取消或完成支付</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-[#4B4036]">注意事項：</h4>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>確保環境變數已正確配置</li>
                <li>檢查 Supabase Storage bucket 是否存在</li>
                <li>確認 Airwallex API 密鑰有效</li>
                <li>查看瀏覽器控制台的詳細日誌</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
