'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { 
  PlusIcon, 
  TrashIcon, 
  ArrowRightIcon,
  PlayIcon,
  PauseIcon,
  EyeIcon,
  CogIcon,
  StarIcon,
  TrophyIcon,
  BookOpenIcon,
  PuzzlePieceIcon,
  LightBulbIcon,
  ArrowPathIcon,
  MapIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { HanamiCard, HanamiButton, HanamiInput } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { TreeActivity } from '@/types/progress';
import TeachingActivityDetailModal from '@/components/ui/TeachingActivityDetailModal';
import toast from 'react-hot-toast';

interface LearningNode {
  id: string;
  type: 'start' | 'end' | 'activity' | 'milestone' | 'break';
  title: string;
  description: string;
  duration: number;
  durationUnit?: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  prerequisites: string[];
  reward: string;
  position: { x: number; y: number };
  connections: string[];
  isCompleted: boolean;
  isLocked: boolean;
  order?: number;
  metadata: {
    activityType?: string;
    materials: string[];
    instructions: string;
    learningObjectives: string[];
    activityId?: string; // 添加活動ID
    activityDetails?: {
      duration_minutes?: number;
      category?: string;
      difficulty_level?: number;
      activity_type?: string;
    };
  };
}

interface LearningPath {
  id: string;
  name: string;
  description: string;
  nodes: LearningNode[];
  startNodeId: string;
  endNodeId: string;
  totalDuration: number;
  difficulty: number;
  tags: string[];
}

interface LearningPathBuilderProps {
  treeId: string;
  initialPath?: LearningPath;
  activities?: any[]; // 成長樹下的活動數據
  onSave?: (path: LearningPath) => void;
  onPreview?: (path: LearningPath) => void;
}

const NODE_TYPES = {
  start: { icon: TrophyIcon, color: 'bg-green-500', label: '開始' },
  end: { icon: TrophyIcon, color: 'bg-red-500', label: '結束' },
  activity: { icon: BookOpenIcon, color: 'bg-blue-500', label: '學習活動' },
  assessment: { icon: PuzzlePieceIcon, color: 'bg-green-500', label: '評估' },
  milestone: { icon: TrophyIcon, color: 'bg-yellow-500', label: '里程碑' },
  break: { icon: PauseIcon, color: 'bg-gray-500', label: '休息' }
};

const DIFFICULTY_COLORS = {
  1: 'bg-green-100 text-green-800',
  2: 'bg-blue-100 text-blue-800',
  3: 'bg-yellow-100 text-yellow-800',
  4: 'bg-orange-100 text-orange-800',
  5: 'bg-red-100 text-red-800'
};

