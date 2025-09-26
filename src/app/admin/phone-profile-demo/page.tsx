'use client';

import { useState } from 'react';
import StudentPhoneProfile from '@/components/ui/StudentPhoneProfile';
import { HanamiCard } from '@/components/ui/HanamiCard';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { Phone, Eye, RefreshCw } from 'lucide-react';

export default function PhoneProfileDemoPage() {
  const [demoPhone, setDemoPhone] = useState('+852-1234-5678');
  const [demoStudentId, setDemoStudentId] = useState('demo-student-001');
  const [demoStudentName, setDemoStudentName] = useState('張小明');

  const demoPhones = [
    { phone: '+852-1234-5678', studentId: 'demo-student-001', name: '張小明' },
    { phone: '+852-9876-5432', studentId: 'demo-student-002', name: '李美華' },
    { phone: '+852-5555-1234', studentId: 'demo-student-003', name: '王大力' },
  ];

  const switchDemo = (demo: typeof demoPhones[0]) => {
    setDemoPhone(demo.phone);
    setDemoStudentId(demo.studentId);
    setDemoStudentName(demo.name);
  };

  return (
    <div className="min-h-screen bg-[#FFF9F2] p-6">
      <div className="max-w-6xl mx-auto">
        {/* 標題區域 */}
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-[#FFD59A] rounded-xl mr-4">
              <Phone className="w-6 h-6 text-[#2B3A3B]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#2B3A3B]">電話檔案系統演示</h1>
              <p className="text-[#2B3A3B]/70">展示 AI 智能分析與個人化洞察功能</p>
            </div>
          </div>
        </div>

        {/* 演示控制面板 */}
        <HanamiCard className="mb-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-[#2B3A3B] mb-4">演示控制面板</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-[#2B3A3B]/70 mb-2">
                  當前演示學生
                </label>
                <p className="text-[#2B3A3B] font-medium">{demoStudentName}</p>
                <p className="text-[#2B3A3B]/60 text-sm font-mono">{demoPhone}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2B3A3B]/70 mb-2">
                  學生 ID
                </label>
                <p className="text-[#2B3A3B] font-mono text-sm">{demoStudentId}</p>
              </div>
              <div className="flex items-end">
                <HanamiButton
                  onClick={() => window.location.reload()}
                  variant="secondary"
                  size="sm"
                  className="flex items-center"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  重新載入
                </HanamiButton>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#2B3A3B]/70 mb-2">
                切換演示案例
              </label>
              <div className="flex flex-wrap gap-2">
                {demoPhones.map((demo, index) => (
                  <button
                    key={index}
                    onClick={() => switchDemo(demo)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      demoPhone === demo.phone
                        ? 'bg-[#FFD59A] text-[#2B3A3B]'
                        : 'bg-[#EADBC8] text-[#2B3A3B] hover:bg-[#FFD59A]'
                    }`}
                  >
                    {demo.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </HanamiCard>

        {/* 電話檔案組件演示 */}
        <StudentPhoneProfile 
          studentId={demoStudentId}
          studentPhone={demoPhone}
          studentName={demoStudentName}
        />

        {/* 功能說明 */}
        <HanamiCard className="mt-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-[#2B3A3B] mb-4">功能說明</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-[#2B3A3B] mb-3">基本資訊顯示</h3>
                <ul className="text-sm text-[#2B3A3B]/70 space-y-2">
                  <li>• 電話號碼與檔案名稱</li>
                  <li>• AI 分析等級 (A/B/C/D)</li>
                  <li>• 最後分析時間</li>
                  <li>• 最後聯絡時間</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-[#2B3A3B] mb-3">AI 分析洞察</h3>
                <ul className="text-sm text-[#2B3A3B]/70 space-y-2">
                  <li>• 孩子喜愛度 (1-5分制顯示)</li>
                  <li>• 家長重視程度 (1-5分制顯示)</li>
                  <li>• 家長需關注程度 (風險等級)</li>
                  <li>• 家庭練習資源評估</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-[#2B3A3B] mb-3">機構關係分析</h3>
                <ul className="text-sm text-[#2B3A3B]/70 space-y-2">
                  <li>• 對機構的喜愛度 (1-5分制) + 證據</li>
                  <li>• 最後分析日期</li>
                  <li>• 智能標籤分類</li>
                  <li>• 重要亮點摘要</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-[#2B3A3B] mb-3">互動功能</h3>
                <ul className="text-sm text-[#2B3A3B]/70 space-y-2">
                  <li>• 可展開/收合的各個區塊</li>
                  <li>• 編輯檔案功能</li>
                  <li>• 重新分析功能</li>
                  <li>• 建立新檔案功能</li>
                </ul>
              </div>
            </div>
          </div>
        </HanamiCard>

        {/* 技術說明 */}
        <HanamiCard className="mt-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-[#2B3A3B] mb-4">技術實現</h2>
            
            <div className="bg-[#FFF9F2] rounded-lg p-4 border border-[#EADBC8]">
              <h3 className="font-semibold text-[#2B3A3B] mb-2">資料來源</h3>
              <p className="text-sm text-[#2B3A3B]/70 mb-3">
                所有分析資料都從 <code className="bg-white px-2 py-1 rounded text-xs">analysis_structured</code> JSONB 欄位中提取，
                支援動態資料結構和靈活的 AI 分析結果存儲。
              </p>
              
              <h3 className="font-semibold text-[#2B3A3B] mb-2">API 端點</h3>
              <p className="text-sm text-[#2B3A3B]/70 mb-3">
                <code className="bg-white px-2 py-1 rounded text-xs">/api/phone-profiles/[phone]</code> - 
                支援 GET (查詢) 和 POST (創建/更新) 操作
              </p>
              
              <h3 className="font-semibold text-[#2B3A3B] mb-2">資料庫表</h3>
              <p className="text-sm text-[#2B3A3B]/70">
                <code className="bg-white px-2 py-1 rounded text-xs">saas_phone_profiles</code> - 
                存儲電話號碼的個人檔案分析資訊，包含完整的 AI 分析結果
              </p>
            </div>
          </div>
        </HanamiCard>
      </div>
    </div>
  );
}
