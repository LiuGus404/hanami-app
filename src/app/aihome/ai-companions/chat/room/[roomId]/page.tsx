'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { 
  Bars3Icon, 
  PaperAirplaneIcon,
  ArrowLeftIcon,
  MicrophoneIcon,
  PhotoIcon,
  FaceSmileIcon,
  EllipsisHorizontalIcon,
  PlusIcon,
  XMarkIcon,
  CpuChipIcon,
  SparklesIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { AcademicCapIcon, PaintBrushIcon, UsersIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import AppSidebar from '@/components/AppSidebar';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import { getSaasSupabaseClient } from '@/lib/supabase';
import Image from 'next/image';
import { PicoSettings, MoriSettings } from '@/components/ai-companion';
import { MessageStatusIndicator } from '@/components/ai-companion/MessageStatusIndicator';
import { FoodBalanceDisplay } from '@/components/ai-companion/FoodBalanceDisplay';
import { SecureImageDisplay } from '@/components/ai-companion/SecureImageDisplay';
import { convertToPublicUrl, convertToShortUrl } from '@/lib/getSignedImageUrl';

// ⭐ 全局發送鎖（跨組件實例共享，防止 React Strict Mode 雙重掛載）
const globalSendingLock = new Map<string, boolean>();

// 簡繁轉換工具函數
const simplifiedToTraditionalMap: Record<string, string> = {
  '图': '圖', '设': '設', '计': '計', '创': '創', '作': '作', '风': '風', '格': '格',
  '实': '實', '现': '現', '时': '時', '间': '間', '开': '開', '始': '始',
  '请': '請', '输': '輸', '入': '入', '内': '內', '容': '容', '信': '信',
  '息': '息', '尺': '尺', '寸': '寸', '大': '大', '小': '小', '提': '提',
  '供': '供', '这': '這', '两': '兩', '个': '個', '就': '就', '能': '能',
  '为': '為', '您': '您', '啦': '啦', '例': '例', '如': '如', '写': '寫',
  '卡': '卡', '通': '通', '抽': '抽', '象': '象', '等': '等', '另': '另',
  '外': '外', '需': '需', '要': '要', '的': '的', '是': '是', '多': '多',
  '呢': '呢', '希': '希', '望': '望', '生': '生', '成': '成', '采': '採',
  '用': '用', '什': '什', '么': '麼', '艺': '藝', '术': '術', '制': '製',
  '只': '隻', '强': '強', '壮': '壯', '过': '過', '来': '來', '会': '會',
  '说': '說', '话': '話', '题': '題', '问': '問', '应': '應', '该': '該',
  '还': '還', '没': '沒', '关': '關', '系': '係', '发': '發', '经': '經',
  '可': '可', '以': '以'
};

const traditionalChineseChars = ['圖', '設', '計', '創', '風', '實', '現', '時', '間', '開', '請', '輸', '內', '這', '兩', '個', '為', '寫', '採', '麼', '藝', '術', '製', '隻', '強', '壯', '現', '實', '過', '來', '會', '說', '話', '題', '問', '題', '應', '該', '還', '沒', '關', '係', '發', '現', '經', '過', '來', '說', '話'];
const simplifiedChineseChars = ['图', '设', '计', '创', '风', '实', '现', '时', '间', '开', '请', '输', '内', '这', '两', '个', '为', '写', '采', '么', '艺', '术', '制', '只', '强', '壮', '现', '实', '过', '来', '会', '说', '话', '题', '问', '题', '应', '该', '还', '没', '关', '系', '发', '现', '经', '过', '来', '说', '话'];

const containsTraditionalChinese = (text: string): boolean => {
  return traditionalChineseChars.some(char => text.includes(char));
};

const containsSimplifiedChinese = (text: string): boolean => {
  return simplifiedChineseChars.some(char => text.includes(char));
};

const convertToTraditional = (text: string): string => {
  let result = text;
  Object.entries(simplifiedToTraditionalMap).forEach(([simplified, traditional]) => {
    result = result.replace(new RegExp(simplified, 'g'), traditional);
  });
  return result;
};


interface Message {
  id: string;
  content: string;
  sender: 'user' | 'hibi' | 'mori' | 'pico' | 'system';
  timestamp: Date;
  type: 'text' | 'image' | 'task_created' | 'task_completed';
  status?: 'queued' | 'processing' | 'completed' | 'error' | 'cancelled'; // 新增：訊息狀態
  taskId?: string;
  metadata?: any;
  content_json?: any; // 新增：內容 JSON 資料（包含食量資訊）
}

interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: 'hibi' | 'mori' | 'pico';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  createdAt: Date;
  completedAt?: Date;
  result?: string;
}

interface AICompanion {
  id: 'hibi' | 'mori' | 'pico';
  name: string;
  nameEn: string;
  description: string;
  specialty: string;
  icon: any;
  imagePath: string;
  personality: string;
  abilities: string[];
  color: string;
  status: 'online' | 'busy' | 'offline';
  isManager?: boolean;
}

interface Room {
  id: string;
  title: string;
  description: string;
  activeCompanions: ('hibi' | 'mori' | 'pico')[];
  createdAt: Date;
}

