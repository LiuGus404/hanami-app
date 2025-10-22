'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  GiftIcon,
  SparklesIcon,
  XMarkIcon,
  TrophyIcon,
  StarIcon,
  HeartIcon,
  MusicalNoteIcon,
  HomeIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import { useUserPoints } from '@/hooks/useUserPoints';
import { useGachapon } from '@/hooks/useGachapon';
import AppSidebar from '@/components/AppSidebar';

// 獎勵類型定義
interface Reward {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  icon: string;
  probability: number;
}

// 預設獎勵列表
const rewards: Reward[] = [
  {
    id: '1',
    name: '免費試堂券',
    description: '可免費參加一次音樂試堂課程',
    rarity: 'common',
    icon: '🎵',
    probability: 40
  },
  {
    id: '2',
    name: '課程折扣券 9折',
    description: '正式課程可享9折優惠',
    rarity: 'common',
    icon: '🎫',
    probability: 25
  },
  {
    id: '3',
    name: '課程折扣券 8折',
    description: '正式課程可享8折優惠',
    rarity: 'rare',
    icon: '🎫',
    probability: 15
  },
  {
    id: '4',
    name: '專屬音樂禮品包',
    description: '包含音樂小禮物的精美禮品包',
    rarity: 'rare',
    icon: '🎁',
    probability: 10
  },
  {
    id: '5',
    name: 'VIP 一對一指導',
    description: '獲得一次VIP專屬一對一音樂指導',
    rarity: 'epic',
    icon: '👑',
    probability: 7
  },
  {
    id: '6',
    name: '終身課程會員',
    description: '獲得終身免費參加所有課程的特權',
    rarity: 'legendary',
    icon: '🌟',
    probability: 3
  }
];

// 稀有度顏色配置
const rarityColors = {
  common: 'text-gray-600 bg-gray-100',
  rare: 'text-blue-600 bg-blue-100',
  epic: 'text-purple-600 bg-purple-100',
  legendary: 'text-yellow-600 bg-yellow-100'
};

