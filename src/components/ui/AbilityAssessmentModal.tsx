import React, { useState, useEffect } from 'react';
import { XMarkIcon, StarIcon, AcademicCapIcon, UserIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { HanamiButton, HanamiCard, HanamiInput } from './index';
import { supabase } from '@/lib/supabase';

interface Student {
  id: string;
  full_name: string;
  nick_name?: string;
}

interface GrowthTree {
  id: string;
  tree_name: string;
  tree_description?: string;
  course_type: string;
}

interface DevelopmentAbility {
  id: string;
  ability_name: string;
  ability_description?: string | null;
  max_level: number;
}

interface AbilityAssessment {
  student_id: string;
  tree_id: string;
  assessment_date: string;
  lesson_date: string;
  teacher_id?: string;
  ability_assessments: {
    [ability_id: string]: {
      level: number;
      notes: string;
      rating: number;
    };
  };
  overall_performance_rating: number;
  general_notes: string;
  next_lesson_focus: string;
}

interface AbilityAssessmentModalProps {
  student: Student;
  tree: GrowthTree;
  onClose: () => void;
  onSubmit: (assessment: AbilityAssessment) => void;
}

export default function AbilityAssessmentModal({
  student,
  tree,
  onClose,
  onSubmit
}: AbilityAssessmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [abilities, setAbilities] = useState<DevelopmentAbility[]>([]);
  const [previousAssessment, setPreviousAssessment] = useState<any>(null);
  
  // 表單狀態
  const [assessmentDate, setAssessmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [lessonDate, setLessonDate] = useState(new Date().toISOString().split('T')[0]);
  const [abilityAssessments, setAbilityAssessments] = useState<{[key: string]: any}>({});
  const [overallRating, setOverallRating] = useState(3);
  const [generalNotes, setGeneralNotes] = useState('');
  const [nextFocus, setNextFocus] = useState('');

  useEffect(() => {
    loadTreeAbilities();
    loadPreviousAssessment();
  }, [student.id, tree.id]);

  const loadTreeAbilities = async () => {
    try {
      // 載入成長樹相關的能力
      const { data: goalsData, error: goalsError } = await supabase
        .from('hanami_growth_goals')
        .select('required_abilities')
        .eq('tree_id', tree.id);

      if (goalsError) throw goalsError;

      // 提取所有需要的能力ID
      const typedGoalsData = (goalsData || []) as Array<{
        required_abilities?: string[] | null;
        [key: string]: any;
      }>;
      const abilityIds = new Set<string>();
      typedGoalsData.forEach(goal => {
        if (goal.required_abilities && Array.isArray(goal.required_abilities)) {
          goal.required_abilities.forEach((abilityId: string) => {
            abilityIds.add(abilityId);
          });
        }
      });

      // 載入能力詳細資訊
      if (abilityIds.size > 0) {
        const { data: abilitiesData, error: abilitiesError } = await supabase
          .from('hanami_development_abilities')
          .select('*')
          .in('id', Array.from(abilityIds));

        if (abilitiesError) throw abilitiesError;
        setAbilities(abilitiesData || []);
      }
    } catch (error) {
      console.error('載入能力資料失敗:', error);
    }
  };

  const loadPreviousAssessment = async () => {
    try {
      const { data, error } = await (supabase as any)
        .rpc('get_latest_ability_assessment', {
          p_student_id: student.id,
          p_tree_id: tree.id
        });

      if (error) throw error;
      if (data && data.length > 0) {
        setPreviousAssessment(data[0]);
      }
    } catch (error) {
      console.error('載入上次評估失敗:', error);
    }
  };

  const updateAbilityAssessment = (abilityId: string, field: string, value: any) => {
    setAbilityAssessments(prev => ({
      ...prev,
      [abilityId]: {
        ...prev[abilityId],
        [field]: value
      }
    }));
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getLevelColor = (level: number, maxLevel: number) => {
    const percentage = (level / maxLevel) * 100;
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    if (percentage >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const handleSubmit = async () => {
    if (!assessmentDate || !lessonDate) {
      alert('請填寫評估日期和上課日期');
      return;
    }

    // 檢查是否所有能力都已評估
    const unassessedAbilities = abilities.filter(ability => 
      !abilityAssessments[ability.id] || 
      !abilityAssessments[ability.id].level ||
      !abilityAssessments[ability.id].rating
    );

    if (unassessedAbilities.length > 0) {
      alert(`請完成以下能力的評估：${unassessedAbilities.map(a => a.ability_name).join(', ')}`);
      return;
    }

    const assessment: AbilityAssessment = {
      student_id: student.id,
      tree_id: tree.id,
      assessment_date: assessmentDate,
      lesson_date: lessonDate,
      ability_assessments: abilityAssessments,
      overall_performance_rating: overallRating,
      general_notes: generalNotes,
      next_lesson_focus: nextFocus
    };

    onSubmit(assessment);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* 標題欄 */}
        <div className="bg-gradient-to-r from-hanami-primary to-hanami-secondary px-6 py-4 border-b border-[#EADBC8] rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">📊</span>
              <div>
                <h2 className="text-2xl font-bold text-hanami-text">能力評估</h2>
                <p className="text-hanami-text-secondary">評估學生在成長樹中的能力發展</p>
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
          {/* 學生和成長樹資訊 */}
          <HanamiCard className="p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-hanami-primary to-hanami-secondary rounded-full flex items-center justify-center">
                  <UserIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-hanami-text">
                    {student.full_name}
                    {student.nick_name && (
                      <span className="text-sm text-hanami-text-secondary ml-2">
                        ({student.nick_name})
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-hanami-text-secondary">學生</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                  <AcademicCapIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-hanami-text">{tree.tree_name}</h3>
                  <p className="text-sm text-hanami-text-secondary">成長樹</p>
                </div>
              </div>
            </div>
          </HanamiCard>

          {/* 日期設定 */}
          <HanamiCard className="p-6 mb-6">
            <h3 className="text-lg font-semibold text-hanami-text mb-4 flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              評估日期設定
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-hanami-text mb-2">
                  評估日期
                </label>
                <input
                  type="date"
                  value={assessmentDate}
                  onChange={(e) => setAssessmentDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hanami-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-hanami-text mb-2">
                  對應上課日期
                </label>
                <input
                  type="date"
                  value={lessonDate}
                  onChange={(e) => setLessonDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hanami-primary focus:border-transparent"
                />
              </div>
            </div>
          </HanamiCard>

          {/* 能力評估區域 */}
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold text-hanami-text flex items-center gap-2">
              <AcademicCapIcon className="h-5 w-5" />
              能力評估
            </h3>
            
            {abilities.map(ability => {
              const assessment = abilityAssessments[ability.id] || {};
              const previousLevel = previousAssessment?.ability_assessments?.[ability.id]?.level;
              
              return (
                <HanamiCard key={ability.id} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-hanami-text mb-1">
                        {ability.ability_name}
                      </h4>
                      {ability.ability_description && (
                        <p className="text-sm text-hanami-text-secondary mb-2">
                          {ability.ability_description}
                        </p>
                      )}
                      {previousLevel && (
                        <div className="flex items-center gap-2 text-sm text-hanami-text-secondary">
                          <span>上次評估:</span>
                          <span className={`px-2 py-1 rounded-full text-white text-xs ${getLevelColor(previousLevel, ability.max_level)}`}>
                            Lv.{previousLevel}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 等級選擇 */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-hanami-text mb-2">
                      當前等級 (1-{ability.max_level})
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: ability.max_level }, (_, i) => i + 1).map(level => (
                        <button
                          key={level}
                          onClick={() => updateAbilityAssessment(ability.id, 'level', level)}
                          className={`px-4 py-2 rounded-lg border transition-colors ${
                            assessment.level === level
                              ? 'bg-hanami-primary text-white border-hanami-primary'
                              : 'bg-white text-hanami-text border-gray-300 hover:border-hanami-primary'
                          }`}
                        >
                          Lv.{level}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 評分和筆記 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-hanami-text mb-2">
                        表現評分 (1-5)
                      </label>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map(rating => (
                          <button
                            key={rating}
                            onClick={() => updateAbilityAssessment(ability.id, 'rating', rating)}
                            className={`p-2 rounded-lg transition-colors ${
                              assessment.rating === rating
                                ? 'bg-yellow-100 text-yellow-600'
                                : 'bg-gray-100 text-gray-400 hover:bg-yellow-50'
                            }`}
                          >
                            <StarIcon className="h-5 w-5" />
                          </button>
                        ))}
                        {assessment.rating && (
                          <span className={`text-sm font-medium ${getRatingColor(assessment.rating)}`}>
                            {assessment.rating}/5
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-hanami-text mb-2">
                        評估筆記
                      </label>
                      <textarea
                        value={assessment.notes || ''}
                        onChange={(e) => updateAbilityAssessment(ability.id, 'notes', e.target.value)}
                        placeholder="記錄學生在此能力的表現..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hanami-primary focus:border-transparent"
                        rows={3}
                      />
                    </div>
                  </div>
                </HanamiCard>
              );
            })}
          </div>

          {/* 整體評估 */}
          <HanamiCard className="p-6 mb-6">
            <h3 className="text-lg font-semibold text-hanami-text mb-4 flex items-center gap-2">
              <StarIcon className="h-5 w-5" />
              整體評估
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-hanami-text mb-2">
                  整體表現評分
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <button
                      key={rating}
                      onClick={() => setOverallRating(rating)}
                      className={`p-3 rounded-lg transition-colors ${
                        overallRating === rating
                          ? 'bg-hanami-primary text-white'
                          : 'bg-gray-100 text-gray-400 hover:bg-hanami-primary hover:text-white'
                      }`}
                    >
                      <StarIcon className="h-6 w-6" />
                    </button>
                  ))}
                  <span className={`text-lg font-medium ml-2 ${getRatingColor(overallRating)}`}>
                    {overallRating}/5
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-hanami-text mb-2">
                  一般筆記
                </label>
                <textarea
                  value={generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                  placeholder="記錄學生整體表現和觀察..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hanami-primary focus:border-transparent"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-hanami-text mb-2">
                  下堂課重點
                </label>
                <textarea
                  value={nextFocus}
                  onChange={(e) => setNextFocus(e.target.value)}
                  placeholder="記錄下堂課需要重點關注的內容..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hanami-primary focus:border-transparent"
                  rows={2}
                />
              </div>
            </div>
          </HanamiCard>
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
            disabled={loading}
            className="bg-gradient-to-r from-hanami-primary to-hanami-secondary"
          >
            {loading ? '儲存中...' : '儲存評估'}
          </HanamiButton>
        </div>
      </div>
    </div>
  );
} 