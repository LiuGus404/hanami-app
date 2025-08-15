'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

import HanamiCalendar from '@/components/ui/HanamiCalendar';
import { getUserSession, clearUserSession } from '@/lib/authUtils';
import { supabase } from '@/lib/supabase';

export default function AdminPage() {
  const router = useRouter();
  const [studentCount, setStudentCount] = useState(0);
  const [trialStudentCount, setTrialStudentCount] = useState(0);
  const [lastLessonCount, setLastLessonCount] = useState(0);
  const [adminName, setAdminName] = useState('管理員');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sessionChecked = useRef(false);

  useEffect(() => {
    // 防止重複檢查
    if (sessionChecked.current) return;
    sessionChecked.current = true;

    // 檢查用戶會話
    const userSession = getUserSession();
    console.log('Admin Page - User Session:', userSession);
    
    if (!userSession || userSession.role !== 'admin') {
      console.log('Admin Page - Invalid session, redirecting to login');
      clearUserSession();
      router.replace('/admin/login');
      return;
    }

    // 設置管理員名稱
    setAdminName(userSession.name || '管理員');
    setIsLoading(false);
  }, []); // 移除 router 依賴

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        
        // 只宣告一次 today
        const today = new Date().toISOString().split('T')[0];
        // 獲取常規學生數量（Hanami_Students 表中 student_type = '常規' 的學生）
        const { data: regularStudents, error: regularError } = await supabase
          .from('Hanami_Students')
          .select('id, student_type')
          .eq('student_type', '常規');
        
        if (regularError) {
          console.error('Error fetching regular students:', regularError);
          setError('無法獲取常規學生數據');
        } else if (Array.isArray(regularStudents)) {
          setStudentCount(regularStudents.length);
        }

        // 獲取今日及之後的試堂學生數量
        const { data: trialStudents, error: trialError } = await supabase
          .from('hanami_trial_students')
          .select('id, lesson_date')
          .gte('lesson_date', today);
        
        if (trialError) {
          console.error('Error fetching trial students:', trialError);
        } else if (Array.isArray(trialStudents)) {
          setTrialStudentCount(trialStudents.length);
        }

        // 使用 SQL 函數計算最後一堂人數（剩餘堂數 ≤ 1 的學生）
        const { data: regularStudentsForLesson, error: regularStudentsError } = await supabase
          .from('Hanami_Students')
          .select('id')
          .eq('student_type', '常規');
        
        if (regularStudentsError) {
          console.error('Error fetching regular students for lesson count:', regularStudentsError);
        } else if (Array.isArray(regularStudentsForLesson)) {
          const studentIds = regularStudentsForLesson.map(s => s.id);
          
          if (studentIds.length > 0) {
            try {
              // 優先使用修復版 SQL 函數計算剩餘堂數
              console.log('嘗試使用修復版 SQL 函數計算最後一堂人數');
              const { data: remainingData, error: remainingError } = await (supabase as any)
                .rpc('calculate_remaining_lessons_batch_fixed', {
                  student_ids: studentIds,
                  today_date: today
                });

              if (remainingError) {
                console.error('修復版 SQL 查詢失敗，嘗試使用原始函數:', remainingError);
                
                // 嘗試使用原始函數作為備用
                const { data: originalData, error: originalError } = await (supabase as any)
                  .rpc('calculate_remaining_lessons_batch', {
                    student_ids: studentIds,
                    today_date: today
                  });

                if (originalError) {
                  console.error('原始 SQL 查詢也失敗:', originalError);
                  setLastLessonCount(0);
                  return;
                }

                console.log('原始 SQL 查詢剩餘堂數結果:', originalData);
                
                // 計算剩餘堂數 ≤ 1 的學生數量（包含等於 1 和等於 0）
                const studentsWithLastLesson = (originalData || [])
                  .filter((item: any) => (item.remaining_lessons || 0) <= 1)
                  .length;
                
                console.log('最後一堂人數（原始函數）:', studentsWithLastLesson);
                setLastLessonCount(studentsWithLastLesson);
              } else {
                console.log('修復版 SQL 查詢剩餘堂數結果:', remainingData);
                
                // 計算剩餘堂數 ≤ 1 的學生數量（包含等於 1 和等於 0）
                const studentsWithLastLesson = (remainingData || [])
                  .filter((item: any) => (item.remaining_lessons || 0) <= 1)
                  .length;
                
                console.log('最後一堂人數（修復版函數）:', studentsWithLastLesson);
                setLastLessonCount(studentsWithLastLesson);
              }
            } catch (error) {
              console.error('計算最後一堂人數時發生錯誤:', error);
              setLastLessonCount(0);
            }
          } else {
            setLastLessonCount(0);
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('載入數據時發生錯誤');
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FFF9F2]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD59A] mx-auto" />
          <p className="mt-4 text-[#2B3A3B]">載入管理面板...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8">
      <div className="w-full flex justify-center px-4">
        <div style={{ width: '420px' }}>
          {/* 歡迎區 */}
          <div className="bg-white rounded-2xl p-4 mb-4 flex items-center justify-between border border-[#EADBC8]">
            <div>
              <h1 className="text-xl font-bold text-[#2B3A3B]">Hi {adminName}，歡迎回來！</h1>
            </div>
            <div
              style={{
                width: '60px',
                height: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              <img
                alt="管理員"
                src="/owlui.png"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            </div>
          </div>

          {/* 錯誤訊息 */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <p>{error}</p>
            </div>
          )}

          {/* 學校狀況總覽區 */}
          <div className="bg-white rounded-2xl p-4 mb-4 border border-[#EADBC8]">
            <h2 className="text-base font-semibold text-[#2B3A3B] mb-3">學校狀況一覽</h2>
            <div className="flex flex-row justify-center gap-6 mb-2">
              <div
                className="bg-white border border-[#EADBC8] p-3 rounded-xl flex flex-col items-center justify-center aspect-square cursor-pointer"
                style={{ paddingBottom: '1rem' }}
                onClick={() => router.push('/admin/students?filter=regular')}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    alt="學生"
                    src="/icons/bear-face.PNG"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      display: 'block',
                    }}
                  />
                </div>
                <p className="text-2xl font-bold text-[#2B3A3B]">{studentCount}</p>
                <p className="text-sm text-[#555]">常規學生人數</p>
              </div>
              <div className="bg-white border border-[#EADBC8] p-3 rounded-xl flex flex-col items-center justify-center aspect-square cursor-pointer" style={{ paddingBottom: '1rem' }} onClick={() => router.push('/admin/students?filter=trial')}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    alt="試堂"
                    src="/icons/penguin-face.PNG"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      display: 'block',
                    }}
                  />
                </div>
                <p className="text-2xl font-bold text-[#2B3A3B]">{trialStudentCount}</p>
                <p className="text-sm text-[#555]">試堂學生人數</p>
              </div>
              <div className="bg-white border border-[#EADBC8] p-3 rounded-xl flex flex-col items-center justify-center aspect-square cursor-pointer" style={{ paddingBottom: '1rem' }} onClick={() => router.push('/admin/students?filter=lastLesson')}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    alt="最後一堂"
                    src="/icons/clock.PNG"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      display: 'block',
                    }}
                  />
                </div>
                <p className="text-2xl font-bold text-[#2B3A3B]">{lastLessonCount}</p>
                <p className="text-sm text-[#555]">最後一堂人數</p>
              </div>
            </div>
          </div>

          {/* 簡化的日曆區 */}
          <div className="bg-white rounded-2xl p-4 mb-4 border border-[#EADBC8]">
            <h3 className="text-base font-semibold text-[#2B3A3B] mb-3">Hanami 日曆</h3>
            <HanamiCalendar />
          </div>

          {/* 管理按鈕區 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 place-items-center gap-4 mb-10 px-2 w-full">
            <div className="max-w-[300px] w-full" onClick={() => router.push('/admin/students')}>
              <div className="bg-white border border-[#FDE6B8] p-3 rounded-2xl text-center shadow hover:shadow-md transition cursor-pointer h-full flex flex-col items-center justify-center">
                <div className="w-12 h-12 mb-2">
                  <img alt="學生管理" className="w-full h-full object-contain" src="/girl.png" />
                </div>
                <h3 className="text-lg font-semibold text-[#2B3A3B]">學生管理</h3>
              </div>
            </div>
            <div className="max-w-[300px] w-full" onClick={() => router.push('/admin/permission-management')}>
              <div className="bg-white border border-[#FDE6B8] p-3 rounded-2xl text-center shadow hover:shadow-md transition cursor-pointer h-full flex flex-col items-center justify-center">
                <div className="w-12 h-12 mb-2 flex items-center justify-center">
                  <span className="text-3xl">👥</span>
                </div>
                <h3 className="text-lg font-semibold text-[#2B3A3B]">帳戶管理</h3>
              </div>
            </div>
            <div className="max-w-[300px] w-full" onClick={() => router.push('/admin/hanami-tc')}>
              <div className="bg-white border border-[#FDE6B8] p-3 rounded-2xl text-center shadow hover:shadow-md transition cursor-pointer h-full flex flex-col items-center justify-center">
                <div className="w-12 h-12 mb-2">
                  <img alt="課堂管理" className="w-full h-full object-contain" src="/foxcat.png" />
                </div>
                <h3 className="text-lg font-semibold text-[#2B3A3B]">課堂管理</h3>
              </div>
            </div>
            <div className="max-w-[300px] w-full" onClick={() => router.push('/admin/teachers')}>
              <div className="bg-white border border-[#FDE6B8] p-3 rounded-2xl text-center shadow hover:shadow-md transition cursor-pointer h-full flex flex-col items-center justify-center">
                <div className="w-12 h-12 mb-2">
                  <img alt="老師管理" className="w-full h-full object-contain" src="/teacher.png" />
                </div>
                <h3 className="text-lg font-semibold text-[#2B3A3B]">老師管理</h3>
              </div>
            </div>
            {/* AI 助理按鈕 */}
            <div className="max-w-[300px] w-full" onClick={() => router.push('/admin/ai-select')}>
              <div className="bg-white border border-[#FDE6B8] p-3 rounded-2xl text-center shadow hover:shadow-md transition cursor-pointer h-full flex flex-col items-center justify-center">
                <div className="w-12 h-12 mb-2">
                  <img alt="AI 助理" className="w-full h-full object-contain" src="/polarbear.png" />
                </div>
                <h3 className="text-lg font-semibold text-[#2B3A3B]">AI 助理</h3>
              </div>
            </div>
            {/* AI 工具按鈕 */}
            <div className="max-w-[300px] w-full" onClick={() => router.push('/admin/ai-tools')}>
              <div className="bg-white border border-[#FDE6B8] p-3 rounded-2xl text-center shadow hover:shadow-md transition cursor-pointer h-full flex flex-col items-center justify-center">
                <div className="w-12 h-12 mb-2">
                  <img alt="AI 工具" className="w-full h-full object-contain" src="/owlui.png" />
                </div>
                <h3 className="text-lg font-semibold text-[#2B3A3B]">AI 工具</h3>
              </div>
            </div>
            {/* 課堂空缺按鈕 */}
            <div className="max-w-[300px] w-full" onClick={() => router.push('/admin/lesson-availability')}>
              <div className="bg-white border border-[#FDE6B8] p-3 rounded-2xl text-center shadow hover:shadow-md transition cursor-pointer h-full flex flex-col items-center justify-center">
                <div className="w-12 h-12 mb-2">
                  <img alt="課堂空缺" className="w-full h-full object-contain" src="/details.png" />
                </div>
                <h3 className="text-lg font-semibold text-[#2B3A3B]">課堂空缺</h3>
              </div>
            </div>
            {/* 學生進度管理按鈕 */}
            <div className="max-w-[300px] w-full" onClick={() => router.push('/admin/student-progress')}>
              <div className="bg-white border border-[#FDE6B8] p-3 rounded-2xl text-center shadow hover:shadow-md transition cursor-pointer h-full flex flex-col items-center justify-center">
                <div className="w-12 h-12 mb-2">
                  <img alt="學生進度" className="w-full h-full object-contain" src="/icons/book-elephant.PNG" />
                </div>
                <h3 className="text-lg font-semibold text-[#2B3A3B]">學生進度</h3>
              </div>
            </div>
            {/* 管理課堂按鈕 */}
            <div className="max-w-[300px] w-full" onClick={() => router.push('/admin/schedule-management')}>
              <div className="bg-white border border-[#FDE6B8] p-3 rounded-2xl text-center shadow hover:shadow-md transition cursor-pointer h-full flex flex-col items-center justify-center">
                <div className="w-12 h-12 mb-2">
                  <img alt="管理課堂" className="w-full h-full object-contain" src="/icons/clock.PNG" />
                </div>
                <h3 className="text-lg font-semibold text-[#2B3A3B]">管理課堂</h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 