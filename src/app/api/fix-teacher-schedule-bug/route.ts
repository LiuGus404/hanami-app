import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { action } = await request.json();
    
    console.log('🔧 開始修復教師排班系統bug...', { action });

    if (action === 'fix_delete_logic') {
      // 修復刪除邏輯的bug
      // 問題：原本的程式碼會刪除整個月份的所有排班記錄
      // 解決方案：只刪除特定教師的排班記錄
      
      console.log('📝 修復說明：');
      console.log('❌ 原本的問題：');
      console.log('   - 在 handleSaveEditMode 函數中，刪除操作會刪除整個月份的所有教師排班');
      console.log('   - 這導致當為一個老師排班時，其他老師的排班記錄也會被刪除');
      console.log('');
      console.log('✅ 修復方案：');
      console.log('   - 修改刪除邏輯，只刪除特定教師的排班記錄');
      console.log('   - 在刪除前先備份現有資料');
      console.log('   - 確保不會影響其他教師的排班');

      return NextResponse.json({ 
        success: true, 
        message: '已識別問題並提供修復方案',
        problem: {
          description: '編輯模式保存時會刪除整個月份的所有教師排班記錄',
          location: 'src/components/admin/TeacherSchedulePanel.tsx:527-532',
          impact: '當為一個老師排班時，其他老師的排班記錄會被意外刪除'
        },
        solution: {
          description: '修改刪除邏輯，只刪除特定教師的排班記錄',
          steps: [
            '1. 在刪除前先備份現有資料',
            '2. 只刪除當前編輯的教師排班記錄',
            '3. 保留其他教師的排班記錄',
            '4. 添加確認對話框防止意外操作'
          ]
        }
      });

    } else if (action === 'backup_current_data') {
      // 備份當前所有排班資料
      const { data: allSchedules, error: fetchError } = await supabase
        .from('teacher_schedule')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('❌ 備份資料失敗:', fetchError);
        return NextResponse.json({ 
          error: '備份資料失敗', 
          details: fetchError.message 
        }, { status: 500 });
      }

      console.log('✅ 成功備份', allSchedules?.length || 0, '筆排班記錄');
      
      return NextResponse.json({ 
        success: true, 
        message: `成功備份 ${allSchedules?.length || 0} 筆排班記錄`,
        backupData: allSchedules || [],
        backupTime: new Date().toISOString()
      });

    } else if (action === 'restore_from_backup') {
      // 從備份還原資料
      const { backupData } = await request.json();
      
      if (!backupData || !Array.isArray(backupData)) {
        return NextResponse.json({ 
          error: '缺少備份資料', 
          details: '需要提供有效的備份資料' 
        }, { status: 400 });
      }

      // 先清空現有資料
      const { error: deleteError } = await supabase
        .from('teacher_schedule')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (deleteError) {
        console.error('❌ 清空現有資料失敗:', deleteError);
        return NextResponse.json({ 
          error: '清空現有資料失敗', 
          details: deleteError.message 
        }, { status: 500 });
      }

      // 還原備份資料
      if (backupData.length > 0) {
        const { error: insertError } = await supabase
          .from('teacher_schedule')
          .insert(backupData);

        if (insertError) {
          console.error('❌ 還原備份資料失敗:', insertError);
          return NextResponse.json({ 
            error: '還原備份資料失敗', 
            details: insertError.message 
          }, { status: 500 });
        }
      }

      console.log('✅ 成功還原', backupData.length, '筆排班記錄');
      
      return NextResponse.json({ 
        success: true, 
        message: `成功還原 ${backupData.length} 筆排班記錄`,
        restoredCount: backupData.length
      });

    } else {
      return NextResponse.json({ 
        error: '無效的操作', 
        details: '支援的操作: fix_delete_logic, backup_current_data, restore_from_backup' 
      }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ 修復教師排班系統bug時發生錯誤:', error);
    return NextResponse.json({ 
      error: '修復系統時發生未預期的錯誤',
      details: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
} 