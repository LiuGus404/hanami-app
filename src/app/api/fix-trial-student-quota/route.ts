import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    console.log('開始修復試堂學生媒體配額問題...');

    // 檢查試堂學生是否有配額記錄
    const { data: trialStudents, error: trialError } = await supabase
      .from('hanami_trial_students')
      .select('id')
      .limit(10);

    if (trialError) {
      console.error('載入試堂學生失敗:', trialError);
      return NextResponse.json(
        { error: '載入試堂學生失敗', details: trialError },
        { status: 500 }
      );
    }

    // 檢查正式學生配額
    const { data: regularQuota, error: regularQuotaError } = await supabase
      .from('hanami_student_media_quota')
      .select('student_id')
      .limit(10);

    if (regularQuotaError) {
      console.error('載入正式學生配額失敗:', regularQuotaError);
      return NextResponse.json(
        { error: '載入正式學生配額失敗', details: regularQuotaError },
        { status: 500 }
      );
    }

    // 檢查正式學生
    const { data: regularStudents, error: regularError } = await supabase
      .from('Hanami_Students')
      .select('id')
      .limit(10);

    if (regularError) {
      console.error('載入正式學生失敗:', regularError);
      return NextResponse.json(
        { error: '載入正式學生失敗', details: regularError },
        { status: 500 }
      );
    }

    console.log('檢查完成！');
    console.log('正式學生數量:', regularStudents?.length || 0);
    console.log('試堂學生數量:', trialStudents?.length || 0);
    console.log('配額記錄數量:', regularQuota?.length || 0);

    return NextResponse.json({
      success: true,
      message: '試堂學生媒體配額檢查完成',
      regularStudents: regularStudents?.length || 0,
      trialStudents: trialStudents?.length || 0,
      quotaRecords: regularQuota?.length || 0
    });

  } catch (error) {
    console.error('檢查過程發生錯誤:', error);
    return NextResponse.json(
      { error: '檢查過程發生錯誤', details: error },
      { status: 500 }
    );
  }
} 