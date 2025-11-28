'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  StarIcon,
  AcademicCapIcon,
  CalendarIcon,
  UserIcon,
  ChartBarIcon,
  EyeIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  TrophyIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';
import { Target } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

interface AbilityAssessment {
  id: string;
  student_id: string;
  tree_id: string;
  assessment_date: string;
  lesson_date: string;
  teacher_id: string | null;
  ability_assessments: any;
  overall_performance_rating: number;
  general_notes: string | null;
  next_lesson_focus: string | null;
  selected_goals: any[];
  created_at: string;
  updated_at: string;
}

interface DevelopmentAbility {
  id: string;
  ability_name: string;
  ability_description?: string | null;
  max_level: number;
}

interface GrowthTree {
  id: string;
  tree_name: string;
  tree_description?: string | null;
}

interface StudentAbilityAssessmentsProps {
  studentId: string;
  className?: string;
  maxAssessments?: number;
  showDetails?: boolean;
  isTeacher?: boolean; // 是否為老師端
  orgId?: string | null; // 機構 ID
}

// 評分星星組件
const RatingStars: React.FC<{ rating: number; maxRating?: number }> = ({ 
  rating, 
  maxRating = 5 
}) => {
  return (
    <div className="flex items-center space-x-1">
      {Array.from({ length: maxRating }, (_, index) => (
        <StarIcon
          key={index}
          className={`w-4 h-4 ${
            index < rating 
              ? 'text-yellow-400 fill-current' 
              : 'text-gray-300'
          }`}
        />
      ))}
      <span className="ml-2 text-sm text-gray-600">{rating}/{maxRating}</span>
    </div>
  );
};

