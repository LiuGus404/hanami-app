-- 創建 AI 訊息範本表
CREATE TABLE IF NOT EXISTS public.hanami_ai_message_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  template_content TEXT NOT NULL,
  template_type TEXT NOT NULL DEFAULT 'general' CHECK (template_type IN ('general', 'reminder', 'welcome', 'progress', 'custom')),
  variables TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT hanami_ai_message_templates_pkey PRIMARY KEY (id)
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_hanami_ai_message_templates_active ON public.hanami_ai_message_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_hanami_ai_message_templates_type ON public.hanami_ai_message_templates(template_type);

-- 創建更新時間觸發器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_hanami_ai_message_templates_updated_at
  BEFORE UPDATE ON public.hanami_ai_message_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 插入一些預設範本
INSERT INTO public.hanami_ai_message_templates (template_name, template_content, template_type, variables) VALUES
(
  '歡迎訊息',
  '親愛的 {full_name} 家長您好！\n\n歡迎加入 Hanami 音樂教育！我們很高興能為您的孩子提供優質的音樂教育服務。\n\n上課時間：{regular_timeslot}\n上課地點：Hanami 音樂教室\n\n如有任何問題，請隨時與我們聯繫。\n\nHanami 音樂教育團隊',
  'welcome',
  ARRAY['full_name', 'regular_timeslot']
),
(
  '課程提醒',
  '親愛的 {full_name} 家長您好！\n\n提醒您，明天 {regular_timeslot} 有音樂課程。\n\n請記得帶上：\n- 樂器\n- 課本\n- 筆記本\n\n期待見到您！\n\nHanami 音樂教育',
  'reminder',
  ARRAY['full_name', 'regular_timeslot']
),
(
  '進度報告',
  '親愛的 {full_name} 家長您好！\n\n以下是 {full_name} 的學習進度報告：\n\n✅ 已完成課程：{ongoing_lessons} 堂\n📚 剩餘課程：{remaining_lessons} 堂\n🎯 學習重點：{course_type}\n\n{full_name} 在課堂上表現優秀，請繼續保持！\n\n如有任何問題，請隨時與我們聯繫。\n\nHanami 音樂教育',
  'progress',
  ARRAY['full_name', 'ongoing_lessons', 'remaining_lessons', 'course_type']
),
(
  '一般通知',
  '親愛的 {full_name} 家長您好！\n\n{custom_message}\n\n如有任何問題，請隨時與我們聯繫。\n\nHanami 音樂教育',
  'general',
  ARRAY['full_name', 'custom_message']
);

-- 創建 AI 訊息日誌表（用於記錄發送歷史）
CREATE TABLE IF NOT EXISTS public.hanami_ai_message_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  student_name TEXT NOT NULL,
  student_phone TEXT,
  template_id UUID REFERENCES public.hanami_ai_message_templates(id),
  template_name TEXT NOT NULL,
  message_content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT hanami_ai_message_logs_pkey PRIMARY KEY (id)
);

-- 創建日誌表索引
CREATE INDEX IF NOT EXISTS idx_hanami_ai_message_logs_student ON public.hanami_ai_message_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_hanami_ai_message_logs_status ON public.hanami_ai_message_logs(status);
CREATE INDEX IF NOT EXISTS idx_hanami_ai_message_logs_created ON public.hanami_ai_message_logs(created_at); 