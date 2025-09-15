import { NextRequest, NextResponse } from 'next/server';
import { createSaasAdminClient } from '@/lib/supabase-saas';

export async function POST(request: NextRequest) {
  try {
    const { studentId, studentName, studentOid, institution, bindingType, notes, parentId } = await request.json();
    
    // 驗證必要參數
    if (!parentId) {
      return NextResponse.json({ error: '缺少家長 ID' }, { status: 400 });
    }
    
    if (!studentId || !studentName) {
      return NextResponse.json({ error: '缺少學生信息' }, { status: 400 });
    }

    const supabase = createSaasAdminClient();

    // 檢查是否已經綁定
    const { data: existingBinding, error: checkError } = await supabase
      .from('parent_student_bindings')
      .select('id')
      .eq('parent_id', parentId)
      .eq('student_id', studentId)
      .single();

    // 如果表不存在，返回友好錯誤
    if (checkError && checkError.code === '42P01') {
      console.error('資料庫表不存在:', checkError);
      return NextResponse.json({ 
        error: '資料庫表尚未創建，請聯繫管理員' 
      }, { status: 503 });
    }

    if (existingBinding) {
      return NextResponse.json({ 
        error: '此孩子已經綁定到您的帳戶' 
      }, { status: 400 });
    }

    // 創建綁定記錄
    const { data: binding, error: insertError } = await (supabase
      .from('parent_student_bindings') as any)
      .insert({
        parent_id: parentId,
        student_id: studentId,
        student_name: studentName,
        student_oid: studentOid,
        institution: institution || 'Hanami Music',
        binding_type: bindingType || 'parent',
        binding_status: 'active',
        notes: notes || ''
      })
      .select()
      .single();

    if (insertError) {
      console.error('綁定孩子錯誤:', insertError);
      return NextResponse.json({ 
        error: '綁定失敗，請稍後再試' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      binding,
      message: '孩子綁定成功！' 
    });

  } catch (error) {
    console.error('綁定孩子 API 錯誤:', error);
    return NextResponse.json({ 
      error: '服務器錯誤' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');
    
    if (!parentId) {
      return NextResponse.json({ error: '缺少家長 ID' }, { status: 400 });
    }

    const supabase = createSaasAdminClient();

    // 獲取已綁定的孩子列表
    const { data: bindings, error } = await supabase
      .from('parent_student_bindings')
      .select('*')
      .eq('parent_id', parentId)
      .eq('binding_status', 'active')
      .order('last_accessed', { ascending: false });

    // 如果表不存在，返回空列表
    if (error && error.code === '42P01') {
      console.error('資料庫表不存在:', error);
      return NextResponse.json({ 
        success: true, 
        bindings: [] 
      });
    }

    if (error) {
      console.error('獲取綁定孩子錯誤:', error);
      return NextResponse.json({ 
        error: '獲取綁定孩子失敗' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      bindings 
    });

  } catch (error) {
    console.error('獲取綁定孩子 API 錯誤:', error);
    return NextResponse.json({ 
      error: '服務器錯誤' 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bindingId = searchParams.get('bindingId');
    const parentId = searchParams.get('parentId');
    
    if (!bindingId) {
      return NextResponse.json({ error: '缺少綁定 ID' }, { status: 400 });
    }
    
    if (!parentId) {
      return NextResponse.json({ error: '缺少家長 ID' }, { status: 400 });
    }

    const supabase = createSaasAdminClient();

    // 刪除綁定記錄
    const { error } = await supabase
      .from('parent_student_bindings')
      .delete()
      .eq('id', bindingId)
      .eq('parent_id', parentId);

    if (error) {
      console.error('取消綁定錯誤:', error);
      return NextResponse.json({ 
        error: '取消綁定失敗' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: '取消綁定成功' 
    });

  } catch (error) {
    console.error('取消綁定 API 錯誤:', error);
    return NextResponse.json({ 
      error: '服務器錯誤' 
    }, { status: 500 });
  }
}