export default function LearningPathBuilder({ treeId, initialPath, activities, onSave, onPreview }: LearningPathBuilderProps) {
  // 追蹤是否有未儲存的變更
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalPath, setOriginalPath] = useState<LearningPath | null>(null);
  const [savedPath, setSavedPath] = useState<LearningPath | null>(null);

  const [path, setPath] = useState<LearningPath>(() => {
    // 優先使用 initialPath，如果沒有則使用默認值
    if (initialPath) {
      // 只在開發環境下輸出日誌
      if (process.env.NODE_ENV === 'development') {
        console.log('使用 initialPath 初始化:', initialPath);
      }
      return initialPath;
    }
    
    // 只在開發環境下輸出日誌
    if (process.env.NODE_ENV === 'development') {
      console.log('使用默認值初始化');
    }
    return {
      id: `path-${Date.now()}`,
      name: '新的學習路線',
      description: '',
      nodes: [
        {
          id: 'start',
          title: '開始學習',
          description: '學習旅程的起點',
          type: 'start',
          position: { x: 200, y: 300 },
          duration: 0,
          difficulty: 1,
          prerequisites: [],
          reward: '開始學習的勇氣',
          isCompleted: false,
          isLocked: false,
          connections: ['end'],
          metadata: {
            materials: [],
            instructions: '',
            learningObjectives: []
          }
        },
        {
          id: 'end',
          title: '完成學習',
          description: '恭喜完成學習旅程！',
          type: 'end',
          position: { x: 600, y: 300 },
          duration: 0,
          difficulty: 1,
          prerequisites: [],
          reward: '學習成就證書',
          isCompleted: false,
          isLocked: false,
          connections: [],
          metadata: {
            materials: [],
            instructions: '',
            learningObjectives: []
          }
        }
      ],
      startNodeId: 'start',
      endNodeId: 'end',
      totalDuration: 0,
      difficulty: 1,
      tags: []
    };
  });
  
  const [selectedNode, setSelectedNode] = useState<LearningNode | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<{ from: string; to: string } | null>(null);
  const [showNodeEditor, setShowNodeEditor] = useState(false);
  const [editingNode, setEditingNode] = useState<LearningNode | null>(null);
  const [showTeachingActivityDetail, setShowTeachingActivityDetail] = useState(false);
  const [selectedTeachingActivity, setSelectedTeachingActivity] = useState<any>(null);
  const [showActivitySelector, setShowActivitySelector] = useState(false);
  const [showPathList, setShowPathList] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'play'>('edit');
  const [currentPlayNode, setCurrentPlayNode] = useState<string | null>(null);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [isCanvasDragging, setIsCanvasDragging] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showHelp, setShowHelp] = useState(false);
  const [nodeDragState, setNodeDragState] = useState<{
    isDragging: boolean;
    nodeId: string | null;
    startPos: { x: number; y: number } | null;
    startMousePos: { x: number; y: number } | null;
  }>({
    isDragging: false,
    nodeId: null,
    startPos: null,
    startMousePos: null
  });
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // 新增成長樹活動相關狀態
  const [treeActivities, setTreeActivities] = useState<TreeActivity[]>([]);
  const [loadingTreeActivities, setLoadingTreeActivities] = useState(false);
  const [currentTreeId, setCurrentTreeId] = useState<string>(treeId || '212'); // 使用傳入的treeId或預設值

  // 記住是否曾經有過自定義標題，防止刪除後重置
  const hasEverHadCustomTitlesRef = useRef(false);
  const hasEverHadActivityNodesRef = useRef(false);
  const lastLogKeyRef = useRef<string>('');
  const lastAutoCalcLogRef = useRef<string>('');
  const lastProtectionLogRef = useRef<string>('');
  const lastChangeLogRef = useRef<string>('');
  const lastUpdateLogRef = useRef<string>('');
  const lastInitialPathLogRef = useRef<string>('');
  const changeCheckTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastRenderLogRef = useRef<string>('');
  const lastInitLogRef = useRef<string>('');
  
  // 載入成長樹活動
  useEffect(() => {
    if (currentTreeId) {
      loadTreeActivities(currentTreeId);
    }
  }, [currentTreeId]);

  const loadTreeActivities = async (treeId: string) => {
    try {
      setLoadingTreeActivities(true);
      const { data, error } = await (supabase as any)
        .from('hanami_tree_activities')
        .select(`
          id,
          tree_id,
          activity_id,
          activity_source,
          custom_activity_name,
          custom_activity_description,
          activity_type,
          difficulty_level,
          estimated_duration,
          priority_order,
          activity_order,
          is_required,
          is_active,
          hanami_teaching_activities (
            id,
            activity_name,
            activity_description,
            activity_type,
            difficulty_level,
            duration_minutes,
            materials_needed,
            instructions
          )
        `)
        .eq('tree_id', treeId)
        .eq('is_active', true)
        .order('activity_order', { ascending: true });

      if (error) throw error;
      setTreeActivities(data || []);
    } catch (error) {
      console.error('載入成長樹活動失敗:', error);
    } finally {
      setLoadingTreeActivities(false);
    }
  };

  // 將成長樹活動轉換為學習路徑節點
  const convertTreeActivityToNode = (activity: TreeActivity): LearningNode => {
    const activityName = activity.activity_source === 'teaching' && activity.hanami_teaching_activities
      ? activity.hanami_teaching_activities.activity_name
      : activity.custom_activity_name || '未命名活動';

    const activityDescription = activity.activity_source === 'teaching' && activity.hanami_teaching_activities
      ? activity.hanami_teaching_activities.activity_description
      : activity.custom_activity_description || '';

    return {
      id: `tree_activity_${activity.id}`,
      title: activityName,
      description: activityDescription || '',
      type: 'activity' as const,
      position: { x: 0, y: 0 },
      duration: activity.estimated_duration || 30,
      difficulty: (activity.difficulty_level || 1) as 1 | 2 | 3 | 4 | 5,
      prerequisites: [],
      reward: `完成 ${activityName}`,
      isCompleted: false,
      isLocked: false,
      connections: [],
      metadata: {
        activityId: activity.id,
        activityType: activity.activity_type,
        materials: [],
        instructions: '',
        learningObjectives: []
      }
    };
  };

  // 添加成長樹活動到路徑
  const addTreeActivityToPath = (activity: TreeActivity) => {
    const newNode = convertTreeActivityToNode(activity);
    
    // 設置節點位置（在現有節點之後）
    const lastNode = path.nodes[path.nodes.length - 2]; // 排除結束節點
    if (lastNode && lastNode.id !== 'end') {
      newNode.position = {
        x: lastNode.position.x + 200,
        y: lastNode.position.y
      };
    } else {
      newNode.position = { x: 400, y: 300 };
    }

    updatePathWithChangeTracking(prev => ({
      ...prev,
      nodes: [...prev.nodes.slice(0, -1), newNode, prev.nodes[prev.nodes.length - 1]]
    }));
  };

  // 畫布拖拽功能
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    
    console.log('Canvas mouse down:', {
      target: target.tagName,
      className: target.className,
      isNode: !!target.closest('[data-node]'),
      isCanvasDragging
    });
    
    // 如果點擊在節點上，不啟動畫布拖拽
    if (target.closest('[data-node]')) {
      console.log('Clicked on node, not starting canvas drag');
      return;
    }
    
    // 如果點擊在按鈕上，不啟動畫布拖拽
    if (target.closest('button') || target.tagName === 'BUTTON') {
      console.log('Clicked on button, not starting canvas drag');
      return;
    }
    
    // 啟動畫布拖拽
    console.log('Starting canvas drag');
    setIsCanvasDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    e.preventDefault();
    e.stopPropagation();
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isCanvasDragging && dragStart) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      console.log('Canvas dragging:', { deltaX, deltaY, isCanvasDragging });
      
      setCanvasOffset(prev => {
        const newX = prev.x + deltaX;
        const newY = prev.y + deltaY;
        
        // 添加邊界限制
        const maxOffset = 1000;
        const minOffset = -1000;
        
        return {
          x: Math.max(minOffset, Math.min(maxOffset, newX)),
          y: Math.max(minOffset, Math.min(maxOffset, newY))
        };
      });
      
      setDragStart({ x: e.clientX, y: e.clientY });
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent) => {
    if (isCanvasDragging) {
      setIsCanvasDragging(false);
      setDragStart(null);
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    
    // 如果點擊在節點上，不取消選中
    if (target.closest('[data-node]')) {
      return;
    }
    
    // 點擊空白區域取消選中
    if (!isCanvasDragging) {
      setSelectedNode(null);
    }
  };

  // 防止頁面滾動和默認行為
  useEffect(() => {
    const preventScroll = (e: WheelEvent) => {
      if (isCanvasDragging) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleWheel = (e: WheelEvent) => {
      // 如果按住 Ctrl 鍵，進行縮放
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(0.3, Math.min(3, zoomLevel * delta));
        setZoomLevel(newZoom);
        
        // 計算縮放中心點
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const centerX = e.clientX - rect.left;
          const centerY = e.clientY - rect.top;
          
          setCanvasOffset(prev => ({
            x: centerX - (centerX - prev.x) * delta,
            y: centerY - (centerY - prev.y) * delta
          }));
        }
      }
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (nodeDragState.isDragging) {
        handleNodeMouseMove(e as any);
      }
    };

    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (nodeDragState.isDragging) {
        handleNodeMouseUp(e as any);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // 按 Delete 鍵刪除選中的連接
      if (e.key === 'Delete' && selectedConnection) {
        deleteConnection(selectedConnection.from, selectedConnection.to);
      }
      // 按 Escape 鍵取消選中
      if (e.key === 'Escape') {
        setSelectedConnection(null);
        setSelectedNode(null);
      }
    };

    document.addEventListener('wheel', preventScroll, { passive: false });
    document.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('wheel', preventScroll);
      document.removeEventListener('wheel', handleWheel);
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCanvasDragging, nodeDragState.isDragging, selectedConnection, zoomLevel]);

  // 初始化路徑
  useEffect(() => {
    // 只在開發環境下輸出日誌，並避免重複日誌
    if (process.env.NODE_ENV === 'development') {
      const initLogKey = `${!!initialPath}-${!!savedPath}-${path.nodes.length}`;
      if (initLogKey !== lastInitLogRef.current) {
        if (initialPath) {
          console.log('使用 initialPath 初始化:', initialPath);
        } else {
          console.log('使用默認值初始化');
        }
        lastInitLogRef.current = initLogKey;
      }
    }
    
    // 初始化邏輯...
    if (initialPath) {
      setPath(initialPath);
      setSavedPath(initialPath);
      setOriginalPath(initialPath);
    } else if (savedPath) {
      setPath(savedPath);
      setOriginalPath(savedPath);
    } else if (activities && activities.length > 0) {
      // 創建初始路徑...
    }
  }, [initialPath, savedPath, activities]);

  // 自動居中節點到畫布中心
  const centerNodesOnCanvas = () => {
    if (path.nodes.length === 0) return;
    
    // 使用固定的畫布尺寸，而不是getBoundingClientRect
    const canvasWidth = 2000;
    const canvasHeight = 1200;
    
    console.log('畫布尺寸:', { canvasWidth, canvasHeight });
    console.log('當前畫布偏移:', canvasOffset);
    console.log('當前縮放:', zoomLevel);
    
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    
    // 計算所有節點的邊界
    const positions = path.nodes.map(node => node.position);
    const minX = Math.min(...positions.map(p => p.x));
    const maxX = Math.max(...positions.map(p => p.x));
    const minY = Math.min(...positions.map(p => p.y));
    const maxY = Math.max(...positions.map(p => p.y));
    
    const nodesWidth = maxX - minX;
    const nodesHeight = maxY - minY;
    
    console.log('節點邊界（原始）:', { minX, maxX, minY, maxY, nodesWidth, nodesHeight });
    
    // 計算節點組的中心點
    const nodesCenterX = minX + nodesWidth / 2;
    const nodesCenterY = minY + nodesHeight / 2;
    
    // 計算需要移動畫布的偏移量，讓節點組居中
    // 我們需要將節點中心移動到畫布中心，所以偏移量是畫布中心減去節點中心
    const newOffsetX = centerX - nodesCenterX;
    const newOffsetY = centerY - nodesCenterY;
    
    console.log('節點中心:', { nodesCenterX, nodesCenterY });
    console.log('畫布中心:', { centerX, centerY });
    console.log('新的畫布偏移量:', { newOffsetX, newOffsetY });
    
    // 移動畫布視角到節點位置
    setCanvasOffset({ x: newOffsetX, y: newOffsetY });
    
    // 如果節點太小，自動調整縮放
    const padding = 100; // 節點周圍的邊距
    const scaleX = (canvasWidth - padding * 2) / Math.max(nodesWidth, 200);
    const scaleY = (canvasHeight - padding * 2) / Math.max(nodesHeight, 200);
    const newZoom = Math.min(scaleX, scaleY, 2); // 最大縮放 2 倍
    
    if (newZoom < zoomLevel) {
      console.log('自動調整縮放:', { newZoom, oldZoom: zoomLevel });
      setZoomLevel(newZoom);
    }
    
    console.log('鏡頭已移動到節點位置');
  };

  const addNode = (type: LearningNode['type']) => {
    // 如果是學習活動，彈出活動選擇界面
    if (type === 'activity') {
      // 顯示活動選擇界面
      setShowActivitySelector(true);
      return;
    }
    
    // 生成真正的UUID
    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };
    
    const newNode: LearningNode = {
      id: `node-${Date.now()}`,
      type,
      title: `新的${NODE_TYPES[type].label}`,
      description: '',
      duration: 30,
      durationUnit: '分鐘',
      difficulty: 1,
      prerequisites: [],
      reward: `完成${NODE_TYPES[type].label}`,
      position: { x: 400, y: 200 },
      connections: [],
      isCompleted: false,
      isLocked: false,
      metadata: {
        activityType: undefined,
        materials: [],
        instructions: '',
        learningObjectives: [],
        activityId: undefined
      }
    };
    
    updatePathWithChangeTracking(prev => {
      const newPath = {
        ...prev,
        nodes: [...prev.nodes, newNode]
      };
      
      // 添加節點後，自動計算連線節點狀態
      setTimeout(() => {
        updateConnectedNodesStatus();
      }, 100);
      

      
      return newPath;
    });
    
    setEditingNode(newNode);
    setShowNodeEditor(true);
  };

  const updateNode = (nodeId: string, updates: Partial<LearningNode>) => {
    updatePathWithChangeTracking(prev => ({
      ...prev,
      nodes: prev.nodes.map(node => 
        node.id === nodeId ? { ...node, ...updates } : node
      )
    }));
  };

  const deleteNode = (nodeId: string) => {
    if (nodeId === 'start' || nodeId === 'end') return;
    
    // 只在開發環境下輸出日誌
    if (process.env.NODE_ENV === 'development') {
      console.log('刪除節點:', nodeId);
    }
    
    // 檢查要刪除的節點是否有自定義標題
    const nodeToDelete = path.nodes.find(node => node.id === nodeId);
    if (process.env.NODE_ENV === 'development') {
      console.log('要刪除的節點:', nodeToDelete);
    }
    
    const hasCustomTitle = nodeToDelete && 
      nodeToDelete.type === 'activity' && 
      nodeToDelete.title && 
      !nodeToDelete.title.startsWith('活動 ') && 
      !nodeToDelete.title.startsWith('Activity ');
    
    if (process.env.NODE_ENV === 'development') {
      console.log('節點標題檢查:', {
        nodeTitle: nodeToDelete?.title,
        nodeType: nodeToDelete?.type,
        hasCustomTitle,
        startsWith活動: nodeToDelete?.title?.startsWith('活動 '),
        startsWithActivity: nodeToDelete?.title?.startsWith('Activity ')
      });
    }
    
    if (hasCustomTitle) {
      if (process.env.NODE_ENV === 'development') {
        console.log('刪除自定義標題節點，保持 hasEverHadCustomTitlesRef 為 true');
      }
      hasEverHadCustomTitlesRef.current = true;
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log('刪除的節點不是自定義標題，hasEverHadCustomTitlesRef 保持:', hasEverHadCustomTitlesRef.current);
      }
    }
    
    updatePathWithChangeTracking(prev => {
      if (process.env.NODE_ENV === 'development') {
        console.log('刪除前的路徑:', prev);
      }
      
      // 過濾掉要刪除的節點
      const filteredNodes = prev.nodes.filter(node => node.id !== nodeId);
      
      // 更新所有節點的連接，移除指向被刪除節點的連接
      const updatedNodes = filteredNodes.map(node => ({
        ...node,
        connections: node.connections.filter(conn => conn !== nodeId)
      }));
      
      const newPath = {
        ...prev,
        nodes: updatedNodes
      };
      
      if (process.env.NODE_ENV === 'development') {
        console.log('刪除後的路徑:', newPath);
      }
      
      // 刪除節點後，自動計算連線節點狀態
      setTimeout(() => {
        updateConnectedNodesStatus();
      }, 100);
      
      return newPath;
    });
    
    if (process.env.NODE_ENV === 'development') {
      console.log('節點已刪除');
    }
  };

  const connectNodes = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    
    updatePathWithChangeTracking(prev => {
      const newPath = {
        ...prev,
        nodes: prev.nodes.map(node => 
          node.id === fromId 
            ? { ...node, connections: [...node.connections, toId] }
            : node
        )
      };
      
      // 連接建立後，自動計算連線節點狀態
      setTimeout(() => {
        updateConnectedNodesStatus();
      }, 100);
      
      return newPath;
    });
  };

  const deleteConnection = (fromId: string, toId: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('刪除連接被調用:', { fromId, toId });
    }
    
    updatePathWithChangeTracking(prev => {
      if (process.env.NODE_ENV === 'development') {
        console.log('刪除前的路徑:', prev);
      }
      
      const newPath = {
        ...prev,
        nodes: prev.nodes.map(node => 
          node.id === fromId 
            ? { ...node, connections: node.connections.filter(conn => conn !== toId) }
            : node
        )
      };
      
      if (process.env.NODE_ENV === 'development') {
        console.log('刪除後的路徑:', newPath);
      }
      
      // 刪除連接後，自動計算連線節點狀態
      setTimeout(() => {
        updateConnectedNodesStatus();
      }, 100);
      
      return newPath;
    });
    
    if (process.env.NODE_ENV === 'development') {
      console.log('連接已刪除');
    }
  };

  const handleNodeMouseDown = (e: React.MouseEvent, node: LearningNode) => {
    e.stopPropagation();
    setIsCanvasDragging(false);
    setDragStart(null);
    
    // 只有在編輯模式下才允許拖拽和連接
    if (viewMode !== 'edit') {
      return;
    }
    
    // 如果是編輯模式且按住Ctrl鍵，開始連接
    if (e.ctrlKey) {
      handleConnectionStart(node.id);
      return;
    }
    
    setNodeDragState({
      isDragging: true,
      nodeId: node.id,
      startPos: { ...node.position },
      startMousePos: { x: e.clientX, y: e.clientY }
    });
  };

  const handleNodeMouseMove = (e: React.MouseEvent) => {
    if (nodeDragState.isDragging && nodeDragState.startPos && nodeDragState.startMousePos) {
      const deltaX = e.clientX - nodeDragState.startMousePos.x;
      const deltaY = e.clientY - nodeDragState.startMousePos.y;
      
      const newX = nodeDragState.startPos.x + deltaX;
      const newY = nodeDragState.startPos.y + deltaY;
      
      // 確保位置在合理範圍內
      const clampedX = Math.max(50, Math.min(1950, newX));
      const clampedY = Math.max(50, Math.min(1150, newY));
      
      updateNode(nodeDragState.nodeId!, {
        position: { x: clampedX, y: clampedY }
      });
    }
  };

  const handleNodeMouseUp = (e: React.MouseEvent) => {
    if (nodeDragState.isDragging) {
      setNodeDragState({
        isDragging: false,
        nodeId: null,
        startPos: null,
        startMousePos: null
      });
    }
  };

  const handleConnectionStart = (nodeId: string) => {
    setIsConnecting(true);
    setConnectionStart(nodeId);
    console.log('開始連接:', nodeId);
  };

  const handleConnectionEnd = (nodeId: string) => {
    if (isConnecting && connectionStart && connectionStart !== nodeId) {
      // 檢查是否已經存在連接
      const sourceNode = path.nodes.find(n => n.id === connectionStart);
      if (sourceNode && !sourceNode.connections.includes(nodeId)) {
        connectNodes(connectionStart, nodeId);
        console.log('完成連接:', connectionStart, '->', nodeId);
      } else {
        console.log('連接已存在或無效');
      }
    }
    setIsConnecting(false);
    setConnectionStart(null);
  };

  // 簡化的連接方法：點擊節點進行連接
  const handleNodeClick = (e: React.MouseEvent, node: LearningNode) => {
    e.stopPropagation();
    
    // 如果是連接模式
    if (isConnecting && connectionStart && connectionStart !== node.id) {
      handleConnectionEnd(node.id);
      return;
    }
    
    // 只有在編輯模式下才允許連接和編輯
    if (viewMode === 'edit') {
      // 如果是編輯模式且按住Ctrl鍵，開始連接
      if (e.ctrlKey) {
        handleConnectionStart(node.id);
        return;
      }
      
      // 普通選中（編輯模式）
      if (!nodeDragState.isDragging) {
        setSelectedNode(node);
      }
    } else {
      // 非編輯模式：只允許查看，不允許編輯
      if (!nodeDragState.isDragging) {
        setSelectedNode(node);
      }
    }
  };

  const calculatePathMetrics = () => {
    const totalDuration = path.nodes.reduce((sum, node) => sum + node.duration, 0);
    const avgDifficulty = path.nodes.length > 0 
      ? path.nodes.reduce((sum, node) => sum + node.difficulty, 0) / path.nodes.length 
      : 1;
    
    updatePathWithChangeTracking(prev => ({
      ...prev,
      totalDuration,
      difficulty: Math.round(avgDifficulty)
    }));
  };

  useEffect(() => {
    calculatePathMetrics();
  }, [path.nodes]);

  // 初始化原始路徑
  useEffect(() => {
    if (!originalPath) {
      // 優先使用 savedPath，然後是 initialPath，最後是當前的 path
      const pathToSave = savedPath || initialPath || path;
      setOriginalPath(JSON.parse(JSON.stringify(pathToSave)));
      console.log('初始化原始路徑:', { 
        hasSavedPath: !!savedPath, 
        hasInitialPath: !!initialPath, 
        pathToSaveLength: JSON.stringify(pathToSave).length 
      });
    }
  }, [initialPath, originalPath, savedPath]); // 添加 savedPath 依賴

  // 當 savedPath 更新時，同步更新 path（如果沒有未儲存的變更）
  useEffect(() => {
    if (savedPath && !hasUnsavedChanges) {
      setPath(JSON.parse(JSON.stringify(savedPath)));
      console.log('路徑已同步到儲存狀態');
    }
  }, [savedPath, hasUnsavedChanges]);

  // 當 savedPath 更新且有未儲存的變更時，更新 originalPath
  useEffect(() => {
    if (savedPath && hasUnsavedChanges) {
      setOriginalPath(JSON.parse(JSON.stringify(savedPath)));
      console.log('原始路徑已更新到儲存狀態');
    }
  }, [savedPath, hasUnsavedChanges]);

  // 調試：監控路徑變化
  useEffect(() => {
    // 只在開發環境下輸出日誌，減少生產環境的日誌量
    if (process.env.NODE_ENV === 'development') {
      // 使用 useRef 來追蹤上次的日誌輸出，避免重複日誌
      const logKey = `${path.nodes.length}-${savedPath?.nodes.length || 0}-${hasUnsavedChanges}-${viewMode}`;
      if (logKey !== lastLogKeyRef.current) {
        console.log('路徑狀態變化:', {
          pathNodesCount: path.nodes.length,
          hasSavedPath: !!savedPath,
          savedPathNodesCount: savedPath?.nodes.length || 0,
          hasUnsavedChanges,
          viewMode
        });
        lastLogKeyRef.current = logKey;
      }
    }
  }, [path.nodes.length, savedPath, hasUnsavedChanges, viewMode]);

  // 自動計算連線節點狀態
  useEffect(() => {
    if (viewMode === 'edit' && path.nodes.length > 2) {
      // 延遲計算，確保所有更新都完成，並增加防抖時間
      const timer = setTimeout(() => {
        updateConnectedNodesStatus();
      }, 500); // 從 200ms 增加到 500ms
      
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [path.nodes.length, viewMode]); // 移除 updateConnectedNodesStatus 避免循環依賴

  // 保護機制：防止已編輯的節點被重置
  useEffect(() => {
    const hasCustomTitles = path.nodes.some(node => 
      node.type === 'activity' && 
      node.title && 
      !node.title.startsWith('活動 ') && 
      !node.title.startsWith('Activity ')
    );
    
    const hasActivityNodes = path.nodes.some(node => node.type === 'activity');
    
    // 只在開發環境下輸出日誌，並避免重複日誌
    if (process.env.NODE_ENV === 'development') {
      const protectionLogKey = `${hasCustomTitles}-${hasEverHadCustomTitlesRef.current}-${hasActivityNodes}-${hasEverHadActivityNodesRef.current}`;
      if (protectionLogKey !== lastProtectionLogRef.current) {
        console.log('檢測到自定義節點，啟用保護機制:', {
          activityNodes: path.nodes
            .filter(node => node.type === 'activity')
            .map(node => node.title),
          hasCustomTitles,
          hasEverHadCustomTitles: hasEverHadCustomTitlesRef.current,
          hasEverHadActivityNodes: hasEverHadActivityNodesRef.current
        });
        lastProtectionLogRef.current = protectionLogKey;
      }
    }
    
    if (hasCustomTitles) {
      hasEverHadCustomTitlesRef.current = true;
    }
    
    if (hasActivityNodes) {
      hasEverHadActivityNodesRef.current = true;
    }
  }, [path.nodes]);

  const renderNode = (node: LearningNode) => {
    // 調試日誌：檢查節點的所有屬性
    if (process.env.NODE_ENV === 'development') {
      console.log('渲染節點詳細:', {
        id: node.id,
        title: node.title,
        type: node.type,
        order: node.order,
        duration: node.duration,
        difficulty: node.difficulty,
        reward: node.reward,
        isCompleted: node.isCompleted,
        isLocked: node.isLocked,
        position: node.position,
        connections: node.connections,
        description: node.description,
        metadata: node.metadata
      });
      
      // 檢查所有可能顯示在UI上的值
      console.log('檢查可能顯示為0的值:', {
        'node.order': node.order,
        'node.duration': node.duration,
        'node.difficulty': node.difficulty,
        'node.reward': node.reward,
        'node.isCompleted': node.isCompleted,
        'node.isLocked': node.isLocked,
        'duration_minutes': node.metadata?.activityDetails?.duration_minutes,
        'difficulty_level': node.metadata?.activityDetails?.difficulty_level
      });
    }
    
    // 只在開發環境下輸出日誌
    if (process.env.NODE_ENV === 'development') {
      console.log('LearningPathBuilder 渲染中, viewMode:', viewMode, 'showHelp:', showHelp);
    }
    
    const isSelected = selectedNode?.id === node.id;
    const isConnectionStart = connectionStart === node.id;
    const isLocked = node.isLocked;
    const isCompleted = node.isCompleted;
    const isNodeDragging = nodeDragState.isDragging && nodeDragState.nodeId === node.id;
    
    // 根據節點類型獲取圖標組件
    const nodeType = NODE_TYPES[node.type];
    
    // 根據節點狀態選擇顏色
    const getNodeColors = () => {
      if (isCompleted) {
        return {
          bg: 'bg-gradient-to-br from-blue-200 to-green-300',
          text: 'text-gray-800',
          border: 'border-blue-300',
          shadow: 'shadow-blue-300/30'
        };
      }
      
      if (isLocked) {
        return {
          bg: 'bg-gradient-to-br from-gray-300 to-gray-400',
          text: 'text-gray-600',
          border: 'border-gray-400',
          shadow: 'shadow-gray-400/20'
        };
      }
      
      switch (node.type) {
        case 'start':
        case 'end':
          return {
            bg: 'bg-gradient-to-br from-[#F98C53] to-[#FCCEB4]',
            text: 'text-white',
            border: 'border-[#FCCEB4]',
            shadow: 'shadow-[#F98C53]/20'
          };
        case 'activity':
          // 如果活動節點已連線（有順序），使用淺藍到淺綠漸變
          if (node.order && node.order > 0) {
            return {
              bg: 'bg-gradient-to-br from-blue-100 to-green-200',
              text: 'text-gray-800',
              border: 'border-blue-200',
              shadow: 'shadow-blue-200/30'
            };
          }
          return {
            bg: 'bg-gradient-to-br from-[#ABD7FB] to-[#D2E0AA]',
            text: 'text-gray-800',
            border: 'border-[#ABD7FB]',
            shadow: 'shadow-[#ABD7FB]/20'
          };
        case 'milestone':
          return {
            bg: 'bg-gradient-to-br from-[#FCCEB4] to-[#F98C53]',
            text: 'text-white',
            border: 'border-[#FCCEB4]',
            shadow: 'shadow-[#F98C53]/20'
          };
        case 'break':
          return {
            bg: 'bg-gradient-to-br from-[#F9F2EF] to-[#D2E0AA]',
            text: 'text-gray-700',
            border: 'border-[#D2E0AA]',
            shadow: 'shadow-[#D2E0AA]/20'
          };
        default:
          return {
            bg: 'bg-gradient-to-br from-[#F9F2EF] to-[#ABD7FB]',
            text: 'text-gray-700',
            border: 'border-[#ABD7FB]',
            shadow: 'shadow-[#ABD7FB]/20'
          };
      }
    };
    
    const colors = getNodeColors();
    
    return (
      <motion.div
        key={node.id}
        data-node={node.id}
        className={`absolute select-none ${viewMode === 'edit' ? 'cursor-pointer' : 'cursor-default'}`}
        style={{
          left: node.position.x,
          top: node.position.y,
          transform: 'translate(-50%, -50%)',
          zIndex: isSelected ? 30 : 20
        }}
        onMouseDown={(e) => handleNodeMouseDown(e, node)}
        onMouseUp={(e) => {
          e.stopPropagation();
          // 如果是連接模式，處理連接結束
          if (isConnecting && connectionStart && connectionStart !== node.id) {
            handleConnectionEnd(node.id);
          }
          handleNodeMouseUp(e);
        }}
        onClick={(e) => handleNodeClick(e, node)}
        onDoubleClick={(e) => {
          e.stopPropagation();
          // 只有在編輯模式下才允許編輯
          if (viewMode !== 'edit') {
            return;
          }
          // 開始和完結節點不能編輯
          if (node.type === 'start' || node.type === 'end') {
            // 只在開發環境下輸出日誌
            if (process.env.NODE_ENV === 'development') {
              console.log('開始和完結節點不能編輯');
            }
            return;
          }
          // 只有在沒有拖拽時才觸發雙擊事件
          if (!nodeDragState.isDragging) {
            // 如果是活動節點，彈出TeachingActivityDetailModal
            if (node.type === 'activity') {
              handleActivityNodeEdit(node);
            } else {
              setEditingNode(node);
              setShowNodeEditor(true);
            }
          }
        }}
      >
        <motion.div
          className={`
            relative p-6 rounded-2xl shadow-lg border-2
            ${colors.bg} ${colors.text}
            ${colors.border} ${colors.shadow}
            ${isSelected ? 'scale-110 shadow-xl ring-4 ring-yellow-400' : ''}
            ${isConnectionStart ? 'ring-4 ring-yellow-400 animate-pulse' : ''}
            ${isLocked ? 'opacity-60' : ''}
            ${isNodeDragging ? 'shadow-2xl scale-105' : ''}
          `}
        >
          {/* 節點狀態指示器 */}
          <div 
            className={`
              absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white shadow-lg flex items-center justify-center
              ${viewMode === 'edit' ? 'cursor-pointer transition-all duration-200 hover:scale-110 hover:shadow-xl' : 'cursor-default'}
              ${isConnectionStart ? 'ring-2 ring-yellow-400 animate-pulse' : ''}
              ${isConnecting && connectionStart && connectionStart !== node.id ? 'ring-2 ring-blue-400 animate-pulse' : ''}
            `}
            onClick={(e) => {
              e.stopPropagation();
              // 只有在編輯模式下才允許連接
              if (viewMode !== 'edit') {
                return;
              }
              
              // 如果是連接模式，處理連接
              if (isConnecting && connectionStart && connectionStart !== node.id) {
                handleConnectionEnd(node.id);
              } else {
                // 開始連接
                handleConnectionStart(node.id);
              }
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              // 只有在編輯模式下才允許連接
              if (viewMode !== 'edit') {
                return;
              }
              
              // 如果是連接模式，處理連接
              if (isConnecting && connectionStart && connectionStart !== node.id) {
                handleConnectionEnd(node.id);
              } else {
                // 開始連接
                handleConnectionStart(node.id);
              }
            }}
            title={viewMode === 'edit' ? '點擊開始連接' : ''}
          >
            {isCompleted ? (
              <div className="text-green-500 text-lg">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            ) : isLocked ? (
              <div className="text-gray-500 text-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
            ) : (
              <div className="text-blue-500 text-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                </svg>
              </div>
            )}
          </div>
          
          {/* 選中節點的操作按鈕 */}
          {isSelected && viewMode === 'edit' && (
            <div className="absolute -top-2 -left-2 flex gap-1">
              {/* 編輯按鈕 - 開始和完結節點不能編輯 */}
              {node.type !== 'start' && node.type !== 'end' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // 如果是活動節點，彈出TeachingActivityDetailModal
                    if (node.type === 'activity') {
                      handleActivityNodeEdit(node);
                    } else {
                      setEditingNode(node);
                      setShowNodeEditor(true);
                    }
                  }}
                  className="w-6 h-6 bg-[#ABD7FB] hover:bg-[#F98C53] rounded-full shadow-lg flex items-center justify-center transition-colors duration-200"
                  title="編輯節點"
                >
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
              )}
              
              {/* 刪除按鈕 */}
              {node.id !== 'start' && node.id !== 'end' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('確定要刪除此節點嗎？')) {
                      deleteNode(node.id);
                      setSelectedNode(null);
                    }
                  }}
                  className="w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full shadow-lg flex items-center justify-center transition-colors duration-200"
                  title="刪除節點"
                >
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          )}
          
          {/* 節點內容 */}
          <div className="flex items-center gap-3 mb-3">
            <div>
              <nodeType.icon className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg">{node.title}</span>
              {/* 顯示節點順序（僅活動節點） */}
              {node.type === 'activity' && node.order && node.order > 0 && (
                <span className="text-xs text-gray-600 bg-white/30 px-2 py-1 rounded-full self-start">
                  第 {node.order} 個活動
                </span>
              )}
            </div>
          </div>
          
          <div className="text-sm opacity-90 mb-3 leading-relaxed">
            {node.description || ''}
          </div>
          
          {/* 活動節點詳細信息 */}
          {node.type === 'activity' && node.metadata?.activityDetails && (
            <div className="space-y-2 mb-3">
              
              {/* 時間 */}
              <div className="flex items-center gap-2 text-xs">
                <span className="bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  {node.metadata?.activityDetails?.duration_minutes || node.duration || 30}分鐘
                </span>
              </div>
              
              {/* 分類 */}
              {node.metadata.activityDetails.category && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                    {node.metadata.activityDetails.category}
                  </span>
                </div>
              )}
              
              {/* 難度 */}
              {node.metadata.activityDetails.difficulty_level && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    難度 {node.metadata.activityDetails.difficulty_level}
                  </span>
                </div>
              )}
              
              {/* 類型 */}
              {node.metadata.activityDetails.activity_type && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                    </svg>
                    {node.metadata.activityDetails.activity_type}
                  </span>
                </div>
              )}
            </div>
          )}
          

          

          

          
          {/* 獎勵顯示 - 已完全移除 */}
        </motion.div>
      </motion.div>
    );
  };

  const renderConnections = () => {
    return path.nodes.map(node => 
      node.connections.map(connectionId => {
        const targetNode = path.nodes.find(n => n.id === connectionId);
        if (!targetNode) return null;
        
        // 連接線從節點中心到節點中心
        const startX = node.position.x;
        const startY = node.position.y;
        const endX = targetNode.position.x;
        const endY = targetNode.position.y;
        
        // 計算連接線的中點
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;
        
        // 計算連接線的角度
        const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;
        
        return (
          <g key={`${node.id}-${connectionId}`}>
            {/* 連接線 - 從節點中心到節點中心 */}
            <motion.line
              x1={startX}
              y1={startY}
              x2={endX}
              y2={endY}
              stroke={selectedConnection?.from === node.id && selectedConnection?.to === connectionId ? "#EF4444" : "#3B82F6"}
              strokeWidth={selectedConnection?.from === node.id && selectedConnection?.to === connectionId ? "6" : "4"}
              strokeDasharray="8,8"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="cursor-pointer hover:stroke-blue-600"
              style={{ pointerEvents: 'auto' }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (process.env.NODE_ENV === 'development') {
                  console.log('連接線被點擊:', { nodeId: node.id, connectionId });
                }
                // 點擊連接線時選中連接
                setSelectedConnection({ from: node.id, to: connectionId });
              }}
            />
            
            {/* 連接線中點的刪除按鈕 */}
            {viewMode === 'edit' && (
              <g transform={`translate(${midX}, ${midY})`}>
                {/* 背景圓圈 */}
                <motion.circle
                  r="18"
                  fill="white"
                  stroke="#EF4444"
                  strokeWidth="3"
                  className="cursor-pointer hover:fill-red-50 hover:stroke-red-600 transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (process.env.NODE_ENV === 'development') {
                      console.log('連接線刪除按鈕被點擊:', { nodeId: node.id, connectionId });
                    }
                    deleteConnection(node.id, connectionId);
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  style={{ pointerEvents: 'auto' }}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.5 }}
                />
                {/* 刪除圖標 */}
                <text
                  x="0"
                  y="0"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="18"
                  fill="#EF4444"
                  className="pointer-events-none font-bold"
                  style={{ pointerEvents: 'none' }}
                >
                  ×
                </text>
                {/* 工具提示背景 */}
                {/* 已移除黑色背景框 */}
                
                {/* 工具提示文字 */}
                <text
                  x="0"
                  y="-20"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="11"
                  fill="white"
                  className="pointer-events-none font-medium"
                  style={{ pointerEvents: 'none' }}
                >
                  
                </text>
              </g>
            )}
            
            {/* 連接線終點的箭頭 */}
            <motion.g 
              transform={`translate(${endX}, ${endY}) rotate(${angle})`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 1 }}
            >
              <polygon
                points="0,0 -12,8 -12,-8"
                fill={selectedConnection?.from === node.id && selectedConnection?.to === connectionId ? "#EF4444" : "#3B82F6"}
                className="pointer-events-none"
              />
            </motion.g>
          </g>
        );
      })
    );
  };

  const playPath = () => {
    setViewMode('play');
    setCurrentPlayNode(path.startNodeId);
    
    // 模擬學習路徑播放
    const playNextNode = (nodeId: string) => {
      setCurrentPlayNode(nodeId);
      const node = path.nodes.find(n => n.id === nodeId);
      if (node && node.connections.length > 0) {
        setTimeout(() => {
          playNextNode(node.connections[0]);
        }, 2000);
      }
    };
    
    setTimeout(() => {
      playNextNode(path.startNodeId);
    }, 1000);
  };

  // 重置到儲存狀態
  const resetToSavedState = useCallback(() => {
    if (!savedPath) return;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('重置到儲存狀態');
    }
    
    setPath(savedPath);
    setOriginalPath(savedPath);
    setHasUnsavedChanges(false);
    
    // 檢查儲存的路徑是否有自定義標題
    const hasCustomTitles = savedPath.nodes.some(node => 
      node.type === 'activity' && 
      node.title && 
      !node.title.startsWith('活動 ') && 
      !node.title.startsWith('Activity ')
    );
    
    // 如果儲存的路徑本身沒有自定義標題，重置標記
    if (!hasCustomTitles) {
      hasEverHadCustomTitlesRef.current = false;
      if (process.env.NODE_ENV === 'development') {
        console.log('儲存的路徑沒有自定義標題，重置 hasEverHadCustomTitlesRef');
      }
    }
    
    toast.success('已重置到儲存狀態');
  }, [savedPath]);

  // 強制恢復功能
  const forceRestore = useCallback(() => {
    if (savedPath) {
      setPath(JSON.parse(JSON.stringify(savedPath)));
      setHasUnsavedChanges(false);
      setOriginalPath(JSON.parse(JSON.stringify(savedPath)));
      // 只在開發環境下輸出日誌
      if (process.env.NODE_ENV === 'development') {
        console.log('已強制恢復到儲存狀態');
      }
    } else if (initialPath) {
      setPath(JSON.parse(JSON.stringify(initialPath)));
      setHasUnsavedChanges(false);
      setOriginalPath(JSON.parse(JSON.stringify(initialPath)));
      // 只在開發環境下輸出日誌
      if (process.env.NODE_ENV === 'development') {
        console.log('已強制恢復到初始狀態');
      }
    }
  }, [savedPath, initialPath]);

  // 儲存功能
  const handleSave = useCallback(async () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('=== 儲存路徑 ===');
      console.log('儲存前的路徑:', path);
    }
    
    const savedPathData = {
      ...path,
      lastSaved: new Date().toISOString()
    };
    
    if (process.env.NODE_ENV === 'development') {
      console.log('儲存的數據:', savedPathData);
    }
    
    // 更新儲存狀態
    setSavedPath(savedPathData);
    setOriginalPath(savedPathData);
    setHasUnsavedChanges(false);
    
    // 檢查儲存時是否有自定義標題
    const hasCustomTitles = path.nodes.some(node => 
      node.type === 'activity' && 
      node.title && 
      !node.title.startsWith('活動 ') && 
      !node.title.startsWith('Activity ')
    );
    
    if (process.env.NODE_ENV === 'development') {
      console.log('儲存時的自定義標題檢查:', {
        hasCustomTitles,
        activityNodes: path.nodes
          .filter(node => node.type === 'activity')
          .map(node => node.title)
      });
    }
    
    // 如果有自定義標題，設置標記
    if (hasCustomTitles) {
      hasEverHadCustomTitlesRef.current = true;
      if (process.env.NODE_ENV === 'development') {
        console.log('儲存時設置 hasEverHadCustomTitlesRef 為 true');
      }
    }
    
    // 如果有外部儲存回調，調用它
    if (onSave) {
      try {
        await onSave(savedPathData);
        if (process.env.NODE_ENV === 'development') {
          console.log('學習路徑已儲存');
        }
        toast.success('學習路徑保存成功！');
      } catch (error) {
        console.error('儲存失敗:', error);
        toast.error('儲存失敗，請重試');
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log('學習路徑狀態已更新（無外部儲存回調）');
      }
      toast.success('學習路徑狀態已更新！');
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('=== 儲存完成 ===');
    }
  }, [path, onSave]);

  // 檢查變更
  const checkForChanges = useCallback((newPath: LearningPath) => {
    if (originalPath) {
      const hasChanges = JSON.stringify(newPath) !== JSON.stringify(originalPath);
      setHasUnsavedChanges(hasChanges);
      // 只在開發環境下輸出日誌，並避免重複日誌
      if (process.env.NODE_ENV === 'development') {
        const changeLogKey = `${hasChanges}-${JSON.stringify(originalPath).length}-${JSON.stringify(newPath).length}`;
        if (changeLogKey !== lastChangeLogRef.current) {
          console.log('變更檢查:', { hasChanges, originalPathLength: JSON.stringify(originalPath).length, newPathLength: JSON.stringify(newPath).length });
          lastChangeLogRef.current = changeLogKey;
        }
      }
    } else {
      // 只在開發環境下輸出日誌，並避免重複日誌
      if (process.env.NODE_ENV === 'development') {
        if (!lastChangeLogRef.current.includes('no-original')) {
          console.log('原始路徑未初始化');
          lastChangeLogRef.current = 'no-original';
        }
      }
    }
  }, [originalPath]);

  // 更新路徑時檢查變更
  const updatePathWithChangeTracking = useCallback((updater: (prev: LearningPath) => LearningPath) => {
    setPath(prev => {
      const newPath = updater(prev);
      // 使用防抖來減少變更檢查的頻率
      if (changeCheckTimerRef.current) {
        clearTimeout(changeCheckTimerRef.current);
      }
      changeCheckTimerRef.current = setTimeout(() => {
        checkForChanges(newPath);
      }, 300); // 300ms 防抖
      return newPath;
    });
  }, [checkForChanges]);

  // 處理 initialPath 變化
  useEffect(() => {
    if (initialPath) {
      // 只在開發環境下輸出日誌，並避免重複日誌
      if (process.env.NODE_ENV === 'development') {
        const initialPathLogKey = `${initialPath.id}-${initialPath.nodes.length}`;
        if (initialPathLogKey !== lastInitialPathLogRef.current) {
          console.log('initialPath 變化，更新路徑:', initialPath);
          lastInitialPathLogRef.current = initialPathLogKey;
        }
      }
      setPath(initialPath);
      setSavedPath(initialPath);
      setOriginalPath(initialPath);
      
      // 檢查是否有自定義標題
      const hasCustomTitles = initialPath.nodes.some(node => 
        node.type === 'activity' && 
        node.title && 
        !node.title.startsWith('活動 ') && 
        !node.title.startsWith('Activity ')
      );
      
      if (hasCustomTitles) {
        hasEverHadCustomTitlesRef.current = true;
        // 只在開發環境下輸出日誌，並避免重複日誌
        if (process.env.NODE_ENV === 'development') {
          if (!lastInitialPathLogRef.current.includes('custom-titles')) {
            console.log('initialPath 包含自定義標題，設置 hasEverHadCustomTitlesRef 為 true');
            lastInitialPathLogRef.current += '-custom-titles';
          }
        }
      }
      
      // 檢查是否有活動節點
      const hasActivityNodes = initialPath.nodes.some(node => node.type === 'activity');
      if (hasActivityNodes) {
        hasEverHadActivityNodesRef.current = true;
        // 只在開發環境下輸出日誌，並避免重複日誌
        if (process.env.NODE_ENV === 'development') {
          if (!lastInitialPathLogRef.current.includes('activity-nodes')) {
            console.log('initialPath 包含活動節點，設置 hasEverHadActivityNodesRef 為 true');
            lastInitialPathLogRef.current += '-activity-nodes';
          }
        }
      }
    }
  }, [initialPath]);

  // 自動加載所有活動節點的詳細信息
  const loadAllActivityDetails = useCallback(async () => {
    const activityNodes = path.nodes.filter(node => 
      node.type === 'activity' && 
      !node.metadata?.activityDetails
    );
    
    if (activityNodes.length === 0) return;
    
    for (const node of activityNodes) {
      try {
        let data: any = null;
        let error: any = null;
        
        // 方法1: 如果有activityId，直接查詢
        if (node.metadata?.activityId) {
          const result = await supabase
            .from('hanami_teaching_activities')
            .select('*')
            .eq('id', node.metadata.activityId)
            .single();
          
          data = result.data;
          error = result.error;
        }
        
        // 方法2: 如果沒有activityId或查詢失敗，嘗試從標題中提取活動信息
        if (!data || error) {
          // 從標題中提取活動名稱（去掉數字前綴）
          const titleMatch = node.title.match(/^\d{4}-(.+)/);
          if (titleMatch) {
            const activityName = titleMatch[1];
            
            // 嘗試通過活動名稱查詢
            const result = await supabase
              .from('hanami_teaching_activities')
              .select('*')
              .ilike('activity_name', `%${activityName}%`)
              .limit(1)
              .single();
            
            data = result.data;
            error = result.error;
            
            // 如果找到匹配的活動，更新節點的activityId
            if (data && !error) {
              updatePathWithChangeTracking(prev => ({
                ...prev,
                nodes: prev.nodes.map(n => 
                  n.id === node.id ? {
                    ...n,
                    metadata: {
                      ...n.metadata,
                      activityId: data.id
                    }
                  } : n
                )
              }));
            }
          }
        }
        
        // 如果找到了活動數據，添加詳細信息
        if (data && !error) {
          updatePathWithChangeTracking(prev => ({
            ...prev,
            nodes: prev.nodes.map(n => 
              n.id === node.id ? {
                ...n,
                metadata: {
                  ...n.metadata,
                  activityDetails: {
                    duration_minutes: data.duration_minutes || data.estimated_duration,
                    category: data.category,
                    difficulty_level: data.difficulty_level,
                    activity_type: data.activity_type
                  }
                }
              } : n
            )
          }));
        }
      } catch (loadError) {
        if (process.env.NODE_ENV === 'development') {
          console.log('加載活動詳細信息失敗:', loadError);
        }
      }
    }
  }, [path.nodes, updatePathWithChangeTracking]);
  
  // 在頁面加載時自動加載活動詳細信息
  useEffect(() => {
    if (path.nodes.length > 0) {
      loadAllActivityDetails();
    }
  }, [loadAllActivityDetails]);
  
  // 自動計算連線節點的函數
  const calculateConnectedNodes = useCallback((nodes: LearningNode[]) => {
    const startNode = nodes.find(node => node.type === 'start');
    const endNode = nodes.find(node => node.type === 'end');
    if (!startNode || !endNode) return;

    const visited = new Set<string>();
    const completedNodes = new Set<string>();
    const nodeLevels = new Map<string, number>(); // 記錄每個節點的層級
    const nodeOrder = new Map<string, number>(); // 記錄每個節點的順序
    
    // 使用廣度優先搜索計算節點層級和順序
    const calculateLevelsAndOrder = () => {
      const queue: { nodeId: string; level: number; order: number }[] = [{ nodeId: startNode.id, level: 0, order: 0 }];
      nodeLevels.set(startNode.id, 0);
      nodeOrder.set(startNode.id, 0);
      
      while (queue.length > 0) {
        const { nodeId, level, order } = queue.shift()!;
        if (visited.has(nodeId)) continue;
        visited.add(nodeId);
        
        const node = nodes.find(n => n.id === nodeId);
        if (!node) continue;
        
        // 遍歷所有連接的節點
        for (const connectionId of node.connections) {
          const connectedNode = nodes.find(n => n.id === connectionId);
          if (connectedNode && !nodeLevels.has(connectionId)) {
            const newLevel = level + 1;
            const newOrder = order + 1;
            nodeLevels.set(connectionId, newLevel);
            nodeOrder.set(connectionId, newOrder);
            queue.push({ nodeId: connectionId, level: newLevel, order: newOrder });
          }
        }
      }
    };
    
    // 計算所有節點的層級和順序
    calculateLevelsAndOrder();
    
    // 根據層級和連接關係計算完成的節點
    const calculateCompletedNodes = () => {
      // 開始節點總是完成的
      completedNodes.add(startNode.id);
      
      // 按層級順序處理節點
      const maxLevel = Math.max(...Array.from(nodeLevels.values()));
      
      for (let level = 0; level <= maxLevel; level++) {
        const nodesAtLevel = Array.from(nodeLevels.entries())
          .filter(([_, nodeLevel]) => nodeLevel === level)
          .map(([nodeId, _]) => nodeId);
        
        for (const nodeId of nodesAtLevel) {
          const node = nodes.find(n => n.id === nodeId);
          if (!node || node.type === 'end') continue;
          
          // 檢查所有指向此節點的連接
          const incomingConnections = nodes.filter(n => 
            n.connections.includes(nodeId) && completedNodes.has(n.id)
          );
          
          // 如果有來自已完成節點的連接，則此節點也完成
          if (incomingConnections.length > 0) {
            completedNodes.add(nodeId);
          }
        }
      }
    };
    
    calculateCompletedNodes();
    
    // 更新節點的完成狀態和順序
    const updatedNodes = nodes.map(node => {
      const order = nodeOrder.get(node.id);
      const isConnected = completedNodes.has(node.id);
      
      // 為活動節點生成新的標題（包含順序）
      let newTitle = node.title;
      if (node.type === 'activity' && order !== undefined && order > 0) {
        // 如果標題已經是數字格式，則更新數字部分
        const titleMatch = node.title.match(/^(\d{4})-/);
        if (titleMatch) {
          // 保持原有格式，只更新數字部分
          newTitle = `${String(order).padStart(4, '0')}-${node.title.substring(5)}`;
        } else {
          // 如果沒有數字格式，則添加數字前綴
          newTitle = `${String(order).padStart(4, '0')}-${node.title}`;
        }
      } else if (node.type === 'activity' && order === 0) {
        // 如果順序為0，保持原有標題，不添加0000-前綴
        newTitle = node.title;
      }
      
      return {
        ...node,
        title: newTitle,
        isCompleted: isConnected,
        order: order || 0
      };
    });
    
    // 只在開發環境下輸出日誌，並避免重複日誌
    if (process.env.NODE_ENV === 'development') {
      const autoCalcLogKey = `${nodes.length}-${completedNodes.size}-${Array.from(completedNodes).join(',')}`;
      if (autoCalcLogKey !== lastAutoCalcLogRef.current) {
        console.log('自動計算結果:', {
          totalNodes: nodes.length,
          completedNodes: completedNodes.size,
          nodeLevels: Object.fromEntries(nodeLevels),
          nodeOrder: Object.fromEntries(nodeOrder),
          completedNodeIds: Array.from(completedNodes)
        });
        lastAutoCalcLogRef.current = autoCalcLogKey;
      }
    }
    
    return updatedNodes;
  }, []);

  // 獲取學習路徑的順序節點列表
  const getOrderedPathNodes = useCallback(() => {
    const startNode = path.nodes.find(node => node.type === 'start');
    const endNode = path.nodes.find(node => node.type === 'end');
    if (!startNode || !endNode) return [];

    const visited = new Set<string>();
    const nodeOrder = new Map<string, number>();
    
    // 使用廣度優先搜索計算節點順序
    const calculateOrder = () => {
      const queue: { nodeId: string; order: number }[] = [{ nodeId: startNode.id, order: 0 }];
      nodeOrder.set(startNode.id, 0);
      
      while (queue.length > 0) {
        const { nodeId, order } = queue.shift()!;
        if (visited.has(nodeId)) continue;
        visited.add(nodeId);
        
        const node = path.nodes.find(n => n.id === nodeId);
        if (!node) continue;
        
        // 遍歷所有連接的節點
        for (const connectionId of node.connections) {
          const connectedNode = path.nodes.find(n => n.id === connectionId);
          if (connectedNode && !nodeOrder.has(connectionId)) {
            const newOrder = order + 1;
            nodeOrder.set(connectionId, newOrder);
            queue.push({ nodeId: connectionId, order: newOrder });
          }
        }
      }
    };
    
    calculateOrder();
    
    // 按順序返回節點列表
    const orderedNodes = path.nodes
      .filter(node => nodeOrder.has(node.id))
      .sort((a, b) => {
        const orderA = nodeOrder.get(a.id) || 0;
        const orderB = nodeOrder.get(b.id) || 0;
        return orderA - orderB;
      });
    
    return orderedNodes;
  }, [path.nodes]);

  // 自動計算並更新節點狀態
  const updateConnectedNodesStatus = useCallback(() => {
    setPath(prevPath => {
      const updatedNodes = calculateConnectedNodes(prevPath.nodes);
      if (updatedNodes) {
        // 只在開發環境下輸出日誌，並避免重複日誌
        if (process.env.NODE_ENV === 'development') {
          const updateLogKey = `${prevPath.nodes.length}-${updatedNodes.length}`;
          if (updateLogKey !== lastUpdateLogRef.current) {
            console.log('節點狀態已更新');
            lastUpdateLogRef.current = updateLogKey;
          }
        }
        return {
          ...prevPath,
          nodes: updatedNodes
        };
      }
      return prevPath;
    });
  }, [calculateConnectedNodes]);

  // 處理活動節點編輯
  const handleActivityNodeEdit = async (node: LearningNode) => {
    try {
      // 只在開發環境下輸出日誌
      if (process.env.NODE_ENV === 'development') {
        console.log('處理活動節點編輯:', node);
        console.log('Supabase配置檢查:', {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          keyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length
        });
      }
      
      // 測試Supabase連接
      try {
        const { data: testData, error: testError } = await supabase
          .from('hanami_teaching_activities')
          .select('count')
          .limit(1);
        
        if (process.env.NODE_ENV === 'development') {
          console.log('Supabase連接測試:', { testData, testError });
        }
        
        if (testError) {
          console.error('Supabase連接失敗:', testError);
          console.error('連接錯誤詳情:', {
            message: testError.message,
            details: testError.details,
            hint: testError.hint,
            code: testError.code
          });
          toast.error('數據庫連接失敗，請檢查網絡連接');
          return;
        }
      } catch (connectionError: any) {
        console.error('Supabase連接異常:', connectionError);
        console.error('連接異常詳情:', {
          message: connectionError.message,
          name: connectionError.name,
          stack: connectionError.stack
        });
        toast.error('數據庫連接異常');
        return;
      }
      
      let activityId = node.metadata?.activityId;
      let isNumericId = false;
      
      if (!activityId) {
        // 嘗試從標題中提取活動ID
        const titleMatch = node.title.match(/^(\d{4})-/);
        if (titleMatch) {
          // 這裡提取的是數字ID
          activityId = titleMatch[1];
          isNumericId = true;
          // 只在開發環境下輸出日誌
          if (process.env.NODE_ENV === 'development') {
            console.log('從標題提取的數字ID:', activityId);
          }
        }
      }
      
      if (!activityId) {
        // 只在開發環境下輸出日誌
        if (process.env.NODE_ENV === 'development') {
          console.log('無法找到活動ID');
        }
        toast.error('無法找到對應的教學活動');
        return;
      }
      
      // 只在開發環境下輸出日誌
      if (process.env.NODE_ENV === 'development') {
        console.log('活動ID:', activityId, '是否為數字ID:', isNumericId);
      }
      
      // 如果是數字ID，直接進行查詢
      if (isNumericId) {
        // 只在開發環境下輸出日誌
        if (process.env.NODE_ENV === 'development') {
          console.log('使用數字ID查詢教學活動:', activityId);
        }
        
        // 直接查詢，不進行UUID驗證
        // 嘗試多種查詢方式
        let data = null;
        let error = null;
        
        // 方法1: 直接等值查詢
        try {
          const result = await supabase
            .from('hanami_teaching_activities')
            .select('*')
            .eq('id', activityId)
            .single();
          
          data = result.data;
          error = result.error;
          
          if (process.env.NODE_ENV === 'development') {
            console.log('方法1查詢結果:', { data, error });
          }
        } catch (e: any) {
          if (process.env.NODE_ENV === 'development') {
            console.log('方法1查詢異常:', e);
            console.error('方法1異常詳情:', {
              message: e.message,
              name: e.name,
              stack: e.stack
            });
          }
        }
        
        // 方法2: 如果方法1失敗，嘗試模糊查詢
        if (error || !data) {
          if (process.env.NODE_ENV === 'development') {
            console.log('嘗試方法2: 模糊查詢');
          }
          
          try {
            const result = await supabase
              .from('hanami_teaching_activities')
              .select('*')
              .ilike('id', `%${activityId}%`)
              .limit(1)
              .single();
            
            data = result.data;
            error = result.error;
            
            if (process.env.NODE_ENV === 'development') {
              console.log('方法2查詢結果:', { data, error });
            }
          } catch (e: any) {
            if (process.env.NODE_ENV === 'development') {
              console.log('方法2查詢異常:', e);
              console.error('方法2異常詳情:', {
                message: e.message,
                name: e.name,
                stack: e.stack
              });
            }
          }
        }
        
        // 方法3: 如果前兩種方法都失敗，嘗試查詢所有記錄來檢查ID格式
        if (error || !data) {
          if (process.env.NODE_ENV === 'development') {
            console.log('嘗試方法3: 檢查表結構');
          }
          
          try {
            // 先嘗試一個簡單的查詢來檢查表訪問權限
            const result = await supabase
              .from('hanami_teaching_activities')
              .select('id, activity_name')
              .limit(5);
            
            if (process.env.NODE_ENV === 'development') {
              console.log('表結構檢查結果:', result);
              console.log('前5個ID示例:', result.data?.map(item => item.id));
              console.log('前5個活動名稱:', result.data?.map(item => item.activity_name));
            }
            
            // 如果表可以訪問，檢查是否有匹配的ID
            if (result.data && result.data.length > 0) {
              const matchingActivity = result.data.find(item => 
                item.id === activityId || 
                item.id.includes(activityId) ||
                item.activity_name.includes(activityId)
              );
              
              if (matchingActivity) {
                if (process.env.NODE_ENV === 'development') {
                  console.log('找到匹配的活動:', matchingActivity);
                }
                
                // 重新查詢完整的活動數據
                const fullResult = await supabase
                  .from('hanami_teaching_activities')
                  .select('*')
                  .eq('id', matchingActivity.id)
                  .single();
                
                data = fullResult.data;
                error = fullResult.error;
                
                if (process.env.NODE_ENV === 'development') {
                  console.log('完整查詢結果:', { data, error });
                }
              }
            }
            
            // 方法4: 嘗試使用textSearch查詢
            if (error || !data) {
              if (process.env.NODE_ENV === 'development') {
                console.log('嘗試方法4: textSearch查詢');
              }
              
              try {
                const textSearchResult = await supabase
                  .from('hanami_teaching_activities')
                  .select('*')
                  .textSearch('activity_name', activityId)
                  .limit(1)
                  .single();
                
                if (process.env.NODE_ENV === 'development') {
                  console.log('textSearch查詢結果:', textSearchResult);
                }
                
                if (textSearchResult.data && !textSearchResult.error) {
                  data = textSearchResult.data;
                  error = null;
                }
              } catch (textSearchError) {
                if (process.env.NODE_ENV === 'development') {
                  console.log('textSearch查詢異常:', textSearchError);
                }
              }
            }
            
            // 方法5: 嘗試查詢所有記錄然後在客戶端過濾
            if (error || !data) {
              if (process.env.NODE_ENV === 'development') {
                console.log('嘗試方法5: 客戶端過濾查詢');
              }
              
              try {
                const allActivitiesResult = await supabase
                  .from('hanami_teaching_activities')
                  .select('*')
                  .limit(100);
                
                if (process.env.NODE_ENV === 'development') {
                  console.log('所有活動查詢結果:', allActivitiesResult);
                }
                
                if (allActivitiesResult.data && !allActivitiesResult.error) {
                  // 在客戶端查找匹配的活動
                  const clientSideMatch = allActivitiesResult.data.find(item => 
                    item.id === activityId || 
                    item.id.includes(activityId) ||
                    item.activity_name.includes(activityId) ||
                    item.activity_name.toLowerCase().includes(activityId.toLowerCase())
                  );
                  
                  if (clientSideMatch) {
                    if (process.env.NODE_ENV === 'development') {
                      console.log('客戶端找到匹配活動:', clientSideMatch);
                    }
                    data = clientSideMatch;
                    error = null;
                  }
                }
              } catch (clientSideError) {
                if (process.env.NODE_ENV === 'development') {
                  console.log('客戶端過濾查詢異常:', clientSideError);
                }
              }
            }
          } catch (e: any) {
            if (process.env.NODE_ENV === 'development') {
              console.log('方法3查詢異常:', e);
              console.error('方法3異常詳情:', {
                message: e.message,
                name: e.name,
                stack: e.stack
              });
            }
          }
        }
        
        if (error) {
          // 只在開發環境下輸出日誌
          if (process.env.NODE_ENV === 'development') {
            console.error('查詢教學活動失敗:', error);
            console.error('數字ID查詢錯誤詳情:', {
              message: error.message,
              details: error.details,
              hint: error.hint,
              code: error.code,
              activityId: activityId,
              idType: typeof activityId,
              query: `SELECT * FROM hanami_teaching_activities WHERE id = '${activityId}'`
            });
            
            // 直接輸出錯誤對象的每個屬性
            console.error('錯誤對象完整信息:');
            console.error('- message:', error.message);
            console.error('- details:', error.details);
            console.error('- hint:', error.hint);
            console.error('- code:', error.code);
            console.error('- name:', error.name);
            console.error('- stack:', error.stack);
            
            // 嘗試JSON序列化錯誤對象
            try {
              console.error('錯誤對象JSON:', JSON.stringify(error, null, 2));
            } catch (jsonError) {
              console.error('無法序列化錯誤對象:', jsonError);
            }
          }
          toast.error('載入教學活動失敗');
          return;
        }
        
        if (!data) {
          // 只在開發環境下輸出日誌
          if (process.env.NODE_ENV === 'development') {
            console.log('未找到對應的教學活動');
          }
          toast.error('未找到對應的教學活動');
          return;
        }
        
        // 只在開發環境下輸出日誌
        if (process.env.NODE_ENV === 'development') {
          console.log('找到教學活動:', data);
        }
        
        // 將教學活動詳細信息保存到節點metadata中
        const updatedNode = {
          ...node,
          metadata: {
            ...node.metadata,
            activityDetails: {
              duration_minutes: (data.duration_minutes || data.estimated_duration) ?? undefined,
              category: data.category ?? undefined,
              difficulty_level: data.difficulty_level ?? undefined,
              activity_type: data.activity_type ?? ''
            }
          }
        };
        
        // 更新節點
        const updatedNodes = path.nodes.map(n => 
          n.id === node.id ? updatedNode : n
        );
        
        const updatedPath = {
          ...path,
          nodes: updatedNodes
        };
        
        setPath(updatedPath);
        
        // 顯示教學活動詳情
        setSelectedTeachingActivity(data);
        setShowTeachingActivityDetail(true);
        return;
      }
      
      // 對於UUID格式的ID，進行格式驗證
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(activityId)) {
        // 只在開發環境下輸出日誌
        if (process.env.NODE_ENV === 'development') {
          console.log('活動ID格式無效，不是UUID:', activityId);
        }
        toast.error('活動ID格式無效');
        return;
      }
      
      // 檢查是否為臨時生成的UUID（新創建的節點）
      if (activityId.startsWith('activity-') || activityId.includes('temp-')) {
        // 只在開發環境下輸出日誌
        if (process.env.NODE_ENV === 'development') {
          console.log('檢測到臨時活動ID，這是新創建的節點');
        }
        toast('這是新創建的活動節點，尚未關聯到真實的教學活動', {
          icon: '🆕',
          duration: 3000,
          style: {
            background: '#10B981',
            color: '#fff',
          },
        });
        return;
      }
      
      // 只在開發環境下輸出日誌
      if (process.env.NODE_ENV === 'development') {
        console.log('準備查詢Supabase，參數:', {
          table: 'hanami_teaching_activities',
          id: activityId,
          idType: typeof activityId,
          idLength: activityId.length
        });
      }
      
      // 首先測試表是否存在和可訪問
      try {
        const { count, error: countError } = await supabase
          .from('hanami_teaching_activities')
          .select('*', { count: 'exact', head: true });
        
        if (countError) {
          // 只在開發環境下輸出日誌
          if (process.env.NODE_ENV === 'development') {
            console.error('測試表訪問失敗:', countError);
          }
          toast.error('無法訪問教學活動表');
          return;
        }
        
        // 只在開發環境下輸出日誌
        if (process.env.NODE_ENV === 'development') {
          console.log('表訪問測試成功，記錄總數:', count);
        }
      } catch (testError) {
        // 只在開發環境下輸出日誌
        if (process.env.NODE_ENV === 'development') {
          console.error('表訪問測試異常:', testError);
        }
        toast.error('教學活動表訪問測試失敗');
        return;
      }
      
      const { data, error } = await supabase
        .from('hanami_teaching_activities')
        .select('*')
        .eq('id', activityId)
        .single();
      
      if (error) {
        // 只在開發環境下輸出日誌
        if (process.env.NODE_ENV === 'development') {
          console.error('查詢教學活動失敗:', error);
          console.error('錯誤詳情:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
        }
        toast.error('載入教學活動失敗');
        return;
      }
      
      if (!data) {
        // 只在開發環境下輸出日誌
        if (process.env.NODE_ENV === 'development') {
          console.log('未找到對應的教學活動');
        }
        toast.error('未找到對應的教學活動');
        return;
      }
      
      // 只在開發環境下輸出日誌
      if (process.env.NODE_ENV === 'development') {
        console.log('找到教學活動:', data);
      }
      
      // 將教學活動詳細信息保存到節點metadata中
      const updatedNode = {
        ...node,
        metadata: {
          ...node.metadata,
          activityDetails: {
            duration_minutes: (data.duration_minutes || data.estimated_duration) ?? undefined,
            category: data.category ?? undefined,
            difficulty_level: data.difficulty_level ?? undefined,
            activity_type: data.activity_type ?? ''
          }
        }
      };
      
      // 更新節點
      const updatedNodes = path.nodes.map(n => 
        n.id === node.id ? updatedNode : n
      );
      
      const updatedPath = {
        ...path,
        nodes: updatedNodes
      };
      
      setPath(updatedPath);
      
      // 顯示教學活動詳情
      setSelectedTeachingActivity(data);
      setShowTeachingActivityDetail(true);
    } catch (error) {
      // 只在開發環境下輸出日誌
      if (process.env.NODE_ENV === 'development') {
        console.error('處理活動節點編輯時發生錯誤:', error);
      }
      toast.error('載入教學活動時發生錯誤');
    }
  };

  // 調試：監控組件渲染
  useEffect(() => {
    // 只在開發環境下輸出日誌，並避免重複日誌
    if (process.env.NODE_ENV === 'development') {
      const renderLogKey = `${viewMode}-${showHelp}`;
      if (renderLogKey !== lastRenderLogRef.current) {
        console.log('LearningPathBuilder 渲染中, viewMode:', viewMode, 'showHelp:', showHelp);
        lastRenderLogRef.current = renderLogKey;
      }
    }
  }, [viewMode, showHelp]);

  // 清理定時器
  useEffect(() => {
    return () => {
      if (changeCheckTimerRef.current) {
        clearTimeout(changeCheckTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // 節點標題更新後，自動重新加載活動詳細信息
    setTimeout(() => {
      loadAllActivityDetails();
    }, 300);
  }, [calculateConnectedNodes, updatePathWithChangeTracking]);

  // 在節點狀態更新後，自動重新加載活動詳細信息
  useEffect(() => {
    if (path.nodes.length > 0) {
      // 延遲加載，確保節點標題已經更新
      const timer = setTimeout(() => {
        loadAllActivityDetails();
      }, 500);
      
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [path.nodes, loadAllActivityDetails]);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-[#F9F2EF] via-[#D2E0AA] to-[#ABD7FB] overflow-hidden">
      {/* 遊戲風格頂部橫幅 */}
      <div className="bg-gradient-to-r from-[#F98C53] to-[#FCCEB4] text-white p-6 shadow-lg relative overflow-hidden">
        {/* 背景裝飾 */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-4 left-4 w-8 h-8 bg-white/20 rounded-full"></div>
          <div className="absolute top-8 right-8 w-6 h-6 bg-white/20 rounded-full"></div>
          <div className="absolute bottom-6 left-12 w-4 h-4 bg-white/20 rounded-full"></div>
        </div>
        
        <div className="flex items-center justify-between relative z-10">
          <div className="text-center">
            <div className="text-2xl font-bold mb-1">學習進度</div>
            <div className="text-sm opacity-90">{path.nodes.filter(n => n.isCompleted).length}/{path.nodes.length}</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold mb-1">總時長</div>
            <div className="text-sm opacity-90">{path.totalDuration}分鐘</div>
          </div>
          
          <div className="text-center">
            <div className="text-4xl font-bold mb-2 flex items-center justify-center gap-2">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.369 4.369 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
              </svg>
              音樂學習關卡
            </div>
            <div className="text-sm opacity-90">點擊編輯學習路徑</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl mb-2">
              <svg className="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12zm0-2a4 4 0 100-8 4 4 0 000 8zm0-2a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
            </div>
            <div className="text-[#F9F2EF] text-sm">難度等級</div>
            <div className="text-xl font-bold">{path.difficulty || 1}</div>
          </div>
        </div>
      </div>

      {/* 工具欄 */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-[#FCCEB4] p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                if (viewMode === 'edit' && hasUnsavedChanges) {
                  if (confirm('您有未儲存的變更，確定要離開編輯模式嗎？')) {
                    setViewMode('play');
                  }
                } else {
                  setViewMode(viewMode === 'edit' ? 'play' : 'edit');
                }
              }}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-300 transform hover:scale-105 flex items-center gap-2 ${
                viewMode === 'edit' 
                  ? 'bg-gradient-to-r from-[#F98C53] to-[#FCCEB4] text-white shadow-lg' 
                  : 'bg-gradient-to-r from-[#D2E0AA] to-[#ABD7FB] text-white shadow-lg'
              }`}
            >
              {viewMode === 'edit' ? (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                  </svg>
                  編輯模式
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  播放模式
                </>
              )}
            </button>
            
            {viewMode === 'edit' && (
              <>
                <button
                  onClick={() => addNode('activity')}
                  className="px-4 py-2 bg-gradient-to-r from-[#ABD7FB] to-[#D2E0AA] text-white rounded-full font-medium transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  新增學習活動
                </button>
                
                <button
                  onClick={() => alert('里程碑功能正在開發中，敬請期待！')}
                  className="px-4 py-2 bg-gradient-to-r from-[#FCCEB4] to-[#F98C53] text-white rounded-full font-medium transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2 opacity-60 cursor-not-allowed"
                  disabled
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  新增里程碑
                </button>
                <button
                  onClick={updateConnectedNodesStatus}
                  className="px-4 py-2 bg-gradient-to-r from-blue-100 to-green-200 text-gray-800 rounded-full font-medium transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2"
                  title="自動計算由左至右已連線的節點"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  自動計算
                </button>
              </>
            )}
          </div>
          
                      <div className="flex items-center space-x-4">
              {/* 路徑列表按鈕 */}
              <button
                onClick={() => setShowPathList(true)}
                className="px-4 py-2 bg-gradient-to-r from-[#ABD7FB] to-[#D2E0AA] text-white rounded-full font-medium transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                路徑列表
              </button>
              
              <div className="text-sm text-gray-600">
                縮放: {Math.round(zoomLevel * 100)}%
              </div>
            
            {/* 儲存按鈕 */}
            {viewMode === 'edit' && (
              <button
                onClick={handleSave}
                disabled={!hasUnsavedChanges}
                className={`px-4 py-2 rounded-full font-medium transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2 ${
                  hasUnsavedChanges
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                title={hasUnsavedChanges ? (onSave ? '儲存變更' : '更新狀態') : '無變更需要儲存'}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h-1v5.586l-2.293-2.293z" />
                </svg>
                {onSave ? '儲存' : '更新'}
                {hasUnsavedChanges && (
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                )}
              </button>
            )}
            
            {/* 重置按鈕 */}
            {viewMode === 'edit' && savedPath && (
              <button
                onClick={resetToSavedState}
                disabled={!hasUnsavedChanges}
                className={`px-4 py-2 rounded-full font-medium transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2 ${
                  hasUnsavedChanges
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                title={hasUnsavedChanges ? '重置到儲存狀態' : '無變更需要重置'}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                重置
              </button>
            )}
            
            {/* 強制恢復按鈕 - 已移除 */}
            
            {/* 測試按鈕 - 已移除 */}
            
            {/* 播放路徑按鈕 - 已移除 */}
          </div>
        </div>
      </div>

      {/* 側邊欄 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 右側邊欄 */}
        <div className="w-80 bg-white/95 backdrop-blur-sm border-l border-[#FCCEB4] flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {/* 路線資訊 */}
            <div className="bg-white/80 rounded-lg p-2 border border-[#FCCEB4]/50">
              <h3 className="font-semibold text-gray-800 mb-1.5 flex items-center gap-2">
                <svg className="w-4 h-4 text-[#ABD7FB]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                路線資訊
                {hasUnsavedChanges && (
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                )}
              </h3>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">總節點數</span>
                  <span className="font-semibold text-gray-800">{path.nodes.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">已完成</span>
                  <span className="font-semibold text-green-600">{path.nodes.filter(n => n.isCompleted).length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">進行中</span>
                  <span className="font-semibold text-blue-600">{path.nodes.filter(n => !n.isCompleted && !n.isLocked).length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">已鎖定</span>
                  <span className="font-semibold text-gray-600">{path.nodes.filter(n => n.isLocked).length}</span>
                </div>
                {hasUnsavedChanges && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-yellow-800">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      有未儲存的變更
                    </div>
                  </div>
                )}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-[#D2E0AA] to-[#ABD7FB] h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${path.nodes.length > 0 ? (path.nodes.filter(n => n.isCompleted).length / path.nodes.length) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* 現有學習活動 */}
            {viewMode === 'edit' && (
              <div className="bg-white/80 rounded-lg p-2 border border-[#FCCEB4]/50">
                <h3 className="font-semibold text-gray-800 mb-1.5 flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#ABD7FB]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  成長樹活動 ({treeActivities.length})
                </h3>

                {/* 成長樹活動列表 */}
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {loadingTreeActivities ? (
                    <div className="text-center py-4 text-sm text-gray-500">
                      載入成長樹活動中...
                    </div>
                  ) : treeActivities.length === 0 ? (
                    <div className="text-center py-4 text-sm text-gray-500">
                      該成長樹暫無活動
                    </div>
                  ) : (
                    treeActivities.map((activity) => {
                      const activityName = activity.activity_source === 'teaching' && activity.hanami_teaching_activities
                        ? activity.hanami_teaching_activities.activity_name
                        : activity.custom_activity_name || '未命名活動';

                      const activityType = activity.activity_source === 'teaching' && activity.hanami_teaching_activities
                        ? activity.hanami_teaching_activities.activity_type
                        : activity.activity_type;

                      return (
                        <div
                          key={activity.id}
                          className="p-1.5 rounded-lg border border-gray-200 hover:border-[#F98C53]/50 hover:bg-[#F9F2EF]/30 transition-all duration-200 cursor-pointer"
                          onClick={() => addTreeActivityToPath(activity)}
                        >
                          <div className="flex items-center gap-1.5">
                            {/* 活動類型圖標 */}
                            <div className="p-1 rounded-lg bg-gradient-to-br from-[#ABD7FB] to-[#D2E0AA]">
                              {activityType === 'teaching' ? (
                                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 2a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                                </svg>
                              ) : activityType === 'assessment' ? (
                                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm-3-3a1 1 0 100 2h.01a1 1 0 100-2H7z" clipRule="evenodd" />
                                </svg>
                              ) : activityType === 'practice' ? (
                                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              )}
                            </div>
                            
                            {/* 活動信息 */}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-800 truncate text-sm">{activityName}</div>
                              <div className="text-xs text-gray-500 truncate">
                                {activity.activity_source === 'teaching' ? '教學活動' : '自訂活動'}
                                {activity.estimated_duration && ` • ${activity.estimated_duration}分鐘`}
                                {activity.difficulty_level && ` • 難度 ${activity.difficulty_level}`}
                              </div>
                            </div>
                            
                            {/* 活動來源指示器 */}
                            <div className="flex items-center gap-1">
                              {activity.is_required && (
                                <div className="w-2 h-2 bg-red-500 rounded-full" title="必選活動"></div>
                              )}
                              <div className="w-2 h-2 bg-blue-500 rounded-full" title="點擊添加到路徑"></div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                
                {/* 添加新節點按鈕 */}
                <div className="mt-1.5 pt-1.5 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-1.5">添加新節點</h4>
                  <div className="grid grid-cols-2 gap-1">
                    {Object.entries(NODE_TYPES).map(([type, config]) => (
                      <button
                        key={type}
                        onClick={() => {
                          if (type === 'activity') {
                            addNode(type as LearningNode['type']);
                          } else {
                            // 顯示功能正在開發的提示
                            alert('此功能正在開發中，敬請期待！');
                          }
                        }}
                        className={`flex items-center gap-1 p-1 rounded-lg border transition-all duration-200 group text-xs ${
                          type === 'activity' 
                            ? 'border-gray-200 hover:border-[#F98C53] hover:bg-[#F9F2EF]/50' 
                            : 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-60'
                        }`}
                        disabled={type !== 'activity'}
                      >
                        <div className={`p-0.5 rounded transition-all duration-200 ${
                          type === 'activity'
                            ? 'bg-gradient-to-br from-[#ABD7FB] to-[#D2E0AA] group-hover:from-[#F98C53] group-hover:to-[#FCCEB4]'
                            : 'bg-gray-400'
                        }`}>
                          <config.icon className="w-2 h-2 text-white" />
                        </div>
                        <span className={`font-medium transition-colors ${
                          type === 'activity'
                            ? 'text-gray-700 group-hover:text-[#F98C53]'
                            : 'text-gray-500'
                        }`}>
                          {config.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 連接說明 */}
            {viewMode === 'edit' && (
              <div className="bg-white/80 rounded-lg p-2 border border-[#FCCEB4]/50">
                <h3 className="font-semibold text-gray-800 mb-1.5 flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#ABD7FB]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  連接說明
                </h3>
                <div className="text-sm text-gray-600 space-y-0.5">
                  <p>• 進入編輯模式後才能編輯和移動節點</p>
                  <p>• 按住 Ctrl 鍵點擊節點開始連接</p>
                  <p>• 或點擊節點右上角圓圈開始連接</p>
                  <p>• 再點擊目標節點完成連接</p>
                  <p>• 雙擊節點編輯內容</p>
                  <p>• 選中節點後可刪除（開始/結束節點除外）</p>
                  <p>• 編輯完成後點擊「儲存」按鈕保存變更</p>
                  <p>• 有變更時可點擊「重置」按鈕回到儲存狀態</p>
                </div>
              </div>
            )}

            {/* 連接操作面板 */}
            {selectedConnection && (
              <div className="bg-gradient-to-br from-[#ABD7FB] to-[#D2E0AA] rounded-lg p-2 border border-[#FCCEB4]/50">
                <h3 className="font-semibold text-gray-800 mb-1.5 flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#F98C53]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  連接操作
                </h3>
                <div className="space-y-1.5">
                  <p className="text-sm text-gray-700">
                    從 <span className="font-semibold">{selectedConnection.from}</span> 到 <span className="font-semibold">{selectedConnection.to}</span>
                  </p>
                  <button
                    onClick={viewMode === 'edit' ? () => deleteConnection(selectedConnection.from, selectedConnection.to) : undefined}
                    disabled={viewMode !== 'edit'}
                    className={`w-full py-1 px-2 rounded-lg transition-colors duration-200 flex items-center justify-center gap-1.5 text-sm ${
                      viewMode === 'edit' 
                        ? 'bg-red-500 hover:bg-red-600 text-white' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    
                  </button>
                </div>
              </div>
            )}

            {/* 節點編輯面板 */}
            {selectedNode && viewMode === 'edit' && (
              <div className="bg-gradient-to-br from-[#D2E0AA] to-[#ABD7FB] rounded-lg p-2 border border-[#FCCEB4]/50">
                <h3 className="font-semibold text-gray-800 mb-1.5 flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#F98C53]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  {selectedNode.type === 'start' || selectedNode.type === 'end' ? '節點資訊（只讀）' : '節點編輯'}
                </h3>
                <div className="space-y-1.5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-0.5">標題</label>
                    {selectedNode.type === 'start' || selectedNode.type === 'end' ? (
                      <div className="w-full px-1.5 py-1 bg-gray-100 rounded-lg text-sm">
                        {selectedNode.title}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={selectedNode.title}
                        onChange={(e) => updateNode(selectedNode.id, { title: e.target.value })}
                        className="w-full px-1.5 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F98C53] focus:border-transparent text-sm"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-0.5">時長</label>
                    {selectedNode.type === 'start' || selectedNode.type === 'end' ? (
                      <div className="w-full px-1.5 py-1 bg-gray-100 rounded-lg text-sm">
                        {selectedNode.duration} {selectedNode.durationUnit || '分鐘'}
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <input
                          type="number"
                          value={selectedNode.duration}
                          onChange={(e) => updateNode(selectedNode.id, { duration: parseInt(e.target.value) || 0 })}
                          className="flex-1 px-1.5 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F98C53] focus:border-transparent text-sm"
                          min="0"
                        />
                        <select
                          value={selectedNode.durationUnit || '分鐘'}
                          onChange={(e) => updateNode(selectedNode.id, { durationUnit: e.target.value })}
                          className="px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F98C53] focus:border-transparent text-sm bg-white"
                        >
                          <option value="分鐘">分鐘</option>
                          <option value="小時">小時</option>
                          <option value="天">天</option>
                          <option value="週">週</option>
                          <option value="次">次</option>
                        </select>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-0.5">獎勵</label>
                    {selectedNode.type === 'start' || selectedNode.type === 'end' ? (
                      <div className="w-full px-1.5 py-1 bg-gray-100 rounded-lg text-sm">
                        {selectedNode.reward || '無'}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={selectedNode.reward || ''}
                        onChange={(e) => updateNode(selectedNode.id, { reward: e.target.value })}
                        className="w-full px-1.5 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F98C53] focus:border-transparent text-sm"
                        placeholder="完成獎勵"
                      />
                    )}
                  </div>
                  {/* 只有活動節點才顯示狀態控制按鈕 */}
                  {selectedNode.type !== 'start' && selectedNode.type !== 'end' && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => updateNode(selectedNode.id, { isCompleted: !selectedNode.isCompleted })}
                        className={`flex-1 py-1 px-1.5 rounded-lg transition-colors duration-200 text-sm ${
                          selectedNode.isCompleted
                            ? 'bg-gray-500 hover:bg-gray-600 text-white'
                            : 'bg-green-500 hover:bg-green-600 text-white'
                        }`}
                      >
                        {selectedNode.isCompleted ? '取消完成' : '標記完成'}
                      </button>
                      <button
                        onClick={() => updateNode(selectedNode.id, { isLocked: !selectedNode.isLocked })}
                        className={`flex-1 py-1 px-1.5 rounded-lg transition-colors duration-200 text-sm ${
                          selectedNode.isLocked
                            ? 'bg-blue-500 hover:bg-blue-600 text-white'
                            : 'bg-gray-500 hover:bg-gray-600 text-white'
                        }`}
                      >
                        {selectedNode.isLocked ? '解鎖' : '鎖定'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 節點查看面板（非編輯模式） */}
            {selectedNode && viewMode !== 'edit' && (
              <div className="bg-gradient-to-br from-[#D2E0AA] to-[#ABD7FB] rounded-lg p-2 border border-[#FCCEB4]/50">
                <h3 className="font-semibold text-gray-800 mb-1.5 flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#F98C53]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                  </svg>
                  節點資訊
                </h3>
                <div className="space-y-1.5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-0.5">標題</label>
                    <div className="w-full px-1.5 py-1 bg-gray-100 rounded-lg text-sm">
                      {selectedNode.title}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-0.5">時長</label>
                    <div className="w-full px-1.5 py-1 bg-gray-100 rounded-lg text-sm">
                      {selectedNode.duration} {selectedNode.durationUnit || '分鐘'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-0.5">獎勵</label>
                    <div className="w-full px-1.5 py-1 bg-gray-100 rounded-lg text-sm">
                      {selectedNode.reward || '無'}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <span className={`flex-1 py-1 px-1.5 rounded-lg text-sm text-center ${
                      selectedNode.isCompleted
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedNode.isCompleted ? '已完成' : '未完成'}
                    </span>
                    <span className={`flex-1 py-1 px-1.5 rounded-lg text-sm text-center ${
                      selectedNode.isLocked
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {selectedNode.isLocked ? '已鎖定' : '可進行'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 主畫布 */}
        <div className="flex-1 relative overflow-hidden select-none">
          <div
            ref={canvasRef}
            className={`bg-gradient-to-br from-[#F9F2EF] via-[#D2E0AA] to-[#ABD7FB] relative ${
              isCanvasDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            style={{
              width: '2000px',
              height: '1200px'
            }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onClick={handleCanvasClick}
          >
            {/* 遊戲風格網格背景 */}
            <div className="absolute inset-0 opacity-30 canvas-background pointer-events-none">
              <div className="w-full h-full" style={{
                backgroundImage: `
                  linear-gradient(rgba(249, 140, 83, 0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(249, 140, 83, 0.1) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px'
              }} />
            </div>
            
            {/* 裝飾性背景元素 */}
            <div className="absolute inset-0 pointer-events-none">
              {/* 浮動音符 */}
              <div className="absolute top-20 left-20 text-4xl opacity-10 animate-bounce" style={{ animationDelay: '0s' }}>
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.369 4.369 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                </svg>
              </div>
              <div className="absolute top-40 right-40 text-3xl opacity-10 animate-bounce" style={{ animationDelay: '1s' }}>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.369 4.369 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                </svg>
              </div>
              <div className="absolute bottom-60 left-60 text-2xl opacity-10 animate-bounce" style={{ animationDelay: '2s' }}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.369 4.369 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                </svg>
              </div>
              <div className="absolute bottom-40 right-20 text-5xl opacity-10 animate-bounce" style={{ animationDelay: '0.5s' }}>
                <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.369 4.369 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                </svg>
              </div>
              
              {/* 浮動星星 */}
              <div className="absolute top-60 left-80 text-2xl opacity-20 animate-pulse" style={{ animationDelay: '0.3s' }}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div className="absolute top-80 right-80 text-xl opacity-20 animate-pulse" style={{ animationDelay: '1.3s' }}>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div className="absolute bottom-80 left-40 text-3xl opacity-20 animate-pulse" style={{ animationDelay: '0.8s' }}>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            </div>

            {/* 內容容器 - 使用transform移動和縮放 */}
            <div 
              className="absolute inset-0"
              style={{
                transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoomLevel})`,
                transformOrigin: '0 0'
              }}
            >
              {/* SVG 連接線 - 在節點下方 */}
              <svg
                ref={svgRef}
                className="absolute inset-0 w-full h-full"
                style={{ zIndex: 0, pointerEvents: 'auto' }}
              >
                {renderConnections()}
              </svg>

              {/* 節點 - 在連接線上方 */}
              <div style={{ position: 'relative', zIndex: 10 }}>
                <AnimatePresence>
                  {path.nodes.map(node => renderNode(node))}
                </AnimatePresence>
              </div>
            </div>

            {/* 簡潔操作按鈕 */}
            {viewMode === 'edit' && (
              <div className="absolute top-4 left-4 flex gap-3 z-50 pointer-events-auto" style={{ position: 'absolute', zIndex: 50 }}>
                {/* 適應視窗按鈕 */}
                <motion.button
                  className="w-12 h-12 bg-gradient-to-br from-[#F98C53] to-[#FCCEB4] backdrop-blur-sm rounded-xl shadow-lg border-2 border-white/20 hover:border-white/40 transition-all duration-300 flex items-center justify-center cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('適應視窗按鈕被點擊');
                    
                    // 使用測試按鈕成功的設定
                    setCanvasOffset({ x: -500, y: -300 });
                    setZoomLevel(1.5);
                    
                    console.log('適應視窗完成');
                  }}
                  title="適應視窗大小"
                  type="button"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="w-6 h-6 relative">
                    <div className="absolute inset-0 border-2 border-white rounded-sm"></div>
                    <div className="absolute top-1 left-1 w-1 h-1 bg-white rounded-sm"></div>
                    <div className="absolute top-1 right-1 w-1 h-1 bg-white rounded-sm"></div>
                    <div className="absolute bottom-1 left-1 w-1 h-1 bg-white rounded-sm"></div>
                    <div className="absolute bottom-1 right-1 w-1 h-1 bg-white rounded-sm"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-sm"></div>
                  </div>
                </motion.button>
                
                {/* 放大按鈕 */}
                <motion.button
                  className="w-12 h-12 bg-gradient-to-br from-[#ABD7FB] to-[#D2E0AA] backdrop-blur-sm rounded-xl shadow-lg border-2 border-white/20 hover:border-white/40 transition-all duration-300 flex items-center justify-center cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('放大按鈕被點擊');
                    
                    // 真正的縮放功能
                    const newZoom = Math.min(zoomLevel * 1.2, 3);
                    console.log('放大縮放:', { oldZoom: zoomLevel, newZoom });
                    setZoomLevel(newZoom);
                  }}
                  title="放大"
                  type="button"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="w-6 h-6 relative">
                    <div className="absolute inset-0 border-2 border-white rounded-full"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2.5 h-0.5 bg-white"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-0.5 h-2.5 bg-white"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full"></div>
                  </div>
                </motion.button>
                
                {/* 縮小按鈕 */}
                <motion.button
                  className="w-12 h-12 bg-gradient-to-br from-[#D2E0AA] to-[#ABD7FB] backdrop-blur-sm rounded-xl shadow-lg border-2 border-white/20 hover:border-white/40 transition-all duration-300 flex items-center justify-center cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('縮小按鈕被點擊');
                    
                    // 真正的縮放功能
                    const newZoom = Math.max(zoomLevel * 0.8, 0.3);
                    console.log('縮小縮放:', { oldZoom: zoomLevel, newZoom });
                    setZoomLevel(newZoom);
                  }}
                  title="縮小"
                  type="button"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="w-6 h-6 relative">
                    <div className="absolute inset-0 border-2 border-white rounded-full"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2.5 h-0.5 bg-white"></div>
                  </div>
                </motion.button>
                
                {/* 重置視圖按鈕 */}
                <motion.button
                  className="w-12 h-12 bg-gradient-to-br from-[#FCCEB4] to-[#F98C53] backdrop-blur-sm rounded-xl shadow-lg border-2 border-white/20 hover:border-white/40 transition-all duration-300 flex items-center justify-center cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('重置視圖按鈕被點擊');
                    setCanvasOffset({ x: 0, y: 0 });
                    setZoomLevel(1);
                    centerNodesOnCanvas();
                  }}
                  title="重置視圖"
                  type="button"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="w-6 h-6 relative">
                    <div className="absolute inset-0 border-2 border-white rounded-full"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3.5 h-0.5 bg-white rotate-45"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3.5 h-0.5 bg-white -rotate-45"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full"></div>
                  </div>
                </motion.button>
              </div>
            )}
            
            {/* 詳細用法說明 */}
            {viewMode === 'edit' && showHelp && (
              <div className="absolute top-4 left-4 mt-16 bg-white/95 backdrop-blur-sm rounded-lg px-4 py-3 text-sm text-gray-700 z-10 shadow-lg border max-w-md">
                <div className="font-semibold mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  詳細操作說明
                </div>
                <div className="space-y-2 text-xs">
                  <div><strong>畫布操作：</strong></div>
                  <div>• 拖拽空白區域 → 移動畫布視角</div>
                  <div>• Ctrl+滾輪 → 縮放畫布</div>
                  <div>• 適應視窗按鈕 → 將節點居中顯示</div>
                  <div>• 放大/縮小按鈕 → 調整畫布縮放</div>
                  <div>• 重置視圖按鈕 → 回到初始狀態</div>
                  
                  <div className="mt-2"><strong>節點操作：</strong></div>
                  <div>• 拖拽節點 → 調整節點位置</div>
                  <div>• 點擊節點 → 選中節點</div>
                  <div>• 雙擊節點 → 編輯節點內容</div>
                  <div>• 選中節點後 → 顯示編輯和刪除按鈕</div>
                  
                  <div className="mt-2"><strong>連接操作：</strong></div>
                  <div>• 藍色連接點 → 開始連接</div>
                  <div>• 綠色連接點 → 完成連接</div>
                  <div>• 點擊連接線 → 選中連接</div>
                  <div>• Delete 鍵 → 刪除選中連接</div>
                  <div>• Escape 鍵 → 取消選中</div>
                  
                  <div className="mt-2"><strong>快捷鍵：</strong></div>
                  <div>• Ctrl+滾輪 → 縮放畫布</div>
                  <div>• Delete → 刪除選中連接</div>
                  <div>• Escape → 取消選中</div>
                </div>
                <button 
                  className="text-xs bg-blue-500 text-white px-3 py-1 rounded mt-3 hover:bg-blue-600"
                  onClick={() => setShowHelp(false)}
                >
                  關閉說明
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 節點編輯器模態框 */}
      {showNodeEditor && editingNode && (
        <NodeEditor
          node={editingNode}
          onSave={(updatedNode) => {
            updateNode(editingNode.id, updatedNode);
            setShowNodeEditor(false);
            setEditingNode(null);
          }}
          onCancel={() => {
            setShowNodeEditor(false);
            setEditingNode(null);
          }}
        />
      )}

      {/* 教學活動詳情模態框 */}
      {showTeachingActivityDetail && selectedTeachingActivity && (
        <TeachingActivityDetailModal
          activity={selectedTeachingActivity}
          onClose={() => {
            setShowTeachingActivityDetail(false);
            setSelectedTeachingActivity(null);
          }}
          onEdit={() => {
            setShowTeachingActivityDetail(false);
            setSelectedTeachingActivity(null);
            toast('編輯功能開發中...', {
              icon: '🛠️',
              duration: 2000,
              style: {
                background: '#F59E0B',
                color: '#fff',
              },
            });
          }}
          onDelete={() => {
            setShowTeachingActivityDetail(false);
            setSelectedTeachingActivity(null);
            toast('刪除功能開發中...', {
              icon: '🗑️',
              duration: 2000,
              style: {
                background: '#EF4444',
                color: '#fff',
              },
            });
          }}
        />
      )}

      {/* 活動選擇界面 */}
      {showActivitySelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-hanami-text">選擇學習活動</h3>
              <button
                onClick={() => setShowActivitySelector(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">
                從成長樹中選擇要添加到學習路徑的活動：
              </p>
              
              {/* 活動列表 */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {loadingTreeActivities ? (
                  <div className="text-center py-8 text-gray-500">
                    載入成長樹活動中...
                  </div>
                ) : treeActivities.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    該成長樹暫無活動
                  </div>
                ) : (
                  treeActivities.map((activity) => {
                    const activityName = activity.activity_source === 'teaching' && activity.hanami_teaching_activities
                      ? activity.hanami_teaching_activities.activity_name
                      : activity.custom_activity_name || '未命名活動';

                    const activityType = activity.activity_source === 'teaching' && activity.hanami_teaching_activities
                      ? activity.hanami_teaching_activities.activity_type
                      : activity.activity_type;

                    return (
                      <div
                        key={activity.id}
                        className="p-3 rounded-lg border border-gray-200 hover:border-[#F98C53]/50 hover:bg-[#F9F2EF]/30 transition-all duration-200 cursor-pointer"
                        onClick={() => {
                          addTreeActivityToPath(activity);
                          setShowActivitySelector(false);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          {/* 活動類型圖標 */}
                          <div className="p-2 rounded-lg bg-gradient-to-br from-[#ABD7FB] to-[#D2E0AA]">
                            {activityType === 'teaching' ? (
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                <path fillRule="evenodd" d="M4 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 2a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                              </svg>
                            ) : activityType === 'assessment' ? (
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm-3-3a1 1 0 100 2h.01a1 1 0 100-2H7z" clipRule="evenodd" />
                              </svg>
                            ) : activityType === 'practice' ? (
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            )}
                          </div>
                          
                          {/* 活動信息 */}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-800 text-base">{activityName}</div>
                            <div className="text-sm text-gray-500 mt-1">
                              {activity.activity_source === 'teaching' ? '教學活動' : '自訂活動'}
                              {activity.estimated_duration && ` • ${activity.estimated_duration}分鐘`}
                              {activity.difficulty_level && ` • 難度 ${activity.difficulty_level}`}
                            </div>
                          </div>
                          
                          {/* 活動來源指示器 */}
                          <div className="flex items-center gap-2">
                            {activity.is_required && (
                              <div className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full" title="必選活動">
                                必選
                              </div>
                            )}
                            <div className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                              添加到路徑
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* 路徑列表界面 */}
      {showPathList && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-4 w-full max-w-md max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-hanami-text">學習路徑列表</h3>
              <button
                onClick={() => setShowPathList(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-3">
              <p className="text-xs text-gray-600 mb-4">
                從開始到結束的完整學習流程：
              </p>
              
              {/* 路徑節點列表 */}
              <div className="space-y-3">
                {getOrderedPathNodes().length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                    <div className="text-lg font-medium">暫無學習路徑</div>
                    <div className="text-sm">請先添加學習活動來建立路徑</div>
                  </div>
                ) : (
                  getOrderedPathNodes().map((node, index) => {
                    const isCompleted = node.isCompleted;
                    const isLocked = node.isLocked;
                    
                    // 根據節點類型獲取顏色
                    const getNodeColors = () => {
                      if (isCompleted) {
                        return {
                          bg: 'bg-gradient-to-r from-green-200 to-blue-300',
                          text: 'text-gray-800',
                          border: 'border-green-300',
                          shadow: 'shadow-green-300/30'
                        };
                      }
                      
                      if (isLocked) {
                        return {
                          bg: 'bg-gradient-to-r from-gray-300 to-gray-400',
                          text: 'text-gray-600',
                          border: 'border-gray-400',
                          shadow: 'shadow-gray-400/20'
                        };
                      }
                      
                      switch (node.type) {
                        case 'start':
                        case 'end':
                          return {
                            bg: 'bg-gradient-to-r from-[#F98C53] to-[#FCCEB4]',
                            text: 'text-white',
                            border: 'border-[#FCCEB4]',
                            shadow: 'shadow-[#F98C53]/20'
                          };
                        case 'activity':
                          return {
                            bg: 'bg-gradient-to-r from-[#ABD7FB] to-[#D2E0AA]',
                            text: 'text-gray-800',
                            border: 'border-[#ABD7FB]',
                            shadow: 'shadow-[#ABD7FB]/20'
                          };
                        case 'milestone':
                          return {
                            bg: 'bg-gradient-to-r from-[#FCCEB4] to-[#F98C53]',
                            text: 'text-white',
                            border: 'border-[#FCCEB4]',
                            shadow: 'shadow-[#F98C53]/20'
                          };
                        default:
                          return {
                            bg: 'bg-gradient-to-r from-[#F9F2EF] to-[#ABD7FB]',
                            text: 'text-gray-700',
                            border: 'border-[#ABD7FB]',
                            shadow: 'shadow-[#ABD7FB]/20'
                          };
                      }
                    };
                    
                    const colors = getNodeColors();
                    const nodeType = NODE_TYPES[node.type];
                    
                    return (
                      <motion.div
                        key={node.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`relative ${colors.bg} ${colors.border} border-2 rounded-xl p-4 shadow-lg ${colors.shadow} transition-all duration-300 hover:scale-105`}
                      >
                        {/* 步驟編號 */}
                        {(node.type === 'activity' || node.type === 'milestone') && (
                          <div className="absolute -top-2 -left-2 w-8 h-8 bg-white rounded-full border-2 border-gray-300 flex items-center justify-center shadow-md">
                            <span className="text-xs font-bold text-gray-700">
                              {getOrderedPathNodes().filter(n => n.type === 'activity' || n.type === 'milestone').findIndex(n => n.id === node.id) + 1}
                            </span>
                          </div>
                        )}
                        
                        {/* 連接箭頭 */}
                        {index < getOrderedPathNodes().length - 1 && (
                          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 z-10">
                            <div className="w-0.5 h-6 bg-gray-400"></div>
                            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-400"></div>
                          </div>
                        )}
                        
                        <div className="flex items-start gap-3">
                          {/* 節點圖標 */}
                          <div className="flex-shrink-0">
                            <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center shadow-md`}>
                              <nodeType.icon className="w-5 h-5 text-white" />
                            </div>
                          </div>
                          
                          {/* 節點內容 */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className={`text-base font-bold ${colors.text}`}>{node.title}</h3>
                              {isCompleted && (
                                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                              {isLocked && (
                                <div className="w-5 h-5 bg-gray-500 rounded-full flex items-center justify-center">
                                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            
                            {node.description && (
                              <p className={`text-xs ${colors.text} opacity-80 mb-3`}>{node.description}</p>
                            )}
                            
                            {/* 節點詳細信息 */}
                            <div className="flex items-center gap-4 mb-3">
                              {node.duration && (
                                <div className="flex items-center gap-1">
                                  <span className={`text-xs ${colors.text} opacity-70`}>時長:</span>
                                  <span className={`text-xs font-semibold ${colors.text}`}>{node.duration}分鐘</span>
                                </div>
                              )}
                              
                              {node.difficulty && (
                                <div className="flex items-center gap-1">
                                  <span className={`text-xs ${colors.text} opacity-70`}>難度:</span>
                                  <span className={`text-xs font-semibold ${colors.text}`}>{node.difficulty}</span>
                                </div>
                              )}
                              
                              {node.metadata?.activityDetails?.duration_minutes && node.metadata.activityDetails.duration_minutes > 0 && (
                                <div className="flex items-center gap-1">
                                  <span className={`text-xs ${colors.text} opacity-70`}>活動時長:</span>
                                  <span className={`text-xs font-semibold ${colors.text}`}>{node.metadata.activityDetails.duration_minutes}分鐘</span>
                                </div>
                              )}
                              
                              {node.metadata?.activityDetails?.difficulty_level && (
                                <div className="flex items-center gap-1">
                                  <span className={`text-xs ${colors.text} opacity-70`}>活動難度:</span>
                                  <span className={`text-xs font-semibold ${colors.text}`}>{node.metadata.activityDetails.difficulty_level}</span>
                                </div>
                              )}
                            </div>
                            
                            {/* 活動詳細信息 */}
                            {node.type === 'activity' && node.metadata?.activityDetails && (
                              <div className="mt-3 p-3 bg-white/20 rounded-lg">
                                <div className={`text-xs font-medium ${colors.text} mb-2`}>活動詳情</div>
                                <div className="grid grid-cols-1 gap-2 text-xs">
                                  {node.metadata.activityDetails.category && (
                                    <div>
                                      <span className={`${colors.text} opacity-70`}>類別：</span>
                                      <span className={`${colors.text}`}>{node.metadata.activityDetails.category}</span>
                                    </div>
                                  )}
                                  {node.metadata.activityDetails.activity_type && (
                                    <div>
                                      <span className={`${colors.text} opacity-70`}>類型：</span>
                                      <span className={`${colors.text}`}>{node.metadata.activityDetails.activity_type}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
              
              {/* 完成提示 */}
              {getOrderedPathNodes().length > 0 && (
                <div className="text-center mt-4 p-4 bg-gradient-to-r from-green-100 to-blue-100 rounded-xl border border-green-200">
                  <div className="text-base font-semibold text-gray-700 mb-1">
                    學習路徑完成！
                  </div>
                  <div className="text-xs text-gray-600">
                    共 {getOrderedPathNodes().filter(node => node.type === 'activity' || node.type === 'milestone').length} 個學習步驟
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// 節點編輯器組件
interface NodeEditorProps {
  node: LearningNode;
  onSave: (node: LearningNode) => void;
  onCancel: () => void;
}

function NodeEditor({ node, onSave, onCancel }: NodeEditorProps) {
  const [editedNode, setEditedNode] = useState<LearningNode>(node);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto"
      >
        <h3 className="text-xl font-bold text-hanami-text mb-4">編輯節點</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-hanami-text mb-1">標題</label>
            <HanamiInput
              value={editedNode.title}
              onChange={(e) => setEditedNode(prev => ({ ...prev, title: e.target.value }))}
              placeholder="輸入節點標題"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-hanami-text mb-1">描述</label>
            <textarea
              value={editedNode.description}
              onChange={(e) => setEditedNode(prev => ({ ...prev, description: e.target.value }))}
              placeholder="輸入節點描述"
              className="w-full p-2 border border-hanami-border rounded-lg resize-none"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-hanami-text mb-1">時長</label>
              <div className="flex gap-1">
                <input
                  type="number"
                  value={editedNode.duration}
                  onChange={(e) => setEditedNode(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                  className="flex-1 p-2 border border-hanami-border rounded-lg"
                  min="0"
                />
                <select
                  value={editedNode.durationUnit || '分鐘'}
                  onChange={(e) => setEditedNode(prev => ({ ...prev, durationUnit: e.target.value }))}
                  className="px-2 py-2 border border-hanami-border rounded-lg bg-white"
                >
                  <option value="分鐘">分鐘</option>
                  <option value="小時">小時</option>
                  <option value="天">天</option>
                  <option value="週">週</option>
                  <option value="次">次</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-hanami-text mb-1">難度</label>
              <select
                value={editedNode.difficulty}
                onChange={(e) => setEditedNode(prev => ({ ...prev, difficulty: parseInt(e.target.value) as 1|2|3|4|5 }))}
                className="w-full p-2 border border-hanami-border rounded-lg"
              >
                <option value={1}>1 - 簡單</option>
                <option value={2}>2 - 基礎</option>
                <option value={3}>3 - 中等</option>
                <option value={4}>4 - 困難</option>
                <option value={5}>5 - 專家</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-hanami-text mb-1">獎勵</label>
            <input
              type="text"
              value={editedNode.reward || ''}
              onChange={(e) => setEditedNode(prev => ({ 
                ...prev, 
                reward: e.target.value
              }))}
              placeholder="輸入獎勵"
              className="w-full p-2 border border-hanami-border rounded-lg"
            />
          </div>
        </div>
        
        <div className="flex gap-2 mt-6">
          <HanamiButton
            variant="success"
            onClick={() => onSave(editedNode)}
            className="flex-1"
          >
            保存
          </HanamiButton>
          <HanamiButton
            variant="secondary"
            onClick={onCancel}
            className="flex-1"
          >
            取消
          </HanamiButton>
        </div>
      </motion.div>
    </div>
  );
}