// TaskPanelContent 組件 - 可重用的任務面板內容
const TaskPanelContent = ({ 
  tasks, 
  activeRoles, 
  room, 
  editingProject, 
  editProjectName, 
  setEditProjectName, 
  editProjectDescription, 
  setEditProjectDescription, 
  handleStartEditProject, 
  handleUpdateProject, 
  setEditingProject, 
  picoSettings, 
  setPicoSettings, 
  moriSettings, 
  setMoriSettings 
}: {
  tasks: any[];
  activeRoles: ('hibi' | 'mori' | 'pico')[];
  room: any;
  editingProject: boolean;
  editProjectName: string;
  setEditProjectName: (name: string) => void;
  editProjectDescription: string;
  setEditProjectDescription: (desc: string) => void;
  handleStartEditProject: () => void;
  handleUpdateProject: () => void;
  setEditingProject: (editing: boolean) => void;
  picoSettings: any;
  setPicoSettings: (settings: any) => void;
  moriSettings: any;
  setMoriSettings: (settings: any) => void;
}) => (
  <>
    {/* 任務統計 */}
    <div className="grid grid-cols-2 gap-3 mb-6">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
        <div className="text-lg font-bold text-blue-600">{tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length}</div>
        <div className="text-xs text-blue-500">進行中</div>
      </div>
      <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
        <div className="text-lg font-bold text-green-600">{tasks.filter(t => t.status === 'completed').length}</div>
        <div className="text-xs text-green-500">已完成</div>
      </div>
    </div>

    {/* 專案資訊編輯區域 */}
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#4B4036] flex items-center space-x-2">
          <div className="w-4 h-4 bg-purple-400 rounded-full flex items-center justify-center">
            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <span>專案資訊</span>
        </h3>
        
        {!editingProject && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStartEditProject}
            className="flex items-center space-x-1 px-2 py-1 bg-[#FFD59A] hover:bg-[#EBC9A4] text-[#4B4036] rounded-lg text-xs font-medium transition-all shadow-sm"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>編輯</span>
          </motion.button>
        )}
      </div>
      
      {editingProject ? (
        /* 編輯模式 */
        <div className="space-y-3 p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
          <div>
            <label className="block text-xs font-medium text-[#4B4036] mb-1">專案名稱</label>
            <input
              type="text"
              value={editProjectName}
              onChange={(e) => setEditProjectName(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-purple-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FFB6C1] focus:border-transparent transition-all"
              placeholder="輸入專案名稱..."
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-[#4B4036] mb-1">專案指引</label>
            <textarea
              value={editProjectDescription}
              onChange={(e) => setEditProjectDescription(e.target.value)}
              rows={2}
              className="w-full px-2 py-1.5 text-sm border border-purple-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FFB6C1] focus:border-transparent transition-all resize-none"
              placeholder="輸入專案指引..."
            />
          </div>
          
          <div className="flex space-x-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleUpdateProject}
              className="flex-1 px-3 py-1.5 bg-[#FFB6C1] hover:bg-[#FFB6C1]/80 text-white rounded-md text-xs font-medium transition-all shadow-sm"
            >
              保存
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setEditingProject(false)}
              className="flex-1 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-[#4B4036] rounded-md text-xs font-medium transition-all"
            >
              取消
            </motion.button>
          </div>
        </div>
      ) : (
        /* 顯示模式 */
        <div className="p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
          <div className="mb-2">
            <div className="text-xs font-medium text-purple-700 mb-0.5">專案名稱</div>
            <div className="text-sm text-[#4B4036] font-semibold">{room.title}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-purple-700 mb-0.5">專案指引</div>
            <div className="text-xs text-[#2B3A3B] leading-relaxed">{room.description || '暫無指引'}</div>
          </div>
        </div>
      )}
    </div>

    {/* 皮可創作設定 - 只在皮可在專案中時顯示 */}
    {activeRoles.includes('pico') && (
      <div className="mb-6">
        <PicoSettings 
          onSettingsChange={setPicoSettings}
          className="shadow-sm"
        />
      </div>
    )}

    {/* 墨墨研究設定 - 只在墨墨在專案中時顯示 */}
    {activeRoles.includes('mori') && (
      <div className="mb-6">
        <MoriSettings 
          onSettingsChange={setMoriSettings}
          className="shadow-sm"
        />
      </div>
    )}

    {/* 任務列表 */}
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-[#4B4036] mb-3">活躍任務</h3>
      <AnimatePresence>
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </AnimatePresence>

      {tasks.length === 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-[#F8F5EC] rounded-full flex items-center justify-center mx-auto mb-3">
            <CpuChipIcon className="w-8 h-8 text-[#2B3A3B]" />
          </div>
          <p className="text-sm text-[#2B3A3B]">還沒有任務</p>
          <p className="text-xs text-[#2B3A3B]/70">在對話中提及需求，AI 會自動創建任務</p>
        </div>
      )}
    </div>
  </>
);

// 安全的 JSON 解析函數
const safeJsonParse = async (response: Response, context: string = 'API') => {
  try {
    const responseText = await response.text();
    console.log(`🔍 ${context} 原始響應文本:`, responseText);
    
    if (!responseText || responseText.trim() === '') {
      console.log(`⚠️ ${context} 收到空響應`);
      return { success: false, error: 'Empty response' };
    }
    
    return JSON.parse(responseText);
  } catch (jsonError) {
    console.error(`❌ ${context} JSON 解析失敗:`, jsonError);
    return { success: false, error: 'Invalid JSON response', details: jsonError instanceof Error ? jsonError.message : String(jsonError) };
  }
};

export default function RoomChatPage() {
  const { user } = useSaasAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.roomId as string;
  
  // 使用 SaaS 系統的 Supabase 客戶端
  const saasSupabase = getSaasSupabaseClient();
  // 使用更可靠的方法獲取 URL 參數
  const [urlParams, setUrlParams] = useState<{initialRole?: string, companion?: string}>({});
  
  useEffect(() => {
    // 直接從 window.location 獲取參數，更可靠
    const urlSearchParams = new URLSearchParams(window.location.search);
    const initialRole = urlSearchParams.get('initialRole');
    const companion = urlSearchParams.get('companion');
    
    console.log('🔍 直接從 URL 獲取參數 - initialRole:', initialRole, 'companion:', companion);
    console.log('🔍 完整 URL:', window.location.href);
    
    setUrlParams({ initialRole: initialRole || undefined, companion: companion || undefined });
  }, []);
  
  const initialRoleParam = urlParams.initialRole;
  const companionParam = urlParams.companion;
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // 直接使用 React 狀態，不使用 sessionStorage
  const [messages, setMessages] = useState<Message[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);  // ⭐ 新增發送鎖
  const isSendingRef = useRef(false);  // ⭐ 同步發送鎖（避免 React 狀態更新延遲）
  const subscriptionRef = useRef<any>(null);  // ⭐ 保存訂閱引用
  const processedMessageIds = useRef(new Set<string>());  // ⭐ 追蹤已處理的訊息 ID
  const [forceRender, setForceRender] = useState(0);  // ⭐ 選擇性重新渲染計數器
  
  // 選擇性重新渲染函數 - 只在特定情況下觸發
  const triggerSelectiveRender = useCallback((reason: string) => {
    console.log(`🔄 [選擇性渲染] 觸發原因: ${reason}`);
    setForceRender(prev => prev + 1);
  }, []);
  const [showTaskPanel, setShowTaskPanel] = useState(false);
  const [activeRoles, setActiveRoles] = useState<('hibi' | 'mori' | 'pico')[]>(() => {
    console.log('🏁 初始化 activeRoles 為空陣列 (將被 URL 參數或資料庫覆蓋)');
    return []; // 空陣列，稍後會被 URL 參數或資料庫覆蓋
  });
  const [selectedCompanion, setSelectedCompanion] = useState<'hibi' | 'mori' | 'pico'>('hibi'); // 預設 hibi 統籌
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Pico 圖片生成快捷選項
  const [picoImageSize, setPicoImageSize] = useState<string>(() => {
    // 從 localStorage 讀取上次選擇的尺寸
    if (typeof window !== 'undefined') {
      return localStorage.getItem('picoImageSize') || '';
    }
    return '';
  });
  const [picoImageStyle, setPicoImageStyle] = useState<string>(() => {
    // 從 localStorage 讀取上次選擇的風格
    if (typeof window !== 'undefined') {
      return localStorage.getItem('picoImageStyle') || '';
    }
    return '';
  });
  const [picoCustomSize, setPicoCustomSize] = useState<string>(() => {
    // 從 localStorage 讀取上次自訂的尺寸
    if (typeof window !== 'undefined') {
      return localStorage.getItem('picoCustomSize') || '';
    }
    return '';
  });
  const [picoCustomStyle, setPicoCustomStyle] = useState<string>(() => {
    // 從 localStorage 讀取上次自訂的風格
    if (typeof window !== 'undefined') {
      return localStorage.getItem('picoCustomStyle') || '';
    }
    return '';
  });
  const [showCustomSizeInput, setShowCustomSizeInput] = useState<boolean>(() => {
    // 從 localStorage 判斷是否顯示自訂尺寸輸入框
    if (typeof window !== 'undefined') {
      const customSize = localStorage.getItem('picoCustomSize');
      return customSize ? true : false;
    }
    return false;
  });
  const [showCustomStyleInput, setShowCustomStyleInput] = useState<boolean>(() => {
    // 從 localStorage 判斷是否顯示自訂風格輸入框
    if (typeof window !== 'undefined') {
      const customStyle = localStorage.getItem('picoCustomStyle');
      return customStyle ? true : false;
    }
    return false;
  });
  const [picoOptionsExpanded, setPicoOptionsExpanded] = useState<boolean>(() => {
    // 從 localStorage 讀取展開狀態，預設為收起 (false)
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('picoOptionsExpanded');
      return saved === 'true';
    }
    return false;
  });
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(roomId);
  // 兼容的 UUID 生成函數
  const generateUUID = () => {
    // 優先使用 crypto.randomUUID（如果支援）
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback：使用 Math.random 生成 UUID v4 格式
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const [currentSessionId] = useState(() => {
    // 生成兼容的 UUID 格式
    return generateUUID();
  });
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showBlackboard, setShowBlackboard] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSearchBox, setShowSearchBox] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
  const [hasLoadedFromDatabase, setHasLoadedFromDatabase] = useState(false);
  const [editingProject, setEditingProject] = useState(false);
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectDescription, setEditProjectDescription] = useState('');
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false); // 追蹤是否已載入歷史訊息
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [picoSettings, setPicoSettings] = useState({
    defaultStyle: '其他',
    customStyle: '',
    defaultScene: '其他',
    customScene: '',
    systemPrompt: '',
    defaultSize: '其他',
    customSize: ''
  });
  const [moriSettings, setMoriSettings] = useState({
    // 必填欄位（1欄）+ 可選欄位（10欄）
    models: ['DeepSeek', 'ChatGPT'], // 預設雙模型（必填）
    topic: '',
    goal: '',
    audience: '',
    deliverable: '',
    date_range: '', // 時間範圍（字串格式）
    languages: [],
    region_bias: [],
    key_questions: ['', '', ''],
    seed_keywords: [{ kw: '', variants: [''] }],
    evidence_criteria: [],
    
    // 建議加上（可選）
    must_cover: [],
    must_avoid: [],
    domain_allowlist: [],
    domain_blocklist: [],
    notes: ''
  });
  
  // 滾動到訊息底部的函數
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // 切換 Pico 選項展開狀態並保存到 localStorage
  const togglePicoOptions = () => {
    const newState = !picoOptionsExpanded;
    setPicoOptionsExpanded(newState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('picoOptionsExpanded', String(newState));
    }
  };
  
  // 監聽 Pico 圖片尺寸變化並保存到 localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (picoImageSize) {
        localStorage.setItem('picoImageSize', picoImageSize);
      } else {
        localStorage.removeItem('picoImageSize');
      }
    }
  }, [picoImageSize]);
  
  // 監聽 Pico 圖片風格變化並保存到 localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (picoImageStyle) {
        localStorage.setItem('picoImageStyle', picoImageStyle);
      } else {
        localStorage.removeItem('picoImageStyle');
      }
    }
  }, [picoImageStyle]);
  
  // 監聽 Pico 自訂尺寸變化並保存到 localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (picoCustomSize) {
        localStorage.setItem('picoCustomSize', picoCustomSize);
      } else {
        localStorage.removeItem('picoCustomSize');
      }
    }
  }, [picoCustomSize]);
  
  // 監聽 Pico 自訂風格變化並保存到 localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (picoCustomStyle) {
        localStorage.setItem('picoCustomStyle', picoCustomStyle);
      } else {
        localStorage.removeItem('picoCustomStyle');
      }
    }
  }, [picoCustomStyle]);

  // 檢測用戶語言偏好
  const detectUserLanguage = (): 'traditional' | 'simplified' | 'other' => {
    // 檢查最近 3 條用戶訊息的語言
    const recentUserMessages = messages
      .filter(msg => msg.sender === 'user')
      .slice(-3)
      .map(msg => msg.content)
      .join(' ');

    if (containsTraditionalChinese(recentUserMessages)) {
      return 'traditional';
    } else if (containsSimplifiedChinese(recentUserMessages)) {
      return 'simplified';
    }
    
    return 'other';
  };

  const [room, setRoom] = useState<{
    title: string;
    description: string;
    activeCompanions: ('hibi' | 'mori' | 'pico')[];
  }>({
    title: '載入中...',
    description: '正在載入專案資訊...',
    activeCompanions: [] // 空陣列，稍後會被實際資料覆蓋
  });
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 載入房間資訊和角色
  const loadRoomInfo = async () => {
    try {
      console.log('🔍 載入房間資訊:', roomId);
      
      const supabase = getSaasSupabaseClient();
      
      // 載入房間基本資訊
      const { data: roomData, error: roomError } = await supabase
        .from('ai_rooms')
        .select('id, title, description, room_type, created_at')
        .eq('id', roomId)
        .single() as { data: { id: string; title: string; description?: string; room_type?: string; created_at: string } | null; error: any };
      
      // 載入房間角色（兩段式查詢避免 400/406 並確保完整資料）
      let roomRoles: string[] = [];
      try {
        console.log('🔍 載入房間角色:', roomId);
        // 第一步：先查 room_roles 取得 role_instance_id 列表
        const { data: roomRoleLinks, error: roomRolesError } = await supabase
          .from('room_roles')
          .select('role_instance_id')
          .eq('room_id', roomId)
          .eq('is_active', true);

        if (roomRolesError) {
          console.log('⚠️ 載入房間角色關聯失敗:', roomRolesError);
        }

        const roleInstanceIds = (roomRoleLinks || [])
          .map((r: any) => r.role_instance_id)
          .filter(Boolean);

        if (roleInstanceIds.length > 0) {
          // 第二步：查 role_instances 取得 role_id
          const { data: roleInstances, error: roleInstancesError } = await supabase
            .from('role_instances')
            .select('id, role_id')
            .in('id', roleInstanceIds);

          if (roleInstancesError) {
            console.log('⚠️ 載入角色實例失敗:', roleInstancesError);
          } else {
            const roleIds = (roleInstances || [])
              .map((ri: any) => ri?.role_id)
              .filter(Boolean);

            if (roleIds.length > 0) {
              // 第三步：查 ai_roles 取得 slug
              const { data: aiRoles, error: aiRolesError } = await supabase
                .from('ai_roles')
                .select('id, slug')
                .in('id', roleIds);

              if (aiRolesError) {
                console.log('⚠️ 載入 AI 角色失敗:', aiRolesError);
              } else {
                const rawSlugs = (aiRoles || [])
                  .map((ar: any) => ar?.slug)
                  .filter(Boolean);
                
                // 將資料庫中的 slug 轉換為內部使用的格式
                roomRoles = rawSlugs.map(slug => {
                  if (slug.includes('hibi-manager')) return 'hibi';
                  if (slug.includes('mori-researcher')) return 'mori';
                  if (slug.includes('pico-artist')) return 'pico';
                  return slug; // 保持其他格式不變
                });
                
                console.log('✅ 從資料庫載入的房間角色:', roomRoles);
              }
            }
          }
        } else {
          console.log('⚠️ 此房間沒有任何角色關聯');
        }

        // 如果從資料庫載入到角色，且沒有 URL 參數，則使用資料庫的角色
        if (roomRoles.length > 0 && !urlParams.initialRole && !urlParams.companion) {
          console.log('🔄 使用資料庫中的角色設定:', roomRoles);
          const normalize = (name: any) => {
            const n = String(name).toLowerCase();
            if (n.includes('hibi') || n.includes('希希')) return 'hibi';
            if (n.includes('mori') || n.includes('墨墨')) return 'mori';
            if (n.includes('pico') || n.includes('皮可')) return 'pico';
            return null;
          };
          const normalized = Array.from(new Set(roomRoles.map(normalize).filter(Boolean))) as ('hibi'|'mori'|'pico')[];
          setActiveRoles(normalized);
          if (roomRoles.length === 1) {
            setSelectedCompanion(normalized[0]);
          }
          // 保存到 sessionStorage
          sessionStorage.setItem(`room_${roomId}_roles`, JSON.stringify(normalized));
        }
        setHasLoadedFromDatabase(true);
      } catch (error) {
        console.error('載入房間角色錯誤:', error);
      }
      
      if (roomError) {
        console.error('❌ 載入房間資訊失敗:', roomError);
        // 使用預設資訊
        setRoom({
          title: '未知專案',
          description: '無法載入專案資訊',
          activeCompanions: roomRoles.length > 0 ? roomRoles as ('hibi' | 'mori' | 'pico')[] : activeRoles
        });
      } else if (roomData) {
        console.log('✅ 房間資訊載入成功:', roomData.title);
        setRoom({
          title: roomData.title || '未命名專案',
          description: roomData.description || '',
          activeCompanions: roomRoles.length > 0 ? roomRoles as ('hibi' | 'mori' | 'pico')[] : activeRoles
        });
      }
    } catch (error) {
      console.error('載入房間資訊錯誤:', error);
      setRoom({
        title: '載入失敗',
        description: '專案資訊載入失敗',
        activeCompanions: activeRoles
      });
    }
  };

  // 載入角色設定的輔助函數
  const loadRoleSettings = async (roleId: string, userId: string) => {
    try {
      const supabase = getSaasSupabaseClient();
      
      // 映射 companion.id 到實際的 slug
      const getRoleSlug = (companionId: string) => {
        const slugMap: Record<string, string> = {
          'hibi': 'hibi-manager',
          'mori': 'mori-researcher', 
          'pico': 'pico-artist'
        };
        return slugMap[companionId] || companionId;
      };
      
      const roleSlug = getRoleSlug(roleId);
      
      // 1. 先查角色基本資訊以獲取 role_id
      const { data: roleData } = await supabase
        .from('ai_roles' as any)
        .select('id, slug, name, default_model, system_prompt, tone')
        .eq('slug', roleSlug)
        .maybeSingle();
      
      if (!roleData) return {};
      
      // 2. 再查用戶覆寫設定
      const { data: userSettings } = await supabase
        .from('user_role_settings' as any)
        .select('*')
        .eq('user_id', userId)
        .eq('role_id', (roleData as any).id)
        .eq('is_active', true)
        .maybeSingle();
      
      // 處理多模型：將逗號分隔的字串轉換為陣列
      const getModels = (modelString: string | null) => {
        if (!modelString) return [];
        return modelString.split(',').map(m => m.trim()).filter(Boolean);
      };
      
      const userModels = (userSettings as any)?.model_override ? getModels((userSettings as any).model_override) : [];
      const defaultModels = (roleData as any).default_model ? getModels((roleData as any).default_model) : [];
      const finalModels = userModels.length > 0 ? userModels : defaultModels;
      
      return {
        id: (roleData as any).slug,
        name: (roleData as any).name,
        models: finalModels,
        tone: (userSettings as any)?.tone_override || (roleData as any).tone,
        guidance: (userSettings as any)?.guidance_override || (roleData as any).system_prompt
      };
    } catch (error) {
      console.error('載入角色設定失敗:', error);
      return {};
    }
  };

  // 載入群組角色設定的輔助函數
  const loadGroupRoles = async (roleIds: string[], userId: string) => {
    const roles = [];
    for (const roleId of roleIds) {
      const roleSettings = await loadRoleSettings(roleId, userId);
      if (roleSettings.id) {
        roles.push(roleSettings);
      }
    }
    return roles;
  };

  // 根據 URL 參數設置角色狀態（含正規化）
  useEffect(() => {
    console.log('🔄 角色設置 useEffect 觸發, urlParams:', urlParams);

    const normalizeRole = (name: any) => {
      if (!name) return null as unknown as 'hibi'|'mori'|'pico';
      const n = String(name).toLowerCase();
      // 支援新的 slug 格式和舊的格式
      if (n.includes('hibi') || n.includes('希希') || n.includes('hibi-manager')) return 'hibi';
      if (n.includes('mori') || n.includes('墨墨') || n.includes('mori-researcher')) return 'mori';
      if (n.includes('pico') || n.includes('皮可') || n.includes('pico-artist')) return 'pico';
      return null as unknown as 'hibi'|'mori'|'pico';
    };

    if (urlParams.initialRole || urlParams.companion) {
      const targetRoleRaw = urlParams.initialRole || urlParams.companion;
      const targetRole = normalizeRole(targetRoleRaw) || 'hibi';
      console.log('🔧 根據 URL 參數設置角色為(正規化):', targetRole);
      console.log('🔧 設置前的 activeRoles:', activeRoles);
      setActiveRoles([targetRole]);
      setSelectedCompanion(targetRole);
      sessionStorage.setItem(`room_${roomId}_roles`, JSON.stringify([targetRole]));
      console.log('✅ 已設置 activeRoles 為:', [targetRole]);
    } else {
      console.log('🔍 沒有 URL 參數，嘗試從 sessionStorage 恢復');
      const savedRoles = sessionStorage.getItem(`room_${roomId}_roles`);
      if (savedRoles) {
        try {
          const parsedRoles = JSON.parse(savedRoles) as string[];
          const normalized = Array.from(new Set(parsedRoles.map(r => normalizeRole(r)).filter(Boolean))) as ('hibi'|'mori'|'pico')[];
          console.log('🔄 從 sessionStorage 恢復角色(正規化):', normalized);
          setActiveRoles(normalized);
          if (normalized.length === 1) setSelectedCompanion(normalized[0]);
        } catch (error) {
          console.error('恢復角色狀態失敗:', error);
        }
      } else {
        console.log('⚠️ 沒有找到保存的角色狀態，等待資料庫查詢完成');
      }
    }
  }, [urlParams, roomId]);

  // 資料庫查詢完成後的 fallback 邏輯
  useEffect(() => {
    if (hasLoadedFromDatabase && activeRoles.length === 0) {
      // 如果有 URL 參數，使用 URL 參數
      if (urlParams.initialRole || urlParams.companion) {
        const targetRole = urlParams.initialRole || urlParams.companion;
        console.log('⚠️ 資料庫查詢完成但無角色資料，使用 URL 參數:', targetRole);
        setActiveRoles([targetRole as 'hibi' | 'mori' | 'pico']);
        setSelectedCompanion(targetRole as 'hibi' | 'mori' | 'pico');
      } else {
        // 基於房間標題推斷角色
        const roomTitle = room.title?.toLowerCase() || '';
        let inferredRole: string | null = null;
        
        console.log('🔍 房間標題分析:', roomTitle);
        
        // 擴展推斷關鍵字
        if (roomTitle.includes('繪本') || roomTitle.includes('圖') || roomTitle.includes('創作') || roomTitle.includes('設計') || 
            roomTitle.includes('畫') || roomTitle.includes('藝術') || roomTitle.includes('美術') || roomTitle.includes('視覺') ||
            roomTitle.includes('插畫') || roomTitle.includes('繪畫') || roomTitle.includes('圖像') || roomTitle.includes('視覺化')) {
          inferredRole = 'pico';
        } else if (roomTitle.includes('研究') || roomTitle.includes('分析') || roomTitle.includes('調查') || 
                   roomTitle.includes('資料') || roomTitle.includes('資訊') || roomTitle.includes('知識') || 
                   roomTitle.includes('學習') || roomTitle.includes('探索') || roomTitle.includes('能力') ||
                   roomTitle.includes('成長') || roomTitle.includes('發展') || roomTitle.includes('評估') ||
                   roomTitle.includes('教學') || roomTitle.includes('教育') || roomTitle.includes('課程')) {
          inferredRole = 'mori';
        } else if (roomTitle.includes('統籌') || roomTitle.includes('協作') || roomTitle.includes('管理') || 
                   roomTitle.includes('專案') || roomTitle.includes('計劃') || roomTitle.includes('規劃') ||
                   roomTitle.includes('團隊') || roomTitle.includes('合作') || roomTitle.includes('整合') ||
                   roomTitle.includes('組織') || roomTitle.includes('安排') || roomTitle.includes('協調')) {
          inferredRole = 'hibi';
        }
        
        if (inferredRole) {
          console.log('🔍 基於房間標題推斷角色:', inferredRole, '房間標題:', roomTitle);
          setActiveRoles([inferredRole as 'hibi' | 'mori' | 'pico']);
          setSelectedCompanion(inferredRole as 'hibi' | 'mori' | 'pico');
        } else {
          console.log('⚠️ 無法推斷角色，使用預設單一角色（hibi）');
          setActiveRoles(['hibi']);
          setSelectedCompanion('hibi');
        }
      }
    }
  }, [hasLoadedFromDatabase, activeRoles.length, urlParams.initialRole, urlParams.companion, room.title]);

  // === 訂閱引用（用於手動觸發檢查）===

  // === 新增: Realtime 訊息同步 ===
  useEffect(() => {
    if (!roomId || !user) return;
    
    let cleanup: (() => void) | null = null;
    let isSubscribed = true;  // 追蹤訂閱狀態
    
    const setupRealtime = async () => {
      if (!isSubscribed) return;  // 如果已經取消訂閱，就不要設置
      
      const { createSimpleMessageSync } = await import('@/lib/simpleMessageSync');
      
      console.log('📡 [Realtime] 開始簡單訊息同步:', roomId);
      
      const subscription = createSimpleMessageSync(roomId, {
        onInsert: (newMsg) => {
          if (!isSubscribed) return;  // 檢查訂閱狀態
          
          console.log('📨 [Realtime] 收到新訊息:', newMsg);
          console.log('📨 [Realtime] 訊息詳情:', {
            id: newMsg.id,
            role: newMsg.role,
            content: newMsg.content,
            status: newMsg.status,
            content_json: newMsg.content_json
          });
          
          // ⭐ 全局檢查是否已處理過（雙重檢查）
          if (processedMessageIds.current.has(newMsg.id)) {
            console.log('📨 [Realtime] 訊息已在全局追蹤中，跳過:', newMsg.id);
            return;
          }
          
          // 標記為已處理
          processedMessageIds.current.add(newMsg.id);
          console.log('📨 [Realtime] 已添加到全局追蹤:', newMsg.id, '總數:', processedMessageIds.current.size);
          
          // 避免重複添加
          setMessages(prev => {
            console.log('📨 [Realtime] 當前訊息數量:', prev.length);
            console.log('📨 [Realtime] 檢查是否重複:', prev.some(m => m.id === newMsg.id));
            console.log('📨 [Realtime] 新訊息 ID:', newMsg.id);
            
            if (prev.some(m => m.id === newMsg.id)) {
              console.log('📨 [Realtime] 訊息已存在，跳過');
              return prev;
            }
            
            // ⭐ 檢查是否已存在相同內容的訊息（防止重複顯示）
            if (newMsg.role === 'user' && prev.some(m => 
              m.content === newMsg.content && 
              m.sender === 'user' && 
              Math.abs(new Date(newMsg.created_at).getTime() - new Date(m.timestamp).getTime()) < 10000 // 10 秒內
            )) {
              console.log('📨 [Realtime] 訊息已存在（內容），跳過重複的用戶訊息');
              return prev;
            }
            
            // 判斷 sender
            let sender: any = 'user';
            if (newMsg.role === 'assistant' || newMsg.role === 'agent') {
              sender = newMsg.content_json?.role_name || newMsg.content_json?.meta?.role || 'hibi';
              console.log('📨 [Realtime] 判斷為助手訊息，sender:', sender);
            } else if (newMsg.role === 'system') {
              sender = 'system';
              console.log('📨 [Realtime] 判斷為系統訊息');
            } else {
              console.log('📨 [Realtime] 判斷為用戶訊息');
            }
            
            const newMessage = {
              id: newMsg.id,
              content: newMsg.content,
              sender,
              timestamp: new Date(newMsg.created_at),
              type: 'text' as const,
              status: newMsg.status,
              content_json: newMsg.content_json // 新增：保存完整的 content_json
            };
            
            console.log('📨 [Realtime] 添加新訊息:', newMessage);
            
            // ⭐ 如果是 AI 回應，隱藏思考 UI 並更新最後一條用戶訊息狀態為 completed
            console.log('🔍 [調試] 檢查是否需要隱藏思考 UI:', {
              sender,
              isUser: sender === 'user',
              isSystem: sender === 'system',
              isAI: sender !== 'user' && sender !== 'system',
              currentIsLoading: isLoading,
              currentIsTyping: isTyping
            });
            
            // ⭐ 強制隱藏思考 UI - 當任何非用戶訊息到達時
            if (sender !== 'user' && sender !== 'system') {
              console.log('🤖 [Realtime] AI 回應到達，強制隱藏思考 UI，sender:', sender);
              // 使用 setTimeout 確保狀態更新在下一幀執行
              setTimeout(() => {
                setIsLoading(false);
                setIsTyping(false);
                console.log('✅ [Realtime] 思考 UI 已隱藏');
              }, 0);
              
              // ⭐ 將最後一條 processing 狀態的用戶訊息改為 completed
              return prev.map((msg, index) => {
                if (msg.sender === 'user' && msg.status === 'processing') {
                  const isLastUserMessage = !prev.slice(index + 1).some(m => m.sender === 'user');
                  if (isLastUserMessage) {
                    console.log('✅ [Realtime] 更新最後一條用戶訊息狀態為 completed:', msg.id);
                    return { ...msg, status: 'completed' as const };
                  }
                }
                return msg;
              }).concat([newMessage]);
            }
            
            return [...prev, newMessage];
          });
          
          // ⭐ 不觸發重新渲染，讓 React 自然更新訊息列表
        },
        
        onUpdate: (updatedMsg) => {
          if (!isSubscribed) return;  // 檢查訂閱狀態
          
          console.log('🔄 [Realtime UPDATE] 訊息狀態更新:', {
            id: updatedMsg.id,
            role: updatedMsg.role,
            status: updatedMsg.status,
            content_length: updatedMsg.content?.length,
            has_content_json: !!updatedMsg.content_json
          });
          
          // ⭐ 處理錯誤狀態
          if (updatedMsg.status === 'error') {
            console.log('❌ [Realtime UPDATE] 訊息處理錯誤:', updatedMsg.error_message, updatedMsg.content_json);
            
            // 隱藏思考 UI
            setTimeout(() => {
              setIsLoading(false);
              setIsTyping(false);
              console.log('✅ [Realtime UPDATE] 錯誤時隱藏思考 UI');
            }, 0);
            
            // 更新訊息狀態並顯示錯誤資訊
            setMessages(prev => prev.map(m => {
              if (m.id === updatedMsg.id) {
                return {
                  ...m,
                  status: 'error',
                  content_json: {
                    ...m.content_json,
                    error_code: updatedMsg.error_message || updatedMsg.content_json?.error_code,
                    error_details: updatedMsg.content_json?.error_details || updatedMsg.content_json?.error_message
                  }
                };
              }
              return m;
            }));
            
            return;
          }
          
          // ⭐ 判斷 sender（用於 AI 回應）
          let sender: any = 'user';
          if (updatedMsg.role === 'assistant' || updatedMsg.role === 'agent') {
            sender = updatedMsg.content_json?.role_name || updatedMsg.content_json?.meta?.role || 'hibi';
            console.log('🔄 [Realtime UPDATE] 判斷為助手訊息，sender:', sender);
          } else if (updatedMsg.role === 'system') {
            sender = 'system';
            console.log('🔄 [Realtime UPDATE] 判斷為系統訊息');
          } else if (updatedMsg.role === 'user') {
            sender = 'user';
            console.log('🔄 [Realtime UPDATE] 判斷為用戶訊息');
          }
          
          // ⭐ 如果 AI 回應狀態更新為 completed，隱藏思考 UI
          console.log('🔍 [調試] 檢查 onUpdate 是否需要隱藏思考 UI:', {
            status: updatedMsg.status,
            role: updatedMsg.role,
            sender,
            isCompleted: updatedMsg.status === 'completed',
            isNotUser: updatedMsg.role !== 'user',
            shouldHide: updatedMsg.status === 'completed' && updatedMsg.role !== 'user',
            currentIsLoading: isLoading,
            currentIsTyping: isTyping
          });
          
          if (updatedMsg.status === 'completed' && updatedMsg.role !== 'user' && updatedMsg.role !== 'system') {
            console.log('🤖 [Realtime UPDATE] AI 回應完成，強制隱藏思考 UI');
            // 使用 setTimeout 確保狀態更新在下一幀執行
            setTimeout(() => {
              setIsLoading(false);
              setIsTyping(false);
              console.log('✅ [Realtime UPDATE] 思考 UI 已隱藏（onUpdate）');
            }, 0);
            
            // ⭐ 如果這是一條新訊息（之前未見過），添加到列表
            setMessages(prev => {
              const messageExists = prev.some(m => m.id === updatedMsg.id);
              
              if (!messageExists && updatedMsg.content && updatedMsg.content.trim()) {
                console.log('📨 [Realtime UPDATE] 首次收到 AI 回應，添加到列表');
                const newMessage = {
                  id: updatedMsg.id,
                  content: updatedMsg.content,
                  sender,
                  timestamp: new Date(updatedMsg.created_at),
                  type: 'text' as const,
                  status: updatedMsg.status,
                  content_json: updatedMsg.content_json
                };
                
                // 更新用戶訊息的狀態為 completed
                return prev.map(m => {
                  if (m.sender === 'user' && m.status === 'processing') {
                    return { ...m, status: 'completed' as const };
                  }
                  return m;
                }).concat([newMessage]);
              }
              
              // ⭐ 更新已存在的訊息
              return prev.map(m => {
                if (m.id === updatedMsg.id) {
                  console.log('🔄 [Realtime UPDATE] 更新已存在的訊息:', m.id);
                  return { 
                    ...m, 
                    status: updatedMsg.status, 
                    content: updatedMsg.content,
                    content_json: updatedMsg.content_json,
                    sender: sender // 更新 sender（以防有變化）
                  };
                }
                return m;
              });
            });
          } else {
            // ⭐ 非 completed 狀態，只更新訊息
            setMessages(prev => prev.map(m => {
              if (m.id === updatedMsg.id) {
                return { 
                  ...m, 
                  status: updatedMsg.status, 
                  content: updatedMsg.content, 
                  content_json: updatedMsg.content_json 
                };
              }
              return m;
            }));
          }
        },
        
        onDelete: (messageId) => {
          if (!isSubscribed) return;
          
          console.log('🗑️ [Realtime DELETE] 刪除訊息:', messageId);
          
          // 從訊息列表中移除
          setMessages(prev => prev.filter(m => m.id !== messageId));
        }
      });
      
      // 保存訂閱引用，以便手動觸發檢查
      subscriptionRef.current = subscription;
      
      cleanup = () => {
        console.log('🔌 [Realtime] 取消訂閱:', roomId);
        subscription.unsubscribe();
        subscriptionRef.current = null;
      };
    };
    
    setupRealtime().catch(err => {
      console.error('❌ [Realtime] 設置失敗:', err);
    });
    
    // 清理函數
    return () => {
      console.log('🧹 [Realtime] useEffect 清理:', roomId);
      isSubscribed = false;  // 標記為已取消訂閱
      processedMessageIds.current.clear();  // 清理已處理的訊息 ID
      if (cleanup) {
        cleanup();
      }
    };
  }, [roomId, user]);

  // 最終 fallback：確保至少有一個角色顯示
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeRoles.length === 0 && hasLoadedFromDatabase) {
        console.log('🚨 最終 fallback：沒有任何角色，基於房間標題推斷');
        const roomTitle = room.title?.toLowerCase() || '';
        
        // 使用相同的推斷邏輯
        if (roomTitle.includes('繪本') || roomTitle.includes('圖') || roomTitle.includes('創作') || roomTitle.includes('設計') || 
            roomTitle.includes('畫') || roomTitle.includes('藝術') || roomTitle.includes('美術') || roomTitle.includes('視覺') ||
            roomTitle.includes('插畫') || roomTitle.includes('繪畫') || roomTitle.includes('圖像') || roomTitle.includes('視覺化')) {
          console.log('🔍 最終推斷為皮可角色');
          setActiveRoles(['pico']);
          setSelectedCompanion('pico');
        } else if (roomTitle.includes('研究') || roomTitle.includes('分析') || roomTitle.includes('調查') || 
                   roomTitle.includes('資料') || roomTitle.includes('資訊') || roomTitle.includes('知識') || 
                   roomTitle.includes('學習') || roomTitle.includes('探索') || roomTitle.includes('能力') ||
                   roomTitle.includes('成長') || roomTitle.includes('發展') || roomTitle.includes('評估') ||
                   roomTitle.includes('教學') || roomTitle.includes('教育') || roomTitle.includes('課程')) {
          console.log('🔍 最終推斷為墨墨角色');
          setActiveRoles(['mori']);
          setSelectedCompanion('mori');
        } else if (roomTitle.includes('統籌') || roomTitle.includes('協作') || roomTitle.includes('管理') || 
                   roomTitle.includes('專案') || roomTitle.includes('計劃') || roomTitle.includes('規劃') ||
                   roomTitle.includes('團隊') || roomTitle.includes('合作') || roomTitle.includes('整合') ||
                   roomTitle.includes('組織') || roomTitle.includes('安排') || roomTitle.includes('協調')) {
          console.log('🔍 最終推斷為 Hibi 角色');
          setActiveRoles(['hibi']);
          setSelectedCompanion('hibi');
        } else {
          console.log('🚨 無法推斷，設置為預設單一角色（hibi）');
          setActiveRoles(['hibi']);
          setSelectedCompanion('hibi');
        }
      }
    }, 2000); // 2秒後的最終檢查
    
    return () => clearTimeout(timer);
  }, [activeRoles.length, hasLoadedFromDatabase, room.title]);

  // 初始化時載入房間資訊 - 確保 URL 參數處理完成後再執行
  useEffect(() => {
    // 簡化條件：只要 urlParams 不是初始空物件就執行
    if (Object.keys(urlParams).length >= 0) { // 允許空物件（表示沒有 URL 參數）
      console.log('🔄 URL 參數處理完成，開始載入房間資訊, urlParams:', urlParams);
      loadRoomInfo();
    }
  }, [roomId, urlParams]); // 依賴 urlParams 確保 URL 參數處理完成後再執行

  // 點擊外部關閉移動端菜單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMobileMenu) {
        setShowMobileMenu(false);
      }
    };

    if (showMobileMenu) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showMobileMenu]);

  // 當 activeRoles 變化時更新 room 的 activeCompanions
  useEffect(() => {
    if (!['hibi','mori','pico'].includes(selectedCompanion as any) && activeRoles.length > 0) {
      setSelectedCompanion(activeRoles[0]);
    }
    setRoom(prev => ({ ...prev, activeCompanions: activeRoles }));
  }, [activeRoles]);

  // 移除角色從專案
  const handleRemoveRole = async (roleId: 'hibi' | 'mori' | 'pico') => {
    // 確保至少保留一個角色
    if (activeRoles.length <= 1) {
      alert('⚠️ 專案團隊中至少需要保留一個 AI 成員！');
      return;
    }

    // 確認對話框
    const companion = companions.find(c => c.id === roleId);
    const isConfirmed = window.confirm(
      `⚠️ 確定要移除 ${companion?.name} 嗎？\n\n移除後該角色將不再參與專案對話。`
    );
    
    if (!isConfirmed) return;

    const newActiveRoles = activeRoles.filter(role => role !== roleId);
    setActiveRoles(newActiveRoles);
    
    // 更新 sessionStorage
    sessionStorage.setItem(`room_${roomId}_roles`, JSON.stringify(newActiveRoles));
    
    // 同步到資料庫
    try {
      console.log('🗑️ 從資料庫移除角色:', roleId);
      const response = await fetch('/api/remove-room-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          roomId: roomId, 
          roleName: roleId === 'hibi' ? 'Hibi' : roleId === 'mori' ? '墨墨' : '皮可'
        })
      });
      const result = await safeJsonParse(response, '移除角色 API');
      
      if (result.success) {
        console.log('✅ 角色已從資料庫移除:', roleId);
        // 通知主頁面重新載入聊天室列表
        localStorage.setItem('rooms_need_refresh', Date.now().toString());
      } else {
        console.log('⚠️ 資料庫移除失敗:', result.error);
      }
    } catch (error) {
      console.log('⚠️ 資料庫移除錯誤:', error);
    }
    
    // 添加離開訊息
    if (companion) {
      const leaveMessage: Message = {
        id: `leave-${roleId}-${Date.now()}`,
        content: `${companion.name} 已離開專案。感謝參與，祝專案順利！`,
        sender: 'system',
        timestamp: new Date(),
        type: 'text'
      };
      
      await addMessage(leaveMessage);
      console.log(`👋 ${companion.name} 已離開專案`);
    }
  };

  // 更新專案資訊
  const handleUpdateProject = async () => {
    if (!editProjectName.trim()) {
      alert('⚠️ 專案名稱不能為空！');
      return;
    }

    try {
      console.log('🔄 更新專案資訊:', editProjectName, editProjectDescription);
      
      const response = await fetch('/api/update-room', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          roomId: roomId,
          title: editProjectName.trim(),
          description: editProjectDescription.trim()
        })
      });
      const result = await safeJsonParse(response, '更新專案 API');
      
      if (result.success) {
        console.log('✅ 專案資訊已更新');
        
        // 更新本地狀態
        setRoom(prev => ({
          ...prev,
          title: editProjectName.trim(),
          description: editProjectDescription.trim()
        }));
        
        // 通知主頁面重新載入
        localStorage.setItem('rooms_need_refresh', Date.now().toString());
        
        // 添加更新訊息
        const updateMessage: Message = {
          id: `update-${Date.now()}`,
          content: `📝 專案資訊已更新！\n專案名稱: ${editProjectName.trim()}\n專案指引: ${editProjectDescription.trim()}`,
          sender: 'system',
          timestamp: new Date(),
          type: 'text'
        };
        
        await addMessage(updateMessage);
        
        // 關閉編輯模式
        setEditingProject(false);
        alert('✅ 專案資訊更新成功！');
      } else {
        alert(`❌ 更新失敗: ${result.error}`);
      }
    } catch (error) {
      console.error('更新專案資訊錯誤:', error);
      alert('更新失敗，請查看控制台');
    }
  };

  // 開始編輯專案
  const handleStartEditProject = () => {
    setEditProjectName(room.title);
    setEditProjectDescription(room.description);
    setEditingProject(true);
  };

  // 邀請角色加入專案
  const handleInviteRole = async (roleId: 'hibi' | 'mori' | 'pico', fromSettings = false) => {
    if (!activeRoles.includes(roleId)) {
      const newActiveRoles = [...activeRoles, roleId];
      setActiveRoles(newActiveRoles);
      
      // 更新 sessionStorage
      sessionStorage.setItem(`room_${roomId}_roles`, JSON.stringify(newActiveRoles));
      
      // 同步到資料庫
      try {
        console.log('🔄 同步角色到資料庫:', roleId);
        const response = await fetch('/api/fix-room-role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            roomId: roomId, 
            roleName: roleId === 'hibi' ? 'Hibi' : roleId === 'mori' ? '墨墨' : '皮可',
            action: 'add' // 添加角色而不是替換
          })
        });
        const result = await safeJsonParse(response, '同步角色 API');
        
        if (result.success) {
          console.log('✅ 角色已同步到資料庫:', roleId);
          // 通知主頁面重新載入聊天室列表
          localStorage.setItem('rooms_need_refresh', Date.now().toString());
        } else {
          console.log('⚠️ 資料庫同步失敗:', result.error);
        }
      } catch (error) {
        console.log('⚠️ 資料庫同步錯誤:', error);
      }
      
      // 添加邀請訊息
      const invitedCompanion = companions.find(c => c.id === roleId);
      if (invitedCompanion) {
        const inviteMessage: Message = {
          id: `invite-${roleId}-${Date.now()}`,
          content: `${invitedCompanion.name} 已加入專案！大家好，我是 ${invitedCompanion.name}，${invitedCompanion.description}。很高興加入這個專案！`,
          sender: roleId,
          timestamp: new Date(),
          type: 'text'
        };
        
        await addMessage(inviteMessage);
        console.log(`✅ ${invitedCompanion.name} 已加入專案`);
      }
    }
    
    // 如果不是從設定界面邀請，關閉邀請模態框
    if (!fromSettings) {
      setShowInviteModal(false);
    }
  };

  // 先定義 companions 陣列
  const companions: AICompanion[] = [
    {
      id: 'hibi',
      name: 'Hibi',
      nameEn: 'Hibi',
      description: '系統總管狐狸，智慧的協調者和統籌中樞，負責任務分配和團隊協作',
      specialty: '系統總管',
      icon: CpuChipIcon,
      imagePath: '/3d-character-backgrounds/studio/Hibi/lulu(front).png',
      personality: '智慧、領導力、協調能力、友善',
      abilities: ['任務統籌', '團隊協調', '智能分析', '流程優化', '決策支援'],
      color: 'from-orange-400 to-red-500',
      status: 'online',
      isManager: true
    },
    {
      id: 'mori',
      name: '墨墨',
      nameEn: 'Mori',
      description: '一隻充滿智慧的貓頭鷹，專精於研究和學習',
      specialty: '研究專用',
      icon: AcademicCapIcon,
      imagePath: '/3d-character-backgrounds/studio/Mori/Mori.png',
      personality: '智慧、沉穩、博學',
      abilities: ['學術研究', '知識解答', '學習指導', '資料分析', '工作協助'],
      color: 'from-amber-400 to-orange-500',
      status: 'online'
    },
    {
      id: 'pico',
      name: '皮可',
      nameEn: 'Pico',
      description: '一隻熱愛繪畫創作的水瀨，專精於藝術創作',
      specialty: '繪圖專用',
      icon: PaintBrushIcon,
      imagePath: '/3d-character-backgrounds/studio/Pico/Pico.png',
      personality: '創意、活潑、藝術',
      abilities: ['繪畫創作', '視覺設計', '創意發想', '藝術指導', '工作設計'],
      color: 'from-blue-400 to-cyan-500',
      status: 'online'
    }
  ];


  // 確保用戶是房間成員
  const ensureRoomMembership = async (roomId: string, userId: string) => {
    try {
      // 檢查用戶是否已經是房間成員
      const { data: existingMember, error: checkError } = await saasSupabase
        .from('room_members')
        .select('*')
        .eq('room_id', roomId)
        .eq('user_id', userId)
        .maybeSingle();

      if (checkError) {
        console.error('❌ 檢查房間成員失敗:', checkError);
        return;
      }

      // 如果用戶不是房間成員，自動添加
      if (!existingMember) {
        console.log('👤 用戶不是房間成員，正在添加...');
        const { error: insertError } = await (saasSupabase
          .from('room_members') as any)
          .insert({
            room_id: roomId,
            user_id: userId,
            role: 'member',
            user_type: 'hanami_user'
          });

        if (insertError) {
          // 如果是重複鍵錯誤，表示用戶已經存在，這是正常的
          if (insertError.code === '23505') {
            console.log('✅ 用戶已是房間成員（重複鍵錯誤）');
          } else {
            console.error('❌ 添加房間成員失敗:', insertError);
          }
        } else {
          console.log('✅ 用戶已添加為房間成員');
        }
      } else {
        console.log('✅ 用戶已是房間成員');
      }
    } catch (error) {
      console.error('❌ 確保房間成員身份時發生錯誤:', error);
    }
  };

  // 調試日誌（已移除以減少控制台輸出）
  // console.log('🎯 當前房間狀態:', { roomId, initialRoleParam, companionParam, activeRoles, selectedCompanion });

  // 載入歷史訊息
  useEffect(() => {
    const loadMessages = async () => {
      if (!roomId || !user) return;

      try {
        console.log('🔍 載入聊天室歷史訊息:', roomId);
        console.log('🔍 用戶 ID:', user.id);
        
        // 確保用戶是房間成員（如果不是，自動添加）
        await ensureRoomMembership(roomId, user.id);
        
        const { data: historyMessages, error } = await saasSupabase
          .from('chat_messages')
          .select('*')
          .eq('thread_id', roomId)
          .order('created_at', { ascending: true });

        console.log('🔍 資料庫查詢結果:', { historyMessages, error });
        console.log('🔍 查詢到的訊息數量:', historyMessages?.length || 0);

        if (error) {
          console.error('❌ 載入歷史訊息失敗:', error);
          return;
        }

        if (historyMessages && historyMessages.length > 0) {
          // ⭐ 過濾掉已刪除的訊息（status = 'deleted'）
          const activeMessages = historyMessages.filter((msg: any) => msg.status !== 'deleted');
          console.log(`🔍 過濾已刪除訊息: 原始 ${historyMessages.length} 條，有效 ${activeMessages.length} 條`);
          
          // 轉換 chat_messages 表格式
          const convertedMessages: Message[] = activeMessages.map((msg: any) => {
            let sender: any = 'user';
            
            if (msg.role === 'user') {
              sender = 'user';
            } else if (msg.role === 'assistant' || msg.role === 'agent') {
              sender = msg.content_json?.role_name || 'hibi';
            } else if (msg.role === 'system') {
              sender = 'system';
            }
            
            return {
              id: msg.id,
              content: msg.content || '',
              sender,
              timestamp: new Date(msg.created_at),
              type: msg.message_type === 'image' ? 'image' : 'text',
              status: msg.status || 'completed',
              metadata: msg.content_json,
              content_json: msg.content_json // 新增：保存完整的 content_json
            };
          });
          
          setMessages(convertedMessages);
          setHasLoadedHistory(true); // 標記已載入歷史訊息
          console.log(`✅ 載入了 ${convertedMessages.length} 條歷史訊息`);
          
          // ⭐ 檢查最後一條用戶訊息狀態，如果是 processing，顯示思考 UI
          const lastUserMessage = convertedMessages.filter(m => m.sender === 'user').pop();
          if (lastUserMessage && lastUserMessage.status === 'processing') {
            console.log('🔄 [載入] 檢測到最後一條用戶訊息狀態為 processing，顯示思考 UI');
            setIsLoading(true);
            setIsTyping(true);
          }
          
          // 觸發選擇性重新渲染 - 進入/刷新聊天室
          triggerSelectiveRender('進入/刷新聊天室');
          
          // 載入歷史訊息後滾動到底部
          setTimeout(() => {
            scrollToBottom();
          }, 200);
          
          return; // 有歷史訊息就不需要顯示歡迎訊息
        } else {
          setHasLoadedHistory(true); // 標記已嘗試載入歷史訊息
          console.log('📝 沒有歷史訊息，準備顯示歡迎訊息');
        }
      } catch (error) {
        console.error('❌ 載入訊息錯誤:', error);
        setHasLoadedHistory(true); // 即使載入失敗，也標記為已嘗試載入
      }
    };

    loadMessages();
  }, [roomId, user]);

  // 初始化歡迎訊息（只在沒有歷史訊息時顯示）
  useEffect(() => {
    // 如果還沒有載入歷史訊息，等待載入完成
    if (!hasLoadedHistory) {
      console.log('🔍 等待歷史訊息載入完成...');
      return;
    }

    // 如果已經有訊息（歷史訊息），就不顯示歡迎訊息
    if (messages.length > 0) {
      console.log('🔍 已有歷史訊息，跳過歡迎訊息生成');
      return;
    }

    // 等待 activeRoles 穩定後再生成歡迎訊息
    const timer = setTimeout(async () => {
      // 如果正在恢復角色狀態，等待完成
      if (urlParams.initialRole || urlParams.companion) {
        const expectedRole = urlParams.initialRole || urlParams.companion;
        if (!activeRoles.includes(expectedRole as any)) {
          console.log('⏳ 等待角色狀態更新完成...');
          return;
        }
      }

      let welcomeMessages: Message[] = [];
      console.log('🎭 生成歡迎訊息，當前 activeRoles:', activeRoles);

      if (activeRoles.length === 1) {
        // 單成員團隊專案 - 只有一個 AI 團隊成員
        const roleId = activeRoles[0];
        const selectedCompanionData = companions.find(c => c.id === roleId);
        if (selectedCompanionData) {
          welcomeMessages = [
            {
              id: 'welcome-single-member',
              content: `你好！我是 ${selectedCompanionData.name}，${selectedCompanionData.description}。歡迎來到我們的專案協作空間！有什麼任務需要我協助的嗎？`,
              sender: roleId,
              timestamp: new Date(),
              type: 'text'
            }
          ];
          console.log(`✅ 生成單成員團隊歡迎訊息: ${selectedCompanionData.name}`);
        }
      } else {
      // 多成員團隊專案 - 多個 AI 團隊成員依序歡迎
      const welcomeOrder = activeRoles.includes('hibi') ? ['hibi', 'mori', 'pico'] : activeRoles;
      const validRoles = welcomeOrder.filter(roleId => activeRoles.includes(roleId as any));
      
      welcomeMessages = validRoles
        .filter(roleId => companions.find(c => c.id === roleId))
        .map((roleId, index) => {
          let content = '';
          if (roleId === 'hibi') {
            content = `歡迎來到 ${room.title}！我是 Hibi，系統總管，很高興為您統籌和協調各項任務。`;
          } else if (roleId === 'mori') {
            content = `我是墨墨，專精於研究和學習分析。有任何學術或研究需求都可以找我！`;
          } else if (roleId === 'pico') {
            content = `嗨！我是皮可，負責創意和視覺設計。讓我們一起創造美好的作品吧！`;
          }
          
          return {
            id: `welcome-${roleId}`,
            content,
            sender: roleId as 'pico' | 'mori' | 'hibi',
            timestamp: new Date(Date.now() - (validRoles.length - index) * 1000),
            type: 'text' as const
          };
        });
      
      // 如果有 Hibi，添加總結歡迎訊息
      if (activeRoles.includes('hibi')) {
        welcomeMessages.push({
          id: 'welcome-summary',
          content: `我們${activeRoles.length}位會協作為您提供最佳的服務。您可以直接說出需求，我會安排最適合的團隊成員來協助！`,
          sender: 'hibi',
          timestamp: new Date(),
          type: 'text'
        });
      }
    }

    // 設置歡迎訊息並保存到資料庫
    setMessages(welcomeMessages);
    
    // 保存所有歡迎訊息到資料庫
    for (const welcomeMessage of welcomeMessages) {
      await saveMessageToSupabase(welcomeMessage);
    }
    console.log('📝 設置歡迎訊息完成，已保存到資料庫');
    }, 100); // 延遲 100ms 等待 activeRoles 穩定

    return () => clearTimeout(timer);
  }, [roomId, activeRoles, hasLoadedHistory]); // 移除 messages.length 避免不停渲染

  // 監控訊息狀態變化
  // useEffect(() => {
  //   console.log('📨 [狀態監控] messages 狀態變化:', {
  //     count: messages.length,
  //     lastMessage: messages[messages.length - 1]
  //   });
  // }, [messages]); // 移除 forceRender 依賴

  // 自動滾動到底部 - 當訊息變化時
  useEffect(() => {
    if (messages.length > 0) {
      // 延遲滾動，確保 DOM 已更新
      const scrollTimer = setTimeout(() => {
        scrollToBottom();
      }, 100);
      
      return () => clearTimeout(scrollTimer);
    }
    // 如果沒有訊息，也要返回一個清理函數（即使是空的）
    return () => {};
  }, [messages]); // 移除 forceRender 依賴，只依賴 messages

  // 計時器管理（從個人對話頁面複製）
  useEffect(() => {
    if (isLoading || isTyping) {
      // 根據 companion 和任務類型設定預估時間
      let estimatedSeconds = 5; // 預設 5 秒
      
      if (companionParam === 'pico' || selectedCompanion === 'pico') {
        // Pico 的任務類型判斷
        const lastMessage = messages[messages.length - 1]?.content || '';
        if (lastMessage.includes('畫') || lastMessage.includes('圖') || lastMessage.includes('創作') || lastMessage.includes('設計')) {
          estimatedSeconds = 35; // 複雜創作任務
        } else if (lastMessage.includes('簡單') || lastMessage.includes('快速')) {
          estimatedSeconds = 15; // 簡單任務
        } else {
          estimatedSeconds = 25; // 一般創作任務
        }
      } else if (companionParam === 'mori' || selectedCompanion === 'mori') {
        // 墨墨的任務類型判斷
        const lastMessage = messages[messages.length - 1]?.content || '';
        if (lastMessage.includes('研究') || lastMessage.includes('分析') || lastMessage.includes('報告')) {
          estimatedSeconds = 15; // 深度分析任務
        } else {
          estimatedSeconds = 8; // 一般問答
        }
      }
      
      setEstimatedTime(estimatedSeconds);
      setElapsedTime(0);
      
      // 開始計時
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      // 清除計時器
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setElapsedTime(0);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isLoading, isTyping, companionParam, selectedCompanion, messages]);

  // 將研究計畫 JSON 轉換為自然語言
  const convertResearchPlanToNaturalLanguage = (researchPlan: any): string => {
    let response = '太好了！先幫你把幼兒成長研究的範圍與計畫框起來，並給你一個可直接使用的 JSON 草案。你只要回覆勾選或補充關鍵選項，我就能把研究素材與內容開始產出。\n\n';
    
    response += '📋 **立即需要你確認的事項**\n\n';
    
    response += '**研究類型（擇一或多選）**\n';
    response += '1) 系統性文獻綜述/統合分析\n';
    response += '2) 二手資料分析（政府或公開資料庫）\n';
    response += '3) 原始資料收集（橫斷/縱貫追蹤）\n\n';
    
    response += '**年齡範圍：** 0–12月、1–3歲、3–6歲、0–6歲\n\n';
    
    response += '**主題面向：** 身高體重/營養、運動發展、語言、認知、社會情緒、睡眠、屏幕時間、口腔/視聽力、育兒環境/家庭社經\n\n';
    
    response += '**地區/族群：** 台灣、華語地區、全球；一般兒童或特定族群（早產、低出生體重等）\n\n';
    
    response += '**交付物：** 計畫書、文獻報告、家長友善指南、簡報、量表工具包、分析程式碼（R/Python）\n\n';
    
    response += '**期限與頁數/深度：** 例如4週完成計畫書＋文獻綜述20頁；或12週完成含原始收案之試點\n\n';
    
    response += '📄 **今次內容 JSON（草案，可直接修改）**\n\n';
    
    if (researchPlan.topic) {
      response += `**主題：** ${researchPlan.topic}\n\n`;
    }
    
    if (researchPlan.goal) {
      response += `**目標：** ${researchPlan.goal}\n\n`;
    }
    
    if (researchPlan.audience && Array.isArray(researchPlan.audience)) {
      response += `**受眾：** ${researchPlan.audience.join('、')}\n\n`;
    }
    
    if (researchPlan.deliverable && Array.isArray(researchPlan.deliverable)) {
      response += '**交付物：**\n';
      researchPlan.deliverable.forEach((item: string, index: number) => {
        response += `${index + 1}. ${item}\n`;
      });
      response += '\n';
    }
    
    if (researchPlan.date_range) {
      if (typeof researchPlan.date_range === 'object') {
        response += `**時間範圍：**\n`;
        if (researchPlan.date_range.literature_window) {
          response += `- 文獻檢索窗口：${researchPlan.date_range.literature_window}\n`;
        }
        if (researchPlan.date_range.project_timeline) {
          response += `- 專案時程：${researchPlan.date_range.project_timeline}\n`;
        }
        response += '\n';
      } else {
        response += `**時間範圍：** ${researchPlan.date_range}\n\n`;
      }
    }
    
    if (researchPlan.languages && Array.isArray(researchPlan.languages)) {
      response += `**語言：** ${researchPlan.languages.join('、')}\n\n`;
    }
    
    if (researchPlan.region_bias) {
      response += `**地區偏好：** ${researchPlan.region_bias}\n\n`;
    }
    
    if (researchPlan.key_questions && Array.isArray(researchPlan.key_questions)) {
      response += '**關鍵問題：**\n';
      researchPlan.key_questions.forEach((question: string, index: number) => {
        response += `${index + 1}. ${question}\n`;
      });
      response += '\n';
    }
    
    if (researchPlan.notes && Array.isArray(researchPlan.notes)) {
      response += '📝 **重要注意事項：**\n';
      researchPlan.notes.forEach((note: string, index: number) => {
        response += `• ${note}\n`;
      });
      response += '\n';
    }
    
    response += '🚀 **建議的執行步驟（濃縮版）**\n\n';
    response += '• **第1週：** 確定範圍與題目、地區與族群、主要指標與量表；完成檢索策略與納入/排除條件\n';
    response += '• **第2–4週：** 文獻檢索與雙人篩選、品質評估、資料擷取；初步統合分析與視覺化（森林圖、成長曲線）\n';
    response += '• **第5–8週：** 撰寫報告與建議；如需原始資料，並行準備IRB文件、問卷與資料蒐集SOP、試點收案\n';
    response += '• **第9–12週（選配）：** 完成試點分析、修訂報告、交付工具包與簡報\n\n';
    
    response += '若你先回覆上述「需要你確認的事項」，我就能立刻把檢索式、量表套件、以及第一版的研究計畫書與報告大綱產出給你。需要雙語或特定學校/園所合作模板也可以直接指定。';
    
    return response;
  };

  // Mori webhook 函數
  const sendToMoriWebhook = async (text: string) => {
    if (!user?.id || !text.trim()) return;

    console.log('🦉 準備發送到 Mori webhook:', text);

    // 檢測研究類型
    const detectResearchType = (message: string): string => {
      const lowerMsg = message.toLowerCase();
      
      if (lowerMsg.includes('學術研究') || lowerMsg.includes('論文') || lowerMsg.includes('研究報告')) return 'academic';
      if (lowerMsg.includes('市場分析') || lowerMsg.includes('商業分析') || lowerMsg.includes('競爭分析')) return 'market';
      if (lowerMsg.includes('技術分析') || lowerMsg.includes('程式') || lowerMsg.includes('代碼') || lowerMsg.includes('開發')) return 'technical';
      if (lowerMsg.includes('資料分析') || lowerMsg.includes('統計') || lowerMsg.includes('數據')) return 'data';
      if (lowerMsg.includes('文獻回顧') || lowerMsg.includes('資料蒐集') || lowerMsg.includes('調研')) return 'literature';
      if (lowerMsg.includes('解釋') || lowerMsg.includes('說明') || lowerMsg.includes('教學')) return 'explanation';
      
      return 'general'; // 一般研究
    };

    // 檢測分析深度
    const detectAnalysisDepth = (message: string): string => {
      const lowerMsg = message.toLowerCase();
      
      if (lowerMsg.includes('深入') || lowerMsg.includes('詳細') || lowerMsg.includes('全面')) return 'deep';
      if (lowerMsg.includes('簡單') || lowerMsg.includes('簡要') || lowerMsg.includes('概要')) return 'simple';
      if (lowerMsg.includes('中等') || lowerMsg.includes('適中')) return 'medium';
      
      return 'medium'; // 預設中等深度
    };

    const detectedResearchType = detectResearchType(text);
    const detectedAnalysisDepth = detectAnalysisDepth(text);

    // 檢查墨墨研究設定是否有資料（現在只有主題是必填的，其他都是可選）
    const hasValidMoriSettings = () => {
      const hasSettings = (moriSettings.topic && moriSettings.topic.trim() !== '') ||
             (moriSettings.goal && moriSettings.goal.trim() !== '') ||
             (moriSettings.audience && moriSettings.audience.trim() !== '') ||
             (moriSettings.deliverable && moriSettings.deliverable.trim() !== '') ||
             (moriSettings.date_range && typeof moriSettings.date_range === 'string' && moriSettings.date_range.trim() !== '') ||
             (moriSettings.languages && moriSettings.languages.length > 0) ||
             (moriSettings.region_bias && moriSettings.region_bias.length > 0) ||
             (moriSettings.key_questions && moriSettings.key_questions.some(q => q && q.trim() !== '')) ||
             (moriSettings.seed_keywords && moriSettings.seed_keywords.some(k => k && k.kw && k.kw.trim() !== '')) ||
             (moriSettings.evidence_criteria && moriSettings.evidence_criteria.length > 0) ||
             (moriSettings.models && moriSettings.models.length > 0) ||
             (moriSettings.notes && moriSettings.notes.trim() !== '');
      
      console.log('🔍 檢查墨墨設定狀態:', {
        hasSettings,
        moriSettings,
        topic: moriSettings.topic,
        goal: moriSettings.goal,
        date_range: moriSettings.date_range,
        languages: moriSettings.languages,
        region_bias: moriSettings.region_bias
      });
      
      return hasSettings;
    };

    console.log('📋 準備發送 JSON 格式的墨墨研究資料');
    console.log('💬 用戶輸入:', text);
    console.log('🔬 研究設定:', moriSettings);

    // 準備 Mori webhook 資料 - JSON 格式
    const webhookData: any = {
      user_id: user.id,
      timestamp: new Date().toISOString(),
      session_id: currentSessionId,
      companion_id: 'mori',
      user_info: {
        name: user.full_name || '用戶',
        email: user.email || '',
        id: user.id
      },
      context: {
        previous_messages: messages.slice(-3).map(msg => ({
          content: msg.content,
          sender: msg.sender,
          timestamp: msg.timestamp.toISOString()
        })),
        conversation_id: `conv_mori_${user.id}_${Date.now()}`,
        platform: 'hanami-web',
        chat_type: 'room_companion_chat'
      },
      memory_context: {
        scope: 'room',
        role_id: 'mori-researcher',
        room_id: currentRoomId,
        should_store_memory: true,
        memory_importance: 0.8
      },
      response_preferences: {
        include_text_response: true,
        max_response_length: 500,
        format: 'detailed'
      },
      research_type: detectedResearchType,
      analysis_depth: detectedAnalysisDepth,
      // 專案資訊
      project_info: {
        project_name: room.title || null, // 專案名稱（房間標題）
        project_description: room.description || null, // 專案指引（房間描述）
        project_guidance: (room as any).guidance || null // 專案指引
      },
      // JSON 格式的研究設定資料
      research_data: {
        "0_user_input": text || null, // 用戶輸入內容
        "1_models": (moriSettings.models && moriSettings.models.length > 0) ? moriSettings.models : null, // 模型選項（必填，預設雙模型）
        "2_topic": (moriSettings.topic && moriSettings.topic.trim() !== '') ? moriSettings.topic.trim() : null, // 主題
        "3_goal": (moriSettings.goal && moriSettings.goal.trim() !== '') ? moriSettings.goal.trim() : null, // 目的
        "4_audience": (moriSettings.audience && moriSettings.audience.trim() !== '') ? moriSettings.audience.trim() : null, // 受眾
        "5_deliverable": (moriSettings.deliverable && moriSettings.deliverable.trim() !== '') ? moriSettings.deliverable.trim() : null, // 輸出
        "6_date_range": (moriSettings.date_range && typeof moriSettings.date_range === 'string' && moriSettings.date_range.trim() !== '') ? moriSettings.date_range.trim() : null, // 時間範圍
        "7_languages": (moriSettings.languages && moriSettings.languages.length > 0) ? moriSettings.languages : null, // 語言
        "8_region_bias": (moriSettings.region_bias && moriSettings.region_bias.length > 0) ? moriSettings.region_bias : null, // 地區偏好
        "9_key_questions": (moriSettings.key_questions && moriSettings.key_questions.some(q => q && q.trim() !== '')) ? moriSettings.key_questions.filter(q => q && q.trim() !== '') : null, // 關鍵問題
        "10_seed_keywords": (moriSettings.seed_keywords && moriSettings.seed_keywords.some(k => k && k.kw && k.kw.trim() !== '')) ? moriSettings.seed_keywords.filter(k => k && k.kw && k.kw.trim() !== '') : null, // 關鍵字
        "11_evidence_criteria": (moriSettings.evidence_criteria && moriSettings.evidence_criteria.length > 0) ? moriSettings.evidence_criteria : null, // 證據標準
        "12_must_cover": (moriSettings.must_cover && moriSettings.must_cover.length > 0) ? moriSettings.must_cover : null, // 必須涵蓋
        "13_must_avoid": (moriSettings.must_avoid && moriSettings.must_avoid.length > 0) ? moriSettings.must_avoid : null, // 避免
        "14_domain_allowlist": (moriSettings.domain_allowlist && moriSettings.domain_allowlist.length > 0) ? moriSettings.domain_allowlist : null, // 來源白名單
        "15_domain_blocklist": (moriSettings.domain_blocklist && moriSettings.domain_blocklist.length > 0) ? moriSettings.domain_blocklist : null, // 來源黑名單
        "16_notes": (moriSettings.notes && moriSettings.notes.trim() !== '') ? moriSettings.notes.trim() : null // 備註
      },
      has_valid_settings: hasValidMoriSettings()
    };

    console.log('📦 準備發送到 Mori webhook 的資料:', webhookData);

    try {
      const res = await fetch('/api/aimori', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookData)
      });
      
      console.log('🔍 Mori API 響應狀態:', res.status, res.statusText);
      const out = await safeJsonParse(res, 'Mori webhook');
      
      console.log('✅ Mori webhook 回應:', { status: res.status, data: out });
      
      // 處理 Mori 的回應
      if (res.ok && out.data) {
        let responseContent = '';
        
        // 處理不同格式的回應
        let tokenStats = null;
        
        if (typeof out.data === 'string') {
          try {
            const parsedData = JSON.parse(out.data);
            // 檢查是否是研究計畫 JSON 格式
            if (parsedData.topic && parsedData.goal && parsedData.key_questions) {
              responseContent = convertResearchPlanToNaturalLanguage(parsedData);
            } else {
              responseContent = parsedData.content || parsedData.text || parsedData.message || out.data;
            }
          } catch {
            responseContent = out.data;
          }
        } else if (out.data.raw !== undefined) {
          responseContent = out.data.raw;
        } else if (Array.isArray(out.data) && out.data.length > 0) {
          const firstItem = out.data[0];
          
          // 檢查新的 JSON 格式，包含 text 和 token 統計
          if (firstItem.text && typeof firstItem.text === 'string') {
            responseContent = firstItem.text;
            console.log('📝 提取到 text 內容:', responseContent.substring(0, 100) + '...');
            
            // 提取 token 統計
            if (firstItem.prompt_tokens || firstItem.completion_tokens || firstItem.total_tokens) {
              tokenStats = {
                prompt_tokens: firstItem.prompt_tokens || 0,
                completion_tokens: firstItem.completion_tokens || 0,
                total_tokens: firstItem.total_tokens || 0
              };
              console.log('🔢 Token 統計:', tokenStats);
            }
          } else {
            responseContent = firstItem.output || firstItem.content || '';
          }
        } else if (out.data.output) {
          responseContent = out.data.output;
        } else if (out.data.content) {
          responseContent = out.data.content;
        } else if (out.data.topic && out.data.goal) {
          // 直接是研究計畫 JSON 格式
          responseContent = convertResearchPlanToNaturalLanguage(out.data);
        } else {
          responseContent = '🤔 墨墨正在思考中...';
        }

        if (!responseContent || responseContent.trim() === '' || responseContent === '{}') {
          responseContent = '🦉 墨墨遇到點小困難，可以重新輸入或稍後再試。';
        }

        // 簡繁轉換
        const userLanguage = detectUserLanguage();
        if (userLanguage === 'traditional' && containsSimplifiedChinese(responseContent)) {
          responseContent = convertToTraditional(responseContent);
          console.log('🔄 已將墨墨的回應轉換為繁體中文');
        }

        const aiResponse: Message = {
          id: generateUUID(),
          content: responseContent,
          sender: 'mori',
          timestamp: new Date(),
          type: 'text',
          metadata: tokenStats ? {
            token_usage: tokenStats,
            model_info: out.data && Array.isArray(out.data) && out.data[0]?.raw ? {
              model: out.data[0].raw.model || 'unknown',
              provider: out.data[0].raw.provider || 'unknown'
            } : null
          } : undefined
        };
        
        await addMessage(aiResponse);
        console.log('✅ 墨墨回應已添加');
        
        // 如果有 token 統計，記錄到使用統計中
        if (tokenStats) {
          console.log('📊 記錄墨墨 token 使用統計:', tokenStats);
          await saveTokenUsage(aiResponse.id, {
            ...tokenStats,
            companion: 'mori',
            model: out.data && Array.isArray(out.data) && out.data[0]?.raw ? out.data[0].raw.model : 'unknown',
            provider: out.data && Array.isArray(out.data) && out.data[0]?.raw ? out.data[0].raw.provider : 'unknown'
          });
        }
        
        return { success: true, data: out };
      } else {
        // 處理錯誤回應
        const errorMessage: Message = {
          id: generateUUID(),
          content: '🦉 墨墨遇到點小困難，可以重新輸入或稍後再試。',
          sender: 'mori',
          timestamp: new Date(),
          type: 'text'
        };
        
        await addMessage(errorMessage);
        console.log('❌ Mori webhook 回應錯誤，顯示錯誤訊息');
        return { success: false, data: out };
      }
    } catch (error) {
      console.error('❌ Mori webhook 錯誤:', error);
      return { success: false, error: error };
    }
  };

  // Pico webhook 函數（從個人對話頁面複製）
  const sendToPicoWebhook = async (text: string) => {
    if (!user?.id || !text.trim()) return;

    // 智能檢測 style - 只有明確指定風格時才返回
    const detectStyle = (message: string): string => {
      const lowerMsg = message.toLowerCase();
      
      // 具體風格檢測
      if (lowerMsg.includes('kawaii') || lowerMsg.includes('可愛風') || lowerMsg.includes('萌系')) return 'kawaii';
      if (lowerMsg.includes('realistic') || lowerMsg.includes('寫實') || lowerMsg.includes('真實')) return 'realistic';
      if (lowerMsg.includes('cartoon') || lowerMsg.includes('卡通') || lowerMsg.includes('動畫風')) return 'cartoon';
      if (lowerMsg.includes('artistic') || lowerMsg.includes('藝術風') || lowerMsg.includes('繪畫風')) return 'artistic';
      if (lowerMsg.includes('minimalist') || lowerMsg.includes('簡約') || lowerMsg.includes('極簡')) return 'minimalist';
      if (lowerMsg.includes('vintage') || lowerMsg.includes('復古') || lowerMsg.includes('懷舊')) return 'vintage';
      if (lowerMsg.includes('modern') || lowerMsg.includes('現代') || lowerMsg.includes('當代')) return 'modern';
      if (lowerMsg.includes('anime') || lowerMsg.includes('動漫') || lowerMsg.includes('二次元')) return 'anime';
      if (lowerMsg.includes('watercolor') || lowerMsg.includes('水彩') || lowerMsg.includes('水墨')) return 'watercolor';
      if (lowerMsg.includes('chibi') || lowerMsg.includes('q版') || lowerMsg.includes('迷你')) return 'chibi';
      if (lowerMsg.includes('pastel') || lowerMsg.includes('粉彩') || lowerMsg.includes('淡色')) return 'pastel';
      
      return ''; // 沒有明確指定風格時返回空字串
    };
    
    // 檢測尺寸
    const detectSize = (message: string): string => {
      const lowerMsg = message.toLowerCase();
      
      // 數位尺寸檢測
      if (lowerMsg.includes('1024x1024') || lowerMsg.includes('正方形') || lowerMsg.includes('方形')) return '1024x1024';
      if (lowerMsg.includes('1024x768') || lowerMsg.includes('橫向') || lowerMsg.includes('寬屏')) return '1024x768';
      if (lowerMsg.includes('768x1024') || lowerMsg.includes('直向') || lowerMsg.includes('豎屏')) return '768x1024';
      if (lowerMsg.includes('512x512') || lowerMsg.includes('小圖') || lowerMsg.includes('小尺寸')) return '512x512';
      if (lowerMsg.includes('1920x1080') || lowerMsg.includes('全高清橫向') || lowerMsg.includes('fhd橫向')) return '1920x1080';
      if (lowerMsg.includes('1080x1920') || lowerMsg.includes('全高清直向') || lowerMsg.includes('fhd直向')) return '1080x1920';
      
      // 紙本大小檢測
      if (lowerMsg.includes('a4') || lowerMsg.includes('A4')) return 'A4';
      if (lowerMsg.includes('a3') || lowerMsg.includes('A3')) return 'A3';
      if (lowerMsg.includes('b5') || lowerMsg.includes('B5')) return 'B5';
      if (lowerMsg.includes('a5') || lowerMsg.includes('A5')) return 'A5';
      if (lowerMsg.includes('letter') || lowerMsg.includes('Letter') || lowerMsg.includes('信紙')) return 'Letter';
      
      return ''; // 沒有明確指定尺寸時返回空字串
    };
    
    // 檢測場景
    const detectScene = (message: string): boolean => {
      const lowerMsg = message.toLowerCase();
      return lowerMsg.includes('場景') || lowerMsg.includes('背景') || lowerMsg.includes('環境') || 
             lowerMsg.includes('室內') || lowerMsg.includes('戶外') || lowerMsg.includes('森林') ||
             lowerMsg.includes('海邊') || lowerMsg.includes('城市') || lowerMsg.includes('咖啡廳') ||
             lowerMsg.includes('花園') || lowerMsg.includes('星空') || lowerMsg.includes('童話');
    };

    const detectedStyle = detectStyle(text);
    const detectedSize = detectSize(text);
    const hasSceneInMessage = detectScene(text);
    console.log('🎨 檢測到的風格:', detectedStyle || '無指定（將使用預設）');
    console.log('📐 檢測到的尺寸:', detectedSize || '無指定（將使用預設）');
    console.log('🏞️ 訊息中是否包含場景:', hasSceneInMessage ? '是' : '否（將使用預設場景）');

    // 準備完整的 webhook 資料
    const webhookData: any = {
      user_id: user.id,
      final_prompt: text,
      model: 'flux-dev',
      timestamp: new Date().toISOString(),
      session_id: currentSessionId,
      companion_id: 'pico',
      user_info: {
        name: user.full_name || '用戶',
        email: user.email || '',
        id: user.id
      },
      context: {
        previous_messages: messages.slice(-3).map(msg => ({
          content: msg.content,
          sender: msg.sender,
          timestamp: msg.timestamp.toISOString()
        })),
        conversation_id: `conv_pico_${user.id}_${Date.now()}`,
        platform: 'hanami-web',
        chat_type: 'room_companion_chat'
      },
      memory_context: {
        scope: 'room',
        role_id: 'pico-artist',
        room_id: currentRoomId,
        should_store_memory: true,
        memory_importance: 0.7
      },
      response_preferences: {
        include_image: true,
        include_text_response: true,
        max_response_length: 200
      }
    };

    // 檢查皮可創作設定是否有資料
    const hasValidSettings = () => {
      const effectiveStyle = picoSettings.defaultStyle === '其他' ? picoSettings.customStyle : picoSettings.defaultStyle;
      const effectiveScene = picoSettings.defaultScene === '其他' ? picoSettings.customScene : picoSettings.defaultScene;
      const effectiveSize = picoSettings.defaultSize === '其他' ? picoSettings.customSize : picoSettings.defaultSize;
      const hasSystemPrompt = picoSettings.systemPrompt && picoSettings.systemPrompt.trim() !== '';
      
      return (effectiveStyle && effectiveStyle !== '其他' && effectiveStyle.trim() !== '') ||
             (effectiveScene && effectiveScene !== '其他' && effectiveScene.trim() !== '') ||
             (effectiveSize && effectiveSize !== '其他' && effectiveSize.trim() !== '') ||
             hasSystemPrompt;
    };

    // 構建統一的 user_prompt 格式
    let finalUserPrompt = '';
    let promptParts = [];
    
    // 1. 系統指引提示（如果有設定且有資料）
    if (hasValidSettings() && picoSettings.systemPrompt && picoSettings.systemPrompt.trim() !== '') {
      promptParts.push(`系統指引：${picoSettings.systemPrompt.trim()}`);
      console.log('📋 添加系統指引到 user_prompt');
    }
    
    // 2. 用戶輸入
    promptParts.push(`用戶需求：${text}`);
    console.log('💬 添加用戶輸入到 user_prompt');
    
    // 3. 預設場景背景（如果有設定且用戶沒明確指定）
    if (hasValidSettings() && !hasSceneInMessage) {
      const effectiveScene = picoSettings.defaultScene === '其他' ? picoSettings.customScene : picoSettings.defaultScene;
      if (effectiveScene && effectiveScene !== '其他' && effectiveScene.trim() !== '') {
        promptParts.push(`場景背景：${effectiveScene}`);
        console.log('🏞️ 添加預設場景到 user_prompt:', effectiveScene);
      }
    }
    
    // 4. 預設繪圖風格（如果有設定且用戶沒明確指定）
    if (hasValidSettings() && !detectedStyle) {
      const effectiveStyle = picoSettings.defaultStyle === '其他' ? picoSettings.customStyle : picoSettings.defaultStyle;
      if (effectiveStyle && effectiveStyle !== '其他' && effectiveStyle.trim() !== '') {
        promptParts.push(`繪圖風格：${effectiveStyle}`);
        console.log('🎨 添加預設風格到 user_prompt:', effectiveStyle);
      }
    }
    
    // 5. 預設圖片尺寸（如果有設定且用戶沒明確指定）
    if (hasValidSettings() && !detectedSize) {
      const effectiveSize = picoSettings.defaultSize === '其他' ? picoSettings.customSize : picoSettings.defaultSize;
      if (effectiveSize && effectiveSize !== '其他' && effectiveSize.trim() !== '') {
        promptParts.push(`圖片尺寸：${effectiveSize}`);
        console.log('📏 添加預設尺寸到 user_prompt:', effectiveSize);
      }
    }
    
    // 組合最終的 user_prompt
    finalUserPrompt = promptParts.join('\n\n');
    
    // 更新 webhook 資料使用統一的 user_prompt 格式
    webhookData.user_prompt = finalUserPrompt;
    webhookData.final_prompt = finalUserPrompt; // 保持向後兼容
    
    // 如果用戶有明確指定參數，仍然添加到 webhook 參數中
    if (detectedStyle) {
      webhookData.style = detectedStyle;
      console.log('✨ 用戶明確指定風格，添加到 webhook 參數:', detectedStyle);
    } else if (hasValidSettings()) {
      const effectiveStyle = picoSettings.defaultStyle === '其他' ? picoSettings.customStyle : picoSettings.defaultStyle;
      if (effectiveStyle && effectiveStyle !== '其他' && effectiveStyle.trim() !== '') {
        webhookData.style = effectiveStyle;
        console.log('🎨 使用皮可預設風格參數:', effectiveStyle);
      }
    }
    
    if (detectedSize) {
      webhookData.size = detectedSize;
      console.log('📐 用戶明確指定尺寸，添加到 webhook 參數:', detectedSize);
    } else if (hasValidSettings()) {
      const effectiveSize = picoSettings.defaultSize === '其他' ? picoSettings.customSize : picoSettings.defaultSize;
      if (effectiveSize && effectiveSize !== '其他' && effectiveSize.trim() !== '') {
        webhookData.size = effectiveSize;
        console.log('📏 使用皮可預設尺寸參數:', effectiveSize);
      }
    }
    
    console.log('📝 最終 user_prompt:', finalUserPrompt);
    console.log(hasValidSettings() ? '✅ 皮可創作設定已合併' : '📭 皮可創作設定為空，使用純用戶輸入');

    console.log('📦 準備發送的完整 webhook 資料:', webhookData);

    try {
      const res = await fetch('/aihome/api/aipico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookData)
      });
      
      console.log('🔍 API 響應狀態:', res.status, res.statusText);
      
      // 檢查響應內容類型和長度
      const contentType = res.headers.get('content-type');
      const contentLength = res.headers.get('content-length');
      console.log('🔍 響應標頭:', { contentType, contentLength });
      
      const out = await safeJsonParse(res, 'Pico webhook');
      
      console.log('✅ 聊天室 webhook 回應:', { status: res.status, data: out });
      
      // 處理 n8n 的回應並顯示給用戶
      if (res.ok) {
        let responseContent = '';
        let messageType: 'text' | 'image' = 'text';
        let imageUrl = '';
        let tokenUsage = null; // 移到函數開始處
        
        console.log('🔍 分析聊天室 webhook 回應結構:', out);
        console.log('🔍 out.data 內容:', out.data);
        console.log('🔍 out.data 類型:', typeof out.data);
        
        // 檢查不同的回應格式
        if (out.data) {
          let rawResponse = '';
          
          // 首先嘗試解析 JSON 字串格式的回應
          if (typeof out.data === 'string') {
            try {
              const parsedData = JSON.parse(out.data);
              console.log('📝 解析 JSON 字串格式:', parsedData);
              
              if (parsedData.image_url) {
                imageUrl = parsedData.image_url;
                responseContent = '🎨 我為您創作完成了！太可愛了！';
                messageType = 'image';
                console.log('✅ 從 JSON 提取圖片 URL:', imageUrl);
              } else if (parsedData.content || parsedData.text || parsedData.message) {
                // 處理 JSON 中的文字回應
                rawResponse = parsedData.content || parsedData.text || parsedData.message;
                console.log('📝 從 JSON 提取文字回應:', rawResponse);
              }
              
              // 提取 token 使用量
              if (parsedData.prompt_tokens || parsedData.completion_tokens || parsedData.total_tokens) {
                tokenUsage = {
                  model: parsedData.model || 'unknown',
                  prompt_tokens: parsedData.prompt_tokens || 0,
                  completion_tokens: parsedData.completion_tokens || 0,
                  total_tokens: parsedData.total_tokens || 0
                };
                console.log('📊 提取 token 使用量:', tokenUsage);
              }
              
            } catch (parseError) {
              // 如果不是 JSON，當作普通字串處理
              rawResponse = out.data;
              console.log('📝 從字串格式提取回應:', rawResponse);
            }
          } else if (out.data.image_url) {
            // 直接有 image_url 屬性
            imageUrl = out.data.image_url;
            responseContent = '🎨 我為您創作完成了！太可愛了！';
            messageType = 'image';
            console.log('✅ 從物件提取圖片 URL:', imageUrl);
            
            // 提取 token 使用量
            if (out.data.prompt_tokens || out.data.completion_tokens || out.data.total_tokens) {
              tokenUsage = {
                model: out.data.model || 'unknown',
                prompt_tokens: out.data.prompt_tokens || 0,
                completion_tokens: out.data.completion_tokens || 0,
                total_tokens: out.data.total_tokens || 0
              };
              console.log('📊 提取 token 使用量:', tokenUsage);
            }
          } else if (out.data.raw !== undefined) {
            rawResponse = out.data.raw;
            console.log('📝 從 raw 屬性提取回應:', rawResponse);
            if (!rawResponse || rawResponse.trim() === '') {
              console.warn('⚠️ raw 回應是空字串');
            }
          } else if (Array.isArray(out.data) && out.data.length > 0) {
            // 處理陣列格式的回應
            const firstItem = out.data[0];
            if (firstItem && firstItem.output) {
              rawResponse = firstItem.output;
              console.log('📝 從陣列格式提取文字回應:', rawResponse);
            }
          } else if (out.data.output) {
            // 處理直接有 output 屬性的回應
            rawResponse = out.data.output;
            console.log('📝 從 output 屬性提取文字回應:', rawResponse);
          } else if (out.data.data && out.data.data.output) {
            // 處理巢狀格式的回應 (data.data.output)
            rawResponse = out.data.data.output;
            console.log('📝 從巢狀 data.data.output 提取文字回應:', rawResponse);
          } else {
            // 調試：顯示 out.data 的所有屬性
            console.log('🔍 out.data 的所有屬性:', Object.keys(out.data));
            console.log('🔍 完整的 out.data 物件:', JSON.stringify(out.data, null, 2));
          }
          
          // 簡繁轉換處理
          if (rawResponse) {
            console.log('🔍 原始回應內容:', rawResponse);
            
            // 檢查用戶的訊息是否使用繁體中文（檢查最近3條訊息）
            const recentUserMessages = messages.filter(msg => msg.sender === 'user').slice(-3);
            const isUserUsingTraditional = recentUserMessages.some(msg => containsTraditionalChinese(msg.content));
            
            console.log('🔍 檢查用戶語言偏好:');
            console.log('📝 最近用戶訊息:', recentUserMessages.map(msg => msg.content));
            console.log('🌏 用戶是否使用繁體中文:', isUserUsingTraditional);
            
            // 檢查回應是否包含簡體中文
            const containsSimplified = containsSimplifiedChinese(rawResponse);
            console.log('🔍 回應是否包含簡體中文:', containsSimplified);
            
            // 如果用戶使用繁體，但回應是簡體，則轉換為繁體
            if (isUserUsingTraditional && containsSimplified) {
              rawResponse = convertToTraditional(rawResponse);
              console.log('🔄 已轉換為繁體中文:', rawResponse);
            } else {
              console.log('🔍 不需要轉換:', { isUserUsingTraditional, containsSimplified });
            }
            
            // 檢查是否包含 iframe
            if (rawResponse.includes('<iframe') && rawResponse.includes('https://')) {
              // 從 iframe srcdoc 中提取圖片 URL
              const urlMatch = rawResponse.match(/https:\/\/[^\s"<>]+\.(?:png|jpg|jpeg|webp|gif)/i);
              if (urlMatch) {
                imageUrl = urlMatch[0];
                responseContent = `🎨 我為您創作完成了！太可愛了！`;
                messageType = 'image';
                console.log('✅ 從 iframe 提取圖片 URL:', imageUrl);
              } else {
                responseContent = '🎨 創作完成！但圖片連結解析失敗。';
                console.error('❌ 無法從 iframe 提取圖片 URL');
              }
            } else if (rawResponse.includes('http') && (rawResponse.includes('.png') || rawResponse.includes('.jpg') || rawResponse.includes('.webp'))) {
              // 直接是圖片 URL
              imageUrl = rawResponse.trim();
              responseContent = `🎨 我為您創作完成了！太可愛了！`;
              messageType = 'image';
              console.log('✅ 直接圖片 URL:', imageUrl);
            } else {
              responseContent = rawResponse;
              console.log('📝 文字回應:', rawResponse);
            }
          }
        }
        
        console.log('🔍 最終 responseContent:', responseContent);
        console.log('🔍 最終 imageUrl:', imageUrl);
        console.log('🔍 最終 tokenUsage:', tokenUsage);
        
        // 如果沒有找到明確的回應，使用預設訊息
        if (!responseContent) {
          if (out.data && Object.keys(out.data).length === 0) {
            responseContent = getCompanionErrorMessage('pico');
            console.warn('⚠️ 收到空的回應物件');
          } else if (out.data && out.data.raw === '') {
            responseContent = getCompanionErrorMessage('pico');
            console.warn('⚠️ n8n 回傳空字串');
          } else {
            responseContent = '🎨 我收到您的請求了！正在發揮創意為您創作...';
          }
        }
        
        // 如果有圖片，添加圖片 URL 到內容
        if (imageUrl) {
          responseContent += `\n\n![創作作品](${imageUrl})`;
        }
        
        // 創建 AI 回應訊息
        const aiResponse: Message = {
          id: generateUUID(), // 使用兼容的 UUID 格式
          content: responseContent,
          sender: 'pico',
          timestamp: new Date(),
          type: messageType
        };
        
        // 添加到訊息列表並保存到資料庫
        await addMessage(aiResponse);
        console.log('🎨 聊天室中已添加 Pico 的回應:', aiResponse);
        
        // 記錄 token 使用量到 ai_usage 表
        if (tokenUsage) {
          await saveTokenUsage(aiResponse.id, tokenUsage);
        }
        
        return { success: true, data: out };
      } else {
        // 處理錯誤回應
        const errorMessage: Message = {
          id: generateUUID(),
          content: getCompanionErrorMessage('pico'),
          sender: 'pico',
          timestamp: new Date(),
          type: 'text'
        };
        
        await addMessage(errorMessage);
        console.log('❌ Webhook 回應錯誤，顯示錯誤訊息');
        return { success: false, data: out };
      }
    } catch (error) {
      console.error('❌ 聊天室 webhook 錯誤:', error);
      // 不拋出異常，返回錯誤狀態讓上層處理
      return { success: false, error: error };
    }
  };

  // 通用的添加訊息函數（自動保存到資料庫）
  const addMessage = async (message: Message | Omit<Message, 'id' | 'timestamp'>) => {
    // 如果沒有 ID 或時間戳，自動生成
    const completeMessage: Message = {
      id: (message as Message).id || generateUUID(),
      timestamp: (message as Message).timestamp || new Date(),
      ...message
    } as Message;

    setMessages(prev => [...prev, completeMessage]);
    await saveMessageToSupabase(completeMessage);
    console.log('📝 已添加並保存訊息:', completeMessage.content.substring(0, 50) + '...');
  };

  // 便捷的系統訊息添加函數
  const addSystemMessage = async (content: string) => {
    await addMessage({
      content,
      sender: 'system',
      type: 'text'
    });
  };

  // 便捷的 AI 角色訊息添加函數
  const addAIMessage = async (content: string, sender: 'hibi' | 'mori' | 'pico', type: 'text' | 'image' = 'text') => {
    await addMessage({
      content,
      sender,
      type
    });
  };

  // 生成角色特色的錯誤訊息
  const getCompanionErrorMessage = (companionId: 'hibi' | 'mori' | 'pico'): string => {
    const errorMessages = {
      hibi: '🦊 Hibi 遇到點小困難，可以重新輸入或稍後再試。',
      mori: '🦉 墨墨遇到點小困難，可以重新輸入或稍後再試。',
      pico: '🎨 皮可遇到點小困難，可以重新輸入或稍後再試。'
    };
    return errorMessages[companionId];
  };

  // 保存 token 使用量到 ai_usage 表
  const saveTokenUsage = async (messageId: string, tokenData: any) => {
    if (!user?.id) {
      console.warn('⚠️ 無用戶 ID，跳過使用量記錄');
      return;
    }

    try {
      console.log('📊 保存 token 使用量:', tokenData);
      
      const usageData = {
        room_id: roomId,
        session_id: currentSessionId,
        message_id: messageId,
        user_id: user.id,
        provider: 'gemini', // 根據您的回應，這是 Gemini 模型
        model: tokenData.model || 'gemini-pro',
        input_tokens: tokenData.prompt_tokens || 0,
        output_tokens: tokenData.completion_tokens || 0,
        // 移除 total_tokens，讓資料庫自動計算
        image_count: 1, // 生成了一張圖片
        request_data: {
          companion: 'pico',
          request_type: 'image_generation'
        },
        response_data: tokenData
      };

      const { data, error } = await (saasSupabase
        .from('ai_usage') as any)
        .insert(usageData)
        .select();

      if (error) {
        console.error('❌ 保存使用量失敗:', error);
      } else {
        console.log('✅ 使用量已記錄到 ai_usage 表:', data);
      }
    } catch (error) {
      console.error('❌ 保存使用量錯誤:', error);
    }
  };

  // 儲存訊息到 Supabase
  const saveMessageToSupabase = async (message: Message, targetRoomId?: string) => {
    if (!user?.id) {
      console.warn('⚠️ 無用戶 ID，跳過訊息儲存');
      return;
    }

    // 記錄訊息類型統計
    const messageTypeMap = {
      'user': '👤 用戶訊息',
      'hibi': '🦊 Hibi 訊息',
      'mori': '🦉 墨墨訊息', 
      'pico': '🦦 皮可訊息',
      'system': '⚙️ 系統訊息'
    };
    console.log(`💾 保存 ${messageTypeMap[message.sender as keyof typeof messageTypeMap] || message.sender}:`, message.content.substring(0, 30) + '...');

    try {
      const roomIdToUse = targetRoomId || currentRoomId || roomId;
      console.log('🔍 準備儲存訊息到房間:', roomIdToUse);
      
      const messageData = {
        room_id: roomIdToUse,
        session_id: currentSessionId,
        sender_type: message.sender === 'user' ? 'user' : 'role',
        sender_user_id: message.sender === 'user' ? user.id : null,
        sender_role_instance_id: null, // 暫時設為 null，因為我們沒有真正的角色實例 ID
        content: message.content,
        content_json: message.metadata ? { ...message.metadata, role_name: message.sender } : { role_name: message.sender },
        status: 'sent'
      };

      console.log('🔍 準備儲存的訊息資料:', messageData);

      const { data, error } = await (saasSupabase
        .from('ai_messages') as any)
        .insert(messageData)
        .select();

      if (error) {
        console.error('❌ 儲存訊息失敗:', error);
        console.error('❌ 錯誤詳情:', JSON.stringify(error, null, 2));
      } else {
        console.log('✅ 訊息已儲存到 Supabase:', data);
      }
    } catch (error) {
      console.error('❌ 儲存訊息錯誤:', error);
    }
  };

  // 發送訊息處理函數 - 持久化版本
  const handleSendMessage = async () => {
    console.log('🚀 [持久化版] handleSendMessage 被呼叫');
    
    // ⭐ 驗證輸入（先驗證，避免無效內容也加鎖）
    if (!inputMessage.trim() || isLoading || !user?.id) {
      console.warn('⚠️ [發送] 輸入無效，忽略請求');
      return;
    }
    
    let messageContent = inputMessage.trim();
    const roleHint = selectedCompanion || (activeRoles[0] ?? 'auto');
    
    // ⭐ 如果是 Pico 且有選擇 size 或 style，則合併到訊息中
    if (roleHint === 'pico') {
      const additionalInfo = [];
      if (picoImageSize) {
        additionalInfo.push(`尺寸：${picoImageSize}`);
      }
      if (picoImageStyle) {
        additionalInfo.push(`風格：${picoImageStyle}`);
      }
      if (additionalInfo.length > 0) {
        messageContent = `${messageContent}\n\n【圖片設定】\n${additionalInfo.join('、')}`;
        console.log('🎨 [Pico] 添加圖片設定:', messageContent);
      }
    }
    
    const lockKey = `${roomId}-${messageContent}`;  // 使用房間ID + 內容作為鎖鍵
    
    // ⭐ 第一步：檢查全局鎖（防止 React Strict Mode 雙重掛載）
    if (globalSendingLock.get(lockKey)) {
      console.warn('⚠️ [發送] 全局鎖：正在發送中，忽略重複請求');
      return;
    }
    
    // ⭐ 第二步：立即加全局鎖（跨組件實例有效）
    globalSendingLock.set(lockKey, true);
    isSendingRef.current = true;
    setIsSending(true);
    console.log('🔒 [發送] 已加全局鎖，鎖鍵:', lockKey);
    
    // ⭐ 立即顯示用戶訊息（不等待 API 響應）
    const tempMessageId = generateUUID();
    const userMessage: Message = {
      id: tempMessageId,
      content: messageContent,
      sender: 'user',
      timestamp: new Date(),
      type: 'text' as const,
      status: 'processing'
    };
    
    // 立即添加到 UI
    setMessages(prev => {
      const newMessages = [...prev, userMessage];
      console.log('📨 [即時] 立即添加用戶訊息到 UI:', userMessage);
      console.log('📨 [即時] 更新後的訊息列表:', newMessages.length, '條訊息');
      console.log('📨 [即時] 完整新訊息列表:', newMessages);
      return newMessages;
    });
    
    // ⭐ 將臨時訊息 ID 添加到全局追蹤，防止重複
    processedMessageIds.current.add(tempMessageId);
    console.log('📨 [即時] 已添加臨時訊息 ID 到全局追蹤:', tempMessageId);
    
    // ⭐ 不觸發重新渲染，讓 React 自然更新訊息列表
    
    // 清空輸入框
    setInputMessage('');
    setIsLoading(true);
    setIsTyping(true);
    
    try {
      // === 使用 API 路由發送訊息 ===
      console.log('📦 [API] 開始發送訊息到 API 路由...');

      // === 載入角色設定資訊 ===
      console.log('🔍 [角色設定] 開始載入角色設定...');
      
      // 載入當前選擇的角色設定
      const selectedRoleData = await loadRoleSettings(selectedCompanion, user.id);
      console.log('✅ [角色設定] 選擇的角色設定:', selectedRoleData);
      
      // 載入專案資訊
      const projectInfo = {
        title: room.title,
        description: room.description,
        guidance: (room as any).guidance || room.description
      };
      console.log('✅ [專案資訊] 專案資訊:', projectInfo);
      
      // 載入群組角色設定
      const groupRoles = await loadGroupRoles(activeRoles, user.id);
      console.log('✅ [群組角色] 群組角色設定:', groupRoles);

      // === 使用 API 路由發送 ===
      console.log('🚀 [API] 準備發送訊息:', {
        threadId: roomId,
        userId: user.id,
        content: messageContent,
        roleHint,
        selectedRole: selectedRoleData,
        projectInfo: projectInfo,
        groupRoles: groupRoles
      });
      
      console.log('🔍 [API] 用戶資訊檢查:', {
        user: !!user,
        userId: user?.id,
        userEmail: user?.email,
        roomId: roomId,
        messageContent: messageContent,
        messageContentLength: messageContent?.length
      });
      
      // 檢查必要參數
      if (!user?.id) {
        console.error('❌ [API] 用戶 ID 為空');
        const { default: toast } = await import('react-hot-toast');
        toast.error('用戶未登入');
        return;
      }
      
      if (!roomId) {
        console.error('❌ [API] 房間 ID 為空');
        const { default: toast } = await import('react-hot-toast');
        toast.error('房間 ID 無效');
        return;
      }
      
      if (!messageContent) {
        console.error('❌ [API] 訊息內容為空');
        const { default: toast } = await import('react-hot-toast');
        toast.error('訊息內容不能為空');
        return;
      }
      
      console.log('🚀 [Fetch] 準備發送 fetch 請求...');
      console.log('📦 [Fetch] 請求參數:', {
        threadId: roomId,
        userId: user.id,
        content: messageContent,
        roleHint,
        selectedRole: selectedRoleData,
        projectInfo: projectInfo,
        groupRoles: groupRoles
      });
      
      // 添加超時控制
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超時
      
      const response = await fetch('/api/ai-companions/send-message-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          threadId: roomId,
          userId: user.id,
          content: messageContent,
          roleHint,
          selectedRole: selectedRoleData,  // 新增：選擇的角色設定
          projectInfo: projectInfo,        // 新增：專案資訊
          groupRoles: groupRoles           // 新增：群組角色列表
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      console.log('📡 [API] HTTP 響應狀態:', response.status, response.statusText);
      console.log('📡 [API] 響應頭:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        console.error('❌ [API] HTTP 錯誤:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('❌ [API] 錯誤詳情:', errorText);
        const { default: toast } = await import('react-hot-toast');
        toast.error(`發送失敗: ${response.status} ${response.statusText}`);
        return;
      }
      
      console.log('🔍 [API] 準備解析 JSON...');
      const result = await response.json();
      console.log('📤 [API] 發送結果:', result);
      console.log('📤 [API] 結果類型:', typeof result);
      console.log('📤 [API] 結果內容:', JSON.stringify(result));

      // ⭐ 更新用戶訊息狀態（使用真實的 messageId）
      console.log('✅ 訊息已持久化:', result.messageId);
      
      // 更新已顯示的用戶訊息狀態
      setMessages(prev => {
        return prev.map(msg => {
          if (msg.id === tempMessageId) {
            return {
              ...msg,
              id: result.messageId, // 使用真實的 ID
              // ⭐ 保持 processing 狀態，等待 AI 回應完成後才改為 completed
              status: result.success ? 'processing' : 'error'
            };
          }
          return msg;
        });
      });
      
      // ⭐ 更新全局追蹤：移除臨時 ID，添加真實 ID
      processedMessageIds.current.delete(tempMessageId);
      processedMessageIds.current.add(result.messageId);
      console.log('📨 [即時] 已更新全局追蹤：移除臨時 ID，添加真實 ID:', tempMessageId, '->', result.messageId);
      
      // ⭐ 不觸發重新渲染，讓 React 自然更新訊息狀態
      
      // ⭐ 如果 n8n 失敗，顯示警告但不阻止 UI 更新
      if (!result.success) {
        console.warn('⚠️ n8n 工作流失敗，但用戶訊息已顯示:', result.error);
        const { default: toast } = await import('react-hot-toast');
        toast.error('AI 回應可能延遲，但您的訊息已發送');
      }
      
      // ⭐ 檢查是否是重複請求錯誤（n8n 返回 success:true 但有 error）
      if (result.success && result.ingressResponse?.error === '重複請求') {
        console.warn('⚠️ n8n 檢測到重複請求，這通常意味著訊息已在處理中');
        const { default: toast } = await import('react-hot-toast');
        toast('訊息已發送，正在等待 AI 回應...', { icon: '⏳' });
      }
        
        
             // ⭐ Realtime 會自動檢測並顯示 AI 回應，無需手動觸發檢查
             console.log('✅ [發送] 訊息已發送，等待 Realtime 推送 AI 回應...');

      } catch (error) {
      console.error('❌ 發送訊息錯誤:', error);
      console.error('❌ 錯誤詳情:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // 更新用戶訊息狀態為錯誤
      setMessages(prev => {
        return prev.map(msg => {
          if (msg.id === tempMessageId) {
            return {
              ...msg,
              status: 'error'
            };
          }
          return msg;
        });
      });
      
      // ⭐ 更新全局追蹤：移除臨時 ID（錯誤情況下保持臨時 ID）
      processedMessageIds.current.delete(tempMessageId);
      console.log('📨 [即時] 錯誤情況下已移除臨時 ID 從全局追蹤:', tempMessageId);
      
      // ⭐ 不觸發重新渲染，讓 React 自然更新訊息狀態
      
      const { default: toast } = await import('react-hot-toast');
      if (error instanceof Error && error.name === 'AbortError') {
        toast.error('請求超時，請重試');
    } else {
        toast.error('發送失敗，請重試');
      }
    } finally {
      // ⭐ 不解鎖思考 UI，讓它在 AI 回應完成後自然消失
      // setIsLoading(false);
      // setIsTyping(false);
      
      // ⭐ 解鎖（延遲 1 秒，確保 API 完成）
      setTimeout(() => {
        const lockKey = `${roomId}-${messageContent}`;
        globalSendingLock.delete(lockKey);  // 釋放全局鎖
        isSendingRef.current = false;
        setIsSending(false);
        console.log('🔓 [發送] 已解鎖全局鎖，鎖鍵:', lockKey);
        
        // ⭐ 清除 Pico 選項（發送後重置，但保留在 localStorage 中供下次使用）
        // 注意：這裡不清除選項，讓用戶下次使用時可以直接使用相同的設定
        // 如果需要清除，用戶可以手動點擊清除按鈕
      }, 1000);
    }
  };

  // 模擬 AI 回應
  const simulateAIResponse = async (userMessage: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    let responseContent = '';
    let sender: any = selectedCompanion || activeRoles[0] || 'hibi';
    
    if (sender === 'hibi') {
      responseContent = `我了解您的需求。讓我為您統籌安排最適合的團隊成員來處理這個任務。`;
    } else if (sender === 'mori') {
      responseContent = `這是一個很有趣的問題！讓我為您研究分析一下...`;
    } else {
      responseContent = `我會努力協助您完成這個任務！`;
    }
    
    const aiResponse: Message = {
      id: generateUUID(),
      content: responseContent,
      sender: sender,
      timestamp: new Date(),
      type: 'text'
    };
    
    await addMessage(aiResponse);
  };

  // 刪除單個訊息（使用軟刪除）
  const handleDeleteMessage = async (messageId: string) => {
    const isConfirmed = window.confirm('確定要刪除這條訊息嗎？');
    
    if (!isConfirmed) return;

    try {
      console.log('🗑️ 刪除單個訊息:', messageId);
      
      // 先嘗試使用安全刪除 API
      try {
        const response = await fetch('/api/safe-delete-message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ messageId }),
        });
        
        const result = await response.json();
        
        if (result.success) {
          console.log('✅ 通過 API 刪除成功:', result);
          
          // 從前端訊息列表中移除
          setMessages(prev => prev.filter(msg => msg.id !== messageId));
          
          // 觸發選擇性重新渲染 - 刪除訊息
          triggerSelectiveRender('刪除訊息');
          return;
        } else {
          console.error('❌ API 刪除失敗:', result);
          throw new Error(result.error || 'API 刪除失敗');
        }
      } catch (apiError) {
        console.warn('⚠️ API 刪除失敗，嘗試直接 Supabase 操作:', apiError);
        
        // 回退到直接 Supabase 操作
      const { error } = await (saasSupabase as any)
          .from('chat_messages')
          .update({ 
            status: 'deleted',
            updated_at: new Date().toISOString()
          })
        .eq('id', messageId);

      if (error) {
          console.error('❌ 軟刪除訊息失敗:', error);
          alert(`刪除訊息失敗: ${error.message || error}\n\n錯誤代碼: ${error.code}\n詳細資訊: ${JSON.stringify(error, null, 2)}`);
        return;
      }
        
        console.log('✅ 訊息已標記為刪除');

      // 從前端訊息列表中移除
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
        
        // 觸發選擇性重新渲染 - 刪除訊息
        triggerSelectiveRender('刪除訊息');
      }
      
    } catch (error) {
      console.error('❌ 刪除訊息錯誤:', error);
      alert(`刪除訊息時發生錯誤: ${error instanceof Error ? error.message : '未知錯誤'}\n\n請檢查控制台獲取詳細資訊。`);
    }
  };

  // 搜尋對話內容
  const handleSearchMessages = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setCurrentSearchIndex(-1);
      return;
    }

    console.log('🔍 搜尋對話內容:', searchQuery);

    // 在所有訊息中搜尋包含關鍵字的內容
    const results = messages.filter(msg => {
      // 只搜尋非刪除的訊息
      if ((msg as any).status === 'deleted') return false;
      
      // 搜尋內容（不分大小寫）
      const content = msg.content?.toLowerCase() || '';
      const query = searchQuery.toLowerCase();
      
      return content.includes(query);
    });

    console.log('🔍 找到', results.length, '條符合的訊息');
    setSearchResults(results);
    setCurrentSearchIndex(results.length > 0 ? 0 : -1);
    
    // 自動滾動到第一個結果
    if (results.length > 0) {
      scrollToMessage(results[0].id);
    }
  };

  // 滾動到指定訊息
  const scrollToMessage = (messageId: string) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      
      // 高亮顯示訊息
      messageElement.classList.add('highlight-search-result');
      setTimeout(() => {
        messageElement.classList.remove('highlight-search-result');
      }, 2000);
    }
  };

  // 導航到下一個搜尋結果
  const navigateSearchNext = () => {
    if (searchResults.length === 0 || currentSearchIndex === -1) return;
    
    const nextIndex = (currentSearchIndex + 1) % searchResults.length;
    setCurrentSearchIndex(nextIndex);
    scrollToMessage(searchResults[nextIndex].id);
  };

  // 導航到上一個搜尋結果
  const navigateSearchPrev = () => {
    if (searchResults.length === 0 || currentSearchIndex === -1) return;
    
    const prevIndex = currentSearchIndex === 0 ? searchResults.length - 1 : currentSearchIndex - 1;
    setCurrentSearchIndex(prevIndex);
    scrollToMessage(searchResults[prevIndex].id);
  };

  // 清除歷史訊息
  const handleClearHistory = async () => {
    const isConfirmed = window.confirm('確定要清除所有歷史訊息嗎？此操作無法復原。');
    
    if (!isConfirmed) return;

    try {
      console.log('🗑️ 開始清除房間歷史訊息:', roomId);
      
      // 從資料庫刪除該房間的所有訊息 (使用正確的表名和欄位名)
      const { error } = await saasSupabase
        .from('chat_messages')
        .delete()
        .eq('thread_id', roomId);

      if (error) {
        console.error('❌ 清除歷史訊息失敗:', error);
        alert('清除歷史訊息失敗，請稍後再試。');
        return;
      }

      // 清除前端訊息列表
      setMessages([]);
      setHasLoadedHistory(false); // 重置歷史載入狀態，允許重新顯示歡迎訊息
      console.log('✅ 歷史訊息已從資料庫清除');
      
      // 顯示成功提示
      alert('歷史訊息已成功清除！');
      
    } catch (error) {
      console.error('❌ 清除歷史訊息錯誤:', error);
      alert('清除歷史訊息時發生錯誤，請稍後再試。');
    }
  };

  const generateAIResponse = (userMessage: string, targetCompanion: 'hibi' | 'mori' | 'pico'): Message => {
    // 如果是個人對話模式，強制使用該角色
    if (companionParam) {
      targetCompanion = companionParam as 'hibi' | 'mori' | 'pico';
    }
    const isTaskRequest = userMessage.includes('任務') || userMessage.includes('幫我') || userMessage.includes('協助');
    
    if (isTaskRequest && targetCompanion === 'hibi') {
      // 協作任務交由 hibi 統籌
      const newTask: Task = {
        id: generateUUID(),
        title: `協作任務：${userMessage.slice(0, 20)}...`,
        description: userMessage,
        assignedTo: 'hibi',
        status: 'pending',
        progress: 0,
        createdAt: new Date()
      };
      setTasks(prev => [...prev, newTask]);
      return {
        id: generateUUID(),
        content: `收到任務需求！我會統籌安排：墨墨負責研究分析，皮可負責創意設計，我來協調整體進度。讓我們開始協作吧！`,
        sender: 'hibi',
        timestamp: new Date(),
        type: 'task_created',
        taskId: newTask.id
      };
    }

    const responses = {
      hibi: [
        '我來分析這個需求並安排最適合的團隊成員協助您。',
        '讓我統籌一下，看看如何最有效地完成這個任務。',
        '我會協調墨墨和皮可，為您提供最佳的解決方案。',
        '作為總管，我會確保任務順利完成並達到最佳效果。'
      ],
      mori: [
        '我來分析一下這個問題...',
        '根據我的研究，這個議題需要深入探討。',
        '讓我為您提供一些專業的建議。',
        '我會仔細研究並給您詳細的回覆。'
      ],
      pico: [
        '這聽起來很有趣！讓我發揮創意來幫助您。',
        '我有一些創意想法可以分享！',
        '讓我們用藝術的角度來看這個問題。',
        '我可以為您設計一些視覺化的解決方案。'
      ]
    };

    const companionResponses = responses[targetCompanion as keyof typeof responses] || responses.hibi;
    const randomResponse = companionResponses[Math.floor(Math.random() * companionResponses.length)];

    return {
      id: generateUUID(),
      content: randomResponse,
      sender: targetCompanion as 'hibi' | 'mori' | 'pico',
      timestamp: new Date(),
      type: 'text'
    };
  };

  const getCompanionInfo = (companionId: 'hibi' | 'mori' | 'pico' | 'system') => {
    if (companionId === 'system') {
      return {
        name: '系統',
        imagePath: '/@hanami.png',
        color: 'from-gray-400 to-gray-600'
      };
    }
    return companions.find(c => c.id === companionId);
  };


  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#F8F5EC]">
      {/* 頂部導航欄 */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-[#EADBC8] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              {/* 返回按鈕 */}
              <motion.button
                onClick={() => router.back()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg hover:bg-[#FFD59A]/20 transition-colors"
              >
                <ArrowLeftIcon className="w-6 h-6 text-[#4B4036]" />
              </motion.button>

              {/* 選單按鈕 */}
              <motion.button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg hover:bg-[#FFD59A]/20 transition-colors relative z-40"
              >
                <Bars3Icon className="w-6 h-6 text-[#4B4036]" />
              </motion.button>
              
              <div className="w-10 h-10 relative">
                <Image
                  src="/@hanami.png"
                  alt="HanamiEcho Logo"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#4B4036]">{room.title}</h1>
                <p className="text-sm text-[#2B3A3B]">
                  {companionParam 
                    ? `🎯 與 ${companions.find(c => c.id === companionParam)?.name} 一對一對話`
                    : '與 AI 助手協作'
                  }
                </p>
              </div>
            </div>

            {/* 團隊成員顯示 - 響應式設計 */}
            {/* 桌面版：顯示完整的團隊成員 */}
            <div className="hidden md:flex items-center space-x-3">
              <span className="text-sm font-medium text-[#2B3A3B]">團隊成員:</span>
              <div className="flex items-center space-x-2">
                {activeRoles.map((companionId) => {
                  const companion = companions.find(c => c.id === companionId);
                  return (
                    <motion.div
                      key={companionId}
                      whileHover={{ scale: 1.1, y: -2 }}
                      animate={{ y: [0, -2, 0] }}
                      transition={{ 
                        y: { duration: 2, repeat: Infinity, delay: companions.findIndex(c => c.id === companionId) * 0.3 }
                      }}
                      className="relative group"
                    >
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${companion?.color} p-0.5 shadow-lg`}>
                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                          <Image
                            src={companion?.imagePath || ''}
                            alt={companion?.name || ''}
                            width={32}
                            height={32}
                            className="w-8 h-8 object-cover"
                          />
                        </div>
                      </div>
                      
                      {/* 在線狀態指示器 */}
                      <motion.div
                        animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full shadow-sm"
                      />
                      
                      {/* 角色專業圖標 */}
                      <motion.div
                        animate={{ rotate: companion?.id === 'hibi' ? 360 : 0 }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center shadow-md"
                      >
                        {companion && <companion.icon className="w-3 h-3 text-white" />}
                      </motion.div>
                      
                      
                      {/* 角色名稱提示 */}
                      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/75 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {companion?.name}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              
              {/* 邀請 AI 角色按鈕 */}
              {activeRoles.length < 3 && (
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                  animate={{ 
                    boxShadow: ["0 0 0 0 rgba(255, 182, 193, 0.4)", "0 0 0 8px rgba(255, 182, 193, 0)", "0 0 0 0 rgba(255, 182, 193, 0)"]
                  }}
                  transition={{ 
                    boxShadow: { duration: 2, repeat: Infinity },
                    rotate: { duration: 0.3 }
                  }}
                  onClick={() => setShowInviteModal(true)}
                  className="relative w-10 h-10 bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
                  title="邀請更多 AI 成員"
                >
                  <PlusIcon className="w-5 h-5 text-white" />
                  
                  {/* 脈衝效果 */}
                  <motion.div
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-[#FFB6C1] rounded-full"
                  />
                </motion.button>
              )}
            </div>

            {/* 移動端：緊湊的圖標按鈕 */}
            <div className="flex md:hidden items-center space-x-2">
              {/* 食量餘額顯示（移動端） */}
              {user?.id && (
                <FoodBalanceDisplay userId={user.id} />
              )}
              
              {/* 團隊成員按鈕 */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowInviteModal(true)}
                className="relative flex items-center space-x-1 px-3 py-2 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] rounded-full shadow-lg"
              >
                <UsersIcon className="w-4 h-4 text-white" />
                <span className="text-xs font-medium text-white">{activeRoles.length}</span>
                
                {/* 在線指示器 */}
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 border border-white rounded-full"
                />
              </motion.button>

              {/* 更多選項按鈕 */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="flex items-center justify-center w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full shadow-lg border border-[#EADBC8]/20"
                >
                  <EllipsisHorizontalIcon className="w-5 h-5 text-[#4B4036]" />
                </motion.button>

                {/* 移動端下拉菜單 */}
                <AnimatePresence>
                  {showMobileMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -10 }}
                      transition={{ type: "spring", damping: 25, stiffness: 300 }}
                      className="absolute top-12 right-0 bg-white rounded-xl shadow-xl border border-[#EADBC8]/20 p-2 min-w-[180px] z-50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* 搜尋對話 */}
                      <motion.button
                        whileHover={{ backgroundColor: "#FFFBEB" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setShowSearchBox(!showSearchBox);
                          setShowMobileMenu(false);
                        }}
                        className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5 text-[#4B4036]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span className="text-sm font-medium text-[#4B4036]">
                          {showSearchBox ? '關閉搜尋' : '搜尋對話'}
                        </span>
                      </motion.button>

                      {/* 角色設定 */}
                      <motion.button
                        whileHover={{ backgroundColor: "#FFF9F2" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setShowSettingsModal(true);
                          setShowMobileMenu(false);
                        }}
                        className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors"
                      >
                        <UserIcon className="w-5 h-5 text-[#4B4036]" />
                        <span className="text-sm font-medium text-[#4B4036]">角色設定</span>
                      </motion.button>

                      {/* 清除對話 */}
                      <motion.button
                        whileHover={{ backgroundColor: "#FEF2F2" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          handleClearHistory();
                          setShowMobileMenu(false);
                        }}
                        className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors"
                      >
                        <svg
                          className="w-5 h-5 text-red-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        <span className="text-sm font-medium text-red-600">清除對話</span>
                      </motion.button>

                      {/* 任務面板 */}
                      <motion.button
                        whileHover={{ backgroundColor: "#FFFBEB" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setShowTaskPanel(!showTaskPanel);
                          setShowMobileMenu(false);
                        }}
                        className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors"
                      >
                        <Cog6ToothIcon className="w-5 h-5 text-[#4B4036]" />
                        <span className="text-sm font-medium text-[#4B4036]">
                          {showTaskPanel ? '關閉任務面板' : '打開任務面板'}
                        </span>
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-2">
              {/* 食量餘額顯示（與設定按鈕一起） */}
              {user?.id && (
                <FoodBalanceDisplay userId={user.id} />
              )}

              {/* 搜尋按鈕 */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSearchBox(!showSearchBox)}
                className={`p-2 rounded-xl transition-all shadow-md ${
                  showSearchBox 
                    ? 'bg-[#FFD59A] text-white shadow-lg' 
                    : 'hover:bg-[#FFD59A]/20 text-[#4B4036] hover:shadow-lg'
                }`}
                title="搜尋對話"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </motion.button>

              {/* 角色設定按鈕 */}
              <motion.button
                whileHover={{ scale: 1.05, rotate: 15 }}
                whileTap={{ scale: 0.95 }}
                animate={{ 
                  backgroundColor: showSettingsModal ? "#FFB6C1" : "transparent"
                }}
                transition={{ duration: 0.3 }}
                onClick={() => {
                  setShowSettingsModal(!showSettingsModal);
                  setShowInviteModal(false); // 關閉邀請模態框
                  if (showSettingsModal) {
                    setEditingProject(false); // 關閉編輯模式
                  }
                }}
                className={`p-2 rounded-xl transition-all shadow-md ${
                  showSettingsModal 
                    ? 'bg-[#FFB6C1] text-white shadow-lg' 
                    : 'hover:bg-[#FFB6C1]/20 text-[#4B4036] hover:shadow-lg'
                }`}
                title="角色設定"
              >
                <UserIcon className="w-6 h-6" />
              </motion.button>

              {/* 顯示黑板按鈕 */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowBlackboard(!showBlackboard)}
                className={`p-2 rounded-xl transition-all shadow-md ${
                  showBlackboard
                    ? 'bg-[#FFD59A] text-[#4B4036] shadow-lg'
                    : 'hover:bg-[#FFD59A]/30 text-[#4B4036] hover:shadow-lg'
                }`}
                title={showBlackboard ? '隱藏黑板' : '顯示黑板'}
              >
                {/* Blackboard Icon (simple) */}
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="12" rx="2" ry="2"></rect>
                  <line x1="3" y1="20" x2="9" y2="20"></line>
                  <line x1="15" y1="20" x2="21" y2="20"></line>
                </svg>
              </motion.button>

              {/* 清除對話按鈕 */}
              <motion.button
                whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                whileTap={{ scale: 0.9 }}
                onClick={handleClearHistory}
                className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl border border-red-200 transition-all shadow-sm hover:shadow-md"
                title="清除所有對話記錄"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </motion.button>

              {/* 任務面板切換 */}
              <motion.button
                whileHover={{ scale: 1.05, rotate: 180 }}
                whileTap={{ scale: 0.95 }}
                animate={{ 
                  rotate: showTaskPanel ? 180 : 0,
                  backgroundColor: showTaskPanel ? "#FFD59A" : "transparent"
                }}
                transition={{ duration: 0.3 }}
                onClick={() => {
                  setShowTaskPanel(!showTaskPanel);
                  if (showTaskPanel) {
                    setEditingProject(false); // 關閉編輯模式
                  }
                }}
                className={`p-2 rounded-xl transition-all shadow-md ${
                  showTaskPanel 
                    ? 'bg-[#FFD59A] text-[#4B4036] shadow-lg' 
                    : 'hover:bg-[#FFD59A]/20 text-[#4B4036] hover:shadow-lg'
                }`}
                title="切換任務面板"
              >
                <Cog6ToothIcon className="w-6 h-6" />
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      {/* 側邊欄 */}
      <AppSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        currentPath="/aihome/ai-companions"
      />

      <div className="flex h-[calc(100vh-64px)]">
        {/* 主要聊天區域 */}
        <div className="flex-1 flex flex-col">
          {/* 搜尋框 */}
          {showSearchBox && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white border-b border-[#EADBC8] px-6 py-4"
            >
              <div className="flex items-center space-x-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSearchMessages();
                      }
                    }}
                    placeholder="搜尋對話內容..."
                    className="w-full px-4 py-2 pr-12 bg-[#FFF9F2] border border-[#EADBC8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD59A] text-[#4B4036]"
                    autoFocus
                  />
                  <button
                    onClick={handleSearchMessages}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-[#FFD59A]/20 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-[#4B4036]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
                {searchResults.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-[#2B3A3B]/60">
                      {currentSearchIndex + 1} / {searchResults.length}
                    </span>
                    <div className="flex space-x-1">
                      <button
                        onClick={navigateSearchPrev}
                        className="p-2 hover:bg-[#FFD59A]/20 rounded-lg transition-colors"
                        title="上一個"
                      >
                        <svg className="w-4 h-4 text-[#4B4036]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        onClick={navigateSearchNext}
                        className="p-2 hover:bg-[#FFD59A]/20 rounded-lg transition-colors"
                        title="下一個"
                      >
                        <svg className="w-4 h-4 text-[#4B4036]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
          
          {/* 訊息區域 或 黑板區域 */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {showBlackboard && (
              <div className="w-full h-full min-h-[40vh] bg-white/70 backdrop-blur-sm rounded-2xl border border-[#EADBC8] p-6 flex flex-col items-center justify-center text-center">
                <h3 className="text-xl font-semibold text-[#4B4036] mb-2">專案黑板</h3>
                <p className="text-sm text-[#2B3A3B]/80 mb-4">黑板視圖已開啟，之後可替換為正式黑板元件。</p>
                <p className="text-xs text-[#2B3A3B]/60">點擊上方黑板按鈕可返回訊息視圖。</p>
              </div>
            )}
            {!showBlackboard && (
            <AnimatePresence>
              {messages.map((message, index) => (
                <div key={`${message.id}-${index}`} id={`message-${message.id}`}>
                <MessageBubble
                  message={message}
                  companion={getCompanionInfo(message.sender as any)}
                  onDelete={handleDeleteMessage}
                    isHighlighted={currentSearchIndex >= 0 && searchResults[currentSearchIndex]?.id === message.id}
                />
                </div>
              ))}
            </AnimatePresence>
            )}

            {/* 增強版等待指示器 */}
            <AnimatePresence>
              {(isTyping || isLoading) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex justify-start"
                >
                  <div className="flex items-end space-x-3 max-w-[80%]">
                    {/* AI 頭像 */}
                    <motion.div 
                      className={`w-8 h-8 rounded-full bg-gradient-to-br ${
                        companionParam === 'pico' || selectedCompanion === 'pico' 
                          ? 'from-blue-400 to-cyan-500'
                          : companionParam === 'mori' || selectedCompanion === 'mori'
                            ? 'from-amber-400 to-orange-500'
                            : companionParam === 'hibi' || selectedCompanion === 'hibi'
                              ? 'from-orange-400 to-red-500'
                              : 'from-purple-400 to-pink-500'
                      } p-0.5 flex-shrink-0`}
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                        {(() => {
                          const src =
                            companionParam === 'pico' || selectedCompanion === 'pico'
                              ? '/3d-character-backgrounds/studio/Pico/Pico.png'
                              : companionParam === 'mori' || selectedCompanion === 'mori'
                                ? '/3d-character-backgrounds/studio/Mori/Mori.png'
                                : companionParam === 'hibi' || selectedCompanion === 'hibi'
                                  ? '/3d-character-backgrounds/studio/Hibi/lulu(front).png'
                                  : '/@hanami.png';
                          return src ? (
                            <Image src={src} alt="AI 助手" width={24} height={24} className="w-6 h-6 object-cover" />
                          ) : null;
                        })()}
                      </div>
                    </motion.div>
                    
                    <div className="bg-white/70 backdrop-blur-sm px-4 py-3 rounded-2xl shadow-lg border border-[#EADBC8]">
                      {/* 動態狀態文字 */}
                      <div className="flex items-center space-x-2 mb-2">
                        <motion.span
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="text-xs text-[#4B4036] font-medium"
                        >
                          {(() => {
                            if (companionParam === 'pico' || selectedCompanion === 'pico') {
                              if (elapsedTime < 10) return '🎨 正在構思創作...';
                              if (elapsedTime < 20) return '✨ 正在發揮創意魔法...';
                              if (elapsedTime < 30) return '🖌️ 正在精心繪製...';
                              return '🌟 即將完成創作...';
                            } else if (companionParam === 'mori' || selectedCompanion === 'mori') {
                              if (elapsedTime < 3) return '🤔 正在分析問題...';
                              if (elapsedTime < 6) return '📚 正在查找資料...';
                              return '💡 正在整理答案...';
                            } else if (companionParam === 'hibi' || selectedCompanion === 'hibi') {
                              if (elapsedTime < 5) return '🦊 正在統籌安排...';
                              if (elapsedTime < 10) return '⚡ 正在協調團隊...';
                              return '🎯 正在整合方案...';
                            } else {
                              return '🤖 團隊正在協作中...';
                            }
                          })()}
                        </motion.span>
                      </div>
                      
                      {/* 動畫點點 */}
                      <div className="flex items-center space-x-1 mb-2">
                        <motion.div
                          animate={{ scale: [1, 1.4, 1] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                          className={`w-2 h-2 rounded-full bg-gradient-to-r ${
                            companionParam === 'pico' || selectedCompanion === 'pico' 
                              ? 'from-blue-400 to-cyan-500'
                              : companionParam === 'mori' || selectedCompanion === 'mori'
                                ? 'from-amber-400 to-orange-500'
                                : companionParam === 'hibi' || selectedCompanion === 'hibi'
                                  ? 'from-orange-400 to-red-500'
                                  : 'from-purple-400 to-pink-500'
                          }`}
                        />
                        <motion.div
                          animate={{ scale: [1, 1.4, 1] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                          className={`w-2 h-2 rounded-full bg-gradient-to-r ${
                            companionParam === 'pico' || selectedCompanion === 'pico' 
                              ? 'from-blue-400 to-cyan-500'
                              : companionParam === 'mori' || selectedCompanion === 'mori'
                                ? 'from-amber-400 to-orange-500'
                                : companionParam === 'hibi' || selectedCompanion === 'hibi'
                                  ? 'from-orange-400 to-red-500'
                                  : 'from-purple-400 to-pink-500'
                          }`}
                        />
                        <motion.div
                          animate={{ scale: [1, 1.4, 1] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                          className={`w-2 h-2 rounded-full bg-gradient-to-r ${
                            companionParam === 'pico' || selectedCompanion === 'pico' 
                              ? 'from-blue-400 to-cyan-500'
                              : companionParam === 'mori' || selectedCompanion === 'mori'
                                ? 'from-amber-400 to-orange-500'
                                : companionParam === 'hibi' || selectedCompanion === 'hibi'
                                  ? 'from-orange-400 to-red-500'
                                  : 'from-purple-400 to-pink-500'
                          }`}
                        />
                      </div>
                      
                      {/* 時間顯示 */}
                      <div className="flex items-center justify-between text-xs text-[#2B3A3B]/70">
                        <span className={elapsedTime > estimatedTime ? 'text-orange-600 font-medium' : ''}>
                          已等待: {elapsedTime}s
                        </span>
                        <span>
                          {elapsedTime > estimatedTime ? '處理中...' : `預估: ~${estimatedTime}s`}
                        </span>
                      </div>
                      
                      {/* 進度條 */}
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                        <motion.div
                          className={`h-1 rounded-full ${
                            elapsedTime > estimatedTime 
                              ? 'bg-gradient-to-r from-orange-400 to-red-500' 
                              : companionParam === 'pico' || selectedCompanion === 'pico' 
                                ? 'bg-gradient-to-r from-blue-400 to-cyan-500'
                                : companionParam === 'mori' || selectedCompanion === 'mori'
                                  ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                                  : companionParam === 'hibi' || selectedCompanion === 'hibi'
                                    ? 'bg-gradient-to-r from-orange-400 to-red-500'
                                    : 'bg-gradient-to-r from-purple-400 to-pink-500'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ 
                            width: elapsedTime > estimatedTime 
                              ? '100%'
                              : `${Math.min((elapsedTime / estimatedTime) * 100, 100)}%`,
                            opacity: elapsedTime > estimatedTime ? [0.5, 1, 0.5] : 1
                          }}
                          transition={{ 
                            duration: elapsedTime > estimatedTime ? 1 : 0.5,
                            repeat: elapsedTime > estimatedTime ? Infinity : 0
                          }}
                        />
                      </div>
                      
                      {/* 角色專屬提示 */}
                      {(companionParam === 'pico' || selectedCompanion === 'pico') && (
                        <motion.div
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ duration: 3, repeat: Infinity }}
                          className="mt-2 text-xs text-center text-[#FFB6C1]"
                        >
                          {(() => {
                            if (elapsedTime < 10) return '✨ 正在發揮創意魔法 ✨';
                            if (elapsedTime < 20) return '🎨 正在調色盤中尋找完美色彩...';
                            if (elapsedTime < 30) return '🖌️ 正在精心描繪每個細節...';
                            return '🌟 正在為作品添加最後的魔法光芒...';
                          })()}
                        </motion.div>
                      )}
                      
                      {(companionParam === 'mori' || selectedCompanion === 'mori') && (
                        <motion.div
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="mt-2 text-xs text-center text-[#D4A574]"
                        >
                          {(() => {
                            if (elapsedTime < 3) return '🤔 正在分析問題...';
                            if (elapsedTime < 6) return '📚 正在查閱知識庫...';
                            return '💡 正在整理最佳答案...';
                          })()}
                        </motion.div>
                      )}
                      
                      {(companionParam === 'hibi' || selectedCompanion === 'hibi') && (
                        <motion.div
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="mt-2 text-xs text-center text-[#FF8C42]"
                        >
                          {(() => {
                            if (elapsedTime < 5) return '🦊 正在統籌安排...';
                            if (elapsedTime < 10) return '⚡ 正在協調團隊...';
                            return '🎯 正在整合最佳方案...';
                          })()}
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>

          {/* AI 角色選擇器 */}
          <div className="px-6 py-4 bg-gradient-to-r from-white/70 to-white/50 backdrop-blur-sm border-t border-[#EADBC8]">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="w-6 h-6 bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] rounded-full flex items-center justify-center"
                >
                  <SparklesIcon className="w-4 h-4 text-white" />
                </motion.div>
                <span className="text-sm font-medium text-[#4B4036]">
                  {activeRoles.length === 1 ? '團隊成員:' : 'AI 回應模式:'}
                </span>
              </div>
              
              <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-xl p-1 shadow-md">
                {(() => {
                  // 顯示當前活躍的角色
                  const modes = [
                    { id: 'hibi', label: 'Hibi', purpose: '統籌', icon: CpuChipIcon, imagePath: '/3d-character-backgrounds/studio/Hibi/lulu(front).png', color: 'from-[#FF8C42] to-[#FFB366]' },
                    { id: 'mori', label: '墨墨', purpose: '研究', icon: AcademicCapIcon, imagePath: '/3d-character-backgrounds/studio/Mori/Mori.png', color: 'from-[#D4A574] to-[#E6C8A0]' },
                    { id: 'pico', label: '皮可', purpose: '繪圖', icon: PaintBrushIcon, imagePath: '/3d-character-backgrounds/studio/Pico/Pico.png', color: 'from-[#FFB6C1] to-[#FFCDD6]' }
                  ];
                  
                  // 只顯示活躍的角色
                  const availableModes = modes.filter(mode => activeRoles.includes(mode.id as any));
                  
                  // 如果沒有任何角色，不顯示任何按鈕（而不是顯示全部角色）
                  if (availableModes.length === 0) {
                    return [];
                  }
                  
                  // 多角色時，不再提供獨立的團隊模式，維持直接選角色
                  if (activeRoles.length > 1) {
                    return availableModes;
                  }
                  
                  // 單角色模式，只顯示該角色
                  return availableModes;
                })().map((mode) => (
                  <motion.button
                    key={mode.id}
                    whileHover={{ scale: 1.05, y: -1 }}
                    whileTap={{ scale: 0.95 }}
                    animate={{
                      boxShadow: selectedCompanion === mode.id 
                        ? ["0 0 0 0 rgba(255, 182, 193, 0.4)", "0 0 0 4px rgba(255, 182, 193, 0)", "0 0 0 0 rgba(255, 182, 193, 0.4)"]
                        : "none"
                    }}
                    transition={{
                      boxShadow: { duration: 2, repeat: Infinity }
                    }}
                    onClick={() => setSelectedCompanion(mode.id as any)}
                    className={`relative flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      selectedCompanion === mode.id 
                        ? 'bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white shadow-lg transform scale-105' 
                        : 'text-[#4B4036] hover:bg-[#FFD59A]/20 hover:shadow-md'
                    }`}
                  >
                    {/* 桌面版：顯示圖標 */}
                    <motion.div
                      animate={{ rotate: mode.id === 'hibi' && selectedCompanion === mode.id ? 360 : 0 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="hidden sm:block"
                    >
                      <mode.icon className="w-4 h-4" />
                    </motion.div>
                    
                    {/* 手機版：顯示角色圖像 */}
                    <div className="block sm:hidden">
                      <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${(mode as any).color} p-0.5 shadow-sm`}>
                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                          {(() => {
                            const src = (mode as any).imagePath as string | undefined;
                            return src ? (
                              <Image src={src} alt={mode.label} width={20} height={20} className="w-5 h-5 object-cover" />
                            ) : null;
                          })()}
                        </div>
                      </div>
                    </div>
                    
                    {/* 桌面版：顯示完整名稱和用途 */}
                    <div className="hidden sm:block text-left">
                      <div className="leading-tight">
                        {mode.label}
                        <span className="text-xs opacity-75 ml-1">({mode.purpose})</span>
                      </div>
                    </div>
                    
                    {/* 移動端：只顯示簡單用途 */}
                    <span className="block sm:hidden text-xs font-medium">
                      {mode.purpose}
                    </span>
                    
                    {/* 選中狀態指示器 */}
                    {selectedCompanion === mode.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-2 h-2 bg-white rounded-full"
                      />
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* AI 對話輸入區域 - 添加底部間距避免被導航遮蓋 */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="p-6 pb-24 lg:pb-6 bg-gradient-to-r from-white/80 to-white/70 backdrop-blur-sm border-t border-[#EADBC8]"
          >
            {/* Pico 圖片選項 - 只在選擇 Pico 時顯示 */}
            {selectedCompanion === 'pico' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 overflow-hidden"
              >
                {/* 展開/收起按鈕 */}
                <motion.button
                  onClick={togglePicoOptions}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full p-3 bg-gradient-to-r from-[#FFB6C1]/10 to-[#FFD59A]/10 rounded-xl border border-[#FFB6C1]/30 hover:border-[#FFB6C1]/50 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2">
                    <PaintBrushIcon className="w-5 h-5 text-[#FFB6C1]" />
                    <span className="text-sm font-medium text-[#4B4036]">圖片設定選項</span>
                    {(picoImageSize || picoImageStyle) && (
                      <span className="px-2 py-0.5 bg-[#FFB6C1]/20 rounded-full text-xs text-[#FFB6C1]">
                        已選擇
                      </span>
                    )}
                  </div>
                  <motion.div
                    animate={{ rotate: picoOptionsExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <svg className="w-5 h-5 text-[#4B4036]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </motion.div>
                </motion.button>

                {/* 選項內容 - 可展開/收起 */}
                <AnimatePresence>
                  {picoOptionsExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 p-4 bg-gradient-to-r from-[#FFB6C1]/10 to-[#FFD59A]/10 rounded-xl border border-[#FFB6C1]/30 space-y-3">
                        {/* 尺寸選項 */}
                        <div>
                          <label className="text-sm font-medium text-[#4B4036] mb-2 block flex items-center">
                            <svg className="w-4 h-4 mr-2 text-[#FFB6C1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                            圖片尺寸
                          </label>
                    <div className="flex flex-wrap gap-2">
                      {['1024x1024', '1024x768', '768x1024', '1920x1080', 'A4'].map((size) => (
                        <motion.button
                          key={size}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setPicoImageSize(picoImageSize === size ? '' : size);
                            setShowCustomSizeInput(false);
                            setPicoCustomSize('');
                          }}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            picoImageSize === size && !showCustomSizeInput
                              ? 'bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white shadow-md'
                              : 'bg-white/80 text-[#4B4036] border border-[#EADBC8] hover:border-[#FFB6C1]'
                          }`}
                        >
                          {size}
                        </motion.button>
                      ))}
                      
                      {/* 自訂尺寸按鈕 */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setShowCustomSizeInput(!showCustomSizeInput);
                          if (!showCustomSizeInput) {
                            setPicoImageSize('');
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center space-x-1 ${
                          showCustomSizeInput
                            ? 'bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white shadow-md'
                            : 'bg-white/80 text-[#4B4036] border border-[#EADBC8] hover:border-[#FFB6C1]'
                        }`}
                      >
                        <PlusIcon className="w-4 h-4" />
                        <span>自訂</span>
                      </motion.button>
                      
                      {(picoImageSize || showCustomSizeInput) && (
                        <motion.button
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            setPicoImageSize('');
                            setPicoCustomSize('');
                            setShowCustomSizeInput(false);
                          }}
                          className="px-2 py-1.5 rounded-lg text-sm bg-red-100 text-red-600 hover:bg-red-200 transition-colors flex items-center"
                          title="清除選擇"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </motion.button>
                      )}
                    </div>
                    
                    {/* 自訂尺寸輸入框 */}
                    <AnimatePresence>
                      {showCustomSizeInput && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <input
                            type="text"
                            value={picoCustomSize}
                            onChange={(e) => {
                              setPicoCustomSize(e.target.value);
                              setPicoImageSize(e.target.value);
                            }}
                            placeholder="例如：1280x720、16:9、正方形"
                            className="w-full mt-2 px-3 py-2 rounded-lg border border-[#FFB6C1]/30 bg-white/80 text-[#4B4036] text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB6C1]/50 placeholder-[#4B4036]/40"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                        {/* 風格選項 */}
                        <div>
                          <label className="text-sm font-medium text-[#4B4036] mb-2 block flex items-center">
                            <svg className="w-4 h-4 mr-2 text-[#FFB6C1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                            </svg>
                            繪圖風格
                          </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: 'kawaii', label: '可愛風' },
                        { value: 'realistic', label: '寫實' },
                        { value: 'cartoon', label: '卡通' },
                        { value: 'anime', label: '動漫' },
                        { value: 'watercolor', label: '水彩' },
                        { value: 'chibi', label: 'Q版' },
                        { value: 'pastel', label: '粉彩' }
                      ].map((style) => (
                        <motion.button
                          key={style.value}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setPicoImageStyle(picoImageStyle === style.value ? '' : style.value);
                            setShowCustomStyleInput(false);
                            setPicoCustomStyle('');
                          }}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            picoImageStyle === style.value && !showCustomStyleInput
                              ? 'bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white shadow-md'
                              : 'bg-white/80 text-[#4B4036] border border-[#EADBC8] hover:border-[#FFB6C1]'
                          }`}
                        >
                          {style.label}
                        </motion.button>
                      ))}
                      
                      {/* 自訂風格按鈕 */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setShowCustomStyleInput(!showCustomStyleInput);
                          if (!showCustomStyleInput) {
                            setPicoImageStyle('');
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center space-x-1 ${
                          showCustomStyleInput
                            ? 'bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white shadow-md'
                            : 'bg-white/80 text-[#4B4036] border border-[#EADBC8] hover:border-[#FFB6C1]'
                        }`}
                      >
                        <PlusIcon className="w-4 h-4" />
                        <span>自訂</span>
                      </motion.button>
                      
                      {(picoImageStyle || showCustomStyleInput) && (
                        <motion.button
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            setPicoImageStyle('');
                            setPicoCustomStyle('');
                            setShowCustomStyleInput(false);
                          }}
                          className="px-2 py-1.5 rounded-lg text-sm bg-red-100 text-red-600 hover:bg-red-200 transition-colors flex items-center"
                          title="清除選擇"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </motion.button>
                      )}
                    </div>
                    
                    {/* 自訂風格輸入框 */}
                    <AnimatePresence>
                      {showCustomStyleInput && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <input
                            type="text"
                            value={picoCustomStyle}
                            onChange={(e) => {
                              setPicoCustomStyle(e.target.value);
                              setPicoImageStyle(e.target.value);
                            }}
                            placeholder="例如：油畫風、像素風、扁平化、賽博龐克"
                            className="w-full mt-2 px-3 py-2 rounded-lg border border-[#FFB6C1]/30 bg-white/80 text-[#4B4036] text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB6C1]/50 placeholder-[#4B4036]/40"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                        {/* 當前選擇提示 */}
                        {(picoImageSize || picoImageStyle) && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-2 p-2 bg-white/60 rounded-lg text-xs text-[#4B4036]"
                          >
                            <span className="font-medium">已選擇：</span>
                            {picoImageSize && <span className="ml-1 text-[#FFB6C1]">尺寸 {picoImageSize}</span>}
                            {picoImageSize && picoImageStyle && <span className="mx-1">•</span>}
                            {picoImageStyle && <span className="text-[#FFD59A]">風格 {
                              [
                                { value: 'kawaii', label: '可愛風' },
                                { value: 'realistic', label: '寫實' },
                                { value: 'cartoon', label: '卡通' },
                                { value: 'anime', label: '動漫' },
                                { value: 'watercolor', label: '水彩' },
                                { value: 'chibi', label: 'Q版' },
                                { value: 'pastel', label: '粉彩' }
                              ].find(s => s.value === picoImageStyle)?.label || picoImageStyle
                            }</span>}
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            <div className="flex items-end space-x-4">
              <div className="flex-1">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={
                    activeRoles.length === 1 
                      ? `與 ${companions.find(c => c.id === activeRoles[0])?.name} 對話...`
                      : selectedCompanion === 'hibi'
                          ? '向 Hibi 總管尋求統籌和協調建議...'
                        : selectedCompanion === 'mori'
                          ? '向墨墨提問研究或學習相關問題...'
                          : '向皮可尋求創意和設計建議...'
                  }
                  className="w-full px-4 py-3 border-2 border-[#EADBC8] rounded-xl focus:ring-4 focus:ring-[#FFB6C1]/20 focus:border-[#FFB6C1] resize-none transition-all bg-white/90 backdrop-blur-sm shadow-sm text-[#4B4036] placeholder-[#2B3A3B]/50"
                  rows={3}
                />
              </div>

              <div className="flex flex-col space-y-3">
                {/* 發送訊息按鈕 */}
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                  animate={{
                    boxShadow: !inputMessage.trim() 
                      ? "none"
                      : ["0 0 0 0 rgba(255, 182, 193, 0.4)", "0 0 0 8px rgba(255, 182, 193, 0)", "0 0 0 0 rgba(255, 182, 193, 0.4)"]
                  }}
                  transition={{
                    boxShadow: { duration: 2, repeat: Infinity }
                  }}
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading || isTyping || isSending}
                  className={`relative p-3 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] hover:from-[#FFA0B4] hover:to-[#EBC9A4] text-white rounded-xl shadow-lg hover:shadow-xl transition-all ${
                    !inputMessage.trim() || isLoading || isTyping 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:scale-105'
                  }`}
                  title="發送訊息"
                >
                  {isLoading || isTyping ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <ClockIcon className="w-6 h-6" />
                    </motion.div>
                  ) : (
                    <PaperAirplaneIcon className="w-6 h-6" />
                  )}
                </motion.button>
                
                {/* 附件/圖片按鈕 */}
                <motion.button
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-3 bg-white/80 backdrop-blur-sm border-2 border-[#EADBC8] text-[#4B4036] rounded-xl hover:bg-[#FFD59A]/20 hover:border-[#FFB6C1] transition-all shadow-md hover:shadow-lg"
                  title="添加圖片"
                >
                  <PhotoIcon className="w-6 h-6" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 任務面板 */}
        <AnimatePresence>
          {showTaskPanel && (
            <>
              {/* 桌面版：側邊面板 */}
              <motion.div
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 300, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="hidden md:block w-80 bg-white/80 backdrop-blur-sm border-l border-[#EADBC8] p-6 overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-[#4B4036]">任務面板</h2>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setShowTaskPanel(false);
                      setEditingProject(false);
                    }}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5 text-gray-500" />
                  </motion.button>
                </div>
                <TaskPanelContent 
                  tasks={tasks}
                  activeRoles={activeRoles}
                  room={room}
                  editingProject={editingProject}
                  editProjectName={editProjectName}
                  setEditProjectName={setEditProjectName}
                  editProjectDescription={editProjectDescription}
                  setEditProjectDescription={setEditProjectDescription}
                  handleStartEditProject={handleStartEditProject}
                  handleUpdateProject={handleUpdateProject}
                  setEditingProject={setEditingProject}
                  picoSettings={picoSettings}
                  setPicoSettings={setPicoSettings}
                  moriSettings={moriSettings}
                  setMoriSettings={setMoriSettings}
                />
              </motion.div>

              {/* 移動端：全屏覆蓋 */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={() => setShowTaskPanel(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-md max-h-[80vh] bg-white rounded-2xl shadow-2xl overflow-hidden"
                >
                  {/* 移動端標題欄 */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#FFF9F2] to-[#FFFDF8] border-b border-[#EADBC8]">
                    <h2 className="text-lg font-bold text-[#4B4036]">任務面板</h2>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setShowTaskPanel(false);
                        setEditingProject(false);
                      }}
                      className="p-2 hover:bg-white/50 rounded-full transition-colors"
                    >
                      <XMarkIcon className="w-5 h-5 text-gray-500" />
                    </motion.button>
                  </div>

                  {/* 移動端任務面板內容 */}
                  <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
                    <TaskPanelContent 
                      tasks={tasks}
                      activeRoles={activeRoles}
                      room={room}
                      editingProject={editingProject}
                      editProjectName={editProjectName}
                      setEditProjectName={setEditProjectName}
                      editProjectDescription={editProjectDescription}
                      setEditProjectDescription={setEditProjectDescription}
                      handleStartEditProject={handleStartEditProject}
                      handleUpdateProject={handleUpdateProject}
                      setEditingProject={setEditingProject}
                      picoSettings={picoSettings}
                      setPicoSettings={setPicoSettings}
                      moriSettings={moriSettings}
                      setMoriSettings={setMoriSettings}
                    />
                  </div>
                </motion.div>
              </motion.div>
            </>
          )}
        </AnimatePresence>


        {/* 邀請角色模態框 */}
        <AnimatePresence>
          {showInviteModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowInviteModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-white rounded-2xl p-8 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-[#4B4036]">團隊成員管理</h2>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowInviteModal(false)}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6 text-[#4B4036]" />
                  </motion.button>
                </div>

                {/* 現有團隊成員 */}
                {activeRoles.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-[#4B4036] mb-3 flex items-center space-x-2">
                      <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center">
                        <CheckCircleIcon className="w-3 h-3 text-white" />
                      </div>
                      <span>目前團隊成員</span>
                    </h3>
                    <div className="space-y-2">
                      {activeRoles.map((companionId) => {
                        const companion = companions.find(c => c.id === companionId);
                        if (!companion) return null;
                        
                        return (
                          <div
                            key={companionId}
                            className="flex items-center space-x-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200"
                          >
                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${companion.color} p-0.5`}>
                              <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                                <Image
                                  src={companion.imagePath}
                                  alt={companion.name}
                                  width={32}
                                  height={32}
                                  className="w-8 h-8 object-cover"
                                />
                              </div>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-[#4B4036]">{companion.name}</h4>
                              <p className="text-xs text-[#2B3A3B]">{companion.specialty}</p>
                            </div>
                            <div className="flex items-center space-x-1 text-green-600">
                              <CheckCircleIcon className="w-4 h-4" />
                              <span className="text-xs font-medium">已加入</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 可邀請的成員 */}
                {companions.filter(companion => !activeRoles.includes(companion.id)).length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-[#4B4036] mb-3 flex items-center space-x-2">
                      <div className="w-5 h-5 bg-[#FFB6C1] rounded-full flex items-center justify-center">
                        <PlusIcon className="w-3 h-3 text-white" />
                      </div>
                      <span>可邀請成員</span>
                    </h3>
                    <div className="space-y-3">
                      {companions
                        .filter(companion => !activeRoles.includes(companion.id))
                        .map((companion) => (
                          <motion.button
                            key={companion.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleInviteRole(companion.id)}
                            className="w-full flex items-center space-x-4 p-4 bg-gradient-to-r from-[#FFF9F2] to-[#F8F5EC] rounded-xl hover:from-[#FFD59A]/20 hover:to-[#EBC9A4]/20 transition-all border border-[#EADBC8]"
                          >
                            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${companion.color} p-0.5`}>
                              <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                                <Image
                                  src={companion.imagePath}
                                  alt={companion.name}
                                  width={40}
                                  height={40}
                                  className="w-10 h-10 object-cover"
                                />
                              </div>
                            </div>
                            <div className="flex-1 text-left">
                              <h3 className="font-semibold text-[#4B4036]">{companion.name}</h3>
                              <p className="text-sm text-[#2B3A3B]">{companion.specialty}</p>
                            </div>
                            <PlusIcon className="w-5 h-5 text-[#FFB6C1]" />
                          </motion.button>
                        ))}
                    </div>
                  </div>
                )}

                {companions.filter(companion => !activeRoles.includes(companion.id)).length === 0 && activeRoles.length === 3 && (
                  <div className="text-center py-8 text-[#2B3A3B]">
                    🎉 所有 AI 成員都已在專案團隊中！
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 角色設定模態框 */}
        <AnimatePresence>
          {showSettingsModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowSettingsModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-white rounded-2xl p-8 max-w-lg w-full max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] rounded-full flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-[#4B4036]">角色管理</h2>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setShowSettingsModal(false);
                      setEditingProject(false); // 關閉編輯模式
                    }}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6 text-[#4B4036]" />
                  </motion.button>
                </div>

                <p className="text-[#2B3A3B] mb-6">管理專案團隊中的 AI 成員，您可以邀請新成員或移除現有成員：</p>

                {/* 當前角色列表 */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-[#4B4036] mb-4 flex items-center space-x-2">
                    <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center">
                      <CheckCircleIcon className="w-3 h-3 text-white" />
                    </div>
                    <span>專案團隊成員</span>
                  </h3>
                  
                  <div className="space-y-3">
                    {activeRoles.map((roleId) => {
                      const companion = companions.find(c => c.id === roleId);
                      if (!companion) return null;
                      
                      return (
                        <motion.div
                          key={roleId}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200"
                        >
                          <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${companion.color} p-0.5`}>
                              <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                                <Image
                                  src={companion.imagePath}
                                  alt={companion.name}
                                  width={40}
                                  height={40}
                                  className="w-10 h-10 object-cover"
                                />
                              </div>
                            </div>
                            <div>
                              <h4 className="font-semibold text-[#4B4036]">{companion.name}</h4>
                              <p className="text-sm text-green-700">{companion.specialty}</p>
                            </div>
                          </div>
                          
                          {/* 移除按鈕（只有多於1個角色時顯示） */}
                          {activeRoles.length > 1 && (
                            <motion.button
                              whileHover={{ scale: 1.1, rotate: 90 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleRemoveRole(roleId)}
                              className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md transition-all"
                              title={`移除 ${companion.name}`}
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </motion.button>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* 可邀請的角色 */}
                {companions.filter(companion => !activeRoles.includes(companion.id)).length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-[#4B4036] mb-4 flex items-center space-x-2">
                      <div className="w-5 h-5 bg-blue-400 rounded-full flex items-center justify-center">
                        <PlusIcon className="w-3 h-3 text-white" />
                      </div>
                      <span>可邀請的角色</span>
                    </h3>
                    
                    <div className="space-y-3">
                      {companions
                        .filter(companion => !activeRoles.includes(companion.id))
                        .map((companion) => (
                          <motion.button
                            key={companion.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleInviteRole(companion.id, true)}
                            className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200 hover:from-[#FFD59A]/20 hover:to-[#EBC9A4]/20 transition-all"
                          >
                            <div className="flex items-center space-x-4">
                              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${companion.color} p-0.5`}>
                                <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                                  <Image
                                    src={companion.imagePath}
                                    alt={companion.name}
                                    width={40}
                                    height={40}
                                    className="w-10 h-10 object-cover"
                                  />
                                </div>
                              </div>
                              <div className="text-left">
                                <h4 className="font-semibold text-[#4B4036]">{companion.name}</h4>
                                <p className="text-sm text-blue-700">{companion.specialty}</p>
                              </div>
                            </div>
                            
                            <motion.div
                              whileHover={{ scale: 1.2, rotate: 90 }}
                              className="p-2 bg-[#FFB6C1] rounded-full"
                            >
                              <PlusIcon className="w-4 h-4 text-white" />
                            </motion.div>
                          </motion.button>
                        ))}
                    </div>
                  </div>
                )}

                {/* 操作按鈕 */}
                <div className="flex space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowSettingsModal(false);
                      setEditingProject(false); // 關閉編輯模式
                    }}
                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-[#4B4036] rounded-xl font-medium transition-all"
                  >
                    關閉
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ========================================
// 訊息氣泡組件
// ========================================

interface MessageBubbleProps {
  message: Message;
  companion?: any;
  onDelete?: (messageId: string) => void;
  isHighlighted?: boolean;
}

function MessageBubble({ message, companion, onDelete, isHighlighted = false }: MessageBubbleProps) {
  const isUser = message.sender === 'user';
  const isSystem = message.sender === 'system';
  const [showMobileActions, setShowMobileActions] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

  // 複製訊息內容到剪貼板
  const handleCopyMessage = async () => {
    try {
      // 檢查是否支援現代 Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(message.content);
        console.log('✅ 訊息已複製到剪貼板（現代 API）');
      } else {
        // 使用備用方案
        const textArea = document.createElement('textarea');
        textArea.value = message.content;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          console.log('✅ 訊息已複製到剪貼板（備用方案）');
        } else {
          throw new Error('execCommand copy failed');
        }
      }
      setShowMobileActions(false); // 複製後隱藏按鈕
    } catch (error) {
      console.error('❌ 複製失敗:', error);
      // 最後的備用方案：提示用戶手動複製
      alert(`複製失敗，請手動複製以下內容：\n\n${message.content}`);
      setShowMobileActions(false);
    }
  };

  // 長按開始
  const handleTouchStart = () => {
    const timer = setTimeout(() => {
      setShowMobileActions(true);
      console.log('📱 長按觸發，顯示操作按鈕');
    }, 500); // 500ms 長按
    setLongPressTimer(timer);
  };

  // 長按結束或取消
  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // 點擊其他地方隱藏按鈕
  useEffect(() => {
    const handleClickOutside = () => {
      setShowMobileActions(false);
    };

    if (showMobileActions) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
    
    // 如果 showMobileActions 為 false，返回空的清理函數
    return () => {};
  }, [showMobileActions]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: isHighlighted ? [1, 0.7, 1] : 1,
        scale: isHighlighted ? [1, 1.02, 1] : 1,
        backgroundColor: isHighlighted ? ['rgba(255, 213, 154, 0)', 'rgba(255, 213, 154, 0.3)', 'rgba(255, 213, 154, 0)'] : 'transparent'
      }}
      transition={{ duration: 0.3, repeat: isHighlighted ? 2 : 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${isHighlighted ? 'rounded-xl' : ''}`}
    >
      <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end space-x-3 max-w-[80%]`}>
        {/* 頭像 */}
        {!isUser && (
          <div className="flex-shrink-0">
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${companion?.color || 'from-gray-400 to-gray-600'} p-0.5`}>
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                <Image
                  src={companion?.imagePath || '/@hanami.png'}
                  alt={companion?.name || 'AI'}
                  width={28}
                  height={28}
                  className="w-7 h-7 object-cover"
                />
              </div>
            </div>
          </div>
        )}

        {/* 訊息內容 */}
        <div className={`${isUser ? 'mr-3' : 'ml-3'}`}>
          {/* 發送者名稱 */}
          {!isUser && (
            <div className="text-xs text-[#2B3A3B] mb-1">
              {companion?.name || '系統'}
            </div>
          )}

          {/* 訊息氣泡 */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            className={`group relative px-4 py-3 rounded-2xl shadow-sm ${
              isUser
                ? 'bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white rounded-br-md'
                : isSystem
                  ? 'bg-[#F8F5EC] border border-[#EADBC8] text-[#4B4036] rounded-bl-md'
                  : 'bg-white border border-[#EADBC8] text-[#4B4036] rounded-bl-md'
            }`}
          >
            {/* 訊息內容 - 支援圖片顯示 */}
            <div className="whitespace-pre-wrap break-words">
              {message.content.split('\n').map((line, index) => {
                // ⭐ 優先檢查是否為圖片 markdown 格式（必須在直接 URL 檢查之前）
                // 改進正則：匹配 ![alt](url) 格式，支援 URL 中包含特殊字符
                const imageMatch = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
                if (imageMatch && imageMatch.index !== undefined) {
                  let imageUrl = imageMatch[2].trim(); // 捕獲組 2 是 URL，去除首尾空格
                  
                  // ⭐ 提取 Markdown 圖片前後的文字（完全移除 Markdown 標記）
                  const markdownText = imageMatch[0]; // 完整的 ![alt](url)
                  const textBefore = line.substring(0, imageMatch.index).trim();
                  const textAfter = line.substring(imageMatch.index + markdownText.length).trim();
                  
                  // 如果是 iframe，提取其中的圖片 URL
                  if (imageUrl.includes('<iframe')) {
                    const urlExtract = imageUrl.match(/https:\/\/[^\s"<>]+\.(?:png|jpg|jpeg|webp|gif)/i);
                    if (urlExtract) {
                      imageUrl = urlExtract[0];
                    } else {
                      return <p key={index} className="text-red-500">圖片連結解析失敗</p>;
                    }
                  }
                  
                  // ⭐ 轉換為公開 URL（用於實際載入圖片）
                  const publicUrl = convertToPublicUrl(imageUrl);
                  // ⭐ 轉換為簡潔 URL（用於顯示和連結）
                  const shortUrl = convertToShortUrl(imageUrl);
                  
                  return (
                    <div key={index} className="mt-3">
                      {/* 如果 Markdown 前有文字，顯示文字 */}
                      {textBefore && <p className="mb-2 text-sm opacity-80">{textBefore}</p>}
                      
                      <div className="bg-white/30 rounded-xl p-3 shadow-sm space-y-2">
                        <div className="relative">
                          <SecureImageDisplay
                            imageUrl={imageUrl}
                            alt="Pico 創作作品"
                            className="max-w-full h-auto rounded-lg shadow-lg hover:shadow-xl transition-all cursor-pointer border-2 border-[#FFB6C1]/30"
                            onClick={() => window.open(shortUrl, '_blank')}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between bg-white/50 rounded-lg p-2">
                          <a 
                            href={shortUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-[#FFB6C1] hover:text-[#FF9BB3] underline flex items-center space-x-1 flex-1 truncate"
                            title={shortUrl}
                          >
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="truncate">{shortUrl.replace(/^https?:\/\//, '')}</span>
                          </a>
                          
                          <button
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(shortUrl);
                                const { default: toast } = await import('react-hot-toast');
                                toast.success('連結已複製', {
                                  icon: '📋',
                                  duration: 2000,
                                  style: {
                                    background: '#fff',
                                    color: '#4B4036',
                                  }
                                });
                              } catch (err) {
                                console.error('❌ 複製失敗:', err);
                              }
                            }}
                            className="ml-2 px-2 py-1 bg-[#FFD59A]/30 hover:bg-[#FFD59A]/50 rounded text-xs text-[#4B4036] transition-colors flex-shrink-0"
                            title="複製連結"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                          </button>
                        </div>
                        
                        <p className="text-xs text-[#2B3A3B]/60 text-center">
                          點擊圖片可在新視窗中查看完整尺寸
                        </p>
                      </div>
                      
                      {/* 如果 Markdown 後有文字，顯示文字 */}
                      {textAfter && <p className="mt-2 text-sm opacity-80">{textAfter}</p>}
                    </div>
                  );
                }
                
                // 檢查是否為圖片 URL（支援多種格式）- 在 Markdown 檢查之後
                const urlMatch = line.match(/https?:\/\/[^\s]+\.(?:png|jpg|jpeg|webp|gif)(?:\?[^\s]*)?/i);
                
                if (urlMatch) {
                  const imageUrl = urlMatch[0];
                  // ⭐ 轉換為公開 URL（用於實際載入圖片）
                  const publicUrl = convertToPublicUrl(imageUrl);
                  // ⭐ 轉換為簡潔 URL（用於顯示和連結）
                  const shortUrl = convertToShortUrl(imageUrl);
                  const textBefore = line.substring(0, urlMatch.index);
                  const textAfter = line.substring(urlMatch.index! + imageUrl.length);
                  
                  return (
                    <div key={index} className="mt-3">
                      {/* 如果 URL 前有文字，顯示文字 */}
                      {textBefore && <p className="mb-2 text-sm opacity-80">{textBefore}</p>}
                      
                      {/* 圖片預覽區域 */}
                      <div className="bg-white/30 rounded-xl p-3 shadow-sm space-y-2">
                        {/* 圖片顯示 - 使用 SecureImageDisplay 組件處理 Public Bucket */}
                        <div className="relative">
                          <SecureImageDisplay
                            imageUrl={imageUrl}
                            alt="AI 生成圖片"
                            className="max-w-full h-auto rounded-lg shadow-lg hover:shadow-xl transition-all cursor-pointer border-2 border-[#FFB6C1]/30"
                            onClick={() => window.open(shortUrl, '_blank')}
                          />
                        </div>
                        
                        {/* 連結和下載按鈕 */}
                        <div className="flex items-center justify-between bg-white/50 rounded-lg p-2">
                          <a 
                            href={shortUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-[#FFB6C1] hover:text-[#FF9BB3] underline flex items-center space-x-1 flex-1 truncate"
                            title={shortUrl}
                          >
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="truncate">{shortUrl.replace(/^https?:\/\//, '')}</span>
                          </a>
                          
                          {/* 複製連結按鈕 */}
                          <button
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(shortUrl);
                                const { default: toast } = await import('react-hot-toast');
                                toast.success('連結已複製', {
                                  icon: '📋',
                                  duration: 2000,
                                  style: {
                                    background: '#fff',
                                    color: '#4B4036',
                                  }
                                });
                              } catch (err) {
                                console.error('❌ 複製失敗:', err);
                              }
                            }}
                            className="ml-2 px-2 py-1 bg-[#FFD59A]/30 hover:bg-[#FFD59A]/50 rounded text-xs text-[#4B4036] transition-colors flex-shrink-0"
                            title="複製連結"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                          </button>
                        </div>
                        
                        <p className="text-xs text-[#2B3A3B]/60 text-center">
                          點擊圖片可在新視窗中查看完整尺寸
                        </p>
                      </div>
                      
                      {/* 如果 URL 後有文字，顯示文字 */}
                      {textAfter && <p className="mt-2 text-sm opacity-80">{textAfter}</p>}
                    </div>
                  );
                }
                
                // 一般文字內容（排除 Markdown 圖片格式）
                // 如果整行包含 Markdown 圖片格式但沒有匹配成功，跳過顯示（避免顯示原始 Markdown）
                if (line.includes('![') && line.includes('](') && line.includes(')')) {
                  // 可能是未匹配成功的 Markdown 格式，跳過避免顯示原始標記
                  return null;
                }
                
                // 一般文字內容
                if (line.trim()) {
                  return <p key={index} className="mb-1">{line}</p>;
                }
                return null;
              })}
            </div>

            {/* 操作按鈕 - 響應式顯示 */}
            <div className={`absolute -top-2 -right-2 flex space-x-1 z-10 transition-opacity duration-200
                            ${showMobileActions ? 'opacity-100' : 'opacity-0'} 
                            md:opacity-0 md:group-hover:opacity-100`}>
              {/* 食量顯示 - 僅 AI 回應訊息顯示，靠近時才顯示 */}
              {!isUser && message.content_json?.food?.total_food_cost && (
                                  <motion.button
                    whileHover={{ scale: 1.2 }}
                    className="w-12 h-8 md:w-12 md:h-6 bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] hover:from-[#FF9BB3] hover:to-[#FFCC7A] text-white rounded-full shadow-lg transition-all flex items-center justify-center touch-manipulation"
                    title={`消耗 ${message.content_json.food.total_food_cost} 食量`}
                  >
                    <span className="text-xs font-medium flex items-center space-x-1">
                      <img src="/apple-icon.svg" alt="蘋果" className="w-5 h-5" />
                      <span>{message.content_json.food.total_food_cost}</span>
                    </span>
                  </motion.button>
              )}

              {/* 複製按鈕 */}
              <motion.button
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.8 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyMessage();
                }}
                className="w-8 h-8 md:w-6 md:h-6 bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] hover:from-[#FF9BB3] hover:to-[#FFCC7A] text-white rounded-full shadow-lg transition-all flex items-center justify-center touch-manipulation"
                title="複製訊息內容"
              >
                <ClipboardDocumentIcon className="w-4 h-4 sm:w-3 sm:h-3" />
              </motion.button>

              {/* 刪除按鈕 */}
              {onDelete && (
                <motion.button
                  whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
                  whileTap={{ scale: 0.8 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(message.id);
                    setShowMobileActions(false);
                  }}
                  className="w-8 h-8 md:w-6 md:h-6 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all flex items-center justify-center touch-manipulation"
                  title="刪除這條訊息"
                >
                  <XMarkIcon className="w-4 h-4 sm:w-3 sm:h-3" />
                </motion.button>
              )}
            </div>

            {/* 任務創建指示器 */}
            {message.type === 'task_created' && (
              <div className="mt-3 p-3 bg-white/20 rounded-lg">
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>任務已創建</span>
                </div>
              </div>
            )}
          </motion.div>

          {/* 時間戳與狀態 */}
          <div className={`flex items-center space-x-2 mt-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
            <span className="text-xs text-[#2B3A3B]/70">
            {message.timestamp.toLocaleTimeString('zh-TW', {
              hour: '2-digit',
              minute: '2-digit'
            })}
            </span>
            {/* 訊息狀態指示器（僅用戶訊息） */}
            {isUser && message.status && (
              <MessageStatusIndicator status={message.status} compact />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ========================================
// 任務卡片組件
// ========================================

interface TaskCardProps {
  task: Task;
}

function TaskCard({ task }: TaskCardProps) {
  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'in_progress': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'completed': return 'text-green-600 bg-green-100 border-green-200';
      case 'failed': return 'text-red-600 bg-red-100 border-red-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'pending': return ClockIcon;
      case 'in_progress': return SparklesIcon;
      case 'completed': return CheckCircleIcon;
      case 'failed': return ExclamationTriangleIcon;
      default: return ClockIcon;
    }
  };

  const StatusIcon = getStatusIcon(task.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ scale: 1.02 }}
      className="bg-white/60 backdrop-blur-sm border border-[#EADBC8] rounded-xl p-4 shadow-sm hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-medium text-[#4B4036] text-sm mb-1">{task.title}</h4>
          <p className="text-xs text-[#2B3A3B] line-clamp-2">{task.description}</p>
        </div>
        
        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
          <StatusIcon className="w-3 h-3" />
          <span>
            {task.status === 'pending' ? '等待' :
             task.status === 'in_progress' ? '進行中' :
             task.status === 'completed' ? '完成' : '失敗'}
          </span>
        </div>
      </div>

      {/* 分配的角色 */}
      <div className="flex items-center space-x-2 mb-3">
        <span className="text-xs text-[#2B3A3B]">分配給:</span>
        <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${
          task.assignedTo === 'hibi' ? 'from-orange-400 to-red-500' :
          task.assignedTo === 'mori' ? 'from-amber-400 to-orange-500' : 
          'from-blue-400 to-cyan-500'
        }`} />
      </div>

      {/* 進度條 */}
      {task.status === 'in_progress' && (
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-[#2B3A3B]">進度</span>
            <span className="text-xs font-medium text-[#4B4036]">{Math.round(task.progress)}%</span>
          </div>
          <div className="w-full bg-[#F8F5EC] rounded-full h-1.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${task.progress}%` }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] h-1.5 rounded-full"
            />
          </div>
        </div>
      )}

      {/* 時間 */}
      <div className="text-xs text-[#2B3A3B]/70">
        {task.createdAt.toLocaleString('zh-TW')}
      </div>
    </motion.div>
  );

}
