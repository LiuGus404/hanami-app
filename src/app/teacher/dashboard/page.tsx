'use client';

import { useState, useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { Database } from '@/lib/database.types';
import HanamiDashboardLayout from '@/components/ui/HanamiDashboardLayout';
import HanamiCard from '@/components/ui/HanamiCard';
import HanamiBadge from '@/components/ui/HanamiBadge';
import { supabase } from '@/lib/supabase';
import { getUserSession, clearUserSession } from '@/lib/authUtils';
import HanamiCalendar from '@/components/ui/HanamiCalendar';
import { calculateRemainingLessonsBatch } from '@/lib/utils';

interface Student {
  id: string;
  full_name: string;
  nick_name: string | null;
  student_age: number | null;
  course_type: string | null;
  regular_timeslot: string | null;
  regular_weekday: number | null;
  remaining_lessons?: number;
}

interface Lesson {
  id: string;
  lesson_date: string;
  lesson_status: string | null;
  full_name: string | null;
  course_type: string | null;
  lesson_activities: string | null;
  progress_notes: string | null;
  video_url: string | null;
}

interface TeacherSchedule {
  id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
}

export default function TeacherDashboard() {
  const [teacherProfile, setTeacherProfile] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [recentLessons, setRecentLessons] = useState<Lesson[]>([]);
  const [upcomingSchedule, setUpcomingSchedule] = useState<TeacherSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();
  const [studentCount, setStudentCount] = useState(0);
  const [todayLessonCount, setTodayLessonCount] = useState(0);
  const [teacherName, setTeacherName] = useState('老師');
  const sessionChecked = useRef(false);

  useEffect(() => {
    // 防止重複檢查
    if (sessionChecked.current) return;
    sessionChecked.current = true;

    // 檢查用戶會話
    const userSession = getUserSession();
    if (!userSession || userSession.role !== 'teacher') {
      clearUserSession();
      router.replace('/teacher/login');
      return;
    }

    // 設置老師名稱
    setTeacherName(userSession.name || '老師');
    
    // 載入老師資料
    loadTeacherData(userSession);
  }, []); // 移除 router 依賴

  const loadTeacherData = async (userSession: any) => {
    try {
      // 獲取老師資料
      const { data: teacherData } = await supabase
        .from('hanami_employee')
        .select('*')
        .eq('id', userSession.id)
        .single();

      if (teacherData) {
        setTeacherProfile(teacherData);
      }

      // 獲取老師負責的學生
      const { data: studentsData } = await supabase
        .from('Hanami_Students')
        .select('*')
        .eq('student_teacher', userSession.id);

      if (studentsData) {
        // 計算學生的剩餘堂數
        const studentIds = studentsData.map(student => student.id);
        const remainingLessonsMap = await calculateRemainingLessonsBatch(studentIds, new Date());
        
        // 為學生添加剩餘堂數
        const studentsWithRemaining = studentsData.map(student => ({
          ...student,
          remaining_lessons: remainingLessonsMap[student.id] || 0
        }));
        
        setStudents(studentsWithRemaining);
        setStudentCount(studentsWithRemaining.length);
      }

      // 獲取最近的課程記錄
      const { data: lessonsData } = await supabase
        .from('hanami_student_lesson')
        .select('*, Hanami_Students(full_name)')
        .eq('lesson_teacher', userSession.id)
        .order('lesson_date', { ascending: false })
        .limit(10);

      if (lessonsData) {
        setRecentLessons(lessonsData.map(lesson => ({
          ...lesson,
          full_name: (lesson as any).Hanami_Students?.full_name || null
        })));
      }

      // 獲取今天的課程數量
      const today = new Date().toISOString().split('T')[0];
      const { data: todayLessons } = await supabase
        .from('hanami_student_lesson')
        .select('id')
        .eq('lesson_date', today)
        .eq('lesson_teacher', userSession.id);
      
      if (todayLessons) {
        setTodayLessonCount(todayLessons.length);
      }

      // 獲取即將到來的課程安排
      const { data: scheduleData } = await supabase
        .from('hanami_teacher_schedule')
        .select('*')
        .eq('teacher_id', userSession.id)
        .gte('scheduled_date', today)
        .order('scheduled_date', { ascending: true })
        .limit(10);

      if (scheduleData) {
        setUpcomingSchedule(scheduleData);
      }

    } catch (error) {
      console.error('Error loading teacher data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    clearUserSession();
    router.push('/');
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <HanamiCard>
          <div className="text-center">
            <div className="text-2xl font-bold text-brown-700">{studentCount}</div>
            <div className="text-sm text-brown-500">負責學生</div>
          </div>
        </HanamiCard>
        <HanamiCard>
          <div className="text-center">
            <div className="text-2xl font-bold text-brown-700">{todayLessonCount}</div>
            <div className="text-sm text-brown-500">今日課程</div>
          </div>
        </HanamiCard>
        <HanamiCard>
          <div className="text-center">
            <div className="text-2xl font-bold text-brown-700">{recentLessons.length}</div>
            <div className="text-sm text-brown-500">最近課程</div>
          </div>
        </HanamiCard>
      </div>

      {/* 最近課程 */}
      <HanamiCard>
        <h3 className="text-lg font-semibold text-brown-700 mb-4">最近課程</h3>
        <div className="space-y-3">
          {recentLessons.slice(0, 5).map((lesson) => (
            <div key={lesson.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-brown-700">{lesson.full_name}</div>
                <div className="text-sm text-brown-500">{lesson.lesson_date}</div>
              </div>
              <HanamiBadge 
                variant={lesson.lesson_status === 'completed' ? 'success' : 'warning'}
              >
                {lesson.lesson_status === 'completed' ? '已完成' : '進行中'}
              </HanamiBadge>
            </div>
          ))}
        </div>
      </HanamiCard>

      {/* 課程安排 */}
      <HanamiCard>
        <h3 className="text-lg font-semibold text-brown-700 mb-4">即將到來的課程</h3>
        <div className="space-y-3">
          {upcomingSchedule.slice(0, 5).map((schedule) => (
            <div key={schedule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-brown-700">{schedule.scheduled_date}</div>
                <div className="text-sm text-brown-500">{schedule.start_time} - {schedule.end_time}</div>
              </div>
            </div>
          ))}
        </div>
      </HanamiCard>
    </div>
  );

  const renderStudents = () => (
    <div className="space-y-4">
      {students.map((student) => (
        <HanamiCard key={student.id}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-brown-700">{student.full_name}</h3>
              <p className="text-sm text-brown-500">{student.course_type}</p>
              <p className="text-sm text-brown-500">剩餘課程: {student.remaining_lessons} 堂</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-brown-500">
                {student.regular_weekday && `週${student.regular_weekday}`} {student.regular_timeslot}
              </p>
            </div>
          </div>
        </HanamiCard>
      ))}
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'students':
        return renderStudents();
      default:
        return renderOverview();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <HanamiDashboardLayout
      title={`${teacherName}的儀表板`}
      onLogout={handleLogout}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      tabs={[
        { id: 'overview', name: '概覽', icon: '📊' },
        { id: 'students', name: '學生管理', icon: '👥' },
        { id: 'schedule', name: '課程安排', icon: 'calendar' },
        { id: 'reports', name: '報告', icon: '📈' }
      ]}
    >
      {renderContent()}
    </HanamiDashboardLayout>
  );
} 