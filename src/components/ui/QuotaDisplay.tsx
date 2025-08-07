'use client';

import { useState, useEffect } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { HanamiCard } from '@/components/ui';

interface QuotaInfo {
  student_id: string;
  plan_type: string;
  level_name: string;
  current_usage: {
    video_count: number;
    photo_count: number;
    total_used_space: number;
    total_used_space_formatted: string;
  };
  limits: {
    video_limit: number;
    photo_limit: number;
    storage_limit_mb: number;
    storage_limit_formatted: string;
    video_size_limit_mb: number;
    photo_size_limit_mb: number;
  };
  usage_percentages: {
    video: number;
    photo: number;
    storage: number;
  };
  can_upload: {
    video: boolean;
    photo: boolean;
    storage: boolean;
  };
}

interface QuotaDisplayProps {
  studentId: string;
  className?: string;
}

export default function QuotaDisplay({ studentId, className = '' }: QuotaDisplayProps) {
  const [quotaInfo, setQuotaInfo] = useState<QuotaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (studentId) {
      loadQuotaInfo();
    }
  }, [studentId]);

  const loadQuotaInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/student-media/quota/${studentId}`);
      
      if (!response.ok) {
        throw new Error('無法獲取配額資訊');
      }

      const data = await response.json();
      setQuotaInfo(data.data);
    } catch (err) {
      console.error('載入配額資訊失敗:', err);
      setError(err instanceof Error ? err.message : '載入失敗');
    } finally {
      setLoading(false);
    }
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-orange-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-orange-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <HanamiCard className={`p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </HanamiCard>
    );
  }

  if (error || !quotaInfo) {
    return (
      <HanamiCard className={`p-4 ${className}`}>
        <div className="text-red-600 text-sm">
          {error || '無法載入配額資訊'}
        </div>
      </HanamiCard>
    );
  }

  return (
    <HanamiCard className={`p-4 ${className}`}>
      <div className="space-y-3">
        {/* 標題和展開按鈕 */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              {quotaInfo.level_name} 配額
            </h3>
            <p className="text-sm text-gray-600">
              方案類型: {quotaInfo.plan_type}
            </p>
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            {showDetails ? (
              <ChevronUpIcon className="h-5 w-5 text-gray-600" />
            ) : (
              <ChevronDownIcon className="h-5 w-5 text-gray-600" />
            )}
          </button>
        </div>

        {/* 基本配額資訊 */}
        <div className="grid grid-cols-2 gap-4">
          {/* 影片配額 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">影片</span>
              <span className={`text-sm font-semibold ${getUsageColor(quotaInfo.usage_percentages.video)}`}>
                {quotaInfo.current_usage.video_count} / {quotaInfo.limits.video_limit}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${getProgressBarColor(quotaInfo.usage_percentages.video)}`}
                style={{ width: `${Math.min(quotaInfo.usage_percentages.video, 100)}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500">
              單檔限制: {quotaInfo.limits.video_size_limit_mb}MB
            </div>
          </div>

          {/* 相片配額 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">相片</span>
              <span className={`text-sm font-semibold ${getUsageColor(quotaInfo.usage_percentages.photo)}`}>
                {quotaInfo.current_usage.photo_count} / {quotaInfo.limits.photo_limit}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${getProgressBarColor(quotaInfo.usage_percentages.photo)}`}
                style={{ width: `${Math.min(quotaInfo.usage_percentages.photo, 100)}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500">
              單檔限制: {quotaInfo.limits.photo_size_limit_mb}MB
            </div>
          </div>
        </div>

        {/* 儲存空間 */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">儲存空間</span>
            <span className={`text-sm font-semibold ${getUsageColor(quotaInfo.usage_percentages.storage)}`}>
              {quotaInfo.current_usage.total_used_space_formatted} / {quotaInfo.limits.storage_limit_formatted}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getProgressBarColor(quotaInfo.usage_percentages.storage)}`}
              style={{ width: `${Math.min(quotaInfo.usage_percentages.storage, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* 詳細資訊 */}
        {showDetails && (
          <div className="pt-3 border-t border-gray-200 space-y-2">
            <div className="text-xs text-gray-600 space-y-1">
              <div className="flex justify-between">
                <span>可上傳影片:</span>
                <span className={quotaInfo.can_upload.video ? 'text-green-600' : 'text-red-600'}>
                  {quotaInfo.can_upload.video ? '是' : '否'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>可上傳相片:</span>
                <span className={quotaInfo.can_upload.photo ? 'text-green-600' : 'text-red-600'}>
                  {quotaInfo.can_upload.photo ? '是' : '否'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>儲存空間充足:</span>
                <span className={quotaInfo.can_upload.storage ? 'text-green-600' : 'text-red-600'}>
                  {quotaInfo.can_upload.storage ? '是' : '否'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 警告訊息 */}
        {quotaInfo.usage_percentages.storage >= 90 && (
          <div className="p-2 bg-red-50 border border-red-200 rounded-md">
            <p className="text-xs text-red-700">
              ⚠️ 儲存空間即將用完，請考慮升級方案或清理舊檔案
            </p>
          </div>
        )}
      </div>
    </HanamiCard>
  );
} 