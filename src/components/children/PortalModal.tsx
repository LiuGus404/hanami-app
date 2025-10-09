'use client';

import React, { useEffect, useState } from 'react';

interface PortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onSubmit: () => void;
  submitButtonText?: string;
}

export default function PortalModal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  onSubmit,
  submitButtonText = '確認'
}: PortalModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen) return null;

  // 創建模態框元素並直接添加到 body
  const modalElement = document.createElement('div');
  modalElement.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2147483647;
    padding: 16px;
  `;

  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    width: 100%;
    max-width: 500px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    position: relative;
  `;

  modalContent.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px; border-bottom: 1px solid #e5e7eb; background-color: white; border-radius: 8px 8px 0 0;">
      <h3 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0;">${title}</h3>
      <button id="close-btn" style="background: none; border: none; font-size: 20px; color: #6b7280; cursor: pointer; padding: 4px;">×</button>
    </div>
    <div id="modal-content" style="flex: 1; overflow-y: auto; padding: 16px; background-color: white;">
      <!-- 內容將在這裡插入 -->
    </div>
    <div style="display: flex; justify-content: flex-end; gap: 12px; padding: 20px; border-top: 2px solid #e5e7eb; background-color: #ffffff; border-radius: 0 0 8px 8px; box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1); position: relative; z-index: 2147483647;">
      <button id="cancel-btn" style="padding: 12px 24px; font-size: 16px; font-weight: 600; color: #374151; background-color: white; border: 2px solid #d1d5db; border-radius: 8px; cursor: pointer; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">取消</button>
      <button id="submit-btn" style="padding: 12px 24px; font-size: 16px; font-weight: 600; color: white; background-color: #3b82f6; border: 2px solid #3b82f6; border-radius: 8px; cursor: pointer; box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);">${submitButtonText}</button>
    </div>
  `;

  modalElement.appendChild(modalContent);
  document.body.appendChild(modalElement);

  // 添加事件監聽器
  const handleClose = () => {
    document.body.removeChild(modalElement);
    onClose();
  };

  const handleSubmit = () => {
    onSubmit();
    document.body.removeChild(modalElement);
  };

  const closeBtn = modalContent.querySelector('#close-btn');
  const cancelBtn = modalContent.querySelector('#cancel-btn');
  const submitBtn = modalContent.querySelector('#submit-btn');

  if (closeBtn) closeBtn.addEventListener('click', handleClose);
  if (cancelBtn) cancelBtn.addEventListener('click', handleClose);
  if (submitBtn) submitBtn.addEventListener('click', handleSubmit);

  modalElement.addEventListener('click', (e) => {
    if (e.target === modalElement) {
      handleClose();
    }
  });

  // 將 children 插入到內容區域
  const contentDiv = modalContent.querySelector('#modal-content');
  if (contentDiv) {
    contentDiv.innerHTML = '';
    // 這裡需要將 React 元素轉換為 HTML
    // 暫時使用一個簡單的方法
    contentDiv.innerHTML = '<div>表單內容將在這裡顯示</div>';
  }

  return null; // 這個組件不渲染任何內容
}
