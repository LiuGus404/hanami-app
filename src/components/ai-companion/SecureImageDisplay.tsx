/**
 * SecureImageDisplay - 安全圖片顯示組件
 * 自動處理 Private Bucket 的 Signed URL 生成
 * 支援縮圖顯示和點擊放大
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, ArrowDownTrayIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { getSignedImageUrl, needsSignedUrl } from '@/lib/getSignedImageUrl';

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
    
    // ⭐ 如果當前 URL 是公開 URL 但載入失敗，嘗試使用代理 API
    if (signedUrl.includes('/storage/v1/object/public/ai-images')) {
      const storagePath = signedUrl.match(/\/storage\/v1\/object\/public\/ai-images\/(.+?)(?:\?|$)/)?.[1];
      if (storagePath) {
        const proxyUrl = `/api/storage/proxy-image?path=${encodeURIComponent(storagePath)}`;
        
        // 只在第一次失敗時嘗試代理，避免無限循環
        if (!signedUrl.includes('/api/storage/proxy-image')) {
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
      <div className="relative overflow-hidden">
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
              圖片載入失敗
            </div>
            <div className="text-xs text-red-400 break-all max-w-full">
              嘗試載入：{signedUrl.substring(0, 100)}...
            </div>
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
              className="relative max-w-[85vw] max-h-[85vh] bg-white rounded-xl shadow-2xl overflow-auto flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 工具欄 */}
              <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
                {/* 下載按鈕 */}
                {onDownload && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownload();
                    }}
                    className="p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
                    aria-label="下載圖片"
                    title="下載圖片"
                  >
                    <ArrowDownTrayIcon className="w-6 h-6 text-gray-800" />
                  </button>
                )}
                {/* 關閉按鈕 */}
                <button
                  onClick={handleCloseZoom}
                  className="p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
                  aria-label="關閉"
                >
                  <XMarkIcon className="w-6 h-6 text-gray-800" />
                </button>
              </div>

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
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

