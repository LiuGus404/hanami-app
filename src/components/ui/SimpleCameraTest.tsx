'use client';

import { useEffect, useRef, useState } from 'react';

interface SimpleCameraTestProps {
  onScanSuccess: (result: string) => void;
  onScanError?: (error: string) => void;
  onClose: () => void;
  isActive: boolean;
}

export default function SimpleCameraTest({ 
  onScanSuccess, 
  onScanError, 
  onClose, 
  isActive 
}: SimpleCameraTestProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    if (isActive) {
      initializeCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isActive]);

  const initializeCamera = async () => {
    try {
      setError(null);
      setHasPermission(null);
      setIsInitializing(true);

      console.log('開始初始化相機...');

      // 設置超時機制
      const timeoutId = setTimeout(() => {
        setIsInitializing(false);
        setHasPermission(false);
        setError('相機初始化超時，請重試或使用手動輸入');
        onScanError?.('相機初始化超時，請重試或使用手動輸入');
      }, 10000);

      try {
        // 請求相機權限
        console.log('請求相機權限...');
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });

        console.log('相機權限已獲得:', stream);
        clearTimeout(timeoutId);
        streamRef.current = stream;
        setHasPermission(true);
        setIsInitializing(false);

        // 直接設置視頻元素
        if (videoRef.current) {
          console.log('設置視頻元素...');
          
          // 先清除之前的流
          if (videoRef.current.srcObject) {
            const oldStream = videoRef.current.srcObject as MediaStream;
            oldStream.getTracks().forEach(track => track.stop());
          }
          
          // 設置新的流
          videoRef.current.srcObject = stream;
          
          // 設置視頻屬性
          videoRef.current.autoplay = true;
          videoRef.current.muted = true;
          videoRef.current.playsInline = true;
          videoRef.current.controls = false;
          
          // 等待視頻加載
          const video = videoRef.current;
          
          const handleLoadedData = async () => {
            console.log('視頻數據已加載');
            try {
              await video.play();
              console.log('視頻播放成功');
              setIsScanning(true);
            } catch (playError) {
              console.error('播放失敗:', playError);
              setError('無法播放相機畫面');
            }
          };
          
          const handleCanPlay = async () => {
            console.log('視頻可以播放');
            try {
              await video.play();
              console.log('視頻播放成功');
              setIsScanning(true);
            } catch (playError) {
              console.error('播放失敗:', playError);
              setError('無法播放相機畫面');
            }
          };
          
          // 添加事件監聽器
          video.addEventListener('loadeddata', handleLoadedData, { once: true });
          video.addEventListener('canplay', handleCanPlay, { once: true });
          
          // 強制觸發加載
          video.load();
          
          // 備用方案：直接嘗試播放
          setTimeout(async () => {
            try {
              await video.play();
              console.log('延遲播放成功');
              setIsScanning(true);
            } catch (playError) {
              console.error('延遲播放失敗:', playError);
            }
          }, 1000);
        }

      } catch (permissionError) {
        clearTimeout(timeoutId);
        setIsInitializing(false);
        console.error('相機權限被拒絕:', permissionError);
        setHasPermission(false);
        setError('無法訪問相機，請允許相機權限');
        onScanError?.('無法訪問相機，請允許相機權限');
      }

    } catch (err) {
      setIsInitializing(false);
      console.error('相機初始化失敗:', err);
      setHasPermission(false);
      setError('初始化相機失敗，請檢查設備和權限');
      onScanError?.('初始化相機失敗，請檢查設備和權限');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsScanning(false);
    setIsInitializing(false);
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  const handleRetry = () => {
    setError(null);
    setHasPermission(null);
    setIsInitializing(false);
    stopCamera();
    setTimeout(() => {
      initializeCamera();
    }, 100);
  };

  // 模擬 QR 碼掃描（點擊視頻區域）
  const handleVideoClick = () => {
    if (isScanning) {
      // 模擬掃描成功
      const mockQRData = JSON.stringify({
        studentId: '0031c7ab-8e92-499d-9287-7873af1df812',
        institution: 'Hanami Music',
        timestamp: new Date().toISOString()
      });
      
      stopCamera();
      onScanSuccess(mockQRData);
    }
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

        {/* 初始化狀態 */}
        {isInitializing && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD59A] mx-auto mb-4"></div>
            <p className="text-[#2B3A3B]">正在初始化相機...</p>
            <p className="text-sm text-[#2B3A3B]/70 mt-2">請稍候，這可能需要幾秒鐘</p>
          </div>
        )}

        {/* 相機權限檢查 */}
        {hasPermission === false && !isInitializing && (
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
        {hasPermission === true && !isInitializing && (
          <div className="space-y-4">
            {/* 視頻預覽 */}
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full h-64 bg-gray-100 rounded-lg object-cover cursor-pointer"
                playsInline
                muted
                autoPlay
                onClick={handleVideoClick}
                style={{ 
                  transform: 'scaleX(-1)', // 鏡像效果
                  objectFit: 'cover'
                }}
              />
              
              {/* 掃描框 */}
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
                <div className="space-y-2">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#FFD59A]"></div>
                    <span className="text-[#2B3A3B]">相機已開啟</span>
                  </div>
                  <p className="text-sm text-[#2B3A3B]">
                    點擊視頻區域模擬掃描 QR 碼
                  </p>
                </div>
              ) : (
                <span className="text-[#2B3A3B]">正在準備相機...</span>
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

        {/* 使用說明 */}
        <div className="mt-4 p-3 bg-[#FFD59A]/10 rounded-lg">
          <p className="text-xs text-[#2B3A3B] text-center">
            點擊視頻區域模擬掃描 QR 碼（實際應用中會自動掃描）
          </p>
        </div>
      </div>
    </div>
  );
}










