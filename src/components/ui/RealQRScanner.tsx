'use client';

import { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';

interface RealQRScannerProps {
  onScanSuccess: (result: string) => void;
  onScanError?: (error: string) => void;
  onClose: () => void;
  isActive: boolean;
}

export default function RealQRScanner({ 
  onScanSuccess, 
  onScanError, 
  onClose, 
  isActive 
}: RealQRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    if (isActive) {
      initializeScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isActive]);

  const initializeScanner = async () => {
    try {
      setError(null);
      setHasPermission(null);

      if (!videoRef.current) {
        setError('視頻元素未準備好');
        return;
      }

      // 設置超時機制
      const timeoutId = setTimeout(() => {
        setHasPermission(false);
        setError('相機初始化超時，請重試或使用手動輸入');
        onScanError?.('相機初始化超時，請重試或使用手動輸入');
      }, 10000); // 10秒超時

      try {
        // 先檢查相機權限
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment' // 優先使用後置攝像頭
          } 
        });
        
        // 停止測試流
        stream.getTracks().forEach(track => track.stop());
        clearTimeout(timeoutId);
        setHasPermission(true);
        
        // 創建 QR 掃描器實例
        const qrScanner = new QrScanner(
          videoRef.current,
          (result) => {
            console.log('QR 碼掃描成功:', result.data);
            stopScanner();
            onScanSuccess(result.data);
          },
          {
            onDecodeError: (error) => {
              // 忽略常見的掃描錯誤，這些是正常的
              if (error instanceof Error && error.name !== 'NotFoundException') {
                console.error('掃描錯誤:', error);
              }
            },
            highlightScanRegion: true,
            highlightCodeOutline: true,
          }
        );

        qrScannerRef.current = qrScanner;

        // 開始掃描
        await qrScanner.start();
        setIsScanning(true);

      } catch (permissionError) {
        clearTimeout(timeoutId);
        console.error('相機權限被拒絕:', permissionError);
        setHasPermission(false);
        setError('無法訪問相機，請允許相機權限');
        onScanError?.('無法訪問相機，請允許相機權限');
      }

    } catch (err) {
      console.error('初始化掃描器失敗:', err);
      setHasPermission(false);
      setError('初始化相機失敗，請檢查設備和權限');
      onScanError?.('初始化相機失敗，請檢查設備和權限');
    }
  };

  const stopScanner = () => {
    if (qrScannerRef.current) {
      try {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
        qrScannerRef.current = null;
      } catch (err) {
        console.error('停止掃描器時發生錯誤:', err);
      }
    }
    setIsScanning(false);
  };

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  const handleRetry = () => {
    setError(null);
    setHasPermission(null);
    stopScanner();
    setTimeout(() => {
      initializeScanner();
    }, 100);
  };

  if (!isActive) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        {/* 標題 */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#4B4036]">掃描 QR 碼</h3>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 相機權限檢查 */}
        {hasPermission === false && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-[#4B4036] mb-2">相機權限被拒絕</h4>
            <p className="text-[#2B3A3B] mb-4">
              請允許相機權限以掃描 QR 碼，或使用手動輸入方式
            </p>
            <div className="space-y-2">
              <button
                onClick={handleRetry}
                className="w-full px-4 py-2 bg-[#FFD59A] text-[#4B4036] rounded-lg hover:bg-[#EBC9A4] transition-colors"
              >
                重新嘗試
              </button>
              <button
                onClick={handleClose}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* 掃描區域 */}
        {hasPermission === true && (
          <div className="space-y-4">
            {/* 視頻預覽 */}
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full h-64 bg-gray-100 rounded-lg object-cover"
                playsInline
                muted
              />
              
              {/* 掃描框覆蓋層 */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-[#FFD59A] rounded-lg relative">
                  {/* 四個角的掃描指示器 */}
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-[#FFD59A] rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-[#FFD59A] rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-[#FFD59A] rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-[#FFD59A] rounded-br-lg"></div>
                  
                  {/* 掃描線動畫 */}
                  {isScanning && (
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-[#FFD59A] animate-pulse"></div>
                  )}
                </div>
              </div>
            </div>

            {/* 狀態指示 */}
            <div className="text-center">
              {isScanning ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#FFD59A]"></div>
                  <span className="text-[#2B3A3B]">正在掃描...</span>
                </div>
              ) : (
                <span className="text-[#2B3A3B]">請將 QR 碼對準掃描框</span>
              )}
            </div>

            {/* 錯誤訊息 */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* 操作按鈕 */}
            <div className="flex space-x-3">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                取消
              </button>
              {error && (
                <button
                  onClick={handleRetry}
                  className="flex-1 px-4 py-2 bg-[#FFD59A] text-[#4B4036] rounded-lg hover:bg-[#EBC9A4] transition-colors"
                >
                  重試
                </button>
              )}
            </div>
          </div>
        )}

        {/* 載入狀態 */}
        {hasPermission === null && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD59A] mx-auto mb-4"></div>
            <p className="text-[#2B3A3B]">正在初始化相機...</p>
          </div>
        )}

        {/* 使用說明 */}
        <div className="mt-4 p-3 bg-[#FFD59A]/10 rounded-lg">
          <p className="text-xs text-[#2B3A3B] text-center">
            請將 QR 碼對準掃描框，保持穩定直到掃描成功
          </p>
        </div>
      </div>
    </div>
  );
}
