import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/database.types';

// 測試資料庫中的實際帳戶
export async function testDatabaseAccounts() {
  const supabase = createClientComponentClient<Database>();
  
  console.log('🔍 開始測試資料庫中的實際帳戶...\n');

  try {
    // 1. 測試管理員帳戶
    console.log('📋 檢查管理員帳戶...');
    const { data: adminAccounts, error: adminError } = await supabase
      .from('hanami_admin')
      .select('admin_email, admin_name, admin_password')
      .not('admin_email', 'is', null)
      .not('admin_password', 'is', null);

    if (adminError) {
      console.error('❌ 管理員帳戶查詢失敗:', adminError);
    } else {
      console.log(`✅ 找到 ${adminAccounts?.length || 0} 個管理員帳戶:`);
      adminAccounts?.forEach((admin, index) => {
        console.log(`   ${index + 1}. ${admin.admin_email} (${admin.admin_name})`);
      });
    }

    // 2. 測試老師帳戶
    console.log('\n👨‍🏫 檢查老師帳戶...');
    const { data: teacherAccounts, error: teacherError } = await supabase
      .from('hanami_employee')
      .select('teacher_email, teacher_fullname, teacher_nickname, teacher_password')
      .not('teacher_email', 'is', null)
      .not('teacher_password', 'is', null);

    if (teacherError) {
      console.error('❌ 老師帳戶查詢失敗:', teacherError);
    } else {
      console.log(`✅ 找到 ${teacherAccounts?.length || 0} 個老師帳戶:`);
      teacherAccounts?.forEach((teacher, index) => {
        console.log(`   ${index + 1}. ${teacher.teacher_email} (${teacher.teacher_nickname || teacher.teacher_fullname})`);
      });
    }

    // 3. 測試學生/家長帳戶
    console.log('\n👨‍👩‍👧‍👦 檢查學生/家長帳戶...');
    const { data: studentAccounts, error: studentError } = await supabase
      .from('Hanami_Students')
      .select('student_email, full_name, student_password, parent_email')
      .not('student_email', 'is', null)
      .not('student_password', 'is', null);

    if (studentError) {
      console.error('❌ 學生帳戶查詢失敗:', studentError);
    } else {
      console.log(`✅ 找到 ${studentAccounts?.length || 0} 個學生帳戶:`);
      studentAccounts?.forEach((student, index) => {
        console.log(`   ${index + 1}. ${student.student_email} (${student.full_name})`);
        if (student.parent_email) {
          console.log(`     家長郵箱: ${student.parent_email}`);
        }
      });
    }

    // 4. 檢查家長帳戶（通過 parent_email）
    console.log('\n👨‍👩‍👧‍👦 檢查家長帳戶（通過 parent_email）...');
    const { data: parentAccounts, error: parentError } = await supabase
      .from('Hanami_Students')
      .select('parent_email, full_name')
      .not('parent_email', 'is', null);

    if (parentError) {
      console.error('❌ 家長帳戶查詢失敗:', parentError);
    } else {
      const uniqueParents = parentAccounts?.filter((parent, index, self) => 
        index === self.findIndex(p => p.parent_email === parent.parent_email)
      );
      console.log(`✅ 找到 ${uniqueParents?.length || 0} 個家長帳戶:`);
      uniqueParents?.forEach((parent, index) => {
        console.log(`   ${index + 1}. ${parent.parent_email} (${parent.full_name}的家長)`);
      });
    }

    console.log('\n🎯 登入測試建議:');
    console.log('1. 管理員登入: 使用 hanami_admin 表中的 admin_email 和 admin_password');
    console.log('2. 老師登入: 使用 hanami_employee 表中的 teacher_email 和 teacher_password');
    console.log('3. 學生/家長登入: 使用 Hanami_Students 表中的 student_email 和 student_password');
    console.log('4. 家長登入: 使用 Hanami_Students 表中的 parent_email（無密碼驗證）');

    return {
      adminAccounts: adminAccounts || [],
      teacherAccounts: teacherAccounts || [],
      studentAccounts: studentAccounts || [],
      parentAccounts: uniqueParents || []
    };

  } catch (error) {
    console.error('❌ 測試過程中發生錯誤:', error);
    return null;
  }
}

// 測試特定帳戶的登入
export async function testSpecificLogin(email: string, password: string) {
  const supabase = createClientComponentClient<Database>();
  
  console.log(`🔐 測試登入: ${email}`);
  
  try {
    // 檢查管理員
    const { data: adminData, error: adminError } = await supabase
      .from('hanami_admin')
      .select('id, admin_name, admin_email, admin_password')
      .eq('admin_email', email)
      .eq('admin_password', password)
      .single();

    if (adminData && !adminError) {
      console.log('✅ 管理員登入成功!');
      return { success: true, role: 'admin', user: adminData };
    }

    // 檢查老師
    const { data: teacherData, error: teacherError } = await supabase
      .from('hanami_employee')
      .select('id, teacher_fullname, teacher_email, teacher_password, teacher_nickname')
      .eq('teacher_email', email)
      .eq('teacher_password', password)
      .single();

    if (teacherData && !teacherError) {
      console.log('✅ 老師登入成功!');
      return { success: true, role: 'teacher', user: teacherData };
    }

    // 檢查學生
    const { data: studentData, error: studentError } = await supabase
      .from('Hanami_Students')
      .select('id, full_name, student_email, student_password, parent_email')
      .eq('student_email', email)
      .eq('student_password', password)
      .single();

    if (studentData && !studentError) {
      console.log('✅ 學生/家長登入成功!');
      return { success: true, role: 'parent', user: studentData };
    }

    // 檢查家長（無密碼驗證）
    const { data: parentData, error: parentError } = await supabase
      .from('Hanami_Students')
      .select('id, full_name, parent_email')
      .eq('parent_email', email)
      .single();

    if (parentData && !parentError) {
      console.log('✅ 家長登入成功! (無密碼驗證)');
      return { success: true, role: 'parent', user: parentData };
    }

    console.log('❌ 登入失敗: 找不到匹配的帳戶');
    return { success: false, error: '帳號或密碼錯誤' };

  } catch (error) {
    console.error('❌ 登入測試錯誤:', error);
    return { success: false, error: '登入驗證失敗' };
  }
} 