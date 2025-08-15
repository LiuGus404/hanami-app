'use client';

import { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  RefreshCw,
  Calendar,
  Timer,
  Edit,
  Trash2,
  MoreVertical,
  FileText
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { AIStatsDisplay } from './AIStatsDisplay';

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

export function AIToolsStatusPanel({ className = '' }: AIToolsStatusPanelProps) {
  const [toolStatuses, setToolStatuses] = useState<AIToolStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedStatus, setExpandedStatus] = useState<string | null>('processing'); // 預設展開進行中
  const [editingTool, setEditingTool] = useState<string | null>(null); // 正在編輯的工具ID
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null); // 顯示刪除確認的工具ID
  const [expandedDetails, setExpandedDetails] = useState<string | null>(null); // 展開詳細內容的工具ID

  // 載入AI工具狀態（強制使用API確保JSONB正確處理）
  const loadToolStatuses = async (attempt: number = 1) => {
    const maxAttempts = 3;
    const backoffMs = attempt * 1500;

    // 只有第一次嘗試時顯示 loading
    if (attempt === 1) {
      if (toolStatuses.length === 0) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
    }

    try {
      // 強制使用後端API，確保JSONB數據正確處理
      const res = await fetch('/api/ai-tools/status?limit=50', { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!res.ok) throw new Error(`後端API回應錯誤: ${res.status}`);
      
      const json = await res.json();
      if (json?.success && json?.data?.tool_statuses) {
        console.log('從API獲取的數據:', json.data.tool_statuses);
        
        // 調試：檢查每個記錄的output_data結構
        json.data.tool_statuses.forEach((tool: any, index: number) => {
          console.log(`記錄 ${index + 1}:`, {
            id: tool.id,
            tool_id: tool.tool_id,
            status: tool.status,
            output_data_keys: tool.output_data ? Object.keys(tool.output_data) : 'null',
            generated_content_length: tool.output_data?.generated_content?.length || 0,
            generated_content_preview: tool.output_data?.generated_content?.substring(0, 100) || 'null'
          });
        });
        
        setToolStatuses(json.data.tool_statuses || []);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      throw new Error(json?.error || '後端API未返回成功結果');
      
    } catch (error) {
      console.error(`載入AI工具狀態失敗 (嘗試 ${attempt}/${maxAttempts}):`, error);
      
      if (attempt < maxAttempts) {
        console.log(`${backoffMs}ms 後重試...`);
        setTimeout(() => loadToolStatuses(attempt + 1), backoffMs);
      } else {
        console.error('所有重試都失敗了');
        setLoading(false);
        setRefreshing(false);
        toast.error('載入AI工具狀態失敗');
      }
    }
  };

  // 刪除工具記錄
  const deleteToolRecord = async (toolId: string) => {
    try {
      // 跳過刪除，因為 hanami_ai_tool_usage 表不存在於類型定義中
      const { error } = await supabase
        .from('ai_tasks')
        .delete()
        .eq('id', toolId);

      if (error) {
        console.error('刪除失敗:', error);
        toast.error('刪除失敗');
        return;
      }

      console.log('成功刪除工具記錄:', toolId);
      toast.success('成功移除任務');
      
      // 重新載入數據
      loadToolStatuses();
      
      // 清除編輯狀態
      setEditingTool(null);
      setShowDeleteConfirm(null);
      
    } catch (error) {
      console.error('刪除工具記錄時發生錯誤:', error);
      toast.error('刪除失敗');
    }
  };

  // 切換狀態展開
  const toggleStatusExpansion = (status: string) => {
    setExpandedStatus(expandedStatus === status ? null : status);
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
  };

  // 切換詳細內容展開
  const toggleDetailsExpansion = (toolId: string) => {
    setExpandedDetails(expandedDetails === toolId ? null : toolId);
  };

  // 獲取狀態計數
  const getStatusCounts = () => {
    const counts = { queued: 0, processing: 0, completed: 0, failed: 0 };
    toolStatuses.forEach(tool => {
      counts[tool.status]++;
    });
    return counts;
  };

  // 根據狀態獲取工具
  const getToolsByStatus = (status: string) => {
    return toolStatuses.filter(tool => tool.status === status);
  };

  // 獲取工具名稱
  const getToolName = (toolId: string) => {
    const toolNames: { [key: string]: string } = {
      'content-generation': '內容生成工具',
      'lesson-plan': '教案生成工具',
      'activity-template': '活動範本工具'
    };
    return toolNames[toolId] || toolId;
  };

  // 獲取狀態文字
  const getStatusText = (status: string) => {
    const statusTexts: { [key: string]: string } = {
      'queued': '等待中',
      'processing': '處理中',
      'completed': '已完成',
      'failed': '失敗'
    };
    return statusTexts[status] || status;
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
        return <Timer className="w-4 h-4 text-gray-500" />;
    }
  };

  // 格式化時間
  const formatTime = (timeString: string) => {
    if (!timeString) return '未知';
    const date = new Date(timeString);
    return date.toLocaleString('zh-TW', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  // 計算處理時間
  const calculateProcessingTime = (tool: AIToolStatus) => {
    if (!tool.started_at) return null;
    
    const startTime = new Date(tool.started_at).getTime();
    const endTime = tool.completed_at ? new Date(tool.completed_at).getTime() : Date.now();
    const durationMs = endTime - startTime;
    
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}分${seconds}秒`;
    } else {
      return `${seconds}秒`;
    }
  };

  // 初始化
  useEffect(() => {
    loadToolStatuses();
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
            onClick={() => loadToolStatuses()}
            disabled={refreshing}
            className="flex items-center gap-1 px-3 py-2 bg-[#FFD59A] hover:bg-[#EBC9A4] disabled:bg-gray-300 disabled:cursor-not-allowed text-[#4B4036] rounded-lg transition-colors text-sm font-medium"
          >
            {refreshing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span>{refreshing ? '刷新中...' : '刷新數據'}</span>
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
                                className="flex items-center gap-1 px-3 py-1 bg-red-100 hover:bg-red-200 text-[#4B4036] rounded-lg transition-colors text-sm"
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
                            <div className="mt-2 p-3 bg-[#FFE0E0] border border-[#FFB6C1] rounded-lg">
                              <p className="text-sm text-[#4B4036] mb-2">確定要移除這個任務嗎？此操作無法撤銷。</p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    console.log('點擊確定移除按鈕，工具ID:', tool.id);
                                    deleteToolRecord(tool.id);
                                  }}
                                  className="px-3 py-1 bg-[#FFB6C1] hover:bg-[#FF9AA2] text-white rounded-lg transition-colors text-sm cursor-pointer"
                                >
                                  確定移除
                                </button>
                                <button
                                  onClick={() => setShowDeleteConfirm(null)}
                                  className="px-3 py-1 bg-[#FFF9F2] hover:bg-[#EADBC8] text-[#4B4036] rounded-lg transition-colors text-sm"
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
                            <Timer className="w-3 h-3" />
                            <span>開始時間：{formatTime(tool.started_at)}</span>
                          </div>
                        )}
                        
                        {tool.started_at && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            <span>處理時間：{calculateProcessingTime(tool)}</span>
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
                                className="flex items-center gap-1 px-3 py-1 bg-red-100 hover:bg-red-200 text-[#4B4036] rounded-lg transition-colors text-sm"
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
                            <div className="mt-2 p-3 bg-[#FFE0E0] border border-[#FFB6C1] rounded-lg">
                              <p className="text-sm text-[#4B4036] mb-2">確定要移除這個任務嗎？此操作無法撤銷。</p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    console.log('點擊確定移除按鈕，工具ID:', tool.id);
                                    deleteToolRecord(tool.id);
                                  }}
                                  className="px-3 py-1 bg-[#FFB6C1] hover:bg-[#FF9AA2] text-white rounded-lg transition-colors text-sm cursor-pointer"
                                >
                                  確定移除
                                </button>
                                <button
                                  onClick={() => setShowDeleteConfirm(null)}
                                  className="px-3 py-1 bg-[#FFF9F2] hover:bg-[#EADBC8] text-[#4B4036] rounded-lg transition-colors text-sm"
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
                            <Timer className="w-3 h-3" />
                            <span>開始時間：{formatTime(tool.started_at)}</span>
                          </div>
                        )}
                        
                        {tool.completed_at && (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3" />
                            <span>完成時間：{formatTime(tool.completed_at)}</span>
                          </div>
                        )}
                        
                        {tool.started_at && (
                          <div className="flex items-center gap-2">
                            <Timer className="w-3 h-3" />
                            <span>處理時間：{calculateProcessingTime(tool)}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* 展開詳細內容 */}
                      {expandedDetails === tool.id && tool.output_data && (
                        <div className="mt-3 pt-3 border-t border-[#EADBC8]">
                          <div className="space-y-4">
                            {/* 輸入內容 */}
                            <div>
                              <span>📥 輸入內容</span>
                              <div className="bg-[#FFFDF8] border border-[#EADBC8] rounded-lg p-3">
                                <div className="space-y-2 text-sm text-[#4B4036]">
                                  {tool.input_data?.input_text && (
                                    <div>
                                      <span className="font-medium">文字內容：</span>
                                      <span className="text-xs">{tool.input_data.input_text}</span>
                                    </div>
                                  )}
                                  {tool.input_data?.template_id && (
                                    <div>
                                      <span className="font-medium">範本ID：</span>
                                      <span className="text-xs">{tool.input_data.template_id}</span>
                                    </div>
                                  )}
                                  {tool.input_data?.age_group_id && (
                                    <div>
                                      <span className="font-medium">年齡組ID：</span>
                                      <span className="text-xs">{tool.input_data.age_group_id}</span>
                                    </div>
                                  )}
                                  {tool.input_data?.request_id && (
                                    <div>
                                      <span className="font-medium">請求ID：</span>
                                      <span className="text-xs">{tool.input_data.request_id}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* 生成結果 */}
                            <div>
                              <span>📤 生成結果</span>
                              <div className="bg-[#FFFDF8] border border-[#EADBC8] rounded-lg p-3">
                                <div className="space-y-2 text-sm text-[#4B4036]">
                                  {tool.output_data?.generated_content && (
                                    <div>
                                      <span className="font-medium text-sm">生成內容：</span>
                                      <div className="text-xs bg-white p-2 rounded border mt-1 max-h-32 overflow-y-auto">
                                        {tool.output_data.generated_content}
                                      </div>
                                    </div>
                                  )}
                                  {tool.output_data?.template_used && (
                                    <div>
                                      <span className="font-medium text-sm">使用範本：</span>
                                      <span className="text-xs">{tool.output_data.template_used}</span>
                                    </div>
                                  )}
                                  {tool.output_data?.age_group_reference && (
                                    <div>
                                      <span className="font-medium text-sm">年齡組參考：</span>
                                      <span className="text-xs">{tool.output_data.age_group_reference}</span>
                                    </div>
                                  )}
                                  {tool.output_data?.generated_at && (
                                    <div>
                                      <span className="font-medium text-sm">生成時間：</span>
                                      <span className="text-xs">{new Date(tool.output_data.generated_at).toLocaleString()}</span>
                                    </div>
                                  )}
                                  {tool.output_data?.request_id && (
                                    <div>
                                      <span className="font-medium text-sm">請求ID：</span>
                                      <span className="text-xs">{tool.output_data.request_id}</span>
                                    </div>
                                  )}
                                </div>
                                
                                {/* AI統計信息 */}
                                <AIStatsDisplay aiStats={tool.output_data.ai_stats} />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* 編輯操作區域 */}
                      {editingTool === tool.id && (
                        <div className="mt-3 pt-3 border-t border-[#EADBC8]">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-[#4B4036]">編輯操作</span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => showDeleteConfirmation(tool.id)}
                                className="flex items-center gap-1 px-3 py-1 bg-red-100 hover:bg-red-200 text-[#4B4036] rounded-lg transition-colors text-sm"
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
                            <div className="mt-2 p-3 bg-[#FFE0E0] border border-[#FFB6C1] rounded-lg">
                              <p className="text-sm text-[#4B4036] mb-2">確定要移除這個任務嗎？此操作無法撤銷。</p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => deleteToolRecord(tool.id)}
                                  className="px-3 py-1 bg-[#FFB6C1] hover:bg-[#FF9AA2] text-white rounded-lg transition-colors text-sm cursor-pointer"
                                >
                                  確定移除
                                </button>
                                <button
                                  onClick={() => setShowDeleteConfirm(null)}
                                  className="px-3 py-1 bg-[#FFF9F2] hover:bg-[#EADBC8] text-[#4B4036] rounded-lg transition-colors text-sm"
                                >
                                  取消
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* 展開/收起按鈕 */}
                      {tool.output_data && (
                        <div className="mt-2">
                          <button
                            onClick={() => toggleDetailsExpansion(tool.id)}
                            className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            {expandedDetails === tool.id ? '收起詳情' : '展開詳情'}
                          </button>
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
                          <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-[#4B4036]">
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
                            <Timer className="w-3 h-3" />
                            <span>開始時間：{formatTime(tool.started_at)}</span>
                          </div>
                        )}
                        
                        {tool.completed_at && (
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-3 h-3" />
                            <span>完成時間：{formatTime(tool.completed_at)}</span>
                          </div>
                        )}
                        
                        {tool.started_at && (
                          <div className="flex items-center gap-2">
                            <Timer className="w-3 h-3" />
                            <span>處理時間：{calculateProcessingTime(tool)}</span>
                          </div>
                        )}
                        
                        {tool.error_message && (
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-3 h-3" />
                            <span>錯誤：{tool.error_message}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* 展開詳細內容 */}
                      {expandedDetails === tool.id && tool.output_data && (
                        <div className="mt-3 pt-3 border-t border-[#EADBC8]">
                          <div className="space-y-4">
                            {/* 輸入內容 */}
                            <div>
                              <span>📥 輸入內容</span>
                              <div className="bg-[#FFFDF8] border border-[#EADBC8] rounded-lg p-3">
                                <div className="space-y-2 text-sm text-[#4B4036]">
                                  {tool.input_data?.input_text && (
                                    <div>
                                      <span className="font-medium">文字內容：</span>
                                      <span className="text-xs">{tool.input_data.input_text}</span>
                                    </div>
                                  )}
                                  {tool.input_data?.template_id && (
                                    <div>
                                      <span className="font-medium">範本ID：</span>
                                      <span className="text-xs">{tool.input_data.template_id}</span>
                                    </div>
                                  )}
                                  {tool.input_data?.age_group_id && (
                                    <div>
                                      <span className="font-medium">年齡組ID：</span>
                                      <span className="text-xs">{tool.input_data.age_group_id}</span>
                                    </div>
                                  )}
                                  {tool.input_data?.request_id && (
                                    <div>
                                      <span className="font-medium">請求ID：</span>
                                      <span className="text-xs">{tool.input_data.request_id}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* 生成結果 */}
                            <div>
                              <span>📤 生成結果</span>
                              <div className="bg-[#FFFDF8] border border-[#EADBC8] rounded-lg p-3">
                                <div className="space-y-2 text-sm text-[#4B4036]">
                                  {tool.output_data?.generated_content && (
                                    <div>
                                      <span className="font-medium text-sm">生成內容：</span>
                                      <div className="text-xs bg-white p-2 rounded border mt-1 max-h-32 overflow-y-auto">
                                        {tool.output_data.generated_content}
                                      </div>
                                    </div>
                                  )}
                                  {tool.output_data?.template_used && (
                                    <div>
                                      <span className="font-medium text-sm">使用範本：</span>
                                      <span className="text-xs">{tool.output_data.template_used}</span>
                                    </div>
                                  )}
                                  {tool.output_data?.age_group_reference && (
                                    <div>
                                      <span className="font-medium text-sm">年齡組參考：</span>
                                      <span className="text-xs">{tool.output_data.age_group_reference}</span>
                                    </div>
                                  )}
                                  {tool.output_data?.generated_at && (
                                    <div>
                                      <span className="font-medium text-sm">生成時間：</span>
                                      <span className="text-xs">{new Date(tool.output_data.generated_at).toLocaleString()}</span>
                                    </div>
                                  )}
                                  {tool.output_data?.request_id && (
                                    <div>
                                      <span className="font-medium text-sm">請求ID：</span>
                                      <span className="text-xs">{tool.output_data.request_id}</span>
                                    </div>
                                  )}
                                </div>
                                
                                {/* AI統計信息 */}
                                <AIStatsDisplay aiStats={tool.output_data.ai_stats} />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* 編輯操作區域 */}
                      {editingTool === tool.id && (
                        <div className="mt-3 pt-3 border-t border-[#EADBC8]">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-[#4B4036]">編輯操作</span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => showDeleteConfirmation(tool.id)}
                                className="flex items-center gap-1 px-3 py-1 bg-red-100 hover:bg-red-200 text-[#4B4036] rounded-lg transition-colors text-sm"
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
                            <div className="mt-2 p-3 bg-[#FFE0E0] border border-[#FFB6C1] rounded-lg">
                              <p className="text-sm text-[#4B4036] mb-2">確定要移除這個任務嗎？此操作無法撤銷。</p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => deleteToolRecord(tool.id)}
                                  className="px-3 py-1 bg-[#FFB6C1] hover:bg-[#FF9AA2] text-white rounded-lg transition-colors text-sm cursor-pointer"
                                >
                                  確定移除
                                </button>
                                <button
                                  onClick={() => setShowDeleteConfirm(null)}
                                  className="px-3 py-1 bg-[#FFF9F2] hover:bg-[#EADBC8] text-[#4B4036] rounded-lg transition-colors text-sm"
                                >
                                  取消
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* 展開/收起按鈕 */}
                      {tool.output_data && (
                        <div className="mt-2">
                          <button
                            onClick={() => toggleDetailsExpansion(tool.id)}
                            className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            {expandedDetails === tool.id ? '收起詳情' : '展開詳情'}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 