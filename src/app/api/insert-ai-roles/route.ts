import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    console.log('開始插入 AI 角色資料...');

    // 插入 AI 角色資料
    const { data, error } = await supabase
      .from('ai_roles')
      .upsert([
        {
          slug: 'hibi-manager',
          name: 'Hibi',
          description: 'Hanami Echo 系統總管與中央協調者，負責統籌各項任務並協調不同角色間的合作。',
          avatar_url: '/3d-character-backgrounds/studio/Hibi/Hibi.png',
          category: 'management',
          default_model: 'gpt-4o-mini',
          system_prompt: `你是 Hibi，Hanami Echo 的系統總管和中央協調者。你負責：
1. 統籌和分配任務給適合的 AI 角色
2. 協調 Mori（研究）和 Pico（創作）之間的合作
3. 確保工作流程順暢並提供進度更新
4. 作為用戶與各個專業角色之間的橋樑

請以友善、專業且有條理的方式回應，始終關注任務的整體進度和品質。`,
          temperature: 0.7,
          max_tokens: 2000,
          is_public: true,
          status: 'active'
        },
        {
          slug: 'mori-researcher',
          name: '墨墨 (Mori)',
          description: '智慧的貓頭鷹研究員，專精於學術研究、資料分析和知識整理。',
          avatar_url: '/3d-character-backgrounds/studio/Mori/Mori.png',
          category: 'research',
          default_model: 'gpt-4o-mini',
          system_prompt: `你是墨墨（Mori），一隻博學的貓頭鷹，專精於研究和學習。你的特長包括：
1. 深度學術研究和文獻分析
2. 複雜問題的邏輯推理
3. 知識整理和結構化呈現
4. 學習方法指導和建議

請以嚴謹但友善的學者風格回應，提供準確、詳細且有條理的資訊。`,
          temperature: 0.6,
          max_tokens: 2000,
          is_public: true,
          status: 'active'
        },
        {
          slug: 'pico-artist',
          name: '皮可 (Pico)',
          description: '創意無限的水瀨藝術家，專精於視覺創作、設計和藝術指導。',
          avatar_url: '/3d-character-backgrounds/studio/Pico/Pico.png',
          category: 'creative',
          default_model: 'gpt-4o-mini',
          system_prompt: `你是皮可（Pico），一隻充滿創意的水瀨藝術家，專精於創作和設計。你的特長包括：
1. 視覺藝術創作和設計
2. 創意發想和靈感激發
3. 藝術風格建議和指導
4. 將抽象概念視覺化

請以活潑、充滿創意且鼓舞人心的方式回應，激發用戶的創造力。當用戶需要圖片創作時，我會使用專門的圖片生成工具來創造視覺內容。`,
          temperature: 0.8,
          max_tokens: 2000,
          is_public: true,
          status: 'active'
        }
      ], {
        onConflict: 'slug'
      });

    if (error) {
      console.error('插入 AI 角色失敗:', error);
      return NextResponse.json({
        success: false,
        error: '插入 AI 角色失敗',
        details: error.message
      }, { status: 500 });
    }

    console.log('AI 角色插入成功:', data);

    // 驗證插入結果
    const { data: verifyData, error: verifyError } = await supabase
      .from('ai_roles')
      .select('slug, name, status, created_at')
      .in('slug', ['hibi-manager', 'mori-researcher', 'pico-artist'])
      .order('slug');

    if (verifyError) {
      console.error('驗證 AI 角色失敗:', verifyError);
      return NextResponse.json({
        success: false,
        error: '驗證 AI 角色失敗',
        details: verifyError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'AI 角色插入成功',
      insertedRoles: data,
      verifiedRoles: verifyData
    });

  } catch (error) {
    console.error('API 錯誤:', error);
    return NextResponse.json({
      success: false,
      error: '內部服務器錯誤',
      details: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}
