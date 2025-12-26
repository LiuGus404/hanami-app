'use client';

import { useCallback, useEffect } from 'react';
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999]"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      {/* 半透明背景 - 點擊關閉 */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        style={{ touchAction: 'none' }}
      />

      {/* 彈窗內容 - 使用絕對定位確保在最上層 */}
      <div
        className="absolute inset-0 flex items-center justify-center p-4"
        style={{ pointerEvents: 'none' }}
      >
        <div
          className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
          style={{
            pointerEvents: 'auto',
            maxHeight: 'calc(100vh - 32px)',
            overflowY: 'auto',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 關閉按鈕 */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10 p-2"
            style={{ touchAction: 'manipulation' }}
          >
            <X className="w-6 h-6" />
          </button>

          {/* 標題 */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-[#2B3A3B] mb-2">新增學生</h2>
            <p className="text-gray-600">請選擇要新增的學生類型</p>
          </div>

          {/* 選項 */}
          <div className="space-y-4">
            {/* 常規學生選項 */}
            <button
              type="button"
              onClick={() => handleSelectType('regular')}
              className="w-full p-4 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] rounded-xl border border-[#EADBC8] hover:shadow-lg active:opacity-80 transition-all duration-200 text-left"
              style={{
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'rgba(0,0,0,0.1)',
              }}
            >
              <div className="flex items-center gap-4 pointer-events-none">
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <UserPlus className="w-6 h-6 text-[#A64B2A]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#2B3A3B] text-lg">常規學生</h3>
                  <p className="text-[#4B4036] text-sm">新增正式註冊的常規學生</p>
                </div>
              </div>
            </button>

            {/* 試堂學生選項 */}
            <button
              type="button"
              onClick={() => handleSelectType('trial')}
              className="w-full p-4 bg-gradient-to-r from-[#FFB6C1] to-[#EBC9A4] rounded-xl border border-[#EADBC8] hover:shadow-lg active:opacity-80 transition-all duration-200 text-left"
              style={{
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'rgba(0,0,0,0.1)',
              }}
            >
              <div className="flex items-center gap-4 pointer-events-none">
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <Calendar className="w-6 h-6 text-[#A64B2A]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#2B3A3B] text-lg">試堂學生</h3>
                  <p className="text-[#4B4036] text-sm">新增試聽課程的學生</p>
                </div>
              </div>
            </button>
          </div>

          {/* 取消按鈕 */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={onClose}
              className="text-[#A68A64] hover:text-[#8B7355] transition-colors py-2 px-4"
              style={{ touchAction: 'manipulation' }}
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}