'use client';

import { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Play,
  Pause,
  Calendar,
  Timer,
  Edit,
  Trash2,
  MoreVertical
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

interface AIToolStatus {
  id: string;
  tool_id: string;
  user_email: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  created_at: string;
  started_at?: string;
  completed_at?: string;
  updated_at: string;
  queue_position?: number;
  priority?: number;
  input_data?: any;
  output_data?: any;
  error_message?: string;
  retry_count?: number;
  max_retries?: number;
  processing_time_ms?: number;
  token_count?: number;
  cost_estimate?: number;
  user_agent?: string;
  ip_address?: string;
  session_id?: string;
}

interface AIToolsStatusPanelProps {
  className?: string;
}

export function AIToolsStatusPanelFixed({ className = '' }: AIToolsStatusPanelProps) {
  const [toolStatuses, setToolStatuses] = useState<AIToolStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [expandedStatus, setExpandedStatus] = useState<string | null>('processing'); // 預設展開進行中
  const [editingTool, setEditingTool] = useState<string | null>(null); // 正在編輯的工具ID
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null); // 顯示刪除確認的工具ID

  // 載入AI工具狀態
  const loadToolStatuses = async () => {
    try {
      setLoading(true);
      // 跳過查詢，因為 hanami_ai_tool_usage 表不存在於類型定義中
      const { data, error } = await supabase
        .from('ai_tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      // 轉換數據格式以匹配 AIToolStatus 類型
      const convertedData = (data || []).map((item: any) => ({
        id: item.id,
        tool_id: item.title || 'unknown',
        user_email: 'admin@hanami.com',
        status: item.status,
        title: item.title,
        model: item.model,
        prompt: item.prompt,
        result: item.result,
        started_at: item.started_at,
        finished_at: item.finished_at,
        error_message: item.error_message,
        assigned_model: item.assigned_model,
        memory_id: item.memory_id,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));
      setToolStatuses(convertedData);
    } catch (error) {
      console.error('載入AI工具狀態失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  // 計算時間差
  const calculateTimeDiff = (startTime: string, endTime?: string): string => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diffMs = end.getTime() - start.getTime();
    
    const minutes = Math.floor(diffMs / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    if (minutes > 0) {
      return `${minutes}分${seconds}秒`;
    }
    return `${seconds}秒`;
  };

  // 格式化時間
  const formatTime = (timeString: string): string => {
    const date = new Date(timeString);
    return date.toLocaleString('zh-TW', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // 獲取狀態圖標
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'queued':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  // 獲取狀態文字
  const getStatusText = (status: string): string => {
    switch (status) {
      case 'queued':
        return '等待中';
      case 'processing':
        return '處理中';
      case 'completed':
        return '已完成';
      case 'failed':
        return '失敗';
      default:
        return '未知';
    }
  };

  // 獲取工具名稱
  const getToolName = (toolId: string): string => {
    switch (toolId) {
      case 'content-generation':
        return '內容生成工具';
      case 'lesson-plan-generator':
        return '教案生成工具';
      case 'activity-suggestor':
        return '活動建議工具';
      default:
        return toolId;
    }
  };

  // 統計各狀態數量
  const getStatusCounts = () => {
    const counts = {
      queued: 0,
      processing: 0,
      completed: 0,
      failed: 0
    };
    
    toolStatuses.forEach(tool => {
      counts[tool.status as keyof typeof counts]++;
    });
    
    return counts;
  };

  // 切換狀態展開/收合
  const toggleStatusExpansion = (status: string) => {
    setExpandedStatus(expandedStatus === status ? null : status);
  };

  // 獲取指定狀態的工具
  const getToolsByStatus = (status: string) => {
    return toolStatuses.filter(tool => tool.status === status);
  };

  // 刪除工具記錄
  const deleteToolRecord = async (toolId: string) => {
    try {
      console.log('=== 開始刪除工具記錄 ===');
      console.log('工具ID:', toolId);
      console.log('當前工具狀態數量:', toolStatuses.length);
      
      // 先檢查記錄是否存在
      console.log('檢查記錄是否存在...');
      // 跳過檢查，因為 hanami_ai_tool_usage 表不存在於類型定義中
      const { data: existingRecord, error: checkError } = await supabase
        .from('ai_tasks')
        .select('id, title, status')
        .eq('id', toolId)
        .single();

      if (checkError) {
        console.error('檢查記錄失敗:', checkError);
        toast.error(`檢查記錄失敗: ${checkError.message}`);
        return;
      }

      if (!existingRecord) {
        console.error('記錄不存在:', toolId);
        toast.error('記錄不存在');
        return;
      }

      console.log('找到記錄:', existingRecord);

      // 執行刪除
      console.log('執行刪除操作...');
      const { error: deleteError } = await supabase
        .from('ai_tasks')
        .delete()
        .eq('id', toolId);

      if (deleteError) {
        console.error('刪除操作失敗:', deleteError);
        toast.error(`刪除失敗: ${deleteError.message}`);
        return;
      }

      console.log('刪除成功，從本地狀態移除');

      // 從本地狀態中移除
      setToolStatuses(prev => {
        const newStatuses = prev.filter(tool => tool.id !== toolId);
        console.log('更新後的工具狀態數量:', newStatuses.length);
        return newStatuses;
      });
      
      setShowDeleteConfirm(null);
      setEditingTool(null);
      toast.success('任務已移除');
      
      console.log('=== 刪除完成 ===');
      
    } catch (error) {
      console.error('刪除工具記錄失敗:', error);
      toast.error(`刪除失敗: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // 切換編輯模式
  const toggleEditMode = (toolId: string) => {
    setEditingTool(editingTool === toolId ? null : toolId);
    setShowDeleteConfirm(null);
  };

  // 顯示刪除確認
  const showDeleteConfirmation = (toolId: string) => {
    console.log('顯示刪除確認，工具ID:', toolId);
    setShowDeleteConfirm(toolId);
    setEditingTool(null);
  };

  useEffect(() => {
    loadToolStatuses();
    
    // 設置自動刷新（每10秒）
    const interval = setInterval(loadToolStatuses, 10000);
    setRefreshInterval(interval);

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []);

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className={`bg-white rounded-xl border border-[#EADBC8] shadow-sm ${className}`}>
        <div className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#4B4036]" />
            <span className="ml-2 text-[#4B4036]">載入AI工具狀態中...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border border-[#EADBC8] shadow-sm ${className}`}>
      {/* 標題和統計 */}
      <div className="p-6 border-b border-[#EADBC8]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#2B3A3B] flex items-center gap-2">
            <Timer className="w-5 h-5" />
            AI工具狀態
          </h2>
          <button
            onClick={loadToolStatuses}
            className="flex items-center gap-1 px-3 py-1 bg-[#FFD59A] hover:bg-[#EBC9A4] text-[#4B4036] rounded-lg transition-colors text-sm"
          >
            <Play className="w-3 h-3" />
            <span>刷新</span>
          </button>
        </div>
        
        {/* 狀態統計 */}
        <div className="grid grid-cols-4 gap-4">
          <button
            onClick={() => toggleStatusExpansion('queued')}
            className={`text-center p-3 rounded-lg transition-all cursor-pointer ${
              expandedStatus === 'queued' 
                ? 'bg-blue-100 border-2 border-blue-300' 
                : 'bg-blue-50 hover:bg-blue-100'
            }`}
          >
            <div className="text-2xl font-bold text-blue-600">{statusCounts.queued}</div>
            <div className="text-xs text-blue-600">等待中</div>
            <div className="text-xs text-blue-500 mt-1">
              {expandedStatus === 'queued' ? '▼' : '▶'}
            </div>
          </button>
          <button
            onClick={() => toggleStatusExpansion('processing')}
            className={`text-center p-3 rounded-lg transition-all cursor-pointer ${
              expandedStatus === 'processing' 
                ? 'bg-yellow-100 border-2 border-yellow-300' 
                : 'bg-yellow-50 hover:bg-yellow-100'
            }`}
          >
            <div className="text-2xl font-bold text-yellow-600">{statusCounts.processing}</div>
            <div className="text-xs text-yellow-600">處理中</div>
            <div className="text-xs text-yellow-500 mt-1">
              {expandedStatus === 'processing' ? '▼' : '▶'}
            </div>
          </button>
          <button
            onClick={() => toggleStatusExpansion('completed')}
            className={`text-center p-3 rounded-lg transition-all cursor-pointer ${
              expandedStatus === 'completed' 
                ? 'bg-green-100 border-2 border-green-300' 
                : 'bg-green-50 hover:bg-green-100'
            }`}
          >
            <div className="text-2xl font-bold text-green-600">{statusCounts.completed}</div>
            <div className="text-xs text-green-600">已完成</div>
            <div className="text-xs text-green-500 mt-1">
              {expandedStatus === 'completed' ? '▼' : '▶'}
            </div>
          </button>
          <button
            onClick={() => toggleStatusExpansion('failed')}
            className={`text-center p-3 rounded-lg transition-all cursor-pointer ${
              expandedStatus === 'failed' 
                ? 'bg-red-100 border-2 border-red-300' 
                : 'bg-red-50 hover:bg-red-100'
            }`}
          >
            <div className="text-2xl font-bold text-red-600">{statusCounts.failed}</div>
            <div className="text-xs text-red-600">失敗</div>
            <div className="text-xs text-red-500 mt-1">
              {expandedStatus === 'failed' ? '▼' : '▶'}
            </div>
          </button>
        </div>
      </div>

      {/* 工具列表 */}
      <div className="p-6">
        {toolStatuses.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-[#4B4036]">暫無AI工具使用記錄</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 等待中的工具 */}
            {expandedStatus === 'queued' && getToolsByStatus('queued').length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-[#2B3A3B] mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  等待中的工具 ({getToolsByStatus('queued').length})
                </h3>
                <div className="space-y-3">
                  {getToolsByStatus('queued').map((tool) => (
                    <div
                      key={tool.id}
                      className="p-4 border border-[#EADBC8] rounded-lg hover:bg-[#FFFDF8] transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(tool.status)}
                          <span className="font-medium text-[#2B3A3B]">
                            {getToolName(tool.tool_id)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                            {getStatusText(tool.status)}
                          </span>
                          <button
                            onClick={() => toggleEditMode(tool.id)}
                            className="p-1 text-[#4B4036] hover:text-[#2B3A3B] hover:bg-gray-100 rounded transition-colors"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="text-sm text-[#4B4036] space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          <span>創建時間：{formatTime(tool.created_at)}</span>
                        </div>
                        
                        {tool.queue_position && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            <span>隊列位置：{tool.queue_position}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* 編輯操作區域 */}
                      {editingTool === tool.id && (
                        <div className="mt-3 pt-3 border-t border-[#EADBC8]">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-[#4B4036]">編輯操作</span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => showDeleteConfirmation(tool.id)}
                                className="flex items-center gap-1 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors text-sm"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>移除</span>
                              </button>
                              <button
                                onClick={() => setEditingTool(null)}
                                className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-[#4B4036] rounded-lg transition-colors text-sm"
                              >
                                <span>取消</span>
                              </button>
                            </div>
                          </div>
                          
                          {/* 刪除確認 */}
                          {showDeleteConfirm === tool.id && (
                            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                              <p className="text-sm text-red-700 mb-2">確定要移除這個任務嗎？此操作無法撤銷。</p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    console.log('點擊確定移除按鈕，工具ID:', tool.id);
                                    deleteToolRecord(tool.id);
                                  }}
                                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm cursor-pointer"
                                >
                                  確定移除
                                </button>
                                <button
                                  onClick={() => setShowDeleteConfirm(null)}
                                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-[#4B4036] rounded-lg transition-colors text-sm"
                                >
                                  取消
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 處理中的工具 */}
            {expandedStatus === 'processing' && getToolsByStatus('processing').length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-[#2B3A3B] mb-3 flex items-center gap-2">
                  <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />
                  處理中的工具 ({getToolsByStatus('processing').length})
                </h3>
                <div className="space-y-3">
                  {getToolsByStatus('processing').map((tool) => (
                    <div
                      key={tool.id}
                      className="p-4 border border-[#EADBC8] rounded-lg hover:bg-[#FFFDF8] transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(tool.status)}
                          <span className="font-medium text-[#2B3A3B]">
                            {getToolName(tool.tool_id)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                            {getStatusText(tool.status)}
                          </span>
                          <button
                            onClick={() => toggleEditMode(tool.id)}
                            className="p-1 text-[#4B4036] hover:text-[#2B3A3B] hover:bg-gray-100 rounded transition-colors"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="text-sm text-[#4B4036] space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          <span>創建時間：{formatTime(tool.created_at)}</span>
                        </div>
                        
                        {tool.started_at && (
                          <div className="flex items-center gap-2">
                            <Play className="w-3 h-3" />
                            <span>開始時間：{formatTime(tool.started_at)}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <Timer className="w-3 h-3" />
                          <span>
                            處理時間：
                            {tool.started_at 
                              ? calculateTimeDiff(tool.started_at)
                              : '尚未開始'
                            }
                          </span>
                        </div>
                      </div>
                      
                      {/* 編輯操作區域 */}
                      {editingTool === tool.id && (
                        <div className="mt-3 pt-3 border-t border-[#EADBC8]">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-[#4B4036]">編輯操作</span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => showDeleteConfirmation(tool.id)}
                                className="flex items-center gap-1 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors text-sm"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>移除</span>
                              </button>
                              <button
                                onClick={() => setEditingTool(null)}
                                className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-[#4B4036] rounded-lg transition-colors text-sm"
                              >
                                <span>取消</span>
                              </button>
                            </div>
                          </div>
                          
                          {/* 刪除確認 */}
                          {showDeleteConfirm === tool.id && (
                            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                              <p className="text-sm text-red-700 mb-2">確定要移除這個任務嗎？此操作無法撤銷。</p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    console.log('點擊確定移除按鈕，工具ID:', tool.id);
                                    deleteToolRecord(tool.id);
                                  }}
                                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm cursor-pointer"
                                >
                                  確定移除
                                </button>
                                <button
                                  onClick={() => setShowDeleteConfirm(null)}
                                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-[#4B4036] rounded-lg transition-colors text-sm"
                                >
                                  取消
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 已完成的工具 */}
            {expandedStatus === 'completed' && getToolsByStatus('completed').length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-[#2B3A3B] mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  已完成的工具 ({getToolsByStatus('completed').length})
                </h3>
                <div className="space-y-3">
                  {getToolsByStatus('completed').map((tool) => (
                    <div
                      key={tool.id}
                      className="p-4 border border-[#EADBC8] rounded-lg hover:bg-[#FFFDF8] transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(tool.status)}
                          <span className="font-medium text-[#2B3A3B]">
                            {getToolName(tool.tool_id)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                            {getStatusText(tool.status)}
                          </span>
                          <button
                            onClick={() => toggleEditMode(tool.id)}
                            className="p-1 text-[#4B4036] hover:text-[#2B3A3B] hover:bg-gray-100 rounded transition-colors"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="text-sm text-[#4B4036] space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          <span>創建時間：{formatTime(tool.created_at)}</span>
                        </div>
                        
                        {tool.started_at && (
                          <div className="flex items-center gap-2">
                            <Play className="w-3 h-3" />
                            <span>開始時間：{formatTime(tool.started_at)}</span>
                          </div>
                        )}
                        
                        {tool.completed_at && (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3" />
                            <span>完成時間：{formatTime(tool.completed_at)}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <Timer className="w-3 h-3" />
                          <span>
                            處理時間：
                            {tool.started_at && tool.completed_at 
                              ? calculateTimeDiff(tool.started_at, tool.completed_at)
                              : '未知'
                            }
                          </span>
                        </div>
                      </div>
                      
                      {/* 編輯操作區域 */}
                      {editingTool === tool.id && (
                        <div className="mt-3 pt-3 border-t border-[#EADBC8]">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-[#4B4036]">編輯操作</span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => showDeleteConfirmation(tool.id)}
                                className="flex items-center gap-1 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors text-sm"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>移除</span>
                              </button>
                              <button
                                onClick={() => setEditingTool(null)}
                                className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-[#4B4036] rounded-lg transition-colors text-sm"
                              >
                                <span>取消</span>
                              </button>
                            </div>
                          </div>
                          
                          {/* 刪除確認 */}
                          {showDeleteConfirm === tool.id && (
                            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                              <p className="text-sm text-red-700 mb-2">確定要移除這個任務嗎？此操作無法撤銷。</p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    console.log('點擊確定移除按鈕，工具ID:', tool.id);
                                    deleteToolRecord(tool.id);
                                  }}
                                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm cursor-pointer"
                                >
                                  確定移除
                                </button>
                                <button
                                  onClick={() => setShowDeleteConfirm(null)}
                                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-[#4B4036] rounded-lg transition-colors text-sm"
                                >
                                  取消
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 失敗的工具 */}
            {expandedStatus === 'failed' && getToolsByStatus('failed').length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-[#2B3A3B] mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  失敗的工具 ({getToolsByStatus('failed').length})
                </h3>
                <div className="space-y-3">
                  {getToolsByStatus('failed').map((tool) => (
                    <div
                      key={tool.id}
                      className="p-4 border border-[#EADBC8] rounded-lg hover:bg-[#FFFDF8] transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(tool.status)}
                          <span className="font-medium text-[#2B3A3B]">
                            {getToolName(tool.tool_id)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">
                            {getStatusText(tool.status)}
                          </span>
                          <button
                            onClick={() => toggleEditMode(tool.id)}
                            className="p-1 text-[#4B4036] hover:text-[#2B3A3B] hover:bg-gray-100 rounded transition-colors"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="text-sm text-[#4B4036] space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          <span>創建時間：{formatTime(tool.created_at)}</span>
                        </div>
                        
                        {tool.started_at && (
                          <div className="flex items-center gap-2">
                            <Play className="w-3 h-3" />
                            <span>開始時間：{formatTime(tool.started_at)}</span>
                          </div>
                        )}
                        
                        {tool.completed_at && (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3" />
                            <span>完成時間：{formatTime(tool.completed_at)}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <Timer className="w-3 h-3" />
                          <span>
                            處理時間：
                            {tool.started_at && tool.completed_at 
                              ? calculateTimeDiff(tool.started_at, tool.completed_at)
                              : tool.started_at 
                                ? calculateTimeDiff(tool.started_at)
                                : '尚未開始'
                            }
                          </span>
                        </div>
                        
                        {tool.error_message && (
                          <div className="flex items-center gap-2 text-red-600">
                            <AlertCircle className="w-3 h-3" />
                            <span>錯誤：{tool.error_message}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* 編輯操作區域 */}
                      {editingTool === tool.id && (
                        <div className="mt-3 pt-3 border-t border-[#EADBC8]">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-[#4B4036]">編輯操作</span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => showDeleteConfirmation(tool.id)}
                                className="flex items-center gap-1 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors text-sm"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>移除</span>
                              </button>
                              <button
                                onClick={() => setEditingTool(null)}
                                className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-[#4B4036] rounded-lg transition-colors text-sm"
                              >
                                <span>取消</span>
                              </button>
                            </div>
                          </div>
                          
                          {/* 刪除確認 */}
                          {showDeleteConfirm === tool.id && (
                            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                              <p className="text-sm text-red-700 mb-2">確定要移除這個任務嗎？此操作無法撤銷。</p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    console.log('點擊確定移除按鈕，工具ID:', tool.id);
                                    deleteToolRecord(tool.id);
                                  }}
                                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm cursor-pointer"
                                >
                                  確定移除
                                </button>
                                <button
                                  onClick={() => setShowDeleteConfirm(null)}
                                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-[#4B4036] rounded-lg transition-colors text-sm"
                                >
                                  取消
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 沒有展開任何狀態時的提示 */}
            {!expandedStatus && (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-[#4B4036]">請點擊上方狀態按鈕查看詳細資訊</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 