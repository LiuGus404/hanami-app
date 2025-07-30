import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST() {
  try {
    console.log('開始修復已批准但未創建用戶帳號的申請...');

    // 1. 獲取所有已批准的註冊申請
    const { data: approvedRequests, error: fetchError } = await supabase
      .from('registration_requests')
      .select('*')
      .eq('status', 'approved');

    if (fetchError) {
      console.error('獲取已批准申請錯誤:', fetchError);
      return NextResponse.json({
        error: '獲取已批准申請失敗',
        details: fetchError.message
      }, { status: 500 });
    }

    console.log(`找到 ${approvedRequests?.length || 0} 個已批准的申請`);

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    // 2. 檢查每個申請是否已經有對應的用戶帳號
    for (const request of approvedRequests || []) {
      console.log(`檢查申請: ${request.email} (${request.role})`);
      
      let hasAccount = false;
      let accountCheck = {};

      try {
        // 檢查是否已有用戶帳號
        switch (request.role) {
          case 'admin': {
            const { data: adminData } = await supabase
              .from('hanami_admin')
              .select('id')
              .eq('admin_email', request.email)
              .single();
            hasAccount = !!adminData;
            accountCheck = { admin: !!adminData };
            break;
          }
            
          case 'teacher': {
            const { data: teacherData } = await supabase
              .from('hanami_employee')
              .select('id')
              .eq('teacher_email', request.email)
              .single();
            hasAccount = !!teacherData;
            accountCheck = { teacher: !!teacherData };
            break;
          }
            
          case 'parent': {
            const { data: studentData } = await supabase
              .from('Hanami_Students')
              .select('id')
              .eq('parent_email', request.email)
              .single();
            hasAccount = !!studentData;
            accountCheck = { student: !!studentData };
            break;
          }
        }

        if (hasAccount) {
          console.log(`${request.email} 已有用戶帳號，跳過`);
          results.push({
            email: request.email,
            role: request.role,
            status: 'skipped',
            reason: '已有用戶帳號',
            accountCheck
          });
          continue;
        }

        // 3. 創建缺失的用戶帳號
        console.log(`為 ${request.email} 創建用戶帳號...`);
        
        const userPassword = request.additional_info?.password || 'hanami123';
        let createResult = {};

        switch (request.role) {
          case 'admin': {
            const { error } = await supabase
              .from('hanami_admin')
              .insert({
                admin_email: request.email,
                admin_name: request.full_name,
                role: 'admin',
                admin_password: request.password
              });
            
            if (error) throw error;
            break;
          }
          
          case 'teacher': {
            const { error } = await supabase
              .from('hanami_employee')
              .insert({
                teacher_email: request.email,
                teacher_fullname: request.full_name,
                teacher_nickname: request.full_name || '教師',
                teacher_phone: request.phone || '',
                teacher_password: request.password,
                teacher_role: 'teacher',
                teacher_status: 'active',
                teacher_background: request.additional_info?.teacherBackground || '',
                teacher_bankid: request.additional_info?.teacherBankId || '',
                teacher_address: request.additional_info?.teacherAddress || '',
                teacher_dob: request.additional_info?.teacherDob || null
              });
            
            if (error) throw error;
            break;
          }
          
          case 'parent': {
            const { error } = await supabase
              .from('hanami_parents')
              .insert({
                parent_email: request.email,
                parent_name: request.full_name,
                parent_phone: request.phone || '',
                parent_password: request.password,
                parent_address: request.additional_info?.address || '',
                parent_status: 'active',
                parent_notes: request.additional_info?.notes || ''
              });
            
            if (error) throw error;
            break;
          }
          
          default:
            throw new Error(`不支援的角色類型: ${request.role}`);
        }

        console.log(`${request.email} 用戶帳號創建成功`);
        results.push({
          email: request.email,
          role: request.role,
          status: 'created',
          createResult
        });
        successCount++;

      } catch (error) {
        console.error(`為 ${request.email} 創建用戶帳號失敗:`, error);
        results.push({
          email: request.email,
          role: request.role,
          status: 'error',
          error: error instanceof Error ? error.message : '未知錯誤'
        });
        errorCount++;
      }
    }

    console.log(`修復完成: 成功 ${successCount} 個，錯誤 ${errorCount} 個`);

    return NextResponse.json({
      success: true,
      message: `修復完成: 成功 ${successCount} 個，錯誤 ${errorCount} 個`,
      summary: {
        total: approvedRequests?.length || 0,
        success: successCount,
        error: errorCount,
        skipped: results.filter(r => r.status === 'skipped').length
      },
      results
    });

  } catch (error: any) {
    console.error('修復已批准帳號錯誤:', error);
    return NextResponse.json({
      error: error.message || '修復已批准帳號時發生錯誤'
    }, { status: 500 });
  }
} 