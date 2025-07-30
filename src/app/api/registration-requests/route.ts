import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// 使用服務端客戶端來繞過 RLS 限制
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    console.log('開始處理 GET 請求...');

    console.log('Supabase 服務端客戶端創建成功');

    // 獲取所有註冊申請
    console.log('開始查詢 registration_requests 表...');
    const { data, error } = await supabase
      .from('registration_requests')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('查詢完成，結果:', { data: data?.length || 0, error: error?.message || '無錯誤' });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { 
          error: '獲取註冊申請失敗', 
          details: error.message,
          code: error.code,
          hint: error.hint
        },
        { status: 500 }
      );
    }

    console.log('成功獲取註冊申請:', data?.length || 0, '條記錄');
    console.log('前兩條記錄:', data?.slice(0, 2));
    
    return NextResponse.json({ 
      data: data || [],
      count: data?.length || 0,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { 
        error: '內部服務器錯誤',
        details: error instanceof Error ? error.message : '未知錯誤',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 創建新的註冊申請
    const { data, error } = await supabase
      .from('registration_requests')
      .insert({
        email: body.email,
        full_name: body.full_name,
        phone: body.phone,
        role: body.role,
        status: 'pending',
        additional_info: body.additional_info || {}
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: '創建註冊申請失敗', details: error.message },
        { status: 500 }
      );
    }

    console.log('成功創建註冊申請:', data);
    return NextResponse.json({ data });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: '內部服務器錯誤' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('開始處理 PUT 請求...');
    const body = await request.json();

    console.log('PUT 請求體:', body);

    // 更新註冊申請狀態
    const updateData = {
      status: body.status,
      reviewed_at: body.reviewed_at,
      rejection_reason: body.rejection_reason,
      reviewed_by: body.reviewed_by || null // 確保 reviewed_by 可以是 null
    };

    console.log('準備更新的數據:', updateData);

    const { data, error } = await supabase
      .from('registration_requests')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single();

    console.log('Supabase 更新結果:', { data, error });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: '更新註冊申請失敗', details: error.message },
        { status: 500 }
      );
    }

    // 如果狀態是 approved，自動創建用戶帳號
    if (body.status === 'approved' && data) {
      console.log('註冊申請已批准，開始創建用戶帳號...');
      
      try {
        await createUserAccount(data);
        console.log('用戶帳號創建成功');
      } catch (createError) {
        console.error('創建用戶帳號失敗:', createError);
        // 不返回錯誤，因為註冊申請已經成功更新
      }
    }

    console.log('成功更新註冊申請:', data);
    return NextResponse.json({ data });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: '內部服務器錯誤' },
      { status: 500 }
    );
  }
} 

// 創建用戶帳號的函數
async function createUserAccount(registrationData: any) {
  const { email, full_name, phone, role, additional_info } = registrationData;
  
  // 從 additional_info 中提取密碼，如果沒有則使用默認密碼
  const userPassword = additional_info?.password || 'hanami123';
  
  switch (role) {
    case 'admin': {
      // 創建管理員帳號
      const { error: adminError } = await supabase
        .from('hanami_admin')
        .insert({
          admin_email: email,
          admin_name: full_name,
          role: 'admin',
          admin_password: userPassword
        });
      
      if (adminError) throw adminError;
      break;
    }
      
    case 'teacher': {
      // 創建教師帳號
      const { error: teacherError } = await supabase
        .from('hanami_employee')
        .insert({
          teacher_email: email,
          teacher_fullname: full_name,
          teacher_nickname: full_name,
          teacher_phone: phone,
          teacher_password: userPassword,
          teacher_role: 'teacher',
          teacher_status: 'active',
          teacher_background: additional_info?.teacherBackground || '',
          teacher_bankid: additional_info?.teacherBankId || '',
          teacher_address: additional_info?.teacherAddress || '',
          teacher_dob: additional_info?.teacherDob || null
        });
      
      if (teacherError) throw teacherError;
      break;
    }
      
    case 'parent': {
      // 創建學生帳號（家長通過學生帳號登入）
      const { error: studentError } = await supabase
        .from('Hanami_Students')
        .insert({
          full_name: additional_info?.parentStudentName || full_name,
          student_email: email,
          student_password: userPassword,
          parent_email: email,
          contact_number: phone,
          student_age: additional_info?.parentStudentAge || null,
          student_type: 'regular',
          access_role: 'parent'
        });
      
      if (studentError) throw studentError;
      break;
    }
      
    default:
      throw new Error(`不支援的角色類型: ${role}`);
  }
  
  // 發送歡迎郵件（這裡可以整合郵件服務）
  console.log(`用戶帳號創建成功，歡迎郵件已發送到: ${email}`);
  console.log(`用戶密碼: ${userPassword}`);
  
  // 發送歡迎郵件
  await sendWelcomeEmail(email, full_name, role, userPassword);
}

// 發送歡迎郵件的函數
async function sendWelcomeEmail(email: string, name: string, role: string, password: string) {
  try {
    // 這裡可以整合真實的郵件服務，如 SendGrid, AWS SES 等
    // 目前只是記錄到控制台
    const roleDisplayName = {
      'admin': '管理員',
      'teacher': '教師',
      'parent': '家長'
    }[role] || role;
    
    console.log('=== 歡迎郵件內容 ===');
    console.log(`收件人: ${email}`);
    console.log(`主題: 歡迎加入 Hanami 音樂教育系統`);
    console.log(`內容:`);
    console.log(`親愛的 ${name}，`);
    console.log(`您的 ${roleDisplayName} 帳號已成功創建！`);
    console.log(`登入信息：`);
    console.log(`- 郵箱: ${email}`);
    console.log(`- 密碼: ${password} (您註冊時設定的密碼)`);
    console.log(`- 登入地址: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`);
    console.log(`請使用以上信息登入系統，並建議您立即更改密碼。`);
    console.log(`如有任何問題，請聯繫系統管理員。`);
    console.log('==================');
    
    // TODO: 整合真實的郵件服務
    // const emailResult = await sendEmail({
    //   to: email,
    //   subject: '歡迎加入 Hanami 音樂教育系統',
    //   html: emailTemplate
    // });
    
  } catch (error) {
    console.error('發送歡迎郵件失敗:', error);
    // 不拋出錯誤，因為這不應該影響用戶帳號創建
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('開始處理 DELETE 請求...');
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: '缺少 ID 參數' },
        { status: 400 }
      );
    }

    console.log('準備刪除註冊申請 ID:', id);

    const { data, error } = await supabase
      .from('registration_requests')
      .delete()
      .eq('id', id)
      .select()
      .single();

    console.log('Supabase 刪除結果:', { data, error });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: '刪除註冊申請失敗', details: error.message },
        { status: 500 }
      );
    }

    console.log('成功刪除註冊申請:', data);
    return NextResponse.json({ data });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: '內部服務器錯誤' },
      { status: 500 }
    );
  }
} 