'use client';

import { HanamiCard } from '@/components/ui/HanamiCard';
import { HanamiButton } from '@/components/ui/HanamiButton';

export default function SupabaseUpgradeGuidePage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Supabase 升級指南</h1>
      
      <div className="grid gap-6">
        <HanamiCard className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-red-600">⚠️ 檔案大小限制問題</h2>
          <p className="mb-4">
            目前系統遇到 Supabase 免費計劃的檔案大小限制問題。當檔案超過 50MB 時，會出現 "Payload too large" 錯誤。
          </p>
          <div className="bg-yellow-50 p-4 rounded-lg mb-4">
            <h3 className="font-semibold mb-2">當前限制：</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Supabase 免費計劃：50MB 檔案大小限制</li>
              <li>您的媒體配額設定：影片 20MB，相片 1MB</li>
              <li>實際限制：以 Supabase 的 50MB 為準</li>
            </ul>
          </div>
        </HanamiCard>

        <HanamiCard className="p-6">
          <h2 className="text-xl font-semibold mb-4">🚀 解決方案 1：升級 Supabase 計劃</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Pro 計劃 ($25/月)：</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>檔案大小限制：5GB</li>
                <li>儲存空間：100GB</li>
                <li>頻寬：2TB</li>
                <li>支援更大的檔案上傳</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Team 計劃 ($599/月)：</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>檔案大小限制：5GB</li>
                <li>儲存空間：1TB</li>
                <li>頻寬：10TB</li>
                <li>企業級功能</li>
              </ul>
            </div>
            <HanamiButton
              onClick={() => window.open('https://supabase.com/pricing', '_blank')}
              variant="primary"
              className="w-full"
            >
              查看 Supabase 定價
            </HanamiButton>
          </div>
        </HanamiCard>

        <HanamiCard className="p-6">
          <h2 className="text-xl font-semibold mb-4">📁 解決方案 2：檔案壓縮</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">影片壓縮建議：</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>使用 HandBrake 或 FFmpeg 壓縮影片</li>
                <li>降低解析度到 720p 或 480p</li>
                <li>使用 H.264 編碼，降低比特率</li>
                <li>目標檔案大小：20MB 以下</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">圖片壓縮建議：</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>使用 TinyPNG 或 ImageOptim 壓縮</li>
                <li>降低解析度到 1920x1080 以下</li>
                <li>使用 WebP 格式</li>
                <li>目標檔案大小：1MB 以下</li>
              </ul>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <HanamiButton
                onClick={() => window.open('https://handbrake.fr/', '_blank')}
                variant="secondary"
                className="w-full"
              >
                HandBrake (影片壓縮)
              </HanamiButton>
              <HanamiButton
                onClick={() => window.open('https://tinypng.com/', '_blank')}
                variant="secondary"
                className="w-full"
              >
                TinyPNG (圖片壓縮)
              </HanamiButton>
            </div>
          </div>
        </HanamiCard>

        <HanamiCard className="p-6">
          <h2 className="text-xl font-semibold mb-4">⚙️ 解決方案 3：系統優化</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">已實施的優化：</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>✅ 自動檔案壓縮功能</li>
                <li>✅ 圖片 Canvas 壓縮</li>
                <li>✅ 檔案大小檢查</li>
                <li>✅ 錯誤處理改進</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">建議的媒體配額設定：</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>影片：20MB（符合 Supabase 限制）</li>
                <li>相片：1MB（符合 Supabase 限制）</li>
                <li>數量限制：根據您的需求設定</li>
              </ul>
            </div>
          </div>
        </HanamiCard>

        <HanamiCard className="p-6">
          <h2 className="text-xl font-semibold mb-4">📞 技術支援</h2>
          <div className="space-y-4">
            <p>
              如果您需要技術支援或有其他問題，請聯繫：
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <HanamiButton
                onClick={() => window.open('https://supabase.com/support', '_blank')}
                variant="secondary"
                className="w-full"
              >
                Supabase 支援
              </HanamiButton>
              <HanamiButton
                onClick={() => window.open('mailto:support@hanami.com', '_blank')}
                variant="secondary"
                className="w-full"
              >
                聯繫 Hanami 支援
              </HanamiButton>
            </div>
          </div>
        </HanamiCard>
      </div>
    </div>
  );
} 