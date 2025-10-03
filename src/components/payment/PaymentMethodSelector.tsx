'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { XCircleIcon } from '@heroicons/react/24/outline';
import { PAYMENT_METHODS, createAirwallexPayment, uploadScreenshot } from '@/lib/paymentUtils';
import { PaymentMethod as PaymentMethodType, PaymentRequest, ScreenshotUploadData } from '@/types/payment';

interface PaymentMethodSelectorProps {
  selectedMethod: string;
  onMethodChange: (methodId: string) => void;
  amount: number;
  currency?: string;
  description: string;
  onPaymentSuccess?: (data: any) => void;
  onPaymentError?: (error: string) => void;
  className?: string;
  showPaymentActions?: boolean;
}

export default function PaymentMethodSelector({
  selectedMethod,
  onMethodChange,
  amount,
  currency = 'HKD',
  description,
  onPaymentSuccess,
  onPaymentError,
  className = '',
  showPaymentActions = true
}: PaymentMethodSelectorProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [airwallexLoading, setAirwallexLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 處理 Airwallex 支付
  const handleAirwallexPayment = async () => {
    setAirwallexLoading(true);
    setErrors({});
    
    try {
      const paymentRequest: PaymentRequest = {
        amount: amount,
        currency: currency.toUpperCase(),
        description: description,
        return_url: `${window.location.origin}/aihome/test-payment/success`,
        cancel_url: `${window.location.origin}/aihome/test-payment/cancel`
      };

      const result = await createAirwallexPayment(paymentRequest);
      
      if (result.success && result.checkout_url) {
        // 重定向到 Airwallex 支付頁面
        window.location.href = result.checkout_url;
      } else {
        throw new Error(result.error || '支付創建失敗');
      }
    } catch (error) {
      console.error('Airwallex 支付錯誤:', error);
      const errorMessage = error instanceof Error ? error.message : '支付創建失敗，請稍後再試';
      setErrors({ airwallex: errorMessage });
      onPaymentError?.(errorMessage);
    } finally {
      setAirwallexLoading(false);
    }
  };

  // 處理截圖上傳
  const handleScreenshotUpload = async () => {
    if (!uploadedFile) {
      setErrors({ screenshot: '請先選擇要上傳的檔案' });
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setErrors({});

    try {
      const uploadData: ScreenshotUploadData = {
        file: uploadedFile,
        amount: amount,
        description: description,
        metadata: {
          upload_date: new Date().toISOString(),
          original_filename: uploadedFile.name,
          file_size: uploadedFile.size,
          file_type: uploadedFile.type
        }
      };

      const result = await uploadScreenshot(uploadData);
      
      if (result.success) {
        onPaymentSuccess?.(result);
        setUploadedFile(null);
        setUploadProgress(0);
      } else {
        throw new Error(result.error || '上傳失敗');
      }
    } catch (error) {
      console.error('截圖上傳錯誤:', error);
      const errorMessage = error instanceof Error ? error.message : '上傳失敗，請稍後再試';
      setErrors({ screenshot: errorMessage });
      onPaymentError?.(errorMessage);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // 處理檔案選擇
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 驗證檔案類型
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setErrors({ screenshot: '請選擇圖片檔案 (JPG, PNG, GIF, WebP)' });
        return;
      }

      // 驗證檔案大小 (最大 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrors({ screenshot: '檔案大小不能超過 10MB' });
        return;
      }

      setUploadedFile(file);
      setErrors({});
    }
  };

  return (
    <div className={`space-y-4 sm:space-y-6 ${className}`}>
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#4B4036] mb-2">選擇支付方法</h2>
        <p className="text-sm sm:text-base text-[#2B3A3B]">請選擇您偏好的支付方式</p>
      </div>

      <div className="space-y-4">
        {/* 支付方法選項 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PAYMENT_METHODS.map((method) => (
            <motion.button
              key={method.id}
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onMethodChange(method.id)}
              className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                selectedMethod === method.id
                  ? 'border-[#FFD59A] bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A]/20 shadow-lg'
                  : 'border-[#EADBC8] bg-white hover:border-[#FFD59A]/50'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  method.type === 'screenshot' 
                    ? 'bg-gradient-to-br from-green-500 to-green-600'
                    : 'bg-gradient-to-br from-blue-500 to-blue-600'
                }`}>
                  <method.icon />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-[#4B4036] mb-1">{method.name}</h3>
                  <p className="text-sm text-[#2B3A3B]/70">{method.description}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* 支付說明 */}
        <div className="bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A]/20 rounded-xl p-4 border border-[#EADBC8]">
          <h4 className="font-semibold text-[#4B4036] mb-2">支付說明</h4>
          <ul className="text-sm text-[#2B3A3B]/70 space-y-1">
            <li>• 確認報名後，我們會提供詳細的支付資訊</li>
            <li>• 請在收到確認通知後3天內完成付款</li>
            <li>• 付款完成後，課程安排將正式確認</li>
            <li>• 如有任何支付問題，請聯絡客服</li>
          </ul>
        </div>

        {/* 支付操作區域 */}
        {showPaymentActions && selectedMethod && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-[#EADBC8]">
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold text-[#4B4036] mb-2">支付詳情</h3>
              <p className="text-sm text-[#2B3A3B]">{description}</p>
              <p className="text-xl font-bold text-[#4B4036] mt-2">
                {new Intl.NumberFormat('zh-HK', {
                  style: 'currency',
                  currency: currency,
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }).format(amount)}
              </p>
            </div>

            {/* 截圖上傳區域 */}
            {selectedMethod === 'screenshot' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#4B4036] mb-2">
                    上傳付款截圖
                  </label>
                  <div className="border-2 border-dashed border-[#EADBC8] rounded-xl p-6 text-center hover:border-[#FFD59A] transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="screenshot-upload"
                    />
                    <label
                      htmlFor="screenshot-upload"
                      className="cursor-pointer block"
                    >
                      {uploadedFile ? (
                        <div className="space-y-2">
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <p className="text-sm font-medium text-[#4B4036]">{uploadedFile.name}</p>
                          <p className="text-xs text-[#2B3A3B]/70">
                            {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="w-12 h-12 bg-[#FFF9F2] rounded-full flex items-center justify-center mx-auto">
                            <svg className="w-6 h-6 text-[#4B4036]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </div>
                          <p className="text-sm font-medium text-[#4B4036]">點擊選擇檔案</p>
                          <p className="text-xs text-[#2B3A3B]/70">支援 JPG, PNG, GIF, WebP (最大 10MB)</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {uploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#4B4036]">上傳中...</span>
                      <span className="text-[#2B3A3B]/70">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <motion.button
                  onClick={handleScreenshotUpload}
                  disabled={!uploadedFile || uploading}
                  whileHover={!uploading && uploadedFile ? { scale: 1.02 } : {}}
                  whileTap={!uploading && uploadedFile ? { scale: 0.98 } : {}}
                  className={`w-full py-3 px-6 rounded-xl font-bold transition-all duration-200 ${
                    !uploadedFile || uploading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-lg'
                  }`}
                >
                  {uploading ? '上傳中...' : '上傳付款截圖'}
                </motion.button>

                {errors.screenshot && (
                  <p className="text-sm text-red-600 flex items-center">
                    <XCircleIcon className="w-4 h-4 mr-1" />
                    {errors.screenshot}
                  </p>
                )}
              </div>
            )}

            {/* Airwallex 支付區域 */}
            {selectedMethod === 'airwallex' && (
              <div className="space-y-4">
                <motion.button
                  onClick={handleAirwallexPayment}
                  disabled={airwallexLoading}
                  whileHover={!airwallexLoading ? { scale: 1.02 } : {}}
                  whileTap={!airwallexLoading ? { scale: 0.98 } : {}}
                  className={`w-full py-3 px-6 rounded-xl font-bold transition-all duration-200 ${
                    airwallexLoading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg'
                  }`}
                >
                  {airwallexLoading ? '處理中...' : '前往 Airwallex 支付'}
                </motion.button>

                {errors.airwallex && (
                  <p className="text-sm text-red-600 flex items-center">
                    <XCircleIcon className="w-4 h-4 mr-1" />
                    {errors.airwallex}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* 通用錯誤顯示 */}
        {Object.keys(errors).length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center">
              <XCircleIcon className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-sm text-red-600">
                {Object.values(errors)[0]}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
