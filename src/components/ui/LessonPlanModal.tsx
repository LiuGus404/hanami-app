'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Plus, X, CheckCircle, Clock, AlertCircle } from 'lucide-react';

import { PopupSelect } from '@/components/ui/PopupSelect';
import { ActivitySelectModal } from '@/components/ui/ActivitySelectModal';
import StudentActivitiesPanel from '@/components/ui/StudentActivitiesPanel';
import { useTeachers } from '@/hooks/useLessonPlans';
import { getSupabaseClient } from '@/lib/supabase';
import { TreeActivity } from '@/types/progress';

interface LessonPlanModalProps {
  open: boolean;
  onClose: () => void;
  lessonDate: Date;
  timeslot: string;
  courseType: string;
  existingPlan?: any;
  onSaved?: () => void;
  students?: Array<{
    id: string;
    name: string;
  }>;
  isDefaultTime?: boolean; // 新增：是否為預設時間模式
}

interface ClassStudent {
  id: string;
  name: string;
  isTrial: boolean;
  age: number | null;
  nickName: string | null;
}

interface ActivityOption {
  id: string;
  name: string;
  type: 'tree_activity' | 'class_activity';
  description?: string;
  difficulty?: number;
  duration?: number;
  treeName?: string;
  studentName?: string;
  completionStatus?: string;
}

