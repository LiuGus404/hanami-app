'use client'

import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import HanamiCalendar from '@/components/ui/HanamiCalendar'
import { useEffect, useState } from 'react';

export default function AdminDashboardPage() {
  const router = useRouter()
  const [studentCount, setStudentCount] = useState(0);
  const [trialStudentCount, setTrialStudentCount] = useState(0);
  const [lastLessonCount, setLastLessonCount] = useState(0);
  const [adminName, setAdminName] = useState('管理員');

  useEffect(() => {
    const fetchAdminName = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        const { data, error } = await supabase
          .from('hanami_admin')
          .select('admin_name')
          .eq('admin_email', session.user.email)
          .single();
        
        if (!error && data?.admin_name) {
          setAdminName(data.admin_name);
        }
      }
    };

    fetchAdminName();
  }, []);

  useEffect(() => {
    const fetchStudentCount = async () => {
      const { data, error } = await supabase
        .from('Hanami_Students')
        .select('id');
      if (!error && Array.isArray(data)) {
        setStudentCount(data.filter(s => s.id).length);
      }
    };
    fetchStudentCount();

    const fetchTrialStudentCount = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('hanami_trial_students')
        .select('lesson_date')
        .gte('lesson_date', today);
      if (!error && Array.isArray(data)) {
        setTrialStudentCount(data.length);
      }
    };
    fetchTrialStudentCount();

    const fetchLastLessonCount = async () => {
      const { data, error } = await supabase
        .from('Hanami_Students')
        .select('remaining_lessons');
      if (!error && Array.isArray(data)) {
        setLastLessonCount(data.filter(s => s.remaining_lessons === 1).length);
      }
    };
    fetchLastLessonCount();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  return (
    <div className="min-h-screen bg-[#FFFCEB] font-['Quicksand',_sans-serif] px-6 py-8">
      <div className="w-full flex justify-center px-4">
        <div style={{ width: '420px' }}>
        {/* 歡迎區 */}
        <div className="bg-white rounded-2xl p-4 mb-4 flex items-center justify-between border border-[#EADBC8]">
          <div>
            <h2 className="text-xl font-bold text-[#2B3A3B]">Hi {adminName}，歡迎回來！</h2>
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
              src="/owlui.png"
              alt="管理員"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          </div>
        </div>

        {/* 學校狀況總覽區 */}
        <div className="bg-white rounded-2xl p-4 mb-4 border border-[#EADBC8]">
          <h3 className="text-base font-semibold text-[#2B3A3B] mb-3">學校狀況一覽</h3>
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
                  src="/icons/bear-face.png"
                  alt="學生"
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
            <div className="bg-white border border-[#EADBC8] p-3 rounded-xl flex flex-col items-center justify-center aspect-square cursor-pointer" style={{paddingBottom: '1rem'}} onClick={() => router.push('/admin/students?filter=trial')}>
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
                  src="/icons/penguin-face.png"
                  alt="試堂"
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
            <div className="bg-white border border-[#EADBC8] p-3 rounded-xl flex flex-col items-center justify-center aspect-square cursor-pointer" style={{paddingBottom: '1rem'}} onClick={() => router.push('/admin/students?filter=lastLesson')}>
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
                  src="/icons/clock.png"
                  alt="最後一堂"
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

        {/* 週曆區（簡版） */}
        <div className="bg-white rounded-2xl p-4 mb-4 border border-[#EADBC8]">
          <h3 className="text-base font-semibold text-[#2B3A3B] mb-3">Hanami 日曆</h3>
          <HanamiCalendar />
        </div>

        {/* 管理按鈕區 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 place-items-center gap-4 mb-10 px-2 w-full">
          <div className="max-w-[300px] w-full" onClick={() => router.push('/admin/students')}>
            <div className="bg-white border border-[#FDE6B8] p-3 rounded-2xl text-center shadow hover:shadow-md transition cursor-pointer h-full flex flex-col items-center justify-center">
              <div className="w-12 h-12 mb-2">
                <img src="/girl.png" alt="學生管理" className="w-full h-full object-contain" />
              </div>
              <h3 className="text-lg font-semibold text-[#2B3A3B]">學生管理</h3>
            </div>
          </div>
          <div className="max-w-[300px] w-full" onClick={() => router.push('/admin/hanami-tc')}>
            <div className="bg-white border border-[#FDE6B8] p-3 rounded-2xl text-center shadow hover:shadow-md transition cursor-pointer h-full flex flex-col items-center justify-center">
              <div className="w-12 h-12 mb-2">
                <img src="/foxcat.png" alt="課堂管理" className="w-full h-full object-contain" />
              </div>
              <h3 className="text-lg font-semibold text-[#2B3A3B]">課堂管理</h3>
            </div>
          </div>
          <div className="max-w-[300px] w-full" onClick={() => router.push('/admin/teachers')}>
          <div className="bg-white border border-[#FDE6B8] p-3 rounded-2xl text-center shadow hover:shadow-md transition cursor-pointer h-full flex flex-col items-center justify-center">
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
                src="/icons/book-elephant.png"
                alt="老師資料"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            </div>
            <p className="text-sm font-medium text-[#2B3A3B]">老師一覽</p>
            </div>
          </div>
          <div className="max-w-[300px] w-full" onClick={() => router.push('/admin/course-availability')}>
          <div className="bg-white border border-[#FDE6B8] p-3 rounded-2xl text-center shadow hover:shadow-md transition cursor-pointer h-full flex flex-col items-center justify-center">
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
                src="/icons/music.png"
                alt="課程管理"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            </div>
            <p className="text-sm font-medium text-[#2B3A3B]">課程管理</p>
            </div>
          </div>
          <div className="max-w-[300px] w-full" onClick={() => router.push('/admin/ai-select')}>
            <div className="bg-white border border-[#FDE6B8] p-3 rounded-2xl text-center shadow hover:shadow-md transition cursor-pointer h-full flex flex-col items-center justify-center">
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
                  src="/polarbear.png"
                  alt="AI 助理"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    display: 'block',
                  }}
                />
              </div>
              <p className="text-sm font-medium text-[#2B3A3B]">AI 助理</p>
            </div>
          </div>
          <div className="max-w-[300px] w-full" onClick={() => router.push('/admin/lesson-availability')}>
            <div className="bg-white border border-[#FDE6B8] p-3 rounded-2xl text-center shadow hover:shadow-md transition cursor-pointer h-full flex flex-col items-center justify-center">
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
                  src="/icons/clock.png"
                  alt="課堂空缺"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    display: 'block',
                  }}
                />
              </div>
              <p className="text-sm font-medium text-[#2B3A3B]">課堂空缺</p>
            </div>
          </div>
        </div>

        {/* 登出按鈕區 */}
        <div className="flex justify-center">
          <div className="text-center">
            <button
              onClick={handleSignOut}
              className="bg-[#FDE6B8] text-[#A64B2A] font-semibold px-6 py-2 rounded-full border border-[#EAC29D] shadow hover:bg-[#fce2c8] transition flex justify-center items-center gap-2"
            >
              <span>登出</span>
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}