'use client';

import { useState } from 'react';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';
import HanamiInput from '@/components/ui/HanamiInput';

export default function QuickApprovePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [requestId, setRequestId] = useState('935c68da-db3c-4127-97e8-6c83aafe825d'); // 預設填入已知的申請ID

  const quickApprove = async () => {
    if (!requestId) {
      setResult('❌ 請先輸入申請ID');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      console.log('開始快速批准申請:', requestId);

      // 1. 先獲取申請詳情
      const getResponse = await fetch('/api/registration-requests', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!getResponse.ok) {
        throw new Error(`獲取申請列表失敗: ${getResponse.status}`);
      }

      const getData = await getResponse.json();
      const request = getData.data?.find((r: any) => r.id === requestId);

      if (!request) {
        throw new Error(`找不到申請ID: ${requestId}`);
      }

      console.log('找到申請:', request);

      // 2. 批准申請
      const approveResponse = await fetch('/api/registration-requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: requestId,
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          rejection_reason: null
        }),
      });

      if (!approveResponse.ok) {
        const errorData = await approveResponse.json();
        throw new Error(`批准失敗: ${errorData.error || '未知錯誤'}`);
      }

      const approveData = await approveResponse.json();
      console.log('批准成功:', approveData);

      setResult(`✅ 申請批准成功！\n\n申請詳情:\n- ID: ${request.id}\n- 郵箱: ${request.email}\n- 姓名: ${request.full_name}\n- 角色: ${request.role}\n- 狀態: ${request.status}\n\n現在用戶應該可以登入了！`);

    } catch (error) {
      console.error('快速批准錯誤:', error);
      setResult(`❌ 快速批准失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    if (!requestId) {
      setResult('❌ 請先輸入申請ID');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      const response = await fetch(`/api/test-check-registration-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'liugushk@gmail.com' }) // 使用已知的郵箱
      });

      if (!response.ok) {
        throw new Error(`檢查狀態失敗: ${response.status}`);
      }

      const data = await response.json();
      
      let statusInfo = `=== 申請狀態檢查 ===\n`;
      statusInfo += `申請ID: ${requestId}\n郵箱: liugushk@gmail.com\n\n`;

      if (data.registration_requests?.found) {
        const requests = data.registration_requests.data;
        statusInfo += `找到 ${requests.length} 個註冊申請:\n`;
        
        requests.forEach((req: any, index: number) => {
          statusInfo += `\n申請 ${index + 1}:\n`;
          statusInfo += `- ID: ${req.id}\n`;
          statusInfo += `- 狀態: ${req.status}\n`;
          statusInfo += `- 角色: ${req.role}\n`;
          statusInfo += `- 姓名: ${req.full_name}\n`;
        });
      } else {
        statusInfo += `❌ 未找到註冊申請\n`;
      }

      statusInfo += `\n=== 權限記錄 ===\n`;
      if (data.hanami_user_permissions_v2?.found) {
        statusInfo += `✅ 找到權限記錄\n`;
      } else {
        statusInfo += `❌ 未找到權限記錄\n`;
      }

      statusInfo += `\n=== 用戶帳號 ===\n`;
      if (data.hanami_employee?.found) {
        statusInfo += `✅ 找到教師帳號\n`;
      } else {
        statusInfo += `❌ 未找到教師帳號\n`;
      }

      setResult(statusInfo);

    } catch (error) {
      console.error('檢查狀態錯誤:', error);
      setResult(`❌ 檢查狀態失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-[#4B4036]">快速批准工具</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 批准輸入區域 */}
        <HanamiCard className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-[#4B4036]">批准申請</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#4B4036] mb-2">
                申請ID
              </label>
              <HanamiInput
                value={requestId}
                onChange={(e) => setRequestId(e.target.value)}
                placeholder="請輸入申請ID"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <HanamiButton
                onClick={quickApprove}
                disabled={loading || !requestId}
                variant="primary"
              >
                {loading ? '批准中...' : '快速批准'}
              </HanamiButton>
            </div>
          </div>
        </HanamiCard>

        {/* 狀態檢查區域 */}
        <HanamiCard className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-[#4B4036]">狀態檢查</h2>
          
          <div className="space-y-3">
            <HanamiButton
              onClick={checkStatus}
              disabled={loading}
              variant="cute"
              className="w-full"
            >
              {loading ? '檢查中...' : '檢查申請狀態'}
            </HanamiButton>
          </div>
        </HanamiCard>
      </div>

      {/* 結果顯示區域 */}
      {result && (
        <HanamiCard className="mt-6 p-6">
          <h2 className="text-xl font-semibold mb-4 text-[#4B4036]">操作結果</h2>
          <pre className="bg-[#FFF9F2] p-4 rounded-lg text-sm overflow-auto max-h-96 whitespace-pre-wrap">
            {result}
          </pre>
        </HanamiCard>
      )}
    </div>
  );
} 