'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { User, X, RotateCcw } from 'lucide-react';

interface Child {
  id: string;
  full_name: string;
  nick_name?: string;
  birth_date: string;
  age_in_months: number;
  gender: string;
  preferences?: string;
  health_notes?: string;
}

interface ChildSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: Child[];
  onSelectChild: (child: Child) => void;
  loading?: boolean;
}

export default function ChildSelectionModal({
  isOpen,
  onClose,
  children,
  onSelectChild,
  loading = false
}: ChildSelectionModalProps) {
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
          maxWidth: '500px',
          maxHeight: '80vh',
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
          padding: '20px 24px',
          borderBottom: '1px solid #EADBC8',
          background: 'linear-gradient(135deg, #FFF9F2 0%, #FFD59A 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #FFD59A 0%, #EBC9A4 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 8px rgba(255, 182, 193, 0.3)'
            }}>
              <User size={20} color="#4B4036" />
            </div>
            <h2 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#4B4036',
              margin: 0
            }}>
              選擇小朋友
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
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(75, 64, 54, 0.1)';
            }}
          >
            <X size={16} color="#4B4036" />
          </button>
        </div>

        {/* 內容區域 */}
        <div style={{
          padding: '24px',
          background: 'linear-gradient(180deg, #FFFDF8 0%, #FFF9F2 100%)',
          flex: 1,
          overflowY: 'auto'
        }}>
          {loading ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 20px',
              gap: '16px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FFD59A 0%, #EBC9A4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'spin 1s linear infinite'
              }}>
                <RotateCcw size={24} color="#4B4036" />
              </div>
              <p style={{
                fontSize: '16px',
                color: '#4B4036',
                margin: 0,
                textAlign: 'center'
              }}>
                正在載入小朋友資料...
              </p>
            </div>
          ) : children.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 20px',
              gap: '16px'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FFD59A 0%, #EBC9A4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <User size={32} color="#4B4036" />
              </div>
              <p style={{
                fontSize: '16px',
                color: '#4B4036',
                margin: 0,
                textAlign: 'center'
              }}>
                還沒有添加任何小朋友資料
              </p>
              <p style={{
                fontSize: '14px',
                color: '#2B3A3B',
                margin: 0,
                textAlign: 'center',
                opacity: 0.7
              }}>
                請先在設定頁面添加小朋友資料
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {children.map((child) => {
                const age = Math.floor(child.age_in_months / 12);
                const months = child.age_in_months % 12;
                const ageText = months > 0 ? `${age}歲${months}個月` : `${age}歲`;

                return (
                  <button
                    key={child.id}
                    onClick={() => onSelectChild(child)}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      border: '2px solid #EADBC8',
                      background: 'linear-gradient(135deg, #FFF9F2 0%, #FFD59A 100%)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#FFD59A';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 16px rgba(255, 182, 193, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#EADBC8';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '8px'
                    }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #FFD59A 0%, #EBC9A4 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <User size={16} color="#4B4036" />
                      </div>
                      <div>
                        <h3 style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#4B4036',
                          margin: 0
                        }}>
                          {child.full_name}
                        </h3>
                        {child.nick_name && (
                          <p style={{
                            fontSize: '14px',
                            color: '#2B3A3B',
                            margin: 0,
                            opacity: 0.8
                          }}>
                            {child.nick_name}
                          </p>
                        )}
                      </div>
                    </div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px',
                      fontSize: '14px',
                      color: '#2B3A3B'
                    }}>
                      <div>
                        <span style={{ opacity: 0.7 }}>年齡：</span>
                        <span style={{ fontWeight: '500' }}>{ageText}</span>
                      </div>
                      <div>
                        <span style={{ opacity: 0.7 }}>性別：</span>
                        <span style={{ fontWeight: '500' }}>{child.gender}</span>
                      </div>
                    </div>
                    {child.preferences && (
                      <div style={{
                        marginTop: '8px',
                        fontSize: '14px',
                        color: '#2B3A3B',
                        opacity: 0.8
                      }}>
                        <span style={{ opacity: 0.7 }}>喜好：</span>
                        <span>{child.preferences}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
