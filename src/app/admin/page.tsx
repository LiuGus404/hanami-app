'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';

import AIControlPanel from '@/components/AIControlPanel';
import { Spinner } from '@/components/ui/spinner';
import { getUserSession } from '@/lib/authUtils';
import { getSaasSupabaseClient } from '@/lib/supabase';

const mockTasks = [
  { id: '1', model: 'Lulu', icon: '🦊', status: 'processing', description: '任務描述略' },
  { id: '2', model: 'Taku', icon: '🐻', status: 'done', timestamp: '2024/4/26 15:23' },
  { id: '3', model: 'Hibi', icon: '🦉', status: 'error', timestamp: '2024/4/26 15:23' },
];

const mockModels = [
  { name: 'Hibi', icon: '🦉', status: 'idle' },
  { name: 'Lulu', icon: '🦊', status: 'busy' },
  { name: 'Taku', icon: '🐻', status: 'idle' },
  { name: 'Mimi', icon: '🐰', status: 'idle' },
];

type TabKey = 'control' | 'logs';
type LogTabKey = 'rooms' | 'users' | 'messages' | 'errors';

const formatHK = (iso?: string | null) => {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleString('zh-HK', { timeZone: 'Asia/Hong_Kong' });
  } catch {
    return iso;
  }
};

