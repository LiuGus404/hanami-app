'use client';

import React from 'react';
import LuLuCharacter2D from '@/components/3d/LuLuCharacter2D';

export default function TestLuLuPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          🦊 LuLu 角色測試頁面
        </h1>
        
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="h-96">
            <LuLuCharacter2D />
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            點擊下方的按鈕來測試 LuLu 的動畫效果
          </p>
        </div>
      </div>
    </div>
  );
}


