'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Search, Filter, Calendar, Phone, User, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

import BackButton from '@/components/ui/BackButton';
import { useUser } from '@/hooks/useUser';
import { supabase } from '@/lib/supabase';
import HanamiInput from '@/components/ui/HanamiInput';

interface MessageLog {
  id: string;
  student_name: string;
  student_phone: string | null;
  template_name: string;
  message_content: string;
  status: 'pending' | 'sent' | 'failed';
  sent_at: string;
  error_message?: string;
}

export default function AIMessageHistoryPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [messageLogs, setMessageLogs] = useState<MessageLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'sent' | 'failed' | 'pending'>('all');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    if (userLoading || !user) return;
    
    if (!['admin', 'manager'].includes(user.role)) {
      router.push('/');
      return;
    }

    loadMessageLogs();
  }, [user, userLoading, router]);

  const loadMessageLogs = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('hanami_ai_message_logs')
        .select('*')
        .order('sent_at', { ascending: false });

      // 應用搜尋篩選
      if (searchTerm) {
        query = query.or(`student_name.ilike.%${searchTerm}%,template_name.ilike.%${searchTerm}%`);
      }

      // 應用狀態篩選
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      // 應用日期篩選
      if (dateFilter) {
        const startDate = new Date(dateFilter);
        const endDate = new Date(dateFilter);
        endDate.setDate(endDate.getDate() + 1);
        
        query = query.gte('sent_at', startDate.toISOString())
                    .lt('sent_at', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      // 型別轉換，確保 status 為 MessageLog 的 union type
      setMessageLogs(
        (data || []).map((item: any) => ({
          id: item.id,
          student_name: item.student_name,
          student_phone: item.student_phone,
          template_name: item.template_name,
          message_content: item.message_content,
          status: (['pending', 'sent', 'failed'].includes(item.status) ? item.status : 'pending') as 'pending' | 'sent' | 'failed',
          sent_at: item.sent_at || '',
          error_message: item.error_message || undefined,
        }))
      );
    } catch (error) {
      console.error('載入訊息記錄失敗:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'sent':
        return '已發送';
      case 'failed':
        return '發送失敗';
      case 'pending':
        return '發送中';
      default:
        return '未知狀態';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'text-green-600 bg-green-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FCD58B] mx-auto" />
          <p className="mt-4 text-[#2B3A3B]">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF9F2] p-6">
      <div className="max-w-6xl mx-auto">
        {/* 標題和返回按鈕 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BackButton />
            <div className="flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-[#FFB6C1]" />
              <h1 className="text-2xl font-bold text-[#2B3A3B]">AI 訊息歷史記錄</h1>
            </div>
          </div>
        </div>

        {/* 篩選區域 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 搜尋 */}
            <div>
              <label className="block text-sm font-medium text-[#4B4036] mb-2">搜尋</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <HanamiInput
                  className="pl-10"
                  placeholder="搜尋學生姓名或模版..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      loadMessageLogs();
                    }
                  }}
                />
              </div>
            </div>

            {/* 狀態篩選 */}
            <div>
              <label className="block text-sm font-medium text-[#4B4036] mb-2">狀態</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full p-3 border border-gray-300 rounded-lg bg-white"
              >
                <option value="all">全部狀態</option>
                <option value="sent">已發送</option>
                <option value="failed">發送失敗</option>
                <option value="pending">發送中</option>
              </select>
            </div>

            {/* 日期篩選 */}
            <div>
              <label className="block text-sm font-medium text-[#4B4036] mb-2">日期</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full p-3 pl-10 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            {/* 搜尋按鈕 */}
            <div className="flex items-end">
              <button
                onClick={loadMessageLogs}
                className="w-full bg-[#FFB6C1] hover:bg-[#FF9EAD] text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Filter className="w-4 h-4" />
                篩選
              </button>
            </div>
          </div>
        </motion.div>

        {/* 訊息記錄列表 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FCD58B] mx-auto" />
                <p className="mt-2 text-[#2B3A3B]">載入中...</p>
              </div>
            </div>
          ) : messageLogs.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">暫無訊息記錄</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead className="bg-[#FFF9F2]">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-[#2B3A3B]">學生</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-[#2B3A3B]">模版</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-[#2B3A3B]">狀態</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-[#2B3A3B]">發送時間</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-[#2B3A3B]">訊息內容</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {messageLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#FFF9F2]">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            <User className="w-5 h-5 text-[#FFB6C1]" />
                          </div>
                          <div>
                            <div className="font-medium text-[#2B3A3B]">{log.student_name}</div>
                            {log.student_phone && (
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <Phone className="w-3 h-3" />
                                {log.student_phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-[#4B4036]">{log.template_name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(log.status)}
                          <span className={`text-sm px-2 py-1 rounded-full ${getStatusColor(log.status)}`}>
                            {getStatusText(log.status)}
                          </span>
                        </div>
                        {log.error_message && (
                          <div className="text-xs text-red-500 mt-1">{log.error_message}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-[#4B4036]">
                          {new Date(log.sent_at).toLocaleString('zh-HK')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <div className="text-sm text-[#4B4036] line-clamp-3">
                            {log.message_content}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
} 