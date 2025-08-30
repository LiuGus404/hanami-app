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

export default function DebugOldAssessmentPage() {
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [treeGoals, setTreeGoals] = useState<any[]>([]);
  const [analysisResults, setAnalysisResults] = useState<any[]>([]);

  useEffect(() => {
    loadAssessments();
  }, []);

  const loadAssessments = async () => {
    try {
      setLoading(true);
      
      // 使用新的 API 端點來獲取分析結果
      const response = await fetch('/api/fix-old-assessments?limit=20');
      const result = await response.json();
      
      if (result.success) {
        setAnalysisResults(result.data.assessments);
        console.log('分析結果:', result.data);
      } else {
        console.error('獲取分析結果失敗:', result.error);
      }
      
      // 同時載入原始資料
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

  const analyzeAssessment = (assessment: AssessmentRecord) => {
    console.log('=== 分析評估記錄 ===');
    console.log('評估記錄 ID:', assessment.id);
    console.log('學生:', assessment.student?.full_name);
    console.log('成長樹:', assessment.tree?.tree_name);
    console.log('評估日期:', assessment.assessment_date);
    
    console.log('selected_goals:', assessment.selected_goals);
    console.log('ability_assessments:', assessment.ability_assessments);
    
    // 分析資料結構
    const selectedGoalsCount = Array.isArray(assessment.selected_goals) ? assessment.selected_goals.length : 0;
    const abilityAssessmentsCount = assessment.ability_assessments ? Object.keys(assessment.ability_assessments).length : 0;
    
    console.log('selected_goals 數量:', selectedGoalsCount);
    console.log('ability_assessments 數量:', abilityAssessmentsCount);
    
    // 檢查是否有舊版資料
    if (selectedGoalsCount === 0 && abilityAssessmentsCount > 0) {
      console.log('⚠️ 檢測到舊版評估記錄格式');
      
      // 分析 ability_assessments 中的資料
      Object.entries(assessment.ability_assessments).forEach(([key, value]) => {
        console.log(`目標 ${key}:`, value);
      });
    }
    
    return {
      selectedGoalsCount,
      abilityAssessmentsCount,
      isOldFormat: selectedGoalsCount === 0 && abilityAssessmentsCount > 0
    };
  };

  const convertOldToNew = (assessment: AssessmentRecord) => {
    if (!assessment.ability_assessments) return null;
    
    const convertedGoals: any[] = [];
    
    Object.entries(assessment.ability_assessments).forEach(([goalId, data]: [string, any]) => {
      // 查找對應的目標資訊
      const goal = treeGoals.find(g => g.id === goalId);
      if (goal) {
        const assessmentMode = goal.assessment_mode || 'progress';
        let convertedGoal: any = {
          goal_id: goalId,
          goal_name: goal.goal_name,
          assessment_mode: assessmentMode
        };
        
        if (assessmentMode === 'progress') {
          convertedGoal.progress_level = data.level || 0;
        } else if (assessmentMode === 'multi_select') {
          convertedGoal.selected_levels = data.selected_levels || [];
        }
        
        convertedGoals.push(convertedGoal);
      }
    });
    
    return convertedGoals;
  };

  const fixOldAssessment = async (assessmentId: string, dryRun = false) => {
    try {
      setProcessing(true);
      
      const response = await fetch('/api/fix-old-assessments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assessmentId,
          dryRun
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('修復結果:', result);
        alert(dryRun ? '模擬修復完成' : '修復完成: ' + result.message);
        
        // 重新載入資料
        await loadAssessments();
      } else {
        console.error('修復失敗:', result.error);
        alert('修復失敗: ' + result.error);
      }
    } catch (error) {
      console.error('修復過程出錯:', error);
      alert('修復過程出錯: ' + (error as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  const batchFixOldAssessments = async (dryRun = false) => {
    const oldFormatAssessments = analysisResults.filter(a => a.is_old_format);
    
    if (oldFormatAssessments.length === 0) {
      alert('沒有需要修復的舊版評估記錄');
      return;
    }

    if (!dryRun && !confirm(`確定要修復 ${oldFormatAssessments.length} 個舊版評估記錄嗎？`)) {
      return;
    }

    try {
      setProcessing(true);
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const assessment of oldFormatAssessments) {
        try {
          const response = await fetch('/api/fix-old-assessments', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              assessmentId: assessment.id,
              dryRun
            }),
          });

          const result = await response.json();
          
          if (result.success) {
            successCount++;
            console.log(`修復成功: ${assessment.student_name} - ${assessment.tree_name}`);
          } else {
            errorCount++;
            console.error(`修復失敗: ${assessment.student_name} - ${result.error}`);
          }
        } catch (error) {
          errorCount++;
          console.error(`修復過程出錯: ${assessment.student_name} - ${error}`);
        }
      }
      
      alert(`${dryRun ? '模擬' : '批量'}修復完成！成功: ${successCount}, 失敗: ${errorCount}`);
      
      // 重新載入資料
      await loadAssessments();
    } catch (error) {
      console.error('批量修復過程出錯:', error);
      alert('批量修復過程出錯: ' + (error as Error).message);
    } finally {
      setProcessing(false);
    }
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
      <h1 className="text-3xl font-bold text-[#2B3A3B] mb-6">舊版評估記錄調試</h1>
      
      {/* 批量操作按鈕 */}
      <div className="mb-6 flex gap-4">
        <HanamiButton
          onClick={() => batchFixOldAssessments(true)}
          variant="secondary"
          disabled={processing}
        >
          模擬批量修復
        </HanamiButton>
        
        <HanamiButton
          onClick={() => batchFixOldAssessments(false)}
          disabled={processing}
        >
          實際批量修復
        </HanamiButton>
        
        <HanamiButton
          onClick={loadAssessments}
          variant="secondary"
          disabled={processing}
        >
          重新載入
        </HanamiButton>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 評估記錄列表 */}
        <div>
          <h2 className="text-xl font-semibold text-[#2B3A3B] mb-4">評估記錄列表</h2>
          <div className="space-y-4">
            {analysisResults.map((analysis) => {
              const assessment = assessments.find(a => a.id === analysis.id);
              
              return (
                <HanamiCard 
                  key={analysis.id} 
                  className="p-4 cursor-pointer hover:shadow-lg transition-all"
                  onClick={() => {
                    if (assessment) {
                      setSelectedAssessment(assessment);
                      loadTreeGoals(assessment.tree_id);
                    }
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-[#2B3A3B]">
                      {analysis.student_name || '未知學生'}
                    </h3>
                    {analysis.is_old_format && (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                        舊版格式
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-[#87704e] mb-2">
                    {analysis.tree_name || '未知成長樹'}
                  </p>
                  
                  <div className="text-xs text-[#A68A64] space-y-1">
                    <p>評估日期: {new Date(analysis.assessment_date).toLocaleDateString('zh-HK')}</p>
                    <p>selected_goals: {analysis.selected_goals_count} 項</p>
                    <p>ability_assessments: {analysis.ability_assessments_count} 項</p>
                  </div>
                  
                  {analysis.needs_fix && (
                    <div className="mt-3 flex gap-2">
                      <HanamiButton
                        onClick={() => {
                          fixOldAssessment(analysis.id, true);
                        }}
                        variant="secondary"
                        size="sm"
                        disabled={processing}
                      >
                        模擬修復
                      </HanamiButton>
                      
                      <HanamiButton
                        onClick={() => {
                          if (confirm('確定要修復此評估記錄嗎？')) {
                            fixOldAssessment(analysis.id, false);
                          }
                        }}
                        size="sm"
                        disabled={processing}
                      >
                        實際修復
                      </HanamiButton>
                    </div>
                  )}
                </HanamiCard>
              );
            })}
          </div>
        </div>

        {/* 詳細分析 */}
        {selectedAssessment && (
          <div>
            <h2 className="text-xl font-semibold text-[#2B3A3B] mb-4">詳細分析</h2>
            
            <HanamiCard className="p-6">
              <h3 className="font-semibold text-[#2B3A3B] mb-4">
                {selectedAssessment.student?.full_name} - {selectedAssessment.tree?.tree_name}
              </h3>
              
              <div className="space-y-4">
                {/* 原始資料 */}
                <div>
                  <h4 className="font-medium text-[#2B3A3B] mb-2">原始資料結構</h4>
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

                {/* 當前目標 */}
                <div>
                  <h4 className="font-medium text-[#2B3A3B] mb-2">當前成長樹目標</h4>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-[#87704e] mb-2">
                      共 {treeGoals.length} 個目標
                    </p>
                    <div className="space-y-2">
                      {treeGoals.map((goal) => (
                        <div key={goal.id} className="text-sm">
                          <span className="font-medium">{goal.goal_name}</span>
                          <span className="text-[#A68A64] ml-2">
                            ({goal.assessment_mode || 'progress'})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 轉換結果 */}
                <div>
                  <h4 className="font-medium text-[#2B3A3B] mb-2">轉換結果</h4>
                  <div className="bg-green-50 p-3 rounded-lg">
                    {(() => {
                      const convertedGoals = convertOldToNew(selectedAssessment);
                      return (
                        <div>
                          <p className="text-sm text-[#87704e] mb-2">
                            可轉換 {convertedGoals?.length || 0} 個目標
                          </p>
                          {convertedGoals && convertedGoals.length > 0 && (
                            <details className="text-sm">
                              <summary className="cursor-pointer font-medium">查看轉換結果</summary>
                              <pre className="mt-2 text-xs overflow-auto">
                                {JSON.stringify(convertedGoals, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* 操作按鈕 */}
                <div className="flex gap-2">
                  <HanamiButton
                    onClick={() => {
                      const analysis = analyzeAssessment(selectedAssessment);
                      console.log('分析結果:', analysis);
                    }}
                    variant="secondary"
                    size="sm"
                  >
                    重新分析
                  </HanamiButton>
                  
                  <HanamiButton
                    onClick={() => {
                      const convertedGoals = convertOldToNew(selectedAssessment);
                      console.log('轉換結果:', convertedGoals);
                    }}
                    variant="secondary"
                    size="sm"
                  >
                    測試轉換
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
