'use client';

import React, { useState, useEffect } from 'react';
import { SparklesIcon, PlusIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface SafeStudentGrowthTreeManagerProps {
  studentId: string;
  studentName: string;
  onTreeChange?: (trees: any[]) => void;
  className?: string;
}

export default function SafeStudentGrowthTreeManager({
  studentId,
  studentName,
  onTreeChange,
  className = ''
}: SafeStudentGrowthTreeManagerProps) {
  const [studentTrees, setStudentTrees] = useState<any[]>([]);
  const [availableTrees, setAvailableTrees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTreeId, setSelectedTreeId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [teacherNotes, setTeacherNotes] = useState<string>('');
  const [deletingTreeId, setDeletingTreeId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // 載入學生的成長樹
  const loadStudentTrees = async () => {
    try {
      setLoading(true);
      console.log('載入學生成長樹:', studentId);

      const response = await fetch(`/api/student-growth-tree-management?studentId=${studentId}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '載入學生成長樹失敗');
      }

      console.log('學生成長樹資料:', result.data);
      setStudentTrees(result.data || []);

      // 通知父組件
      if (onTreeChange) {
        const formattedTrees = (result.data || []).map((item: any) => ({
          id: item.hanami_growth_trees?.id || item.tree_id,
          tree_name: item.hanami_growth_trees?.tree_name || '未知成長樹',
          tree_description: item.hanami_growth_trees?.tree_description,
          start_date: item.start_date || item.enrollment_date,
          status: item.status || item.tree_status
        }));
        onTreeChange(formattedTrees);
      }

    } catch (error) {
      console.error('載入學生成長樹失敗:', error);
      toast.error('載入學生成長樹失敗: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 載入可用的成長樹
  const loadAvailableTrees = async () => {
    try {
      console.log('載入可用成長樹');

      const response = await fetch(`/api/available-growth-trees?studentId=${studentId}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '載入可用成長樹失敗');
      }

      console.log('可用成長樹:', result.data);
      setAvailableTrees(result.data || []);

    } catch (error) {
      console.error('載入可用成長樹失敗:', error);
      toast.error('載入可用成長樹失敗: ' + (error as Error).message);
    }
  };

  // 新增成長樹給學生
  const addTreeToStudent = async () => {
    if (!selectedTreeId) {
      toast.error('請選擇要新增的成長樹');
      return;
    }

    try {
      console.log('新增成長樹給學生:', { studentId, treeId: selectedTreeId });

      const response = await fetch('/api/student-growth-tree-management', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          treeId: selectedTreeId,
          startDate: startDate || new Date().toISOString().split('T')[0],
          teacherNotes: teacherNotes || null
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '新增成長樹失敗');
      }

      console.log('新增成長樹成功:', result.data);
      toast.success('成功新增成長樹！');

      // 重新載入資料
      await loadStudentTrees();
      await loadAvailableTrees();

      // 重置表單
      setSelectedTreeId('');
      setStartDate('');
      setTeacherNotes('');
      setShowAddModal(false);

    } catch (error) {
      console.error('新增成長樹失敗:', error);
      toast.error('新增成長樹失敗: ' + (error as Error).message);
    }
  };

  // 移除學生的成長樹
  const removeTreeFromStudent = async (studentTreeId: string) => {
    try {
      setDeletingTreeId(studentTreeId);
      console.log('移除學生成長樹:', studentTreeId);

      const response = await fetch(`/api/student-growth-tree-management?studentTreeId=${studentTreeId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '移除成長樹失敗');
      }

      console.log('移除成長樹成功');
      toast.success('成功移除成長樹！');

      // 重新載入資料
      await loadStudentTrees();
      await loadAvailableTrees();

    } catch (error) {
      console.error('移除成長樹失敗:', error);
      toast.error('移除成長樹失敗: ' + (error as Error).message);
    } finally {
      setDeletingTreeId(null);
      setShowDeleteConfirm(null);
    }
  };

  // 初始化載入
  useEffect(() => {
    if (studentId) {
      loadStudentTrees();
    }
  }, [studentId]);

  // 當學生樹變化時重新載入可用樹
  useEffect(() => {
    if (studentTrees.length >= 0) {
      loadAvailableTrees();
    }
  }, [studentTrees.length]);

  // 格式化日期
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '未設定';
    return new Date(dateString).toLocaleDateString('zh-TW');
  };

  // 獲取狀態顏色
  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'completed':
        return 'text-blue-600 bg-blue-100';
      case 'paused':
        return 'text-yellow-600 bg-yellow-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // 獲取狀態文字
  const getStatusText = (status: string | null) => {
    switch (status) {
      case 'active':
        return '進行中';
      case 'completed':
        return '已完成';
      case 'paused':
        return '暫停';
      case 'cancelled':
        return '已取消';
      default:
        return '未知';
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="text-gray-600">載入中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 標題和新增按鈕 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <SparklesIcon className="h-6 w-6 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-800">
            {studentName} 的成長樹
          </h3>
          <span className="text-sm text-gray-500">
            ({studentTrees.length} 個)
          </span>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          disabled={availableTrees.length === 0}
          className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          新增成長樹
        </button>
      </div>

      {/* 成長樹列表 */}
      {studentTrees.length === 0 ? (
        <div className="p-6 text-center bg-gray-50 rounded-lg border border-gray-200">
          <SparklesIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">
            此學生尚未分配任何成長樹
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            disabled={availableTrees.length === 0}
            className="flex items-center px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm mx-auto"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            新增第一個成長樹
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {studentTrees.map((studentTree) => (
            <div key={studentTree.id} className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-medium text-gray-800">
                      {studentTree.hanami_growth_trees?.tree_name || '未知成長樹'}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(studentTree.status || studentTree.tree_status)}`}>
                      {getStatusText(studentTree.status || studentTree.tree_status)}
                    </span>
                  </div>
                  
                  {studentTree.hanami_growth_trees?.tree_description && (
                    <p className="text-sm text-gray-600 mb-2">
                      {studentTree.hanami_growth_trees.tree_description}
                    </p>
                  )}
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>
                      開始日期: {formatDate(studentTree.start_date || studentTree.enrollment_date)}
                    </span>
                    {studentTree.hanami_growth_trees?.tree_level && (
                      <span>
                        等級: {studentTree.hanami_growth_trees.tree_level}
                      </span>
                    )}
                  </div>
                  
                  {studentTree.teacher_notes && (
                    <div className="mt-2 p-2 bg-gray-50 rounded-md">
                      <p className="text-xs text-gray-600">
                        <strong>教師備註:</strong> {studentTree.teacher_notes}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  {/* 刪除按鈕 */}
                  <button
                    onClick={() => setShowDeleteConfirm(studentTree.id)}
                    disabled={deletingTreeId === studentTree.id}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-50"
                  >
                    {deletingTreeId === studentTree.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                    ) : (
                      <TrashIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 新增成長樹模態框 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                新增成長樹
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  選擇成長樹
                </label>
                <select
                  value={selectedTreeId}
                  onChange={(e) => setSelectedTreeId(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">請選擇成長樹</option>
                  {availableTrees.map((tree) => (
                    <option key={tree.id} value={tree.id}>
                      {tree.tree_name}
                      {tree.tree_level && ` (等級 ${tree.tree_level})`}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  開始日期
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  教師備註 (選填)
                </label>
                <textarea
                  value={teacherNotes}
                  onChange={(e) => setTeacherNotes(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="輸入備註..."
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                取消
              </button>
              <button
                onClick={addTreeToStudent}
                disabled={!selectedTreeId}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <CheckIcon className="h-4 w-4 mr-1" />
                確認新增
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 刪除確認模態框 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-6 w-6 text-red-500">⚠️</div>
              <h3 className="text-lg font-semibold text-gray-800">
                確認刪除
              </h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              您確定要移除此學生的成長樹嗎？此操作無法復原。
            </p>
            
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                取消
              </button>
              <button
                onClick={() => removeTreeFromStudent(showDeleteConfirm)}
                disabled={deletingTreeId === showDeleteConfirm}
                className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {deletingTreeId === showDeleteConfirm ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <TrashIcon className="h-4 w-4 mr-1" />
                    確認刪除
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 無可用成長樹提示 */}
      {availableTrees.length === 0 && studentTrees.length > 0 && (
        <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
          <div className="h-5 w-5 text-blue-500">ℹ️</div>
          <span className="text-sm text-blue-700">
            此學生已擁有所有可用的成長樹
          </span>
        </div>
      )}
    </div>
  );
}
