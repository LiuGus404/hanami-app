'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { XCircleIcon } from '@heroicons/react/24/outline';
import { PAYMENT_METHODS, createAirwallexPayment, uploadScreenshot } from '@/lib/paymentUtils';
import { PaymentMethod as PaymentMethodType, PaymentRequest, ScreenshotUploadData } from '@/types/payment';
import { getPrimaryPaymeFpsAccount, formatPaymePhone, generatePaymePaymentInstructions } from '@/lib/paymeFpsUtils';
import { PaymentInfo } from '@/types/payme-fps';
import { SimpleDiscountInfo } from '@/types/simple-promo-codes';
import SimplePromoCodeInput from './SimplePromoCodeInput';

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
  user?: { 
    id: string; 
    full_name?: string; 
    email?: string; 
    phone?: string; 
  } | null;
  orgPhone?: string | null; // 機構電話號碼
  orgId?: string | null; // 機構 ID
  orgData?: {
    org_name?: string;
    contact_phone?: string;
    contact_email?: string;
  } | null; // 機構資料
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
  user = null,
  orgPhone = null,
  orgId = null,
  orgData = null
}: PaymentMethodSelectorProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [airwallexLoading, setAirwallexLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paymentWindowRef, setPaymentWindowRef] = useState<Window | null>(null);
  const [showRetryButton, setShowRetryButton] = useState(false);
  const [lastCheckoutUrl, setLastCheckoutUrl] = useState<string | null>(null);

  // 根據機構 ID 過濾支付方法
  const availablePaymentMethods = useMemo(() => {
    // 如果機構不是 Hanami Music，過濾掉 Airwallex
    if (orgId && orgId !== 'f8d269ec-b682-45d1-a796-3b74c2bf3eec') {
      return PAYMENT_METHODS.filter(method => method.id !== 'airwallex');
    }
    return PAYMENT_METHODS;
  }, [orgId]);

  // 如果當前選中的是 Airwallex 但機構不是 Hanami Music，自動清除選擇
  useEffect(() => {
    if (selectedMethod === 'airwallex' && orgId && orgId !== 'f8d269ec-b682-45d1-a796-3b74c2bf3eec') {
      onMethodChange('');
    }
  }, [orgId, selectedMethod, onMethodChange]);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [backupImageUrl, setBackupImageUrl] = useState<string | null>(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [discountInfo, setDiscountInfo] = useState<SimpleDiscountInfo | null>(null);

  // 載入支付資訊
  useEffect(() => {
    const loadPaymentInfo = async () => {
      try {
        console.log('🔄 開始載入支付資訊...');
        const info = await getPrimaryPaymeFpsAccount();
        console.log('📋 載入的支付資訊:', info);
        setPaymentInfo(info);
      } catch (error) {
        console.error('❌ 載入支付資訊失敗:', error);
        
        // 如果 API 載入失敗，使用硬編碼的備用資料
        console.log('🔄 使用備用支付資訊...');
        const fallbackInfo: PaymentInfo = {
          payme_phone: '+852-92570768',
          payme_name: 'HanamiEcho',
          payme_link: 'https://payme.hsbc/hanamiecho',
          fps_phone: '+852-98271410',
          fps_name: 'Hanami Music Ltd',
          fps_link: undefined,
          notes: 'HanamiEcho支付帳戶'
        };
        console.log('📋 備用支付資訊:', fallbackInfo);
        setPaymentInfo(fallbackInfo);
      }
    };

    loadPaymentInfo();
  }, []);

  // 處理折扣應用
  const handleDiscountApplied = (discount: SimpleDiscountInfo | null) => {
    setDiscountInfo(discount);
  };

  // 計算最終金額
  const finalAmount = discountInfo ? discountInfo.final_amount : amount;

  // 清除舊支付視窗
  const clearPaymentWindow = () => {
    if (paymentWindowRef && !paymentWindowRef.closed) {
      try {
        paymentWindowRef.close();
        console.log('✅ 已關閉舊支付視窗');
      } catch (error) {
        console.error('❌ 關閉舊視窗失敗:', error);
      }
    }
    setPaymentWindowRef(null);
    setShowRetryButton(false);
    setLastCheckoutUrl(null);
  };

  // 重試打開支付視窗
  const handleRetryPayment = () => {
    clearPaymentWindow();
    if (lastCheckoutUrl) {
      // 直接使用上次的 URL 重試打開
      handleOpenPaymentWindow(lastCheckoutUrl);
    } else {
      // 如果沒有保存的 URL，重新調用完整流程
      handleAirwallexPayment();
    }
  };

  // 打開支付視窗的通用函數
  const handleOpenPaymentWindow = (checkoutUrl: string) => {
    setAirwallexLoading(true);
    setErrors({});
    setShowRetryButton(false);
    
    let paymentWindow: Window | null = null;
    let popupOpened = false;
    
    console.log('🔍 開始嘗試打開新視窗，URL:', checkoutUrl);
    
    try {
      // 方法 1: 標準 window.open 帶詳細參數
      console.log('🚀 嘗試方法1：使用詳細參數');
      paymentWindow = window.open(checkoutUrl, 'airwallex_payment', 'width=1200,height=800,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no,popup=yes');
      
      console.log('🔍 方法1結果：', { paymentWindow: !!paymentWindow, closed: paymentWindow?.closed });
      
      if (paymentWindow && !paymentWindow.closed) {
        popupOpened = true;
        console.log('✅ 方法1成功：使用詳細參數打開新視窗');
      } else {
        // 方法 2: 使用更寬鬆的參數
        console.log('🚀 嘗試方法2：使用寬鬆參數');
        paymentWindow = window.open(checkoutUrl, 'airwallex_payment', 'width=800,height=600,scrollbars=yes,resizable=yes');
        
        console.log('🔍 方法2結果：', { paymentWindow: !!paymentWindow, closed: paymentWindow?.closed });
        
        if (paymentWindow && !paymentWindow.closed) {
          popupOpened = true;
          console.log('✅ 方法2成功：使用寬鬆參數打開新視窗');
        } else {
          // 方法 3: 使用 _blank 目標
          console.log('🚀 嘗試方法3：使用 _blank 目標');
          paymentWindow = window.open(checkoutUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
          
          console.log('🔍 方法3結果：', { paymentWindow: !!paymentWindow, closed: paymentWindow?.closed });
          
          if (paymentWindow && !paymentWindow.closed) {
            popupOpened = true;
            console.log('✅ 方法3成功：使用 _blank 目標打開新視窗');
          } else {
            // 方法 4: 創建臨時鏈接並點擊（使用 _blank）
            console.log('🚀 嘗試方法4：使用臨時鏈接');
            const tempLink = document.createElement('a');
            tempLink.href = checkoutUrl;
            tempLink.target = '_blank';
            tempLink.rel = 'noopener noreferrer';
            document.body.appendChild(tempLink);
            tempLink.click();
            document.body.removeChild(tempLink);
            
            // 使用 _blank 會在新標籤頁打開，假設成功
            // 注意：_blank 打開新標籤頁時，window.open 可能返回 null，但實際上已經打開了
            popupOpened = true;
            console.log('✅ 方法4完成：使用臨時鏈接（_blank），已在新標籤頁打開');
          }
        }
      }
      
        // 處理成功打開視窗的情況
      if (popupOpened) {
        console.log('✅ 新視窗打開成功');
        
        // 如果有 paymentWindow 引用，設置監聽器
        if (paymentWindow) {
          console.log('✅ 設置視窗監聽器');
          setPaymentWindowRef(paymentWindow);
          
          // 聚焦到新視窗
          paymentWindow.focus();
          
          // 添加載入監聽
          paymentWindow.addEventListener('load', () => {
            console.log('🔄 Airwallex 頁面載入完成');
          });

          paymentWindow.addEventListener('error', (error) => {
            console.error('❌ Airwallex 頁面載入錯誤:', error);
          });

          // 監聽支付完成消息
          const handleMessage = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;
            
            if (event.data.type === 'PAYMENT_SUCCESS') {
              clearInterval(checkClosed);
              clearPaymentWindow();
              onPaymentSuccess?.(event.data);
              window.removeEventListener('message', handleMessage);
            } else if (event.data.type === 'PAYMENT_CANCELLED') {
              clearInterval(checkClosed);
              clearPaymentWindow();
              onPaymentError?.('支付已取消');
              window.removeEventListener('message', handleMessage);
            }
          };

          window.addEventListener('message', handleMessage);

          // 監聽視窗關閉
          const checkClosed = setInterval(() => {
            if (paymentWindow?.closed) {
              clearInterval(checkClosed);
              window.removeEventListener('message', handleMessage);
              clearPaymentWindow();
              console.log('🔄 支付視窗已關閉');
            }
          }, 1000);

          // 10分鐘後自動清理
          setTimeout(() => {
            clearInterval(checkClosed);
            if (paymentWindow && !paymentWindow.closed) {
              paymentWindow.close();
            }
            window.removeEventListener('message', handleMessage);
            clearPaymentWindow();
          }, 600000);
        } else {
          // 如果 paymentWindow 為 null（例如使用 _blank 打開新標籤頁），仍然視為成功
          console.log('✅ 使用 _blank 打開新標籤頁，無法設置監聽器，但視窗已打開');
        }
        
        // 不立即調用 onPaymentSuccess，等待真正的支付完成
        console.log('✅ 新視窗已打開，等待支付完成...');
        setAirwallexLoading(false);
      } else {
        // 如果所有方法都失敗，顯示錯誤和重試按鈕
        console.error('❌ 所有打開新視窗的方法都失敗了');
        setLastCheckoutUrl(checkoutUrl);
        setShowRetryButton(true);
        setErrors({ airwallex: '無法打開支付視窗，請檢查瀏覽器設置或允許彈窗' });
        onPaymentError?.('無法打開支付視窗，請檢查瀏覽器設置或允許彈窗');
        setAirwallexLoading(false);
      }
      
    } catch (error) {
      console.error('❌ 打開新視窗失敗:', error);
      setLastCheckoutUrl(checkoutUrl);
      setShowRetryButton(true);
      setErrors({ airwallex: '打開支付視窗時發生錯誤，請檢查瀏覽器設置' });
      onPaymentError?.('打開支付視窗時發生錯誤，請檢查瀏覽器設置');
      setAirwallexLoading(false);
    }
  };

  // 處理 Airwallex 支付
  const handleAirwallexPayment = async () => {
    // 先清除舊視窗
    clearPaymentWindow();
    
    setAirwallexLoading(true);
    setErrors({});
    
    try {
      const paymentRequest: PaymentRequest = {
        amount: finalAmount,
        currency: currency.toUpperCase(),
        description: description,
        return_url: `${window.location.origin}/aihome/test-payment/success`,
        cancel_url: `${window.location.origin}/aihome/test-payment/cancel`,
        // 添加用戶預填信息
        ...(user?.full_name && { customer_name: user.full_name }),
        ...(user?.email && { customer_email: user.email }),
        ...(user?.phone && { customer_phone: user.phone })
      };

      const result = await createAirwallexPayment(paymentRequest);
      
      if (result.success && result.checkout_url) {
        // 顯示調試信息
        if (result.debug_info) {
          console.log('🔍 Airwallex API 調試信息:', result.debug_info);
        }
        
        // 檢查是否為測試模式
        console.log('🔍 檢查支付模式:', { is_test_mode: result.is_test_mode, checkout_url: result.checkout_url });
        
        if (result.is_test_mode) {
          // 測試模式：模擬支付成功
          console.log('🧪 測試模式：模擬 Airwallex 支付成功');
          onPaymentSuccess?.({
            success: true,
            payment_intent_id: result.payment_intent_id,
            status: 'succeeded',
            amount: result.amount,
            currency: result.currency,
            message: '測試支付成功'
          });
        } else {
          // 生產模式：只在新視窗中打開 Airwallex 支付頁面
          console.log('🚀 真實模式：只在新視窗中打開 Airwallex 支付');
          console.log('📍 支付 URL:', result.checkout_url);
          console.log('🆔 Payment Intent ID:', result.payment_intent_id);
          console.log('🔐 Client Secret 狀態:', result.debug_info?.client_secret);
          
          // 使用通用函數打開支付視窗
          handleOpenPaymentWindow(result.checkout_url);
        }

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
      const uploadData: ScreenshotUploadData & { userId?: string; orgId?: string | null } = {
        file: uploadedFile,
        amount: amount,
        description: description,
        userId: user?.id,
        orgId: orgId || null,
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
        // 使用真正的 Supabase URL 而不是 result.url
        setUploadedImageUrl(result.data?.public_url || result.url || null);
        // 設置備用 URL
        setBackupImageUrl(result.url || null);
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
      console.log('🔍 準備刪除圖片，URL:', uploadedImageUrl);
      console.log('🔍 用戶 ID:', user?.id);
      
      // 驗證 URL 格式
      if (!uploadedImageUrl || typeof uploadedImageUrl !== 'string') {
        throw new Error('無效的圖片 URL');
      }
      
      // 調用刪除 API
      const response = await fetch(`/api/aihome/payment/delete-screenshot?imageUrl=${encodeURIComponent(uploadedImageUrl)}&userId=${user?.id || ''}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      console.log('🔍 刪除 API 回應:', result);
      
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
      
      // 通知父組件圖片已刪除，需要重新上傳
      if (onPaymentSuccess) {
        onPaymentSuccess({
          success: true,
          screenshotDeleted: true,
          message: '圖片已刪除，請重新上傳'
        });
      }
      
      console.log('✅ 圖片刪除成功');
    } catch (error) {
      console.error('❌ 刪除圖片失敗:', error);
      setErrors({ screenshot: error instanceof Error ? error.message : '刪除圖片失敗，請稍後再試' });
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
          {availablePaymentMethods.map((method) => (
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
                  <div className="text-sm text-[#2B3A3B]/70 whitespace-pre-line">{method.description}</div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* 支付說明 */}
        <div className="bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A]/20 rounded-xl p-4 border border-[#EADBC8]">
          <h4 className="font-semibold text-[#4B4036] mb-2">支付說明</h4>
          <ul className="text-sm text-[#2B3A3B]/70 space-y-1">
            <li>• 確認報名後，我們會在1-2個工作天內與您確認資料</li>
            <li>• 請保留付款截圖</li>
            <li>• 一經確認，費用將無法退回</li>
            <li>• 如有任何支付問題，歡迎與我們聯絡</li>
          </ul>
          
          {/* WhatsApp 聯絡按鍵 */}
          {orgPhone && (() => {
            // 處理電話號碼格式：移除所有空格、括號、破折號等，保留數字和 + 號
            const cleanPhone = orgPhone.replace(/[\s\-\(\)]/g, '');
            // 如果沒有 + 號，確保有國家代碼（預設 +852）
            const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone.substring(1) : (cleanPhone.startsWith('852') ? cleanPhone : `852${cleanPhone}`);
            
            return (
              <div className="mt-4 pt-4 border-t border-[#EADBC8]">
                <p className="text-sm text-[#2B3A3B]/70 mb-3">
                  如有支付上的困難和問題，可以直接與我們聯絡：
                </p>
                <motion.a
                  href={`https://api.whatsapp.com/send/?phone=${formattedPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                  <span className="font-medium">WhatsApp 聯絡我們</span>
                </motion.a>
              </div>
            );
          })()}
        </div>


        {/* 優惠碼輸入區域 */}
        {showPaymentActions && (
          <SimplePromoCodeInput
            originalAmount={amount}
            currency={currency}
            userId={user?.id}
            userEmail={user?.email}
            orgId={orgId || undefined}
            onDiscountApplied={handleDiscountApplied}
            className="mb-4"
          />
        )}

        {/* 支付方法提示 */}
        {showPaymentActions && !selectedMethod && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4"
          >
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-blue-700 text-sm">
                請選擇上方的支付方法以繼續
              </p>
            </div>
          </motion.div>
        )}


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
              
              {/* 價格顯示 */}
              <div className="mt-2">
                {discountInfo ? (
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 line-through">
                      {new Intl.NumberFormat('zh-HK', {
                        style: 'currency',
                        currency: currency,
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      }).format(amount)}
                    </p>
                    <p className="text-xl font-bold text-[#4B4036]">
                      {new Intl.NumberFormat('zh-HK', {
                        style: 'currency',
                        currency: currency,
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      }).format(finalAmount)}
                    </p>
                    <p className="text-sm text-green-600 font-medium">
                      已節省 {new Intl.NumberFormat('zh-HK', {
                        style: 'currency',
                        currency: currency,
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      }).format(discountInfo.discount_amount)}
                    </p>
                  </div>
                ) : (
                  <p className="text-xl font-bold text-[#4B4036]">
                    {new Intl.NumberFormat('zh-HK', {
                      style: 'currency',
                      currency: currency,
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    }).format(finalAmount)}
                  </p>
                )}
              </div>
            </div>

            {/* 截圖上傳區域 */}
            {selectedMethod === 'screenshot' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                {/* 支付資訊顯示 */}
                {paymentInfo && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl p-6 border border-[#EADBC8] shadow-sm mb-4"
                  >
                    <h3 className="text-lg font-bold text-[#4B4036] mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      PAYME FPS 支付資訊
                    </h3>

                    {/* 其他機構提示 */}
                    {orgId && orgId !== 'f8d269ec-b682-45d1-a796-3b74c2bf3eec' && orgData && (
                      <div className="mb-4 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                        <div className="flex items-start space-x-3">
                          <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <div className="flex-1">
                            <h4 className="font-semibold text-yellow-800 mb-2">重要提示</h4>
                            <p className="text-sm text-yellow-700 mb-3">
                              您選擇的機構是 <span className="font-semibold">{orgData.org_name || '其他機構'}</span>，請在付款前與該機構確認支付資訊。
                            </p>
                            <div className="bg-white rounded-lg p-3 space-y-2 text-sm">
                              {orgData.org_name && (
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-600">機構名稱:</span>
                                  <span className="font-medium text-gray-800">{orgData.org_name}</span>
                                </div>
                              )}
                              {orgData.contact_phone && (
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-600">聯絡電話:</span>
                                  <span className="font-medium text-gray-800">{orgData.contact_phone}</span>
                                </div>
                              )}
                              {orgData.contact_email && (
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-600">聯絡電郵:</span>
                                  <span className="font-medium text-gray-800">{orgData.contact_email}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 只有 Hanami Music 才顯示 PAYME 和 FPS 帳戶資訊 */}
                    {(!orgId || orgId === 'f8d269ec-b682-45d1-a796-3b74c2bf3eec') && (
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
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
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
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
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
                    )}

                    {paymentInfo.notes && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">備註:</span> {paymentInfo.notes}
                        </p>
                      </div>
                    )}

                    {/* 支付說明 */}
                    <div className="mt-4 p-3 bg-gradient-to-r from-[#FFF9F2] to-[#FFD59A]/20 rounded-lg border border-[#EADBC8]">
                      <h4 className="font-semibold text-[#4B4036] mb-2">支付說明</h4>
                      <div className="text-sm text-[#2B3A3B]/70 space-y-1">
                        <p>• 請使用上述 PAYME 或 FPS 帳戶進行轉帳</p>
                        <p>• 轉帳完成後請截圖並上傳確認</p>
                        <p>• 我們將在 1 個工作天內確認您的付款</p>
                        <p>• 如有任何問題，歡迎與我們聯絡</p>
                      </div>
                      
                      {/* WhatsApp 聯絡按鍵 */}
                      {orgPhone && (
                        <div className="mt-3 pt-3 border-t border-[#EADBC8]">
                          <motion.a
                            href={(() => {
                              // 處理電話號碼格式：移除所有空格、括號、破折號等，保留數字和 + 號
                              const cleanPhone = orgPhone.replace(/[\s\-\(\)]/g, '');
                              // 如果沒有 + 號，確保有國家代碼（預設 +852）
                              const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone.substring(1) : (cleanPhone.startsWith('852') ? cleanPhone : `852${cleanPhone}`);
                              return `https://api.whatsapp.com/send/?phone=${formattedPhone}`;
                            })()}
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="inline-flex items-center justify-center px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg text-sm"
                          >
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                            </svg>
                            <span className="font-medium">WhatsApp 聯絡</span>
                          </motion.a>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

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
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <p className="text-sm text-red-600 flex items-center">
                      <XCircleIcon className="w-4 h-4 mr-1" />
                      {errors.airwallex}
                    </p>
                    
                    {showRetryButton && (
                      <motion.button
                        onClick={handleRetryPayment}
                        disabled={airwallexLoading}
                        whileHover={!airwallexLoading ? { scale: 1.02 } : {}}
                        whileTap={!airwallexLoading ? { scale: 0.98 } : {}}
                        className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                          airwallexLoading
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-md'
                        }`}
                      >
                        <div className="flex items-center justify-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          重新打開支付視窗
                        </div>
                      </motion.button>
                    )}
                  </motion.div>
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
                      <p className="font-medium mb-1">新視窗支付說明：</p>
                      <ul className="space-y-1 text-xs">
                        <li>• 系統會嘗試多種方式在新視窗中打開支付頁面</li>
                        <li>• 如果新視窗被阻擋，會嘗試其他方式</li>
                        <li>• 完成支付後會自動關閉新視窗</li>
                        <li>• 如果瀏覽器阻止彈窗，請允許彈窗後重試</li>
                        <li>• 支付完成後會在原頁面顯示結果</li>
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
