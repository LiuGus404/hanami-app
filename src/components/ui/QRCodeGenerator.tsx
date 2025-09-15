'use client';

import { useEffect, useState } from 'react';

interface QRCodeGeneratorProps {
  text: string;
  size?: number;
  className?: string;
}

export default function QRCodeGenerator({ 
  text, 
  size = 200, 
  className = '' 
}: QRCodeGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    if (!text) return;

    const generateQRCode = async () => {
      try {
        setIsGenerating(true);
        setError(null);

        // 使用在線QR碼生成API
        const encodedText = encodeURIComponent(text);
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedText}`;
        
        // 預載入圖片以確保可用
        const img = new Image();
        img.onload = () => {
          setQrCodeUrl(qrUrl);
          setIsGenerating(false);
        };
        img.onerror = () => {
          setError('生成QR碼失敗');
          setIsGenerating(false);
        };
        img.src = qrUrl;
        
      } catch (err) {
        console.error('生成QR碼失敗:', err);
        setError('生成QR碼失敗');
        setIsGenerating(false);
      }
    };

    generateQRCode();
  }, [text, size]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`} style={{ width: size, height: size }}>
        <div className="text-center text-gray-500">
          <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-xs">生成失敗</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {qrCodeUrl ? (
        <img
          src={qrCodeUrl}
          alt={`QR碼: ${text}`}
          width={size}
          height={size}
          className="rounded-lg border border-gray-200"
        />
      ) : (
        <div 
          className="flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200"
          style={{ width: size, height: size }}
        >
          {isGenerating ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFD59A]"></div>
          ) : (
            <div className="text-center text-gray-500">
              <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <p className="text-xs">載入中...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
