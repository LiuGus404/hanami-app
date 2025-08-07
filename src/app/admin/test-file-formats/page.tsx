'use client';

import { useState } from 'react';
import { HanamiCard, HanamiButton } from '@/components/ui';
import { DEFAULT_MEDIA_LIMITS } from '@/types/progress';
import { FILE_LIMITS } from '@/lib/storageUtils';

export default function TestFileFormatsPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<string>('');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      validateFile(file);
    }
  };

  const validateFile = (file: File) => {
    const mediaType = file.type.startsWith('video/') ? 'video' : 'photo';
    const limits = DEFAULT_MEDIA_LIMITS[mediaType];
    
    let result = `檔案資訊:\n`;
    result += `名稱: ${file.name}\n`;
    result += `類型: ${file.type}\n`;
    result += `大小: ${(file.size / (1024 * 1024)).toFixed(2)}MB\n\n`;
    
    result += `媒體類型: ${mediaType}\n`;
    result += `支援的格式: ${limits.allowedTypes.join(', ')}\n\n`;
    
    if (limits.allowedTypes.includes(file.type)) {
      result += `✅ 檔案格式支援\n`;
    } else {
      result += `❌ 檔案格式不支援\n`;
    }
    
    const fileSizeMB = file.size / (1024 * 1024);
    const sizeLimitMB = limits.maxSize / (1024 * 1024);
    
    if (fileSizeMB <= sizeLimitMB) {
      result += `✅ 檔案大小符合限制 (${fileSizeMB.toFixed(2)}MB ≤ ${sizeLimitMB}MB)\n`;
    } else {
      result += `❌ 檔案大小超過限制 (${fileSizeMB.toFixed(2)}MB > ${sizeLimitMB}MB)\n`;
    }
    
    setValidationResult(result);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">檔案格式支援測試</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 檔案選擇區域 */}
        <HanamiCard className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">選擇檔案</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                選擇影片或相片檔案
              </label>
              <input
                type="file"
                accept="video/*,image/*"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            
            {selectedFile && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-2">已選擇檔案:</h3>
                <p className="text-sm text-gray-600">名稱: {selectedFile.name}</p>
                <p className="text-sm text-gray-600">類型: {selectedFile.type}</p>
                <p className="text-sm text-gray-600">大小: {(selectedFile.size / (1024 * 1024)).toFixed(2)}MB</p>
              </div>
            )}
          </div>
        </HanamiCard>

        {/* 驗證結果區域 */}
        <HanamiCard className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">驗證結果</h2>
          
          {validationResult ? (
            <div className="p-4 bg-gray-50 rounded-lg">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap">{validationResult}</pre>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-500">請選擇檔案進行驗證</p>
            </div>
          )}
        </HanamiCard>
      </div>

      {/* 支援的格式列表 */}
      <div className="mt-8">
        <HanamiCard className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">支援的檔案格式</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 影片格式 */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-3">影片格式</h3>
              <div className="space-y-2">
                {DEFAULT_MEDIA_LIMITS.video.allowedTypes.map((type, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">{type}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-xs text-gray-500">
                最大檔案大小: {DEFAULT_MEDIA_LIMITS.video.maxSize / (1024 * 1024)}MB
              </div>
            </div>

            {/* 相片格式 */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-3">相片格式</h3>
              <div className="space-y-2">
                {DEFAULT_MEDIA_LIMITS.photo.allowedTypes.map((type, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">{type}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-xs text-gray-500">
                最大檔案大小: {DEFAULT_MEDIA_LIMITS.photo.maxSize / (1024 * 1024)}MB
              </div>
            </div>
          </div>
        </HanamiCard>
      </div>

      {/* 常見格式說明 */}
      <div className="mt-8">
        <HanamiCard className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">常見格式說明</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-3">影片格式說明</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div><strong>MP4:</strong> 最常見的影片格式，支援度高</div>
                <div><strong>MOV:</strong> Apple QuickTime 格式</div>
                <div><strong>AVI:</strong> 傳統 Windows 影片格式</div>
                <div><strong>WebM:</strong> 網頁優化的影片格式</div>
                <div><strong>WMV:</strong> Windows Media 格式</div>
                <div><strong>M4V:</strong> iTunes 影片格式</div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-3">相片格式說明</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div><strong>JPEG:</strong> 最常見的相片格式，檔案小</div>
                <div><strong>PNG:</strong> 支援透明背景的格式</div>
                <div><strong>WebP:</strong> Google 開發的現代格式</div>
                <div><strong>GIF:</strong> 支援動畫的格式</div>
                <div><strong>BMP:</strong> Windows 點陣圖格式</div>
                <div><strong>TIFF:</strong> 高品質影像格式</div>
              </div>
            </div>
          </div>
        </HanamiCard>
      </div>
    </div>
  );
} 