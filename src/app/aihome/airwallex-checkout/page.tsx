'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CreditCardIcon, BanknotesIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';

export default function AirwallexCheckoutPage() {
  const searchParams = useSearchParams();
  const [paymentData, setPaymentData] = useState<any>(null);
  const [selectedMethod, setSelectedMethod] = useState<string>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [paymentForm, setPaymentForm] = useState<any>({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvc: '',
    cardholderName: '',
    phoneNumber: '',
    email: ''
  });

  useEffect(() => {
    // 從 URL 參數中獲取支付信息
    const paymentIntentId = searchParams.get('payment_intent');
    const clientSecret = searchParams.get('client_secret');
    const amount = searchParams.get('amount');
    const currency = searchParams.get('currency');
    
    if (paymentIntentId) {
      setPaymentData({
        payment_intent_id: paymentIntentId,
        client_secret: clientSecret,
        amount: amount,
        currency: currency
      });
    }
  }, [searchParams]);

  const validatePaymentForm = () => {
    if (selectedMethod === 'card') {
      if (!paymentForm.cardNumber || !paymentForm.expiryMonth || !paymentForm.expiryYear || !paymentForm.cvc || !paymentForm.cardholderName) {
        alert('請填寫完整的信用卡信息');
        return false;
      }
      if (paymentForm.cardNumber.replace(/\s/g, '').length < 16) {
        alert('請輸入有效的信用卡號碼');
        return false;
      }
      if (paymentForm.cvc.length < 3) {
        alert('請輸入有效的 CVC 碼');
        return false;
      }
    } else if (selectedMethod === 'fps') {
      if (!paymentForm.phoneNumber) {
        alert('請輸入手機號碼');
        return false;
      }
    } else if (selectedMethod === 'wechatpay' || selectedMethod === 'alipayhk') {
      if (!paymentForm.phoneNumber) {
        alert('請輸入手機號碼');
        return false;
      }
    }
    return true;
  };

  const handlePayment = async () => {
    // 驗證支付表單
    if (!validatePaymentForm()) {
      return;
    }

    setIsProcessing(true);
    
    // 模擬真實的支付處理流程
    try {
      // 第一步：驗證支付方式
      console.log('🔍 驗證支付方式:', selectedMethod);
      console.log('💳 支付信息:', paymentForm);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 第二步：處理支付
      console.log('💳 處理支付中...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 第三步：確認支付結果
      console.log('✅ 支付處理完成');
      
      // 通知父窗口支付成功
      if (window.opener) {
        window.opener.postMessage({
          type: 'PAYMENT_SUCCESS',
          success: true,
          payment_intent_id: paymentData?.payment_intent_id,
          status: 'succeeded',
          amount: parseFloat(paymentData?.amount || '0'),
          currency: paymentData?.currency,
          payment_method: selectedMethod,
          payment_info: paymentForm,
          message: `使用 ${paymentMethods.find(m => m.id === selectedMethod)?.name} 支付成功！`
        }, window.location.origin);
        window.close();
      } else {
        // 如果沒有父窗口，跳轉到成功頁面
        window.location.href = '/aihome/payment-success';
      }
    } catch (error) {
      console.error('支付處理失敗:', error);
      setIsProcessing(false);
      
      // 通知父窗口支付失敗
      if (window.opener) {
        window.opener.postMessage({
          type: 'PAYMENT_ERROR',
          success: false,
          payment_intent_id: paymentData?.payment_intent_id,
          status: 'failed',
          error: '支付處理失敗',
          message: '支付處理失敗，請重試'
        }, window.location.origin);
      }
    }
  };

  const handleCancel = () => {
    // 通知父窗口支付取消
    if (window.opener) {
      window.opener.postMessage({
        type: 'PAYMENT_CANCELLED',
        success: false,
        payment_intent_id: paymentData?.payment_intent_id,
        status: 'cancelled',
        message: '支付已取消'
      }, window.location.origin);
      window.close();
    } else {
      // 如果沒有父窗口，跳轉到取消頁面
      window.location.href = '/aihome/payment-cancel';
    }
  };

  const paymentMethods = [
    { id: 'card', name: '信用卡/借記卡', icon: CreditCardIcon, description: 'Visa, Mastercard, American Express' },
    { id: 'fps', name: '轉數快 (FPS)', icon: BanknotesIcon, description: '香港快速支付系統' },
    { id: 'wechatpay', name: '微信支付', icon: DevicePhoneMobileIcon, description: 'WeChat Pay' },
    { id: 'alipayhk', name: '支付寶香港', icon: DevicePhoneMobileIcon, description: 'AlipayHK' }
  ];

  if (!paymentData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">正在載入支付頁面...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        {/* 標題 */}
        <div className="bg-blue-600 text-white p-6">
          <h1 className="text-2xl font-bold">Airwallex 結帳</h1>
          <p className="text-blue-100 mt-1">安全支付處理</p>
        </div>

        {/* 支付信息 */}
        <div className="p-6">
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-gray-900 mb-2">支付詳情</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">金額:</span>
                <span className="font-semibold">{paymentData.currency} {paymentData.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">支付意圖 ID:</span>
                <span className="font-mono text-xs">{paymentData.payment_intent_id}</span>
              </div>
            </div>
          </div>

          {/* 支付方式選擇 */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">選擇支付方式</h3>
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <motion.div
                  key={method.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedMethod === method.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedMethod(method.id)}
                >
                  <div className="flex items-center">
                    <method.icon className="h-6 w-6 text-gray-600 mr-3" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{method.name}</div>
                      <div className="text-sm text-gray-500">{method.description}</div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      selectedMethod === method.id
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedMethod === method.id && (
                        <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* 支付信息表單 */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">支付信息</h3>
            
            {selectedMethod === 'card' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">持卡人姓名</label>
                  <input
                    type="text"
                    value={paymentForm.cardholderName}
                    onChange={(e) => setPaymentForm({...paymentForm, cardholderName: e.target.value})}
                    placeholder="請輸入持卡人姓名"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">信用卡號碼</label>
                  <input
                    type="text"
                    value={paymentForm.cardNumber}
                    onChange={(e) => setPaymentForm({...paymentForm, cardNumber: e.target.value})}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">到期月份</label>
                    <select
                      value={paymentForm.expiryMonth}
                      onChange={(e) => setPaymentForm({...paymentForm, expiryMonth: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">選擇月份</option>
                      {Array.from({length: 12}, (_, i) => (
                        <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                          {String(i + 1).padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">到期年份</label>
                    <select
                      value={paymentForm.expiryYear}
                      onChange={(e) => setPaymentForm({...paymentForm, expiryYear: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">選擇年份</option>
                      {Array.from({length: 10}, (_, i) => {
                        const year = new Date().getFullYear() + i;
                        return (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CVC 安全碼</label>
                  <input
                    type="text"
                    value={paymentForm.cvc}
                    onChange={(e) => setPaymentForm({...paymentForm, cvc: e.target.value})}
                    placeholder="123"
                    maxLength={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
            
            {(selectedMethod === 'fps' || selectedMethod === 'wechatpay' || selectedMethod === 'alipayhk') && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">手機號碼</label>
                  <input
                    type="tel"
                    value={paymentForm.phoneNumber}
                    onChange={(e) => setPaymentForm({...paymentForm, phoneNumber: e.target.value})}
                    placeholder="請輸入手機號碼"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">電子郵件</label>
                  <input
                    type="email"
                    value={paymentForm.email}
                    onChange={(e) => setPaymentForm({...paymentForm, email: e.target.value})}
                    placeholder="請輸入電子郵件"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 支付按鈕 */}
          <div className="space-y-3">
            {!showConfirm ? (
              <>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowConfirm(true)}
                  disabled={isProcessing}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  確認支付 {paymentData.currency} {paymentData.amount}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCancel}
                  disabled={isProcessing}
                  className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  取消支付
                </motion.button>
              </>
            ) : (
              <>
                {/* 確認支付信息 */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-yellow-800 mb-2">確認支付信息</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-yellow-700">支付方式:</span>
                      <span className="font-semibold text-yellow-800">
                        {paymentMethods.find(m => m.id === selectedMethod)?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-700">支付金額:</span>
                      <span className="font-semibold text-yellow-800">
                        {paymentData.currency} {paymentData.amount}
                      </span>
                    </div>
                    {selectedMethod === 'card' && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-yellow-700">持卡人:</span>
                          <span className="font-semibold text-yellow-800">
                            {paymentForm.cardholderName}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-yellow-700">卡號:</span>
                          <span className="font-semibold text-yellow-800">
                            **** **** **** {paymentForm.cardNumber.slice(-4)}
                          </span>
                        </div>
                      </>
                    )}
                    {(selectedMethod === 'fps' || selectedMethod === 'wechatpay' || selectedMethod === 'alipayhk') && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-yellow-700">手機號碼:</span>
                          <span className="font-semibold text-yellow-800">
                            {paymentForm.phoneNumber}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-yellow-700">電子郵件:</span>
                          <span className="font-semibold text-yellow-800">
                            {paymentForm.email}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      處理中...
                    </div>
                  ) : (
                    `確認支付 ${paymentData.currency} ${paymentData.amount}`
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowConfirm(false)}
                  disabled={isProcessing}
                  className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  返回修改
                </motion.button>
              </>
            )}
          </div>

          {/* 安全提示 */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              🔒 您的支付信息已加密保護
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
