'use client';

import { useState } from 'react';
import { HanamiCard, HanamiButton, HanamiInput } from '@/components/ui';

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
  created_at?: string;
  updated_at?: string;
}

export default function TestMediaQuotaApiPage() {
  const [quotaLevels, setQuotaLevels] = useState<QuotaLevel[]>([]);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<string>('');
  const [testLevel, setTestLevel] = useState<Partial<QuotaLevel>>({
    level_name: '測試等級',
    video_limit: 10,
    photo_limit: 20,
    storage_limit_mb: 500,
    video_size_limit_mb: 50,
    photo_size_limit_mb: 10,
    description: '測試用配額等級'
  });

  const testGetLevels = async () => {
    setLoading(true);
    setTestResult('');
    
    try {
      const response = await fetch('/api/media-quota-levels');
      const result = await response.json();
      
      setTestResult(`GET 測試結果:\n狀態碼: ${response.status}\n回應: ${JSON.stringify(result, null, 2)}`);
      
      if (result.success && result.data) {
        setQuotaLevels(result.data);
      }
    } catch (error) {
      setTestResult(`GET 測試錯誤: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testCreateLevel = async () => {
    setLoading(true);
    setTestResult('');
    
    try {
      const response = await fetch('/api/media-quota-levels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testLevel),
      });
      
      const result = await response.json();
      setTestResult(`POST 測試結果:\n狀態碼: ${response.status}\n回應: ${JSON.stringify(result, null, 2)}`);
      
      if (result.success) {
        testGetLevels(); // 重新載入列表
      }
    } catch (error) {
      setTestResult(`POST 測試錯誤: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testUpdateLevel = async (level: QuotaLevel) => {
    setLoading(true);
    setTestResult('');
    
    try {
      const updateData = {
        id: level.id,
        level_name: level.level_name + ' (已更新)',
        video_limit: level.video_limit + 5,
        photo_limit: level.photo_limit + 10,
        storage_limit_mb: level.storage_limit_mb + 100,
        video_size_limit_mb: level.video_size_limit_mb + 10,
        photo_size_limit_mb: level.photo_size_limit_mb + 5,
        description: level.description + ' (已更新)',
      };
      
      const response = await fetch('/api/media-quota-levels', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      const result = await response.json();
      setTestResult(`PUT 測試結果:\n狀態碼: ${response.status}\n請求資料: ${JSON.stringify(updateData, null, 2)}\n回應: ${JSON.stringify(result, null, 2)}`);
      
      if (result.success) {
        testGetLevels(); // 重新載入列表
      }
    } catch (error) {
      setTestResult(`PUT 測試錯誤: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testToggleActive = async (level: QuotaLevel) => {
    setLoading(true);
    setTestResult('');
    
    try {
      const response = await fetch('/api/media-quota-levels', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: level.id,
          is_active: !level.is_active,
        }),
      });
      
      const result = await response.json();
      setTestResult(`切換狀態測試結果:\n狀態碼: ${response.status}\n回應: ${JSON.stringify(result, null, 2)}`);
      
      if (result.success) {
        testGetLevels(); // 重新載入列表
      }
    } catch (error) {
      setTestResult(`切換狀態測試錯誤: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testDeleteLevel = async (levelId: string) => {
    if (!confirm('確定要刪除此測試等級嗎？')) {
      return;
    }
    
    setLoading(true);
    setTestResult('');
    
    try {
      const response = await fetch(`/api/media-quota-levels?id=${levelId}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      setTestResult(`DELETE 測試結果:\n狀態碼: ${response.status}\n回應: ${JSON.stringify(result, null, 2)}`);
      
      if (result.success) {
        testGetLevels(); // 重新載入列表
      }
    } catch (error) {
      setTestResult(`DELETE 測試錯誤: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const fixData = async () => {
    if (!confirm('確定要修復資料庫問題嗎？這將清理重複記錄並修復資料完整性。')) {
      return;
    }
    
    setLoading(true);
    setTestResult('');
    
    try {
      const response = await fetch('/api/fix-media-quota-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      setTestResult(`資料修復結果:\n狀態碼: ${response.status}\n回應: ${JSON.stringify(result, null, 2)}`);
      
      if (result.success) {
        testGetLevels(); // 重新載入列表
      }
    } catch (error) {
      setTestResult(`資料修復錯誤: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">媒體配額 API 測試</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 測試控制面板 */}
        <div className="space-y-6">
          <HanamiCard className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">API 測試</h2>
            
            <div className="space-y-4">
              <HanamiButton
                variant="primary"
                onClick={testGetLevels}
                disabled={loading}
                className="w-full"
              >
                {loading ? '測試中...' : '測試 GET /api/media-quota-levels'}
              </HanamiButton>
              
              <HanamiButton
                variant="secondary"
                onClick={testCreateLevel}
                disabled={loading}
                className="w-full"
              >
                {loading ? '測試中...' : '測試 POST /api/media-quota-levels'}
              </HanamiButton>
              
              <HanamiButton
                variant="danger"
                onClick={fixData}
                disabled={loading}
                className="w-full"
              >
                {loading ? '修復中...' : '修復資料庫問題'}
              </HanamiButton>
            </div>
          </HanamiCard>

          {/* 創建測試資料 */}
          <HanamiCard className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">創建測試資料</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  等級名稱
                </label>
                <HanamiInput
                  value={testLevel.level_name || ''}
                  onChange={(e) => setTestLevel(prev => ({ ...prev, level_name: e.target.value }))}
                  placeholder="測試等級"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    影片配額
                  </label>
                  <HanamiInput
                    type="number"
                    value={testLevel.video_limit || 0}
                    onChange={(e) => setTestLevel(prev => ({ ...prev, video_limit: parseInt(e.target.value) || 0 }))}
                    placeholder="10"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    相片配額
                  </label>
                  <HanamiInput
                    type="number"
                    value={testLevel.photo_limit || 0}
                    onChange={(e) => setTestLevel(prev => ({ ...prev, photo_limit: parseInt(e.target.value) || 0 }))}
                    placeholder="20"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  儲存空間限制 (MB)
                </label>
                <HanamiInput
                  type="number"
                  value={testLevel.storage_limit_mb || 0}
                  onChange={(e) => setTestLevel(prev => ({ ...prev, storage_limit_mb: parseInt(e.target.value) || 0 }))}
                  placeholder="500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    影片大小限制 (MB)
                  </label>
                  <HanamiInput
                    type="number"
                    value={testLevel.video_size_limit_mb || 0}
                    onChange={(e) => setTestLevel(prev => ({ ...prev, video_size_limit_mb: parseInt(e.target.value) || 0 }))}
                    placeholder="50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    相片大小限制 (MB)
                  </label>
                  <HanamiInput
                    type="number"
                    value={testLevel.photo_size_limit_mb || 0}
                    onChange={(e) => setTestLevel(prev => ({ ...prev, photo_size_limit_mb: parseInt(e.target.value) || 0 }))}
                    placeholder="10"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  描述
                </label>
                <HanamiInput
                  value={testLevel.description || ''}
                  onChange={(e) => setTestLevel(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="測試用配額等級"
                />
              </div>
            </div>
          </HanamiCard>
        </div>

        {/* 測試結果 */}
        <div className="space-y-6">
          <HanamiCard className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">測試結果</h2>
            
            {testResult ? (
              <div className="p-4 bg-gray-50 rounded-lg">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap overflow-auto max-h-96">{testResult}</pre>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-500">點擊上方按鈕開始測試</p>
              </div>
            )}
          </HanamiCard>

          {/* 配額等級列表 */}
          <HanamiCard className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">配額等級列表</h2>
            
            {quotaLevels.length === 0 ? (
              <p className="text-gray-500">尚未載入配額等級</p>
            ) : (
              <div className="space-y-4">
                {quotaLevels.map((level) => (
                  <div key={level.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-800">{level.level_name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        level.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {level.is_active ? '啟用' : '停用'}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-3">
                      <p>影片: {level.video_limit} 個 (最大 {level.video_size_limit_mb}MB)</p>
                      <p>相片: {level.photo_limit} 個 (最大 {level.photo_size_limit_mb}MB)</p>
                      <p>儲存空間: {level.storage_limit_mb}MB</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <HanamiButton
                        variant="secondary"
                        size="sm"
                        onClick={() => testUpdateLevel(level)}
                        disabled={loading}
                      >
                        測試更新
                      </HanamiButton>
                      
                      <HanamiButton
                        variant="secondary"
                        size="sm"
                        onClick={() => testToggleActive(level)}
                        disabled={loading}
                      >
                        切換狀態
                      </HanamiButton>
                      
                      <HanamiButton
                        variant="danger"
                        size="sm"
                        onClick={() => testDeleteLevel(level.id)}
                        disabled={loading}
                      >
                        測試刪除
                      </HanamiButton>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </HanamiCard>
        </div>
      </div>
    </div>
  );
} 