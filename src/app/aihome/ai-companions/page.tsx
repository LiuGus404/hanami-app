'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Bars3Icon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  PlusIcon,
  ClockIcon,
  CpuChipIcon,
  XMarkIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  AcademicCapIcon,
  PaintBrushIcon,
  HeartIcon,
  ArrowPathIcon,
  UserIcon,
  PuzzlePieceIcon,
  WrenchScrewdriverIcon,
  CubeIcon,
  ClipboardDocumentIcon,
  GlobeAltIcon,
  ExclamationCircleIcon,
  CodeBracketIcon,
  LightBulbIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import UnifiedRightContent from '@/components/UnifiedRightContent';
import AppSidebar from '@/components/AppSidebar';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import { getSaasSupabaseClient, getSupabaseClient } from '@/lib/supabase';
import Image from 'next/image';
import UsageStatsDisplay from '@/components/ai-companion/UsageStatsDisplay';
import { BlockSelectionModal } from '@/components/ai-companion/BlockSelectionModal';
import { MindBlock, MindBlockType } from '@/types/mind-block';
import FoodBalanceButton from '@/components/aihome/FoodBalanceButton';

interface AIRoom {
  id: string;
  title: string;
  description: string;
  lastMessage: string;
  lastActivity: Date;
  memberCount: number;
  activeRoles: string[];
  messageCount: number;
  status: 'active' | 'archived';
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

// 獲取用戶有權訪問的房間 ID 列表（應用層權限檢查）
const getUserAccessibleRoomIds = async (userId: string): Promise<string> => {
  try {
    const saasSupabase = getSaasSupabaseClient();
    const { data: memberRooms, error } = await saasSupabase
      .from('room_members')
      .select('room_id')
      .eq('user_id', userId);

    if (error || !memberRooms) {
      console.log('🔍 用戶沒有額外的房間成員身份');
      return '';
    }

    const roomIds = memberRooms.map((rm: any) => rm.room_id).join(',');
    console.log('🔍 用戶參與的房間 ID:', roomIds);
    return roomIds;
  } catch (error) {
    console.error('❌ 獲取房間成員身份失敗:', error);
    return '';
  }
};



export default function AICompanionsPage() {
  const { user, loading, logout } = useSaasAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const saasSupabaseClient = getSaasSupabaseClient();
  const supabase = saasSupabaseClient; // 使用 SaaS 專案的 Supabase 客戶端來訪問 ai_roles 表
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState<'chat' | 'roles' | 'memory' | 'stats' | 'mind'>('chat');
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<AIRoom | null>(null);
  const [selectedCompanion, setSelectedCompanion] = useState<AICompanion | null>(null);

  // Sync activeView with URL search params
  useEffect(() => {
    const viewParam = searchParams.get('view');
    if (viewParam && ['chat', 'roles', 'memory', 'stats', 'mind'].includes(viewParam)) {
      setActiveView(viewParam as any);
    }
  }, [searchParams]);

  // 認證保護
  useEffect(() => {
    if (!loading && !user) {
      router.push('/aihome/auth/login');
    }
  }, [user, loading, router]);

  // 聊天室資料 - 從資料庫載入
  const [rooms, setRooms] = useState<AIRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [creatingChat, setCreatingChat] = useState<string | null>(null); // 正在創建聊天室的 companion ID
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [selectedCompanionForProject, setSelectedCompanionForProject] = useState<AICompanion | null>(null);
  const [showRoleSelectionModal, setShowRoleSelectionModal] = useState(false);

  // 食量相關狀態 - handled by FoodBalanceButton


  // 移除重複的 handleLogout (若需要可保留，但建議統一)
  // const handleLogout ... (上面已經有 import define，這裡可能有重複定義?)
  // 我們保留原本的 handleLogout，但移除 inline food logic。

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

  // 角色設定相關狀態
  const [showSettings, setShowSettings] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [roleTone, setRoleTone] = useState('');
  const [roleGuidance, setRoleGuidance] = useState('');
  const [aiRoles, setAiRoles] = useState<any[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [showAllModels, setShowAllModels] = useState(false);
  const [modelSearch, setModelSearch] = useState('');
  const [modelSelectOpen, setModelSelectOpen] = useState(false);
  const [selectedModelsMulti, setSelectedModelsMulti] = useState<string[]>([]);
  const [roleDefaultModel, setRoleDefaultModel] = useState<string>('gpt-4o-mini');
  const [openPanels, setOpenPanels] = useState<{ model: boolean; tone: boolean; guidance: boolean; mind: boolean }>({ model: false, tone: false, guidance: false, mind: true });
  const modelSelectRef = useRef<HTMLDivElement>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const [clickedCompanionId, setClickedCompanionId] = useState<string | null>(null);
  const [companionModels, setCompanionModels] = useState<Record<string, { modelId: string; displayName: string; food: number } | null>>({});
  const [defaultMindBlocks, setDefaultMindBlocks] = useState<any[]>([]); // 預設思維積木
  const [showBlockSelectionModal, setShowBlockSelectionModal] = useState(false); // 控制積木選擇 modal

  const DEFAULT_MODEL_SENTINEL = '__default__';
  // 估算 100 字問題食量（僅輸入成本；3x 食量，轉為「分」）；最少顯示 1 食量
  const computeFoodFor100 = (model: any): number => {
    if (!model) return 1;
    const inputCost = Number(model.input_cost_usd || 0);
    const totalUsd = (100 / 1_000_000) * inputCost; // 以 100 tokens 近似 100 字
    const food = Math.ceil(totalUsd * 3 * 100);
    const hkd = totalUsd * 3 * 7.85; // 轉 HKD（僅計算不顯示）
    return Math.max(food, 1);
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

  // 依 model_id 或逗號清單，回傳易讀名稱
  const formatModelDisplay = (ids: string | undefined): string => {
    if (!ids) return '';
    const list = ids.split(',').map((s) => s.trim()).filter(Boolean);
    const names = list.map((id) => {
      // 先移除 model_id 中的 :free
      const cleanId = id.replace(/:free/gi, '');
      const m = availableModels.find((x: any) => x.model_id === id || x.model_id === cleanId);
      const raw = m?.display_name || cleanId;
      return stripFree(raw);
    });
    return names.join('、');
  };

  // 根據角色自動判斷合適模型條件
  const computeModelFilter = (role: AICompanion | null, roleSlug?: string, systemPrompt?: string) => {
    const text = (
      (role?.name || '') + ' ' + (role?.description || '') + ' ' + (roleSlug || '') + ' ' + (systemPrompt || '')
    ).toLowerCase();

    const needsCode = /code|coder|編碼|程式|程式碼/.test(text);
    const needsVision = /vision|vl|image|圖片|圖像|視覺/.test(text);
    const needsAudio = /audio|語音|語者|聽力/.test(text);
    const needsSearch = /search|web_search|research|研究|搜尋|網路/.test(text);

    return { needsCode, needsVision, needsAudio, needsSearch };
  };

  // 取得經過濾的模型列表（預設自動）
  const getFilteredModels = () => {
    if (showAllModels || !selectedCompanion) return availableModels;

    const { needsCode, needsVision, needsAudio, needsSearch } = computeModelFilter(
      selectedCompanion,
      selectedCompanion?.id,
      roleGuidance
    );

    return availableModels.filter((m) => {
      const caps: string[] = Array.isArray(m.capabilities) ? m.capabilities : [];
      const hasVision = caps.includes('vision') || m.model_type === 'multimodal';
      const hasAudio = caps.includes('audio') || m.model_type === 'audio' || m.model_type === 'multimodal';
      const hasCode = caps.includes('code') || m.model_type === 'code';
      const hasSearch = caps.includes('web_search') || /perplexity|sonar|search/.test((m.provider || '') + ' ' + (m.model_name || '') + ' ' + (m.model_id || ''));

      if (needsCode && !hasCode) return false;
      if (needsVision && !hasVision) return false;
      if (needsAudio && !hasAudio) return false;
      if (needsSearch && !hasSearch) return false;
      return true;
    });
  };

  // 載入可用模型配置
  const loadAvailableModels = async () => {
    setLoadingModels(true);
    try {
      const supabase = getSaasSupabaseClient();
      const { data, error } = await supabase
        .from('available_models')
        .select('*')
        .order('is_free', { ascending: false })
        .order('input_cost_usd', { ascending: true });

      if (error) {
        console.error('載入模型配置錯誤:', error);
        // 使用預設模型作為備用
        setAvailableModels([
          { model_id: 'gpt-4o-mini', display_name: 'GPT-4o Mini', description: '快速且經濟的選擇', price_tier: '經濟' },
          { model_id: 'gpt-4o', display_name: 'GPT-4o', description: '最強性能', price_tier: '高級' },
          { model_id: 'claude-3-5-sonnet', display_name: 'Claude 3.5 Sonnet', description: '創意寫作專家', price_tier: '標準' }
        ]);
      } else {
        console.log('✅ 成功載入模型配置:', data?.length || 0, '個模型');
        setAvailableModels(data || []);
      }
    } catch (error) {
      console.error('載入模型配置異常:', error);
      // 使用預設模型作為備用
      setAvailableModels([
        { model_id: 'gpt-4o-mini', display_name: 'GPT-4o Mini', description: '快速且經濟的選擇', price_tier: '經濟' },
        { model_id: 'gpt-4o', display_name: 'GPT-4o', description: '最強性能', price_tier: '高級' }
      ]);
    } finally {
      setLoadingModels(false);
    }
  };

  // 處理角色設定
  const handleRoleSettings = async (companion: AICompanion) => {
    setSelectedCompanion(companion);
    setShowSettings(true);

    // 從資料庫載入角色資訊
    try {
      console.log('🔍 載入角色資訊，角色 ID:', companion.id);
      console.log('🔍 查詢條件: slug =', companion.id, ', status = active');

      // 使用映射函數獲取正確的 slug
      const roleSlug = getRoleSlug(companion.id);
      console.log('🔍 映射後的 slug:', roleSlug);

      const { data: roleData, error } = await supabase
        .from('ai_roles')
        .select('*, tone')
        .eq('slug', roleSlug)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        console.error('載入角色資訊錯誤:', error);
        console.error('錯誤詳情:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        // 如果資料庫中沒有找到，使用預設值
        setDefaultRoleValues(companion);
        return;
      }

      console.log('✅ 成功載入角色資訊:', roleData);

      if (roleData) {
        // 先取系統預設
        // 對於 Mori，如果資料庫中沒有 default_model 或是舊的 gpt-4o-mini，使用新的多選預設
        const dbDefaultModel = (roleData as any).default_model;
        const systemDefault = (companion.id === 'mori' && (!dbDefaultModel || dbDefaultModel === 'gpt-4o-mini' || !dbDefaultModel.includes(',')))
          ? 'deepseek/deepseek-chat-v3.1,google/gemini-2.5-flash-lite,x-ai/grok-4-fast:free,openai/gpt-5-mini'
          : (dbDefaultModel || 'gpt-4o-mini');

        // 再檢查使用者覆寫（從 user_role_settings 表載入）
        let userOverrideModel = null as string | null;
        let userOverrideGuidance = null as string | null;
        let userOverrideTone = null as string | null;

        if (user?.id && (roleData as any).id) {
          const { data: userSettings } = await supabase
            .from('user_role_settings')
            .select('model_override, guidance_override, tone_override')
            .eq('user_id', user.id)
            .eq('role_id', (roleData as any).id)
            .eq('is_active', true)
            .maybeSingle();

          if (userSettings) {
            userOverrideModel = (userSettings as any)?.model_override || null;
            userOverrideGuidance = (userSettings as any)?.guidance_override || null;
            userOverrideTone = (userSettings as any)?.tone_override || null;
          }
        }

        // 使用用戶覆寫或系統預設
        const roleDefault = userOverrideModel || systemDefault;
        setRoleDefaultModel(roleDefault);

        // 對於 Mori 角色，檢查是否為多選模型（包含逗號）
        if (companion.id === 'mori') {
          if (roleDefault.includes(',')) {
            // 多選模式：解析模型 ID 並設置到 selectedModelsMulti
            const modelIds = roleDefault.split(',').map((id: string) => id.trim()).filter(Boolean);
            setSelectedModelsMulti(modelIds);
            setSelectedModel(DEFAULT_MODEL_SENTINEL); // 使用預設哨兵值
            setModelSearch('');
            console.log('✅ [Mori] 載入多選預設模型:', modelIds);
          } else {
            // 單選模式（可能有用戶覆寫為單選）
            setSelectedModel(roleDefault);
            setSelectedModelsMulti([]);
            setModelSearch('');
          }
        } else {
          // 非 Mori 角色：單選模式
          if (userOverrideModel) {
            setSelectedModel(userOverrideModel);
            setModelSearch('');
          } else {
            setSelectedModel(DEFAULT_MODEL_SENTINEL);
            setModelSearch('');
          }
          setSelectedModelsMulti([]);
        }

        // 設定指引（優先用戶覆寫，其次系統預設）
        const finalGuidance = userOverrideGuidance || (roleData as any).system_prompt || '';
        setRoleGuidance(finalGuidance);

        // 設定語氣（優先用戶覆寫，其次系統預設）
        if (userOverrideTone) {
          setRoleTone(userOverrideTone);
        } else if ((roleData as any).tone) {
          setRoleTone((roleData as any).tone);
        } else {
          const toneMatch = (roleData as any).system_prompt?.match(/你的語氣(.+?)。/);
          if (toneMatch) {
            setRoleTone(toneMatch[1].trim());
          } else {
            setDefaultToneForRole(companion.id);
          }
        }
      } else {
        setDefaultRoleValues(companion);
      }

      // 加載預設思維積木
      await loadDefaultMindBlocks(companion.id);
    } catch (error) {
      console.error('載入角色資訊異常:', error);
      setDefaultRoleValues(companion);
      await loadDefaultMindBlocks(companion.id);
    }
  };

  // 設定預設角色值
  const setDefaultRoleValues = (companion: AICompanion) => {
    if (companion.id === 'mori') {
      // Mori 使用多選預設模型
      const moriDefault = 'deepseek/deepseek-chat-v3.1,google/gemini-2.5-flash-lite,x-ai/grok-4-fast:free,openai/gpt-5-mini';
      setRoleDefaultModel(moriDefault);
      const modelIds = moriDefault.split(',').map(id => id.trim()).filter(Boolean);
      setSelectedModelsMulti(modelIds);
      setSelectedModel(DEFAULT_MODEL_SENTINEL);
    } else {
      setSelectedModel('gpt-4o-mini');
      setSelectedModelsMulti([]);
    }
    setDefaultToneForRole(companion.id);
    setDefaultGuidanceForRole(companion.id);
  };

  // 根據角色 ID 設定預設語氣
  const setDefaultToneForRole = (roleId: string) => {
    const toneMap: Record<string, string> = {
      'hibi': '活潑可愛，喜歡用emoji和生動比喻',
      'mori': '專業冷靜，提供準確有根據的資訊',
      'pico': '友善協調，善於團隊合作'
    };
    setRoleTone(toneMap[roleId] || '友善專業');
  };

  // 根據角色 ID 設定預設指引
  const setDefaultGuidanceForRole = (roleId: string) => {
    const guidanceMap: Record<string, string> = {
      'hibi': '你是Hibi，一個活潑可愛的創作助手。你擅長創意寫作、藝術指導和激發靈感。你的語氣總是充滿活力和創意，喜歡用可愛的emoji和生動的比喻來表達想法。',
      'mori': '你是Mori，一個專業的研究員。你擅長資料分析、深度思考和邏輯推理。你的語氣專業而冷靜，總是提供準確、有根據的資訊和分析。',
      'pico': '你是Pico，一個友善的協調者。你擅長團隊合作、專案管理和溝通協調。你的語氣友善而專業，善於促進團隊合作和解決衝突。'
    };
    setRoleGuidance(guidanceMap[roleId] || '你是一個友善的AI助手，樂於幫助用戶解決問題。');
  };

  // 加載預設思維積木（從 role_mind_blocks）
  const loadDefaultMindBlocks = async (roleId: string) => {
    if (!user?.id || !roleId) {
      setDefaultMindBlocks([]);
      return;
    }

    setLoadingModels(true);
    try {
      const supabase = getSaasSupabaseClient();

      // 先獲取角色 ID
      const roleSlug = roleId === 'hibi' ? 'hibi-manager' : roleId === 'mori' ? 'mori-researcher' : 'pico-artist';
      const { data: roleData } = await supabase
        .from('ai_roles')
        .select('id')
        .eq('slug', roleSlug)
        .maybeSingle();

      if (!roleData) {
        setDefaultMindBlocks([]);
        return;
      }

      // 獲取該角色裝備的預設思維積木
      const { data: equipmentData, error: equipmentError } = await supabase
        .from('role_mind_blocks' as any)
        .select('mind_block_id')
        .eq('role_id', (roleData as any).id)
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (equipmentError) {
        console.error('加載預設思維積木失敗:', equipmentError);
        setDefaultMindBlocks([]);
        return;
      }

      if (!equipmentData || equipmentData.length === 0) {
        setDefaultMindBlocks([]);
        return;
      }

      // 獲取思維積木詳情
      const mindBlockIds = equipmentData.map((item: any) => item.mind_block_id);
      const { data: blocksData, error: blocksError } = await supabase
        .from('mind_blocks' as any)
        .select('*')
        .in('id', mindBlockIds);

      if (blocksError) {
        console.error('加載思維積木詳情失敗:', blocksError);
        setDefaultMindBlocks([]);
        return;
      }

      setDefaultMindBlocks((blocksData || []) as any[]);
    } catch (error) {
      console.error('加載預設思維積木異常:', error);
      setDefaultMindBlocks([]);
    } finally {
      setLoadingModels(false);
    }
  };

  // 處理選擇積木並裝備為預設值
  const handleSelectDefaultBlock = async (block: MindBlock) => {
    if (!user?.id || !selectedCompanion) return;

    try {
      const supabase = getSaasSupabaseClient();
      const roleSlug = selectedCompanion.id === 'hibi' ? 'hibi-manager' : selectedCompanion.id === 'mori' ? 'mori-researcher' : 'pico-artist';
      const { data: roleData } = await supabase
        .from('ai_roles')
        .select('id')
        .eq('slug', roleSlug)
        .maybeSingle();

      if (!roleData) {
        const { default: toast } = await import('react-hot-toast');
        toast.error('找不到對應的角色', {
          icon: <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />,
          duration: 2000,
          style: {
            background: '#fff',
            color: '#4B4036',
          }
        });
        return;
      }

      // 檢查是否已經裝備
      const { data: existing } = await supabase
        .from('role_mind_blocks' as any)
        .select('id')
        .eq('role_id', (roleData as any).id)
        .eq('mind_block_id', block.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        // 如果已存在，激活它
        const { error } = await supabase
          .from('role_mind_blocks' as any)
          .update({ is_active: true })
          .eq('id', (existing as any).id);

        if (error) throw error;
      } else {
        // 如果不存在，創建新記錄
        const { error } = await supabase
          .from('role_mind_blocks' as any)
          .insert({
            role_id: (roleData as any).id,
            mind_block_id: block.id,
            user_id: user.id,
            is_active: true
          });

        if (error) throw error;
      }

      // 重新載入預設思維積木
      await loadDefaultMindBlocks(selectedCompanion.id);

      const { default: toast } = await import('react-hot-toast');
      toast.success('已裝備為預設思維積木', {
        icon: <PuzzlePieceIcon className="w-5 h-5 text-green-600" />,
        duration: 2000,
        style: {
          background: '#fff',
          color: '#4B4036',
        }
      });

      setShowBlockSelectionModal(false);
    } catch (error) {
      console.error('裝備預設思維積木失敗:', error);
      const { default: toast } = await import('react-hot-toast');
      toast.error('裝備失敗', {
        icon: <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />,
        duration: 2000,
        style: {
          background: '#fff',
          color: '#4B4036',
        }
      });
    }
  };

  // 積木類型配置映射
  const typeConfigMap: Record<MindBlockType, { label: string; icon: any; color: string }> = {
    role: { label: '角色', icon: UserIcon, color: 'purple' },
    style: { label: '風格', icon: PaintBrushIcon, color: 'pink' },
    task: { label: '任務', icon: ClipboardDocumentIcon, color: 'orange' },
    context: { label: '上下文', icon: GlobeAltIcon, color: 'blue' },
    rule: { label: '規則', icon: ExclamationCircleIcon, color: 'red' },
    variable: { label: '變數', icon: CodeBracketIcon, color: 'indigo' },
    search: { label: '搜尋', icon: MagnifyingGlassIcon, color: 'teal' },
    reason: { label: '推理', icon: LightBulbIcon, color: 'yellow' },
    output: { label: '輸出', icon: ArrowPathIcon, color: 'green' }
  };

  // 自訂類型的預設配置
  const getCustomTypeConfig = (type: string): { label: string; icon: any; color: string } => {
    return {
      label: type.charAt(0).toUpperCase() + type.slice(1),
      icon: CubeIcon,
      color: 'gray'
    };
  };

  // 解析積木包含的所有類型
  const parseBlockTypes = (block: any): Array<{ type: string; isCustom: boolean }> => {
    try {
      const types = new Map<string, boolean>();

      // 方法1: 檢查 block_type 字段
      if (block.block_type) {
        const isCustom = !typeConfigMap[block.block_type as MindBlockType];
        types.set(block.block_type, isCustom);
      }

      // 方法2: 解析 content_json
      const contentJson = block.content_json;
      if (contentJson && contentJson.blocks && Array.isArray(contentJson.blocks)) {
        const traverse = (blocks: any[]) => {
          blocks.forEach((b: any) => {
            if (b.type) {
              const isCustom = !typeConfigMap[b.type as MindBlockType];
              types.set(b.type, isCustom);
            }
            if (b.children && Array.isArray(b.children)) {
              traverse(b.children);
            }
          });
        };
        traverse(contentJson.blocks);
      }

      const typeArray = Array.from(types.entries()).map(([type, isCustom]) => ({ type, isCustom }));

      // 排序
      const priorityOrder: string[] = ['role', 'style', 'task'];
      const sortedTypes = typeArray.sort((a, b) => {
        const aIsCustom = a.isCustom;
        const bIsCustom = b.isCustom;

        if (!aIsCustom && bIsCustom) return -1;
        if (aIsCustom && !bIsCustom) return 1;

        if (!aIsCustom && !bIsCustom) {
          const aIndex = priorityOrder.indexOf(a.type);
          const bIndex = priorityOrder.indexOf(b.type);
          if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
          if (aIndex !== -1) return -1;
          if (bIndex !== -1) return 1;
        }

        return a.type.localeCompare(b.type);
      });

      return sortedTypes;
    } catch (error) {
      console.error('解析積木類型失敗:', error);
      return [];
    }
  };

  // 獲取顏色樣式類名
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

  // 積木類型卡片組件
  const BlockTypeCards = ({ block }: { block: any }) => {
    const types = parseBlockTypes(block);

    if (types.length === 0) {
      return null;
    }

    const maxVisible = 5;
    const visibleTypes = types.slice(0, maxVisible);
    const remainingCount = types.length > maxVisible ? types.length - maxVisible : 0;

    return (
      <div className="flex items-center mt-2 relative">
        {visibleTypes.map((typeInfo, index) => {
          const { type, isCustom } = typeInfo;

          const config = isCustom
            ? getCustomTypeConfig(type)
            : typeConfigMap[type as MindBlockType];

          if (!config) return null;

          const colors = getColorClasses(config.color);
          const Icon = config.icon;

          return (
            <React.Fragment key={type}>
              {index > 0 && (
                <div className="w-1 h-1 rounded-full bg-gray-300 mx-0.5 relative"
                  style={{ top: '20px' }}
                />
              )}
              <div className="flex flex-col items-center gap-0.5 opacity-100">
                <div
                  className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center shadow-sm transition-all ${colors.bg} ${colors.border}`}
                >
                  <Icon className={`w-5 h-5 ${colors.text}`} />
                </div>
                <span className={`text-[9px] font-semibold ${colors.text} leading-tight`}>
                  {config.label}
                </span>
              </div>
            </React.Fragment>
          );
        })}

        {remainingCount > 0 && (
          <>
            {visibleTypes.length > 0 && (
              <div className="w-1 h-1 rounded-full bg-gray-300 mx-0.5 relative"
                style={{ top: '20px' }}
              />
            )}
            <div className="flex flex-col items-center gap-0.5 opacity-100">
              <div className="w-10 h-10 rounded-lg border-2 flex items-center justify-center shadow-sm transition-all bg-gray-50 border-gray-300">
                <span className="text-[10px] font-bold text-gray-600">
                  +{remainingCount}
                </span>
              </div>
              <span className="text-[9px] font-semibold text-gray-600 leading-tight">
                更多
              </span>
            </div>
          </>
        )}
      </div>
    );
  };

  // 檢查是否為預設角色
  const isDefaultRole = (companion: AICompanion) => {
    return ['hibi', 'mori', 'pico'].includes(companion.id);
  };

  // 映射 companion.id 到實際的 slug
  const getRoleSlug = (companionId: string) => {
    const slugMap: Record<string, string> = {
      'hibi': 'hibi-manager',
      'mori': 'mori-researcher',
      'pico': 'pico-artist'
    };
    return slugMap[companionId] || companionId;
  };

  // 獲取角色的模型資訊
  const getCompanionModel = async (companion: AICompanion) => {
    if (companionModels[companion.id]) {
      return companionModels[companion.id];
    }

    try {
      const roleSlug = getRoleSlug(companion.id);

      // 先從資料庫獲取角色資訊
      const { data: roleData } = await supabase
        .from('ai_roles')
        .select('id, default_model')
        .eq('slug', roleSlug)
        .eq('status', 'active')
        .maybeSingle();

      let modelId: string | null = null;

      if (roleData) {
        // 先取系統預設
        const dbDefaultModel = (roleData as any).default_model;
        const systemDefault = (companion.id === 'mori' && (!dbDefaultModel || dbDefaultModel === 'gpt-4o-mini' || !dbDefaultModel.includes(',')))
          ? 'deepseek/deepseek-chat-v3.1,google/gemini-2.5-flash-lite,x-ai/grok-4-fast:free,openai/gpt-5-mini'
          : (dbDefaultModel || 'gpt-4o-mini');

        // 檢查使用者覆寫
        if (user?.id && (roleData as any).id) {
          const { data: userSettings } = await supabase
            .from('user_role_settings')
            .select('model_override')
            .eq('user_id', user.id)
            .eq('role_id', (roleData as any).id)
            .eq('is_active', true)
            .maybeSingle();

          if (userSettings) {
            modelId = (userSettings as any)?.model_override || systemDefault;
          } else {
            modelId = systemDefault;
          }
        } else {
          modelId = systemDefault;
        }
      } else {
        // 使用預設值
        if (companion.id === 'mori') {
          modelId = 'deepseek/deepseek-chat-v3.1,google/gemini-2.5-flash-lite,x-ai/grok-4-fast:free,openai/gpt-5-mini';
        } else {
          modelId = 'gpt-4o-mini';
        }
      }

      // 解析模型顯示名稱
      let displayName = '';
      let food = 1;

      if (modelId && modelId.includes(',')) {
        // 多選模型（Mori）
        const modelIds = modelId.split(',').map(id => id.trim()).filter(Boolean);
        const names = modelIds.map(id => {
          const cleanId = id.replace(/:free/gi, '');
          const m = availableModels.find((x: any) => x.model_id === id || x.model_id === cleanId);
          return m ? stripFree(m.display_name || '') : cleanId;
        });
        displayName = names.join('、');
        // 計算平均食量
        const foods = modelIds.map(id => {
          const cleanId = id.replace(/:free/gi, '');
          const m = availableModels.find((x: any) => x.model_id === id || x.model_id === cleanId);
          return computeFoodFor100(m);
        });
        food = Math.ceil(foods.reduce((a, b) => a + b, 0) / foods.length);
      } else {
        // 單選模型
        const cleanId = modelId?.replace(/:free/gi, '') || '';
        const m = availableModels.find((x: any) => x.model_id === modelId || x.model_id === cleanId);
        displayName = m ? stripFree(m.display_name || '') : (modelId || '');
        food = computeFoodFor100(m);
      }

      const modelInfo = {
        modelId: modelId || '',
        displayName: displayName || modelId || '未設定',
        food
      };

      setCompanionModels(prev => ({
        ...prev,
        [companion.id]: modelInfo
      }));

      return modelInfo;
    } catch (error) {
      console.error('獲取角色模型資訊錯誤:', error);
      return null;
    }
  };

  // 處理角色點選
  const handleCompanionClick = async (companion: AICompanion) => {
    if (clickedCompanionId === companion.id) {
      // 如果已經點選過，隱藏模型資訊
      setClickedCompanionId(null);
    } else {
      // 點選新角色，顯示模型資訊
      setClickedCompanionId(companion.id);
      await getCompanionModel(companion);
    }
  };

  // 載入 AI 角色資料
  const loadAiRoles = async () => {
    if (!user?.id) return;

    setLoadingRoles(true);
    try {
      console.log('🔍 開始載入 AI 角色，用戶 ID:', user.id);
      console.log('🔍 Supabase 客戶端:', supabase);

      const { data, error } = await supabase
        .from('ai_roles')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('載入 AI 角色錯誤:', error);
        console.error('錯誤詳情:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        return;
      }

      console.log('✅ 成功載入 AI 角色:', data);
      console.log('🔍 載入的角色數量:', data?.length || 0);
      setAiRoles(data || []);
    } catch (error) {
      console.error('載入 AI 角色異常:', error);
    } finally {
      setLoadingRoles(false);
    }
  };

  // 保存角色設定
  const handleSaveSettings = async () => {
    if (!selectedCompanion) return;

    try {
      // 解析選定模型（支援預設哨兵值）；若啟用多模型則以逗號串接儲存至 default_model
      const primaryResolved = selectedModel === DEFAULT_MODEL_SENTINEL ? roleDefaultModel : selectedModel;
      const multiResolved = selectedModelsMulti.length > 0 ? selectedModelsMulti : [];
      const resolvedModel = multiResolved.length > 0 ? multiResolved.join(',') : primaryResolved;

      // 統一使用 user_role_settings 表儲存用戶設定
      // 先獲取角色 ID
      const roleSlug = isDefaultRole(selectedCompanion)
        ? getRoleSlug(selectedCompanion.id)
        : selectedCompanion.id;

      const { data: roleData } = await supabase
        .from('ai_roles')
        .select('id')
        .eq('slug', roleSlug)
        .maybeSingle();

      const roleId = (roleData as any)?.id;
      if (!roleId) {
        console.error('找不到角色:', roleSlug);
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

      // 獲取系統預設的指引和語氣以便比較
      const { data: systemRoleData } = await supabase
        .from('ai_roles')
        .select('system_prompt, tone')
        .eq('slug', roleSlug)
        .maybeSingle();

      const systemGuidance = (systemRoleData as any)?.system_prompt || '';
      const systemTone = (systemRoleData as any)?.tone || '';

      // 檢查是否所有設定都是預設值（與系統預設一致）
      const isUsingDefaultModel = selectedModel === DEFAULT_MODEL_SENTINEL;
      // 不再檢查 guidance 和 tone，因為已移除這些設定
      const isUsingDefaultGuidance = true; // 始終視為使用預設
      const isUsingDefaultTone = true; // 始終視為使用預設

      // 如果所有設定都是預設值，刪除 user_role_settings 記錄
      if (isUsingDefaultModel) {
        if (!user?.id) {
          console.error('用戶未登入');
          return;
        }

        const { error } = await supabase
          .from('user_role_settings')
          .delete()
          .eq('user_id', user.id)
          .eq('role_id', roleId);

        if (error) {
          console.error('刪除用戶設定錯誤:', error);
          const { default: toast } = await import('react-hot-toast');
          toast.error(`恢復預設失敗: ${error.message || '未知錯誤'}`, {
            icon: <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />,
            duration: 3000,
            style: {
              background: '#fff',
              color: '#4B4036',
            }
          });
          return;
        }

        const { default: toast } = await import('react-hot-toast');
        toast.success('已恢復為系統預設設定', {
          icon: <ArrowPathIcon className="w-5 h-5 text-green-600" />,
          duration: 2000,
          style: {
            background: '#fff',
            color: '#4B4036',
          }
        });
        return;
      }

      // 儲存或更新 user_role_settings（只儲存非預設的設定）
      if (!user?.id) {
        console.error('用戶未登入');
        return;
      }

      const { data, error } = await (supabase as any)
        .from('user_role_settings')
        .upsert({
          user_id: user.id,
          role_id: roleId,
          model_override: isUsingDefaultModel ? null : resolvedModel,
          guidance_override: null, // 不再保存角色指引
          tone_override: null, // 不再保存角色語氣
          is_active: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,role_id'
        })
        .select()
        .single();

      if (error) {
        console.error('保存角色設定錯誤:', error);
        console.error('錯誤詳情:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
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

      console.log('角色設定已保存:', data);
      const { default: toast } = await import('react-hot-toast');
      toast.success('角色設定已保存', {
        icon: <CpuChipIcon className="w-5 h-5 text-green-600" />,
        duration: 2000,
        style: {
          background: '#fff',
          color: '#4B4036',
        }
      });
    } catch (err) {
      console.error('保存角色設定異常:', err);
    }
  };

  // 還原預設設定（刪除 user_role_settings 記錄，恢復系統預設）
  const handleResetToDefaults = async () => {
    if (!selectedCompanion || !user?.id) return;
    try {
      console.log('[Reset] start', { role: selectedCompanion.id, user: user.id });

      // 獲取角色 ID
      const roleSlug = isDefaultRole(selectedCompanion)
        ? getRoleSlug(selectedCompanion.id)
        : selectedCompanion.id;

      const { data: roleData } = await supabase
        .from('ai_roles')
        .select('id')
        .eq('slug', roleSlug)
        .maybeSingle();

      const roleId = (roleData as any)?.id;
      if (!roleId) {
        console.error('找不到角色:', roleSlug);
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

      // 刪除 user_role_settings 記錄以恢復系統預設
      const { error } = await supabase
        .from('user_role_settings')
        .delete()
        .eq('user_id', user.id)
        .eq('role_id', roleId);

      if (error) {
        console.error('刪除覆寫失敗', error);
        const { default: toast } = await import('react-hot-toast');
        toast.error('還原預設失敗', {
          icon: <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />,
          duration: 2000,
          style: {
            background: '#fff',
            color: '#4B4036',
          }
        });
      } else {
        console.log('[Reset] 覆寫已刪除');
        const { default: toast } = await import('react-hot-toast');
        toast.success('已還原為系統預設設定', {
          icon: <ArrowPathIcon className="w-5 h-5 text-green-600" />,
          duration: 2000,
          style: {
            background: '#fff',
            color: '#4B4036',
          }
        });
      }

      // 重設本地狀態
      setSelectedModelsMulti([]);
      setSelectedModel(DEFAULT_MODEL_SENTINEL);
      // 立即套用系統預設模型（避免等待遠端）
      const systemDefault = selectedCompanion.id === 'mori'
        ? 'deepseek/deepseek-chat-v3.1,google/gemini-2.5-flash-lite,x-ai/grok-4-fast:free,openai/gpt-5-mini'
        : (selectedCompanion.id === 'hibi' ? 'openai/gpt-5' : 'google/gemini-2.5-flash-image-preview');
      setRoleDefaultModel(systemDefault);

      // 如果是 Mori 且是多選模型，立即設置到 selectedModelsMulti
      if (selectedCompanion.id === 'mori' && systemDefault.includes(',')) {
        const modelIds = systemDefault.split(',').map(id => id.trim()).filter(Boolean);
        setSelectedModelsMulti(modelIds);
      }

      // 再重新載入角色資料以確保與資料庫一致（這會重置語氣和指引）
      await handleRoleSettings(selectedCompanion);
    } catch (e) {
      console.error('還原預設失敗:', e);
      const { default: toast } = await import('react-hot-toast');
      toast.error('還原預設失敗', {
        icon: <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />,
        duration: 2000,
        style: {
          background: '#fff',
          color: '#4B4036',
        }
      });
    }
  };

  // 從 Supabase 載入用戶的聊天室
  const loadUserRooms = async () => {
    if (!user?.id) return;

    const saasSupabase = getSaasSupabaseClient();

    try {
      setLoadingRooms(true);

      console.log('🔍 開始載入聊天室，用戶 ID:', user.id);

      // 方法 1: 載入用戶創建的聊天室（簡化權限檢查）
      const { data: allRooms, error: allRoomsError } = await saasSupabase
        .from('ai_rooms')
        .select('id, title, description, room_type, last_message_at, created_at, created_by')
        .eq('is_archived', false)
        .eq('created_by', user.id)  // 只載入用戶創建的房間
        .order('last_message_at', { ascending: false })
        .limit(20) as { data: any[] | null; error: any };

      if (allRoomsError) {
        console.error('❌ 載入聊天室失敗:', allRoomsError);
        console.log('🔧 嘗試不含角色的基本查詢...');

        // 方法 2: 不含角色資料的基本查詢
        const { data: basicRooms, error: basicError } = await saasSupabase
          .from('ai_rooms')
          .select('id, title, description, room_type, last_message_at, created_at, created_by')
          .eq('is_archived', false)
          .order('last_message_at', { ascending: false })
          .limit(20) as { data: any[] | null; error: any };

        if (basicError) {
          console.error('❌ 基本查詢也失敗:', basicError);
          console.log('📝 這表示權限或表格配置有問題');
          setRooms([]);
          setLoadingRooms(false);
          return;
        } else {
          console.log('✅ 基本查詢成功，將使用備用邏輯處理角色');
          // 使用基本查詢的結果，但沒有 role_instances 資料
          if (basicRooms && basicRooms.length > 0) {
            const userRelatedRooms = basicRooms.filter(room =>
              room.created_by === user.id ||
              room.title.includes('測試')
            );

            console.log('🎯 用戶相關聊天室:', userRelatedRooms.length, '個');

            // 處理沒有 role_instances 的房間
            const roomsWithStats = await Promise.all(userRelatedRooms.map(async (room) => {
              // 沒有資料庫角色資料，使用標題/描述推斷
              let activeRoles: string[] = [];

              console.log('處理房間（無角色資料）:', room.title, room.description);

              // 使用標題和描述推斷角色
              if (room.title.includes('Hibi')) activeRoles.push('Hibi');
              if (room.title.includes('墨墨') || room.title.includes('Mori')) activeRoles.push('墨墨');
              if (room.title.includes('皮可') || room.title.includes('Pico')) activeRoles.push('皮可');

              if (room.description?.includes('Hibi') && !activeRoles.includes('Hibi')) activeRoles.push('Hibi');
              if ((room.description?.includes('墨墨') || room.description?.includes('Mori')) && !activeRoles.includes('墨墨')) activeRoles.push('墨墨');
              if ((room.description?.includes('皮可') || room.description?.includes('Pico')) && !activeRoles.includes('皮可')) activeRoles.push('皮可');

              // 如果仍然沒有角色，嘗試從 sessionStorage 獲取
              if (activeRoles.length === 0 && typeof window !== 'undefined') {
                const sessionKey = `room_${room.id}_roles`;
                const sessionRoles = sessionStorage.getItem(sessionKey);
                if (sessionRoles) {
                  try {
                    const parsedRoles = JSON.parse(sessionRoles);
                    if (Array.isArray(parsedRoles) && parsedRoles.length > 0) {
                      // 將 sessionStorage 中的角色 ID 轉換為顯示名稱
                      activeRoles = parsedRoles.map(roleId => {
                        if (roleId === 'hibi') return 'Hibi';
                        if (roleId === 'mori') return '墨墨';
                        if (roleId === 'pico') return '皮可';
                        return roleId;
                      });
                      console.log('📱 從 sessionStorage 恢復角色:', activeRoles);
                    }
                  } catch (error) {
                    console.log('⚠️ sessionStorage 解析失敗:', error);
                  }
                }

                // 最後的預設邏輯
                if (activeRoles.length === 0) {
                  activeRoles = ['墨墨'];
                }
              }

              console.log('房間最終角色（備用邏輯）:', room.title, '→', activeRoles);

              const roomDisplay = await buildRoomDisplay(room, activeRoles, 1);
              return roomDisplay;
            }));

            setRooms(roomsWithStats);
            console.log('✅ 載入了', roomsWithStats.length, '個聊天室（使用備用邏輯）');
          } else {
            setRooms([]);
          }
          setLoadingRooms(false);
          return;
        }
      } else {
        console.log('✅ 成功載入聊天室:', allRooms?.length || 0, '個');

        if (allRooms && allRooms.length > 0) {
          // 篩選用戶相關的聊天室（前端篩選）
          const userRelatedRooms = allRooms.filter(room =>
            room.created_by === user.id ||
            room.title.includes('測試') // 暫時包含測試聊天室
          );

          console.log('🎯 用戶相關聊天室:', userRelatedRooms.length, '個');

          // 處理聊天室資料
          if (userRelatedRooms.length > 0) {
            // 為每個房間查詢角色資料
            const roomsWithStats = await Promise.all(userRelatedRooms.map(async (room) => {
              // 從資料庫獲取的實際角色資料
              let activeRoles: string[] = [];

              // 調試日誌
              console.log('處理房間:', room.title);

              // 查詢該房間的角色資料（三步查詢避免關聯問題）
              try {
                // 第一步：查 room_roles 取得 role_instance_id
                const { data: roomRoleLinks, error: roomRolesError } = await saasSupabase
                  .from('room_roles')
                  .select('role_instance_id')
                  .eq('room_id', room.id)
                  .eq('is_active', true);

                if (roomRolesError) {
                  console.log('⚠️ 查詢房間角色關聯失敗:', roomRolesError.message);
                } else if (roomRoleLinks && roomRoleLinks.length > 0) {
                  const roleInstanceIds = roomRoleLinks.map((r: any) => r.role_instance_id).filter(Boolean);

                  // 第二步：查 role_instances 取得 role_id
                  const { data: roleInstances, error: roleInstancesError } = await saasSupabase
                    .from('role_instances')
                    .select('id, role_id, nickname')
                    .in('id', roleInstanceIds);

                  if (roleInstancesError) {
                    console.log('⚠️ 查詢角色實例失敗:', roleInstancesError.message);
                  } else if (roleInstances && roleInstances.length > 0) {
                    const roleIds = roleInstances.map((ri: any) => ri.role_id).filter(Boolean);

                    // 第三步：查 ai_roles 取得角色資訊
                    const { data: aiRoles, error: aiRolesError } = await saasSupabase
                      .from('ai_roles')
                      .select('id, name, slug')
                      .in('id', roleIds);

                    if (aiRolesError) {
                      console.log('⚠️ 查詢 AI 角色失敗:', aiRolesError.message);
                    } else if (aiRoles && aiRoles.length > 0) {
                      console.log('✅ 找到角色資料:', aiRoles.length, '個');
                      activeRoles = roleInstances
                        .map((instance: any) => {
                          const aiRole = aiRoles.find((ar: any) => ar.id === instance.role_id);
                          if (!aiRole) return null;

                          const roleName = (aiRole as any).name || instance.nickname;
                          // 標準化角色名稱
                          if (roleName === 'Hibi' || roleName?.includes('Hibi')) return 'Hibi';
                          if (roleName === 'Mori' || roleName?.includes('墨墨') || roleName?.includes('Mori')) return '墨墨';
                          if (roleName === 'Pico' || roleName?.includes('皮可') || roleName?.includes('Pico')) return '皮可';
                          return roleName; // 保持原名稱
                        })
                        .filter(Boolean); // 移除空值
                    }
                  }
                }
              } catch (error) {
                console.log('⚠️ 查詢角色資料時發生錯誤:', error);
              }

              // 如果資料庫中沒有角色資料，僅記錄訊息而不顯示警告
              if (activeRoles.length === 0) {
                console.log('ℹ️ 此聊天室目前無角色資料或無法從資料庫讀取，嘗試從 sessionStorage 獲取備份');

                // 先嘗試從 sessionStorage 獲取
                if (typeof window !== 'undefined') {
                  const sessionKey = `room_${room.id}_roles`;
                  const sessionRoles = sessionStorage.getItem(sessionKey);
                  if (sessionRoles) {
                    try {
                      const parsedRoles = JSON.parse(sessionRoles);
                      if (Array.isArray(parsedRoles) && parsedRoles.length > 0) {
                        // 將 sessionStorage 中的角色 ID 轉換為顯示名稱
                        activeRoles = parsedRoles.map(roleId => {
                          if (roleId === 'hibi') return '希希';
                          if (roleId === 'mori') return '墨墨';
                          if (roleId === 'pico') return '皮可';
                          return roleId;
                        });
                        console.log('📱 從 sessionStorage 恢復角色:', activeRoles);
                      }
                    } catch (error) {
                      console.log('⚠️ sessionStorage 解析失敗:', error);
                    }
                  }
                }

                // 如果 sessionStorage 也沒有，使用標題/描述推斷
                // 使用 Set 來避免重複角色
                const uniqueRoles = new Set<string>(activeRoles);

                // 基於房間標題推斷角色（與聊天室頁面保持一致）
                const roomTitle = room.title?.toLowerCase() || '';

                if (roomTitle.includes('繪本') || roomTitle.includes('圖') || roomTitle.includes('創作') || roomTitle.includes('設計') ||
                  roomTitle.includes('畫') || roomTitle.includes('藝術') || roomTitle.includes('美術') || roomTitle.includes('視覺') ||
                  roomTitle.includes('插畫') || roomTitle.includes('繪畫') || roomTitle.includes('圖像') || roomTitle.includes('視覺化')) {
                  uniqueRoles.add('皮可');
                } else if (roomTitle.includes('研究') || roomTitle.includes('分析') || roomTitle.includes('調查') ||
                  roomTitle.includes('資料') || roomTitle.includes('資訊') || roomTitle.includes('知識') ||
                  roomTitle.includes('學習') || roomTitle.includes('探索') || roomTitle.includes('能力') ||
                  roomTitle.includes('成長') || roomTitle.includes('發展') || roomTitle.includes('評估') ||
                  roomTitle.includes('教學') || roomTitle.includes('教育') || roomTitle.includes('課程')) {
                  uniqueRoles.add('墨墨');
                } else if (roomTitle.includes('統籌') || roomTitle.includes('協作') || roomTitle.includes('管理') ||
                  roomTitle.includes('專案') || roomTitle.includes('計劃') || roomTitle.includes('規劃') ||
                  roomTitle.includes('團隊') || roomTitle.includes('合作') || roomTitle.includes('整合') ||
                  roomTitle.includes('組織') || roomTitle.includes('安排') || roomTitle.includes('協調')) {
                  uniqueRoles.add('Hibi');
                }

                // 檢查標題中的角色名稱
                if (room.title.includes('Hibi')) uniqueRoles.add('Hibi');
                if (room.title.includes('墨墨') || room.title.includes('Mori')) uniqueRoles.add('墨墨');
                if (room.title.includes('皮可') || room.title.includes('Pico')) uniqueRoles.add('皮可');

                // 檢查描述中的角色
                if (room.description?.includes('Hibi')) uniqueRoles.add('Hibi');
                if (room.description?.includes('墨墨') || room.description?.includes('Mori')) uniqueRoles.add('墨墨');
                if (room.description?.includes('皮可') || room.description?.includes('Pico')) uniqueRoles.add('皮可');

                activeRoles = Array.from(uniqueRoles);

                // 最後的預設邏輯：根據房間類型推斷
                if (activeRoles.length === 0) {
                  const isPersonalChat = room.title.includes('與') && room.title.includes('的對話');
                  if (isPersonalChat) {
                    activeRoles = ['墨墨']; // 個人對話預設為墨墨
                  } else {
                    activeRoles = ['墨墨']; // 未知房間預設為墨墨（避免顯示全部角色）
                  }
                }
              }

              // 調試日誌 - 最終角色
              console.log('房間最終角色:', room.title, '→', activeRoles);

              const roomDisplay = await buildRoomDisplay(room, activeRoles, 1);
              return roomDisplay;
            }));

            setRooms(roomsWithStats);
            console.log(`✅ 載入了 ${roomsWithStats.length} 個聊天室`);
          } else {
            console.log('📝 沒有找到用戶相關的聊天室');
            setRooms([]);
          }
        } else {
          console.log('📝 沒有找到任何聊天室');
          setRooms([]);
        }
      }
    } catch (error) {
      console.error('❌ 載入聊天室錯誤:', error);
    } finally {
      setLoadingRooms(false);
    }
  };

  // 監聽 Realtime 更新以即時更新列表
  useEffect(() => {
    if (!user?.id) return;

    console.log('📡 [列表] 開始監聽 ai_messages 更新...');
    const channel = saasSupabaseClient
      .channel('room-list-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_messages',
        },
        (payload) => {
          const newMessage = payload.new;
          console.log('📨 [列表] 收到新訊息更新:', newMessage.room_id);

          setRooms((prevRooms) => {
            return prevRooms.map((room) => {
              if (room.id === newMessage.room_id) {
                // 格式化新訊息預覽
                const preview = formatMessagePreview(newMessage);
                console.log(`📝 [列表] 更新房間 ${room.title} 的最新訊息: ${preview}`);

                return {
                  ...room,
                  lastMessage: preview,
                  lastActivity: new Date(newMessage.created_at),
                  messageCount: (room.messageCount || 0) + 1,
                };
              }
              return room;
            });
          });
        }
      )
      .subscribe((status) => {
        console.log('📡 [列表] 訂閱狀態:', status);
      });

    return () => {
      console.log('📡 [列表] 停止監聽更新');
      saasSupabaseClient.removeChannel(channel);
    };
  }, [user?.id]); // 只在用戶 ID 改變時重新訂閱

  // 當用戶登入時載入聊天室和 AI 角色
  useEffect(() => {
    if (user?.id) {
      loadUserRooms();
      loadAiRoles();
      loadAvailableModels();
    }
  }, [user?.id]);

  // 同步 modelSearch 與 selectedModel（當 availableModels 載入完成後）
  useEffect(() => {
    if (availableModels.length === 0) return;

    if (selectedModel === DEFAULT_MODEL_SENTINEL) {
      // 如果選擇預設，清空輸入框讓 placeholder 顯示預設模型名稱
      setModelSearch('');
    } else {
      // 如果選擇了具體模型，顯示該模型的顯示名稱
      const selectedModelData = availableModels.find((m: any) => m.model_id === selectedModel);
      if (selectedModelData) {
        setModelSearch(stripFree(selectedModelData.display_name || selectedModel));
      }
    }
  }, [availableModels, selectedModel]);

  // 當 availableModels 載入完成且有點選的角色時，重新獲取模型資訊
  useEffect(() => {
    if (availableModels.length > 0 && clickedCompanionId) {
      const companion = companions.find(c => c.id === clickedCompanionId);
      if (companion) {
        getCompanionModel(companion);
      }
    }
  }, [availableModels, clickedCompanionId]);

  // 計算下拉選單位置
  useEffect(() => {
    const updateDropdownPosition = () => {
      if (modelSelectOpen && modelInputRef.current) {
        const rect = modelInputRef.current.getBoundingClientRect();
        // 使用 fixed 定位時，getBoundingClientRect() 返回的是相對於視窗的位置
        // 不需要加上 window.scrollY 和 window.scrollX
        setDropdownPosition({
          top: rect.bottom + 4, // 只加上間距
          left: rect.left,
          width: rect.width
        });
      } else {
        setDropdownPosition(null);
      }
    };

    updateDropdownPosition();

    // 監聽滾動和視窗大小改變
    if (modelSelectOpen) {
      // 使用 requestAnimationFrame 確保在瀏覽器重繪前更新位置
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

    // 如果沒有監聽器，返回 undefined（清理函數是可選的）
    return undefined;
  }, [modelSelectOpen]);

  // 點擊外部關閉模型選擇下拉選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // 檢查點擊是否在輸入框或下拉選單內部
      const isClickInsideInput = modelSelectRef.current?.contains(target);
      const isClickInsideDropdown = (event.target as HTMLElement)?.closest('[data-model-dropdown]');

      if (!isClickInsideInput && !isClickInsideDropdown) {
        setModelSelectOpen(false);
      }
    };

    if (modelSelectOpen && typeof document !== 'undefined') {
      // 使用 setTimeout 確保 Portal 已經渲染
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
    }

    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('mousedown', handleClickOutside);
      }
    };
  }, [modelSelectOpen]);

  // 監聽聊天室更新通知
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'rooms_need_refresh') {
        console.log('🔄 檢測到聊天室更新，重新載入...');
        loadUserRooms();
        // 清除標記
        if (typeof window !== 'undefined') {
          localStorage.removeItem('rooms_need_refresh');
        }
      }
    };

    const handleFocus = () => {
      // 當頁面重新獲得焦點時，檢查是否需要刷新
      if (typeof window !== 'undefined' && localStorage.getItem('rooms_need_refresh')) {
        console.log('🔄 頁面重新獲得焦點，檢測到更新通知');
        loadUserRooms();
        localStorage.removeItem('rooms_need_refresh');
      }
    };

    // 定期檢查 sessionStorage 變化（因為 sessionStorage 不會觸發跨頁面事件）
    const intervalId = setInterval(() => {
      if (rooms.length > 0 && typeof window !== 'undefined') {
        // 檢查是否有任何房間的 sessionStorage 資料更新了
        let needsRefresh = false;
        rooms.forEach(room => {
          const sessionKey = `room_${room.id}_roles`;
          const sessionRoles = sessionStorage.getItem(sessionKey);
          if (sessionRoles) {
            try {
              const parsedRoles = JSON.parse(sessionRoles);
              if (parsedRoles.length !== room.activeRoles.length) {
                needsRefresh = true;
              }
            } catch (error) {
              // 忽略解析錯誤
            }
          }
        });

        if (needsRefresh) {
          console.log('🔄 檢測到 sessionStorage 變化，重新載入聊天室...');
          loadUserRooms();
        }
      }
    }, 2000); // 每2秒檢查一次

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('focus', handleFocus);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorageChange);
      }
      clearInterval(intervalId);
    };
  }, [rooms]);

  const companions: AICompanion[] = [
    {
      id: 'hibi',
      name: '希希',
      nameEn: 'Hibi',
      description: '預設主助理狐狸，處理日常問題、教學、行政和簡單決策',
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

  const truncatePreview = useCallback((value: string, maxLength = 50) => {
    if (!value) return '';
    const singleLine = value.replace(/\s+/g, ' ').trim();
    if (!singleLine) return '';
    if (singleLine.length <= maxLength) return singleLine;
    return `${singleLine.slice(0, maxLength)}…`;
  }, []);

  const formatMessagePreview = useCallback((message: any) => {
    if (!message) return '點擊進入對話...';

    const rawContent = typeof message?.content === 'string' ? message.content.trim() : '';
    if (rawContent) {
      if (/!\[[^\]]*\]\([^)]*\)/.test(rawContent)) {
        return '（圖片）';
      }
      if (/https?:\/\/[^\s]+\.(png|jpe?g|gif|webp)(\?|$)/i.test(rawContent)) {
        return '（圖片）';
      }
      if (/https?:\/\/[^\s]+\.(mp4|mov|avi|webm)(\?|$)/i.test(rawContent)) {
        return '（影片）';
      }
      return truncatePreview(rawContent);
    }

    let contentJson = message?.content_json ?? null;
    if (typeof contentJson === 'string') {
      try {
        contentJson = JSON.parse(contentJson);
      } catch (error) {
        contentJson = null;
      }
    }

    const detectMedia = (data: any, keywords: RegExp) => {
      try {
        const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
        return keywords.test(jsonString.toLowerCase());
      } catch (error) {
        return false;
      }
    };

    const extractText = (node: any): string | null => {
      if (!node) return null;
      if (typeof node === 'string') {
        const trimmed = node.trim();
        return trimmed || null;
      }
      if (Array.isArray(node)) {
        for (const item of node) {
          const result = extractText(item);
          if (result) return result;
        }
        return null;
      }
      if (typeof node === 'object') {
        if (typeof node.text === 'string' && node.text.trim()) return node.text.trim();
        if (typeof node.content === 'string' && node.content.trim()) return node.content.trim();
        if (Array.isArray(node.content)) {
          const fromContent = extractText(node.content);
          if (fromContent) return fromContent;
        }
        if (Array.isArray(node.parts)) {
          const fromParts = extractText(node.parts);
          if (fromParts) return fromParts;
        }
        if (Array.isArray(node.messages)) {
          const fromMessages = extractText(node.messages);
          if (fromMessages) return fromMessages;
        }
        for (const value of Object.values(node)) {
          const result = extractText(value);
          if (result) return result;
        }
      }
      return null;
    };

    if (contentJson) {
      if (detectMedia(contentJson, /(image_url|"image"|\.png|\.jpe?g|\.gif|\.webp)/)) {
        return '（圖片）';
      }
      if (detectMedia(contentJson, /(video_url|"video"|\.mp4|\.mov|\.avi|\.webm)/)) {
        return '（影片）';
      }
      const extracted = extractText(contentJson);
      if (extracted) {
        return truncatePreview(extracted);
      }
    }

    return '（系統訊息）';
  }, [truncatePreview]);

  const fetchRoomMessageStats = useCallback(async (roomId: string) => {
    const defaults = {
      lastMessage: '點擊進入對話...',
      lastActivity: null as Date | null,
      messageCount: 0,
    };

    if (!roomId) return defaults;

    try {
      const latestPromise = saasSupabaseClient
        .from('ai_messages')
        .select('id, content, content_json, created_at, status')
        .eq('room_id', roomId)
        .neq('status', 'deleted') // 確保不計算已刪除的訊息
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const countPromise = saasSupabaseClient
        .from('ai_messages')
        .select('id', { count: 'exact', head: true })
        .eq('room_id', roomId)
        .neq('status', 'deleted');

      const [latestResult, countResult] = await Promise.all([latestPromise, countPromise]);

      if (latestResult.error) {
        console.warn('⚠️ 無法取得最新訊息:', latestResult.error);
      }

      if (countResult.error) {
        console.warn('⚠️ 無法取得訊息數量:', countResult.error);
      }

      const latestMessage = latestResult.data as { created_at?: string | null, content?: string, id?: string } | null;

      // Debug logging for stale data investigation
      if (roomId.includes('team') || roomId.includes('project') || (latestMessage && latestMessage.content?.includes('Hibi'))) {
        console.log(`🔍 [RoomStats] Room ${roomId}:`, {
          latestId: latestMessage?.id,
          latestTime: latestMessage?.created_at,
          latestContent: latestMessage?.content?.substring(0, 20),
          count: countResult.count
        });
      }

      const lastMessagePreview = formatMessagePreview(latestMessage);
      const lastActivity = latestMessage?.created_at ? new Date(latestMessage.created_at) : null;

      return {
        lastMessage: lastMessagePreview,
        lastActivity,
        messageCount: typeof countResult.count === 'number' ? countResult.count : defaults.messageCount,
      };
    } catch (error) {
      console.error('❌ 取得聊天室統計失敗:', error);
      return defaults;
    }
  }, [saasSupabaseClient, formatMessagePreview]);

  const buildRoomDisplay = useCallback(async (room: any, activeRoles: string[], memberCount = 1) => {
    const stats = await fetchRoomMessageStats(room.id);
    const fallbackTimestamp = room?.last_message_at || room?.created_at;
    const fallbackDate = fallbackTimestamp ? new Date(fallbackTimestamp) : new Date();

    return {
      id: room.id,
      title: room.title,
      description: room.description || '',
      lastMessage: stats.lastMessage,
      lastActivity: stats.lastActivity ?? fallbackDate,
      memberCount,
      activeRoles: activeRoles.length > 0 ? activeRoles : ['墨墨'],
      messageCount: stats.messageCount,
      status: 'active' as const,
    };
  }, [fetchRoomMessageStats]);

  const handleStartChat = (companion: AICompanion) => {
    console.log('🚀 開始對話按鈕被點擊:', companion.name);

    if (!user?.id) {
      console.error('❌ 用戶未登入，無法開始對話');
      return;
    }

    // 顯示專案資訊填寫模態框
    setSelectedCompanionForProject(companion);
    setShowProjectModal(true);
  };

  const handleCreateChatWithProject = async (projectData: { title: string; description: string }) => {
    if (!selectedCompanionForProject || !user?.id) return;

    const companion = selectedCompanionForProject;

    if (creatingChat === companion.id) {
      console.log('⏳ 正在創建聊天室，請稍候...');
      return;
    }

    setCreatingChat(companion.id);
    console.log('✅ 開始創建專案聊天室，專案:', projectData.title);

    try {
      // 在 Supabase 中創建專案聊天室（初始團隊成員：選中的角色）
      const saasSupabase = getSaasSupabaseClient();
      const { data: newRoom, error: roomError } = await (saasSupabase
        .from('ai_rooms') as any)
        .insert({
          title: projectData.title || `${companion.name} 專案`,
          description: projectData.description || `由 ${companion.name} 開始的專案協作空間`,
          room_type: 'project',
          created_by: user.id
        })
        .select()
        .single();

      if (roomError) {
        console.error('❌ 創建專案聊天室失敗:', roomError);

        // 如果是表格不存在的錯誤，直接跳轉到模擬聊天室
        if (roomError.message?.includes('relation') || roomError.message?.includes('does not exist')) {
          console.log('📝 資料庫表格未創建，使用模擬聊天室');
          const tempRoomId = `temp_${companion.id}_${Date.now()}`;
          router.push(`/aihome/ai-companions/chat/room/${tempRoomId}?companion=${companion.id}`);
        }
        return;
      }

      // 添加用戶為房間成員
      const { error: memberError } = await (saasSupabase
        .from('room_members') as any)
        .insert({
          room_id: newRoom.id,
          user_id: user.id,
          role: 'owner',
          user_type: 'hanami_user'
        });

      if (memberError) {
        // 如果是重複鍵錯誤，表示用戶已經存在，這是正常的
        if (memberError.code === '23505') {
          console.log('✅ 用戶已是房間成員（重複鍵錯誤）');
        } else {
          console.error('❌ 添加房間成員失敗:', memberError);
        }
      }

      // 為房間添加指定的 AI 角色
      try {
        console.log('🤖 為房間添加 AI 角色:', companion.id);

        // 首先查詢角色實例表，看看是否有對應的角色實例
        const { data: roleInstance, error: roleInstanceError } = await saasSupabase
          .from('role_instances')
          .select('id, settings')
          .eq('ai_role_slug', companion.id)
          .single();

        if (roleInstanceError) {
          console.log('⚠️ 未找到角色實例，可能需要先創建:', roleInstanceError);
        } else if (roleInstance) {
          // 載入預設思維積木（從 role_mind_blocks）
          const roleSlug = companion.id === 'hibi' ? 'hibi-manager' : companion.id === 'mori' ? 'mori-researcher' : 'pico-artist';
          const { data: roleData } = await saasSupabase
            .from('ai_roles')
            .select('id')
            .eq('slug', roleSlug)
            .maybeSingle();

          let defaultEquippedBlocks = {};
          if (roleData && user?.id) {
            // 獲取該角色裝備的預設思維積木
            const { data: equipmentData } = await saasSupabase
              .from('role_mind_blocks' as any)
              .select('mind_block_id')
              .eq('role_id', (roleData as any).id)
              .eq('user_id', user.id)
              .eq('is_active', true);

            if (equipmentData && equipmentData.length > 0) {
              // 獲取思維積木詳情
              const mindBlockIds = equipmentData.map((item: any) => item.mind_block_id);
              const { data: blocksData } = await saasSupabase
                .from('mind_blocks' as any)
                .select('*')
                .in('id', mindBlockIds);

              if (blocksData && blocksData.length > 0) {
                // 將預設思維積木設置到 equipped_blocks
                // 假設第一個積木作為 role，第二個作為 style，第三個作為 task
                const blocks = blocksData as any[];
                if (blocks[0]) defaultEquippedBlocks = { ...defaultEquippedBlocks, role: blocks[0] };
                if (blocks[1]) defaultEquippedBlocks = { ...defaultEquippedBlocks, style: blocks[1] };
                if (blocks[2]) defaultEquippedBlocks = { ...defaultEquippedBlocks, task: blocks[2] };
              }
            }
          }

          // 如果 role_instance 還沒有 equipped_blocks，則設置預設值
          const currentSettings = (roleInstance as any).settings || {};
          const currentEquipped = currentSettings.equipped_blocks || {};

          // 只有在當前沒有裝備積木時，才使用預設值
          const hasEquipped = !!currentEquipped.role || !!currentEquipped.style || !!currentEquipped.task;
          const finalEquippedBlocks = hasEquipped ? currentEquipped : defaultEquippedBlocks;

          // 如果有預設積木且當前沒有裝備，則更新 role_instance
          if (Object.keys(defaultEquippedBlocks).length > 0 && !hasEquipped) {
            // 構建 system prompt
            let newSystemPrompt = '';
            const { data: fullRoleData } = await saasSupabase
              .from('ai_roles')
              .select('system_prompt')
              .eq('slug', roleSlug)
              .maybeSingle();

            newSystemPrompt = (fullRoleData as any)?.system_prompt || '';
            if (finalEquippedBlocks.role) newSystemPrompt += `\n\n[Role Definition]\n${(finalEquippedBlocks.role as any).content_json?.blocks?.[0]?.params?.content || ''}`;
            if (finalEquippedBlocks.style) newSystemPrompt += `\n\n[Style Guide]\n${(finalEquippedBlocks.style as any).content_json?.blocks?.[0]?.params?.content || ''}`;
            if (finalEquippedBlocks.task) newSystemPrompt += `\n\n[Current Task]\n${(finalEquippedBlocks.task as any).content_json?.blocks?.[0]?.params?.content || ''}`;

            // 更新 role_instance
            await saasSupabase
              .from('role_instances')
              .update({
                settings: {
                  ...currentSettings,
                  equipped_blocks: finalEquippedBlocks
                },
                system_prompt_override: newSystemPrompt
              })
              .eq('id', (roleInstance as any).id);
          }

          // 插入房間角色關聯
          const { error: roomRoleError } = await (saasSupabase
            .from('room_roles') as any)
            .insert({
              room_id: newRoom.id,
              role_instance_id: (roleInstance as any).id,
              is_active: true
            });

          if (roomRoleError) {
            console.error('❌ 添加房間角色失敗:', roomRoleError);
          } else {
            console.log('✅ 成功為房間添加角色:', companion.id);
          }
        }
      } catch (error) {
        console.error('❌ 添加房間角色時發生錯誤:', error);
      }

      // 創建前端顯示的房間物件
      const displayRoom: AIRoom = {
        id: newRoom.id,
        title: projectData.title || `${companion.name} 專案`,
        description: projectData.description || `由 ${companion.name} 開始的專案協作空間`,
        lastMessage: '專案已創建，歡迎開始協作！',
        lastActivity: new Date(),
        memberCount: 1,
        activeRoles: [companion.name],
        messageCount: 0,
        status: 'active'
      };

      setRooms(prev => [displayRoom, ...prev]);

      console.log('✅ 專案聊天室創建成功:', newRoom.id);

      // 直接跳轉到新創建的專案聊天室（初始團隊成員：選中的角色）
      const chatUrl = `/aihome/ai-companions/chat/room/${newRoom.id}?initialRole=${companion.id}`;
      console.log('🔄 準備跳轉到:', chatUrl);
      router.push(chatUrl);
    } catch (error) {
      console.error('❌ 創建專案聊天室錯誤:', error);
    } finally {
      setCreatingChat(null);
      setShowProjectModal(false);
      setSelectedCompanionForProject(null);
    }
  };

  // 快速開始協作 - 顯示角色選擇視窗
  const handleQuickCollaborate = () => {
    if (!user?.id) {
      console.error('❌ 用戶未登入，無法開始協作');
      return;
    }

    // 顯示角色選擇視窗
    setShowRoleSelectionModal(true);
  };

  // 創建團隊協作專案（從角色選擇視窗調用）
  const createTeamCollaborationProject = async (selectedRoles: string[]) => {
    if (!user?.id) {
      console.error('❌ 用戶未登入，無法開始協作');
      return;
    }

    try {
      setCreatingChat('team');
      console.log('✅ 開始創建團隊協作專案...', selectedRoles);

      const saasSupabase = getSaasSupabaseClient();

      // 創建團隊協作聊天室
      const { data: newRoom, error: roomError } = await (saasSupabase
        .from('ai_rooms') as any)
        .insert({
          title: '團隊協作專案',
          description: `${selectedRoles.join('、')}的協作空間`,
          room_type: 'project',
          created_by: user.id
        })
        .select()
        .single();

      if (roomError) {
        console.error('❌ 創建團隊協作專案失敗:', roomError);
        return;
      }

      // 添加用戶為房間成員
      const { error: memberError } = await (saasSupabase
        .from('room_members') as any)
        .insert({
          room_id: newRoom.id,
          user_id: user.id,
          role: 'owner',
          user_type: 'hanami_user'
        });

      if (memberError) {
        // 如果是重複鍵錯誤，表示用戶已經存在，這是正常的
        if (memberError.code === '23505') {
          console.log('✅ 用戶已是房間成員（重複鍵錯誤）');
        } else {
          console.error('❌ 添加房間成員失敗:', memberError);
        }
      }

      // 為每個選中的角色創建 room_roles 和 role_instances
      for (const roleName of selectedRoles) {
        // 將角色名稱映射到對應的 slug
        const roleNameToSlug: { [key: string]: string } = {
          '希希': 'hibi-manager',
          'Hibi': 'hibi-manager', // 兼容舊代碼
          '墨墨': 'mori-researcher',
          '皮可': 'pico-artist'
        };

        const roleSlug = roleNameToSlug[roleName] || roleName.toLowerCase();

        // 首先獲取對應的 AI 角色 ID
        const { data: aiRole, error: aiRoleError } = await (saasSupabase
          .from('ai_roles') as any)
          .select('id, slug')
          .eq('slug', roleSlug)
          .single();

        if (aiRoleError || !aiRole) {
          console.error(`❌ 找不到 AI 角色: ${roleName}`, aiRoleError);
          continue;
        }

        // 先創建 role_instances 記錄
        const { data: roleInstance, error: roleInstanceError } = await (saasSupabase
          .from('role_instances') as any)
          .insert({
            room_id: newRoom.id,
            role_id: aiRole.id,
            is_active: true
          })
          .select()
          .single();

        if (roleInstanceError) {
          console.error(`❌ 創建 role_instances 失敗: ${roleName}`, roleInstanceError);
          continue;
        }

        // 創建 room_roles 記錄
        const { error: roomRoleError } = await (saasSupabase
          .from('room_roles') as any)
          .insert({
            room_id: newRoom.id,
            role_instance_id: roleInstance.id,
            is_active: true
          });

        if (roomRoleError) {
          console.error(`❌ 創建 room_roles 失敗: ${roleName}`, roomRoleError);
        } else {
          console.log(`✅ 成功添加角色到房間: ${roleName}`);
        }
      }

      // 創建前端顯示的房間物件
      const displayRoom: AIRoom = {
        id: newRoom.id,
        title: '團隊協作專案',
        description: `${selectedRoles.join('、')}的協作空間`,
        lastMessage: '團隊協作專案已創建，歡迎開始！',
        lastActivity: new Date(),
        memberCount: 1,
        activeRoles: selectedRoles,
        messageCount: 0,
        status: 'active'
      };

      setRooms(prev => [displayRoom, ...prev]);

      console.log('✅ 團隊協作專案創建成功:', newRoom.id);

      // 直接跳轉到新創建的聊天室
      const chatUrl = `/aihome/ai-companions/chat/room/${newRoom.id}`;
      console.log('🔄 準備跳轉到團隊協作專案:', chatUrl);
      router.push(chatUrl);
    } catch (error) {
      console.error('❌ 創建團隊協作專案錯誤:', error);
    } finally {
      setCreatingChat(null);
      setShowRoleSelectionModal(false);
    }
  };

  const handleCreateProjectRoom = async (roomData: { title: string; description: string; selectedRoles: string[] }) => {
    if (!user?.id) {
      console.error('❌ 用戶未登入，無法創建聊天室');
      return;
    }

    try {
      const saasSupabase = getSaasSupabaseClient();

      // 在 Supabase 中創建聊天室
      const { data: newRoom, error: roomError } = await (saasSupabase
        .from('ai_rooms') as any)
        .insert({
          title: roomData.title,
          description: roomData.description,
          room_type: 'project',
          created_by: user.id
        })
        .select()
        .single();

      if (roomError) {
        console.error('❌ 創建聊天室失敗:', roomError);

        // 如果是表格不存在的錯誤，直接跳轉到模擬聊天室
        if (roomError.message?.includes('relation') || roomError.message?.includes('does not exist')) {
          console.log('📝 資料庫表格未創建，使用模擬聊天室');
          const tempRoomId = `temp_project_${Date.now()}`;
          router.push(`/aihome/ai-companions/chat/room/${tempRoomId}`);
        }
        return;
      }

      // 添加用戶為房間成員
      const { error: memberError } = await (saasSupabase
        .from('room_members') as any)
        .insert({
          room_id: newRoom.id,
          user_id: user.id,
          role: 'owner',
          user_type: 'hanami_user'
        });

      if (memberError) {
        // 如果是重複鍵錯誤，表示用戶已經存在，這是正常的
        if (memberError.code === '23505') {
          console.log('✅ 用戶已是房間成員（重複鍵錯誤）');
        } else {
          console.error('❌ 添加房間成員失敗:', memberError);
        }
      }

      // 創建前端顯示的房間物件
      const displayRoom: AIRoom = {
        id: newRoom.id,
        title: roomData.title,
        description: roomData.description,
        lastMessage: '專案已創建，歡迎開始協作！',
        lastActivity: new Date(),
        memberCount: 1,
        activeRoles: roomData.selectedRoles,
        messageCount: 0,
        status: 'active'
      };

      setRooms(prev => [displayRoom, ...prev]);
      setSelectedRoom(displayRoom);
      setShowCreateRoom(false);

      console.log('✅ 聊天室創建成功:', newRoom.id);

      // 直接跳轉到新創建的專案協作室
      router.push(`/aihome/ai-companions/chat/room/${newRoom.id}`);
    } catch (error) {
      console.error('❌ 創建聊天室錯誤:', error);
    }
  };

  // 顯示載入狀態
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4B4036] mx-auto mb-4"></div>
          <p className="text-[#4B4036]">載入中...</p>
        </div>
      </div>
    );
  }

  // 如果未登入，顯示空內容（會被重定向）
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#F8F5EC]">
      {/* 頂部導航欄 */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-[#EADBC8] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
              {/* 選單按鈕 */}
              <motion.button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg hover:bg-[#FFD59A]/20 transition-colors relative z-40 flex-shrink-0"
                title={sidebarOpen ? "關閉選單" : "開啟選單"}
              >
                <Bars3Icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#4B4036]" />
              </motion.button>

              <div className="w-8 h-8 sm:w-10 sm:h-10 relative flex-shrink-0">
                <Image
                  src="/@hanami.png"
                  alt="HanamiEcho Logo"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* 食量顯示 (moved here) */}
              <FoodBalanceButton />
              <UnifiedRightContent
                user={user}
                onLogout={handleLogout}
                onNavigate={(action) => {
                  if (action.startsWith('view:')) {
                    const view = action.split(':')[1];
                    setActiveView(view as any);
                  }
                }}
              />
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

      {/* 主要內容 */}
      < main className="px-4 py-8" >
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {/* 聊天室視圖 */}
            {activeView === 'chat' && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-center mb-12"
                >
                  <div className="flex items-center justify-center mb-4">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <ChatBubbleLeftRightIcon className="w-8 h-8 text-[#FFB6C1] mr-3" />
                    </motion.div>
                    <h1 className="text-4xl font-bold text-[#4B4036]">AI 協作聊天室</h1>
                  </div>
                  <p className="text-lg text-[#2B3A3B] max-w-2xl mx-auto">
                    與 Hibi、墨墨和皮可三位 AI 助手協作，透過對話完成各種任務和專案
                  </p>

                  {/* 刷新按鈕 */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={loadUserRooms}
                    disabled={loadingRooms}
                    className="mt-4 inline-flex items-center space-x-2 px-4 py-2 bg-white/70 backdrop-blur-sm border border-[#EADBC8] rounded-xl text-[#4B4036] hover:bg-white/90 transition-all disabled:opacity-50"
                  >
                    <motion.div
                      animate={loadingRooms ? { rotate: 360 } : {}}
                      transition={{ duration: 1, repeat: loadingRooms ? Infinity : 0, ease: "linear" }}
                    >
                      <ArrowPathIcon className="w-4 h-4" />
                    </motion.div>
                    <span>{loadingRooms ? '載入中...' : '重新載入'}</span>
                  </motion.button>
                </motion.div>

                {/* AI 伙伴歡迎區域 - 始終顯示，使用原始動態設計 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-12"
                >
                  <div className="flex justify-center space-x-3 mb-6">
                    {/* 希希 - 系統總管 */}
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0 }}
                      className="relative"
                    >
                      <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-full p-1 shadow-lg">
                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                          <img
                            src="/3d-character-backgrounds/studio/Hibi/lulu(front).png"
                            alt="希希"
                            width={72}
                            height={72}
                            className="w-18 h-18 object-cover"
                            loading="lazy"
                            onError={(e) => {
                              console.error('❌ [希希 圖標] 圖片載入失敗，改用預設貓頭鷹圖示');
                              (e.target as HTMLImageElement).src = '/owlui.png';
                            }}
                          />
                        </div>
                      </div>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1 shadow-lg"
                      >
                        <CpuChipIcon className="w-3 h-3 text-white" />
                      </motion.div>
                    </motion.div>

                    {/* Mori - 研究員 */}
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                      className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full p-1 shadow-lg"
                    >
                      <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                        <Image
                          src="/3d-character-backgrounds/studio/Mori/Mori.png"
                          alt="墨墨"
                          width={72}
                          height={72}
                          className="w-18 h-18 object-cover"
                        />
                      </div>
                    </motion.div>

                    {/* Pico - 創作者 */}
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                      className="w-20 h-20 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full p-1 shadow-lg"
                    >
                      <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                        <Image
                          src="/3d-character-backgrounds/studio/Pico/Pico.png"
                          alt="皮可"
                          width={72}
                          height={72}
                          className="w-18 h-18 object-cover"
                        />
                      </div>
                    </motion.div>
                  </div>

                  <h3 className="text-2xl font-semibold text-[#4B4036] mb-3">歡迎來到 AI 伙伴系統！</h3>
                  <p className="text-[#2B3A3B] mb-6 max-w-md mx-auto">
                    希希 系統總管和專業助手墨墨、皮可正在等待與您協作。創建專案開始智能對話，讓 AI 團隊幫您完成各種任務。
                  </p>

                  {/* 快速開始按鈕 */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <motion.button
                      whileHover={{ scale: creatingChat === 'team' ? 1 : 1.05 }}
                      whileTap={{ scale: creatingChat === 'team' ? 1 : 0.95 }}
                      onClick={handleQuickCollaborate}
                      disabled={creatingChat === 'team'}
                      className={`px-8 py-4 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all ${creatingChat === 'team' ? 'opacity-75 cursor-not-allowed' : ''
                        }`}
                    >
                      <div className="flex items-center space-x-3">
                        {creatingChat === 'team' ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>創建中...</span>
                          </>
                        ) : (
                          <>
                            <SparklesIcon className="w-5 h-5" />
                            <span>立即開始協作</span>
                          </>
                        )}
                      </div>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowCreateRoom(true)}
                      className="px-8 py-4 bg-white/70 backdrop-blur-sm border border-[#EADBC8] text-[#4B4036] rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
                    >
                      <div className="flex items-center space-x-3">
                        <PlusIcon className="w-5 h-5" />
                        <span>自訂專案</span>
                      </div>
                    </motion.button>
                  </div>
                </motion.div>

                {/* 聊天室列表 */}
                <div className="grid gap-6">
                  {/* 載入狀態 */}
                  {loadingRooms ? (
                    <div className="text-center py-12">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-8 h-8 border-2 border-[#FFD59A] border-t-transparent rounded-full mx-auto mb-4"
                      />
                      <p className="text-[#2B3A3B]">正在載入聊天室記錄...</p>
                    </div>
                  ) : (
                    <AnimatePresence>
                      {rooms.map((room, index) => (
                        <motion.div
                          key={room.id}
                          initial={{ opacity: 0, y: 30, scale: 0.9, rotateX: -15 }}
                          animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                          exit={{ opacity: 0, y: -30, scale: 0.9 }}
                          transition={{
                            duration: 0.6,
                            delay: index * 0.15,
                            type: "spring",
                            damping: 20,
                            stiffness: 300
                          }}
                          whileHover={{
                            y: -8,
                            scale: 1.03,
                            rotateX: 2,
                            boxShadow: "0 25px 50px rgba(255, 182, 193, 0.2)"
                          }}
                          className="relative bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-md rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 border-2 border-[#EADBC8] cursor-pointer overflow-hidden group"
                          onClick={() => {
                            // 如果是個人對話，添加 companion 參數
                            const isPersonalChat = room.title.includes('與') && room.title.includes('的對話');
                            if (isPersonalChat) {
                              // 從標題中識別角色
                              let companionId = '';
                              if (room.title.includes('Hibi') || room.title.includes('希希')) companionId = 'hibi';
                              else if (room.title.includes('墨墨')) companionId = 'mori';
                              else if (room.title.includes('皮可')) companionId = 'pico';

                              router.push(`/aihome/ai-companions/chat/room/${room.id}${companionId ? `?companion=${companionId}` : ''}`);
                            } else {
                              router.push(`/aihome/ai-companions/chat/room/${room.id}`);
                            }
                          }}
                        >
                          {/* 動態背景裝飾 */}
                          <motion.div
                            animate={{
                              background: [
                                "radial-gradient(circle at 20% 20%, rgba(255, 182, 193, 0.1) 0%, transparent 50%)",
                                "radial-gradient(circle at 80% 80%, rgba(255, 213, 154, 0.1) 0%, transparent 50%)",
                                "radial-gradient(circle at 20% 20%, rgba(255, 182, 193, 0.1) 0%, transparent 50%)"
                              ]
                            }}
                            transition={{ duration: 8, repeat: Infinity }}
                            className="absolute inset-0 rounded-3xl"
                          />

                          {/* 懸停光效 */}
                          <motion.div
                            initial={{ opacity: 0 }}
                            whileHover={{ opacity: 1 }}
                            className="absolute inset-0 bg-gradient-to-r from-[#FFB6C1]/5 to-[#FFD59A]/5 rounded-3xl"
                          />

                          {/* 卡片內容 */}
                          <div className="relative z-10">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                {/* 標題區域 */}
                                <div className="flex items-center space-x-3 mb-3">
                                  <motion.div
                                    animate={{ rotate: [0, 360] }}
                                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                    className="w-8 h-8 bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] rounded-full flex items-center justify-center shadow-md"
                                  >
                                    <SparklesIcon className="w-4 h-4 text-white" />
                                  </motion.div>
                                  <h3 className="text-xl font-bold text-[#4B4036] group-hover:text-[#FFB6C1] transition-colors">
                                    {room.title}
                                  </h3>
                                  <motion.div
                                    animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="w-3 h-3 bg-green-400 rounded-full shadow-sm"
                                  />
                                </div>

                                {/* 描述 */}
                                <p className="text-[#2B3A3B] mb-4 leading-relaxed">{room.description}</p>

                                {/* 統計資訊 */}
                                <div className="flex items-center space-x-4 text-sm text-[#2B3A3B] mb-4">
                                  <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    className="flex items-center space-x-1"
                                  >
                                    <UserIcon className="w-4 h-4 text-[#FFB6C1]" />
                                    <span>{room.memberCount} 成員</span>
                                  </motion.div>
                                  <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    className="flex items-center space-x-1"
                                  >
                                    <ChatBubbleLeftRightIcon className="w-4 h-4 text-[#FFD59A]" />
                                    <span>{room.messageCount} 訊息</span>
                                  </motion.div>
                                  <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    className="flex items-center space-x-1"
                                  >
                                    <CpuChipIcon className="w-4 h-4 text-[#EBC9A4]" />
                                    <span>{room.activeRoles.length} 角色</span>
                                  </motion.div>
                                </div>

                                {/* 專案類型標籤 */}
                                <div className="mb-4">
                                  <motion.span
                                    whileHover={{ scale: 1.05 }}
                                    className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm ${room.title.includes('與') && room.title.includes('的對話')
                                      ? 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border border-blue-200'
                                      : 'bg-gradient-to-r from-green-100 to-green-50 text-green-800 border border-green-200'
                                      }`}
                                  >
                                    <motion.div
                                      animate={{ rotate: 360 }}
                                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                    >
                                      {room.title.includes('與') && room.title.includes('的對話')
                                        ? <UserIcon className="w-3 h-3" />
                                        : <SparklesIcon className="w-3 h-3" />
                                      }
                                    </motion.div>
                                    <span>{room.title.includes('與') && room.title.includes('的對話') ? '個人專案' : '團隊專案'}</span>
                                  </motion.span>
                                </div>
                              </div>

                              {/* 刪除專案按鈕 */}
                              <motion.button
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={async (e) => {
                                  e.stopPropagation();

                                  // 確認對話框
                                  const isConfirmed = typeof window !== 'undefined' && window.confirm(
                                    `⚠️ 確定要刪除專案嗎？\n\n專案名稱: ${room.title}\n專案指引: ${room.description}\n\n此操作無法復原！`
                                  );

                                  if (!isConfirmed) return;

                                  console.log('🗑️ 刪除專案:', room.id, room.title);
                                  try {
                                    const response = await fetch('/api/delete-room', {
                                      method: 'DELETE',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ roomId: room.id })
                                    });
                                    const result = await safeJsonParse(response, '刪除專案 API');
                                    console.log('🗑️ 刪除結果:', result);

                                    if (result.success) {
                                      alert(`✅ 專案已成功刪除: ${room.title}`);
                                      // 重新載入聊天室列表
                                      loadUserRooms();
                                    } else {
                                      alert(`❌ 刪除失敗: ${result.error}`);
                                    }
                                  } catch (error) {
                                    console.error('刪除失敗:', error);
                                    alert('刪除失敗，請查看控制台');
                                  }
                                }}
                                className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all shadow-md"
                                title="刪除專案"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </motion.button>
                            </div>

                            {/* 活躍 AI 角色 */}
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center space-x-2">
                                <motion.div
                                  animate={{ rotate: [0, 10, -10, 0] }}
                                  transition={{ duration: 4, repeat: Infinity }}
                                  className="w-5 h-5 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] rounded-full flex items-center justify-center shadow-sm"
                                >
                                  <CpuChipIcon className="w-3 h-3 text-white" />
                                </motion.div>
                                <span className="text-sm font-bold text-[#4B4036]">AI 角色:</span>
                              </div>
                              <div className="flex space-x-1">
                                {room.activeRoles
                                  .filter(roleName => roleName !== 'AI 助手') // 過濾掉無效的角色名稱
                                  .map((roleName, roleIndex) => {
                                    // 根據角色名稱找到對應的 AI companion
                                    let companion = null;
                                    if (roleName === 'Hibi') companion = companions.find(c => c.id === 'hibi');
                                    else if (roleName === '墨墨') companion = companions.find(c => c.id === 'mori');
                                    else if (roleName === '皮可') companion = companions.find(c => c.id === 'pico');

                                    if (companion) {
                                      return (
                                        <motion.div
                                          key={roleIndex}
                                          initial={{ scale: 0, rotate: -180, opacity: 0 }}
                                          animate={{ scale: 1, rotate: 0, opacity: 1 }}
                                          transition={{
                                            delay: 0.3 + roleIndex * 0.1,
                                            type: "spring",
                                            damping: 15,
                                            stiffness: 400
                                          }}
                                          whileHover={{ scale: 1.3, y: -3, rotate: 5 }}
                                          className="relative group/role"
                                        >
                                          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${companion.color} p-0.5 shadow-lg group-hover/role:shadow-xl transition-shadow`}>
                                            <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                                              {companion.imagePath ? (
                                                <Image
                                                  src={companion.imagePath}
                                                  alt={companion.name}
                                                  width={28}
                                                  height={28}
                                                  className="w-7 h-7 object-cover"
                                                  unoptimized={companion.imagePath.includes('(') || companion.imagePath.includes(')')}
                                                  onError={(e) => {
                                                    console.error('❌ [角色圖標] 圖片載入失敗:', companion.imagePath);
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = 'none';
                                                  }}
                                                />
                                              ) : (
                                                <div className="w-7 h-7 flex items-center justify-center">
                                                  {companion.icon && <companion.icon className="w-5 h-5 text-gray-400" />}
                                                </div>
                                              )}
                                            </div>
                                          </div>

                                          {/* 角色專業圖標 */}
                                          <motion.div
                                            animate={{
                                              rotate: companion.id === 'hibi' ? 360 : 0,
                                              scale: [1, 1.1, 1]
                                            }}
                                            transition={{
                                              rotate: { duration: 6, repeat: Infinity, ease: "linear" },
                                              scale: { duration: 2, repeat: Infinity }
                                            }}
                                            className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center shadow-md border border-white"
                                          >
                                            <companion.icon className="w-2.5 h-2.5 text-white" />
                                          </motion.div>

                                          {/* 角色名稱提示 */}
                                          <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            whileHover={{ opacity: 1, y: 0 }}
                                            className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap z-20"
                                          >
                                            {companion.name}
                                          </motion.div>
                                        </motion.div>
                                      );
                                    }

                                    // 如果沒有匹配的 companion，顯示美化的文字標籤
                                    return (
                                      <motion.div
                                        key={roleIndex}
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: 0.3 + roleIndex * 0.1 }}
                                        whileHover={{ scale: 1.1, y: -2 }}
                                        className="px-3 py-1.5 bg-gradient-to-r from-[#FFD59A]/30 to-[#EBC9A4]/30 text-[#4B4036] rounded-full text-xs font-medium border border-[#EADBC8] shadow-sm"
                                      >
                                        {roleName}
                                      </motion.div>
                                    );
                                  })}
                              </div>
                            </div>

                            {/* 最後訊息 */}
                            <div className="bg-[#F8F5EC] rounded-xl p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <motion.div
                                    animate={{ rotate: [0, 360] }}
                                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                    className="w-4 h-4 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] rounded-full flex items-center justify-center"
                                  >
                                    <ClockIcon className="w-2.5 h-2.5 text-white" />
                                  </motion.div>
                                  <span className="text-sm font-medium text-[#2B3A3B]">最新訊息</span>
                                </div>
                                <motion.span
                                  whileHover={{ scale: 1.1 }}
                                  className="text-xs text-[#2B3A3B] bg-white/60 px-2 py-1 rounded-full"
                                >
                                  {(() => {
                                    const now = new Date();
                                    const diff = now.getTime() - room.lastActivity.getTime();
                                    const minutes = Math.floor(diff / 60000);
                                    const hours = Math.floor(minutes / 60);
                                    const days = Math.floor(hours / 24);

                                    if (days > 0) return `${days} 天前`;
                                    if (hours > 0) return `${hours} 小時前`;
                                    if (minutes > 0) return `${minutes} 分鐘前`;
                                    return '剛剛';
                                  })()}
                                </motion.span>
                              </div>
                              <p className="text-[#4B4036] text-sm line-clamp-2 leading-relaxed">
                                {room.lastMessage.length > 50
                                  ? `${room.lastMessage.slice(0, 50)}...`
                                  : room.lastMessage
                                }
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}

                </div>
              </motion.div>
            )}

            {/* 角色管理視圖 */}
            {activeView === 'roles' && (
              <motion.div
                key="roles"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-center mb-12"
                >
                  <div className="flex items-center justify-center mb-4">
                    <motion.div
                      animate={{ rotate: [0, 15, -15, 0] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <CpuChipIcon className="w-8 h-8 text-[#FFB6C1] mr-3" />
                    </motion.div>
                    <h1 className="text-4xl font-bold text-[#4B4036]">AI 角色夥伴</h1>
                  </div>
                  <p className="text-lg text-[#2B3A3B] max-w-2xl mx-auto">
                    認識我們的 AI 角色夥伴，每個成員都有獨特的專長和個性
                  </p>
                  <div className="mt-4 inline-flex items-center px-4 py-2 bg-[#FFD59A]/20 border border-[#FFD59A] rounded-full text-sm text-[#4B4036]">
                    <CpuChipIcon className="w-4 h-4 mr-2" />
                    系統總管 Hibi + 專業助手墨墨、皮可
                  </div>
                </motion.div>

                {/* AI 角色卡片 */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                  {companions.map((companion, index) => (
                    <motion.div
                      key={companion.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.2 }}
                      whileHover={{ y: -5, scale: 1.02 }}
                      className="relative"
                    >
                      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-[#EADBC8] overflow-hidden">
                        {/* 狀態指示器 */}
                        <div className="absolute top-4 right-4 flex items-center space-x-2">
                          {companion.isManager && (
                            <motion.div
                              animate={{ rotate: [0, 10, -10, 0] }}
                              transition={{ duration: 3, repeat: Infinity }}
                              className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-1.5 shadow-lg"
                            >
                              <CpuChipIcon className="w-3 h-3 text-white" />
                            </motion.div>
                          )}
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="w-3 h-3 bg-green-400 rounded-full"
                          />
                        </div>

                        {/* 角色圖片 */}
                        <div className="flex justify-center mb-6">
                          <motion.div
                            whileHover={{ rotate: [0, -5, 5, 0] }}
                            transition={{ duration: 0.5 }}
                            className="relative"
                          >
                            <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${companion.color} p-1 shadow-lg`}>
                              <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                                {companion.imagePath ? (
                                  <Image
                                    src={companion.imagePath}
                                    alt={companion.name}
                                    width={120}
                                    height={120}
                                    className="w-30 h-30 object-cover"
                                    unoptimized={companion.imagePath.includes('(') || companion.imagePath.includes(')')}
                                    onError={(e) => {
                                      console.error('❌ [角色圖標] 圖片載入失敗:', companion.imagePath);
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <div className="w-30 h-30 flex items-center justify-center">
                                    {companion.icon && <companion.icon className="w-24 h-24 text-gray-400" />}
                                  </div>
                                )}
                              </div>
                            </div>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                              className="absolute -top-2 -right-2 bg-[#FFB6C1] rounded-full p-2 shadow-lg"
                            >
                              <companion.icon className="w-6 h-6 text-white" />
                            </motion.div>
                          </motion.div>
                        </div>

                        {/* 角色資訊 */}
                        <div className="text-center mb-6">
                          <div className="flex items-center justify-center space-x-2 mb-2">
                            <h3 className="text-2xl font-bold text-[#4B4036]">
                              {companion.name} ({companion.nameEn})
                            </h3>
                            {companion.isManager && (
                              <motion.div
                                animate={{ rotate: [0, 15, -15, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-1"
                              >
                                <CpuChipIcon className="w-4 h-4 text-white" />
                              </motion.div>
                            )}
                          </div>
                          <p className="text-[#2B3A3B] mb-3">{companion.description}</p>
                          <motion.span
                            whileHover={{ scale: 1.05 }}
                            className={`inline-block px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r ${companion.color} text-white shadow-lg ${companion.isManager ? 'ring-2 ring-yellow-300 ring-offset-2' : ''
                              }`}
                          >
                            {companion.specialty}
                          </motion.span>
                        </div>

                        {/* 狀態顯示 */}
                        <div className="flex items-center justify-center mb-6">
                          <div className="flex items-center space-x-2 px-3 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                            <div className="w-2 h-2 bg-green-400 rounded-full" />
                            <span>線上</span>
                          </div>
                        </div>

                        {/* 能力標籤 */}
                        <div className="mb-6">
                          <div className="flex flex-wrap gap-2 justify-center">
                            {companion.abilities.slice(0, 3).map((ability, abilityIndex) => (
                              <motion.span
                                key={abilityIndex}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.8 + abilityIndex * 0.1 }}
                                whileHover={{ scale: 1.1 }}
                                className="px-3 py-1 bg-[#F8F5EC] text-[#4B4036] rounded-full text-sm border border-[#EADBC8] shadow-sm"
                              >
                                {ability}
                              </motion.span>
                            ))}
                          </div>
                        </div>

                        {/* 點選顯示模型資訊 */}
                        <motion.button
                          onClick={() => handleCompanionClick(companion)}
                          className="w-full mb-4 px-4 py-2 text-sm text-[#4B4036] bg-[#FFF9F2] hover:bg-[#FFD59A]/20 border border-[#EADBC8] rounded-lg transition-all"
                        >
                          {clickedCompanionId === companion.id ? '隱藏模型資訊' : '查看所選模型'}
                        </motion.button>

                        {/* 模型資訊顯示區域 */}
                        {clickedCompanionId === companion.id && companionModels[companion.id] && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mb-4 p-4 bg-gradient-to-r from-[#FFD59A]/10 to-[#FFB6C1]/10 rounded-xl border border-[#EADBC8]"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-[#4B4036]">所選模型：</span>
                              </div>
                              <div className="text-sm text-[#2B3A3B] font-semibold">
                                {companionModels[companion.id]?.displayName || '載入中...'}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-[#2B3A3B]">
                                <span>100字提問食量：約 {companionModels[companion.id]?.food || 1} 食量</span>
                                <img src="/apple-icon.svg" alt="食量" className="w-4 h-4" />
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {/* 互動按鈕 */}
                        <div className="flex space-x-3">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleRoleSettings(companion)}
                            className="flex-1 px-4 py-3 bg-[#FFD59A] hover:bg-[#EBC9A4] text-[#4B4036] rounded-xl font-medium transition-all shadow-lg hover:shadow-xl"
                          >
                            設定
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: creatingChat === companion.id ? 1 : 1.05 }}
                            whileTap={{ scale: creatingChat === companion.id ? 1 : 0.95 }}
                            onClick={() => handleStartChat(companion)}
                            disabled={creatingChat === companion.id}
                            className={`flex-1 px-4 py-3 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] hover:from-[#FFA0B4] hover:to-[#EBC9A4] text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl ${creatingChat === companion.id ? 'opacity-75 cursor-not-allowed' : ''
                              }`}
                          >
                            {creatingChat === companion.id ? (
                              <div className="flex items-center justify-center space-x-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>創建中...</span>
                              </div>
                            ) : (
                              '開始專案'
                            )}
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 思維模組視圖 */}
            {activeView === 'mind' && (
              <motion.div
                key="mind"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5 }}
                className="max-w-6xl mx-auto"
              >
                <div className="text-center mb-12">
                  <div className="flex items-center justify-center mb-4">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 4, repeat: Infinity }}
                    >
                      <PuzzlePieceIcon className="w-8 h-8 text-[#FFB6C1] mr-3" />
                    </motion.div>
                    <h1 className="text-4xl font-bold text-[#4B4036]">思維積木 (MindBlock)</h1>
                  </div>
                  <p className="text-lg text-[#2B3A3B] max-w-2xl mx-auto">
                    為 AI 夥伴裝備強大的思維流程，或創造屬於你的獨特積木
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  {/* Builder Card */}
                  <motion.div
                    whileHover={{ y: -5 }}
                    onClick={() => router.push('/aihome/mind-builder')}
                    className="bg-white rounded-2xl p-8 shadow-lg border border-[#EADBC8] cursor-pointer group"
                  >
                    <div className="w-16 h-16 bg-[#FFD59A]/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <PlusIcon className="w-8 h-8 text-[#4B4036]" />
                    </div>
                    <h3 className="text-2xl font-bold text-[#4B4036] mb-2">創建新積木</h3>
                    <p className="text-[#4B4036]/70">使用直觀的積木堆疊介面，設計 AI 的思考邏輯。</p>
                  </motion.div>

                  {/* My Library Card */}
                  <motion.div
                    whileHover={{ y: -5 }}
                    onClick={() => router.push('/aihome/my-mind-library')}
                    className="bg-white rounded-2xl p-8 shadow-lg border border-[#EADBC8] cursor-pointer group"
                  >
                    <div className="w-16 h-16 bg-[#A78BFA]/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <PuzzlePieceIcon className="w-8 h-8 text-[#4B4036]" />
                    </div>
                    <h3 className="text-2xl font-bold text-[#4B4036] mb-2">我的積木庫</h3>
                    <p className="text-[#4B4036]/70">管理您儲存的思維積木組合，隨時載入並繼續編輯。</p>
                  </motion.div>

                  {/* Library Card */}
                  <motion.div
                    whileHover={{ y: -5 }}
                    onClick={() => router.push('/aihome/mind-library')}
                    className="bg-white rounded-2xl p-8 shadow-lg border border-[#EADBC8] cursor-pointer group"
                  >
                    <div className="w-16 h-16 bg-[#FFB6C1]/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <ArrowPathIcon className="w-8 h-8 text-[#4B4036]" />
                    </div>
                    <h3 className="text-2xl font-bold text-[#4B4036] mb-2">瀏覽積木庫</h3>
                    <p className="text-[#4B4036]/70">探索社群分享的思維積木，一鍵 Remix 成為你的專屬工具。</p>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* 記憶庫視圖 */}
            {activeView === 'memory' && (
              <motion.div
                key="memory"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5 }}
                className="flex items-center justify-center min-h-[60vh] px-4"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-center w-full max-w-2xl"
                >
                  {/* 主標題區域 */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="mb-8"
                  >
                    <div className="flex items-center justify-center mb-6">
                      <motion.div
                        animate={{
                          scale: [1, 1.15, 1],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="relative"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-[#FFD59A] to-[#FFB6C1] rounded-full blur-xl opacity-50 animate-pulse"></div>
                        <div className="relative bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] p-6 rounded-3xl shadow-2xl">
                          <SparklesIcon className="w-20 h-20 text-white" />
                        </div>
                      </motion.div>
                    </div>
                    <h1 className="text-5xl font-bold text-[#4B4036] mb-3 bg-gradient-to-r from-[#4B4036] to-[#2B3A3B] bg-clip-text text-transparent">
                      AI 記憶庫
                    </h1>
                    <p className="text-lg text-[#2B3A3B]/70">
                      智能學習與個性化體驗的記憶系統
                    </p>
                  </motion.div>

                  {/* 主要卡片 */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="relative"
                  >
                    {/* 背景裝飾 */}
                    <div className="absolute -inset-4 bg-gradient-to-r from-[#FFD59A]/20 via-[#FFB6C1]/20 to-[#EBC9A4]/20 rounded-3xl blur-2xl"></div>

                    {/* 主卡片 */}
                    <div className="relative bg-gradient-to-br from-white via-[#FFFDF8] to-white/90 backdrop-blur-xl rounded-3xl p-12 shadow-2xl border-2 border-[#EADBC8]/50">
                      {/* 圖標和文字 */}
                      <div className="flex flex-col items-center">
                        <motion.div
                          animate={{
                            rotate: [0, 10, -10, 0],
                            scale: [1, 1.1, 1]
                          }}
                          transition={{
                            duration: 2.5,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                          className="mb-6"
                        >
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] rounded-full blur-md opacity-40"></div>
                            <div className="relative bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] p-5 rounded-full">
                              <WrenchScrewdriverIcon className="w-12 h-12 text-white" />
                            </div>
                          </div>
                        </motion.div>

                        <h2 className="text-3xl font-bold text-[#4B4036] mb-3">
                          暫未開放
                        </h2>

                        <p className="text-lg text-[#2B3A3B]/80 mb-6 max-w-md">
                          此功能正在精心開發中，我們會為您帶來更優質的體驗
                        </p>

                        {/* 進度指示器 */}
                        <div className="flex items-center space-x-2 text-[#2B3A3B]/60">
                          <ClockIcon className="w-5 h-5" />
                          <span className="text-sm font-medium">敬請期待</span>
                        </div>
                      </div>

                      {/* 裝飾性元素 */}
                      <div className="absolute top-4 right-4 opacity-20">
                        <SparklesIcon className="w-8 h-8 text-[#FFB6C1]" />
                      </div>
                      <div className="absolute bottom-4 left-4 opacity-20">
                        <SparklesIcon className="w-6 h-6 text-[#FFD59A]" />
                      </div>
                    </div>
                  </motion.div>

                  {/* 底部提示 */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="mt-8 text-sm text-[#2B3A3B]/60"
                  >
                    <p>我們正在努力完善這個功能，感謝您的耐心等待</p>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}

            {/* 統計視圖 */}
            {activeView === 'stats' && (
              <motion.div
                key="stats"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-center mb-12"
                >
                  <div className="flex items-center justify-center mb-4">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <ChartBarIcon className="w-8 h-8 text-[#FFB6C1] mr-3" />
                    </motion.div>
                    <h1 className="text-4xl font-bold text-[#4B4036]">使用統計</h1>
                  </div>
                  <p className="text-lg text-[#2B3A3B] max-w-2xl mx-auto">
                    追蹤 AI 使用情況，監控效能和優化體驗
                  </p>
                </motion.div>

                {/* AI 使用統計組件 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="mb-8"
                >
                  <UsageStatsDisplay
                    userId={user?.id}
                    className="shadow-xl"
                  />
                </motion.div>

                {/* 系統功能說明 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-[#EADBC8]"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                          <ChartBarIcon className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-[#4B4036]">使用統計追蹤</h3>
                      </div>
                      <p className="text-sm text-[#2B3A3B] mb-3">
                        自動記錄 AI 請求次數、Token 使用量和成本，幫助您優化使用策略
                      </p>
                      <div className="space-y-1">
                        {['請求次數統計', 'Token 用量分析', '成本追蹤', '效率監控'].map((item, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                            <span className="text-xs text-[#2B3A3B]">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center">
                          <ClockIcon className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-[#4B4036]">效能監控分析</h3>
                      </div>
                      <p className="text-sm text-[#2B3A3B] mb-3">
                        監控 AI 模型回應時間和效能，優化使用體驗和系統效率
                      </p>
                      <div className="space-y-1">
                        {['回應時間監控', '模型效能分析', '使用趨勢統計', '系統優化建議'].map((item, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                            <span className="text-xs text-[#2B3A3B]">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main >

      {/* 角色設定模態框 */}
      <AnimatePresence>
        {
          selectedCompanion && showSettings && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => {
                setSelectedCompanion(null);
                setShowSettings(false);
              }}
            >

              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20, rotate: -2 }}
                animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20, rotate: 2 }}
                transition={{ type: "spring", damping: 22, stiffness: 280 }}
                className="relative bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* 移除裝飾邊框光暈，避免中間出現細線 */}

                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <motion.div
                      initial={{ scale: 0.9, rotate: -8 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(135deg, #FFD59A 0%, #FFB6C1 100%)',
                        boxShadow: '0 6px 20px rgba(255,182,193,0.35)'
                      }}
                    >
                      <SparklesIcon className="w-6 h-6 text-white" />
                    </motion.div>
                    <h2 className="text-2xl font-bold text-[#4B4036]">
                      {selectedCompanion.name} 角色設定
                    </h2>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.06, rotate: 90 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => {
                      setSelectedCompanion(null);
                      setShowSettings(false);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </motion.button>
                </div>

                <div className="space-y-6">
                  {/* 頂部提示條 */}
                  {!isDefaultRole(selectedCompanion!) && (
                    <motion.div
                      initial={{ y: -8, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="rounded-xl p-3 border border-[#EADBC8] bg-[#FFFDF8] flex items-center gap-2"
                    >
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                        className="w-2 h-2 rounded-full bg-[#FFB6C1]"
                      />
                      <span className="text-sm text-[#2B3A3B]">可開啟「顯示全部模型」切換查看更多選項</span>
                    </motion.div>
                  )}

                  {/* 角色頭像與描述卡片增強效果 */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="text-center"
                  >
                    <motion.div
                      whileHover={{ rotate: [0, -5, 5, 0] }}
                      transition={{ duration: 0.6 }}
                      className="inline-block p-3 rounded-2xl"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,213,154,0.15) 0%, rgba(255,182,193,0.15) 100%)'
                      }}
                    >
                      <Image src={selectedCompanion.imagePath} alt={selectedCompanion.name} width={144} height={144} className="rounded-2xl" />
                    </motion.div>
                    <p className="mt-4 text-[#2B3A3B] text-lg max-w-2xl mx-auto leading-relaxed">{selectedCompanion.description}</p>
                    {/* 100字問題食量顯示（僅顯示食量與圖示） */}
                    {(() => {
                      const resolvedId = selectedModel === DEFAULT_MODEL_SENTINEL ? roleDefaultModel : selectedModel;
                      const m = availableModels.find((x: any) => x.model_id === resolvedId);
                      const food = computeFoodFor100(m);
                      return (
                        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white border border-[#EADBC8] px-4 py-2">
                          <span className="text-sm text-[#4B4036]">100字提問食量：約 {food} 食量</span>
                          <img src="/apple-icon.svg" alt="食量" className="w-5 h-5" />
                        </div>
                      );
                    })()}
                  </motion.div>

                  {/* 分組卡片：模型、語氣、指引 */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 gap-6"
                  >
                    {/* MindBlock 卡片 */}
                    <motion.div
                      whileHover={{ y: -3 }}
                      className="rounded-xl border border-[#EADBC8] bg-white p-0 shadow-sm overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenPanels((s) => ({ ...s, mind: !s.mind }))}
                        className="w-full text-left px-4 py-4 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <PuzzlePieceIcon className="w-5 h-5 text-[#4B4036]" />
                          <h3 className="text-lg font-semibold text-[#4B4036]">思維積木 (MindBlock)</h3>
                        </div>
                        <motion.span animate={{ rotate: openPanels.mind ? 180 : 0 }}>
                          <svg className="w-5 h-5 text-[#4B4036]" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" /></svg>
                        </motion.span>
                      </button>

                      {openPanels.mind && (
                        <div className="px-4 pb-4 border-t border-[#EADBC8] bg-[#FFF9F2]/50">
                          <div className="mt-4 space-y-3">
                            <p className="text-sm text-[#4B4036]/80">
                              為 {selectedCompanion.name} 裝備特定的思維流程，增強其處理複雜任務的能力。此設定將作為預設值，在新聊天室中自動載入。
                            </p>

                            {/* 預設思維積木列表 */}
                            {loadingModels ? (
                              <div className="flex items-center justify-center py-4">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#FFB6C1]"></div>
                                <span className="ml-2 text-sm text-[#4B4036]">載入中...</span>
                              </div>
                            ) : defaultMindBlocks.length > 0 ? (
                              <div className="space-y-2">
                                {defaultMindBlocks.map((block: any) => (
                                  <div key={block.id} className="bg-white p-3 rounded-lg border border-[#EADBC8] flex items-start justify-between">
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                      <div className="w-8 h-8 bg-[#FFD59A]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <PuzzlePieceIcon className="w-5 h-5 text-[#4B4036]" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium text-[#4B4036] text-sm truncate mb-1">{block.title}</div>
                                        {/* 顯示積木類型卡片而非文字描述 */}
                                        <BlockTypeCards block={block} />
                                      </div>
                                    </div>
                                    <button
                                      onClick={async () => {
                                        if (!user?.id || !selectedCompanion) return;
                                        try {
                                          const supabase = getSaasSupabaseClient();
                                          const roleSlug = selectedCompanion.id === 'hibi' ? 'hibi-manager' : selectedCompanion.id === 'mori' ? 'mori-researcher' : 'pico-artist';
                                          const { data: roleData } = await supabase
                                            .from('ai_roles')
                                            .select('id')
                                            .eq('slug', roleSlug)
                                            .maybeSingle();

                                          if (!roleData) return;

                                          const { error } = await supabase
                                            .from('role_mind_blocks' as any)
                                            .update({ is_active: false })
                                            .eq('role_id', (roleData as any).id)
                                            .eq('user_id', user.id)
                                            .eq('mind_block_id', block.id);

                                          if (error) throw error;

                                          // 重新載入
                                          await loadDefaultMindBlocks(selectedCompanion.id);
                                          const { default: toast } = await import('react-hot-toast');
                                          toast.success('已卸載預設思維積木', {
                                            icon: <PuzzlePieceIcon className="w-5 h-5 text-green-600" />,
                                            duration: 2000,
                                            style: {
                                              background: '#fff',
                                              color: '#4B4036',
                                            }
                                          });
                                        } catch (error) {
                                          console.error('卸載預設思維積木失敗:', error);
                                          const { default: toast } = await import('react-hot-toast');
                                          toast.error('卸載失敗', {
                                            icon: <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />,
                                            duration: 2000,
                                            style: {
                                              background: '#fff',
                                              color: '#4B4036',
                                            }
                                          });
                                        }
                                      }}
                                      className="ml-2 p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-all flex-shrink-0"
                                    >
                                      <XMarkIcon className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="bg-white p-3 rounded-lg border border-dashed border-[#EADBC8] text-center">
                                <div className="text-sm text-[#4B4036]/60">尚未裝備預設思維積木</div>
                                <div className="text-xs text-[#4B4036]/40 mt-1">點擊下方按鈕選擇積木</div>
                              </div>
                            )}

                            <div className="flex gap-3 mt-4">
                              <button
                                onClick={() => {
                                  if (!selectedCompanion) return;
                                  setShowBlockSelectionModal(true);
                                }}
                                className="flex-1 py-2 px-4 bg-[#FFD59A] text-[#4B4036] rounded-lg font-medium text-sm hover:bg-[#FFC57A] transition-colors flex items-center justify-center gap-2"
                              >
                                <PlusIcon className="w-4 h-4" />
                                選擇積木
                              </button>
                              <button
                                onClick={() => {
                                  setShowSettings(false);
                                  router.push('/aihome/mind-builder');
                                }}
                                className="flex-1 py-2 px-4 bg-white border border-[#EADBC8] text-[#4B4036] rounded-lg font-medium text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                              >
                                <PlusIcon className="w-4 h-4" />
                                創建新積木
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>

                    {/* 模型卡片 */}
                    <motion.div
                      whileHover={{ y: -3 }}
                      className="rounded-xl border border-[#EADBC8] bg-white p-0 shadow-sm overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenPanels((s) => ({ ...s, model: !s.model }))}
                        className="w-full text-left px-4 py-4 flex items-center justify-between"
                      >
                        <h3 className="text-lg font-semibold text-[#4B4036]">選擇 AI 模型</h3>
                        <motion.span animate={{ rotate: openPanels.model ? 180 : 0 }}>
                          <svg className="w-5 h-5 text-[#4B4036]" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" /></svg>
                        </motion.span>
                      </button>

                      {openPanels.model && (
                        <div className="px-4 pb-4 border-t border-[#EADBC8]">
                          <div className="relative mt-4 space-y-2">
                            {/* 自訂下拉選單 */}
                            <div className="relative" ref={modelSelectRef}>
                              <input
                                ref={modelInputRef}
                                type="text"
                                value={modelSearch}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  setModelSearch(v);
                                  setModelSelectOpen(true);

                                  if (v === DEFAULT_MODEL_SENTINEL) {
                                    setSelectedModel(v);
                                    setModelSearch(''); // 清空以顯示 placeholder
                                    if (selectedCompanion?.id === 'mori') {
                                      setSelectedModelsMulti([]); // 清除多選
                                    }
                                    return;
                                  }
                                  // 只在非 Mori 模式下自動選擇
                                  if (selectedCompanion?.id !== 'mori') {
                                    const exists = getFilteredModels().some(m => m.model_id === v) || availableModels.some(m => m.model_id === v);
                                    if (exists) setSelectedModel(v);
                                  }
                                }}
                                onFocus={() => setModelSelectOpen(true)}
                                onBlur={() => setTimeout(() => setModelSelectOpen(false), 200)}
                                placeholder={(() => {
                                  // Mori 多選模式
                                  if (selectedCompanion?.id === 'mori') {
                                    if (selectedModelsMulti.length === 0) {
                                      return "選擇至少 2 個模型（最多 4 個）";
                                    }
                                    return "繼續選擇模型或輸入以搜尋...";
                                  }
                                  // 單選模式：顯示預設模型
                                  if (selectedModel === DEFAULT_MODEL_SENTINEL && roleDefaultModel) {
                                    const defaultDisplay = formatModelDisplay(roleDefaultModel);
                                    return defaultDisplay ? `預設（建議）：${defaultDisplay}` : "預設（建議）或輸入以搜尋模型";
                                  }
                                  return "預設（建議）或輸入以搜尋模型";
                                })()}
                                className="w-full p-3 pr-10 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFB6C1] focus:border-transparent bg-white text-[#4B4036]"
                              />
                              {/* 下拉箭頭 */}
                              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <motion.div
                                  animate={{ rotate: modelSelectOpen ? 180 : 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </motion.div>
                              </div>

                              {/* 自訂下拉選單列表 - 使用 Portal 渲染到 body */}
                              {typeof document !== 'undefined' && modelSelectOpen && dropdownPosition && createPortal(
                                <AnimatePresence>
                                  <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    style={{
                                      position: 'fixed',
                                      top: `${dropdownPosition.top}px`,
                                      left: `${dropdownPosition.left}px`,
                                      width: `${dropdownPosition.width}px`,
                                      zIndex: 9999
                                    }}
                                    className="bg-white border border-[#EADBC8] rounded-lg shadow-xl flex flex-col max-h-[400px]"
                                    data-model-dropdown
                                  >
                                    <div className="overflow-y-auto flex-1">
                                      {/* 預設選項 */}
                                      <motion.button
                                        whileHover={{ backgroundColor: "#FFFBEB" }}
                                        whileTap={{ scale: 0.98 }}
                                        type="button"
                                        onMouseDown={(e) => {
                                          e.preventDefault(); // 防止觸發 onBlur
                                          setSelectedModel(DEFAULT_MODEL_SENTINEL);
                                          setModelSearch('');
                                          setModelSelectOpen(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${selectedModel === DEFAULT_MODEL_SENTINEL
                                          ? 'bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white'
                                          : 'text-[#4B4036] hover:bg-[#FFFBEB]'
                                          }`}
                                      >
                                        預設（建議）
                                      </motion.button>

                                      {/* 模型選項 */}
                                      {getFilteredModels().filter(m => {
                                        if ((m.price_tier || '').includes('免費') || (m.price_tier || '').toLowerCase().includes('free')) return false;
                                        if (!modelSearch.trim()) return true;
                                        const q = modelSearch.toLowerCase();
                                        return (
                                          (m.display_name || '').toLowerCase().includes(q) ||
                                          (m.description || '').toLowerCase().includes(q) ||
                                          (m.provider || '').toLowerCase().includes(q) ||
                                          (m.model_id || '').toLowerCase().includes(q)
                                        );
                                      }).map((model) => {
                                        // 對於 Mori，檢查是否在多選列表中
                                        const isMultiSelected = selectedCompanion?.id === 'mori' && selectedModelsMulti.includes(model.model_id);
                                        const isSingleSelected = selectedCompanion?.id !== 'mori' && selectedModel === model.model_id;
                                        const isSelected = isMultiSelected || isSingleSelected;
                                        const isDisabled = selectedCompanion?.id === 'mori' && !isMultiSelected && selectedModelsMulti.length >= 4;

                                        return (
                                          <motion.button
                                            key={model.model_id}
                                            whileHover={isDisabled ? {} : { backgroundColor: "#FFFBEB" }}
                                            whileTap={{ scale: 0.98 }}
                                            type="button"
                                            disabled={isDisabled}
                                            onMouseDown={(e) => {
                                              e.preventDefault(); // 防止觸發 onBlur

                                              if (selectedCompanion?.id === 'mori') {
                                                // 多選模式
                                                if (isMultiSelected) {
                                                  // 取消選擇
                                                  setSelectedModelsMulti(prev => prev.filter(id => id !== model.model_id));
                                                } else if (selectedModelsMulti.length < 4) {
                                                  // 添加選擇
                                                  setSelectedModelsMulti(prev => [...prev, model.model_id]);
                                                }
                                                // 多選模式下不關閉下拉選單
                                              } else {
                                                // 單選模式
                                                setSelectedModel(model.model_id);
                                                setModelSearch(stripFree(model.display_name || model.model_id));
                                                setModelSelectOpen(false);
                                              }
                                            }}
                                            className={`w-full text-left px-3 py-2 text-sm transition-colors border-t border-[#EADBC8]/30 ${isSelected
                                              ? 'bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white'
                                              : isDisabled
                                                ? 'text-gray-400 cursor-not-allowed'
                                                : 'text-[#4B4036] hover:bg-[#FFFBEB]'
                                              }`}
                                          >
                                            <div className="flex items-center justify-between">
                                              <div className="flex-1">
                                                <div className="font-medium">{stripFree(model.display_name || '')}</div>
                                                <div className={`text-xs ${isSelected ? 'opacity-90' : 'opacity-80'}`}>
                                                  {stripFree(model.description || '')} ({stripFree(model.price_tier || '')})
                                                </div>
                                              </div>
                                              {selectedCompanion?.id === 'mori' && (
                                                <div className="ml-2 flex-shrink-0">
                                                  {isMultiSelected ? (
                                                    <motion.div
                                                      initial={{ scale: 0 }}
                                                      animate={{ scale: 1 }}
                                                      className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-sm"
                                                    >
                                                      <svg className="w-3 h-3 text-[#FFB6C1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                      </svg>
                                                    </motion.div>
                                                  ) : (
                                                    <div className={`w-5 h-5 rounded-full border-2 ${isSelected ? 'border-white/80' : 'border-[#EADBC8]'
                                                      }`} />
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          </motion.button>
                                        );
                                      })}
                                    </div>

                                    {/* 底部確認按鈕（僅 Mori 多選模式） */}
                                    {selectedCompanion?.id === 'mori' && (
                                      <div className="p-3 bg-gray-50 border-t border-[#EADBC8] flex justify-between items-center shrink-0">
                                        <div className="text-xs text-[#4B4036]">
                                          已選 {selectedModelsMulti.length} / 4{selectedModelsMulti.length < 2 && '（至少 2 個）'}
                                        </div>
                                        <button
                                          type="button"
                                          onMouseDown={(e) => {
                                            e.preventDefault();
                                            setModelSelectOpen(false);
                                          }}
                                          className="px-4 py-1.5 bg-[#FFD59A] text-[#4B4036] rounded-md text-sm font-medium hover:bg-[#EBC9A4] transition-colors shadow-sm"
                                        >
                                          確認選擇
                                        </button>
                                      </div>
                                    )}
                                  </motion.div>
                                </AnimatePresence>,
                                document.body
                              )}
                            </div>

                            {/* 多選模型僅對 Mori 啟用 - 已整合到上方 Portal 下拉選單中 */}
                            {selectedCompanion?.id === 'mori' && selectedModelsMulti.length > 0 && (
                              <div className="mt-2">
                                <div className="flex flex-wrap gap-2">
                                  {selectedModelsMulti.map(id => {
                                    const m = availableModels.find(x => x.model_id === id) || getFilteredModels().find(x => x.model_id === id);
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
                                          onClick={() => setSelectedModelsMulti(prev => prev.filter(x => x !== id))}
                                          className="ml-1 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                                        >
                                          <XMarkIcon className="w-3 h-3" />
                                        </motion.button>
                                      </motion.span>
                                    );
                                  })}
                                </div>
                                <div className="mt-2 text-xs text-[#4B4036]">
                                  已選 {selectedModelsMulti.length} / 4{selectedModelsMulti.length < 2 && '（至少 2 個）'}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 模式切換：自動/全部（預設角色不顯示） */}
                          {!isDefaultRole(selectedCompanion!) && (
                            <div className="mt-3 flex items-center gap-3 text-sm">
                              <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={showAllModels}
                                  onChange={(e) => setShowAllModels(e.target.checked)}
                                />
                                顯示全部模型（預設自動篩選）
                              </label>
                              {!showAllModels && (
                                <span className="text-[#2B3A3B]">已依角色自動篩選</span>
                              )}
                            </div>
                          )}

                          {/* 選中模型詳情/預設提示 */}
                          <div className="mt-3 p-3 bg-[#FFF9F2] border border-[#FFB6C1] rounded-lg">
                            {(() => {
                              if (selectedModel === DEFAULT_MODEL_SENTINEL) {
                                return <div className="text-sm text-[#4B4036]">將使用角色的預設模型</div>;
                              }
                              const source = getFilteredModels();
                              const effectiveModelId = selectedModel === DEFAULT_MODEL_SENTINEL ? roleDefaultModel : selectedModel;
                              const selectedModelData = source.find(m => m.model_id === effectiveModelId) || availableModels.find(m => m.model_id === effectiveModelId);
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
                                  {/* 僅顯示食量與圖示，不顯示金額 */}
                                  <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white border border-[#EADBC8] px-4 py-2">

                                    <span className="text-sm text-[#4B4036]">100字提問：約 {computeFoodFor100(selectedModelData)} 食量</span>
                                    <img src="/apple-icon.svg" alt="食量" className="w-5 h-5" />
                                  </div>
                                </>
                              ) : (<div className="text-sm text-[#4B4036]">請選擇模型</div>);
                            })()}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </motion.div>

                  {/* 底部按鈕區：增加動態反饋 */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex space-x-3 pt-2"
                  >
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSaveSettings}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] hover:from-[#FFA0B4] hover:to-[#EBC9A4] text-white rounded-xl font-medium transition-all shadow-lg"
                    >
                      保存設定
                    </motion.button>
                    {isDefaultRole(selectedCompanion!) && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleResetToDefaults}
                        className="px-6 py-3 bg-white border border-[#EADBC8] text-[#4B4036] rounded-xl font-medium"
                      >
                        還原預設
                      </motion.button>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setSelectedCompanion(null);
                        setShowSettings(false);
                      }}
                      className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
                    >
                      取消
                    </motion.button>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          )
        }
      </AnimatePresence >

      {/* 創建專案模態框 */}
      <AnimatePresence>
        {/* 專案資訊填寫模態框 */}
        {
          showProjectModal && selectedCompanionForProject && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => {
                setShowProjectModal(false);
                setSelectedCompanionForProject(null);
              }}
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
                  <h2 className="text-2xl font-bold text-[#4B4036]">開始新專案</h2>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setShowProjectModal(false);
                      setSelectedCompanionForProject(null);
                    }}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6 text-[#4B4036]" />
                  </motion.button>
                </div>

                <div className="mb-6">
                  <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-[#FFF9F2] to-[#F8F5EC] rounded-xl">
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${selectedCompanionForProject.color} p-0.5`}>
                      <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                        <Image
                          src={selectedCompanionForProject.imagePath}
                          alt={selectedCompanionForProject.name}
                          width={56}
                          height={56}
                          className="w-14 h-14 object-cover"
                        />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[#4B4036]">
                        與 {selectedCompanionForProject.name} 協作
                      </h3>
                      <p className="text-sm text-[#2B3A3B]">
                        {selectedCompanionForProject.description}
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const projectData = {
                    title: formData.get('title') as string,
                    description: formData.get('description') as string
                  };
                  handleCreateChatWithProject(projectData);
                }}>
                  <div className="space-y-4 mb-6">
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-[#4B4036] mb-2">
                        本次專案 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        required
                        placeholder="請輸入專案名稱，例如：網站設計專案"
                        className="w-full px-4 py-3 border border-[#EADBC8] rounded-xl focus:ring-2 focus:ring-[#FFB6C1] focus:border-transparent transition-all"
                      />
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-[#4B4036] mb-2">
                        專案內容 <span className="text-gray-400">(選填)</span>
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        rows={3}
                        placeholder="請描述專案的具體內容和目標..."
                        className="w-full px-4 py-3 border border-[#EADBC8] rounded-xl focus:ring-2 focus:ring-[#FFB6C1] focus:border-transparent transition-all resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setShowProjectModal(false);
                        setSelectedCompanionForProject(null);
                      }}
                      className="flex-1 px-6 py-3 border border-[#EADBC8] text-[#4B4036] rounded-xl font-medium hover:bg-[#F8F5EC] transition-all"
                    >
                      取消
                    </motion.button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={creatingChat === selectedCompanionForProject.id}
                      className={`flex-1 px-6 py-3 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all ${creatingChat === selectedCompanionForProject.id ? 'opacity-75 cursor-not-allowed' : ''
                        }`}
                    >
                      {creatingChat === selectedCompanionForProject.id ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>創建中...</span>
                        </div>
                      ) : (
                        '開始協作'
                      )}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )
        }

        {
          showCreateRoom && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowCreateRoom(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-[#4B4036]">創建新專案</h2>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowCreateRoom(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </motion.button>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const selectedRoles = Array.from(formData.getAll('roles')) as string[];
                  handleCreateProjectRoom({
                    title: formData.get('title') as string,
                    description: formData.get('description') as string,
                    selectedRoles
                  });
                }}>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-[#4B4036] mb-2">本次專案</label>
                      <input
                        type="text"
                        name="title"
                        required
                        className="w-full px-4 py-3 border border-[#EADBC8] rounded-xl focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent transition-all bg-white text-[#4B4036]"
                        placeholder="例：網站重新設計專案"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#4B4036] mb-2">專案內容</label>
                      <textarea
                        name="description"
                        rows={3}
                        className="w-full px-4 py-3 border border-[#EADBC8] rounded-xl focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent transition-all bg-white text-[#4B4036]"
                        placeholder="簡短描述這個專案的內容和目標..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#4B4036] mb-4">選擇 AI 角色成員</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {companions.map((companion) => (
                          <motion.label
                            key={companion.id}
                            whileHover={{ scale: 1.02 }}
                            className="relative cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              name="roles"
                              value={companion.name}
                              defaultChecked
                              className="sr-only peer"
                            />
                            <div className="bg-white border-2 border-[#EADBC8] rounded-xl p-4 hover:border-[#FFD59A] transition-colors peer-checked:border-[#FFB6C1] peer-checked:bg-[#FFB6C1]/10">
                              <div className="flex items-center space-x-3">
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
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-[#4B4036]">
                                    {companion.id === 'hibi' ? '（綜合）希希' :
                                      companion.id === 'mori' ? '（多模型研究）墨墨' :
                                        companion.id === 'pico' ? '（繪圖）皮可' :
                                          companion.name}
                                  </p>
                                  <p className="text-sm text-[#2B3A3B] truncate">{companion.specialty}</p>
                                </div>
                              </div>
                            </div>
                          </motion.label>
                        ))}
                      </div>
                    </div>

                    <div className="flex space-x-3 pt-4">
                      <motion.button
                        type="submit"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
                      >
                        創建專案
                      </motion.button>
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowCreateRoom(false)}
                        className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-medium transition-colors"
                      >
                        取消
                      </motion.button>
                    </div>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )
        }
      </AnimatePresence >

      {/* 角色選擇視窗 */}
      <AnimatePresence>
        {
          showRoleSelectionModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-[radial-gradient(ellipse_at_top,rgba(255,214,165,0.25),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(255,182,193,0.25),transparent_60%)] backdrop-blur-sm sm:backdrop-blur-md"
              onClick={() => setShowRoleSelectionModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 8 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.96, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                className="relative bg-white/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-[0_10px_40px_rgba(255,182,193,0.35)] ring-1 ring-[#EADBC8]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A]">選擇 AI 角色</h2>
                  <button
                    onClick={() => setShowRoleSelectionModal(false)}
                    className="p-2 hover:bg-[#FFF9F2] rounded-full transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <p className="text-[#2B3A3B] mb-6">
                  請選擇要加入協作聊天室的 AI 角色：
                </p>

                <RoleSelectionGrid
                  companions={companions}
                  onConfirm={(selectedRoles) => {
                    if (selectedRoles.length > 0) {
                      createTeamCollaborationProject(selectedRoles);
                    }
                  }}
                  onCancel={() => setShowRoleSelectionModal(false)}
                />

              </motion.div>
            </motion.div>
          )
        }
      </AnimatePresence >

      {/* 積木選擇 Modal */}
      {
        selectedCompanion && (
          <BlockSelectionModal
            isOpen={showBlockSelectionModal}
            onClose={() => setShowBlockSelectionModal(false)}
            onSelect={handleSelectDefaultBlock}
            slotType="role" // 預設使用 role，但實際上可以選擇任何類型
          />
        )
      }
    </div >
  );
}

// 角色選擇網格組件
function RoleSelectionGrid({
  companions,
  onConfirm,
  onCancel
}: {
  companions: AICompanion[];
  onConfirm: (selectedRoles: string[]) => void;
  onCancel: () => void;
}) {
  // 預設選擇所有角色
  const [selectedRoles, setSelectedRoles] = useState<string[]>(() =>
    companions.map(c => c.name)
  );

  // 當 companions 變化時，自動更新選擇的角色列表
  useEffect(() => {
    if (companions.length > 0) {
      const allRoleNames = companions.map(c => c.name);
      setSelectedRoles(allRoleNames);
    }
  }, [companions]);

  const listVariants = {
    hidden: { opacity: 0, y: 8 },
    show: {
      opacity: 1,
      y: 0,
      transition: { staggerChildren: 0.06, delayChildren: 0.05 }
    }
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 8, scale: 0.98 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: 'spring', stiffness: 320, damping: 24 }
    }
  } as const;

  const toggleRole = (roleName: string) => {
    setSelectedRoles(prev =>
      prev.includes(roleName)
        ? prev.filter(role => role !== roleName)
        : [...prev, roleName]
    );
  };

  const selectAll = () => {
    setSelectedRoles(companions.map(c => c.name));
  };

  const clearAll = () => {
    setSelectedRoles([]);
  };

  const handleConfirm = () => {
    if (selectedRoles.length > 0) {
      onConfirm(selectedRoles);
    }
  };

  return (
    <div className="space-y-4">
      <motion.div className="space-y-3" variants={listVariants} initial="hidden" animate="show">
        {companions.map((companion) => (
          <motion.div
            variants={itemVariants}
            key={companion.id}
            whileHover={{ scale: 1.015, translateY: -1 }}
            whileTap={{ scale: 0.985 }}
            onClick={() => toggleRole(companion.name)}
            className={`p-4 rounded-2xl cursor-pointer transition-all duration-300 ${selectedRoles.includes(companion.name)
              ? 'ring-2 ring-offset-2 ring-[#FFB6C1] bg-gradient-to-r from-[#FFF9F2] to-[#FFFDF8] shadow-[0_8px_24px_rgba(255,182,193,0.25)]'
              : 'border border-gray-200 hover:border-[#EADBC8] bg-white hover:shadow-md'
              }`}
          >
            <div className="flex items-center space-x-4">
              <div className="relative">
                <motion.div animate={{ y: [0, -2, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
                  {companion.imagePath ? (
                    <Image
                      src={companion.imagePath}
                      alt={companion.name}
                      width={48}
                      height={48}
                      className="rounded-full object-cover shadow-sm"
                      unoptimized={companion.imagePath.includes('(') || companion.imagePath.includes(')')}
                      onError={(e) => {
                        console.error('❌ [角色圖標] 圖片載入失敗:', companion.imagePath);
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-100">
                      {companion.icon && <companion.icon className="w-8 h-8 text-gray-400" />}
                    </div>
                  )}
                </motion.div>
                {selectedRoles.includes(companion.name) && (
                  <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-[#FFB6C1] rounded-full flex items-center justify-center shadow"
                  >
                    <span className="text-white text-xs">✓</span>
                  </motion.div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[#4B4036]">
                  {companion.id === 'hibi' ? '（綜合）希希' :
                    companion.id === 'mori' ? '（多模型研究）墨墨' :
                      companion.id === 'pico' ? '（繪圖）皮可' :
                        companion.name}
                </h3>
                <p className="text-sm text-[#2B3A3B]">{companion.specialty}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="flex space-x-2 mb-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={selectAll}
          className="px-3 py-2 text-sm rounded-lg font-medium transition-colors bg-gradient-to-br from-[#DDEBFF] to-[#EAF3FF] text-[#2B3A3B] hover:shadow"
        >
          全選
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={clearAll}
          className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
        >
          清空
        </motion.button>
      </div>

      <div className="flex space-x-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleConfirm}
          disabled={selectedRoles.length === 0}
          className={`flex-1 px-4 py-3 rounded-xl font-medium shadow-lg transition-all ${selectedRoles.length > 0
            ? 'bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white hover:shadow-xl'
            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
        >
          確認選擇 ({selectedRoles.length})
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCancel}
          className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-medium transition-colors"
        >
          取消
        </motion.button>
      </div>
    </div>
  );
}
