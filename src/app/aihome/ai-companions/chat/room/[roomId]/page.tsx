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
  UsersIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  CheckIcon,
  ArrowRightOnRectangleIcon,
  TrashIcon
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
import Image from 'next/image';
import { MessageStatusIndicator } from '@/components/ai-companion/MessageStatusIndicator';
import FoodBalanceButton from '@/components/aihome/FoodBalanceButton';
import { SecureImageDisplay } from '@/components/ai-companion/SecureImageDisplay';
import { VoiceMessagePlayer } from '@/components/chat/VoiceMessagePlayer';
import UnifiedRightContent from '@/components/UnifiedRightContent';
import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseAnonKey } from '@/lib/supabase-saas';
import ConnectionHint from '@/components/ai-companion/ConnectionHint';
import { convertToPublicUrl, convertToShortUrl, getShortDisplayUrl, extractStoragePath } from '@/lib/getSignedImageUrl';
import { ReferenceImagePicker } from '@/components/chat/ReferenceImagePicker';
import { ReferenceImageAnalysis } from '@/components/chat/ReferenceImageAnalysis';
import { ReferenceCameraModal } from '@/components/chat/ReferenceCameraModal';

const AI_SERVER_URL = process.env.NEXT_PUBLIC_AI_SERVER_URL || 'https://hanami-ai-server.onrender.com';

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
      const invokeError = await response.text(); // Assuming invokeError is the response text
      console.error('Failed to invoke function:', invokeError);
      throw new Error(`Edge Function invoke failed: ${(invokeError as any)?.message || 'Unknown error'}`);
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
  attachments?: any[]; // 新增：附件資料
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
  const { user, logout, supabase } = useSaasAuth();
  const userId = user?.id;
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.roomId as string;

  // 使用 SaaS 系統的 Supabase 客戶端 (使用 useMemo 確保實例穩定，避免無限迴圈)
  // FIX: 直接使用 Auth Hook 提供的已驗證客戶端，避免多重實例衝突
  const saasSupabase = supabase;
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
  const [showHint, setShowHint] = useState(false); // 連線提示顯示狀態

  // 初始化提示


  const handleDismissHint = () => {
    setShowHint(false);
    sessionStorage.setItem('hanami_connection_hint_shown', 'true');
  };

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
  const processingCompanionRef = useRef<'hibi' | 'mori' | 'pico' | null>(null);

  useEffect(() => {
    processingCompanionRef.current = processingCompanion;
  }, [processingCompanion]);
  const subscriptionRef = useRef<any>(null);  // ⭐ 保存訂閱引用
  const processedMessageIds = useRef(new Set<string>());  // ⭐ 追蹤已處理的訊息 ID
  const [forceRender, setForceRender] = useState(0);  // ⭐ 選擇性重新渲染計數器

  // 選擇性重新渲染函數 - 只在特定情況下觸發
  const triggerSelectiveRender = useCallback((reason: string) => {
    console.log(`🔄 [選擇性渲染] 觸發原因: ${reason}`);
    setForceRender(prev => prev + 1);
  }, []);

  // Image Upload & Analysis States
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false); // New state
  const [analyzingImages, setAnalyzingImages] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mimeTypeRef = useRef<string>('audio/webm');
  const wavRecorderRef = useRef<any>(null); // Use custom WavRecorder

  const [showSettingsPanel, setShowSettingsPanel] = useState(false);

  const [activeRoles, setActiveRoles] = useState<('hibi' | 'mori' | 'pico')[]>(() => {
    console.log('🏁 初始化 activeRoles 為空陣列 (將被 URL 參數或資料庫覆蓋)');
    return []; // 空陣列，稍後會被 URL 參數或資料庫覆蓋
  });
  const [selectedCompanion, setSelectedCompanion] = useState<'hibi' | 'mori' | 'pico'>('hibi'); // 預設 hibi 統籌
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [mounted, setMounted] = useState(false);


  useEffect(() => {
    setMounted(true);
  }, []);

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

  const [modelSelectorMode, setModelSelectorMode] = useState<'role' | 'audio' | 'vision'>('role');
  const [roomModelSelectOpen, setRoomModelSelectOpen] = useState(false);

  // 監聽模型選擇開啟事件（從 ChatSettingsPanel 觸發）
  useEffect(() => {
    const handleOpenModelSelector = (e: CustomEvent) => {
      const { companionId, capability } = e.detail || {};

      if (capability === 'audio_input') {
        setModelSelectorMode('audio');
        setRoomModelSelectOpen(true);
        return;
      }

      if (capability === 'image_input') {
        setModelSelectorMode('vision');
        setRoomModelSelectOpen(true);
        return;
      }

      const cid = companionId as 'hibi' | 'mori' | 'pico' | undefined;
      if (!cid) return;

      setModelSelectorMode('role');
      // 切換到對應夥伴
      setSelectedCompanion(cid);

      // 展開對應角色的模型選擇區域
      if (cid === 'pico') {
        setPicoModelOptionsExpanded(true);
        setPicoModelOptionsExpandedForModal(true);
        setPicoModelSelectOpen(true);
      } else if (cid === 'mori') {
        setMoriModelOptionsExpanded(true);
        setMoriModelOptionsExpandedForModal(true);
        setMoriModelSelectOpen(true);
      } else if (cid === 'hibi') {
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
      // Use shared client
      const supabase = saasSupabase;

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

    // roleKey is internalName (hibi, mori, pico)
    if (roleKey && roomId) {
      console.log(`💾 [Save] 保存積木設定 (Optimistic): room=${roomId}, role=${roleKey}, slot=${slotType}, block=${block.title}`);

      // 1. Optimistic Update (Immediate UI Feedback)
      const previousMap = { ...roleInstancesMap }; // Backup for rollback if needed

      setRoleInstancesMap(prev => {
        const newMap = { ...prev };
        if (newMap[roleKey]) {
          newMap[roleKey] = {
            ...newMap[roleKey],
            settings: {
              ...newMap[roleKey].settings,
              equipped_blocks: {
                ...(newMap[roleKey].settings?.equipped_blocks || {}),
                [slotType]: block
              }
            }
          };
          console.log('✅ [Optimistic Update] Local state updated for:', roleKey);
        }
        return newMap;
      });

      // Close modal immediately
      setLoadoutModalState(prev => ({ ...prev, isOpen: false }));
      const { default: toast } = await import('react-hot-toast');
      toast.success('已裝備思維積木');

      // 2. Background Database Save
      // Save to both: ai_rooms.settings (room-specific) AND role_mind_blocks (global)
      (async () => {
        try {
          const instance = roleInstancesMap[roleKey];
          const roleId = instance?.role_id;

          console.log('💾 [Save] 保存積木到資料庫:', { roleKey, roleId, slotType, blockId: block.id });

          // 2.1 Save to room settings (room-specific override)
          const response = await fetch('/api/chat/room-settings/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              roomId,
              userId: user?.id,
              updates: {
                mind_block_overrides: {
                  [roleKey]: {
                    [slotType]: block
                  }
                }
              }
            })
          });

          const result = await response.json();

          if (!response.ok || !result.success) {
            throw new Error(result.error || 'API request failed');
          }

          console.log('✅ [Save] 房間設定已更新');

          // 2.2 Also save to role_mind_blocks table (global setting)
          if (roleId && user?.id) {
            try {
              // Check if record exists
              const { data: existing } = await (saasSupabase as any)
                .from('role_mind_blocks')
                .select('id')
                .eq('user_id', user.id)
                .eq('role_id', roleId)
                .eq('mind_block_id', block.id)
                .maybeSingle();

              if (existing) {
                // Update existing record
                await (saasSupabase as any)
                  .from('role_mind_blocks')
                  .update({ is_active: true })
                  .eq('id', existing.id);
                console.log('✅ [Save] role_mind_blocks 已更新');
              } else {
                // Insert new record
                await (saasSupabase as any)
                  .from('role_mind_blocks')
                  .insert({
                    user_id: user.id,
                    role_id: roleId,
                    mind_block_id: block.id,
                    is_active: true
                  });
                console.log('✅ [Save] role_mind_blocks 已新增');
              }
            } catch (dbError) {
              console.warn('⚠️ [Save] role_mind_blocks 保存失敗 (可忽略，房間設定已保存):', dbError);
            }
          }

          console.log('✅ [Save] 積木設定已成功同步到資料庫');

        } catch (error) {
          console.error('❌ [Save] 保存積木設定異常:', error);
          const { default: toast } = await import('react-hot-toast');
          toast.error('保存積木設定異常');
        }
      })();
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

  const [roleSelectorOpen, setRoleSelectorOpen] = useState(false);

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
  // NOTE: Server-side (Edge Function) now handles sessionless message persistence fallback.
  // We don't strive to save 'ai_sessions' from client to avoid blocking/timeouts if table is missing.

  const [showInviteModal, setShowInviteModal] = useState(false);


  const handleLogout = async () => {
    try {
      await logout();
      router.push('/aihome/auth/login');
    } catch (error) {
      console.error('登出失敗:', error);
      // 即使登出失敗，也導航到登入頁面
      router.push('/aihome/auth/login');
    }
  };
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

  // 初始化提示：處理「初次進入」與「連線卡住」
  useEffect(() => {
    // 1. 檢查是否為本次會話首次進入
    const hasShownHint = sessionStorage.getItem('hanami_connection_hint_shown');
    // 如果沒顯示過，就顯示
    if (!hasShownHint) {
      setShowHint(true);
    }

    // 2. 設置連線超時檢查 (如果 10 秒內未完成資料庫載入，視為連線卡住，強制顯示提示)
    const stuckTimer = setTimeout(() => {
      if (!hasLoadedFromDatabase) {
        console.log('⚠️ [ConnectionHint] 偵測到連線緩慢或卡住，顯示提示');
        setShowHint(true);
      }
    }, 10000);

    return () => clearTimeout(stuckTimer);
  }, [hasLoadedFromDatabase]);
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

  // 追蹤用戶是否接近底部 (用於防止閱讀歷史訊息時被強制滾動)
  const isNearBottomRef = useRef(true);

  // 滾動到訊息底部的函數
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

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
      // 改為查詢 model_configs 表以確保獲取 metadata
      console.log('🔍 [Load] Fetching model_configs...');
      const { data, error } = await saasSupabase
        .from('model_configs')
        .select('*')
        .eq('is_active', true)
        .eq('is_available', true)
        .order('input_cost_hkd', { ascending: true });

      if (error) {
        console.error('載入模型配置錯誤:', error);
        // Fallback models when API fails
        setAvailableModels([
          { model_id: 'gpt-4o-mini', display_name: 'GPT-4o Mini', provider: 'OpenAI', is_free: true, input_cost_usd: 0 },
          { model_id: 'gemini-1.5-flash', display_name: 'Gemini 1.5 Flash', provider: 'Google', is_free: true, input_cost_usd: 0 },
          { model_id: 'claude-3-5-haiku', display_name: 'Claude 3.5 Haiku', provider: 'Anthropic', is_free: false, input_cost_usd: 0.00025 }
        ]);
      } else {
        console.log('✅ 成功載入模型配置 (model_configs):', data?.length || 0, '個模型');

        // Parse JSON fields if they are strings (Supabase sometimes returns JSONB as string depending on config)
        const parsedData = (data || []).map((m: any) => {
          let caps = m.capabilities;
          if (typeof caps === 'string') {
            try { caps = JSON.parse(caps); } catch (e) { caps = []; }
          }
          let meta = m.metadata;
          if (typeof meta === 'string') {
            try { meta = JSON.parse(meta); } catch (e) { meta = {}; }
          }
          return {
            ...m,
            capabilities: Array.isArray(caps) ? caps : [],
            metadata: meta || {}
          };
        });

        // Debug: Check metadata of first few items
        if (parsedData.length > 0) {
          console.log('[DEBUG] First model metadata (parsed):', parsedData[0].metadata);
          console.log('[DEBUG] First model capabilities (parsed):', parsedData[0].capabilities);
        }
        setAvailableModels(parsedData);
      }
    } catch (error) {
      console.error('載入模型配置異常:', error);
      // Fallback models when API fails
      setAvailableModels([
        { model_id: 'gpt-4o-mini', display_name: 'GPT-4o Mini', provider: 'OpenAI', is_free: true, input_cost_usd: 0 },
        { model_id: 'gemini-1.5-flash', display_name: 'Gemini 1.5 Flash', provider: 'Google', is_free: true, input_cost_usd: 0 },
        { model_id: 'claude-3-5-haiku', display_name: 'Claude 3.5 Haiku', provider: 'Anthropic', is_free: false, input_cost_usd: 0.00025 }
      ]);
    } finally {
      setLoadingPicoModels(false);
      setLoadingMoriModels(false);
      setLoadingHibiModels(false);
    }
  };

  // 載入角色模型設定的通用函數
  const loadRoleModelSettings = async (roleId: 'hibi' | 'mori' | 'pico') => {
    if (!user?.id || !roomId) return;

    try {
      // 設置載入狀態
      if (roleId === 'pico') setLoadingPicoModels(true);
      else if (roleId === 'mori') setLoadingMoriModels(true);
      else setLoadingHibiModels(true);

      // Use shared client
      const supabase = saasSupabase;

      // 映射 companion.id 到實際的 slug
      const getRoleSlug = (companionId: string) => {
        const slugMap: Record<string, string> = {
          'hibi': 'hibi-manager',
          'mori': 'mori-researcher',
          'pico': 'pico-artist'
        };
        return slugMap[companionId] || companionId;
      };

      // 0. 嘗試從房間設定中讀取 (優先級最高)
      const { data: roomData } = await supabase
        .from('ai_rooms')
        .select('settings')
        .eq('id', roomId)
        .single();

      const currentSettings = ((roomData as any)?.settings as any) || {};
      const modelOverrides = currentSettings.model_overrides || {};
      const roomOverrideModel = modelOverrides[roleId];

      if (roomOverrideModel) {
        console.log(`🏠 [Load] 使用房間特定模型: ${roleId} -> ${roomOverrideModel}`);
        if (roleId === 'pico') {
          setPicoSelectedModel(roomOverrideModel);
          if (availableModels.length > 0) {
            const modelData = availableModels.find((m: any) => m.model_id === roomOverrideModel);
            setPicoModelSearch(modelData?.display_name || roomOverrideModel);
          }
        } else if (roleId === 'mori') {
          // Mori 支援多選模型
          if (roomOverrideModel.includes(',')) {
            const modelIds = roomOverrideModel.split(',').map((id: string) => id.trim()).filter(Boolean);
            setMoriSelectedModelsMulti(modelIds);
            setMoriSelectedModel(DEFAULT_MODEL_SENTINEL);
          } else {
            setMoriSelectedModel(roomOverrideModel);
            setMoriSelectedModelsMulti([]);
            if (availableModels.length > 0) {
              const modelData = availableModels.find((m: any) => m.model_id === roomOverrideModel);
              setMoriModelSearch(modelData?.display_name || roomOverrideModel);
            }
          }
        } else { // hibi
          setHibiSelectedModel(roomOverrideModel);
          if (availableModels.length > 0) {
            const modelData = availableModels.find((m: any) => m.model_id === roomOverrideModel);
            setHibiModelSearch(modelData?.display_name || roomOverrideModel);
          }
        }
        // 如果有房間設定，直接返回，不讀取用戶全局設定
        return;
      }

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
  // 保存角色模型設定的通用函數（使用 ai_rooms.settings，範圍僅限當前房間）
  const saveRoleModelSettings = async (roleId: 'hibi' | 'mori' | 'pico', modelId: string | string[]) => {
    if (!user?.id || !roomId) return;

    try {
      console.log(`💾 [Save] 開始保存模型設定 (API): room=${roomId}, role=${roleId}, model=${modelId}`);

      // 處理模型 ID（支援多選）
      const resolvedModel = Array.isArray(modelId) ? modelId.join(',') : modelId;

      let overridesUpdate: any = {};

      // 如果選擇預設，則發送 null 或特殊標記讓後端處理刪除？
      // 由於 API 目前只做 merge，刪除比較麻煩。
      // 這裡我們先簡單處理：如果是 DEFAULT_MODEL_SENTINEL，我們將其存為 null 或空字串，然後在讀取時過濾
      // 或者，我們直接存這個值，讀取時視為預設。
      // 簡單起見，直接更新為 resolvedModel，讀取時判斷是否為 sentinel

      const response = await fetch('/api/chat/room-settings/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          userId: user.id,
          updates: {
            model_overrides: {
              [roleId]: resolvedModel
            }
          }
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'API request failed');
      }

      const newSettings = result.data;


      console.log('✅ [Save] 模型設定已更新到房間:', newSettings);

      // 3. 更新本地狀態 & 顯示 Toast
      if (resolvedModel === DEFAULT_MODEL_SENTINEL || (Array.isArray(modelId) && modelId.length === 0)) {
        // 恢復預設邏輯
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
        toast.success('已恢復為房間預設模型', {
          icon: <CpuChipIcon className="w-5 h-5 text-green-600" />,
          duration: 2000,
          style: { background: '#fff', color: '#4B4036' }
        });
      } else {
        // 設置新模型邏輯
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
        toast.success('已更新此房間的模型設定', {
          icon: <CpuChipIcon className="w-5 h-5 text-blue-600" />,
          duration: 2000,
          style: { background: '#fff', color: '#4B4036' }
        });
      }
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

  // 根據角色過濾模型 - 針對 Pico (視覺/繪圖)
  const getFilteredPicoModels = () => {
    if (showAllPicoModels) return availableModels;

    // Filter for image generation / vision capable models
    return availableModels.filter(m => {
      const id = m.model_id.toLowerCase();

      // Check explicit capabilities if available
      if (m.capabilities?.includes('image_generation') || m.capabilities?.includes('text_to_image')) {
        return true;
      }

      // Check model ID/provider for known image models
      if (id.includes('flux') || id.includes('midjourney') || id.includes('dall-e') || id.includes('ideogram')) {
        return true;
      }

      if (m.provider === 'Google' && (id.includes('image') || id.includes('vision'))) {
        return true;
      }

      // Special case for Gemini Flash Image
      if (id.includes('gemini') && id.includes('flash') && id.includes('image')) {
        return true;
      }

      return false;
    });
  };

  // 根據角色過濾模型 - 針對 Mori (研究/搜索)
  const getFilteredMoriModels = () => {
    if (showAllMoriModels) return availableModels;

    // Filter out image generation models
    return availableModels.filter(m => {
      const id = m.model_id.toLowerCase();
      // Exclude known image models
      if (id.includes('flux') || id.includes('midjourney') || id.includes('dall-e') || id.includes('ideogram')) {
        return false;
      }
      if (m.capabilities?.includes('image_generation') || m.capabilities?.includes('text_to_image')) {
        return false;
      }
      return true;
    });
  };

  // 根據角色過濾模型 - 針對 Hibi (管理/代碼)
  const getFilteredHibiModels = () => {
    if (showAllHibiModels) return availableModels;

    // Filter out image generation models
    return availableModels.filter(m => {
      const id = m.model_id.toLowerCase();
      // Exclude known image models
      if (id.includes('flux') || id.includes('midjourney') || id.includes('dall-e') || id.includes('ideogram')) {
        return false;
      }
      if (m.capabilities?.includes('image_generation') || m.capabilities?.includes('text_to_image')) {
        return false;
      }
      return true;
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

  // 格式化模型顯示名稱（支援多選模型）- 改為顯示家族名稱
  const formatModelDisplay = (modelId: string | undefined): string => {
    if (!modelId) return '';

    const getFamilyName = (id: string) => {
      // Clean ID
      const cleanId = id.replace(/:free/gi, '');
      const model = availableModels.find((m: any) => m.model_id === id || m.model_id === cleanId);
      if (!model) return stripFree(cleanId);

      const FAMILY_MAP: Record<string, string> = {
        'chatgpt': 'ChatGPT',
        'gemini': 'Gemini',
        'claude': 'Claude',
        'grok': 'Grok',
        'deepseek': 'DeepSeek',
        'qwen': 'Qwen',
        'flux': 'Flux',
        'openai': 'ChatGPT',
        'google': 'Gemini',
        'anthropic': 'Claude',
        'xai': 'Grok',
        'alibaba': 'Qwen'
      };

      const familyKey = model.metadata?.family?.toLowerCase() || model.provider?.toLowerCase();
      if (familyKey && FAMILY_MAP[familyKey]) {
        return FAMILY_MAP[familyKey];
      }
      return stripFree(model.display_name || cleanId);
    };

    // 如果包含逗號，表示是多選模型
    if (modelId.includes(',')) {
      const modelIds = modelId.split(',').map((id: string) => id.trim()).filter(Boolean);
      const names = modelIds.map(getFamilyName);
      // Remove duplicates
      return Array.from(new Set(names)).join('、');
    }

    // 單選模型
    return getFamilyName(modelId);
  };
  // 計算 100 字問題食量
  const computeFoodFor100 = (model: any): number => {
    if (!model) return 1;
    // Handle HKD or USD
    let inputCost = 0;
    if (model.input_cost_hkd) {
      // HKD to USD approx (1 USD = 7.8 HKD)
      inputCost = Number(model.input_cost_hkd) / 7.8;
    } else if (model.input_cost_usd) {
      inputCost = Number(model.input_cost_usd || 0);
    }

    const totalUsd = (100 / 1_000_000) * inputCost;
    const food = Math.ceil(totalUsd * 3 * 100);
    return Math.max(food, 1);
  };
  // 處理並設定模型資料 (抽取為共用函數)
  const processAndSetModels = (data: any[]) => {
    console.log('✅ [Models] Processing server-side models:', data.length);
    const parsedData = (data || []).map((m: any) => {
      let caps = m.capabilities;
      if (typeof caps === 'string') {
        try { caps = JSON.parse(caps); } catch (e) { caps = []; }
      }
      let meta = m.metadata;
      if (typeof meta === 'string') {
        try { meta = JSON.parse(meta); } catch (e) { meta = {}; }
      }
      return {
        ...m,
        capabilities: Array.isArray(caps) ? caps : [],
        metadata: meta || {}
      };
    });
    setAvailableModels(parsedData);
  };



  // 載入角色用戶設定（當用戶登入且有角色活躍時）
  useEffect(() => {
    if (user?.id && activeRoles.length > 0) {
      activeRoles.forEach(roleId => {
        if (roleId === 'pico') loadPicoModelSettings();
        else if (roleId === 'mori') loadMoriModelSettings();
        else if (roleId === 'hibi') loadHibiModelSettings();
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
    config?: any;
  }>({
    title: '載入中...',
    description: '正在載入專案資訊...',
    activeCompanions: [], // 空陣列，稍後會被實際資料覆蓋
    config: {}
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 載入房間資訊和角色
  const loadRoomInfo = async () => {
    try {
      console.log('🔍 [Load] 載入房間資訊 - Start, RoomID:', roomId);

      const response = await fetch('/api/chat/room-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
          roomId,
          userId: user?.id
        })
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      const { roomData, roleInstancesMap: newRoleInstancesMap, roomRoles, modelConfigs } = result.data;

      console.log('✅ [Load] API 載入成功:', roomData?.title, 'Roles:', roomRoles, 'Models:', modelConfigs?.length);

      // Update Models immediately
      if (modelConfigs && modelConfigs.length > 0) {
        processAndSetModels(modelConfigs);
      } else {
        // Fallback to client fetch if server didn't return models (backward compatibility)
        loadAvailableModels();
      }

      // Handle Initial Messages (Pre-fetched)
      const initialMessages = (result.data as any).initialMessages;
      if (initialMessages && initialMessages.length > 0) {
        console.log('🚀 [FastLoad] 使用預載入的訊息:', initialMessages.length, '條');
        const activeMessages = initialMessages.filter((msg: any) => msg.status !== 'deleted');
        const convertedMessages = transformSupabaseMessages(activeMessages).reverse();
        setMessages(convertedMessages);
        setHasLoadedHistory(true);
        setHasMoreMessages(activeMessages.length >= 30);
      } else {
        setHasLoadedHistory(true);
      }

      // Ensure specific membership in background verify (non-blocking)
      ensureRoomMembership(roomId, user?.id || '').catch(err => console.warn('Background membership check failed:', err));

      // Update State
      console.log('✅ [Load] Updating local room state:', roomData);
      console.log('🔍 [Load] Settings from DB:', roomData.settings);
      setRoom({
        title: roomData.title || (roomData as any).project_name || '未命名專案',
        description: roomData.description || '',
        activeCompanions: roomRoles.length > 0 ? roomRoles as ('hibi' | 'mori' | 'pico')[] : activeRoles,
        config: roomData.settings || {}
      });
      setRoleInstancesMap(newRoleInstancesMap);

      // Helper to infer companion ID from role instance
      const inferCompanionId = (instance: RoleInstance): 'hibi' | 'mori' | 'pico' | null => {
        const raw =
          instance.role?.slug ||
          instance.role?.name ||
          instance.nickname ||
          '';
        const n = raw.toLowerCase();

        if (n.includes('hibi')) return 'hibi';
        if (n.includes('mori') || n.includes('墨墨')) return 'mori';
        if (n.includes('pico') || n.includes('皮可')) return 'pico';
        return null;
      };

      // Sync local model state from loaded role instances
      Object.values(newRoleInstancesMap).forEach((instance: any) => {
        const roleId = inferCompanionId(instance);
        const modelOverride = instance.model_override;

        if (modelOverride) {
          console.log(`🔄 [Load] Syncing local model state for ${roleId}: ${modelOverride}`);
          if (roleId === 'hibi') {
            setHibiSelectedModel(modelOverride);
            // Update search text for better UX
            const modelData = availableModels.find((m: any) => m.model_id === modelOverride);
            setHibiModelSearch(modelData?.display_name || modelOverride);
          } else if (roleId === 'mori') {
            // Handle multi-model string (comma separated) OR single model -> always treat as multi for Mori
            const models = modelOverride.split(',').map((s: string) => s.trim()).filter(Boolean);
            if (models.length > 0) {
              setMoriSelectedModelsMulti(models);
              setMoriSelectedModel(DEFAULT_MODEL_SENTINEL);
            }
          } else if (roleId === 'pico') {
            setPicoSelectedModel(modelOverride);
            const modelData = availableModels.find((m: any) => m.model_id === modelOverride);
            setPicoModelSearch(modelData?.display_name || modelOverride);
            setPicoModelSearch(modelData?.display_name || modelOverride);
          }
        }

        // Sync role default model (ONLY if no room-wide override exists)
        if (instance.role && instance.role.default_model) {
          const defaultModel = instance.role.default_model;

          if (roleId === 'hibi') {
            setHibiRoleDefaultModel(defaultModel);
          } else if (roleId === 'mori') {
            // 🚨 PREVENT OVERWRITE: Only set default if audio_model is NOT set in room config
            if (!roomData.settings?.audio_model) {
              console.log(`🔄 [Load] Syncing default model for ${roleId}: ${defaultModel}`);
              setMoriRoleDefaultModel(defaultModel);
            }
          } else if (roleId === 'pico') {
            // 🚨 PREVENT OVERWRITE: Only set default if vision_model is NOT set in room config
            if (!roomData.settings?.vision_model) {
              console.log(`🔄 [Load] Syncing default model for ${roleId}: ${defaultModel}`);
              setPicoRoleDefaultModel(defaultModel);
            }
          }
        }
      });

      // 🚨 CRITICAL FIX: Explicitly sync room-wide settings (Audio/Vision) to UI State
      // This ensures the internal 'moriSelectedModel' state matches what is in room.config
      if (roomData.settings?.audio_model) {
        setMoriSelectedModel(roomData.settings.audio_model);
      }
      if (roomData.settings?.vision_model) {
        setPicoSelectedModel(roomData.settings.vision_model);
      }

      // Update active roles based on database logic
      if (result.data.roomRoles.length > 0 && !urlParams.initialRole && !urlParams.companion) {
        console.log('🔄 使用資料庫中的角色設定:', roomRoles);
        const normalized = roomRoles as ('hibi' | 'mori' | 'pico')[];

        // Only update activeRoles and reset selection if this is the initial load
        // OR if the current activeRoles are empty (failsafe)
        if (!hasLoadedFromDatabase || activeRoles.length === 0) {
          setActiveRoles(normalized);
          if (roomRoles.length === 1) {
            setSelectedCompanion(normalized[0]);
          }
          sessionStorage.setItem(`room_${roomId}_roles`, JSON.stringify(normalized));
        }
      }
      setHasLoadedFromDatabase(true);

      setHasLoadedFromDatabase(true);

      // (Redundant setRoom block removed - it was overwriting config with undefined value)

    } catch (error) {
      console.error('❌ [Load] 載入房間資訊失敗 (API):', error);
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
      // Use shared client
      const supabase = saasSupabase;

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
              sender = newMsg.content_json?.role_name || newMsg.content_json?.meta?.role || processingCompanionRef.current || 'hibi';
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
            sender = updatedMsg.content_json?.role_name || updatedMsg.content_json?.meta?.role || processingCompanionRef.current || 'hibi';
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

  // 監聽打開積木選擇器的事件
  useEffect(() => {
    const handleOpenBlockSelector = (event: CustomEvent) => {
      const { type, roleInstanceId } = event.detail;
      console.log('🧩 [Event] Open Block Selector:', type, roleInstanceId);
      setLoadoutModalState({
        isOpen: true,
        slotType: type as any,
        roleInstanceId: roleInstanceId
      });
    };

    window.addEventListener('open-block-selector', handleOpenBlockSelector as any);
    return () => {
      window.removeEventListener('open-block-selector', handleOpenBlockSelector as any);
    };
  }, []);

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
          roleName: roleId === 'hibi' ? '希希' : roleId === 'mori' ? '墨墨' : '皮可'
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
            roleName: roleId === 'hibi' ? '希希' : roleId === 'mori' ? '墨墨' : '皮可',
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
        let inviteContent = '';
        if (roleId === 'hibi') {
          inviteContent = `（綜合）希希 已加入專案！大家好，我是（綜合）希希，${invitedCompanion.description}。很高興加入這個專案！`;
        } else if (roleId === 'mori') {
          inviteContent = `（多模型研究）墨墨 已加入專案！大家好，我是（多模型研究）墨墨，${invitedCompanion.description}。很高興加入這個專案！`;
        } else if (roleId === 'pico') {
          inviteContent = `（繪圖）皮可 已加入專案！大家好，我是（繪圖）皮可，${invitedCompanion.description}。很高興加入這個專案！`;
        } else {
          inviteContent = `${invitedCompanion.name} 已加入專案！大家好，我是 ${invitedCompanion.name}，${invitedCompanion.description}。很高興加入這個專案！`;
        }

        const inviteMessage: Message = {
          id: `invite-${roleId}-${Date.now()}`,
          content: inviteContent,
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
      name: '希希',
      nameEn: 'Hibi',
      description: '系統總管狐狸，智慧的協調者和統籌中樞，負責解答您的問題',
      specialty: '綜合',
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
      description: '智慧的貓頭鷹研究員，專精以多模型於學術研究、資料分析和知識整理。',
      specialty: '多模型研究',
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
      description: '創意無限的水瀨藝術家，專精於視覺創作、設計和藝術指導。',
      specialty: '繪圖',
      icon: PaintBrushIcon,
      imagePath: '/3d-character-backgrounds/studio/Pico/Pico.png',
      personality: '創意、活潑、藝術',
      abilities: ['繪畫創作', '視覺設計', '創意發想', '藝術指導', '工作設計'],
      color: 'from-blue-400 to-cyan-500',
      status: 'online'
    }
  ];


  // 監聽訊息變化並確保渲染
  // 監聽訊息變化並確保渲染 (更智能的滾動邏輯)
  useEffect(() => {
    if (messages.length > 0) {
      // 判斷是否應該滾動
      const shouldScroll = isNearBottomRef.current;
      const lastMessage = messages[messages.length - 1];
      const isUserMessage = lastMessage?.sender === 'user'; // 如果是用戶發的，強制滾動

      if (hasLoadedHistory && (shouldScroll || isUserMessage)) {
        // 使用 RAF 確保 DOM 更新後執行
        requestAnimationFrame(() => scrollToBottom());
      }
    }
  }, [messages.length, hasLoadedHistory, scrollToBottom]);

  // 確保用戶是房間成員
  const membershipCheckedRef = useRef<string | null>(null);

  const ensureRoomMembership = useCallback(async (roomId: string, userId: string) => {
    // 檢查緩存，如果已經檢查過該房間，則直接返回
    if (membershipCheckedRef.current === roomId) {
      console.log('🛡️ [Membership] 已在本次會話檢查過成員身份，跳過');
      return;
    }

    console.log('🛡️ [Membership] 開始檢查成員身份 (API):', roomId, userId);

    // 重試機制
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        attempt++;

        // 改用 API 路由進行檢查，避免 Client 並發鎖問題
        const response = await fetch('/api/chat/membership', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ roomId, userId })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `API 錯誤: ${response.status}`);
        }

        const data = await response.json();
        if (data.success) {
          console.log('✅ [Membership] 成員身份檢查成功 (API)');
          membershipCheckedRef.current = roomId;
          return;
        } else {
          throw new Error(data.error || 'API 返回失敗狀態');
        }

      } catch (error) {
        console.warn(`⚠️ [Membership] 第 ${attempt} 次嘗試發生錯誤:`, error);
        if (attempt === maxRetries) {
          console.error('❌ 確保房間成員身份多次嘗試後失敗 (API)');
          throw error; // 拋出錯誤讓調用者知道失敗
        } else {
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    }
  }, []);

  // 調試日誌（已移除以減少控制台輸出）
  // console.log('🎯 當前房間狀態:', { roomId, initialRoleParam, companionParam, activeRoles, selectedCompanion });

  const loadInitialMessages = useCallback(async () => {
    if (!roomId || !userId) return;

    try {
      console.log('🔍 載入聊天室歷史訊息:', roomId);

      console.log('🛡️ 呼叫 ensureRoomMembership...');
      await ensureRoomMembership(roomId, userId);
      console.log('🛡️ ensureRoomMembership 完成');

      // 改用 API 路由獲取訊息，避免 Client 並發鎖問題
      console.log('📜 [API] 呼叫訊息載入 API...');
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          limit: MESSAGE_FETCH_LIMIT,
          userId // Optional, for logging/security if needed
        })
      });

      if (!response.ok) {
        throw new Error(`API 錯誤: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'API 返回失敗');
      }

      const data = result.data;
      // const { data, error } = await saasSupabase ... (Removed)



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
      console.log(`✅ 載入了 ${convertedMessages.length} 條歷史訊息，準備渲染`);

      // 強制確保狀態更新被 React 捕捉
      requestAnimationFrame(() => {
        triggerSelectiveRender('進入/刷新聊天室 - 數據載入完成');
        setTimeout(scrollToBottom, 100);
      });

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

      // 使用 requestAnimationFrame 確保在渲染後滾動
      requestAnimationFrame(() => {
        setTimeout(() => {
          scrollToBottom();
          console.log('📜 [Scroll] 嘗試滾動到底部');
        }, 200);
      });
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

    // 更新接近底部狀態 (閾值設為 100px)
    isNearBottomRef.current = distanceFromBottom < 100;

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
          let content = '';
          if (roleId === 'hibi') {
            content = `你好！我是（綜合）希希，${selectedCompanionData.description}。歡迎來到我們的專案協作空間！有什麼任務需要我協助的嗎？`;
          } else if (roleId === 'mori') {
            content = `你好！我是（多模型研究）墨墨，${selectedCompanionData.description}。歡迎來到我們的專案協作空間！有什麼任務需要我協助的嗎？`;
          } else if (roleId === 'pico') {
            content = `你好！我是（繪圖）皮可，${selectedCompanionData.description}。歡迎來到我們的專案協作空間！有什麼任務需要我協助的嗎？`;
          } else {
            content = `你好！我是 ${selectedCompanionData.name}，${selectedCompanionData.description}。歡迎來到我們的專案協作空間！有什麼任務需要我協助的嗎？`;
          }

          welcomeMessages = [
            {
              id: 'welcome-single-member',
              content: content,
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
            const companion = companions.find(c => c.id === roleId);
            let content = '';
            if (roleId === 'hibi') {
              content = `歡迎來到 ${room.title}！我是（綜合）希希，${companion?.description}。`;
            } else if (roleId === 'mori') {
              content = `我是（多模型研究）墨墨，${companion?.description}。`;
            } else if (roleId === 'pico') {
              content = `嗨！我是（繪圖）皮可，${companion?.description}。`;
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
    response += '• **第5–8週：：** 撰寫報告與建議；如需原始資料，並行準備IRB文件、問卷與資料蒐集SOP、試點收案\n';
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
      hibi: '🦊 （綜合）希希 遇到點小困難，可以重新輸入或稍後再試。',
      mori: '🦉 （多模型研究）墨墨 遇到點小困難，可以重新輸入或稍後再試。',
      pico: '🎨 （繪圖）皮可 遇到點小困難，可以重新輸入或稍後再試。'
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
      'hibi': '🦊 （綜合）希希 訊息',
      'mori': '🦉 （多模型研究）墨墨 訊息',
      'pico': '🦦 （繪圖）皮可 訊息',
      'system': '⚙️ 系統訊息'
    };
    console.log(`💾 保存 ${messageTypeMap[message.sender as keyof typeof messageTypeMap] || message.sender}:`, message.content.substring(0, 30) + '...');

    try {
      const roomIdToUse = targetRoomId || currentRoomId || roomId;
      console.log('🔍 準備儲存訊息到房間:', roomIdToUse);

      // Include the message ID so it matches what Edge Function expects
      const messageData = {
        id: message.id, // Use the temp ID so Edge Function can upsert with same ID
        room_id: roomIdToUse,
        session_id: currentSessionId,
        sender_type: message.sender === 'user' ? 'user' : 'role',
        sender_user_id: message.sender === 'user' ? user.id : null,
        sender_role_instance_id: null,
        content: message.content,
        content_json: message.metadata
          ? {
            ...message.metadata,
            role_name: message.sender,
            images: message.attachments
          }
          : {
            role_name: message.sender,
            images: message.attachments
          },
        attachments: message.attachments,
        status: 'sent'
      };
      console.log('🔍 準備儲存的訊息資料:', messageData);

      // SIMPLIFIED APPROACH: Use existing authenticated client directly
      // The Edge Function will handle persistence as a fallback if this fails
      let savedMessageId: string | null = null;

      try {
        console.log('🛡️ [Persistence] Using existing Supabase client for save...');

        // Use a reasonable timeout (10s) - Edge Function will handle it if this fails
        const savePromise = (saasSupabase as any)
          .from('ai_messages')
          .upsert(messageData, { onConflict: 'id' })
          .select('id')
          .single();

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Client save timeout (10s)')), 10000);
        });

        const { data: savedMsg, error: saveError } = await Promise.race([savePromise, timeoutPromise]) as any;

        if (saveError) {
          // Log but don't throw - Edge Function will handle it
          console.log(`ℹ️ [Persistence] Client save error (Edge will handle):`, saveError.message);
        } else if (savedMsg) {
          savedMessageId = savedMsg.id;
          console.log('✅ [Persistence] User message saved via Client:', savedMessageId);
        }
      } catch (err: any) {
        // Timeout or other error - Edge Function will save the message
        console.log(`ℹ️ [Persistence] Client save skipped (${err.message}). Edge Function will handle.`);
      }

      return savedMessageId;
    } catch (error) {
      console.log('ℹ️ [Persistence] Save operation delegated to Edge Function.');
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
  const callChatProcessor = async (userMessage: string, roomId: string, roleHint: string, messageData?: any, userMessageId?: string) => {
    try {
      console.log('🚀 呼叫 chat-processor Edge Function...');
      const payload = {
        message: userMessage,
        roomId: roomId,
        companionId: roleHint,
        userId: user?.id, // Pass userId for service role calls
        messageId: userMessageId, // Pass messageId for updates
        modelId: roleHint === 'mori'
          ? moriSelectedModelsMulti.join(',')
          : roleHint === 'hibi' ? hibiSelectedModel
            : roleHint === 'pico' ? picoSelectedModel
              : undefined,
        attachments: (messageData as any).attachments // Pass attachments to Edge Function
      };

      console.log('📦 [Edge] Request Payload (Attachments):', payload.attachments);

      const { data, error } = await saasSupabase.functions.invoke('chat-processor', {
        body: payload
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
  const checkModelImageSupport = () => {
    try {
      // 1. If Pico, use strict native check (per user request)
      // The instruction implies that Pico should be handled differently,
      // but the provided code block falls through to the standard check for Pico
      // if no vision model is configured.
      // The initial commented block is removed as per instruction to remove console.logs and keep it clean.

      // 2. Check if a Vision Model is configured in Settings
      // If so, we ALLOW image upload regardless of the main model (except if we want to enforce native for Pico?)
      // User said: "Except Pico role, other roles if not support... use OCR..."
      // So checking `room.config.vision_model` is the key.

      const hasVisionModel = !!(room?.config?.vision_model && room.config.vision_model !== '__default__');

      // If not Pico, and we have a vision model, ALLOW IT.
      if (selectedCompanion !== 'pico' && hasVisionModel) {
        return true;
      }

      // Standard Native Check (Fallthrough for Pico or if no Vision Model)
      const state = getRoleModelState();
      if (!state) return true;

      // Default model handling
      let modelIdToCheck = state.selectedModel;
      if (modelIdToCheck === DEFAULT_MODEL_SENTINEL && state.roleDefaultModel) {
        modelIdToCheck = state.roleDefaultModel.split(',')[0];
      }

      // Get models
      const models = state.getFilteredModels?.() || [];
      const modelConfig = models.find((m: any) => m.model_id === modelIdToCheck);

      if (modelConfig) {
        const id = modelConfig.model_id.toLowerCase();
        const type = modelConfig.model_type?.toLowerCase() || '';

        // Known vision capable patterns
        if (type.includes('image') || type.includes('vision') || type.includes('multimodal')) return true;
        if (id.includes('gpt-4o') || id.includes('vision') || id.includes('claude-3') || id.includes('gemini')) return true;

        return false;
      }
      return true; // Default allow
    } catch (e) {
      console.error('Error checking model support:', e);
      return true;
    }
  };

  // Image Handling Functions
  const handleFilesAdded = (files: File[]) => {
    if (files.length > 0) {
      if (selectedImages.length + files.length > 5) {
        const { default: toast } = require('react-hot-toast');
        toast.error(`最多只能上傳 5 張圖片。你已經選擇了 ${selectedImages.length} 張。`);
        return;
      }
      setSelectedImages(prev => [...prev, ...files]);
      setShowImagePicker(false);
    }
  };

  const handleImageSelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      handleFilesAdded(files);
    };
    input.click();
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleCameraCapture = () => {
    // Open Custom Camera Modal
    setShowImagePicker(false);
    setShowCameraModal(true);
  };

  // Voice Recording Time Limit Check
  useEffect(() => {
    if (isRecording && recordingTime >= 180) {
      import('react-hot-toast').then(({ default: toast }) => {
        toast.error('已達到錄音時間上限 (3分鐘)', { duration: 4000 });
      });
      handleStopRecording(true);
    }
  }, [isRecording, recordingTime]);

  // Voice Recording Logic
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Detect supported mime type
      const mimeTypes = [
        'audio/wav',
        'audio/mp4',
        'audio/webm',
        'audio/webm;codecs=opus',
        'audio/ogg;codecs=opus'
      ];

      let selectedMimeType = '';
      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          selectedMimeType = type;
          break;
        }
      }

      // If no robust mime type found (likely Safari only supporting mp4), use manual WAV recorder
      if (!selectedMimeType || selectedMimeType.includes('mp4')) {
        console.log('🎤 [Recording] Using manual WavRecorder fallback for Safari');
        const { WavRecorder } = await import('@/lib/wavRecorder');
        wavRecorderRef.current = new WavRecorder();

        wavRecorderRef.current.onStop = (blob: Blob) => {
          const audioFile = new File([blob], `voice_message_${Date.now()}.wav`, { type: 'audio/wav' });
          handleSendVoiceMessage(audioFile);
          setIsRecording(false);
          setRecordingTime(0);
        };

        await wavRecorderRef.current.start();
        setIsRecording(true);
        setRecordingTime(0);
        recordingTimerRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);
        return;
      }

      console.log('🎤 [Recording] Selected MIME type:', selectedMimeType);
      mimeTypeRef.current = selectedMimeType;

      const mediaRecorder = new MediaRecorder(stream, { mimeType: selectedMimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      const { default: toast } = await import('react-hot-toast');
      toast.error('無法存取麥克風，請檢查權限設定');
      // If NotSupportedError specifically
      if (error instanceof Error && error.name === 'NotSupportedError') {
        console.warn('⚠️ Legacy browser or secure context issue?');
      }
    }
  };

  const handleStopRecording = async (shouldSend = false) => {
    if (wavRecorderRef.current && isRecording) {
      if (shouldSend) {
        await wavRecorderRef.current.stop();
      } else {
        wavRecorderRef.current.cancel();
        setIsRecording(false);
        setRecordingTime(0);
      }
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      wavRecorderRef.current = null;
      return;
    }

    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);

      // Stop all tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());

      // Wait for dataavailable
      mediaRecorderRef.current.onstop = async () => {
        const mimeType = mimeTypeRef.current;
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setIsRecording(false);
        setRecordingTime(0);

        if (shouldSend) {
          let extension = 'webm';
          if (mimeType.includes('mp4')) extension = 'mp4';
          if (mimeType.includes('wav')) extension = 'wav';

          const audioFile = new File([audioBlob], `voice_message_${Date.now()}.${extension}`, { type: mimeType });
          handleSendVoiceMessage(audioFile);
        }
        audioChunksRef.current = [];
      };
    }
  };

  const handleCancelRecording = () => {
    if (wavRecorderRef.current) {
      wavRecorderRef.current.cancel();
      wavRecorderRef.current = null;
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    setRecordingTime(0);
    audioChunksRef.current = [];
  };

  const handleSendVoiceMessage = async (audioFile: File) => {
    if (!user?.id || !roomId) return;

    const lockKey = `${roomId}-audio-${Date.now()}`;
    if (globalSendingLock.get(lockKey)) return;
    globalSendingLock.set(lockKey, true);
    setIsSending(true);

    const tempMessageId = generateUUID();
    const roleHint = selectedCompanion || (activeRoles[0] ?? 'auto');

    // Optimistic UI
    const optimisticAttachment = {
      type: 'audio',
      url: URL.createObjectURL(audioFile),
      name: '語音訊息',
      mimeType: audioFile.type
    };

    const userMessage: Message = {
      id: tempMessageId,
      content: '[語音訊息]', // Text fallback for AI
      sender: 'user',
      timestamp: new Date(),
      type: 'text',
      status: 'processing',
      attachments: [optimisticAttachment]
    };

    setMessages(prev => [...prev, userMessage]);
    processedMessageIds.current.add(tempMessageId);

    // Set processing state
    if (roleHint && ['hibi', 'mori', 'pico'].includes(roleHint)) {
      setProcessingCompanion(roleHint as 'hibi' | 'mori' | 'pico');
    }

    try {
      // Upload
      const realAttachments = await uploadFilesToStorage([audioFile], roomId);
      userMessage.attachments = realAttachments;

      // Save to Supabase
      const savedMessageId = await saveMessageToSupabase(userMessage, roomId);
      if (savedMessageId) {
        processedMessageIds.current.add(savedMessageId);
        // Update IDs in UI
        setMessages(prev => prev.map(msg =>
          msg.id === tempMessageId ? { ...msg, id: savedMessageId, attachments: realAttachments, status: 'sent' } : msg
        ));
        processedMessageIds.current.delete(tempMessageId);
      }

      // Voice message sent to DB, now waiting for AI
      // Crucial: Set Loading/Typing States for UI "Thinking" indicator
      setIsLoading(true);
      setIsTyping(true);

      // Call Chat Processor
      await callChatProcessor('', roomId, roleHint || 'hibi', userMessage, savedMessageId || undefined);

    } catch (error) {
      console.error('Failed to send voice message:', error);
      setMessages(prev => prev.map(msg =>
        msg.id === tempMessageId ? { ...msg, status: 'error' } : msg
      ));
    } finally {
      globalSendingLock.delete(lockKey);
      setIsSending(false);
      setIsLoading(false);
      setIsTyping(false);
      setProcessingCompanion(null);
    }
  };

  const uploadFilesToStorage = async (files: File[], roomId: string): Promise<any[]> => {
    if (!user?.id) return [];

    const uploadedAttachments: any[] = [];
    // Use shared client
    const supabase = saasSupabase;

    for (const file of files) {
      console.log('📤 [Storage] Starting upload for file:', file.name);
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const filePath = `chat_uploads/${roomId}/${fileName}`;
        console.log('📤 [Storage] Generated path:', filePath);

        const { data, error } = await supabase.storage
          .from('hanami-content')
          .upload(filePath, file);

        if (error) {
          console.error('❌ [Storage] Upload failed for:', file.name, error);
          if ((error as any).statusCode === '403') console.error('🔐 [Storage] Permission denied. Check bucket policies for "hanami-content".');
          if ((error as any).error === 'Bucket not found') console.error('🪣 [Storage] Bucket "hanami-content" not found.');
          continue;
        }
        console.log('✅ [Storage] Upload success for:', file.name);

        // Use Signed URL for better security and to ensure backend access even if bucket is private
        const { data: signedData, error: signedError } = await supabase.storage
          .from('hanami-content')
          .createSignedUrl(filePath, 3600); // 1 hour expiry

        if (signedError || !signedData?.signedUrl) {
          console.warn('⚠️ [Storage] createSignedUrl failed, falling back to public URL', signedError);
          // Fallback
          const { data: { publicUrl } } = supabase.storage
            .from('hanami-content')
            .getPublicUrl(filePath);

          uploadedAttachments.push({
            type: file.type.startsWith('audio/') ? 'audio' : 'image',
            url: publicUrl,
            path: filePath,
            name: file.name,
            size: file.size,
            mimeType: file.type
          });
        } else {
          console.log('🔑 [Storage] Generated signed URL for backend access');
          uploadedAttachments.push({
            type: file.type.startsWith('audio/') ? 'audio' : 'image',
            url: signedData.signedUrl,
            path: filePath,
            name: file.name,
            size: file.size,
            mimeType: file.type
          });
        }

      } catch (err) {
        console.error('File upload exception:', err);
      }
    }
    console.log('📦 [Storage] Returning attachments:', uploadedAttachments);
    return uploadedAttachments;
  };

  const handleAnalysisComplete = () => {
    setAnalyzingImages(false);
    // Proceed to send message with images
    // We call handleSendMessage but we need to make sure handleSendMessage knows about the images
    // Since selectedImages is in state, handleSendMessage can access it.
    handleSendMessage();
  };

  // 發送訊息處理函數 - 持久化版本
  // Helper to check for native vision support (reused logic)
  const isNativeVisionSupported = (modelId: string) => {
    try {
      if (!modelId) return false;
      const state = getRoleModelState();
      const models = state?.getFilteredModels?.() || [];
      const m = models.find((x: any) => x.model_id === modelId);
      if (!m) return true; // optimistic default
      const id = m.model_id.toLowerCase();
      const type = m.model_type?.toLowerCase() || '';
      if (type.includes('image') || type.includes('vision') || type.includes('multimodal')) return true;
      if (id.includes('gpt-4o') || id.includes('vision') || id.includes('claude-3') || id.includes('gemini')) return true;
      return false;
    } catch (e) { return true; }
  };

  const handleSendMessage = async () => {
    console.log('🚀 [持久化版] handleSendMessage 被呼叫');

    // ---------------------------------------------------------
    // VISION FALLBACK LOGIC
    // ---------------------------------------------------------
    let finalMessage = inputMessage;
    let finalImages = selectedImages;
    let visionContext = '';

    if (selectedImages.length > 0 && selectedCompanion !== 'pico') {
      const state = getRoleModelState();
      const currentModelId = state?.selectedModel === DEFAULT_MODEL_SENTINEL && state?.roleDefaultModel
        ? state.roleDefaultModel.split(',')[0]
        : state?.selectedModel;

      const nativeSupport = isNativeVisionSupported(currentModelId);

      if (!nativeSupport && room?.config?.vision_model) {
        console.log('👁️ [Vision Fallback] Main model does not support vision. Using Vision Model:', room.config.vision_model);
        const { default: toast } = require('react-hot-toast');
        const toastId = toast.loading('正在透過視覺模型識別圖片...');

        try {

          // Convert images to base64
          const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
          });

          const base64Images = await Promise.all(selectedImages.map(toBase64));

          // Call Chat API
          const messages = [
            {
              role: 'user',
              content: '請詳細描述這張圖片的內容，以便我了解上下文。',
              experimental_attachments: base64Images.map((b64, idx) => ({
                name: selectedImages[idx].name,
                contentType: selectedImages[idx].type,
                url: b64
              }))
            }
          ];

          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages,
              model: room.config.vision_model,
              temperature: 0.3
            })
          });

          if (!response.ok) throw new Error('Vision API response was not ok');

          // Stream handling (simplified for one-shot description)
          // Actually /api/chat returns a stream. We need to read it.
          // Or we can just read the text if we didn't ask for a stream? 
          // Default Vercel AI SDK route streams.
          // Let's assume we need to read the stream.
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          let resultText = '';

          if (reader) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const chunk = decoder.decode(value, { stream: true });
              // Simple cleaning of Vercel stream format (might contain "0:" prefixes etc if using data protocol)
              // Assuming standard textual stream for now or just raw content.
              // Actually, raw fetch to /api/chat usually returns the stream.
              // If it's using 'streamText', it might be raw text.
              // Let's just accumulate.
              resultText += chunk;
            }
          }

          // Clean up resultText if it has protocol headers (simplified fallback)
          // If the description is messy, it's still better than nothing.

          visionContext = `\n\n[系統自動生成的圖片描述]:\n${resultText}`;

          toast.success('圖片識別完成', { id: toastId });

          // Modify variables for downstream
          finalMessage = `${inputMessage}${visionContext}`;
          finalImages = []; // Clear images so main model doesn't error

        } catch (err) {
          console.error('Vision Fallback Failed:', err);
          toast.error('圖片識別失敗，將僅發送文字', { id: toastId });
          finalImages = [];
        }
      }
    }
    // ---------------------------------------------------------

    // Use finalMessage and finalImages for validation and sending
    console.log('🔍 [發送前檢查] 狀態:', {
      inputTrimmed: finalMessage.trim().length > 0,
      isLoading,
      hasUserId: !!user?.id,
      userId: user?.id,
      inputLength: finalMessage.length,
      hasImages: finalImages.length > 0
    });

    // ⭐ 驗證輸入
    if ((!finalMessage.trim() && finalImages.length === 0) || isLoading || !user?.id) {
      console.warn('⚠️ [發送] 輸入無效，忽略請求');
      return;
    }

    let messageContent = finalMessage.trim();
    // Helper for roles
    const roleHint = selectedCompanion || (activeRoles[0] ?? 'auto');

    setQueueCount(0);

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

    const lockKey = `${roomId}-${messageContent}-${Date.now()}`;

    // ⭐ 第一步：檢查全局鎖
    if (globalSendingLock.get(lockKey)) {
      console.warn('⚠️ [發送] 全局鎖：正在發送中，忽略重複請求');
      return;
    }

    // ⭐ 第二步：立即加全局鎖
    globalSendingLock.set(lockKey, true);
    isSendingRef.current = true;
    setIsSending(true);
    console.log('🔒 [發送] 已加全局鎖，鎖鍵:', lockKey);

    // ⭐ 立即顯示用戶訊息
    const tempMessageId = generateUUID();
    const tempClientMsgId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // OPTIMISTIC ATTACHMENTS FOR UI
    // Note: We use 'selectedImages' (original) for UI
    const optimisticAttachments = selectedImages.map(file => ({
      type: 'image',
      url: URL.createObjectURL(file),
      name: file.name,
      contentType: file.type
    }));

    // Clear input immediately
    setInputMessage('');
    setSelectedImages([]);

    const userMessage: Message = {
      id: tempMessageId,
      content: messageContent,
      sender: 'user',
      timestamp: new Date(),
      type: 'text' as const,
      status: 'processing',
      attachments: optimisticAttachments.length > 0 ? optimisticAttachments : undefined
    };

    // 立即添加到 UI
    setMessages(prev => {
      const newMessages = [...prev, userMessage];
      console.log('📨 [即時] 立即添加用戶訊息到 UI:', userMessage);
      return newMessages;
    });

    // ⭐ 將臨時訊息 ID 添加到全局追蹤，防止重複
    processedMessageIds.current.add(tempMessageId);
    console.log('📨 [即時] 已添加臨時訊息 ID 到全局追蹤:', tempMessageId);

    // 清空輸入框和圖片
    setInputMessage('');
    setSelectedImages([]); // Clear images
    // Note: showImagePicker should be closed already
    setIsLoading(true);
    setIsTyping(true);

    // ⭐ 鎖定當前角色圖標（防止角色切換時圖標改變）
    if (roleHint && ['hibi', 'mori', 'pico'].includes(roleHint)) {
      setProcessingCompanion(roleHint as 'hibi' | 'mori' | 'pico');
      console.log(`🔒 [圖標鎖定] 鎖定角色圖標為: ${roleHint}`);
    }

    // ⭐ 在發送前再次查詢輪候人數（排除即將發送的訊息）
    // ⭐ 在發送前再次查詢輪候人數（排除即將發送的訊息）
    // FIXME: This hangs, disabling.
    /*
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
    */

    try {
      // === UPLOAD IMAGES IF ANY ===
      let realAttachments: any[] = [];
      if (selectedImages.length > 0) {
        console.log('📦 [Upload] Selected images count:', selectedImages.length);
        console.log('📦 [Upload] Files:', selectedImages.map(f => ({ name: f.name, size: f.size, type: f.type })));

        realAttachments = await uploadFilesToStorage(selectedImages, roomId);
        console.log('✅ [Upload] Images uploaded result:', JSON.stringify(realAttachments, null, 2));

        if (realAttachments.length === 0) {
          console.warn('⚠️ [Upload] Upload returned empty array despite selectedImages > 0. Check uploadFilesToStorage.');
        }

        // Update userMessage with real attachments (optional, but good for consistency)
        userMessage.attachments = realAttachments;
      } else {
        console.log('ℹ️ [Upload] No images selected.');
      }

      // === 使用 Edge Function 發送訊息 ===
      console.log('📦 [Edge] 開始發送訊息到 Edge Function...');

      // 1. 儲存用戶訊息到 Supabase (Client Side)
      // 1. 儲存用戶訊息到 Supabase (Client Side)
      const savedMessageId = await saveMessageToSupabase(userMessage, roomId);

      // Fallback to temp ID if save failed (e.g. timeout), so we can still call the API
      const effectiveMessageId = savedMessageId || tempMessageId;

      if (!savedMessageId) {
        console.warn('⚠️ [Edge] 無法儲存用戶訊息 (timeout?), 繼續嘗試調用 API...');
      }

      // ⭐ CRITICAL: Add saved ID to tracking to prevent Realtime from re-adding it
      // ⭐ CRITICAL: Add saved ID to tracking to prevent Realtime from re-adding it
      if (savedMessageId) {
        processedMessageIds.current.add(savedMessageId);
        console.log('📨 [Dedupe] Added savedMessageId to tracking:', savedMessageId);
      }

      // 更新 UI 中的訊息 ID
      // 更新 UI 中的訊息 ID
      setMessages(prev => {
        // Check if the saved message ID somehow already crept in via Realtime
        // CAUTION: If savedMessageId === tempMessageId, this will be true (finding the optimistic message itself)
        // We must distinguish between "found OTHER message with same ID" and "found THIS message"

        // Actually, if savedMessageId === tempMessageId, we just want to update it.
        // We ONLY want to filter if savedMessageId != tempMessageId AND savedMessageId exists in prev.

        const isIdChanged = savedMessageId && savedMessageId !== tempMessageId;
        const targetIdExists = isIdChanged ? prev.some(m => m.id === savedMessageId) : false;

        if (targetIdExists && savedMessageId) {
          console.log('🔄 [UI Update] Message already exists (via Realtime?). Removing temp message to avoid duplicate (IDs differ).');
          // Filter out the temp message, keeping the Realtime one.
          return prev.map(msg => {
            if (msg.id === savedMessageId && realAttachments.length > 0) {
              return { ...msg, attachments: realAttachments };
            }
            return msg;
          }).filter(msg => msg.id !== tempMessageId);
        }

        // If IDs are same, OR target ID not found yet: Update the temp message
        return prev.map(msg => {
          if (msg.id === tempMessageId) {
            console.log('🔄 [UI Update] Updating message status/ID:', { savedMessageId, tempMessageId });

            const finalId = savedMessageId || tempMessageId;
            return {
              ...msg,
              id: finalId,
              status: 'sent', // FORCE SENT STATUS
              // Force use of realAttachments if available, falling back to existing only if realAttachments is empty
              attachments: realAttachments.length > 0 ? realAttachments : msg.attachments
            };
          }
          return msg;
        });
      });

      // 更新全局追蹤
      processedMessageIds.current.delete(tempMessageId);
      if (savedMessageId) {
        processedMessageIds.current.add(savedMessageId);
      } else {
        processedMessageIds.current.add(effectiveMessageId);
      }

      // Check Session Before Invoke
      let sessionData = { session: null } as any;
      try {
        const sessionPromise = saasSupabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Auth Check Timeout')), 3000));
        const result = await Promise.race([sessionPromise, timeoutPromise]) as any;
        sessionData = result.data || { session: null };
      } catch (e) {
        console.warn('⚠️ [Edge] Auth check timed out. Proceeding regardless...');
      }

      const token = sessionData.session?.access_token;
      console.log(`🔑 [Edge] Invoke Token Check: ${token ? 'Present (' + token.substring(0, 10) + '...)' : 'MISSING'}`);

      if (!token) {
        console.warn('⚠️ [Edge] No Auth Token available (timeout?). Proceeding to invoke anyway...');
      }

      // 2. 呼叫 Edge Function
      // Resolve Model ID based on current roleHint
      let resolvedModelId: string | undefined = undefined;
      // Use roleHint or fallback to 'hibi' (though roleHint should be set if locked)
      const targetRole = roleHint || 'hibi';

      if (targetRole === 'hibi') {
        resolvedModelId = hibiSelectedModel !== DEFAULT_MODEL_SENTINEL ? hibiSelectedModel : undefined;
      } else if (targetRole === 'mori') {
        if (moriSelectedModelsMulti.length > 0) {
          resolvedModelId = moriSelectedModelsMulti.join(',');
        } else {
          resolvedModelId = moriSelectedModel !== DEFAULT_MODEL_SENTINEL ? moriSelectedModel : undefined;
        }
      } else if (targetRole === 'pico') {
        resolvedModelId = picoSelectedModel !== DEFAULT_MODEL_SENTINEL ? picoSelectedModel : undefined;
      }

      console.log(`📦 [Edge] Resolved Model ID for ${targetRole}:`, resolvedModelId);

      // 2. 呼叫 Edge Function
      const payload = {
        message: messageContent, // Server expects 'message', not 'messageContent'
        roomId,
        roleHint: targetRole,
        companionId: targetRole, // Server expects 'companionId' for role config
        modelId: resolvedModelId, // Pass the resolved model ID
        sessionId: currentSessionId, // Pass the current session ID for persistence
        userMessage,
        effectiveMessageId,
        attachments: realAttachments, // Pass real attachments
        userId: user?.id, // Pass userId for fallback auth
      };
      console.log('📦 [Edge Payload Debug] Full Payload:', JSON.stringify(payload));
      console.log('📦 [Edge Payload Debug] effectiveMessageId:', effectiveMessageId);

      console.log('📦 [Edge] 準備呼叫 Edge Function (Timeout: 5s)...');

      let data;
      try {
        const invokePromise = saasSupabase.functions.invoke('chat-processor', {
          body: payload
        });
        const invokeTimeoutPromise = new Promise((_, reject) =>
          setTimeout(() => {
            console.warn('⚠️ [Edge] Invoke Timeout Triggered (60s)');
            reject(new Error('Edge Function Invoke Timeout'));
          }, 60000)
        );

        const result = await Promise.race([invokePromise, invokeTimeoutPromise]) as any;
        if (result.error) throw result.error;
        if (!result.data) throw new Error('No data returned from invoke');
        data = result.data;
      } catch (invokeError) {
        console.warn('⚠️ [Edge] Invoke failed or timed out. Attempting direct fallback fetch...', invokeError);

        // Fallback: Direct Fetch
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_SAAS_URL || 'https://laowyqplcthwqckyigiy.supabase.co';
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_SAAS_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxhb3d5cXBsY3Rod3Fja3lpZ2l5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczMDE0MjYsImV4cCI6MjA3Mjg3NzQyNn0.LU37G9rZSBP5_BoAGQ_1QncFS2wemcI1w2J-wZzC-cI';

        try {
          const response = await fetch(`${supabaseUrl}/functions/v1/chat-processor`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token || supabaseAnonKey}`,
              'apikey': supabaseAnonKey
            },
            body: JSON.stringify(payload)
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Fallback fetch failed: ${response.status} ${errorText}`);
          }
          data = await response.json();
        } catch (fetchError) {
          console.error('❌ [Edge] Fallback fetch also failed:', fetchError);

          // Check if it was a timeout
          const isTimeout = (invokeError as any).message?.includes('Timeout') || (fetchError as any).message?.includes('Timeout');

          if (isTimeout) {
            console.warn('⚠️ [Edge] Both methods timed out. Assuming backend is still processing. suppressing UI error.');
            // Do NOT throw. Let the flow continue. 
            // We won't have 'data', so we can't process response manually.
            // But we rely on Realtime to arrive eventually.
            // Manually set status to 'sent' (or leave as processing) so user doesn't see error.
            // Actually, if we return here, we skip the 'data' processing block.

            const { default: toast } = await import('react-hot-toast');
            toast('生成時間較長，請稍候...', {
              icon: '⏳',
              duration: 4000
            });
            return;
          }

          // Throw a combined error message with both errors
          throw new Error(`Both Invoke and Fallback failed. Invoke: ${invokeError}, Fallback: ${fetchError}`);
        }
      }

      // 3. 處理回應 (從 callChatProcessor 邏輯恢復)
      // Check if data exists (it might be undefined if we handled timeout above by returning, but here we only return if we want to skip processing)
      // Wait, if I return above, I exit handleSendMessage. Yes.
      // So I need to ensure 'finally' block runs. 'return' inside try/catch DOES run finally.

      console.log('✅ Edge Function 回應:', JSON.stringify(data, null, 2));

      if (data && data.success && data.content) {
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

        console.log('✅ [Edge] 準備添加 AI 訊息到 UI:', aiMessage);

        // 更新全局追蹤，防止 Realtime 重複添加
        if (aiMessage.id) {
          processedMessageIds.current.add(aiMessage.id);
          console.log('✅ [Edge] 已添加訊息 ID 到全局追蹤:', aiMessage.id);
        }

        setMessages(prev => {
          // Double check if message already exists (by ID) to avoid duplicates
          if (prev.some(m => m.id === aiMessage.id)) {
            console.log('ℹ️ [UI Update] AI Message already exists (via Realtime?). Skipping manual add.');
            return prev;
          }
          console.log('✅ [Edge] setMessages 被呼叫，當前訊息數:', prev.length);
          return [...prev, aiMessage];
        });

        console.log('✅ [Edge] 訊息處理完成');
      } else {
        if (data.error === 'INSUFFICIENT_BALANCE') {
          throw new Error('INSUFFICIENT_BALANCE');
        }
        throw new Error(data.error || 'Unknown error from chat-processor: No content returned');
      }

    } catch (error: any) {
      console.error('❌ [Edge] 發送失敗:', error);
      // Log the full error object structure
      if (typeof error === 'object' && error !== null) {
        console.error('❌ [Edge] Error Details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      }

      const { default: toast } = await import('react-hot-toast');

      if (error.message === 'INSUFFICIENT_BALANCE' || error.message?.includes('Insufficient food balance')) {
        toast.error('食量不足，無法傳送訊息。請前往「個人檔案」查看餘額或儲值。', {
          duration: 5000,
          icon: '🍽️'
        });
      } else {
        toast.error('發送失敗，請稍後再試');
      }

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
  // Shared Logic for Desktop and Mobile Input
  const selectedCompanionId = selectedCompanion || activeRoles[0];
  const currentCompanion = companions.find(c => c.id === selectedCompanionId);
  const currentRoleId = currentCompanion?.id;

  // Helper to update room config and notify
  const handleUpdateRoomConfig = async (updates: any) => {
    console.trace('Who called handleUpdateRoomConfig? Updates:', updates);
    const newConfig = { ...room?.config, ...updates };

    // 1. Optimistic Update (Immediate UI Feedback)
    const prevRoom = room;
    console.log('⚡ [Optimistic] Updating local state immediately:', newConfig);
    setRoom((prev: any) => ({ ...prev, config: newConfig }));

    try {
      console.log('🔄 [RoomConfig] Syncing to backend (API):', updates);

      const response = await fetch('/api/chat/update-room-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          config: updates // API will merge this into settings
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Update API failed');
      }

      console.log('✅ [RoomConfig] API sync successful');
      const { default: toast } = await import('react-hot-toast');
      toast.success('設定已更新');

    } catch (err) {
      console.error('Failed to update room settings, reverting:', err);
      // Revert on failure
      setRoom(prevRoom);
      const { default: toast } = await import('react-hot-toast');
      toast.error('設定更新失敗');
    }
  };


  // 根據能力過濾模型 - 針對語音輸入 (Audio)
  const getFilteredAudioModels = () => {
    return availableModels.filter((m: any) => {
      const id = m.model_id.toLowerCase();
      // Check capabilities
      if (m.capabilities?.includes('audio_input')) return true;

      // Fallback checks for known audio models by ID
      if (id.includes('gpt-4o') && id.includes('audio')) return true;
      if (id.includes('gemini') && (id.includes('flash') || id.includes('pro') || id.includes('1.5') || id.includes('2.0'))) return true;

      return false;
    });
  };

  // 根據能力過濾模型 - 針對影像輸入 (Vision/OCR)
  const getFilteredVisionModels = () => {
    return availableModels.filter((m: any) => {
      const id = m.model_id.toLowerCase();
      // Check capabilities
      if (m.capabilities?.includes('image_input') || m.capabilities?.includes('vision')) return true;

      // Fallback checks
      if (id.includes('gpt-4o')) return true;
      if (id.includes('claude-3')) return true;
      if (id.includes('gemini') && (id.includes('flash') || id.includes('pro') || id.includes('1.5') || id.includes('2.0'))) return true;

      return false;
    });
  };

  const [modelSelectorExpanded, setModelSelectorExpanded] = useState(false);

  function getRoleModelState() {
    if (modelSelectorMode === 'audio' && roomModelSelectOpen) {
      return {
        expanded: modelSelectorExpanded,
        setExpanded: setModelSelectorExpanded,
        modelSelectOpen: roomModelSelectOpen,
        setModelSelectOpen: setRoomModelSelectOpen,
        selectedModel: room?.config?.audio_model || DEFAULT_MODEL_SENTINEL,
        setSelectedModel: (m: string) => handleUpdateRoomConfig({ audio_model: m === DEFAULT_MODEL_SENTINEL ? null : m }),
        roleDefaultModel: null,
        modelSearch: '',
        setModelSearch: () => { },
        showAllModels: true,
        setShowAllModels: () => { },
        loading: false,
        saveFunction: (m: any) => handleUpdateRoomConfig({ audio_model: m === DEFAULT_MODEL_SENTINEL ? null : m }),
        getFilteredModels: getFilteredAudioModels,
        selectedModelsMulti: undefined,
        setSelectedModelsMulti: undefined
      };
    }
    if (modelSelectorMode === 'vision' && roomModelSelectOpen) {
      return {
        expanded: modelSelectorExpanded,
        setExpanded: setModelSelectorExpanded,
        modelSelectOpen: roomModelSelectOpen,
        setModelSelectOpen: setRoomModelSelectOpen,
        selectedModel: room?.config?.vision_model || DEFAULT_MODEL_SENTINEL,
        setSelectedModel: (m: string) => handleUpdateRoomConfig({ vision_model: m === DEFAULT_MODEL_SENTINEL ? null : m }),
        roleDefaultModel: null,
        modelSearch: '',
        setModelSearch: () => { },
        showAllModels: true,
        setShowAllModels: () => { },
        loading: false,
        saveFunction: (m: any) => handleUpdateRoomConfig({ vision_model: m === DEFAULT_MODEL_SENTINEL ? null : m }),
        getFilteredModels: getFilteredVisionModels,
        selectedModelsMulti: undefined,
        setSelectedModelsMulti: undefined
      };
    }

    if (currentRoleId === 'pico') {
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
    } else if (currentRoleId === 'mori') {
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
  const dropdownDataAttr = currentRoleId === 'pico' ? 'data-pico-model-dropdown' : currentRoleId === 'mori' ? 'data-mori-model-dropdown' : 'data-hibi-model-dropdown';

  // 重新定義需要的變數和邏輯
  const instanceForCompanion = selectedCompanionId && roleInstancesMap[selectedCompanionId]
    ? roleInstancesMap[selectedCompanionId]
    : Object.values(roleInstancesMap)[0];

  const equippedBlocks = instanceForCompanion?.settings?.equipped_blocks || {};
  const mindTitle = (() => {
    const blocks = [];
    if (equippedBlocks.role) blocks.push(equippedBlocks.role.title);
    if (equippedBlocks.style) blocks.push(equippedBlocks.style.title);
    if (equippedBlocks.task) blocks.push(equippedBlocks.task.title);
    if (blocks.length === 0) return '未裝備';
    return blocks[0] + (blocks.length > 1 ? ` +${blocks.length - 1}` : '');
  })();

  // 計算模型顯示名稱
  const effectiveModelId = modelState.selectedModel === DEFAULT_MODEL_SENTINEL ? modelState.roleDefaultModel : modelState.selectedModel;
  const selectedModelData = modelState.getFilteredModels?.().find((m: any) => m.model_id === effectiveModelId) || availableModels.find((m: any) => m.model_id === effectiveModelId);

  // stripFree is defined earlier in the file (global helper)
  const modelName = selectedModelData ? stripFree(selectedModelData.display_name || effectiveModelId) : '選擇模型';

  // Define variables for UI
  console.log('Rendering Room Page'); // Debug fix
  const roleId = currentRoleId || 'pico';
  const companion = currentCompanion || { name: 'Loading', id: 'loading', imagePath: '', color: 'from-gray-200 to-gray-300' };

  return (
    <div data-fixed="true" className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#F8F5EC]">
      {/* 頂部導航欄 */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-[#EADBC8] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">

              {/* 選單按鈕 */}
              <motion.button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg hover:bg-[#FFD59A]/20 transition-colors"
              >
                <Bars3Icon className="w-6 h-6 text-[#4B4036]" />
              </motion.button>

              {/* Logo */}
              <div className="w-8 h-8 sm:w-10 sm:h-10 relative flex-shrink-0">
                <Image
                  src="/@hanami.png"
                  alt="HanamiEcho Logo"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* 活躍角色頭像堆疊 - 點擊打開團隊選單 */}
              <motion.div
                onClick={() => setShowInviteModal(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex -space-x-2 cursor-pointer relative group"
                title="點擊管理團隊成員"
              >
                {activeRoles.map((companionId) => {
                  const companion = companions.find(c => c.id === companionId);
                  return (
                    <motion.div
                      key={companionId}
                      whileHover={{ y: -2, zIndex: 10 }}
                      className="relative"
                    >
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${companion?.color} p-0.5 ring-2 ring-white transition-all group-hover:ring-[#FFD59A]`}>
                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                          {companion?.imagePath ? (
                            <Image
                              src={companion.imagePath}
                              alt={companion.name}
                              width={28}
                              height={28}
                              className="w-7 h-7 object-cover"
                              unoptimized={companion.imagePath.includes('(') || companion.imagePath.includes(')')}
                            />
                          ) : (
                            <div className="w-7 h-7 flex items-center justify-center">
                              {companion?.icon && <companion.icon className="w-4 h-4 text-gray-400" />}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>



            {/* 右側操作區 */}
            <div className="flex items-center space-x-2">
              {/* Mobile Reload Button - 解決連線問題 */}
              <motion.button
                onClick={() => window.location.reload()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg hover:bg-[#FFD59A]/20 transition-colors text-[#4B4036] relative"
                title="重新載入連線"
              >
                <ArrowPathIcon className="w-6 h-6" />
                <ConnectionHint
                  isVisible={showHint}
                  onDismiss={handleDismissHint}
                  className="absolute top-10 -right-4 z-50 flex items-start cursor-pointer group w-[300px] justify-end"
                />
              </motion.button>

              <FoodBalanceButton />
              {/* 統一的下拉菜單 (桌面 + 移動端) */}
              <div className="flex items-center space-x-2 relative">
                <UnifiedRightContent
                  user={user}
                  onLogout={handleLogout}
                  extraMenuItems={[
                    {
                      name: '聊天室設定',
                      onClick: () => setShowSettingsPanel(true),
                      icon: <AdjustmentsHorizontalIcon className="w-4 h-4" />
                    }
                  ]}
                />
              </div>
            </div>
          </div>
        </div>
      </nav >

      {/* 側邊欄與主內容 */}
      < div className="flex h-[calc(100vh-64px)] overflow-hidden" >

        <AppSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentPath="/aihome/ai-companions"
        />

        {/* 聊天區域 */}
        <div className="flex-1 flex flex-col relative w-full">
          {/* 訊息列表 */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 pb-64 lg:pb-40 no-scrollbar"
            onScroll={handleMessagesScroll}
          >
            {messages.map((message, index) => (
              <MessageBubble
                key={message.id || index}
                message={message}
                companion={getCompanionInfo(message.sender as any)}
                onDelete={handleDeleteMessage}
                availableModels={availableModels}
              />
            ))}

            {/* ⭐ Ghost Message (Typing Indicator) - 解決 "Thinking..." UI 缺失問題 */}
            {(isLoading || isTyping) && (() => {
              const targetId = processingCompanion || selectedCompanion || activeRoles[0];
              const info = getCompanionInfo(targetId as any);
              if (!info) return null;

              return (
                <div className="flex justify-start pt-2">
                  <div className="flex flex-row items-end space-x-3 max-w-[95%] sm:max-w-[90%] md:max-w-[82%] xl:max-w-[70%]">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${info.color} p-0.5`}>
                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                          <Image
                            src={info.imagePath}
                            alt={info.name}
                            width={28}
                            height={28}
                            className="w-7 h-7 object-cover opacity-80"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="ml-3">
                      <div className="px-5 py-3 rounded-2xl shadow-sm bg-white/80 backdrop-blur-sm border border-[#EADBC8] text-[#4B4036] rounded-bl-md flex items-center space-x-3">
                        {/* Custom Animated SVG Cloud - Dynamic & Hanami Style */}
                        <div className="relative w-12 h-10 flex items-center justify-center -ml-1">
                          {/* Main Cloud */}
                          <motion.svg
                            width="100%" height="100%" viewBox="0 0 100 100"
                            animate={{ y: [-3, 3, -3] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            className="overflow-visible"
                          >
                            <defs>
                              <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#FFD59A" /> {/* Hanami Warm Orange */}
                                <stop offset="100%" stopColor="#FFB6C1" /> {/* Hanami Soft Pink */}
                              </linearGradient>
                              {/* Soft Shadow Filter */}
                              <filter id="cloudShadow" x="-50%" y="-50%" width="200%" height="200%">
                                <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#FFB6C1" floodOpacity="0.4" />
                              </filter>
                            </defs>

                            {/* Cloud Shape Group */}
                            <g filter="url(#cloudShadow)">
                              {/* Central Mass - Breathing */}
                              <motion.circle cx="50" cy="50" r="28" fill="url(#cloudGrad)" animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2.5, repeat: Infinity }} />

                              {/* Surrounding Puffs - Random floating */}
                              <motion.circle cx="25" cy="55" r="18" fill="url(#cloudGrad)" animate={{ x: [-1, 1, -1] }} transition={{ duration: 2, repeat: Infinity }} />
                              <motion.circle cx="75" cy="55" r="18" fill="url(#cloudGrad)" animate={{ x: [1, -1, 1] }} transition={{ duration: 2.2, repeat: Infinity }} />
                              <motion.circle cx="35" cy="35" r="20" fill="url(#cloudGrad)" animate={{ y: [-1, 1, -1] }} transition={{ duration: 1.8, repeat: Infinity }} />
                              <motion.circle cx="65" cy="35" r="20" fill="url(#cloudGrad)" animate={{ y: [1, -1, 1] }} transition={{ duration: 2.1, repeat: Infinity }} />
                            </g>

                            {/* Cute Face */}
                            <g transform="translate(0, 5)">
                              {/* Eyes */}
                              <circle cx="40" cy="52" r="2.5" fill="#4B4036" />
                              <circle cx="60" cy="52" r="2.5" fill="#4B4036" />
                              {/* Smile */}
                              <path d="M 46 58 Q 50 62 54 58" stroke="#4B4036" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.8" />
                              {/* Cheeks - White for contrast on warm cloud */}
                              <circle cx="34" cy="56" r="3" fill="#FFFFFF" opacity="0.6" />
                              <circle cx="66" cy="56" r="3" fill="#FFFFFF" opacity="0.6" />
                            </g>
                          </motion.svg>

                          {/* Mini particles */}
                          <motion.div
                            className="absolute top-0 right-0 w-1.5 h-1.5 bg-[#FFD59A] rounded-full"
                            animate={{ y: [-10, -20], opacity: [0, 1, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                          />
                          <motion.div
                            className="absolute bottom-1 -left-1 w-1 h-1 bg-[#FFB6C1] rounded-full"
                            animate={{ scale: [0, 1.5, 0] }}
                            transition={{ duration: 2, repeat: Infinity, delay: 1.2 }}
                          />
                        </div>

                        {/* Thinking Text with Character Name */}
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-[#FF9BB3] mb-0.5">{info.name}</span>
                          <span className="text-xs text-[#2B3A3B]/70 tracking-wider">正在思考中...</span>
                        </div>

                        {/* Subtle Loading Dots */}
                        <div className="flex space-x-1 items-center mt-1">
                          <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0 }} className="w-1 h-1 bg-[#FFB6C1] rounded-full" />
                          <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }} className="w-1 h-1 bg-[#FFB6C1] rounded-full" />
                          <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }} className="w-1 h-1 bg-[#FFB6C1] rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
            <div ref={messagesEndRef} />
          </div>

          {/* Unified Input Portal (Replaces Desktop Input) */}
          {(() => {
            const companion = companions.find(c => c.id === (selectedCompanion || activeRoles[0]));
            if (!companion) return null;

            const roleId = companion.id;

            // Helper to check if model options are expanded
            const isPico = roleId === 'pico';

            return (
              <div className="w-full max-w-4xl mx-auto">
                {mounted && createPortal(
                  <div className="fixed bottom-20 lg:bottom-6 left-0 right-0 z-[60] flex flex-col items-start lg:items-center gap-0 bg-gradient-to-t from-[#FFFDF8] via-[#FFFDF8] to-transparent px-2 sm:px-4 pb-2 pt-4 pointer-events-none">
                    <div className="w-full max-w-4xl mx-auto flex flex-col gap-0">
                      {/* 1. Chips Row */}
                      <div className="w-full px-2 pb-2 flex items-center gap-2 overflow-x-auto no-scrollbar pointer-events-auto">
                        {/* Role Indicator */}
                        <button
                          onClick={() => setRoleSelectorOpen(true)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-white/50 backdrop-blur-sm transition-all hover:bg-white/80 active:scale-95 flex-shrink-0 ${roleId === 'hibi' ? 'border-purple-200 text-purple-700' :
                            roleId === 'mori' ? 'border-amber-200 text-amber-700' :
                              'border-pink-200 text-pink-700'
                            }`}
                        >
                          <div className="w-4 h-4 rounded-full overflow-hidden">
                            {companion.imagePath ? (
                              <img src={companion.imagePath} alt={companion.name} className="w-full h-full object-cover" />
                            ) : (
                              <companion.icon className="w-full h-full" />
                            )}
                          </div>
                          <span className="text-xs font-bold">{companion.name}</span>
                          <svg className="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {/* Model Selector Chip - Styled by Tier */}
                        {(() => {
                          // Resolve Model and Level for Styling
                          let mId = '';
                          if (roleId === 'pico') {
                            mId = picoSelectedModel;
                          } else if (roleId === 'mori') {
                            mId = (moriSelectedModelsMulti && moriSelectedModelsMulti.length > 0) ? moriSelectedModelsMulti[0] : moriSelectedModel;
                          } else {
                            mId = hibiSelectedModel;
                          }

                          if (!mId) mId = '';

                          const m = availableModels.find((x: any) => x.model_id === mId);

                          // Default Level Logic
                          let level = m?.metadata?.level;
                          if (!level) {
                            if (mId.includes('flash') || mId.includes('turbo')) level = 'L1';
                            else if (mId.includes('standard')) level = 'L2';
                            else level = 'L3'; // Default to L3 if unknown
                          }

                          // Force Family Name Resolution
                          const FAMILY_MAP: Record<string, string> = {
                            'chatgpt': 'ChatGPT',
                            'gemini': 'Gemini',
                            'claude': 'Claude',
                            'grok': 'Grok',
                            'deepseek': 'DeepSeek',
                            'qwen': 'Qwen',
                            'flux': 'Flux',
                            'openai': 'ChatGPT',
                            'google': 'Gemini',
                            'anthropic': 'Claude',
                            'xai': 'Grok',
                            'alibaba': 'Qwen'
                          };

                          let displayLabel = "";

                          if (roleId === 'pico') {
                            // --- Pico Specific: Show Full Name (Cleaned) ---
                            let label = m?.display_name || mId.split('/').pop() || 'Unknown';
                            label = label.replace(/^(Google|OpenAI|Anthropic|DeepSeek|xAI|Flux)\s+/i, '');
                            label = label.replace(/\s+Model$/i, '');
                            label = label.replace(/Gemini 2.5 Flash Image Preview/i, 'Flash Image');
                            label = label.replace(/Gemini 2.5 Flash Image/i, 'Flash Image');
                            displayLabel = label;

                            // Pico uses specific tier logic matching the modal
                            const lowerId = mId.toLowerCase();
                            if (lowerId.includes('flux')) {
                              level = 'L2';
                            } else if (lowerId.includes('flash') && lowerId.includes('image')) {
                              level = 'L2';
                            } else if (lowerId.includes('gpt-5') && lowerId.includes('image') && lowerId.includes('mini')) {
                              level = 'L2';
                            } else if (lowerId.includes('flash') || lowerId.includes('mini')) {
                              level = 'L1';
                            } else {
                              level = 'L3';
                            }

                          } else {
                            // --- Standard Logic for Hibi/Mori ---
                            const familyKey = m?.metadata?.family?.toLowerCase() || m?.provider?.toLowerCase();
                            let displayName = (familyKey && FAMILY_MAP[familyKey]);

                            if (!displayName) {
                              // Try to guess from ID if metadata missing
                              if (mId.includes('gpt')) displayName = 'ChatGPT';
                              else if (mId.includes('gemini')) displayName = 'Gemini';
                              else if (mId.includes('claude')) displayName = 'Claude';
                              else if (mId.includes('grok')) displayName = 'Grok';
                              else displayName = m?.display_name || 'Model';
                            }
                            displayLabel = `${displayName} ${level}`;
                          }

                          const isMulti = roleId === 'mori';

                          // Dynamic Styles based on Level
                          // L1: Cool Gray Brighter (Ref: #FAFAFA bg, #727272 text)
                          let btnClasses = "border border-gray-100 bg-[#FAFAFA] text-[#727272] hover:bg-[#F5F5F5]";
                          let iconColor = "text-[#727272]";

                          if (level === 'L2') {
                            // L2: Butter Brighter (Ref: #FDF3C8 bg)
                            btnClasses = "border border-[#FDF3C8] bg-[#FDF3C8] text-[#5D4037] hover:bg-[#F9ECC8]";
                            iconColor = "text-[#5D4037]";
                          } else if (level === 'L3') {
                            btnClasses = "border border-[#4B4036] bg-[#4B4036] text-[#FFD59A] hover:bg-[#2C241B]";
                            iconColor = "text-[#FFD59A]";
                          }

                          return (
                            <button
                              onClick={() => {
                                modelState.setModelSelectOpen(true);
                                if (modelState.setModelSearch) modelState.setModelSearch('');
                              }}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-sm transition-all active:scale-95 flex-shrink-0 ${btnClasses}`}
                            >
                              <CpuChipIcon className={`w-3.5 h-3.5 ${iconColor}`} />
                              <span className="text-xs font-bold max-w-[140px] truncate">
                                {isMulti ? (() => {
                                  const isDefaults = modelState.selectedModel === DEFAULT_MODEL_SENTINEL;
                                  const list = isDefaults
                                    ? (modelState.roleDefaultModel?.split(',') || [])
                                    : (modelState.selectedModelsMulti || []);
                                  const count = list.filter((s: string) => s.trim()).length || 1;
                                  return `已選 ${count} 個模型`;
                                })() : (
                                  displayLabel
                                )}
                              </span>
                            </button>
                          );
                        })()}

                        {/* Mind Blocks Chip */}
                        <button
                          onClick={async () => {
                            if (!instanceForCompanion) {
                              const { default: toast } = await import('react-hot-toast');
                              toast.error(`無法開啟積木：找不到 ${selectedCompanionId} 的角色實例`);
                              return;
                            }
                            const event = new CustomEvent('open-block-selector', {
                              detail: { type: 'role', roleInstanceId: instanceForCompanion.id }
                            });
                            window.dispatchEvent(event);
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#EADBC8] bg-white/50 hover:bg-[#FFF9F2] backdrop-blur-sm transition-all active:scale-95 flex-shrink-0 ${mindTitle !== '未裝備' ? 'border-[#FFB6C1] bg-[#FFF0F5]' : ''
                            }`}
                        >
                          <PuzzlePieceIcon className={`w-3.5 h-3.5 ${mindTitle !== '未裝備' ? 'text-pink-500' : 'text-gray-400'}`} />
                          <span className={`text-xs font-medium max-w-[100px] truncate ${mindTitle !== '未裝備' ? 'text-pink-700' : 'text-[#4B4036]/70'}`}>
                            {mindTitle !== '未裝備' ? mindTitle : '思維積木'}
                          </span>
                        </button>
                      </div>

                      {/* Input Area */}
                      <div className="w-full relative flex items-end gap-2 bg-white/80 backdrop-blur-md border border-[#EADBC8] p-1.5 rounded-[24px] shadow-sm transition-all duration-300 focus-within:ring-2 focus-within:ring-[#FFB6C1]/50 focus-within:border-[#FFB6C1] focus-within:shadow-md pointer-events-auto">


                        <AnimatePresence mode="wait">
                          {isRecording ? (
                            <motion.div
                              key="recording-ui"
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="flex-1 flex items-center justify-between bg-[#FFF9F2] rounded-[20px] px-2 py-1.5 min-h-[44px]"
                            >
                              {/* Cancel */}
                              <button
                                onClick={handleCancelRecording}
                                className="p-2 text-red-400 hover:bg-red-50 rounded-full transition-colors active:scale-90"
                                title="取消錄音"
                              >
                                <TrashIcon className="w-5 h-5" />
                              </button>

                              {/* Waveform & Timer */}
                              <div className="flex items-center gap-4 flex-1 justify-center overflow-hidden">
                                <div className="flex items-center gap-1 h-5">
                                  {[...Array(8)].map((_, i) => (
                                    <motion.div
                                      key={i}
                                      animate={{ height: [6, 16 + Math.random() * 10, 6] }}
                                      transition={{ duration: 0.4 + Math.random() * 0.2, repeat: Infinity, ease: "easeInOut" }}
                                      className="w-1 bg-gradient-to-t from-[#FFD59A] to-[#FFB6C1] rounded-full"
                                    />
                                  ))}
                                </div>
                                <span className="text-sm font-bold text-[#FFB6C1] font-mono min-w-[3rem]">
                                  {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                                </span>
                              </div>

                              {/* Stop & Send */}
                              <button
                                onClick={() => handleStopRecording(true)}
                                className="p-2 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white rounded-full shadow-md hover:shadow-lg transition-all active:scale-95 transform hover:-translate-y-0.5"
                                title="發送語音"
                              >
                                <PaperAirplaneIcon className="w-5 h-5" />
                              </button>
                            </motion.div>
                          ) : (
                            <>
                              {/* Attach Button */}
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="p-2.5 text-[#4B4036]/60 hover:text-[#4B4036] hover:bg-[#F8F5EC] rounded-full transition-colors hidden sm:block"
                                title="添加圖片"
                                onClick={() => {
                                  console.log('📸 [Click] Image Button Clicked');
                                  if (checkModelImageSupport()) {
                                    console.log('📸 [Click] Support TRUE');
                                    setShowImagePicker(true);
                                  } else {
                                    console.log('📸 [Click] Support FALSE');
                                    const { default: toast } = require('react-hot-toast');
                                    toast.error('當前模型不支援圖片輸入');
                                  }
                                }}
                              >
                                <PhotoIcon className="w-6 h-6" />
                              </motion.button>
                              {/* Mobile Attach Button */}
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                className="p-2 text-[#4B4036]/60 hover:text-[#4B4036] rounded-full sm:hidden"
                                onClick={() => {
                                  if (checkModelImageSupport()) {
                                    setShowImagePicker(true);
                                  } else {
                                    const { default: toast } = require('react-hot-toast');
                                    toast.error('當前模型不支援圖片輸入');
                                  }
                                }}
                              >
                                <PlusIcon className="w-6 h-6" />
                              </motion.button>

                              {/* Selected Images Preview */}
                              {selectedImages.length > 0 && (
                                <div className="flex gap-2 p-2 overflow-x-auto my-2">
                                  {selectedImages.map((file, index) => (
                                    <div key={index} className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border border-[#EADBC8] group">
                                      <img
                                        src={URL.createObjectURL(file)}
                                        alt={`preview-${index}`}
                                        className="w-full h-full object-cover"
                                      />
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRemoveImage(index);
                                        }}
                                        className="absolute top-1 right-1 bg-white/90 text-red-500 rounded-full p-1 shadow-md hover:bg-white transition-all transform hover:scale-110"
                                      >
                                        <XMarkIcon className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Text Input */}
                              <textarea
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder={
                                  activeRoles.length === 1
                                    ? `與 ${companion.name} 對話...`
                                    : '輸入訊息...'
                                }
                                className="flex-1 max-h-32 min-h-[44px] py-2.5 px-2 bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus:border-transparent text-[#4B4036] placeholder-[#2B3A3B]/40 resize-none text-base leading-relaxed"
                                rows={1}
                                style={{ height: 'auto', minHeight: '44px' }}
                                onInput={(e) => {
                                  const target = e.target as HTMLTextAreaElement;
                                  target.style.height = 'auto';
                                  target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
                                }}
                              />

                              {/* Voice Record Button (Shown when empty) */}
                              {!inputMessage.trim() && selectedImages.length === 0 && (
                                <motion.button
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  exit={{ scale: 0 }}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={handleStartRecording}
                                  className="p-2.5 text-[#4B4036]/60 hover:text-[#4B4036] hover:bg-[#F8F5EC] rounded-full transition-colors"
                                  title="錄製語音"
                                >
                                  <MicrophoneIcon className="w-6 h-6" />
                                </motion.button>
                              )}

                              {/* Send Button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  console.log('👆 [SendButton] Click triggered');
                                  handleSendMessage();
                                }}
                                onMouseDown={(e) => {
                                  // Prevent focus loss only
                                  e.preventDefault();
                                }}
                                disabled={(!inputMessage.trim() && selectedImages.length === 0) || isLoading || isTyping || isSending || !user}
                                className={`relative z-50 p-2.5 rounded-full shadow-md flex-shrink-0 transition-all duration-300 ${(inputMessage.trim() || selectedImages.length > 0) && !isLoading && !isSending && user
                                  ? 'bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white shadow-[#FFB6C1]/30 cursor-pointer pointer-events-auto'
                                  : 'bg-[#F0EAE0] text-[#4B4036]/30 shadow-none cursor-not-allowed'
                                  }`}
                              >
                                {isLoading || isTyping ? (
                                  <ClockIcon className="w-5 h-5 animate-spin" />
                                ) : (
                                  <PaperAirplaneIcon className="w-5 h-5 translate-x-0.5 -translate-y-0.5" />
                                )}
                              </button>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>,
                  document.body as HTMLElement
                )
                }

                {typeof document !== 'undefined' && modelState.modelSelectOpen && createPortal(
                  <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                      className="absolute inset-0 bg-black/20 backdrop-blur-sm z-[10]"
                      onClick={() => modelState.setModelSelectOpen(false)}
                    />

                    {/* Modal Container */}
                    <div
                      className="relative z-[20] bg-white rounded-xl shadow-xl border border-orange-100 flex flex-col w-[90vw] max-w-[320px] max-h-[80vh] lg:w-[320px] lg:max-h-[400px]"
                      style={{ pointerEvents: 'auto' }}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between px-5 py-4 border-b border-[#EADBC8] bg-gradient-to-r from-[#FFB6C1]/10 to-[#FFD59A]/10">
                        <div className="flex items-center gap-3">
                          <CpuChipIcon className={`w-6 h-6 ${roleId === 'pico' ? 'text-[#FFB6C1]' : roleId === 'mori' ? 'text-amber-500' : 'text-orange-500'}`} />
                          <h3 className="text-lg font-semibold text-[#4B4036]">
                            {modelSelectorMode === 'audio' ? '選擇語音助理模型' :
                              modelSelectorMode === 'vision' ? '選擇 OCR 圖片識別模型' :
                                roleId === 'mori' ? `選擇 ${companion.name} 的模型組合` : `選擇 ${companion.name} 的大腦`}
                          </h3>
                        </div>
                        <button onClick={() => modelState.setModelSelectOpen(false)} className="p-2 hover:bg-black/5 rounded-full"><XMarkIcon className="w-5 h-5" /></button>
                      </div>

                      {/* Model List - Family Based (Warm & Soft Design) */}
                      <div className="overflow-y-auto flex-1 p-4 space-y-5 relative z-30" style={{ pointerEvents: 'auto' }}>

                        {/* System Default Option - Hero Card Style */}
                        <button
                          onMouseDown={() => {
                            if (roleId === 'mori' && modelState.setSelectedModelsMulti && modelSelectorMode === 'role') {
                              modelState.setSelectedModelsMulti([]);
                              modelState.setSelectedModel(DEFAULT_MODEL_SENTINEL);
                              modelState.saveFunction([]);
                            } else {
                              modelState.setSelectedModel(DEFAULT_MODEL_SENTINEL);
                              modelState.saveFunction(DEFAULT_MODEL_SENTINEL);
                              modelState.setModelSelectOpen(false);
                            }
                          }}
                          className={`group w-full text-left px-6 py-5 rounded-3xl transition-all duration-300 relative overflow-hidden ${modelState.selectedModel === DEFAULT_MODEL_SENTINEL
                            ? 'bg-gradient-to-r from-[#FFD8B1] to-[#FFB6C1] text-white shadow-lg shadow-orange-100 scale-[1.02]'
                            : 'bg-white hover:bg-[#FFF9F0] text-[#5D4037] shadow-md hover:shadow-lg'
                            }`}
                        >
                          {/* Decorative background circle */}
                          <div className="absolute -right-5 -top-5 w-24 h-24 bg-white/20 rounded-full blur-2xl pointer-events-none" />
                          <div className="absolute -left-5 -bottom-5 w-20 h-20 bg-white/10 rounded-full blur-xl pointer-events-none" />

                          <div className="relative font-bold text-lg flex items-center justify-between z-10">
                            <span className="flex items-center gap-3">
                              <SparklesIcon className={`w-6 h-6 ${modelState.selectedModel === DEFAULT_MODEL_SENTINEL ? 'text-white' : 'text-[#FFB6C1]'}`} />
                              {modelSelectorMode === 'role' ? '角色推薦 (預設)' : '系統預設'}
                            </span>
                            {modelState.selectedModel === DEFAULT_MODEL_SENTINEL && (
                              <div className="bg-white/30 p-1.5 rounded-full backdrop-blur-sm">
                                <CheckIcon className="w-5 h-5 text-white" />
                              </div>
                            )}
                          </div>
                          <div className={`text-sm mt-2 font-medium ${modelState.selectedModel === DEFAULT_MODEL_SENTINEL ? 'text-white/90' : 'text-[#8D6E63]'}`}>
                            自動選擇最佳效能與成本平衡的模型
                          </div>
                        </button>

                        {/* Family Groups */}
                        {(() => {
                          const models = modelState.getFilteredModels?.() || [];

                          // DEBUG: Log models to check metadata
                          if (models.length > 0) {
                            console.log('[ModelSelector] Loaded models:', models.length);
                            console.log('[ModelSelector] Sample model metadata:', {
                              id: models[0].model_id,
                              provider: models[0].provider,
                              metadata: models[0].metadata
                            });
                          } else {
                            console.warn('[ModelSelector] No models loaded!');
                          }

                          // Display Name Mapping for Families
                          const FAMILY_DISPLAY_NAMES: Record<string, string> = {
                            'chatgpt': 'ChatGPT',
                            'gemini': 'Gemini',
                            'claude': 'Claude',
                            'grok': 'Grok',
                            'deepseek': 'Deepseek',
                            'qwen': 'Qwen',
                            'flux': 'Flux',
                            // Fallbacks for legacy/direct provider names
                            'openai': 'ChatGPT',
                            'google': 'Gemini',
                            'anthropic': 'Claude',
                            'xai': 'Grok',
                            'alibaba': 'Qwen',
                            'black forest labs': 'Flux'
                          };

                          const families: Record<string, any[]> = {};

                          models.forEach((m: any) => {
                            // Filter by search
                            if (modelState.modelSearch.trim() && !m.display_name?.toLowerCase().includes(modelState.modelSearch.toLowerCase())) {
                              return;
                            }

                            // Determine Family Key: Priority metadata.family -> provider
                            let familyKey = 'Other';

                            if (m.metadata?.family) {
                              familyKey = m.metadata.family.toLowerCase();
                            } else if (m.provider) {
                              familyKey = m.provider.toLowerCase();
                            }

                            // Normalize family keys
                            if (familyKey === 'google') familyKey = 'gemini';
                            if (familyKey === 'openai') familyKey = 'chatgpt';
                            if (familyKey === 'anthropic') familyKey = 'claude';
                            if (familyKey === 'xai') familyKey = 'grok';
                            if (familyKey === 'alibaba') familyKey = 'qwen';
                            if (familyKey === 'black forest labs') familyKey = 'flux';

                            // Initialize group if needed
                            if (!families[familyKey]) families[familyKey] = [];
                            // Dedup models by ID
                            if (!families[familyKey].some(exist => exist.model_id === m.model_id)) {
                              families[familyKey].push(m);
                            }
                          });

                          // 6 Main Families Order
                          const ALLOWED_FAMILIES = ['chatgpt', 'gemini', 'claude', 'grok', 'deepseek', 'qwen', 'flux'];

                          const sortedFamilies = ALLOWED_FAMILIES
                            .map(key => [key, families[key] || []])
                            .filter(([_, models]) => (models as any[]).length > 0) as [string, any[]][];

                          return sortedFamilies.map(([familyKey, familyModels]) => {
                            if (familyModels.length === 0) return null;

                            const displayName = FAMILY_DISPLAY_NAMES[familyKey] ||
                              // Capitalize first letter if not in map
                              familyKey.charAt(0).toUpperCase() + familyKey.slice(1);

                            // Sort models by cost (USD or HKD converted)
                            familyModels.sort((a, b) => {
                              const costA = a.input_cost_usd || (a.input_cost_hkd ? a.input_cost_hkd / 7.8 : 0);
                              const costB = b.input_cost_usd || (b.input_cost_hkd ? b.input_cost_hkd / 7.8 : 0);
                              return costA - costB;
                            });

                            // Identify Tiers: Smart Classification
                            let uniqueTiers: any[] = [];

                            const isMori = roleId === 'mori';
                            let isFamilyActive = false;

                            if (roleId === 'pico') {
                              // --- Pico Logic: Show specific models directly ---
                              familyModels.sort((a, b) => {
                                // Put Flash/Fast models first (usually preferred for quick gen)
                                const isAFlash = a.model_id.toLowerCase().includes('flash');
                                const isBFlash = b.model_id.toLowerCase().includes('flash');
                                if (isAFlash && !isBFlash) return -1;
                                if (!isAFlash && isBFlash) return 1;

                                // Then by cost
                                const costA = a.input_cost_usd || 0;
                                const costB = b.input_cost_usd || 0;
                                return costA - costB;
                              });

                              // Determine plan status for cost display
                              const isFreePlan = !user?.subscription_plan_id || user?.subscription_plan_id === 'free';

                              uniqueTiers = familyModels.map(m => {
                                // Clean up display name
                                let label = m.display_name || m.model_id.split('/').pop() || 'Unknown';
                                // Remove provider prefix to keep it short
                                label = label.replace(/^(Google|OpenAI|Anthropic|DeepSeek|xAI|Flux)\s+/i, '');
                                // Remove "Model" suffix
                                label = label.replace(/\s+Model$/i, '');
                                // Shorten specific names
                                label = label.replace(/Gemini 2.5 Flash Image Preview/i, 'Flash Image');
                                label = label.replace(/Gemini 2.5 Flash Image/i, 'Flash Image');

                                // Determine Level (L1/L2/L3)
                                let level = m.metadata?.level || 'L3'; // Default to L3 for image models if unknown

                                // Heuristics for typical image models if metadata missing or override needed
                                const lowerId = m.model_id.toLowerCase();

                                // Specific Overrides requested by User
                                if (lowerId.includes('flux')) {
                                  level = 'L2';
                                } else if (lowerId.includes('flash') && lowerId.includes('image')) {
                                  level = 'L2';
                                } else if (lowerId.includes('gpt-5') && lowerId.includes('image') && lowerId.includes('mini')) {
                                  level = 'L2';
                                } else if (!m.metadata?.level) {
                                  // Generic fallback heuristics
                                  if (lowerId.includes('pro') && !lowerId.includes('flux')) level = 'L3';
                                  else if (lowerId.includes('flash') || lowerId.includes('mini') || lowerId.includes('lite')) level = 'L1';
                                  else if (lowerId.includes('standard')) level = 'L2';
                                }

                                let costVal: string | number = 20; // Default L3 cost

                                if (m.is_free) {
                                  costVal = isFreePlan ? '免費' : '無限用';
                                } else {
                                  // Use tier-based pricing
                                  if (level === 'L1') costVal = isFreePlan ? 3 : '無限用';
                                  else if (level === 'L2') costVal = 4;
                                  else costVal = 20; // L3
                                }

                                return {
                                  label: label,
                                  model: m,
                                  desc: `${level}`, // Show just the level as requested: "L幾"
                                  costVal: costVal
                                };
                              });
                            } else {
                              // --- Mori/Hibi Logic: L1/L2/L3 Smart Hierarchies ---
                              let remainingModels = [...familyModels];
                              let l1Model: any = null;
                              let l2Model: any = null;
                              let l3Model: any = null;

                              // 1. Strict Metadata Matching First
                              l1Model = remainingModels.find(m => m.metadata?.level === 'L1');
                              if (l1Model) remainingModels = remainingModels.filter(m => m.model_id !== l1Model?.model_id);

                              if (!l1Model) {
                                l1Model = remainingModels.find(m => {
                                  const id = m.model_id.toLowerCase();
                                  return id.includes('mini') ||
                                    id.includes('flash') ||
                                    id.includes('haiku') ||
                                    id.includes('micro') ||
                                    id.includes('lite') ||
                                    id.includes('fast') ||
                                    id.includes('exp') ||
                                    m.is_free;
                                });
                                if (l1Model) remainingModels = remainingModels.filter(m => m.model_id !== l1Model?.model_id);
                              }

                              l3Model = remainingModels.find(m => m.metadata?.level === 'L3');
                              if (l3Model) remainingModels = remainingModels.filter(m => m.model_id !== l3Model?.model_id);

                              l2Model = remainingModels.find(m => m.metadata?.level === 'L2');
                              if (l2Model) remainingModels = remainingModels.filter(m => m.model_id !== l2Model?.model_id);

                              // 2. Heuristic Matching (if slots empty)
                              // L3 Heuristics (Pro/Ultra/Opus - usually expensive or explicit high-end names)
                              if (!l3Model) {
                                l3Model = remainingModels.find(m => {
                                  const id = m.model_id.toLowerCase();
                                  return id.includes('ultra') ||
                                    id.includes('opus') ||
                                    id.includes('reasoner') ||
                                    (m.input_cost_usd || 0) > 10; // Very expensive > $10
                                });
                                if (l3Model) remainingModels = remainingModels.filter(m => m.model_id !== l3Model?.model_id);
                              }

                              // L2 Heuristics (Pro/Plus/Standard - middle ground)
                              if (!l2Model) {
                                l2Model = remainingModels.find(m => {
                                  const id = m.model_id.toLowerCase();
                                  return id.includes('pro') ||
                                    id.includes('plus') ||
                                    id.includes('turbo') ||
                                    id.includes('sonnet') ||
                                    id.includes('grok-2') ||
                                    id.includes('beta');
                                });
                                if (l2Model) remainingModels = remainingModels.filter(m => m.model_id !== l2Model?.model_id);
                              }

                              // 3. Fallback / Leftover Distribution
                              if (remainingModels.length > 0) {
                                // Sort remaining by cost
                                remainingModels.sort((a, b) => {
                                  const costA = a.input_cost_usd || 0;
                                  const costB = b.input_cost_usd || 0;
                                  return costA - costB;
                                });

                                // Fill null slots from remaining
                                if (!l1Model) l1Model = remainingModels.shift();
                                if (!l2Model && remainingModels.length > 0) l2Model = remainingModels.shift();
                                if (!l3Model && remainingModels.length > 0) l3Model = remainingModels.pop();
                              }

                              if (isMori) {
                                if (modelState.selectedModel === DEFAULT_MODEL_SENTINEL) {
                                  const defaults = modelState.roleDefaultModel?.split(',').map((s: string) => s.trim()) || [];
                                  isFamilyActive = familyModels.some(m => defaults.includes(m.model_id));
                                } else {
                                  isFamilyActive = familyModels.some(m => modelState.selectedModelsMulti?.includes(m.model_id));
                                }
                              } else {
                                isFamilyActive = familyModels.some(m => m.model_id === modelState.selectedModel);
                              }

                              // Debug specific families
                              if (['claude', 'deepseek', 'grok'].includes(familyKey)) {
                                console.log(`🔍 [${familyKey}] Raw Models:`, familyModels.map(m => m.model_id));
                                console.log(`🔍 [${familyKey}] Assignments: L1=${l1Model?.model_id}, L2=${l2Model?.model_id}, L3=${l3Model?.model_id}`);
                              }

                              // Determine plan status for cost display
                              const isFreePlan = !user?.subscription_plan_id || user?.subscription_plan_id === 'free';

                              uniqueTiers = [
                                { label: 'L1', model: l1Model, desc: '綜合', costVal: isFreePlan ? 3 : '無限用' },
                                { label: 'L2', model: l2Model, desc: '思考', costVal: 4 },
                                { label: 'L3', model: l3Model, desc: '研究', costVal: 20 }
                              ].filter(t => t.model);
                            }

                            return (
                              <div key={familyKey} className={`group rounded-3xl transition-all duration-300 ${isFamilyActive
                                ? 'bg-[#FFF5EB] shadow-md shadow-orange-100'
                                : 'bg-white shadow-sm hover:shadow-md hover:bg-[#FAFAFA]'
                                }`}>
                                {/* Family Header */}
                                <div
                                >
                                  <div className="flex items-center space-x-4">
                                    <div className={`p-2.5 rounded-2xl transition-colors ${isFamilyActive ? 'bg-[#FFD8B1] text-[#5D4037]' : 'bg-[#F5F5F0] text-[#8D6E63] group-hover:bg-[#FFD8B1]/50'}`}>
                                      <CpuChipIcon className="w-6 h-6" />
                                    </div>
                                    <div>
                                      <span className={`block font-bold text-lg ${isFamilyActive ? 'text-[#5D4037]' : 'text-[#8D6E63]'}`}>{displayName}</span>
                                      <span className="text-xs text-[#BCAAA4] font-medium tracking-wide">AI 家族</span>
                                    </div>
                                  </div>
                                  {isFamilyActive && (
                                    <div className="h-2.5 w-2.5 rounded-full bg-[#FFB6C1] shadow-sm" />
                                  )}
                                </div>

                                {/* Tiers Toggles */}
                                < div className="px-5 pb-5 pt-1 flex space-x-3" >
                                  {
                                    uniqueTiers.map((tier) => {
                                      const m = tier.model;
                                      let isTierSelected = false;

                                      if (isMori) {
                                        if (modelState.selectedModel === DEFAULT_MODEL_SENTINEL) {
                                          const defaults = modelState.roleDefaultModel?.split(',').map((s: string) => s.trim()) || [];
                                          isTierSelected = defaults.includes(m.model_id);
                                        } else {
                                          isTierSelected = modelState.selectedModelsMulti?.includes(m.model_id) || false;
                                        }
                                      } else {
                                        isTierSelected = modelState.selectedModel === m.model_id;
                                      }

                                      return (
                                        <button
                                          key={m.model_id}
                                          onMouseDown={async (e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            const { default: toast } = await import('react-hot-toast');

                                            if (isMori && modelState.setSelectedModelsMulti) {
                                              let currentSelection = [...(modelState.selectedModelsMulti || [])];
                                              if (modelState.selectedModel === DEFAULT_MODEL_SENTINEL) {
                                                modelState.setSelectedModel('');
                                                currentSelection = [];
                                              }
                                              if (currentSelection.includes(m.model_id)) {
                                                currentSelection = currentSelection.filter(id => id !== m.model_id);
                                              } else {
                                                if (currentSelection.length >= 4) {
                                                  toast.error('最多選擇 4 個模型');
                                                  return;
                                                }
                                                currentSelection.push(m.model_id);
                                              }
                                              modelState.setSelectedModelsMulti(currentSelection); toast.success(`已選擇 ${displayName} ${tier.label}`);
                                            } else {
                                              console.log('👆 [Click] User clicked model:', m.model_id);
                                              // modelState.setSelectedModel(m.model_id); // Redundant, saveFunction already handles update
                                              modelState.saveFunction(m.model_id);
                                              toast.success(`已選擇 ${displayName} ${tier.label}`);
                                            }
                                          }}
                                          className={`flex-1 py-3 px-2 rounded-2xl text-xs font-medium transition-all duration-300 flex flex-col items-center justify-center gap-1 ${isTierSelected
                                            ? (tier.label === 'L1' || tier.desc === 'L1')
                                              ? 'bg-[#FAFAFA] text-[#727272] border border-gray-100 shadow-md transform scale-[1.02]'
                                              : (tier.label === 'L2' || tier.desc === 'L2')
                                                ? 'bg-[#FDF3C8] text-[#5D4037] border border-[#FDF3C8] shadow-md transform scale-[1.02]'
                                                : 'bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] text-white shadow-md transform scale-[1.02]'
                                            : 'bg-[#F5F5F0] text-[#8D6E63] hover:bg-[#EFEBE9] hover:text-[#5D4037]'
                                            }`}
                                        >
                                          <span className="font-extrabold text-sm">{tier.label}</span>
                                          <span className="w-full text-center opacity-80 truncate px-1 scale-90 font-medium">{tier.desc}</span>
                                          <span className={`text-[10px] whitespace-nowrap opacity-75 font-semibold flex items-center justify-center gap-0.5 ${isTierSelected ? ((tier.label === 'L1' || tier.desc === 'L1') ? 'text-gray-500' : (tier.label === 'L2' || tier.desc === 'L2') ? 'text-[#5D4037]/80' : 'text-white/90') : 'text-[#8D6E63]/70'
                                            }`}>
                                            {typeof tier.costVal === 'number' ? (
                                              <>
                                                {tier.costVal}
                                                <img src="/apple-icon.svg" alt="food" className="w-3 h-3 -mt-0.5" />
                                              </>
                                            ) : (
                                              tier.costVal
                                            )}
                                          </span>
                                        </button>
                                      );
                                    })
                                  }
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                      {/* Footer for Multi-select */}
                      {roleId === 'mori' && (
                        <div className="p-4 border-t border-[#EADBC8] bg-[#F8F5EC] flex items-center justify-between">
                          已選 {(() => {
                            const isDefaults = modelState.selectedModel === DEFAULT_MODEL_SENTINEL;
                            const list = isDefaults
                              ? (modelState.roleDefaultModel?.split(',') || [])
                              : (modelState.selectedModelsMulti || []);
                            const count = list.filter((s: string) => s.trim()).length;
                            return count;
                          })()} / 4 (至少 2 個)

                          <button
                            onMouseDown={async (e) => {
                              e.preventDefault();
                              const { default: toast } = await import('react-hot-toast');
                              // Save only on confirm
                              try {
                                const selection = modelState.selectedModelsMulti || [];
                                if (selection.length < 2) {
                                  toast.error('請至少選擇 2 個模型');
                                  return;
                                }
                                await modelState.saveFunction(selection as any); // Cast to any to avoid TS error, implementation handles string[]
                                modelState.setModelSelectOpen(false);
                                toast.success('模型設定已更新');
                              } catch (err) {
                                console.error(err);
                                toast.error('儲存失敗');
                              }
                            }}
                            className="px-4 py-2 bg-[#FFD59A] hover:bg-[#FFC570] text-[#4B4036] font-bold rounded-lg transition-colors shadow-sm"
                          >
                            確認選擇
                          </button>
                        </div>
                      )}
                    </div>
                  </div >,
                  document.body
                )
                }
              </div >
            );
          })()}

          {/* Camera Modal Portal */}
          <AnimatePresence>
            {showCameraModal && (
              <ReferenceCameraModal
                onClose={() => setShowCameraModal(false)}
                onCapture={(file) => {
                  if (selectedImages.length >= 5) {
                    const { default: toast } = require('react-hot-toast');
                    toast.error('最多只能上傳 5 張圖片');
                    return;
                  }
                  setSelectedImages(prev => [...prev, file]);
                  setShowCameraModal(false);
                  // Removed setAnalyzingImages(true)
                }}
              />
            )}
          </AnimatePresence>

          {/* Image Picker Portal */}
          <AnimatePresence>
            {showImagePicker && (
              <ReferenceImagePicker
                onClose={() => setShowImagePicker(false)}
                onSelectUpload={handleImageSelect}
                onSelectCamera={handleCameraCapture}
                onFilesSelected={handleFilesAdded}
              />
            )}
          </AnimatePresence>



          {/* Modals & Panels */}
          <AnimatePresence mode="wait">
            {showSettingsPanel && (
              <>
                <motion.div
                  initial={{ x: 300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 300, opacity: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="fixed top-0 right-0 h-full bg-white shadow-2xl z-50 w-80 md:w-96"
                >
                  <ChatSettingsPanel
                    roleInstance={selectedCompanion && roleInstancesMap[selectedCompanion] ? roleInstancesMap[selectedCompanion] : Object.values(roleInstancesMap)[0]}
                    roleInstances={Object.values(roleInstancesMap)}
                    availableModels={availableModels}
                    room={room}
                    onUpdateRole={async (updates) => {
                      const instance = selectedCompanion && roleInstancesMap[selectedCompanion] ? roleInstancesMap[selectedCompanion] : Object.values(roleInstancesMap)[0];
                      if (instance) {
                        await handleUpdateRoleInstance(instance.id, updates);
                      }
                    }}
                    onUpdateRoleInstance={handleUpdateRoleInstance}
                    onUpdateRoomConfig={handleUpdateRoomConfig}
                    onClose={() => setShowSettingsPanel(false)}
                    tasks={tasks}
                    activeRoles={activeRoles}
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
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                  onClick={() => setShowSettingsPanel(false)}
                />
              </>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showInviteModal && (
              <InviteModal
                isOpen={showInviteModal}
                onClose={() => setShowInviteModal(false)}
                companions={companions}
                activeRoles={activeRoles}
                onInvite={handleInviteRole}
                onRemove={handleRemoveRole}
              />
            )}
          </AnimatePresence>

          <BlockSelectionModal
            isOpen={loadoutModalState.isOpen}
            onClose={() => setLoadoutModalState(prev => ({ ...prev, isOpen: false }))}
            onSelect={handleBlockSelect}
            slotType={loadoutModalState.slotType}
            roleInstanceId={loadoutModalState.roleInstanceId}
          />

          <RoleSelectorModal
            isOpen={roleSelectorOpen}
            onClose={() => setRoleSelectorOpen(false)}
            companions={companions}
            activeRoles={activeRoles}
            selectedCompanion={selectedCompanion}
            onSelect={setSelectedCompanion}
          />
        </div >
      </div >

    </div >
  );
}

// ========================================
// 訊息氣泡組件
// ========================================

// Helper to format model name (Family + Level)
function getFormattedModelName(modelId: string, availableModels: any[] = []): string {
  if (!modelId) return '';

  const m = availableModels.find((x: any) => x.model_id === modelId);

  // 1. Determine Level (L1/L2/L3)
  let level = m?.metadata?.level;
  if (!level) {
    const lowerId = modelId.toLowerCase();
    if (lowerId.includes('flash') || lowerId.includes('turbo') || lowerId.includes('mini') || lowerId.includes('haiku') || lowerId.includes('basic') || lowerId.includes('4o-mini')) {
      level = 'L1';
    } else if (lowerId.includes('standard') || lowerId.includes('plus')) {
      level = 'L2';
    } else {
      level = 'L3'; // Default to L3 for advanced models (pro, sonnet, opus, o1, etc)
    }
  }

  // 2. Determine Family Name
  // We prioritize the family name mapping over specific display names to ensure "Family Lx" format
  let familyName = '';
  const lowerId = modelId.toLowerCase();

  if (m?.metadata?.family) {
    const metaFamily = m.metadata.family.toLowerCase();
    if (metaFamily === 'chatgpt' || metaFamily === 'openai') familyName = 'ChatGPT';
    else if (metaFamily === 'gemini' || metaFamily === 'google') familyName = 'Gemini';
    else if (metaFamily === 'claude' || metaFamily === 'anthropic') familyName = 'Claude';
    else if (metaFamily === 'grok' || metaFamily === 'xai') familyName = 'Grok';
    else if (metaFamily === 'qwen' || metaFamily === 'alibaba') familyName = 'Qwen';
    else if (metaFamily === 'llama' || metaFamily === 'meta') familyName = 'Llama';
    else if (metaFamily === 'deepseek') familyName = 'DeepSeek';
    else if (metaFamily === 'flux') familyName = 'Flux';
  }

  if (!familyName) {
    if (lowerId.includes('gpt')) familyName = 'ChatGPT';
    else if (lowerId.includes('gemini')) familyName = 'Gemini';
    else if (lowerId.includes('claude')) familyName = 'Claude';
    else if (lowerId.includes('grok')) familyName = 'Grok';
    else if (lowerId.includes('qwen')) familyName = 'Qwen';
    else if (lowerId.includes('llama')) familyName = 'Llama';
    else if (lowerId.includes('deepseek')) familyName = 'DeepSeek';
    else if (lowerId.includes('flux')) familyName = 'Flux';
    else if (lowerId.includes('midjourney')) familyName = 'Midjourney';
    else if (lowerId.includes('dall')) familyName = 'DALL-E';
    else {
      // Fallback to existing display name or model ID if unknown family
      familyName = m?.display_name || modelId;
    }
  }

  return `${familyName} ${level}`;
}

interface MessageBubbleProps {
  message: Message;
  companion?: any;
  onDelete?: (messageId: string) => void;
  isHighlighted?: boolean;
  availableModels?: any[];
}
function MessageBubble({ message, companion, onDelete, isHighlighted = false, availableModels = [] }: MessageBubbleProps) {
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
  const [showAudioAnalysis, setShowAudioAnalysis] = useState(false);
  const picoAvatarSrc = companion?.imagePath || '/3d-character-backgrounds/studio/Pico/Pico.png';

  const isMoriMulti =
    !isUser &&
    Array.isArray(message.content_json?.model_responses) &&
    message.content_json.model_responses.length > 1;
  const moriModelCount = isMoriMulti ? message.content_json?.model_responses?.length ?? 0 : 0;
  const isMoriDeck = isMoriMulti && moriViewMode === 'deck';

  // 🟢 Fix: Extract attachments from message (handling both array and string formats)
  let safeAttachments: any[] = [];
  try {
    const rawAttachments = (message as any).attachments || (message.content_json as any)?.images;
    if (Array.isArray(rawAttachments)) {
      safeAttachments = rawAttachments;
    } else if (typeof rawAttachments === 'string') {
      try {
        safeAttachments = JSON.parse(rawAttachments);
      } catch (e) {
        // If string but not JSON, maybe single URL?
        if (rawAttachments.startsWith('http')) safeAttachments = [{ url: rawAttachments }];
      }
    }
  } catch (e) {
    console.error('Error parsing attachments in inline MessageBubble:', e);
  }

  // Check if message has audio attachment
  const hasAudioAttachment = safeAttachments.some(att =>
    att.type === 'audio' ||
    att.mimeType?.startsWith('audio/') ||
    att.name?.endsWith('.webm') ||
    att.name?.endsWith('.mp3') ||
    att.name?.endsWith('.m4a') ||
    att.name?.endsWith('.wav')
  );

  const renderPlainText = () => {
    // Robust splitting for different newline formats
    const lines = message.content.split(/\r\n|\r|\n/);
    let hasRenderedImage = false;

    // 🟣 Inline Debug Box removed

    // Check if message has audio attachment - REUSED from above
    // const hasAudioAttachment = ... (Hoisted)

    const attachmentImages = safeAttachments.length > 0 ? (
      <div key="attachments-container" className="flex flex-wrap gap-2 my-2 w-full">
        {safeAttachments.map((att, idx) => {
          // Check if audio
          const isAudio = att.type === 'audio' || att.mimeType?.startsWith('audio/') || att.name?.endsWith('.webm') || att.name?.endsWith('.mp3') || att.name?.endsWith('.m4a') || att.name?.endsWith('.wav');

          if (isAudio) {
            return (
              <div key={`att-${idx}`} className="w-full max-w-sm">
                <VoiceMessagePlayer src={att.url} sender={isUser ? 'user' : 'ai'} />
                {/* <div className="text-[10px] text-[#8C7A6B] mt-1 truncate px-1">{att.name || '語音訊息'}</div> */}
              </div>
            );
          }

          return (
            <div key={`att-${idx}`} className="relative w-48 h-48 rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
              <SecureImageDisplay
                imageUrl={att.url || att.path}
                alt="Attachment"
              />
            </div>
          );
        })}
      </div>
    ) : null;

    const renderedLines = lines.map((line, index) => {
      // Hide default voice message text if audio is present
      if (hasAudioAttachment && line.trim() === '[語音訊息]') {
        return null;
      }

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

    // Inject Attachments (only)
    const finalOutput = [
      ...(attachmentImages ? [attachmentImages] : []),
      ...renderedLines
    ];

    return finalOutput;
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

    // Deep copy
    const modelResponses = JSON.parse(JSON.stringify(rawModelResponses));

    // PATCH: Inject image
    const globalImageMatch = message.content.match(/!\[(.*?)\]\((.*?)\)/);
    if (globalImageMatch) {
      const imageUrl = globalImageMatch[2];
      const hasImage = modelResponses.some((r: any) => r.content?.includes(imageUrl));
      if (!hasImage && modelResponses.length > 0) {
        modelResponses[0].content += `\n\n![Generated Image](${imageUrl})`;
      }
    }

    const modelCount = modelResponses.length;
    const food = meta.food || {};
    const charPerToken = Number(food.CHAR_PER_TOKEN || 4);
    const charsPerFood = Number(food.CHARS_PER_FOOD || 100) || 100;
    const totalFoodCostFromMeta = meta.food?.total_food_cost || 0;
    const totalContentLength = modelResponses.reduce((acc: number, resp: any) => acc + (resp.content?.length || 0), 0);
    const currentActiveIndex = Math.min(activeMoriIndex, Math.max(0, modelCount - 1));
    const isDeckMode = moriViewMode === 'deck';

    const computePerModelFood = (tokens: number) => {
      if (!tokens || !charPerToken || !charsPerFood) return null;
      const estimatedChars = tokens * charPerToken;
      return Math.max(1, Math.ceil(estimatedChars / charsPerFood));
    };

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
                      const modelId = resp.model || resp.model_name || '';
                      const label = getFormattedModelName(modelId, availableModels) || modelId || `模型 ${idx + 1}`;
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
                      {getFormattedModelName(modelResponses[currentActiveIndex]?.model || modelResponses[currentActiveIndex]?.model_name, availableModels) || modelResponses[currentActiveIndex]?.model} 的回答
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

                    let estimatedFood = 0;
                    if (totalFoodCostFromMeta > 0 && totalContentLength > 0) {
                      estimatedFood = Math.round(((resp.content?.length || 0) / totalContentLength) * totalFoodCostFromMeta);
                      if (estimatedFood === 0 && (resp.content?.length || 0) > 0) estimatedFood = 1;
                    } else {
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
                                return (
                                  <div key={i} className="my-2">
                                    {textBefore && <p className="mb-2">{textBefore}</p>}
                                    <SecureImageDisplay
                                      imageUrl={publicUrl}
                                      alt="Image"
                                      className="rounded-lg shadow-lg"
                                      onDownload={() => downloadImage(imageUrl)}
                                    />
                                  </div>
                                );
                              }

                              return <div key={i} className="min-h-[1.5em]">{line}</div>;
                            })}
                          </div>

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

              let estimatedFood = 0;
              if (totalFoodCostFromMeta > 0 && totalContentLength > 0) {
                estimatedFood = Math.round(((resp.content?.length || 0) / totalContentLength) * totalFoodCostFromMeta);
                if (estimatedFood === 0 && (resp.content?.length || 0) > 0) estimatedFood = 1;
              } else {
                estimatedFood = Math.ceil((resp.content?.length || 0) / 100);
              }

              return (
                <div key={`stack-${idx}`} className="border-b last:border-b-0 pb-6 last:pb-0 border-[#EADBC8]/50">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1 rounded bg-[#F8F5EC] border border-[#EADBC8]">
                      <CpuChipIcon className="w-3 h-3 text-[#B08968]" />
                    </div>
                    <span className="text-xs font-bold text-[#4B4036]">{getFormattedModelName(resp.model || resp.model_name, availableModels) || resp.model || `模型 ${idx + 1}`}</span>
                    {(idx === 0) && (
                      <span className="px-2 py-0.5 bg-[#FFD59A]/20 text-[#B08968] text-[10px] rounded-full">
                        主要回答
                      </span>
                    )}
                  </div>

                  <div className="prose prose-sm max-w-none text-[#4B4036] leading-relaxed break-words pl-2 border-l-2 border-[#EADBC8]/30">
                    <div className="whitespace-pre-wrap">
                      {resp.content?.split(/\r\n|\r|\n/).map((line: string, i: number) => {
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
                          return (
                            <div key={i} className="my-2">
                              {textBefore && <p className="mb-2">{textBefore}</p>}
                              <SecureImageDisplay
                                imageUrl={publicUrl}
                                alt="Image"
                                className="rounded-lg shadow-lg"
                                onDownload={() => downloadImage(imageUrl)}
                              />
                            </div>
                          );
                        }

                        return <div key={i} className="min-h-[1.5em]">{line}</div>;
                      })}
                    </div>

                    {(total > 0 || estimatedFood) && (
                      <div className="flex items-center gap-3 mt-4 pt-3 border-t border-[#EADBC8]/30">
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
          </div>
        )}
      </div>
    );
  };

  const renderAudioAnalysis = () => {
    const analysis = message.content_json?.audio_analysis;
    if (!analysis) return null;

    return (
      <div className="mt-3 pt-2 border-t border-[#EADBC8]/50">
        <button
          onClick={() => setShowAudioAnalysis(!showAudioAnalysis)}
          className="flex items-center gap-1.5 text-xs font-medium text-[#B08968] hover:text-[#8C7A6B] transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          <span>語音分析細節</span>
          <svg className={`w-3 h-3 transition-transform ${showAudioAnalysis ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showAudioAnalysis && (
          <div className="mt-2 bg-[#F8F5EC] rounded-lg p-3 text-xs space-y-3 text-[#4B4036] border border-[#EADBC8]/50">
            {analysis.transcription && (
              <div>
                <div className="font-bold mb-1 opacity-70">逐字稿</div>
                <div className="leading-relaxed font-mono bg-white/50 p-2 rounded shadow-sm">{analysis.transcription}</div>
              </div>
            )}
            {analysis.description && (
              <div>
                <div className="font-bold mb-1 opacity-70">情境描述</div>
                <div className="leading-relaxed bg-white/50 p-2 rounded shadow-sm">{analysis.description}</div>
              </div>
            )}
            {analysis.model && (
              <div className="text-[10px] opacity-40 text-right mt-1">
                Analysis by {analysis.model}
              </div>
            )}
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

    const formattedModel = getFormattedModelName(model, availableModels);

    // [MODIFICATION] Custom display for Image Responses (Pico/Image Models)
    // User wants: "ModelName L{Tier}" in the bottom left
    let displayModel = formattedModel || model;

    // Check if this is likely an image response
    const isImageResponse =
      message.sender === 'pico' ||
      (message.content_json && message.content_json.food && message.content_json.food.image_tokens > 0) ||
      model?.toLowerCase().includes('flux') ||
      model?.toLowerCase().includes('dall-e') ||
      model?.toLowerCase().includes('journey');

    if (isImageResponse && model) {
      // Determine Tier locally for display (Mirroring backend logic roughly)
      let tier = 'L3'; // Default
      const lowerIds = model.toLowerCase();

      // Determine Tier
      if (lowerIds.includes('flash-image')) {
        tier = 'L2';
      } else if (lowerIds.includes('flash') || lowerIds.includes('mini') || lowerIds.includes('lite')) {
        tier = 'L1';
      } else if (lowerIds.includes('flux') || lowerIds.includes('standard') || (lowerIds.includes('gpt-5') && lowerIds.includes('mini'))) {
        tier = 'L2';
      } else {
        tier = 'L3';
      }

      // Format Name: Remove provider prefix if present for cleaner look, but keep recognizable name
      // e.g. "google/gemini-flash" -> "Gemini Flash"
      let cleanName = model.split('/').pop() || model;
      // Capitalize first letter
      cleanName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

      displayModel = `${cleanName} ${tier}`;
    }

    return (
      <div className="mt-3 pt-2 border-t border-[#EADBC8]/50 flex flex-wrap items-center gap-3 text-[10px] text-[#2B3A3B]/60 font-medium">
        {model && (
          <div className="flex items-center gap-1 bg-[#F8F5EC] px-2 py-0.5 rounded-full border border-[#EADBC8]">
            <CpuChipIcon className="w-3 h-3 text-[#FFD59A]" />
            <span>{displayModel}</span>
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
        backgroundColor: isHighlighted ? ['rgba(255, 213, 154, 0)', 'rgba(255, 213, 154, 0.3)', 'rgba(255, 213, 154, 0)'] : 'rgba(0, 0, 0, 0)'
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
            className={
              hasAudioAttachment
                ? "group relative" // Minimized styling for voice messages (User) to float freely
                : `group relative ${isMoriDeck ? 'px-0 py-0' : 'px-4 py-3'} rounded-2xl shadow-sm ${isUser
                  ? 'bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white rounded-br-md'
                  : isSystem
                    ? 'bg-[#F8F5EC] border border-[#EADBC8] text-[#4B4036] rounded-bl-md'
                    : isMoriDeck
                      ? 'bg-transparent border border-transparent text-[#2B3A3B]'
                      : 'bg-white border border-[#EADBC8] text-[#4B4036] rounded-bl-md'
                }`
            }
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
                  {renderAudioAnalysis()}
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

// ========================================
// 邀請模態框組件
// ========================================
interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  companions: any[];
  activeRoles: string[];
  onInvite: (roleId: any, isFromModal?: boolean) => void;
  onRemove: (roleId: any) => void;
}

function InviteModal({ isOpen, onClose, companions, activeRoles, onInvite, onRemove }: InviteModalProps) {
  const [inviteRoleSearch, setInviteRoleSearch] = useState('');
  const [inviteRoleSelectOpen, setInviteRoleSelectOpen] = useState(false);
  const [inviteRoleDropdownPosition, setInviteRoleDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const inviteRoleInputRef = useRef<HTMLInputElement>(null);
  const inviteRoleSelectRef = useRef<HTMLDivElement>(null);
  const [openPanels, setOpenPanels] = useState({ roles: true, invite: true });

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
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
            onClick={onClose}
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
                            {/* Header Info - Desktop Only */}
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
                                onClick={() => onRemove(roleId)}
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
                                        e.preventDefault();
                                        onInvite(companion.id, true);
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
                                          <div className="font-medium text-[#4B4036]">
                                            {companion.id === 'hibi' ? '（綜合）希希' :
                                              companion.id === 'mori' ? '（多模型研究）墨墨' :
                                                companion.id === 'pico' ? '（繪圖）皮可' :
                                                  companion.name} ({companion.nameEn})
                                          </div>
                                          <div className="text-xs text-[#2B3A3B] truncate">{companion.specialty}</div>
                                        </div>
                                      </div>
                                    </motion.button>
                                  ))}
                                {companions.filter(companion =>
                                  !activeRoles.includes(companion.id) &&
                                  (!inviteRoleSearch.trim() ||
                                    companion.name.toLowerCase().includes(inviteRoleSearch.toLowerCase()) ||
                                    companion.nameEn.toLowerCase().includes(inviteRoleSearch.toLowerCase())
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
        <div className="flex space-x-3 mt-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-[#4B4036] rounded-xl font-medium transition-all"
          >
            關閉
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ========================================
// 角色選擇模態框組件
// ========================================

interface RoleSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  companions: any[];
  activeRoles: string[];
  selectedCompanion: string;
  onSelect: (companionId: any) => void;
}

function RoleSelectorModal({ isOpen, onClose, companions, activeRoles, selectedCompanion, onSelect }: RoleSelectorModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-sm bg-white rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-[#F8F5EC]">
          <h3 className="font-bold text-[#4B4036]">選擇角色</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-black/5">
            <XMarkIcon className="w-5 h-5 text-[#4B4036]" />
          </button>
        </div>
        <div className="p-2 space-y-1">
          {companions.filter(c => activeRoles.includes(c.id)).map(companion => (
            <button
              key={companion.id}
              onClick={() => {
                onSelect(companion.id as any);
                onClose();
              }}
              className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-colors ${selectedCompanion === companion.id
                ? 'bg-[#FFD59A]/30 text-[#4B4036]'
                : 'hover:bg-gray-50 text-gray-600'
                }`}
            >
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${companion.color} p-0.5`}>
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                  <Image
                    src={companion.imagePath}
                    alt={companion.name}
                    width={36}
                    height={36}
                    className="w-9 h-9 object-cover"
                  />
                </div>
              </div>
              <div className="font-medium">
                {companion.id === 'hibi' ? '（綜合）希希' :
                  companion.id === 'mori' ? '（多模型研究）墨墨' :
                    companion.id === 'pico' ? '（繪圖）皮可' :
                      companion.name}
              </div>
              {selectedCompanion === companion.id && (
                <CheckCircleIcon className="w-5 h-5 text-[#FFB6C1] ml-auto" />
              )}
            </button>
          ))}
        </div>
      </motion.div>

    </div>
  );
}