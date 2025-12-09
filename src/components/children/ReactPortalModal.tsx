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
        backgroundColor: 'rgba(75, 64, 54, 0.2)',
        backdropFilter: 'blur(4px)',
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
        className="animate-in fade-in zoom-in duration-300"
        style={{
          backgroundColor: '#FFF9F2',
          borderRadius: '40px',
          boxShadow: '8px 8px 16px #E6D9C5, -8px -8px 16px #FFFFFF',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          border: 'none',
          outline: 'none'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 標題欄 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '32px 32px 24px 32px',
          borderBottom: 'none',
          borderRadius: '40px 40px 0 0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: '#FFF9F2',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 3px 3px 6px #D1C3B1, inset -3px -3px 6px #FFFFFF'
            }}>
              <User style={{ width: '24px', height: '24px', color: '#4B4036' }} />
            </div>
            <h2 style={{
              fontSize: '24px',
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
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: 'none',
              background: '#FFF9F2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '5px 5px 10px #E6D9C5, -5px -5px 10px #FFFFFF',
              color: '#8B7E74'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = 'inset 2px 2px 4px #D1C3B1, inset -2px -2px 4px #FFFFFF';
              e.currentTarget.style.color = '#4B4036';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '5px 5px 10px #E6D9C5, -5px -5px 10px #FFFFFF';
              e.currentTarget.style.color = '#8B7E74';
            }}
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* 內容區域 */}
        <div style={{
          padding: '0 32px 24px 32px',
          flex: 1,
          overflowY: 'auto',
          background: 'transparent'
        }}>
          {children}
        </div>

        {/* 按鈕區域 */}
        <div style={{
          padding: '24px 32px 32px 32px',
          borderTop: 'none',
          background: 'transparent',
          borderRadius: '0 0 40px 40px',
          display: 'flex',
          gap: '16px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px 28px',
              borderRadius: '20px',
              border: 'none',
              background: '#FFF9F2',
              color: '#8B7E74',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '6px 6px 12px #E6D9C5, -6px -6px 12px #FFFFFF'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = 'inset 3px 3px 6px #D1C3B1, inset -3px -3px 6px #FFFFFF';
              e.currentTarget.style.color = '#4B4036';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '6px 6px 12px #E6D9C5, -6px -6px 12px #FFFFFF';
              e.currentTarget.style.color = '#8B7E74';
            }}
          >
            取消
          </button>
          <button
            onClick={onSubmit}
            style={{
              padding: '12px 32px',
              borderRadius: '20px',
              border: 'none',
              background: '#FFF9F2',
              color: '#4B4036',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '6px 6px 12px #E6D9C5, -6px -6px 12px #FFFFFF'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = 'inset 3px 3px 6px #D1C3B1, inset -3px -3px 6px #FFFFFF';
              e.currentTarget.style.borderColor = 'transparent';
              e.currentTarget.style.color = '#E69138'; // Hover text color for emphasis
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '6px 6px 12px #E6D9C5, -6px -6px 12px #FFFFFF';
              e.currentTarget.style.color = '#4B4036';
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