'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  CheckIcon,
  SparklesIcon,
  CpuChipIcon,
  CubeTransparentIcon,
  UserGroupIcon,
  ChevronDownIcon,
  ArrowLeftIcon,
  RocketLaunchIcon,
  StarIcon,
  ArrowRightIcon,
  HandThumbUpIcon,
  InformationCircleIcon,
  CreditCardIcon,
  Bars3Icon,
  BuildingLibraryIcon,
  IdentificationIcon,
  AcademicCapIcon,
  PaintBrushIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { Sparkles, Utensils } from 'lucide-react';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import { toast } from 'react-hot-toast';
import { createAirwallexPayment } from '@/lib/paymentUtils';
import SimplePromoCodeInput from '@/components/payment/SimplePromoCodeInput';
import { SimpleDiscountInfo } from '@/types/simple-promo-codes';
import AppSidebar from '@/components/AppSidebar';
import Image from 'next/image';
import UnifiedRightContent from '@/components/UnifiedRightContent';
import FoodBalanceButton from '@/components/aihome/FoodBalanceButton';

// Plan Definitions
const PLANS = [
  {
    id: 'starter',
    name: 'Starter 輕量版',
    badge: '入門首選',
    price: 138,
    l1_mode: '無限任用 (日常助手隨時待命)',
    credits: 500,
    capacity: [
      '125 次 思考模式',
      '或 25 次 深度專案'
    ],
    features: [
      '基礎 AI 角色',
      '預設思維積木'
    ],
    color: 'from-blue-100 to-blue-50',
    btnColor: 'bg-[#C6DBF0] text-blue-900 hover:bg-[#B5D0E8]',
    shadow: 'shadow-blue-200'
  },
  {
    id: 'plus',
    name: 'Plus 進階版',
    badge: '最受歡迎',
    badgeIcon: StarIcon,
    price: 288,
    l1_mode: '無限任用 (較快回應速度)',
    credits: 2000,
    capacity: [
      '500 次 思考模式',
      '或 100 次 深度專案'
    ],
    features: [
      '進階角色與積木',
      '支援長文檔分析'
    ],
    color: 'from-amber-100 to-orange-50',
    btnColor: 'bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] hover:from-[#EBC9A4] hover:to-[#FFD59A]',
    shadow: 'shadow-orange-200',
    isPopular: true
  },
  {
    id: 'pro',
    name: 'Pro 專業版',
    badge: '極致效能',
    price: 688,
    l1_mode: '無限任用 (優先 VIP 通道)',
    credits: 6000,
    capacity: [
      '1,500 次 思考模式',
      '或 300 次 深度專案'
    ],
    features: [
      'Pro 級專業角色包',
      '優先試用新功能'
    ],
    color: 'from-purple-100 to-pink-50',
    btnColor: 'bg-[#E5D4EF] text-purple-900 hover:bg-[#DBC3E8]',
    shadow: 'shadow-purple-200'
  }
];

// Credit Top-up Packages
const CREDIT_PACKAGES = [
  {
    id: 'credit_light',
    name: '輕量補給 (250 食量)',
    title: '輕量補給',
    original: 88,
    price: 68,
    credits: 250,
    unitPrice: 0.27,
    color: 'from-green-100 to-emerald-50',
    btnColor: 'bg-gradient-to-r from-[#4AAE8C] to-[#3A9D7B] text-white shadow-green-200', // Greenish
    isOneTime: true
  },
  {
    id: 'credit_medium',
    name: '中度補給 (750 食量)',
    title: '中度補給',
    original: 218,
    price: 168,
    credits: 750,
    unitPrice: 0.22,
    color: 'from-amber-100 to-yellow-50',
    btnColor: 'bg-gradient-to-r from-[#E6B325] to-[#D4A017] text-white shadow-amber-200', // Gold/Amber
    isOneTime: true
  },
  {
    id: 'credit_heavy',
    name: '重量補給 (1,300 食量)',
    title: '重量補給',
    original: 348,
    price: 268,
    credits: 1300,
    unitPrice: 0.20,
    color: 'from-indigo-100 to-blue-50',
    btnColor: 'bg-gradient-to-r from-[#6366F1] to-[#4F46E5] text-white shadow-indigo-200', // Indigo
    isOneTime: true
  }
];

