'use client';

import { useState } from 'react';
import { HanamiCard } from '@/components/ui/HanamiCard';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { 
  CircleStackIcon as DatabaseIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  WrenchScrewdriverIcon,
  PlayIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';

export default function DatabaseSetupPage() {
  const [setupResult, setSetupResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const completeDatabaseSchema = `-- HanamiEcho SAAS 完整數據庫架構
-- 請在 Supabase SQL Editor 中執行此腳本

-- 1. 創建 saas_users 表
CREATE TABLE IF NOT EXISTS public.saas_users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  subscription_status TEXT DEFAULT 'free' CHECK (subscription_status = ANY (ARRAY['free'::text, 'trial'::text, 'active'::text, 'cancelled'::text, 'expired'::text])),
  subscription_plan_id UUID,
  subscription_start_date TIMESTAMP WITH TIME ZONE,
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER DEFAULT 0,
  usage_limit INTEGER DEFAULT 10,
  is_verified BOOLEAN DEFAULT false,
  verification_method TEXT CHECK (verification_method = ANY (ARRAY['email'::text, 'phone'::text, 'both'::text])),
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 創建訂閱計劃表
CREATE TABLE IF NOT EXISTS public.saas_subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  plan_name TEXT NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type = ANY (ARRAY['free'::text, 'basic'::text, 'premium'::text, 'professional'::text])),
  price_monthly NUMERIC,
  price_yearly NUMERIC,
  usage_limit INTEGER NOT NULL,
  features JSONB NOT NULL,
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  hk_payment_plan_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT saas_subscription_plans_pkey PRIMARY KEY (id)
);

-- 3. 創建用戶訂閱表
CREATE TABLE IF NOT EXISTS public.saas_user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID,
  plan_id UUID,
  status TEXT NOT NULL CHECK (status = ANY (ARRAY['active'::text, 'cancelled'::text, 'expired'::text, 'pending'::text])),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  payment_method TEXT,
  stripe_subscription_id TEXT,
  hk_payment_id TEXT,
  invoice_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle = ANY (ARRAY['monthly'::text, 'yearly'::text])),
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + '1 mon'::interval),
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  stripe_customer_id TEXT,
  payment_method_id TEXT,
  usage_stats JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT saas_user_subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT saas_user_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.saas_users(id),
  CONSTRAINT saas_user_subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.saas_subscription_plans(id)
);

-- 4. 創建 3D 角色表
CREATE TABLE IF NOT EXISTS public.saas_3d_characters (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  character_name TEXT NOT NULL,
  character_type TEXT NOT NULL CHECK (character_type = ANY (ARRAY['teacher'::text, 'friend'::text, 'mentor'::text, 'custom'::text])),
  model_url TEXT NOT NULL,
  avatar_url TEXT,
  personality_config JSONB NOT NULL,
  voice_config JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT saas_3d_characters_pkey PRIMARY KEY (id)
);

-- 5. 創建角色互動表
CREATE TABLE IF NOT EXISTS public.saas_character_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID,
  character_id UUID,
  interaction_type TEXT NOT NULL CHECK (interaction_type = ANY (ARRAY['chat'::text, 'lesson'::text, 'game'::text, 'assessment'::text, 'story'::text, 'task'::text])),
  message_content TEXT,
  response_content TEXT,
  session_id TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT saas_character_interactions_pkey PRIMARY KEY (id),
  CONSTRAINT saas_character_interactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.saas_users(id),
  CONSTRAINT saas_character_interactions_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.saas_3d_characters(id)
);

-- 6. 創建個人記憶表
CREATE TABLE IF NOT EXISTS public.saas_personal_memories (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID,
  child_student_id UUID,
  memory_type TEXT NOT NULL CHECK (memory_type = ANY (ARRAY['personal_info'::text, 'learning_progress'::text, 'emotional_state'::text, 'preferences'::text, 'achievements'::text, 'challenges'::text, 'milestones'::text])),
  memory_content JSONB NOT NULL,
  memory_tags TEXT[],
  importance_level INTEGER DEFAULT 1 CHECK (importance_level >= 1 AND importance_level <= 5),
  last_accessed TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT saas_personal_memories_pkey PRIMARY KEY (id),
  CONSTRAINT saas_personal_memories_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.saas_users(id)
);

-- 7. 創建情感狀態表
CREATE TABLE IF NOT EXISTS public.saas_emotional_states (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID,
  child_student_id UUID,
  emotional_state TEXT NOT NULL CHECK (emotional_state = ANY (ARRAY['happy'::text, 'sad'::text, 'angry'::text, 'anxious'::text, 'excited'::text, 'frustrated'::text, 'proud'::text, 'confused'::text, 'motivated'::text, 'tired'::text])),
  intensity_level INTEGER CHECK (intensity_level >= 1 AND intensity_level <= 10),
  context TEXT,
  trigger_event TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT saas_emotional_states_pkey PRIMARY KEY (id),
  CONSTRAINT saas_emotional_states_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.saas_users(id)
);

-- 8. 創建故事庫表
CREATE TABLE IF NOT EXISTS public.saas_story_library (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  story_title TEXT NOT NULL,
  story_content TEXT NOT NULL,
  story_type TEXT NOT NULL CHECK (story_type = ANY (ARRAY['educational'::text, 'moral'::text, 'adventure'::text, 'fantasy'::text, 'realistic'::text, 'custom'::text])),
  target_age_min INTEGER,
  target_age_max INTEGER,
  learning_objectives TEXT[],
  emotional_themes TEXT[],
  story_tags TEXT[],
  is_ai_generated BOOLEAN DEFAULT false,
  created_by UUID,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT saas_story_library_pkey PRIMARY KEY (id),
  CONSTRAINT saas_story_library_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.saas_users(id)
);

-- 9. 創建任務定義表
CREATE TABLE IF NOT EXISTS public.saas_task_definitions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  task_name TEXT NOT NULL,
  task_description TEXT NOT NULL,
  task_type TEXT NOT NULL CHECK (task_type = ANY (ARRAY['learning'::text, 'behavioral'::text, 'creative'::text, 'social'::text, 'emotional'::text, 'custom'::text])),
  difficulty_level INTEGER CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  estimated_duration INTEGER,
  required_abilities TEXT[],
  success_criteria JSONB,
  rewards JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT saas_task_definitions_pkey PRIMARY KEY (id)
);

-- 10. 創建使用記錄表
CREATE TABLE IF NOT EXISTS public.saas_usage_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID,
  action_type TEXT NOT NULL CHECK (action_type = ANY (ARRAY['ai_chat'::text, 'learning_path'::text, '3d_character'::text, 'lesson_plan'::text, 'storytelling'::text, 'task_completion'::text])),
  usage_count INTEGER DEFAULT 1,
  session_duration INTEGER,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT saas_usage_logs_pkey PRIMARY KEY (id),
  CONSTRAINT saas_usage_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.saas_users(id)
);

-- 11. 創建支付表
CREATE TABLE IF NOT EXISTS public.saas_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID,
  subscription_id UUID,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'HKD'::text,
  payment_method TEXT NOT NULL CHECK (payment_method = ANY (ARRAY['stripe'::text, 'hk_payment'::text])),
  payment_status TEXT NOT NULL CHECK (payment_status = ANY (ARRAY['pending'::text, 'succeeded'::text, 'failed'::text, 'cancelled'::text])),
  external_payment_id TEXT,
  invoice_number TEXT,
  invoice_url TEXT,
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT saas_payments_pkey PRIMARY KEY (id),
  CONSTRAINT saas_payments_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.saas_user_subscriptions(id),
  CONSTRAINT saas_payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.saas_users(id)
);

-- 12. 創建優惠券表
CREATE TABLE IF NOT EXISTS public.saas_coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  coupon_code TEXT NOT NULL UNIQUE,
  coupon_name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type = ANY (ARRAY['percentage'::text, 'fixed_amount'::text])),
  discount_value NUMERIC NOT NULL,
  applicable_plans UUID[] DEFAULT '{}'::uuid[],
  min_amount NUMERIC DEFAULT 0,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  usage_limit_per_user INTEGER DEFAULT 1,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT saas_coupons_pkey PRIMARY KEY (id)
);

-- 啟用 RLS (Row Level Security)
ALTER TABLE public.saas_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_character_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_personal_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_emotional_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_payments ENABLE ROW LEVEL SECURITY;

-- 創建 RLS 策略
-- saas_users 表策略
DROP POLICY IF EXISTS "Users can view own profile" ON public.saas_users;
CREATE POLICY "Users can view own profile" ON public.saas_users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.saas_users;
CREATE POLICY "Users can update own profile" ON public.saas_users
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.saas_users;
CREATE POLICY "Users can insert own profile" ON public.saas_users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- saas_user_subscriptions 表策略
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.saas_user_subscriptions;
CREATE POLICY "Users can view own subscriptions" ON public.saas_user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- saas_character_interactions 表策略
DROP POLICY IF EXISTS "Users can view own interactions" ON public.saas_character_interactions;
CREATE POLICY "Users can view own interactions" ON public.saas_character_interactions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own interactions" ON public.saas_character_interactions;
CREATE POLICY "Users can insert own interactions" ON public.saas_character_interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- saas_personal_memories 表策略
DROP POLICY IF EXISTS "Users can view own memories" ON public.saas_personal_memories;
CREATE POLICY "Users can view own memories" ON public.saas_personal_memories
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own memories" ON public.saas_personal_memories;
CREATE POLICY "Users can insert own memories" ON public.saas_personal_memories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own memories" ON public.saas_personal_memories;
CREATE POLICY "Users can update own memories" ON public.saas_personal_memories
  FOR UPDATE USING (auth.uid() = user_id);

-- saas_emotional_states 表策略
DROP POLICY IF EXISTS "Users can view own emotional states" ON public.saas_emotional_states;
CREATE POLICY "Users can view own emotional states" ON public.saas_emotional_states
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own emotional states" ON public.saas_emotional_states;
CREATE POLICY "Users can insert own emotional states" ON public.saas_emotional_states
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- saas_usage_logs 表策略
DROP POLICY IF EXISTS "Users can view own usage logs" ON public.saas_usage_logs;
CREATE POLICY "Users can view own usage logs" ON public.saas_usage_logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own usage logs" ON public.saas_usage_logs;
CREATE POLICY "Users can insert own usage logs" ON public.saas_usage_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- saas_payments 表策略
DROP POLICY IF EXISTS "Users can view own payments" ON public.saas_payments;
CREATE POLICY "Users can view own payments" ON public.saas_payments
  FOR SELECT USING (auth.uid() = user_id);

-- 插入默認訂閱計劃
INSERT INTO public.saas_subscription_plans (plan_name, plan_type, price_monthly, price_yearly, usage_limit, features) VALUES
('免費計劃', 'free', 0, 0, 10, '{"ai_chat": 10, "storytelling": 5, "memory_entries": 20}'),
('基礎計劃', 'basic', 99, 990, 100, '{"ai_chat": 100, "storytelling": 50, "memory_entries": 200, "3d_characters": 2}'),
('高級計劃', 'premium', 199, 1990, 500, '{"ai_chat": 500, "storytelling": 200, "memory_entries": 1000, "3d_characters": 5, "custom_stories": true}'),
('專業計劃', 'professional', 399, 3990, 2000, '{"ai_chat": 2000, "storytelling": 1000, "memory_entries": 5000, "3d_characters": 10, "custom_stories": true, "api_access": true}')
ON CONFLICT DO NOTHING;

-- 插入默認 3D 角色
INSERT INTO public.saas_3d_characters (character_name, character_type, model_url, personality_config) VALUES
('小櫻老師', 'teacher', '/models/sakura-teacher.glb', '{"personality": "溫柔耐心", "teaching_style": "互動式", "specialties": ["音樂", "藝術"]}'),
('阿樂朋友', 'friend', '/models/ale-friend.glb', '{"personality": "活潑開朗", "interests": ["遊戲", "運動"], "age_range": "6-12"}'),
('智慧導師', 'mentor', '/models/wise-mentor.glb', '{"personality": "睿智沉穩", "expertise": ["學習指導", "情感支持"], "approach": "引導式"}')
ON CONFLICT DO NOTHING;

-- 創建更新時間觸發器函數
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 為需要更新時間的表創建觸發器
CREATE TRIGGER update_saas_users_updated_at BEFORE UPDATE ON public.saas_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_saas_personal_memories_updated_at BEFORE UPDATE ON public.saas_personal_memories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_saas_coupons_updated_at BEFORE UPDATE ON public.saas_coupons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 完成設置
SELECT 'HanamiEcho SAAS 數據庫架構設置完成！' as message;`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(completeDatabaseSchema);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const runSetup = async () => {
    setLoading(true);
    setSetupResult(null);
    
    try {
      // 模擬設置過程
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSetupResult({
        success: true,
        message: '數據庫架構設置完成！',
        details: '所有表已創建，RLS 策略已配置，默認數據已插入'
      });
    } catch (error) {
      setSetupResult({
        success: false,
        error: '設置過程中發生錯誤',
        details: error
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#4B4036] mb-4">
            HanamiEcho SAAS 數據庫設置
          </h1>
          <p className="text-lg text-[#2B3A3B]">
            完整的 AI 學習平台數據庫架構
          </p>
        </div>

        <div className="space-y-6">
          {/* 架構概述 */}
          <HanamiCard className="p-6">
            <div className="flex items-start space-x-4">
              <DatabaseIcon className="h-8 w-8 text-blue-500 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-[#4B4036] mb-4">
                  數據庫架構概述
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="font-semibold text-[#2B3A3B]">核心功能表</h3>
                    <ul className="space-y-1 text-sm text-[#2B3A3B]">
                      <li>• saas_users - 用戶管理</li>
                      <li>• saas_3d_characters - 3D 角色</li>
                      <li>• saas_character_interactions - 角色互動</li>
                      <li>• saas_personal_memories - 個人記憶</li>
                      <li>• saas_emotional_states - 情感狀態</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h3 className="font-semibold text-[#2B3A3B]">商業功能表</h3>
                    <ul className="space-y-1 text-sm text-[#2B3A3B]">
                      <li>• saas_subscription_plans - 訂閱計劃</li>
                      <li>• saas_user_subscriptions - 用戶訂閱</li>
                      <li>• saas_payments - 支付記錄</li>
                      <li>• saas_coupons - 優惠券</li>
                      <li>• saas_usage_logs - 使用記錄</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </HanamiCard>

          {/* 設置工具 */}
          <HanamiCard className="p-6">
            <div className="flex items-start space-x-4">
              <WrenchScrewdriverIcon className="h-8 w-8 text-purple-500 flex-shrink-0 mt-1" />
              <div className="w-full">
                <h2 className="text-2xl font-bold text-[#4B4036] mb-4">
                  數據庫設置工具
                </h2>
                
                <div className="space-y-4">
                  <div className="flex space-x-4">
                    <HanamiButton
                      onClick={runSetup}
                      loading={loading}
                      size="lg"
                      className="flex-1"
                    >
                      <PlayIcon className="h-5 w-5 mr-2" />
                      模擬設置過程
                    </HanamiButton>
                    
                    <HanamiButton
                      onClick={copyToClipboard}
                      size="lg"
                      variant="secondary"
                      className="flex-1"
                    >
                      {copied ? (
                        <>
                          <CheckCircleIcon className="h-5 w-5 mr-2" />
                          已複製
                        </>
                      ) : (
                        <>
                          <ClipboardDocumentIcon className="h-5 w-5 mr-2" />
                          複製 SQL
                        </>
                      )}
                    </HanamiButton>
                  </div>

                  {setupResult && (
                    <div className={`border rounded-lg p-4 ${
                      setupResult.success 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center space-x-2 mb-2">
                        {setupResult.success ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        ) : (
                          <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                        )}
                        <h3 className={`font-semibold ${
                          setupResult.success ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {setupResult.success ? '設置完成' : '設置失敗'}
                        </h3>
                      </div>
                      
                      <p className={`text-sm ${
                        setupResult.success ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {setupResult.message || setupResult.error}
                      </p>
                      
                      {setupResult.details && (
                        <p className={`text-xs mt-2 ${
                          setupResult.success ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {setupResult.details}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </HanamiCard>

          {/* SQL 代碼 */}
          <HanamiCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-[#4B4036]">
                完整 SQL 設置腳本
              </h2>
              <HanamiButton
                onClick={copyToClipboard}
                size="sm"
                variant="secondary"
              >
                {copied ? (
                  <>
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    已複製
                  </>
                ) : (
                  <>
                    <ClipboardDocumentIcon className="h-4 w-4 mr-1" />
                    複製
                  </>
                )}
              </HanamiButton>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <pre className="text-xs text-gray-700 bg-white p-3 rounded border overflow-x-auto max-h-96 whitespace-pre-wrap">
                {completeDatabaseSchema}
              </pre>
            </div>
          </HanamiCard>

          {/* 設置步驟 */}
          <HanamiCard className="p-6">
            <h2 className="text-2xl font-bold text-[#4B4036] mb-4">
              設置步驟
            </h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <span className="bg-[#FFD59A] text-[#4B4036] rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">1</span>
                <div>
                  <h3 className="font-semibold text-[#4B4036]">複製 SQL 腳本</h3>
                  <p className="text-sm text-[#2B3A3B]">點擊「複製 SQL」按鈕複製完整的數據庫設置腳本</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <span className="bg-[#FFD59A] text-[#4B4036] rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">2</span>
                <div>
                  <h3 className="font-semibold text-[#4B4036]">前往 Supabase 控制台</h3>
                  <p className="text-sm text-[#2B3A3B]">登入 Supabase 控制台，選擇您的項目</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <span className="bg-[#FFD59A] text-[#4B4036] rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">3</span>
                <div>
                  <h3 className="font-semibold text-[#4B4036]">執行 SQL 腳本</h3>
                  <p className="text-sm text-[#2B3A3B]">在 SQL Editor 中粘貼腳本並執行</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <span className="bg-[#FFD59A] text-[#4B4036] rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">4</span>
                <div>
                  <h3 className="font-semibold text-[#4B4036]">驗證設置</h3>
                  <p className="text-sm text-[#2B3A3B]">檢查所有表是否創建成功，RLS 策略是否生效</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <span className="bg-[#FFD59A] text-[#4B4036] rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">5</span>
                <div>
                  <h3 className="font-semibold text-[#4B4036]">測試功能</h3>
                  <p className="text-sm text-[#2B3A3B]">返回應用程序測試註冊、登入等功能</p>
                </div>
              </div>
            </div>
          </HanamiCard>
        </div>

        <div className="text-center mt-8 space-x-4">
          <HanamiButton
            onClick={() => window.location.href = '/aihome/database-diagnostic'}
            size="lg"
            variant="secondary"
          >
            診斷工具
          </HanamiButton>
          <HanamiButton
            onClick={() => window.location.href = '/aihome/dashboard'}
            size="lg"
          >
            返回儀表板
          </HanamiButton>
        </div>
      </div>
    </div>
  );
}

