'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import {
  PaperAirplaneIcon,
  FaceSmileIcon,
  PhotoIcon,
  MicrophoneIcon,
  XMarkIcon,
  ArrowPathIcon,
  SpeakerWaveIcon,
  StopIcon,
  ClipboardDocumentIcon,
  SparklesIcon,
  ArrowLeftIcon,
  ClockIcon,
  UserIcon,
  PuzzlePieceIcon,
  Bars3Icon,
  EllipsisHorizontalIcon,
  PlusIcon,
  CpuChipIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  Cog6ToothIcon,
  ArrowDownTrayIcon,
  AdjustmentsHorizontalIcon,
  AcademicCapIcon,
  PaintBrushIcon,
  UsersIcon
} from '@heroicons/react/24/outline';

// Helper to parse raw multi-model content
const parseMultiModelContent = (content: string) => {
  if (!content) return null;
  const regex = /### \[Model: (.*?)\]([\s\S]*?)(?=### \[Model: |$)/g;
  const matches = [...content.matchAll(regex)];
  if (matches.length <= 1) return null;

  return matches.map(match => ({
    model: match[1].trim(),
    content: match[2].trim().replace(/\*\*/g, '') // Remove bold syntax for cleaner look
  }));
};
import AppSidebar from '@/components/AppSidebar';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import { createSaasClient } from '@/lib/supabase-saas';
import Image from 'next/image';
import { MessageStatusIndicator } from '@/components/ai-companion/MessageStatusIndicator';
import { FoodBalanceDisplay } from '@/components/ai-companion/FoodBalanceDisplay';
import { SecureImageDisplay } from '@/components/ai-companion/SecureImageDisplay';
import { convertToPublicUrl, convertToShortUrl, getShortDisplayUrl, extractStoragePath } from '@/lib/getSignedImageUrl';

// ⭐ 全局發送鎖（跨組件實例共享，防止 React Strict Mode 雙重掛載）
const globalSendingLock = new Map<string, boolean>();

// 添加水印到圖片的輔助函數
const addWatermarkToImage = async (blob: Blob): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    // 創建圖片對象
    const img = document.createElement('img');
    const watermarkImg = document.createElement('img');

    // 載入原始圖片
    img.onload = () => {
      // 載入水印圖片
      watermarkImg.onload = () => {
        try {
          // 創建 Canvas
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('無法創建 Canvas 上下文'));
            return;
          }

          // 設置 Canvas 尺寸為原始圖片尺寸
          canvas.width = img.width;
          canvas.height = img.height;

          console.log('📐 [Watermark] 圖片尺寸:', img.width, 'x', img.height);

          // 繪製原始圖片
          ctx.drawImage(img, 0, 0);

          // 計算水印尺寸（約為圖片寬度的 4-6%，但確保不超過圖片尺寸）
          const baseSize = Math.min(img.width, img.height);
          const watermarkSize = Math.min(
            Math.max(baseSize * 0.05, 24), // 最小 24px
            Math.min(baseSize * 0.08, 48) // 最大 48px
          );

          console.log('🎯 [Watermark] 水印尺寸:', watermarkSize);

          // 計算水印位置（右下角，留一些邊距）
          // 邊距為水印尺寸的 20%，至少 4px
          const padding = Math.max(4, watermarkSize * 0.2);

          // 計算水印位置，確保不超出邊界
          let watermarkX = canvas.width - watermarkSize - padding;
          let watermarkY = canvas.height - watermarkSize - padding;

          // 邊界檢查：確保水印完全在圖片範圍內
          if (watermarkX < 0) {
            watermarkX = padding;
            console.warn('⚠️ [Watermark] X 位置超出，調整為:', watermarkX);
          }
          if (watermarkY < 0) {
            watermarkY = padding;
            console.warn('⚠️ [Watermark] Y 位置超出，調整為:', watermarkY);
          }

          // 最終檢查：確保水印不會超出 canvas 邊界
          if (watermarkX + watermarkSize > canvas.width) {
            watermarkX = canvas.width - watermarkSize - padding;
            if (watermarkX < 0) watermarkX = 0;
            console.warn('⚠️ [Watermark] X 位置調整為:', watermarkX);
          }
          if (watermarkY + watermarkSize > canvas.height) {
            watermarkY = canvas.height - watermarkSize - padding;
            if (watermarkY < 0) watermarkY = 0;
            console.warn('⚠️ [Watermark] Y 位置調整為:', watermarkY);
          }

          console.log('📍 [Watermark] 最終位置:', watermarkX, watermarkY);

          // 繪製水印（帶透明度）
          ctx.globalAlpha = 0.7; // 70% 透明度
          ctx.drawImage(
            watermarkImg,
            watermarkX,
            watermarkY,
            watermarkSize,
            watermarkSize
          );
          ctx.globalAlpha = 1.0; // 恢復透明度

          console.log('✅ [Watermark] 水印繪製完成');

          // 轉換為 Blob
          canvas.toBlob(
            (resultBlob) => {
              if (resultBlob) {
                console.log('✅ [Watermark] Canvas 轉換成功，大小:', resultBlob.size);
                resolve(resultBlob);
              } else {
                console.error('❌ [Watermark] Canvas 轉換失敗');
                reject(new Error('Canvas 轉換失敗'));
              }
            },
            blob.type || 'image/png',
            0.95 // 高品質
          );
        } catch (error) {
          console.error('❌ [Watermark] 繪製錯誤:', error);
          reject(error);
        }
      };

      watermarkImg.onerror = (error) => {
        // 如果水印載入失敗，直接返回原始圖片
        console.warn('⚠️ [Download] 水印圖片載入失敗，使用原始圖片:', error);
        resolve(blob);
      };

      // 載入水印圖片
      watermarkImg.crossOrigin = 'anonymous';
      watermarkImg.src = '/@hanami.png';
    };

    img.onerror = (error) => {
      console.error('❌ [Download] 原始圖片載入失敗:', error);
      reject(new Error('原始圖片載入失敗'));
    };

    // 載入原始圖片
    img.crossOrigin = 'anonymous';
    img.src = URL.createObjectURL(blob);
  });
};

// 下載圖片函數（帶水印）
const downloadImage = async (imageUrl: string, filename?: string) => {
  try {
    // 檢查 URL 類型
    const isAuthenticated = imageUrl.includes('/authenticated/');
    const isPublic = imageUrl.includes('/public/');
    const isSigned = imageUrl.includes('/sign/');

    // 提取 storage path
    const storagePath = extractStoragePath(imageUrl);

    // 提取檔案名稱（格式：hanamiEcho + ID）
    const getFilename = () => {
      if (filename) return filename;

      // 從 storage path 或 URL 中提取檔案名稱
      let fileName = '';

      if (storagePath) {
        // 如果有 storage path，直接取最後一部分（檔案名）
        const pathParts = storagePath.split('/');
        fileName = pathParts[pathParts.length - 1];
      } else {
        // 否則從 URL 中提取
        const urlParts = imageUrl.split('/');
        fileName = urlParts[urlParts.length - 1].split('?')[0];
      }

      // 移除查詢參數
      fileName = fileName.split('?')[0];

      // 提取副檔名（先移除副檔名，避免重複）
      const fileNameWithoutExt = fileName.includes('.') ? fileName.substring(0, fileName.lastIndexOf('.')) : fileName;
      const fileExt = fileName.includes('.') ? fileName.split('.').pop() : 'png';

      // 處理檔案名：移除 gemini_ 前綴和時間戳，只保留 UUID 部分
      // 格式：gemini_1761836671505_adf71822_2121_41b5_9ead_2356e314b2c4.png
      // 目標：hanamiEcho_adf71822_2121_41b5_9ead_2356e314b2c4.png
      let imageId = fileNameWithoutExt;

      // 移除 gemini_ 前綴
      if (imageId.startsWith('gemini_')) {
        imageId = imageId.replace(/^gemini_/, '');
      }

      // 移除時間戳（通常是數字，格式：1761836671505_）
      // 匹配：數字_開頭的模式
      imageId = imageId.replace(/^\d+_/, '');

      // 如果移除後為空或格式不對，嘗試從原始檔案名提取 UUID
      if (!imageId || imageId.length < 10) {
        // 嘗試提取 UUID（格式：xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx 或 xxxxxxxx_xxxx_xxxx_xxxx_xxxxxxxxxxxx）
        const uuidMatch = fileNameWithoutExt.match(/([0-9a-f]{8}[_-]?[0-9a-f]{4}[_-]?[0-9a-f]{4}[_-]?[0-9a-f]{4}[_-]?[0-9a-f]{12})/i);
        if (uuidMatch) {
          imageId = uuidMatch[1].replace(/[_-]/g, '_');
        } else {
          // 如果找不到 UUID，使用檔案名的最後部分（去掉前綴後）
          const parts = fileNameWithoutExt.split('_');
          if (parts.length > 1) {
            // 取最後幾個部分作為 ID
            imageId = parts.slice(-4).join('_');
          } else {
            imageId = fileNameWithoutExt;
          }
        }
      }

      // 確保 imageId 不包含副檔名
      imageId = imageId.split('.')[0];

      // 組合最終檔案名：hanamiEcho + ID + 副檔名
      const finalFileName = `hanamiEcho_${imageId}.${fileExt}`;

      return finalFileName;
    };

    if (!storagePath) {
      throw new Error('無法提取 storage path');
    }

    // 如果是 authenticated 或 signed URL，必須使用代理 API
    // 如果是 public URL，可以先嘗試直接下載，失敗再用代理 API
    if (isAuthenticated || isSigned) {
      // 直接使用代理 API，不嘗試直接下載
    } else if (isPublic) {
      // 先嘗試直接下載（public URL 可能可以直接下載）
      try {
        const response = await fetch(imageUrl, {
          mode: 'cors',
          credentials: 'omit'
        });

        if (response.ok) {
          const blob = await response.blob();

          // 添加水印
          const watermarkedBlob = await addWatermarkToImage(blob);

          // 創建 Blob URL 並強制下載
          const url = window.URL.createObjectURL(watermarkedBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = getFilename();
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();

          setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
          }, 100);

          const { default: toast } = await import('react-hot-toast');
          toast.success('圖片下載成功', {
            icon: <ArrowDownTrayIcon className="w-5 h-5 text-green-600" />,
            duration: 2000,
            style: {
              background: '#fff',
              color: '#4B4036',
            }
          });
          return;
        } else {
          console.warn('⚠️ [Download] 直接下載失敗，狀態:', response.status, '改用代理 API');
        }
      } catch (directError) {
        console.warn('⚠️ [Download] 直接下載異常:', directError, '改用代理 API');
      }
    }

    // 使用代理 API 下載
    const proxyUrl = `/api/storage/proxy-image?path=${encodeURIComponent(storagePath)}&download=1`;

    const response = await fetch(proxyUrl);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [Download] 代理 API 失敗:', response.status);
      throw new Error(`代理 API 失敗: ${response.status} - ${errorText}`);
    }

    const blob = await response.blob();

    // 添加水印
    const watermarkedBlob = await addWatermarkToImage(blob);

    // 創建 Blob URL 並強制下載
    const url = window.URL.createObjectURL(watermarkedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = getFilename();
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();

    // 清理
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);

    const { default: toast } = await import('react-hot-toast');
    toast.success('圖片下載成功', {
      icon: <ArrowDownTrayIcon className="w-5 h-5 text-green-600" />,
      duration: 2000,
      style: {
        background: '#fff',
        color: '#4B4036',
      }
    });
  } catch (error) {
    console.error('❌ [Download] 下載圖片失敗:', error instanceof Error ? error.message : '未知錯誤');

    const { default: toast } = await import('react-hot-toast');
    toast.error(`下載失敗: ${error instanceof Error ? error.message : '未知錯誤'}`, {
      icon: <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />,
      duration: 3000,
      style: {
        background: '#fff',
        color: '#4B4036',
      }
    });
  }
};

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

const traditionalChineseChars = ['圖', '設', '計', '創', '風', '實', '現', '時', '間', '開', '請', '輸', '內', '這', '兩', '個', '為', '寫', '採', '麼', '藝', '術', '制', '隻', '強', '壯', '現', '實', '過', '來', '會', '說', '話', '題', '問', '題', '應', '該', '還', '沒', '關', '係', '發', '現', '經', '過', '來', '說', '話'];
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

const MESSAGE_PAGE_SIZE = 20;
const MESSAGE_FETCH_LIMIT = MESSAGE_PAGE_SIZE + 1;
const PICO_MODEL_INDICATORS = ['pico', 'flash-image', 'image'];


interface Message {
  id: string;
  content: string;
  sender: 'user' | 'hibi' | 'mori' | 'pico' | 'system';
  timestamp: Date;
  type: 'text' | 'image' | 'task_created' | 'task_completed';
  status?: 'queued' | 'processing' | 'completed' | 'error' | 'cancelled' | 'sent'; // 新增：訊息狀態
  taskId?: string;
  metadata?: any;
  content_json?: any; // 新增：內容 JSON 資料（包含食量資訊）
  processingWorkerId?: string;
  model_used?: string;
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

import { ChatSettingsPanel } from '@/components/ai-companion/ChatSettingsPanel';
import { BlockSelectionModal } from '@/components/ai-companion/BlockSelectionModal';
import { RoleInstance, Task } from '@/types/ai-companion';
import { MindBlock } from '@/types/mind-block';




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
  const userId = user?.id;
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.roomId as string;

  // 使用 SaaS 系統的 Supabase 客戶端
  const saasSupabase = createSaasClient();
  // 使用更可靠的方法獲取 URL 參數 - 使用 Next.js 的 useSearchParams
  const [urlParams, setUrlParams] = useState<{ initialRole?: string, companion?: string }>({});

  useEffect(() => {
    // 使用 Next.js 的 searchParams，避免直接訪問 window.location
    try {
      const initialRole = searchParams.get('initialRole');
      const companion = searchParams.get('companion');

      setUrlParams({
        initialRole: initialRole || undefined,
        companion: companion || undefined
      });
    } catch (error) {
      // 如果 searchParams 不可用，嘗試從 window.location 獲取（僅客戶端）
      if (typeof window !== 'undefined') {
        try {
          const urlSearchParams = new URLSearchParams(window.location.search);
          const initialRole = urlSearchParams.get('initialRole');
          const companion = urlSearchParams.get('companion');

          setUrlParams({
            initialRole: initialRole || undefined,
            companion: companion || undefined
          });
        } catch (fallbackError) {
          console.error('❌ 無法獲取 URL 參數:', fallbackError);
        }
      }
    }
  }, [searchParams]);

