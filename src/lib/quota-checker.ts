import { createClient } from '@supabase/supabase-js';

interface QuotaLevel {
  id: string;
  level_name: string;
  video_limit: number;
  photo_limit: number;
  storage_limit_mb: number;
  video_size_limit_mb: number;
  photo_size_limit_mb: number;
  description: string;
  is_active: boolean;
}

interface StudentQuota {
  student_id: string;
  plan_type: string;
  video_limit: number;
  photo_limit: number;
  video_count: number;
  photo_count: number;
  total_used_space: number;
  storage_limit_bytes: number;
}

interface QuotaCheckResult {
  allowed: boolean;
  reason?: string;
  currentUsage: {
    video_count: number;
    photo_count: number;
    total_used_space: number;
  };
  limits: {
    video_limit: number;
    photo_limit: number;
    storage_limit_bytes: number;
    video_size_limit_mb: number;
    photo_size_limit_mb: number;
  };
}

export class QuotaChecker {
  private supabase: any;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('缺少 Supabase 環境變數');
    }

    this.supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  /**
   * 檢查學生是否可以上傳指定類型的媒體檔案
   */
  async checkUploadQuota(
    studentId: string,
    mediaType: 'video' | 'photo',
    fileSize: number
  ): Promise<QuotaCheckResult> {
    try {
      // 1. 獲取學生的配額設定
      const { data: studentQuota, error: quotaError } = await this.supabase
        .from('hanami_student_media_quota')
        .select('*')
        .eq('student_id', studentId)
        .single();

      if (quotaError) {
        console.error('獲取學生配額失敗:', quotaError);
        return {
          allowed: false,
          reason: '無法獲取學生配額設定',
          currentUsage: { video_count: 0, photo_count: 0, total_used_space: 0 },
          limits: { video_limit: 0, photo_limit: 0, storage_limit_bytes: 0, video_size_limit_mb: 0, photo_size_limit_mb: 0 }
        };
      }

      // 2. 獲取對應的配額等級
      const { data: quotaLevel, error: levelError } = await this.supabase
        .from('hanami_media_quota_levels')
        .select('*')
        .eq('level_name', this.mapPlanTypeToLevelName(studentQuota.plan_type))
        .eq('is_active', true)
        .single();

      if (levelError || !quotaLevel) {
        console.error('獲取配額等級失敗:', levelError);
        return {
          allowed: false,
          reason: '無法獲取配額等級設定',
          currentUsage: { video_count: 0, photo_count: 0, total_used_space: 0 },
          limits: { video_limit: 0, photo_limit: 0, storage_limit_bytes: 0, video_size_limit_mb: 0, photo_size_limit_mb: 0 }
        };
      }

      // 3. 檢查檔案大小限制
      const fileSizeMB = fileSize / (1024 * 1024);
      const sizeLimit = mediaType === 'video' ? quotaLevel.video_size_limit_mb : quotaLevel.photo_size_limit_mb;
      
      if (fileSizeMB > sizeLimit) {
        return {
          allowed: false,
          reason: `${mediaType === 'video' ? '影片' : '相片'}檔案大小超過限制 (${fileSizeMB.toFixed(1)}MB > ${sizeLimit}MB)`,
          currentUsage: {
            video_count: studentQuota.video_count || 0,
            photo_count: studentQuota.photo_count || 0,
            total_used_space: studentQuota.total_used_space || 0
          },
          limits: {
            video_limit: quotaLevel.video_limit,
            photo_limit: quotaLevel.photo_limit,
            storage_limit_bytes: quotaLevel.storage_limit_mb * 1024 * 1024,
            video_size_limit_mb: quotaLevel.video_size_limit_mb,
            photo_size_limit_mb: quotaLevel.photo_size_limit_mb
          }
        };
      }

      // 4. 檢查數量限制
      const currentCount = mediaType === 'video' ? studentQuota.video_count : studentQuota.photo_count;
      const countLimit = mediaType === 'video' ? quotaLevel.video_limit : quotaLevel.photo_limit;
      
      if (currentCount >= countLimit) {
        return {
          allowed: false,
          reason: `${mediaType === 'video' ? '影片' : '相片'}數量已達上限 (${currentCount}/${countLimit})`,
          currentUsage: {
            video_count: studentQuota.video_count || 0,
            photo_count: studentQuota.photo_count || 0,
            total_used_space: studentQuota.total_used_space || 0
          },
          limits: {
            video_limit: quotaLevel.video_limit,
            photo_limit: quotaLevel.photo_limit,
            storage_limit_bytes: quotaLevel.storage_limit_mb * 1024 * 1024,
            video_size_limit_mb: quotaLevel.video_size_limit_mb,
            photo_size_limit_mb: quotaLevel.photo_size_limit_mb
          }
        };
      }

      // 5. 檢查儲存空間限制
      const newTotalSpace = (studentQuota.total_used_space || 0) + fileSize;
      const storageLimitBytes = quotaLevel.storage_limit_mb * 1024 * 1024;
      
      if (newTotalSpace > storageLimitBytes) {
        return {
          allowed: false,
          reason: `儲存空間不足 (${(newTotalSpace / (1024 * 1024)).toFixed(1)}MB > ${quotaLevel.storage_limit_mb}MB)`,
          currentUsage: {
            video_count: studentQuota.video_count || 0,
            photo_count: studentQuota.photo_count || 0,
            total_used_space: studentQuota.total_used_space || 0
          },
          limits: {
            video_limit: quotaLevel.video_limit,
            photo_limit: quotaLevel.photo_limit,
            storage_limit_bytes: storageLimitBytes,
            video_size_limit_mb: quotaLevel.video_size_limit_mb,
            photo_size_limit_mb: quotaLevel.photo_size_limit_mb
          }
        };
      }

      // 6. 所有檢查通過
      return {
        allowed: true,
        currentUsage: {
          video_count: studentQuota.video_count || 0,
          photo_count: studentQuota.photo_count || 0,
          total_used_space: studentQuota.total_used_space || 0
        },
        limits: {
          video_limit: quotaLevel.video_limit,
          photo_limit: quotaLevel.photo_limit,
          storage_limit_bytes: storageLimitBytes,
          video_size_limit_mb: quotaLevel.video_size_limit_mb,
          photo_size_limit_mb: quotaLevel.photo_size_limit_mb
        }
      };

    } catch (error) {
      console.error('配額檢查錯誤:', error);
      return {
        allowed: false,
        reason: '配額檢查失敗',
        currentUsage: { video_count: 0, photo_count: 0, total_used_space: 0 },
        limits: { video_limit: 0, photo_limit: 0, storage_limit_bytes: 0, video_size_limit_mb: 0, photo_size_limit_mb: 0 }
      };
    }
  }

  /**
   * 將方案類型映射到配額等級名稱
   */
  private mapPlanTypeToLevelName(planType: string): string {
    const mapping: { [key: string]: string } = {
      'free': '基礎版',
      'free:create': '基礎版',
      'basic': '標準版',
      'premium': '進階版',
      'professional': '專業版'
    };
    
    return mapping[planType] || '基礎版';
  }

  /**
   * 格式化檔案大小
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
} 