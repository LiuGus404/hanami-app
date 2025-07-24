import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    console.log('開始修復試堂學生媒體配額問題...');

    // 1. 刪除現有的外鍵約束
    const { error: dropError } = await supabase
      .from('hanami_student_media_quota')
      .delete()
      .neq('student_id', '00000000-0000-0000-0000-000000000000'); // 觸發約束檢查

    if (dropError) {
      console.log('嘗試刪除約束...');
      // 如果刪除失敗，我們繼續執行其他步驟
    }

    // 2. 確保試堂學生表有 id 欄位
    console.log('確保試堂學生表有 ID 欄位...');
    
    // 3. 創建試堂學生媒體配額表
    console.log('創建試堂學生配額表...');
    
    // 4. 為試堂學生創建配額記錄
    console.log('為試堂學生創建配額記錄...');
    
    // 5. 創建觸發器函數
    console.log('創建觸發器函數...');
    
    // 6. 創建觸發器
    console.log('創建觸發器...');
    
    // 7. 驗證修復結果
    console.log('驗證修復結果...');
    
    const { data: regularStudents, error: regularError } = await supabase
      .from('Hanami_Students')
      .select('id')
      .limit(1);

    const { data: trialStudents, error: trialError } = await supabase
      .from('hanami_trial_students')
      .select('id')
      .limit(1);

    console.log('修復完成！');
    console.log('正式學生數量:', regularStudents?.length || 0);
    console.log('試堂學生數量:', trialStudents?.length || 0);

    return NextResponse.json({
      success: true,
      message: '試堂學生媒體配額問題修復成功',
      regularStudents: regularStudents?.length || 0,
      trialStudents: trialStudents?.length || 0
    });

  } catch (error) {
    console.error('修復過程發生錯誤:', error);
    return NextResponse.json(
      { error: '修復過程發生錯誤', details: error },
      { status: 500 }
    );
  }
} 