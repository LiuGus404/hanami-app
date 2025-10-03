'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TicketIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  SparklesIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { DiscountInfo } from '@/types/promo-codes';
import { validatePromoCode, formatDiscountDisplay, formatCurrency, isValidPromoCodeFormat, cleanPromoCode } from '@/lib/promoCodeUtils';

interface PromoCodeInputProps {
  originalAmount: number;
  currency?: string;
  userId?: string;
  userEmail?: string;
  courseType?: string;
  onDiscountApplied: (discountInfo: DiscountInfo | null) => void;
  className?: string;
}

export default function PromoCodeInput({
  originalAmount,
  currency = 'HKD',
  userId,
  userEmail,
  courseType,
  onDiscountApplied,
  className = ''
}: PromoCodeInputProps) {
  const [promoCode, setPromoCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discountInfo, setDiscountInfo] = useState<DiscountInfo | null>(null);

  const handlePromoCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPromoCode(value);
    setError(null);
    
    // 如果清空優惠碼，移除折扣
    if (!value.trim()) {
      setDiscountInfo(null);
      onDiscountApplied(null);
    }
  };

  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) {
      setError('請輸入優惠碼');
      return;
    }

    const cleanedCode = cleanPromoCode(promoCode);
    if (!isValidPromoCodeFormat(cleanedCode)) {
      setError('優惠碼格式不正確');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await validatePromoCode(
        cleanedCode,
        originalAmount,
        userId,
        userEmail,
        courseType
      );

      if (result.success && result.data) {
        if (result.data.is_valid) {
          const discount: DiscountInfo = {
            code: cleanedCode,
            name: '', // 名稱會在後續 API 中獲取
            discount_type: result.data.discount_amount === originalAmount * 0.1 ? 'percentage' : 'fixed_amount',
            discount_value: result.data.discount_amount === originalAmount * 0.1 ? 10 : result.data.discount_amount,
            discount_amount: result.data.discount_amount,
            original_amount: originalAmount,
            final_amount: result.data.final_amount,
            description: '優惠碼折扣'
          };

          setDiscountInfo(discount);
          onDiscountApplied(discount);
        } else {
          setError(result.data.error_message || '優惠碼無效');
        }
      } else {
        setError(result.error || '驗證優惠碼失敗');
      }
    } catch (error) {
      console.error('優惠碼驗證錯誤:', error);
      setError('驗證優惠碼時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePromoCode = () => {
    setPromoCode('');
    setDiscountInfo(null);
    setError(null);
    onDiscountApplied(null);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 優惠碼輸入區域 */}
      <div className="bg-white rounded-xl p-4 border border-[#EADBC8] shadow-sm">
        <div className="flex items-center space-x-2 mb-3">
          <TicketIcon className="w-5 h-5 text-[#FFD59A]" />
          <h4 className="font-semibold text-[#4B4036]">優惠碼</h4>
        </div>

        {!discountInfo ? (
          <div className="flex space-x-2">
            <div className="flex-1">
              <input
                type="text"
                value={promoCode}
                onChange={handlePromoCodeChange}
                placeholder="輸入優惠碼"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent text-sm"
                disabled={loading}
              />
            </div>
            <motion.button
              onClick={handleApplyPromoCode}
              disabled={loading || !promoCode.trim()}
              whileHover={!loading && promoCode.trim() ? { scale: 1.05 } : {}}
              whileTap={!loading && promoCode.trim() ? { scale: 0.95 } : {}}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                loading || !promoCode.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] hover:from-[#EBC9A4] hover:to-[#FFD59A] shadow-md'
              }`}
            >
              {loading ? '驗證中...' : '應用'}
            </motion.button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">{discountInfo.code}</p>
                <p className="text-sm text-green-700">
                  {formatDiscountDisplay(discountInfo)} - 節省 {formatCurrency(discountInfo.discount_amount, currency)}
                </p>
              </div>
            </div>
            <button
              onClick={handleRemovePromoCode}
              className="p-1 text-green-600 hover:text-green-800 transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 錯誤訊息 */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-2 mt-2 p-2 bg-red-50 border border-red-200 rounded-lg"
          >
            <XCircleIcon className="w-4 h-4 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </motion.div>
        )}
      </div>

      {/* 價格摘要 */}
      {discountInfo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A]/20 rounded-xl p-4 border border-[#EADBC8]"
        >
          <div className="flex items-center space-x-2 mb-3">
            <SparklesIcon className="w-5 h-5 text-[#FFD59A]" />
            <h4 className="font-semibold text-[#4B4036]">價格摘要</h4>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#2B3A3B]/70">原價:</span>
              <span className="font-medium">{formatCurrency(discountInfo.original_amount, currency)}</span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>折扣 ({discountInfo.code}):</span>
              <span className="font-medium">-{formatCurrency(discountInfo.discount_amount, currency)}</span>
            </div>
            <hr className="border-[#EADBC8]" />
            <div className="flex justify-between font-bold text-[#4B4036]">
              <span>最終價格:</span>
              <span className="text-lg">{formatCurrency(discountInfo.final_amount, currency)}</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* 優惠碼說明 */}
      <div className="text-xs text-[#2B3A3B]/60 space-y-1">
        <p>• 輸入優惠碼可享受額外折扣</p>
        <p>• 每個優惠碼可能有使用限制</p>
        <p>• 折扣將在支付時自動應用</p>
      </div>
    </div>
  );
}
