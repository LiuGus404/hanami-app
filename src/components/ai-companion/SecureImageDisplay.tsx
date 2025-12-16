/**
 * SecureImageDisplay - 安全圖片顯示組件
 * 自動處理 Private Bucket 的 Signed URL 生成
 * 支援縮圖顯示和點擊放大
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, ArrowDownTrayIcon, MagnifyingGlassIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { getSignedImageUrl, needsSignedUrl, extractStoragePath } from '@/lib/getSignedImageUrl';

interface SecureImageDisplayProps {
  imageUrl: string;
  alt?: string;
  className?: string;
  onClick?: () => void;
  onLoad?: () => void;
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  thumbnail?: boolean; // 是否顯示為縮圖
  thumbnailSize?: number; // 縮圖最大寬度（px）
  onDownload?: () => void; // 下載回調
}

// ⭐ 全局緩存，避免重複請求相同的 Signed URL
const signedUrlCache = new Map<string, Promise<string>>();

export function SecureImageDisplay({
  imageUrl,
  alt = 'AI 生成圖片',
  className = '',
  onClick,
  onLoad,
  onError,
  thumbnail = true,
  thumbnailSize = 200,
  onDownload
}: SecureImageDisplayProps) {
  const [signedUrl, setSignedUrl] = useState<string>(imageUrl);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // ESC 鍵關閉放大視圖
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isZoomed) {
        setIsZoomed(false);
      }
    };

    if (isZoomed) {
      document.addEventListener('keydown', handleEscape);
      // 防止背景滾動
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isZoomed]);

  useEffect(() => {
    isMountedRef.current = true;
    abortControllerRef.current = new AbortController();

    async function fetchPublicUrl() {
      try {
        setIsLoading(true);
        setHasError(false);

        // ⭐ Data URI 直接使用，不經過任何處理
        if (imageUrl.startsWith('data:')) {
          setSignedUrl(imageUrl);
          setIsLoading(false);
          return;
        }

        // ⭐ bucket 已改為 public，只需要將 sign/authenticated URL 轉換為 public URL
        if (needsSignedUrl(imageUrl)) {
          // ⭐ 使用緩存，避免重複請求
          let urlPromise = signedUrlCache.get(imageUrl);
          if (!urlPromise) {
            urlPromise = getSignedImageUrl(imageUrl, 3600);
            signedUrlCache.set(imageUrl, urlPromise);

            // 5 分鐘後清除緩存
            setTimeout(() => {
              signedUrlCache.delete(imageUrl);
              console.log('🗑️ [SecureImage] 清除緩存:', imageUrl.substring(0, 100) + '...');
            }, 5 * 60 * 1000);
          }

          const url = await urlPromise;

          // ⭐ 驗證轉換後的 URL 是公開格式
          if (!url.includes('/storage/v1/object/public/ai-images') && url.includes('ai-images')) {
            console.warn('⚠️ [SecureImage] URL 轉換後仍不是公開格式:', url.substring(0, 100));
          }

          if (isMountedRef.current && !abortControllerRef.current?.signal.aborted) {
            setSignedUrl(url);
            setIsLoading(false);
          } else {
            console.warn('⚠️ [SecureImage] 組件已卸載或取消，不更新狀態');
          }
        } else {
          // ⭐ 如果已經是公開 URL，直接使用
          if (isMountedRef.current) {
            setSignedUrl(imageUrl);
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error('❌ [SecureImage] URL 轉換異常:', error);
        if (isMountedRef.current && !abortControllerRef.current?.signal.aborted) {
          setSignedUrl(imageUrl); // Fallback 到原始 URL
          setHasError(true);
          setIsLoading(false);
        }
      }
    }

    fetchPublicUrl();

    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, [imageUrl]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error('❌ [SecureImage] 圖片載入失敗');

    // Data URI 失敗不嘗試代理
    if (imageUrl.startsWith('data:')) {
      setHasError(true);
      setIsLoading(false);
      if (onError) onError(e);
      return;
    }

    // ⭐ 如果當前 URL 是公開 URL 但載入失敗，嘗試使用代理 API
    if (signedUrl.includes('/storage/v1/object/public/ai-images')) {
      // 使用 extractStoragePath 正確提取並解碼路徑
      const storagePath = extractStoragePath(signedUrl);

      if (storagePath) {
        // 再次編碼以確保 URL 參數正確（只編碼一次）
        const proxyUrl = `/api/storage/proxy-image?path=${encodeURIComponent(storagePath)}`;

        // 只在第一次失敗時嘗試代理，避免無限循環
        if (!signedUrl.includes('/api/storage/proxy-image')) {
          console.log('🔄 [SecureImage] 嘗試使用代理載入:', proxyUrl);
          setSignedUrl(proxyUrl);
          setIsLoading(true);
          setHasError(false);
          return; // 不標記錯誤，讓圖片再次嘗試載入
        }
      }
    }

    // ⭐ 如果所有嘗試都失敗，標記錯誤
    setHasError(true);
    setIsLoading(false);
    if (onError) {
      onError(e);
    }
  };

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    // 獲取圖片的實際渲染尺寸
    const rect = img.getBoundingClientRect();
    setImageSize({
      width: rect.width,
      height: rect.height
    });
    setHasError(false);
    if (onLoad) {
      onLoad();
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    e.stopPropagation();
    if (onClick) {
      onClick();
    } else if (thumbnail) {
      setIsZoomed(true);
    }
  };

  const handleCloseZoom = () => {
    setIsZoomed(false);
  };

  return (
    <>
      <div
        className="relative overflow-hidden"
        style={{ minHeight: isLoading ? (thumbnail ? '150px' : '200px') : undefined }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-lg z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFB6C1]"></div>
          </div>
        )}

        <div className="relative inline-block">
          <img
            ref={imageRef}
            src={signedUrl}
            alt={alt}
            className={`${className} ${thumbnail ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
            onClick={handleImageClick}
            onLoad={handleLoad}
            onError={handleError}
            style={{
              display: hasError ? 'none' : 'block',
              maxWidth: thumbnail ? `${thumbnailSize}px` : undefined,
              maxHeight: thumbnail ? `${thumbnailSize}px` : undefined,
              width: thumbnail ? 'auto' : undefined,
              height: thumbnail ? 'auto' : undefined,
              objectFit: thumbnail ? 'contain' : undefined
            }}
          />

          {/* 水印 - 根據圖片尺寸定位在右下角 */}
          {!hasError && !isLoading && imageSize && (
            <div
              className="absolute pointer-events-none z-20"
              style={{
                bottom: '4px',
                right: '4px',
                width: thumbnail ? '32px' : '40px',
                height: thumbnail ? '32px' : '40px',
                // 確保水印不會超出圖片邊界
                maxWidth: `${Math.min(imageSize.width * 0.15, 40)}px`,
                maxHeight: `${Math.min(imageSize.height * 0.15, 40)}px`
              }}
            >
              <img
                src="/@hanami.png"
                alt="Hanami 水印"
                className="opacity-70 hover:opacity-90 transition-opacity w-full h-full"
                style={{
                  filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))',
                  objectFit: 'contain'
                }}
              />
            </div>
          )}
        </div>

        {hasError && !isLoading && (
          <div className="flex flex-col items-center justify-center p-4 bg-red-50 rounded-lg text-red-600 text-sm space-y-2">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              無法載入圖片
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.open(signedUrl, '_blank');
              }}
              className="text-xs underline hover:opacity-80"
            >
              點擊下載圖片
            </button>
          </div>
        )}

        {thumbnail && !hasError && !isLoading && (
          <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md shadow-lg pointer-events-none flex items-center space-x-1 z-10">
            <MagnifyingGlassIcon className="w-3 h-3" />
            <span>點擊放大</span>
          </div>
        )}
      </div>

      {/* 放大 Modal */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={handleCloseZoom}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative group max-w-[85vw] max-h-[85vh] bg-white rounded-xl shadow-2xl overflow-auto flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button - Explicitly added for mobile usability */}
              <button
                onClick={handleCloseZoom}
                className="absolute top-3 right-3 z-50 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-all shadow-lg border border-white/20 active:scale-95"
                title="關閉預覽"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>

              {/* 錯誤狀態 */}
              {hasError && ( // Changed 'error' to 'hasError' to match existing state
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 text-gray-500 text-xs p-2 text-center">
                  <ExclamationTriangleIcon className="w-6 h-6 mb-1 text-gray-400" />
                  <span>{/* Assuming 'error' state variable exists or using a derived message */}
                    {/* For simplicity, using a generic message here. If specific error message is needed,
                a state variable like `errorMessage` should be introduced. */}
                    {signedUrl.includes('404') || signedUrl.includes('not found') ? '圖片已過期' : '無法載入圖片'}
                  </span>

                  {/* 顯示詳細錯誤資訊的切換按鈕 */}
                  {/* Assuming showErrorDetails state and setShowErrorDetails function exist */}
                  {/* <button 
            onClick={() => setShowErrorDetails(!showErrorDetails)}
            className="mt-2 text-[10px] text-blue-500 hover:underline flex items-center"
          >
            {showErrorDetails ? '隱藏詳情' : '顯示詳情'}
          </button> */}

                  {/* 詳細錯誤資訊 (僅在展開時顯示) */}
                  {/* {showErrorDetails && (
             <div className="mt-1 w-full max-w-[200px] overflow-hidden">
               <p className="truncate" title={error}>{error}</p>
               <p className="truncate text-[9px] mt-0.5 text-gray-400" title={imageUrl}>URL: {imageUrl}</p>
             </div>
          )} */}

                  {/* 下載按鈕 (即使出錯也嘗試提供，可能只是顯示問題) */}
                  {imageUrl && !imageUrl.startsWith('blob:') && (
                    <a
                      href={imageUrl}
                      download={`image-${Date.now()}.png`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 px-2 py-1 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-1"
                    >
                      <ArrowDownTrayIcon className="w-3 h-3" />
                      <span>下載原圖</span>
                    </a>
                  )}
                </div>
              )}

              {/* 48小時過期警告 (僅在圖片成功載入且未出錯時顯示) */}
              {!isLoading && !hasError && ( // Changed 'error' to 'hasError'
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] py-1 px-2 text-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  ⚠️ 圖片將於 48 小時後移除，請及時保存
                </div>
              )}
              {/* 放大後的圖片 */}
              <div className="relative flex items-center justify-center p-4 min-h-0">
                <div className="relative inline-block">
                  <img
                    src={signedUrl}
                    alt={alt}
                    className="max-w-full max-h-[80vh] w-auto h-auto object-contain"
                    onClick={(e) => e.stopPropagation()}
                    onLoad={(e) => {
                      const img = e.currentTarget;
                      const rect = img.getBoundingClientRect();
                      setImageSize({
                        width: rect.width,
                        height: rect.height
                      });
                    }}
                    style={{
                      maxWidth: 'min(85vw, 100%)',
                      maxHeight: '80vh'
                    }}
                  />
                </div>
                {/* 水印 - 放大視圖右下角，根據圖片尺寸定位 */}
                {imageSize && (
                  <div
                    className="absolute pointer-events-none z-20"
                    style={{
                      bottom: '8px',
                      right: '8px',
                      width: '48px',
                      height: '48px',
                      // 確保水印不會超出圖片邊界
                      maxWidth: `${Math.min(imageSize.width * 0.1, 48)}px`,
                      maxHeight: `${Math.min(imageSize.height * 0.1, 48)}px`
                    }}
                  >
                    <img
                      src="/@hanami.png"
                      alt="Hanami 水印"
                      className="opacity-70 hover:opacity-90 transition-opacity w-full h-full"
                      style={{
                        filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.3))',
                        objectFit: 'contain'
                      }}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
