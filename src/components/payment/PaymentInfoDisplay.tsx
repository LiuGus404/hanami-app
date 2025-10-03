'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  PhoneIcon, 
  LinkIcon, 
  ClipboardDocumentIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { PaymentInfo } from '@/types/payme-fps';
import { getPrimaryPaymeFpsAccount, formatPaymePhone, generatePaymePaymentInstructions } from '@/lib/paymeFpsUtils';

interface PaymentInfoDisplayProps {
  className?: string;
  showInstructions?: boolean;
}

export default function PaymentInfoDisplay({ 
  className = '',
  showInstructions = true 
}: PaymentInfoDisplayProps) {
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadPaymentInfo = async () => {
      try {
        const info = await getPrimaryPaymeFpsAccount();
        setPaymentInfo(info);
      } catch (error) {
        console.error('載入支付資訊失敗:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPaymentInfo();
  }, []);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('複製失敗:', error);
    }
  };

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="bg-white rounded-xl p-6 border border-[#EADBC8] shadow-sm">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!paymentInfo) {
    return (
      <div className={`${className}`}>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <InformationCircleIcon className="w-6 h-6 text-yellow-600" />
            <div>
              <h3 className="font-semibold text-yellow-800">支付資訊未設置</h3>
              <p className="text-sm text-yellow-700">請聯繫管理員設置 PAYME FPS 支付資訊</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* PAYME 帳戶資訊 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-6 border border-[#EADBC8] shadow-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#4B4036] flex items-center">
            <PhoneIcon className="w-5 h-5 mr-2 text-green-600" />
            PAYME 支付資訊
          </h3>
          {showInstructions && (
            <button
              onClick={() => copyToClipboard(generatePaymePaymentInstructions(paymentInfo))}
              className="flex items-center space-x-2 px-3 py-1 bg-[#FFD59A] text-[#4B4036] rounded-lg text-sm font-medium hover:bg-[#FFD59A]/80 transition-colors"
            >
              {copied ? (
                <>
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>已複製</span>
                </>
              ) : (
                <>
                  <ClipboardDocumentIcon className="w-4 h-4" />
                  <span>複製說明</span>
                </>
              )}
            </button>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* PAYME 資訊 */}
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-3">PAYME 帳戶</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">電話號碼:</span>
                <span className="font-mono text-sm font-medium">{formatPaymePhone(paymentInfo.payme_phone)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">收款人:</span>
                <span className="text-sm font-medium">{paymentInfo.payme_name}</span>
              </div>
              {paymentInfo.payme_link && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">支付連結:</span>
                  <a
                    href={paymentInfo.payme_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm flex items-center"
                  >
                    <LinkIcon className="w-4 h-4 mr-1" />
                    開啟
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* FPS 資訊 */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-3">FPS 轉數快</h4>
            {paymentInfo.fps_phone ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">電話號碼:</span>
                  <span className="font-mono text-sm font-medium">{formatPaymePhone(paymentInfo.fps_phone)}</span>
                </div>
                {paymentInfo.fps_name && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">收款人:</span>
                    <span className="text-sm font-medium">{paymentInfo.fps_name}</span>
                  </div>
                )}
                {paymentInfo.fps_link && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">支付連結:</span>
                    <a
                      href={paymentInfo.fps_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm flex items-center"
                    >
                      <LinkIcon className="w-4 h-4 mr-1" />
                      開啟
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">未設置 FPS 帳戶</p>
            )}
          </div>
        </div>

        {paymentInfo.notes && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-medium">備註:</span> {paymentInfo.notes}
            </p>
          </div>
        )}
      </motion.div>

      {/* 支付說明 */}
      {showInstructions && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A]/20 rounded-xl p-4 border border-[#EADBC8]"
        >
          <h4 className="font-semibold text-[#4B4036] mb-3">支付說明</h4>
          <div className="text-sm text-[#2B3A3B]/70 space-y-2">
            <p>• 請使用上述 PAYME 或 FPS 帳戶進行轉帳</p>
            <p>• 轉帳完成後請截圖並上傳確認</p>
            <p>• 我們將在 1 個工作天內確認您的付款</p>
            <p>• 如有任何問題，歡迎與我們聯絡</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
