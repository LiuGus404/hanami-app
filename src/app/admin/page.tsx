'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

import HanamiCalendar from '@/components/ui/HanamiCalendar';
import { getUserSession, clearUserSession } from '@/lib/authUtils';
import { supabase, getSaasSupabaseClient } from '@/lib/supabase';
import { AnimatePresence, motion } from 'framer-motion';

export default function AdminPage() {
  const router = useRouter();
  const [studentCount, setStudentCount] = useState(0);
  const [trialStudentCount, setTrialStudentCount] = useState(0);
  const [lastLessonCount, setLastLessonCount] = useState(0);
  const [adminName, setAdminName] = useState('管理員');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sessionChecked = useRef(false);

  // AI 專案對話紀錄 - 狀態
  const [showLogViewer, setShowLogViewer] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'rooms' | 'messages' | 'errors'>('rooms');

  const openLogViewer = async () => {
    setShowLogViewer(true);
    setLogsLoading(true);
    try {
      const saas = getSaasSupabaseClient();
      const [uRes, rRes, mRes] = await Promise.all([
        (saas.from('saas_users') as any).select('id,email,full_name,created_at').order('created_at', { ascending: false }).limit(100),
        (saas.from('ai_rooms') as any).select('id,title,description,created_by,created_at,last_message_at').order('created_at', { ascending: false }).limit(100),
        (saas.from('ai_messages') as any).select('id,room_id,sender_type,sender_user_id,content,content_json,status,error_message,created_at').order('created_at', { ascending: false }).limit(200)
      ]);
      setUsers((uRes as any)?.data || []);
      setRooms((rRes as any)?.data || []);
      setMessages((mRes as any)?.data || []);
    } catch (e) {
      console.error('載入 AI 記錄失敗:', e);
    } finally {
      setLogsLoading(false);
    }
  };

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
            {/* AI 專案對話紀錄（aihome 專案） */}
            <div className="max-w-[300px] w-full" onClick={() => router.push('/admin/ai-project-logs')}>
              <div className="bg-white border border-[#FDE6B8] p-3 rounded-2xl text-center shadow hover:shadow-md transition cursor-pointer h-full flex flex-col items-center justify-center">
                <div className="w-12 h-12 mb-2 flex items-center justify-center">
                  <svg className="w-10 h-10 text-[#FF8C42]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H8l-4 3v-3H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/>
                    <path d="M7 8h10v2H7zM7 12h7v2H7z" fill="#fff"/>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-[#2B3A3B]">AI 專案對話紀錄</h3>
                <p className="text-xs text-[#777] mt-1">用戶 · 專案 · 對話 · 錯誤</p>
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
            {/* 財務狀況按鈕 */}
            <div className="max-w-[300px] w-full" onClick={() => router.push('/admin/financial-management')}>
              <div className="bg-white border border-[#FDE6B8] p-3 rounded-2xl text-center shadow hover:shadow-md transition cursor-pointer h-full flex flex-col items-center justify-center">
                <div className="w-12 h-12 mb-2 flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                    {/* 錢袋圖案 */}
                    <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm-1 14H5c-.55 0-1-.45-1-1V8h16v9c0 .55-.45 1-1 1z"/>
                    {/* 錢幣符號 */}
                    <path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                    <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-[#2B3A3B]">財務狀況</h3>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* AI 專案對話紀錄視窗 */}
      <AnimatePresence>
        {showLogViewer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
            onClick={() => setShowLogViewer(false)}
          >
            <motion.div
              initial={{ y: 20, scale: 0.98, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 10, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className="w-full max-w-5xl bg-white rounded-2xl p-4 sm:p-6 shadow-2xl ring-1 ring-[#EADBC8]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#2B3A3B]">AI 專案對話紀錄</h3>
                <div className="flex items-center gap-2">
                  <button className={`px-3 py-1.5 rounded-lg text-sm ${activeTab==='rooms'?'bg-[#FFEAD1] text-[#4B4036]':'bg-gray-100 text-gray-700'}`} onClick={()=>setActiveTab('rooms')}>專案</button>
                  <button className={`px-3 py-1.5 rounded-lg text-sm ${activeTab==='users'?'bg-[#FFEAD1] text-[#4B4036]':'bg-gray-100 text-gray-700'}`} onClick={()=>setActiveTab('users')}>用戶</button>
                  <button className={`px-3 py-1.5 rounded-lg text-sm ${activeTab==='messages'?'bg-[#FFEAD1] text-[#4B4036]':'bg-gray-100 text-gray-700'}`} onClick={()=>setActiveTab('messages')}>對話</button>
                  <button className={`px-3 py-1.5 rounded-lg text-sm ${activeTab==='errors'?'bg-[#FFEAD1] text-[#4B4036]':'bg-gray-100 text-gray-700'}`} onClick={()=>setActiveTab('errors')}>錯誤</button>
                </div>
              </div>

              {logsLoading ? (
                <div className="py-10 text-center text-[#2B3A3B]">載入中...</div>
              ) : (
                <div className="max-h-[70vh] overflow-auto">
                  {activeTab === 'rooms' && (
                    <div className="space-y-2">
                      {rooms.map((r:any)=> (
                        <div key={r.id} className="p-3 rounded-xl border border-[#EADBC8] bg-white/60">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-[#4B4036]">{r.title || '(未命名專案)'} <span className="text-xs text-gray-500 ml-1">{new Date(r.created_at).toLocaleString()}</span></p>
                              <p className="text-xs text-gray-600">room_id: {r.id}</p>
                            </div>
                            <span className="text-xs text-gray-500">最後: {r.last_message_at ? new Date(r.last_message_at).toLocaleString() : '-'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'users' && (
                    <div className="space-y-2">
                      {users.map((u:any)=> (
                        <div key={u.id} className="p-3 rounded-xl border border-[#EADBC8] bg-white/60">
                          <p className="font-semibold text-[#4B4036]">{u.full_name || u.email}</p>
                          <p className="text-xs text-gray-600">{u.email} · {new Date(u.created_at).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'messages' && (
                    <div className="space-y-2">
                      {messages.map((m:any)=> (
                        <div key={m.id} className="p-3 rounded-xl border border-[#EADBC8] bg-white/60">
                          <p className="text-xs text-gray-600 mb-1">room: {m.room_id} · {new Date(m.created_at).toLocaleString()}</p>
                          <p className="font-medium text-[#2B3A3B]">[{m.sender_type}] {m.content?.slice(0,200) || m.content_json?.text || '(空白)'}</p>
                          {m.status && m.status !== 'sent' && (
                            <p className="text-xs text-rose-600 mt-1">狀態: {m.status}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'errors' && (
                    <div className="space-y-2">
                      {messages.filter((m:any)=> m.status==='error' || m.error_message).map((m:any)=> (
                        <div key={m.id} className="p-3 rounded-xl border border-rose-200 bg-rose-50">
                          <p className="text-xs text-gray-600 mb-1">room: {m.room_id} · {new Date(m.created_at).toLocaleString()}</p>
                          <p className="font-medium text-[#B00020]">{m.error_message || '未知錯誤'}</p>
                          <p className="text-xs text-[#2B3A3B] mt-1">內容: {m.content?.slice(0,180) || m.content_json?.text || '(空白)'}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 flex justify-end">
                <button className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#2B3A3B]" onClick={()=>setShowLogViewer(false)}>關閉</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 