'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function TestRegistrationPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

  const handleReapprove = async () => {
    if (!email) {
      toast.error('請輸入郵箱地址');
      return;
    }

    try {
      setLoading(true);
      
      // 首先獲取該郵箱的註冊申請
      const response = await fetch('/api/registration-requests');
      const result = await response.json();
      
      const request = result.data?.find((r: any) => r.email === email);
      
      if (!request) {
        toast.error('找不到該郵箱的註冊申請');
        return;
      }

      if (request.status === 'approved') {
        toast.error('該申請已經被批准了');
        return;
      }

      // 重新批准申請
      const approveResponse = await fetch('/api/registration-requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: request.id,
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: 'admin'
        }),
      });

      if (approveResponse.ok) {
        toast.success('註冊申請已重新批准！用戶帳號已創建，默認密碼為 "hanami123"');
        setEmail('');
      } else {
        const error = await approveResponse.json();
        toast.error(`批准失敗: ${error.error || '未知錯誤'}`);
      }
    } catch (error) {
      console.error('重新批准錯誤:', error);
      toast.error('重新批准過程中發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">重新批准註冊申請測試</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">郵箱地址</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="輸入要重新批准的郵箱"
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        
        <button
          onClick={handleReapprove}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? '處理中...' : '重新批准申請'}
        </button>
        
        <div className="mt-4 text-sm text-gray-600">
          <p>• 這將重新批准指定的註冊申請</p>
          <p>• 自動創建用戶帳號</p>
          <p>• 默認密碼為 "hanami123"</p>
        </div>
      </div>
    </div>
  );
} 