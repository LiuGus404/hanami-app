'use client';

import { useState, useEffect } from 'react';
import { HanamiButton, HanamiCard } from '@/components/ui';
import { supabase } from '@/lib/supabase';

interface AssessmentRecord {
  id: string;
  student_id: string;
  tree_id: string;
  assessment_date: string;
  selected_goals: any[];
  ability_assessments: any;
  student?: {
    full_name: string;
  };
  tree?: {
    tree_name: string;
  };
}

interface GoalMapping {
  oldId: string;
  oldName?: string;
  newId: string;
  newName: string;
  assessmentMode: string;
  progressLevel?: number;
  selectedLevels?: string[];
}

export default function FixAssessmentGoalMatchingPage() {
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentRecord | null>(null);
  const [treeGoals, setTreeGoals] = useState<any[]>([]);
  const [goalMappings, setGoalMappings] = useState<GoalMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

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
        .limit(20);

      if (error) throw error;
      setAssessments(data || []);
      
      console.log('載入的評估記錄:', data);
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

  const analyzeGoalMatching = (assessment: AssessmentRecord) => {
    if (!treeGoals.length) return [];

    const mappings: GoalMapping[] = [];
    const currentGoalMap = new Map();
    treeGoals.forEach(goal => {
      currentGoalMap.set(goal.id, goal);
    });

    // 處理 selected_goals
    if (assessment.selected_goals && assessment.selected_goals.length > 0) {
      assessment.selected_goals.forEach(selectedGoal => {
        const currentGoal = currentGoalMap.get(selectedGoal.goal_id);
        
        if (currentGoal) {
          // 目標ID匹配
          mappings.push({
            oldId: selectedGoal.goal_id,
            oldName: selectedGoal.goal_name,
            newId: currentGoal.id,
            newName: currentGoal.goal_name,
            assessmentMode: currentGoal.assessment_mode || 'progress',
            progressLevel: selectedGoal.progress_level,
            selectedLevels: selectedGoal.selected_levels
          });
        } else {
          // 目標ID不匹配，嘗試通過名稱匹配
          const matchedGoal = treeGoals.find(goal => goal.goal_name === selectedGoal.goal_name);
          if (matchedGoal) {
            mappings.push({
              oldId: selectedGoal.goal_id,
              oldName: selectedGoal.goal_name,
              newId: matchedGoal.id,
              newName: matchedGoal.goal_name,
              assessmentMode: matchedGoal.assessment_mode || 'progress',
              progressLevel: selectedGoal.progress_level,
              selectedLevels: selectedGoal.selected_levels
            });
          } else {
            // 無法匹配
            mappings.push({
              oldId: selectedGoal.goal_id,
              oldName: selectedGoal.goal_name,
              newId: '',
              newName: '無法匹配',
              assessmentMode: selectedGoal.assessment_mode || 'progress',
              progressLevel: selectedGoal.progress_level,
              selectedLevels: selectedGoal.selected_levels
            });
          }
        }
      });
    }

    // 處理 ability_assessments（如果沒有 selected_goals 或 selected_goals 為空）
    if ((!assessment.selected_goals || assessment.selected_goals.length === 0) && 
        assessment.ability_assessments && Object.keys(assessment.ability_assessments).length > 0) {
      
      console.log('從 ability_assessments 中提取目標評估資料');
      
      Object.entries(assessment.ability_assessments).forEach(([goalId, data]: [string, any]) => {
        const currentGoal = currentGoalMap.get(goalId);
        
        if (currentGoal) {
          // 目標ID匹配
          const assessmentMode = currentGoal.assessment_mode || 'progress';
          mappings.push({
            oldId: goalId,
            oldName: currentGoal.goal_name,
            newId: currentGoal.id,
            newName: currentGoal.goal_name,
            assessmentMode: assessmentMode,
            progressLevel: assessmentMode === 'progress' ? data.level : undefined,
            selectedLevels: assessmentMode === 'multi_select' ? data.selected_levels : undefined
          });
        } else {
          // 目標ID不匹配，嘗試通過名稱匹配
          const matchedGoal = treeGoals.find(goal => goal.id === goalId);
          if (matchedGoal) {
            const assessmentMode = matchedGoal.assessment_mode || 'progress';
            mappings.push({
              oldId: goalId,
              oldName: matchedGoal.goal_name,
              newId: matchedGoal.id,
              newName: matchedGoal.goal_name,
              assessmentMode: assessmentMode,
              progressLevel: assessmentMode === 'progress' ? data.level : undefined,
              selectedLevels: assessmentMode === 'multi_select' ? data.selected_levels : undefined
            });
          } else {
            // 無法匹配
            mappings.push({
              oldId: goalId,
              oldName: '未知目標',
              newId: '',
              newName: '無法匹配',
              assessmentMode: data.assessment_mode || 'progress',
              progressLevel: data.level,
              selectedLevels: data.selected_levels
            });
          }
        }
      });
    }

    return mappings;
  };

  const fixGoalMatching = async (assessmentId: string) => {
    if (!selectedAssessment) return;

    try {
      setProcessing(true);
      
      const mappings = analyzeGoalMatching(selectedAssessment);
      const validMappings = mappings.filter(m => m.newId !== '');
      
      if (validMappings.length === 0) {
        alert('沒有可修復的目標匹配問題');
        return;
      }

      // 創建新的 selected_goals 資料
      const newSelectedGoals = validMappings.map(mapping => ({
        goal_id: mapping.newId,
        goal_name: mapping.newName,
        assessment_mode: mapping.assessmentMode,
        progress_level: mapping.progressLevel,
        selected_levels: mapping.selectedLevels
      }));

      // 如果原始資料是從 ability_assessments 轉換而來，清理 ability_assessments
      let updatedAbilityAssessments = selectedAssessment.ability_assessments || {};
      
      if (!selectedAssessment.selected_goals || selectedAssessment.selected_goals.length === 0) {
        // 從 ability_assessments 中移除已轉換的目標
        validMappings.forEach(mapping => {
          delete updatedAbilityAssessments[mapping.oldId];
        });
      }

      // 更新資料庫
      const { data, error } = await supabase
        .from('hanami_ability_assessments')
        .update({
          selected_goals: newSelectedGoals,
          ability_assessments: updatedAbilityAssessments,
          updated_at: new Date().toISOString()
        })
        .eq('id', assessmentId)
        .select()
        .single();

      if (error) throw error;

      alert(`成功修復 ${validMappings.length} 個目標匹配問題`);
      
      // 重新載入資料
      await loadAssessments();
      setSelectedAssessment(null);
      setGoalMappings([]);
    } catch (error) {
      console.error('修復目標匹配失敗:', error);
      alert('修復失敗: ' + (error as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  const handleAssessmentSelect = (assessment: AssessmentRecord) => {
    setSelectedAssessment(assessment);
    loadTreeGoals(assessment.tree_id);
    const mappings = analyzeGoalMatching(assessment);
    setGoalMappings(mappings);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-10">
          <p className="text-[#87704e]">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-[#2B3A3B] mb-6">修復評估記錄目標匹配</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 評估記錄列表 */}
        <div>
          <h2 className="text-xl font-semibold text-[#2B3A3B] mb-4">評估記錄列表</h2>
          <div className="space-y-4">
            {assessments.map((assessment) => {
              const selectedGoalsCount = Array.isArray(assessment.selected_goals) ? assessment.selected_goals.length : 0;
              const abilityAssessmentsCount = assessment.ability_assessments ? Object.keys(assessment.ability_assessments).length : 0;
              const hasData = selectedGoalsCount > 0 || abilityAssessmentsCount > 0;
              
              return (
                <HanamiCard 
                  key={assessment.id} 
                  className="p-4 cursor-pointer hover:shadow-lg transition-all"
                  onClick={() => handleAssessmentSelect(assessment)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-[#2B3A3B]">
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
                      {!hasData && (
                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                          無資料
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-[#87704e] mb-2">
                    {assessment.tree?.tree_name || '未知成長樹'}
                  </p>
                  
                  <div className="text-xs text-[#A68A64] space-y-1">
                    <p>評估日期: {new Date(assessment.assessment_date).toLocaleDateString('zh-HK')}</p>
                    <p>創建時間: {new Date(assessment.assessment_date).toLocaleString('zh-HK')}</p>
                  </div>
                </HanamiCard>
              );
            })}
          </div>
        </div>

        {/* 目標匹配分析 */}
        {selectedAssessment && (
          <div>
            <h2 className="text-xl font-semibold text-[#2B3A3B] mb-4">目標匹配分析</h2>
            
            <HanamiCard className="p-6">
              <h3 className="font-semibold text-[#2B3A3B] mb-4">
                {selectedAssessment.student?.full_name} - {selectedAssessment.tree?.tree_name}
              </h3>
              
              <div className="space-y-4">
                {/* 原始資料調試 */}
                <div>
                  <h4 className="font-medium text-[#2B3A3B] mb-2">原始資料調試</h4>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <details className="text-sm">
                      <summary className="cursor-pointer font-medium">selected_goals</summary>
                      <pre className="mt-2 text-xs overflow-auto">
                        {JSON.stringify(selectedAssessment.selected_goals, null, 2)}
                      </pre>
                    </details>
                    
                    <details className="text-sm mt-2">
                      <summary className="cursor-pointer font-medium">ability_assessments</summary>
                      <pre className="mt-2 text-xs overflow-auto">
                        {JSON.stringify(selectedAssessment.ability_assessments, null, 2)}
                      </pre>
                    </details>
                  </div>
                </div>

                {/* 目標匹配列表 */}
                <div>
                  <h4 className="font-medium text-[#2B3A3B] mb-2">目標匹配狀況</h4>
                  <div className="space-y-2">
                    {goalMappings.map((mapping, index) => (
                      <div key={index} className={`p-3 rounded-lg border ${
                        mapping.newId === '' 
                          ? 'bg-red-50 border-red-200' 
                          : mapping.oldId !== mapping.newId
                          ? 'bg-yellow-50 border-yellow-200'
                          : 'bg-green-50 border-green-200'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{mapping.oldName || mapping.oldId}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            mapping.newId === '' 
                              ? 'bg-red-100 text-red-800' 
                              : mapping.oldId !== mapping.newId
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {mapping.newId === '' ? '無法匹配' : mapping.oldId !== mapping.newId ? 'ID已變更' : '匹配正常'}
                          </span>
                        </div>
                        
                        {mapping.newId !== '' && mapping.oldId !== mapping.newId && (
                          <div className="text-xs text-gray-600">
                            <p>舊ID: {mapping.oldId}</p>
                            <p>新ID: {mapping.newId}</p>
                            <p>評估模式: {mapping.assessmentMode}</p>
                            {mapping.progressLevel !== undefined && (
                              <p>進度等級: {mapping.progressLevel}</p>
                            )}
                            {mapping.selectedLevels && mapping.selectedLevels.length > 0 && (
                              <p>選中項目: {mapping.selectedLevels.join(', ')}</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 修復按鈕 */}
                <div className="flex gap-2">
                  <HanamiButton
                    onClick={() => fixGoalMatching(selectedAssessment.id)}
                    disabled={processing}
                  >
                    修復目標匹配
                  </HanamiButton>
                  
                  <HanamiButton
                    onClick={() => {
                      setSelectedAssessment(null);
                      setGoalMappings([]);
                    }}
                    variant="secondary"
                  >
                    取消
                  </HanamiButton>
                </div>
              </div>
            </HanamiCard>
          </div>
        )}
      </div>
    </div>
  );
}
