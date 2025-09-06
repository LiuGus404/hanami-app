'use client';

import { useState, useEffect, useCallback } from 'react';

// 型別定義
interface Student {
  id: string;
  full_name: string;
  nick_name?: string | null;
  gender?: string | null;
  student_age?: number | null;
  course_type?: string | null;
  ongoing_lessons?: number | null;
  upcoming_lessons?: number | null;
}

interface GrowthTreeNode {
  id: string;
  name: string;
  description?: string;
  level: number;
  progress: number;
  maxProgress: number;
  isUnlocked: boolean;
  isCompleted: boolean;
  prerequisites: string[];
  color?: string;
}

interface GrowthTree {
  id: string;
  tree_name: string;
  tree_description?: string;
  tree_icon?: string;
  nodes: GrowthTreeNode[];
  totalProgress: number;
  currentLevel: number;
}

interface StudentAbility {
  id: string;
  ability_name: string;
  current_level: number;
  progress_percentage: number;
  last_updated: string;
}

interface LearningActivity {
  id: string;
  name: string;
  type: 'practice' | 'assessment' | 'performance' | 'creative';
  completion_date: string;
  score?: number;
  difficulty_level: number;
}

interface UpcomingLesson {
  id: string;
  title: string;
  scheduled_date: string;
  duration: number;
  teacher: string;
  type: 'individual' | 'group' | 'masterclass';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  earned_date: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface StudentAvatarData {
  student: Student;
  growthTrees: GrowthTree[];
  abilities: StudentAbility[];
  recentActivities: LearningActivity[];
  upcomingLessons: UpcomingLesson[];
  achievements: Achievement[];
  summary: {
    totalProgress: number;
    completedActivities: number;
    upcomingLessons: number;
    earnedAchievements: number;
  };
}

interface UseStudentAvatarDataOptions {
  refreshInterval?: number; // 自動刷新間隔（毫秒）
  enableAutoRefresh?: boolean; // 是否啟用自動刷新
}

export function useStudentAvatarData(
  studentId: string | null,
  options: UseStudentAvatarDataOptions = {}
) {
  const {
    refreshInterval = 30000, // 預設30秒刷新一次
    enableAutoRefresh = false
  } = options;

  // 狀態管理
  const [data, setData] = useState<StudentAvatarData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // 載入資料的函數
  const loadData = useCallback(async (showLoading: boolean = true) => {
    if (!studentId) {
      setData(null);
      setError(null);
      return;
    }

    try {
      if (showLoading) setLoading(true);
      setError(null);

      const response = await fetch(`/api/student-avatar-data?studentId=${studentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '載入資料失敗');
      }

      const result = await response.json();
      setData(result);
      setLastUpdated(new Date());

    } catch (err) {
      console.error('載入學生頭像資料失敗：', err);
      setError(err instanceof Error ? err.message : '載入資料失敗');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  // 記錄學生互動
  const recordInteraction = useCallback(async (interactionType: string) => {
    if (!studentId) return;

    try {
      await fetch('/api/student-avatar-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          interactionType,
          timestamp: new Date().toISOString()
        }),
      });
    } catch (err) {
      console.error('記錄互動失敗：', err);
      // 不拋出錯誤，因為這不應該影響主要功能
    }
  }, [studentId]);

  // 手動刷新資料
  const refresh = useCallback(() => {
    loadData(true);
  }, [loadData]);

  // 靜默刷新（不顯示載入狀態）
  const silentRefresh = useCallback(() => {
    loadData(false);
  }, [loadData]);

  // 初始載入
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 自動刷新
  useEffect(() => {
    if (!enableAutoRefresh || !studentId) return;

    const interval = setInterval(() => {
      silentRefresh();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [enableAutoRefresh, studentId, refreshInterval, silentRefresh]);

  // 計算衍生資料
  const derivedData = data ? {
    // 學生基本統計
    studentStats: {
      overallProgress: data.summary.totalProgress,
      totalAbilities: data.summary.earnedAchievements, // 使用 API 返回的能力評估記錄數量
      activeGrowthTrees: data.achievements.length, // 使用成就數量作為成長樹數量
      recentActivityCount: data.recentActivities.length,
      upcomingLessonCount: data.summary.upcomingLessons,
      totalActivities: data.summary.completedActivities // 使用 API 返回的完成活動數量
    },

    // 最新活動
    latestActivity: data.recentActivities[0] || null,

    // 下一堂課
    nextLesson: data.upcomingLessons.find(lesson => 
      lesson.status === 'confirmed' || lesson.status === 'scheduled'
    ) || null,

    // 最新成就
    latestAchievement: data.achievements[0] || null,

    // 進度最高的能力
    topAbility: data.abilities.reduce((top, current) => 
      current.progress_percentage > (top?.progress_percentage || 0) ? current : top
    , data.abilities[0] || null),

    // 當前成長樹
    primaryGrowthTree: data.growthTrees[0] || null
  } : null;

  return {
    // 基本資料
    data,
    loading,
    error,
    lastUpdated,

    // 衍生資料
    ...derivedData,

    // 操作函數
    refresh,
    silentRefresh,
    recordInteraction,

    // 工具函數
    isDataStale: lastUpdated ? (Date.now() - lastUpdated.getTime()) > refreshInterval : true,
    hasData: Boolean(data),
    isEmpty: Boolean(data && !data.growthTrees.length && !data.abilities.length)
  };
}

// 輔助 Hook：學生角色互動記錄
export function useStudentInteractionLogger(studentId: string | null) {
  const recordInteraction = useCallback(async (
    interactionType: 'avatar_click' | 'tree_node_click' | 'activity_view' | 'lesson_check',
    metadata?: Record<string, any>
  ) => {
    if (!studentId) return;

    try {
      await fetch('/api/student-avatar-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          interactionType,
          metadata,
          timestamp: new Date().toISOString()
        }),
      });
    } catch (error) {
      console.error('記錄互動失敗：', error);
    }
  }, [studentId]);

  return { recordInteraction };
}

// 輔助 Hook：成長樹節點操作
export function useGrowthTreeInteraction(studentId: string | null) {
  const [selectedNode, setSelectedNode] = useState<GrowthTreeNode | null>(null);
  const { recordInteraction } = useStudentInteractionLogger(studentId);

  const handleNodeClick = useCallback((node: GrowthTreeNode) => {
    setSelectedNode(node);
    recordInteraction('tree_node_click', {
      nodeId: node.id,
      nodeName: node.name,
      nodeLevel: node.level,
      isCompleted: node.isCompleted
    });
  }, [recordInteraction]);

  const clearSelection = useCallback(() => {
    setSelectedNode(null);
  }, []);

  return {
    selectedNode,
    handleNodeClick,
    clearSelection
  };
}
