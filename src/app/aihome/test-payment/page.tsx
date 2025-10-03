'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCardIcon,
  PhotoIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';
import { getSaasSupabaseClient } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  type: 'screenshot' | 'airwallex';
}

const paymentMethods: PaymentMethod[] = [
  {
    id: 'screenshot',
    name: '上傳付款截圖',
    description: '上傳您的付款截圖，我們將手動確認付款',
    icon: PhotoIcon,
    type: 'screenshot'
  },
  {
    id: 'airwallex',
    name: 'Airwallex 線上支付',
    description: '使用 Airwallex 安全線上支付',
    icon: CreditCardIcon,
    type: 'airwallex'
  },
  {
    id: 'mock-airwallex',
    name: '模擬 Airwallex 支付',
    description: '模擬 Airwallex 支付流程（用於測試）',
    icon: CreditCardIcon,
    type: 'airwallex'
  }
];

export default function TestPaymentPage() {
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('100');
  const [paymentDescription, setPaymentDescription] = useState<string>('測試付款');
  const [airwallexLoading, setAirwallexLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 檢查檔案類型
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('請選擇圖片檔案 (JPG, PNG, GIF, WebP)');
        return;
      }
      
      // 檢查檔案大小 (最大 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('檔案大小不能超過 10MB');
        return;
      }
      
      setUploadedFile(file);
    }
  };

  const uploadScreenshot = async () => {
    if (!uploadedFile) {
      toast.error('請先選擇要上傳的檔案');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const supabase = getSaasSupabaseClient();
      
      // 生成按日期組織的檔案路徑
      const fileExt = uploadedFile.name.split('.').pop();
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const dateFolder = `${year}-${month}-${day}`;
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2);
      const fileName = `payment-screenshots/${dateFolder}/${timestamp}-${randomId}.${fileExt}`;
      
      // 上傳檔案到 Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('hanami-saas-system')
        .upload(fileName, uploadedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('上傳錯誤:', uploadError);
        throw uploadError;
      }

      // 獲取公開 URL
      const { data: urlData } = supabase.storage
        .from('hanami-saas-system')
        .getPublicUrl(fileName);

      // 模擬進度更新
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // 記錄付款資訊到資料庫
      const { error: dbError } = await supabase
        .from('payment_records')
        .insert({
          payment_method: 'screenshot',
          amount: parseFloat(paymentAmount),
          description: paymentDescription,
          screenshot_url: urlData.publicUrl,
          file_name: fileName,
          status: 'pending',
          created_at: new Date().toISOString(),
          metadata: {
            date_folder: dateFolder,
            upload_date: dateFolder,
            original_filename: uploadedFile.name,
            file_size: uploadedFile.size,
            file_type: uploadedFile.type
          }
        } as any);

      if (dbError) {
        console.error('資料庫錯誤:', dbError);
        // 如果資料庫記錄失敗，刪除已上傳的檔案
        await supabase.storage
          .from('hanami-saas-system')
          .remove([fileName]);
        throw dbError;
      }

      toast.success('付款截圖上傳成功！我們將盡快確認您的付款。');
      setUploadedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('上傳失敗:', error);
      toast.error('上傳失敗，請稍後再試');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleAirwallexPayment = async () => {
    setAirwallexLoading(true);
    
    try {
      // 調用簡化的 Airwallex API
      const response = await fetch('/api/aihome/payment/airwallex-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(paymentAmount),
          currency: 'HKD',
          description: paymentDescription,
          return_url: `${window.location.origin}/aihome/test-payment/success`,
          cancel_url: `${window.location.origin}/aihome/test-payment/cancel`
        })
      });

      const data = await response.json();
      
      if (data.success && data.checkout_url) {
        // 重定向到 Airwallex 支付頁面
        window.location.href = data.checkout_url;
      } else {
        throw new Error(data.error || '支付創建失敗');
      }
    } catch (error) {
      console.error('Airwallex 支付錯誤:', error);
      toast.error(`支付創建失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setAirwallexLoading(false);
    }
  };

  const handleMockAirwallexPayment = async () => {
    try {
      const response = await fetch('/api/aihome/payment/mock-airwallex', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(paymentAmount),
          currency: 'HKD',
          description: paymentDescription,
          return_url: `${window.location.origin}/aihome/test-payment/success`,
          cancel_url: `${window.location.origin}/aihome/test-payment/cancel`
        })
      });

      const data = await response.json();
      
      if (data.success && data.checkout_url) {
        toast.success('使用模擬支付進行測試');
        // 重定向到模擬支付成功頁面
        window.location.href = data.checkout_url;
      } else {
        throw new Error(data.error || '模擬支付創建失敗');
      }
    } catch (error) {
      console.error('模擬支付錯誤:', error);
      toast.error('支付創建失敗，請稍後再試');
    }
  };

  const selectedPaymentMethod = paymentMethods.find(method => method.id === selectedMethod);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A] py-12">
      <div className="max-w-4xl mx-auto px-6">
        {/* 頁面標題 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-[#4B4036] mb-4">
            測試支付頁面
          </h1>
          <p className="text-lg text-[#2B3A3B]">
            選擇您的付款方式來測試支付功能
          </p>
        </motion.div>

        {/* 付款金額設定 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <HanamiCard className="p-6">
            <h2 className="text-xl font-semibold text-[#4B4036] mb-4">付款資訊</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-2">
                  付款金額 (HKD)
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                  placeholder="100"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-2">
                  付款說明
                </label>
                <input
                  type="text"
                  value={paymentDescription}
                  onChange={(e) => setPaymentDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                  placeholder="測試付款"
                />
              </div>
            </div>
          </HanamiCard>
        </motion.div>

        {/* 付款方式選擇 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-semibold text-[#4B4036] mb-6 text-center">
            選擇付款方式
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {paymentMethods.map((method) => (
              <motion.div
                key={method.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <HanamiCard 
                  className={`p-6 cursor-pointer transition-all duration-200 ${
                    selectedMethod === method.id 
                      ? 'ring-2 ring-[#FFD59A] bg-[#FFF9F2]' 
                      : 'hover:bg-[#FFF9F2]'
                  }`}
                  onClick={() => setSelectedMethod(method.id)}
                >
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-[#FFD59A] rounded-full flex items-center justify-center mr-4">
                      <method.icon className="w-6 h-6 text-[#2B3A3B]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[#4B4036]">
                        {method.name}
                      </h3>
                    </div>
                  </div>
                  <p className="text-[#2B3A3B] mb-4">
                    {method.description}
                  </p>
                  {selectedMethod === method.id && (
                    <div className="flex items-center text-[#10B981]">
                      <CheckCircleIcon className="w-5 h-5 mr-2" />
                      <span className="text-sm font-medium">已選擇</span>
                    </div>
                  )}
                </HanamiCard>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 付款操作區域 */}
        {selectedMethod && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-8"
          >
            <HanamiCard className="p-6">
              <h3 className="text-xl font-semibold text-[#4B4036] mb-4">
                完成付款 - {selectedPaymentMethod?.name}
              </h3>
              
              {selectedMethod === 'screenshot' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#4B4036] mb-2">
                      上傳付款截圖
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <div className="flex items-center space-x-4">
                      <HanamiButton
                        onClick={() => fileInputRef.current?.click()}
                        variant="secondary"
                        className="flex items-center"
                      >
                        <PhotoIcon className="w-5 h-5 mr-2" />
                        選擇檔案
                      </HanamiButton>
                      {uploadedFile && (
                        <div className="flex items-center text-[#10B981]">
                          <CheckCircleIcon className="w-5 h-5 mr-2" />
                          <span className="text-sm">{uploadedFile.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {uploading && (
                    <div className="space-y-2">
                      <div className="flex items-center text-[#4B4036]">
                        <CloudArrowUpIcon className="w-5 h-5 mr-2 animate-pulse" />
                        <span>上傳中... {uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-[#EADBC8] rounded-full h-2">
                        <div 
                          className="bg-[#FFD59A] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  <HanamiButton
                    onClick={uploadScreenshot}
                    disabled={!uploadedFile || uploading}
                    className="w-full"
                    size="lg"
                  >
                    {uploading ? '上傳中...' : '上傳付款截圖'}
                  </HanamiButton>
                </div>
              )}
              
              {selectedMethod === 'airwallex' && (
                <div className="space-y-4">
                  <div className="bg-[#E0F2E0] border border-[#10B981] rounded-lg p-4">
                    <div className="flex items-center text-[#10B981] mb-2">
                      <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                      <span className="font-medium">真實 Airwallex 支付</span>
                    </div>
                    <p className="text-sm text-[#2B3A3B]">
                      使用真實的 Airwallex API 進行支付，您將被重定向到 Airwallex 安全支付頁面
                    </p>
                  </div>
                  
                  <HanamiButton
                    onClick={handleAirwallexPayment}
                    disabled={airwallexLoading}
                    className="w-full"
                    size="lg"
                  >
                    {airwallexLoading ? '處理中...' : '在新視窗中打開 Airwallex 支付'}
                  </HanamiButton>
                </div>
              )}
            </HanamiCard>
          </motion.div>
        )}

        {/* 注意事項 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <HanamiCard className="p-6 bg-[#FFE0E0] border border-[#EF4444]">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="w-6 h-6 text-[#EF4444] mr-3 mt-1" />
              <div>
                <h3 className="font-semibold text-[#EF4444] mb-2">注意事項</h3>
                <ul className="text-sm text-[#2B3A3B] space-y-1">
                  <li>• 這是一個測試支付頁面，不會產生實際的付款</li>
                  <li>• 上傳的截圖將存儲在 hanami-saas-system bucket 中</li>
                  <li>• Airwallex 支付將使用測試環境</li>
                  <li>• 所有付款記錄都會被記錄在資料庫中</li>
                </ul>
              </div>
            </div>
          </HanamiCard>
        </motion.div>
      </div>
    </div>
  );
}

