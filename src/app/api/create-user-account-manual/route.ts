import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, full_name, phone, role, password, additional_info } = body;

    console.log('手動創建用戶帳號:', { email, full_name, role });

    let result = {};

    switch (role) {
      case 'admin': {
        const { error } = await supabase
          .from('hanami_admin')
          .insert({
            admin_email: email,
            admin_name: full_name,
            role: 'admin',
            admin_password: password
          });
        
        if (error) throw error;
        break;
      }
      
      case 'teacher': {
        const { error } = await supabase
          .from('hanami_employee')
          .insert({
            teacher_email: email,
            teacher_fullname: full_name,
            teacher_nickname: full_name || '教師',
            teacher_phone: phone || '',
            teacher_password: password,
            teacher_role: 'teacher',
            teacher_status: 'active',
            teacher_background: additional_info?.teacherBackground || '',
            teacher_bankid: additional_info?.teacherBankId || '',
            teacher_address: additional_info?.teacherAddress || '',
            teacher_dob: additional_info?.teacherDob || null
          });
        
        if (error) throw error;
        break;
      }
      
      case 'parent': {
        const { error } = await supabase
          .from('hanami_parents')
          .insert({
            parent_email: email,
            parent_name: full_name,
            parent_phone: phone || '',
            parent_password: password,
            parent_address: additional_info?.address || '',
            parent_status: 'active',
            parent_notes: additional_info?.notes || ''
          });
        
        if (error) throw error;
        break;
      }
      
      default:
        throw new Error(`不支援的角色類型: ${role}`);
    }

    // 驗證帳號是否真的創建成功
    let verificationResult = {};
    try {
      switch (role) {
        case 'admin': {
          const { data: verifyAdmin } = await supabase
            .from('hanami_admin')
            .select('*')
            .eq('admin_email', email)
            .single();
          verificationResult = { verification: verifyAdmin ? 'success' : 'failed' };
          break;
        }
          
        case 'teacher': {
          const { data: verifyTeacher } = await supabase
            .from('hanami_employee')
            .select('*')
            .eq('teacher_email', email)
            .single();
          verificationResult = { verification: verifyTeacher ? 'success' : 'failed' };
          break;
        }
          
        case 'parent': {
          const { data: verifyStudent } = await supabase
            .from('Hanami_Students')
            .select('*')
            .eq('parent_email', email)
            .single();
          verificationResult = { verification: verifyStudent ? 'success' : 'failed' };
          break;
        }
      }
    } catch (verifyError) {
      verificationResult = { verification: 'error', verifyError: verifyError };
    }

    return NextResponse.json({
      ...result,
      ...verificationResult,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('手動創建用戶帳號錯誤:', error);
    return NextResponse.json({
      error: error.message || '創建用戶帳號時發生錯誤'
    }, { status: 500 });
  }
} 