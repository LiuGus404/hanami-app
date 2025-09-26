'use client';

import React, { useState, useEffect } from 'react';

import HanamiBadge from '@/components/ui/HanamiBadge';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';
import { supabase } from '@/lib/supabase';
import { RegistrationRequest, RegistrationStatus, UserRole } from '@/types/auth';

interface RegistrationRequestsPanelProps {}

export default function RegistrationRequestsPanel() {
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<RegistrationRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<RegistrationStatus | 'all'>('all');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  // 載入註冊申請
  useEffect(() => {
    loadRegistrationRequests();
  }, []);

  const loadRegistrationRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      // 暫時註解掉 registration_requests 表的查詢，因為該表可能不存在
      // const { data, error } = await supabase
      //   .from('registration_requests')
      //   .select('*')
      //   .order('created_at', { ascending: false });
      
      // 暫時返回空資料
      const data: any[] = [];
      const error: any = null;

      if (error) {
        console.error('載入註冊申請失敗:', error);
        setError(`載入註冊申請失敗: ${error.message}`);
        return;
      }

      console.log('註冊申請載入成功:', data?.length || 0, '筆');
      setRequests(data || []);
    } catch (error) {
      console.error('載入註冊申請失敗:', error);
      setError(`載入註冊申請失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  // 審核註冊申請
  const reviewRequest = async (requestId: string, status: RegistrationStatus, reason?: string) => {
    try {
      setProcessingRequest(requestId);
      
      const currentUser = await supabase.auth.getUser();
      const reviewerId = currentUser.data.user?.id;

      // 暫時註解掉 registration_requests 表的更新，因為該表可能不存在
      // const { error } = await supabase
      //   .from('registration_requests')
      //   .update({
      //     status,
      //     reviewed_by: reviewerId,
      //     reviewed_at: new Date().toISOString(),
      //     rejection_reason: reason || null,
      //   })
      //   .eq('id', requestId);
      
      // 暫時返回成功
      const error: any = null;

      if (error) {
        console.error('更新申請狀態失敗:', error);
        throw error;
      }

      // 如果審核通過，創建對應的用戶帳號
      if (status === 'approved') {
        await createUserAccount(requestId);
      }

      // 重新載入資料
      await loadRegistrationRequests();
      
      // 關閉模態框
      setShowDetailModal(false);
      setShowRejectionModal(false);
      setSelectedRequest(null);
      setRejectionReason('');

      alert(`申請已${status === 'approved' ? '通過' : '拒絕'}`);
    } catch (error) {
      console.error('審核申請失敗:', error);
      alert(`審核失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setProcessingRequest(null);
    }
  };

  // 創建用戶帳號
  const createUserAccount = async (requestId: string) => {
    try {
      const request = requests.find(r => r.id === requestId);
      if (!request) return;

      // 生成隨機密碼
      const password = `${Math.random().toString(36).slice(-8) + Math.random().toString(36).toUpperCase().slice(-4)}!1`;

      // 調用 API 創建 Auth 用戶和資料表記錄
      const response = await fetch('/api/auth/create-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '創建帳號失敗');
      }

      // 顯示成功訊息和臨時密碼
      alert(`申請已通過！\n\n用戶可以使用的臨時密碼：${password}\n\n請通知用戶使用此密碼登入，並建議他們立即更改密碼。`);
    } catch (error) {
      console.error('創建用戶帳號失敗:', error);
      throw error;
    }
  };

  // 過濾申請
  const getFilteredRequests = () => {
    return requests.filter(request => {
      const statusMatch = statusFilter === 'all' || request.status === statusFilter;
      const roleMatch = roleFilter === 'all' || request.role === roleFilter;
      return statusMatch && roleMatch;
    });
  };

  // 獲取狀態徽章
  const getStatusBadge = (status: RegistrationStatus) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: '待審核' },
      approved: { color: 'bg-green-100 text-green-800', text: '已通過' },
      rejected: { color: 'bg-red-100 text-red-800', text: '已拒絕' },
    };

    const config = statusConfig[status];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  // 獲取角色徽章
  const getRoleBadge = (role: UserRole) => {
    const roleConfig = {
      admin: { color: 'bg-purple-100 text-purple-800', text: '管理員' },
      teacher: { color: 'bg-blue-100 text-blue-800', text: '教師' },
      parent: { color: 'bg-green-100 text-green-800', text: '家長' },
      student: { color: 'bg-orange-100 text-orange-800', text: '學生' },
    };

    const config = roleConfig[role];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  // 處理查看詳情
  const handleViewDetails = (request: RegistrationRequest) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  // 處理拒絕申請
  const handleReject = (request: RegistrationRequest) => {
    setSelectedRequest(request);
    setShowRejectionModal(true);
  };

  // 處理拒絕提交
  const handleRejectSubmit = () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      alert('請填寫拒絕原因');
      return;
    }
    reviewRequest(selectedRequest.id, 'rejected', rejectionReason);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A64B2A]" />
      </div>
    );
  }

  if (error) {
    return (
      <HanamiCard>
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <HanamiButton onClick={loadRegistrationRequests}>
            重新載入
          </HanamiButton>
        </div>
      </HanamiCard>
    );
  }

  const filteredRequests = getFilteredRequests();

  return (
    <div className="space-y-6">
      {/* 過濾器 */}
      <HanamiCard>
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              狀態篩選
            </label>
            <select
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as RegistrationStatus | 'all')}
            >
              <option value="all">全部狀態</option>
              <option value="pending">待審核</option>
              <option value="approved">已通過</option>
              <option value="rejected">已拒絕</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              角色篩選
            </label>
            <select
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
            >
              <option value="all">全部角色</option>
              <option value="admin">管理員</option>
              <option value="teacher">教師</option>
              <option value="parent">家長</option>
            </select>
          </div>

          <div className="ml-auto">
            <HanamiButton onClick={loadRegistrationRequests}>
              重新載入
            </HanamiButton>
          </div>
        </div>
      </HanamiCard>

      {/* 申請列表 */}
      <HanamiCard>
        <div className="overflow-x-auto">
                          <table className="w-full min-w-max divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  申請人
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  電子郵件
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  角色
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  狀態
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  申請時間
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {request.full_name}
                    </div>
                      <div className="text-sm text-gray-500">
                        {request.phone}
                      </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRoleBadge(request.role)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(request.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(request.created_at).toLocaleString('zh-TW')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        className="text-indigo-600 hover:text-indigo-900"
                        onClick={() => handleViewDetails(request)}
                      >
                        查看詳情
                      </button>
                      {request.status === 'pending' && (
                        <>
                          <button
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                            disabled={processingRequest === request.id}
                            onClick={() => reviewRequest(request.id, 'approved')}
                          >
                            {processingRequest === request.id ? '處理中...' : '通過'}
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            disabled={processingRequest === request.id}
                            onClick={() => handleReject(request)}
                          >
                            拒絕
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredRequests.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              沒有找到符合條件的註冊申請
            </div>
          )}
        </div>
      </HanamiCard>

      {/* 詳情模態框 */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                申請詳情
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">申請人姓名</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRequest.full_name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">電子郵件</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRequest.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">電話</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRequest.phone}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">申請角色</label>
                  <div className="mt-1">{getRoleBadge(selectedRequest.role)}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">申請狀態</label>
                  <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">申請時間</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedRequest.created_at).toLocaleString('zh-TW')}
                  </p>
                </div>

                {/* 額外資訊 */}
                {selectedRequest.additional_info && Object.keys(selectedRequest.additional_info).length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">額外資訊</label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md">
                      {Object.entries(selectedRequest.additional_info).map(([key, value]) => (
                        <div key={key} className="mb-2">
                          <span className="text-sm font-medium text-gray-600">{key}: </span>
                          <span className="text-sm text-gray-900">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 審核資訊 */}
                {selectedRequest.reviewed_by && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">審核資訊</label>
                    <p className="mt-1 text-sm text-gray-900">
                      審核時間: {new Date(selectedRequest.reviewed_at!).toLocaleString('zh-TW')}
                    </p>
                    {selectedRequest.rejection_reason && (
                      <p className="mt-1 text-sm text-red-600">
                        拒絕原因: {selectedRequest.rejection_reason}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                {selectedRequest.status === 'pending' && (
                  <>
                    <HanamiButton
                      disabled={processingRequest === selectedRequest.id}
                      onClick={() => reviewRequest(selectedRequest.id, 'approved')}
                    >
                      {processingRequest === selectedRequest.id ? '處理中...' : '通過申請'}
                    </HanamiButton>
                    <button
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
                      disabled={processingRequest === selectedRequest.id}
                      onClick={() => {
                        setShowDetailModal(false);
                        handleReject(selectedRequest);
                      }}
                    >
                      拒絕申請
                    </button>
                  </>
                )}
                <button
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedRequest(null);
                  }}
                >
                  關閉
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 拒絕原因模態框 */}
      {showRejectionModal && selectedRequest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                拒絕申請
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  拒絕原因 *
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  placeholder="請填寫拒絕原因..."
                  rows={4}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <HanamiButton
                  disabled={!rejectionReason.trim() || processingRequest === selectedRequest.id}
                  onClick={handleRejectSubmit}
                >
                  {processingRequest === selectedRequest.id ? '處理中...' : '確認拒絕'}
                </HanamiButton>
                <button
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                  onClick={() => {
                    setShowRejectionModal(false);
                    setRejectionReason('');
                    setSelectedRequest(null);
                  }}
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 