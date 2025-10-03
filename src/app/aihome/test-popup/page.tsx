'use client';

import { useState } from 'react';

export default function TestPopupPage() {
  const [testUrl, setTestUrl] = useState('https://www.google.com');

  const testPopupMethods = () => {
    console.log('🧪 開始測試各種彈窗方法');
    
    // 方法 1: 基本 window.open
    console.log('🚀 方法1: 基本 window.open');
    const window1 = window.open(testUrl, 'test1', 'width=800,height=600');
    console.log('結果:', { window1: !!window1, closed: window1?.closed });
    
    // 方法 2: 使用 _blank
    console.log('🚀 方法2: 使用 _blank');
    const window2 = window.open(testUrl, '_blank');
    console.log('結果:', { window2: !!window2, closed: window2?.closed });
    
    // 方法 3: 臨時鏈接
    console.log('🚀 方法3: 臨時鏈接');
    const tempLink = document.createElement('a');
    tempLink.href = testUrl;
    tempLink.target = '_blank';
    tempLink.rel = 'noopener noreferrer';
    document.body.appendChild(tempLink);
    tempLink.click();
    document.body.removeChild(tempLink);
    console.log('方法3完成');
  };

  const testAirwallexPopup = () => {
    const airwallexUrl = 'https://checkout-sandbox.airwallex.com/checkout/3b8b5e5c-7c9a-4b2d-8e1f-3a6c9d2e5b8f';
    console.log('🧪 測試 Airwallex 彈窗');
    
    let opened = false;
    let paymentWindow: Window | null = null;
    
    // 方法 1: 詳細參數
    console.log('🚀 嘗試方法1：詳細參數');
    paymentWindow = window.open(airwallexUrl, 'airwallex_test', 'width=1200,height=800,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no,popup=yes');
    
    if (paymentWindow && !paymentWindow.closed) {
      opened = true;
      console.log('✅ 方法1成功');
    } else {
      // 方法 2: 寬鬆參數
      console.log('🚀 嘗試方法2：寬鬆參數');
      paymentWindow = window.open(airwallexUrl, 'airwallex_test', 'width=800,height=600');
      
      if (paymentWindow && !paymentWindow.closed) {
        opened = true;
        console.log('✅ 方法2成功');
      } else {
        // 方法 3: _blank
        console.log('🚀 嘗試方法3：_blank');
        paymentWindow = window.open(airwallexUrl, '_blank');
        
        if (paymentWindow && !paymentWindow.closed) {
          opened = true;
          console.log('✅ 方法3成功');
        } else {
          // 方法 4: 臨時鏈接
          console.log('🚀 嘗試方法4：臨時鏈接');
          const tempLink = document.createElement('a');
          tempLink.href = airwallexUrl;
          tempLink.target = '_blank';
          tempLink.rel = 'noopener noreferrer';
          document.body.appendChild(tempLink);
          tempLink.click();
          document.body.removeChild(tempLink);
          opened = true;
          console.log('✅ 方法4完成');
        }
      }
    }
    
    if (opened) {
      alert('✅ 彈窗測試成功！請檢查是否打開了新視窗');
    } else {
      alert('❌ 彈窗測試失敗！請檢查瀏覽器設置');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-6">彈窗測試頁面</h1>
      
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            測試 URL:
          </label>
          <input
            type="text"
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="輸入測試 URL"
          />
        </div>
        
        <div className="space-y-3">
          <button
            onClick={testPopupMethods}
            className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            測試各種彈窗方法
          </button>
          
          <button
            onClick={testAirwallexPopup}
            className="w-full py-2 px-4 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            測試 Airwallex 彈窗
          </button>
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-md">
          <h3 className="font-semibold text-blue-800 mb-2">測試說明</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 點擊按鈕會嘗試多種方式打開新視窗</li>
            <li>• 請檢查瀏覽器控制台的詳細日誌</li>
            <li>• 如果彈窗被阻擋，請允許彈窗後重試</li>
            <li>• 測試完成後會顯示結果</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