// 能力評估詳情組件
const AbilityAssessmentDetail: React.FC<{ 
  assessment: AbilityAssessment; 
  abilities: DevelopmentAbility[];
  tree: GrowthTree;
  isExpanded: boolean;
  onToggle: () => void;
  latestProgressNotes?: {notes: string; lessonId: string; lessonDate: string} | null;
}> = ({ assessment, abilities, tree, isExpanded, onToggle, latestProgressNotes }) => {
  const abilityAssessments = assessment.ability_assessments || {};
  
  return (
    <motion.div
      className="border border-gray-200 rounded-lg overflow-hidden"
      initial={false}
      animate={{ height: isExpanded ? 'auto' : 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="p-4 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 整體表現 */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800 flex items-center">
              <TrophyIcon className="w-5 h-5 mr-2 text-yellow-500" />
              整體表現
            </h4>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">評分</span>
              <RatingStars rating={assessment.overall_performance_rating} />
            </div>
          </div>

          {/* 成長樹資訊 */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800 flex items-center">
              <AcademicCapIcon className="w-5 h-5 mr-2 text-blue-500" />
              評估成長樹
            </h4>
            <div className="text-sm">
              <div className="font-medium text-gray-800">{tree.tree_name}</div>
              {tree.tree_description && (
                <div className="text-gray-600 mt-1">{tree.tree_description}</div>
              )}
            </div>
          </div>
        </div>

        {/* 各項能力評估 */}
        {Object.keys(abilityAssessments).length > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
              <ChartBarIcon className="w-5 h-5 mr-2 text-green-500" />
              各項能力評估
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(abilityAssessments).map(([abilityId, assessmentData]: [string, any]) => {
                const ability = abilities.find(a => a.id === abilityId);
                if (!ability) return null;

                return (
                  <div key={abilityId} className="bg-white p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-gray-800">{ability.ability_name}</h5>
                      <span className="text-sm text-gray-600">等級 {assessmentData.level || 0}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">評分</span>
                        <RatingStars rating={assessmentData.rating || 0} />
                      </div>
                      {assessmentData.notes && (
                        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                          {assessmentData.notes}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 進度筆記 */}
        {latestProgressNotes && (
          <div className="mt-4">
            <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
              <Target className="w-5 h-5 mr-2 text-green-500" />
              進度筆記
              <span className="ml-2 text-xs text-gray-500 font-normal">
                ({new Date(latestProgressNotes.lessonDate).toLocaleDateString('zh-TW')})
              </span>
            </h4>
            <div className="text-sm text-gray-600 bg-white p-3 rounded-lg border whitespace-pre-wrap leading-relaxed">
              {latestProgressNotes.notes}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default function StudentAbilityAssessments({ 
  studentId, 
  className = '', 
  maxAssessments = 5,
  showDetails = true,
  isTeacher = false,
  orgId = null
}: StudentAbilityAssessmentsProps) {
  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState<AbilityAssessment[]>([]);
  const [abilities, setAbilities] = useState<DevelopmentAbility[]>([]);
  const [trees, setTrees] = useState<GrowthTree[]>([]);
  const [expandedAssessment, setExpandedAssessment] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [latestProgressNotes, setLatestProgressNotes] = useState<{notes: string; lessonId: string; lessonDate: string} | null>(null);

  // 載入能力評估數據
  const loadAssessmentData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('載入學生能力評估數據:', studentId);

      // 載入能力評估記錄
      const { data: assessmentsDataRaw, error: assessmentsError } = await supabase
        .from('hanami_ability_assessments')
        .select('*')
        .eq('student_id', studentId)
        .order('assessment_date', { ascending: false });
      
      const assessmentsData = assessmentsDataRaw as Array<{ tree_id: string; [key: string]: any; }> | null;

      if (assessmentsError) {
        console.error('載入能力評估失敗:', assessmentsError);
        setError('載入能力評估失敗');
        return;
      }

      console.log('載入到的能力評估:', assessmentsData);

      // 載入所有能力定義
      const { data: abilitiesData, error: abilitiesError } = await supabase
        .from('hanami_development_abilities')
        .select('*');

      if (abilitiesError) {
        console.error('載入能力定義失敗:', abilitiesError);
      }

      // 載入成長樹資訊
      const treeIds = [...new Set(assessmentsData?.map(a => a.tree_id) || [])];
      let treesData: GrowthTree[] = [];
      
      if (treeIds.length > 0) {
        const { data: treesDataResult, error: treesError } = await supabase
          .from('hanami_growth_trees')
          .select('id, tree_name, tree_description')
          .in('id', treeIds);

        if (treesError) {
          console.error('載入成長樹失敗:', treesError);
        } else {
          treesData = treesDataResult || [];
        }
      }

      setAssessments((assessmentsData || []) as any);
      setAbilities(abilitiesData || []);
      setTrees(treesData);

    } catch (error) {
      console.error('載入能力評估數據失敗:', error);
      setError('載入失敗');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    if (studentId) {
      loadAssessmentData();
    }
  }, [studentId, loadAssessmentData]);

  // 載入最新的進度筆記
  useEffect(() => {
    const loadLatestProgressNotes = async () => {
      if (!studentId) return;
      
      try {
        let query = supabase
          .from('hanami_student_lesson')
          .select('id, progress_notes, lesson_date')
          .eq('student_id', studentId)
          .order('lesson_date', { ascending: false });

        // 如果有 orgId，添加 org_id 過濾
        if (orgId) {
          query = query.eq('org_id', orgId);
        }

        const { data, error } = await query;

        if (error && error.code !== 'PGRST116') {
          console.error('載入進度筆記失敗:', error);
          return;
        }

        // 過濾掉空值和空字符串的記錄
        const validNotes = (data || []).filter(
          (item: any) => item && item.progress_notes && typeof item.progress_notes === 'string' && item.progress_notes.trim().length > 0
        ) as Array<{ id: string; progress_notes: string; lesson_date: string }>;

        if (validNotes.length > 0) {
          const latestNote = validNotes[0];
          setLatestProgressNotes({
            notes: latestNote.progress_notes,
            lessonId: latestNote.id,
            lessonDate: latestNote.lesson_date
          });
        } else {
          setLatestProgressNotes(null);
        }
      } catch (error) {
        console.error('載入進度筆記時發生錯誤:', error);
      }
    };

    loadLatestProgressNotes();
  }, [studentId, orgId]);

  const toggleAssessmentDetail = (assessmentId: string) => {
    setExpandedAssessment(expandedAssessment === assessmentId ? null : assessmentId);
  };

  const getTreeName = (treeId: string) => {
    const tree = trees.find(t => t.id === treeId);
    return tree?.tree_name || '未知成長樹';
  };

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-center py-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-[#FFD59A] border-t-transparent rounded-full"
          />
          <span className="ml-3 text-[#2B3A3B]">載入能力評估中...</span>
        </div>
      </div>
    );
  }

  if (error || assessments.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <AcademicCapIcon className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500">{error || '沒有找到能力評估記錄'}</p>
        </div>
      </div>
    );
  }

  const displayAssessments = assessments.slice(0, maxAssessments);

  return (
    <div className={`${className}`}>
      {/* 標題 */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-[#4B4036] flex items-center">
          <motion.div
            className="p-2 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-lg mr-3"
            whileHover={{ rotate: 15 }}
          >
            <AcademicCapIcon className="w-5 h-5 text-white" />
          </motion.div>
          能力評估記錄
        </h3>
        <p className="text-[#2B3A3B] text-sm mt-1">
          共 {assessments.length} 筆評估記錄
        </p>
      </div>

      {/* 評估記錄列表 */}
      <div className="space-y-4">
        <AnimatePresence>
          {displayAssessments.map((assessment, index) => (
            <motion.div
              key={assessment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* 評估記錄標題 */}
              <div 
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => showDetails && toggleAssessmentDetail(assessment.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* 評估日期 */}
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-800">
                          {new Date(assessment.assessment_date).toLocaleDateString('zh-TW')}
                        </div>
                        <div className="text-xs text-gray-500">
                          課程日期: {new Date(assessment.lesson_date).toLocaleDateString('zh-TW')}
                        </div>
                      </div>
                    </div>

                    {/* 成長樹名稱 */}
                    <div className="text-sm">
                      <div className="font-medium text-gray-800">
                        {getTreeName(assessment.tree_id)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* 整體評分 */}
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1">整體評分</div>
                      <RatingStars rating={assessment.overall_performance_rating} />
                    </div>

                    {/* 展開/收起按鈕 */}
                    {showDetails && (
                      <motion.button
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {expandedAssessment === assessment.id ? (
                          <ChevronUpIcon className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                        )}
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>

              {/* 評估詳情 */}
              {showDetails && (
                <AbilityAssessmentDetail
                  assessment={assessment}
                  abilities={abilities}
                  tree={trees.find(t => t.id === assessment.tree_id) || { id: '', tree_name: '未知', tree_description: '' }}
                  isExpanded={expandedAssessment === assessment.id}
                  onToggle={() => toggleAssessmentDetail(assessment.id)}
                  latestProgressNotes={latestProgressNotes}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 查看更多按鈕 */}
      {assessments.length > maxAssessments && (
        <motion.div
          className="mt-6 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <button className="px-4 py-2 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] hover:from-[#EBC9A4] hover:to-[#D4A586] text-[#2B3A3B] rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg">
            查看更多記錄 ({assessments.length - maxAssessments} 筆)
          </button>
        </motion.div>
      )}
    </div>
  );
}

