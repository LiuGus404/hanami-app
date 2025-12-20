'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  QrCodeIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import { getSupabaseClient } from '@/lib/supabase';
import DirectVideoTest from '@/components/ui/DirectVideoTest';
import ParentShell from '@/components/ParentShell';

const DEFAULT_INSTITUTION = 'Hanami Music';

export default function ParentConnectPage() {
  const router = useRouter();
  const { user, loading, logout } = useSaasAuth();
  const [isLoaded, setIsLoaded] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const manualSectionRef = useRef<HTMLDivElement | null>(null);

  const fetchStudentRecord = async (id: string) => {
    const response = await fetch(`/api/students/${encodeURIComponent(id)}`, {
      cache: 'no-store',
    });

    const payload = await response.json();
    if (!response.ok || !payload.success) {
      const message = payload?.error ?? '找不到學生資料';
      throw new Error(message);
    }

    return payload.data;
  };

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/aihome/auth/login');
    } catch (logoutError) {
      console.error('登出失敗:', logoutError);
    }
  };

  const handleLogin = () => router.push('/aihome/auth/login');
  const handleRegister = () => router.push('/aihome/auth/register');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/aihome/auth/login');
    }
  }, [loading, user, router]);

  const handleManualConnect = async () => {
    if (!studentId.trim()) {
      setError('請輸入學生 ID');
      return;
    }

    if (!user) {
      setError('用戶未登入，請重新登入');
      return;
    }

    setIsConnecting(true);
    setError('');
    setSuccess('');

    try {
      const student = await fetchStudentRecord(studentId.trim());
      const bindResponse = await fetch('/api/parent/bind-student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parentId: user.id,
          studentId: student.id,
          studentName: student.full_name,
          studentOid: student.student_oid,
          institution: DEFAULT_INSTITUTION,
          bindingType: 'parent',
        }),
      });

      const bindResult = await bindResponse.json();
      if (!bindResponse.ok || !bindResult?.success) {
        throw new Error(bindResult?.error ?? '綁定失敗，請稍後再試');
      }

      setSuccess(bindResult?.message ?? `成功連接到學生：${student.full_name}`);
      setTimeout(() => {
        router.push('/aihome/parent/bound-students');
      }, 1500);
    } catch (err: any) {
      console.error('連接錯誤:', err);
      setError(err?.message ?? '連接失敗，請稍後再試');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleQRScan = async (qrData: string) => {
    if (!user) {
      setError('用戶未登入，請重新登入');
      return;
    }

    try {
      let qrStudentId = qrData;
      let qrTime: string | undefined;

      try {
        const parsed = JSON.parse(qrData);
        qrStudentId = parsed.studentId ?? qrData;
        qrTime = parsed.timestamp;
      } catch {
        qrStudentId = qrData;
      }

      const now = new Date();
      if (qrTime) {
        const hoursDiff = (now.getTime() - new Date(qrTime).getTime()) / (1000 * 60 * 60);
        if (hoursDiff > 24) {
          setError('QR 碼已過期，請重新生成');
          return;
        }
      }

      const student = await fetchStudentRecord(qrStudentId);
      setStudentId(student.id);
      setShowQRScanner(false);
      const bindResponse = await fetch('/api/parent/bind-student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parentId: user.id,
          studentId: student.id,
          studentName: student.full_name,
          studentOid: student.student_oid,
          institution: DEFAULT_INSTITUTION,
          bindingType: 'parent',
        }),
      });

      const bindResult = await bindResponse.json();
      if (!bindResponse.ok || !bindResult?.success) {
        throw new Error(bindResult?.error ?? '綁定失敗，請稍後再試');
      }

      setSuccess(bindResult?.message ?? `成功連接到學生：${student.full_name}`);
      setTimeout(() => {
        router.push('/aihome/parent/bound-students');
      }, 1500);
    } catch (err: any) {
      console.error('QR 掃描錯誤:', err);
      setError(err?.message ?? 'QR 碼格式錯誤，請重新掃描');
    }
  };

  const recordAccessLog = async (action: string) => {
    if (!user) {
      console.warn('用戶未登入，無法記錄訪問日誌');
      return;
    }

    try {
      const supabase = getSupabaseClient();
      await (supabase.from('parent_access_logs') as any).insert({
        parent_id: user.id,
        action,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        ip: 'client-side',
      });
    } catch (err) {
      console.error('記錄訪問日誌失敗:', err);
    }
  };

  const handleActionAddBinding = () => {
    recordAccessLog('action_add_binding');
    setShowQRScanner(false);
    setTimeout(() => {
      manualSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4B4036] mx-auto mb-4"></div>
          <p className="text-[#4B4036]">載入中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <ParentShell
        currentPath="/aihome/parent/connect"
        pageTitle="連接學習記錄"
        pageSubtitle="只需學生 ID，即可完成綁定"
        action={{
          label: '新增綁定',
          onClick: handleActionAddBinding,
          icon: <PlusIcon className="w-4 h-4 text-[#4B4036]" />,
        }}
        user={user}
        onLogout={handleLogout}
        onLogin={handleLogin}
        onRegister={handleRegister}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={isLoaded ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-[#4B4036] mb-2">立即連接</h2>
            <p className="text-sm text-[#2B3A3B]">
              <span className="font-semibold text-[#4B4036]">只需學生 ID</span> 即可完成綁定，機構資訊將由系統自動判斷。
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isLoaded ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="bg-white rounded-[2rem] p-8 shadow-sm border border-[#F3EAD9]"
          >
            <h3 className="text-xl font-bold text-[#4B4036] mb-8 text-center">選擇連接方式</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                whileHover={{ y: -4, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-3xl p-8 shadow-sm border border-[#F3EAD9] cursor-pointer group relative overflow-hidden"
                onClick={() => {
                  recordAccessLog('qr_scan_start');
                  setShowQRScanner(true);
                }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#FFF9F2] to-transparent rounded-bl-full -mr-8 -mt-8 opacity-50 pointer-events-none" />
                <div className="text-center relative z-10">
                  <div className="w-20 h-20 bg-[#FFD59A]/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <QrCodeIcon className="w-10 h-10 text-[#4B4036]" />
                  </div>
                  <h4 className="text-xl font-bold text-[#4B4036] mb-2">掃描 QR 碼</h4>
                  <p className="text-[#4B4036]/70">直接掃描即可綁定對應學生</p>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ y: -4, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-3xl p-8 shadow-sm border border-[#F3EAD9] cursor-pointer group relative overflow-hidden"
                onClick={() => {
                  recordAccessLog('manual_input_start');
                  setShowQRScanner(false);
                }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#FFF9F2] to-transparent rounded-bl-full -mr-8 -mt-8 opacity-50 pointer-events-none" />
                <div className="text-center relative z-10">
                  <div className="w-20 h-20 bg-[#EBC9A4]/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <MagnifyingGlassIcon className="w-10 h-10 text-[#4B4036]" />
                  </div>
                  <h4 className="text-xl font-bold text-[#4B4036] mb-2">輸入學生 ID</h4>
                  <p className="text-[#4B4036]/70">直接輸入學生 ID 即可綁定</p>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {!showQRScanner && (
            <motion.div
              ref={manualSectionRef}
              initial={{ opacity: 0, y: 20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="bg-white rounded-[2rem] p-8 shadow-sm border border-[#F3EAD9]"
            >
              <h3 className="text-xl font-bold text-[#4B4036] mb-6">輸入學生 ID</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[#4B4036] mb-2 ml-1">學生 ID</label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="請輸入學生 ID"
                    className="w-full px-6 py-4 bg-[#F8F9FA] border border-[#EADBC8] rounded-2xl focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent transition-all duration-200 outline-none text-[#4B4036] placeholder-[#9CA3AF]"
                  />
                </div>
                <motion.button
                  onClick={handleManualConnect}
                  disabled={isConnecting || !studentId.trim()}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-[#FFD59A] text-[#4B4036] font-bold py-4 px-6 rounded-2xl hover:bg-[#EBC9A4] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {isConnecting ? '連接中...' : '連接學生'}
                </motion.button>
              </div>
            </motion.div>
          )}

          {(error || success) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {error && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center space-x-3">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                  <p className="text-red-700 font-medium">{error}</p>
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-center space-x-3">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <p className="text-green-700 font-medium">{success}</p>
                </div>
              )}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isLoaded ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="bg-[#FFF9F2]/50 rounded-[2rem] p-8 border border-[#F3EAD9]"
          >
            <h3 className="text-lg font-bold text-[#4B4036] mb-4">使用說明</h3>
            <div className="space-y-3 text-[#4B4036]/80 text-sm">
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E6A23C]" />
                只要有學生 ID 就能完成綁定，機構由系統自動判斷
              </p>
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E6A23C]" />
                若 QR 碼無法掃描，請確認相機已開啟權限
              </p>
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E6A23C]" />
                若遇到狀況，可聯繫客服提供協助
              </p>
            </div>
          </motion.div>
        </div>
      </ParentShell>

      <DirectVideoTest
        isActive={showQRScanner}
        onScanSuccess={handleQRScan}
        onScanError={(scanError) => setError(scanError)}
        onClose={() => setShowQRScanner(false)}
      />
    </>
  );
}