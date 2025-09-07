'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface CaptchaComponentProps {
  onCaptchaChange: (captchaText: string) => void;
  onCaptchaGenerated: (captchaText: string, captchaImage: string) => void;
  className?: string;
  width?: number;
  height?: number;
  length?: number;
}

export function CaptchaComponent({
  onCaptchaChange,
  onCaptchaGenerated,
  className = '',
  width = 120,
  height = 40,
  length = 4
}: CaptchaComponentProps) {
  const [captchaText, setCaptchaText] = useState('');
  const [captchaImage, setCaptchaImage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // 生成驗證碼
  const generateCaptcha = useCallback(() => {
    // 確保在客戶端環境
    if (typeof window === 'undefined') return;
    
    setIsGenerating(true);
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsGenerating(false);
      return;
    }

    canvas.width = width;
    canvas.height = height;

    // 生成隨機驗證碼文字
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let text = '';
    for (let i = 0; i < length; i++) {
      text += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    setCaptchaText(text);
    onCaptchaChange(text);

    // 設置背景
    ctx.fillStyle = '#FFF9F2';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 添加干擾線
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = `hsl(${Math.random() * 360}, 70%, 80%)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }

    // 添加干擾點
    for (let i = 0; i < 20; i++) {
      ctx.fillStyle = `hsl(${Math.random() * 360}, 70%, 80%)`;
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
    }

    // 繪製文字
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = '#4B4036';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 為每個字符添加輕微旋轉和位置偏移
    for (let i = 0; i < text.length; i++) {
      const x = (width / (length + 1)) * (i + 1);
      const y = height / 2 + (Math.random() - 0.5) * 10;
      const rotation = (Math.random() - 0.5) * 0.3;
      
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.fillText(text[i], 0, 0);
      ctx.restore();
    }

    // 轉換為base64圖片
    const imageData = canvas.toDataURL('image/png');
    setCaptchaImage(imageData);
    onCaptchaGenerated(text, imageData);
    
    setIsGenerating(false);
  }, [width, height, length, onCaptchaChange, onCaptchaGenerated]);

  // 組件掛載時生成驗證碼
  useEffect(() => {
    generateCaptcha();
  }, [generateCaptcha]);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative">
        {captchaImage ? (
          <img 
            alt="驗證碼" 
            className="border border-[#EADBC8] rounded bg-white" 
            src={captchaImage}
            style={{ width: `${width}px`, height: `${height}px` }}
          />
        ) : (
          <div 
            className="border border-[#EADBC8] rounded bg-white flex items-center justify-center"
            style={{ width: `${width}px`, height: `${height}px` }}
          >
            <span className="text-[#87704e] text-sm">
              {isGenerating ? '生成中...' : '載入中...'}
            </span>
          </div>
        )}
        <button
          className="absolute -top-1 -right-1 w-6 h-6 bg-[#FFB84C] text-white rounded-full text-xs flex items-center justify-center hover:bg-[#FFA726] transition-colors disabled:opacity-50"
          title="重新生成驗證碼"
          type="button"
          onClick={generateCaptcha}
          disabled={isGenerating}
        >
          <ArrowPathIcon className={`h-3 w-3 ${isGenerating ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  );
}

// 驗證碼輸入組件
interface CaptchaInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}

export function CaptchaInput({
  value,
  onChange,
  placeholder = "請輸入驗證碼",
  maxLength = 4,
  className = ""
}: CaptchaInputProps) {
  return (
    <input
      className={`flex-1 border border-[#EADBC8] rounded-lg px-4 py-2 bg-white text-[#4B4036] uppercase ${className}`}
      maxLength={maxLength}
      placeholder={placeholder}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

// 完整的驗證碼組件
interface FullCaptchaProps {
  captchaAnswer: string;
  onCaptchaAnswerChange: (value: string) => void;
  onCaptchaGenerated: (captchaText: string, captchaImage: string) => void;
  className?: string;
  showInstructions?: boolean;
}

export function FullCaptcha({
  captchaAnswer,
  onCaptchaAnswerChange,
  onCaptchaGenerated,
  className = '',
  showInstructions = true
}: FullCaptchaProps) {
  const [captchaText, setCaptchaText] = useState('');

  const handleCaptchaChange = (text: string) => {
    setCaptchaText(text);
  };

  const handleCaptchaGenerated = (text: string, image: string) => {
    setCaptchaText(text);
    onCaptchaGenerated(text, image);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium text-[#4B4036]">
        🔒 人機驗證（防止機器人提交）
      </label>
      
      <div className="flex items-center gap-3">
        <CaptchaComponent
          onCaptchaChange={handleCaptchaChange}
          onCaptchaGenerated={handleCaptchaGenerated}
        />
        <CaptchaInput
          value={captchaAnswer}
          onChange={onCaptchaAnswerChange}
        />
      </div>
      
      {showInstructions && (
        <p className="text-xs text-[#87704e]">
          請輸入上方圖片中的驗證碼（不區分大小寫），以證明您是真人
        </p>
      )}
    </div>
  );
}
