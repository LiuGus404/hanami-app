'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import { getSaasSupabaseClient } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cog6ToothIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  AdjustmentsHorizontalIcon,
  BookmarkSquareIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon,
  XMarkIcon,
  PlusIcon,
  CheckCircleIcon,
  Bars3Icon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Image from 'next/image';
import AppSidebar from '@/components/AppSidebar';

interface ModelOption {
  model_id: string;
  display_name?: string;
  provider?: string;
}

type ModalityKey =
  | 'textInput'
  | 'textOutput'
  | 'imageInput'
  | 'imageOutput'
  | 'audioInput'
  | 'audioOutput'
  | 'videoInput'
  | 'videoOutput';

const MODALITY_TO_SOURCE: Record<ModalityKey, string> = {
  textInput: 'text_input',
  textOutput: 'text_output',
  imageInput: 'image_input',
  imageOutput: 'image_output',
  audioInput: 'audio_input',
  audioOutput: 'audio_output',
  videoInput: 'video_input',
  videoOutput: 'video_output',
};

const MODALITY_OPTIONS: { key: ModalityKey; label: string }[] = [
  { key: 'textInput', label: '文字輸入' },
  { key: 'textOutput', label: '文字輸出' },
  { key: 'imageInput', label: '圖像輸入' },
  { key: 'imageOutput', label: '圖像輸出' },
  { key: 'audioInput', label: '語音輸入' },
  { key: 'audioOutput', label: '語音輸出' },
  { key: 'videoInput', label: '影片輸入' },
  { key: 'videoOutput', label: '影片輸出' },
];

const DEFAULT_MODALITIES_STATE: Record<ModalityKey, boolean> = {
  textInput: false,
  textOutput: false,
  imageInput: false,
  imageOutput: false,
  audioInput: false,
  audioOutput: false,
  videoInput: false,
  videoOutput: false,
};

interface ModelConfigSnapshot {
  id: string;
  model_id: string;
  display_name: string;
  provider: string;
  description: string;
  model_type?: string | null;
  input_cost_usd: string;
  output_cost_usd: string;
  modalities: Record<ModalityKey, boolean>;
  otherModalities: string[];
  supportsSearch: boolean;
  otherCapabilities: string[];
  pricingDetails: Record<string, any>;
  metadata: Record<string, any>;
  foodRatio: string;
  foodTokens: FoodTokenConfig;
}

interface FoodTokenConfig {
  text_input: string;
  text_output: string;
  image_input: string;
  image_output: string;
  audio_input: string;
  audio_output: string;
  video_input: string;
  video_output: string;
}

interface EditableModelConfig extends ModelConfigSnapshot {
  isSaving: boolean;
}

interface RoleConfigSnapshot {
  id: string;
  name: string;
  slug: string;
  default_model: string;
  system_prompt: string;
  allowed_models: string[];
  base_food_cost: string;
}

interface RoleConfig extends RoleConfigSnapshot {
  isSaving: boolean;
}

