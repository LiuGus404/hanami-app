'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  QrCodeIcon,
  MagnifyingGlassIcon,
  BuildingOfficeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  UserIcon,
  Cog6ToothIcon,
  CalendarDaysIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import { getSupabaseClient } from '@/lib/supabase';
import DirectVideoTest from '@/components/ui/DirectVideoTest';
import AppSidebar from '@/components/AppSidebar';

export default function ParentConnectPage() {
  const router = useRouter();
  const { user, loading, logout } = useSaasAuth();
  const [isLoaded, setIsLoaded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedInstitution, setSelectedInstitution] = useState('Hanami Music');
  const [studentId, setStudentId] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showQRScanner, setShowQRScanner] = useState(false);

  // 機構列表
  const institutions = [
    { id: 1, name: 'Hanami Music', description: '專業音樂教育機構' },
    { id: 2, name: '其他機構', description: '其他合作機構' }
  ];

  // 更新時間
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // 登出處理
  const handleLogout = async () => {
    try {
      await logout();
      router.push('/aihome/auth/login');
    } catch (error) {
      console.error('登出失敗:', error);
    }
  };

  // 認證保護
  useEffect(() => {
    if (!loading && !user) {
      router.push('/aihome/auth/login');
    }
  }, [loading, user, router]);

  // 處理手動輸入連接
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
      const supabase = getSupabaseClient();
      
      // 查詢學生資料
      const { data: student, error } = await supabase
        .from('Hanami_Students')
        .select('*')
        .eq('student_oid', studentId.trim())
        .single();

      if (error) {
        console.error('查詢學生錯誤:', error);
        setError('學生不存在或機構不匹配，請檢查學生 ID 或聯繫機構獲取正確 ID');
        return;
      }

      if (!student) {
        setError('找不到該學生，請檢查學生 ID 或聯繫機構獲取正確 ID');
        return;
      }

      // 記錄綁定
      const { error: bindingError } = await supabase
        .from('parent_student_bindings')
        .insert({
          parent_id: user.id,
          student_id: student.id,
          student_name: student.full_name,
          student_oid: student.student_oid,
          institution: selectedInstitution,
          binding_type: 'parent',
          binding_status: 'active'
        });

      if (bindingError) {
        console.error('綁定錯誤:', bindingError);
        setError('綁定失敗，請重試');
        return;
      }

      setSuccess(`成功連接到學生：${student.full_name}`);
      setTimeout(() => {
        router.push('/aihome/parent/bound-students');
      }, 1500);
      
    } catch (err) {
      console.error('連接錯誤:', err);
      setError('連接失敗，請檢查學生 ID 或聯繫機構獲取正確 ID');
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
      const { studentId: qrStudentId, institution: qrInstitution, timestamp: qrTime } = qrInfo;
      
      // 檢查 QR 碼是否過期（24小時）
      const now = new Date();
      const hoursDiff = (now.getTime() - qrTime.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff > 24) {
        setError('QR 碼已過期，請重新生成');
        return;
      }
      
      // 檢查機構是否匹配
      if (qrInstitution !== selectedInstitution) {
        setError(`QR 碼屬於 ${qrInstitution} 機構，請選擇正確的機構或聯繫機構獲取正確的 QR 碼`);
        return;
      }

      const supabase = getSupabaseClient();
      
      // 查詢學生資料
      const { data: student, error } = await supabase
        .from('Hanami_Students')
        .select('*')
        .eq('student_oid', qrStudentId)
        .single();

      if (error) {
        console.error('查詢學生錯誤:', error);
        setError('學生不存在或機構不匹配，請聯繫機構獲取正確的 QR 碼');
        return;
      }

      if (!student) {
        setError('找不到該學生，請聯繫機構獲取正確的 QR 碼');
        return;
      }

      // 記錄綁定
      const { error: bindingError } = await supabase
        .from('parent_student_bindings')
        .insert({
          parent_id: user.id,
          student_id: student.id,
          student_name: student.full_name,
          student_oid: student.student_oid,
          institution: selectedInstitution,
          binding_type: 'parent',
          binding_status: 'active'
        });

      if (bindingError) {
        console.error('綁定錯誤:', bindingError);
        setError('綁定失敗，請重試');
        return;
      }

      setSuccess(`成功連接到學生：${student.full_name}`);
      setTimeout(() => {
        router.push('/aihome/parent/bound-students');
      }, 1500);
      
    } catch (err) {
      console.error('QR 掃描錯誤:', err);
      setError('QR 碼格式錯誤，請掃描正確的 QR 碼');
    }
  };

  // 記錄訪問日誌
  const recordAccessLog = async (action: string) => {
    if (!user) {
      console.warn('用戶未登入，無法記錄訪問日誌');
      return;
    }

    try {
      const supabase = getSupabaseClient();
      await supabase.from('parent_access_logs').insert({
        parent_id: user.id,
        action,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        ip: 'client-side' // 實際應用中應該從服務器獲取
      });
    } catch (err) {
      console.error('記錄訪問日誌失敗:', err);
    }
  };

  // 顯示載入狀態
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

  // 如果未認證，不渲染內容
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A]">
      <div className="flex">
        {/* 側邊欄選單 */}
        <AppSidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          currentPath="/aihome/parent/connect"
        />

        {/* 主內容區域 */}
        <div className="flex-1 flex flex-col">
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
                    className="p-2 rounded-lg hover:bg-[#FFD59A]/20 transition-colors relative z-40"
                    title="開啟選單"
                  >
                    <Bars3Icon className="w-6 h-6 text-[#4B4036]" />
                  </motion.button>
                  
                  <div className="w-10 h-10 relative">
                    <img 
                      src="/@hanami.png" 
                      alt="HanamiEcho Logo" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-[#4B4036]">HanamiEcho</h1>
                    <p className="text-sm text-[#2B3A3B]">家長連接</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-[#2B3A3B]">
                    {currentTime.toLocaleTimeString('zh-TW', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                  <div className="w-8 h-8 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-[#4B4036]">
                      {user.full_name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <motion.button
                    onClick={handleLogout}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center space-x-2 px-3 py-2 text-sm text-[#2B3A3B] hover:text-[#4B4036] hover:bg-[#FFD59A]/20 rounded-lg transition-all duration-200"
                    title="登出"
                  >
                    <ArrowRightOnRectangleIcon className="w-4 h-4" />
                    <span>登出</span>
                  </motion.button>
                </div>
              </div>
            </div>
          </nav>

          {/* 主內容區域 */}
          <div className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 min-h-full transition-all duration-300 ${sidebarOpen ? 'lg:ml-80' : ''}`}>
            {/* 頁面標題 */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
              className="text-center mb-12"
            >
              <h1 className="text-4xl font-bold text-[#4B4036] mb-4">
                連接您的孩子
              </h1>
              <p className="text-xl text-[#2B3A3B] max-w-3xl mx-auto">
                通過掃描 QR 碼或輸入學生 ID，查看您孩子的學習進度和課程活動
              </p>
            </motion.div>

            {/* 機構選擇 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-8"
            >
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-[#EADBC8]">
                <div className="flex items-center space-x-3 mb-4">
                  <BuildingOfficeIcon className="w-6 h-6 text-[#4B4036]" />
                  <h2 className="text-xl font-semibold text-[#4B4036]">選擇機構</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {institutions.map((institution) => (
                    <motion.button
                      key={institution.id}
                      onClick={() => setSelectedInstitution(institution.name)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        selectedInstitution === institution.name
                          ? 'border-[#FFD59A] bg-[#FFD59A]/10'
                          : 'border-[#EADBC8] hover:border-[#FFD59A]/50'
                      }`}
                    >
                      <h3 className="font-semibold text-[#4B4036] mb-1">{institution.name}</h3>
                      <p className="text-sm text-[#2B3A3B]">{institution.description}</p>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* 連接方式選擇 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mb-8"
            >
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-[#EADBC8]">
                <h2 className="text-xl font-semibold text-[#4B4036] mb-6">選擇連接方式</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* QR 碼掃描 */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="p-6 border-2 border-[#EADBC8] rounded-xl hover:border-[#FFD59A] transition-all duration-200 cursor-pointer"
                    onClick={() => {
                      setShowQRScanner(true);
                      recordAccessLog('qr_scan_start');
                    }}
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center mx-auto mb-4">
                        <QrCodeIcon className="w-8 h-8 text-[#4B4036]" />
                      </div>
                      <h3 className="text-lg font-semibold text-[#4B4036] mb-2">掃描 QR 碼</h3>
                      <p className="text-sm text-[#2B3A3B]">使用相機掃描學生 QR 碼</p>
                    </div>
                  </motion.div>

                  {/* 手動輸入 */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="p-6 border-2 border-[#EADBC8] rounded-xl hover:border-[#FFD59A] transition-all duration-200 cursor-pointer"
                    onClick={() => {
                      setShowQRScanner(false);
                      recordAccessLog('manual_input_start');
                    }}
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center mx-auto mb-4">
                        <MagnifyingGlassIcon className="w-8 h-8 text-[#4B4036]" />
                      </div>
                      <h3 className="text-lg font-semibold text-[#4B4036] mb-2">手動輸入</h3>
                      <p className="text-sm text-[#2B3A3B]">輸入學生 ID 進行連接</p>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* 手動輸入表單 */}
            {!showQRScanner && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isLoaded ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="mb-8"
              >
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-[#EADBC8]">
                  <h2 className="text-xl font-semibold text-[#4B4036] mb-4">輸入學生 ID</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#4B4036] mb-2">
                        學生 ID
                      </label>
                      <input
                        type="text"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        placeholder="請輸入學生 ID"
                        className="w-full px-4 py-3 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent transition-all duration-200"
                      />
                    </div>
                    <motion.button
                      onClick={handleManualConnect}
                      disabled={isConnecting || !studentId.trim()}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] font-semibold py-3 px-6 rounded-lg hover:from-[#EBC9A4] hover:to-[#FFD59A] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isConnecting ? '連接中...' : '連接學生'}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 錯誤和成功訊息 */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                  <p className="text-red-700">{error}</p>
                </div>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <p className="text-green-700">{success}</p>
                </div>
              </motion.div>
            )}

            {/* 使用說明 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-[#EADBC8]"
            >
              <h2 className="text-xl font-semibold text-[#4B4036] mb-4">使用說明</h2>
              <div className="space-y-2 text-[#2B3A3B]">
                <p>• 如果您沒有學生 ID，請聯繫 {selectedInstitution} 獲取</p>
                <p>• 如果 QR 碼無法掃描，請確保相機權限已開啟</p>
                <p>• 如果學生不屬於選擇的機構，請選擇正確的機構或聯繫機構獲取正確的 ID</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* QR 碼掃描器 */}
      <DirectVideoTest
        isActive={showQRScanner}
        onScanSuccess={handleQRScan}
        onScanError={(error) => setError(error)}
        onClose={() => setShowQRScanner(false)}
      />
    </div>
  );
}