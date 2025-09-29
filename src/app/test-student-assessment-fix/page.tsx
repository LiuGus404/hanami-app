'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import DetailedAbilityProgress from '@/components/ui/DetailedAbilityProgress';

interface Student {
  id: string;
  full_name: string;
  nick_name?: string;
  course_type?: string;
}

interface AssessmentData {
  totalProgress: number;
  currentLevel: number;
  abilities: Array<{
    id: string;
    name: string;
    level: number;
    maxLevel: number;
    progress: number;
    status: 'locked' | 'in_progress' | 'completed';
    color: string;
  }>;
  availableDates: string[];
  latestAssessment?: any;
}

export default function TestStudentAssessmentFix() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [assessmentData, setAssessmentData] = useState<AssessmentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 載入學生列表
  useEffect(() => {
    const loadStudents = async () => {
      try {
        const { data, error } = await supabase
          .from('Hanami_Students')
          .select('id, full_name, nick_name, course_type')
          .limit(10);

        if (error) throw error;
        setStudents(data || []);
      } catch (err) {
        console.error('載入學生列表失敗:', err);
        setError('載入學生列表失敗');
      }
    };

    loadStudents();
  }, []);

  // 載入選中學生的評估資料
  const loadAssessmentData = async (studentId: string) => {
    if (!studentId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/student-assessment-progress?student_id=${studentId}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // 為 abilities 添加默認的 color 屬性和正確的 status 類型
          const dataWithColors = {
            ...result.data,
            abilities: result.data.abilities.map((ability: any) => ({
              ...ability,
              color: ability.color || '#3B82F6', // 默認藍色
              status: (ability.status === 'locked' || ability.status === 'in_progress' || ability.status === 'completed') 
                ? ability.status 
                : 'in_progress' as 'locked' | 'in_progress' | 'completed'
            }))
          };
          setAssessmentData(dataWithColors);
        } else {
          setError(result.error || '載入評估資料失敗');
        }
      } else {
        setError(`API 請求失敗: ${response.status}`);
      }
    } catch (err) {
      console.error('載入評估資料失敗:', err);
      setError('載入評估資料失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentChange = (studentId: string) => {
    setSelectedStudent(studentId);
    loadAssessmentData(studentId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FEFCFB] via-[#FDF9F7] to-[#FCF6F3] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">學生評估資料同步測試</h1>
          
          {/* 學生選擇器 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              選擇學生進行測試
            </label>
            <select
              value={selectedStudent}
              onChange={(e) => handleStudentChange(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
            >
              <option value="">請選擇學生</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.full_name} {student.nick_name && `(${student.nick_name})`} - {student.course_type || '未設定課程'}
                </option>
              ))}
            </select>
          </div>

          {/* 載入狀態 */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD59A] mx-auto mb-4"></div>
              <p className="text-gray-600">載入評估資料中...</p>
            </div>
          )}

          {/* 錯誤訊息 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">錯誤</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 評估資料顯示 */}
          {assessmentData && !loading && (
            <div className="space-y-6">
              {/* 總體進度 */}
              <div className="bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">總體進度</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">總進度</p>
                    <p className="text-3xl font-bold text-gray-800">{assessmentData.totalProgress}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">當前等級</p>
                    <p className="text-3xl font-bold text-gray-800">Lv.{assessmentData.currentLevel}</p>
                  </div>
                </div>
              </div>

              {/* 詳細能力評估 */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">學習目標進度</h2>
                {assessmentData.abilities.length > 0 ? (
                  <div className="space-y-4">
                    {assessmentData.abilities.map((ability) => (
                      <DetailedAbilityProgress key={ability.id} ability={ability} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>尚未有評估記錄</p>
                  </div>
                )}
              </div>

              {/* 可用日期 */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">可用評估日期</h2>
                {assessmentData.availableDates.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {assessmentData.availableDates.map((date) => (
                      <span
                        key={date}
                        className="px-3 py-1 bg-[#FFD59A] text-gray-800 rounded-full text-sm"
                      >
                        {new Date(date).toLocaleDateString('zh-TW')}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">沒有可用的評估日期</p>
                )}
              </div>

              {/* 最新評估資訊 */}
              {assessmentData.latestAssessment && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">最新評估資訊</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">評估日期</p>
                      <p className="font-medium text-gray-800">
                        {new Date(assessmentData.latestAssessment.assessment_date).toLocaleDateString('zh-TW')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">課程名稱</p>
                      <p className="font-medium text-gray-800">
                        {assessmentData.latestAssessment.tree_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">整體評分</p>
                      <p className="font-medium text-gray-800">
                        {assessmentData.latestAssessment.overall_performance_rating}/5
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">下堂課重點</p>
                      <p className="font-medium text-gray-800">
                        {assessmentData.latestAssessment.next_lesson_focus || '未設定'}
                      </p>
                    </div>
                  </div>
                  {assessmentData.latestAssessment.general_notes && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600">備註</p>
                      <p className="text-gray-800">{assessmentData.latestAssessment.general_notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 測試說明 */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">測試說明</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 選擇不同的學生，查看是否顯示各自的評估資料</li>
              <li>• 確認每個學生的進度資料都是獨立的，不會顯示相同的固定數值</li>
              <li>• 如果學生沒有評估記錄，應該顯示 0% 進度和空的能力列表</li>
              <li>• 有評估記錄的學生應該顯示真實的進度資料</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
