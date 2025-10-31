/**
 * SecureImageDisplay - 安全圖片顯示組件
 * 自動處理 Private Bucket 的 Signed URL 生成
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getSignedImageUrl, needsSignedUrl } from '@/lib/getSignedImageUrl';

interface SecureImageDisplayProps {
  imageUrl: string;
  alt?: string;
  className?: string;
  onClick?: () => void;
  onLoad?: () => void;
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

// ⭐ 全局緩存，避免重複請求相同的 Signed URL
const signedUrlCache = new Map<string, Promise<string>>();

export function SecureImageDisplay({
  imageUrl,
  alt = 'AI 生成圖片',
  className = '',
  onClick,
  onLoad,
  onError
}: SecureImageDisplayProps) {
  const [signedUrl, setSignedUrl] = useState<string>(imageUrl);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const isMountedRef = useRef<boolean>(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    abortControllerRef.current = new AbortController();

    async function fetchPublicUrl() {
      try {
        console.log('🚀 [SecureImage] useEffect 觸發，原始 URL:', imageUrl);
        setIsLoading(true);
        setHasError(false);

        // ⭐ bucket 已改為 public，只需要將 sign/authenticated URL 轉換為 public URL
        if (needsSignedUrl(imageUrl)) {
          console.log('🔄 [SecureImage] 需要轉換為公開 URL...');
          
          // ⭐ 使用緩存，避免重複請求
          let urlPromise = signedUrlCache.get(imageUrl);
          if (!urlPromise) {
            console.log('📡 [SecureImage] 新請求，加入緩存');
            urlPromise = getSignedImageUrl(imageUrl, 3600);
            signedUrlCache.set(imageUrl, urlPromise);
            
            // 5 分鐘後清除緩存
            setTimeout(() => {
              signedUrlCache.delete(imageUrl);
              console.log('🗑️ [SecureImage] 清除緩存:', imageUrl);
            }, 5 * 60 * 1000);
          } else {
            console.log('💾 [SecureImage] 使用緩存的請求');
          }
          
          const url = await urlPromise;
          
          if (isMountedRef.current && !abortControllerRef.current?.signal.aborted) {
            console.log('✅ [SecureImage] 準備更新 URL 狀態:', url);
            setSignedUrl(url);
            setIsLoading(false);
            console.log('✅ [SecureImage] URL 狀態已更新');
          } else {
            console.warn('⚠️ [SecureImage] 組件已卸載或取消，不更新狀態');
          }
        } else {
          console.log('📷 [SecureImage] 已是公開 URL，直接使用:', imageUrl);
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
      console.log('🧹 [SecureImage] 組件清理');
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, [imageUrl]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error('❌ [SecureImage] 圖片載入失敗:', signedUrl);
    // ⭐ bucket 已改為 public，直接標記錯誤
    setHasError(true);
    setIsLoading(false);
    if (onError) {
      onError(e);
    }
  };

  const handleLoad = () => {
    console.log('✅ [SecureImage] 圖片載入成功:', signedUrl);
    setHasError(false);
    if (onLoad) {
      onLoad();
    }
  };

  console.log('🎨 [SecureImage] 渲染組件，當前狀態:', {
    imageUrl,
    signedUrl,
    isLoading,
    hasError,
    urlsMatch: imageUrl === signedUrl
  });

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFB6C1]"></div>
        </div>
      )}
      
      <img
        src={signedUrl}
        alt={alt}
        className={className}
        onClick={onClick}
        onLoad={handleLoad}
        onError={handleError}
        style={{ display: hasError ? 'none' : 'block' }}
      />
      
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
    </div>
  );
}

