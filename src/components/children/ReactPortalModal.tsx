'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { User, X } from 'lucide-react';

interface ReactPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onSubmit: () => void;
  submitButtonText?: string;
}

export default function ReactPortalModal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  onSubmit,
  submitButtonText = '確認'
}: ReactPortalModalProps) {
  if (!isOpen) return null;

  const modalContent = (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(12px)',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          border: '1px solid #EADBC8'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 標題欄 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px',
          borderBottom: '1px solid #EADBC8',
          borderRadius: '24px 24px 0 0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #FFD59A 0%, #EBC9A4 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <User style={{ width: '20px', height: '20px', color: '#4B4036' }} />
            </div>
            <h2 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#4B4036',
              margin: 0
            }}>
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(75, 64, 54, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(75, 64, 54, 0.2)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(75, 64, 54, 0.1)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <X style={{ width: '16px', height: '16px', color: '#4B4036' }} />
          </button>
        </div>

        {/* 內容區域 */}
        <div style={{
          padding: '24px',
          flex: 1,
          overflowY: 'auto',
          background: 'linear-gradient(180deg, #FFFDF8 0%, #FFF9F2 100%)'
        }}>
          {children}
        </div>

        {/* 按鈕區域 */}
        <div style={{
          padding: '24px',
          borderTop: '1px solid #EADBC8',
          background: 'linear-gradient(135deg, #FFF9F2 0%, #FFD59A 100%)',
          borderRadius: '0 0 24px 24px',
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              border: '2px solid #EADBC8',
              background: 'rgba(255, 255, 255, 0.8)',
              color: '#4B4036',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#EADBC8';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            取消
          </button>
          <button
            onClick={() => {
              console.log('模態框確認按鈕被點擊');
              onSubmit();
            }}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #FFD59A 0%, #EBC9A4 100%)',
              color: '#4B4036',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(255, 213, 154, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 213, 154, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 213, 154, 0.3)';
            }}
          >
            {submitButtonText}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}