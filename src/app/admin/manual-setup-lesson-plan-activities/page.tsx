'use client';

import { useState } from 'react';
import { HanamiButton } from '@/components/ui/HanamiButton';

export default function ManualSetupLessonPlanActivitiesPage() {
  const [copied, setCopied] = useState(false);

  const sqlScript = `-- 創建班別活動分配表
CREATE TABLE IF NOT EXISTS hanami_lesson_plan_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_date DATE NOT NULL,
  timeslot TEXT NOT NULL,
  course_type TEXT NOT NULL,
  activity_id UUID NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('class_activity', 'individual_activity')),
  student_id UUID,
  assigned_by TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 創建索引以提高查詢性能
CREATE INDEX IF NOT EXISTS idx_lesson_plan_activities_lesson_date ON hanami_lesson_plan_activities(lesson_date);
CREATE INDEX IF NOT EXISTS idx_lesson_plan_activities_timeslot ON hanami_lesson_plan_activities(timeslot);
CREATE INDEX IF NOT EXISTS idx_lesson_plan_activities_course_type ON hanami_lesson_plan_activities(course_type);
CREATE INDEX IF NOT EXISTS idx_lesson_plan_activities_activity_type ON hanami_lesson_plan_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_lesson_plan_activities_student_id ON hanami_lesson_plan_activities(student_id);
CREATE INDEX IF NOT EXISTS idx_lesson_plan_activities_lesson_timeslot_course ON hanami_lesson_plan_activities(lesson_date, timeslot, course_type);

-- 創建唯一約束，防止重複分配
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_class_activity ON hanami_lesson_plan_activities(lesson_date, timeslot, course_type, activity_id) 
WHERE activity_type = 'class_activity';

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_individual_activity ON hanami_lesson_plan_activities(lesson_date, timeslot, course_type, activity_id, student_id) 
WHERE activity_type = 'individual_activity';

-- 創建更新時間戳的觸發器
CREATE OR REPLACE FUNCTION update_lesson_plan_activities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 先刪除觸發器（如果存在）
DROP TRIGGER IF EXISTS trigger_update_lesson_plan_activities_updated_at ON hanami_lesson_plan_activities;

-- 創建觸發器
CREATE TRIGGER trigger_update_lesson_plan_activities_updated_at
  BEFORE UPDATE ON hanami_lesson_plan_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_lesson_plan_activities_updated_at();

-- 關閉 RLS（目前採用應用層權限控管）
ALTER TABLE hanami_lesson_plan_activities DISABLE ROW LEVEL SECURITY;`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sqlScript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-[#4B4036]">
          手動設置班別活動分配表
        </h1>

        <div className="bg-[#FFFDF8] border border-[#EADBC8] rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-[#4B4036]">
            設置步驟
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-[#2B3A3B]">
            <li>登入 Supabase Dashboard</li>
            <li>進入您的專案</li>
            <li>點擊左側選單的 "SQL Editor"</li>
            <li>點擊 "New query" 創建新的查詢</li>
            <li>複製下方的 SQL 腳本並貼上</li>
            <li>點擊 "Run" 執行腳本</li>
            <li>完成後返回此頁面測試功能</li>
          </ol>
        </div>

        <div className="bg-[#FFFDF8] border border-[#EADBC8] rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-[#4B4036]">SQL 腳本</h3>
            <HanamiButton
              onClick={copyToClipboard}
              className="bg-[#EBC9A4] hover:bg-[#DDBA90] text-[#4B4036]"
            >
              {copied ? '已複製！' : '複製腳本'}
            </HanamiButton>
          </div>
          <pre className="bg-[#F3F0E5] p-4 rounded-lg text-sm text-[#2B3A3B] overflow-x-auto whitespace-pre-wrap">
            {sqlScript}
          </pre>
        </div>

        <div className="bg-[#FFFDF8] border border-[#EADBC8] rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 text-[#4B4036]">
            測試功能
          </h3>
          <p className="text-sm text-[#2B3A3B] mb-4">
            執行完 SQL 腳本後，您可以：
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-[#2B3A3B]">
            <li>前往 <code className="bg-[#F3F0E5] px-1 rounded">/admin/test-lesson-plan-activities</code> 測試 API</li>
            <li>在教案編輯器中選擇班別活動</li>
            <li>查看活動是否正確保存到特定時段</li>
          </ul>
        </div>

        <div className="flex gap-4">
          <HanamiButton
            onClick={() => window.open('/admin/test-lesson-plan-activities', '_blank')}
            className="bg-[#EBC9A4] hover:bg-[#DDBA90] text-[#4B4036]"
          >
            測試 API
          </HanamiButton>
          <HanamiButton
            onClick={() => window.history.back()}
            className="bg-white border border-[#EADBC8] text-[#4B4036] hover:bg-[#F3F0E5]"
          >
            返回
          </HanamiButton>
        </div>
      </div>
    </div>
  );
} 
 
 
 