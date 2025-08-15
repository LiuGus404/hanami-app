'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { HanamiButton, HanamiCard } from '@/components/ui';

export default function TestMediaQuotaUpdatePage() {
  const [loading, setLoading] = useState(false);
  const [quotaLevels, setQuotaLevels] = useState<any[]>([]);
  const [checkResult, setCheckResult] = useState<any>(null);

  const updateMediaQuotaLevels = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/update-media-quota-levels', {
        method: 'POST'
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('媒體配額等級更新成功');
        console.log('更新結果:', result);
      } else {
        toast.error(`更新失敗: ${result.error}`);
        console.error('更新失敗:', result);
      }
    } catch (error) {
      toast.error('更新過程中發生錯誤');
      console.error('更新錯誤:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAndFixQuotaLevels = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/check-and-fix-quota-levels', {
        method: 'POST'
      });

      const result = await response.json();

      if (response.ok) {
        setCheckResult(result);
        if (result.updated) {
          toast.success('配額等級設定已修復');
        } else {
          toast.success('配額等級設定已正確');
        }
        console.log('檢查結果:', result);
      } else {
        toast.error(`檢查失敗: ${result.error}`);
        console.error('檢查失敗:', result);
      }
    } catch (error) {
      toast.error('檢查過程中發生錯誤');
      console.error('檢查錯誤:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadQuotaLevels = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/media-quota-levels');
      const result = await response.json();

      if (response.ok) {
        setQuotaLevels(result.data || []);
        toast.success('配額等級載入成功');
      } else {
        toast.error(`載入失敗: ${result.error}`);
      }
    } catch (error) {
      toast.error('載入過程中發生錯誤');
      console.error('載入錯誤:', error);
    } finally {
      setLoading(false);
    }
  };

  const testFileValidation = () => {
    // 創建測試檔案
    const testVideoFile = new File(['test'], 'test.mp4', { type: 'video/mp4' });
    const testPhotoFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    console.log('測試檔案大小限制:');
    console.log('影片檔案大小:', testVideoFile.size, 'bytes');
    console.log('相片檔案大小:', testPhotoFile.size, 'bytes');

    const videoSizeMB = testVideoFile.size / (1024 * 1024);
    const photoSizeMB = testPhotoFile.size / (1024 * 1024);

    console.log('影片檔案大小 (MB):', videoSizeMB);
    console.log('相片檔案大小 (MB):', photoSizeMB);

    const videoSizeLimit = 20; // MB
    const photoSizeLimit = 1; // MB

    console.log('影片大小限制檢查:', videoSizeMB <= videoSizeLimit ? '通過' : '失敗');
    console.log('相片大小限制檢查:', photoSizeMB <= photoSizeLimit ? '通過' : '失敗');

    toast.success('檔案驗證測試完成，請查看控制台');
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">媒體配額設定更新測試</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <HanamiCard className="p-6">
          <h2 className="text-xl font-semibold mb-4">更新操作</h2>
          <div className="space-y-4">
            <HanamiButton
              onClick={checkAndFixQuotaLevels}
              disabled={loading}
              className="w-full"
              variant="primary"
            >
              {loading ? '檢查中...' : '檢查並修復配額等級'}
            </HanamiButton>
            
            <HanamiButton
              onClick={updateMediaQuotaLevels}
              disabled={loading}
              className="w-full"
            >
              {loading ? '更新中...' : '更新媒體配額等級'}
            </HanamiButton>
            
            <HanamiButton
              onClick={loadQuotaLevels}
              disabled={loading}
              variant="secondary"
              className="w-full"
            >
              {loading ? '載入中...' : '載入配額等級'}
            </HanamiButton>
            
            <HanamiButton
              onClick={testFileValidation}
              variant="cute"
              className="w-full"
            >
              測試檔案驗證
            </HanamiButton>
          </div>
        </HanamiCard>

        <HanamiCard className="p-6">
          <h2 className="text-xl font-semibold mb-4">當前配額等級</h2>
          <div className="space-y-4">
            {quotaLevels.map((level) => (
              <div key={level.id} className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg">{level.level_name}</h3>
                <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                  <div>影片限制: {level.video_limit}個</div>
                  <div>相片限制: {level.photo_limit}張</div>
                  <div>影片大小: {level.video_size_limit_mb}MB</div>
                  <div>相片大小: {level.photo_size_limit_mb}MB</div>
                  <div>儲存空間: {level.storage_limit_mb}MB</div>
                </div>
              </div>
            ))}
          </div>
        </HanamiCard>
      </div>

      {checkResult && (
        <HanamiCard className="p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">檢查結果</h2>
          <div className="space-y-2">
            <p><strong>狀態:</strong> {checkResult.updated ? '已更新' : '已正確'}</p>
            <p><strong>訊息:</strong> {checkResult.message}</p>
            {checkResult.updateDetails && checkResult.updateDetails.length > 0 && (
              <div>
                <p><strong>更新詳情:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  {checkResult.updateDetails.map((detail: string, index: number) => (
                    <li key={index} className="text-sm text-gray-600">{detail}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </HanamiCard>
      )}

      <HanamiCard className="p-6 mt-6">
        <h2 className="text-xl font-semibold mb-4">更新說明</h2>
        <div className="space-y-2 text-sm">
          <p><strong>影片限制:</strong> 最多 5 個，每個 ≤ 20MB</p>
          <p><strong>相片限制:</strong> 最多 10 張，每張 ≤ 1MB</p>
          <p><strong>更新內容:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>基礎版影片大小限制從 50MB 改為 20MB</li>
            <li>基礎版相片大小限制從 10MB 改為 1MB</li>
            <li>移除影片時長限制</li>
            <li>更新所有相關的驗證邏輯</li>
            <li>前端和後端都使用配額等級的動態設定</li>
          </ul>
        </div>
      </HanamiCard>
    </div>
  );
} 