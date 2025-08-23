'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { HanamiCard, HanamiButton, HanamiInput } from '@/components/ui';
import { 
  XMarkIcon, 
  MagnifyingGlassIcon,
  CheckIcon,
  PlusIcon,
  MinusIcon
} from '@heroicons/react/24/outline';
import { TreePine, Users } from 'lucide-react';
import { getHKDateString } from '@/lib/utils';

interface Student {
  id: string;
  full_name: string;
  nick_name?: string | null;
  course_type?: string | null;
}

interface GrowthTree {
  id: string;
  tree_name: string;
  tree_description?: string | null;
}

interface StudentTreeAssignment {
  student_id: string;
  tree_id: string;
  start_date: string;
  status: 'active' | 'inactive';
}

interface StudentTreeAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student?: Student;
  onSuccess?: () => void;
}

export default function StudentTreeAssignmentModal({
  isOpen,
  onClose,
  student,
  onSuccess
}: StudentTreeAssignmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [trees, setTrees] = useState<GrowthTree[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedTrees, setSelectedTrees] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [treeSearchQuery, setTreeSearchQuery] = useState('');
  const [startDate, setStartDate] = useState(getHKDateString(new Date()));
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [showTreeDropdown, setShowTreeDropdown] = useState(false);

  // 載入學生和成長樹資料
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  // 如果是單一學生模式，自動選中該學生
  useEffect(() => {
    if (student && selectedStudents.length === 0) {
      setSelectedStudents([student.id]);
    }
  }, [student, selectedStudents]);

  // 點擊外部關閉下拉選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.student-dropdown') && !target.closest('.tree-dropdown')) {
        setShowStudentDropdown(false);
        setShowTreeDropdown(false);
      }
    };

    if (showStudentDropdown || showTreeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showStudentDropdown, showTreeDropdown]);

  const loadData = async () => {
    try {
      setLoading(true);

      // 如果有指定學生，只載入該學生資料
      if (student) {
        setStudents([student]);
        setSelectedStudents([student.id]);
      } else {
        // 載入所有學生資料
        const { data: studentsData, error: studentsError } = await supabase
          .from('Hanami_Students')
          .select('id, full_name, nick_name, course_type')
          .order('full_name');

        if (studentsError) throw studentsError;
        setStudents(studentsData || []);
      }

      // 載入成長樹資料
      const { data: treesData, error: treesError } = await supabase
        .from('hanami_growth_trees')
        .select('id, tree_name, tree_description')
        .eq('is_active', true)
        .order('tree_name');

      if (treesError) throw treesError;
      setTrees(treesData || []);

    } catch (error) {
      console.error('載入資料失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  // 篩選學生
  const filteredStudents = students.filter(student =>
    student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (student.nick_name && student.nick_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // 篩選成長樹
  const filteredTrees = trees.filter(tree =>
    tree.tree_name.toLowerCase().includes(treeSearchQuery.toLowerCase()) ||
    (tree.tree_description && tree.tree_description.toLowerCase().includes(treeSearchQuery.toLowerCase()))
  );

  // 切換學生選擇
  const toggleStudent = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  // 切換成長樹選擇
  const toggleTree = (treeId: string) => {
    setSelectedTrees(prev => 
      prev.includes(treeId) 
        ? prev.filter(id => id !== treeId)
        : [...prev, treeId]
    );
  };

  // 提交分配
  const handleSubmit = async () => {
    if (selectedStudents.length === 0 || selectedTrees.length === 0) {
      alert('請選擇學生和成長樹');
      return;
    }

    try {
      setLoading(true);

      const assignments: StudentTreeAssignment[] = [];
      
      // 為每個選中的學生分配每個選中的成長樹
      for (const studentId of selectedStudents) {
        for (const treeId of selectedTrees) {
          assignments.push({
            student_id: studentId,
            tree_id: treeId,
            start_date: startDate,
            status: 'active'
          });
        }
      }

      // 批量插入分配記錄
      const { error } = await supabase
        .from('hanami_student_trees')
        .upsert(assignments, { 
          onConflict: 'student_id,tree_id',
          ignoreDuplicates: false 
        });

      if (error) throw error;

      alert('成長樹分配成功！');
      onSuccess?.();
      onClose();

    } catch (error) {
      console.error('分配失敗:', error);
      alert('分配失敗: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* 標題欄 */}
        <div className="bg-gradient-to-r from-hanami-primary to-hanami-secondary px-6 py-4 border-b border-[#EADBC8] rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🌳</span>
              <div>
                <h2 className="text-2xl font-bold text-hanami-text">成長樹分配管理</h2>
                <p className="text-hanami-text-secondary">
                  {student ? `為 ${student.full_name} 分配成長樹` : '管理學生成長樹分配'}
                </p>
              </div>
            </div>
            <button
              className="text-hanami-text hover:text-hanami-text-secondary transition-colors p-2"
              onClick={onClose}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* 內容區域 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className={`grid gap-6 ${student ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
            {/* 左側：學生選擇 - 只在沒有指定學生時顯示 */}
            {!student && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-hanami-text flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    選擇學生
                  </h3>
                  {selectedStudents.length > 0 && (
                    <button
                      className="text-sm text-[#A64B2A] hover:text-[#8B3A1A] transition-colors"
                      onClick={() => setSelectedStudents([])}
                    >
                      清空選擇
                    </button>
                  )}
                </div>

                {/* 學生選擇下拉框 */}
                <div className="relative student-dropdown">
                  <button
                    className="w-full px-4 py-3 border border-[#EADBC8] rounded-lg text-left bg-white hover:bg-[#FFF9F2] transition-colors focus:outline-none focus:ring-2 focus:ring-[#A64B2A]"
                    type="button"
                    onClick={() => setShowStudentDropdown(!showStudentDropdown)}
                  >
                    {selectedStudents.length > 0 ? (
                      <div>
                        <div className="font-medium text-[#2B3A3B]">
                          {selectedStudents.length === 1 
                            ? students.find(s => s.id === selectedStudents[0])?.full_name || '已選擇學生'
                            : `已選擇 ${selectedStudents.length} 位學生`
                          }
                        </div>
                        <div className="text-sm text-[#A68A64]">
                          {selectedStudents.length === 1 
                            ? students.find(s => s.id === selectedStudents[0])?.nick_name || ''
                            : '點擊可多選或取消選擇'
                          }
                        </div>
                      </div>
                    ) : (
                      <span className="text-[#A68A64]">請選擇學生（可多選）</span>
                    )}
                  </button>
                  {showStudentDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#EADBC8] rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                      <div className="p-2 border-b border-[#EADBC8]">
                        <input
                          className="w-full px-3 py-2 border border-[#EADBC8] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#A64B2A]"
                          placeholder="搜尋學生..."
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {filteredStudents.map((student) => (
                          <button
                            key={student.id}
                            className={`w-full px-4 py-3 text-left hover:bg-[#FFF9F2] border-b border-[#EADBC8] last:border-b-0 ${
                              selectedStudents.includes(student.id) ? 'bg-[#FFF9F2]' : ''
                            }`}
                            type="button"
                            onClick={() => toggleStudent(student.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-[#2B3A3B]">{student.full_name}</div>
                                <div className="text-sm text-[#A68A64]">
                                  {student.nick_name && `${student.nick_name} • `}
                                  {student.course_type || '未設定課程'}
                                </div>
                              </div>
                              {selectedStudents.includes(student.id) && (
                                <CheckIcon className="h-5 w-5 text-[#A64B2A]" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 右側：成長樹選擇 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-hanami-text flex items-center gap-2">
                  <TreePine className="h-5 w-5" />
                  {student ? `為 ${student.full_name} 選擇成長樹` : '選擇成長樹'}
                </h3>
                {selectedTrees.length > 0 && (
                  <button
                    className="text-sm text-[#A64B2A] hover:text-[#8B3A1A] transition-colors"
                    onClick={() => setSelectedTrees([])}
                  >
                    清空選擇
                  </button>
                )}
              </div>

              {/* 成長樹選擇下拉框 */}
              <div className="relative tree-dropdown">
                <button
                  className="w-full px-4 py-3 border border-[#EADBC8] rounded-lg text-left bg-white hover:bg-[#FFF9F2] transition-colors focus:outline-none focus:ring-2 focus:ring-[#A64B2A]"
                  type="button"
                  onClick={() => setShowTreeDropdown(!showTreeDropdown)}
                >
                  {selectedTrees.length > 0 ? (
                    <div>
                      <div className="font-medium text-[#2B3A3B]">
                        {selectedTrees.length === 1 
                          ? trees.find(t => t.id === selectedTrees[0])?.tree_name || '已選擇成長樹'
                          : `已選擇 ${selectedTrees.length} 個成長樹`
                        }
                      </div>
                      <div className="text-sm text-[#A68A64]">
                        {selectedTrees.length === 1 
                          ? trees.find(t => t.id === selectedTrees[0])?.tree_description || ''
                          : '點擊可多選或取消選擇'
                        }
                      </div>
                    </div>
                  ) : (
                    <span className="text-[#A68A64]">請選擇成長樹（可多選）</span>
                  )}
                </button>
                {showTreeDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#EADBC8] rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                    <div className="p-2 border-b border-[#EADBC8]">
                      <input
                        className="w-full px-3 py-2 border border-[#EADBC8] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#A64B2A]"
                        placeholder="搜尋成長樹..."
                        type="text"
                        value={treeSearchQuery}
                        onChange={(e) => setTreeSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {filteredTrees.map((tree) => (
                        <button
                          key={tree.id}
                          className={`w-full px-4 py-3 text-left hover:bg-[#FFF9F2] border-b border-[#EADBC8] last:border-b-0 ${
                            selectedTrees.includes(tree.id) ? 'bg-[#FFF9F2]' : ''
                          }`}
                          type="button"
                          onClick={() => toggleTree(tree.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-[#2B3A3B]">{tree.tree_name}</div>
                              <div className="text-sm text-[#A68A64]">
                                {tree.tree_description}
                              </div>
                            </div>
                            {selectedTrees.includes(tree.id) && (
                              <CheckIcon className="h-5 w-5 text-[#A64B2A]" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 分配統計 */}
          <div className="mt-6">
            <HanamiCard className="p-4">
              <div className="text-center">
                <div className="text-sm text-hanami-text-secondary">
                  {student ? (
                    <>
                      <p>學生：{student.full_name}</p>
                      <p>已選擇 {selectedTrees.length} 個成長樹</p>
                      <p className="font-medium text-hanami-text mt-2">
                        將為 {student.full_name} 分配 {selectedTrees.length} 個成長樹
                      </p>
                    </>
                  ) : (
                    <>
                      <p>已選擇 {selectedStudents.length} 位學生</p>
                      <p>已選擇 {selectedTrees.length} 個成長樹</p>
                      <p className="font-medium text-hanami-text mt-2">
                        將建立 {selectedStudents.length * selectedTrees.length} 個分配關係
                      </p>
                    </>
                  )}
                </div>
              </div>
            </HanamiCard>
          </div>
        </div>

        {/* 底部按鈕 */}
        <div className="p-6 border-t border-[#EADBC8] flex justify-end gap-3">
          <HanamiButton
            variant="secondary"
            onClick={onClose}
          >
            取消
          </HanamiButton>
          <HanamiButton
            onClick={handleSubmit}
            disabled={loading || selectedStudents.length === 0 || selectedTrees.length === 0}
            className="bg-gradient-to-r from-hanami-primary to-hanami-secondary"
          >
            {loading ? '分配中...' : (student ? '為學生分配成長樹' : '確認分配')}
          </HanamiButton>
        </div>
      </div>
    </div>
  );
} 