export default function AdminControlCenterPage() {
  const { user, loading } = useSaasAuth();
  const supabase = useMemo(() => getSaasSupabaseClient(), []);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [roleLoading, setRoleLoading] = useState(true);
  const [modelConfigs, setModelConfigs] = useState<EditableModelConfig[]>([]);
  const [originalModelConfigs, setOriginalModelConfigs] = useState<Record<string, ModelConfigSnapshot>>({});
  const [roleConfigs, setRoleConfigs] = useState<RoleConfig[]>([]);
  const [originalConfigs, setOriginalConfigs] = useState<Record<string, RoleConfigSnapshot>>({});
  const [modelOptions, setModelOptions] = useState<ModelOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'ai-models' | 'role-config' | 'role-permissions' | 'audit-logs' | 'ai-project-logs'>('ai-models');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // AI 專案對話紀錄相關狀態
  type LogTabKey = 'rooms' | 'users' | 'messages' | 'errors';
  const [logActiveTab, setLogActiveTab] = useState<LogTabKey>('rooms');
  const [logLoading, setLogLoading] = useState(true);
  const [logUsers, setLogUsers] = useState<any[]>([]);
  const [logRooms, setLogRooms] = useState<any[]>([]);
  const [logMessages, setLogMessages] = useState<any[]>([]);
  const [showLogDialog, setShowLogDialog] = useState(false);
  const [logDialogTitle, setLogDialogTitle] = useState('');
  const [logDialogItems, setLogDialogItems] = useState<any[]>([]);

  const formatHK = (iso?: string | null) => {
    if (!iso) return '-';
    try {
      return new Date(iso).toLocaleString('zh-HK', { timeZone: 'Asia/Hong_Kong' });
    } catch {
      return iso;
    }
  };

  const tabLabel = (t: LogTabKey) => (t === 'rooms' ? '專案' : t === 'users' ? '用戶' : t === 'messages' ? '對話' : '錯誤');

  const openRoomConversation = async (roomId: string) => {
    try {
      setShowLogDialog(true);
      setLogDialogTitle(`專案對話：${roomId}`);
      const saas = getSaasSupabaseClient();
      const res: any = await (saas.from('ai_messages') as any)
        .select('id,room_id,sender_type,sender_user_id,content,content_json,status,error_message,created_at')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });
      setLogDialogItems(res?.data || []);
    } catch (e) {
      setLogDialogItems([]);
    }
  };
  const [expandedModelIds, setExpandedModelIds] = useState<Set<string>>(new Set());
  const [modelSearchTerm, setModelSearchTerm] = useState('');
  const [modelFilter, setModelFilter] = useState<'all' | ModalityKey | 'supportsSearch'>('all');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedModelRows, setSelectedModelRows] = useState<Set<string>>(new Set());
  const [isDeletingModels, setIsDeletingModels] = useState(false);
  const [roleSearchTerm, setRoleSearchTerm] = useState('');
  const [roleSelectionMode, setRoleSelectionMode] = useState(false);
  const [selectedRoleRows, setSelectedRoleRows] = useState<Set<string>>(new Set());
  const [isDeletingRoles, setIsDeletingRoles] = useState(false);
  const [expandedRoleIds, setExpandedRoleIds] = useState<Set<string>>(new Set());
  const [roleModelFilters, setRoleModelFilters] = useState<
    Record<string, { search: string; filter: 'all' | ModalityKey | 'supportsSearch'; isOpen: boolean }>
  >({});

  const syncModelOptionsWith = useCallback((configs: EditableModelConfig[]) => {
    setModelOptions(
      configs.map((config) => ({
        model_id: config.model_id,
        display_name: config.display_name || config.model_id,
        provider: config.provider || '佚名來源',
      }))
    );
  }, []);

  const ensureObject = (value: any): Record<string, any> => {
    if (!value) return {};
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return typeof parsed === 'object' && parsed !== null ? { ...parsed } : {};
      } catch (error) {
        return {};
      }
    }
    if (typeof value === 'object' && !Array.isArray(value)) {
      return { ...value };
    }
    return {};
  };

  const ensureStringArray = (value: any): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value
        .map((item) => (typeof item === 'string' ? item : String(item)))
        .filter((item) => item.length > 0);
    }
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return ensureStringArray(parsed);
      } catch (error) {
        return value.split(',').map((item) => item.trim()).filter((item) => item.length > 0);
      }
    }
    return [];
  };

  const buildModalitiesState = (modalities: string[]): { state: Record<ModalityKey, boolean>; extras: string[] } => {
    const state: Record<ModalityKey, boolean> = { ...DEFAULT_MODALITIES_STATE };
    const extras: string[] = [];

    modalities.forEach((item) => {
      const foundEntry = Object.entries(MODALITY_TO_SOURCE).find(([, value]) => value === item || value.replace('_', '-') === item);
      if (foundEntry) {
        const key = foundEntry[0] as ModalityKey;
        state[key] = true;
      } else {
        extras.push(item);
      }
    });

    return { state, extras };
  };

  const extractFoodRatio = (pricingDetails: Record<string, any>, metadata: Record<string, any>) => {
    const ratio = pricingDetails?.food_ratio ?? pricingDetails?.foodMultiplier ?? metadata?.food_ratio;
    if (ratio === undefined || ratio === null) return '';
    const numeric = Number(ratio);
    return Number.isFinite(numeric) && numeric > 0 ? String(numeric) : '';
  };

  const extractFoodTokens = (metadata: Record<string, any>): FoodTokenConfig => {
    const ft = metadata?.food_tokens || {};
    const toString = (val: any) => (val !== undefined && val !== null ? String(val) : '');
    return {
      text_input: toString(ft.text_input),
      text_output: toString(ft.text_output),
      image_input: toString(ft.image_input),
      image_output: toString(ft.image_output),
      audio_input: toString(ft.audio_input),
      audio_output: toString(ft.audio_output),
      video_input: toString(ft.video_input),
      video_output: toString(ft.video_output),
    };
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [{ data: rolesData, error: rolesError }, { data: modelsData, error: modelsError }] = await Promise.all([
        supabase
          .from('ai_roles')
          .select('id, name, slug, default_model, system_prompt, pricing_override, available_models')
          .order('name', { ascending: true }),
        supabase
          .from('model_configs')
          .select('id, model_id, display_name, provider, description, model_type, input_cost_usd, output_cost_usd, supported_modalities, capabilities, pricing_details, metadata')
          .eq('is_active', true)
          .eq('is_available', true)
          .order('display_name', { ascending: true }),
      ]);

      if (rolesError) {
        throw rolesError;
      }
      if (modelsError) {
        throw modelsError;
      }

      const mappedModelConfigs: EditableModelConfig[] = (modelsData || []).map((model) => {
        const supportedModalitiesRaw = (model as any).supported_modalities;
        const hasModalities = supportedModalitiesRaw !== undefined && supportedModalitiesRaw !== null;
        const supportedModalities = hasModalities ? ensureStringArray(supportedModalitiesRaw) : [];
        const { state: modalitiesState, extras: otherModalities } = hasModalities
          ? buildModalitiesState(supportedModalities)
          : { state: { ...DEFAULT_MODALITIES_STATE }, extras: [] };

        const rawCapabilities = ensureStringArray((model as any).capabilities);
        const supportsSearch = rawCapabilities.some((item) => item.toLowerCase().includes('search'));
        const otherCapabilities = rawCapabilities.filter((item) => !item.toLowerCase().includes('search'));

        const pricingDetails = ensureObject((model as any).pricing_details);
        const metadata = ensureObject((model as any).metadata);
        const ratio = extractFoodRatio(pricingDetails, metadata) || '300';

        const toStringOrEmpty = (value: any) => {
          if (value === null || value === undefined || value === '') return '';
          return String(value);
        };

        const editable: EditableModelConfig = {
          id: (model as any).id,
          model_id: (model as any).model_id,
          display_name: (model as any).display_name || (model as any).model_id || '',
          provider: (model as any).provider || '',
          description: (model as any).description || '',
          model_type: (model as any).model_type || '',
          input_cost_usd: toStringOrEmpty((model as any).input_cost_usd),
          output_cost_usd: toStringOrEmpty((model as any).output_cost_usd),
          modalities: modalitiesState,
          otherModalities,
          supportsSearch,
          otherCapabilities,
          pricingDetails,
          metadata,
          foodRatio: ratio,
          foodTokens: extractFoodTokens(metadata),
          isSaving: false,
        };

        return editable;
      });

      const modelSnapshotRecord: Record<string, ModelConfigSnapshot> = {};
      mappedModelConfigs.forEach(({ isSaving: _isSaving, ...rest }) => {
        modelSnapshotRecord[rest.id] = JSON.parse(JSON.stringify(rest));
      });
      setModelConfigs(mappedModelConfigs);
      setOriginalModelConfigs(modelSnapshotRecord);
      syncModelOptionsWith(mappedModelConfigs);
      setSelectedModelRows(new Set());

      const mappedRoles: RoleConfig[] = (rolesData || []).map((role: any) => {
        let pricingOverride = role.pricing_override as any;
        if (typeof pricingOverride === 'string') {
          try {
            pricingOverride = JSON.parse(pricingOverride);
          } catch (parseError) {
            pricingOverride = null;
          }
        }

        const baseFoodCostValue = pricingOverride?.base_food_cost;
        const baseFoodCost = baseFoodCostValue === undefined || baseFoodCostValue === null ? '' : String(baseFoodCostValue);

        const allowedModels = Array.isArray(role.available_models)
          ? role.available_models.filter((item: unknown): item is string => typeof item === 'string')
          : [];

        return {
          id: role.id,
          name: role.name || role.slug || '未命名角色',
          slug: role.slug || role.name || '',
          default_model: role.default_model || '',
          system_prompt: role.system_prompt || '',
          allowed_models: allowedModels,
          base_food_cost: baseFoodCost,
          isSaving: false,
        };
      });

      const snapshotRecord: Record<string, RoleConfigSnapshot> = {};
      mappedRoles.forEach(({ isSaving: _isSaving, ...snapshot }) => {
        snapshotRecord[snapshot.id] = snapshot;
      });

      setOriginalConfigs(snapshotRecord);
      setRoleConfigs(mappedRoles);
    } catch (err: any) {
      console.error('載入管理資料失敗:', err);
      setError(err?.message || '載入資料時發生錯誤');
    } finally {
      setIsLoading(false);
    }
  }, [supabase, syncModelOptionsWith]);

  // 檢查 super_admin 身份
  useEffect(() => {
    let cancelled = false;
    const resolveRole = async () => {
      if (!user) {
        setIsSuperAdmin(false);
        setRoleLoading(false);
        return;
      }

      // 首先檢查 user 對象中的各種可能的 role 字段
      const normalizedRoleFromUser = (
        (user as any)?.user_role ??
        (user as any)?.role ??
        (user as any)?.metadata?.user_role ??
        (user as any)?.metadata?.role ??
        (user as any)?.app_metadata?.user_role ??
        (user as any)?.app_metadata?.role ??
        ''
      )
        .toString()
        .trim()
        .toLowerCase();

      if (normalizedRoleFromUser === 'super_admin' || normalizedRoleFromUser === 'admin') {
        console.log('AdminControlCenter: 從 user 對象檢測到 super_admin/admin 身份');
        setIsSuperAdmin(true);
        setRoleLoading(false);
        return;
      }

      // 如果 user 對象中沒有 role，則從數據庫查詢
      const userId = (user as any)?.id || (user as any)?.user_id;
      const userEmail = (user as any)?.email;

      if (!userId && !userEmail) {
        setIsSuperAdmin(false);
        setRoleLoading(false);
        return;
      }

      try {
        let query = supabase.from('saas_users').select('user_role');

        if (userId) {
          query = query.eq('id', userId);
        } else if (userEmail) {
          query = query.eq('email', userEmail);
        }

        const { data: userData, error } = await query.maybeSingle();

        if (!cancelled) {
          if (error) {
            console.error('AdminControlCenter: 讀取 user_role 失敗:', error.message);
            setIsSuperAdmin(false);
          } else {
            const role = (userData as { user_role: string } | null)?.user_role || 'user';
            const isSuperAdminRole = role.toLowerCase() === 'super_admin' || role.toLowerCase() === 'admin';
            console.log('AdminControlCenter: 從數據庫讀取 user_role:', role, 'isSuperAdmin:', isSuperAdminRole);
            setIsSuperAdmin(isSuperAdminRole);
          }
          setRoleLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('AdminControlCenter: 查詢 user_role 發生錯誤:', err);
          setIsSuperAdmin(false);
          setRoleLoading(false);
        }
      }
    };

    resolveRole();
    return () => {
      cancelled = true;
    };
  }, [user, supabase]);

  useEffect(() => {
    if (loading || roleLoading) return;
    if (isSuperAdmin) {
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [loading, roleLoading, isSuperAdmin, loadData]);

  // 載入 AI 專案對話紀錄
  useEffect(() => {
    if (activeSection !== 'ai-project-logs' || !isSuperAdmin || roleLoading) return;

    const loadLogs = async () => {
      setLogLoading(true);
      try {
        const saas = getSaasSupabaseClient();
        const [uRes, rRes, mRes] = await Promise.all([
          (saas.from('saas_users') as any).select('id,email,full_name,created_at').order('created_at', { ascending: false }).limit(200),
          (saas.from('ai_rooms') as any).select('id,title,description,created_by,created_at,last_message_at').order('created_at', { ascending: false }).limit(200),
          (saas.from('ai_messages') as any)
            .select('id,room_id,sender_type,sender_user_id,content,content_json,status,error_message,created_at')
            .order('created_at', { ascending: false })
            .limit(400)
        ]);
        setLogUsers((uRes as any)?.data || []);
        setLogRooms((rRes as any)?.data || []);
        setLogMessages((mRes as any)?.data || []);
      } finally {
        setLogLoading(false);
      }
    };
    loadLogs();
  }, [activeSection, isSuperAdmin, roleLoading]);

  const updateRoleConfigs = (roleId: string, updater: (role: RoleConfig) => RoleConfig) => {
    setRoleConfigs((prev) => prev.map((role) => (role.id === roleId ? updater(role) : role)));
  };

  const handleChangeDefaultModel = (roleId: string, value: string) => {
    updateRoleConfigs(roleId, (role) => {
      if (!value) {
        return { ...role, default_model: '' };
      }
      const nextAllowed = role.allowed_models.includes(value) ? role.allowed_models : [...role.allowed_models, value];
      return {
        ...role,
        allowed_models: nextAllowed,
        default_model: value,
      };
    });
  };

  const handleChangeSystemPrompt = (roleId: string, value: string) => {
    updateRoleConfigs(roleId, (role) => ({ ...role, system_prompt: value }));
  };

  const handleChangeBaseFoodCost = (roleId: string, value: string) => {
    updateRoleConfigs(roleId, (role) => ({ ...role, base_food_cost: value }));
  };

  const handleSaveRole = async (roleId: string) => {
    const role = roleConfigs.find((r) => r.id === roleId);
    if (!role) return;

    const baseFoodCostNumber = role.base_food_cost !== '' ? Number(role.base_food_cost) : null;
    if (role.base_food_cost !== '' && Number.isNaN(baseFoodCostNumber)) {
      toast.error('請輸入有效的食量成本（數字）');
      return;
    }

    updateRoleConfigs(roleId, (config) => ({ ...config, isSaving: true }));

    try {
      const updates: Record<string, any> = {
        default_model: role.default_model || null,
        system_prompt: role.system_prompt || null,
        available_models: role.allowed_models,
        pricing_override: baseFoodCostNumber !== null ? { base_food_cost: baseFoodCostNumber } : null,
      };

      const { error: updateError } = await (supabase as any)
        .from('ai_roles')
        .update(updates)
        .eq('id', roleId);

      if (updateError) {
        throw updateError;
      }

      const snapshot: RoleConfigSnapshot = {
        id: role.id,
        name: role.name,
        slug: role.slug,
        default_model: role.default_model,
        system_prompt: role.system_prompt,
        allowed_models: role.allowed_models,
        base_food_cost: role.base_food_cost,
      };

      setOriginalConfigs((prev) => ({ ...prev, [roleId]: snapshot }));
      updateRoleConfigs(roleId, (config) => ({ ...config, isSaving: false }));
      toast.success(`${role.name} 已更新`);
    } catch (err: any) {
      console.error('儲存角色設定失敗:', err);
      toast.error(err?.message || '儲存失敗，請稍後再試');
      updateRoleConfigs(roleId, (config) => ({ ...config, isSaving: false }));
    }
  };

  const handleResetRole = (roleId: string) => {
    const snapshot = originalConfigs[roleId];
    if (!snapshot) return;
    setRoleConfigs((prev) =>
      prev.map((role) =>
        role.id === roleId
          ? {
            ...snapshot,
            isSaving: false,
          }
          : role
      )
    );
    toast.success('已還原此角色的未儲存變更');
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadData();
      toast.success('資料已重新整理');
    } catch (err: any) {
      toast.error(err?.message || '重新整理失敗');
    } finally {
      setIsRefreshing(false);
    }
  };

  const resolveModelLabel = (modelId: string) => {
    const option = modelOptions.find((item) => item.model_id === modelId);
    if (!option) return modelId;
    const providerLabel = option.provider ? ` · ${option.provider}` : '';
    return `${option.display_name || option.model_id}${providerLabel}`;
  };

  const updateModelConfigs = (modelId: string, updater: (config: EditableModelConfig) => EditableModelConfig) => {
    setModelConfigs((prev) => {
      const next = prev.map((config) => (config.id === modelId ? updater(config) : config));
      syncModelOptionsWith(next);
      return next;
    });
  };

  const toggleModelSelection = (id: string) => {
    if (!isSelectionMode) return;
    setSelectedModelRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const clearModelSelection = useCallback(() => {
    setSelectedModelRows(new Set());
  }, []);

  const enterSelectionMode = () => {
    setIsSelectionMode(true);
  };

  const cancelSelectionMode = () => {
    clearModelSelection();
    setIsSelectionMode(false);
  };

  const removeSelectedModels = useCallback(async () => {
    if (selectedModelRows.size === 0) return;
    const idsToRemove = Array.from(selectedModelRows);
    setIsDeletingModels(true);
    try {
      const { error: deleteError } = await supabase.from('model_configs').delete().in('id', idsToRemove);
      if (deleteError) {
        throw deleteError;
      }

      setModelConfigs((prev) => {
        const next = prev.filter((config) => !selectedModelRows.has(config.id));
        syncModelOptionsWith(next);
        return next;
      });
      setOriginalModelConfigs((prev) => {
        const next = { ...prev };
        idsToRemove.forEach((id) => {
          delete next[id];
        });
        return next;
      });
      setExpandedModelIds((prev) => {
        const next = new Set(prev);
        idsToRemove.forEach((id) => next.delete(id));
        return next;
      });
      toast.success(`已刪除 ${idsToRemove.length} 個模型`);
      clearModelSelection();
    } catch (err: any) {
      console.error('刪除模型失敗:', err);
      toast.error(err?.message || '刪除模型失敗，請稍後再試');
    } finally {
      setIsDeletingModels(false);
    }
  }, [selectedModelRows, supabase, syncModelOptionsWith, clearModelSelection]);

  const getRoleModelFilterState = (roleId: string) => {
    return roleModelFilters[roleId] ?? { search: '', filter: 'all' as 'all' | ModalityKey | 'supportsSearch', isOpen: false };
  };

  const updateRoleModelFilter = (
    roleId: string,
    partial: Partial<{ search: string; filter: 'all' | ModalityKey | 'supportsSearch'; isOpen: boolean }>
  ) => {
    setRoleModelFilters((prev) => {
      const current = prev[roleId] ?? { search: '', filter: 'all' as 'all' | ModalityKey | 'supportsSearch', isOpen: false };
      return {
        ...prev,
        [roleId]: { ...current, ...partial },
      };
    });
  };

  const toggleRoleSelection = (roleId: string) => {
    if (!roleSelectionMode) return;
    setSelectedRoleRows((prev) => {
      const next = new Set(prev);
      if (next.has(roleId)) {
        next.delete(roleId);
      } else {
        next.add(roleId);
      }
      return next;
    });
  };

  const clearRoleSelection = useCallback(() => {
    setSelectedRoleRows(new Set());
  }, []);

  const enterRoleSelectionMode = () => {
    setRoleSelectionMode(true);
  };

  const cancelRoleSelectionMode = () => {
    clearRoleSelection();
    setRoleSelectionMode(false);
  };

  const toggleRoleExpanded = (roleId: string) => {
    setExpandedRoleIds((prev) => {
      const next = new Set(prev);
      if (next.has(roleId)) {
        next.delete(roleId);
      } else {
        next.add(roleId);
      }
      return next;
    });
  };

  const removeSelectedRoles = useCallback(async () => {
    if (selectedRoleRows.size === 0) return;
    const idsToRemove = Array.from(selectedRoleRows);
    setIsDeletingRoles(true);
    try {
      const { error: deleteError } = await supabase.from('ai_roles').delete().in('id', idsToRemove);
      if (deleteError) {
        throw deleteError;
      }

      setRoleConfigs((prev) => prev.filter((role) => !selectedRoleRows.has(role.id)));
      setOriginalConfigs((prev) => {
        const next = { ...prev };
        idsToRemove.forEach((id) => {
          delete next[id];
        });
        return next;
      });
      setRoleModelFilters((prev) => {
        const next = { ...prev };
        idsToRemove.forEach((id) => {
          delete next[id];
        });
        return next;
      });
      toast.success(`已刪除 ${idsToRemove.length} 個角色`);
      clearRoleSelection();
    } catch (err: any) {
      console.error('刪除角色失敗:', err);
      toast.error(err?.message || '刪除角色失敗，請稍後再試');
    } finally {
      setIsDeletingRoles(false);
      setRoleSelectionMode(false);
    }
  }, [selectedRoleRows, supabase, clearRoleSelection]);

  const handleToggleRoleModel = (roleId: string, modelId: string) => {
    updateRoleConfigs(roleId, (role) => {
      const exists = role.allowed_models.includes(modelId);
      const nextAllowed = exists ? role.allowed_models.filter((id) => id !== modelId) : [...role.allowed_models, modelId];
      const nextDefault = exists && role.default_model === modelId ? '' : role.default_model;
      return {
        ...role,
        allowed_models: nextAllowed,
        default_model: nextDefault,
      };
    });
  };

  const handleSetDefaultModel = (roleId: string, modelId: string) => {
    updateRoleConfigs(roleId, (role) => {
      const nextAllowed = role.allowed_models.includes(modelId) ? role.allowed_models : [...role.allowed_models, modelId];
      return {
        ...role,
        allowed_models: nextAllowed,
        default_model: modelId,
      };
    });
  };

  const handleModelValueChange = (
    modelId: string,
    field: 'display_name' | 'provider' | 'description' | 'model_type' | 'input_cost_usd' | 'output_cost_usd' | 'foodRatio' | 'model_id',
    value: string
  ) => {
    updateModelConfigs(modelId, (config) => ({ ...config, [field]: value }));
  };

  const handleFoodTokenChange = (modelId: string, key: keyof FoodTokenConfig, value: string) => {
    updateModelConfigs(modelId, (config) => ({
      ...config,
      foodTokens: {
        ...config.foodTokens,
        [key]: value,
      },
    }));
  };

  const handleToggleModality = (modelId: string, key: ModalityKey) => {
    updateModelConfigs(modelId, (config) => ({
      ...config,
      modalities: {
        ...config.modalities,
        [key]: !config.modalities[key],
      },
    }));
  };

  const handleToggleSearchCapability = (modelId: string) => {
    updateModelConfigs(modelId, (config) => ({
      ...config,
      supportsSearch: !config.supportsSearch,
    }));
  };

  const handleResetModel = (modelId: string) => {
    const snapshot = originalModelConfigs[modelId];
    if (!snapshot) return;
    const clonedSnapshot: EditableModelConfig = {
      ...JSON.parse(JSON.stringify(snapshot)),
      isSaving: false,
    };
    updateModelConfigs(modelId, () => clonedSnapshot);
  };

  const handleAddNewModel = () => {
    const newId = `new-${Date.now()}`;
    const newModel: EditableModelConfig = {
      id: newId,
      model_id: '',
      display_name: '新模型',
      provider: '',
      description: '',
      model_type: '',
      input_cost_usd: '0',
      output_cost_usd: '0',
      modalities: { ...DEFAULT_MODALITIES_STATE },
      otherModalities: [],
      supportsSearch: false,
      otherCapabilities: [],
      pricingDetails: {},
      metadata: {},
      foodRatio: '300',
      foodTokens: {
        text_input: '',
        text_output: '',
        image_input: '',
        image_output: '',
        audio_input: '',
        audio_output: '',
        video_input: '',
        video_output: '',
      },
      isSaving: false,
    };

    setModelConfigs((prev) => [newModel, ...prev]);
    setExpandedModelIds((prev) => {
      const next = new Set(prev);
      next.add(newId);
      return next;
    });
    toast.success('已新增一個空白模型，請填寫詳細資訊後儲存');
  };

  const handleSaveModel = async (modelId: string) => {
    const model = modelConfigs.find((item) => item.id === modelId);
    if (!model) return;

    const parseCostValue = (label: string, value: string): number | null => {
      if (!value || value.trim() === '') return null;
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) {
        toast.error(`${label} 必須為數字`);
        throw new Error('INVALID_NUMBER');
      }
      return numeric;
    };

    let inputCost: number | null;
    let outputCost: number | null;

    try {
      inputCost = parseCostValue('輸入成本', model.input_cost_usd);
      outputCost = parseCostValue('輸出成本', model.output_cost_usd);
    } catch (error) {
      return;
    }

    let foodRatioNumber: number | null = null;
    if (model.foodRatio.trim() !== '') {
      foodRatioNumber = Number(model.foodRatio);
      if (!Number.isFinite(foodRatioNumber) || foodRatioNumber <= 0) {
        toast.error('食量計算比例需為大於 0 的數字');
        return;
      }
    }

    updateModelConfigs(modelId, (config) => ({ ...config, isSaving: true }));

    try {
      const selectedModalities = Object.entries(model.modalities)
        .filter(([, enabled]) => enabled)
        .map(([key]) => MODALITY_TO_SOURCE[key as ModalityKey]);
      const modalitiesPayload = Array.from(new Set([...selectedModalities, ...model.otherModalities]));

      const normalizedOtherCapabilities = model.otherCapabilities.filter((item) => item && item.length > 0);
      const baseCapabilities = Array.from(new Set(normalizedOtherCapabilities));
      const searchKey = 'search';
      const finalCapabilities = model.supportsSearch
        ? Array.from(new Set([...baseCapabilities, searchKey]))
        : baseCapabilities.filter((item) => item.toLowerCase() !== searchKey);

      const updatedPricingDetails = { ...model.pricingDetails };
      const updatedMetadata = { ...model.metadata };

      if (foodRatioNumber !== null) {
        updatedPricingDetails.food_ratio = foodRatioNumber;
        updatedMetadata.food_ratio = foodRatioNumber;
      } else {
        delete updatedPricingDetails.food_ratio;
        delete updatedMetadata.food_ratio;
      }

      // Process Food Tokens
      const foodTokensPayload: Record<string, number> = {};
      let hasFoodTokens = false;
      (Object.keys(model.foodTokens) as Array<keyof FoodTokenConfig>).forEach((key) => {
        const val = model.foodTokens[key];
        if (val && val.trim() !== '') {
          const num = Number(val);
          if (Number.isFinite(num)) {
            foodTokensPayload[key] = num;
            hasFoodTokens = true;
          }
        }
      });

      if (hasFoodTokens) {
        updatedMetadata.food_tokens = foodTokensPayload;
      } else {
        delete updatedMetadata.food_tokens;
      }

      const updates: Record<string, any> = {
        display_name: model.display_name,
        provider: model.provider || 'unknown',
        description: model.description,
        model_type: model.model_type || 'text',
        input_cost_usd: inputCost,
        output_cost_usd: outputCost,
        supported_modalities: modalitiesPayload,
        capabilities: finalCapabilities,
        pricing_details: updatedPricingDetails,
        metadata: updatedMetadata,
        model_id: model.model_id,
        // model_name is required by DB but not in UI, mapping from display_name
        model_name: model.display_name || model.model_id,
      };

      // Check if it's a new model (id starts with 'new-')
      const isNewModel = modelId.startsWith('new-');
      let savedData = null;

      if (isNewModel) {
        // Ensure model_id is present for new models as it might be required
        if (!updates.model_id) {
          throw new Error('請輸入模型 ID');
        }

        // Set default values for new models to ensure they appear in the list
        updates.is_active = true;
        updates.is_available = true;
        updates.is_free = false; // Default to false, can be updated later if we add UI for it

        const { data, error: insertError } = await (supabase as any)
          .from('model_configs')
          .insert(updates)
          .select()
          .single();

        if (insertError) throw insertError;
        savedData = data;
      } else {
        // For existing models, perform UPDATE
        const { data, error: updateError } = await (supabase as any)
          .from('model_configs')
          .update(updates)
          .eq('id', model.id)
          .select()
          .single();

        if (updateError) throw updateError;
        savedData = data;
      }

      const normalizedInputCost = inputCost === null ? '' : String(inputCost);
      const normalizedOutputCost = outputCost === null ? '' : String(outputCost);
      const normalizedFoodRatio = foodRatioNumber === null ? '' : String(foodRatioNumber);
      const cleanedOtherCapabilities = finalCapabilities.filter((item) => item.toLowerCase() !== 'search');

      // If it was a new model, we need to replace the temp ID in the state with the real ID
      if (isNewModel && savedData) {
        const realId = savedData.id;

        // Update the item in the list with the new ID and data
        setModelConfigs(prev => prev.map(item => {
          if (item.id === modelId) {
            return {
              ...item,
              id: realId,
              isSaving: false,
              input_cost_usd: normalizedInputCost,
              output_cost_usd: normalizedOutputCost,
              foodRatio: normalizedFoodRatio,
              otherCapabilities: cleanedOtherCapabilities,
              pricingDetails: updatedPricingDetails,
              metadata: updatedMetadata,
            };
          }
          return item;
        }));

        // Also update expandedModelIds to use the new ID
        setExpandedModelIds(prev => {
          const next = new Set(prev);
          if (next.has(modelId)) {
            next.delete(modelId);
            next.add(realId);
          }
          return next;
        });

      } else {
        updateModelConfigs(modelId, (config) => ({
          ...config,
          isSaving: false,
          input_cost_usd: normalizedInputCost,
          output_cost_usd: normalizedOutputCost,
          foodRatio: normalizedFoodRatio,
          otherCapabilities: cleanedOtherCapabilities,
          pricingDetails: updatedPricingDetails,
          metadata: updatedMetadata,
        }));
      }

      const newSnapshot: ModelConfigSnapshot = {
        id: isNewModel && savedData ? savedData.id : model.id,
        model_id: model.model_id,
        display_name: model.display_name,
        provider: model.provider,
        description: model.description,
        model_type: model.model_type || '',
        input_cost_usd: normalizedInputCost,
        output_cost_usd: normalizedOutputCost,
        modalities: { ...model.modalities },
        otherModalities: [...model.otherModalities],
        supportsSearch: model.supportsSearch,
        otherCapabilities: [...cleanedOtherCapabilities],
        pricingDetails: { ...updatedPricingDetails },
        metadata: { ...updatedMetadata },
        foodRatio: normalizedFoodRatio,
        foodTokens: { ...model.foodTokens },
      };

      setOriginalModelConfigs((prev) => {
        const next = { ...prev };
        // If it was a new model, remove the temp ID key if you want, 
        // but mainly we want to add the new real ID key.
        if (isNewModel) {
          delete next[modelId];
          next[newSnapshot.id] = newSnapshot;
        } else {
          next[modelId] = newSnapshot;
        }
        return next;
      });

      toast.success(`${model.display_name} 模型設定已${isNewModel ? '新增' : '更新'}`);
    } catch (error: any) {
      console.error('儲存模型設定失敗:', error);
      updateModelConfigs(modelId, (config) => ({ ...config, isSaving: false }));
      toast.error(error?.message || '儲存模型設定失敗');
    }
  };

  const filteredRoleConfigs = useMemo(() => {
    const keyword = roleSearchTerm.trim().toLowerCase();
    if (!keyword) return roleConfigs;
    return roleConfigs.filter((role) => {
      const haystack = `${role.name || ''} ${role.slug || ''} ${role.system_prompt || ''}`.toLowerCase();
      return haystack.includes(keyword);
    });
  }, [roleConfigs, roleSearchTerm]);

  if (loading || roleLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#F8F5EC] flex flex-col items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
          className="w-12 h-12 border-2 border-[#FFB6C1] border-t-transparent rounded-full"
        />
        <p className="mt-4 text-[#4B4036]">載入管理員控制室...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#F8F5EC] flex flex-col items-center justify-center">
        <ShieldCheckIcon className="w-14 h-14 text-[#FFB6C1]" />
        <h1 className="mt-4 text-2xl font-semibold text-[#4B4036]">請先登入</h1>
        <p className="mt-2 text-[#2B3A3B]/70">登入後即可進入管理員控制室</p>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#F8F5EC] flex flex-col items-center justify-center px-6 text-center">
        <ShieldCheckIcon className="w-14 h-14 text-[#FFB6C1]" />
        <h1 className="mt-4 text-2xl font-semibold text-[#4B4036]">沒有存取權限</h1>
        <p className="mt-3 max-w-md text-[#2B3A3B]/70">
          您的帳號沒有管理員權限。如需協助，請聯絡系統管理員或 Hanami 支援團隊。
        </p>
        <p className="mt-2 text-xs text-[#2B3A3B]/50">
          檢測到的角色：{((user as any)?.user_role || (user as any)?.role || '未知')}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#F8F5EC]">
      {/* 頂部導航 */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-[#EADBC8] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSidebarOpen((prev) => !prev)}
                className="p-2 rounded-lg hover:bg-[#FFD59A]/20 transition-colors"
                title={sidebarOpen ? '關閉選單' : '開啟選單'}
              >
                <Bars3Icon className="w-6 h-6 text-[#4B4036]" />
              </motion.button>
              <div className="w-9 h-9 relative">
                <Image
                  src="/@hanami.png"
                  alt="HanamiEcho Logo"
                  width={36}
                  height={36}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-lg font-bold text-[#4B4036]">HanamiEcho</h1>
                <p className="text-xs text-[#2B3A3B]">管理員控制室</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[#EADBC8] text-xs sm:text-sm font-medium transition-all ${isRefreshing ? 'bg-[#F8F5EC] text-[#B8ABA0]' : 'bg-white text-[#4B4036] hover:bg-[#FFF4E0] shadow-sm'
                  }`}
              >
                <ArrowPathIcon className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? '重新整理中...' : '重新整理資料'}
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      {/* 側邊抽屜 */}
      <AppSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentPath="/aihome/admin/control-center"
      />

      <div className="py-8 px-4 lg:px-12">
        <div className="max-w-7xl mx-auto space-y-8">
          <section className="bg-white/80 backdrop-blur-md border border-[#EADBC8] rounded-3xl shadow-xl p-6 sm:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] rounded-3xl flex items-center justify-center shadow-lg">
                  <Cog6ToothIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-[#4B4036]">管理員控制室</h1>
                  <p className="mt-2 text-sm sm:text-base text-[#2B3A3B]/70 max-w-3xl leading-relaxed">
                    管理 Hanami Echo 核心 AI 設定。調整不同角色的預設模型、系統指令與食量成本，為後續權限與稽核模組鋪路。
                  </p>
                </div>
              </div>
            </div>
            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600 flex items-start gap-3">
                <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>載入資料時發生錯誤：{error}</p>
              </div>
            )}
          </section>

          <div className="flex flex-col lg:flex-row gap-6">
            <aside className="lg:w-72 flex-shrink-0">
              <div className="bg-white/85 backdrop-blur-md border border-[#EADBC8] rounded-3xl shadow-lg p-4 space-y-4">
                <div>
                  <h3 className="text-xs font-semibold text-[#8F7A65] uppercase tracking-wide mb-2">控制項目</h3>
                  <nav className="space-y-2">
                    {[
                      {
                        id: 'ai-models',
                        title: 'AI 模型庫',
                        icon: AdjustmentsHorizontalIcon,
                        description: '管理可用模型、能力與成本',
                      },
                      {
                        id: 'role-config',
                        title: '角色設定',
                        icon: PencilSquareIcon,
                        description: '指定角色預設模型與系統指令',
                      },
                      {
                        id: 'ai-project-logs',
                        title: 'AI 專案對話紀錄',
                        icon: DocumentTextIcon,
                        description: '查看專案、用戶、對話與錯誤記錄',
                      },
                      {
                        id: 'role-permissions',
                        title: '角色權限（即將推出）',
                        icon: ShieldCheckIcon,
                        description: '管理角色層級與權限矩陣',
                        disabled: true,
                      },
                      {
                        id: 'audit-logs',
                        title: '操作記錄（即將推出）',
                        icon: BookmarkSquareIcon,
                        description: '追蹤重要調整與稽核足跡',
                        disabled: true,
                      },
                    ].map((item) => {
                      const isActive = activeSection === item.id;
                      return (
                        <motion.button
                          key={item.id}
                          whileHover={item.disabled ? {} : { scale: 1.01 }}
                          whileTap={item.disabled ? {} : { scale: 0.98 }}
                          onClick={() => !item.disabled && setActiveSection(item.id as typeof activeSection)}
                          className={`w-full text-left px-4 py-3 rounded-2xl border transition-all ${isActive
                            ? 'border-transparent bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white shadow-lg'
                            : 'border-[#EADBC8] bg-white text-[#4B4036] hover:border-[#FFD59A]/60'
                            } ${item.disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-2xl flex items-center justify-center ${isActive ? 'bg-white/20 text-white' : 'bg-[#FFF4E0] text-[#4B4036]'
                                }`}
                            >
                              <item.icon className="w-4.5 h-4.5" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold tracking-wide">{item.title}</div>
                              <div className={`text-xs ${isActive ? 'text-white/80' : 'text-[#2B3A3B]/60'}`}>
                                {item.description}
                              </div>
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </nav>
                </div>
              </div>
            </aside>

            <section className="flex-1 space-y-6">
              <AnimatePresence mode="wait">
                {activeSection === 'ai-models' && (
                  <motion.div
                    key="ai-models"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.35 }}
                    className="space-y-6"
                  >
                    <div className="bg-white/85 backdrop-blur-md border border-[#EADBC8] rounded-3xl shadow-lg p-6">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-[#4B4036] flex items-center gap-2">
                          <AdjustmentsHorizontalIcon className="w-5 h-5" />
                          AI 模型庫管理
                        </h2>
                        <button
                          type="button"
                          onClick={handleAddNewModel}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white text-sm font-semibold shadow hover:shadow-lg transition flex items-center gap-2"
                        >
                          <PlusIcon className="w-4 h-4" />
                          新增模型
                        </button>
                      </div>
                      <p className="mt-2 text-sm text-[#2B3A3B]/70">
                        管理可用模型的能力、成本與食量換算比例。這些設定會用於角色預設模型與食量計算。
                      </p>
                      <details className="mt-4 bg-white/70 border border-[#EADBC8] rounded-3xl shadow-sm" open={false}>
                        <summary className="flex items-center justify-between px-5 py-3 cursor-pointer select-none">
                          <div className="flex items-center gap-2 text-sm font-semibold text-[#4B4036]">
                            <svg className="w-5 h-5 text-[#FFB6C1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.1-5.4a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
                            </svg>
                            篩選與搜尋
                          </div>
                          <svg className="w-4 h-4 text-[#8F7A65] transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </summary>
                        <div className="pt-1 pb-4 px-5 space-y-4">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-[#8F7A65] mb-2 tracking-wide uppercase">
                                關鍵字搜尋
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={modelSearchTerm}
                                  onChange={(event) => setModelSearchTerm(event.target.value)}
                                  placeholder="輸入模型名稱、ID 或描述..."
                                  className="w-full px-4 py-2.5 pl-10 rounded-xl border border-[#EADBC8] focus:outline-none focus:ring-2 focus:ring-[#FFB6C1] focus:border-transparent text-sm text-[#4B4036]"
                                />
                                <svg className="w-4 h-4 text-[#8F7A65] absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.1-5.4a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
                                </svg>
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-[#8F7A65] mb-2 tracking-wide uppercase">
                                模型範圍
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {[
                                  { value: 'all', label: '全部模態' },
                                  { value: 'supportsSearch', label: '支援搜尋' },
                                  ...MODALITY_OPTIONS.map((option) => ({
                                    value: option.key,
                                    label: option.label,
                                  })),
                                ].map((option) => {
                                  const isActive = modelFilter === option.value;
                                  return (
                                    <button
                                      key={option.value}
                                      type="button"
                                      onClick={() => setModelFilter(option.value as typeof modelFilter)}
                                      className={`px-3 py-1.5 rounded-full border text-xs font-medium transition ${isActive
                                        ? 'bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white border-transparent shadow'
                                        : 'border-[#EADBC8] text-[#4B4036] bg-white hover:border-[#FFD59A]'
                                        }`}
                                    >
                                      {option.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                            <div className="flex flex-col gap-3">
                              <div>
                                <label className="block text-xs font-semibold text-[#8F7A65] mb-2 tracking-wide uppercase">
                                  快速動作
                                </label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setModelSearchTerm('');
                                    setModelFilter('all');
                                  }}
                                  className="w-full px-4 py-2 rounded-xl border border-[#EADBC8] text-sm text-[#4B4036] hover:bg-[#FFF4E0] transition"
                                >
                                  重置篩選
                                </button>
                              </div>
                              {modelFilter !== 'all' && (
                                <p className="text-[11px] text-[#8F7A65]/70">
                                  已套用篩選：{
                                    MODALITY_OPTIONS.find((option) => option.key === modelFilter)?.label ||
                                    (modelFilter === 'supportsSearch' ? '支援搜尋 / Research' : '全部模態')
                                  }
                                </p>
                              )}
                              <div className="bg-[#FFFDF8] border border-dashed border-[#EADBC8] rounded-xl p-3 text-xs text-[#2B3A3B]/70 space-y-2">
                                {isSelectionMode ? (
                                  <>
                                    <p>
                                      <strong>{selectedModelRows.size}</strong> 個模型已選擇
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => removeSelectedModels()}
                                        disabled={selectedModelRows.size === 0 || isDeletingModels}
                                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition ${selectedModelRows.size === 0 || isDeletingModels
                                          ? 'bg-[#F8F5EC] text-[#B8ABA0] cursor-not-allowed border border-[#EADBC8]'
                                          : 'bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white shadow hover:shadow-lg'
                                          }`}
                                      >
                                        {isDeletingModels ? (
                                          <span className="flex items-center justify-center gap-2">
                                            <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                            刪除中...
                                          </span>
                                        ) : (
                                          '刪除所選'
                                        )}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={clearModelSelection}
                                        disabled={selectedModelRows.size === 0 || isDeletingModels}
                                        className="px-3 py-2 rounded-lg border border-[#EADBC8] text-xs text-[#4B4036] hover:bg-[#FFF4E0] transition disabled:opacity-40"
                                      >
                                        清空
                                      </button>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={cancelSelectionMode}
                                      disabled={isDeletingModels}
                                      className="w-full px-3 py-2 rounded-lg border border-[#EADBC8] text-xs text-[#4B4036] hover:bg-[#FFF4E0] transition disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                      取消編輯
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <p>進入編輯後可勾選模型並進行批次刪除</p>
                                    <button
                                      type="button"
                                      onClick={enterSelectionMode}
                                      className="w-full px-3 py-2 rounded-lg text-xs font-medium bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white shadow hover:shadow-lg transition"
                                    >
                                      開始編輯
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </details>
                    </div>

                    <AnimatePresence>
                      {modelConfigs
                        .filter((model) => {
                          const keyword = modelSearchTerm.trim().toLowerCase();
                          if (!keyword) return true;
                          const haystack = `${model.display_name || ''} ${model.model_id || ''} ${model.description || ''} ${model.provider || ''}`.toLowerCase();
                          return haystack.includes(keyword);
                        })
                        .filter((model) => {
                          if (modelFilter === 'all') return true;
                          if (modelFilter === 'supportsSearch') return model.supportsSearch;
                          return model.modalities[modelFilter];
                        })
                        .map((model) => {
                          const enabledModalitiesSummary = MODALITY_OPTIONS.filter((option) => model.modalities[option.key])
                            .map((option) => option.label)
                            .join('、');

                          return (
                            <motion.div
                              key={model.id || model.model_id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              className={`bg-white/90 backdrop-blur-sm border ${selectedModelRows.has(model.id) ? 'border-[#FFB6C1]' : 'border-[#EADBC8]'
                                } rounded-3xl shadow-md transition`}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setExpandedModelIds((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(model.id)) {
                                      next.delete(model.id);
                                    } else {
                                      next.add(model.id);
                                    }
                                    return next;
                                  });
                                }}
                                className="w-full flex items-center justify-between px-6 py-4 text-left"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
                                  <div className="flex items-center gap-3">
                                    {isSelectionMode && (
                                      <input
                                        type="checkbox"
                                        checked={selectedModelRows.has(model.id)}
                                        onClick={(event) => event.stopPropagation()}
                                        onChange={() => toggleModelSelection(model.id)}
                                        className="h-4 w-4 rounded border-[#EADBC8] text-[#FFB6C1] focus:ring-[#FFB6C1]"
                                      />
                                    )}
                                    <Cog6ToothIcon className="w-5 h-5 text-[#FFB6C1]" />
                                    <h3 className="text-lg font-semibold text-[#4B4036]">{model.display_name || '未命名模型'}</h3>
                                  </div>
                                  <p className="text-xs text-[#2B3A3B]/60 mt-1 sm:mt-0">
                                    模型 ID：{model.model_id || '未設定'}
                                  </p>
                                </div>
                                <motion.div
                                  initial={false}
                                  animate={{ rotate: expandedModelIds.has(model.id) ? 180 : 0 }}
                                  transition={{ duration: 0.25 }}
                                  className="w-8 h-8 bg-[#FFF4E0] rounded-full flex items-center justify-center"
                                >
                                  <svg className="w-4 h-4 text-[#4B4036]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </motion.div>
                              </button>

                              <AnimatePresence initial={false}>
                                {expandedModelIds.has(model.id) && (
                                  <motion.div
                                    key={`${model.id}-details`}
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                                    className="px-6 pb-6"
                                  >
                                    <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4 pb-4 border-b border-[#EADBC8]/60 mb-6">
                                      <div className="flex flex-col gap-1 text-xs text-[#2B3A3B]/70">
                                        <span>模型特質：{model.model_type || '未設定'}</span>
                                        {enabledModalitiesSummary && (
                                          <span>支援模態：{enabledModalitiesSummary}</span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {isSelectionMode && (
                                          <button
                                            type="button"
                                            onClick={() => toggleModelSelection(model.id)}
                                            className={`px-3 py-2 rounded-xl border text-xs font-medium transition ${selectedModelRows.has(model.id)
                                              ? 'border-[#FFB6C1] bg-[#FFB6C1]/20 text-[#4B4036]'
                                              : 'border-[#EADBC8] bg-white text-[#4B4036] hover:border-[#FFD59A]'
                                              }`}
                                          >
                                            {selectedModelRows.has(model.id) ? '取消選擇' : '加入選擇'}
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          onClick={() => handleResetModel(model.id)}
                                          className="px-3 py-2 rounded-xl border border-[#EADBC8] text-xs font-medium text-[#4B4036] hover:bg-[#FFF4E0] transition"
                                        >
                                          還原
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleSaveModel(model.id)}
                                          disabled={model.isSaving}
                                          className={`px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2 ${model.isSaving
                                            ? 'bg-[#F8F5EC] text-[#B8ABA0] cursor-not-allowed'
                                            : 'bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white shadow-md hover:shadow-lg'
                                            }`}
                                        >
                                          {model.isSaving ? (
                                            <>
                                              <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                              儲存中...
                                            </>
                                          ) : (
                                            <>
                                              <CheckCircleIcon className="w-4 h-4" />
                                              儲存模型
                                            </>
                                          )}
                                        </button>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                      <div className="space-y-4">
                                        <label className="block text-sm font-medium text-[#4B4036]">
                                          顯示名稱
                                          <input
                                            type="text"
                                            value={model.display_name}
                                            onChange={(event) => handleModelValueChange(model.id, 'display_name', event.target.value)}
                                            className="mt-2 w-full px-3 py-2 rounded-lg border border-[#EADBC8] focus:outline-none focus:ring-2 focus:ring-[#FFB6C1] focus:border-transparent text-sm"
                                          />
                                        </label>

                                        <label className="block text-sm font-medium text-[#4B4036]">
                                          模型 ID
                                          <input
                                            type="text"
                                            value={model.model_id}
                                            onChange={(event) => handleModelValueChange(model.id, 'model_id', event.target.value)}
                                            className="mt-2 w-full px-3 py-2 rounded-lg border border-[#EADBC8] focus:outline-none focus:ring-2 focus:ring-[#FFB6C1] focus:border-transparent text-sm"
                                          />
                                        </label>

                                        <label className="block text-sm font-medium text-[#4B4036]">
                                          模型特質
                                          <input
                                            type="text"
                                            value={model.model_type || ''}
                                            onChange={(event) => handleModelValueChange(model.id, 'model_type', event.target.value)}
                                            className="mt-2 w-full px-3 py-2 rounded-lg border border-[#EADBC8] focus:outline-none focus:ring-2 focus:ring-[#FFB6C1] focus:border-transparent text-sm"
                                          />
                                        </label>

                                        <label className="block text-sm font-medium text-[#4B4036]">
                                          模型描述
                                          <textarea
                                            value={model.description}
                                            onChange={(event) => handleModelValueChange(model.id, 'description', event.target.value)}
                                            rows={4}
                                            className="mt-2 w-full px-3 py-2 rounded-lg border border-[#EADBC8] focus:outline-none focus:ring-2 focus:ring-[#FFB6C1] focus:border-transparent text-sm"
                                          />
                                        </label>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                          <label className="block text-sm font-medium text-[#4B4036]">
                                            輸入成本（USD / 1M tokens）
                                            <input
                                              type="number"
                                              step="0.0001"
                                              value={model.input_cost_usd}
                                              onChange={(event) => handleModelValueChange(model.id, 'input_cost_usd', event.target.value)}
                                              className="mt-2 w-full px-3 py-2 rounded-lg border border-[#EADBC8] focus:outline-none focus:ring-2 focus:ring-[#FFB6C1] focus:border-transparent text-sm"
                                            />
                                          </label>
                                          <label className="block text-sm font-medium text-[#4B4036]">
                                            輸出成本（USD / 1M tokens）
                                            <input
                                              type="number"
                                              step="0.0001"
                                              value={model.output_cost_usd}
                                              onChange={(event) => handleModelValueChange(model.id, 'output_cost_usd', event.target.value)}
                                              className="mt-2 w-full px-3 py-2 rounded-lg border border-[#EADBC8] focus:outline-none focus:ring-2 focus:ring-[#FFB6C1] focus:border-transparent text-sm"
                                            />
                                          </label>
                                        </div>

                                        <label className="block text-sm font-medium text-[#4B4036]">
                                          食量換算比例 (Food Ratio)
                                          <input
                                            type="number"
                                            value={model.foodRatio}
                                            onChange={(event) => handleModelValueChange(model.id, 'foodRatio', event.target.value)}
                                            placeholder="預設: 300"
                                            className="mt-2 w-full px-3 py-2 rounded-lg border border-[#EADBC8] focus:outline-none focus:ring-2 focus:ring-[#FFB6C1] focus:border-transparent text-sm"
                                          />
                                          <p className="mt-1 text-xs text-[#2B3A3B]/60">
                                            每 $0.01 USD 對應的 Food 數量 (若設定此值，將覆蓋預設的 300)
                                          </p>
                                        </label>
                                      </div>

                                      <div className="border-t border-[#EADBC8]/60 pt-4 mt-2">
                                        <h4 className="text-sm font-semibold text-[#8F7A65] mb-3 uppercase tracking-wide">
                                          Food Token Settings (Granular)
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#FFFDF8] p-4 rounded-xl border border-[#EADBC8]/50">
                                          {[
                                            { key: 'text', label: '文字 (Text)' },
                                            { key: 'image', label: '圖像 (Image)' },
                                            { key: 'audio', label: '語音 (Audio)' },
                                            { key: 'video', label: '影片 (Video)' },
                                          ].map((type) => (
                                            <div key={type.key} className="space-y-3">
                                              <p className="text-xs font-bold text-[#4B4036]">{type.label}</p>
                                              <div className="grid grid-cols-2 gap-2">
                                                <label className="block text-xs text-[#2B3A3B]/70">
                                                  Input
                                                  <input
                                                    type="number"
                                                    value={model.foodTokens[`${type.key}_input` as keyof FoodTokenConfig] || ''}
                                                    onChange={(e) => handleFoodTokenChange(model.id, `${type.key}_input` as keyof FoodTokenConfig, e.target.value)}
                                                    placeholder="Auto"
                                                    className="mt-1 w-full px-2 py-1.5 rounded border border-[#EADBC8] text-xs focus:ring-1 focus:ring-[#FFB6C1]"
                                                  />
                                                </label>
                                                <label className="block text-xs text-[#2B3A3B]/70">
                                                  Output
                                                  <input
                                                    type="number"
                                                    value={model.foodTokens[`${type.key}_output` as keyof FoodTokenConfig] || ''}
                                                    onChange={(e) => handleFoodTokenChange(model.id, `${type.key}_output` as keyof FoodTokenConfig, e.target.value)}
                                                    placeholder="Auto"
                                                    className="mt-1 w-full px-2 py-1.5 rounded border border-[#EADBC8] text-xs focus:ring-1 focus:ring-[#FFB6C1]"
                                                  />
                                                </label>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                        <p className="mt-2 text-[10px] text-[#2B3A3B]/50">
                                          * 設定具體的 Food Token 數值。若留空則使用預設計算方式 (USD Cost * Ratio)。
                                        </p>
                                      </div>

                                      <div className="space-y-4">
                                        <div>
                                          <h4 className="text-sm font-semibold text-[#4B4036] mb-2">支援模態</h4>
                                          <p className="text-xs text-[#2B3A3B]/70 mb-3">勾選模型可支援的輸入與輸出形式</p>
                                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {MODALITY_OPTIONS.map((option) => (
                                              <label
                                                key={option.key}
                                                className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${model.modalities[option.key]
                                                  ? 'border-[#FFB6C1] bg-[#FFB6C1]/15'
                                                  : 'border-[#EADBC8] bg-[#FFFDF8]'
                                                  } text-sm text-[#4B4036]`}
                                              >
                                                <input
                                                  type="checkbox"
                                                  checked={model.modalities[option.key]}
                                                  onChange={() => handleToggleModality(model.id, option.key)}
                                                  className="h-4 w-4 rounded border-[#EADBC8] text-[#FFB6C1] focus:ring-[#FFB6C1]"
                                                />
                                                {option.label}
                                              </label>
                                            ))}
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-3 px-3 py-2 bg-[#FFF9F2] border border-[#EADBC8] rounded-lg">
                                          <input
                                            type="checkbox"
                                            checked={model.supportsSearch}
                                            onChange={() => handleToggleSearchCapability(model.id)}
                                            className="h-4 w-4 rounded border-[#EADBC8] text-[#FFB6C1] focus:ring-[#FFB6C1]"
                                          />
                                          <span className="text-sm text-[#4B4036]">支援搜尋 / Research 工作流程</span>
                                        </div>

                                        <div className="bg-white/70 border border-dashed border-[#EADBC8] rounded-xl p-3 text-xs text-[#2B3A3B]/60 space-y-1">
                                          <p>
                                            保留的其他能力：
                                            {model.otherCapabilities.length > 0 ? model.otherCapabilities.join('、') : '無'}
                                          </p>
                                          <p>
                                            保留的其他模態：
                                            {model.otherModalities.length > 0 ? model.otherModalities.join('、') : '無'}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          );
                        })}
                    </AnimatePresence>

                    {modelConfigs.length === 0 && (
                      <div className="p-6 bg-white/70 border border-dashed border-[#EADBC8] rounded-3xl text-center text-[#2B3A3B]/70">
                        目前尚未匯入任何可用模型。
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {activeSection === 'role-config' && (
                  <motion.div
                    key="role-config"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.35 }}
                    className="space-y-6"
                  >
                    <div className="bg-white/85 backdrop-blur-md border border-[#EADBC8] rounded-3xl shadow-lg p-6">
                      <h2 className="text-xl font-semibold text-[#4B4036] flex items-center gap-2">
                        <PencilSquareIcon className="w-5 h-5" />
                        角色設定管理
                      </h2>
                      <p className="mt-2 text-sm text-[#2B3A3B]/70">
                        為不同角色配置預設模型、可用模型清單與系統指令。設定會即時影響所有對應的聊天室。
                      </p>
                    </div>

                    <div className="bg-white/85 backdrop-blur-sm border border-[#EADBC8] rounded-3xl shadow-md p-6 space-y-4">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="lg:col-span-2">
                          <label className="block text-xs font-semibold text-[#8F7A65] mb-2 tracking-wide uppercase">
                            搜尋角色
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={roleSearchTerm}
                              onChange={(event) => setRoleSearchTerm(event.target.value)}
                              placeholder="輸入角色名稱或 Slug..."
                              className="w-full px-4 py-2.5 pl-10 rounded-xl border border-[#EADBC8] focus:outline-none focus:ring-2 focus:ring-[#FFB6C1] focus:border-transparent text-sm text-[#4B4036]"
                            />
                            <svg
                              className="w-4 h-4 text-[#8F7A65] absolute left-3.5 top-1/2 -translate-y-1/2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.1-5.4a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
                            </svg>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#8F7A65] mb-2 tracking-wide uppercase">
                            角色總覽
                          </label>
                          <div className="h-full flex items-center justify-between lg:justify-start lg:gap-3 text-sm text-[#4B4036]">
                            <span>共 {roleConfigs.length} 個角色</span>
                            {roleSearchTerm.trim() !== '' && (
                              <button
                                type="button"
                                onClick={() => setRoleSearchTerm('')}
                                className="text-xs px-3 py-1 rounded-full border border-[#EADBC8] hover:bg-[#FFF4E0] transition"
                              >
                                清除搜尋
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#FFFDF8] border border-dashed border-[#EADBC8] rounded-2xl p-4 text-xs text-[#2B3A3B]/70 space-y-2">
                        {roleSelectionMode ? (
                          <>
                            <p>
                              <strong>{selectedRoleRows.size}</strong> 個角色已選擇
                            </p>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                              <div className="flex-1 flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => removeSelectedRoles()}
                                  disabled={selectedRoleRows.size === 0 || isDeletingRoles}
                                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition ${selectedRoleRows.size === 0 || isDeletingRoles
                                    ? 'bg-[#F8F5EC] text-[#B8ABA0] cursor-not-allowed border border-[#EADBC8]'
                                    : 'bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white shadow hover:shadow-lg'
                                    }`}
                                >
                                  {isDeletingRoles ? (
                                    <span className="flex items-center justify-center gap-2">
                                      <ArrowPathIcon className="w-4 h-4 animate-spin" /> 刪除中...
                                    </span>
                                  ) : (
                                    '刪除所選'
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={clearRoleSelection}
                                  disabled={selectedRoleRows.size === 0 || isDeletingRoles}
                                  className="px-3 py-2 rounded-lg border border-[#EADBC8] text-xs text-[#4B4036] hover:bg-[#FFF4E0] transition disabled:opacity-40"
                                >
                                  清空
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={cancelRoleSelectionMode}
                                disabled={isDeletingRoles}
                                className="px-3 py-2 rounded-lg border border-[#EADBC8] text-xs text-[#4B4036] hover:bg-[#FFF4E0] transition disabled:opacity-40"
                              >
                                取消編輯
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <p className="text-xs">進入編輯模式後可勾選角色並進行批次刪除</p>
                            <button
                              type="button"
                              onClick={enterRoleSelectionMode}
                              className="px-4 py-2 rounded-lg text-xs font-medium bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white shadow hover:shadow-lg transition"
                            >
                              開始編輯
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <AnimatePresence>
                      {filteredRoleConfigs.map((role) => {
                        const filterState = getRoleModelFilterState(role.id);
                        const filteredModels = modelConfigs
                          .filter((model) => {
                            const keyword = filterState.search.trim().toLowerCase();
                            if (!keyword) return true;
                            const haystack = `${model.display_name || ''} ${model.model_id || ''} ${model.description || ''} ${model.provider || ''
                              }`.toLowerCase();
                            return haystack.includes(keyword);
                          })
                          .filter((model) => {
                            if (filterState.filter === 'all') return true;
                            if (filterState.filter === 'supportsSearch') return model.supportsSearch;
                            return model.modalities[filterState.filter];
                          });
                        const isExpanded = expandedRoleIds.has(role.id);

                        return (
                          <motion.div
                            key={role.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className={`bg-white/85 backdrop-blur-sm rounded-3xl shadow-md p-6 space-y-6 transition border ${selectedRoleRows.has(role.id) ? 'border-[#FFB6C1]' : 'border-[#EADBC8]'
                              }`}
                          >
                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-3">
                                  {roleSelectionMode && (
                                    <input
                                      type="checkbox"
                                      checked={selectedRoleRows.has(role.id)}
                                      onChange={() => toggleRoleSelection(role.id)}
                                      className="h-4 w-4 rounded border-[#EADBC8] text-[#FFB6C1] focus:ring-[#FFB6C1]"
                                    />
                                  )}
                                  <h3 className="text-lg font-semibold text-[#4B4036] flex items-center gap-2">
                                    <BookmarkSquareIcon className="w-5 h-5 text-[#FFB6C1]" />
                                    {role.name}
                                  </h3>
                                </div>
                                <p className={`text-xs text-[#2B3A3B]/60 ${roleSelectionMode ? 'ml-[26px]' : ''}`}>
                                  Slug：{role.slug || '未設定'}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => toggleRoleExpanded(role.id)}
                                  className="px-3 py-2 rounded-xl border border-[#EADBC8] text-xs font-medium text-[#4B4036] hover:bg-[#FFF4E0] transition"
                                >
                                  <span className="inline-flex items-center gap-1">
                                    {isExpanded ? '收起設定' : '展開設定'}
                                    <motion.svg
                                      initial={false}
                                      animate={{ rotate: isExpanded ? 180 : 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </motion.svg>
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleResetRole(role.id)}
                                  disabled={roleSelectionMode}
                                  className="px-3 py-2 rounded-xl border border-[#EADBC8] text-xs font-medium text-[#4B4036] hover:bg-[#FFF4E0] transition disabled:opacity-40"
                                >
                                  還原
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveRole(role.id)}
                                  disabled={role.isSaving || roleSelectionMode}
                                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2 ${role.isSaving || roleSelectionMode
                                    ? 'bg-[#F8F5EC] text-[#B8ABA0] cursor-not-allowed'
                                    : 'bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white shadow-md hover:shadow-lg'
                                    }`}
                                >
                                  {role.isSaving ? (
                                    <>
                                      <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                      儲存中...
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircleIcon className="w-4 h-4" />
                                      儲存設定
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>

                            <AnimatePresence initial={false}>
                              {isExpanded && (
                                <motion.div
                                  key={`${role.id}-details`}
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                                  className="space-y-6 overflow-hidden"
                                >
                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                                    <div className="space-y-4">
                                      <label className="block text-sm font-medium text-[#4B4036]">
                                        預設模型
                                        <div className="mt-2">
                                          <input
                                            type="text"
                                            value={role.default_model}
                                            onChange={(event) => handleChangeDefaultModel(role.id, event.target.value)}
                                            placeholder="輸入模型 ID，例如：google/gemini-1.5-flash"
                                            className="w-full px-3 py-2 rounded-lg border border-[#EADBC8] focus:outline-none focus:ring-2 focus:ring-[#FFB6C1] focus:border-transparent text-sm"
                                          />
                                        </div>
                                      </label>

                                      <label className="block text-sm font-medium text-[#4B4036]">
                                        自訂食量成本（每次互動）
                                        <div className="mt-2 flex items-center gap-3">
                                          <input
                                            type="number"
                                            min="0"
                                            value={role.base_food_cost}
                                            onChange={(event) => handleChangeBaseFoodCost(role.id, event.target.value)}
                                            placeholder="例如：75"
                                            className="w-full px-3 py-2 rounded-lg border border-[#EADBC8] focus:outline-none focus:ring-2 focus:ring-[#FFB6C1] focus:border-transparent text-sm"
                                          />
                                          <span className="text-xs text-[#2B3A3B]/60">留空則恢復系統預設</span>
                                        </div>
                                      </label>
                                    </div>

                                    <div className="space-y-4">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        {role.allowed_models.length === 0 ? (
                                          <span className="px-3 py-1 rounded-full bg-[#F8F5EC] border border-dashed border-[#EADBC8] text-xs text-[#4B4036]">
                                            尚未設定可選擇模型
                                          </span>
                                        ) : (
                                          role.allowed_models.map((modelId) => (
                                            <span
                                              key={modelId}
                                              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs ${role.default_model === modelId
                                                ? 'bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white border-transparent shadow'
                                                : 'bg-[#FFD59A]/30 border-[#FFD59A] text-[#4B4036]'
                                                }`}
                                            >
                                              {resolveModelLabel(modelId)}
                                              <button
                                                type="button"
                                                onClick={() => handleToggleRoleModel(role.id, modelId)}
                                                className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-black/10"
                                              >
                                                <XMarkIcon className="w-3 h-3" />
                                              </button>
                                            </span>
                                          ))
                                        )}
                                      </div>

                                      <div className="bg-white/80 border border-[#EADBC8] rounded-2xl shadow-sm p-4">
                                        <div className="flex items-center justify-between gap-3">
                                          <div>
                                            <h4 className="text-sm font-semibold text-[#4B4036]">AI 模型庫管理</h4>
                                            <p className="text-[11px] text-[#2B3A3B]/60 mt-1">選擇可用模型並設定預設值</p>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => updateRoleModelFilter(role.id, { isOpen: !filterState.isOpen })}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#EADBC8] text-xs font-medium text-[#4B4036] hover:bg-[#FFF4E0] transition"
                                          >
                                            {filterState.isOpen ? '收起模型列表' : '展開模型列表'}
                                            <motion.svg
                                              initial={false}
                                              animate={{ rotate: filterState.isOpen ? 180 : 0 }}
                                              transition={{ duration: 0.2 }}
                                              className="w-4 h-4"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </motion.svg>
                                          </button>
                                        </div>

                                        <AnimatePresence initial={false}>
                                          {filterState.isOpen && (
                                            <motion.div
                                              key={`${role.id}-model-selector`}
                                              initial={{ height: 0, opacity: 0 }}
                                              animate={{ height: 'auto', opacity: 1 }}
                                              exit={{ height: 0, opacity: 0 }}
                                              transition={{ duration: 0.25, ease: 'easeInOut' }}
                                              className="space-y-4 overflow-hidden mt-4"
                                            >
                                              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                                <div className="flex-1">
                                                  <label className="block text-xs font-semibold text-[#8F7A65] mb-2 tracking-wide uppercase">
                                                    搜尋模型
                                                  </label>
                                                  <div className="relative">
                                                    <input
                                                      type="text"
                                                      value={filterState.search}
                                                      onChange={(event) => updateRoleModelFilter(role.id, { search: event.target.value })}
                                                      placeholder="輸入模型名稱、ID 或描述..."
                                                      className="w-full px-4 py-2.5 pl-10 rounded-xl border border-[#EADBC8] focus:outline-none focus:ring-2 focus:ring-[#FFB6C1] focus:border-transparent text-sm text-[#4B4036]"
                                                    />
                                                    <svg
                                                      className="w-4 h-4 text-[#8F7A65] absolute left-3.5 top-1/2 -translate-y-1/2"
                                                      fill="none"
                                                      stroke="currentColor"
                                                      viewBox="0 0 24 24"
                                                    >
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.1-5.4a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
                                                    </svg>
                                                  </div>
                                                </div>
                                                <div className="lg:w-[280px]">
                                                  <label className="block text-xs font-semibold text-[#8F7A65] mb-2 tracking-wide uppercase">
                                                    模型範圍
                                                  </label>
                                                  <div className="flex flex-wrap gap-2">
                                                    {[
                                                      { value: 'all', label: '全部模態' },
                                                      { value: 'supportsSearch', label: '支援搜尋' },
                                                      ...MODALITY_OPTIONS.map((option) => ({
                                                        value: option.key,
                                                        label: option.label,
                                                      })),
                                                    ].map((option) => {
                                                      const isActive = filterState.filter === option.value;
                                                      return (
                                                        <button
                                                          key={option.value}
                                                          type="button"
                                                          onClick={() =>
                                                            updateRoleModelFilter(role.id, {
                                                              filter: option.value as 'all' | ModalityKey | 'supportsSearch',
                                                            })
                                                          }
                                                          className={`px-3 py-1.5 rounded-full border text-xs font-medium transition ${isActive
                                                            ? 'bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white border-transparent shadow'
                                                            : 'border-[#EADBC8] text-[#4B4036] bg-white hover:border-[#FFD59A]'
                                                            }`}
                                                        >
                                                          {option.label}
                                                        </button>
                                                      );
                                                    })}
                                                  </div>
                                                  {filterState.filter !== 'all' && (
                                                    <p className="text-[11px] text-[#8F7A65]/70 mt-2">
                                                      已套用篩選：{
                                                        MODALITY_OPTIONS.find((option) => option.key === filterState.filter)?.label ||
                                                        (filterState.filter === 'supportsSearch' ? '支援搜尋 / Research' : '全部模態')
                                                      }
                                                    </p>
                                                  )}
                                                </div>
                                              </div>

                                              <div className="max-h-80 overflow-y-auto rounded-2xl border border-dashed border-[#EADBC8] bg-[#FFFDF8] p-3 space-y-3">
                                                {filteredModels.map((model) => {
                                                  const isChecked = role.allowed_models.includes(model.model_id);
                                                  const isDefault = role.default_model === model.model_id;
                                                  const enabledModalitiesSummary = MODALITY_OPTIONS.filter((option) => model.modalities[option.key])
                                                    .map((option) => option.label)
                                                    .join('、');

                                                  return (
                                                    <div
                                                      key={`${role.id}-${model.id}`}
                                                      className={`rounded-2xl border px-4 py-3 bg-white transition ${isChecked ? 'border-[#FFB6C1] shadow-md' : 'border-[#EADBC8]'
                                                        }`}
                                                    >
                                                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                                        <div>
                                                          <div className="flex items-center gap-2">
                                                            <input
                                                              type="checkbox"
                                                              checked={isChecked}
                                                              onChange={() => handleToggleRoleModel(role.id, model.model_id)}
                                                              className="h-4 w-4 rounded border-[#EADBC8] text-[#FFB6C1] focus:ring-[#FFB6C1]"
                                                            />
                                                            <h4 className="text-sm font-semibold text-[#4B4036]">
                                                              {model.display_name || model.model_id}
                                                            </h4>
                                                            {isDefault && (
                                                              <span className="text-[11px] px-2 py-0.5 bg-[#FFB6C1]/20 text-[#FF4D8D] rounded-full border border-[#FFB6C1]/50">
                                                                預設
                                                              </span>
                                                            )}
                                                          </div>
                                                          <p className="text-xs text-[#2B3A3B]/60 mt-1">
                                                            模型 ID：{model.model_id} · 模型特質：{model.model_type || '未設定'}
                                                          </p>
                                                          {enabledModalitiesSummary && (
                                                            <p className="text-xs text-[#2B3A3B]/50 mt-1">支援模態：{enabledModalitiesSummary}</p>
                                                          )}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                          <button
                                                            type="button"
                                                            onClick={() => handleSetDefaultModel(role.id, model.model_id)}
                                                            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition ${isDefault
                                                              ? 'border-[#FFB6C1] bg-[#FFB6C1]/20 text-[#4B4036]'
                                                              : 'border-[#EADBC8] bg-white text-[#4B4036] hover:border-[#FFD59A]'
                                                              }`}
                                                          >
                                                            設為預設
                                                          </button>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  );
                                                })}

                                                {filteredModels.length === 0 && (
                                                  <div className="p-4 text-center text-sm text-[#2B3A3B]/60">目前沒有符合條件的模型</div>
                                                )}
                                              </div>
                                            </motion.div>
                                          )}
                                        </AnimatePresence>
                                      </div>
                                    </div>
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-[#4B4036] mb-2">
                                      系統指令（System Prompt）
                                    </label>
                                    <textarea
                                      value={role.system_prompt}
                                      onChange={(event) => handleChangeSystemPrompt(role.id, event.target.value)}
                                      rows={6}
                                      placeholder="輸入角色的預設系統指令..."
                                      className="w-full px-3 py-3 rounded-2xl border border-[#EADBC8] focus:outline-none focus:ring-2 focus:ring-[#FFB6C1] focus:border-transparent text-sm text-[#4B4036]"
                                    />
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>

                    {filteredRoleConfigs.length === 0 && (
                      <div className="p-6 bg-white/70 border border-dashed border-[#EADBC8] rounded-3xl text-center text-[#2B3A3B]/70">
                        找不到符合條件的 AI 角色。
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {activeSection === 'ai-project-logs' && (
                  <motion.div
                    key="ai-project-logs"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.35 }}
                    className="space-y-6"
                  >
                    <div className="bg-white/85 backdrop-blur-md border border-[#EADBC8] rounded-3xl shadow-lg p-6">
                      <h2 className="text-xl font-semibold text-[#4B4036] flex items-center gap-2">
                        <DocumentTextIcon className="w-5 h-5" />
                        AI 專案對話紀錄
                      </h2>
                      <p className="mt-2 text-sm text-[#2B3A3B]/70">
                        查看所有 AI 專案、用戶、對話訊息與錯誤記錄。
                      </p>
                    </div>

                    {/* 子標籤頁 */}
                    <div className="flex gap-2 mb-4">
                      {(['rooms', 'users', 'messages', 'errors'] as LogTabKey[]).map((t) => (
                        <button
                          key={t}
                          onClick={() => setLogActiveTab(t)}
                          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${logActiveTab === t
                            ? 'bg-[#FFEAD1] text-[#4B4036] font-medium'
                            : 'bg-white border border-[#EADBC8] text-gray-700 hover:bg-[#FFF9F2]'
                            }`}
                        >
                          {tabLabel(t)}
                        </button>
                      ))}
                    </div>

                    {logLoading ? (
                      <div className="py-10 text-center text-[#2B3A3B]">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFB6C1] mx-auto mb-2" />
                        <p>載入中...</p>
                      </div>
                    ) : (
                      <div className="bg-white rounded-2xl p-4 ring-1 ring-[#EADBC8]">
                        {logActiveTab === 'rooms' && (
                          <div className="space-y-2">
                            {logRooms.length === 0 ? (
                              <div className="text-center py-8 text-gray-500">目前沒有專案記錄</div>
                            ) : (
                              logRooms.map((r: any) => (
                                <div key={r.id} className="p-3 rounded-xl border border-[#EADBC8] hover:bg-[#FFF9F2] transition-colors">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-semibold text-[#4B4036]">
                                        {r.title || '(未命名專案)'}
                                        <span className="text-xs text-gray-500 ml-1">{formatHK(r.created_at)}</span>
                                      </p>
                                      <p className="text-xs text-gray-600">room_id: {r.id}</p>
                                    </div>
                                    <span className="text-xs text-gray-500">最後: {formatHK(r.last_message_at)}</span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}

                        {logActiveTab === 'users' && (
                          <div className="space-y-2">
                            {logUsers.length === 0 ? (
                              <div className="text-center py-8 text-gray-500">目前沒有用戶記錄</div>
                            ) : (
                              logUsers.map((u: any) => (
                                <div key={u.id} className="p-3 rounded-xl border border-[#EADBC8] hover:bg-[#FFF9F2] transition-colors">
                                  <p className="font-semibold text-[#4B4036]">{u.full_name || u.email}</p>
                                  <p className="text-xs text-gray-600">{u.email} · {formatHK(u.created_at)}</p>
                                </div>
                              ))
                            )}
                          </div>
                        )}

                        {logActiveTab === 'messages' && (
                          <div className="space-y-2">
                            {logMessages.length === 0 ? (
                              <div className="text-center py-8 text-gray-500">目前沒有對話記錄</div>
                            ) : (
                              logMessages.map((m: any) => (
                                <div key={m.id} className="p-3 rounded-xl border border-[#EADBC8] hover:bg-[#FFF9F2] transition-colors">
                                  <p className="text-xs text-gray-600 mb-1">room: {m.room_id} · {formatHK(m.created_at)}</p>
                                  <p className="font-medium text-[#2B3A3B]">
                                    [{m.sender_type}] {m.content?.slice(0, 200) || m.content_json?.text || '(空白)'}
                                  </p>
                                  {(((m.status && m.status !== 'sent') ? true : false) || (m.error_message && m.error_message.trim() !== '')) && (
                                    <p className="text-xs text-rose-600 mt-1">狀態: {m.status || 'error'}</p>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        )}

                        {logActiveTab === 'errors' && (
                          <div className="space-y-2">
                            {logMessages.filter((m: any) =>
                              m.status === 'error' ||
                              (m.error_message && m.error_message.trim() !== '') ||
                              (m.content && /遇到點小困難|重新輸入|稍後再試/.test(m.content))
                            ).length === 0 ? (
                              <div className="text-center py-8 text-gray-500">目前沒有錯誤記錄</div>
                            ) : (
                              logMessages.filter((m: any) =>
                                m.status === 'error' ||
                                (m.error_message && m.error_message.trim() !== '') ||
                                (m.content && /遇到點小困難|重新輸入|稍後再試/.test(m.content))
                              ).map((m: any) => (
                                <div
                                  key={m.id}
                                  className="p-3 rounded-xl border border-rose-200 bg-rose-50 cursor-pointer hover:bg-rose-100 transition-colors"
                                  onClick={() => openRoomConversation(m.room_id)}
                                >
                                  <p className="text-xs text-gray-600 mb-1">room: {m.room_id} · {formatHK(m.created_at)}</p>
                                  <p className="font-medium text-[#B00020]">
                                    {m.error_message || '系統提示：遇到點小困難，請重新輸入或稍後再試'}
                                  </p>
                                  <p className="text-xs text-[#2B3A3B] mt-1">
                                    內容: {m.content?.slice(0, 180) || m.content_json?.text || '(空白)'}
                                  </p>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {(activeSection === 'role-permissions' || activeSection === 'audit-logs') && (
                  <motion.div
                    key="coming-soon"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-white/85 backdrop-blur-md border border-[#EADBC8] rounded-3xl shadow-lg p-8 text-center"
                  >
                    <motion.div
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 6 }}
                      className="mx-auto w-16 h-16 bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] rounded-3xl flex items-center justify-center shadow-lg"
                    >
                      <ShieldCheckIcon className="w-8 h-8 text-white" />
                    </motion.div>
                    <h2 className="mt-4 text-2xl font-bold text-[#4B4036]">功能即將推出</h2>
                    <p className="mt-3 text-sm text-[#2B3A3B]/70">
                      我們正在建構專屬的權限管理與稽核面板，讓 super_admin 可以更精細地掌控系統安全與操作紀錄。
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          </div>
        </div>
      </div>

      {/* 對話詳情視窗 */}
      {showLogDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30"
          onClick={() => setShowLogDialog(false)}
        >
          <div
            className="w-full max-w-3xl bg-white rounded-2xl p-4 ring-1 ring-[#EADBC8] max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
              <h3 className="text-lg font-bold text-[#2B3A3B]">{logDialogTitle}</h3>
              <button
                className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-[#2B3A3B] transition-colors"
                onClick={() => setShowLogDialog(false)}
              >
                關閉
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto space-y-2 flex-1">
              {logDialogItems.length === 0 ? (
                <div className="text-center text-[#2B3A3B] py-6">沒有對話內容</div>
              ) : (
                logDialogItems.map((it: any) => (
                  <div key={it.id} className="p-3 rounded-xl border border-[#EADBC8]">
                    <p className="text-xs text-gray-600 mb-1">{formatHK(it.created_at)} · {it.sender_type}</p>
                    <p className="text-[#2B3A3B] whitespace-pre-wrap">{it.content || it.content_json?.text || '(空白)'}</p>
                    {(((it.status && it.status !== 'sent') ? true : false) || (it.error_message && it.error_message.trim() !== '')) && (
                      <p className="text-xs text-rose-600 mt-1">狀態: {it.status || 'error'} · {it.error_message}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
