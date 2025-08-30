'use client';

import { useState, useEffect } from 'react';
import { HanamiCard, HanamiButton } from '@/components/ui';
import { supabase } from '@/lib/supabase';

interface AssessmentRecord {
  id: string;
  student_id: string;
  tree_id: string;
  assessment_date: string;
  selected_goals?: any[];
  ability_assessments?: any;
  student?: { full_name: string };
  tree?: { tree_name: string };
}

export default function DebugAssessmentDataPage() {
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentRecord | null>(null);
  const [treeGoals, setTreeGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssessments();
  }, []);

  const loadAssessments = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('hanami_ability_assessments')
        .select(`
          *,
          student:Hanami_Students(full_name),
          tree:hanami_growth_trees(tree_name)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAssessments(data || []);
      
      // 調試：顯示所有記錄的基本資訊
      console.log('=== 所有評估記錄基本資訊 ===');
      data?.forEach((assessment, index) => {
        const selectedGoalsCount = Array.isArray(assessment.selected_goals) ? assessment.selected_goals.length : 0;
        const abilityAssessmentsCount = assessment.ability_assessments ? Object.keys(assessment.ability_assessments).length : 0;
        
        console.log(`${index + 1}. ${assessment.student?.full_name} - ${assessment.tree?.tree_name}`);
        console.log(`   評估日期: ${assessment.assessment_date}`);
        console.log(`   selected_goals: ${selectedGoalsCount} 個`);
        console.log(`   ability_assessments: ${abilityAssessmentsCount} 個`);
        console.log(`   ID: ${assessment.id}`);
        console.log('---');
      });
    } catch (error) {
      console.error('載入評估記錄失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTreeGoals = async (treeId: string) => {
    try {
      const { data, error } = await supabase
        .from('hanami_growth_goals')
        .select('*')
        .eq('tree_id', treeId)
        .order('goal_order');

      if (error) throw error;
      setTreeGoals(data || []);
    } catch (error) {
      console.error('載入成長樹目標失敗:', error);
    }
  };

  const handleAssessmentSelect = async (assessment: AssessmentRecord) => {
    setSelectedAssessment(assessment);
    if (assessment.tree_id) {
      await loadTreeGoals(assessment.tree_id);
    }
  };

  const analyzeData = (assessment: AssessmentRecord) => {
    const selectedGoals = assessment.selected_goals || [];
    const abilityAssessments = assessment.ability_assessments || {};
    
    console.log('=== 資料分析 ===');
    console.log('評估記錄:', assessment);
    console.log('selected_goals:', selectedGoals);
    console.log('ability_assessments:', abilityAssessments);
    console.log('成長樹目標:', treeGoals);
    
    // 檢查目標匹配
    const matchedGoals = selectedGoals.filter(goal => 
      treeGoals.some(treeGoal => treeGoal.id === goal.goal_id)
    );
    
    const unmatchedGoals = selectedGoals.filter(goal => 
      !treeGoals.some(treeGoal => treeGoal.id === goal.goal_id)
    );
    
    console.log('匹配的目標:', matchedGoals);
    console.log('未匹配的目標:', unmatchedGoals);
    
    return { matchedGoals, unmatchedGoals };
  };

  const findZhiriRecord = async () => {
    try {
      console.log('=== 查找芷睿的評估記錄 ===');
      
      const response = await fetch('/api/debug-student-assessment?studentName=芷睿');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '查找失敗');
      }
      
      console.log('API返回結果:', result);
      
      if (result.assessments && result.assessments.length > 0) {
        setSelectedAssessment(result.assessments[0]);
        setTreeGoals(result.treeGoals || []);
        console.log('已載入芷睿的評估記錄和成長樹目標');
        
        // 如果成長樹目標為空，嘗試直接載入
        if (result.treeGoals.length === 0 && result.assessments[0].tree_id) {
          console.log('成長樹目標為空，嘗試直接載入...');
          await loadTreeGoalsDirectly(result.assessments[0].tree_id);
        }
      } else {
        console.log('未找到芷睿的評估記錄');
      }
    } catch (error) {
      console.error('查找芷睿記錄失敗:', error);
    }
  };

  const loadTreeGoalsDirectly = async (treeId: string) => {
    try {
      console.log('=== 直接載入成長樹目標 ===');
      console.log('樹ID:', treeId);
      
      const response = await fetch(`/api/debug-tree-goals?treeId=${treeId}`);
      const result = await response.json();
      
      if (!response.ok) {
        console.error('API錯誤響應:', result);
        throw new Error(result.error || '載入失敗');
      }
      
      console.log('成長樹目標載入結果:', result);
      setTreeGoals(result.goals || []);
    } catch (error) {
      console.error('直接載入成長樹目標失敗:', error);
      // 顯示錯誤詳情
      if (error instanceof Error) {
        console.error('錯誤詳情:', error.message);
      }
    }
  };

  const findZhiriRecordByDate = async (date: string) => {
    try {
      console.log('=== 查找芷睿指定日期的評估記錄 ===');
      console.log('日期:', date);
      
      // 先查找芷睿的學生ID
      const { data: students, error: studentError } = await supabase
        .from('Hanami_Students')
        .select('id, full_name')
        .eq('full_name', '芷睿');

      if (studentError) throw studentError;
      
      if (!students || students.length === 0) {
        console.log('未找到芷睿的學生記錄');
        return;
      }

      const studentId = students[0].id;
      console.log('芷睿的學生ID:', studentId);
      
      // 查找指定日期的評估記錄
      const { data, error } = await supabase
        .from('hanami_ability_assessments')
        .select(`
          *,
          student:Hanami_Students(full_name),
          tree:hanami_growth_trees(tree_name)
        `)
        .eq('student_id', studentId)
        .eq('assessment_date', date)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log('找到的評估記錄:', data);
      
      if (data && data.length > 0) {
        setSelectedAssessment(data[0]);
        if (data[0].tree_id) {
          await loadTreeGoalsDirectly(data[0].tree_id);
        }
      } else {
        console.log(`未找到芷睿 ${date} 的評估記錄`);
      }
    } catch (error) {
      console.error('查找芷睿指定日期記錄失敗:', error);
    }
  };

  const checkDatabaseStructure = async () => {
    try {
      console.log('=== 檢查資料庫結構 ===');
      
      const response = await fetch('/api/debug-database-structure');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '檢查失敗');
      }
      
      console.log('資料庫結構檢查結果:', result);
    } catch (error) {
      console.error('檢查資料庫結構失敗:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">載入中...</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">評估記錄資料調試</h1>
      
      <div className="mb-6">
        <HanamiButton onClick={findZhiriRecord} className="mr-4">
          查找芷睿記錄
        </HanamiButton>
        <HanamiButton onClick={() => findZhiriRecordByDate('2025-08-15')} className="mr-4">
          查找芷睿 8/15 記錄
        </HanamiButton>
        <HanamiButton onClick={checkDatabaseStructure} className="mr-4">
          檢查資料庫結構
        </HanamiButton>
        <span className="text-sm text-gray-600">點擊按鈕直接查找芷睿的評估記錄</span>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 評估記錄列表 */}
        <div>
          <h2 className="text-xl font-semibold mb-4">評估記錄列表</h2>
          <div className="space-y-4">
            {assessments.map((assessment) => {
              const selectedGoalsCount = Array.isArray(assessment.selected_goals) ? assessment.selected_goals.length : 0;
              const abilityAssessmentsCount = assessment.ability_assessments ? Object.keys(assessment.ability_assessments).length : 0;
              
              return (
                <HanamiCard 
                  key={assessment.id} 
                  className="p-4 cursor-pointer hover:shadow-lg transition-all"
                  onClick={() => handleAssessmentSelect(assessment)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">
                      {assessment.student?.full_name || '未知學生'}
                    </h3>
                    <div className="flex gap-1">
                      {selectedGoalsCount > 0 && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {selectedGoalsCount} 個目標
                        </span>
                      )}
                      {abilityAssessmentsCount > 0 && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          {abilityAssessmentsCount} 個能力
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    {assessment.tree?.tree_name || '未知成長樹'}
                  </p>
                  
                  <div className="text-xs text-gray-500">
                    <p>評估日期: {new Date(assessment.assessment_date).toLocaleDateString('zh-HK')}</p>
                    <p>創建時間: {new Date(assessment.assessment_date).toLocaleString('zh-HK')}</p>
                  </div>
                </HanamiCard>
              );
            })}
          </div>
        </div>

        {/* 詳細分析 */}
        {selectedAssessment && (
          <div>
            <h2 className="text-xl font-semibold mb-4">詳細分析</h2>
            <HanamiCard className="p-4">
              <h3 className="font-medium mb-4">
                {selectedAssessment.student?.full_name} - {selectedAssessment.tree?.tree_name}
              </h3>
              
              <div className="space-y-4">
                {/* 原始資料 */}
                <div>
                  <h4 className="font-medium mb-2">原始資料</h4>
                  <details className="text-sm">
                    <summary className="cursor-pointer">selected_goals</summary>
                    <pre className="mt-2 text-xs overflow-auto bg-gray-100 p-2 rounded">
                      {JSON.stringify(selectedAssessment.selected_goals, null, 2)}
                    </pre>
                  </details>
                  
                  <details className="text-sm mt-2">
                    <summary className="cursor-pointer">ability_assessments</summary>
                    <pre className="mt-2 text-xs overflow-auto bg-gray-100 p-2 rounded">
                      {JSON.stringify(selectedAssessment.ability_assessments, null, 2)}
                    </pre>
                  </details>
                </div>

                {/* 成長樹目標 */}
                <div>
                  <h4 className="font-medium mb-2">成長樹目標 ({treeGoals.length} 個)</h4>
                  <div className="space-y-2">
                    {treeGoals.map((goal) => (
                      <div key={goal.id} className="text-sm p-2 bg-gray-50 rounded">
                        <div className="font-medium">{goal.goal_name}</div>
                        <div className="text-xs text-gray-600">ID: {goal.id}</div>
                        <div className="text-xs text-gray-600">評估模式: {goal.assessment_mode || 'progress'}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 分析結果 */}
                <div>
                  <h4 className="font-medium mb-2">分析結果</h4>
                  <HanamiButton 
                    onClick={() => analyzeData(selectedAssessment)}
                    className="mb-2"
                  >
                    執行分析
                  </HanamiButton>
                  
                  <div className="text-sm">
                    <p>請點擊"執行分析"按鈕，然後查看瀏覽器控制台的輸出結果。</p>
                  </div>
                </div>
              </div>
            </HanamiCard>
          </div>
        )}
      </div>
    </div>
  );
}
