'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { GrowthTree } from '@/types/progress';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';
import { HanamiInput } from '@/components/ui/HanamiInput';
import { HanamiSelect } from '@/components/ui/HanamiSelect';
import { 
  PlusIcon, 
  TrashIcon, 
  SparklesIcon, 
  CheckIcon, 
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface StudentGrowthTreeManagerProps {
  studentId: string;
  studentName: string;
  onTreeChange?: (trees: GrowthTree[]) => void;
  className?: string;
}

interface StudentTree {
  id: string;
  student_id: string;
  tree_id: string;
  start_date: string | null;
  status: string | null;
  tree_status: string | null;
  enrollment_date: string | null;
  completion_date: string | null;
  teacher_notes: string | null;
  hanami_growth_trees: {
    id: string;
    tree_name: string;
    tree_description: string | null;
    tree_icon: string | null;
    course_type_id: string | null;
    tree_level: number | null;
    is_active: boolean;
  };
}

interface AvailableTree {
  id: string;
  tree_name: string;
  tree_description: string | null;
  tree_icon: string | null;
  course_type_id: string | null;
  tree_level: number | null;
  is_active: boolean;
}

// 錯誤邊界組件已移除，使用 try-catch 處理錯誤

function StudentGrowthTreeManagerComponent({
  studentId,
  studentName,
  onTreeChange,
  className = ''
}: StudentGrowthTreeManagerProps) {
  const [studentTrees, setStudentTrees] = useState<StudentTree[]>([]);
  const [availableTrees, setAvailableTrees] = useState<AvailableTree[]>([]);
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
          id: item.hanami_growth_trees.id,
          tree_name: item.hanami_growth_trees.tree_name,
          tree_description: item.hanami_growth_trees.tree_description,
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

  // 更新成長樹狀態
  const updateTreeStatus = async (studentTreeId: string, newStatus: string) => {
    try {
      console.log('更新成長樹狀態:', { studentTreeId, newStatus });

      const response = await fetch('/api/student-growth-tree-management', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentTreeId,
          status: newStatus
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '更新成長樹狀態失敗');
      }

      console.log('更新成長樹狀態成功');
      toast.success('成功更新成長樹狀態！');

      // 重新載入資料
      await loadStudentTrees();

    } catch (error) {
      console.error('更新成長樹狀態失敗:', error);
      toast.error('更新成長樹狀態失敗: ' + (error as Error).message);
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
    if (studentTrees.length >= 0) { // 改為 >= 0 以確保總是載入可用樹
      loadAvailableTrees();
    }
  }, [studentTrees.length]); // 只依賴長度而不是整個數組

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
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-hanami-primary"></div>
          <span className="text-hanami-text">載入中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 標題和新增按鈕 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <SparklesIcon className="h-6 w-6 text-hanami-primary" />
          <h3 className="text-lg font-semibold text-hanami-text">
            {studentName} 的成長樹
          </h3>
          <span className="text-sm text-hanami-text-secondary">
            ({studentTrees.length} 個)
          </span>
        </div>
        
        <HanamiButton
          variant="cute"
          size="sm"
          onClick={() => setShowAddModal(true)}
          disabled={availableTrees.length === 0}
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          新增成長樹
        </HanamiButton>
      </div>

      {/* 成長樹列表 */}
      {studentTrees.length === 0 ? (
        <HanamiCard className="p-6 text-center">
          <SparklesIcon className="h-12 w-12 text-hanami-text-secondary mx-auto mb-3" />
          <p className="text-hanami-text-secondary mb-4">
            此學生尚未分配任何成長樹
          </p>
          <HanamiButton
            variant="soft"
            size="sm"
            onClick={() => setShowAddModal(true)}
            disabled={availableTrees.length === 0}
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            新增第一個成長樹
          </HanamiButton>
        </HanamiCard>
      ) : (
        <div className="space-y-3">
          {studentTrees.map((studentTree) => (
            <HanamiCard key={studentTree.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-medium text-hanami-text">
                      {studentTree.hanami_growth_trees?.tree_name || '未知成長樹'}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(studentTree.status || studentTree.tree_status)}`}>
                      {getStatusText(studentTree.status || studentTree.tree_status)}
                    </span>
                  </div>
                  
                  {studentTree.hanami_growth_trees?.tree_description && (
                    <p className="text-sm text-hanami-text-secondary mb-2">
                      {studentTree.hanami_growth_trees.tree_description}
                    </p>
                  )}
                  
                  <div className="flex items-center space-x-4 text-xs text-hanami-text-secondary">
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
                    <div className="mt-2 p-2 bg-hanami-background rounded-md">
                      <p className="text-xs text-hanami-text-secondary">
                        <strong>教師備註:</strong> {studentTree.teacher_notes}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  {/* 狀態更新按鈕 */}
                  <HanamiSelect
                    value={studentTree.status || studentTree.tree_status || 'active'}
                    onChange={(value) => updateTreeStatus(studentTree.id, value)}
                    className="text-xs"
                    options={[
                      { value: 'active', label: '進行中' },
                      { value: 'paused', label: '暫停' },
                      { value: 'completed', label: '已完成' },
                      { value: 'cancelled', label: '已取消' }
                    ]}
                  />
                  
                  {/* 刪除按鈕 */}
                  <HanamiButton
                    variant="danger"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(studentTree.id)}
                    disabled={deletingTreeId === studentTree.id}
                  >
                    {deletingTreeId === studentTree.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <TrashIcon className="h-4 w-4" />
                    )}
                  </HanamiButton>
                </div>
              </div>
            </HanamiCard>
          ))}
        </div>
      )}

      {/* 新增成長樹模態框 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-hanami-text">
                新增成長樹
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-hanami-text-secondary hover:text-hanami-text"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-hanami-text mb-2">
                  選擇成長樹
                </label>
                <HanamiSelect
                  value={selectedTreeId}
                  onChange={setSelectedTreeId}
                  placeholder="請選擇成長樹"
                  options={availableTrees.map((tree) => ({
                    value: tree.id,
                    label: `${tree.tree_name}${tree.tree_level ? ` (等級 ${tree.tree_level})` : ''}`
                  }))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-hanami-text mb-2">
                  開始日期
                </label>
                <HanamiInput
                  type="date"
                  value={startDate}
                  onChange={setStartDate}
                  placeholder="選擇開始日期"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-hanami-text mb-2">
                  教師備註 (選填)
                </label>
                <textarea
                  value={teacherNotes}
                  onChange={(e) => setTeacherNotes(e.target.value)}
                  className="w-full p-3 border border-hanami-border rounded-lg focus:ring-2 focus:ring-hanami-primary focus:border-transparent resize-none"
                  rows={3}
                  placeholder="輸入備註..."
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 mt-6">
              <HanamiButton
                variant="secondary"
                onClick={() => setShowAddModal(false)}
              >
                取消
              </HanamiButton>
              <HanamiButton
                variant="primary"
                onClick={addTreeToStudent}
                disabled={!selectedTreeId}
              >
                <CheckIcon className="h-4 w-4 mr-1" />
                確認新增
              </HanamiButton>
            </div>
          </div>
        </div>
      )}

      {/* 刪除確認模態框 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
              <h3 className="text-lg font-semibold text-hanami-text">
                確認刪除
              </h3>
            </div>
            
            <p className="text-hanami-text-secondary mb-6">
              您確定要移除此學生的成長樹嗎？此操作無法復原。
            </p>
            
            <div className="flex items-center justify-end space-x-3">
              <HanamiButton
                variant="secondary"
                onClick={() => setShowDeleteConfirm(null)}
              >
                取消
              </HanamiButton>
              <HanamiButton
                variant="danger"
                onClick={() => removeTreeFromStudent(showDeleteConfirm)}
                disabled={deletingTreeId === showDeleteConfirm}
              >
                {deletingTreeId === showDeleteConfirm ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <TrashIcon className="h-4 w-4 mr-1" />
                    確認刪除
                  </>
                )}
              </HanamiButton>
            </div>
          </div>
        </div>
      )}

      {/* 無可用成長樹提示 */}
      {availableTrees.length === 0 && studentTrees.length > 0 && (
        <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
          <InformationCircleIcon className="h-5 w-5 text-blue-500" />
          <span className="text-sm text-blue-700">
            此學生已擁有所有可用的成長樹
          </span>
        </div>
      )}
    </div>
  );
}

// 導出組件
export default function StudentGrowthTreeManager(props: StudentGrowthTreeManagerProps) {
  return <StudentGrowthTreeManagerComponent {...props} />;
}
