'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, CheckCircle, AlertTriangle } from 'lucide-react';

export default function TestAvatarIntegrationPage() {
  const router = useRouter();

  const integrationChecks = [
    {
      item: '3D動態角色元件',
      status: 'success',
      description: 'StudentAvatarWidget 已創建並整合',
      component: 'StudentAvatarWidget.tsx'
    },
    {
      item: '成長樹視覺化',
      status: 'success', 
      description: 'GrowthTreeVisualization 支援多樹顯示',
      component: 'GrowthTreeVisualization.tsx'
    },
    {
      item: '學習進度卡片',
      status: 'success',
      description: 'LearningProgressCards 多標籤展示',
      component: 'LearningProgressCards.tsx'
    },
    {
      item: '分頁系統整合',
      status: 'success',
      description: 'StudentAvatarTab 已加入學生個人資料頁面',
      component: 'StudentAvatarTab.tsx'
    },
    {
      item: 'API資料整合',
      status: 'success',
      description: '/api/student-avatar-data 端點已創建',
      component: 'route.ts'
    },
    {
      item: '自定義Hooks',
      status: 'success',
      description: 'useStudentAvatarData Hook 已實現',
      component: 'useStudentAvatarData.ts'
    },
    {
      item: '響應式設計',
      status: 'success',
      description: '所有組件支援移動裝置',
      component: 'CSS & Tailwind'
    },
    {
      item: '音效系統',
      status: 'warning',
      description: '基礎音效已實現，可增強音效檔案',
      component: 'useAudioManager Hook'
    }
  ];

  const testSteps = [
    {
      step: 1,
      title: '訪問學生管理頁面',
      description: '前往 /admin/students 查看學生列表',
      link: '/admin/students'
    },
    {
      step: 2,
      title: '選擇任一學生',
      description: '點擊學生卡片進入個人資料頁面',
      link: null
    },
    {
      step: 3,
      title: '點擊「互動角色」分頁',
      description: '查看3D動態角色和學習進度',
      link: null
    },
    {
      step: 4,
      title: '測試互動功能',
      description: '點擊角色、切換分頁、查看成長樹',
      link: null
    },
    {
      step: 5,
      title: '查看示範頁面',
      description: '訪問完整功能示範',
      link: '/admin/student-avatar-demo'
    }
  ];

  return (
    <div className="min-h-screen bg-[#FFF9F2] p-6">
      <div className="max-w-4xl mx-auto">
        {/* 頁首 */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-[#2B3A3B]/70 hover:text-[#2B3A3B] mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </button>
          
          <h1 className="text-3xl font-bold text-[#2B3A3B] mb-2">
            3D動態角色整合測試
          </h1>
          <p className="text-[#2B3A3B]/70">
            驗證3D動態角色元件系統在學生管理頁面中的整合狀況
          </p>
        </div>

        {/* 整合狀態檢查 */}
        <div className="mb-8 bg-gradient-to-br from-white to-[#FFFCEB] rounded-2xl p-6 border border-[#EADBC8] shadow-sm">
          <h2 className="text-xl font-bold text-[#2B3A3B] mb-4">整合狀態檢查</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {integrationChecks.map((check, index) => (
              <div
                key={index}
                className="flex items-start space-x-3 p-4 bg-white rounded-xl border border-[#EADBC8]/50"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {check.status === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-[#2B3A3B]">{check.item}</h4>
                  <p className="text-sm text-[#2B3A3B]/70 mt-1">{check.description}</p>
                  <p className="text-xs text-[#2B3A3B]/50 mt-1 font-mono">{check.component}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 測試步驟 */}
        <div className="mb-8 bg-gradient-to-br from-white to-[#FFFCEB] rounded-2xl p-6 border border-[#EADBC8] shadow-sm">
          <h2 className="text-xl font-bold text-[#2B3A3B] mb-4">測試步驟</h2>
          
          <div className="space-y-4">
            {testSteps.map((test, index) => (
              <div
                key={index}
                className="flex items-center space-x-4 p-4 bg-white rounded-xl border border-[#EADBC8]/50"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-[#FFD59A] rounded-full flex items-center justify-center text-[#2B3A3B] font-bold">
                  {test.step}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-[#2B3A3B]">{test.title}</h4>
                  <p className="text-sm text-[#2B3A3B]/70">{test.description}</p>
                </div>
                {test.link && (
                  <button
                    onClick={() => router.push(test.link)}
                    className="flex items-center px-3 py-2 bg-[#FFD59A] hover:bg-[#EBC9A4] rounded-lg text-[#2B3A3B] text-sm font-medium transition-colors"
                  >
                    前往
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 功能特色總結 */}
        <div className="bg-gradient-to-br from-white to-[#FFFCEB] rounded-2xl p-6 border border-[#EADBC8] shadow-sm">
          <h2 className="text-xl font-bold text-[#2B3A3B] mb-4">功能特色</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#FFD59A]/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🎭</span>
              </div>
              <h3 className="font-bold text-[#2B3A3B] mb-2">3D互動角色</h3>
              <p className="text-sm text-[#2B3A3B]/70">
                點擊觸發動畫、表情變化、音效回饋，根據性別自動調整角色外觀
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-[#EBC9A4]/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🌳</span>
              </div>
              <h3 className="font-bold text-[#2B3A3B] mb-2">成長樹視覺化</h3>
              <p className="text-sm text-[#2B3A3B]/70">
                樹狀圖展示能力發展路徑，支援多樹切換和節點互動
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-[#FFB6C1]/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="font-bold text-[#2B3A3B] mb-2">學習進度追蹤</h3>
              <p className="text-sm text-[#2B3A3B]/70">
                多標籤展示活動、課程、成就，即時更新學習狀況
              </p>
            </div>
          </div>
        </div>

        {/* 快速連結 */}
        <div className="mt-8 flex justify-center space-x-4">
          <button
            onClick={() => router.push('/admin/students')}
            className="px-6 py-3 bg-[#FFD59A] hover:bg-[#EBC9A4] rounded-xl text-[#2B3A3B] font-medium transition-colors"
          >
            開始測試
          </button>
          <button
            onClick={() => router.push('/admin/student-avatar-demo')}
            className="px-6 py-3 bg-white hover:bg-[#FFD59A]/20 rounded-xl border border-[#EADBC8] text-[#2B3A3B] font-medium transition-colors"
          >
            查看示範
          </button>
        </div>
      </div>
    </div>
  );
}
