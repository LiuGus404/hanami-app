'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  PencilIcon,
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  MusicalNoteIcon,
  CakeIcon,
  AcademicCapIcon,
  UserIcon,
  SparklesIcon,
  TagIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

import { HanamiCard, HanamiButton } from '@/components/ui';

interface Lesson {
  id: string;
  student_id: string;
  lesson_date: string;
  actual_timeslot: string;
  lesson_duration: string;
  lesson_status: string;
  lesson_teacher: string;
  lesson_activities: string;
  progress_notes: string;
  next_target: string;
  notes: string;
  remarks: string;
  full_name: string;
  Hanami_Students?: {
    id: string;
    full_name: string;
    nick_name: string;
    student_age: number;
    gender: string;
    course_type: string;
    student_teacher: string;
  };
}

interface TrialLesson {
  id: string;
  full_name: string;
  nick_name: string;
  student_age: number;
  gender: string;
  course_type: string;
  lesson_date: string;
  actual_timeslot: string;
  lesson_duration: string;
  trial_status: string;
}

interface TreeActivity {
  id: string;
  tree_id: string;
  activity_id: string;
  activity_source: string;
  custom_activity_name: string;
  custom_activity_description: string;
  activity_type: string;
  difficulty_level: number;
  estimated_duration: number;
  materials_needed: string[];
  instructions: string;
  learning_objectives: string[];
  target_abilities: string[];
  prerequisites: string[];
  priority_order: number;
  activity_order: number;
  is_required: boolean;
  is_active: boolean;
  hanami_teaching_activities?: {
    id: string;
    activity_name: string;
    activity_description: string;
    activity_type: string;
    difficulty_level: number;
    duration_minutes: number;
    materials_needed: string[];
    instructions: string;
    custom_fields: any;
    template_id: string;
    status: string;
    tags: string[];
    category: string;
    created_at: string;
  };
  hanami_growth_trees?: {
    id: string;
    tree_name: string;
    tree_description: string;
    tree_icon: string;
    course_type_id: string;
    tree_level: number;
  };
}

interface AssignedActivity {
  id: string;
  lesson_id: string;
  student_id: string;
  tree_activity_id: string;
  completion_status: string;
  performance_rating: number;
  student_notes: string;
  teacher_notes: string;
  time_spent: number;
  attempts_count: number;
  is_favorite: boolean;
  assigned_by: string;
  created_at: string;
}

interface TimeSlotGroup {
  date: string;
  timeSlot: string;
  lessons: (Lesson | TrialLesson)[];
}