export default function GachaponPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useSaasAuth();
  const { points, loading: pointsLoading, spendPoints, error: pointsError } = useUserPoints();
  const { 
    machines, 
    rewards, 
    userRewards, 
    loading: gachaponLoading, 
    performDraw, 
    error: gachaponError 
  } = useGachapon();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [showMyRewardsModal, setShowMyRewardsModal] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawResult, setDrawResult] = useState<any[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 獲取默認扭蛋機
  const defaultMachine = machines.find(m => m.is_default) || machines[0];
  const singleDrawCost = defaultMachine?.single_draw_cost || 10;
  const tenDrawCost = defaultMachine?.ten_draw_cost || 90;
  const currentPoints = points?.available_points || 0;

  // 確保 rewards 陣列存在
  const safeRewards = rewards || [];

  // 添加錯誤處理
  const loading = authLoading || pointsLoading || gachaponLoading;
  const hasError = pointsError || gachaponError || error;

  if (loading) {
    return (
      <div className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed relative flex items-center justify-center"
           style={{ 
             backgroundImage: 'url(/HanamiMusic/nunu/nunucalssroom.png)',
             backgroundSize: 'cover',
             backgroundPosition: 'center',
             backgroundAttachment: 'fixed'
           }}>
        <div className="text-white text-xl">載入中...</div>
      </div>
    );
  }

  // 檢查是否為資料庫表格不存在的錯誤
  const isDatabaseNotReady = hasError && (
    hasError.includes('relation') || 
    hasError.includes('does not exist') ||
    hasError.includes('PGRST116')
  );

  if (isDatabaseNotReady) {
    return (
      <div className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed relative flex items-center justify-center"
           style={{ 
             backgroundImage: 'url(/HanamiMusic/nunu/nunucalssroom.png)',
             backgroundSize: 'cover',
             backgroundPosition: 'center',
             backgroundAttachment: 'fixed'
           }}>
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 text-center max-w-lg mx-4">
          <div className="w-16 h-16 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center mx-auto mb-4">
            <SparklesIcon className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-[#4B4036] mb-4">扭蛋機系統準備中</h2>
          <p className="text-[#2B3A3B]/70 mb-6">
            扭蛋機系統正在初始化中，請稍後再試。<br/>
            如果問題持續存在，請聯繫管理員。
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              重新整理
            </button>
            <button
              onClick={() => router.back()}
              className="w-full px-6 py-3 bg-white border-2 border-[#EADBC8] text-[#4B4036] rounded-xl font-semibold hover:bg-[#FFF9F2] transition-all duration-300"
            >
              返回上一頁
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed relative flex items-center justify-center"
           style={{ 
             backgroundImage: 'url(/HanamiMusic/nunu/nunucalssroom.png)',
             backgroundSize: 'cover',
             backgroundPosition: 'center',
             backgroundAttachment: 'fixed'
           }}>
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 text-center max-w-md mx-4">
          <h2 className="text-2xl font-bold text-[#4B4036] mb-4">載入錯誤</h2>
          <p className="text-[#2B3A3B]/70 mb-4">{hasError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          >
            重新整理
          </button>
        </div>
      </div>
    );
  }

  // 單抽功能
  const handleSingleDraw = async () => {
    if (!defaultMachine) {
      setError('沒有可用的扭蛋機');
      return;
    }

    if (currentPoints < singleDrawCost) {
      setError('積分不足！');
      return;
    }
    
    setIsDrawing(true);
    setError(null);
    
    try {
      // 先消費積分
      const success = await spendPoints(singleDrawCost, 'gachapon', defaultMachine.id, '單抽扭蛋');
      if (!success) {
        setIsDrawing(false);
        return;
      }
      
      // 模擬抽獎動畫
      setTimeout(async () => {
        try {
          const result = await performDraw(defaultMachine.id, 'single');
          setDrawResult(result);
          setIsDrawing(false);
          setShowResult(true);
        } catch (err) {
          console.error('抽獎失敗:', err);
          setError(err instanceof Error ? err.message : '抽獎失敗');
          setIsDrawing(false);
        }
      }, 2000);
    } catch (err) {
      console.error('單抽失敗:', err);
      setError(err instanceof Error ? err.message : '單抽失敗');
      setIsDrawing(false);
    }
  };

  // 十抽功能
  const handleTenDraw = async () => {
    if (!defaultMachine) {
      setError('沒有可用的扭蛋機');
      return;
    }

    if (currentPoints < tenDrawCost) {
      setError('積分不足！');
      return;
    }
    
    setIsDrawing(true);
    setError(null);
    
    try {
      // 先消費積分
      const success = await spendPoints(tenDrawCost, 'gachapon', defaultMachine.id, '十連抽扭蛋');
      if (!success) {
        setIsDrawing(false);
        return;
      }
      
      // 模擬抽獎動畫
      setTimeout(async () => {
        try {
          const result = await performDraw(defaultMachine.id, 'ten');
          setDrawResult(result);
          setIsDrawing(false);
          setShowResult(true);
        } catch (err) {
          console.error('抽獎失敗:', err);
          setError(err instanceof Error ? err.message : '抽獎失敗');
          setIsDrawing(false);
        }
      }, 3000);
    } catch (err) {
      console.error('十抽失敗:', err);
      setError(err instanceof Error ? err.message : '十抽失敗');
      setIsDrawing(false);
    }
  };

  // 移除舊的抽獎邏輯，現在使用 useGachapon hook 中的 performDraw

  // 關閉結果視窗
  const closeResult = () => {
    setShowResult(false);
    setDrawResult([]);
  };

  try {
    return (
      <div 
        className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed relative"
        style={{ 
          backgroundImage: 'url(/HanamiMusic/nunu/nunucalssroom.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
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
                className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-[#FFD59A]/20 transition-colors"
                title="返回"
              >
                <ArrowLeftIcon className="w-5 h-5 text-[#4B4036]" />
                <span className="text-sm font-medium text-[#4B4036] hidden sm:inline">返回</span>
              </motion.button>
              
              {/* 選單按鈕 */}
              {user && (
                <motion.button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-lg hover:bg-[#FFD59A]/20 transition-colors relative z-40"
                  title="開啟選單"
                >
                  <HomeIcon className="w-6 h-6 text-[#4B4036]" />
                </motion.button>
              )}
              
              <div className="w-10 h-10 relative">
                <img 
                  src="/@hanami.png" 
                  alt="Hanami Music Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#4B4036]">VIP 扭蛋機</h1>
                <p className="text-sm text-[#2B3A3B]">幸運抽獎</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <div className="w-8 h-8 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-[#4B4036]">
                      {user.full_name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                </>
              ) : (
                <motion.button
                  onClick={() => router.push('/aihome/auth/login')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 text-sm bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] rounded-lg font-medium transition-all duration-200"
                >
                  登入
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 主內容區域 */}
      <div className="flex-1 flex">
        {/* 側邊欄選單 */}
        {user && (
          <AppSidebar 
            isOpen={sidebarOpen} 
            onClose={() => setSidebarOpen(false)}
            currentPath="/aihome/gachapon"
          />
        )}

        {/* 主內容 */}
        <div className="flex-1 flex flex-col items-center justify-center min-h-screen relative overflow-hidden">
          {/* 動態背景粒子效果 */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-gradient-to-r from-[#FFD59A]/30 to-[#FFB6C1]/30 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -20, 0],
                  opacity: [0.3, 0.8, 0.3],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full relative z-10">
            
            {/* 積分顯示區域 - 增強動感 */}
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
              className="mb-12 flex justify-center"
            >
              <div className="relative group">
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="bg-gradient-to-r from-white/95 to-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border-2 border-[#FFD59A]/30 relative overflow-hidden"
                >
                  {/* 光澤動畫效果 */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{
                      x: ['-100%', '100%'],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                  
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center space-x-6">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="w-16 h-16 bg-gradient-to-br from-[#FFD59A] via-[#FFB6C1] to-[#EBC9A4] rounded-full flex items-center justify-center shadow-lg"
                      >
                        <SparklesIcon className="w-8 h-8 text-white" />
                      </motion.div>
                      <div>
                        <motion.h2 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                          className="text-3xl font-bold bg-gradient-to-r from-[#4B4036] to-[#2B3A3B] bg-clip-text text-transparent"
                        >
                          我的積分
                        </motion.h2>
                        <motion.p 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.7 }}
                          className="text-[#2B3A3B] text-lg"
                        >
                          可用於扭蛋抽獎
                        </motion.p>
                      </div>
                    </div>
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.9, type: "spring", stiffness: 200 }}
                      className="text-right relative"
                    >
                      <motion.div 
                        animate={{ 
                          textShadow: [
                            "0 0 0px #E74C3C",
                            "0 0 20px #E74C3C",
                            "0 0 0px #E74C3C"
                          ]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-5xl font-bold bg-gradient-to-r from-[#E74C3C] to-[#FF6B6B] bg-clip-text text-transparent"
                      >
                        {currentPoints}
                      </motion.div>
                      <div className="text-sm text-[#2B3A3B] font-medium">積分</div>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* 扭蛋機區域 - 增強動感效果 */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="flex flex-col items-center space-y-16"
            >
              {/* 扭蛋機圖片 - 完美置中 */}
              <div className="flex justify-center items-center">
                <div className="relative w-[500px] h-[500px] flex items-center justify-center">
                  {/* 白色外圈光環 */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 w-full h-full"
                  >
                    <div className="w-full h-full border-4 border-white/30 rounded-full"></div>
                  </motion.div>
                  
                  {/* 扭蛋機主體 - 完美置中 */}
                  <motion.div
                    whileHover={{ scale: 1.1, y: -10 }}
                    animate={isDrawing ? { 
                      rotate: [0, 10, -10, 10, -10, 0],
                      scale: [1, 1.1, 1, 1.1, 1, 1],
                      y: [0, -5, 5, -5, 5, 0]
                    } : {
                      y: [0, -5, 0]
                    }}
                    transition={{ 
                      duration: isDrawing ? 0.8 : 3,
                      repeat: isDrawing ? Infinity : Infinity,
                      ease: "easeInOut"
                    }}
                    className="relative z-10 flex items-center justify-center"
                  >
                    <div className="relative flex items-center justify-center">
                      <img 
                        src="/HanamiMusic/nunu/nunubasic.png" 
                        alt="VIP 扭蛋機" 
                        className="w-[450px] h-[450px] object-contain drop-shadow-2xl"
                      />
                      
                      {/* 多層抽獎光效 */}
                      {isDrawing && (
                        <>
                          <motion.div
                            animate={{ 
                              rotate: 360,
                              scale: [1, 1.2, 1]
                            }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400/60 via-pink-400/60 to-purple-400/60 animate-pulse"
                          />
                          <motion.div
                            animate={{ 
                              rotate: -360,
                              scale: [1.2, 1, 1.2]
                            }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="absolute inset-4 rounded-full bg-gradient-to-r from-blue-400/40 via-green-400/40 to-red-400/40 animate-pulse"
                          />
                        </>
                      )}
                    </div>
                  </motion.div>
                  
                  {/* 白色閃爍星星裝飾 - 圍繞圓框分佈 */}
                  {[...Array(12)].map((_, i) => {
                    const angle = (i * 30) * (Math.PI / 180); // 每30度一個星星
                    const radius = 240; // 圓框半徑
                    const x = 250 + radius * Math.cos(angle); // 圓心x + 半徑 * cos(角度)
                    const y = 250 + radius * Math.sin(angle); // 圓心y + 半徑 * sin(角度)
                    
                    return (
                      <motion.div
                        key={i}
                        className="absolute w-3 h-3 bg-white/80 rounded-full"
                        style={{
                          left: `${x}px`,
                          top: `${y}px`,
                          transform: 'translate(-50%, -50%)', // 讓星星以其中心定位
                        }}
                        animate={{
                          scale: [0, 1, 0],
                          opacity: [0, 1, 0],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: i * 0.2,
                        }}
                      />
                    );
                  })}
                </div>
              </div>
              
              
              {/* 抽獎按鈕區域 - 超級美觀設計 */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.9 }}
                className="w-full max-w-4xl"
              >
                <div className="relative">
                  {/* 背景裝飾 - 移除白色底色 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-transparent backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-[#FFD59A]/20"></div>
                  
                  <div className="relative z-10 p-10">
                    {/* 參考樣式的抽獎按鈕 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      {/* 單抽按鈕 - 參考樣式 */}
                      <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="relative"
                      >
                        <motion.button
                          onClick={handleSingleDraw}
                          disabled={currentPoints < singleDrawCost || isDrawing}
                          whileHover={{ 
                            scale: currentPoints >= singleDrawCost && !isDrawing ? 1.02 : 1, 
                            y: currentPoints >= singleDrawCost && !isDrawing ? -2 : 0
                          }}
                          whileTap={{ scale: currentPoints >= singleDrawCost && !isDrawing ? 0.98 : 1 }}
                          className={`
                            w-full h-24 relative overflow-hidden rounded-xl transition-all duration-300 border-2
                            ${currentPoints >= singleDrawCost && !isDrawing
                              ? 'bg-white border-[#FFD59A] shadow-lg hover:shadow-xl'
                              : 'bg-gray-200 border-gray-300 cursor-not-allowed'
                            }
                          `}
                        >
                          <div className="relative z-10 flex items-center justify-between h-full px-6">
                            {/* 左側圖標區域 */}
                            <div className="flex items-center space-x-4">
                              <div className="relative">
                                <GiftIcon className={`w-10 h-10 ${currentPoints >= singleDrawCost && !isDrawing ? 'text-[#FFD59A]' : 'text-gray-400'}`} />
                                {currentPoints >= singleDrawCost && !isDrawing && (
                                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                                )}
                              </div>
                              <div className="text-left">
                                <div className={`text-xs font-normal ${currentPoints >= singleDrawCost && !isDrawing ? 'text-[#2B3A3B]/70' : 'text-gray-400'}`}>
                                  消耗
                                </div>
                                <div className={`text-xl font-bold ${currentPoints >= singleDrawCost && !isDrawing ? 'text-[#E74C3C]' : 'text-gray-400'}`}>
                                  {singleDrawCost}積分
                                </div>
                                <div className={`text-base font-semibold ${currentPoints >= singleDrawCost && !isDrawing ? 'text-[#4B4036]' : 'text-gray-400'}`}>
                                  抽獎
                                  <span className={`text-lg font-bold ${currentPoints >= singleDrawCost && !isDrawing ? 'text-[#E74C3C]' : 'text-gray-400'}`}>一次</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* 右側裝飾 */}
                            {currentPoints >= singleDrawCost && !isDrawing && (
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-[#FFD59A] rounded-full animate-pulse"></div>
                                <div className="w-1 h-1 bg-[#EBC9A4] rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                                <div className="w-2 h-2 bg-[#FFD59A] rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                              </div>
                            )}
                          </div>
                        </motion.button>
                      </motion.div>

                      {/* 十抽按鈕 - 參考樣式 */}
                      <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="relative"
                      >
                        <motion.button
                          onClick={handleTenDraw}
                          disabled={currentPoints < tenDrawCost || isDrawing}
                          whileHover={{ 
                            scale: currentPoints >= tenDrawCost && !isDrawing ? 1.02 : 1, 
                            y: currentPoints >= tenDrawCost && !isDrawing ? -2 : 0
                          }}
                          whileTap={{ scale: currentPoints >= tenDrawCost && !isDrawing ? 0.98 : 1 }}
                          className={`
                            w-full h-24 relative overflow-hidden rounded-xl transition-all duration-300 border-2
                            ${currentPoints >= tenDrawCost && !isDrawing
                              ? 'bg-white border-[#FFB6C1] shadow-lg hover:shadow-xl'
                              : 'bg-gray-200 border-gray-300 cursor-not-allowed'
                            }
                          `}
                        >
                          <div className="relative z-10 flex items-center justify-between h-full px-6">
                            {/* 左側圖標區域 */}
                            <div className="flex items-center space-x-4">
                              <div className="relative">
                                <SparklesIcon className={`w-10 h-10 ${currentPoints >= tenDrawCost && !isDrawing ? 'text-[#FFB6C1]' : 'text-gray-400'}`} />
                                {currentPoints >= tenDrawCost && !isDrawing && (
                                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-pink-400 rounded-full animate-pulse"></div>
                                )}
                              </div>
                              <div className="text-left">
                                <div className={`text-xs font-normal ${currentPoints >= tenDrawCost && !isDrawing ? 'text-[#2B3A3B]/70' : 'text-gray-400'}`}>
                                  消耗
                                </div>
                                <div className={`text-xl font-bold ${currentPoints >= tenDrawCost && !isDrawing ? 'text-[#E74C3C]' : 'text-gray-400'}`}>
                                  100積分
                                </div>
                                <div className={`text-base font-semibold ${currentPoints >= tenDrawCost && !isDrawing ? 'text-[#4B4036]' : 'text-gray-400'}`}>
                                  抽
                                  <span className={`text-2xl font-bold ${currentPoints >= tenDrawCost && !isDrawing ? 'text-[#E74C3C]' : 'text-gray-400'}`}>10</span>
                                  <span className={`text-lg font-bold ${currentPoints >= tenDrawCost && !isDrawing ? 'text-[#27AE60]' : 'text-gray-400'}`}>+1</span>
                                  次
                                </div>
                              </div>
                            </div>
                            
                            {/* 右側裝飾和9折標籤 */}
                            <div className="flex items-center space-x-3">
                              {currentPoints >= tenDrawCost && !isDrawing && (
                                <>
                                  <div className="flex items-center space-x-1">
                                    <div className="w-2 h-2 bg-[#FFB6C1] rounded-full animate-pulse"></div>
                                    <div className="w-1 h-1 bg-[#FFD59A] rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                                    <div className="w-2 h-2 bg-[#FFB6C1] rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                                  </div>
                                  <motion.div
                                    animate={{ scale: [1, 1.05, 1] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                    className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black text-xs font-bold px-2 py-1 rounded-full shadow-sm"
                                  >
                                    9折
                                  </motion.div>
                                </>
                              )}
                            </div>
                          </div>
                        </motion.button>
                      </motion.div>
                    </div>

                    {/* 按鍵區域 - 兩個按鍵並排 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* 獎勵一覽按鈕 */}
                      <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="relative"
                      >
                        <motion.button
                          onClick={() => setShowRewardModal(true)}
                          whileHover={{ 
                            scale: 1.02, 
                            y: -2
                          }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full h-24 relative overflow-hidden rounded-xl transition-all duration-300 border-2 bg-white border-[#EBC9A4] shadow-lg hover:shadow-xl"
                        >
                          <div className="relative z-10 flex items-center justify-between h-full px-6">
                            {/* 左側圖標區域 */}
                            <div className="flex items-center space-x-4">
                              <div className="relative">
                                <TrophyIcon className="w-10 h-10 text-[#EBC9A4]" />
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                              </div>
                              <div className="text-left">
                                <div className="text-xs font-normal text-[#2B3A3B]/70">
                                  查看
                                </div>
                                <div className="text-xl font-bold text-[#E74C3C]">
                                  所有獎勵
                                </div>
                                <div className="text-base font-semibold text-[#4B4036]">
                                  獎勵一覽
                                </div>
                              </div>
                            </div>
                            
                            {/* 右側裝飾 */}
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-[#EBC9A4] rounded-full animate-pulse"></div>
                              <div className="w-1 h-1 bg-[#FFD59A] rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                              <div className="w-2 h-2 bg-[#EBC9A4] rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                            </div>
                          </div>
                        </motion.button>
                      </motion.div>

                      {/* 我的獎勵按鈕 */}
                      <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.8 }}
                        className="relative"
                      >
                        <motion.button
                          onClick={() => setShowMyRewardsModal(true)}
                          whileHover={{ 
                            scale: 1.02, 
                            y: -2
                          }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full h-24 relative overflow-hidden rounded-xl transition-all duration-300 border-2 bg-white border-[#FFB6C1] shadow-lg hover:shadow-xl"
                        >
                          <div className="relative z-10 flex items-center justify-between h-full px-6">
                            {/* 左側圖標區域 */}
                            <div className="flex items-center space-x-4">
                              <div className="relative">
                                <GiftIcon className="w-10 h-10 text-[#FFB6C1]" />
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-pink-400 rounded-full animate-pulse"></div>
                                {/* 如果有獎勵，顯示數量徽章 */}
                                {userRewards && userRewards.length > 0 && (
                                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                    {userRewards.length}
                                  </div>
                                )}
                              </div>
                              <div className="text-left">
                                <div className="text-xs font-normal text-[#2B3A3B]/70">
                                  查看
                                </div>
                                <div className="text-xl font-bold text-[#E74C3C]">
                                  我的獎勵
                                </div>
                                <div className="text-base font-semibold text-[#4B4036]">
                                  已獲得
                                </div>
                              </div>
                            </div>
                            
                            {/* 右側裝飾 */}
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-[#FFB6C1] rounded-full animate-pulse"></div>
                              <div className="w-1 h-1 bg-[#FFD59A] rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                              <div className="w-2 h-2 bg-[#FFB6C1] rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                            </div>
                          </div>
                        </motion.button>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* 獎勵一覽彈窗 - 美化設計 */}
      <AnimatePresence>
        {showRewardModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
            onClick={() => setShowRewardModal(false)}
          >
            {/* 背景粒子效果 */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(15)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-gradient-to-r from-[#FFD59A]/40 to-[#FFB6C1]/40 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    y: [0, -30, 0],
                    opacity: [0.2, 0.8, 0.2],
                    scale: [0.5, 1.5, 0.5],
                  }}
                  transition={{
                    duration: 4 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 3,
                  }}
                />
              ))}
            </div>

            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-[#FFD59A]/30 max-w-5xl w-full max-h-[85vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 頂部光澤動畫 */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />

              {/* 標題區域 */}
              <div className="relative z-10 p-6 border-b border-[#EADBC8]/30">
                <div className="flex items-center justify-between">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center space-x-3"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                      className="w-12 h-12 bg-gradient-to-br from-[#FFD59A] via-[#FFB6C1] to-[#EBC9A4] rounded-full flex items-center justify-center shadow-lg"
                    >
                      <TrophyIcon className="w-6 h-6 text-white" />
                    </motion.div>
                    <div>
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-[#4B4036] to-[#2B3A3B] bg-clip-text text-transparent">
                        獎勵一覽
                      </h2>
                      <p className="text-[#2B3A3B]/70 text-sm">所有可能獲得的精美獎品</p>
                    </div>
                  </motion.div>
                  
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    onClick={() => setShowRewardModal(false)}
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-10 h-10 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <XMarkIcon className="w-5 h-5 text-white" />
                  </motion.button>
                </div>
              </div>

              {/* 獎勵卡片區域 */}
              <div className="relative z-10 p-6 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {safeRewards && safeRewards.length > 0 ? safeRewards.map((reward, index) => (
                    <motion.div
                      key={reward.id}
                      initial={{ opacity: 0, y: 30, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ 
                        delay: index * 0.1,
                        type: "spring",
                        stiffness: 200,
                        damping: 20
                      }}
                      whileHover={{ 
                        scale: 1.05, 
                        y: -5,
                        boxShadow: '0 20px 40px rgba(255,213,154,0.3)'
                      }}
                      className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                        reward.rarity === 'common' ? 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200' :
                        reward.rarity === 'rare' ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300' :
                        reward.rarity === 'epic' ? 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300' :
                        'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-300'
                      }`}
                    >
                      {/* 卡片光澤效果 */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        animate={{
                          x: ['-100%', '100%'],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />

                      {/* 稀有度標籤 */}
                      <div className="absolute top-3 right-3">
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className={`px-2 py-1 rounded-full text-xs font-bold ${
                            reward.rarity === 'common' ? 'bg-gray-200 text-gray-700' :
                            reward.rarity === 'rare' ? 'bg-blue-200 text-blue-700' :
                            reward.rarity === 'epic' ? 'bg-purple-200 text-purple-700' :
                            'bg-yellow-200 text-yellow-700'
                          }`}
                        >
                          {reward.rarity === 'common' ? '一般' :
                           reward.rarity === 'rare' ? '稀有' :
                           reward.rarity === 'epic' ? '史詩' : '傳說'}
                        </motion.div>
                      </div>

                      <div className="relative z-10 p-6 text-center">
                        <motion.div
                          animate={{ 
                            rotate: [0, 10, -10, 0],
                            scale: [1, 1.1, 1]
                          }}
                          transition={{ 
                            duration: 3, 
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                          className="text-5xl mb-4"
                        >
                          {reward.icon_emoji || '🎁'}
                        </motion.div>
                        
                        <h3 className="font-bold text-lg mb-2 text-[#4B4036]">
                          {reward.reward_name}
                        </h3>
                        
                        <p className="text-sm text-[#2B3A3B]/80 mb-4 leading-relaxed">
                          {reward.reward_description || '精美獎品'}
                        </p>
                        
                        <div className="flex items-center justify-center space-x-2">
                          <div className={`text-sm font-bold ${
                            reward.rarity === 'common' ? 'text-gray-600' :
                            reward.rarity === 'rare' ? 'text-blue-600' :
                            reward.rarity === 'epic' ? 'text-purple-600' :
                            'text-yellow-600'
                          }`}>
                            稀有度
                          </div>
                          <div className={`text-lg font-bold ${
                            reward.rarity === 'common' ? 'text-gray-700' :
                            reward.rarity === 'rare' ? 'text-blue-700' :
                            reward.rarity === 'epic' ? 'text-purple-700' :
                            'text-yellow-700'
                          }`}>
                            {reward.rarity === 'common' ? '一般' :
                             reward.rarity === 'rare' ? '稀有' :
                             reward.rarity === 'epic' ? '史詩' : '傳說'}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )) : (
                    <div className="col-span-full text-center py-8">
                      <p className="text-[#2B3A3B]/70">暫無獎勵資料</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 底部稀有度說明 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="relative z-10 p-6 border-t border-[#EADBC8]/30 bg-gradient-to-r from-[#FFF9F2] to-[#FFD59A]/10"
              >
                <div className="text-center">
                  <h3 className="font-bold text-lg text-[#4B4036] mb-4 flex items-center justify-center">
                    <SparklesIcon className="w-5 h-5 mr-2 text-[#FFD59A]" />
                    稀有度說明
                    <SparklesIcon className="w-5 h-5 ml-2 text-[#FFD59A]" />
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { name: '一般', color: 'text-gray-600', bg: 'bg-gray-100', percent: '40%' },
                      { name: '稀有', color: 'text-blue-600', bg: 'bg-blue-100', percent: '25%' },
                      { name: '史詩', color: 'text-purple-600', bg: 'bg-purple-100', percent: '15%' },
                      { name: '傳說', color: 'text-yellow-600', bg: 'bg-yellow-100', percent: '3%' }
                    ].map((rarity, index) => (
                      <motion.div
                        key={rarity.name}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                        whileHover={{ scale: 1.05 }}
                        className={`${rarity.bg} rounded-xl p-3 border-2 border-white/50`}
                      >
                        <div className={`font-bold ${rarity.color}`}>{rarity.name}</div>
                        <div className="text-sm font-medium">{rarity.percent}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 抽獎結果彈窗 - 全新美化設計 */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"
            onClick={closeResult}
          >
            {/* 背景慶祝粒子效果 */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-gradient-to-r from-[#FFD59A] via-[#FFB6C1] to-[#EBC9A4] rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    y: [0, -100, 0],
                    opacity: [0, 1, 0],
                    scale: [0.5, 1.5, 0.5],
                    rotate: [0, 360, 0],
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}
            </div>

            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.7, opacity: 0, y: 50 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-[#FFD59A]/30 max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 頂部光澤動畫 */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />

              {/* 標題區域 */}
              <div className="relative z-10 p-6 border-b border-[#EADBC8]/30">
                <div className="flex items-center justify-between">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center space-x-3"
                  >
                    <motion.div
                      animate={{ 
                        rotate: [0, 360],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="w-12 h-12 bg-gradient-to-br from-[#FFD59A] via-[#FFB6C1] to-[#EBC9A4] rounded-full flex items-center justify-center shadow-lg"
                    >
                      <GiftIcon className="w-6 h-6 text-white" />
                    </motion.div>
                    <div>
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-[#4B4036] to-[#2B3A3B] bg-clip-text text-transparent">
                        抽獎結果
                      </h2>
                      <p className="text-[#2B3A3B]/70 text-sm">恭喜您獲得以下獎勵！</p>
                    </div>
                  </motion.div>
                  
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    onClick={closeResult}
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-10 h-10 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <XMarkIcon className="w-5 h-5 text-white" />
                  </motion.button>
                </div>
              </div>

              {/* 獎勵展示區域 */}
              <div className="relative z-10 p-6 flex-1 overflow-y-auto overscroll-contain scroll-smooth"
                   style={{ WebkitOverflowScrolling: 'touch' }}>
                <div className="space-y-6">
                  {drawResult.map((reward, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 30, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ 
                        delay: index * 0.3,
                        type: "spring",
                        stiffness: 200,
                        damping: 20
                      }}
                      whileHover={{ 
                        scale: 1.02, 
                        y: -5,
                        boxShadow: '0 20px 40px rgba(255,213,154,0.3)'
                      }}
                      className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                        reward.reward?.rarity === 'common' ? 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200' :
                        reward.reward?.rarity === 'rare' ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300' :
                        reward.reward?.rarity === 'epic' ? 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300' :
                        'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-300'
                      }`}
                    >
                      {/* 卡片光澤效果 */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                        animate={{
                          x: ['-100%', '100%'],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />

                      {/* 稀有度標籤 */}
                      <div className="absolute top-4 right-4">
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className={`px-3 py-1 rounded-full text-sm font-bold ${
                            reward.reward?.rarity === 'common' ? 'bg-gray-200 text-gray-700' :
                            reward.reward?.rarity === 'rare' ? 'bg-blue-200 text-blue-700' :
                            reward.reward?.rarity === 'epic' ? 'bg-purple-200 text-purple-700' :
                            'bg-yellow-200 text-yellow-700'
                          }`}
                        >
                          {reward.reward?.rarity === 'common' ? '一般' :
                           reward.reward?.rarity === 'rare' ? '稀有' :
                           reward.reward?.rarity === 'epic' ? '史詩' : '傳說'}
                        </motion.div>
                      </div>

                      <div className="relative z-10 p-6">
                        <div className="flex items-center space-x-6">
                          {/* 獎勵圖標 */}
                          <motion.div
                            animate={{ 
                              rotate: [0, 10, -10, 0],
                              scale: [1, 1.1, 1]
                            }}
                            transition={{ 
                              duration: 3, 
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                            className="text-6xl"
                          >
                            {reward.reward?.icon_emoji || '🎁'}
                          </motion.div>
                          
                          {/* 獎勵資訊 */}
                          <div className="flex-1">
                            <h3 className="font-bold text-2xl mb-2 text-[#4B4036]">
                              {reward.reward?.reward_name || '神秘獎品'}
                            </h3>
                            <p className="text-[#2B3A3B]/80 mb-4 leading-relaxed">
                              {reward.reward?.reward_description || '恭喜獲得精美獎品！'}
                            </p>
                            
                            {/* 獲得提示 */}
                            <motion.div
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.5 + index * 0.2 }}
                              className="flex items-center space-x-2"
                            >
                              <SparklesIcon className="w-5 h-5 text-[#FFD59A]" />
                              <span className="text-sm font-medium text-[#2B3A3B]/70">
                                恭喜獲得此獎勵！
                              </span>
                            </motion.div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* 底部按鈕區域 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="relative z-10 p-6 border-t border-[#EADBC8]/30 bg-gradient-to-r from-[#FFF9F2] to-[#FFD59A]/10"
              >
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <motion.button
                    onClick={closeResult}
                    whileHover={{ 
                      scale: 1.05, 
                      y: -3,
                      boxShadow: '0 20px 40px rgba(255,213,154,0.4)'
                    }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 sm:flex-none px-8 py-4 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <GiftIcon className="w-5 h-5" />
                      <span>繼續抽獎</span>
                    </div>
                  </motion.button>
                  
                  <motion.button
                    onClick={closeResult}
                    whileHover={{ 
                      scale: 1.05, 
                      y: -3,
                      boxShadow: '0 20px 40px rgba(235,201,164,0.4)'
                    }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 sm:flex-none px-8 py-4 bg-gradient-to-r from-[#EBC9A4] to-[#FFB6C1] text-[#4B4036] rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <HomeIcon className="w-5 h-5" />
                      <span>返回首頁</span>
                    </div>
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 我的獎勵彈窗 */}
      <AnimatePresence>
        {showMyRewardsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
            onClick={() => setShowMyRewardsModal(false)}
          >
            {/* 背景粒子效果 */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-[#FFB6C1] rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    y: [0, -20, 0],
                    opacity: [0.3, 1, 0.3],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}
            </div>

            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-[#FFB6C1]/30 max-w-4xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 發光邊框效果 */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#FFB6C1]/20 via-[#FFD59A]/20 to-[#FFB6C1]/20 rounded-3xl blur-sm"></div>
              
              <div className="relative z-10">
                {/* 標題區域 */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center justify-between p-6 border-b border-[#FFB6C1]/20"
                >
                  <div className="flex items-center space-x-4">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="p-3 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] rounded-full shadow-lg"
                    >
                      <GiftIcon className="w-8 h-8 text-white" />
                    </motion.div>
                    <div>
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-[#4B4036] to-[#2B3A3B] bg-clip-text text-transparent">
                        我的獎勵
                      </h2>
                      <p className="text-[#2B3A3B]/70 text-sm">您已獲得的精美獎品</p>
                    </div>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowMyRewardsModal(false)}
                    className="p-2 hover:bg-[#FFB6C1]/20 rounded-full transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6 text-[#4B4036]" />
                  </motion.button>
                </motion.div>

                {/* 內容區域 */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                  {userRewards && userRewards.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {userRewards.map((userReward, index) => (
                        <motion.div
                          key={userReward.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="relative bg-gradient-to-br from-white to-[#FFF9F2] rounded-2xl p-6 border-2 border-[#FFB6C1]/30 shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                          {/* 稀有度指示器 */}
                          <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold ${
                            userReward.reward.rarity === 'legendary' ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' :
                            userReward.reward.rarity === 'epic' ? 'bg-gradient-to-r from-purple-400 to-pink-500 text-white' :
                            userReward.reward.rarity === 'rare' ? 'bg-gradient-to-r from-blue-400 to-cyan-500 text-white' :
                            'bg-gradient-to-r from-green-400 to-emerald-500 text-white'
                          }`}>
                            {userReward.reward.rarity === 'legendary' ? '傳說' :
                             userReward.reward.rarity === 'epic' ? '史詩' :
                             userReward.reward.rarity === 'rare' ? '稀有' : '普通'}
                          </div>

                          {/* 獎勵圖標 */}
                          <div className="flex items-center space-x-4 mb-4">
                            <div className="text-4xl">
                              {userReward.reward.icon_emoji || '🎁'}
                            </div>
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-[#4B4036] mb-1">
                                {userReward.reward.reward_name}
                              </h3>
                              <p className="text-[#2B3A3B]/70 text-sm">
                                {userReward.reward.reward_description}
                              </p>
                            </div>
                          </div>

                          {/* 狀態信息 */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-[#2B3A3B]/70">狀態:</span>
                              <span className={`font-semibold ${
                                userReward.status === 'active' ? 'text-green-600' :
                                userReward.status === 'used' ? 'text-blue-600' :
                                userReward.status === 'expired' ? 'text-red-600' :
                                'text-gray-600'
                              }`}>
                                {userReward.status === 'active' ? '可使用' :
                                 userReward.status === 'used' ? '已使用' :
                                 userReward.status === 'expired' ? '已過期' :
                                 '已取消'}
                              </span>
                            </div>
                            
                            {userReward.expires_at && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-[#2B3A3B]/70">有效期至:</span>
                                <span className="text-[#4B4036]">
                                  {new Date(userReward.expires_at).toLocaleDateString('zh-TW')}
                                </span>
                              </div>
                            )}

                            <div className="flex items-center justify-between text-sm">
                              <span className="text-[#2B3A3B]/70">獲得時間:</span>
                              <span className="text-[#4B4036]">
                                {new Date(userReward.obtained_at).toLocaleDateString('zh-TW')}
                              </span>
                            </div>
                          </div>

                          {/* 使用按鈕 */}
                          {userReward.status === 'active' && (
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => {
                                // 這裡可以添加使用獎勵的邏輯
                                console.log('使用獎勵:', userReward.id);
                              }}
                              className="w-full mt-4 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white font-bold py-2 px-4 rounded-xl hover:shadow-lg transition-all duration-300"
                            >
                              使用獎勵
                            </motion.button>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-center py-12"
                    >
                      <div className="text-6xl mb-4">🎁</div>
                      <h3 className="text-2xl font-bold text-[#4B4036] mb-2">還沒有獎勵</h3>
                      <p className="text-[#2B3A3B]/70 mb-6">快去抽獎獲得精美獎品吧！</p>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setShowMyRewardsModal(false);
                          // 可以滾動到抽獎按鈕
                        }}
                        className="bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white font-bold py-3 px-8 rounded-xl hover:shadow-lg transition-all duration-300"
                      >
                        立即抽獎
                      </motion.button>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
  } catch (error) {
    console.error('GachaponPage 渲染錯誤:', error);
    return (
      <div className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed relative flex items-center justify-center"
           style={{ 
             backgroundImage: 'url(/HanamiMusic/nunu/nunucalssroom.png)',
             backgroundSize: 'cover',
             backgroundPosition: 'center',
             backgroundAttachment: 'fixed'
           }}>
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-[#4B4036] mb-4">載入錯誤</h2>
          <p className="text-[#2B3A3B]/70 mb-4">頁面載入時發生錯誤，請重新整理頁面</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          >
            重新整理
          </button>
        </div>
      </div>
    );
  }
}
