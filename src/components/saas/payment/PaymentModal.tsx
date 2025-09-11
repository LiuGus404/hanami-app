'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId: string;
  planName: string;
  billingCycle: 'monthly' | 'yearly';
  price: number;
  currency: string;
  userId: string;
  onSuccess: (subscription: any) => void;
}

export function PaymentModal({
  isOpen,
  onClose,
  planId,
  planName,
  billingCycle,
  price,
  currency,
  userId,
  onSuccess
}: PaymentModalProps) {
  const [step, setStep] = useState<'payment' | 'processing' | 'success'>('payment');
  const [paymentData, setPaymentData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = async () => {
    setIsLoading(true);
    
    try {
      // 創建支付意圖
      const response = await fetch('/aihome/api/payment/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({
          planId,
          billingCycle,
          paymentMethod: 'stripe'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setPaymentData(data.data);
        setStep('processing');
        
        // 模擬支付處理
        setTimeout(() => {
          handlePaymentSuccess(data.data);
        }, 2000);
      } else {
        console.error('創建支付意圖失敗:', data.error);
      }
    } catch (error) {
      console.error('支付處理錯誤:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntentData: any) => {
    try {
      // 確認支付
      const response = await fetch('/aihome/api/payment/confirm-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({
          paymentRecordId: paymentIntentData.paymentRecordId,
          paymentIntentId: paymentIntentData.paymentIntentId,
          status: 'succeeded',
          planId: planId,
          billingCycle: billingCycle
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setStep('success');
        setPaymentData(data.data);
        
        // 延遲跳轉到支付成功頁面
        setTimeout(() => {
          const successUrl = `/aihome/payment-success?payment_intent=${paymentIntentData.paymentIntentId}&plan_name=${encodeURIComponent(planName)}&amount=${price}`;
          window.location.href = successUrl;
        }, 2000);
        
        onSuccess(data.data.subscription);
      } else {
        console.error('支付確認失敗:', data.error);
      }
    } catch (error) {
      console.error('支付確認錯誤:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('zh-HK', {
      style: 'currency',
      currency: 'HKD',
    }).format(price);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <HanamiCard className="relative">
            {/* 關閉按鈕 */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-[#4B4036] hover:text-[#2B3A3B] transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>

            {/* 支付步驟 */}
            {step === 'payment' && (
              <div className="text-center">
                <h2 className="text-2xl font-bold text-[#4B4036] mb-4">
                  確認訂閱
                </h2>
                
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-[#4B4036] mb-2">
                    {planName}
                  </h3>
                  <p className="text-[#2B3A3B] mb-2">
                    {billingCycle === 'monthly' ? '月付' : '年付'}
                  </p>
                  <p className="text-3xl font-bold text-[#FFD59A]">
                    {formatPrice(price)}
                  </p>
                </div>

                <div className="mb-6 p-4 bg-[#FFF9F2] rounded-lg">
                  <p className="text-sm text-[#4B4036] mb-2">
                    支付方式：Stripe 安全支付
                  </p>
                  <p className="text-xs text-[#2B3A3B]">
                    您的支付信息將通過 Stripe 安全處理
                  </p>
                </div>

                <HanamiButton
                  onClick={handlePayment}
                  className="w-full"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? '處理中...' : '確認支付'}
                </HanamiButton>
              </div>
            )}

            {step === 'processing' && (
              <div className="text-center">
                <div className="mb-6">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#FFD59A] mx-auto mb-4"></div>
                  <h2 className="text-xl font-bold text-[#4B4036] mb-2">
                    處理支付中...
                  </h2>
                  <p className="text-[#2B3A3B]">
                    請稍候，我們正在處理您的支付
                  </p>
                </div>
              </div>
            )}

            {step === 'success' && (
              <div className="text-center">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckIcon className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-[#4B4036] mb-2">
                    支付成功！
                  </h2>
                  <p className="text-[#2B3A3B]">
                    您的訂閱已激活，正在跳轉...
                  </p>
                </div>
              </div>
            )}
          </HanamiCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