export default function AdminPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  
  // 檢查 URL 查詢參數或路徑來設置默認標籤
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'logs') return 'logs';
      // 如果從 ai-project-logs 路徑訪問，默認顯示 logs
      if (window.location.pathname.includes('ai-project-logs')) return 'logs';
    }
    return 'control';
  });
  
  // AI 專案對話紀錄相關狀態
  const [logActiveTab, setLogActiveTab] = useState<LogTabKey>('rooms');
  const [logLoading, setLogLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogItems, setDialogItems] = useState<any[]>([]);

  const tabLabel = (t: LogTabKey) => (t === 'rooms' ? '專案' : t === 'users' ? '用戶' : t === 'messages' ? '對話' : '錯誤');

  const openRoomConversation = async (roomId: string) => {
    try {
      setShowDialog(true);
      setDialogTitle(`專案對話：${roomId}`);
      const saas = getSaasSupabaseClient();
      const res: any = await (saas.from('ai_messages') as any)
        .select('id,room_id,sender_type,sender_user_id,content,content_json,status,error_message,created_at')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });
      setDialogItems(res?.data || []);
    } catch (e) {
      setDialogItems([]);
    }
  };

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        const userSession = getUserSession();
        
        if (!userSession) {
          console.error('No user session found');
          router.replace('/admin/login');
          return;
        }

        const role = userSession.role || '';
        
        if (mounted) {
          if (role !== 'admin') {
            router.replace('/admin/login');
          } else {
            setUserRole(role);
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        if (mounted) {
          router.replace('/admin/login');
        }
      }
    };

    checkAuth();

    // 監聽 cookie 變化
    const checkSession = () => {
      if (mounted) {
        checkAuth();
      }
    };

    // 每 5 秒檢查一次會話狀態
    const interval = setInterval(checkSession, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [router]);

  // 載入 AI 專案對話紀錄
  useEffect(() => {
    if (activeTab !== 'logs' || !userRole) return;

    const load = async () => {
      setLogLoading(true);
      try {
        const saas = getSaasSupabaseClient();
        const [uRes, rRes, mRes] = await Promise.all([
          (saas.from('saas_users') as any).select('id,email,full_name,created_at').order('created_at', { ascending: false }).limit(200),
          (saas.from('ai_rooms') as any).select('id,title,description,created_by,created_at,last_message_at').order('created_at', { ascending: false }).limit(200),
          (saas.from('ai_messages') as any)
            .select('id,room_id,sender_type,sender_user_id,content,content_json,status,error_message,created_at')
            .order('created_at', { ascending: false })
            .limit(400)
        ]);
        setUsers((uRes as any)?.data || []);
        setRooms((rRes as any)?.data || []);
        setMessages((mRes as any)?.data || []);
      } finally {
        setLogLoading(false);
      }
    };
    load();
  }, [activeTab, userRole]);

  const handleCreateTask = () => console.log('Create Task');
  const handleCancelTask = () => console.log('Cancel Task');
  const handleFilterChange = (status: string[]) => console.log(`Filter: ${status}`);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!userRole || userRole !== 'admin') {
    return null;
  }

  // 強化任務狀態顯示與排版
  const enhancedTasks = mockTasks.map(task => {
    let statusLabel = '';
    let statusColor = '';

    switch (task.status) {
      case 'processing':
        statusLabel = '進行中';
        statusColor = 'text-blue-600';
        break;
      case 'done':
        statusLabel = '完成';
        statusColor = 'text-green-600';
        break;
      case 'error':
        statusLabel = '錯誤';
        statusColor = 'text-red-600';
        break;
      default:
        statusLabel = '未知';
        statusColor = 'text-gray-600';
    }

    return {
      ...task,
      statusLabel,
      statusColor,
    };
  });

  // 強化模型狀態顯示
  const enhancedModels = mockModels.map(model => {
    let statusLabel = '';
    let statusColor = '';

    switch (model.status) {
      case 'idle':
        statusLabel = '閒置';
        statusColor = 'text-gray-600';
        break;
      case 'busy':
        statusLabel = '忙碌中';
        statusColor = 'text-yellow-600';
        break;
      default:
        statusLabel = '未知';
        statusColor = 'text-gray-600';
    }

    return {
      ...model,
      statusLabel,
      statusColor,
    };
  });

  return (
    <div className="bg-[#FFF9F2] font-sans text-gray-800 min-h-screen">
      <div className="max-w-6xl mx-auto p-6">
        {/* 主標籤頁切換 */}
        <div className="mb-6">
          <div className="flex gap-2 border-b border-[#EADBC8]">
            <button
              onClick={() => setActiveTab('control')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'control'
                  ? 'border-b-2 border-[#FF8C42] text-[#FF8C42]'
                  : 'text-gray-600 hover:text-[#4B4036]'
              }`}
            >
              控制面板
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'logs'
                  ? 'border-b-2 border-[#FF8C42] text-[#FF8C42]'
                  : 'text-gray-600 hover:text-[#4B4036]'
              }`}
            >
              AI 專案對話紀錄
            </button>
          </div>
        </div>

        {/* 控制面板視圖 */}
        {activeTab === 'control' && (
          <div className="max-w-5xl mx-auto">
            {/* 快速操作按鈕 */}
            <div className="mb-4 flex justify-end">
              <button
                onClick={() => setActiveTab('logs')}
                className="px-4 py-2 rounded-xl bg-white border border-[#EADBC8] text-[#4B4036] hover:bg-[#FFF9F2] transition-colors flex items-center gap-2 shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                查看 AI 專案對話紀錄
              </button>
            </div>
            <AIControlPanel
              models={mockModels}
              onCancelTask={handleCancelTask}
              onCreateTask={handleCreateTask}
              onFilterChange={handleFilterChange}
              onViewLogs={() => setActiveTab('logs')}
            />
          </div>
        )}

        {/* AI 專案對話紀錄視圖 */}
        {activeTab === 'logs' && (
          <div>
            {/* 快速操作按鈕 */}
            <div className="mb-4 flex justify-end">
              <button
                onClick={() => setActiveTab('control')}
                className="px-4 py-2 rounded-xl bg-white border border-[#EADBC8] text-[#4B4036] hover:bg-[#FFF9F2] transition-colors flex items-center gap-2 shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                返回控制面板
              </button>
            </div>
            {/* 子標籤頁 */}
            <div className="flex gap-2 mb-4">
              {(['rooms','users','messages','errors'] as LogTabKey[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setLogActiveTab(t)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    logActiveTab === t 
                      ? 'bg-[#FFEAD1] text-[#4B4036] font-medium' 
                      : 'bg-white border border-[#EADBC8] text-gray-700 hover:bg-[#FFF9F2]'
                  }`}
                >
                  {tabLabel(t)}
                </button>
              ))}
            </div>

            {logLoading ? (
              <div className="py-10 text-center text-[#2B3A3B]">
                <Spinner className="h-6 w-6 mx-auto mb-2" />
                <p>載入中...</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-4 ring-1 ring-[#EADBC8]">
                {logActiveTab === 'rooms' && (
                  <div className="space-y-2">
                    {rooms.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">目前沒有專案記錄</div>
                    ) : (
                      rooms.map((r:any)=> (
                        <div key={r.id} className="p-3 rounded-xl border border-[#EADBC8] hover:bg-[#FFF9F2] transition-colors">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-[#4B4036]">
                                {r.title || '(未命名專案)'} 
                                <span className="text-xs text-gray-500 ml-1">{formatHK(r.created_at)}</span>
                              </p>
                              <p className="text-xs text-gray-600">room_id: {r.id}</p>
                            </div>
                            <span className="text-xs text-gray-500">最後: {formatHK(r.last_message_at)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {logActiveTab === 'users' && (
                  <div className="space-y-2">
                    {users.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">目前沒有用戶記錄</div>
                    ) : (
                      users.map((u:any)=> (
                        <div key={u.id} className="p-3 rounded-xl border border-[#EADBC8] hover:bg-[#FFF9F2] transition-colors">
                          <p className="font-semibold text-[#4B4036]">{u.full_name || u.email}</p>
                          <p className="text-xs text-gray-600">{u.email} · {formatHK(u.created_at)}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {logActiveTab === 'messages' && (
                  <div className="space-y-2">
                    {messages.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">目前沒有對話記錄</div>
                    ) : (
                      messages.map((m:any)=> (
                        <div key={m.id} className="p-3 rounded-xl border border-[#EADBC8] hover:bg-[#FFF9F2] transition-colors">
                          <p className="text-xs text-gray-600 mb-1">room: {m.room_id} · {formatHK(m.created_at)}</p>
                          <p className="font-medium text-[#2B3A3B]">
                            [{m.sender_type}] {m.content?.slice(0,200) || m.content_json?.text || '(空白)'}
                          </p>
                          {(((m.status && m.status !== 'sent') ? true : false) || (m.error_message && m.error_message.trim() !== '')) && (
                            <p className="text-xs text-rose-600 mt-1">狀態: {m.status || 'error'}</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {logActiveTab === 'errors' && (
                  <div className="space-y-2">
                    {messages.filter((m:any)=> 
                      m.status==='error' || 
                      (m.error_message && m.error_message.trim()!=='') || 
                      (m.content && /遇到點小困難|重新輸入|稍後再試/.test(m.content))
                    ).length === 0 ? (
                      <div className="text-center py-8 text-gray-500">目前沒有錯誤記錄</div>
                    ) : (
                      messages.filter((m:any)=> 
                        m.status==='error' || 
                        (m.error_message && m.error_message.trim()!=='') || 
                        (m.content && /遇到點小困難|重新輸入|稍後再試/.test(m.content))
                      ).map((m:any)=> (
                        <div 
                          key={m.id} 
                          className="p-3 rounded-xl border border-rose-200 bg-rose-50 cursor-pointer hover:bg-rose-100 transition-colors" 
                          onClick={()=>openRoomConversation(m.room_id)}
                        >
                          <p className="text-xs text-gray-600 mb-1">room: {m.room_id} · {formatHK(m.created_at)}</p>
                          <p className="font-medium text-[#B00020]">
                            {m.error_message || '系統提示：遇到點小困難，請重新輸入或稍後再試'}
                          </p>
                          <p className="text-xs text-[#2B3A3B] mt-1">
                            內容: {m.content?.slice(0,180) || m.content_json?.text || '(空白)'}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 對話詳情視窗 */}
      {showDialog && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30" 
          onClick={()=>setShowDialog(false)}
        >
          <div 
            className="w-full max-w-3xl bg-white rounded-2xl p-4 ring-1 ring-[#EADBC8] max-h-[80vh] flex flex-col" 
            onClick={(e)=>e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
              <h3 className="text-lg font-bold text-[#2B3A3B]">{dialogTitle}</h3>
              <button 
                className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-[#2B3A3B] transition-colors" 
                onClick={()=>setShowDialog(false)}
              >
                關閉
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto space-y-2 flex-1">
              {dialogItems.length === 0 ? (
                <div className="text-center text-[#2B3A3B] py-6">沒有對話內容</div>
              ) : (
                dialogItems.map((it:any)=>(
                  <div key={it.id} className="p-3 rounded-xl border border-[#EADBC8]">
                    <p className="text-xs text-gray-600 mb-1">{formatHK(it.created_at)} · {it.sender_type}</p>
                    <p className="text-[#2B3A3B] whitespace-pre-wrap">{it.content || it.content_json?.text || '(空白)'}</p>
                    {(((it.status && it.status!=='sent') ? true : false) || (it.error_message && it.error_message.trim()!=='')) && (
                      <p className="text-xs text-rose-600 mt-1">狀態: {it.status || 'error'} · {it.error_message}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
