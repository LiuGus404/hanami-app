'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

import { AIToolsDashboard } from '@/components/admin/AIToolsDashboard';
import { AIToolsStatusPanel } from '@/components/admin/AIToolsStatusPanel';
import { supabase } from '@/lib/supabase';

export default function AIToolsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tools, setTools] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});

  // 載入AI工具資料
  const loadAITools = async () => {
    try {
      setLoading(true);
      
      // 暫時使用模擬資料，後續會連接到實際API
      const mockTools = [
        {
          id: 'content-generation',
          tool_name: '內容生成工具',
          tool_description: '基於教學活動範本和學生成長情況生成個性化內容',
          tool_type: 'content_generation',
          is_active: true,
          current_users: 3,
          queue_length: 2,
          avg_wait_time: 45,
          status: 'available'
        },
        {
          id: 'lesson-analysis',
          tool_name: '課程分析工具',
          tool_description: '分析學生學習進度和課程效果',
          tool_type: 'analysis',
          is_active: true,
          current_users: 1,
          queue_length: 0,
          avg_wait_time: 30,
          status: 'available'
        },
        {
          id: 'schedule-optimizer',
          tool_name: '排程優化工具',
          tool_description: '智能優化課程排程和教師分配',
          tool_type: 'automation',
          is_active: false,
          current_users: 0,
          queue_length: 0,
          avg_wait_time: 0,
          status: 'maintenance'
        }
      ];

      setTools(mockTools);

      // 載入統計資料
      const mockStats = {
        total_tools: mockTools.length,
        active_tools: mockTools.filter(t => t.is_active).length,
        total_users: mockTools.reduce((sum, t) => sum + t.current_users, 0),
        total_queue: mockTools.reduce((sum, t) => sum + t.queue_length, 0),
        avg_wait_time: Math.round(mockTools.reduce((sum, t) => sum + t.avg_wait_time, 0) / mockTools.length)
      };

      setStats(mockStats);
    } catch (error) {
      console.error('載入AI工具失敗:', error);
      toast.error('載入AI工具失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAITools();
  }, []);

  // 處理工具點擊
  const handleToolClick = (toolId: string) => {
    router.push(`/admin/ai-tools/${toolId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF9F2] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FCD58B] mx-auto mb-4"></div>
          <p className="text-[#2B3A3B]">載入AI工具中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF9F2] font-['Quicksand',_sans-serif] px-6 py-8">
      <div className="max-w-7xl mx-auto">
        {/* 頁面標題 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#2B3A3B] mb-2">AI 工具中心</h1>
          <p className="text-[#4B4036]">管理和使用各種AI工具，提升教學效率</p>
        </div>

        {/* AI工具狀態面板 */}
        <div className="mb-8">
          <AIToolsStatusPanel />
        </div>

        {/* AI工具儀表板 */}
        <AIToolsDashboard 
          tools={tools}
          stats={stats}
          onToolClick={handleToolClick}
          onRefresh={loadAITools}
        />
      </div>
    </div>
  );
} 