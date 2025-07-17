'use client';

import { Sprout } from 'lucide-react';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';

export type PopupSelectProps = {
  title: string
  options: { label: string; value: string }[]
  selected: string[] | string
  onChange: (newSelected: string[] | string) => void
  onConfirm?: () => void
  onCancel?: () => void
  mode?: 'multi' | 'single' | 'multiple' // 支援 'multiple' 作為 'multi' 的別名
  errorMsg?: string
}

export const PopupSelect: React.FC<PopupSelectProps> = ({
  title,
  options,
  selected,
  onChange,
  onConfirm,
  onCancel,
  mode = 'multi',
  errorMsg,
}) => {
  // 統一 mode 值，支援 'multiple' 作為 'multi' 的別名
  const actualMode = mode === 'multiple' ? 'multi' : mode;

  const isSelected = (value: string) => {
    if (actualMode === 'multi') {
      return Array.isArray(selected) ? selected.includes(value) : false;
    } else {
      return Array.isArray(selected) ? false : selected === value;
    }
  };

  const toggleOption = (value: string) => {
    if (actualMode === 'multi') {
      const current = Array.isArray(selected) ? selected : [];
      let updated: string[];
      
      if (current.includes(value)) {
        // 如果已選中，則移除
        updated = current.filter((v) => v !== value);
      } else {
        // 如果未選中，則添加
        updated = [...current, value];
      }
      
      onChange(updated);
    } else {
      // 單選模式
      onChange(value);
    }
  };

  const getSelectedDisplay = () => {
    if (actualMode === 'multi') {
      if (!Array.isArray(selected) || selected.length === 0) {
        return '請選擇';
      }
      if (selected.length === 1) {
        const option = options.find(opt => opt.value === selected[0]);
        return option ? option.label : '請選擇';
      }
      return `已選擇 ${selected.length} 項`;
    } else {
      if (!selected || selected === '') {
        return '請選擇';
      }
      const option = options.find(opt => opt.value === selected);
      return option ? option.label : '請選擇';
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/30 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-[#FFFDF8] border border-[#D8CDBF] rounded-[24px] w-80 p-6 shadow-xl text-[#4B4B4B] max-h-[80vh] flex flex-col">
        <h2 className="text-xl font-bold text-center mb-4">{title}</h2>
        {errorMsg && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{errorMsg}</div>
        )}
        
        {/* 顯示已選擇的項目 */}
        {actualMode === 'multi' && Array.isArray(selected) && selected.length > 0 && (
          <div className="mb-4 p-3 bg-[#F3F0E5] rounded-lg">
            <div className="text-sm font-medium mb-2">已選擇：</div>
            <div className="flex flex-wrap gap-2">
              {selected.map((value) => {
                const option = options.find(opt => opt.value === value);
                return option ? (
                  <span key={value} className="text-xs bg-[#E8E3D5] px-2 py-1 rounded">
                    {option.label}
                  </span>
                ) : null;
              })}
            </div>
          </div>
        )}
        
        <div className="space-y-3 overflow-y-auto flex-1 pr-2">
          {options.map(({ label, value }) => (
            <div
              key={value}
              className={`flex items-center justify-between px-4 py-3 rounded-2xl cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                isSelected(value) ? 'bg-green-50 border-2 border-green-200 shadow-md scale-[1.02]' : 'bg-white hover:bg-[#F3F0E5] hover:shadow-sm border-2 border-transparent'
              }`}
              onClick={() => toggleOption(value)}
            >
              <div className="flex items-center gap-3">
                <Sprout className={`w-5 h-5 transition-all duration-200 ${isSelected(value) ? 'text-green-600 scale-110' : 'text-[#D8CDBF]'}`} />
                <span className={`text-base font-medium transition-colors duration-200 ${
                  isSelected(value) ? 'text-green-700 font-semibold' : 'text-[#4B4B4B]'
                }`}>{label}</span>
              </div>
              {isSelected(value) && (
                <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center animate-bounce">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="flex justify-around mt-6 pt-4 border-t border-[#D8CDBF]">
          <button
            className="px-4 py-2 border border-[#D8CDBF] rounded-xl hover:bg-[#F3F0E5] transition-all duration-200 hover:scale-105"
            onClick={onCancel}
          >
            取消
          </button>
          <button
            className="px-6 py-2 bg-[#A68A64] text-white font-semibold rounded-xl hover:bg-[#937654] transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
            onClick={onConfirm}
          >
            確定
          </button>
        </div>
      </div>
    </div>,
    typeof window !== 'undefined' ? document.body : (null as any),
  );
};