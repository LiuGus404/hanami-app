'use client';
import { useState } from 'react';

export default function TestAirwallexDirect() {
  const [airwallexUrl, setAirwallexUrl] = useState('');

  const handleOpenInNewTab = () => {
    if (airwallexUrl) {
      window.open(airwallexUrl, '_blank');
    } else {
      alert('請輸入 Airwallex URL');
    }
  };

  const handleOpenInPopup = () => {
    if (airwallexUrl) {
      window.open(airwallexUrl, 'airwallex_payment', 'width=800,height=600,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no,popup=yes');
    } else {
      alert('請輸入 Airwallex URL');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-4">Airwallex 直接測試頁面</h1>
      <p className="mb-4 text-gray-600">請從控制台複製 Airwallex 結帳 URL 到下方輸入框</p>
      <input
        type="text"
        value={airwallexUrl}
        onChange={(e) => setAirwallexUrl(e.target.value)}
        placeholder="輸入 Airwallex 結帳 URL"
        className="w-full max-w-md p-2 border border-gray-300 rounded-md mb-4"
      />
      <div className="flex space-x-4">
        <button
          onClick={handleOpenInNewTab}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          新標籤頁打開
        </button>
        <button
          onClick={handleOpenInPopup}
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
        >
          彈窗打開
        </button>
      </div>
    </div>
  );
}