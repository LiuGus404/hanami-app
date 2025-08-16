'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function RemoveStorageLimit() {
  const [loading, setLoading] = useState(false);
  const [currentLimit, setCurrentLimit] = useState<string>('');

  const checkCurrentLimit = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('storage.buckets')
        .select('file_size_limit')
        .eq('name', 'hanami-media')
        .single();

      if (error) {
        toast.error(`檢查限制失敗: ${error.message}`);
        return;
      }

      const limitInMB = data.file_size_limit ? 
        Math.round(parseInt(data.file_size_limit) / 1024 / 1024) : 
        '無限制';
      
      setCurrentLimit(`${data.file_size_limit || '無限制'} bytes (${limitInMB} MB)`);
      toast.success(`當前限制: ${limitInMB} MB`);
    } catch (error) {
      toast.error(`檢查失敗: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const removeFileSizeLimit = async () => {
    setLoading(true);
    try {
      // 移除檔案大小限制
      const { error } = await (supabase as any)
        .rpc('remove_bucket_file_size_limit', { bucket_name: 'hanami-media' });

      if (error) {
        // 如果 RPC 函數不存在，使用直接 SQL 查詢
        const { error: updateError } = await (supabase as any)
          .from('storage.buckets')
          .update({ file_size_limit: null })
          .eq('name', 'hanami-media');

        if (updateError) {
          toast.error(`移除限制失敗: ${updateError.message}`);
          return;
        }
      }

      toast.success('檔案大小限制已移除！');
      setCurrentLimit('無限制');
    } catch (error) {
      toast.error(`移除失敗: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const setCustomLimit = async () => {
    const limit = prompt('請輸入檔案大小限制（MB）:', '500');
    if (!limit || isNaN(parseInt(limit))) {
      toast.error('請輸入有效的數字');
      return;
    }

    setLoading(true);
    try {
      const limitInBytes = parseInt(limit) * 1024 * 1024;
      
      const { error } = await (supabase as any)
        .from('storage.buckets')
        .update({ file_size_limit: limitInBytes.toString() })
        .eq('name', 'hanami-media');

      if (error) {
        toast.error(`設定限制失敗: ${error.message}`);
        return;
      }

      toast.success(`檔案大小限制已設定為 ${limit} MB`);
      setCurrentLimit(`${limitInBytes} bytes (${limit} MB)`);
    } catch (error) {
      toast.error(`設定失敗: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Storage 檔案大小限制管理</h1>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">說明</h2>
        <p className="text-blue-700">
          移除 bucket 的檔案大小限制後，系統將使用媒體配額設定中的限制來控制檔案上傳大小。
          這樣可以讓您更靈活地管理不同用戶的檔案上傳限制。
        </p>
      </div>

      <div className="space-y-4 mb-6">
        <button
          onClick={checkCurrentLimit}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? '檢查中...' : '檢查當前限制'}
        </button>
        
        <button
          onClick={removeFileSizeLimit}
          disabled={loading}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50 ml-4"
        >
          {loading ? '處理中...' : '移除檔案大小限制'}
        </button>

        <button
          onClick={setCustomLimit}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 ml-4"
        >
          {loading ? '處理中...' : '設定自定義限制'}
        </button>
      </div>

      {currentLimit && (
        <div className="bg-gray-100 border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">當前設定</h3>
          <p className="text-gray-700">檔案大小限制: {currentLimit}</p>
        </div>
      )}
    </div>
  );
} 