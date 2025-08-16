'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function TestStorageLimitsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testStorageLimits = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // 測試 1: 檢查 bucket 是否存在
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        throw new Error(`Bucket 列表錯誤: ${bucketsError.message}`);
      }

      const hanamiMediaBucket = buckets.find(bucket => bucket.name === 'hanami-media');
      
      if (!hanamiMediaBucket) {
        throw new Error('hanami-media bucket 不存在');
      }

      // 測試 2: 檢查 bucket 的 RLS 政策
      const { data: policies, error: policiesError } = await supabase.storage.getBucket('hanami-media');
      
      if (policiesError) {
        throw new Error(`Bucket 政策錯誤: ${policiesError.message}`);
      }

      // 測試 3: 嘗試上傳一個小檔案
      const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('hanami-media')
        .upload(`test/${Date.now()}_test.txt`, testFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`上傳測試錯誤: ${uploadError.message}`);
      }

      // 測試 4: 刪除測試檔案
      if (uploadData.path) {
        await supabase.storage
          .from('hanami-media')
          .remove([uploadData.path]);
      }

      setResult({
        buckets: buckets.map(b => ({ name: b.name, public: b.public })),
        hanamiMediaBucket: {
          name: hanamiMediaBucket.name,
          public: hanamiMediaBucket.public,
          fileSizeLimit: (hanamiMediaBucket as any).file_size_limit,
          allowedMimeTypes: (hanamiMediaBucket as any).allowed_mime_types
        },
        uploadTest: '成功',
        policies: policies
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : '未知錯誤');
    } finally {
      setLoading(false);
    }
  };

  const testLargeFileUpload = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // 創建一個 25MB 的測試檔案
      const size = 25 * 1024 * 1024; // 25MB
      const buffer = new ArrayBuffer(size);
      const testFile = new File([buffer], 'test-25mb.bin', { type: 'application/octet-stream' });

      console.log('開始上傳 25MB 測試檔案...');
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('hanami-media')
        .upload(`test/${Date.now()}_25mb_test.bin`, testFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`大檔案上傳錯誤: ${uploadError.message}`);
      }

      // 刪除測試檔案
      if (uploadData.path) {
        await supabase.storage
          .from('hanami-media')
          .remove([uploadData.path]);
      }

      setResult({
        largeFileUpload: '成功',
        fileSize: '25MB',
        uploadData
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : '未知錯誤');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Storage 限制測試</h1>
      
      <div className="grid gap-6">
        <HanamiCard className="p-6">
          <h2 className="text-xl font-semibold mb-4">基本 Storage 測試</h2>
          <HanamiButton
            onClick={testStorageLimits}
            disabled={loading}
            className="w-full"
            variant="primary"
          >
            {loading ? '測試中...' : '測試 Storage 配置'}
          </HanamiButton>
        </HanamiCard>

        <HanamiCard className="p-6">
          <h2 className="text-xl font-semibold mb-4">大檔案上傳測試</h2>
          <HanamiButton
            onClick={testLargeFileUpload}
            disabled={loading}
            className="w-full"
            variant="secondary"
          >
            {loading ? '上傳中...' : '測試 25MB 檔案上傳'}
          </HanamiButton>
        </HanamiCard>

        {error && (
          <HanamiCard className="p-6 bg-red-50">
            <h2 className="text-xl font-semibold mb-4 text-red-600">錯誤</h2>
            <pre className="text-sm text-red-700 whitespace-pre-wrap">{error}</pre>
          </HanamiCard>
        )}

        {result && (
          <HanamiCard className="p-6">
            <h2 className="text-xl font-semibold mb-4">測試結果</h2>
            <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(result, null, 2)}
            </pre>
          </HanamiCard>
        )}
      </div>
    </div>
  );
} 