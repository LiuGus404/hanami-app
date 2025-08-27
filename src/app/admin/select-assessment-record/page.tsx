'use client';

import { useState, useEffect } from 'react';
import { CalendarIcon, StarIcon, CheckIcon } from '@heroicons/react/24/outline';
import { TreePine } from 'lucide-react';

interface AssessmentRecord {
  id: string;
  tree_id: string;
  assessment_date: string;
  lesson_date: string;
  selected_goals: any[];
  ability_assessments: any;
  overall_performance_rating: number;
  general_notes: string | null;
  next_lesson_focus: string | null;
  created_at: string;
  updated_at: string;
  tree: {
    tree_name: string;
    tree_description: string;
  };
  analysis: {
    has_goal_data: boolean;
    goal_count: number;
    has_ability_data: boolean;
    ability_count: number;
    goals_summary: any[];
  };
}

interface Student {
  id: string;
  full_name: string;
  nick_name?: string;
}

export default function SelectAssessmentRecordPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentRecord | null>(null);
  const [loading, setLoading] = useState(false);

  // 載入學生列表
  useEffect(() => {
    const loadStudents = async () => {
      try {
        const response = await fetch('/api/students');
        if (response.ok) {
          const data = await response.json();
          setStudents(data.students || []);
        }
      } catch (error) {
        console.error('載入學生失敗:', error);
      }
    };
    
    loadStudents();
  }, []);

  // 載入學生的評估記錄歷史
  const loadAssessmentHistory = async (studentId: string) => {
    if (!studentId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/student-assessment-history?student_id=${studentId}`);
      const data = await response.json();
      
      if (data.success) {
        setAssessments(data.assessments);
        setSelectedAssessment(data.recommended_record);
        console.log('評估記錄歷史:', data);
      } else {
        console.error('載入評估記錄失敗:', data.error);
        setAssessments([]);
      }
    } catch (error) {
      console.error('載入評估記錄失敗:', error);
      setAssessments([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">選擇評估記錄作為預設值</h1>
      
      {/* 學生選擇 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">選擇學生</h2>
        
        <select
          value={selectedStudentId}
          onChange={(e) => {
            setSelectedStudentId(e.target.value);
            loadAssessmentHistory(e.target.value);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">請選擇學生</option>
          {students.map(student => (
            <option key={student.id} value={student.id}>
              {student.full_name} {student.nick_name && `(${student.nick_name})`}
            </option>
          ))}
        </select>
      </div>

      {/* 評估記錄列表 */}
      {selectedStudentId && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">
            評估記錄歷史 
            {assessments.length > 0 && (
              <span className="text-sm text-gray-600 ml-2">
                (共 {assessments.length} 個記錄)
              </span>
            )}
          </h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-2 text-gray-600">載入中...</p>
            </div>
          ) : assessments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>該學生沒有評估記錄</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assessments.map((assessment) => (
                <div
                  key={assessment.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedAssessment?.id === assessment.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedAssessment(assessment)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <CalendarIcon className="w-5 h-5 text-gray-500" />
                      <span className="font-medium">
                        {new Date(assessment.assessment_date).toLocaleDateString('zh-TW')}
                      </span>
                      {selectedAssessment?.id === assessment.id && (
                        <CheckIcon className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {assessment.analysis.has_goal_data && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          有目標資料
                        </span>
                      )}
                      {assessment.analysis.has_ability_data && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          有能力資料
                        </span>
                      )}
                      {!assessment.analysis.has_goal_data && !assessment.analysis.has_ability_data && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          無評估資料
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <TreePine className="w-4 h-4" />
                      <span>{assessment.tree?.tree_name || '未知成長樹'}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <StarIcon className="w-4 h-4" />
                      <span>整體評分: {assessment.overall_performance_rating}/5</span>
                    </div>
                  </div>
                  
                  {assessment.analysis.has_goal_data && (
                    <div className="mt-3 p-3 bg-gray-50 rounded">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">目標評估概要</h4>
                      <div className="space-y-1">
                        {assessment.analysis.goals_summary.map((goal, index) => (
                          <div key={goal.goal_id} className="text-xs text-gray-600">
                            目標 {index + 1}: {goal.assessment_mode === 'progress' 
                              ? `等級 ${goal.progress_level || 0}` 
                              : `選中 ${goal.selected_levels?.length || 0} 項`
                            }
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-2 text-xs text-gray-500">
                    創建: {new Date(assessment.created_at).toLocaleString('zh-TW')}
                    {assessment.updated_at !== assessment.created_at && (
                      <span className="ml-2">
                        更新: {new Date(assessment.updated_at).toLocaleString('zh-TW')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 選中記錄的詳細資訊 */}
      {selectedAssessment && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">選中記錄詳細資訊</h2>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">基本資訊</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">評估日期:</span> {selectedAssessment.assessment_date}</p>
                <p><span className="font-medium">課程日期:</span> {selectedAssessment.lesson_date}</p>
                <p><span className="font-medium">成長樹:</span> {selectedAssessment.tree?.tree_name}</p>
                <p><span className="font-medium">整體評分:</span> {selectedAssessment.overall_performance_rating}/5</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-700 mb-2">評估資料</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">目標評估:</span> {selectedAssessment.analysis.goal_count} 個</p>
                <p><span className="font-medium">能力評估:</span> {selectedAssessment.analysis.ability_count} 個</p>
                <p><span className="font-medium">狀態:</span> 
                  {selectedAssessment.analysis.has_goal_data || selectedAssessment.analysis.has_ability_data 
                    ? '包含評估資料' 
                    : '無評估資料'
                  }
                </p>
              </div>
            </div>
          </div>
          
          {selectedAssessment.selected_goals.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium text-gray-700 mb-2">目標評估詳細</h3>
              <div className="bg-gray-50 p-3 rounded text-sm">
                <pre>{JSON.stringify(selectedAssessment.selected_goals, null, 2)}</pre>
              </div>
            </div>
          )}
          
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
            <p className="text-blue-800 text-sm">
              <strong>記錄 ID:</strong> {selectedAssessment.id}
            </p>
            <p className="text-blue-600 text-xs mt-1">
              您可以將此 ID 用於測試，或者修改 SimpleAbilityAssessmentModal 來載入此特定記錄
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
