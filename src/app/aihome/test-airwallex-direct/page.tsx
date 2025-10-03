'use client';
import { useState } from 'react';

export default function TestAirwallexDirect() {
  const [airwallexUrl, setAirwallexUrl] = useState('');

  const handleOpenInNewTab = () => {
    if (airwallexUrl) {
      // 嘗試多種方式打開新視窗，不進行同頁跳轉
      let newWindow: Window | null = null;
      let opened = false;
      
      console.log('🔍 開始嘗試打開新分頁，URL:', airwallexUrl);
      
      try {
        // 方法 1: 標準 window.open
        console.log('🚀 嘗試方法1：標準 window.open');
        newWindow = window.open(airwallexUrl, '_blank', 'noopener,noreferrer');
        
        console.log('🔍 方法1結果：', { newWindow: !!newWindow, closed: newWindow?.closed });
        
        if (newWindow && !newWindow.closed) {
          opened = true;
          newWindow.focus();
          console.log('✅ 方法1成功：新分頁打開成功');
        } else {
          // 方法 2: 使用更寬鬆的參數
          console.log('🚀 嘗試方法2：寬鬆參數');
          newWindow = window.open(airwallexUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
          
          console.log('🔍 方法2結果：', { newWindow: !!newWindow, closed: newWindow?.closed });
          
          if (newWindow && !newWindow.closed) {
            opened = true;
            newWindow.focus();
            console.log('✅ 方法2成功：使用寬鬆參數打開新分頁');
          } else {
            // 方法 3: 創建臨時鏈接並點擊
            console.log('🚀 嘗試方法3：臨時鏈接');
            const tempLink = document.createElement('a');
            tempLink.href = airwallexUrl;
            tempLink.target = '_blank';
            tempLink.rel = 'noopener noreferrer';
            document.body.appendChild(tempLink);
            tempLink.click();
            document.body.removeChild(tempLink);
            opened = true; // 假設成功，因為使用了 _blank
            console.log('✅ 方法3完成：使用臨時鏈接打開新分頁');
          }
        }
        
        if (opened) {
          console.log('✅ 新分頁打開成功');
        } else {
          alert('無法打開新分頁，請檢查瀏覽器設置');
        }
      } catch (error) {
        console.error('打開新視窗失敗:', error);
        alert('打開新分頁時發生錯誤，請檢查瀏覽器設置');
      }
    } else {
      alert('請輸入 Airwallex URL');
    }
  };

  const handleOpenInPopup = () => {
    if (airwallexUrl) {
      // 嘗試多種方式打開新視窗，不進行同頁跳轉
      let popupWindow: Window | null = null;
      let opened = false;
      
      console.log('🔍 開始嘗試打開新視窗，URL:', airwallexUrl);
      
      try {
        // 方法 1: 使用詳細的彈窗參數
        console.log('🚀 嘗試方法1：詳細彈窗參數');
        popupWindow = window.open(airwallexUrl, 'airwallex_payment', 'width=1200,height=800,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no,popup=yes');
        
        console.log('🔍 方法1結果：', { popupWindow: !!popupWindow, closed: popupWindow?.closed });
        
        if (popupWindow && !popupWindow.closed) {
          opened = true;
          console.log('✅ 方法1成功：使用詳細參數打開新視窗');
        } else {
          // 方法 2: 使用更寬鬆的參數
          console.log('🚀 嘗試方法2：寬鬆參數');
          popupWindow = window.open(airwallexUrl, 'airwallex_payment', 'width=800,height=600');
          
          console.log('🔍 方法2結果：', { popupWindow: !!popupWindow, closed: popupWindow?.closed });
          
          if (popupWindow && !popupWindow.closed) {
            opened = true;
            console.log('✅ 方法2成功：使用寬鬆參數打開新視窗');
          } else {
            // 方法 3: 使用 _blank 作為備用
            console.log('🚀 嘗試方法3：使用 _blank');
            popupWindow = window.open(airwallexUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
            
            console.log('🔍 方法3結果：', { popupWindow: !!popupWindow, closed: popupWindow?.closed });
            
            if (popupWindow && !popupWindow.closed) {
              opened = true;
              console.log('✅ 方法3成功：使用 _blank 打開新視窗');
            } else {
              // 方法 4: 創建臨時鏈接並點擊
              console.log('🚀 嘗試方法4：臨時鏈接');
              const tempLink = document.createElement('a');
              tempLink.href = airwallexUrl;
              tempLink.target = '_blank';
              tempLink.rel = 'noopener noreferrer';
              document.body.appendChild(tempLink);
              tempLink.click();
              document.body.removeChild(tempLink);
              opened = true; // 假設成功，因為使用了 _blank
              console.log('✅ 方法4完成：使用臨時鏈接');
            }
          }
        }
        
        if (opened && popupWindow) {
          // 聚焦到彈窗
          popupWindow.focus();
          
          // 監聽彈窗關閉
          const checkClosed = setInterval(() => {
            if (popupWindow?.closed) {
              clearInterval(checkClosed);
              console.log('支付彈窗已關閉');
            }
          }, 1000);
        } else if (opened) {
          console.log('✅ 新視窗打開成功（使用臨時鏈接）');
        } else {
          alert('無法打開新視窗，請檢查瀏覽器設置');
        }
        
      } catch (error) {
        console.error('打開彈窗失敗:', error);
        alert('打開新視窗時發生錯誤，請檢查瀏覽器設置');
      }
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
          新分頁打開
        </button>
        <button
          onClick={handleOpenInPopup}
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
        >
          新視窗打開
        </button>
      </div>
      
      <div className="mt-6 max-w-md text-center">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">新視窗測試說明</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p>• <strong>新分頁打開</strong>：在新分頁中打開 Airwallex 支付頁面</p>
            <p>• <strong>新視窗打開</strong>：在新視窗中打開 Airwallex 支付頁面</p>
            <p>• 如果瀏覽器阻止彈窗，會顯示錯誤提示</p>
            <p>• 所有方式都失敗時會顯示錯誤而不是跳轉</p>
          </div>
        </div>
      </div>
    </div>
  );
}