'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  PlusIcon, 
  StarIcon, 
  TrashIcon, 
  ExclamationTriangleIcon,
  CalendarIcon,
  DocumentTextIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useOrganization } from '@/contexts/OrganizationContext';

interface MinimalStudentGrowthTreeManagerProps {
  studentId: string;
  studentName: string;
  onTreeChange?: (trees: any[]) => void;
  className?: string;
}

export default function MinimalStudentGrowthTreeManager({
  studentId,
  studentName,
  onTreeChange,
  className = ''
}: MinimalStudentGrowthTreeManagerProps) {
  const { currentOrganization } = useOrganization();
  
  const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  const PLACEHOLDER_ORG_IDS = new Set(['default-org', 'unassigned-org-placeholder']);
  
  const validOrgId = useMemo(() => {
    if (!currentOrganization?.id) return null;
    return UUID_REGEX.test(currentOrganization.id) && !PLACEHOLDER_ORG_IDS.has(currentOrganization.id)
      ? currentOrganization.id
      : null;
  }, [currentOrganization?.id]);
  
  const [studentTrees, setStudentTrees] = useState<any[]>([]);
  const [availableTrees, setAvailableTrees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTreeId, setSelectedTreeId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [deletingTreeId, setDeletingTreeId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // 載入學生的成長樹
  const loadStudentTrees = async () => {
    try {
      setLoading(true);
      
      // 驗證 studentId
      if (!studentId || typeof studentId !== 'string' || studentId.trim() === '') {
        console.warn('載入學生成長樹：studentId 無效，跳過載入');
        setStudentTrees([]);
        if (onTreeChange) {
          onTreeChange([]);
        }
        return;
      }

      console.log('載入學生成長樹:', studentId);

      const apiUrl = `/api/student-growth-tree-management?studentId=${encodeURIComponent(studentId.trim())}`;
      console.log('載入學生成長樹 API URL:', apiUrl);

      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
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

      // 驗證 studentId
      if (!studentId || typeof studentId !== 'string' || studentId.trim() === '') {
        console.warn('載入可用成長樹：studentId 無效，跳過載入');
        setAvailableTrees([]);
        return;
      }

      // 構建查詢參數，包含 orgId
      const params = new URLSearchParams();
      params.append('studentId', studentId.trim());
      if (validOrgId && typeof validOrgId === 'string' && validOrgId.trim() !== '') {
        params.append('orgId', validOrgId.trim());
      }

      const apiUrl = `/api/available-growth-trees?${params.toString()}`;
      console.log('載入可用成長樹 API URL:', apiUrl);

      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
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
          startDate: startDate || new Date().toISOString().split('T')[0]
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
        <div className="flex items-center space-x-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
            className="text-3xl"
          >
            <img src="/tree ui.png" alt="成長樹" className="w-8 h-8" />
          </motion.div>
          <div>
            <h3 className="text-xl font-bold text-[#2B3A3B]">
              {studentName} 的成長樹
            </h3>
            <p className="text-sm text-[#87704e]">
              管理學生的學習成長路徑
            </p>
          </div>
          <motion.span 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="px-3 py-1 bg-[#FFD59A] text-[#4B4036] rounded-full text-sm font-medium"
          >
            {studentTrees.length} 個
          </motion.span>
        </div>
        
        <motion.button
          onClick={() => setShowAddModal(true)}
          disabled={availableTrees.length === 0}
          className="flex items-center px-4 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed text-sm"
          style={{
            background: availableTrees.length > 0 
              ? 'linear-gradient(135deg, #FFD59A 0%, #EBC9A4 100%)' 
              : 'linear-gradient(135deg, #EADBC8 0%, #D4C4A8 100%)',
            color: availableTrees.length > 0 ? '#4B4036' : '#A68A64',
            boxShadow: availableTrees.length > 0 
              ? '0 4px 15px rgba(255, 213, 154, 0.3)' 
              : 'none',
            border: '2px solid #EADBC8'
          }}
          whileHover={{ scale: availableTrees.length > 0 ? 1.05 : 1 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div 
            className="mr-2"
            animate={{ rotate: showAddModal ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <PlusIcon className="w-5 h-5 text-[#4B4036]" />
          </motion.div>
          新增成長樹
        </motion.button>
      </div>

      {/* 成長樹列表 */}
      <AnimatePresence mode="wait">
        {studentTrees.length === 0 ? (
          <motion.div 
            key="empty-state"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-8 text-center rounded-2xl border-2 border-dashed border-[#EADBC8]"
            style={{
              background: 'linear-gradient(135deg, #FFF9F2 0%, #FFFDF8 100%)'
            }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
              className="text-6xl mb-4"
            >
              <img src="/tree ui.png" alt="成長樹" className="w-16 h-16 mx-auto" />
            </motion.div>
            <h4 className="text-lg font-semibold text-[#4B4036] mb-2">
              尚未分配成長樹
            </h4>
            <p className="text-[#87704e] mb-6">
              為 {studentName} 選擇合適的成長樹，開始學習之旅
            </p>
            <motion.button
              onClick={() => setShowAddModal(true)}
              disabled={availableTrees.length === 0}
              className="flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed text-sm mx-auto"
              style={{
                background: availableTrees.length > 0 
                  ? 'linear-gradient(135deg, #FFD59A 0%, #EBC9A4 100%)' 
                  : 'linear-gradient(135deg, #EADBC8 0%, #D4C4A8 100%)',
                color: availableTrees.length > 0 ? '#4B4036' : '#A68A64',
                boxShadow: availableTrees.length > 0 
                  ? '0 4px 15px rgba(255, 213, 154, 0.3)' 
                  : 'none',
                border: '2px solid #EADBC8'
              }}
              whileHover={{ scale: availableTrees.length > 0 ? 1.05 : 1 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div 
                className="mr-2"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <PlusIcon className="w-5 h-5 text-[#4B4036]" />
              </motion.div>
              新增第一個成長樹
            </motion.button>
          </motion.div>
        ) : (
          <motion.div 
            key="trees-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {studentTrees.map((studentTree, index) => (
              <motion.div 
                key={studentTree.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl border-2 border-[#EADBC8] shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #FFF9F2 0%, #FFFDF8 100%)'
                }}
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: '0 8px 25px rgba(255, 213, 154, 0.2)'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <motion.img 
                        src="/tree ui.png"
                        alt="成長樹"
                        className="w-8 h-8"
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 3, repeat: Infinity }}
                      />
                      <div>
                        <h4 className="text-lg font-bold text-[#4B4036]">
                          {studentTree.hanami_growth_trees?.tree_name || '未知成長樹'}
                        </h4>
                        <motion.span 
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(studentTree.status || studentTree.tree_status)}`}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          {getStatusText(studentTree.status || studentTree.tree_status)}
                        </motion.span>
                      </div>
                    </div>
                    
                    {studentTree.hanami_growth_trees?.tree_description && (
                      <p className="text-sm text-[#87704e] mb-3 pl-8">
                        {studentTree.hanami_growth_trees.tree_description}
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-6 text-xs text-[#A68A64] pl-8">
                      <div className="flex items-center space-x-1">
                        <CalendarIcon className="w-4 h-4 text-[#87704e]" />
                        <span>{formatDate(studentTree.start_date || studentTree.enrollment_date)}</span>
                      </div>
                      {studentTree.hanami_growth_trees?.tree_level && (
                        <div className="flex items-center space-x-1">
                          <StarIcon className="w-4 h-4 text-yellow-500" />
                          <span>等級 {studentTree.hanami_growth_trees.tree_level}</span>
                        </div>
                      )}
                    </div>
                    
                    {studentTree.teacher_notes && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3 p-3 bg-[#EADBC8]/30 rounded-lg ml-8"
                      >
                        <p className="text-xs text-[#4B4036]">
                          <div className="flex items-center space-x-2">
                            <DocumentTextIcon className="w-4 h-4 text-[#87704e]" />
                            <strong>教師備註:</strong> {studentTree.teacher_notes}
                          </div>
                        </p>
                      </motion.div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {/* 刪除按鈕 */}
                    <motion.button
                      onClick={() => setShowDeleteConfirm(studentTree.id)}
                      disabled={deletingTreeId === studentTree.id}
                      className="p-3 text-red-500 hover:bg-red-50 rounded-xl disabled:opacity-50 transition-all duration-200"
                      title="刪除成長樹"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {deletingTreeId === studentTree.id ? (
                        <motion.div 
                          className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-500"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                      ) : (
                        <motion.span 
                          className="text-xl"
                          whileHover={{ scale: 1.2 }}
                        >
                          <TrashIcon className="w-5 h-5 text-red-500" />
                        </motion.span>
                      )}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 新增成長樹模態框 */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-auto transform transition-all duration-300 ease-out my-8"
              style={{
                background: 'linear-gradient(135deg, #FFF9F2 0%, #FFFDF8 100%)',
                border: '2px solid #EADBC8'
              }}
            >
              {/* 標題欄 */}
              <div 
                className="px-6 py-4 border-b border-[#EADBC8] rounded-t-2xl"
                style={{
                  background: 'linear-gradient(135deg, #FFD59A 0%, #EBC9A4 100%)'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <motion.img 
                      src="/tree ui.png"
                      alt="成長樹"
                      className="w-8 h-8"
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <div>
                      <h3 className="text-xl font-bold text-[#4B4036]">
                        新增成長樹
                      </h3>
                      <p className="text-sm text-[#87704e]">
                        為 {studentName} 選擇合適的成長樹
                      </p>
                    </div>
                  </div>
                  <motion.button
                    onClick={() => setShowAddModal(false)}
                    className="p-2 text-[#4B4036] hover:bg-white hover:bg-opacity-30 rounded-full transition-all duration-200"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <XMarkIcon className="w-5 h-5 text-[#4B4036]" />
                  </motion.button>
                </div>
              </div>
              
              {/* 表單內容 */}
              <div className="p-6 space-y-6">
                {/* 成長樹選擇 */}
                <div>
                  <label className="block text-sm font-medium text-[#4B4036] mb-3">
                    <PlusIcon className="w-5 h-5 text-[#4B4036] mr-2" />
                    選擇成長樹
                  </label>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {availableTrees.length === 0 ? (
                      <div className="p-4 text-center bg-gray-50 rounded-lg border border-gray-200">
                        <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center">
                          <ExclamationTriangleIcon className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-gray-500 text-sm">
                          暫無可用的成長樹
                        </p>
                      </div>
                    ) : (
                      availableTrees.map((tree) => (
                        <motion.div
                          key={tree.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 }}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                            selectedTreeId === tree.id
                              ? 'border-[#FFD59A] bg-gradient-to-r from-[#FFF9F2] to-[#FFD59A] shadow-md'
                              : 'border-[#EADBC8] bg-white hover:border-[#EBC9A4] hover:shadow-sm'
                          }`}
                          onClick={() => setSelectedTreeId(tree.id)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <motion.img 
                                  src="/tree ui.png"
                                  alt="成長樹"
                                  className="w-6 h-6"
                                  animate={{ rotate: selectedTreeId === tree.id ? 360 : 0 }}
                                  transition={{ duration: 0.5 }}
                                />
                                <h4 className="font-semibold text-[#4B4036]">
                                  {tree.tree_name}
                                </h4>
                                {selectedTreeId === tree.id && (
                                  <motion.span 
                                    className="text-green-500 text-sm"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200 }}
                                  >
                                    <CheckIcon className="w-4 h-4 text-green-500" />
                                  </motion.span>
                                )}
                              </div>
                              {tree.tree_description && (
                                <p className="text-sm text-[#87704e] mb-2">
                                  {tree.tree_description}
                                </p>
                              )}
                              <div className="flex items-center space-x-3 text-xs text-[#A68A64]">
                                {tree.tree_level && (
                                  <span className="px-2 py-1 bg-[#EADBC8] rounded-full">
                                    等級 {tree.tree_level}
                                  </span>
                                )}
                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                                  可用
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
                
                {/* 開始日期 */}
                <div>
                  <label className="block text-sm font-medium text-[#4B4036] mb-3">
                    <CalendarIcon className="w-5 h-5 text-[#4B4036] mr-2" />
                    開始日期
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-4 border-2 border-[#EADBC8] rounded-xl bg-gradient-to-r from-[#FFFDF8] to-[#FFF9F2] text-[#4B4036] focus:ring-2 focus:ring-[#FFD59A] focus:border-[#FFD59A] transition-all duration-200"
                  />
                </div>
                
              </div>
              
              {/* 按鈕區域 */}
              <div 
                className="px-6 py-4 border-t border-[#EADBC8] rounded-b-2xl"
                style={{
                  background: 'linear-gradient(135deg, #FFF9F2 0%, #FFFDF8 100%)'
                }}
              >
                <div className="flex items-center justify-end space-x-3">
                  <motion.button
                    onClick={() => setShowAddModal(false)}
                    className="px-6 py-3 text-[#87704e] hover:text-[#4B4036] hover:bg-white hover:bg-opacity-50 rounded-xl transition-all duration-200 font-medium"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    取消
                  </motion.button>
                  <motion.button
                    onClick={addTreeToStudent}
                    disabled={!selectedTreeId}
                    className="flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
                    style={{
                      background: selectedTreeId 
                        ? 'linear-gradient(135deg, #FFD59A 0%, #EBC9A4 100%)' 
                        : 'linear-gradient(135deg, #EADBC8 0%, #D4C4A8 100%)',
                      color: selectedTreeId ? '#4B4036' : '#A68A64',
                      boxShadow: selectedTreeId 
                        ? '0 4px 15px rgba(255, 213, 154, 0.3)' 
                        : 'none'
                    }}
                    whileHover={{ scale: selectedTreeId ? 1.05 : 1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <motion.span 
                      className="mr-2"
                      animate={{ rotate: selectedTreeId ? [0, 10, -10, 0] : 0 }}
                      transition={{ duration: 1, repeat: selectedTreeId ? Infinity : 0 }}
                    >
                      <PlusIcon className="w-5 h-5 text-[#4B4036]" />
                    </motion.span>
                    確認新增
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 刪除確認模態框 */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto my-8"
              style={{
                background: 'linear-gradient(135deg, #FFF9F2 0%, #FFFDF8 100%)',
                border: '2px solid #EADBC8'
              }}
            >
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <motion.span 
                    className="text-3xl"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <ExclamationTriangleIcon className="w-6 h-6 text-orange-500" />
                  </motion.span>
                  <div>
                    <h3 className="text-xl font-bold text-[#4B4036]">
                      確認刪除
                    </h3>
                    <p className="text-sm text-[#87704e]">
                      此操作無法復原
                    </p>
                  </div>
                </div>
                
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
                  <p className="text-[#4B4036] text-sm">
                    您確定要移除此學生的成長樹嗎？刪除後將無法恢復相關的學習記錄和進度。
                  </p>
                </div>
                
                <div className="flex items-center justify-end space-x-3">
                  <motion.button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="px-6 py-3 text-[#87704e] hover:text-[#4B4036] hover:bg-white hover:bg-opacity-50 rounded-xl transition-all duration-200 font-medium"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    取消
                  </motion.button>
                  <motion.button
                    onClick={() => removeTreeFromStudent(showDeleteConfirm)}
                    disabled={deletingTreeId === showDeleteConfirm}
                    className="flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
                    style={{
                      background: deletingTreeId === showDeleteConfirm
                        ? 'linear-gradient(135deg, #EADBC8 0%, #D4C4A8 100%)'
                        : 'linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%)',
                      color: '#FFFFFF',
                      boxShadow: deletingTreeId === showDeleteConfirm
                        ? 'none'
                        : '0 4px 15px rgba(255, 107, 107, 0.3)'
                    }}
                    whileHover={{ scale: deletingTreeId === showDeleteConfirm ? 1 : 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {deletingTreeId === showDeleteConfirm ? (
                      <motion.div 
                        className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                    ) : (
                      <motion.span 
                        className="mr-2 text-lg"
                        whileHover={{ scale: 1.2 }}
                      >
                        <TrashIcon className="w-5 h-5 text-red-500" />
                      </motion.span>
                    )}
                    確認刪除
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 無可用成長樹提示 */}
      <AnimatePresence>
        {availableTrees.length === 0 && studentTrees.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center space-x-3 p-4 rounded-xl border-2 border-[#EADBC8]"
            style={{
              background: 'linear-gradient(135deg, #E3F2FD 0%, #F3E5F5 100%)'
            }}
          >
            <motion.div 
              className="w-8 h-8"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <StarIcon className="w-6 h-6 text-yellow-500" />
            </motion.div>
            <div>
              <p className="text-sm font-medium text-[#4B4036]">
                恭喜！此學生已擁有所有可用的成長樹
              </p>
              <p className="text-xs text-[#87704e]">
                可以開始豐富的學習之旅了
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