// FAQ Data
const FAQS = [
  {
    q: "Q1：咩係「食量（Credits）」？會唔會好複雜？",
    a: (
      <div className="space-y-2">
        A1：你可以將食量想像成「深度任務點數」。
        <div className="flex items-start gap-2">
          <span className="mt-1 flex-shrink-0 w-1 h-1 rounded-full bg-[#D48347]" />
          <span>日常問答、改文、翻譯（L1 自動模式）<ArrowRightIcon className="inline w-3 h-3 mx-1 text-[#D48347]" /> 付費無限用 (免費版: 3 食量/次)</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="mt-1 flex-shrink-0 w-1 h-1 rounded-full bg-[#D48347]" />
          <span>比較深的分析、寫有結構內容（L2 思考模式）<ArrowRightIcon className="inline w-3 h-3 mx-1 text-[#D48347]" /> 用少量食量</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="mt-1 flex-shrink-0 w-1 h-1 rounded-full bg-[#D48347]" />
          <span>整大專案、長文研究（L3 深度推理）<ArrowRightIcon className="inline w-3 h-3 mx-1 text-[#D48347]" /> 用多啲食量</span>
        </div>
        <div>你唔需要理解技術細節，只要知道：用越「重」的任務，先會扣食量。</div>
      </div>
    )
  },
  {
    q: "Q2：月費已經包咗啲咩？會唔會仲有隱藏收費？",
    a: (
      <div className="space-y-2">
        A2：月費已經包含：
        <div className="flex items-start gap-2">
          <span className="mt-1 flex-shrink-0 w-1 h-1 rounded-full bg-[#D48347]" />
          <span>L1 自動模式：∞ 無限使用</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="mt-1 flex-shrink-0 w-1 h-1 rounded-full bg-[#D48347]" />
          <span>每月固定食量：用於 L2 / L3 進階任務</span>
        </div>
        <div>系統唔會自動亂幫你加購，所有加購都需要你親手確認，費用一目了然，沒有「暗扣」。</div>
      </div>
    )
  },
  {
    q: "Q3：如果食量用晒，仲可唔可以用？",
    a: (
      <div className="space-y-2">
        <div className="flex items-center gap-1">A3：可以 <HandThumbUpIcon className="w-4 h-4 text-[#D48347]" /></div>
        <div className="flex items-start gap-2">
          <span className="mt-1 flex-shrink-0 w-1 h-1 rounded-full bg-[#D48347]" />
          <span>L1 自動模式：付費用戶照常無限用 (免費版需扣食量)</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="mt-1 flex-shrink-0 w-1 h-1 rounded-full bg-[#D48347]" />
          <span>只係 L2 / L3 模式會暫停扣不到食量</span>
        </div>
        <div>如果你當月有大量專案，可以手動加購食量，或者等下個月更新額度再用。</div>
      </div>
    )
  },
  {
    q: "Q4：三種模式（L1 / L2 / L3）我需要自己揀嗎？",
    a: (
      <div className="space-y-2">
        A4：你可以手動揀模式，但多數情況只要：
        <div className="flex items-start gap-2">
          <span className="mt-1 flex-shrink-0 w-1 h-1 rounded-full bg-[#D48347]" />
          <span>正常同 AI 傾偈、改文、寫短內容 <ArrowRightIcon className="inline w-3 h-3 mx-1 text-[#D48347]" /> 用 L1</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="mt-1 flex-shrink-0 w-1 h-1 rounded-full bg-[#D48347]" />
          <span>要總結、分析、幫你整理大量重點 <ArrowRightIcon className="inline w-3 h-3 mx-1 text-[#D48347]" /> 揀 L2</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="mt-1 flex-shrink-0 w-1 h-1 rounded-full bg-[#D48347]" />
          <span>要完成「一大件事」例如整份教案、商業計劃、研究報告 <ArrowRightIcon className="inline w-3 h-3 mx-1 text-[#D48347]" /> 揀 L3</span>
        </div>
        <div>之後我們亦會提供「一鍵推薦模式」，系統會按你嘅任務幫你建議用 L1 / L2 / L3。</div>
      </div>
    )
  },
  {
    q: "Q5：我唔識寫 prompt，會唔會好難用？",
    a: (
      <div className="space-y-2">
        A5：唔會，因為你主要係同「思維積木」合作，而唔係同 prompt 打交道。
        <br />例如：「幫我整理會議紀錄 <ArrowRightIcon className="inline w-3 h-3 mx-1" /> 變成重點＋待辦」
        <br />你只需要諗 「我而家想做咩類型嘅任務」，然後揀對應嘅思維積木，由積木幫你同 AI 講清楚 prompt。
      </div>
    )
  },
  {
    q: "Q6：可以多人共用嗎？適合團隊或機構？",
    a: (
      <div className="space-y-2">
        A6：可以按需要升級至較高級方案，
        <div className="flex items-start gap-2">
          <span className="mt-1 flex-shrink-0 w-1 h-1 rounded-full bg-[#D48347]" />
          <span>個人：Starter / Plus 已經足夠日常工作＋副業創作</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="mt-1 flex-shrink-0 w-1 h-1 rounded-full bg-[#D48347]" />
          <span>小型團隊 / 補習社 / 機構：建議由 Plus / Pro 開始</span>
        </div>
      </div>
    )
  },
  {
    q: "Q7：取消訂閱會點？我仲可唔可以攞返啲資料？",
    a: (
      <div className="space-y-2">
        A7：你隨時可以取消下個月續費。
        <div className="flex items-start gap-2">
          <span className="mt-1 flex-shrink-0 w-1 h-1 rounded-full bg-[#D48347]" />
          <span>已經產生的內容、檔案、對話記錄 <ArrowRightIcon className="inline w-3 h-3 mx-1 text-[#D48347]" /> 你仍然可以下載 / 保存</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="mt-1 flex-shrink-0 w-1 h-1 rounded-full bg-[#D48347]" />
          <span>之後如果想回來用，隨時可以再訂閱，無需重新開帳號。</span>
        </div>
      </div>
    )
  },
  {
    q: "Q8：我的資料會唔會用嚟訓練模型？安全嗎？",
    a: (
      <div className="space-y-2">
        A8：
        <div className="flex items-start gap-2">
          <span className="mt-1 flex-shrink-0 w-1 h-1 rounded-full bg-[#D48347]" />
          <span>你的私人對話與檔案不會公開給其他用戶</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="mt-1 flex-shrink-0 w-1 h-1 rounded-full bg-[#D48347]" />
          <span>我們會遵從供應商的資料處理規範，只用於提供服務及必要的系統優化</span>
        </div>
      </div>
    )
  }
];

