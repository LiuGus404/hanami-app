import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabaseClient } from '@/lib/supabase';

type UpdateProgressBody = {
  activityId: string;
  progress: number;
  org_id?: string;
};

async function handleUpdate(request: NextRequest) {
  try {
    const supabase = getServerSupabaseClient();
    const { activityId, progress, org_id } = (await request.json()) as UpdateProgressBody;

    if (!activityId || typeof progress !== 'number') {
      return NextResponse.json(
        { success: false, error: '缺少必要參數 activityId 或 progress' },
        { status: 400 }
      );
    }

    if (progress < 0 || progress > 100) {
      return NextResponse.json(
        { success: false, error: 'progress 必須在 0 到 100 之間' },
        { status: 400 }
      );
    }

    // 確保活動存在，並獲取學生ID
    const { data: existingData, error: checkErr } = await supabase
      .from('hanami_student_activities' as any)
      .select('id, student_id')
      .eq('id', activityId)
      .single();

    if (checkErr || !existingData) {
      return NextResponse.json(
        { success: false, error: '指定的學生活動不存在' },
        { status: 404 }
      );
    }

    const existing = existingData as { id: string; student_id: string };

    // 如果沒有提供 org_id，從學生記錄中獲取
    let finalOrgId = org_id;
    if (!finalOrgId && existing.student_id) {
      const { data: studentDataRaw } = await supabase
        .from('Hanami_Students')
        .select('org_id')
        .eq('id', existing.student_id)
        .single();
      
      const studentData = studentDataRaw as { org_id: string } | null;
      
      if (studentData?.org_id) {
        finalOrgId = studentData.org_id;
      }
    }

    const shouldComplete = progress >= 100;
    const updateData: Record<string, any> = {
      progress,
      updated_at: new Date().toISOString(),
    };

    // 如果有 org_id，添加到更新數據中
    if (finalOrgId) {
      updateData.org_id = finalOrgId;
    }

    if (shouldComplete) {
      updateData.completion_status = 'completed';
      updateData.completed_at = new Date().toISOString();
    }

    const { error: updateErr } = await (supabase as any)
      .from('hanami_student_activities')
      .update(updateData)
      .eq('id', activityId);

    if (updateErr) {
      console.error('更新活動進度失敗:', updateErr);
      return NextResponse.json(
        { success: false, error: '更新活動進度失敗', details: (updateErr as any).message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: '活動進度更新成功' });
  } catch (error: any) {
    console.error('處理活動進度更新時發生錯誤:', error);
    return NextResponse.json(
      { success: false, error: '伺服器錯誤', details: error?.message || String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return handleUpdate(request);
}

export async function PUT(request: NextRequest) {
  return handleUpdate(request);
}


