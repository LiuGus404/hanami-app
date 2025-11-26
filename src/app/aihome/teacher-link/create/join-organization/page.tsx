'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  QrCodeIcon,
  MagnifyingGlassIcon,
  BuildingOfficeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  KeyIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import { getSupabaseClient } from '@/lib/supabase';
import { TeacherLinkShell } from '../TeacherLinkShell';
import DirectVideoTest from '@/components/ui/DirectVideoTest';

function JoinOrganizationContent() {
  const router = useRouter();
  const { user } = useSaasAuth();
  const [orgId, setOrgId] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [connectionMethod, setConnectionMethod] = useState<'id' | 'invite' | 'qr'>('id');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [orgInfo, setOrgInfo] = useState<{
    id: string;
    name: string;
    slug: string;
    status: string;
  } | null>(null);

  // 處理機構 ID 輸入
  const handleOrgIdInput = async (inputId: string) => {
    if (!inputId.trim()) {
      setError('請輸入機構 ID');
      return;
    }

    if (!user) {
      setError('用戶未登入，請重新登入');
      return;
    }

    setIsConnecting(true);
    setError('');
    setSuccess('');
    setOrgInfo(null);

    try {
      // 使用 API 端點查詢機構資訊（繞過 RLS）
      const userEmail = user?.email || '';
      const orgResponse = await fetch(
        `/api/organizations/get?orgId=${encodeURIComponent(inputId.trim())}&userEmail=${encodeURIComponent(userEmail)}`
      );

      if (!orgResponse.ok) {
        const errorData = await orgResponse.json().catch(() => ({}));
        console.error('查詢機構錯誤:', errorData);
        setError(errorData.error || '找不到該機構，請檢查機構 ID 是否正確');
        return;
      }

      const orgData = await orgResponse.json();
      const org = orgData.data;

      if (!org) {
        setError('找不到該機構，請檢查機構 ID 是否正確');
        return;
      }

      if (org.status !== 'active') {
        setError('該機構目前不可用，請聯繫機構管理員');
        return;
      }

      setOrgInfo({
        id: org.id,
        name: org.org_name || org.name || '',
        slug: org.org_slug || org.slug || '',
        status: org.status,
      });
    } catch (err) {
      console.error('查詢錯誤:', err);
      setError('查詢失敗，請重試');
    } finally {
      setIsConnecting(false);
    }
  };

  // 處理邀請碼輸入
  const handleInviteCodeInput = async (code: string) => {
    if (!code.trim()) {
      setError('請輸入邀請碼');
      return;
    }

    if (!user) {
      setError('用戶未登入，請重新登入');
      return;
    }

    setIsConnecting(true);
    setError('');
    setSuccess('');
    setOrgInfo(null);

    try {
      // 使用 API 端點查詢機構資訊（通過 slug，繞過 RLS）
      const userEmail = user?.email || '';
      const orgResponse = await fetch(
        `/api/organizations/get?orgSlug=${encodeURIComponent(code.trim())}&bySlug=true&userEmail=${encodeURIComponent(userEmail)}`
      );

      if (!orgResponse.ok) {
        const errorData = await orgResponse.json().catch(() => ({}));
        setError(errorData.error || '邀請碼無效或已過期，請聯繫機構獲取新的邀請碼');
        return;
      }

      const orgData = await orgResponse.json();
      const org = orgData.data;

      if (!org) {
        setError('邀請碼無效或已過期，請聯繫機構獲取新的邀請碼');
        return;
      }

      if (org.status !== 'active') {
        setError('該機構目前不可用，請聯繫機構管理員');
        return;
      }

      setOrgInfo({
        id: org.id,
        name: org.org_name || org.name || '',
        slug: org.org_slug || org.slug || '',
        status: org.status,
      });
    } catch (err) {
      console.error('驗證邀請碼錯誤:', err);
      setError('驗證失敗，請重試');
    } finally {
      setIsConnecting(false);
    }
  };

  // 處理 QR 掃描
  const handleQRScan = async (qrData: string) => {
    if (!user) {
      setError('用戶未登入，請重新登入');
      return;
    }

    try {
      const qrInfo = JSON.parse(qrData);
      const { orgId: qrOrgId, inviteCode: qrInviteCode, timestamp: qrTime } = qrInfo;

      // 檢查 QR 碼是否過期（7天）
      const now = new Date();
      const qrDate = new Date(qrTime);
      const daysDiff = (now.getTime() - qrDate.getTime()) / (1000 * 60 * 60 * 24);

      if (daysDiff > 7) {
        setError('QR 碼已過期，請聯繫機構獲取新的 QR 碼');
        return;
      }

      // 使用機構 ID 或邀請碼查詢機構
      if (qrOrgId) {
        await handleOrgIdInput(qrOrgId);
      } else if (qrInviteCode) {
        await handleInviteCodeInput(qrInviteCode);
      } else {
        setError('QR 碼格式錯誤，請掃描正確的 QR 碼');
      }
    } catch (err) {
      console.error('QR 掃描錯誤:', err);
      setError('QR 碼格式錯誤，請掃描正確的 QR 碼');
    }
  };

  // 確認加入機構
  const handleJoinConfirm = async () => {
    if (!orgInfo || !user) {
      setError('請先選擇機構');
      return;
    }

    setIsConnecting(true);
    setError('');
    setSuccess('');

    try {
      const supabase = getSupabaseClient();
      // 檢查用戶是否已經在該機構中
      const { data: existingIdentity, error: checkError } = await (supabase
        .from('hanami_org_identities') as any)
        .select('id')
        .eq('org_id', orgInfo.id)
        .eq('user_email', user.email)
        .maybeSingle();

      if (checkError) {
        console.error('檢查身份錯誤:', checkError);
        setError('檢查身份失敗，請重試');
        return;
      }

      if (existingIdentity) {
        setError('您已經是該機構的成員');
        setTimeout(() => {
          router.push('/aihome/teacher-link/create');
        }, 2000);
        return;
      }

      // 創建機構身份記錄（默認為 member 角色，需要管理員批准）
      const { error: insertError } = await (supabase
        .from('hanami_org_identities') as any)
        .insert({
          org_id: orgInfo.id,
          user_id: user.id,
          user_email: user.email,
          user_phone: user.phone || null,
          role_type: 'member', // 默認為成員，管理員可以後續調整
          status: 'pending', // 待審核狀態
          is_primary: false,
          created_by: user.id,
        });

      if (insertError) {
        console.error('加入機構錯誤:', insertError);
        setError('加入機構失敗，請重試');
        return;
      }

      setSuccess(`成功申請加入機構：${orgInfo.name}`);
      setTimeout(() => {
        router.push('/aihome/teacher-link/create');
      }, 2000);
    } catch (err) {
      console.error('加入機構錯誤:', err);
      setError('加入機構失敗，請重試');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFF3E6] to-[#FFE1F0]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-10">
        <motion.button
          onClick={() => router.push('/aihome/teacher-link/create')}
          className="inline-flex items-center gap-2 text-sm text-[#786355] hover:text-[#4B4036] mb-4 transition-colors"
        >
          <ArrowRightIcon className="w-4 h-4 rotate-180" />
          返回
        </motion.button>

        {/* 主標題區域 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-[32px] border border-white/60 bg-gradient-to-br from-white/80 via-[#FFEFE2] to-[#FFE4F5] shadow-[0_32px_80px_rgba(228,192,155,0.35)]"
        >
          <div className="absolute -right-14 top-10 h-48 w-48 rounded-full bg-white/40 blur-2xl" aria-hidden="true" />
          <div className="absolute -bottom-16 left-10 h-40 w-40 rounded-full bg-[#FFD6E7]/60 blur-3xl" aria-hidden="true" />
          <div className="relative px-8 py-10">
            <div className="text-center space-y-4 text-[#4B4036]">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-[#D48347] shadow-sm">
                加入機構
              </span>
              <h1 className="text-3xl font-extrabold leading-snug tracking-wide lg:text-4xl">
                加入現有機構
              </h1>
              <p className="text-sm leading-relaxed text-[#6E5A4A] lg:text-base max-w-2xl mx-auto">
                通過機構 ID、邀請碼或 QR 碼加入現有機構，開始與團隊協作
              </p>
            </div>
          </div>
        </motion.section>

        {/* 連接方式選擇 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="rounded-[28px] border border-[#F1E4D3] bg-white/90 px-5 py-6 shadow-[0_24px_60px_rgba(231,200,166,0.28)]"
        >
          <h2 className="text-xl font-semibold text-[#4B4036] mb-6">選擇連接方式</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <motion.button
              disabled
              className="group relative overflow-hidden rounded-2xl border-2 p-6 text-left transition-all border-gray-300 bg-gray-100 cursor-not-allowed opacity-60"
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gray-200/10 blur-2xl" aria-hidden="true" />
              <div className="relative flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gray-300 flex items-center justify-center flex-shrink-0 shadow-md">
                  <BuildingOfficeIcon className="w-6 h-6 text-gray-500" />
                </div>
                <h3 className="text-base font-semibold text-gray-500">機構 ID</h3>
                <p className="text-xs text-gray-400">輸入機構的唯一識別碼</p>
              </div>
            </motion.button>

            <motion.button
              disabled
              className="group relative overflow-hidden rounded-2xl border-2 p-6 text-left transition-all border-gray-300 bg-gray-100 cursor-not-allowed opacity-60"
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gray-200/10 blur-2xl" aria-hidden="true" />
              <div className="relative flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gray-300 flex items-center justify-center flex-shrink-0 shadow-md">
                  <KeyIcon className="w-6 h-6 text-gray-500" />
                </div>
                <h3 className="text-base font-semibold text-gray-500">邀請碼</h3>
                <p className="text-xs text-gray-400">輸入機構提供的邀請碼</p>
              </div>
            </motion.button>

            <motion.button
              disabled
              className="group relative overflow-hidden rounded-2xl border-2 p-6 text-left transition-all border-gray-300 bg-gray-100 cursor-not-allowed opacity-60"
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gray-200/10 blur-2xl" aria-hidden="true" />
              <div className="relative flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gray-300 flex items-center justify-center flex-shrink-0 shadow-md">
                  <QrCodeIcon className="w-6 h-6 text-gray-500" />
                </div>
                <h3 className="text-base font-semibold text-gray-500">掃描 QR 碼</h3>
                <p className="text-xs text-gray-400">使用相機掃描機構 QR 碼</p>
              </div>
            </motion.button>
          </div>

          {/* 提示訊息 */}
          <div className="mb-6 p-4 rounded-xl bg-gray-50 border border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              如需加入機構，請聯繫該機構管理員，並以當前email向其申請加入機構
            </p>
          </div>

          {/* 輸入表單 - 已禁用 */}
          {connectionMethod === 'id' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 opacity-60"
            >
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">
                  機構 ID
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    disabled
                    placeholder="請輸入機構 ID（UUID）"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                  <motion.button
                    disabled
                    className="px-6 py-3 bg-gray-300 text-gray-500 font-semibold rounded-xl cursor-not-allowed flex items-center gap-2"
                  >
                    <MagnifyingGlassIcon className="w-5 h-5" />
                    查詢
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {connectionMethod === 'invite' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 opacity-60"
            >
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">
                  邀請碼
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    disabled
                    placeholder="請輸入機構提供的邀請碼"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                  <motion.button
                    disabled
                    className="px-6 py-3 bg-gray-300 text-gray-500 font-semibold rounded-xl cursor-not-allowed flex items-center gap-2"
                  >
                    <KeyIcon className="w-5 h-5" />
                    驗證
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* 機構信息確認 */}
          {orgInfo && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-6 rounded-xl bg-gradient-to-br from-[#FFF9F2] to-white border-2 border-[#FFD59A]"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] flex items-center justify-center flex-shrink-0 shadow-md">
                  <BuildingOfficeIcon className="w-6 h-6 text-[#4B4036]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[#4B4036] mb-1">{orgInfo.name}</h3>
                  <p className="text-sm text-[#786355]">@{orgInfo.slug}</p>
                  <p className="text-xs text-[#786355] mt-1">狀態：{orgInfo.status === 'active' ? '活躍' : '非活躍'}</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleJoinConfirm}
                disabled={isConnecting}
                className="w-full px-6 py-3 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] font-semibold rounded-xl hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isConnecting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#4B4036]" />
                    加入中...
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-5 h-5" />
                    確認加入機構
                    <ArrowRightIcon className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </motion.div>
          )}

          {/* 錯誤和成功訊息 */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3"
            >
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 rounded-xl bg-green-50 border border-green-200 flex items-start gap-3"
            >
              <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700">{success}</p>
            </motion.div>
          )}
        </motion.section>

        {/* 使用說明 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="rounded-[28px] border border-[#F1E4D3] bg-white/90 px-5 py-6 shadow-[0_24px_60px_rgba(231,200,166,0.28)]"
        >
          <h2 className="text-xl font-semibold text-[#4B4036] mb-4">使用說明</h2>
          <div className="space-y-2 text-sm text-[#786355]">
            <p>• <strong>機構 ID</strong>：由機構管理員提供的唯一識別碼（UUID 格式）</p>
            <p>• <strong>邀請碼</strong>：機構提供的邀請碼，通常是機構的 slug 或特殊代碼</p>
            <p>• <strong>QR 碼</strong>：掃描機構提供的 QR 碼快速加入</p>
            <p>• 加入申請需要機構管理員審核，審核通過後您將收到通知</p>
            <p>• 如果您沒有機構 ID 或邀請碼，請聯繫機構管理員獲取</p>
          </div>
        </motion.section>
      </div>

      {/* QR 碼掃描器 */}
      <DirectVideoTest
        isActive={showQRScanner}
        onScanSuccess={handleQRScan}
        onScanError={(error) => {
          setError(error);
          setShowQRScanner(false);
        }}
        onClose={() => {
          setShowQRScanner(false);
          setConnectionMethod('id');
        }}
      />
    </div>
  );
}

export default function JoinOrganizationPage() {
  return (
    <TeacherLinkShell currentPath="/aihome/teacher-link/create/join-organization">
      <JoinOrganizationContent />
    </TeacherLinkShell>
  );
}