  const initialRoleParam = urlParams.initialRole;
  const companionParam = urlParams.companion;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  // 直接使用 React 狀態，不使用 sessionStorage
  const [messages, setMessages] = useState<Message[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [queueCount, setQueueCount] = useState<number>(0); // 輪候人數
  const [isSending, setIsSending] = useState(false);  // ⭐ 新增發送鎖
  const isSendingRef = useRef(false);  // ⭐ 同步發送鎖（避免 React 狀態更新延遲）
  const [processingCompanion, setProcessingCompanion] = useState<'hibi' | 'mori' | 'pico' | null>(null); // ⭐ 記錄正在處理的角色
  const subscriptionRef = useRef<any>(null);  // ⭐ 保存訂閱引用
  const processedMessageIds = useRef(new Set<string>());  // ⭐ 追蹤已處理的訊息 ID
  const [forceRender, setForceRender] = useState(0);  // ⭐ 選擇性重新渲染計數器

  // 選擇性重新渲染函數 - 只在特定情況下觸發
  const triggerSelectiveRender = useCallback((reason: string) => {
    console.log(`🔄 [選擇性渲染] 觸發原因: ${reason}`);
    setForceRender(prev => prev + 1);
  }, []);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [activeRoles, setActiveRoles] = useState<('hibi' | 'mori' | 'pico')[]>(() => {
    console.log('🏁 初始化 activeRoles 為空陣列 (將被 URL 參數或資料庫覆蓋)');
    return []; // 空陣列，稍後會被 URL 參數或資料庫覆蓋
  });
  const [selectedCompanion, setSelectedCompanion] = useState<'hibi' | 'mori' | 'pico'>('hibi'); // 預設 hibi 統籌
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Loadout Panel State
  const [roleInstancesMap, setRoleInstancesMap] = useState<Record<string, RoleInstance>>({});
  const [showLoadout, setShowLoadout] = useState(true);
  const [loadoutModalState, setLoadoutModalState] = useState<{
    isOpen: boolean;
    slotType: 'role' | 'style' | 'task';
    roleInstanceId: string;
  }>({
    isOpen: false,
    slotType: 'role',
    roleInstanceId: '',
  });

  // Listen for open-block-selector event
  useEffect(() => {
    const handleOpenBlockSelector = (e: CustomEvent) => {
      setLoadoutModalState({
        isOpen: true,
        slotType: e.detail.type,
        roleInstanceId: e.detail.roleInstanceId,
      });
    };

    window.addEventListener('open-block-selector' as any, handleOpenBlockSelector as any);
    return () => {
      window.removeEventListener('open-block-selector' as any, handleOpenBlockSelector as any);
    };
  }, []);

  // 監聽模型選擇開啟事件（從 ChatSettingsPanel 觸發）
  useEffect(() => {
    const handleOpenModelSelector = (e: CustomEvent) => {
      const companionId = e.detail?.companionId as 'hibi' | 'mori' | 'pico' | undefined;
      if (!companionId) return;

      // 切換到對應夥伴
      setSelectedCompanion(companionId);

      // 展開對應角色的模型選擇區域
      if (companionId === 'pico') {
        setPicoModelOptionsExpanded(true);
        setPicoModelOptionsExpandedForModal(true);
        setPicoModelSelectOpen(true);
      } else if (companionId === 'mori') {
        setMoriModelOptionsExpanded(true);
        setMoriModelOptionsExpandedForModal(true);
        setMoriModelSelectOpen(true);
      } else if (companionId === 'hibi') {
        setHibiModelOptionsExpanded(true);
        setHibiModelOptionsExpandedForModal(true);
        setHibiModelSelectOpen(true);
      }
    };

    window.addEventListener('open-model-selector' as any, handleOpenModelSelector as any);
    return () => {
      window.removeEventListener('open-model-selector' as any, handleOpenModelSelector as any);
    };
  }, []);

  // Sync Mind Blocks to DB Helper
  const syncMindBlocksToDb = async (roleId: string, equippedBlocks: Record<string, any>) => {
    if (!user?.id) return;

    try {
      // 1. Fetch currently active blocks from DB
      const { data: dbActive } = await (saasSupabase as any)
        .from('role_mind_blocks')
        .select('mind_block_id')
        .eq('user_id', user.id)
        .eq('role_id', roleId)
        .eq('is_active', true);

      const dbActiveIds = (dbActive || []).map((r: any) => r.mind_block_id);
      const equippedIds = Object.values(equippedBlocks).map((b: any) => b.id);

      // 2. Identify changes
      const toDeactivate = dbActiveIds.filter((id: string) => !equippedIds.includes(id));
      const toActivate = equippedIds.filter((id: string) => !dbActiveIds.includes(id));

      // 3. Deactivate removed blocks
      if (toDeactivate.length > 0) {
        console.log('🔄 [Sync] Deactivating mind blocks:', toDeactivate);
        await (saasSupabase as any)
          .from('role_mind_blocks')
          .update({ is_active: false })
          .in('mind_block_id', toDeactivate)
          .eq('role_id', roleId)
          .eq('user_id', user.id);
      }

      // 4. Activate added blocks
      if (toActivate.length > 0) {
        console.log('🔄 [Sync] Activating mind blocks:', toActivate);
        for (const blockId of toActivate) {
          const { data: existing } = await (saasSupabase as any)
            .from('role_mind_blocks')
            .select('id')
            .eq('user_id', user.id)
            .eq('role_id', roleId)
            .eq('mind_block_id', blockId)
            .maybeSingle();

          if (existing) {
            await (saasSupabase as any)
              .from('role_mind_blocks')
              .update({ is_active: true })
              .eq('id', existing.id);
          } else {
            await (saasSupabase as any).from('role_mind_blocks').insert({
              user_id: user.id,
              role_id: roleId,
              mind_block_id: blockId,
              is_active: true
            });
          }
        }
      }
    } catch (error) {
      console.error('❌ Error syncing mind blocks:', error);
    }
  };

  // Sync on Load Effect
  const hasInitialSyncedRef = useRef(false);
  useEffect(() => {
    if (hasInitialSyncedRef.current || !user?.id || Object.keys(roleInstancesMap).length === 0) return;

    const syncAllRoles = async () => {
      console.log('🔄 [Sync] Starting initial mind block sync...');
      for (const key in roleInstancesMap) {
        const instance = roleInstancesMap[key];
        if (instance.role_id && instance.settings?.equipped_blocks) {
          await syncMindBlocksToDb(instance.role_id, instance.settings.equipped_blocks);
        }
      }
      console.log('✅ [Sync] Initial mind block sync completed');
      hasInitialSyncedRef.current = true;
    };

    syncAllRoles();
  }, [roleInstancesMap, user?.id]);

  // Update Role Instance Helper
  const handleUpdateRoleInstance = async (instanceId: string, updates: Partial<RoleInstance>) => {
    try {
      const supabase = createSaasClient();

      // Sync mind blocks to role_mind_blocks table if equipped_blocks is updated
      if (updates.settings && (updates.settings as any).equipped_blocks) {
        const newEquipped = (updates.settings as any).equipped_blocks || {};

        // Get current instance to get role_id
        const currentInstance = Object.values(roleInstancesMap).find(instance => instance.id === instanceId);

        if (currentInstance && currentInstance.role_id) {
          await syncMindBlocksToDb(currentInstance.role_id, newEquipped);
        }
      }

      // 1. Update instance
      const { data: instanceData, error } = await (supabase as any)
        .from('role_instances')
        .update(updates)
        .eq('id', instanceId)
        .select('*')
        .single();

      if (error) throw error;

      // 2. Fetch role data separately
      let fullData = instanceData;
      if (instanceData && instanceData.role_id) {
        const { data: roleData } = await supabase
          .from('ai_roles')
          .select('*')
          .eq('id', instanceData.role_id)
          .single();

        if (roleData) {
          fullData = { ...instanceData, role: roleData } as any;
        }
      }

      // Update local state
      setRoleInstancesMap(prev => {
        const newMap = { ...prev };
        // Find the key for this instance
        const key = Object.keys(newMap).find(k => newMap[k].id === instanceId);
        if (key) {
          newMap[key] = fullData as unknown as RoleInstance;
        }
        return newMap;
      });

      const { default: toast } = await import('react-hot-toast');
      toast.success('角色設定已更新');
    } catch (error) {
      console.error('更新角色失敗:', error);
      const { default: toast } = await import('react-hot-toast');
      toast.error('更新角色失敗');
    }
  };

  // Handle Block Selection
  const handleBlockSelect = async (block: MindBlock) => {
    const { roleInstanceId, slotType } = loadoutModalState;
    // Find the role instance in the map
    const roleKey = Object.keys(roleInstancesMap).find(k => roleInstancesMap[k].id === roleInstanceId);
    const roleInstance = roleKey ? roleInstancesMap[roleKey] : null;

    if (roleInstance) {
      const currentSettings = roleInstance.settings || {};
      const currentEquipped = currentSettings.equipped_blocks || {};

      const newEquipped = {
        ...currentEquipped,
        [slotType]: block
      };

      // Construct new system prompt
      let newSystemPrompt = roleInstance.role?.system_prompt || '';

      if (newEquipped.role) newSystemPrompt += `\n\n[Role Definition]\n${newEquipped.role.content_json?.blocks?.[0]?.params?.content || ''}`;
      if (newEquipped.style) newSystemPrompt += `\n\n[Style Guide]\n${newEquipped.style.content_json?.blocks?.[0]?.params?.content || ''}`;
      if (newEquipped.task) newSystemPrompt += `\n\n[Current Task]\n${newEquipped.task.content_json?.blocks?.[0]?.params?.content || ''}`;

      await handleUpdateRoleInstance(roleInstanceId, {
        settings: {
          ...currentSettings,
          equipped_blocks: newEquipped
        },
        system_prompt_override: newSystemPrompt
      });
      setLoadoutModalState(prev => ({ ...prev, isOpen: false }));
    }
  };

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

  // 所有角色模型選擇相關狀態
  const DEFAULT_MODEL_SENTINEL = '__default__';

  // 皮可角色模型選擇狀態
  const [picoSelectedModel, setPicoSelectedModel] = useState<string>(DEFAULT_MODEL_SENTINEL);
  const [picoRoleDefaultModel, setPicoRoleDefaultModel] = useState<string>('google/gemini-2.5-flash-image-preview');
  const [picoModelSearch, setPicoModelSearch] = useState('');
  const [showAllPicoModels, setShowAllPicoModels] = useState(false);
  const [picoModelOptionsExpanded, setPicoModelOptionsExpanded] = useState<boolean>(false);

  // 墨墨角色模型選擇狀態
  const [moriSelectedModel, setMoriSelectedModel] = useState<string>(DEFAULT_MODEL_SENTINEL);
  const [moriRoleDefaultModel, setMoriRoleDefaultModel] = useState<string>('deepseek/deepseek-chat-v3.1,google/gemini-2.5-flash-lite,x-ai/grok-4-fast:free,openai/gpt-5-mini');
  const [moriSelectedModelsMulti, setMoriSelectedModelsMulti] = useState<string[]>([]);
  const [moriModelSearch, setMoriModelSearch] = useState('');
  const [showAllMoriModels, setShowAllMoriModels] = useState(false);
  const [moriModelOptionsExpanded, setMoriModelOptionsExpanded] = useState<boolean>(false);

  // Hibi 角色模型選擇狀態
  const [hibiSelectedModel, setHibiSelectedModel] = useState<string>(DEFAULT_MODEL_SENTINEL);
  const [hibiRoleDefaultModel, setHibiRoleDefaultModel] = useState<string>('openai/gpt-5');
  const [hibiModelSearch, setHibiModelSearch] = useState('');
  const [showAllHibiModels, setShowAllHibiModels] = useState(false);
  const [hibiModelOptionsExpanded, setHibiModelOptionsExpanded] = useState<boolean>(false);

  // 模型選擇區域展開狀態（每個角色獨立）
  const [picoModelOptionsExpandedForModal, setPicoModelOptionsExpandedForModal] = useState(false);
  const [moriModelOptionsExpandedForModal, setMoriModelOptionsExpandedForModal] = useState(false);
  const [hibiModelOptionsExpandedForModal, setHibiModelOptionsExpandedForModal] = useState(false);

  // 模型選擇模態窗口狀態（每個角色獨立）
  const [picoModelSelectOpen, setPicoModelSelectOpen] = useState(false);
  const [moriModelSelectOpen, setMoriModelSelectOpen] = useState(false);
  const [hibiModelSelectOpen, setHibiModelSelectOpen] = useState(false);
  const picoModelSelectRef = useRef<HTMLDivElement>(null);
  const moriModelSelectRef = useRef<HTMLDivElement>(null);
  const hibiModelSelectRef = useRef<HTMLDivElement>(null);
  const picoModelInputRef = useRef<HTMLInputElement>(null);
  const moriModelInputRef = useRef<HTMLInputElement>(null);
  const hibiModelInputRef = useRef<HTMLInputElement>(null);
  const [picoModelDropdownPosition, setPicoModelDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const [moriModelDropdownPosition, setMoriModelDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const [hibiModelDropdownPosition, setHibiModelDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);

  // 共用狀態
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [loadingPicoModels, setLoadingPicoModels] = useState(false);
  const [loadingMoriModels, setLoadingMoriModels] = useState(false);
  const [loadingHibiModels, setLoadingHibiModels] = useState(false);

  // Feature flag: 是否顯示皮可的「圖片設定選項」區塊
  const ENABLE_PICO_IMAGE_OPTIONS = false;

  const [currentRoomId, setCurrentRoomId] = useState<string | null>(roomId);
  // 兼容的 UUID 生成函數
  const generateUUID = () => {
    // 優先使用 crypto.randomUUID（如果支援）
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback：使用 Math.random 生成 UUID v4 格式
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
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
  const [openPanels, setOpenPanels] = useState<{ roles: boolean; invite: boolean }>({ roles: false, invite: false });
  const [inviteRoleSelectOpen, setInviteRoleSelectOpen] = useState(false);
  const [inviteRoleSearch, setInviteRoleSearch] = useState('');
  const inviteRoleSelectRef = useRef<HTMLDivElement>(null);
  const inviteRoleInputRef = useRef<HTMLInputElement>(null);
  const [inviteRoleDropdownPosition, setInviteRoleDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
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
  const initialScrollPendingRef = useRef<boolean>(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
  const [showScrollToBottomButton, setShowScrollToBottomButton] = useState(false);
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

  const isPicoMessageRecord = useCallback((msg: any): boolean => {
    const content = msg?.content || '';
    const modelId: string | undefined = msg?.content_json?.model;
    const provider: string | undefined = msg?.content_json?.provider;
    const hasPicoModel =
      typeof modelId === 'string' &&
      PICO_MODEL_INDICATORS.some((indicator) => modelId.toLowerCase().includes(indicator));
    const contentHasPicoSlug = typeof content === 'string' && content.includes('/pico-artist/');

    return (
      msg?.assigned_role_id === 'pico-artist' ||
      msg?.processing_worker_id === 'pico-processor' ||
      msg?.agent_id === 'pico-artist' ||
      contentHasPicoSlug ||
      (hasPicoModel && provider?.toLowerCase() === 'google' && msg?.message_type !== 'task_created') ||
      msg?.message_type === 'image'
    );
  }, []);

  const transformSupabaseMessages = useCallback((rawMessages: any[]): Message[] => {
    return rawMessages.map((msg: any) => {
      let sender: Message['sender'] = 'user';

      // Handle ai_messages schema (sender_type)
      if (msg.sender_type === 'user') {
        sender = 'user';
      } else if (msg.sender_type === 'role') {
        // Try to get role name from content_json
        const roleName = msg.content_json?.role_name;
        if (roleName && ['hibi', 'mori', 'pico'].includes(roleName)) {
          sender = roleName;
        } else {
          // Fallback logic if role_name is missing or invalid
          if (
            msg.assigned_role_id === 'mori-researcher' ||
            msg.processing_worker_id === 'mori-processor' ||
            msg.content_json?.provider === 'multi-model'
          ) {
            sender = 'mori';
          } else if (isPicoMessageRecord(msg)) {
            sender = 'pico';
          } else {
            sender = 'hibi'; // Default to hibi
          }
        }
      }
      // Backward compatibility for chat_messages schema (role)
      else if (msg.role === 'user') {
        sender = 'user';
      } else if (msg.role === 'assistant' || msg.role === 'agent') {
        const roleName = msg.content_json?.role_name;
        if (roleName) {
          sender = roleName;
        } else if (
          msg.assigned_role_id === 'mori-researcher' ||
          msg.processing_worker_id === 'mori-processor' ||
          msg.content_json?.provider === 'multi-model'
        ) {
          sender = 'mori';
        } else if (isPicoMessageRecord(msg)) {
          sender = 'pico';
        } else {
          sender = 'hibi';
        }
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
        content_json: msg.content_json,
        processingWorkerId: msg.processing_worker_id || undefined,
        model_used: msg.model_used
      };
    });
  }, [isPicoMessageRecord]);

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

  // 載入可用模型配置
  const loadAvailableModels = async () => {
    setLoadingPicoModels(true);
    setLoadingMoriModels(true);
    setLoadingHibiModels(true);
    try {
      const { data, error } = await saasSupabase
        .from('available_models')
        .select('*')
        .order('is_free', { ascending: false })
        .order('input_cost_usd', { ascending: true });

      if (error) {
        console.error('載入模型配置錯誤:', error);
        setAvailableModels([]);
      } else {
        console.log('✅ 成功載入模型配置:', data?.length || 0, '個模型');
        setAvailableModels(data || []);
      }
    } catch (error) {
      console.error('載入模型配置異常:', error);
      setAvailableModels([]);
    } finally {
      setLoadingPicoModels(false);
      setLoadingMoriModels(false);
      setLoadingHibiModels(false);
    }
  };

  // 載入角色模型設定的通用函數
  const loadRoleModelSettings = async (roleId: 'hibi' | 'mori' | 'pico') => {
    if (!user?.id) return;

    try {
      // 設置載入狀態
      if (roleId === 'pico') setLoadingPicoModels(true);
      else if (roleId === 'mori') setLoadingMoriModels(true);
      else setLoadingHibiModels(true);

      const supabase = createSaasClient();

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

      // 1. 先查角色基本資訊以獲取 role_id 和系統預設模型
      const { data: roleData, error: roleError } = await supabase
        .from('ai_roles')
        .select('id, default_model')
        .eq('slug', roleSlug)
        .maybeSingle();

      if (roleError || !roleData) {
        console.error(`載入${roleId}角色設定錯誤:`, roleError);
        return;
      }

      const systemDefault = (roleData as any)?.default_model ||
        (roleId === 'pico' ? 'google/gemini-2.5-flash-image-preview' :
          roleId === 'mori' ? 'deepseek/deepseek-chat-v3.1,google/gemini-2.5-flash-lite,x-ai/grok-4-fast:free,openai/gpt-5-mini' :
            'openai/gpt-5');

      // 設置系統預設模型
      if (roleId === 'pico') setPicoRoleDefaultModel(systemDefault);
      else if (roleId === 'mori') setMoriRoleDefaultModel(systemDefault);
      else setHibiRoleDefaultModel(systemDefault);

      // 2. 查詢用戶覆寫設定
      const { data: userSettings } = await supabase
        .from('user_role_settings')
        .select('model_override')
        .eq('user_id', user.id)
        .eq('role_id', (roleData as any).id)
        .eq('is_active', true)
        .maybeSingle();

      const userOverrideModel = (userSettings as any)?.model_override;

      if (userOverrideModel) {
        // 用戶有覆寫設定
        if (roleId === 'pico') {
          setPicoSelectedModel(userOverrideModel);
          if (availableModels.length > 0) {
            const modelData = availableModels.find((m: any) => m.model_id === userOverrideModel);
            setPicoModelSearch(modelData?.display_name || userOverrideModel);
          }
        } else if (roleId === 'mori') {
          // Mori 支援多選模型
          if (userOverrideModel.includes(',')) {
            const modelIds = userOverrideModel.split(',').map((id: string) => id.trim()).filter(Boolean);
            setMoriSelectedModelsMulti(modelIds);
            setMoriSelectedModel(DEFAULT_MODEL_SENTINEL);
          } else {
            setMoriSelectedModel(userOverrideModel);
            setMoriSelectedModelsMulti([]);
            if (availableModels.length > 0) {
              const modelData = availableModels.find((m: any) => m.model_id === userOverrideModel);
              setMoriModelSearch(modelData?.display_name || userOverrideModel);
            }
          }
        } else { // hibi
          setHibiSelectedModel(userOverrideModel);
          if (availableModels.length > 0) {
            const modelData = availableModels.find((m: any) => m.model_id === userOverrideModel);
            setHibiModelSearch(modelData?.display_name || userOverrideModel);
          }
        }
      } else {
        // 使用系統預設
        if (roleId === 'pico') {
          setPicoSelectedModel(systemDefault);
          setPicoModelSearch('');
          if (availableModels.length > 0) {
            const modelData = availableModels.find((m: any) => m.model_id === systemDefault);
            setPicoModelSearch(modelData?.display_name || systemDefault);
          }
        } else if (roleId === 'mori') {
          // Mori 預設是多選模型
          if (systemDefault.includes(',')) {
            const modelIds = systemDefault.split(',').map((id: string) => id.trim()).filter(Boolean);
            setMoriSelectedModelsMulti(modelIds);
            setMoriSelectedModel(DEFAULT_MODEL_SENTINEL);
          } else {
            setMoriSelectedModel(systemDefault);
            setMoriSelectedModelsMulti([]);
            if (availableModels.length > 0) {
              const modelData = availableModels.find((m: any) => m.model_id === systemDefault);
              setMoriModelSearch(modelData?.display_name || systemDefault);
            }
          }
        } else { // hibi
          setHibiSelectedModel(systemDefault);
          if (availableModels.length > 0) {
            const modelData = availableModels.find((m: any) => m.model_id === systemDefault);
            setHibiModelSearch(modelData?.display_name || systemDefault);
          }
        }
      }
    } catch (error) {
      console.error(`載入${roleId}模型設定異常:`, error);
    } finally {
      if (roleId === 'pico') setLoadingPicoModels(false);
      else if (roleId === 'mori') setLoadingMoriModels(false);
      else setLoadingHibiModels(false);
    }
  };

  // 載入皮可角色的模型設定（保留舊函數名稱以保持兼容性）
  const loadPicoModelSettings = () => loadRoleModelSettings('pico');

  // 載入墨墨角色的模型設定
  const loadMoriModelSettings = () => loadRoleModelSettings('mori');

  // 載入 Hibi 角色的模型設定
  const loadHibiModelSettings = () => loadRoleModelSettings('hibi');

  // 當可用模型列表載入完成後，更新所有角色的搜尋框顯示
  useEffect(() => {
    if (availableModels.length === 0) return;

    // 更新皮可的搜尋框
    if (picoSelectedModel !== DEFAULT_MODEL_SENTINEL && !picoModelSearch) {
      const modelData = availableModels.find((m: any) => m.model_id === picoSelectedModel);
      if (modelData) {
        setPicoModelSearch(modelData.display_name || picoSelectedModel);
      } else {
        setPicoModelSearch(picoSelectedModel);
      }
    }

    // 更新墨墨的搜尋框
    if (moriSelectedModel !== DEFAULT_MODEL_SENTINEL && !moriModelSearch) {
      const modelData = availableModels.find((m: any) => m.model_id === moriSelectedModel);
      if (modelData) {
        setMoriModelSearch(modelData.display_name || moriSelectedModel);
      } else {
        setMoriModelSearch(moriSelectedModel);
      }
    }

    // 更新 Hibi 的搜尋框
    if (hibiSelectedModel !== DEFAULT_MODEL_SENTINEL && !hibiModelSearch) {
      const modelData = availableModels.find((m: any) => m.model_id === hibiSelectedModel);
      if (modelData) {
        setHibiModelSearch(modelData.display_name || hibiSelectedModel);
      } else {
        setHibiModelSearch(hibiSelectedModel);
      }
    }
  }, [availableModels, picoSelectedModel, moriSelectedModel, hibiSelectedModel]);
  // 保存角色模型設定的通用函數（使用 user_role_settings 表）
  const saveRoleModelSettings = async (roleId: 'hibi' | 'mori' | 'pico', modelId: string | string[]) => {
    if (!user?.id) return;

    try {
      const supabase = createSaasClient();

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

      // 1. 先獲取角色 ID
      const { data: roleData, error: roleError } = await supabase
        .from('ai_roles')
        .select('id, system_prompt, tone')
        .eq('slug', roleSlug)
        .maybeSingle();

      if (roleError || !roleData) {
        console.error(`找不到角色: ${roleSlug}`, roleError);
        const { default: toast } = await import('react-hot-toast');
        toast.error('找不到角色設定', {
          icon: <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />,
          duration: 2000,
          style: {
            background: '#fff',
            color: '#4B4036',
          }
        });
        return;
      }

      const roleId_db = (roleData as any).id;

      // 2. 獲取系統預設的指引和語氣以便比較
      const systemGuidance = (roleData as any)?.system_prompt || '';
      const systemTone = (roleData as any)?.tone || '';

      // 處理模型 ID（支援多選）
      const resolvedModel = Array.isArray(modelId) ? modelId.join(',') : modelId;

      // 如果選擇預設，刪除用戶覆寫記錄
      if (resolvedModel === DEFAULT_MODEL_SENTINEL || (Array.isArray(modelId) && modelId.length === 0)) {
        const { error } = await supabase
          .from('user_role_settings')
          .delete()
          .eq('user_id', user.id)
          .eq('role_id', roleId_db);

        if (error) {
          console.error('刪除用戶覆寫記錄錯誤:', error);
          const { default: toast } = await import('react-hot-toast');
          toast.error('恢復預設模型失敗', {
            icon: <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />,
            duration: 2000,
            style: {
              background: '#fff',
              color: '#4B4036',
            }
          });
          return;
        }

        // 更新本地狀態
        if (roleId === 'pico') {
          setPicoSelectedModel(DEFAULT_MODEL_SENTINEL);
          setPicoModelSearch('');
        } else if (roleId === 'mori') {
          setMoriSelectedModel(DEFAULT_MODEL_SENTINEL);
          setMoriSelectedModelsMulti([]);
          setMoriModelSearch('');
        } else {
          setHibiSelectedModel(DEFAULT_MODEL_SENTINEL);
          setHibiModelSearch('');
        }

        const { default: toast } = await import('react-hot-toast');
        toast.success('已恢復預設模型', {
          icon: <CpuChipIcon className="w-5 h-5 text-green-600" />,
          duration: 2000,
          style: {
            background: '#fff',
            color: '#4B4036',
          }
        });
        return;
      }

      // 儲存或更新 user_role_settings（只儲存非預設的設定）
      const { data, error } = await (supabase as any)
        .from('user_role_settings')
        .upsert({
          user_id: user.id,
          role_id: roleId_db,
          model_override: resolvedModel,
          guidance_override: null, // 不改變指引
          tone_override: null, // 不改變語氣
          is_active: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,role_id'
        })
        .select()
        .single();

      if (error) {
        console.error(`保存${roleId}模型設定錯誤:`, error);
        const { default: toast } = await import('react-hot-toast');
        toast.error(`保存設定失敗: ${error.message || '未知錯誤'}`, {
          icon: <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />,
          duration: 3000,
          style: {
            background: '#fff',
            color: '#4B4036',
          }
        });
        return;
      }

      // 更新本地狀態
      if (roleId === 'pico') {
        setPicoSelectedModel(resolvedModel);
        const modelData = availableModels.find((m: any) => m.model_id === resolvedModel);
        setPicoModelSearch(modelData?.display_name || resolvedModel);
      } else if (roleId === 'mori') {
        if (Array.isArray(modelId)) {
          setMoriSelectedModelsMulti(modelId);
          setMoriSelectedModel(DEFAULT_MODEL_SENTINEL);
        } else {
          setMoriSelectedModel(resolvedModel);
          setMoriSelectedModelsMulti([]);
          const modelData = availableModels.find((m: any) => m.model_id === resolvedModel);
          setMoriModelSearch(modelData?.display_name || resolvedModel);
        }
      } else {
        setHibiSelectedModel(resolvedModel);
        const modelData = availableModels.find((m: any) => m.model_id === resolvedModel);
        setHibiModelSearch(modelData?.display_name || resolvedModel);
      }

      const { default: toast } = await import('react-hot-toast');
      toast.success('模型設定已更新', {
        icon: <CpuChipIcon className="w-5 h-5 text-green-600" />,
        duration: 2000,
        style: {
          background: '#fff',
          color: '#4B4036',
        }
      });

      console.log(`✅ ${roleId}模型設定已保存:`, data);
    } catch (error) {
      console.error(`保存${roleId}模型設定異常:`, error);
      const { default: toast } = await import('react-hot-toast');
      toast.error(`保存模型設定失敗: ${error instanceof Error ? error.message : '未知錯誤'}`, {
        icon: <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />,
        duration: 3000,
        style: {
          background: '#fff',
          color: '#4B4036',
        }
      });
    }
  };

  // 保存皮可角色的模型設定（保留舊函數名稱以保持兼容性）
  const savePicoModelSettings = async (modelId: string) => {
    await saveRoleModelSettings('pico', modelId);
  };

  // 保存墨墨角色的模型設定
  const saveMoriModelSettings = async (modelId: string | string[]) => {
    await saveRoleModelSettings('mori', modelId);
  };

  // 保存 Hibi 角色的模型設定
  const saveHibiModelSettings = async (modelId: string) => {
    await saveRoleModelSettings('hibi', modelId);
  };

  // 根據角色過濾模型
  const getFilteredPicoModels = () => {
    if (showAllPicoModels) return availableModels;

    return availableModels.filter((m) => {
      const caps: string[] = Array.isArray(m.capabilities) ? m.capabilities : [];
      const hasVision = caps.includes('vision') || m.model_type === 'multimodal';
      return hasVision;
    });
  };

  // 根據角色過濾模型（墨墨需要 search 能力）
  const getFilteredMoriModels = () => {
    if (showAllMoriModels) return availableModels;

    return availableModels.filter((m) => {
      const caps: string[] = Array.isArray(m.capabilities) ? m.capabilities : [];
      const hasSearch = caps.includes('web_search') || /perplexity|sonar|search/.test((m.provider || '') + ' ' + (m.model_name || '') + ' ' + (m.model_id || ''));
      return hasSearch;
    });
  };

  // 根據角色過濾模型（Hibi 需要 code 能力）
  const getFilteredHibiModels = () => {
    if (showAllHibiModels) return availableModels;

    return availableModels.filter((m) => {
      const caps: string[] = Array.isArray(m.capabilities) ? m.capabilities : [];
      const hasCode = caps.includes('code') || m.model_type === 'code';
      return hasCode;
    });
  };

  // 移除所有 free 相關字樣的通用函數
  const stripFree = (s: string): string => {
    if (!s) return '';
    return s
      .replace(/\((?:free|免費)\)/gi, '')
      .replace(/（(?:免費)）/g, '')
      .replace(/\bfree\b/gi, '')
      .replace(/免費/gi, '')
      .replace(/:free/gi, '') // 移除 model_id 中的 :free
      .replace(/\s{2,}/g, ' ')
      .trim();
  };

  // 格式化模型顯示名稱（支援多選模型）
  const formatModelDisplay = (modelId: string | undefined): string => {
    if (!modelId) return '';

    // 如果包含逗號，表示是多選模型
    if (modelId.includes(',')) {
      const modelIds = modelId.split(',').map((id: string) => id.trim()).filter(Boolean);
      const names = modelIds.map((id: string) => {
        // 先移除 model_id 中的 :free
        const cleanId = id.replace(/:free/gi, '');
        const m = availableModels.find((x: any) => x.model_id === id || x.model_id === cleanId);
        const raw = m?.display_name || cleanId;
        return stripFree(raw);
      });
      return names.join('、');
    }

    // 單選模型
    const model = availableModels.find((m: any) => m.model_id === modelId);
    if (!model) return modelId;

    const displayName = model.display_name || modelId;
    return stripFree(displayName);
  };
  // 計算 100 字問題食量
  const computeFoodFor100 = (model: any): number => {
    if (!model) return 1;
    const inputCost = Number(model.input_cost_usd || 0);
    const totalUsd = (100 / 1_000_000) * inputCost;
    const food = Math.ceil(totalUsd * 3 * 100);
    return Math.max(food, 1);
  };
  // 載入模型設定（當用戶登入且有角色活躍時）
  useEffect(() => {
    if (user?.id && activeRoles.length > 0) {
      // 先載入可用模型列表，然後載入所有活躍角色的用戶設定
      loadAvailableModels().then(() => {
        // 載入所有活躍角色的模型設定
        activeRoles.forEach(roleId => {
          if (roleId === 'pico') loadPicoModelSettings();
          else if (roleId === 'mori') loadMoriModelSettings();
          else if (roleId === 'hibi') loadHibiModelSettings();
        });
      });
    }
  }, [user?.id, activeRoles]);

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

      const supabase = createSaasClient();

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
          // 第二步：查 role_instances 取得完整資訊
          const { data: roleInstancesData, error: roleInstancesError } = await supabase
            .from('role_instances')
            .select('*')
            .in('id', roleInstanceIds);

          let roleInstances: any[] = (roleInstancesData as any[]) || [];

          if (!roleInstancesError && roleInstancesData && roleInstancesData.length > 0) {
            // Fetch roles separately
            const roleIds = roleInstancesData.map((ri: any) => ri.role_id).filter(Boolean);
            if (roleIds.length > 0) {
              const { data: rolesData } = await supabase
                .from('ai_roles')
                .select('*')
                .in('id', roleIds);

              if (rolesData) {
                // Merge role data
                roleInstances = roleInstancesData.map((ri: any) => ({
                  ...ri,
                  role: rolesData.find((r: any) => r.id === ri.role_id)
                }));

                // Fetch equipped mind blocks
                if (user) {
                  const { data: mindBlocksData } = await supabase
                    .from('role_mind_blocks' as any)
                    .select('role_id, mind_block_id, is_active')
                    .in('role_id', roleIds)
                    .eq('user_id', user.id)
                    .eq('is_active', true);

                  if (mindBlocksData && mindBlocksData.length > 0) {
                    const blockIds = mindBlocksData.map((mb: any) => mb.mind_block_id);
                    const { data: blocksInfo } = await supabase
                      .from('mind_blocks' as any)
                      .select('id, title')
                      .in('id', blockIds);

                    if (blocksInfo) {
                      roleInstances = roleInstances.map((ri: any) => {
                        const equipped = mindBlocksData.filter((mb: any) => mb.role_id === ri.role_id);
                        const blocks = equipped.map((mb: any) => blocksInfo.find((b: any) => b.id === mb.mind_block_id)).filter(Boolean);
                        return {
                          ...ri,
                          mindBlocks: blocks
                        };
                      });
                    }
                  }
                }
              }
            }
          }

          if (roleInstancesError) {
            console.log('⚠️ 載入角色實例失敗:', roleInstancesError);
          } else {
            // Populate roleInstancesMap
            const newRoleInstancesMap: Record<string, RoleInstance> = {};

            const roleIds = (roleInstances || [])
              .map((ri: any) => {
                const slug = ri.role?.slug;
                if (slug) {
                  // Normalize slug to internal name
                  let internalName = slug;
                  if (slug.includes('hibi-manager')) internalName = 'hibi';
                  else if (slug.includes('mori-researcher')) internalName = 'mori';
                  else if (slug.includes('pico-artist')) internalName = 'pico';

                  newRoleInstancesMap[internalName] = ri as unknown as RoleInstance;
                  return ri.role_id;
                }
                return null;
              })
              .filter(Boolean);

            setRoleInstancesMap(newRoleInstancesMap);

            if (roleIds.length > 0) {
              // 第三步：查 ai_roles 取得 slug (其實上面已經有了，但為了保持原有邏輯結構暫時保留，或者直接用上面的 map 結果)
              // 既然我們已經 join 了 role，其實不需要第三步了，直接構造 roomRoles

              roomRoles = Object.values(newRoleInstancesMap).map((instance: any) => instance.role?.slug || instance.role?.name || '').filter(Boolean);
              console.log('✅ 從資料庫載入的房間角色:', roomRoles);
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
          const normalized = Array.from(new Set(roomRoles.map(normalize).filter(Boolean))) as ('hibi' | 'mori' | 'pico')[];
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
      const supabase = createSaasClient();

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
      if (!name) return null as unknown as 'hibi' | 'mori' | 'pico';
      const n = String(name).toLowerCase();
      // 支援新的 slug 格式和舊的格式
      if (n.includes('hibi') || n.includes('希希') || n.includes('hibi-manager')) return 'hibi';
      if (n.includes('mori') || n.includes('墨墨') || n.includes('mori-researcher')) return 'mori';
      if (n.includes('pico') || n.includes('皮可') || n.includes('pico-artist')) return 'pico';
      return null as unknown as 'hibi' | 'mori' | 'pico';
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
          const normalized = Array.from(new Set(parsedRoles.map(r => normalizeRole(r)).filter(Boolean))) as ('hibi' | 'mori' | 'pico')[];
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
              content_json: newMsg.content_json, // 新增：保存完整的 content_json
              model_used: newMsg.model_used // 新增：保存 model_used 用於 fallback
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
                setQueueCount(0); // 重置輪候人數
                setProcessingCompanion(null); // ⭐ 解除圖標鎖定
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
              setQueueCount(0); // 重置輪候人數
              setProcessingCompanion(null); // ⭐ 解除圖標鎖定
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
              setQueueCount(0); // 重置輪候人數
              setProcessingCompanion(null); // ⭐ 解除圖標鎖定
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
                  content_json: updatedMsg.content_json,
                  model_used: updatedMsg.model_used
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
                    sender: sender, // 更新 sender（以防有變化）
                    model_used: updatedMsg.model_used // 新增：保存 model_used 用於 fallback
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
                  content_json: updatedMsg.content_json,
                  model_used: updatedMsg.model_used
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
  }, [roomId, userId]);

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

  // 計算邀請角色下拉選單位置
  useEffect(() => {
    const updateDropdownPosition = () => {
      if (inviteRoleSelectOpen && inviteRoleInputRef.current) {
        const rect = inviteRoleInputRef.current.getBoundingClientRect();
        setInviteRoleDropdownPosition({
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width
        });
      } else {
        setInviteRoleDropdownPosition(null);
      }
    };

    updateDropdownPosition();

    // 監聽滾動和視窗大小改變
    if (inviteRoleSelectOpen) {
      const handleScroll = () => {
        requestAnimationFrame(updateDropdownPosition);
      };
      const handleResize = () => {
        requestAnimationFrame(updateDropdownPosition);
      };

      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }

    return undefined;
  }, [inviteRoleSelectOpen]);

  // 點擊外部關閉邀請角色下拉選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isClickInsideInput = inviteRoleSelectRef.current?.contains(target);
      const isClickInsideDropdown = (event.target as HTMLElement)?.closest('[data-invite-role-dropdown]');

      if (!isClickInsideInput && !isClickInsideDropdown) {
        setInviteRoleSelectOpen(false);
      }
    };

    if (inviteRoleSelectOpen && typeof document !== 'undefined') {
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
    }

    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('mousedown', handleClickOutside);
      }
    };
  }, [inviteRoleSelectOpen]);

  // 計算皮可模型選擇下拉選單位置
  useEffect(() => {
    const updateDropdownPosition = () => {
      if (picoModelSelectOpen && picoModelInputRef.current) {
        const rect = picoModelInputRef.current.getBoundingClientRect();
        setPicoModelDropdownPosition({
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width
        });
      } else {
        setPicoModelDropdownPosition(null);
      }
    };

    updateDropdownPosition();

    if (picoModelSelectOpen) {
      const handleScroll = () => {
        requestAnimationFrame(updateDropdownPosition);
      };
      const handleResize = () => {
        requestAnimationFrame(updateDropdownPosition);
      };

      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
    return undefined;
  }, [picoModelSelectOpen]);
  // 計算墨墨模型選擇下拉選單位置
  useEffect(() => {
    const updateDropdownPosition = () => {
      if (moriModelSelectOpen && moriModelInputRef.current) {
        const rect = moriModelInputRef.current.getBoundingClientRect();
        setMoriModelDropdownPosition({
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width
        });
      } else {
        setMoriModelDropdownPosition(null);
      }
    };

    updateDropdownPosition();

    if (moriModelSelectOpen) {
      const handleScroll = () => {
        requestAnimationFrame(updateDropdownPosition);
      };
      const handleResize = () => {
        requestAnimationFrame(updateDropdownPosition);
      };

      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
    return undefined;
  }, [moriModelSelectOpen]);

  // 計算 Hibi 模型選擇下拉選單位置
  useEffect(() => {
    const updateDropdownPosition = () => {
      if (hibiModelSelectOpen && hibiModelInputRef.current) {
        const rect = hibiModelInputRef.current.getBoundingClientRect();
        setHibiModelDropdownPosition({
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width
        });
      } else {
        setHibiModelDropdownPosition(null);
      }
    };

    updateDropdownPosition();

    if (hibiModelSelectOpen) {
      const handleScroll = () => {
        requestAnimationFrame(updateDropdownPosition);
      };
      const handleResize = () => {
        requestAnimationFrame(updateDropdownPosition);
      };

      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
    return undefined;
  }, [hibiModelSelectOpen]);

  // 點擊外部關閉皮可模型選擇下拉選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isClickInsideInput = picoModelSelectRef.current?.contains(target);
      const isClickInsideDropdown = (event.target as HTMLElement)?.closest('[data-pico-model-dropdown]');

      if (!isClickInsideInput && !isClickInsideDropdown) {
        setPicoModelSelectOpen(false);
      }
    };

    if (picoModelSelectOpen && typeof document !== 'undefined') {
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
    }

    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('mousedown', handleClickOutside);
      }
    };
  }, [picoModelSelectOpen]);

  // 點擊外部關閉墨墨模型選擇下拉選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isClickInsideInput = moriModelSelectRef.current?.contains(target);
      const isClickInsideDropdown = (event.target as HTMLElement)?.closest('[data-mori-model-dropdown]');

      if (!isClickInsideInput && !isClickInsideDropdown) {
        setMoriModelSelectOpen(false);
      }
    };

    if (moriModelSelectOpen && typeof document !== 'undefined') {
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
    }

    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('mousedown', handleClickOutside);
      }
    };
  }, [moriModelSelectOpen]);

  // 點擊外部關閉 Hibi 模型選擇下拉選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isClickInsideInput = hibiModelSelectRef.current?.contains(target);
      const isClickInsideDropdown = (event.target as HTMLElement)?.closest('[data-hibi-model-dropdown]');

      if (!isClickInsideInput && !isClickInsideDropdown) {
        setHibiModelSelectOpen(false);
      }
    };

    if (hibiModelSelectOpen && typeof document !== 'undefined') {
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
    }

    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('mousedown', handleClickOutside);
      }
    };
  }, [hibiModelSelectOpen]);

  // 當 activeRoles 變化時更新 room 的 activeCompanions
  useEffect(() => {
    if (!['hibi', 'mori', 'pico'].includes(selectedCompanion as any) && activeRoles.length > 0) {
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
      imagePath: '/3d-character-backgrounds/studio/lulu(front).png',
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
  const ensureRoomMembership = useCallback(async (roomId: string, userId: string) => {
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
  }, [saasSupabase]);

  // 調試日誌（已移除以減少控制台輸出）
  // console.log('🎯 當前房間狀態:', { roomId, initialRoleParam, companionParam, activeRoles, selectedCompanion });

  const loadInitialMessages = useCallback(async () => {
    if (!roomId || !userId) return;

    try {
      console.log('🔍 載入聊天室歷史訊息:', roomId);

      await ensureRoomMembership(roomId, userId);

      const { data, error } = await saasSupabase
        .from('ai_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(MESSAGE_FETCH_LIMIT);

      if (error) {
        console.error('❌ 載入歷史訊息失敗:', error);
        setHasMoreMessages(false);
        setHasLoadedHistory(true);
        return;
      }

      const historyMessages = data ?? [];
      console.log('🔍 資料庫查詢結果:', { historyMessages, error: null });
      console.log('🔍 查詢到的訊息數量:', historyMessages.length);

      const activeMessages = historyMessages.filter((msg: any) => msg.status !== 'deleted');
      // 如果返回的訊息數量小於請求的數量，代表沒有更多訊息
      const hasMore = historyMessages.length >= MESSAGE_FETCH_LIMIT;
      const limitedMessages = hasMore ? activeMessages.slice(0, MESSAGE_PAGE_SIZE) : activeMessages;
      console.log(`🔍 過濾已刪除訊息: 原始 ${historyMessages.length} 條，有效 ${activeMessages.length} 條，是否還有更多: ${hasMore}`);

      if (activeMessages.length === 0) {
        setMessages([]);
        setHasLoadedHistory(true);
        setHasMoreMessages(false);
        console.log('📝 沒有歷史訊息，準備顯示歡迎訊息');
        return;
      }

      const convertedMessages = transformSupabaseMessages(limitedMessages).reverse();

      setMessages(convertedMessages);
      setHasLoadedHistory(true);
      setHasMoreMessages(hasMore);
      console.log(`✅ 載入了 ${convertedMessages.length} 條歷史訊息`);

      const lastUserMessage = convertedMessages.filter(m => m.sender === 'user').pop();
      if (lastUserMessage && lastUserMessage.status === 'processing') {
        console.log('🔄 [載入] 檢測到最後一條用戶訊息狀態為 processing，顯示思考 UI');
        setIsLoading(true);
        setIsTyping(true);

        // ⭐ 安全機制：8秒後強制解除載入狀態，防止 UI 永久卡死
        setTimeout(() => {
          setIsLoading(current => {
            if (current) {
              console.warn('⚠️ [UI Safety] 8秒超時，強制解除載入狀態');
              return false;
            }
            return current;
          });
          setIsTyping(false);
        }, 8000);
      }

      triggerSelectiveRender('進入/刷新聊天室');

      setTimeout(() => {
        scrollToBottom();
      }, 200);
    } catch (error) {
      console.error('❌ 載入訊息錯誤:', error);
      setHasLoadedHistory(true);
      setHasMoreMessages(false);
    }
  }, [roomId, userId, ensureRoomMembership, saasSupabase, transformSupabaseMessages, triggerSelectiveRender]);

  const loadOlderMessages = useCallback(async (forceLoad = false) => {
    if (!roomId || !userId || isLoadingOlderMessages) return;
    if (!hasMoreMessages && !forceLoad) return;

    const oldestMessage = messages[0];
    if (!oldestMessage) {
      if (!forceLoad) setHasMoreMessages(false);
      return;
    }

    const previousFirstId = oldestMessage.id;
    const existingIds = new Set(messages.map(m => m.id));

    const container = messagesContainerRef.current;
    const previousScrollHeight = container?.scrollHeight ?? 0;
    const previousScrollTop = container?.scrollTop ?? 0;

    setIsLoadingOlderMessages(true);

    try {
      const { data, error } = await saasSupabase
        .from('ai_messages')
        .select('*')
        .eq('room_id', roomId)
        .lt('created_at', oldestMessage.timestamp.toISOString())
        .order('created_at', { ascending: false })
        .limit(MESSAGE_FETCH_LIMIT);

      if (error) {
        console.error('❌ 載入更多歷史訊息失敗:', error);
        setIsLoadingOlderMessages(false);
        return;
      }

      const historyMessages = data ?? [];
      const activeMessages = historyMessages.filter((msg: any) => msg.status !== 'deleted');
      // 如果返回的訊息數量小於請求的數量，代表沒有更多訊息
      const hasMoreAfter = historyMessages.length >= MESSAGE_FETCH_LIMIT;
      const limitedMessages = hasMoreAfter ? activeMessages.slice(0, MESSAGE_PAGE_SIZE) : activeMessages;

      console.log(`🔍 [loadOlderMessages] 原始訊息: ${historyMessages.length}, 有效訊息: ${activeMessages.length}, 是否還有更多: ${hasMoreAfter}`);

      if (activeMessages.length === 0) {
        if (!forceLoad) {
          setHasMoreMessages(hasMoreAfter);
        }
        setIsLoadingOlderMessages(false);
        return;
      }

      const convertedMessages = transformSupabaseMessages(limitedMessages).reverse();
      const uniqueMessages = convertedMessages.filter(msg => !existingIds.has(msg.id));

      if (uniqueMessages.length === 0) {
        if (!forceLoad) setHasMoreMessages(hasMoreAfter);
        setIsLoadingOlderMessages(false);
        return;
      }

      setMessages(prev => [...uniqueMessages, ...prev]);
      if (!forceLoad) {
        setHasMoreMessages(hasMoreAfter);
      }

      requestAnimationFrame(() => {
        const target = messagesContainerRef.current;
        if (!target) return;

        const newScrollHeight = target.scrollHeight;
        const delta = newScrollHeight - previousScrollHeight;
        const desiredTop = Math.max(0, previousScrollTop + delta - 40);
        const bottomLimit = Math.max(0, target.scrollHeight - target.clientHeight);

        target.scrollTop = Math.min(bottomLimit, desiredTop);
      });
    } catch (error) {
      console.error('❌ 載入更多歷史訊息時發生錯誤:', error);
    } finally {
      setIsLoadingOlderMessages(false);
    }
  }, [roomId, userId, isLoadingOlderMessages, hasMoreMessages, messages, saasSupabase, transformSupabaseMessages]);

  const handleMessagesScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;

    // 檢查是否向上滾動且距離底部超過 200px
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight;
    const clientHeight = target.clientHeight;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    // 當距離底部超過 200px 時顯示「返回最新」按鈕
    setShowScrollToBottomButton(distanceFromBottom > 200);

    // 原有的載入更多訊息邏輯
    if (scrollTop <= 40) {
      if (!hasLoadedHistory) return;
      if (!hasMoreMessages) return;
      if (isLoadingOlderMessages) return;
      loadOlderMessages();
    }
  }, [hasLoadedHistory, hasMoreMessages, isLoadingOlderMessages, loadOlderMessages]);

  useEffect(() => {
    setMessages([]);
    setHasLoadedHistory(false);
    setHasMoreMessages(true);

    if (!roomId || !userId) return;

    loadInitialMessages();
  }, [roomId, userId, loadInitialMessages]);

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

    // ⭐ 檢查房間標題是否已載入
    if (!room?.title || room.title === '載入中...') {
      console.log('⏳ 等待房間標題載入完成...');
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
    if (!initialScrollPendingRef.current) return;

    const timer = setTimeout(() => {
      scrollToBottom();
      initialScrollPendingRef.current = false;
    }, 100);

    return () => clearTimeout(timer);
  }, [messages.length]);
  // 計時器管理（從個人對話頁面複製）
  useEffect(() => {
    let queueUpdateInterval: NodeJS.Timeout | null = null;

    if (isLoading || isTyping) {
      // 當開始思考時，定期更新輪候人數
      const updateQueueCount = async () => {
        const roleHint = processingCompanion || selectedCompanion || (activeRoles[0] ?? null);
        console.log(`🔄 [輪候更新] 開始更新輪候人數: processingCompanion=${processingCompanion}, roleHint=${roleHint}, isLoading=${isLoading}, isTyping=${isTyping}`);
        if (roleHint && ['hibi', 'mori', 'pico'].includes(roleHint)) {
          const count = await getProcessingQueueCount(roleHint as 'hibi' | 'mori' | 'pico');
          console.log(`📊 [輪候更新] 查詢結果: count=${count}, 即將設置到狀態`);
          setQueueCount(count);
          console.log(`✅ [輪候更新] queueCount 已更新為: ${count}`);
        } else {
          console.log(`⚠️ [輪候更新] roleHint 無效或不在支援列表中: ${roleHint}`);
        }
      };

      // 立即查詢一次
      console.log(`🚀 [輪候更新] 立即執行第一次查詢`);
      updateQueueCount();

      // 每 5 秒更新一次輪候人數
      queueUpdateInterval = setInterval(() => {
        console.log(`⏰ [輪候更新] 定期更新觸發 (每5秒)`);
        updateQueueCount();
      }, 5000);

      // 根據 companion 和任務類型設定預估時間
      let estimatedSeconds = 5; // 預設 5 秒

      if (processingCompanion === 'pico') {
        // Pico 的任務類型判斷
        const lastMessage = messages[messages.length - 1]?.content || '';
        if (lastMessage.includes('畫') || lastMessage.includes('圖') || lastMessage.includes('創作') || lastMessage.includes('設計')) {
          estimatedSeconds = 35; // 複雜創作任務
        } else if (lastMessage.includes('簡單') || lastMessage.includes('快速')) {
          estimatedSeconds = 15; // 簡單任務
        } else {
          estimatedSeconds = 25; // 一般創作任務
        }
      } else if (processingCompanion === 'mori') {
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
      // 重置輪候人數
      setQueueCount(0);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      // 清理輪候人數更新定時器
      if (queueUpdateInterval) {
        clearInterval(queueUpdateInterval);
      }
    };
  }, [isLoading, isTyping, companionParam, selectedCompanion, messages, activeRoles, processingCompanion]);
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
                // 圖片 URL 已提取
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
            // 圖片 URL 已提取

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
                // 圖片 URL 已從 iframe 提取
              } else {
                responseContent = '🎨 創作完成！但圖片連結解析失敗。';
                console.error('❌ 無法從 iframe 提取圖片 URL');
              }
            } else if (rawResponse.includes('http') && (rawResponse.includes('.png') || rawResponse.includes('.jpg') || rawResponse.includes('.webp'))) {
              // 直接是圖片 URL
              imageUrl = rawResponse.trim();
              responseContent = `🎨 我為您創作完成了！太可愛了！`;
              messageType = 'image';
              // 圖片 URL 已識別
            } else {
              responseContent = rawResponse;
              console.log('📝 文字回應:', rawResponse);
            }
          }
        }

        console.log('🔍 最終 responseContent:', responseContent);
        // 圖片處理完成
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

    const container = messagesContainerRef.current;
    const isUserMessage = completeMessage.sender === 'user';
    const isAtBottom = container ? Math.abs(container.scrollHeight - container.clientHeight - container.scrollTop) < 10 : true;

    if (isUserMessage || isAtBottom) {
      requestAnimationFrame(() => scrollToBottom());
    }
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
    const aiMessage: Message = {
      id: generateUUID(),
      content,
      sender,
      timestamp: new Date(),
      type
    };

    setMessages(prev => [...prev, aiMessage]);

    const container = messagesContainerRef.current;
    const isAtBottom = container ? Math.abs(container.scrollHeight - container.clientHeight - container.scrollTop) < 10 : true;
    if (isAtBottom) {
      requestAnimationFrame(() => scrollToBottom());
    }

    await saveMessageToSupabase(aiMessage);
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
  const saveMessageToSupabase = async (message: Message, targetRoomId?: string): Promise<string | null> => {
    if (!user?.id) {
      console.warn('⚠️ 無用戶 ID，跳過訊息儲存');
      return null;
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
        .select()
        .single();

      if (error) {
        console.error('❌ 儲存訊息失敗:', error);
        console.error('❌ 錯誤詳情:', JSON.stringify(error, null, 2));
        return null;
      } else {
        console.log('✅ 訊息已儲存到 Supabase:', data);
        return data.id;
      }
    } catch (error) {
      console.error('❌ 儲存訊息錯誤:', error);
      return null;
    }
  };

  // 查詢角色 processing 和 queued 狀態訊息數量（輪候人數）
  const getProcessingQueueCount = async (roleId: 'hibi' | 'mori' | 'pico', excludeClientMsgId?: string): Promise<number> => {
    try {
      // 遷移到 ai_messages，暫時只查詢 status = 'processing' 的訊息
      // 注意：ai_messages 的結構與 chat_messages 不同，可能需要調整查詢條件

      if (!roomId) {
        return 0;
      }

      // 簡單查詢：查詢該房間內所有非用戶且狀態為 processing 的訊息
      // 這是一個近似值，因為 ai_messages 可能沒有 assigned_role_id
      const query = saasSupabase
        .from('ai_messages')
        .select('id', { count: 'exact', head: true })
        .eq('room_id', roomId)
        .eq('sender_type', 'role')
        // .eq('status', 'processing') // 假設 ai_messages 有 status 欄位且會被更新為 processing
        // 如果 status 欄位不可靠，可能需要其他方式判斷
        ;

      const { count, error } = await query;

      if (error) {
        console.error('❌ [輪候查詢] 查詢失敗:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('❌ [輪候查詢] 查詢異常:', error);
      return 0;
    }
  };

  // 呼叫 Edge Function 處理聊天
  const callChatProcessor = async (userMessage: string, roomId: string, roleHint: string) => {
    try {
      console.log('🚀 呼叫 chat-processor Edge Function...');
      const { data, error } = await saasSupabase.functions.invoke('chat-processor', {
        body: {
          message: userMessage,
          roomId: roomId,
          companionId: roleHint,
          userId: user?.id, // Pass userId for service role calls
          modelId: roleHint === 'mori'
            ? moriSelectedModelsMulti.join(',')
            : roleHint === 'hibi' ? hibiSelectedModel
              : roleHint === 'pico' ? picoSelectedModel
                : undefined,
          attachments: [] // TODO: 支援附件
        }
      });

      if (error) {
        console.error('❌ Edge Function 呼叫失敗:', error);
        throw error;
      }

      console.log('✅ Edge Function 回應:', JSON.stringify(data, null, 2));

      if (data.success && data.content) {
        // 成功，Edge Function 已經儲存了 assistant 訊息
        // 我們可以選擇重新載入訊息，或者手動添加到 UI
        // 這裡我們手動添加到 UI 以獲得更快的響應感
        // Determine sender based on model usage or role hint
        const isImageModel = data.model_used?.includes('image') || data.model_used?.includes('dall-e') || data.content_json?.image;
        const sender = isImageModel ? 'pico' : (roleHint as any);

        const aiMessage: Message = {
          id: data.messageId || Date.now().toString(),
          content: data.content,
          sender: sender,
          timestamp: new Date(),
          type: 'text',
          content_json: data.content_json,
          model_used: data.model_used || data.content_json?.model || data.content_json?.model_name
        };

        console.log('✅ [callChatProcessor] 準備添加 AI 訊息到 UI:', aiMessage);

        // 更新全局追蹤，防止 Realtime 重複添加
        if (aiMessage.id) {
          processedMessageIds.current.add(aiMessage.id);
          console.log('✅ [callChatProcessor] 已添加訊息 ID 到全局追蹤:', aiMessage.id);
        }

        setMessages(prev => {
          console.log('✅ [callChatProcessor] setMessages 被呼叫，當前訊息數:', prev.length);
          return [...prev, aiMessage];
        });
        return { success: true, messageId: data.messageId };
      } else {
        throw new Error(data.error || 'Unknown error from chat-processor');
      }
    } catch (error) {
      console.error('❌ 處理聊天失敗:', error);
      throw error;
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

    // ⭐ 預先查詢該角色的 processing/queued 訊息數量並設置輪候人數（用於顯示初始狀態）
    if (roleHint && ['hibi', 'mori', 'pico'].includes(roleHint)) {
      try {
        const queueCount = await getProcessingQueueCount(roleHint as 'hibi' | 'mori' | 'pico');
        setQueueCount(queueCount);
        console.log(`📋 [初始查詢] ${roleHint} 前面還有 ${queueCount} 個訊息正在排隊/處理中`);

        // 如果有輪候，顯示提示
        if (queueCount > 0) {
          const companionName = companions.find(c => c.id === roleHint)?.name || roleHint;
          const { default: toast } = await import('react-hot-toast');
          toast(`📋 ${companionName} 正在思考中...`, {
            icon: <ClockIcon className="w-5 h-5 text-blue-600" />,
            duration: 3000,
            style: {
              background: '#fff',
              color: '#4B4036',
            }
          });
        }
      } catch (error) {
        console.error('❌ 查詢輪候人數時發生錯誤:', error);
        setQueueCount(0);
      }
    } else {
      setQueueCount(0);
    }

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
    const tempClientMsgId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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

    // ⭐ 鎖定當前角色圖標（防止角色切換時圖標改變）
    if (roleHint && ['hibi', 'mori', 'pico'].includes(roleHint)) {
      setProcessingCompanion(roleHint as 'hibi' | 'mori' | 'pico');
      console.log(`🔒 [圖標鎖定] 鎖定角色圖標為: ${roleHint}`);
    }

    // ⭐ 在發送前再次查詢輪候人數（排除即將發送的訊息）
    if (roleHint && ['hibi', 'mori', 'pico'].includes(roleHint)) {
      try {
        console.log(`📋 [發送前] 準備查詢輪候人數 (${roleHint})...`);
        const queueCount = await getProcessingQueueCount(roleHint as 'hibi' | 'mori' | 'pico', tempClientMsgId);
        setQueueCount(queueCount);
        console.log(`📋 [發送前] ${roleHint} 前面還有 ${queueCount} 個訊息正在排隊/處理中`);
      } catch (error) {
        console.error('❌ 查詢輪候人數時發生錯誤:', error);
      }
    }

    try {
      // === 使用 Edge Function 發送訊息 ===
      console.log('📦 [Edge] 開始發送訊息到 Edge Function...');

      // 1. 儲存用戶訊息到 Supabase (Client Side)
      const savedMessageId = await saveMessageToSupabase(userMessage, roomId);

      if (!savedMessageId) {
        throw new Error('無法儲存用戶訊息');
      }

      // 更新 UI 中的訊息 ID
      setMessages(prev => {
        return prev.map(msg => {
          if (msg.id === tempMessageId) {
            return {
              ...msg,
              id: savedMessageId,
              status: 'sent'
            };
          }
          return msg;
        });
      });

      // 更新全局追蹤
      processedMessageIds.current.delete(tempMessageId);
      processedMessageIds.current.add(savedMessageId);

      // Check Session Before Invoke
      const { data: sessionData } = await saasSupabase.auth.getSession();
      const token = sessionData.session?.access_token;
      console.log(`🔑 [Edge] Invoke Token Check: ${token ? 'Present (' + token.substring(0, 10) + '...)' : 'MISSING'}`);

      if (!token) {
        console.error('❌ [Edge] No Auth Token available! Aborting invoke.');
        // Try to refresh session?
        const { data: refreshData, error: refreshError } = await saasSupabase.auth.refreshSession();
        if (refreshError || !refreshData.session) {
          throw new Error('User not authenticated (No Session)');
        }
        console.log('🔄 [Edge] Session refreshed successfully.');
      }

      // 2. 呼叫 Edge Function
      await callChatProcessor(messageContent, roomId, roleHint || 'hibi');

      // 3. 完成
      console.log('✅ [Edge] 訊息處理完成');

    } catch (error) {
      console.error('❌ [Edge] 發送失敗:', error);
      // Log the full error object structure
      if (typeof error === 'object' && error !== null) {
        console.error('❌ [Edge] Error Details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      }

      const { default: toast } = await import('react-hot-toast');
      toast.error('發送失敗，請稍後再試');

      // 更新訊息狀態為錯誤
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
    } finally {
      // 解鎖
      globalSendingLock.delete(lockKey);
      isSendingRef.current = false;
      setIsSending(false);
      setIsLoading(false);
      setIsTyping(false);
      setProcessingCompanion(null);
    }
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
          .from('ai_messages')
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
        .from('ai_messages')
        .delete()
        .eq('room_id', roomId);

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
        room_id: roomId as string,
        title: `協作任務：${userMessage.slice(0, 20)}...`,
        description: userMessage,
        task_type: 'general',
        workflow: {},
        assigned_roles: ['hibi'],
        status: 'queued',
        progress: 0,
        retry_count: 0,
        max_retries: 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
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
                          {companion?.imagePath ? (
                            <Image
                              src={companion.imagePath}
                              alt={companion.name || 'AI 角色'}
                              width={32}
                              height={32}
                              className="w-8 h-8 object-cover"
                              unoptimized={companion.imagePath.includes('(') || companion.imagePath.includes(')')}
                              onError={(e) => {
                                console.error('❌ [角色圖標] 圖片載入失敗:', companion.imagePath);
                                // 如果圖片載入失敗，顯示備用圖標
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent && companion?.icon) {
                                  const iconElement = document.createElement('div');
                                  iconElement.className = 'w-8 h-8 flex items-center justify-center';
                                  const IconComponent = companion.icon;
                                  parent.appendChild(iconElement);
                                }
                              }}
                            />
                          ) : (
                            <div className="w-8 h-8 flex items-center justify-center">
                              {companion?.icon && <companion.icon className="w-6 h-6 text-gray-400" />}
                            </div>
                          )}
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
                          setOpenPanels({ roles: true, invite: false }); // 打開時預設展開第一個面板
                          setInviteRoleSelectOpen(false);
                          setInviteRoleSearch('');
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
                          setShowSettingsPanel(!showSettingsPanel);
                          setShowMobileMenu(false);
                        }}
                        className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors"
                      >
                        <AdjustmentsHorizontalIcon className="w-5 h-5 text-[#4B4036]" />
                        <span className="text-sm font-medium text-[#4B4036]">
                          {showSettingsPanel ? '關閉設定面板' : '打開設定面板'}
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
                className={`p-2 rounded-xl transition-all shadow-md ${showSearchBox
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
                  const willOpen = !showSettingsModal;
                  setShowSettingsModal(willOpen);
                  setShowInviteModal(false); // 關閉邀請模態框
                  if (!willOpen) {
                    setEditingProject(false); // 關閉編輯模式
                    setOpenPanels({ roles: false, invite: false }); // 重置面板狀態
                  } else {
                    // 打開時，預設展開第一個面板
                    setOpenPanels({ roles: true, invite: false });
                    setInviteRoleSelectOpen(false);
                    setInviteRoleSearch('');
                  }
                }}
                className={`p-2 rounded-xl transition-all shadow-md ${showSettingsModal
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
                className={`p-2 rounded-xl transition-all shadow-md ${showBlackboard
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

              {/* Settings Panel Toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSettingsPanel(!showSettingsPanel)}
                animate={{
                  rotate: showSettingsPanel ? 180 : 0,
                  backgroundColor: showSettingsPanel ? "#FFB6C1" : "transparent"
                }}
                className={`p-2 rounded-xl transition-all shadow-md ${showSettingsPanel
                  ? "bg-[#FFB6C1] text-white"
                  : "bg-white/50 hover:bg-white/80 text-[#4B4036]"
                  }`}
                title={showSettingsPanel ? '關閉設定面板' : '打開設定面板'}
              >
                <AdjustmentsHorizontalIcon className="w-6 h-6" />
              </motion.button>
            </div>
          </div>
        </div>
      </nav >

      {/* 側邊欄 */}
      < AppSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)
        }
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
          <div
            ref={messagesContainerRef}
            onScroll={handleMessagesScroll}
            className="flex-1 overflow-y-auto p-6 space-y-4"
          >
            {showBlackboard && (
              <div className="w-full h-full min-h-[40vh] bg-white/70 backdrop-blur-sm rounded-2xl border border-[#EADBC8] p-6 flex flex-col items-center justify-center text-center">
                <h3 className="text-xl font-semibold text-[#4B4036] mb-2">專案黑板</h3>
                <p className="text-sm text-[#2B3A3B]/80 mb-4">黑板視圖已開啟，之後可替換為正式黑板元件。</p>
                <p className="text-xs text-[#2B3A3B]/60">點擊上方黑板按鈕可返回訊息視圖。</p>
              </div>
            )}
            {!showBlackboard && (
              <>
                {hasLoadedHistory && hasMoreMessages && messages.length > 0 && (
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => loadOlderMessages()}
                      disabled={isLoadingOlderMessages}
                      className={`px-4 py-2 mb-2 rounded-full border border-[#EADBC8] text-sm font-medium transition-all ${isLoadingOlderMessages
                        ? 'bg-[#F8F5EC] text-[#B8ABA0] cursor-not-allowed'
                        : 'bg-white/80 text-[#4B4036] hover:bg-[#FFF4E0] shadow-sm'
                        }`}
                    >
                      {isLoadingOlderMessages ? '載入中…' : '載入更多訊息'}
                    </button>
                  </div>
                )}
                {hasLoadedHistory && !hasMoreMessages && messages.length > 0 && (
                  <div className="flex justify-center">
                    <span className="px-3 py-1 text-xs text-[#8F7A65] bg-white/70 border border-[#EADBC8] rounded-full">
                      已顯示所有歷史訊息
                    </span>
                  </div>
                )}
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
              </>
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
                      className={`w-8 h-8 rounded-full bg-gradient-to-br ${processingCompanion === 'pico'
                        ? 'from-blue-400 to-cyan-500'
                        : processingCompanion === 'mori'
                          ? 'from-amber-400 to-orange-500'
                          : processingCompanion === 'hibi'
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
                            processingCompanion === 'pico'
                              ? '/3d-character-backgrounds/studio/Pico/Pico.png'
                              : processingCompanion === 'mori'
                                ? '/3d-character-backgrounds/studio/Mori/Mori.png'
                                : processingCompanion === 'hibi'
                                  ? '/3d-character-backgrounds/studio/lulu(front).png'
                                  : '/@hanami.png';
                          return src ? (
                            <Image
                              src={src}
                              alt="AI 助手"
                              width={24}
                              height={24}
                              className="w-6 h-6 object-cover"
                              unoptimized={src.includes('(') || src.includes(')')}
                            />
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
                            if (processingCompanion === 'pico') {
                              if (elapsedTime < 10) return '🎨 正在構思創作...';
                              if (elapsedTime < 20) return '✨ 正在發揮創意魔法...';
                              if (elapsedTime < 30) return '🖌️ 正在精心繪製...';
                              return '🌟 即將完成創作...';
                            } else if (processingCompanion === 'mori') {
                              if (elapsedTime < 3) return '🤔 正在分析問題...';
                              if (elapsedTime < 6) return '📚 正在查找資料...';
                              return '💡 正在整理答案...';
                            } else if (processingCompanion === 'hibi') {
                              if (elapsedTime < 5) return '🦊 正在統籌安排...';
                              if (elapsedTime < 10) return '⚡ 正在協調團隊...';
                              return '🎯 正在整合方案...';
                            } else {
                              return '🤖 團隊正在協作中...';
                            }
                          })()}
                        </motion.span>
                      </div>

                      {/* 輪候人數顯示 */}
                      {(queueCount > 0 || (isLoading || isTyping)) && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mb-2"
                        >
                          <div className={`flex items-center space-x-1.5 text-xs rounded-lg px-2 py-1.5 ${queueCount > 0
                            ? 'bg-blue-50/50 border border-blue-200/50'
                            : 'bg-gray-50/50 border border-gray-200/50'
                            }`}>
                            <ClockIcon className={`w-3.5 h-3.5 flex-shrink-0 ${queueCount > 0 ? 'text-blue-600' : 'text-gray-400'}`} />
                            <span className={`font-medium ${queueCount > 0 ? 'text-blue-700' : 'text-gray-600'}`}>
                              正在思考中...
                            </span>
                          </div>
                        </motion.div>
                      )}

                      {/* 動畫點點 */}
                      <div className="flex items-center space-x-1 mb-2">
                        <motion.div
                          animate={{ scale: [1, 1.4, 1] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                          className={`w-2 h-2 rounded-full bg-gradient-to-r ${processingCompanion === 'pico'
                            ? 'from-blue-400 to-cyan-500'
                            : processingCompanion === 'mori'
                              ? 'from-amber-400 to-orange-500'
                              : processingCompanion === 'hibi'
                                ? 'from-orange-400 to-red-500'
                                : 'from-purple-400 to-pink-500'
                            }`}
                        />
                        <motion.div
                          animate={{ scale: [1, 1.4, 1] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                          className={`w-2 h-2 rounded-full bg-gradient-to-r ${processingCompanion === 'pico'
                            ? 'from-blue-400 to-cyan-500'
                            : processingCompanion === 'mori'
                              ? 'from-amber-400 to-orange-500'
                              : processingCompanion === 'hibi'
                                ? 'from-orange-400 to-red-500'
                                : 'from-purple-400 to-pink-500'
                            }`}
                        />
                        <motion.div
                          animate={{ scale: [1, 1.4, 1] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                          className={`w-2 h-2 rounded-full bg-gradient-to-r ${processingCompanion === 'pico'
                            ? 'from-blue-400 to-cyan-500'
                            : processingCompanion === 'mori'
                              ? 'from-amber-400 to-orange-500'
                              : processingCompanion === 'hibi'
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
                          className={`h-1 rounded-full ${elapsedTime > estimatedTime
                            ? 'bg-gradient-to-r from-orange-400 to-red-500'
                            : processingCompanion === 'pico'
                              ? 'bg-gradient-to-r from-blue-400 to-cyan-500'
                              : processingCompanion === 'mori'
                                ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                                : processingCompanion === 'hibi'
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
                      {processingCompanion === 'pico' && (
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

                      {processingCompanion === 'mori' && (
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

                      {processingCompanion === 'hibi' && (
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

            {/* 返回最新訊息按鈕 */}
            <AnimatePresence>
              {showScrollToBottomButton && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.2 }}
                  className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50"
                >
                  <button
                    type="button"
                    onClick={scrollToBottom}
                    className="flex items-center justify-center w-12 h-12 bg-white/90 backdrop-blur-sm border-2 border-[#EADBC8] rounded-full shadow-lg hover:bg-[#FFF4E0] hover:scale-110 transition-all duration-200"
                    aria-label="返回最新訊息"
                  >
                    <svg
                      className="w-6 h-6 text-[#4B4036]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 14l-7 7m0 0l-7-7m7 7V3"
                      />
                    </svg>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
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
                    className={`relative flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-xl text-sm font-medium transition-all ${selectedCompanion === mode.id
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
            {/* Pico 圖片選項 - 目前隱藏，如需開啟請將條件改回 selectedCompanion === 'pico' */}
            {false && selectedCompanion === 'pico' && (
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
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${picoImageSize === size && !showCustomSizeInput
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
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center space-x-1 ${showCustomSizeInput
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
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${picoImageStyle === style.value && !showCustomStyleInput
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
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center space-x-1 ${showCustomStyleInput
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

            {/* 選擇 AI 模型選項 - 只在點選該角色時顯示 */}
            {selectedCompanion && activeRoles.includes(selectedCompanion) && (() => {
              const roleId = selectedCompanion;
              const companion = companions.find(c => c.id === roleId);
              if (!companion) return null;

              // 根據角色獲取對應的狀態和 refs
              const getRoleModelState = () => {
                if (roleId === 'pico') {
                  return {
                    expanded: picoModelOptionsExpandedForModal,
                    setExpanded: setPicoModelOptionsExpandedForModal,
                    modelSelectOpen: picoModelSelectOpen,
                    setModelSelectOpen: setPicoModelSelectOpen,
                    modelSelectRef: picoModelSelectRef,
                    modelInputRef: picoModelInputRef,
                    dropdownPosition: picoModelDropdownPosition,
                    selectedModel: picoSelectedModel,
                    setSelectedModel: setPicoSelectedModel,
                    roleDefaultModel: picoRoleDefaultModel,
                    modelSearch: picoModelSearch,
                    setModelSearch: setPicoModelSearch,
                    showAllModels: showAllPicoModels,
                    setShowAllModels: setShowAllPicoModels,
                    loading: loadingPicoModels,
                    saveFunction: savePicoModelSettings,
                    getFilteredModels: getFilteredPicoModels,
                    selectedModelsMulti: undefined,
                    setSelectedModelsMulti: undefined
                  };
                } else if (roleId === 'mori') {
                  return {
                    expanded: moriModelOptionsExpandedForModal,
                    setExpanded: setMoriModelOptionsExpandedForModal,
                    modelSelectOpen: moriModelSelectOpen,
                    setModelSelectOpen: setMoriModelSelectOpen,
                    modelSelectRef: moriModelSelectRef,
                    modelInputRef: moriModelInputRef,
                    dropdownPosition: moriModelDropdownPosition,
                    selectedModel: moriSelectedModel,
                    setSelectedModel: setMoriSelectedModel,
                    selectedModelsMulti: moriSelectedModelsMulti,
                    setSelectedModelsMulti: setMoriSelectedModelsMulti,
                    roleDefaultModel: moriRoleDefaultModel,
                    modelSearch: moriModelSearch,
                    setModelSearch: setMoriModelSearch,
                    showAllModels: showAllMoriModels,
                    setShowAllModels: setShowAllMoriModels,
                    loading: loadingMoriModels,
                    saveFunction: saveMoriModelSettings,
                    getFilteredModels: getFilteredMoriModels
                  };
                } else { // hibi
                  return {
                    expanded: hibiModelOptionsExpandedForModal,
                    setExpanded: setHibiModelOptionsExpandedForModal,
                    modelSelectOpen: hibiModelSelectOpen,
                    setModelSelectOpen: setHibiModelSelectOpen,
                    modelSelectRef: hibiModelSelectRef,
                    modelInputRef: hibiModelInputRef,
                    dropdownPosition: hibiModelDropdownPosition,
                    selectedModel: hibiSelectedModel,
                    setSelectedModel: setHibiSelectedModel,
                    roleDefaultModel: hibiRoleDefaultModel,
                    modelSearch: hibiModelSearch,
                    setModelSearch: setHibiModelSearch,
                    showAllModels: showAllHibiModels,
                    setShowAllModels: setShowAllHibiModels,
                    loading: loadingHibiModels,
                    saveFunction: saveHibiModelSettings,
                    getFilteredModels: getFilteredHibiModels,
                    selectedModelsMulti: undefined,
                    setSelectedModelsMulti: undefined
                  };
                }
              };
              const modelState = getRoleModelState();
              const dropdownDataAttr = roleId === 'pico' ? 'data-pico-model-dropdown' : roleId === 'mori' ? 'data-mori-model-dropdown' : 'data-hibi-model-dropdown';

              // 取得對應夥伴的角色實例與已裝備的思維積木標題
              const instanceForCompanion =
                roleInstancesMap[roleId] || Object.values(roleInstancesMap)[0] || null;
              const equippedBlocks = (instanceForCompanion?.settings as any)?.equipped_blocks || {};
              const mindTitle =
                equippedBlocks.role?.title ||
                equippedBlocks.style?.title ||
                equippedBlocks.task?.title ||
                '未裝備';

              return (
                <motion.div
                  key={roleId}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 overflow-hidden"
                >
                  {/* 標題按鈕 - 點擊展開/收起區域 */}
                  <motion.button
                    onClick={() => modelState.setExpanded(!modelState.expanded)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full p-3 bg-gradient-to-r from-[#FFB6C1]/10 to-[#FFD59A]/10 rounded-xl border border-[#EADBC8]/30 hover:border-[#EADBC8]/50 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <CpuChipIcon className={`w-5 h-5 ${roleId === 'pico' ? 'text-[#FFB6C1]' : roleId === 'mori' ? 'text-amber-500' : 'text-orange-500'}`} />
                      <span className="text-sm font-medium text-[#4B4036]">
                        {companion.name} - 選擇 AI 模型
                      </span>
                      {(modelState.selectedModel !== DEFAULT_MODEL_SENTINEL ||
                        (roleId === 'mori' && modelState.selectedModelsMulti && modelState.selectedModelsMulti.length > 0)) && (
                          <span className="px-2 py-0.5 bg-[#FFB6C1]/20 rounded-full text-xs text-[#FFB6C1]">
                            已選擇
                          </span>
                        )}
                    </div>
                    <motion.div
                      animate={{ rotate: modelState.expanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <svg className="w-5 h-5 text-[#4B4036]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </motion.div>
                  </motion.button>

                  {/* 模型選擇區域 - 可展開/收起 */}
                  <AnimatePresence>
                    {modelState.expanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 p-4 bg-gradient-to-r from-[#FFB6C1]/10 to-[#FFD59A]/10 rounded-xl border border-[#EADBC8]/30 space-y-3">
                          {modelState.loading ? (
                            <div className="flex items-center justify-center py-4">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#FFB6C1]"></div>
                              <span className="ml-2 text-sm text-[#4B4036]">載入中...</span>
                            </div>
                          ) : (
                            <>
                              {/* 當前選擇顯示和下拉選單 */}
                              <div className="relative" ref={modelState.modelSelectRef}>
                                <input
                                  ref={modelState.modelInputRef}
                                  type="text"
                                  value={modelState.modelSearch}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    modelState.setModelSearch(v);
                                    modelState.setModelSelectOpen(true);

                                    if (v === DEFAULT_MODEL_SENTINEL) {
                                      modelState.setSelectedModel(v);
                                      modelState.setModelSearch('');
                                      if (roleId === 'mori' && modelState.setSelectedModelsMulti) {
                                        modelState.setSelectedModelsMulti([]);
                                      }
                                      return;
                                    }
                                    if (roleId !== 'mori') {
                                      const exists = modelState.getFilteredModels().some((m: any) => m.model_id === v) || availableModels.some((m: any) => m.model_id === v);
                                      if (exists) modelState.setSelectedModel(v);
                                    }
                                  }}
                                  onFocus={() => { }}
                                  onBlur={() => { }}
                                  placeholder={(() => {
                                    if (roleId === 'mori') {
                                      if (modelState.selectedModelsMulti && modelState.selectedModelsMulti.length === 0) {
                                        return "選擇至少 2 個模型（最多 4 個）";
                                      }
                                      return "繼續選擇模型或輸入以搜尋...";
                                    }
                                    if (modelState.selectedModel === DEFAULT_MODEL_SENTINEL && modelState.roleDefaultModel) {
                                      const defaultDisplay = formatModelDisplay(modelState.roleDefaultModel);
                                      return defaultDisplay ? `預設（建議）：${defaultDisplay}` : "預設（建議）或輸入以搜尋模型";
                                    }
                                    return "預設（建議）或輸入以搜尋模型";
                                  })()}
                                  className="w-full p-3 pr-10 border border-blue-300 rounded-lg focus:ring-2 focus:ring-[#FFB6C1] focus:border-transparent bg-white text-[#4B4036] placeholder-gray-400 cursor-pointer"
                                  readOnly
                                  onClick={() => modelState.setModelSelectOpen(true)}
                                />
                                {/* 下拉箭頭 */}
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                  <motion.div
                                    animate={{ rotate: modelState.modelSelectOpen ? 180 : 0 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </motion.div>
                                </div>

                                {/* 彈出模態窗口 - 使用 Portal 渲染到 body */}
                                {typeof document !== 'undefined' && modelState.modelSelectOpen && createPortal(
                                  <AnimatePresence>
                                    <>
                                      {/* 背景遮罩 */}
                                      <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="fixed inset-0 bg-black/30 z-[9998]"
                                        onClick={() => modelState.setModelSelectOpen(false)}
                                      />
                                      {/* 模態窗口 */}
                                      <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                        style={{
                                          position: 'fixed',
                                          top: '50%',
                                          left: '50%',
                                          width: '90%',
                                          maxWidth: '600px',
                                          maxHeight: '70vh',
                                          zIndex: 9999
                                        }}
                                        className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col -translate-x-1/2 -translate-y-1/2"
                                        {...{ [dropdownDataAttr]: true }}
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {/* 標題欄 */}
                                        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EADBC8] bg-gradient-to-r from-[#FFB6C1]/10 to-[#FFD59A]/10">
                                          <div className="flex items-center gap-3">
                                            <CpuChipIcon className={`w-6 h-6 ${roleId === 'pico' ? 'text-[#FFB6C1]' : roleId === 'mori' ? 'text-amber-500' : 'text-orange-500'}`} />
                                            <h3 className="text-lg font-semibold text-[#4B4036]">為{companion.name}選擇大腦</h3>
                                          </div>
                                          <motion.button
                                            whileHover={{ scale: 1.1, rotate: 90 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => modelState.setModelSelectOpen(false)}
                                            className="p-1.5 hover:bg-white/50 rounded-full transition-colors"
                                          >
                                            <XMarkIcon className="w-5 h-5 text-[#4B4036]" />
                                          </motion.button>
                                        </div>

                                        {/* 搜尋框 */}
                                        <div className="px-6 py-4 border-b border-[#EADBC8]">
                                          <input
                                            type="text"
                                            value={modelState.modelSearch}
                                            onChange={(e) => {
                                              const v = e.target.value;
                                              modelState.setModelSearch(v);
                                            }}
                                            placeholder="搜尋模型..."
                                            className="w-full p-2.5 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFB6C1] focus:border-transparent bg-white text-[#4B4036]"
                                            autoFocus
                                          />
                                        </div>

                                        {/* 模型列表 */}
                                        <div className="overflow-y-auto flex-1">
                                          {/* 預設選項 */}
                                          <motion.button
                                            whileHover={{ backgroundColor: "#FFFBEB" }}
                                            whileTap={{ scale: 0.98 }}
                                            type="button"
                                            onMouseDown={(e) => {
                                              e.preventDefault();
                                              modelState.setSelectedModel(DEFAULT_MODEL_SENTINEL);
                                              modelState.setModelSearch('');
                                              modelState.setModelSelectOpen(false);
                                              if (roleId === 'mori' && modelState.setSelectedModelsMulti) {
                                                modelState.setSelectedModelsMulti([]);
                                              }
                                              // 將模型重設為預設並同步保存（會刪除 user_role_settings 覆寫紀錄）
                                              modelState.saveFunction(DEFAULT_MODEL_SENTINEL);
                                            }}
                                            className={`w-full text-left px-6 py-3 text-sm transition-colors border-b border-[#EADBC8]/30 ${modelState.selectedModel === DEFAULT_MODEL_SENTINEL
                                              ? 'bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white'
                                              : 'text-[#4B4036] hover:bg-[#FFFBEB]'
                                              }`}
                                          >
                                            <div className="font-medium">預設（建議）</div>
                                            {modelState.roleDefaultModel && (() => {
                                              const defaultModelData = modelState.getFilteredModels().find((m: any) => m.model_id === modelState.roleDefaultModel) || availableModels.find((m: any) => m.model_id === modelState.roleDefaultModel);
                                              return (
                                                <>
                                                  <div className={`text-xs mt-1 ${modelState.selectedModel === DEFAULT_MODEL_SENTINEL ? 'opacity-90' : 'opacity-70'}`}>
                                                    {formatModelDisplay(modelState.roleDefaultModel)}
                                                  </div>
                                                  {defaultModelData && (
                                                    <div className={`text-[10px] mt-1 flex items-center gap-1 ${modelState.selectedModel === DEFAULT_MODEL_SENTINEL ? 'opacity-80' : 'opacity-60'}`}>
                                                      <span>100字提問：約 {computeFoodFor100(defaultModelData)} 食量</span>
                                                      <img src="/apple-icon.svg" alt="食量" className="w-3.5 h-3.5" />
                                                    </div>
                                                  )}
                                                </>
                                              );
                                            })()}
                                          </motion.button>

                                          {/* 多選模型提示（僅 Mori） */}
                                          {roleId === 'mori' && modelState.selectedModelsMulti && (
                                            <div className="px-6 py-2 bg-[#FFF9F2] border-b border-[#EADBC8]/30">
                                              <div className="text-xs font-medium text-[#4B4036]">
                                                已選 {modelState.selectedModelsMulti.length} / 4{modelState.selectedModelsMulti.length < 2 && '（至少 2 個）'}
                                              </div>
                                            </div>
                                          )}

                                          {/* 模型選項 */}
                                          {modelState.getFilteredModels().filter((m: any) => {
                                            if ((m.price_tier || '').includes('免費') || (m.price_tier || '').toLowerCase().includes('free')) return false;
                                            if (!modelState.modelSearch.trim()) return true;
                                            const q = modelState.modelSearch.toLowerCase();
                                            return (
                                              (m.display_name || '').toLowerCase().includes(q) ||
                                              (m.description || '').toLowerCase().includes(q) ||
                                              (m.provider || '').toLowerCase().includes(q) ||
                                              (m.model_id || '').toLowerCase().includes(q)
                                            );
                                          }).map((model: any) => {
                                            const isMultiSelected = roleId === 'mori' && modelState.selectedModelsMulti && modelState.selectedModelsMulti.includes(model.model_id);
                                            const isSingleSelected = roleId !== 'mori' && modelState.selectedModel === model.model_id;
                                            const isSelected = isMultiSelected || isSingleSelected;
                                            const isDisabled = roleId === 'mori' && !isMultiSelected && modelState.selectedModelsMulti && modelState.selectedModelsMulti.length >= 4;

                                            return (
                                              <motion.button
                                                key={model.model_id}
                                                whileHover={isDisabled ? {} : { backgroundColor: "#FFFBEB" }}
                                                whileTap={{ scale: 0.98 }}
                                                type="button"
                                                disabled={isDisabled}
                                                onMouseDown={(e) => {
                                                  e.preventDefault();

                                                  if (roleId === 'mori' && modelState.setSelectedModelsMulti) {
                                                    let newMultiModels: string[];
                                                    if (isMultiSelected) {
                                                      newMultiModels = modelState.selectedModelsMulti.filter((id: string) => id !== model.model_id);
                                                    } else if (modelState.selectedModelsMulti.length < 4) {
                                                      newMultiModels = [...modelState.selectedModelsMulti, model.model_id];
                                                    } else {
                                                      return; // 已達上限
                                                    }
                                                    modelState.setSelectedModelsMulti(newMultiModels);
                                                    // 如果至少有 2 個模型，保存設定
                                                    if (newMultiModels.length >= 2) {
                                                      modelState.saveFunction(newMultiModels);
                                                    }
                                                    // 多選模式下不關閉窗口
                                                  } else {
                                                    modelState.setSelectedModel(model.model_id);
                                                    modelState.setModelSearch(stripFree(model.display_name || model.model_id));
                                                    modelState.setModelSelectOpen(false);
                                                    modelState.saveFunction(model.model_id);
                                                  }
                                                }}
                                                className={`w-full text-left px-6 py-3 text-sm transition-colors border-b border-[#EADBC8]/30 ${isSelected
                                                  ? 'bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white'
                                                  : isDisabled
                                                    ? 'text-gray-400 cursor-not-allowed'
                                                    : 'text-[#4B4036] hover:bg-[#FFFBEB]'
                                                  }`}
                                              >
                                                <div className="flex items-center justify-between">
                                                  <div className="flex-1">
                                                    <div className="font-medium">{stripFree(model.display_name || '')}</div>
                                                    <div className={`text-xs mt-1 ${isSelected ? 'opacity-90' : 'opacity-70'}`}>
                                                      {stripFree(model.description || '')} ({stripFree(model.price_tier || '')})
                                                    </div>
                                                  </div>
                                                  {roleId === 'mori' && (
                                                    <div className="ml-4 flex-shrink-0">
                                                      {isMultiSelected ? (
                                                        <motion.div
                                                          initial={{ scale: 0 }}
                                                          animate={{ scale: 1 }}
                                                          className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm"
                                                        >
                                                          <svg className="w-4 h-4 text-[#FFB6C1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                          </svg>
                                                        </motion.div>
                                                      ) : (
                                                        <div className={`w-6 h-6 rounded-full border-2 ${isSelected ? 'border-white/80' : 'border-[#EADBC8]'
                                                          }`} />
                                                      )}
                                                    </div>
                                                  )}
                                                </div>
                                              </motion.button>
                                            );
                                          })}
                                        </div>
                                      </motion.div>
                                    </>
                                  </AnimatePresence>,
                                  document.body
                                )}
                              </div>

                              {/* 思維積木設定展開區（每個角色一個） */}
                              <div className="mt-3 border-t border-[#EADBC8]/40 pt-3">
                                <div className="flex items-center gap-2 text-xs font-semibold text-[#4B4036] mb-2">
                                  <PuzzlePieceIcon className="w-4 h-4" />
                                  <span>思維積木設定</span>
                                </div>

                                {mindTitle !== '未裝備' ? (
                                  // 已裝備：顯示積木名稱和類型
                                  <div className="space-y-2">
                                    <div className="px-3 py-2 rounded-lg border border-[#FFD59A] bg-[#FFF9F2]">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-semibold text-[#4B4036]">{mindTitle}</span>
                                        <button
                                          onClick={() => {
                                            if (!instanceForCompanion) return;
                                            const event = new CustomEvent('open-block-selector', {
                                              detail: { type: 'role', roleInstanceId: instanceForCompanion.id }
                                            });
                                            window.dispatchEvent(event);
                                          }}
                                          className="text-[10px] text-[#4B4036]/60 hover:text-[#4B4036] underline"
                                        >
                                          更換
                                        </button>
                                      </div>
                                      {/* 顯示積木類型 */}
                                      {(() => {
                                        const equippedBlock = equippedBlocks.role || equippedBlocks.style || equippedBlocks.task;
                                        if (!equippedBlock) return null;

                                        const types = new Set<string>();

                                        // 方法1: 檢查 block_type 字段（單一類型積木）
                                        if (equippedBlock.block_type) {
                                          types.add(equippedBlock.block_type);
                                        }

                                        // 方法2: 解析 content_json（複合積木）
                                        if (equippedBlock.content_json) {
                                          const traverse = (blocks: any[]) => {
                                            blocks.forEach((b: any) => {
                                              if (b.type) types.add(b.type);
                                              if (b.children && Array.isArray(b.children)) {
                                                traverse(b.children);
                                              }
                                            });
                                          };

                                          if (equippedBlock.content_json.blocks && Array.isArray(equippedBlock.content_json.blocks)) {
                                            traverse(equippedBlock.content_json.blocks);
                                          }
                                        }

                                        if (types.size === 0) return null;

                                        const typeConfigMap: Record<string, { label: string; color: string }> = {
                                          role: { label: '角色', color: 'purple' },
                                          style: { label: '風格', color: 'pink' },
                                          task: { label: '任務', color: 'orange' },
                                          context: { label: '上下文', color: 'blue' },
                                          rule: { label: '規則', color: 'red' },
                                          variable: { label: '變數', color: 'indigo' },
                                          search: { label: '搜尋', color: 'teal' },
                                          reason: { label: '推理', color: 'yellow' },
                                          output: { label: '輸出', color: 'green' }
                                        };

                                        const getColorClasses = (color: string) => {
                                          const colorMap: Record<string, { bg: string; border: string; text: string }> = {
                                            purple: { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-600' },
                                            pink: { bg: 'bg-pink-50', border: 'border-pink-300', text: 'text-pink-600' },
                                            orange: { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-600' },
                                            blue: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-600' },
                                            red: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-600' },
                                            indigo: { bg: 'bg-indigo-50', border: 'border-indigo-300', text: 'text-indigo-600' },
                                            teal: { bg: 'bg-teal-50', border: 'border-teal-300', text: 'text-teal-600' },
                                            yellow: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-600' },
                                            green: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-600' },
                                            gray: { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-600' }
                                          };
                                          return colorMap[color] || colorMap.gray;
                                        };

                                        // 按照優先順序排序（角色、風格、任務優先）
                                        const priorityOrder = ['role', 'style', 'task'];
                                        const sortedTypes = Array.from(types).sort((a, b) => {
                                          const aIndex = priorityOrder.indexOf(a);
                                          const bIndex = priorityOrder.indexOf(b);
                                          if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
                                          if (aIndex !== -1) return -1;
                                          if (bIndex !== -1) return 1;
                                          return a.localeCompare(b);
                                        });

                                        const typeArray = sortedTypes.slice(0, 5);
                                        const remainingCount = sortedTypes.length > 5 ? sortedTypes.length - 5 : 0;

                                        return (
                                          <div className="flex items-center gap-1 flex-wrap">
                                            {typeArray.map((type) => {
                                              const config = typeConfigMap[type] || {
                                                label: type.charAt(0).toUpperCase() + type.slice(1), // 自訂類型首字母大寫
                                                color: 'gray'
                                              };
                                              const colors = getColorClasses(config.color);
                                              return (
                                                <span
                                                  key={type}
                                                  className={`px-2 py-0.5 rounded-lg border text-[9px] font-semibold ${colors.bg} ${colors.border} ${colors.text}`}
                                                >
                                                  {config.label}
                                                </span>
                                              );
                                            })}
                                            {remainingCount > 0 && (
                                              <span className="px-2 py-0.5 rounded-lg border text-[9px] font-semibold bg-gray-50 border-gray-300 text-gray-600">
                                                +{remainingCount}
                                              </span>
                                            )}
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                ) : (
                                  // 未裝備：顯示選擇按鈕
                                  <>
                                    <button
                                      onClick={() => {
                                        if (!instanceForCompanion) return;
                                        const event = new CustomEvent('open-block-selector', {
                                          detail: { type: 'role', roleInstanceId: instanceForCompanion.id }
                                        });
                                        window.dispatchEvent(event);
                                      }}
                                      className="w-full px-3 py-2 rounded-lg border border-[#EADBC8] bg-white hover:border-[#FFD59A] hover:bg-[#FFF9F2] flex items-center justify-between text-xs text-[#4B4036] transition-all"
                                    >
                                      <span className="flex items-center gap-2">
                                        <PuzzlePieceIcon className="w-4 h-4 text-[#FFB6C1]" />
                                        <span className="font-semibold">選擇思維積木</span>
                                      </span>
                                    </button>
                                    <p className="mt-1 text-[11px] text-[#4B4036]/70">
                                      為 {companion.name} 裝備角色、風格或任務積木，讓回應更符合你的預期。
                                    </p>
                                  </>
                                )}
                              </div>

                              {/* 多選模型顯示（僅 Mori） */}
                              {roleId === 'mori' && modelState.selectedModelsMulti && modelState.selectedModelsMulti.length > 0 && (
                                <div className="mt-2">
                                  <div className="flex flex-wrap gap-2">
                                    {modelState.selectedModelsMulti.map((id: string) => {
                                      const m = availableModels.find((x: any) => x.model_id === id) || modelState.getFilteredModels().find((x: any) => x.model_id === id);
                                      return (
                                        <motion.span
                                          key={id}
                                          initial={{ scale: 0, opacity: 0 }}
                                          animate={{ scale: 1, opacity: 1 }}
                                          exit={{ scale: 0, opacity: 0 }}
                                          className="inline-flex items-center gap-1 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white text-xs px-3 py-1.5 rounded-full shadow-sm"
                                        >
                                          {stripFree(m?.display_name || id)}
                                          <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            type="button"
                                            onClick={() => {
                                              if (modelState.setSelectedModelsMulti) {
                                                modelState.setSelectedModelsMulti(modelState.selectedModelsMulti.filter((x: string) => x !== id));
                                              }
                                            }}
                                            className="ml-1 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                                          >
                                            <XMarkIcon className="w-3 h-3" />
                                          </motion.button>
                                        </motion.span>
                                      );
                                    })}
                                  </div>
                                  <div className="mt-2 text-xs text-[#4B4036]">
                                    已選 {modelState.selectedModelsMulti.length} / 4{modelState.selectedModelsMulti.length < 2 && '（至少 2 個）'}
                                  </div>
                                </div>
                              )}

                              {/* 選中模型詳情 */}
                              <div className="p-3 bg-[#FFF9F2] border border-[#FFB6C1] rounded-lg">
                                {(() => {
                                  // 即使使用預設模型，也顯示模型詳情和食量
                                  // if (modelState.selectedModel === DEFAULT_MODEL_SENTINEL && (roleId !== 'mori' || !modelState.selectedModelsMulti || modelState.selectedModelsMulti.length === 0)) {
                                  //   // 預設模型情況下不再重覆顯示說明
                                  //   return null;
                                  // }

                                  if (roleId === 'mori' && modelState.selectedModelsMulti && modelState.selectedModelsMulti.length > 0) {
                                    const multiModels = modelState.selectedModelsMulti.map((modelId: string) => {
                                      return modelState.getFilteredModels().find((m: any) => m.model_id === modelId) ||
                                        availableModels.find((m: any) => m.model_id === modelId);
                                    }).filter(Boolean);

                                    if (multiModels.length > 0) {
                                      return (
                                        <>
                                          <div className="text-sm font-medium text-[#4B4036] mb-2">
                                            已選擇 {multiModels.length} 個模型：
                                          </div>
                                          <div className="space-y-2">
                                            {multiModels.map((model: any, idx: number) => (
                                              <div key={idx} className="text-xs">
                                                <div className="flex items-center justify-between">
                                                  <span className="text-[#4B4036]">{stripFree(model.display_name || '')}</span>
                                                  <span className={`px-2 py-0.5 rounded-full text-xs ${stripFree(model.price_tier || '') === '免費' || model.price_tier === '免費' ? 'bg-green-100 text-green-800' :
                                                    stripFree(model.price_tier || '') === '經濟' || model.price_tier === '經濟' ? 'bg-blue-100 text-blue-800' :
                                                      stripFree(model.price_tier || '') === '標準' || model.price_tier === '標準' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-purple-100 text-purple-800'
                                                    }`}>
                                                    {stripFree(model.price_tier || '')}
                                                  </span>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </>
                                      );
                                    }
                                  }

                                  const effectiveModelId = modelState.selectedModel === DEFAULT_MODEL_SENTINEL ? modelState.roleDefaultModel : modelState.selectedModel;
                                  const selectedModelData = modelState.getFilteredModels().find((m: any) => m.model_id === effectiveModelId) || availableModels.find((m: any) => m.model_id === effectiveModelId);
                                  return selectedModelData ? (
                                    <>
                                      <div className="flex items-center justify-between">
                                        <div className="text-sm font-medium text-[#4B4036]">{stripFree(selectedModelData.display_name || '')}</div>
                                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${stripFree(selectedModelData.price_tier || '') === '免費' || selectedModelData.price_tier === '免費' ? 'bg-green-100 text-green-800' :
                                          stripFree(selectedModelData.price_tier || '') === '經濟' || selectedModelData.price_tier === '經濟' ? 'bg-blue-100 text-blue-800' :
                                            stripFree(selectedModelData.price_tier || '') === '標準' || selectedModelData.price_tier === '標準' ? 'bg-yellow-100 text-yellow-800' :
                                              'bg-purple-100 text-purple-800'
                                          }`}>
                                          {stripFree(selectedModelData.price_tier || '')}
                                        </div>
                                      </div>
                                      <div className="text-xs text-[#2B3A3B] mt-1">{stripFree(selectedModelData.description || '')}</div>
                                      <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white border border-[#EADBC8] px-4 py-2">
                                        <span className="text-sm text-[#4B4036]">100字提問：約 {computeFoodFor100(selectedModelData)} 食量</span>
                                        <img src="/apple-icon.svg" alt="食量" className="w-5 h-5" />
                                      </div>
                                    </>
                                  ) : (<div className="text-sm text-[#4B4036]">請選擇模型</div>);
                                })()}
                              </div>
                            </>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })()}
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
                  className={`relative p-3 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] hover:from-[#FFA0B4] hover:to-[#EBC9A4] text-white rounded-xl shadow-lg hover:shadow-xl transition-all ${!inputMessage.trim() || isLoading || isTyping
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

        {/* Loadout Panel */}
        {/* Settings Panel (Unified Loadout & Tasks) */}
        <AnimatePresence mode="wait">
          {showSettingsPanel && (
            <>
              {/* Desktop Panel */}
              <motion.div
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 300, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="hidden md:block w-80 h-full z-20"
              >
                <ChatSettingsPanel
                  roleInstance={
                    selectedCompanion && roleInstancesMap[selectedCompanion]
                      ? roleInstancesMap[selectedCompanion]
                      : Object.values(roleInstancesMap)[0]
                  }
                  roleInstances={Object.values(roleInstancesMap)}
                  onUpdateRole={(updates) => {
                    const instance = selectedCompanion && roleInstancesMap[selectedCompanion]
                      ? roleInstancesMap[selectedCompanion]
                      : Object.values(roleInstancesMap)[0];
                    if (instance) {
                      return handleUpdateRoleInstance(instance.id, updates);
                    }
                    return Promise.resolve();
                  }}
                  onUpdateRoleInstance={handleUpdateRoleInstance}
                  onClose={() => setShowSettingsPanel(false)}
                  // Task Panel Props
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
                />
              </motion.div>

              {/* Mobile Panel Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={() => setShowSettingsPanel(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white rounded-2xl w-full max-w-md h-[80vh] overflow-hidden shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ChatSettingsPanel
                    roleInstance={
                      selectedCompanion && roleInstancesMap[selectedCompanion]
                        ? roleInstancesMap[selectedCompanion]
                        : Object.values(roleInstancesMap)[0]
                    }
                    roleInstances={Object.values(roleInstancesMap)}
                    onUpdateRole={(updates) => {
                      const instance = selectedCompanion && roleInstancesMap[selectedCompanion]
                        ? roleInstancesMap[selectedCompanion]
                        : Object.values(roleInstancesMap)[0];
                      if (instance) {
                        return handleUpdateRoleInstance(instance.id, updates);
                      }
                      return Promise.resolve();
                    }}
                    onUpdateRoleInstance={handleUpdateRoleInstance}
                    onClose={() => setShowSettingsPanel(false)}
                    // Task Panel Props
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
                  />
                </motion.div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* 邀請角色模態框 */}
        <AnimatePresence>
          {
            showInviteModal && (
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
                                  {companion.imagePath ? (
                                    <Image
                                      src={companion.imagePath}
                                      alt={companion.name}
                                      width={32}
                                      height={32}
                                      className="w-8 h-8 object-cover"
                                      unoptimized={companion.imagePath.includes('(') || companion.imagePath.includes(')')}
                                      onError={(e) => {
                                        console.error('❌ [角色圖標] 圖片載入失敗:', companion.imagePath);
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <div className="w-8 h-8 flex items-center justify-center">
                                      {companion.icon && <companion.icon className="w-6 h-6 text-gray-400" />}
                                    </div>
                                  )}
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
                                  {companion.imagePath ? (
                                    <Image
                                      src={companion.imagePath}
                                      alt={companion.name}
                                      width={40}
                                      height={40}
                                      className="w-10 h-10 object-cover"
                                      unoptimized={companion.imagePath.includes('(') || companion.imagePath.includes(')')}
                                      onError={(e) => {
                                        console.error('❌ [角色圖標] 圖片載入失敗:', companion.imagePath);
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <div className="w-10 h-10 flex items-center justify-center">
                                      {companion.icon && <companion.icon className="w-8 h-8 text-gray-400" />}
                                    </div>
                                  )}
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
            )
          }
        </AnimatePresence >

        {/* 角色設定模態框 */}
        <AnimatePresence>
          {
            showSettingsModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                onClick={() => {
                  setShowSettingsModal(false);
                  setOpenPanels({ roles: false, invite: false }); // 關閉時重置面板狀態
                  setInviteRoleSelectOpen(false);
                  setInviteRoleSearch('');
                }}
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
                        setOpenPanels({ roles: false, invite: false }); // 關閉時重置面板狀態
                        setInviteRoleSelectOpen(false);
                        setInviteRoleSearch('');
                      }}
                      className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <XMarkIcon className="w-6 h-6 text-[#4B4036]" />
                    </motion.button>
                  </div>

                  <p className="text-[#2B3A3B] mb-6">管理專案團隊中的 AI 成員，您可以邀請新成員或移除現有成員：</p>

                  {/* 分組卡片：當前角色、可邀請角色 */}
                  <div className="space-y-4">
                    {/* 當前角色卡片 */}
                    <motion.div
                      whileHover={{ y: -2 }}
                      className="rounded-xl border border-[#EADBC8] bg-white p-0 shadow-sm overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenPanels((s) => ({ ...s, roles: !s.roles }))}
                        className="w-full text-left px-4 py-4 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center">
                            <CheckCircleIcon className="w-3 h-3 text-white" />
                          </div>
                          <h3 className="text-lg font-semibold text-[#4B4036]">專案團隊成員</h3>
                          <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            {activeRoles.length} 位
                          </span>
                        </div>
                        <motion.span animate={{ rotate: openPanels.roles ? 180 : 0 }}>
                          <svg className="w-5 h-5 text-[#4B4036]" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" /></svg>
                        </motion.span>
                      </button>

                      <AnimatePresence>
                        {openPanels.roles && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 border-t border-[#EADBC8]">
                              <div className="mt-4 space-y-3">
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
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    {/* 可邀請的角色卡片 */}
                    {companions.filter(companion => !activeRoles.includes(companion.id)).length > 0 && (
                      <motion.div
                        whileHover={{ y: -2 }}
                        className="rounded-xl border border-[#EADBC8] bg-white p-0 shadow-sm overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => setOpenPanels((s) => ({ ...s, invite: !s.invite }))}
                          className="w-full text-left px-4 py-4 flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-5 h-5 bg-blue-400 rounded-full flex items-center justify-center">
                              <PlusIcon className="w-3 h-3 text-white" />
                            </div>
                            <h3 className="text-lg font-semibold text-[#4B4036]">可邀請的角色</h3>
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                              {companions.filter(companion => !activeRoles.includes(companion.id)).length} 位
                            </span>
                          </div>
                          <motion.span animate={{ rotate: openPanels.invite ? 180 : 0 }}>
                            <svg className="w-5 h-5 text-[#4B4036]" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" /></svg>
                          </motion.span>
                        </button>

                        <AnimatePresence>
                          {openPanels.invite && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 border-t border-[#EADBC8]">
                                <div className="relative mt-4 space-y-2">
                                  {/* 下拉選單 */}
                                  <div className="relative" ref={inviteRoleSelectRef}>
                                    <input
                                      ref={inviteRoleInputRef}
                                      type="text"
                                      value={inviteRoleSearch}
                                      onChange={(e) => {
                                        setInviteRoleSearch(e.target.value);
                                        setInviteRoleSelectOpen(true);
                                      }}
                                      onFocus={() => {
                                        setInviteRoleSelectOpen(true);
                                        // 更新下拉選單位置
                                        if (inviteRoleInputRef.current) {
                                          const rect = inviteRoleInputRef.current.getBoundingClientRect();
                                          setInviteRoleDropdownPosition({
                                            top: rect.bottom + 4,
                                            left: rect.left,
                                            width: rect.width
                                          });
                                        }
                                      }}
                                      onBlur={() => setTimeout(() => setInviteRoleSelectOpen(false), 200)}
                                      placeholder="選擇角色或輸入以搜尋..."
                                      className="w-full p-3 pr-10 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFB6C1] focus:border-transparent bg-white text-[#4B4036]"
                                    />
                                    {/* 下拉箭頭 */}
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                      <motion.div
                                        animate={{ rotate: inviteRoleSelectOpen ? 180 : 0 }}
                                        transition={{ duration: 0.2 }}
                                      >
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                      </motion.div>
                                    </div>

                                    {/* 下拉選單列表 - 使用 Portal 渲染到 body */}
                                    {typeof document !== 'undefined' && inviteRoleSelectOpen && inviteRoleDropdownPosition && createPortal(
                                      <AnimatePresence>
                                        <motion.div
                                          initial={{ opacity: 0, y: -10 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          exit={{ opacity: 0, y: -10 }}
                                          transition={{ duration: 0.2 }}
                                          style={{
                                            position: 'fixed',
                                            top: `${inviteRoleDropdownPosition.top}px`,
                                            left: `${inviteRoleDropdownPosition.left}px`,
                                            width: `${inviteRoleDropdownPosition.width}px`,
                                            zIndex: 9999
                                          }}
                                          className="bg-white border border-[#EADBC8] rounded-lg shadow-xl max-h-60 overflow-y-auto"
                                          data-invite-role-dropdown
                                        >
                                          {companions
                                            .filter(companion => !activeRoles.includes(companion.id))
                                            .filter(companion => {
                                              if (!inviteRoleSearch.trim()) return true;
                                              const q = inviteRoleSearch.toLowerCase();
                                              return (
                                                companion.name.toLowerCase().includes(q) ||
                                                companion.nameEn.toLowerCase().includes(q) ||
                                                companion.description.toLowerCase().includes(q) ||
                                                companion.specialty.toLowerCase().includes(q)
                                              );
                                            })
                                            .map((companion) => (
                                              <motion.button
                                                key={companion.id}
                                                whileHover={{ backgroundColor: "#FFFBEB" }}
                                                whileTap={{ scale: 0.98 }}
                                                type="button"
                                                onMouseDown={(e) => {
                                                  e.preventDefault(); // 防止觸發 onBlur
                                                  handleInviteRole(companion.id, true);
                                                  setInviteRoleSearch('');
                                                  setInviteRoleSelectOpen(false);
                                                }}
                                                className="w-full text-left px-3 py-2 text-sm transition-colors border-t border-[#EADBC8]/30 hover:bg-[#FFFBEB] text-[#4B4036]"
                                              >
                                                <div className="flex items-center space-x-3">
                                                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${companion.color} p-0.5 flex-shrink-0`}>
                                                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                                                      <Image
                                                        src={companion.imagePath}
                                                        alt={companion.name}
                                                        width={28}
                                                        height={28}
                                                        className="w-7 h-7 object-cover"
                                                      />
                                                    </div>
                                                  </div>
                                                  <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-[#4B4036]">{companion.name} ({companion.nameEn})</div>
                                                    <div className="text-xs text-[#2B3A3B] truncate">{companion.specialty}</div>
                                                  </div>
                                                </div>
                                              </motion.button>
                                            ))}
                                          {companions.filter(companion =>
                                            !activeRoles.includes(companion.id) &&
                                            (!inviteRoleSearch.trim() ||
                                              companion.name.toLowerCase().includes(inviteRoleSearch.toLowerCase()) ||
                                              companion.nameEn.toLowerCase().includes(inviteRoleSearch.toLowerCase()) ||
                                              companion.description.toLowerCase().includes(inviteRoleSearch.toLowerCase()) ||
                                              companion.specialty.toLowerCase().includes(inviteRoleSearch.toLowerCase())
                                            )
                                          ).length === 0 && (
                                              <div className="px-3 py-4 text-center text-sm text-[#2B3A3B]">
                                                沒有可邀請的角色
                                              </div>
                                            )}
                                        </motion.div>
                                      </AnimatePresence>,
                                      document.body
                                    )}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </div>

                  {/* 操作按鈕 */}
                  <div className="flex space-x-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setShowSettingsModal(false);
                        setEditingProject(false); // 關閉編輯模式
                        setOpenPanels({ roles: false, invite: false }); // 關閉時重置面板狀態
                        setInviteRoleSelectOpen(false);
                        setInviteRoleSearch('');
                      }}
                      className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-[#4B4036] rounded-xl font-medium transition-all"
                    >
                      關閉
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )
          }
        </AnimatePresence >
      </div >

      {/* Block Selection Modal */}
      < BlockSelectionModal
        isOpen={loadoutModalState.isOpen}
        onClose={() => setLoadoutModalState(prev => ({ ...prev, isOpen: false }))}
        onSelect={handleBlockSelect}
        slotType={loadoutModalState.slotType}
        roleInstanceId={loadoutModalState.roleInstanceId}
      />
    </div >
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
  // Debug log to verify component render
  // console.log('🔍 [MessageBubble] Rendering message:', message.id, 'Sender:', message.sender, 'Content length:', message.content?.length);
  // console.log('🔍 [MessageBubble] Full content preview:', message.content?.substring(0, 500));

  const [isHovered, setIsHovered] = useState(false);
  const isUser = message.sender === 'user';
  const isSystem = message.sender === 'system';
  const isPico = message.sender === 'pico';
  const isImageMessage =
    message.type === 'image' ||
    Boolean(message.content_json?.image || message.content.match(/https?:\/\/[^\s]+\.(?:png|jpg|jpeg|webp|gif)(?:\?[^\s]*)?/i));
  const [showMobileActions, setShowMobileActions] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [moriViewMode, setMoriViewMode] = useState<'stack' | 'deck'>('deck');
  const [activeMoriIndex, setActiveMoriIndex] = useState(0);
  const picoAvatarSrc = companion?.imagePath || '/3d-character-backgrounds/studio/Pico/Pico.png';

  const isMoriMulti =
    !isUser &&
    Array.isArray(message.content_json?.model_responses) &&
    message.content_json.model_responses.length > 1;
  const moriModelCount = isMoriMulti ? message.content_json?.model_responses?.length ?? 0 : 0;
  const isMoriDeck = isMoriMulti && moriViewMode === 'deck';

  const renderPlainText = () => {
    // Robust splitting for different newline formats
    const lines = message.content.split(/\r\n|\r|\n/);
    let hasRenderedImage = false;

    const renderedLines = lines.map((line, index) => {
      // ⭐ 優先檢查是否為圖片 markdown 格式（必須在直接 URL 檢查之前）
      // 改進正則：匹配 ![alt](url) 格式，支援 URL 中包含特殊字符
      const imageMatch = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);

      // Log every line to see what's happening
      // console.log(`🔍 [MessageBubble] Line ${index}:`, line.substring(0, 50), 'Has markdown start:', line.includes('!['), 'Has markdown end:', line.includes(']('));

      if (line.includes('![') && line.includes('](')) {
        // console.log('🔍 [MessageBubble] Potential markdown image detected:', line);
        // console.log('🔍 [MessageBubble] Match result:', imageMatch);

        // Fallback if regex fails but we suspect an image
        if (!imageMatch) {
          console.warn('⚠️ [MessageBubble] Regex failed but markdown detected. Trying fallback parsing.');
          const start = line.indexOf('](') + 2;
          const end = line.lastIndexOf(')');
          if (start > 1 && end > start) {
            const fallbackUrl = line.substring(start, end).trim();
            console.log('🔍 [MessageBubble] Fallback URL extracted:', fallbackUrl);
            if (fallbackUrl.startsWith('http')) {
              // Construct a fake match object to proceed
              const publicUrl = convertToPublicUrl(fallbackUrl);
              return (
                <div key={index} className="my-2">
                  <SecureImageDisplay imageUrl={publicUrl} alt="Fallback Image" />
                </div>
              );
            }
          }
        }
      }
      if (imageMatch && imageMatch.index !== undefined) {
        hasRenderedImage = true;
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
        // ⭐ 轉換為簡潔 URL（用於連結，包含完整路徑資訊）
        const shortUrl = convertToShortUrl(imageUrl);
        // ⭐ 獲取簡潔顯示 URL（僅用於顯示文字）
        const displayUrl = getShortDisplayUrl(imageUrl);

        return (
          <div key={index} className="mt-3">
            {/* 如果 Markdown 前有文字，顯示文字 */}
            {textBefore && <p className="mb-2 text-sm opacity-80">{textBefore}</p>}

            <div className="bg-white/30 rounded-xl p-3 shadow-sm space-y-2 relative">
              {/* 食量顯示 - 圖片訊息框右上角 */}
              <div className="relative group">
                <SecureImageDisplay
                  imageUrl={publicUrl}
                  alt="Pico 創作作品"
                  className="rounded-lg shadow-lg border-2 border-[#FFB6C1]/30"
                  thumbnail={true}
                  thumbnailSize={200}
                  onDownload={() => downloadImage(imageUrl)}
                />
              </div>

              <div className="flex items-center justify-between bg-white/50 rounded-lg p-2">
                <button
                  onClick={() => downloadImage(imageUrl)}
                  className="text-xs text-[#FFB6C1] hover:text-[#FF9BB3] underline flex items-center space-x-1 flex-1 truncate text-left"
                  title="點擊下載圖片"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span className="truncate">點擊下載圖片</span>
                </button>
              </div>

              <p className="text-xs text-[#2B3A3B]/60 text-center">
                點擊圖片可放大查看，點擊連結可下載
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
        // ⭐ 轉換為簡潔 URL（用於連結，包含完整路徑資訊）
        const shortUrl = convertToShortUrl(imageUrl);
        // ⭐ 獲取簡潔顯示 URL（僅用於顯示文字）
        const displayUrl = getShortDisplayUrl(imageUrl);
        const textBefore = line.substring(0, urlMatch.index!);
        const textAfter = line.substring(urlMatch.index! + imageUrl.length);

        return (
          <div key={index} className="mt-3">
            {/* 如果 URL 前有文字，顯示文字 */}
            {textBefore && <p className="mb-2 text-sm opacity-80">{textBefore}</p>}

            {/* 圖片預覽區域 */}
            <div className="bg-white/30 rounded-xl p-3 shadow-sm space-y-2 relative">
              {/* 食量顯示 - 圖片訊息框右上角 */}
              {/* 圖片顯示 - 使用 SecureImageDisplay 組件處理 Public Bucket */}
              <div className="relative group">
                <SecureImageDisplay
                  imageUrl={publicUrl}
                  alt="AI 生成圖片"
                  className="rounded-lg shadow-lg border-2 border-[#FFB6C1]/30"
                  thumbnail={true}
                  thumbnailSize={200}
                  onDownload={() => downloadImage(imageUrl)}
                />
              </div>

              {/* 下載連結 */}
              <div className="flex items-center justify-between bg-white/50 rounded-lg p-2">
                <button
                  onClick={() => downloadImage(imageUrl)}
                  className="text-xs text-[#FFB6C1] hover:text-[#FF9BB3] underline flex items-center space-x-1 flex-1 truncate text-left"
                  title="點擊下載圖片"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span className="truncate">點擊下載圖片</span>
                </button>
              </div>

              <p className="text-xs text-[#2B3A3B]/60 text-center">
                點擊圖片可放大查看，點擊連結可下載
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
    });

    // Global fallback if no image was rendered but one exists in the raw content
    if (!hasRenderedImage) {
      const globalImageMatch = message.content.match(/!\[(.*?)\]\((.*?)\)/);
      if (globalImageMatch) {
        console.warn('⚠️ [MessageBubble] Global fallback triggered. Image found in raw content but missed by line parser.');
        const imageUrl = globalImageMatch[2].trim();
        const publicUrl = convertToPublicUrl(imageUrl);
        renderedLines.push(
          <div key="global-fallback-image" className="my-2">
            <SecureImageDisplay imageUrl={publicUrl} alt="Generated Image" />
          </div>
        );
      }
    }

    return renderedLines;
  };

  useEffect(() => {
    setActiveMoriIndex(0);
  }, [message.id]);

  useEffect(() => {
    if (moriViewMode === 'deck') {
      setActiveMoriIndex((prev) => {
        const maxIndex = Math.max(0, moriModelCount - 1);
        return Math.min(prev, maxIndex);
      });
    }
  }, [moriViewMode, moriModelCount]);

  const renderMoriMulti = (parsedResponses?: any[]) => {
    const meta = message.content_json || {};
    const rawModelResponses: any[] = parsedResponses || (Array.isArray(meta.model_responses) ? meta.model_responses : []);

    // Deep copy to avoid mutating props/state directly if it's from state
    const modelResponses = JSON.parse(JSON.stringify(rawModelResponses));

    // PATCH: Inject image from message.content if missing in modelResponses (Fixes existing messages)
    const globalImageMatch = message.content.match(/!\[(.*?)\]\((.*?)\)/);
    if (globalImageMatch) {
      const imageUrl = globalImageMatch[2];
      // Check if any model response already has this image
      const hasImage = modelResponses.some((r: any) => r.content?.includes(imageUrl));
      if (!hasImage && modelResponses.length > 0) {
        console.log('🔧 [MessageBubble] Patching missing image into model response');
        modelResponses[0].content += `\n\n![Generated Image](${imageUrl})`;
      }
    }

    const modelCount = modelResponses.length;
    const food = meta.food || {};
    const charPerToken = Number(food.CHAR_PER_TOKEN || 4);
    const charsPerFood = Number(food.CHARS_PER_FOOD || 100) || 100;
    const currentActiveIndex = Math.min(activeMoriIndex, Math.max(0, modelCount - 1));
    const isDeckMode = moriViewMode === 'deck';

    const computePerModelFood = (tokens: number) => {
      if (!tokens || !charPerToken || !charsPerFood) return null;
      const estimatedChars = tokens * charPerToken;
      return Math.max(1, Math.ceil(estimatedChars / charsPerFood));
    };

    // 計算總字數和總食量，用於比例分配
    const totalContentLength = modelResponses.reduce((acc: number, resp: any) => acc + (resp.content?.length || 0), 0);
    const totalFoodCostFromMeta = (() => {
      const meta = message.content_json || {};
      if (meta.food && typeof meta.food.total_food_cost === 'number') {
        return meta.food.total_food_cost;
      } else if (typeof meta.total_food_cost === 'number') {
        return meta.total_food_cost;
      }
      return 0;
    })();

    const handlePrevModel = () => {
      setActiveMoriIndex((prev) => {
        const nextVal = Math.max(0, prev - 1);
        return Math.min(modelCount - 1, nextVal);
      });
    };

    const handleNextModel = () => {
      setActiveMoriIndex((prev) => {
        const nextVal = Math.min(modelCount - 1, prev + 1);
        return Math.max(0, nextVal);
      });
    };

    const header = (
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EADBC8] pb-4 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <motion.span
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#FFB6C1]/20 to-[#FFD59A]/20 text-[#4B4036] text-xs font-bold border border-[#FFD59A] shadow-sm"
          >
            <SparklesIcon className="w-3.5 h-3.5 text-[#FFB6C1]" />
            {`AI 模型共演 (${modelCount})`}
          </motion.span>
        </div>
        {modelCount > 1 && (
          <div className="flex items-center gap-1 bg-[#F8F5EC] p-1 rounded-xl border border-[#EADBC8]">
            <button
              type="button"
              onClick={() => setMoriViewMode('stack')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${moriViewMode === 'stack'
                ? 'bg-white text-[#4B4036] shadow-sm border border-[#EADBC8]'
                : 'text-[#2B3A3B]/60 hover:text-[#4B4036] hover:bg-white/50'
                }`}
            >
              清單
            </button>
            <button
              type="button"
              onClick={() => setMoriViewMode('deck')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${moriViewMode === 'deck'
                ? 'bg-white text-[#4B4036] shadow-sm border border-[#EADBC8]'
                : 'text-[#2B3A3B]/60 hover:text-[#4B4036] hover:bg-white/50'
                }`}
            >
              卡片
            </button>
          </div>
        )}
      </div>
    );

    return (
      <div className="whitespace-normal space-y-4 font-sans">
        {isDeckMode ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-[#EADBC8] bg-white/80 backdrop-blur-sm shadow-xl shadow-[#EADBC8]/20 overflow-hidden"
          >
            <div className="p-5 sm:p-6 pb-2">{header}</div>
            <div className="px-5 sm:px-6 pb-6 space-y-5">
              {modelResponses.length > 1 && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {modelResponses.map((resp: any, idx: number) => {
                      const label = resp.model || `模型 ${idx + 1}`;
                      const isActive = idx === currentActiveIndex;
                      return (
                        <button
                          key={`indicator-${idx}`}
                          type="button"
                          onClick={() => setActiveMoriIndex(idx)}
                          className={`relative px-4 py-2 text-xs font-bold rounded-xl transition-all duration-300 border ${isActive
                            ? 'text-[#4B4036] border-[#FFD59A] shadow-md transform scale-105'
                            : 'bg-[#F8F5EC] text-[#4B4036]/70 border-[#EADBC8] hover:border-[#FFD59A] hover:bg-[#FFF9F2]'
                            }`}
                        >
                          <span className="relative z-10">{label}</span>
                          {isActive && (
                            <motion.div
                              layoutId="activeTab"
                              className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#FFD59A] to-[#FFB6C1] -z-0 opacity-80"
                              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#2B3A3B]/60 px-1">
                    <span className="flex items-center gap-1">
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity }}
                      >
                        <CpuChipIcon className="w-3.5 h-3.5 text-[#FFD59A]" />
                      </motion.div>
                      {modelResponses[currentActiveIndex]?.model} 的回答
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={handlePrevModel}
                        disabled={currentActiveIndex === 0}
                        className={`p-1.5 rounded-full hover:bg-[#F8F5EC] text-[#4B4036] transition-colors ${currentActiveIndex === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                      >
                        <ArrowLeftIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleNextModel}
                        disabled={currentActiveIndex === modelResponses.length - 1}
                        className={`p-1.5 rounded-full hover:bg-[#F8F5EC] text-[#4B4036] transition-colors ${currentActiveIndex === modelResponses.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
                      >
                        <ArrowLeftIcon className="w-4 h-4 rotate-180" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <div className="relative overflow-hidden min-h-[100px]">
                <motion.div
                  className="flex w-full max-w-full"
                  initial={false}
                  animate={{ x: `-${currentActiveIndex * 100}%` }}
                  transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                >
                  {modelResponses.map((resp: any, idx: number) => {
                    const respUsage = resp.usage || {};
                    const input = Number(respUsage.input_tokens || 0);
                    const output = Number(respUsage.output_tokens || 0);
                    const total = Number(respUsage.total_tokens || input + output);
                    // 使用比例分配計算食量，確保與右上角總食量邏輯一致
                    let estimatedFood = 0;
                    if (totalFoodCostFromMeta > 0 && totalContentLength > 0) {
                      estimatedFood = Math.round(((resp.content?.length || 0) / totalContentLength) * totalFoodCostFromMeta);
                      // 確保至少為 0 (如果總食量 > 0 但分配後為 0，可能需要調整，但 round 應該足夠)
                      if (estimatedFood === 0 && (resp.content?.length || 0) > 0) estimatedFood = 1;
                    } else {
                      // Fallback: 使用字數計算 (100字 = 1食量)
                      estimatedFood = Math.ceil((resp.content?.length || 0) / 100);
                    }

                    return (
                      <div
                        key={`slide-${idx}`}
                        className="w-full flex-shrink-0 px-1"
                      >
                        <div className="prose prose-sm max-w-none text-[#4B4036] leading-relaxed break-words">
                          <div className="whitespace-pre-wrap">
                            {resp.content?.split(/\r\n|\r|\n/).map((line: string, i: number) => {
                              // Image detection logic (same as renderPlainText)
                              const imageMatch = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
                              const urlMatch = line.match(/https?:\/\/[^\s]+\.(?:png|jpg|jpeg|webp|gif)(?:\?[^\s]*)?/i);

                              if (imageMatch) {
                                const imageUrl = imageMatch[2].trim();
                                const publicUrl = convertToPublicUrl(imageUrl);
                                const textBefore = line.substring(0, imageMatch.index!);
                                const textAfter = line.substring(imageMatch.index! + imageMatch[0].length);
                                return (
                                  <div key={i} className="my-2">
                                    {textBefore && <p className="mb-2">{textBefore}</p>}
                                    <SecureImageDisplay
                                      imageUrl={publicUrl}
                                      alt="Generated Image"
                                      className="rounded-lg shadow-lg border-2 border-[#FFB6C1]/30"
                                      onDownload={() => downloadImage(imageUrl)}
                                    />
                                    {textAfter && <p className="mt-2">{textAfter}</p>}
                                  </div>
                                );
                              }

                              if (urlMatch) {
                                const imageUrl = urlMatch[0];
                                const publicUrl = convertToPublicUrl(imageUrl);
                                const textBefore = line.substring(0, urlMatch.index!);
                                const textAfter = line.substring(urlMatch.index! + imageUrl.length);
                                return (
                                  <div key={i} className="my-2">
                                    {textBefore && <p className="mb-2">{textBefore}</p>}
                                    <SecureImageDisplay
                                      imageUrl={publicUrl}
                                      alt="Generated Image"
                                      className="rounded-lg shadow-lg border-2 border-[#FFB6C1]/30"
                                      onDownload={() => downloadImage(imageUrl)}
                                    />
                                    {textAfter && <p className="mt-2">{textAfter}</p>}
                                  </div>
                                );
                              }

                              return <div key={i}>{line}</div>;
                            })}
                          </div>
                        </div>

                        {/* Metadata Footer for Deck View */}
                        <div className="mt-6 pt-4 border-t border-[#EADBC8]/50 flex flex-wrap items-center gap-3 text-[10px] text-[#2B3A3B]/60 font-medium">
                          <div className="flex items-center gap-1 bg-[#F8F5EC] px-2 py-0.5 rounded-full border border-[#EADBC8]">
                            <CpuChipIcon className="w-3 h-3 text-[#FFD59A]" />
                            <span>{resp.model || resp.model_name || 'Unknown Model'}</span>
                          </div>
                          {(resp.mind_name || resp.thinking_process) && (
                            <div className="flex items-center gap-1 bg-[#F8F5EC] px-2 py-0.5 rounded-full border border-[#EADBC8]">
                              <SparklesIcon className="w-3 h-3 text-[#FFB6C1]" />
                              <span>{resp.mind_name || '思考中...'}</span>
                            </div>
                          )}

                          {(total > 0 || estimatedFood) && (
                            <div className="flex items-center gap-3 ml-auto">
                              {estimatedFood && (
                                <div className="flex items-center gap-1 text-[#FFB6C1]">
                                  <img src="/apple-icon.svg" alt="food" className="w-3 h-3 opacity-80" />
                                  <span className="font-bold">{estimatedFood}</span>
                                </div>
                              )}
                              {estimatedFood && (
                                <div className="flex items-center gap-1">
                                  <span className="opacity-70">節省了 {estimatedFood} mins</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {header}
            {modelResponses.map((resp: any, idx: number) => {
              const respUsage = resp.usage || {};
              const input = Number(respUsage.input_tokens || 0);
              const output = Number(respUsage.output_tokens || 0);
              const total = Number(respUsage.total_tokens || input + output);
              // 使用比例分配計算食量，確保與右上角總食量邏輯一致
              let estimatedFood = 0;
              if (totalFoodCostFromMeta > 0 && totalContentLength > 0) {
                estimatedFood = Math.round(((resp.content?.length || 0) / totalContentLength) * totalFoodCostFromMeta);
                if (estimatedFood === 0 && (resp.content?.length || 0) > 0) estimatedFood = 1;
              } else {
                // Fallback: 使用字數計算 (100字 = 1食量)
                estimatedFood = Math.ceil((resp.content?.length || 0) / 100);
              }

              return (
                <motion.div
                  key={`stack-${idx}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="rounded-3xl border border-[#EADBC8] bg-white p-6 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 rounded-xl bg-[#F8F5EC] text-[#4B4036] text-xs font-bold border border-[#EADBC8]">
                      {resp.model || `模型 ${idx + 1}`}
                    </span>
                  </div>
                  <div className="prose prose-sm max-w-none text-[#4B4036] leading-relaxed whitespace-pre-wrap">
                    {resp.content}
                  </div>

                  {/* Metadata Footer for Stack View */}
                  <div className="mt-4 pt-4 border-t border-[#EADBC8]/50 flex flex-wrap items-center gap-3 text-[10px] text-[#2B3A3B]/60 font-medium">
                    <div className="flex items-center gap-1 bg-[#F8F5EC] px-2 py-0.5 rounded-full border border-[#EADBC8]">
                      <CpuChipIcon className="w-3 h-3 text-[#FFD59A]" />
                      <span>{resp.model || resp.model_name || 'Unknown Model'}</span>
                    </div>
                    {(resp.mind_name || resp.thinking_process) && (
                      <div className="flex items-center gap-1 bg-[#F8F5EC] px-2 py-0.5 rounded-full border border-[#EADBC8]">
                        <SparklesIcon className="w-3 h-3 text-[#FFB6C1]" />
                        <span>{resp.mind_name || '思考中...'}</span>
                      </div>
                    )}

                    {(total > 0 || estimatedFood) && (
                      <div className="flex items-center gap-3 ml-auto">
                        {estimatedFood && (
                          <div className="flex items-center gap-1 text-[#FFB6C1]">
                            <img src="/apple-icon.svg" alt="food" className="w-3 h-3 opacity-80" />
                            <span className="font-bold">{estimatedFood}</span>
                          </div>
                        )}
                        {estimatedFood && (
                          <div className="flex items-center gap-1">
                            <span className="opacity-70">節省了 {estimatedFood} mins</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderMetadataFooter = () => {
    if (isUser || isSystem) return null;

    const meta = message.content_json || {};
    const model = meta.model || meta.model_name || meta.model_slug || message.model_used;
    const mind = meta.mind_name || (meta.thinking_process ? '思考中...' : null);

    // 計算食量：優先使用 content_json 中的 food.total_food_cost，否則嘗試從 usage 計算
    let foodCost = 0;
    if (meta.food && typeof meta.food.total_food_cost === 'number') {
      foodCost = meta.food.total_food_cost;
    } else if (typeof meta.total_food_cost === 'number') {
      foodCost = meta.total_food_cost;
    }

    const tokens = meta.usage?.total_tokens || meta.total_tokens || 0;

    if (!model && !mind && !foodCost && !tokens) return null;

    return (
      <div className="mt-3 pt-2 border-t border-[#EADBC8]/50 flex flex-wrap items-center gap-3 text-[10px] text-[#2B3A3B]/60 font-medium">
        {model && (
          <div className="flex items-center gap-1 bg-[#F8F5EC] px-2 py-0.5 rounded-full border border-[#EADBC8]">
            <CpuChipIcon className="w-3 h-3 text-[#FFD59A]" />
            <span>{model}</span>
          </div>
        )}
        {mind && (
          <div className="flex items-center gap-1 bg-[#F8F5EC] px-2 py-0.5 rounded-full border border-[#EADBC8]">
            <SparklesIcon className="w-3 h-3 text-[#FFB6C1]" />
            <span>{mind}</span>
          </div>
        )}
        {(foodCost > 0 || tokens > 0) && (
          <div className="flex items-center gap-3 ml-auto">
            {foodCost > 0 && (
              <div className="flex items-center gap-1 text-[#FFB6C1]">
                <img src="/apple-icon.svg" alt="food" className="w-3 h-3 opacity-80" />
                <span className="font-bold">{foodCost}</span>
              </div>
            )}
            {foodCost > 0 && (
              <div className="flex items-center gap-1">
                <span className="opacity-70">節省了 {foodCost} mins</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

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
    return () => { };
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
      <div
        className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end space-x-3 max-w-[95%] sm:max-w-[90%] md:max-w-[82%] xl:max-w-[70%]`}
      >
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
            className={`group relative ${isMoriDeck ? 'px-0 py-0' : 'px-4 py-3'
              } rounded-2xl shadow-sm ${isUser
                ? 'bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white rounded-br-md'
                : isSystem
                  ? 'bg-[#F8F5EC] border border-[#EADBC8] text-[#4B4036] rounded-bl-md'
                  : isMoriDeck
                    ? 'bg-transparent border border-transparent text-[#2B3A3B]'
                    : 'bg-white border border-[#EADBC8] text-[#4B4036] rounded-bl-md'
              }`}
          >
            {isMoriMulti ? (
              renderMoriMulti()
            ) : (() => {
              // Check for raw multi-model content
              const rawMultiModel = parseMultiModelContent(message.content);
              if (rawMultiModel) {
                return renderMoriMulti(rawMultiModel);
              }
              return (
                <div className="whitespace-pre-wrap break-words overflow-x-auto max-w-full">
                  {renderPlainText()}
                  {renderMetadataFooter()}
                </div>
              );
            })()}
            {/* 操作按鈕 - 響應式顯示 */}
            <div className={`absolute -top-2 -right-2 flex space-x-1 z-10 transition-opacity duration-200
                            ${showMobileActions ? 'opacity-100' : 'opacity-0'} 
                            md:opacity-0 md:group-hover:opacity-100`}>
              {/* 食量顯示 - 僅 AI 回應訊息顯示，靠近時才顯示 */}
              {/* 食量顯示 - 僅 AI 回應訊息顯示，靠近時才顯示 */}
              {!isUser && (() => {
                const meta = message.content_json || {};
                let foodCost = 0;
                if (meta.food && typeof meta.food.total_food_cost === 'number') {
                  foodCost = meta.food.total_food_cost;
                } else if (typeof meta.total_food_cost === 'number') {
                  foodCost = meta.total_food_cost;
                }

                if (!foodCost) return null;

                return (
                  <motion.button
                    whileHover={{ scale: 1.2 }}
                    className="w-12 h-8 md:w-12 md:h-6 bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] hover:from-[#FF9BB3] hover:to-[#FFCC7A] text-white rounded-full shadow-lg transition-all flex items-center justify-center touch-manipulation"
                    title={`消耗 ${foodCost} 食量`}
                  >
                    <span className="text-xs font-medium flex items-center space-x-1">
                      <img src="/apple-icon.svg" alt="蘋果" className="w-5 h-5" />
                      <span>{foodCost}</span>
                    </span>
                  </motion.button>
                );
              })()}

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
