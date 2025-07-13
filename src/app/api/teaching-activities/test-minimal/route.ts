import { NextRequest, NextResponse } from 'next/server';

import { supabase } from '@/lib/supabase';

// 測試最小化插入
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('收到的原始資料:', body);
    
    // 只包含絕對必要的欄位
    const minimalData = {
      title: String(body.title || body.activity_name || '測試活動'),
      description: String(body.description || body.activity_description || '測試活動描述'),
      activity_type: String(body.activity_type || 'game'),
      difficulty_level: 1,
      duration: 30,
      materials: [],
      objectives: [],
      instructions: '測試指令',
      notes: '測試備註',
      status: 'draft',
      tags: [],
      category: '測試分類',
      is_active: true,
    };
    
    console.log('最小化測試資料:', minimalData);
    
    // 驗證資料類型
    Object.keys(minimalData).forEach(key => {
      console.log(`${key}: ${typeof (minimalData as Record<string, any>)[key]} = ${JSON.stringify((minimalData as Record<string, any>)[key])}`);
    });
    
    const { data, error } = await supabase
      .from('hanami_teaching_activities')
      .insert(minimalData)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase 錯誤:', error);
      return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, data });
    
  } catch (error) {
    console.error('API 錯誤:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
} 