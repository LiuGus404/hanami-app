'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TicketIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  SparklesIcon,
  XMarkIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

interface TestPromoCode {
  id: string;
  code: string;
  name: string;
  description: string;
  institution_name: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  max_discount_amount?: number;
  total_usage_limit: number;
  used_count: number;
  valid_until?: string;
  is_active: boolean;
}

interface DiscountInfo {
  is_valid: boolean;
  promo_code_id: string;
  discount_amount: number;
  final_amount: number;
  error_message: string;
  institution_name: string;
}

// 內存中的測試優惠碼
const testPromoCodes: TestPromoCode[] = [
  {
    id: 'test-1',
    code: 'HANAMI10',
    name: 'HanamiEcho 新用戶優惠',
    description: 'HanamiEcho 機構新用戶專享10%折扣',
    institution_name: 'HanamiEcho',
    discount_type: 'percentage',
    discount_value: 10,
    max_discount_amount: 100,
    total_usage_limit: 50,
    used_count: 0,
    valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true
  },
  {
    id: 'test-2',
    code: 'SAVE100',
    name: 'HanamiEcho 固定折扣',
    description: 'HanamiEcho 立減100元',
    institution_name: 'HanamiEcho',
    discount_type: 'fixed_amount',
    discount_value: 100,
    total_usage_limit: 20,
    used_count: 0,
    valid_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true
  },
  {
    id: 'test-3',
    code: 'MUSIC20',
    name: 'Hanami Music 限時優惠',
    description: 'Hanami Music Academy 限時20%折扣',
    institution_name: 'Hanami Music Academy',
    discount_type: 'percentage',
    discount_value: 20,
    max_discount_amount: 200,
    total_usage_limit: 30,
    used_count: 0,
    valid_until: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true
  }
];