export default function PricingPage() {
  const router = useRouter();
  const { user, logout } = useSaasAuth();
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [discountInfo, setDiscountInfo] = useState<SimpleDiscountInfo | null>(null);
  const [processing, setProcessing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handlePlanSelect = (plan: any) => {
    if (!user) {
      toast.error('請先登入');
      router.push('/aihome/auth/login?redirect=/aihome/pricing');
      return;
    }
    setSelectedPlan(plan);
    setDiscountInfo(null);
    setShowPayment(true);
  };

  const finalAmount = useMemo(() => {
    if (!selectedPlan) return 0;
    return discountInfo ? discountInfo.final_amount : selectedPlan.price;
  }, [selectedPlan, discountInfo]);

  const handleAirwallexPayment = async () => {
    if (!selectedPlan || !user) return;

    setProcessing(true);
    let tempWindow: Window | null = null;

    try {
      // 1. Open window immediately to avoid popup blockers
      tempWindow = window.open('', 'airwallex_payment', 'width=1200,height=800,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no,popup=yes');

      if (tempWindow) {
        tempWindow.document.write(`
          <html>
            <head><title>Connecting...</title></head>
            <body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;background:#f9fafb;">
              <div style="text-align:center"><h2>正在連接安全支付網關...</h2><p>請稍候...</p></div>
            </body>
          </html>
        `);
      }

      // 2. Create Payment Intent
      const result = await createAirwallexPayment({
        amount: finalAmount,
        currency: 'HKD',
        description: selectedPlan.isOneTime ? `購買 ${selectedPlan.name}` : `訂閱 ${selectedPlan.name}`,
        return_url: `${window.location.origin}/aihome/subscription`,
        cancel_url: `${window.location.origin}/aihome/pricing`,
        customer_name: user?.full_name || undefined,
        customer_email: user?.email || undefined
      });

      if (result.success && result.checkout_url) {
        if (tempWindow) {
          tempWindow.location.href = result.checkout_url;

          // Monitor for completion via message or interval
          const checkClosed = setInterval(() => {
            if (tempWindow?.closed) {
              clearInterval(checkClosed);
              setProcessing(false);
            }
          }, 1000);
        } else {
          window.location.href = result.checkout_url;
        }
      } else {
        if (tempWindow) tempWindow.close();
        toast.error('無法建立支付請求');
        setProcessing(false);
      }

    } catch (err: any) {
      if (tempWindow) tempWindow.close();
      toast.error(err.message || 'Payment failed');
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF9F2] text-[#4B4036] font-sans flex overflow-hidden">
      {/* Sidebar */}
      <AppSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col items-center w-full h-screen overflow-y-auto overflow-x-hidden relative scrollbar-hide">
        {/* Top Navigation Bar - Standard Style */}
        <nav className="w-full bg-white/80 backdrop-blur-sm border-b border-[#EADBC8] sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
                {/* Menu Button */}
                <motion.button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-lg hover:bg-[#FFD59A]/20 transition-colors relative z-40 flex-shrink-0"
                  title={isSidebarOpen ? "關閉選單" : "開啟選單"}
                >
                  <Bars3Icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#4B4036]" />
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
              </div>

              <div className="flex items-center space-x-4">
                <FoodBalanceButton />

                {/* Unified Right Content */}
                <UnifiedRightContent
                  user={user}
                  onLogout={logout}
                  onNavigate={() => { }}
                />
              </div>
            </div>
          </div>
        </nav>

        <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24">

          {/* Hero Section */}
          <div className="text-center mb-16 space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#FFD59A]/30 to-[#FFB6C1]/30 text-[#D48347] font-bold text-sm mb-2"
            >
              <RocketLaunchIcon className="w-4 h-4" />
              2025 AI 訂閱計劃
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-5xl font-bold text-[#4B4036]"
            >
              建立你的 <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFD59A] to-[#FFB6C1]">AI 團隊</span> 為你工作
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-[#8B7E74] max-w-2xl mx-auto text-lg leading-relaxed"
            >
              用一個價錢，請一整隊 AI 幫手。<br />
              由聊天、寫作、簡報到工作流程優化，全部交給你的專屬 AI 團隊。
            </motion.p>
          </div>

          {/* Full Model Matrix Feature */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative mb-16 p-10 rounded-[2.5rem] bg-gradient-to-br from-[#FFF9F2] to-[#FFF0E0] shadow-[inset_0_0_40px_rgba(255,255,255,0.8),0_10px_40px_-10px_rgba(212,131,71,0.2)] border border-[#EADBC8]/50 overflow-hidden"
          >
            {/* Abstract Background Blobs */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#FFD59A]/20 to-[#FFB6C1]/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-[#C6DBF0]/20 to-[#E5D4EF]/20 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left md:max-w-xl">
                <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur text-[#D48347] font-bold text-sm shadow-sm">
                  <CpuChipIcon className="w-4 h-4" />
                  <span>全模型矩陣</span>
                </div>
                <h3 className="text-2xl md:text-4xl font-bold text-[#4B4036] mb-4">
                  <span className="text-[#D48347]">一價全包</span> 頂級模型
                </h3>
                <p className="text-[#8B7E74] text-lg leading-relaxed">
                  一個帳號，同時擁有全球最強大腦。<br />
                  無需分別訂閱，在這裡隨意切換，激發無限創意。
                </p>
              </div>

              {/* Dynamic Model Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { name: 'ChatGPT', color: 'bg-[#74AA9C] text-white' },
                  { name: 'Gemini', color: 'bg-[#4B8BBE] text-white' },
                  { name: 'Claude', color: 'bg-[#D97757] text-white' },
                  { name: 'Grok', color: 'bg-[#333333] text-white' },
                  { name: 'Deepseek', color: 'bg-[#4B6BBE] text-white' },
                  { name: 'Qwen', color: 'bg-[#6B4BBE] text-white' },
                ].map((model) => (
                  <motion.div
                    key={model.name}
                    whileHover={{ scale: 1.05, rotate: -2 }}
                    className={`${model.color} px-6 py-3 rounded-2xl font-bold font-mono shadow-lg text-center backdrop-blur-md bg-opacity-90 border border-white/20`}
                  >
                    {model.name}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Other Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
            {[
              { title: "思維積木", icon: CubeTransparentIcon, desc: "可視化思考步驟，準確穩定" },
              { title: "多角色協作", icon: UserGroupIcon, desc: "寫作、研究、設計各有專員" },
              { title: "無限任用", icon: SparklesIcon, desc: "L1 模式無限用，零壓力" }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + idx * 0.1 }}
                className="p-6 rounded-3xl bg-white shadow-[6px_6px_12px_#E6D9C5,-6px_-6px_12px_#FFFFFF] border border-[#EADBC8]/30 hover:scale-105 transition-transform"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#FFF9F2] flex items-center justify-center mb-4 text-[#FFD59A]">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-[#8B7E74]">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mb-24">
            {PLANS.map((plan, idx) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + idx * 0.1 }}
                className={`relative p-8 rounded-[2.5rem] bg-gradient-to-b ${plan.color} border border-white/50 ${plan.isPopular ? 'shadow-[0_20px_40px_-10px_rgba(255,182,193,0.3)] scale-105 z-10 ring-2 ring-[#FFB6C1]' : 'shadow-xl hover:shadow-2xl'} transition-all duration-300`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#FFB6C1] text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg flex items-center gap-1">
                    {plan.badgeIcon && <plan.badgeIcon className="w-4 h-4 text-white" />}
                    {plan.badge}
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-xl font-bold text-[#4B4036] mb-2">{plan.name}</h3>
                  <div className="flex justify-center items-baseline gap-1">
                    <span className="text-sm text-[#8B7E74]">HKD</span>
                    <span className="text-5xl font-extrabold text-[#4B4036]">{plan.price}</span>
                    <span className="text-sm text-[#8B7E74]">/月</span>
                  </div>
                  {!plan.isPopular && <div className="text-xs font-medium text-[#D48347] mt-2 bg-white/50 inline-block px-3 py-1 rounded-full">{plan.badge}</div>}
                </div>

                <div className="space-y-6">
                  {/* L1 Mode */}
                  <div className="bg-white/60 p-4 rounded-2xl backdrop-blur-sm">
                    <div className="text-xs font-bold text-[#8B7E74] uppercase tracking-wider mb-1">自動模式 (L1)</div>
                    <div className="font-semibold text-[#4B4036] mb-1">∞ {plan.l1_mode}</div>
                    <div className="text-[10px] sm:text-xs text-[#8B7E74] leading-tight">
                      可使用頂級模型：
                      <span className="font-medium text-[#D48347]">ChatGPT, Gemini, Claude, Grok, Deepseek, Qwen</span>
                    </div>
                  </div>

                  {/* Credits */}
                  <div className="bg-white/60 p-4 rounded-2xl backdrop-blur-sm">
                    <div className="text-xs font-bold text-[#8B7E74] uppercase tracking-wider mb-1">每月食量 (Credits)</div>
                    <div className="text-2xl font-bold text-[#D48347] mb-1">{plan.credits.toLocaleString()} 食量</div>
                    <div className="text-xs text-[#8B7E74] space-y-1">
                      {plan.capacity.map((cap, i) => <div key={i}>{cap}</div>)}
                    </div>
                  </div>

                  {/* Features List */}
                  <ul className="space-y-3 px-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm font-medium text-[#4B4036]">
                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <CheckIcon className="w-3 h-3 text-green-600" />
                        </div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handlePlanSelect(plan)}
                  className={`w-full mt-8 py-4 rounded-xl font-bold text-white shadow-lg transform transition-all active:scale-95 hover:shadow-xl ${plan.btnColor}`}
                >
                  選擇此計劃
                </button>
              </motion.div>
            ))}
          </div>

          {/* Mode Explanation */}
          <div className="mb-24 space-y-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[#4B4036]">什麼是「模式」與「食量」？</h2>
              <p className="text-[#8B7E74] mt-2">我們把複雜的 AI 模型與運算成本，簡化成三個等級</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* L1 */}
              <div className="p-8 rounded-[2rem] bg-white border border-[#EADBC8] shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-4 font-bold text-slate-600 text-xl">L1</div>
                <h3 className="text-xl font-bold mb-2">自動模式 (Fast)</h3>
                <div className="text-sm font-bold text-green-600 mb-4 bg-green-50 inline-block px-3 py-1 rounded-full">付費無限用</div>
                <p className="text-sm text-[#8B7E74] mb-4">日常小幫手，適合回覆 WhatsApp/Email、翻譯、標題靈感。</p>
                <div className="text-xs text-[#8B7E74] p-3 bg-[#F8F5EC] rounded-xl flex items-center gap-1">
                  <InformationCircleIcon className="w-4 h-4 flex-shrink-0" />
                  簡單講：「我平時想問 ChatGPT 的東西」全部交給 L1。
                </div>
              </div>

              {/* L2 */}
              <div className="p-8 rounded-[2rem] bg-white border border-[#FFD59A] shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#FFD59A]/20 rounded-bl-full -mr-4 -mt-4" />
                <div className="w-12 h-12 rounded-2xl bg-[#FFD59A]/20 flex items-center justify-center mb-4 font-bold text-[#D48347] text-xl">L2</div>
                <h3 className="text-xl font-bold mb-2">思考模式 (Think)</h3>
                <div className="text-sm font-bold text-[#D48347] mb-4 bg-[#FFD59A]/20 inline-block px-3 py-1 rounded-full">約 4 食量 / 次</div>
                <p className="text-sm text-[#8B7E74] mb-4">進階思考，適合整理會議記錄、寫教案、分析方案利弊。</p>
                <div className="text-xs text-[#8B7E74] p-3 bg-[#FFF9F2] rounded-xl flex items-center gap-1">
                  <InformationCircleIcon className="w-4 h-4 flex-shrink-0" />
                  一句話：當你需要「有條理、有重點」的內容。
                </div>
              </div>

              {/* L3 */}
              <div className="p-8 rounded-[2rem] bg-gradient-to-br from-[#4B4036] to-[#2C241B] text-white shadow-xl">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-4 font-bold text-white text-xl border border-white/20">L3</div>
                <h3 className="text-xl font-bold mb-2">深度推理 (Deep)</h3>
                <div className="text-sm font-bold text-[#FFD59A] mb-4 bg-white/10 inline-block px-3 py-1 rounded-full border border-white/20">約 20 食量 / 次</div>
                <p className="text-sm text-white/70 mb-4">大型專案，適合研究報告、白皮書、商業計劃書、策略模擬。</p>
                <div className="text-xs text-white/60 p-3 bg-white/5 rounded-xl border border-white/10 flex items-center gap-1">
                  <InformationCircleIcon className="w-4 h-4 flex-shrink-0" />
                  可以理解為：「請一位資深顧問坐低幫你想清楚整件事」。
                </div>
              </div>
            </div>
          </div>

          {/* One-time Credit Purchase Section */}
          <div className="mb-24">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-[#4B4036] mb-2">單次購買食量 (Credits Top-up)</h2>
              <p className="text-[#8B7E74]">不喜歡訂閱？訂閱不夠用？隨用隨買，有效期 30 天。</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {CREDIT_PACKAGES.map((pkg) => (
                <motion.div
                  key={pkg.id}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className={`rounded-[2.5rem] p-6 relative overflow-hidden group shadow-lg hover:shadow-xl transition-all border border-white/60 bg-gradient-to-b ${pkg.color}`}
                >
                  {/* Decorative blur blobs behind */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-bl-full -mr-8 -mt-8 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-tr-full -ml-8 -mb-8 pointer-events-none" />

                  <div className="relative z-10 flex flex-col items-center h-full">
                    <h3 className="text-lg font-bold text-[#4B4036]/80 mb-1">{pkg.title}</h3>

                    {/* Credits - Big Impact */}
                    <div className="my-6 text-center bg-white/30 rounded-2xl p-4 w-full shadow-[inset_0_2px_4px_rgba(255,255,255,0.5)] border border-white/20">
                      <div className="text-3xl font-black text-[#4B4036] drop-shadow-sm flex items-center justify-center gap-2">
                        <img src="/apple-icon.svg" alt="credits" className="w-6 h-6" />
                        {pkg.credits.toLocaleString()}
                      </div>
                      <div className="text-[10px] font-bold text-[#8B7E74] uppercase tracking-widest mt-1">Credits 食量</div>
                    </div>

                    {/* Price */}
                    <div className="flex flex-col items-center mb-8">
                      <div className="text-sm font-medium text-[#4B4036]/40 line-through mb-0.5">
                        原價 HKD {pkg.original}
                      </div>
                      <div className="flex items-baseline">
                        <span className="text-sm font-bold text-[#4B4036]/60 mr-1">HKD</span>
                        <span className="text-5xl font-black text-[#4B4036] tracking-tight">{pkg.price}</span>
                      </div>
                    </div>

                    <div className="flex-grow" />

                    {/* Glassy Button */}
                    <button
                      onClick={() => handlePlanSelect(pkg)}
                      className="w-full py-4 rounded-2xl font-bold text-[#4B4036] bg-white/60 hover:bg-white/90 shadow-sm hover:shadow-md transition-all backdrop-blur-md flex items-center justify-center gap-2 group-hover:gap-3"
                    >
                      <span>立即購買</span>
                      <ArrowRightIcon className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* FAQ Section */}
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-[#4B4036] text-center mb-12">常見問題 (FAQ)</h2>
            <div className="space-y-6">
              {FAQS.map((faq, idx) => (
                <FaqItem key={idx} q={faq.q} a={faq.a} />
              ))}
            </div>
          </div>

        </main>
      </div>
      {/* End of scrollable main area */}

      {/* Payment Modal */}
      <AnimatePresence>
        {showPayment && selectedPlan && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#4B4036]/20 backdrop-blur-sm"
              onClick={() => setShowPayment(false)}
            />
            {/* Receipt Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-[#FFF9F2] w-full max-w-md rounded-3xl shadow-[0_20px_60px_-15px_rgba(75,64,54,0.3)] overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Scrollable Content Container */}
              <div className="overflow-y-auto custom-scrollbar p-8 pt-10">

                {/* Close Button */}
                <button
                  onClick={() => setShowPayment(false)}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-[#EADBC8]/50 transition-colors z-20 text-[#8B7E74]"
                >
                  <span className="text-xl">×</span>
                </button>

                {/* Header Section */}
                <div className="flex flex-col items-center mb-8 relative">
                  {/* Glow Effect */}
                  <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-gradient-to-br ${selectedPlan.color} opacity-20 blur-3xl rounded-full pointer-events-none`} />

                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className={`relative w-20 h-20 rounded-2xl bg-gradient-to-br ${selectedPlan.color} flex items-center justify-center mb-4 shadow-lg border border-white/40`}
                  >
                    <StarIcon className="w-10 h-10 text-[#4B4036]" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-[#4B4036]">{selectedPlan.name}</h3>
                  <div className={`text-[#8B7E74] mt-1 font-medium bg-[#EADBC8]/30 px-3 py-1 rounded-full text-xs ${selectedPlan.isOneTime ? 'text-[#D48347]' : ''}`}>
                    {selectedPlan.isOneTime ? 'One-time Purchase' : 'Monthly Subscription'}
                  </div>
                </div>

                {/* Amount Display */}
                <div className="flex justify-between items-baseline mb-8 px-4 py-4 bg-white/60 rounded-2xl backdrop-blur-sm border border-[#EADBC8]/50">
                  <span className="text-[#8B7E74] font-bold">總計 Total</span>
                  <span className="text-3xl font-extrabold text-[#D48347] tracking-tight">
                    HKD {finalAmount.toLocaleString()}
                  </span>
                </div>

                {/* Dashed Divider */}
                <div className="my-2 border-b-2 border-dashed border-[#EADBC8] opacity-50 relative">
                  <div className="absolute -left-10 -top-1 w-4 h-4 rounded-full bg-[#4B4036]/20" />
                  <div className="absolute -right-10 -top-1 w-4 h-4 rounded-full bg-[#4B4036]/20" />
                </div>

                {/* Details */}
                <div className="space-y-4 px-2 my-8 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#8B7E74]">日期 Date</span>
                    <span className="text-[#4B4036] font-medium font-sans">
                      {new Date().toLocaleDateString('zh-HK', { year: 'numeric', month: 'numeric', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8B7E74]">帳號 Account</span>
                    <span className="text-[#4B4036] font-medium font-sans truncate max-w-[180px]">{user?.email}</span>
                  </div>
                  {discountInfo && (
                    <div className="flex justify-between text-green-600 bg-green-50 p-2 rounded-lg">
                      <span>節省 Discount</span>
                      <span className="font-bold">- HKD {discountInfo.discount_amount}</span>
                    </div>
                  )}
                </div>

                {/* Promo Code Input */}
                <div className="mb-8">
                  <SimplePromoCodeInput
                    originalAmount={selectedPlan.price}
                    currency="HKD"
                    userId={user?.id}
                    userEmail={user?.email}
                    onDiscountApplied={setDiscountInfo}
                    className="w-full"
                  />
                </div>

                {/* Pay Button */}
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: "0 10px 25px -5px rgba(212, 131, 71, 0.4)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAirwallexPayment}
                  disabled={processing}
                  className={`w-full py-4 rounded-2xl text-white font-bold text-lg shadow-xl flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group transition-all relative overflow-hidden`}
                >
                  {/* Button Background Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#D48347] to-[#e09e6c] z-0" />

                  {/* Shimmer Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer z-0" />

                  <div className="relative z-10 flex items-center gap-2">
                    {processing ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        處理中 Processing...
                      </>
                    ) : (
                      <>
                        <span>確認支付 HKD {finalAmount}</span>
                        <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </div>
                </motion.button>

                <div className="mt-6 text-center pb-4">
                  <div className="text-xs text-[#8B7E74]/60 flex justify-center items-center gap-1.5">
                    <CreditCardIcon className="w-3 h-3" />
                    <span className="tracking-wide">SECURED BY AIRWALLEX</span>
                  </div>
                </div>

              </div>

              {/* Decorative Bottom Pattern */}
              <div className="h-3 w-full bg-[#EADBC8]/30" style={{
                maskImage: 'radial-gradient(circle at 10px, transparent 10px, black 11px)',
                maskSize: '20px 20px',
                maskPosition: 'bottom',
                maskComposite: 'exclude'
              }} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FaqItem({ q, a }: { q: string, a: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-[#EADBC8] bg-white rounded-2xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-[#FFF9F2] transition-colors"
      >
        <span className="font-bold text-[#4B4036] pr-4">{q}</span>
        <ChevronDownIcon className={`w-5 h-5 text-[#8B7E74] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-[#F8F5EC]"
          >
            <div className="px-6 py-5 text-sm leading-relaxed text-[#4B4036]/80 border-t border-[#EADBC8]/50">
              {a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
