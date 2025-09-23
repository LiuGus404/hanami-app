"use client";

import React, { useEffect, useState } from 'react';
import { getSaasSupabaseClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
// 移除 framer-motion 以避免 JSX 標識符解析問題

type TabKey = 'rooms' | 'users' | 'messages' | 'errors';

const formatHK = (iso?: string | null) => {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleString('zh-HK', { timeZone: 'Asia/Hong_Kong' });
  } catch {
    return iso;
  }
};

export default function AIProjectLogsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('rooms');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const tabLabel = (t: TabKey) => (t === 'rooms' ? '專案' : t === 'users' ? '用戶' : t === 'messages' ? '對話' : '錯誤');

  // 對話詳情視窗
  const [showDialog, setShowDialog] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogItems, setDialogItems] = useState<any[]>([]);

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
    const load = async () => {
      setLoading(true);
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
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-[#FFF9F2] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-[#2B3A3B]">AI 專案對話紀錄</h1>
          <button className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#2B3A3B]" onClick={()=>router.back()}>返回</button>
        </div>

        <div className="flex gap-2 mb-4">
          {(['rooms','users','messages','errors'] as TabKey[]).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-3 py-1.5 rounded-lg text-sm ${activeTab === t ? 'bg-[#FFEAD1] text-[#4B4036]' : 'bg-white border border-[#EADBC8] text-gray-700'}`}
            >
              {tabLabel(t)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-10 text-center text-[#2B3A3B]">載入中...</div>
        ) : (
          <div className="bg-white rounded-2xl p-4 ring-1 ring-[#EADBC8]">
            {activeTab === 'rooms' && (
              <div className="space-y-2">
                {rooms.map((r:any)=> (
                  <div key={r.id} className="p-3 rounded-xl border border-[#EADBC8]">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-[#4B4036]">{r.title || '(未命名專案)'} <span className="text-xs text-gray-500 ml-1">{formatHK(r.created_at)}</span></p>
                        <p className="text-xs text-gray-600">room_id: {r.id}</p>
                      </div>
                      <span className="text-xs text-gray-500">最後: {formatHK(r.last_message_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-2">
                {users.map((u:any)=> (
                  <div key={u.id} className="p-3 rounded-xl border border-[#EADBC8]">
                    <p className="font-semibold text-[#4B4036]">{u.full_name || u.email}</p>
                    <p className="text-xs text-gray-600">{u.email} · {formatHK(u.created_at)}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'messages' && (
              <div className="space-y-2">
                {messages.map((m:any)=> (
                  <div key={m.id} className="p-3 rounded-xl border border-[#EADBC8]">
                    <p className="text-xs text-gray-600 mb-1">room: {m.room_id} · {formatHK(m.created_at)}</p>
                    <p className="font-medium text-[#2B3A3B]">[{m.sender_type}] {m.content?.slice(0,200) || m.content_json?.text || '(空白)'}</p>
                    {(((m.status && m.status !== 'sent') ? true : false) || (m.error_message && m.error_message.trim() !== '')) && (
                      <p className="text-xs text-rose-600 mt-1">狀態: {m.status || 'error'}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'errors' && (
              <div className="space-y-2">
                {messages.filter((m:any)=> m.status==='error' || (m.error_message && m.error_message.trim()!=='') || (m.content && /遇到點小困難|重新輸入|稍後再試/.test(m.content))).map((m:any)=> (
                  <div key={m.id} className="p-3 rounded-xl border border-rose-200 bg-rose-50 cursor-pointer" onClick={()=>openRoomConversation(m.room_id)}>
                    <p className="text-xs text-gray-600 mb-1">room: {m.room_id} · {formatHK(m.created_at)}</p>
                    <p className="font-medium text-[#B00020]">{m.error_message || '系統提示：遇到點小困難，請重新輸入或稍後再試'}
                    </p>
                    <p className="text-xs text-[#2B3A3B] mt-1">內容: {m.content?.slice(0,180) || m.content_json?.text || '(空白)'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {/* 對話詳情視窗 */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30" onClick={()=>setShowDialog(false)}>
          <div className="w-full max-w-3xl bg-white rounded-2xl p-4 ring-1 ring-[#EADBC8]" onClick={(e)=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-[#2B3A3B]">{dialogTitle}</h3>
              <button className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200" onClick={()=>setShowDialog(false)}>關閉</button>
            </div>
            <div className="max-h-[70vh] overflow-auto space-y-2">
              {dialogItems.map((it:any)=>(
                <div key={it.id} className="p-3 rounded-xl border border-[#EADBC8]">
                  <p className="text-xs text-gray-600 mb-1">{formatHK(it.created_at)} · {it.sender_type}</p>
                  <p className="text-[#2B3A3B] whitespace-pre-wrap">{it.content || it.content_json?.text || '(空白)'}</p>
                  {(((it.status && it.status!=='sent') ? true : false) || (it.error_message && it.error_message.trim()!=='')) && (
                    <p className="text-xs text-rose-600 mt-1">狀態: {it.status || 'error'} · {it.error_message}</p>
                  )}
                </div>
              ))}
              {dialogItems.length===0 && (
                <div className="text-center text-[#2B3A3B] py-6">沒有對話內容</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


