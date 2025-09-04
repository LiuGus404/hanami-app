'use client';

import React, { useState } from 'react';
import { LearningPathBuilder } from '@/components/ui';

export default function TestLearningPathPage() {
  const [showBuilder, setShowBuilder] = useState(false);

  // 模擬活動數據
  const mockActivities = [
    {
      id: '1',
      activity_name: '認識小手',
      activity_description: '學習認識手指和手部結構',
      activity_type: 'custom',
      difficulty_level: 1,
      estimated_duration: 15,
      custom_activity_name: '認識小手',
      custom_activity_description: '學習認識手指和手部結構'
    },
    {
      id: '2',
      activity_name: '基本坐姿練習',
      activity_description: '學習正確的鋼琴坐姿',
      activity_type: 'custom',
      difficulty_level: 1,
      estimated_duration: 20,
      custom_activity_name: '基本坐姿練習',
      custom_activity_description: '學習正確的鋼琴坐姿'
    },
    {
      id: '3',
      activity_name: '手型練習',
      activity_description: '練習正確的手型和手指位置',
      activity_type: 'custom',
      difficulty_level: 2,
      estimated_duration: 25,
      custom_activity_name: '手型練習',
      custom_activity_description: '練習正確的手型和手指位置'
    }
  ];

  const handleSave = (path: any) => {
    console.log('保存學習路線:', path);
    alert('學習路線保存成功！');
    setShowBuilder(false);
  };

  const handlePreview = (path: any) => {
    console.log('預覽學習路線:', path);
    alert('預覽學習路線功能');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-hanami-background to-hanami-surface p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-hanami-text mb-2">
            學習路線構建器測試
          </h1>
          <p className="text-hanami-text-secondary">
            測試學習路線構建器的拖拽和活動載入功能
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-hanami-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-hanami-text">
              測試活動數據
            </h2>
            <button
              onClick={() => setShowBuilder(true)}
              className="px-4 py-2 bg-hanami-primary text-white rounded-lg hover:bg-hanami-accent transition-colors"
            >
              打開學習路線構建器
            </button>
          </div>

          <div className="space-y-2">
            {mockActivities.map((activity, index) => (
              <div key={activity.id} className="p-3 border border-hanami-border rounded-lg">
                <div className="font-medium text-hanami-text">
                  {index + 1}. {activity.activity_name}
                </div>
                <div className="text-sm text-hanami-text-secondary">
                  {activity.activity_description}
                </div>
                <div className="text-xs text-hanami-text-secondary mt-1">
                  難度: {activity.difficulty_level} | 時長: {activity.estimated_duration}分鐘
                </div>
              </div>
            ))}
          </div>
        </div>

        {showBuilder && (
          <div className="fixed inset-0 z-50">
            <LearningPathBuilder
              treeId="test-tree"
              activities={mockActivities}
              onSave={handleSave}
              onPreview={handlePreview}
              onClose={() => setShowBuilder(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