export default function TestPromoCodesDirectPage() {
  const [promoCode, setPromoCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discountInfo, setDiscountInfo] = useState<DiscountInfo | null>(null);
  const [orderAmount] = useState(500);

  const validatePromoCode = async (code: string): Promise<DiscountInfo> => {
    const cleanCode = code.toUpperCase().trim();
    
    // 查找優惠碼
    const foundCode = testPromoCodes.find(pc => pc.code === cleanCode);
    
    if (!foundCode) {
      return {
        is_valid: false,
        promo_code_id: '',
        discount_amount: 0,
        final_amount: orderAmount,
        error_message: '優惠碼不存在',
        institution_name: ''
      };
    }

    // 檢查是否啟用
    if (!foundCode.is_active) {
      return {
        is_valid: false,
        promo_code_id: foundCode.id,
        discount_amount: 0,
        final_amount: orderAmount,
        error_message: '優惠碼已停用',
        institution_name: foundCode.institution_name
      };
    }

    // 檢查有效期
    if (foundCode.valid_until && new Date(foundCode.valid_until) < new Date()) {
      return {
        is_valid: false,
        promo_code_id: foundCode.id,
        discount_amount: 0,
        final_amount: orderAmount,
        error_message: '優惠碼已過期',
        institution_name: foundCode.institution_name
      };
    }

    // 檢查使用次數
    if (foundCode.used_count >= foundCode.total_usage_limit) {
      return {
        is_valid: false,
        promo_code_id: foundCode.id,
        discount_amount: 0,
        final_amount: orderAmount,
        error_message: '優惠碼使用次數已達上限',
        institution_name: foundCode.institution_name
      };
    }

    // 計算折扣
    let discountAmount = 0;
    if (foundCode.discount_type === 'percentage') {
      discountAmount = orderAmount * (foundCode.discount_value / 100);
      if (foundCode.max_discount_amount && discountAmount > foundCode.max_discount_amount) {
        discountAmount = foundCode.max_discount_amount;
      }
    } else {
      discountAmount = foundCode.discount_value;
    }

    if (discountAmount > orderAmount) {
      discountAmount = orderAmount;
    }

    return {
      is_valid: true,
      promo_code_id: foundCode.id,
      discount_amount: discountAmount,
      final_amount: orderAmount - discountAmount,
      error_message: '驗證成功',
      institution_name: foundCode.institution_name
    };
  };

  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) {
      setError('請輸入優惠碼');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 模擬 API 延遲
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const result = await validatePromoCode(promoCode);
      setDiscountInfo(result);

      if (result.is_valid) {
        console.log('✅ 優惠碼驗證成功:', result);
      } else {
        console.log('❌ 優惠碼驗證失敗:', result.error_message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '驗證優惠碼時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePromoCode = () => {
    setPromoCode('');
    setDiscountInfo(null);
    setError(null);
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A]/10 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl p-8 shadow-lg border border-[#EADBC8]">
          <h1 className="text-2xl font-bold text-[#4B4036] mb-6 text-center">
            直接測試優惠碼功能
          </h1>

          <div className="space-y-6">
            {/* 測試資訊 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">測試資訊</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 原價: {formatCurrency(orderAmount)} HKD</li>
                <li>• 測試優惠碼: HANAMI10 (HanamiEcho 機構 10% 折扣)</li>
                <li>• 測試優惠碼: SAVE100 (HanamiEcho 機構 減 $100)</li>
                <li>• 測試優惠碼: MUSIC20 (Hanami Music Academy 20% 折扣)</li>
              </ul>
            </div>

            {/* 優惠碼輸入 */}
            <div className="bg-white rounded-xl p-4 border border-[#EADBC8] shadow-sm">
              <div className="flex items-center space-x-2 mb-3">
                <TicketIcon className="w-5 h-5 text-[#FFD59A]" />
                <h4 className="font-semibold text-[#4B4036]">優惠碼</h4>
              </div>

              <div className="flex space-x-2">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="輸入優惠碼"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent text-sm"
                    disabled={loading}
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleApplyPromoCode}
                  disabled={loading || !promoCode.trim()}
                  className="px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '驗證中...' : '應用'}
                </motion.button>
              </div>

              {/* 錯誤訊息 */}
              {error && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                  <XCircleIcon className="w-4 h-4 text-red-500" />
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              )}

              {/* 成功訊息 */}
              {discountInfo && discountInfo.is_valid && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
                  <CheckCircleIcon className="w-4 h-4 text-green-500" />
                  <span className="text-green-700 text-sm">
                    優惠碼驗證成功！節省 {formatCurrency(discountInfo.discount_amount)}
                  </span>
                  <button
                    onClick={handleRemovePromoCode}
                    className="ml-auto text-green-600 hover:text-green-800"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* 失敗訊息 */}
              {discountInfo && !discountInfo.is_valid && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                  <XCircleIcon className="w-4 h-4 text-red-500" />
                  <span className="text-red-700 text-sm">{discountInfo.error_message}</span>
                  <button
                    onClick={handleRemovePromoCode}
                    className="ml-auto text-red-600 hover:text-red-800"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* 價格顯示 */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">價格詳情</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">原價:</span>
                  <span className="font-medium">{formatCurrency(orderAmount)}</span>
                </div>
                
                {discountInfo && discountInfo.is_valid && (
                  <>
                    <div className="flex justify-between text-green-600">
                      <span>折扣:</span>
                      <span className="font-medium">-{formatCurrency(discountInfo.discount_amount)}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-800">最終價格:</span>
                        <span className="font-bold text-lg text-[#4B4036]">
                          {formatCurrency(discountInfo.final_amount)}
                        </span>
                      </div>
                    </div>
                  </>
                )}
                
                {(!discountInfo || !discountInfo.is_valid) && (
                  <div className="border-t pt-2">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-800">總價:</span>
                      <span className="font-bold text-lg text-[#4B4036]">
                        {formatCurrency(orderAmount)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 功能說明 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">功能說明</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• 這是內存測試版本，不依賴資料庫</li>
                <li>• 支援百分比和固定金額折扣</li>
                <li>• 包含有效期和使用次數限制驗證</li>
                <li>• 支援最大折扣金額限制</li>
                <li>• 完整的錯誤處理和用戶反饋</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
