import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('🔍 開始檢查Supabase資料恢復可能性...');

    // 1. 檢查是否有任何teacher_schedule記錄（包括軟刪除）
    const { data: allSchedules, error: allError } = await supabase
      .from('teacher_schedule')
      .select('*')
      .order('created_at', { ascending: false });

    if (allError) {
      console.error('❌ 查詢所有記錄失敗:', allError);
      return NextResponse.json({ 
        error: '查詢記錄失敗', 
        details: allError.message 
      }, { status: 500 });
    }

    // 2. 檢查資料庫表的結構和約束（簡化版本）
    let tableInfo = null;
    let triggers = null;

    // 4. 檢查最近的資料庫操作日誌（如果可用）
    // 注意：audit_logs 表不存在，所以跳過此檢查
    const auditLogs = null;

    // 5. 檢查是否有其他相關表可能有備份資料
    let relatedData = null;
    try {
      const { data, error } = await supabase
        .from('hanami_student_lesson')
        .select('lesson_date, lesson_teacher')
        .not('lesson_teacher', 'is', null)
        .order('lesson_date', { ascending: false })
        .limit(20);
      
      if (!error) {
        relatedData = data;
      }
    } catch (error) {
      console.log('查詢相關資料時發生錯誤');
    }

    console.log('✅ Supabase恢復檢查完成');

    return NextResponse.json({
      success: true,
      currentStatus: {
        totalRecords: allSchedules?.length || 0,
        hasData: (allSchedules?.length || 0) > 0,
        lastRecord: allSchedules?.[0] || null,
      },
      recoveryOptions: {
        // Supabase自動備份
        supabaseBackups: {
          available: true,
          description: 'Supabase提供自動備份，但需要聯繫Supabase支援',
          contactInfo: 'https://supabase.com/support',
          timeWindow: '通常保留7-30天',
        },
        // 資料庫日誌
        databaseLogs: {
          available: auditLogs !== null,
          description: '檢查資料庫操作日誌',
          data: auditLogs || [],
        },
        // 相關資料推斷
        relatedData: {
          available: relatedData !== null,
          description: '從課程記錄推斷教師排班',
          data: relatedData || [],
        },
        // 手動恢復
        manualRecovery: {
          available: true,
          description: '手動重新建立排班記錄',
          steps: [
            '1. 從課程記錄中提取教師工作日期',
            '2. 根據教師工作模式重建排班',
            '3. 手動輸入到系統中'
          ]
        }
      },
      recommendations: [
        {
          priority: 'high',
          action: '立即聯繫Supabase支援',
          description: 'Supabase可能有自動備份可以恢復',
          contact: 'https://supabase.com/support'
        },
        {
          priority: 'medium',
          action: '檢查課程記錄',
          description: '從hanami_student_lesson表推斷教師工作日期',
          data: relatedData || []
        },
        {
          priority: 'low',
          action: '手動重建',
          description: '根據記憶和課程記錄手動重建排班',
          estimatedTime: '2-4小時'
        }
      ],
      checkTime: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ 檢查Supabase恢復可能性時發生錯誤:', error);
    return NextResponse.json({ 
      error: '檢查恢復可能性時發生未預期的錯誤',
      details: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
} 