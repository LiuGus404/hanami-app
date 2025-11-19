'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, UserPlus, Copy, Check, X, Edit2, Trash2, Clock, Users } from 'lucide-react';
import { getUserSession } from '@/lib/authUtils';
import { getAccessToken } from '@/lib/getAccessToken';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import toast from 'react-hot-toast';
import BackButton from '@/components/ui/BackButton';
import HanamiInput from '@/components/ui/HanamiInput';
import HanamiButton from '@/components/ui/HanamiButton';
import { HanamiSelect } from '@/components/ui/HanamiSelect';
import CuteLoadingSpinner from '@/components/ui/CuteLoadingSpinner';

type RoleType = 'owner' | 'admin' | 'teacher' | 'member';

interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  created_at: string;
}

interface Identity {
  id: string;
  org_id: string;
  user_id?: string;
  user_email: string;
  role_type: RoleType;
  role_config: any;
  status: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

interface Invitation {
  id: string;
  org_id: string;
  invitation_code: string;
  role_type: RoleType;
  expires_at: string;
  is_used: boolean;
  used_by_email?: string;
  created_at: string;
}

const roleLabels: Record<RoleType, string> = {
  owner: '創建者',
  admin: '管理員',
  teacher: '教師',
  member: '成員',
};

const roleColors: Record<RoleType, string> = {
  owner: 'bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4]',
  admin: 'bg-gradient-to-r from-[#A8D5E2] to-[#B8E0D2]',
  teacher: 'bg-gradient-to-r from-[#C8E6C9] to-[#A5D6A7]',
  member: 'bg-gradient-to-r from-[#E0E0E0] to-[#BDBDBD]',
};

const roleDescriptions: Record<RoleType, string> = {
  owner: '機構創建者，最高權限',
  admin: '機構管理員，大部分管理權限',
  teacher: '教師，管理學生和課程',
  member: '機構成員，基本查看權限',
};

export default function MemberManagementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: saasUser, loading: saasAuthLoading } = useSaasAuth();
  const [searchEmail, setSearchEmail] = useState('');
  const [searching, setSearching] = useState(false);
  const [foundUser, setFoundUser] = useState<User | null>(null);
  const [existingIdentity, setExistingIdentity] = useState<Identity | null>(null);
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [showCreateInvitation, setShowCreateInvitation] = useState(false);
  const [newInvitationRole, setNewInvitationRole] = useState<RoleType>('member');
  const [editingIdentity, setEditingIdentity] = useState<Identity | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);

  // 調試：追蹤 SaaS 認證狀態
  useEffect(() => {
    console.log('[成員管理頁面] SaaS 認證狀態:', {
      saasAuthLoading,
      hasSaasUser: !!saasUser,
      saasUserEmail: saasUser?.email,
    });
  }, [saasUser, saasAuthLoading]);

  // 從 URL 參數、localStorage 或 TeacherLinkShell 的狀態中獲取 orgId
  useEffect(() => {
    setInitializing(true);
    
    // 優先從 URL 參數獲取
    const urlOrgId = searchParams?.get('orgId');
    if (urlOrgId && urlOrgId !== 'unassigned-org-placeholder' && urlOrgId !== 'default-org') {
      console.log('從 URL 獲取 orgId:', urlOrgId);
      setOrgId(urlOrgId);
      setInitializing(false);
      return;
    }

    // 從 localStorage 獲取（TeacherLinkShell 使用的 key）
    if (typeof window !== 'undefined') {
      try {
        const storedOrg = localStorage.getItem('hanami_current_org');
        if (storedOrg) {
          const parsed = JSON.parse(storedOrg);
          if (parsed?.id && parsed.id !== 'unassigned-org-placeholder' && parsed.id !== 'default-org') {
            console.log('從 localStorage 獲取 orgId:', parsed.id);
            setOrgId(parsed.id);
            setInitializing(false);
            return;
          }
        }
      } catch (error) {
        console.error('讀取 localStorage 機構信息失敗:', error);
      }
    }

    // 如果都沒有，設置為 null
    console.log('未找到 orgId');
    setOrgId(null);
    setInitializing(false);
  }, [searchParams]);

  useEffect(() => {
    if (initializing || saasAuthLoading) return; // 還在初始化中，不執行後續邏輯
    
    // 檢查 SaaS 認證狀態
    if (!saasUser) {
      console.warn('成員管理頁面：用戶未登入 SaaS 系統，無法載入數據');
      return; // 不載入數據，等待登入提示顯示
    }
    
    if (!orgId) {
      // 如果 orgId 為 null，跳轉到選擇機構頁面
      console.log('orgId 為 null，跳轉到選擇機構頁面');
      toast.error('請先選擇機構');
      router.push('/aihome/teacher-link/create');
      return;
    }
    
    // 有 orgId 和 SaaS 用戶，開始載入數據
    console.log('開始載入數據，orgId:', orgId, 'saasUser:', saasUser.email);
    loadData();
  }, [orgId, initializing, saasAuthLoading, saasUser, router]);

  const loadData = async () => {
    if (!orgId) {
      console.log('loadData: orgId 為 null，跳過載入');
      return;
    }
    
    if (!saasUser) {
      console.warn('loadData: 沒有 SaaS 用戶，無法載入數據');
      toast.error('請先登入系統');
      return;
    }
    
    console.log('loadData: 開始載入數據，orgId:', orgId, 'saasUser:', saasUser.email);
    setLoading(true);
    try {
      await Promise.all([loadIdentities(), loadInvitations()]);
      console.log('loadData: 數據載入成功');
    } catch (error) {
      console.error('載入數據錯誤:', error);
      const errorMessage = error instanceof Error ? error.message : '載入數據失敗';
      toast.error(errorMessage);
      
      // 如果是 401 錯誤，提示用戶登入
      if (errorMessage.includes('401') || errorMessage.includes('未授權')) {
        console.warn('loadData: 認證失敗，可能需要重新登入');
        setTimeout(() => {
          router.push('/aihome/auth/login?redirect=' + encodeURIComponent(window.location.pathname));
        }, 2000);
      }
    } finally {
      setLoading(false);
      console.log('loadData: 載入完成');
    }
  };

  const loadIdentities = async () => {
    if (!orgId) {
      console.log('loadIdentities: orgId 為 null，跳過');
      return;
    }
    
    try {
      console.log('loadIdentities: 開始載入，orgId:', orgId);
      
      // 添加超時處理
      const tokenPromise = getAccessToken();
      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), 5000); // 5秒超時
      });
      
      console.log('loadIdentities: 等待 access token...');
      const accessToken = await Promise.race([tokenPromise, timeoutPromise]);
      
      if (!accessToken) {
        console.warn('loadIdentities: 獲取 access token 超時或失敗，繼續使用 cookies');
      } else {
        console.log('loadIdentities: 成功獲取 access token');
      }
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      
      console.log('loadIdentities: 發送 API 請求...');
      // 如果沒有 access token，添加用戶 email 作為備選認證
      if (!accessToken && saasUser?.email) {
        headers['X-User-Email'] = saasUser.email;
        console.log('loadIdentities: 添加 X-User-Email header:', saasUser.email);
      }
      
      const fetchPromise = fetch(`/api/members/identities/list?orgId=${encodeURIComponent(orgId)}`, {
        credentials: 'include', // 確保 cookies 被發送
        headers,
      });
      
      const fetchTimeoutPromise = new Promise<Response>((_, reject) => {
        setTimeout(() => reject(new Error('請求超時（30秒）')), 30000);
      });
      
      const response = await Promise.race([fetchPromise, fetchTimeoutPromise]);
      console.log('loadIdentities: 收到 API 響應，狀態:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('loadIdentities: API 錯誤響應:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('loadIdentities: API 響應:', result);
      
      if (result.success) {
        setIdentities(result.identities || []);
        console.log('loadIdentities: 成功載入', result.identities?.length || 0, '個身份');
      } else {
        // 如果是權限錯誤，顯示詳細信息
        if (result.details) {
          console.error('權限檢查失敗:', result.details);
          // 調試：查詢用戶身份
          try {
            const debugResponse = await fetch(`/api/members/debug-identity?orgId=${encodeURIComponent(orgId)}`, {
              credentials: 'include',
              headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {},
            });
            const debugResult = await debugResponse.json();
            console.log('調試身份信息:', debugResult);
          } catch (debugError) {
            console.error('調試查詢失敗:', debugError);
          }
        }
        throw new Error(result.error || '載入成員列表失敗');
      }
    } catch (error) {
      console.error('載入成員列表錯誤:', error);
      toast.error(error instanceof Error ? error.message : '載入成員列表失敗');
      throw error; // 重新拋出錯誤，讓 loadData 可以處理
    }
  };

  const loadInvitations = async () => {
    if (!orgId) {
      console.log('loadInvitations: orgId 為 null，跳過');
      return;
    }
    
    try {
      console.log('loadInvitations: 開始載入，orgId:', orgId);
      
      // 添加超時處理
      const tokenPromise = getAccessToken();
      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), 5000); // 5秒超時
      });
      
      console.log('loadInvitations: 等待 access token...');
      const accessToken = await Promise.race([tokenPromise, timeoutPromise]);
      
      if (!accessToken) {
        console.warn('loadInvitations: 獲取 access token 超時或失敗，繼續使用 cookies');
      } else {
        console.log('loadInvitations: 成功獲取 access token');
      }
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      
      console.log('loadInvitations: 發送 API 請求...');
      // 如果沒有 access token，添加用戶 email 作為備選認證
      if (!accessToken && saasUser?.email) {
        headers['X-User-Email'] = saasUser.email;
        console.log('loadInvitations: 添加 X-User-Email header:', saasUser.email);
      }
      
      const fetchPromise = fetch(`/api/members/invitations/list?orgId=${encodeURIComponent(orgId)}`, {
        credentials: 'include', // 確保 cookies 被發送
        headers,
      });
      
      const fetchTimeoutPromise = new Promise<Response>((_, reject) => {
        setTimeout(() => reject(new Error('請求超時（30秒）')), 30000);
      });
      
      const response = await Promise.race([fetchPromise, fetchTimeoutPromise]);
      console.log('loadInvitations: 收到 API 響應，狀態:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('loadInvitations: API 錯誤響應:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('loadInvitations: API 響應:', result);
      
      if (result.success) {
        setInvitations(result.invitations || []);
        console.log('loadInvitations: 成功載入', result.invitations?.length || 0, '個邀請');
      } else {
        // 如果是權限錯誤，顯示詳細信息
        if (result.details) {
          console.error('權限檢查失敗:', result.details);
          // 調試：查詢用戶身份
          try {
            const debugResponse = await fetch(`/api/members/debug-identity?orgId=${encodeURIComponent(orgId)}`, {
              credentials: 'include',
              headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {},
            });
            const debugResult = await debugResponse.json();
            console.log('調試身份信息:', debugResult);
          } catch (debugError) {
            console.error('調試查詢失敗:', debugError);
          }
        }
        throw new Error(result.error || '載入邀請列表失敗');
      }
    } catch (error) {
      console.error('載入邀請列表錯誤:', error);
      toast.error(error instanceof Error ? error.message : '載入邀請列表失敗');
      throw error; // 重新拋出錯誤，讓 loadData 可以處理
    }
  };

  const handleSearch = async () => {
    if (!searchEmail.trim() || !orgId) {
      toast.error('請輸入郵箱地址');
      return;
    }

    setSearching(true);
    try {
      const accessToken = await getAccessToken();
      const headers: HeadersInit = {};
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      
      // 如果沒有 access token，添加用戶 email 作為備選認證
      if (!accessToken && saasUser?.email) {
        headers['X-User-Email'] = saasUser.email;
      }
      
      const response = await fetch(
        `/api/members/search?email=${encodeURIComponent(searchEmail.trim())}&orgId=${encodeURIComponent(orgId)}`,
        {
          credentials: 'include', // 確保 cookies 被發送
          headers,
        }
      );
      const result = await response.json();

      if (result.success) {
        setFoundUser(result.user);
        setExistingIdentity(result.existingIdentity);
      } else {
        setFoundUser(null);
        setExistingIdentity(null);
        toast.error(result.error || '用戶不存在');
      }
    } catch (error) {
      console.error('搜尋用戶錯誤:', error);
      toast.error('搜尋用戶失敗');
      setFoundUser(null);
      setExistingIdentity(null);
    } finally {
      setSearching(false);
    }
  };

  const handleSetIdentity = async (roleType: RoleType, isPrimary: boolean = false) => {
    if (!foundUser || !orgId) return;

    try {
      const accessToken = await getAccessToken();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      
      // 如果沒有 access token，添加用戶 email 作為備選認證
      if (!accessToken && saasUser?.email) {
        headers['X-User-Email'] = saasUser.email;
      }
      
      const response = await fetch('/api/members/set-identity', {
        method: 'POST',
        credentials: 'include', // 確保 cookies 被發送
        headers,
        body: JSON.stringify({
          orgId,
          userEmail: foundUser.email,
          userId: foundUser.id,
          roleType,
          roleConfig: {},
          isPrimary,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`成功${result.action === 'created' ? '設定' : '更新'}身份`);
        setExistingIdentity(result.identity);
        await loadIdentities();
        setFoundUser(null);
        setSearchEmail('');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('設定身份錯誤:', error);
      toast.error(error instanceof Error ? error.message : '設定身份失敗');
    }
  };

  const handleCreateInvitation = async () => {
    if (!orgId) return;

    try {
      const accessToken = await getAccessToken();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      
      // 如果沒有 access token，添加用戶 email 作為備選認證
      if (!accessToken && saasUser?.email) {
        headers['X-User-Email'] = saasUser.email;
      }
      
      const response = await fetch('/api/members/invitations/create', {
        method: 'POST',
        credentials: 'include', // 確保 cookies 被發送
        headers,
        body: JSON.stringify({
          orgId,
          roleType: newInvitationRole,
          roleConfig: {},
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('邀請ID創建成功');
        setShowCreateInvitation(false);
        await loadInvitations();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('創建邀請錯誤:', error);
      toast.error(error instanceof Error ? error.message : '創建邀請失敗');
    }
  };

  const handleCopyInvitationCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('邀請碼已複製');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleUpdateIdentity = async (identityId: string, updates: Partial<Identity>) => {
    if (!orgId) return;

    try {
      const accessToken = await getAccessToken();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      
      // 如果沒有 access token，添加用戶 email 作為備選認證
      if (!accessToken && saasUser?.email) {
        headers['X-User-Email'] = saasUser.email;
      }
      
      const response = await fetch('/api/members/identities/update', {
        method: 'PUT',
        credentials: 'include', // 確保 cookies 被發送
        headers,
        body: JSON.stringify({
          identityId,
          ...updates,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('身份更新成功');
        setEditingIdentity(null);
        await loadIdentities();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('更新身份錯誤:', error);
      toast.error(error instanceof Error ? error.message : '更新身份失敗');
    }
  };

  const handleDeleteIdentity = async (identityId: string) => {
    if (!confirm('確定要刪除此身份嗎？')) return;

    try {
      const accessToken = await getAccessToken();
      const headers: HeadersInit = {};
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      
      // 如果沒有 access token，添加用戶 email 作為備選認證
      if (!accessToken && saasUser?.email) {
        headers['X-User-Email'] = saasUser.email;
      }
      
      const response = await fetch(`/api/members/identities/delete?identityId=${encodeURIComponent(identityId)}`, {
        credentials: 'include', // 確保 cookies 被發送
        headers,
      });

      const result = await response.json();

      if (result.success) {
        toast.success('身份已刪除');
        await loadIdentities();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('刪除身份錯誤:', error);
      toast.error(error instanceof Error ? error.message : '刪除身份失敗');
    }
  };

  const formatExpiresAt = (expiresAt: string) => {
    const date = new Date(expiresAt);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (diff < 0) {
      return '已過期';
    }
    return `剩餘 ${hours} 小時 ${minutes} 分鐘`;
  };

  // 檢查 SaaS 認證狀態
  useEffect(() => {
    if (!saasAuthLoading && !saasUser) {
      console.warn('成員管理頁面：用戶未登入 SaaS 系統');
      toast.error('請先登入系統', {
        duration: 3000,
      });
      // 延遲跳轉，讓用戶看到錯誤訊息
      setTimeout(() => {
        router.push('/aihome/auth/login?redirect=' + encodeURIComponent(window.location.pathname));
      }, 2000);
    }
  }, [saasUser, saasAuthLoading, router]);

  // 初始化中或沒有 orgId 時顯示載入狀態
  if (saasAuthLoading || initializing || !orgId) {
    if (saasAuthLoading || initializing) {
      return (
        <CuteLoadingSpinner 
          message={saasAuthLoading ? '檢查登入狀態...' : '載入中...'} 
          className="min-h-screen"
        />
      );
    }
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFF3E6] to-[#FFE1F0] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-[#4B4036] font-medium">請先選擇機構</p>
          <HanamiButton
            onClick={() => router.push('/aihome/teacher-link/create')}
            variant="primary"
          >
            返回選擇機構
          </HanamiButton>
        </div>
      </div>
    );
  }

  // 如果沒有 SaaS 用戶，顯示登入提示
  if (!saasUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFF3E6] to-[#FFE1F0] flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-[#4B4036]">需要登入</h2>
          <p className="text-[#6E5A4A]">請先登入系統以使用成員管理功能</p>
          <HanamiButton
            onClick={() => router.push('/aihome/auth/login?redirect=' + encodeURIComponent(window.location.pathname))}
            variant="primary"
            className="mt-4"
          >
            前往登入
          </HanamiButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFF3E6] to-[#FFE1F0] px-4 py-6">
      <div className="max-w-6xl mx-auto">
        <BackButton href="/aihome/teacher-link/create" label="返回管理面板" />

        {/* 標題 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-[#4B4036] mb-2">成員管理</h1>
          <p className="text-[#6E5A4A]">管理機構成員身份和邀請</p>
        </motion.div>

        {/* 搜尋用戶區域 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-[28px] border border-white/60 bg-gradient-to-br from-white/80 via-[#FFEFE2] to-[#FFE4F5] shadow-[0_24px_60px_rgba(231,200,166,0.28)] p-6 mb-6"
        >
          <div className="absolute -right-14 top-10 h-48 w-48 rounded-full bg-white/40 blur-2xl" aria-hidden="true" />
          <div className="absolute -bottom-16 left-10 h-40 w-40 rounded-full bg-[#FFD6E7]/60 blur-3xl" aria-hidden="true" />
          <div className="relative">
          <h2 className="text-xl font-semibold text-[#4B4036] mb-4 flex items-center gap-2">
            <Search className="w-5 h-5" />
            搜尋用戶
          </h2>
          <div className="flex gap-3">
            <div className="flex-1">
              <HanamiInput
                type="email"
                placeholder="輸入用戶郵箱地址"
                value={searchEmail}
                onChange={(value) => setSearchEmail(value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <HanamiButton
              onClick={handleSearch}
              disabled={searching || !searchEmail.trim()}
              variant="primary"
            >
              {searching ? '搜尋中...' : '搜尋'}
            </HanamiButton>
          </div>

          {/* 搜尋結果 */}
          <AnimatePresence>
            {foundUser && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-4 bg-[#FFFDF8] rounded-xl border border-[#EADBC8]"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[#4B4036]">{foundUser.full_name}</h3>
                    <p className="text-sm text-[#6E5A4A]">{foundUser.email}</p>
                    {foundUser.phone && (
                      <p className="text-sm text-[#6E5A4A]">{foundUser.phone}</p>
                    )}
                  </div>
                  {existingIdentity && (
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${roleColors[existingIdentity.role_type as RoleType]}`}>
                      {roleLabels[existingIdentity.role_type as RoleType]}
                    </span>
                  )}
                </div>

                {existingIdentity ? (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-[#4B4036]">已存在身份，可以更新：</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {(Object.keys(roleLabels) as RoleType[]).map((role) => (
                        <motion.button
                          key={role}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSetIdentity(role, false)}
                          className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                            existingIdentity.role_type === role
                              ? 'bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] shadow-md'
                              : 'bg-white border-2 border-[#EADBC8] text-[#6E5A4A] hover:border-[#FFD59A] hover:shadow-sm'
                          }`}
                        >
                          <div className="text-center">
                            <div className="font-bold">{roleLabels[role]}</div>
                            <div className="text-xs mt-1 opacity-75">{roleDescriptions[role]}</div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-[#4B4036] mb-3">為用戶設定身份：</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {(Object.keys(roleLabels) as RoleType[]).map((role) => (
                        <motion.button
                          key={role}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSetIdentity(role, false)}
                          className="px-4 py-3 rounded-xl text-sm font-semibold bg-white border-2 border-[#EADBC8] text-[#6E5A4A] hover:border-[#FFD59A] hover:shadow-sm transition-all"
                        >
                          <div className="text-center">
                            <div className="font-bold">{roleLabels[role]}</div>
                            <div className="text-xs mt-1 opacity-75">{roleDescriptions[role]}</div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          </div>
        </motion.div>

        {/* 邀請ID管理 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative overflow-hidden rounded-[28px] border border-white/60 bg-gradient-to-br from-white/80 via-[#FFEFE2] to-[#FFE4F5] shadow-[0_24px_60px_rgba(231,200,166,0.28)] p-6 mb-6"
        >
          <div className="absolute -right-14 top-10 h-48 w-48 rounded-full bg-white/40 blur-2xl" aria-hidden="true" />
          <div className="absolute -bottom-16 left-10 h-40 w-40 rounded-full bg-[#FFD6E7]/60 blur-3xl" aria-hidden="true" />
          <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-[#4B4036] flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              邀請ID管理
            </h2>
            <HanamiButton
              onClick={() => setShowCreateInvitation(true)}
              variant="primary"
            >
              創建邀請ID
            </HanamiButton>
          </div>

          {/* 創建邀請表單 */}
          <AnimatePresence>
            {showCreateInvitation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-4 bg-[#FFFDF8] rounded-xl border border-[#EADBC8]"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-[#4B4036]">創建新邀請</h3>
                  <button
                    onClick={() => setShowCreateInvitation(false)}
                    className="text-[#6E5A4A] hover:text-[#4B4036]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-3">
                  <HanamiSelect
                    label="身份類型"
                    value={newInvitationRole}
                    onChange={(value) => setNewInvitationRole(value as RoleType)}
                    options={(Object.keys(roleLabels) as RoleType[]).map((role) => ({
                      value: role,
                      label: `${roleLabels[role]} - ${roleDescriptions[role]}`,
                    }))}
                    placeholder="請選擇身份類型"
                    required
                  />
                  <HanamiButton onClick={handleCreateInvitation} variant="primary" className="w-full">
                    創建邀請ID
                  </HanamiButton>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 邀請列表 */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="relative mx-auto w-16 h-16 mb-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-3 border-[#FFD59A] border-t-transparent"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img
                      src="/owlui.png"
                      alt="載入中"
                      className="w-10 h-10 object-contain"
                    />
                  </div>
                </div>
                <p className="text-[#6E5A4A] text-sm">載入中...</p>
              </div>
            </div>
          ) : invitations.length === 0 ? (
            <div className="text-center py-8 text-[#6E5A4A]">暫無邀請ID</div>
          ) : (
            <div className="space-y-2">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className={`p-4 rounded-xl border ${
                    invitation.is_used
                      ? 'bg-gray-50 border-gray-200'
                      : new Date(invitation.expires_at) < new Date()
                      ? 'bg-red-50 border-red-200'
                      : 'bg-[#FFFDF8] border-[#EADBC8]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${roleColors[invitation.role_type]}`}>
                          {roleLabels[invitation.role_type]}
                        </span>
                        <code className="px-3 py-1 bg-white border border-[#EADBC8] rounded-lg text-sm font-mono text-[#4B4036]">
                          {invitation.invitation_code}
                        </code>
                        <button
                          onClick={() => handleCopyInvitationCode(invitation.invitation_code)}
                          className="p-1 text-[#6E5A4A] hover:text-[#4B4036] transition"
                        >
                          {copiedCode === invitation.invitation_code ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-[#6E5A4A]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatExpiresAt(invitation.expires_at)}
                        </span>
                        {invitation.is_used && invitation.used_by_email && (
                          <span>已使用：{invitation.used_by_email}</span>
                        )}
                        <span>創建時間：{new Date(invitation.created_at).toLocaleString('zh-TW')}</span>
                      </div>
                    </div>
                    {invitation.is_used && (
                      <span className="px-3 py-1 bg-gray-200 text-gray-600 rounded-full text-xs font-semibold">
                        已使用
                      </span>
                    )}
                    {!invitation.is_used && new Date(invitation.expires_at) < new Date() && (
                      <span className="px-3 py-1 bg-red-200 text-red-600 rounded-full text-xs font-semibold">
                        已過期
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
        </motion.div>

        {/* 成員列表 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative overflow-hidden rounded-[28px] border border-white/60 bg-gradient-to-br from-white/80 via-[#FFEFE2] to-[#FFE4F5] shadow-[0_24px_60px_rgba(231,200,166,0.28)] p-6"
        >
          <div className="absolute -right-14 top-10 h-48 w-48 rounded-full bg-white/40 blur-2xl" aria-hidden="true" />
          <div className="absolute -bottom-16 left-10 h-40 w-40 rounded-full bg-[#FFD6E7]/60 blur-3xl" aria-hidden="true" />
          <div className="relative">
          <h2 className="text-xl font-semibold text-[#4B4036] mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            機構成員 ({identities.length})
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="relative mx-auto w-16 h-16 mb-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-3 border-[#FFD59A] border-t-transparent"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img
                      src="/owlui.png"
                      alt="載入中"
                      className="w-10 h-10 object-contain"
                    />
                  </div>
                </div>
                <p className="text-[#6E5A4A] text-sm">載入中...</p>
              </div>
            </div>
          ) : identities.length === 0 ? (
            <div className="text-center py-8 text-[#6E5A4A]">暫無成員</div>
          ) : (
            <div className="space-y-3">
              {identities.map((identity) => (
                <div
                  key={identity.id}
                  className="p-4 rounded-xl border border-[#EADBC8] bg-[#FFFDF8]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${roleColors[identity.role_type]}`}>
                          {roleLabels[identity.role_type]}
                        </span>
                        {identity.is_primary && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                            主要身份
                          </span>
                        )}
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          identity.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {identity.status === 'active' ? '啟用' : '停用'}
                        </span>
                      </div>
                      <p className="text-sm text-[#6E5A4A]">{identity.user_email}</p>
                      <p className="text-xs text-[#6E5A4A] mt-1">
                        加入時間：{new Date(identity.created_at).toLocaleString('zh-TW')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingIdentity(identity)}
                        className="p-2 text-[#6E5A4A] hover:text-[#4B4036] hover:bg-[#FFF9F2] rounded-lg transition"
                        title="編輯"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {identity.role_type !== 'owner' && (
                        <button
                          onClick={() => handleDeleteIdentity(identity.id)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                          title="刪除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
        </motion.div>

        {/* 編輯身份模態框 */}
        <AnimatePresence>
          {editingIdentity && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setEditingIdentity(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="relative overflow-hidden bg-gradient-to-br from-white/90 via-[#FFEFE2] to-[#FFE4F5] rounded-[28px] p-6 max-w-md w-full shadow-[0_32px_80px_rgba(228,192,155,0.35)] border border-white/60"
              >
                <div className="absolute -right-8 top-8 h-32 w-32 rounded-full bg-white/40 blur-2xl" aria-hidden="true" />
                <div className="absolute -bottom-8 left-8 h-24 w-24 rounded-full bg-[#FFD6E7]/60 blur-2xl" aria-hidden="true" />
                <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-[#4B4036]">編輯身份</h3>
                  <button
                    onClick={() => setEditingIdentity(null)}
                    className="text-[#6E5A4A] hover:text-[#4B4036]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <HanamiSelect
                    label="身份類型"
                    value={editingIdentity.role_type}
                    onChange={(value) =>
                      setEditingIdentity({
                        ...editingIdentity,
                        role_type: value as RoleType,
                      })
                    }
                    options={(Object.keys(roleLabels) as RoleType[]).map((role) => ({
                      value: role,
                      label: `${roleLabels[role]} - ${roleDescriptions[role]}`,
                    }))}
                    placeholder="請選擇身份類型"
                    required
                  />

                  <HanamiSelect
                    label="狀態"
                    value={editingIdentity.status}
                    onChange={(value) =>
                      setEditingIdentity({
                        ...editingIdentity,
                        status: value,
                      })
                    }
                    options={[
                      { value: 'active', label: '啟用' },
                      { value: 'inactive', label: '停用' },
                      { value: 'suspended', label: '暫停' },
                    ]}
                    placeholder="請選擇狀態"
                    required
                  />

                  <div className="flex items-center gap-2 p-3 rounded-xl bg-white/50 border border-[#EADBC8]">
                    <input
                      type="checkbox"
                      id="isPrimary"
                      checked={editingIdentity.is_primary}
                      onChange={(e) =>
                        setEditingIdentity({
                          ...editingIdentity,
                          is_primary: e.target.checked,
                        })
                      }
                      className="w-5 h-5 text-[#FFD59A] border-2 border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFD59A] cursor-pointer"
                    />
                    <label htmlFor="isPrimary" className="text-sm font-medium text-[#4B4036] cursor-pointer">
                      設為主要身份
                    </label>
                  </div>

                  <div className="flex gap-3">
                    <HanamiButton
                      onClick={() => {
                        handleUpdateIdentity(editingIdentity.id, {
                          role_type: editingIdentity.role_type,
                          status: editingIdentity.status,
                          is_primary: editingIdentity.is_primary,
                        });
                      }}
                      variant="primary"
                      className="flex-1"
                    >
                      保存
                    </HanamiButton>
                    <HanamiButton
                      onClick={() => setEditingIdentity(null)}
                      variant="secondary"
                      className="flex-1"
                    >
                      取消
                    </HanamiButton>
                  </div>
                </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

