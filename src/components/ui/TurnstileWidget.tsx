'use client';

import { useState, useRef } from 'react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  className?: string;
}

export default function TurnstileWidget({ 
  onVerify, 
  onError, 
  onExpire, 
  className = '' 
}: TurnstileWidgetProps) {
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const turnstileRef = useRef<TurnstileInstance>(null);

  const handleVerify = (token: string) => {
    setIsVerified(true);
    setIsLoading(false);
    onVerify(token);
  };

  const handleError = () => {
    setIsVerified(false);
    setIsLoading(false);
    onError?.();
  };

  const handleExpire = () => {
    setIsVerified(false);
    setIsLoading(false);
    onExpire?.();
  };

  const handleLoad = () => {
    setIsLoading(true);
  };

  const reset = () => {
    setIsVerified(false);
    setIsLoading(false);
    turnstileRef.current?.reset();
  };

  return (
    <div className={`turnstile-container ${className}`}>
      <Turnstile
        ref={turnstileRef}
        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
        onSuccess={handleVerify}
        onError={handleError}
        onExpire={handleExpire}
        onLoad={handleLoad}
        options={{
          theme: 'light',
          size: 'normal',
          language: 'zh-TW'
        }}
        className="w-full"
      />
      
      {/* 載入狀態指示 */}
      {isLoading && (
        <div className="mt-2 text-sm text-[#4B4036]/70 text-center">
          正在載入驗證...
        </div>
      )}
      
      {/* 驗證成功指示 */}
      {isVerified && (
        <div className="mt-2 text-sm text-green-600 text-center flex items-center justify-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          驗證成功
        </div>
      )}
    </div>
  );
}

// 導出 reset 函數的 hook
export function useTurnstile() {
  const turnstileRef = useRef<TurnstileInstance>(null);
  
  const reset = () => {
    turnstileRef.current?.reset();
  };
  
  return { turnstileRef, reset };
}
