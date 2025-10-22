'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import StudentGrowthTreeManager from '@/components/ui/StudentGrowthTreeManager';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';
import { HanamiSelect } from '@/components/ui/HanamiSelect';
import { 
  UserIcon, 
  SparklesIcon, 
  PlusIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface Student {
  id: string;
  full_name: string;
  nick_name?: string | null;
  student_age?: number | null;
  course_type?: string | null;
}

export default function GrowthTreeManagementDemo() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');

  // 載入學生列表
  const loadStudents = async () => {
    try {
      setLoading(true);
      console.log('載入學生列表');

      const { data: studentsData, error } = await supabase
        .from('Hanami_Students')
        .select('id, full_name, nick_name, student_age, course_type')
        .order('full_name', { ascending: true });

      if (error) {
        console.error('載入學生列表失敗:', error);
        toast.error('載入學生列表失敗');
        return;
      }

      console.log('學生列表:', studentsData);
      setStudents(studentsData || []);

    } catch (error) {
      console.error('載入學生列表失敗:', error);
      toast.error('載入學生列表失敗: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 過濾學生
  const filteredStudents = students.filter(student =>
    student.full_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    (student.nick_name && student.nick_name.toLowerCase().includes(studentSearch.toLowerCase()))
  );

  // 處理成長樹變更
  const handleTreeChange = (trees: any[]) => {
    console.log('成長樹變更:', trees);
    toast.success(`學生現在有 ${trees.length} 個成長樹`);
  };

  // 初始化載入
  useEffect(() => {
    loadStudents();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-hanami-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hanami-primary"></div>
              <span className="text-hanami-text">載入中...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hanami-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* 標題 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-hanami-text mb-2">
            成長樹管理系統演示
          </h1>
          <p className="text-hanami-text-secondary">
            管理學生的成長樹分配，支援新增、刪除和狀態更新功能
          </p>
        </div>

        {/* 功能說明 */}
        <HanamiCard className="p-6 mb-6">
          <div className="flex items-start space-x-3">
            <InformationCircleIcon className="h-6 w-6 text-blue-500 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-hanami-text mb-2">
                功能說明
              </h3>
              <ul className="text-hanami-text-secondary space-y-1 text-sm">
                <li>• 選擇學生後可以查看其現有的成長樹</li>
                <li>• 支援為學生新增成長樹（從可用成長樹中選擇）</li>
                <li>• 可以移除學生的成長樹</li>
                <li>• 可以更新成長樹的狀態（進行中、暫停、已完成、已取消）</li>
                <li>• 所有操作都會即時同步到資料庫</li>
              </ul>
            </div>
          </div>
        </HanamiCard>

        {/* 學生選擇 */}
        <HanamiCard className="p-6 mb-6">
          <h2 className="text-xl font-semibold text-hanami-text mb-4 flex items-center">
            <UserIcon className="h-5 w-5 mr-2" />
            選擇學生
          </h2>
          
          <div className="relative">
            <button
              className="w-full px-4 py-3 border border-hanami-border rounded-lg text-left bg-white hover:bg-hanami-background transition-colors focus:outline-none focus:ring-2 focus:ring-hanami-primary"
              onClick={() => setShowStudentDropdown(!showStudentDropdown)}
            >
              {selectedStudent ? (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-hanami-text">
                      {selectedStudent.full_name}
                    </div>
                    <div className="text-sm text-hanami-text-secondary">
                      {selectedStudent.nick_name && `${selectedStudent.nick_name} • `}
                      {selectedStudent.student_age && `年齡: ${selectedStudent.student_age}歲 • `}
                      {selectedStudent.course_type && `課程: ${selectedStudent.course_type}`}
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-hanami-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              ) : (
                <span className="text-hanami-text-secondary">請選擇學生</span>
              )}
            </button>
            
            {showStudentDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-hanami-border rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                <div className="p-2 border-b border-hanami-border">
                  <input
                    className="w-full px-3 py-2 border border-hanami-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-hanami-primary"
                    placeholder="搜尋學生..."
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                  />
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filteredStudents.map((student) => (
                    <button
                      key={student.id}
                      className="w-full px-4 py-3 text-left hover:bg-hanami-background border-b border-hanami-border last:border-b-0"
                      onClick={() => {
                        setSelectedStudent(student);
                        setShowStudentDropdown(false);
                        setStudentSearch('');
                      }}
                    >
                      <div className="font-medium text-hanami-text">{student.full_name}</div>
                      <div className="text-sm text-hanami-text-secondary">
                        {student.nick_name && `${student.nick_name} • `}
                        {student.student_age && `年齡: ${student.student_age}歲 • `}
                        {student.course_type && `課程: ${student.course_type}`}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </HanamiCard>

        {/* 成長樹管理 */}
        {selectedStudent && (
          <HanamiCard className="p-6">
            <h2 className="text-xl font-semibold text-hanami-text mb-4 flex items-center">
              <SparklesIcon className="h-5 w-5 mr-2" />
              {selectedStudent.full_name} 的成長樹管理
            </h2>
            
            <StudentGrowthTreeManager
              studentId={selectedStudent.id}
              studentName={selectedStudent.full_name}
              onTreeChange={handleTreeChange}
              className="border border-hanami-border rounded-lg p-4 bg-hanami-surface"
            />
          </HanamiCard>
        )}

        {/* 使用說明 */}
        {!selectedStudent && (
          <HanamiCard className="p-6 text-center">
            <SparklesIcon className="h-12 w-12 text-hanami-text-secondary mx-auto mb-3" />
            <h3 className="text-lg font-medium text-hanami-text mb-2">
              請選擇學生
            </h3>
            <p className="text-hanami-text-secondary">
              選擇一個學生來查看和管理其成長樹
            </p>
          </HanamiCard>
        )}
      </div>
    </div>
  );
}
