'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function UpdateFailedRecordPage() {
  const [requestId, setRequestId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdateFailedRecord = async () => {
    if (!requestId.trim()) {
      toast.error('請輸入請求ID');
      return;
    }

    try {
      setLoading(true);

      // 您提供的引用來源數據
      const citations = [
        "https://guaguasayslp.com/story-grammer-story-structure/",
        "https://www.youtube.com/watch?v=F6njzqg-v8w",
        "https://reading.cw.com.tw/news-article/258",
        "https://www.books.com.tw/products/0010818133",
        "https://vocus.cc/article/625f80e9fd89780001b930d2",
        "https://www.books.com.tw/products/0010888616",
        "https://www.books.com.tw/products/0010925282",
        "https://techpro.tp.edu.tw/techpro-server/repository/static/%E5%B9%BC%E5%85%92%E5%9C%92%E9%81%8B%E7%AE%97%E6%80%9D%E7%B6%AD-109_%E7%AC%AC1%E6%9C%9F/pdf/v14.pdf",
        "https://cavessharing.cavesbooks.com.tw/2024/07/11/%E5%AD%A9%E5%AD%90%E7%9A%84%E5%A4%AA%E7%A9%BA%E5%86%92%E9%9A%AA%E4%B9%8B%E6%97%85%EF%BC%9A%E3%80%8Aspace-song-rocket-ride%E3%80%8B%E6%9C%89%E8%81%B2%E6%9B%B8%E7%B9%AA%E6%9C%AC%E6%8E%A8%E8%96%A6/",
        "https://hef.org.tw/journal395-6/",
        "https://zh.wikipedia.org/zh-hant/%E6%98%9F%E9%9A%9B%E6%95%91%E6%8F%B4",
        "https://intuitor.pixnet.net/blog/post/33663721",
        "https://vocus.cc/article/669df2dffd897800010be072",
        "https://zh.wikipedia.org/zh-hant/%E9%98%BF%E6%B3%A2%E7%BD%9713%E5%8F%B7_(%E7%94%B5%E5%BD%B1)",
        "https://www.limaogushi.com/g/35216.html",
        "https://www.elle.com/tw/entertainment/drama/a65344416/elio/"
      ];

      const response = await fetch('/api/ai-tools/update-failed-record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_id: requestId,
          citations: citations
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('失敗記錄已成功更新！');
        setRequestId('');
      } else {
        toast.error(`更新失敗: ${result.error}`);
      }
    } catch (error) {
      console.error('更新失敗記錄錯誤:', error);
      toast.error('更新失敗記錄時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">更新失敗記錄</h1>
      
      <div className="bg-white p-6 rounded-lg border max-w-md">
        <h2 className="text-lg font-semibold mb-4">更新失敗記錄的引用來源</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              請求ID
            </label>
            <input
              type="text"
              value={requestId}
              onChange={(e) => setRequestId(e.target.value)}
              placeholder="輸入失敗記錄的請求ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button
            onClick={handleUpdateFailedRecord}
            disabled={loading || !requestId.trim()}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '更新中...' : '更新失敗記錄'}
          </button>
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          <p>• 此功能會將引用來源信息添加到失敗的記錄中</p>
          <p>• 更新後可以在AI工具狀態面板中查看詳細信息</p>
          <p>• 引用來源包含17個相關的太空和故事相關資源</p>
        </div>
      </div>
    </div>
  );
} 