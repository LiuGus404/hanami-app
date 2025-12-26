'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, UserPlus, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface StudentTypeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  regularPath?: string;
  trialPath?: string;
}

export default function StudentTypeSelector({
  isOpen,
  onClose,
  regularPath = '/admin/students/new?type=regular',
  trialPath = '/admin/students/new?type=trial',
}: StudentTypeSelectorProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSelectType = useCallback((type: 'regular' | 'trial') => {
    const target = type === 'regular' ? regularPath : trialPath;
    onClose();
    // 延遲導航以確保模態框先關閉
    setTimeout(() => {
      router.push(target);
    }, 100);
  }, [regularPath, trialPath, router, onClose]);

  // 防止背景滾動
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
    return undefined;
  }, [isOpen]);

  // 處理 ESC 鍵關閉
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div
      className="student-type-selector-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box',
      }}
    >
      {/* 半透明背景 - 點擊關閉 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
        onClick={onClose}
      />

      {/* 彈窗內容 */}
      <div
        style={{
          position: 'relative',
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '24px',
          width: '100%',
          maxWidth: '400px',
          maxHeight: 'calc(100vh - 32px)',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          zIndex: 1,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 關閉按鈕 */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            padding: '8px',
            color: '#9ca3af',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '8px',
            touchAction: 'manipulation',
          }}
        >
          <X style={{ width: '24px', height: '24px' }} />
        </button>

        {/* 標題 */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#2B3A3B', marginBottom: '8px' }}>
            新增學生
          </h2>
          <p style={{ color: '#6b7280' }}>請選擇要新增的學生類型</p>
        </div>

        {/* 選項 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* 常規學生選項 */}
          <button
            type="button"
            onClick={() => handleSelectType('regular')}
            style={{
              width: '100%',
              padding: '16px',
              background: 'linear-gradient(to right, #FFD59A, #EBC9A4)',
              borderRadius: '12px',
              border: '1px solid #EADBC8',
              cursor: 'pointer',
              textAlign: 'left',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                padding: '12px',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              }}>
                <UserPlus style={{ width: '24px', height: '24px', color: '#A64B2A' }} />
              </div>
              <div>
                <h3 style={{ fontWeight: '600', color: '#2B3A3B', fontSize: '18px', margin: 0 }}>
                  常規學生
                </h3>
                <p style={{ color: '#4B4036', fontSize: '14px', margin: '4px 0 0 0' }}>
                  新增正式註冊的常規學生
                </p>
              </div>
            </div>
          </button>

          {/* 試堂學生選項 */}
          <button
            type="button"
            onClick={() => handleSelectType('trial')}
            style={{
              width: '100%',
              padding: '16px',
              background: 'linear-gradient(to right, #FFB6C1, #EBC9A4)',
              borderRadius: '12px',
              border: '1px solid #EADBC8',
              cursor: 'pointer',
              textAlign: 'left',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                padding: '12px',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              }}>
                <Calendar style={{ width: '24px', height: '24px', color: '#A64B2A' }} />
              </div>
              <div>
                <h3 style={{ fontWeight: '600', color: '#2B3A3B', fontSize: '18px', margin: 0 }}>
                  試堂學生
                </h3>
                <p style={{ color: '#4B4036', fontSize: '14px', margin: '4px 0 0 0' }}>
                  新增試聽課程的學生
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* 取消按鈕 */}
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              color: '#A68A64',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '8px 16px',
              fontSize: '16px',
              touchAction: 'manipulation',
            }}
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );

  // 使用 Portal 將模態框渲染到 body 的最頂層
  return createPortal(modalContent, document.body);
}