const LessonPlanModal = ({
  open,
  onClose,
  lessonDate,
  timeslot,
  courseType,
  existingPlan,
  onSaved,
  students = [],
  isDefaultTime = false,
}: LessonPlanModalProps) => {
  const [topic, setTopic] = useState('');
  const [objectives, setObjectives] = useState<string[]>(['']);
  const [selectedActivities, setSelectedActivities] = useState<ActivityOption[]>([]);
  const [remarks, setRemarks] = useState('');
  const [selectedTeacher1, setSelectedTeacher1] = useState<string[]>([]);
  const [selectedTeacher2, setSelectedTeacher2] = useState<string[]>([]);
  const [showPopup, setShowPopup] = useState<'main' | 'assist' | 'activities' | null>(null);
  const [tempSelectedTeacher1, setTempSelectedTeacher1] = useState<string[]>([]);
  const [tempSelectedTeacher2, setTempSelectedTeacher2] = useState<string[]>([]);
  const [tempSelectedActivities, setTempSelectedActivities] = useState<ActivityOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());
  const [classStudents, setClassStudents] = useState<ClassStudent[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [treeActivities, setTreeActivities] = useState<TreeActivity[]>([]);
  const [classActivities, setClassActivities] = useState<ActivityOption[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [loadingClassActivities, setLoadingClassActivities] = useState(false);
  const [loadError, setLoadError] = useState<string>('');
  
  // 個別學生活動狀態
  const [individualCurrentActivities, setIndividualCurrentActivities] = useState<ActivityOption[]>([]);
  const [individualOngoingActivities, setIndividualOngoingActivities] = useState<ActivityOption[]>([]);
  const [lastFetchKey, setLastFetchKey] = useState<string>('');
  // 學習活動分類狀態
  const [ongoingActivityTab, setOngoingActivityTab] = useState<'in_progress' | 'completed'>('in_progress');
  // 預設時間模式下的日期選擇
  const [selectedLessonDate, setSelectedLessonDate] = useState<Date>(lessonDate);

  const supabase = getSupabaseClient();
  const { teachers, loading } = useTeachers();

  // 清理活動數據
  const clearActivities = () => {
    setIndividualCurrentActivities([]);
    setIndividualOngoingActivities([]);
    setClassActivities([]);
    setLoadError('');
    setOngoingActivityTab('in_progress'); // 重置為預設標籤
  };

  // 獲取課堂學生資料
  const fetchClassStudents = async () => {
    if (!open || !selectedLessonDate || !timeslot || !courseType) return;
    
    // 清理舊的活動數據
    clearActivities();
    
    setLoadingStudents(true);
    try {
      // 確保日期格式一致，使用香港時區
      const hkDate = new Date(selectedLessonDate.getTime() + 8 * 60 * 60 * 1000);
      const lessonDateStr = hkDate.toISOString().split('T')[0];
      console.log('Fetching students for:', { lessonDateStr, timeslot, courseType });
      const response = await fetch(
        `/api/class-students?lessonDate=${lessonDateStr}&timeslot=${timeslot}&courseType=${courseType}`
      );
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setClassStudents(result.data);
          console.log('Fetched class students:', result.data);
        } else {
          console.error('Failed to fetch class students:', result.error);
          setClassStudents([]);
        }
      } else {
        console.error('API error:', response.status);
        setClassStudents([]);
      }
    } catch (error) {
      console.error('Error fetching class students:', error);
      setClassStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  // 獲取成長樹活動
  const fetchTreeActivities = async () => {
    if (!open) return;
    
    setLoadingActivities(true);
    try {
      const response = await fetch('/api/tree-activities?is_active=true');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setTreeActivities(result.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching tree activities:', error);
      setTreeActivities([]);
    } finally {
      setLoadingActivities(false);
    }
  };

  // 獲取課堂學生活動
  const fetchClassActivities = async (forceRefresh = false) => {
    if (!open || !selectedLessonDate || !timeslot || !courseType || classStudents.length === 0) return;
    
    console.log('fetchClassActivities called:', { forceRefresh, classStudents: classStudents.length });
    
    // 生成當前請求的唯一鍵
    const currentKey = `${selectedLessonDate?.toISOString()}-${timeslot}-${courseType}-${classStudents.length}`;
    
    // 如果不是強制刷新且與上次請求相同，則跳過
    if (!forceRefresh && currentKey === lastFetchKey) {
      console.log('Skipping fetch - same key:', currentKey);
      return;
    }
    
    setLastFetchKey(currentKey);
    setLoadingClassActivities(true);
    try {
      const hkDate = new Date(selectedLessonDate.getTime() + 8 * 60 * 60 * 1000);
      const lessonDateStr = hkDate.toISOString().split('T')[0];
      
      // 分別存儲不同類型的活動
      const currentActivities: ActivityOption[] = [];
      const ongoingActivities: ActivityOption[] = [];
      
      // 使用 Promise.all 並行處理所有學生的活動請求
      const studentPromises = classStudents.map(async (student) => {
        try {
          const response = await fetch(
            `/api/student-activities?studentId=${student.id}&lessonDate=${lessonDateStr}&timeslot=${timeslot}`
          );
          
          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              const studentCurrentActivities: ActivityOption[] = [];
              const studentOngoingActivities: ActivityOption[] = [];
              
              // 處理當前課堂活動
              result.data.currentLessonActivities?.forEach((activity: any) => {
                studentCurrentActivities.push({
                  id: `current_${student.id}_${activity.id}`,
                  name: activity.activityName,
                  type: 'class_activity',
                  description: activity.activityDescription,
                  difficulty: activity.difficultyLevel,
                  duration: activity.estimatedDuration,
                  treeName: `本次課堂 - ${student.name}`,
                  studentName: student.name,
                  completionStatus: activity.completionStatus
                });
              });
              
              // 處理正在學習的活動
              result.data.ongoingActivities?.forEach((activity: any) => {
                studentOngoingActivities.push({
                  id: `ongoing_${student.id}_${activity.id}`,
                  name: activity.activityName,
                  type: 'class_activity',
                  description: activity.activityDescription,
                  difficulty: activity.difficultyLevel,
                  duration: activity.estimatedDuration,
                  treeName: `正在學習 - ${student.name}`,
                  studentName: student.name,
                  completionStatus: activity.completionStatus
                });
              });
              
              return { studentCurrentActivities, studentOngoingActivities };
            }
          }
        } catch (error) {
          console.error(`Error fetching activities for student ${student.id}:`, error);
        }
        return { studentCurrentActivities: [], studentOngoingActivities: [] };
      });
      
      // 等待所有請求完成
      const results = await Promise.all(studentPromises);
      
      // 合併所有學生的活動
      results.forEach(({ studentCurrentActivities, studentOngoingActivities }) => {
        currentActivities.push(...studentCurrentActivities);
        ongoingActivities.push(...studentOngoingActivities);
      });
      
      console.log('Activities loaded:', { 
        currentActivities: currentActivities.length, 
        ongoingActivities: ongoingActivities.length 
      });
      
      setIndividualCurrentActivities(currentActivities);
      setIndividualOngoingActivities(ongoingActivities);
      setClassActivities([...currentActivities, ...ongoingActivities]); // 保持向後相容
      setLoadError(''); // 清除錯誤狀態
    } catch (error) {
      console.error('Error fetching class activities:', error);
      setIndividualCurrentActivities([]);
      setIndividualOngoingActivities([]);
      setClassActivities([]);
      setLoadError('載入學生活動失敗，請重試');
    } finally {
      setLoadingClassActivities(false);
    }
  };

  // 獲取該時段的班別活動
  const fetchLessonPlanActivities = async () => {
    if (!open || !selectedLessonDate || !timeslot || !courseType) return;
    
    try {
      const hkDate = new Date(lessonDate.getTime() + 8 * 60 * 60 * 1000);
      const lessonDateStr = hkDate.toISOString().split('T')[0];
      
      const response = await fetch(
        `/api/lesson-plan-activities?lessonDate=${lessonDateStr}&timeslot=${timeslot}&courseType=${courseType}`
      );
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // 檢查是否需要設置資料表
          if (result.tableMissing) {
            console.warn('班別活動資料表不存在:', result.message);
            // 不顯示錯誤，只是記錄警告
            return;
          }
          
          // 將班別活動轉換為 ActivityOption 格式
          const classActivities = result.data.map((activity: any) => ({
            id: `class_${activity.id}`,
            name: activity.name,
            type: 'tree_activity',
            description: activity.description,
            difficulty: activity.difficulty,
            duration: activity.duration,
            treeName: '班別活動',
            activityId: activity.activityId
          }));
          
          // 更新已選活動，只保留班別活動
          const otherActivities = selectedActivities.filter(a => a.type !== 'tree_activity');
          setSelectedActivities([...otherActivities, ...classActivities]);
        }
      }
    } catch (error) {
      console.error('Error fetching lesson plan activities:', error);
    }
  };

  useEffect(() => {
    if (open && lessonDate && timeslot && courseType) {
      fetchClassStudents();
      fetchTreeActivities();
    }
  }, [open, lessonDate, timeslot, courseType]);

  useEffect(() => {
    if (classStudents.length > 0 && open && lessonDate && timeslot && courseType) {
      fetchClassActivities();
    }
  }, [classStudents, lessonDate, timeslot, courseType, open]);

  useEffect(() => {
    if (open && lessonDate && timeslot && courseType) {
      fetchLessonPlanActivities();
    }
  }, [open, lessonDate, timeslot, courseType]);

  useEffect(() => {
    console.log('existingPlan:', existingPlan);
    if (existingPlan) {
      setTopic(existingPlan.topic || '');
      setObjectives(
        Array.isArray(existingPlan.objectives)
          ? existingPlan.objectives
          : existingPlan.objectives
            ? JSON.parse(existingPlan.objectives)
            : [''],
      );
      // 處理教學活動 - 從 materials 欄位轉換為 selectedActivities
      const materials = Array.isArray(existingPlan.materials)
        ? existingPlan.materials
        : existingPlan.materials
          ? JSON.parse(existingPlan.materials)
          : [];
      
      // 將 materials 轉換為 ActivityOption 格式
      const activities: ActivityOption[] = materials.map((material: string, index: number) => ({
        id: `existing_${index}`,
        name: material,
        type: 'tree_activity',
        description: material
      }));
      setSelectedActivities(activities);
      
      setRemarks(existingPlan.remarks || '');
      setSelectedTeacher1(existingPlan.teacher_ids_1 || []);
      setSelectedTeacher2(
        Array.isArray(existingPlan.teacher_ids_2)
          ? existingPlan.teacher_ids_2
          : existingPlan.teacher_ids_2
            ? JSON.parse(existingPlan.teacher_ids_2)
            : [],
      );
    } else {
      setTopic('');
      setObjectives(['']);
      setSelectedActivities([]);
      setRemarks('');
      setSelectedTeacher1([]);
      setSelectedTeacher2([]);
    }
  }, [existingPlan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const hkDate = new Date(lessonDate.getTime() + 8 * 60 * 60 * 1000);
      const lessonDateStr = hkDate.toISOString().split('T')[0];
      
      // 將選中的活動轉換為 materials 格式（向後相容）
      const materials = selectedActivities.map(activity => activity.name);
      
      const planData = {
        lesson_date: lessonDateStr,
        timeslot,
        course_type: courseType,
        topic,
        objectives: objectives.filter(obj => obj.trim() !== ''),
        materials: materials.filter(mat => mat.trim() !== ''), // 過濾空字符串
        teacher_ids: selectedTeacher1, // 使用正確的欄位名稱
        teacher_names: selectedTeacher1.map(id => teachers.find(t => t.id === id)?.name || ''), // 添加教師名稱
        teacher_ids_1: selectedTeacher1,
        teacher_ids_2: selectedTeacher2.length > 0 ? selectedTeacher2 : [], // 保持為陣列格式
        theme: topic, // 添加主題欄位
        notes: remarks, // 使用正確的欄位名稱
        created_at: new Date().toISOString(),
      };

      console.log('handleSubmit timeslot:', timeslot);
      console.log('planData:', planData);

      if (existingPlan?.id) {
        const { error } = await supabase
          .from('hanami_lesson_plan')
          .update(planData)
          .eq('id', existingPlan.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('hanami_lesson_plan')
          .insert(planData);
        if (error) throw error;
      }

      // 保存班別活動分配
      const classActivityIds = selectedActivities
        .filter(a => a.type === 'tree_activity')
        .map(a => a.id.replace('tree_', ''))
        .filter(Boolean);

      if (classActivityIds.length > 0) {
        const activityResponse = await fetch('/api/lesson-plan-activities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lessonDate: lessonDateStr,
            timeslot: timeslot,
            courseType: courseType,
            activityIds: classActivityIds
          }),
        });

        if (!activityResponse.ok) {
          console.error('Failed to save class activities');
        }
      }

      if (onSaved) onSaved();
      onClose();
    } catch (error) {
      console.error('Error saving lesson plan:', error);
      alert('儲存失敗，請稍後再試');
    } finally {
      setSaving(false);
    }
  };

  const handleTestFill = () => {
    setTopic('測試主題');
    setObjectives(['目標1', '目標2']);
    setSelectedActivities([
      {
        id: 'test_1',
        name: '測試成長樹活動',
        type: 'tree_activity',
        description: '測試活動描述',
        treeName: '測試成長樹'
      },
      {
        id: 'test_2',
        name: '測試本次課堂活動',
        type: 'class_activity',
        description: '本次課堂活動描述',
        studentName: '測試學生',
        completionStatus: 'in_progress'
      },
      {
        id: 'test_3',
        name: '測試正在學習活動',
        type: 'class_activity',
        description: '正在學習活動描述',
        studentName: '測試學生',
        completionStatus: 'not_started'
      }
    ]);
    setRemarks('測試備註');
  };

  const addField = (type: 'objectives') => {
    if (type === 'objectives') setObjectives([...objectives, '']);
  };

  const removeField = (type: 'objectives', index: number) => {
    if (type === 'objectives') setObjectives(objectives.filter((_, i) => i !== index));
  };

  const handleDelete = async () => {
    if (!existingPlan?.id) return;
    if (!window.confirm('確定要刪除這份教案嗎？')) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('hanami_lesson_plan')
        .delete()
        .eq('id', existingPlan.id);
      if (error) throw error;
      if (onSaved) onSaved();
      onClose();
    } catch (error) {
      console.error('Error deleting lesson plan:', error);
      alert('刪除失敗，請稍後再試');
    } finally {
      setSaving(false);
    }
  };

  const toggleStudentExpanded = (studentId: string) => {
    const newExpanded = new Set(expandedStudents);
    if (newExpanded.has(studentId)) {
      newExpanded.delete(studentId);
    } else {
      newExpanded.add(studentId);
    }
    setExpandedStudents(newExpanded);
  };

  // 準備活動選項
  const prepareActivityOptions = (type: 'activities' | 'current_activities' | 'ongoing_activities' = 'activities'): { value: string; label: string; group?: string }[] => {
    const options: { value: string; label: string; group?: string }[] = [];
    
    if (type === 'activities') {
      // 班別學生活動 - 只顯示成長樹活動
      if (treeActivities.length > 0) {
        options.push({ value: '', label: '── 成長樹活動 ──', group: 'tree' });
        treeActivities.forEach(activity => {
          const activityName = (activity as any).activity_source === 'teaching' && (activity as any).hanami_teaching_activities
            ? (activity as any).hanami_teaching_activities.activity_name
            : (activity as any).custom_activity_name || '未命名活動';
          
          const treeName = (activity as any).hanami_growth_trees?.tree_name || '未知成長樹';
          options.push({
            value: `tree_${activity.id}`,
            label: `${activityName} (${treeName})`,
            group: 'tree'
          });
        });
      }
         } else if (type === 'current_activities') {
       // 個別安排的學生活動 - 顯示所有學生的本次課堂活動
       if (individualCurrentActivities.length > 0) {
         options.push({ value: '', label: '── 所有學生的本次課堂活動 ──', group: 'current' });
         individualCurrentActivities.forEach(activity => {
           const statusText = activity.completionStatus === 'completed' ? '✅' : 
                            activity.completionStatus === 'in_progress' ? '🔄' : '⏳';
           options.push({
             value: activity.id,
             label: `${statusText} ${activity.name} (${activity.studentName})`,
             group: 'current'
           });
         });
       }
     } else if (type === 'ongoing_activities') {
       // 個別學習中的學生活動 - 顯示所有學生的正在學習活動
       if (individualOngoingActivities.length > 0) {
         options.push({ value: '', label: '── 所有學生的學習中活動 ──', group: 'ongoing' });
         individualOngoingActivities.forEach(activity => {
           const statusText = activity.completionStatus === 'in_progress' ? '🔄' : '⏳';
           options.push({
             value: activity.id,
             label: `${statusText} ${activity.name} (${activity.studentName})`,
             group: 'ongoing'
           });
         });
       }
    }
    
    return options;
  };

  if (!open) return null;
  if (!lessonDate || !timeslot || !courseType) return;

  // 將老師資料轉換為 PopupSelect 需要的格式
  const teacherOptions = teachers.map(t => ({
    value: t.id,
    label: t.name,
  }));

  console.log('open modal with timeslot:', timeslot);

  const teacherNames1 = (selectedTeacher1 || []).map(id => teachers.find(t => t.id === id)?.name || '');
  const teacherNames2 = (selectedTeacher2 || []).map(id => teachers.find(t => t.id === id)?.name || '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-[#FFFDF8] rounded-xl p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto shadow-2xl border border-[#EADBC8] pointer-events-auto relative">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#4B4036]">編輯教案</h2>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 rounded-full border border-[#EBC9A4] bg-white text-[#4B4036] hover:bg-[#f5e7d4] transition"
              disabled={saving}
              type="button"
              onClick={handleTestFill}
            >
              測試填入
            </button>
            <button
              className="flex items-center gap-1 px-2 py-1 rounded-full border bg-white border-[#EBC9A4] text-[#4B4036] hover:bg-[#f7f3ec]"
              title="刷新老師資料"
              type="button"
              onClick={(e) => {
                const btn = e.currentTarget.querySelector('img');
                if (btn) {
                  btn.classList.add('animate-spin');
                  setTimeout(() => btn.classList.remove('animate-spin'), 1000);
                }
                window.location.reload();
              }}
            >
              <img alt="Refresh" className="w-4 h-4" src="/refresh.png" />
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="text-center text-[#4B4036] py-8">老師資料載入中...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <form className="space-y-4" onSubmit={handleSubmit}>
              {isDefaultTime && (
                <div>
                  <label className="block text-sm font-medium mb-1 text-[#4B4036]">課堂日期</label>
                  <input
                    type="date"
                    className="w-full p-2 border border-[#EADBC8] rounded bg-[#FFFDF8] text-[#4B4036]"
                    value={selectedLessonDate.toISOString().split('T')[0]}
                    onChange={(e) => {
                      const [year, month, day] = e.target.value.split('-').map(Number);
                      const newDate = new Date(year, month - 1, day);
                      setSelectedLessonDate(newDate);
                    }}
                  />
                  <p className="text-xs text-[#7A6654] mt-1">
                    預設時間：{timeslot} | 課程：{courseType}
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1 text-[#4B4036]">教學主題</label>
                <input
                  className="w-full p-2 border border-[#EADBC8] rounded bg-[#FFFDF8] text-[#4B4036]"
                  type="text"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-[#4B4036]">教學目標</label>
                {objectives.map((value, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      className="flex-1 p-2 border border-[#EADBC8] rounded bg-[#FFFDF8] text-[#4B4036]"
                      type="text"
                      value={value}
                      onChange={e => {
                        const updated = [...objectives];
                        updated[index] = e.target.value;
                        setObjectives(updated);
                      }}
                    />
                                         <button
                       type="button"
                       className="px-2 py-1 text-red-500 hover:text-red-700 rounded"
                       disabled={objectives.length === 1}
                       onClick={() => removeField('objectives', index)}
                     >
                       ✕
                     </button>
                  </div>
                ))}
                                 <button
                   type="button"
                   className="text-sm text-[#4B4036] underline"
                   onClick={() => addField('objectives')}
                 >
                   ➕ 新增一欄
                 </button>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-[#4B4036]">教學活動</label>
                  <button
                    className="px-2 py-1 text-xs bg-[#EBC9A4] hover:bg-[#DDBA90] text-[#4B4036] rounded border border-[#EADBC8] transition-colors"
                    type="button"
                    onClick={() => {
                      if (open && lessonDate && timeslot && courseType) {
                        fetchClassStudents();
                        fetchClassActivities();
                      }
                    }}
                    disabled={loadingStudents || loadingClassActivities}
                  >
                    {loadingStudents || loadingClassActivities ? '載入中...' : (
                      <>
                        <RefreshCw className="w-3 h-3 mr-1" />
                        重新載入
                      </>
                    )}
                  </button>
                </div>
                <div className="space-y-4">
                  {/* 班別學生活動 */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-medium text-[#4B4036] opacity-80">班別學生活動</label>
                      <button
                        className="px-1 py-0.5 text-xs bg-[#FFF3E0] hover:bg-[#FFE7C2] text-[#4B4036] rounded border border-[#EADBC8] transition-colors"
                        type="button"
                        onClick={() => {
                          if (open && lessonDate && timeslot && courseType) {
                            fetchLessonPlanActivities();
                          }
                        }}
                        disabled={loadingActivities}
                      >
                        {loadingActivities ? '載入中...' : <RefreshCw className="w-3 h-3" />}
                      </button>
                    </div>
                    <button
                      className="w-full p-2 border border-[#EADBC8] rounded bg-[#FFFDF8] text-[#4B4036] text-left text-sm"
                      type="button"
                      onClick={() => {
                        setTempSelectedActivities(selectedActivities.filter(a => a.type === 'tree_activity'));
                        setShowPopup('activities');
                      }}
                    >
                      {selectedActivities.filter(a => a.type === 'tree_activity').length > 0
                        ? `${selectedActivities.filter(a => a.type === 'tree_activity').length} 個班別活動已選擇`
                        : '請選擇班別活動'}
                    </button>
                  </div>

                  {/* 已選活動顯示 */}
                  {selectedActivities.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-[#4B4036] opacity-80 mb-2">已選活動：</div>
                      {selectedActivities.map((activity, index) => (
                        <div key={activity.id} className="flex items-center justify-between p-2 bg-[#FFF3E0] rounded border border-[#EADBC8]">
                          <div className="flex-1">
                            <div className="font-medium text-[#4B4036] text-sm">{activity.name}</div>
                            <div className="text-xs text-[#2B3A3B] opacity-70">
                              {activity.type === 'tree_activity' ? '班別活動' : 
                               activity.treeName?.includes('本次課堂') ? '個別安排' : '學習中'}
                              {activity.studentName && ` • ${activity.studentName}`}
                              {activity.difficulty && ` • 難度 ${activity.difficulty}`}
                              {activity.duration && ` • ${activity.duration}分鐘`}
                              {activity.completionStatus && (
                                <span className="ml-1">
                                  {activity.completionStatus === 'completed' ? <CheckCircle className="w-3 h-3 text-green-600" /> : 
                                   activity.completionStatus === 'in_progress' ? <RefreshCw className="w-3 h-3 text-blue-600" /> : <Clock className="w-3 h-3 text-gray-500" />}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            className="px-2 py-1 text-red-500 hover:text-red-700 rounded text-sm"
                            type="button"
                            onClick={() => {
                              setSelectedActivities(selectedActivities.filter((_, i) => i !== index));
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 個別安排的學生活動 */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-medium text-[#4B4036] opacity-80">個別安排的學生活動</label>
                      <button
                        className="px-1 py-0.5 text-xs bg-[#FFF3E0] hover:bg-[#FFE7C2] text-[#4B4036] rounded border border-[#EADBC8] transition-colors"
                        type="button"
                        onClick={() => {
                          if (open && lessonDate && timeslot && courseType && classStudents.length > 0) {
                            fetchClassActivities(true); // 強制刷新
                          }
                        }}
                        disabled={loadingClassActivities}
                      >
                        {loadingClassActivities ? '載入中...' : <RefreshCw className="w-3 h-3" />}
                      </button>
                    </div>
                    <div className="border border-[#EADBC8] rounded bg-[#FFFDF8] p-2 max-h-32 overflow-y-auto">
                      {loadingClassActivities ? (
                        <div className="text-center py-4 text-[#2B3A3B] opacity-60 text-sm">
                          載入中...
                        </div>
                      ) : loadError ? (
                        <div className="text-center py-4">
                          <div className="text-red-500 text-sm mb-2">{loadError}</div>
                          <button
                            type="button"
                            className="px-2 py-1 text-xs bg-[#EBC9A4] hover:bg-[#DDBA90] text-[#4B4036] rounded border border-[#EADBC8] transition-colors"
                            onClick={() => {
                              if (open && lessonDate && timeslot && courseType && classStudents.length > 0) {
                                fetchClassActivities(true); // 強制刷新
                              }
                            }}
                          >
                            重試
                          </button>
                        </div>
                      ) : individualCurrentActivities.length > 0 ? (
                        <div className="space-y-1">
                          {individualCurrentActivities.map((activity) => {
                            const statusText = activity.completionStatus === 'completed' ? <CheckCircle className="w-4 h-4 text-green-600" /> : 
                                             activity.completionStatus === 'in_progress' ? <RefreshCw className="w-4 h-4 text-blue-600" /> : <Clock className="w-4 h-4 text-gray-500" />;
                            return (
                              <div 
                                key={activity.id} 
                                className="flex items-center justify-between p-2 rounded bg-[#FFF3E0] border border-[#EADBC8]"
                              >
                                <div className="flex-1">
                                  <div className="font-medium text-[#4B4036] text-sm">
                                    {statusText} {activity.name}
                                  </div>
                                  <div className="text-xs text-[#2B3A3B] opacity-70">
                                    {activity.studentName}
                                    {activity.difficulty && ` • 難度 ${activity.difficulty}`}
                                    {activity.duration && ` • ${activity.duration}分鐘`}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-[#2B3A3B] opacity-60 text-sm">
                          暫無本次課堂活動
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 個別學習中的學生活動 */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-medium text-[#4B4036] opacity-80">個別學習中的學生活動</label>
                      <button
                        className="px-1 py-0.5 text-xs bg-[#FFF3E0] hover:bg-[#FFE7C2] text-[#4B4036] rounded border border-[#EADBC8] transition-colors"
                        type="button"
                        onClick={() => {
                          if (open && lessonDate && timeslot && courseType && classStudents.length > 0) {
                            fetchClassActivities(true); // 強制刷新
                          }
                        }}
                        disabled={loadingClassActivities}
                      >
                        {loadingClassActivities ? '載入中...' : <RefreshCw className="w-3 h-3" />}
                      </button>
                    </div>
                    
                    {/* 標籤切換 */}
                    <div className="flex mb-2">
                      <button
                        type="button"
                        className={`px-3 py-1 text-xs rounded-l border border-[#EADBC8] transition-colors ${
                          ongoingActivityTab === 'in_progress'
                            ? 'bg-[#FFD59A] text-[#4B4036] font-medium'
                            : 'bg-[#FFFDF8] text-[#2B3A3B] hover:bg-[#FFF3E0]'
                        }`}
                        onClick={() => setOngoingActivityTab('in_progress')}
                      >
                        正在學習
                      </button>
                      <button
                        type="button"
                        className={`px-3 py-1 text-xs rounded-r border-l-0 border border-[#EADBC8] transition-colors ${
                          ongoingActivityTab === 'completed'
                            ? 'bg-[#FFD59A] text-[#4B4036] font-medium'
                            : 'bg-[#FFFDF8] text-[#2B3A3B] hover:bg-[#FFF3E0]'
                        }`}
                        onClick={() => setOngoingActivityTab('completed')}
                      >
                        已完成
                      </button>
                    </div>
                    
                    <div className="border border-[#EADBC8] rounded bg-[#FFFDF8] p-2 max-h-32 overflow-y-auto">
                      {loadingClassActivities ? (
                        <div className="text-center py-4 text-[#2B3A3B] opacity-60 text-sm">
                          載入中...
                        </div>
                      ) : loadError ? (
                        <div className="text-center py-4">
                          <div className="text-red-500 text-sm mb-2">{loadError}</div>
                          <button
                            type="button"
                            className="px-2 py-1 text-xs bg-[#EBC9A4] hover:bg-[#DDBA90] text-[#4B4036] rounded border border-[#EADBC8] transition-colors"
                            onClick={() => {
                              if (open && lessonDate && timeslot && courseType && classStudents.length > 0) {
                                fetchClassActivities(true); // 強制刷新
                              }
                            }}
                          >
                            重試
                          </button>
                        </div>
                      ) : (() => {
                        // 根據選中的標籤過濾活動
                        const filteredActivities = individualOngoingActivities.filter(activity => 
                          activity.completionStatus === ongoingActivityTab
                        );
                        
                        if (filteredActivities.length > 0) {
                          return (
                            <div className="space-y-1">
                              {filteredActivities.map((activity) => {
                                const statusText = activity.completionStatus === 'completed' ? <CheckCircle className="w-4 h-4 text-green-600" /> : 
                                                 activity.completionStatus === 'in_progress' ? <RefreshCw className="w-4 h-4 text-blue-600" /> : 
                                                 <Clock className="w-4 h-4 text-gray-500" />;
                                return (
                                  <div 
                                    key={activity.id} 
                                    className="flex items-center justify-between p-2 rounded bg-[#FFF3E0] border border-[#EADBC8]"
                                  >
                                    <div className="flex-1">
                                      <div className="font-medium text-[#4B4036] text-sm">
                                        {statusText} {activity.name}
                                      </div>
                                      <div className="text-xs text-[#2B3A3B] opacity-70">
                                        {activity.studentName}
                                        {activity.difficulty && ` • 難度 ${activity.difficulty}`}
                                        {activity.duration && ` • ${activity.duration}分鐘`}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        } else {
                          return (
                            <div className="text-center py-4 text-[#2B3A3B] opacity-60 text-sm">
                              {ongoingActivityTab === 'in_progress' ? '暫無正在學習活動' : '暫無已完成活動'}
                            </div>
                          );
                        }
                      })()}
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-[#4B4036]">老師</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="mr-2">主老師：</span>
                      <button
                        type="button"
                        className="px-2 py-1 border border-[#EADBC8] rounded bg-[#FFFDF8] text-[#4B4036]"
                        onClick={() => {
                          setTempSelectedTeacher1(selectedTeacher1);
                          setShowPopup('main');
                        }}
                      >
                        {selectedTeacher1.length > 0
                          ? teacherNames1.join('、')
                          : '請選擇'}
                      </button>
                    </div>
                    <div>
                      <span className="mr-2">副老師：</span>
                      <button
                        type="button"
                        className="px-2 py-1 border border-[#EADBC8] rounded bg-[#FFFDF8] text-[#4B4036]"
                        onClick={() => {
                          setTempSelectedTeacher2(selectedTeacher2);
                          setShowPopup('assist');
                        }}
                      >
                        {selectedTeacher2.length > 0
                          ? teacherNames2.join('、')
                          : '請選擇'}
                      </button>
                    </div>
                  </div>
                  {teachers.length === 0 && (
                    <div className="text-sm text-red-500 mt-1">無法載入老師資料，請稍後再試</div>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-[#4B4036]">備註</label>
                <textarea
                  className="w-full p-2 border border-[#EADBC8] rounded bg-[#FFFDF8] text-[#4B4036] h-24"
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                />
              </div>
              
              <div className="flex justify-end gap-2 mt-4">
                {existingPlan?.id && (
                  <button
                    type="button"
                    className="px-4 py-2 rounded-full border border-red-300 bg-white text-red-600 hover:bg-red-100 transition"
                    disabled={saving}
                    onClick={handleDelete}
                  >
                    刪除
                  </button>
                )}
                <button
                  type="button"
                  className="px-4 py-2 rounded-full border border-[#EBC9A4] bg-white text-[#4B4036] hover:bg-[#f5e7d4] transition"
                  disabled={saving}
                  onClick={onClose}
                >
                  取消
                </button>
                <button
                  className="px-4 py-2 rounded-full bg-[#EBC9A4] text-[#4B4036] hover:bg-[#d0ab7d] transition font-semibold"
                  disabled={saving}
                  type="submit"
                >
                  {saving ? '儲存中...' : '儲存'}
                </button>
              </div>
            </form>

            {/* 學生活動面板 */}
            <div className="border-l border-[#EADBC8] pl-6">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[#4B4036]">課堂學生活動</h3>
                  <span className="text-sm text-gray-500">
                    {loadingStudents ? '載入中...' : `共 ${classStudents.length} 位學生`}
                  </span>
                </div>
                
                {loadingStudents ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFD59A] mx-auto"></div>
                    <p className="text-sm text-[#4B4036] mt-2">載入學生資料中...</p>
                  </div>
                ) : classStudents.length > 0 ? (
                  <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                    {classStudents.map(student => (
                      <div key={student.id} className="border border-[#EADBC8] rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#FFF3E0] to-[#FFFDF8] hover:from-[#FFE7C2] hover:to-[#FFF6EE] transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-[#FFD59A] to-[#FFB6C1] rounded-full flex items-center justify-center shadow-sm">
                              <span className="text-[#4B4036] text-sm font-medium">
                                {student.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-medium text-[#4B4036]">{student.name}</h4>
                              <p className="text-xs text-[#2B3A3B] opacity-70">
                                {student.isTrial ? '試堂學生' : '常規學生'}
                                {student.age !== null && student.age !== undefined ? ` • ${Math.floor(Number(student.age) / 12)}歲` : ''}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="px-3 py-1 text-sm rounded bg-[#EBC9A4] text-[#4B4036] hover:bg-[#DDBA90] transition-colors border border-[#EADBC8] shadow-sm"
                            onClick={() => toggleStudentExpanded(student.id)}
                          >
                            {expandedStudents.has(student.id) ? '隱藏活動' : '查看活動'}
                          </button>
                        </div>
                        
                        {expandedStudents.has(student.id) && (
                          <div className="p-4 bg-[#FFFDF8]">
                            <StudentActivitiesPanel
                              studentId={student.id}
                              lessonDate={new Date(lessonDate.getTime() + 8 * 60 * 60 * 1000).toISOString().split('T')[0]}
                              timeslot={timeslot}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-[#FFFDF8] rounded-lg border border-[#EADBC8]">
                    <div className="w-16 h-16 rounded-full mx-auto mb-4 bg-gradient-to-br from-[#FFD59A] to-[#FFB6C1] shadow-sm" />
                    <p className="text-sm text-[#4B4036]">暫無學生資料</p>
                    <p className="text-xs text-[#2B3A3B] opacity-70 mt-1">該時段沒有安排學生</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PopupSelect 彈窗 */}
        {showPopup === 'main' && (
          <PopupSelect
            mode="multi"
            options={teacherOptions}
            selected={tempSelectedTeacher1}
            title="選擇主老師"
            onCancel={() => setShowPopup(null)}
            onChange={val => setTempSelectedTeacher1(Array.isArray(val) ? val : [val])}
            onConfirm={() => {
              setSelectedTeacher1(tempSelectedTeacher1);
              setShowPopup(null);
            }}
          />
        )}
        {showPopup === 'assist' && (
          <PopupSelect
            mode="multi"
            options={teacherOptions}
            selected={tempSelectedTeacher2}
            title="選擇副老師"
            onCancel={() => setShowPopup(null)}
            onChange={val => setTempSelectedTeacher2(Array.isArray(val) ? val : [val])}
            onConfirm={() => {
              setSelectedTeacher2(tempSelectedTeacher2);
              setShowPopup(null);
            }}
          />
        )}
        {showPopup === 'activities' && (
          <ActivitySelectModal
            title="選擇班別學生活動"
            treeActivities={treeActivities}
            selected={tempSelectedActivities.map(a => a.id)}
            onChange={(selectedIds) => {
              const selected = selectedIds.map(id => {
                // 從成長樹活動中查找
                if (id.startsWith('tree_')) {
                  const activityId = id.replace('tree_', '');
                  const activity = treeActivities.find(a => a.id === activityId);
                  if (activity) {
                    const activityName = activity.activity_source === 'teaching' && activity.hanami_teaching_activities
                      ? activity.hanami_teaching_activities.activity_name
                      : activity.custom_activity_name || '未命名活動';
                    return {
                      id,
                      name: activityName,
                      type: 'tree_activity' as const,
                      description: (activity as any).activity_description || (activity as any).custom_activity_description,
                      difficulty: (activity as any).difficulty_level,
                      duration: (activity as any).estimated_duration,
                      treeName: (activity as any).hanami_growth_trees?.tree_name
                    };
                  }
                }
                return null;
              }).filter(Boolean) as ActivityOption[];
              setTempSelectedActivities(selected);
            }}
            onCancel={() => setShowPopup(null)}
            onConfirm={async () => {
              // 合併現有的個別活動和新的班別活動
              const existingIndividual = selectedActivities.filter(a => 
                a.type === 'class_activity' || a.treeName?.includes('本次課堂') || a.treeName?.includes('正在學習')
              );
              setSelectedActivities([...existingIndividual, ...tempSelectedActivities]);
              
              // 保存班別活動到資料庫
              if (lessonDate && timeslot && courseType) {
                      const hkDate = new Date(selectedLessonDate.getTime() + 8 * 60 * 60 * 1000);
      const lessonDateStr = hkDate.toISOString().split('T')[0];
                
                const classActivityIds = tempSelectedActivities
                  .filter(a => a.type === 'tree_activity')
                  .map(a => a.id.replace('tree_', ''))
                  .filter(Boolean);

                if (classActivityIds.length > 0) {
                  try {
                    const response = await fetch('/api/lesson-plan-activities', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        lessonDate: lessonDateStr,
                        timeslot: timeslot,
                        courseType: courseType,
                        activityIds: classActivityIds
                      }),
                    });

                    if (!response.ok) {
                      console.error('Failed to save class activities');
                    }
                  } catch (error) {
                    console.error('Error saving class activities:', error);
                  }
                }
              }
              
              setShowPopup(null);
            }}
          />
        )}

      </div>
    </div>
  );
};

export default LessonPlanModal; 