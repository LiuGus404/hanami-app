'use client';

import React from 'react';
import { HanamiButton, HanamiCard } from '../../../../components/ui';

export default function TestPage() {
  return (
    <div className="min-h-screen bg-hanami-background p-8">
      <HanamiCard className="max-w-md mx-auto p-6">
        <h1 className="text-2xl font-bold text-hanami-text mb-4">
          AI 伙伴系統測試頁面
        </h1>
        <p className="text-hanami-text-secondary mb-4">
          這是一個簡化的測試頁面，用來檢查基礎組件是否正常工作。
        </p>
        <HanamiButton>
          測試按鈕
        </HanamiButton>
      </HanamiCard>
    </div>
  );
}

