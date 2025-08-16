'use client';

import { HanamiCard } from '@/components/ui/HanamiCard';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { 
  ExclamationTriangleIcon, 
  InformationCircleIcon,
  DocumentArrowUpIcon,
  VideoCameraIcon,
  PhotoIcon,
  CogIcon
} from '@heroicons/react/24/outline';

export default function FileUploadGuidePage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">檔案上傳指南</h1>
      
      <div className="grid gap-6">
        {/* 檔案大小限制說明 */}
        <HanamiCard className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-4">
            <InformationCircleIcon className="h-8 w-8 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-semibold text-blue-800 mb-2">ℹ️ 檔案大小限制說明</h2>
              <p className="text-blue-700 mb-3">
                您的系統使用 Supabase Pro 版本，支援更大的檔案上傳。檔案大小限制由您的 Supabase 設定決定。
              </p>
              <div className="bg-white p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">當前設定：</h3>
                <ul className="text-blue-700 space-y-1">
                  <li>• Supabase Pro 版本：支援更大的檔案上傳</li>
                  <li>• 您的媒體配額設定：影片 <strong>20MB</strong>，相片 <strong>1MB</strong></li>
                  <li>• 實際限制：由您的 Supabase 設定決定</li>
                </ul>
              </div>
            </div>
          </div>
        </HanamiCard>

        {/* 檔案類型指南 */}
        <HanamiCard className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <DocumentArrowUpIcon className="h-6 w-6" />
            支援的檔案類型
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* 影片檔案 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <VideoCameraIcon className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">影片檔案</h3>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-700 mb-2">支援格式：</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• MP4 (.mp4)</li>
                  <li>• MOV (.mov)</li>
                  <li>• AVI (.avi)</li>
                  <li>• WebM (.webm)</li>
                  <li>• 其他常見影片格式</li>
                </ul>
                <p className="text-sm text-gray-700 mt-3">
                  <strong>建議：</strong> 使用 H.264 編碼，解析度不超過 1080p
                </p>
              </div>
            </div>

            {/* 圖片檔案 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <PhotoIcon className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold">圖片檔案</h3>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-700 mb-2">支援格式：</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• JPEG (.jpg, .jpeg)</li>
                  <li>• PNG (.png)</li>
                  <li>• WebP (.webp)</li>
                  <li>• GIF (.gif)</li>
                  <li>• 其他常見圖片格式</li>
                </ul>
                <p className="text-sm text-gray-700 mt-3">
                  <strong>建議：</strong> 使用 WebP 格式以獲得更好的壓縮效果
                </p>
              </div>
            </div>
          </div>
        </HanamiCard>

        {/* 檔案壓縮指南 */}
        <HanamiCard className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <CogIcon className="h-6 w-6" />
            檔案壓縮指南
          </h2>
          
          <div className="space-y-6">
            {/* 影片壓縮 */}
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <VideoCameraIcon className="h-5 w-5 text-blue-600" />
                影片壓縮方法
              </h3>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">線上工具：</h4>
                <ul className="text-blue-700 space-y-1 mb-3">
                  <li>• <a href="https://www.onlinevideoconverter.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">Online Video Converter</a></li>
                  <li>• <a href="https://www.youcompress.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">YouCompress</a></li>
                  <li>• <a href="https://www.media.io/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">Media.io</a></li>
                </ul>
                
                <h4 className="font-semibold text-blue-800 mb-2">桌面軟體：</h4>
                <ul className="text-blue-700 space-y-1 mb-3">
                  <li>• <strong>HandBrake</strong> (免費，跨平台)</li>
                  <li>• <strong>FFmpeg</strong> (免費，命令行)</li>
                  <li>• <strong>VLC Media Player</strong> (免費，內建轉換功能)</li>
                </ul>
                
                <h4 className="font-semibold text-blue-800 mb-2">壓縮建議：</h4>
                <ul className="text-blue-700 space-y-1">
                  <li>• 解析度：720p 或更低</li>
                  <li>• 編碼：H.264</li>
                  <li>• 位元率：1-2 Mbps</li>
                  <li>• 音訊：AAC，128 kbps</li>
                </ul>
              </div>
            </div>

            {/* 圖片壓縮 */}
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <PhotoIcon className="h-5 w-5 text-green-600" />
                圖片壓縮方法
              </h3>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">線上工具：</h4>
                <ul className="text-green-700 space-y-1 mb-3">
                  <li>• <a href="https://tinypng.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-green-900">TinyPNG</a></li>
                  <li>• <a href="https://squoosh.app/" target="_blank" rel="noopener noreferrer" className="underline hover:text-green-900">Squoosh</a></li>
                  <li>• <a href="https://www.iloveimg.com/compress_image" target="_blank" rel="noopener noreferrer" className="underline hover:text-green-900">iLoveIMG</a></li>
                </ul>
                
                <h4 className="font-semibold text-green-800 mb-2">桌面軟體：</h4>
                <ul className="text-green-700 space-y-1 mb-3">
                  <li>• <strong>GIMP</strong> (免費，跨平台)</li>
                  <li>• <strong>Paint.NET</strong> (免費，Windows)</li>
                  <li>• <strong>ImageOptim</strong> (免費，macOS)</li>
                </ul>
                
                <h4 className="font-semibold text-green-800 mb-2">壓縮建議：</h4>
                <ul className="text-green-700 space-y-1">
                  <li>• 解析度：不超過 1920x1080</li>
                  <li>• 格式：WebP 或 JPEG</li>
                  <li>• 品質：70-80%</li>
                  <li>• 檔案大小：目標小於 1MB</li>
                </ul>
              </div>
            </div>
          </div>
        </HanamiCard>

        {/* 系統自動壓縮 */}
        <HanamiCard className="p-6 bg-blue-50">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <InformationCircleIcon className="h-6 w-6 text-blue-600" />
            系統自動壓縮功能
          </h2>
          <div className="space-y-3">
            <p className="text-blue-800">
              我們的系統已經內建了自動壓縮功能，會在上傳時自動處理檔案：
            </p>
            <ul className="text-blue-700 space-y-2">
              <li>• <strong>圖片檔案：</strong> 自動調整解析度至 1280px，品質降至 60%</li>
              <li>• <strong>影片檔案：</strong> 檢查檔案大小，超過配額時會顯示警告</li>
              <li>• <strong>檔案驗證：</strong> 上傳前會檢查檔案類型和大小</li>
              <li>• <strong>錯誤提示：</strong> 詳細的錯誤訊息和建議</li>
            </ul>
            <p className="text-blue-800 font-semibold">
              💡 提示：即使有自動壓縮，建議在上傳前先手動壓縮大檔案，以獲得最佳效果。
            </p>
          </div>
        </HanamiCard>

        {/* 配額管理 */}
        <HanamiCard className="p-6 bg-purple-50">
          <h2 className="text-xl font-semibold mb-4 text-purple-800">
            📊 配額管理說明
          </h2>
          <div className="space-y-3">
            <p className="text-purple-700">
              系統會根據您的媒體配額設定來管理檔案上傳：
            </p>
            <ul className="text-purple-700 space-y-1">
              <li>• <strong>影片配額：</strong> 每個檔案 ≤ 20MB，最多 5 個</li>
              <li>• <strong>圖片配額：</strong> 每個檔案 ≤ 1MB，最多 10 張</li>
              <li>• <strong>容量管理：</strong> 根據學生計劃類型分配總容量</li>
            </ul>
            <p className="text-purple-700 mt-3">
              <strong>注意：</strong> 即使檔案超過配額限制，系統也會嘗試上傳，但會顯示警告訊息。
            </p>
          </div>
        </HanamiCard>

        {/* 返回按鈕 */}
        <div className="text-center">
          <HanamiButton
            onClick={() => window.history.back()}
            variant="secondary"
            className="px-6 py-3"
          >
            返回上一頁
          </HanamiButton>
        </div>
      </div>
    </div>
  );
} 