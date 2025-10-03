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
  user?: { id: string } | null;
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
  showPaymentActions = true,
  user = null
}: PaymentMethodSelectorProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [airwallexLoading, setAirwallexLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [backupImageUrl, setBackupImageUrl] = useState<string | null>(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

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
        // 檢查是否為測試模式
        if (result.is_test_mode) {
          // 測試模式：模擬支付成功
          console.log('測試模式：模擬 Airwallex 支付成功');
          onPaymentSuccess?.({
            success: true,
            payment_intent_id: result.payment_intent_id,
            status: 'succeeded',
            amount: result.amount,
            currency: result.currency,
            message: '測試支付成功'
          });
        } else {
          // 生產模式：直接跳轉到 Airwallex 支付頁面
          console.log('跳轉到 Airwallex 支付頁面:', result.checkout_url);
          window.location.href = result.checkout_url;
        }

        // 監聽支付完成消息
        const handleMessage = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          
          if (event.data.type === 'PAYMENT_SUCCESS') {
            clearInterval(checkClosed);
            paymentWindow.close();
            onPaymentSuccess?.(event.data);
            window.removeEventListener('message', handleMessage);
          } else if (event.data.type === 'PAYMENT_CANCELLED') {
            clearInterval(checkClosed);
            paymentWindow.close();
            onPaymentError?.('支付已取消');
            window.removeEventListener('message', handleMessage);
          }
        };

        window.addEventListener('message', handleMessage);

        // 5分鐘後自動清理
        setTimeout(() => {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
        }, 300000);

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
      const uploadData: ScreenshotUploadData & { userId?: string } = {
        file: uploadedFile,
        amount: amount,
        description: description,
        userId: user?.id,
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
        setUploadSuccess(true);
        setUploadedImageUrl(result.url || null);
        // 設置備用 URL
        setBackupImageUrl(result.data?.public_url);
        setUploadProgress(0);
        // 清理本地預覽 URL
        if (uploadedFile) {
          URL.revokeObjectURL(URL.createObjectURL(uploadedFile));
        }
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
      setUploadSuccess(false);
      setUploadedImageUrl(null);
      setShowImagePreview(true);
    }
  };

  // 清理圖片預覽
  const clearImagePreview = () => {
    if (uploadedImageUrl) {
      URL.revokeObjectURL(uploadedImageUrl);
    }
    setUploadedFile(null);
    setUploadedImageUrl(null);
    setBackupImageUrl(null);
    setShowImagePreview(false);
    setUploadSuccess(false);
    setErrors({});
  };

  // 更換圖片
  const replaceImage = () => {
    clearImagePreview();
    // 觸發檔案選擇
    const fileInput = document.getElementById('screenshot-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = ''; // 清空輸入值
      fileInput.click();
    }
  };

  // 刪除已上傳的圖片
  const deleteUploadedImage = async () => {
    if (!uploadedImageUrl) return;
    
    try {
      // 調用刪除 API
      const response = await fetch(`/api/aihome/payment/delete-screenshot?imageUrl=${encodeURIComponent(uploadedImageUrl)}&userId=${user?.id || ''}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '刪除失敗');
      }
      
      // 重置狀態
      setUploadedImageUrl(null);
      setBackupImageUrl(null);
      setUploadSuccess(false);
      setUploadedFile(null);
      setShowImagePreview(false);
      setErrors({});
      
      // 清理檔案輸入
      const fileInput = document.getElementById('screenshot-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error) {
      console.error('刪除圖片失敗:', error);
      setErrors({ screenshot: '刪除圖片失敗，請稍後再試' });
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-[#EADBC8]"
          >
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
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-[#4B4036] mb-2">
                    上傳付款截圖
                  </label>
                  
                  {/* 檔案選擇區域 */}
                  {!showImagePreview && !uploadSuccess && (
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
                        <div className="space-y-2">
                          <div className="w-12 h-12 bg-[#FFF9F2] rounded-full flex items-center justify-center mx-auto">
                            <svg className="w-6 h-6 text-[#4B4036]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </div>
                          <p className="text-sm font-medium text-[#4B4036]">點擊選擇檔案</p>
                          <p className="text-xs text-[#2B3A3B]/70">支援 JPG, PNG, GIF, WebP (最大 10MB)</p>
                        </div>
                      </label>
                    </div>
                  )}

                  {/* 圖片預覽區域 */}
                  {showImagePreview && uploadedFile && !uploadSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="bg-white border-2 border-[#EADBC8] rounded-xl p-4">
                        <h4 className="text-sm font-medium text-[#4B4036] mb-3">圖片預覽</h4>
                        <div className="relative">
                          <img
                            src={URL.createObjectURL(uploadedFile)}
                            alt="付款截圖預覽"
                            className="w-full max-w-md mx-auto rounded-lg shadow-sm"
                            style={{ maxHeight: '300px', objectFit: 'contain' }}
                          />
                        </div>
                        <div className="mt-3 text-center">
                          <p className="text-sm font-medium text-[#4B4036]">{uploadedFile.name}</p>
                          <p className="text-xs text-[#2B3A3B]/70">
                            {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-3">
                        <motion.button
                          onClick={clearImagePreview}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex-1 py-2 px-4 bg-[#FFF9F2] text-[#4B4036] border border-[#EADBC8] rounded-lg hover:bg-[#FFD59A]/20 transition-colors font-medium"
                        >
                          重新選擇
                        </motion.button>
                        <motion.button
                          onClick={handleScreenshotUpload}
                          disabled={uploading}
                          whileHover={!uploading ? { scale: 1.02 } : {}}
                          whileTap={!uploading ? { scale: 0.98 } : {}}
                          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                            uploading
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] hover:from-[#EBC9A4] hover:to-[#FFD59A] shadow-lg'
                          }`}
                        >
                          {uploading ? '上傳中...' : '確認上傳'}
                        </motion.button>
                      </div>
                    </motion.div>
                  )}

                  {/* 上傳成功區域 */}
                  {uploadSuccess && uploadedImageUrl && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="bg-gradient-to-br from-[#E0F2E0] to-[#FFF9F2] border-2 border-[#EADBC8] rounded-xl p-4">
                        <div className="flex items-center justify-center mb-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-[#4B4036]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                        <h4 className="text-lg font-bold text-[#4B4036] text-center mb-2">上傳成功！</h4>
                        <p className="text-sm text-[#2B3A3B] text-center mb-4">
                          您的付款截圖已成功上傳，我們將盡快確認您的付款。
                        </p>
                      </div>

                      {/* 隱私保護提示 */}
                      <div className="bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A]/20 border border-[#EADBC8] rounded-xl p-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg className="w-4 h-4 text-[#4B4036]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </div>
                          <div className="text-sm text-[#4B4036]">
                            <p className="font-medium mb-1">隱私保護</p>
                            <p className="text-xs text-[#2B3A3B]/80">
                              這張圖片只有您可以看到，其他用戶無法查看您的付款截圖。您可以隨時刪除這張圖片。
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border-2 border-[#EADBC8] rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium text-[#4B4036]">已上傳的圖片</h4>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-xs text-green-600 font-medium">已上傳</span>
                          </div>
                        </div>
                        <div className="relative">
                          {uploadedImageUrl ? (
                            <>
                              <img
                                src={uploadedImageUrl}
                                alt="已上傳的付款截圖"
                                className="w-full max-w-md mx-auto rounded-lg shadow-sm border border-gray-200"
                                style={{ maxHeight: '300px', objectFit: 'contain' }}
                                onError={(e) => {
                                  console.error('主圖片載入失敗，嘗試備用 URL:', uploadedImageUrl);
                                  if (backupImageUrl && e.currentTarget.src !== backupImageUrl) {
                                    console.log('切換到備用 URL:', backupImageUrl);
                                    e.currentTarget.src = backupImageUrl;
                                  } else {
                                    console.error('所有圖片 URL 都載入失敗');
                                    e.currentTarget.style.display = 'none';
                                  }
                                }}
                                onLoad={() => {
                                  console.log('圖片載入成功:', uploadedImageUrl);
                                }}
                              />
                              {/* 圖片保護覆蓋層 */}
                              <div className="absolute inset-0 bg-black/5 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
                                <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
                                  <p className="text-xs font-medium text-gray-700">您的私人圖片</p>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="w-full max-w-md mx-auto h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                              <p className="text-gray-500">圖片載入中...</p>
                            </div>
                          )}
                        </div>
                        <div className="mt-3 text-center">
                          <p className="text-xs text-[#2B3A3B]/70 mb-3 flex items-center justify-center space-x-2">
                            <svg className="w-4 h-4 text-[#FFD59A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>只有您可以看到這張圖片</span>
                            <svg className="w-4 h-4 text-[#EBC9A4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span>隱私保護已啟用</span>
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex justify-center">
                        <motion.button
                          onClick={deleteUploadedImage}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex items-center justify-center py-3 px-6 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-[#4B4036] rounded-xl hover:from-[#FFD59A] hover:to-[#FFB6C1] transition-all duration-200 font-medium shadow-lg"
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          刪除圖片
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </div>

                {uploading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-2"
                  >
                    <div className="flex justify-between text-sm">
                      <span className="text-[#4B4036]">上傳中...</span>
                      <span className="text-[#2B3A3B]/70">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        className="bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </motion.div>
                )}

                {/* 只有在沒有預覽圖片時才顯示這個按鈕 */}
                {!showImagePreview && !uploadSuccess && (
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
                )}

                {errors.screenshot && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-600 flex items-center"
                  >
                    <XCircleIcon className="w-4 h-4 mr-1" />
                    {errors.screenshot}
                  </motion.p>
                )}
              </motion.div>
            )}

            {/* Airwallex 支付區域 */}
            {selectedMethod === 'airwallex' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-bold text-[#4B4036] mb-2">Airwallex 安全支付</h4>
                  <p className="text-sm text-[#2B3A3B]/70 mb-4">
                    點擊下方按鈕將在新視窗中打開 Airwallex 支付頁面，完成支付後視窗會自動關閉
                  </p>
                </div>

                <motion.button
                  onClick={handleAirwallexPayment}
                  disabled={airwallexLoading}
                  whileHover={!airwallexLoading ? { scale: 1.02 } : {}}
                  whileTap={!airwallexLoading ? { scale: 0.98 } : {}}
                  className={`w-full py-4 px-6 rounded-xl font-bold transition-all duration-200 ${
                    airwallexLoading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg'
                  }`}
                >
                  {airwallexLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      正在準備支付...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      在新視窗中打開 Airwallex 支付
                    </div>
                  )}
                </motion.button>

                {errors.airwallex && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-600 flex items-center"
                  >
                    <XCircleIcon className="w-4 h-4 mr-1" />
                    {errors.airwallex}
                  </motion.p>
                )}

                {/* 支付說明 */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">支付說明：</p>
                      <ul className="space-y-1 text-xs">
                        <li>• 點擊按鈕將在新視窗中打開 Airwallex 支付頁面</li>
                        <li>• 完成支付後視窗會自動關閉</li>
                        <li>• 如果視窗被阻擋，請允許彈窗並重試</li>
                        <li>• 支付完成後會自動返回當前頁面</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
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
