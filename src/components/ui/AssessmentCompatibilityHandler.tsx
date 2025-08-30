import React from 'react';
import { AlertTriangleIcon, InfoIcon, CheckCircleIcon } from 'lucide-react';

interface CompatibilityIssue {
  type: 'deleted_goal' | 'level_count_changed' | 'max_level_changed' | 'assessment_mode_changed';
  goalId: string;
  goalName: string;
  originalData?: any;
  currentData?: any;
  message: string;
}

interface AssessmentCompatibilityHandlerProps {
  assessment: any;
  currentGoals: any[];
  onCompatibilityProcessed?: (processedAssessment: any, issues: CompatibilityIssue[]) => void;
}

export function AssessmentCompatibilityHandler({
  assessment,
  currentGoals,
  onCompatibilityProcessed
}: AssessmentCompatibilityHandlerProps) {
  
  const processCompatibility = () => {
    const issues: CompatibilityIssue[] = [];
    const selectedGoals = assessment.selected_goals || [];
    const abilityAssessments = assessment.ability_assessments || {};
    
    // 創建當前目標的映射
    const currentGoalMap = new Map();
    currentGoals.forEach(goal => {
      currentGoalMap.set(goal.id, goal);
    });
    
    // 處理 selected_goals 的兼容性
    const processedSelectedGoals = selectedGoals.map((selectedGoal: any) => {
      const currentGoal = currentGoalMap.get(selectedGoal.goal_id);
      
      if (!currentGoal) {
        issues.push({
          type: 'deleted_goal',
          goalId: selectedGoal.goal_id,
          goalName: selectedGoal.goal_name || '未知目標',
          originalData: selectedGoal,
          message: `目標 "${selectedGoal.goal_name || '未知目標'}" 已從成長樹中移除`
        });
        
        return {
          ...selectedGoal,
          _deleted: true,
          _original_data: selectedGoal
        };
      }
      
      // 檢查評估模式是否匹配
      const currentAssessmentMode = currentGoal.assessment_mode || 'progress';
      const recordedAssessmentMode = selectedGoal.assessment_mode || 'progress';
      
      if (currentAssessmentMode !== recordedAssessmentMode) {
        issues.push({
          type: 'assessment_mode_changed',
          goalId: selectedGoal.goal_id,
          goalName: currentGoal.goal_name,
          originalData: { mode: recordedAssessmentMode },
          currentData: { mode: currentAssessmentMode },
          message: `目標 "${currentGoal.goal_name}" 的評估模式已從 ${recordedAssessmentMode} 變更為 ${currentAssessmentMode}`
        });
      }
      
      // 檢查多選模式的等級數量是否匹配
      if (currentAssessmentMode === 'multi_select') {
        const currentLevels = currentGoal.multi_select_levels || [];
        const recordedLevels = selectedGoal.selected_levels || [];
        
        if (currentLevels.length !== recordedLevels.length) {
          issues.push({
            type: 'level_count_changed',
            goalId: selectedGoal.goal_id,
            goalName: currentGoal.goal_name,
            originalData: { levels: recordedLevels },
            currentData: { levels: currentLevels },
            message: `目標 "${currentGoal.goal_name}" 的等級數量已從 ${recordedLevels.length} 變更為 ${currentLevels.length}`
          });
          
          // 過濾掉不存在的等級
          const validLevels = recordedLevels.filter((level: string) => currentLevels.includes(level));
          
          return {
            ...selectedGoal,
            selected_levels: validLevels,
            _level_count_changed: true,
            _original_levels: recordedLevels,
            _current_levels: currentLevels
          };
        }
      }
      
      // 檢查進度模式的等級數量是否匹配
      if (currentAssessmentMode === 'progress') {
        const currentMaxLevel = currentGoal.progress_max || 5;
        const recordedLevel = selectedGoal.progress_level || 0;
        
        if (currentMaxLevel !== (selectedGoal._original_max_level || currentMaxLevel)) {
          issues.push({
            type: 'max_level_changed',
            goalId: selectedGoal.goal_id,
            goalName: currentGoal.goal_name,
            originalData: { maxLevel: selectedGoal._original_max_level || currentMaxLevel },
            currentData: { maxLevel: currentMaxLevel },
            message: `目標 "${currentGoal.goal_name}" 的最大等級已從 ${selectedGoal._original_max_level || currentMaxLevel} 調整為 ${currentMaxLevel}`
          });
          
          // 調整記錄的等級以適應新的最大值
          const adjustedLevel = Math.min(recordedLevel, currentMaxLevel);
          
          return {
            ...selectedGoal,
            progress_level: adjustedLevel,
            _max_level_changed: true,
            _original_max_level: selectedGoal._original_max_level || currentMaxLevel,
            _current_max_level: currentMaxLevel
          };
        }
      }
      
      return selectedGoal;
    });
    
    // 處理 ability_assessments 的兼容性
    const processedAbilityAssessments = { ...abilityAssessments };
    
    // 檢查是否有能力評估指向已刪除的目標
    Object.keys(processedAbilityAssessments).forEach(abilityId => {
      const currentGoal = currentGoalMap.get(abilityId);
      if (!currentGoal) {
        issues.push({
          type: 'deleted_goal',
          goalId: abilityId,
          goalName: '未知目標',
          originalData: processedAbilityAssessments[abilityId],
          message: `能力評估對應的目標 ${abilityId} 已不存在`
        });
        
        processedAbilityAssessments[abilityId] = {
          ...processedAbilityAssessments[abilityId],
          _deleted: true,
          _original_data: processedAbilityAssessments[abilityId]
        };
      }
    });
    
    const processedAssessment = {
      ...assessment,
      selected_goals: processedSelectedGoals,
      ability_assessments: processedAbilityAssessments,
      _compatibility_processed: true
    };
    
    onCompatibilityProcessed?.(processedAssessment, issues);
    return { processedAssessment, issues };
  };
  
  const { processedAssessment, issues } = processCompatibility();
  
  if (issues.length === 0) {
    return null; // 沒有兼容性問題，不需要顯示任何內容
  }
  
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <InfoIcon className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">版本兼容性處理</span>
        </div>
        <p className="text-sm text-blue-700">
          檢測到 {issues.length} 個版本兼容性問題，已自動處理以確保評估記錄能正確顯示。
        </p>
      </div>
      
      {issues.map((issue, index) => (
        <div key={index} className={`border p-4 rounded-lg ${
          issue.type === 'deleted_goal' ? 'bg-red-50 border-red-200' :
          issue.type === 'level_count_changed' ? 'bg-orange-50 border-orange-200' :
          issue.type === 'max_level_changed' ? 'bg-yellow-50 border-yellow-200' :
          'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {issue.type === 'deleted_goal' && <AlertTriangleIcon className="w-4 h-4 text-red-600" />}
            {issue.type === 'level_count_changed' && <AlertTriangleIcon className="w-4 h-4 text-orange-600" />}
            {issue.type === 'max_level_changed' && <AlertTriangleIcon className="w-4 h-4 text-yellow-600" />}
            {issue.type === 'assessment_mode_changed' && <InfoIcon className="w-4 h-4 text-blue-600" />}
            <span className={`text-sm font-medium ${
              issue.type === 'deleted_goal' ? 'text-red-800' :
              issue.type === 'level_count_changed' ? 'text-orange-800' :
              issue.type === 'max_level_changed' ? 'text-yellow-800' :
              'text-blue-800'
            }`}>
              {issue.message}
            </span>
          </div>
          
          {issue.originalData && (
            <details className="mt-2">
              <summary className="text-sm cursor-pointer hover:underline">
                查看詳細資訊
              </summary>
              <div className="mt-2 text-xs bg-white p-2 rounded border">
                <div className="mb-2">
                  <strong>原始資料:</strong>
                  <pre className="mt-1 overflow-auto">
                    {JSON.stringify(issue.originalData, null, 2)}
                  </pre>
                </div>
                {issue.currentData && (
                  <div>
                    <strong>當前資料:</strong>
                    <pre className="mt-1 overflow-auto">
                      {JSON.stringify(issue.currentData, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
      ))}
    </div>
  );
}

export default AssessmentCompatibilityHandler;
