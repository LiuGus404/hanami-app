'use client';

import { useState } from 'react';
import PhoneInput from '@/components/ui/PhoneInput';
import EmailInput from '@/components/ui/EmailInput';
import { validatePhoneNumber, validateEmail } from '@/lib/validationUtils';

export default function TestPhoneEmailValidationPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+852');
  const [email, setEmail] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');

  // 測試已包含國碼的電話號碼
  const [testPhoneWithCode, setTestPhoneWithCode] = useState('+85212345678');
  const [testCountryCode, setTestCountryCode] = useState('+852');

  const handlePhoneChange = (phone: string, code: string) => {
    setPhoneNumber(phone);
    setCountryCode(code);
    setPhoneError('');
  };

  const handleTestPhoneChange = (phone: string, code: string) => {
    setTestPhoneWithCode(code + phone);
    setTestCountryCode(code);
  };

  const handleEmailChange = (newEmail: string) => {
    setEmail(newEmail);
    setEmailError('');
  };

  const validatePhone = () => {
    const validation = validatePhoneNumber(phoneNumber, countryCode);
    if (!validation.isValid) {
      setPhoneError(validation.error || '電話號碼格式不正確');
    } else {
      setPhoneError('');
      alert('電話號碼格式正確！');
    }
  };

  const validateEmailAddress = () => {
    const validation = validateEmail(email);
    if (!validation.isValid) {
      setEmailError(validation.error || '電郵地址格式不正確');
    } else {
      setEmailError('');
      alert('電郵地址格式正確！');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-[#4B4036] mb-8 text-center">
          電話號碼和電郵驗證測試
        </h1>

        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
          {/* 電話號碼測試 */}
          <div>
            <h2 className="text-xl font-semibold text-[#4B4036] mb-4">電話號碼驗證</h2>
            <div className="space-y-6">
              {/* 一般電話號碼輸入 */}
              <div>
                <h3 className="text-lg font-medium text-[#4B4036] mb-3">一般輸入測試</h3>
                <PhoneInput
                  value={phoneNumber}
                  countryCode={countryCode}
                  onChange={handlePhoneChange}
                  placeholder="請輸入電話號碼"
                  error={phoneError}
                  required
                />
                <button
                  onClick={validatePhone}
                  className="w-full mt-3 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] font-semibold py-3 px-6 rounded-xl hover:shadow-lg transition-all duration-200"
                >
                  驗證電話號碼
                </button>
              </div>

              {/* 已包含國碼的電話號碼測試 */}
              <div>
                <h3 className="text-lg font-medium text-[#4B4036] mb-3">已包含國碼測試</h3>
                <p className="text-sm text-[#2B3A3B]/70 mb-3">
                  測試載入已包含國碼的電話號碼: {testPhoneWithCode}
                </p>
                <PhoneInput
                  value={testPhoneWithCode}
                  countryCode={testCountryCode}
                  onChange={handleTestPhoneChange}
                  placeholder="請輸入電話號碼"
                  required
                />
                <p className="mt-2 text-sm text-[#2B3A3B]/70">
                  組件會自動分離國碼和電話號碼部分
                </p>
              </div>
            </div>
          </div>

          {/* 電郵測試 */}
          <div>
            <h2 className="text-xl font-semibold text-[#4B4036] mb-4">電郵地址驗證</h2>
            <div className="space-y-4">
              <EmailInput
                value={email}
                onChange={handleEmailChange}
                placeholder="請輸入電郵地址"
                error={emailError}
                required
                showValidation
              />
              <button
                onClick={validateEmailAddress}
                className="w-full bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] font-semibold py-3 px-6 rounded-xl hover:shadow-lg transition-all duration-200"
              >
                驗證電郵地址
              </button>
            </div>
          </div>

          {/* 下拉選單測試 */}
          <div>
            <h2 className="text-xl font-semibold text-[#4B4036] mb-4">下拉選單測試</h2>
            <div className="space-y-4">
              <p className="text-sm text-[#2B3A3B]/70">
                點擊國碼選擇器測試下拉選單功能：
              </p>
              <PhoneInput
                value=""
                countryCode="+852"
                onChange={(phone, code) => {
                  console.log('選擇的國碼:', code, '電話號碼:', phone);
                }}
                placeholder="測試下拉選單功能"
                required
              />
              <p className="text-xs text-gray-500 mt-2">
                提示：打開瀏覽器控制台查看點擊事件日誌
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>測試步驟：</strong>
                </p>
                <ol className="list-decimal list-inside text-sm text-blue-700 mt-2 space-y-1">
                  <li>點擊國碼選擇器（🇭🇰 +852）</li>
                  <li>確認下拉選單正常顯示</li>
                  <li>選擇不同的國碼</li>
                  <li>確認選擇後下拉選單關閉</li>
                  <li>確認國碼和圖標正確更新</li>
                </ol>
              </div>
            </div>
          </div>

          {/* 測試說明 */}
          <div className="bg-[#FFF9F2] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-[#4B4036] mb-3">測試說明</h3>
            <div className="space-y-2 text-sm text-[#2B3A3B]">
              <p><strong>電話號碼測試：</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>香港 (+852): 8位數字，如 12345678</li>
                <li>中國 (+86): 11位手機號碼，如 13812345678</li>
                <li>台灣 (+886): 10位手機號碼，如 0912345678</li>
                <li>新加坡 (+65): 8位數字，如 81234567</li>
              </ul>
              <p className="mt-3"><strong>電郵測試：</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>正確格式: example@email.com</li>
                <li>錯誤格式: example@, @email.com, example..test@email.com</li>
              </ul>
              <p className="mt-3"><strong>國旗圖標：</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>使用圓形容器包裹 emoji 國旗</li>
                <li>提供更好的視覺一致性</li>
                <li>支援 15 個國家/地區的國旗</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
