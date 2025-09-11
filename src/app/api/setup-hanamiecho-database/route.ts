import { NextRequest, NextResponse } from 'next/server';
import { createSaasAdminClient } from '@/lib/supabase-saas';

export async function POST(request: NextRequest) {
  try {
    const supabase = createSaasAdminClient();

    // 執行 HanamiEcho 資料庫遷移
    const migrationSQL = `
      -- ==============================================
      -- HanamiEcho 資料庫遷移腳本
      -- 版本: 1.0.0
      -- 日期: 2024-12-19
      -- ==============================================

      -- 開始事務
      BEGIN;

      -- 1. 擴展 saas_users 表 (只新增 HanamiEcho 需要的欄位)
      ALTER TABLE saas_users ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'adult' CHECK (user_type IN ('child', 'adult'));
      ALTER TABLE saas_users ADD COLUMN IF NOT EXISTS age_group TEXT;
      ALTER TABLE saas_users ADD COLUMN IF NOT EXISTS preferences JSONB;
      ALTER TABLE saas_users ADD COLUMN IF NOT EXISTS family_group_id UUID;
      ALTER TABLE saas_users ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Hong_Kong';
      ALTER TABLE saas_users ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'zh-TW';
      ALTER TABLE saas_users ADD COLUMN IF NOT EXISTS notification_settings JSONB;
      ALTER TABLE saas_users ADD COLUMN IF NOT EXISTS privacy_settings JSONB;

      -- 2. 創建 AI 角色系統表
      CREATE TABLE IF NOT EXISTS hanami_ai_characters (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('child_companion', 'adult_assistant', 'family_coordinator', 'learning_tutor', 'work_assistant')),
        target_audience TEXT NOT NULL CHECK (target_audience IN ('children', 'adults', 'family', 'all')),
        personality_config JSONB NOT NULL,
        appearance_config JSONB NOT NULL,
        capabilities JSONB NOT NULL,
        workspace_config JSONB NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_by UUID REFERENCES saas_users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS hanami_user_ai_characters (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES saas_users(id) ON DELETE CASCADE,
        character_id UUID REFERENCES hanami_ai_characters(id) ON DELETE CASCADE,
        is_primary BOOLEAN DEFAULT false,
        customization JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, character_id)
      );

      -- 3. 創建學習中心系統表
      CREATE TABLE IF NOT EXISTS hanami_learning_paths (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT,
        target_audience TEXT NOT NULL CHECK (target_audience IN ('children', 'adults', 'family')),
        category TEXT NOT NULL CHECK (category IN ('academic', 'skill', 'hobby', 'professional', 'life_skill')),
        difficulty_level TEXT NOT NULL CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
        estimated_duration INTEGER,
        learning_objectives JSONB,
        modules JSONB NOT NULL,
        ai_character_support JSONB,
        is_active BOOLEAN DEFAULT true,
        created_by UUID REFERENCES saas_users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS hanami_learning_progress (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES saas_users(id) ON DELETE CASCADE,
        learning_path_id UUID REFERENCES hanami_learning_paths(id) ON DELETE CASCADE,
        module_id TEXT NOT NULL,
        progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
        completed_at TIMESTAMP WITH TIME ZONE,
        ai_character_guidance JSONB,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, learning_path_id, module_id)
      );

      -- 4. 創建工作助手系統表
      CREATE TABLE IF NOT EXISTS hanami_work_tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES saas_users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL CHECK (category IN ('productivity', 'communication', 'analysis', 'automation', 'collaboration')),
        priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
        status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
        assigned_ai_character UUID REFERENCES hanami_ai_characters(id),
        due_date TIMESTAMP WITH TIME ZONE,
        estimated_duration INTEGER,
        actual_duration INTEGER,
        dependencies JSONB,
        automation_rules JSONB,
        tags TEXT[],
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS hanami_work_projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES saas_users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL CHECK (status IN ('planning', 'active', 'completed', 'cancelled')),
        start_date TIMESTAMP WITH TIME ZONE,
        end_date TIMESTAMP WITH TIME ZONE,
        progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
        team_members JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- 5. 創建記憶庫系統表
      CREATE TABLE IF NOT EXISTS hanami_memory_bank (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES saas_users(id) ON DELETE CASCADE,
        memory_type TEXT NOT NULL CHECK (memory_type IN ('personal', 'family', 'learning', 'work', 'emotional', 'achievement')),
        content JSONB NOT NULL,
        participants JSONB,
        privacy_level TEXT DEFAULT 'private' CHECK (privacy_level IN ('private', 'family', 'shared')),
        ai_character_contributions JSONB,
        tags TEXT[],
        importance_level TEXT DEFAULT 'medium' CHECK (importance_level IN ('low', 'medium', 'high')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS hanami_memory_tags (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        color TEXT DEFAULT '#3B82F6',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- 6. 創建家庭協作系統表
      CREATE TABLE IF NOT EXISTS hanami_family_groups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT,
        members JSONB NOT NULL,
        shared_resources JSONB,
        privacy_settings JSONB,
        communication_preferences JSONB,
        created_by UUID REFERENCES saas_users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS hanami_family_activities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        family_group_id UUID REFERENCES hanami_family_groups(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        activity_type TEXT NOT NULL CHECK (activity_type IN ('learning', 'work', 'recreation', 'celebration')),
        scheduled_date TIMESTAMP WITH TIME ZONE,
        participants JSONB,
        status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
        created_by UUID REFERENCES saas_users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- 7. 創建訂閱與支付系統表
      CREATE TABLE IF NOT EXISTS hanami_subscription_plans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('free', 'basic', 'premium', 'family')),
        price_monthly NUMERIC NOT NULL,
        price_yearly NUMERIC NOT NULL,
        currency TEXT DEFAULT 'HKD',
        features JSONB NOT NULL,
        limits JSONB NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS hanami_user_subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES saas_users(id) ON DELETE CASCADE,
        plan_id UUID REFERENCES hanami_subscription_plans(id),
        status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
        current_period_start TIMESTAMP WITH TIME ZONE,
        current_period_end TIMESTAMP WITH TIME ZONE,
        stripe_subscription_id TEXT,
        stripe_customer_id TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- 8. 創建互動與分析表
      CREATE TABLE IF NOT EXISTS hanami_character_interactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        character_id UUID REFERENCES hanami_ai_characters(id) ON DELETE CASCADE,
        user_id UUID REFERENCES saas_users(id) ON DELETE CASCADE,
        interaction_type TEXT NOT NULL CHECK (interaction_type IN ('conversation', 'learning', 'work', 'emotional_support', 'task_assistance')),
        content JSONB NOT NULL,
        context JSONB,
        sentiment_score NUMERIC,
        satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS hanami_user_analytics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES saas_users(id) ON DELETE CASCADE,
        event_type TEXT NOT NULL,
        event_data JSONB,
        session_id TEXT,
        ip_address INET,
        user_agent TEXT,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- 9. 創建索引
      CREATE INDEX IF NOT EXISTS idx_saas_users_email ON saas_users(email);
      CREATE INDEX IF NOT EXISTS idx_saas_users_user_type ON saas_users(user_type);
      CREATE INDEX IF NOT EXISTS idx_saas_users_family_group ON saas_users(family_group_id);
      CREATE INDEX IF NOT EXISTS idx_ai_characters_type ON hanami_ai_characters(type);
      CREATE INDEX IF NOT EXISTS idx_ai_characters_target_audience ON hanami_ai_characters(target_audience);
      CREATE INDEX IF NOT EXISTS idx_learning_paths_target_audience ON hanami_learning_paths(target_audience);
      CREATE INDEX IF NOT EXISTS idx_learning_paths_category ON hanami_learning_paths(category);
      CREATE INDEX IF NOT EXISTS idx_work_tasks_user_id ON hanami_work_tasks(user_id);
      CREATE INDEX IF NOT EXISTS idx_work_tasks_status ON hanami_work_tasks(status);
      CREATE INDEX IF NOT EXISTS idx_work_tasks_priority ON hanami_work_tasks(priority);
      CREATE INDEX IF NOT EXISTS idx_memory_bank_user_id ON hanami_memory_bank(user_id);
      CREATE INDEX IF NOT EXISTS idx_memory_bank_type ON hanami_memory_bank(memory_type);
      CREATE INDEX IF NOT EXISTS idx_character_interactions_user_id ON hanami_character_interactions(user_id);
      CREATE INDEX IF NOT EXISTS idx_character_interactions_character_id ON hanami_character_interactions(character_id);
      CREATE INDEX IF NOT EXISTS idx_learning_progress_user_id ON hanami_learning_progress(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id ON hanami_user_analytics(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_analytics_event_type ON hanami_user_analytics(event_type);

      -- 10. 創建觸發器
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql';

      -- 為所有需要 updated_at 的表創建觸發器
      CREATE TRIGGER update_saas_users_updated_at BEFORE UPDATE ON saas_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      CREATE TRIGGER update_ai_characters_updated_at BEFORE UPDATE ON hanami_ai_characters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      CREATE TRIGGER update_learning_paths_updated_at BEFORE UPDATE ON hanami_learning_paths FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      CREATE TRIGGER update_learning_progress_updated_at BEFORE UPDATE ON hanami_learning_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      CREATE TRIGGER update_work_tasks_updated_at BEFORE UPDATE ON hanami_work_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      CREATE TRIGGER update_work_projects_updated_at BEFORE UPDATE ON hanami_work_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      CREATE TRIGGER update_family_groups_updated_at BEFORE UPDATE ON hanami_family_groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      CREATE TRIGGER update_family_activities_updated_at BEFORE UPDATE ON hanami_family_activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON hanami_subscription_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON hanami_user_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      -- 提交事務
      COMMIT;
    `;

    // 執行遷移
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.error('資料庫遷移失敗:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: '資料庫遷移失敗',
          details: error.message 
        },
        { status: 500 }
      );
    }

    // 插入預設數據
    await insertDefaultData(supabase);

    return NextResponse.json({
      success: true,
      message: 'HanamiEcho 資料庫架構設置完成',
      data: {
        tables_created: [
          'hanami_ai_characters',
          'hanami_user_ai_characters',
          'hanami_learning_paths',
          'hanami_learning_progress',
          'hanami_work_tasks',
          'hanami_work_projects',
          'hanami_memory_bank',
          'hanami_memory_tags',
          'hanami_family_groups',
          'hanami_family_activities',
          'hanami_subscription_plans',
          'hanami_user_subscriptions',
          'hanami_character_interactions',
          'hanami_user_analytics'
        ],
        columns_added: [
          'user_type',
          'age_group',
          'preferences',
          'family_group_id',
          'timezone',
          'language',
          'notification_settings',
          'privacy_settings'
        ]
      }
    });

  } catch (error: any) {
    console.error('設置 HanamiEcho 資料庫時發生錯誤:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '設置資料庫時發生錯誤',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

async function insertDefaultData(supabase: any) {
  try {
    // 插入預設訂閱方案
    const defaultPlans = [
      {
        name: '免費方案',
        type: 'free',
        price_monthly: 0,
        price_yearly: 0,
        features: {
          ai_characters: 1,
          learning_paths: 3,
          memory_storage: 100, // MB
          family_members: 1,
          priority_support: false,
          advanced_analytics: false
        },
        limits: {
          daily_interactions: 50,
          storage_quota: 100 * 1024 * 1024, // 100MB
          api_calls: 1000
        }
      },
      {
        name: '基礎方案',
        type: 'basic',
        price_monthly: 99,
        price_yearly: 990,
        features: {
          ai_characters: 3,
          learning_paths: 10,
          memory_storage: 500, // MB
          family_members: 2,
          priority_support: true,
          advanced_analytics: false
        },
        limits: {
          daily_interactions: 200,
          storage_quota: 500 * 1024 * 1024, // 500MB
          api_calls: 5000
        }
      },
      {
        name: '進階方案',
        type: 'premium',
        price_monthly: 199,
        price_yearly: 1990,
        features: {
          ai_characters: 5,
          learning_paths: 25,
          memory_storage: 2000, // MB
          family_members: 4,
          priority_support: true,
          advanced_analytics: true
        },
        limits: {
          daily_interactions: 500,
          storage_quota: 2 * 1024 * 1024 * 1024, // 2GB
          api_calls: 15000
        }
      },
      {
        name: '家庭方案',
        type: 'family',
        price_monthly: 299,
        price_yearly: 2990,
        features: {
          ai_characters: 10,
          learning_paths: 50,
          memory_storage: 5000, // MB
          family_members: 8,
          priority_support: true,
          advanced_analytics: true
        },
        limits: {
          daily_interactions: 1000,
          storage_quota: 5 * 1024 * 1024 * 1024, // 5GB
          api_calls: 30000
        }
      }
    ];

    for (const plan of defaultPlans) {
      await supabase
        .from('hanami_subscription_plans')
        .upsert(plan, { onConflict: 'type' });
    }

    // 插入預設 AI 角色
    const defaultCharacters = [
      {
        name: '小櫻',
        type: 'child_companion',
        target_audience: 'children',
        personality_config: {
          traits: ['友善', '耐心', '鼓勵'],
          communication_style: 'playful',
          expertise_areas: ['學習指導', '情感支持', '遊戲互動']
        },
        appearance_config: {
          model_path: '/characters/xiaoying.glb',
          animations: ['wave', 'nod', 'clap'],
          customization_options: {
            colors: ['#FFB6C1', '#FFD59A', '#EBC9A4'],
            accessories: ['hat', 'glasses', 'bag']
          }
        },
        capabilities: {
          learning_support: true,
          work_assistance: false,
          emotional_support: true,
          task_automation: false,
          family_coordination: false
        },
        workspace_config: {
          learning_environment: true,
          work_environment: false,
          family_environment: true
        }
      },
      {
        name: '工作助手',
        type: 'work_assistant',
        target_audience: 'adults',
        personality_config: {
          traits: ['專業', '高效', '可靠'],
          communication_style: 'professional',
          expertise_areas: ['任務管理', '生產力提升', '工作協作']
        },
        appearance_config: {
          model_path: '/characters/work-assistant.glb',
          animations: ['think', 'type', 'present'],
          customization_options: {
            colors: ['#4A90E2', '#7BB3F0', '#F5A623'],
            accessories: ['laptop', 'headset', 'notebook']
          }
        },
        capabilities: {
          learning_support: false,
          work_assistance: true,
          emotional_support: false,
          task_automation: true,
          family_coordination: false
        },
        workspace_config: {
          learning_environment: false,
          work_environment: true,
          family_environment: false
        }
      }
    ];

    for (const character of defaultCharacters) {
      await supabase
        .from('hanami_ai_characters')
        .upsert(character, { onConflict: 'name' });
    }

    // 插入預設記憶標籤
    const defaultTags = [
      { name: '學習', description: '學習相關的記憶', color: '#3B82F6' },
      { name: '工作', description: '工作相關的記憶', color: '#10B981' },
      { name: '家庭', description: '家庭相關的記憶', color: '#F59E0B' },
      { name: '成就', description: '成就和里程碑', color: '#EF4444' },
      { name: '情感', description: '情感和感受', color: '#8B5CF6' },
      { name: '個人', description: '個人成長記錄', color: '#06B6D4' }
    ];

    for (const tag of defaultTags) {
      await supabase
        .from('hanami_memory_tags')
        .upsert(tag, { onConflict: 'name' });
    }

    console.log('預設數據插入完成');
  } catch (error) {
    console.error('插入預設數據時發生錯誤:', error);
  }
}
