import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: { studentId: string } }
) {
  try {
    const studentId = params.studentId;

    if (!studentId) {
      return NextResponse.json(
        { error: '缺少學生ID' },
        { status: 400 }
      );
    }

    // 檢查環境變數
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('缺少環境變數');
      return NextResponse.json(
        { error: '伺服器配置錯誤' },
        { status: 500 }
      );
    }

    // 創建服務端 Supabase 客戶端
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 1. 獲取學生的配額設定
    const { data: studentQuota, error: quotaError } = await supabase
      .from('hanami_student_media_quota')
      .select('*')
      .eq('student_id', studentId)
      .single();

    if (quotaError) {
      console.error('獲取學生配額失敗:', quotaError);
      return NextResponse.json(
        { error: '無法獲取學生配額設定' },
        { status: 404 }
      );
    }

    // 2. 獲取對應的配額等級
    const planTypeToLevelName = (planType: string): string => {
      const mapping: { [key: string]: string } = {
        'free': '基礎版',
        'free:create': '基礎版',
        'basic': '標準版',
        'premium': '進階版',
        'professional': '專業版'
      };
      return mapping[planType] || '基礎版';
    };

    const { data: quotaLevel, error: levelError } = await supabase
      .from('hanami_media_quota_levels')
      .select('*')
      .eq('level_name', planTypeToLevelName(studentQuota.plan_type))
      .eq('is_active', true)
      .single();

    if (levelError || !quotaLevel) {
      console.error('獲取配額等級失敗:', levelError);
      return NextResponse.json(
        { error: '無法獲取配額等級設定' },
        { status: 404 }
      );
    }

    // 3. 計算使用百分比
    const videoUsagePercent = quotaLevel.video_limit > 0 
      ? Math.round((studentQuota.video_count / quotaLevel.video_limit) * 100) 
      : 0;
    
    const photoUsagePercent = quotaLevel.photo_limit > 0 
      ? Math.round((studentQuota.photo_count / quotaLevel.photo_limit) * 100) 
      : 0;
    
    const storageUsagePercent = quotaLevel.storage_limit_mb > 0 
      ? Math.round(((studentQuota.total_used_space / (1024 * 1024)) / quotaLevel.storage_limit_mb) * 100) 
      : 0;

    // 4. 格式化檔案大小
    const formatFileSize = (bytes: number): string => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    // 5. 返回配額資訊
    const quotaInfo = {
      student_id: studentId,
      plan_type: studentQuota.plan_type,
      level_name: quotaLevel.level_name,
      current_usage: {
        video_count: studentQuota.video_count || 0,
        photo_count: studentQuota.photo_count || 0,
        total_used_space: studentQuota.total_used_space || 0,
        total_used_space_formatted: formatFileSize(studentQuota.total_used_space || 0)
      },
      limits: {
        video_limit: quotaLevel.video_limit,
        photo_limit: quotaLevel.photo_limit,
        storage_limit_mb: quotaLevel.storage_limit_mb,
        storage_limit_formatted: formatFileSize(quotaLevel.storage_limit_mb * 1024 * 1024),
        video_size_limit_mb: quotaLevel.video_size_limit_mb,
        photo_size_limit_mb: quotaLevel.photo_size_limit_mb
      },
      usage_percentages: {
        video: videoUsagePercent,
        photo: photoUsagePercent,
        storage: storageUsagePercent
      },
      can_upload: {
        video: studentQuota.video_count < quotaLevel.video_limit,
        photo: studentQuota.photo_count < quotaLevel.photo_limit,
        storage: (studentQuota.total_used_space || 0) < (quotaLevel.storage_limit_mb * 1024 * 1024)
      }
    };

    return NextResponse.json({
      success: true,
      data: quotaInfo
    });

  } catch (error) {
    console.error('獲取配額資訊錯誤:', error);
    return NextResponse.json(
      { error: '獲取配額資訊失敗' },
      { status: 500 }
    );
  }
} 