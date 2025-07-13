'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';

import AIControlPanel from '@/components/AIControlPanel';
import { Spinner } from '@/components/ui/spinner';
import { getUserSession } from '@/lib/authUtils';

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

const ControlPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState('');

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
      <div className="max-w-5xl mx-auto p-6">
        <AIControlPanel
          models={mockModels}
          onCancelTask={handleCancelTask}
          onCreateTask={handleCreateTask}
          onFilterChange={handleFilterChange}
        />
      </div>
    </div>
  );
};

export default ControlPage;
