'use client';

import { useState } from 'react';
import { 
  RefreshCw, 
  Users, 
  Clock, 
  Activity,
  Play,
  Pause,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface AITool {
  id: string;
  tool_name: string;
  tool_description: string;
  tool_type: string;
  is_active: boolean;
  current_users: number;
  queue_length: number;
  avg_wait_time: number;
  status: 'available' | 'maintenance' | 'offline';
}

interface AIToolsStats {
  total_tools: number;
  active_tools: number;
  total_users: number;
  total_queue: number;
  avg_wait_time: number;
}

interface AIToolsDashboardProps {
  tools: AITool[];
  stats: AIToolsStats;
  onToolClick: (toolId: string) => void;
  onRefresh: () => void;
}

export function AIToolsDashboard({ 
  tools, 
  stats, 
  onToolClick, 
  onRefresh 
}: AIToolsDashboardProps) {
  const [refreshing, setRefreshing] = useState(false);

  // 處理刷新
  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  // 獲取工具狀態圖標
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'maintenance':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'offline':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  // 獲取工具狀態文字
  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return '可用';
      case 'maintenance':
        return '維護中';
      case 'offline':
        return '離線';
      default:
        return '未知';
    }
  };

  // 獲取工具類型顏色
  const getToolTypeColor = (type: string) => {
    switch (type) {
      case 'content_generation':
        return 'bg-gradient-to-r from-blue-500 to-blue-600';
      case 'analysis':
        return 'bg-gradient-to-r from-green-500 to-green-600';
      case 'automation':
        return 'bg-gradient-to-r from-purple-500 to-purple-600';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-6 border border-[#EADBC8] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#4B4036] mb-1">總工具數</p>
              <p className="text-2xl font-bold text-[#2B3A3B]">{stats.total_tools}</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-[#4B4036]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-[#EADBC8] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#4B4036] mb-1">活躍工具</p>
              <p className="text-2xl font-bold text-[#2B3A3B]">{stats.active_tools}</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-500 rounded-lg flex items-center justify-center">
              <Play className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-[#EADBC8] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#4B4036] mb-1">當前用戶</p>
              <p className="text-2xl font-bold text-[#2B3A3B]">{stats.total_users}</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-[#EADBC8] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#4B4036] mb-1">輪候人數</p>
              <p className="text-2xl font-bold text-[#2B3A3B]">{stats.total_queue}</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-[#EADBC8] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#4B4036] mb-1">平均等待</p>
              <p className="text-2xl font-bold text-[#2B3A3B]">{stats.avg_wait_time}s</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-500 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* 工具列表 */}
      <div className="bg-white rounded-xl border border-[#EADBC8] shadow-sm">
        <div className="p-6 border-b border-[#EADBC8]">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#2B3A3B]">AI 工具列表</h2>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-[#FFD59A] hover:bg-[#EBC9A4] text-[#4B4036] rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>刷新</span>
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool) => (
              <div
                key={tool.id}
                onClick={() => tool.is_active && onToolClick(tool.id)}
                className={`bg-gradient-to-br from-[#FFFDF8] to-[#FFF9F2] rounded-xl p-6 border border-[#EADBC8] cursor-pointer transition-all duration-200 hover:shadow-md ${
                  !tool.is_active ? 'opacity-60 cursor-not-allowed' : 'hover:scale-105'
                }`}
              >
                {/* 工具標題和狀態 */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[#2B3A3B] mb-1">
                      {tool.tool_name}
                    </h3>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(tool.status)}
                      <span className="text-sm text-[#4B4036]">
                        {getStatusText(tool.status)}
                      </span>
                    </div>
                  </div>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getToolTypeColor(tool.tool_type)}`}>
                    <span className="text-white text-xs font-bold">
                      {tool.tool_type === 'content_generation' ? 'CG' :
                       tool.tool_type === 'analysis' ? 'AN' :
                       tool.tool_type === 'automation' ? 'AU' : 'OT'}
                    </span>
                  </div>
                </div>

                {/* 工具描述 */}
                <p className="text-sm text-[#4B4036] mb-4 line-clamp-2">
                  {tool.tool_description}
                </p>

                {/* 使用統計 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#4B4036]">當前用戶</span>
                    <span className="font-semibold text-[#2B3A3B]">{tool.current_users}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#4B4036]">輪候人數</span>
                    <span className="font-semibold text-[#2B3A3B]">{tool.queue_length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#4B4036]">平均等待</span>
                    <span className="font-semibold text-[#2B3A3B]">{tool.avg_wait_time}s</span>
                  </div>
                </div>

                {/* 操作按鈕 */}
                <div className="mt-4 pt-4 border-t border-[#EADBC8]">
                  {tool.is_active ? (
                    <button className="w-full py-2 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] rounded-lg font-medium hover:from-[#EBC9A4] hover:to-[#FFD59A] transition-all">
                      開始使用
                    </button>
                  ) : (
                    <button className="w-full py-2 bg-gray-200 text-gray-500 rounded-lg font-medium cursor-not-allowed">
                      暫時停用
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 