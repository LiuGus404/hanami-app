import React from 'react';
import { XMarkIcon, UserIcon, AcademicCapIcon, BookOpenIcon, StarIcon } from '@heroicons/react/24/outline';
import { HanamiButton } from './index';

interface GrowthTreeDetailModalProps {
  tree: any;
  goals: any[];
  abilitiesOptions: { value: string; label: string }[];
  activitiesOptions: { value: string; label: string }[];
  teachersOptions: { value: string; label: string }[];
  studentsInTree?: any[]; // 在此成長樹的學生
  onClose: () => void;
  onEdit?: () => void;
  onManageStudents?: () => void;
}

export function GrowthTreeDetailModal({
  tree,
  goals,
  abilitiesOptions,
  activitiesOptions,
  teachersOptions,
  studentsInTree = [],
  onClose,
  onEdit,
  onManageStudents
}: GrowthTreeDetailModalProps) {
  const completedGoals = goals.filter(goal => goal.is_completed).length;
  const progressPercentage = goals.length > 0 ? (completedGoals / goals.length) * 100 : 0;

  // 獲取老師名稱
  const getTeacherNames = (teacherIds: string[]) => {
    if (!teacherIds || teacherIds.length === 0) return ['未指定'];
    return teacherIds.map(id => {
      const teacher = teachersOptions.find(t => t.value === id);
      return teacher ? teacher.label : '未知老師';
    });
  };

  // 獲取能力名稱
  const getAbilityNames = (abilityIds: string[]) => {
    if (!abilityIds || abilityIds.length === 0) return [];
    return abilityIds.map(id => {
      const ability = abilitiesOptions.find(a => a.value === id);
      return ability ? ability.label : '未知能力';
    });
  };

  // 獲取活動名稱
  const getActivityNames = (activityIds: string[]) => {
    return activityIds.map(id => 
      activitiesOptions.find(option => option.value === id)?.label || '未知活動'
    );
  };

  // 月齡轉歲數的輔助函數
  const convertMonthsToAge = (months: number | null): string => {
    if (!months) return '未設定';
    if (months < 12) return `${months}個月`;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (remainingMonths === 0) return `${years}歲`;
    return `${years}歲${remainingMonths}個月`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* 標題欄 */}
        <div className="bg-gradient-to-r from-hanami-primary to-hanami-secondary px-6 py-4 border-b border-[#EADBC8] rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{tree.tree_icon || '🌳'}</span>
              <h2 className="text-2xl font-bold text-hanami-text">{tree.tree_name}</h2>
            </div>
            <div className="flex items-center gap-2">
              {onEdit && (
                <HanamiButton
                  variant="secondary"
                  onClick={onEdit}
                  className="bg-white/20 hover:bg-white/30 text-hanami-text border-white/30"
                >
                  編輯
                </HanamiButton>
              )}
              {onManageStudents && (
                <HanamiButton
                  variant="secondary"
                  onClick={onManageStudents}
                  className="bg-white/20 hover:bg-white/30 text-hanami-text border-white/30"
                >
                  學生管理
                </HanamiButton>
              )}
              <button
                className="text-hanami-text hover:text-hanami-text-secondary transition-colors p-2"
                onClick={onClose}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* 內容區域 - 可滾動 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 左側：基本信息 */}
            <div className="space-y-6">
              {/* 描述 */}
              <div>
                <h3 className="text-lg font-semibold text-hanami-text mb-3 flex items-center gap-2">
                  <BookOpenIcon className="h-5 w-5" />
                  描述
                </h3>
                <div className="bg-hanami-surface p-4 rounded-lg border border-[#EADBC8]">
                  <p className="text-hanami-text">
                    {tree.tree_description || '暫無描述'}
                  </p>
                </div>
              </div>

              {/* 基本信息 */}
              <div>
                <h3 className="text-lg font-semibold text-hanami-text mb-3">基本信息</h3>
                <div className="bg-hanami-surface p-4 rounded-lg border border-[#EADBC8] space-y-3">
                  <div className="flex justify-between">
                    <span className="text-hanami-text-secondary">課程類型:</span>
                    <span className="text-hanami-text font-medium">{tree.course_type || '未指定'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-hanami-text-secondary">等級:</span>
                    <span className="text-hanami-text font-medium">Lv.{tree.tree_level || 1}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-hanami-text-secondary">狀態:</span>
                    <span className={`font-medium ${tree.is_active ? 'text-green-600' : 'text-red-600'}`}>
                      {tree.is_active ? '啟用' : '停用'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-hanami-text-secondary">目標總數:</span>
                    <span className="text-hanami-text font-medium">{goals.length} 個</span>
                  </div>
                </div>
              </div>

              {/* 進度概覽 */}
              <div>
                <h3 className="text-lg font-semibold text-hanami-text mb-3">進度概覽</h3>
                <div className="bg-hanami-surface p-4 rounded-lg border border-[#EADBC8]">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-hanami-text">完成進度</span>
                    <span className="text-hanami-text font-medium">{completedGoals}/{goals.length}</span>
                  </div>
                  <div className="w-full bg-white rounded-full h-3 mb-2">
                    <div 
                      className="bg-gradient-to-r from-hanami-primary to-hanami-secondary h-3 rounded-full transition-all duration-300" 
                      style={{ width: `${progressPercentage}%` }} 
                    />
                  </div>
                  <p className="text-sm text-hanami-text-secondary">
                    完成率: {progressPercentage.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* 負責老師 */}
              <div>
                <h3 className="text-lg font-semibold text-hanami-text mb-3 flex items-center gap-2">
                  <AcademicCapIcon className="h-5 w-5" />
                  負責老師
                </h3>
                <div className="bg-hanami-surface p-4 rounded-lg border border-[#EADBC8]">
                  {tree.review_teachers && tree.review_teachers.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {getTeacherNames(tree.review_teachers).map((teacher, index) => (
                        <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-hanami-primary/20 text-hanami-text border border-hanami-primary/30">
                          {teacher}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-hanami-text-secondary">未指定負責老師</p>
                  )}
                </div>
              </div>

              {/* 備註 */}
              {tree.notes && (
                <div>
                  <h3 className="text-lg font-semibold text-hanami-text mb-3">備註</h3>
                  <div className="bg-hanami-surface p-4 rounded-lg border border-[#EADBC8]">
                    <p className="text-hanami-text">{tree.notes}</p>
                  </div>
                </div>
              )}
            </div>

            {/* 右側：目標和學生 */}
            <div className="space-y-6">
              {/* 目標列表 */}
              <div>
                <h3 className="text-lg font-semibold text-hanami-text mb-3 flex items-center gap-2">
                  <StarIcon className="h-5 w-5" />
                  目標列表 ({goals.length})
                </h3>
                <div className="bg-hanami-surface p-4 rounded-lg border border-[#EADBC8] max-h-80 overflow-y-auto">
                  {goals.length > 0 ? (
                    <div className="space-y-4">
                      {goals.map((goal, index) => (
                        <div key={goal.id} className="border border-[#EADBC8] rounded-lg p-3 bg-white">
                          <div className="flex items-start gap-3 mb-2">
                            <span className="text-xl">{goal.goal_icon || '⭐'}</span>
                            <div className="flex-1">
                              <h4 className="font-medium text-hanami-text">{goal.goal_name}</h4>
                              {goal.goal_description && (
                                <p className="text-sm text-hanami-text-secondary mt-1">{goal.goal_description}</p>
                              )}
                            </div>
                            <span className={`text-sm px-2 py-1 rounded-full ${
                              goal.is_completed 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {goal.is_completed ? '已完成' : '進行中'}
                            </span>
                          </div>
                          
                          {/* 所需能力 */}
                          {goal.required_abilities && goal.required_abilities.length > 0 && (
                            <div className="mb-2">
                              <span className="text-xs text-hanami-text-secondary">所需能力:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {getAbilityNames(goal.required_abilities).map((ability, idx) => (
                                  <span key={idx} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                    {ability}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 相關活動 */}
                          {goal.related_activities && goal.related_activities.length > 0 && (
                            <div>
                              <span className="text-xs text-hanami-text-secondary">相關活動:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {getActivityNames(goal.related_activities).map((activity, idx) => (
                                  <span key={idx} className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                    {activity}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-hanami-text-secondary text-center py-8">暫無目標</p>
                  )}
                </div>
              </div>

              {/* 在此成長樹的學生 */}
              <div>
                <h3 className="text-lg font-semibold text-hanami-text mb-3 flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  在此成長樹的學生 ({studentsInTree.length})
                </h3>
                <div className="bg-hanami-surface p-4 rounded-lg border border-[#EADBC8] max-h-60 overflow-y-auto">
                  {studentsInTree.length > 0 ? (
                    <div className="space-y-2">
                      {studentsInTree.map((student, index) => {
                        console.log(`學生 ${student.full_name} 的課程類型:`, student.course_type);
                        return (
                          <div key={student.id} className="flex items-center justify-between p-2 bg-white rounded border border-[#EADBC8]">
                            <div>
                              <span className="font-medium text-hanami-text">{student.full_name || student.nick_name}</span>
                              {student.student_age && (
                                <span className="text-sm text-hanami-text-secondary ml-2">({convertMonthsToAge(student.student_age)})</span>
                              )}
                            </div>
                            <span className="text-sm text-hanami-text-secondary">
                              {student.course_type && student.course_type.trim() !== '' ? student.course_type : '未指定課程'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-hanami-text-secondary text-center py-8">暫無學生在此成長樹</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 底部按鈕 */}
        <div className="p-6 border-t border-[#EADBC8] flex justify-end">
          <HanamiButton variant="secondary" onClick={onClose}>
            關閉
          </HanamiButton>
        </div>
      </div>
    </div>
  );
} 