export default function ClassActivitiesPage() {
  const router = useRouter();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [trialLessons, setTrialLessons] = useState<TrialLesson[]>([]);
  const [treeActivities, setTreeActivities] = useState<TreeActivity[]>([]);
  const [assignedActivities, setAssignedActivities] = useState<AssignedActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | TrialLesson | null>(null);
  const [showActivitySelector, setShowActivitySelector] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  // 獲取週開始和結束日期
  const getWeekDates = (date: Date) => {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay());
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };

  // 載入課堂資料
  const loadClassData = async () => {
    try {
      setLoading(true);
      const { start, end } = getWeekDates(currentWeek);
      
      const response = await fetch(`/api/class-activities?weekStart=${start}&weekEnd=${end}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '載入課堂資料失敗');
      }
      
      setLessons(result.data.lessons || []);
      setTrialLessons(result.data.trialLessons || []);
      setTreeActivities(result.data.treeActivities || []);
      setAssignedActivities(result.data.assignedActivities || []);
    } catch (error) {
      console.error('載入課堂資料失敗:', error);
      toast.error(error instanceof Error ? error.message : '載入課堂資料失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClassData();
  }, [currentWeek]);

  // 切換週次
  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeek(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeek(newDate);
  };

  // 獲取活動顯示名稱
  const getActivityDisplayName = (activity: TreeActivity) => {
    if (activity.activity_source === 'teaching' && activity.hanami_teaching_activities) {
      return activity.hanami_teaching_activities.activity_name;
    }
    return activity.custom_activity_name || '未命名活動';
  };

  // 獲取學生已分配的活動
  const getStudentAssignedActivities = (lessonId: string, studentId: string) => {
    return assignedActivities.filter(
      aa => aa.lesson_id === lessonId && aa.student_id === studentId
    );
  };

  // 分配活動給學生
  const assignActivityToStudent = async (lessonId: string, studentId: string, treeActivityId: string) => {
    try {
      const response = await fetch('/api/class-activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lesson_id: lessonId,
          student_id: studentId,
          tree_activity_id: treeActivityId,
          assigned_by: 'admin' // 這裡可以改為實際的用戶ID
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '分配活動失敗');
      }

      toast.success('活動分配成功！');
      loadClassData(); // 重新載入資料
      setShowActivitySelector(false);
    } catch (error) {
      console.error('分配活動失敗:', error);
      toast.error(error instanceof Error ? error.message : '分配活動失敗');
    }
  };

  // 移除活動分配
  const removeActivityAssignment = async (assignmentId: string) => {
    try {
      const response = await fetch(`/api/class-activities?id=${assignmentId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '移除活動失敗');
      }

      toast.success('活動已移除！');
      loadClassData(); // 重新載入資料
    } catch (error) {
      console.error('移除活動失敗:', error);
      toast.error(error instanceof Error ? error.message : '移除活動失敗');
    }
  };

  // 格式化日期顯示
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    });
  };

  // 格式化時間顯示
  const formatTime = (timeString: string) => {
    if (!timeString) return '未設定';
    return timeString;
  };

  // 將月齡轉換為歲數
  const convertAgeToYears = (ageInMonths: number | null): string => {
    if (ageInMonths === null || ageInMonths === undefined) return '未知';
    if (ageInMonths < 12) {
      return `${ageInMonths}個月`;
    } else {
      const years = Math.floor(ageInMonths / 12);
      const months = ageInMonths % 12;
      if (months === 0) {
        return `${years}歲`;
      } else {
        return `${years}歲${months}個月`;
      }
    }
  };

  // 獲取學生姓名
  const getStudentName = (lesson: Lesson | TrialLesson) => {
    if ('Hanami_Students' in lesson && lesson.Hanami_Students) {
      return lesson.Hanami_Students.full_name;
    }
    return lesson.full_name;
  };

  // 獲取學生暱稱
  const getStudentNickname = (lesson: Lesson | TrialLesson) => {
    if ('Hanami_Students' in lesson && lesson.Hanami_Students) {
      return lesson.Hanami_Students.nick_name;
    }
    if ('nick_name' in lesson) {
      return lesson.nick_name;
    }
    return null;
  };

  // 獲取學生年齡
  const getStudentAge = (lesson: Lesson | TrialLesson) => {
    if ('Hanami_Students' in lesson && lesson.Hanami_Students) {
      return lesson.Hanami_Students.student_age;
    }
    if ('student_age' in lesson) {
      return lesson.student_age;
    }
    return null;
  };

  // 獲取課程類型
  const getCourseType = (lesson: Lesson | TrialLesson) => {
    if ('course_type' in lesson) {
      return lesson.course_type;
    }
    return '試堂';
  };

  // 獲取教師
  const getLessonTeacher = (lesson: Lesson | TrialLesson) => {
    if ('lesson_teacher' in lesson) {
      return lesson.lesson_teacher;
    }
    return null;
  };

  // 獲取備註
  const getLessonNotes = (lesson: Lesson | TrialLesson) => {
    if ('notes' in lesson) {
      return lesson.notes;
    }
    return null;
  };

  // 按時段分組課程
  const groupLessonsByTimeSlot = (): TimeSlotGroup[] => {
    const allLessons = [...lessons, ...trialLessons];
    
    // 按日期和時間排序
    allLessons.sort((a, b) => {
      const dateA = new Date(a.lesson_date);
      const dateB = new Date(b.lesson_date);
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }
      return (a.actual_timeslot || '').localeCompare(b.actual_timeslot || '');
    });

    // 按日期和時段分組
    const grouped: { [key: string]: TimeSlotGroup } = {};
    
    allLessons.forEach(lesson => {
      const date = lesson.lesson_date;
      const timeSlot = lesson.actual_timeslot || '未設定';
      const key = `${date}_${timeSlot}`;
      
      if (!grouped[key]) {
        grouped[key] = {
          date,
          timeSlot,
          lessons: []
        };
      }
      
      grouped[key].lessons.push(lesson);
    });

    // 轉換為陣列並排序
    return Object.values(grouped).sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }
      return a.timeSlot.localeCompare(b.timeSlot);
    });
  };

  const timeSlotGroups = groupLessonsByTimeSlot();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-hanami-background to-hanami-surface p-6">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hanami-primary mx-auto mb-4"></div>
              <p className="text-hanami-text-secondary">載入課堂資料中...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-hanami-background to-hanami-surface p-6">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* 頁面標題和日曆檢視按鈕 */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-hanami-text">課堂活動管理</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                // 跳轉到 Hanami TC 頁面
                router.push('/admin/hanami-tc');
              }}
              className="px-4 py-2 rounded-lg font-medium transition-colors bg-white text-hanami-text border border-hanami-border hover:bg-hanami-surface hover:border-hanami-primary"
            >
              日曆檢視
            </button>
          </div>
        </div>

        {/* 週次導航 */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={goToPreviousWeek}
            className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg border border-hanami-border hover:bg-hanami-surface transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5" />
            <span>上週</span>
          </button>
          
          <div className="text-center">
            <h2 className="text-xl font-semibold text-hanami-text">
              {formatDate(getWeekDates(currentWeek).start)} - {formatDate(getWeekDates(currentWeek).end)}
            </h2>
            <p className="text-sm text-hanami-text-secondary">
              共 {timeSlotGroups.length} 個時段，{timeSlotGroups.reduce((total, group) => total + group.lessons.length, 0)} 堂課
            </p>
          </div>
          
          <button
            onClick={goToNextWeek}
            className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg border border-hanami-border hover:bg-hanami-surface transition-colors"
          >
            <span>下週</span>
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>

        {/* 時段分組列表 */}
        <div className="space-y-8">
          {timeSlotGroups.length === 0 ? (
            <div className="bg-gradient-to-br from-hanami-primary/10 to-hanami-accent/10 backdrop-blur-sm rounded-2xl p-12 text-center border border-hanami-primary/20 shadow-lg">
              <div className="animate-bounce mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-hanami-primary to-hanami-accent rounded-full mx-auto flex items-center justify-center">
                  <CalendarIcon className="w-8 h-8 text-white" />
                </div>
              </div>
              <p className="text-hanami-text text-xl font-medium">本週沒有課程安排</p>
              <p className="text-hanami-text-secondary mt-2">享受輕鬆的一週吧！</p>
            </div>
          ) : (
            timeSlotGroups.map((group, groupIndex) => (
              <div 
                key={`${group.date}_${group.timeSlot}`} 
                className="group animate-fade-in-up"
                style={{ animationDelay: `${groupIndex * 100}ms` }}
              >
                {/* 時段標題卡片 */}
                <div className="time-slot-header hanami-card-glow rounded-2xl p-6 mb-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-8">
                      {/* 日期和時間區塊 */}
                      <div className="flex items-center space-x-4">
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                          <div className="text-center">
                            <div className="text-sm font-medium text-white/90 mb-1">{formatDate(group.date)}</div>
                            <div className="text-2xl font-bold text-white">{formatTime(group.timeSlot)}</div>
                          </div>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 bg-hanami-accent rounded-full flex items-center justify-center text-white text-sm font-bold animate-pulse mb-1">
                            {group.lessons.length}
                          </div>
                          <div className="text-xs text-white/70">學生</div>
                        </div>
                      </div>
                      
                      {/* 課程資訊區塊 */}
                      <div className="text-white">
                        <h2 className="text-2xl font-bold mb-2">
                          {group.lessons.map(lesson => getCourseType(lesson) || '未設定').filter((value, index, self) => self.indexOf(value) === index).join(' + ')}
                        </h2>
                        <p className="text-white/80 font-medium text-lg">
                          <span className="animate-pulse">{group.lessons.length}</span> 位可愛的小音樂家
                        </p>
                      </div>
                    </div>
                    
                    {/* 右側裝飾 */}
                    <div className="text-white text-right">
                      <div className="mb-2">
                        <MusicalNoteIcon className="w-10 h-10 text-white/90" />
                      </div>
                      <div className="text-sm text-white/70 font-medium">音樂時光</div>
                    </div>
                  </div>
                </div>

                {/* 學生卡片網格 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {group.lessons.map((lesson, lessonIndex) => {
                    const studentAssignedActivities = getStudentAssignedActivities(lesson.id, 'student_id' in lesson ? lesson.student_id : lesson.id);
                    const isTrial = 'trial_status' in lesson;
                    
                    return (
                      <div 
                        key={lesson.id} 
                        className="group/card relative animate-fade-in-up"
                        style={{ animationDelay: `${(groupIndex * 100) + (lessonIndex * 50)}ms` }}
                      >
                        <div className="student-card rounded-2xl p-5 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 relative overflow-hidden">
                          {/* 背景裝飾 */}
                          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-hanami-primary/10 to-hanami-accent/10 rounded-full -translate-y-8 translate-x-8 group-hover/card:scale-150 transition-transform duration-500"></div>
                          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-hanami-secondary/10 to-hanami-primary/10 rounded-full translate-y-6 -translate-x-6 group-hover/card:scale-125 transition-transform duration-700"></div>
                          
                          {/* 試堂徽章 */}
                          {isTrial && (
                            <div className="absolute top-3 right-3 z-10">
                              <div className="trial-badge text-white px-3 py-1 rounded-full text-xs font-bold shadow-md flex items-center space-x-1">
                                <SparklesIcon className="w-3 h-3" />
                                <span>試堂</span>
                              </div>
                            </div>
                          )}

                          {/* 學生頭像和資訊 */}
                          <div className="relative z-10 mb-4">
                            <div className="flex items-center space-x-4">
                              <div className="relative">
                                <div className="avatar-glow w-14 h-14 bg-gradient-to-br from-hanami-primary to-hanami-accent rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg transform group-hover/card:rotate-12 transition-transform duration-300">
                                  {getStudentName(lesson).charAt(0)}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-br from-green-400 to-green-500 rounded-full border-2 border-white animate-pulse"></div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-hanami-text text-lg truncate">
                                  {getStudentName(lesson)}
                                </h3>
                                {getStudentNickname(lesson) && (
                                  <p className="text-hanami-text-secondary font-medium text-sm truncate">
                                    {getStudentNickname(lesson)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* 學生詳細資訊 */}
                          <div className="relative z-10 space-y-3 mb-4">
                            <div className="bg-hanami-primary/10 rounded-xl p-3">
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center space-x-2">
                                  <CakeIcon className="w-4 h-4 text-hanami-primary" />
                                  <span className="font-medium text-hanami-text">
                                    {convertAgeToYears(getStudentAge(lesson))}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <MusicalNoteIcon className="w-4 h-4 text-hanami-primary" />
                                  <span className="font-medium text-hanami-text">
                                    {getCourseType(lesson) || '未設定'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-hanami-secondary/10 rounded-xl p-3">
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center space-x-2">
                                  <ClockIcon className="w-4 h-4 text-hanami-primary" />
                                  <span className="font-medium text-hanami-text">
                                    {lesson.lesson_duration || '未設定'}
                                  </span>
                                </div>
                                {getLessonTeacher(lesson) && (
                                  <div className="flex items-center space-x-2">
                                    <AcademicCapIcon className="w-4 h-4 text-hanami-primary" />
                                    <span className="font-medium text-hanami-text truncate max-w-20">
                                      {getLessonTeacher(lesson)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* 已分配活動 */}
                          {studentAssignedActivities.length > 0 && (
                            <div className="relative z-10 mb-4">
                              <h4 className="text-sm font-bold text-hanami-text mb-2 flex items-center">
                                <TagIcon className="w-4 h-4 mr-2 text-hanami-primary" />
                                已分配活動
                              </h4>
                              <div className="space-y-2">
                                {studentAssignedActivities.map((assignment) => {
                                  const activity = treeActivities.find(ta => ta.id === assignment.tree_activity_id);
                                  return (
                                    <div key={assignment.id} className="bg-white/80 backdrop-blur-sm rounded-lg p-2 border border-hanami-border/30 hover:bg-white transition-colors">
                                      <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium text-hanami-text truncate">
                                            {activity ? getActivityDisplayName(activity) : '未知活動'}
                                          </p>
                                          <p className="text-xs text-hanami-text-secondary flex items-center space-x-1">
                                            {assignment.completion_status === 'not_started' ? (
                                              <>
                                                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                                <span>未開始</span>
                                              </>
                                            ) : assignment.completion_status === 'in_progress' ? (
                                              <>
                                                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                                                <span>進行中</span>
                                              </>
                                            ) : assignment.completion_status === 'completed' ? (
                                              <>
                                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                <span>已完成</span>
                                              </>
                                            ) : (
                                              <>
                                                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                                                <span>未知</span>
                                              </>
                                            )}
                                          </p>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                          <button
                                            onClick={() => {
                                              toast('編輯功能開發中...');
                                            }}
                                            className="p-1 text-hanami-text-secondary hover:text-hanami-primary transition-colors hover:scale-110 transform"
                                          >
                                            <PencilIcon className="w-3 h-3" />
                                          </button>
                                          <button
                                            onClick={() => removeActivityAssignment(assignment.id)}
                                            className="p-1 text-red-400 hover:text-red-600 transition-colors hover:scale-110 transform"
                                          >
                                            <TrashIcon className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* 課程備註 */}
                          {getLessonNotes(lesson) && (
                            <div className="relative z-10 mb-4">
                              <h4 className="text-sm font-bold text-hanami-text mb-2 flex items-center">
                                <DocumentTextIcon className="w-4 h-4 mr-2 text-hanami-primary" />
                                課程備註
                              </h4>
                              <p className="text-xs text-hanami-text-secondary bg-hanami-accent/10 p-3 rounded-lg border border-hanami-accent/20">
                                {getLessonNotes(lesson)}
                              </p>
                            </div>
                          )}

                          {/* 操作按鈕 */}
                          <div className="relative z-10 flex items-center justify-between pt-3 border-t border-hanami-border/30">
                            <button
                              onClick={() => {
                                setSelectedLesson(lesson);
                                setSelectedStudent('student_id' in lesson ? lesson.student_id : lesson.id);
                                setShowActivitySelector(true);
                              }}
                              className="hanami-action-btn flex items-center space-x-2 px-4 py-2 text-white rounded-xl font-medium shadow-md hover:shadow-lg"
                            >
                              <PlusIcon className="w-4 h-4" />
                              <span>分配活動</span>
                            </button>
                            
                            <button
                              onClick={() => {
                                toast('詳情功能開發中...');
                              }}
                              className="p-2 text-hanami-text-secondary hover:text-hanami-primary transition-colors hover:scale-110 transform hover:bg-hanami-primary/10 rounded-lg"
                            >
                              <EyeIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* 活動選擇器模態視窗 */}
        {showActivitySelector && selectedLesson && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-gradient-to-br from-white via-hanami-surface to-hanami-background rounded-2xl p-8 max-w-4xl w-full mx-4 max-h-[85vh] overflow-hidden shadow-2xl border border-hanami-border/30 animate-scale-in">
              {/* 模態視窗標題 */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-hanami-border/30">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-hanami-primary to-hanami-accent rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">{getStudentName(selectedLesson).charAt(0)}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-hanami-text">
                      為 {getStudentName(selectedLesson)} 分配活動
                    </h3>
                    <p className="text-sm text-hanami-text-secondary">
                      選擇適合的活動來豐富課程內容
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowActivitySelector(false)}
                  className="w-10 h-10 bg-red-100 hover:bg-red-200 rounded-xl flex items-center justify-center text-red-600 hover:text-red-700 transition-all duration-200 hover:scale-110"
                >
                  ✕
                </button>
              </div>
              
              {/* 活動列表 */}
              <div className="overflow-y-auto max-h-[60vh] space-y-4 scrollbar-hide">
                {treeActivities.length === 0 ? (
                  <div className="text-center py-16">
                                      <div className="w-20 h-20 bg-gradient-to-br from-hanami-primary/20 to-hanami-accent/20 rounded-full mx-auto mb-4 flex items-center justify-center animate-float">
                    <TagIcon className="w-10 h-10 text-hanami-primary" />
                  </div>
                    <p className="text-hanami-text text-lg font-medium mb-2">暫無可用活動</p>
                    <p className="text-hanami-text-secondary">活動正在準備中，敬請期待！</p>
                  </div>
                ) : (
                  treeActivities.map((activity, index) => (
                    <div 
                      key={activity.id} 
                      className="hanami-card-glow bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-hanami-border/40 hover:border-hanami-primary/50 transition-all duration-300 hover:shadow-lg animate-fade-in-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 pr-4">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-hanami-primary to-hanami-accent rounded-lg flex items-center justify-center">
                              <TagIcon className="w-4 h-4 text-white" />
                            </div>
                            <h4 className="font-bold text-hanami-text text-lg">
                              {getActivityDisplayName(activity)}
                            </h4>
                          </div>
                          
                          <p className="text-hanami-text-secondary mb-4 leading-relaxed">
                            {activity.custom_activity_description || '這是一個精心設計的教學活動，將為學生帶來豐富的學習體驗。'}
                          </p>
                          
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-hanami-accent to-pink-400 text-white shadow-sm">
                              <MusicalNoteIcon className="w-3 h-3 mr-1" />
                              {activity.activity_type}
                            </span>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-400 to-blue-500 text-white shadow-sm">
                              <AcademicCapIcon className="w-3 h-3 mr-1" />
                              難度 {activity.difficulty_level}
                            </span>
                            {activity.estimated_duration && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-green-400 to-green-500 text-white shadow-sm">
                                <ClockIcon className="w-3 h-3 mr-1" />
                                {activity.estimated_duration} 分鐘
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => assignActivityToStudent(
                            selectedLesson.id, 
                            selectedStudent, 
                            activity.id
                          )}
                          className="hanami-action-btn px-6 py-3 text-white rounded-xl font-medium shadow-md hover:shadow-lg flex items-center space-x-2 min-w-[120px] justify-center"
                        >
                          <PlusIcon className="w-5 h-5" />
                          <span>分配</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {/* 底部操作區 */}
              <div className="mt-6 pt-4 border-t border-hanami-border/30 flex justify-center">
                <button
                  onClick={() => setShowActivitySelector(false)}
                  className="px-6 py-2 bg-hanami-surface hover:bg-hanami-border text-hanami-text rounded-xl transition-colors duration-200 font-medium"
                >
                  關閉
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}