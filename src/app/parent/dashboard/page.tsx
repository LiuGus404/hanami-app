'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

import HanamiBadge from '@/components/ui/HanamiBadge';
import HanamiButton from '@/components/ui/HanamiButton';
import HanamiCalendar from '@/components/ui/HanamiCalendar';
import HanamiCard from '@/components/ui/HanamiCard';
import HanamiDashboardLayout from '@/components/ui/HanamiDashboardLayout';
import { getUserSession, clearUserSession } from '@/lib/authUtils';
import { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { calculateRemainingLessonsBatch } from '@/lib/utils';

interface Student {
  id: string;
  full_name: string;
  nick_name: string | null;
  student_age: number | null;
  course_type: string | null;
  regular_timeslot: string | null;
  regular_weekday: number | null;
  parent_email: string | null;
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
  remarks: string | null;
}

interface StudentPackage {
  id: string;
  course_name: string;
  total_lessons: number;
  remaining_lessons: number;
  start_date: string;
  status: string | null;
  price: number;
}

export default function ParentDashboard() {
  const [children, setChildren] = useState<Student[]>([]);
  const [selectedChild, setSelectedChild] = useState<Student | null>(null);
  const [recentLessons, setRecentLessons] = useState<Lesson[]>([]);
  const [packages, setPackages] = useState<StudentPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();
  const [studentCount, setStudentCount] = useState(0);
  const [upcomingLessonCount, setUpcomingLessonCount] = useState(0);
  const [parentName, setParentName] = useState('家長');
  const sessionChecked = useRef(false);

  useEffect(() => {
    // 防止重複檢查
    if (sessionChecked.current) return;
    sessionChecked.current = true;

    // 檢查用戶會話
    const userSession = getUserSession();
    if (!userSession || userSession.role !== 'parent') {
      clearUserSession();
      router.replace('/parent/login');
      return;
    }

    // 設置家長名稱
    setParentName(userSession.name || '家長');
    
    // 載入家長資料
    loadParentData(userSession);
  }, []); // 移除 router 依賴

  const loadParentData = async (userSession: any) => {
    try {
      // 獲取家長的孩子資料
      const { data: childrenData } = await supabase
        .from('Hanami_Students')
        .select('*')
        .in('id', userSession.relatedIds || []);

      if (childrenData && childrenData.length > 0) {
        // 計算孩子的剩餘堂數
        const childIds = childrenData.map(child => child.id);
        const remainingLessonsMap = await calculateRemainingLessonsBatch(childIds, new Date());
        
        // 為孩子添加剩餘堂數
        const childrenWithRemaining = childrenData.map(child => ({
          ...child,
          remaining_lessons: remainingLessonsMap[child.id] || 0,
        }));
        
        setChildren(childrenWithRemaining);
        setSelectedChild(childrenWithRemaining[0]); // 預設選擇第一個孩子
        setStudentCount(childrenWithRemaining.length);
        
        // 載入第一個孩子的資料
        loadChildData(childrenWithRemaining[0].id);
      } else {
        router.push('/parent/login');
      }

      // 獲取即將到來的課程數量
      if (userSession.relatedIds && userSession.relatedIds.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        const { data: lessons, error: lessonsError } = await supabase
          .from('hanami_student_lesson')
          .select('id')
          .in('student_id', userSession.relatedIds)
          .gte('lesson_date', today);
        
        if (!lessonsError && Array.isArray(lessons)) {
          setUpcomingLessonCount(lessons.length);
        }
      }

    } catch (error) {
      console.error('Error loading parent data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChildData = async (childId: string) => {
    try {
      // 獲取孩子的課程記錄
      const { data: lessonsData } = await supabase
        .from('hanami_student_lesson')
        .select('*')
        .eq('student_id', childId)
        .order('lesson_date', { ascending: false })
        .limit(10);

      if (lessonsData) {
        setRecentLessons(lessonsData);
      }

      // 獲取孩子的課程包
      const { data: packagesData } = await supabase
        .from('Hanami_Student_Package')
        .select('*')
        .eq('student_id', childId)
        .order('created_at', { ascending: false });

      if (packagesData) {
        setPackages(packagesData);
      }

    } catch (error) {
      console.error('Error loading child data:', error);
    }
  };

  const handleLogout = async () => {
    clearUserSession();
    router.push('/');
  };

  const getWeekdayName = (weekday: number) => {
    const weekdays = ['', '週一', '週二', '週三', '週四', '週五', '週六', '週日'];
    return weekdays[weekday] || '';
  };

  const renderChildSelector = () => {
    if (children.length <= 1) return null;
    
    return (
      <HanamiCard className="mb-4">
        <h3 className="text-base font-semibold text-brown-700 mb-3">選擇孩子</h3>
        <div className="flex space-x-2">
          {children.map((child) => (
            <button
              key={child.id}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedChild?.id === child.id
                  ? 'bg-brown-600 text-white'
                  : 'bg-gray-100 text-brown-700 hover:bg-gray-200'
              }`}
              onClick={() => setSelectedChild(child)}
            >
              {child.full_name}
            </button>
          ))}
        </div>
      </HanamiCard>
    );
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {renderChildSelector()}

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <HanamiCard>
          <div className="text-center">
            <div className="text-2xl font-bold text-brown-700">{studentCount}</div>
            <div className="text-sm text-brown-500">孩子數量</div>
          </div>
        </HanamiCard>
        <HanamiCard>
          <div className="text-center">
            <div className="text-2xl font-bold text-brown-700">{upcomingLessonCount}</div>
            <div className="text-sm text-brown-500">即將到來的課程</div>
          </div>
        </HanamiCard>
        <HanamiCard>
          <div className="text-center">
            <div className="text-2xl font-bold text-brown-700">{packages.length}</div>
            <div className="text-sm text-brown-500">課程包</div>
          </div>
        </HanamiCard>
      </div>

      {/* 孩子資訊 */}
      {selectedChild && (
        <HanamiCard>
          <h3 className="text-lg font-semibold text-brown-700 mb-4">{selectedChild.full_name}的資訊</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-brown-500">課程類型</p>
              <p className="font-medium text-brown-700">{selectedChild.course_type}</p>
            </div>
            <div>
              <p className="text-sm text-brown-500">年齡</p>
              <p className="font-medium text-brown-700">{selectedChild.student_age}歲</p>
            </div>
            <div>
              <p className="text-sm text-brown-500">剩餘課程</p>
              <p className="font-medium text-brown-700">
                {packages.reduce((total, pkg) => total + pkg.remaining_lessons, 0)}堂
              </p>
            </div>
            <div>
              <p className="text-sm text-brown-500">固定上課時間</p>
              <p className="font-medium text-brown-700">
                {selectedChild.regular_weekday && getWeekdayName(selectedChild.regular_weekday)} {selectedChild.regular_timeslot}
              </p>
            </div>
          </div>
        </HanamiCard>
      )}

      {/* 最近課程 */}
      <HanamiCard>
        <h3 className="text-lg font-semibold text-brown-700 mb-4">最近課程</h3>
        <div className="space-y-3">
          {recentLessons.slice(0, 5).map((lesson) => (
            <div key={lesson.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-brown-700">{lesson.lesson_date}</div>
                <div className="text-sm text-brown-500">{lesson.course_type}</div>
                {lesson.progress_notes && (
                  <div className="text-sm text-brown-500 mt-1">{lesson.progress_notes}</div>
                )}
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

      {/* 課程包 */}
      <HanamiCard>
        <h3 className="text-lg font-semibold text-brown-700 mb-4">課程包</h3>
        <div className="space-y-3">
          {packages.map((pkg) => (
            <div key={pkg.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-brown-700">{pkg.course_name}</div>
                <div className="text-sm text-brown-500">
                  剩餘 {pkg.remaining_lessons} / {pkg.total_lessons} 堂
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-brown-700">${pkg.price}</div>
                <HanamiBadge variant={pkg.status === 'active' ? 'success' : 'warning'}>
                  {pkg.status === 'active' ? '使用中' : '暫停'}
                </HanamiBadge>
              </div>
            </div>
          ))}
        </div>
      </HanamiCard>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'progress':
        return (
          <HanamiCard>
            <h3 className="text-lg font-semibold text-brown-700 mb-4">學習進度</h3>
            <p className="text-brown-500">學習進度功能開發中...</p>
          </HanamiCard>
        );
      case 'videos':
        return (
          <HanamiCard>
            <h3 className="text-lg font-semibold text-brown-700 mb-4">課堂影片</h3>
            <p className="text-brown-500">課堂影片功能開發中...</p>
          </HanamiCard>
        );
      case 'certificates':
        return (
          <HanamiCard>
            <h3 className="text-lg font-semibold text-brown-700 mb-4">證書</h3>
            <p className="text-brown-500">證書功能開發中...</p>
          </HanamiCard>
        );
      case 'comments':
        return (
          <HanamiCard>
            <h3 className="text-lg font-semibold text-brown-700 mb-4">評語</h3>
            <p className="text-brown-500">評語功能開發中...</p>
          </HanamiCard>
        );
      case 'packages':
        return (
          <HanamiCard>
            <h3 className="text-lg font-semibold text-brown-700 mb-4">課程包</h3>
            <p className="text-brown-500">課程包管理功能開發中...</p>
          </HanamiCard>
        );
      default:
        return renderOverview();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <HanamiDashboardLayout
      activeTab={activeTab}
      tabs={[
        { id: 'overview', name: '概覽', icon: '📊' },
        { id: 'progress', name: '學習進度', icon: '📈' },
        { id: 'videos', name: '課堂影片', icon: '🎥' },
        { id: 'certificates', name: '證書', icon: '🏆' },
        { id: 'comments', name: '評語', icon: '💬' },
        { id: 'packages', name: '課程包', icon: '📦' },
      ]}
      title={`${parentName}的儀表板`}
      onLogout={handleLogout}
      onTabChange={setActiveTab}
    >
      {renderContent()}
    </HanamiDashboardLayout>
  );
} 