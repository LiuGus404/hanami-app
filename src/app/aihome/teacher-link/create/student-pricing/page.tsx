'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
    ChevronDownIcon,
    UserGroupIcon,
    Bars3Icon,
    CheckIcon,
    SparklesIcon,
    RocketLaunchIcon,
    StarIcon,
    ShieldCheckIcon,
    ChartBarIcon,
    BoltIcon,
    BuildingOffice2Icon,
    CurrencyDollarIcon,
    ArrowTrendingUpIcon,
    AdjustmentsHorizontalIcon,
    ChatBubbleBottomCenterTextIcon,
    CreditCardIcon,
} from '@heroicons/react/24/outline';
import AppSidebar from '@/components/AppSidebar';
import Image from 'next/image';
import UnifiedRightContent from '@/components/UnifiedRightContent';
import FoodBalanceButton from '@/components/aihome/FoodBalanceButton';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';

// Pricing Plan Definitions (HKD) - Customer-Facing Version
const PRICING_PLANS = [
    {
        id: 'seed',
        name: '種子版 (Seed)',
        nameEn: 'Seed',
        badge: '零成本創業首選',
        studentRange: '0 - 10 人',
        monthlyFee: 0,
        monthlyFeeDisplay: '免費',
        avgCostPerStudent: '$0',
        highlight: '零成本創業首選',
        description: '完全免費開放，讓您無負擔體驗系統功能，協助起步階段的微型教室輕鬆管理。',
        color: 'from-green-100 to-emerald-50',
        badgeColor: 'bg-green-100 text-green-700',
        btnColor: 'bg-gradient-to-r from-[#4AAE8C] to-[#3A9D7B] text-white',
        icon: SparklesIcon,
        isPopular: false,
        isFree: true,
    },
    {
        id: 'starter',
        name: '起步版 (Starter)',
        nameEn: 'Starter',
        badge: '超高性價比',
        studentRange: '11 - 50 人',
        monthlyFee: 188,
        monthlyFeeDisplay: '$188',
        avgCostPerStudent: '低至 $3.76',
        highlight: '超高性價比',
        description: '價格僅為市場同類系統（參考價 $430+）的一半不到。以最親民的價格，享受專業的數碼化管理。',
        color: 'from-blue-100 to-blue-50',
        badgeColor: 'bg-blue-100 text-blue-700',
        btnColor: 'bg-gradient-to-r from-[#5B9BD5] to-[#4A8BC4] text-white',
        icon: RocketLaunchIcon,
        isPopular: false,
        isFree: false,
    },
    {
        id: 'growth',
        name: '成長版 (Growth)',
        nameEn: 'Growth',
        badge: '無痛擴張首選',
        badgeIcon: StarIcon,
        studentRange: '51 - 100 人',
        monthlyFee: 368,
        monthlyFeeDisplay: '$368',
        avgCostPerStudent: '低至 $3.68',
        highlight: '無痛擴張首選',
        description: '隨著學生人數倍增，您的單位運營成本反而下降。升級門檻低，讓您專注招生，無需擔心系統費用暴漲。',
        color: 'from-amber-100 to-orange-50',
        badgeColor: 'bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036]',
        btnColor: 'bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] hover:from-[#EBC9A4] hover:to-[#FFD59A]',
        icon: ChartBarIcon,
        isPopular: true,
        isFree: false,
    },
    {
        id: 'pro',
        name: '專業版 (Pro)',
        nameEn: 'Pro',
        badge: '成熟機構必備',
        studentRange: '101 - 250 人',
        monthlyFee: 688,
        monthlyFeeDisplay: '$688',
        avgCostPerStudent: '低至 $2.75',
        highlight: '成熟機構必備',
        description: '支援更多進階功能與服務，價格仍顯著低於市場標準（參考價 $750+），有效保障您的營運利潤。',
        color: 'from-purple-100 to-pink-50',
        badgeColor: 'bg-purple-100 text-purple-700',
        btnColor: 'bg-gradient-to-r from-[#9B7FCB] to-[#8B6BBE] text-white',
        icon: BoltIcon,
        isPopular: false,
        isFree: false,
    },
    {
        id: 'enterprise',
        name: '企業版 (Enterprise)',
        nameEn: 'Enterprise',
        badge: '規模化管理專家',
        studentRange: '251 - 500 人',
        monthlyFee: 988,
        monthlyFeeDisplay: '$988',
        avgCostPerStudent: '低至 $1.98',
        highlight: '規模化管理專家',
        description: '每月不用一千元，即可管理多達 500 名學生。打破傳統「大客貴價」的潛規則，為大型校舍建立最強競爭優勢。',
        color: 'from-slate-100 to-gray-50',
        badgeColor: 'bg-slate-800 text-white',
        btnColor: 'bg-gradient-to-r from-[#4B4036] to-[#2C241B] text-white',
        icon: BuildingOffice2Icon,
        isPopular: false,
        isFree: false,
    },
];

// Why Choose Us Benefits
const WHY_CHOOSE_US = [
    {
        icon: CurrencyDollarIcon,
        title: '打破市場定價規則',
        description: '相較於市面主流系統（如 SchoolTracs 等），我們的收費平均節省 50% 以上。',
    },
    {
        icon: ArrowTrendingUpIcon,
        title: '隨著規模更划算',
        description: '我們的定價邏輯是「學生越多，單價越平」，平均每位學生的行政成本最低可降至 $1.98。',
    },
    {
        icon: ShieldCheckIcon,
        title: '無隱藏收費',
        description: '清晰透明的月費模式，讓您能精準控制預算。',
    },
    {
        icon: AdjustmentsHorizontalIcon,
        title: '彈性升級',
        description: '從免費版到企業版，系統支援您業務發展的每一個階段，無須更換系統即可無縫升級。',
    },
];

export default function StudentPricingPage() {
    const router = useRouter();
    const { user, logout } = useSaasAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#FFF9F2] text-[#4B4036] font-sans flex overflow-hidden">
            {/* Sidebar */}
            <AppSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className="flex-1 flex flex-col items-center w-full h-screen overflow-y-auto overflow-x-hidden relative scrollbar-hide">
                {/* Top Navigation Bar */}
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
                            <UserGroupIcon className="w-4 h-4" />
                            教育中心管理系統
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-3xl md:text-5xl font-bold text-[#4B4036]"
                        >
                            靈活彈性定價<br className="md:hidden" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFD59A] to-[#FFB6C1]">伴隨您的教育中心一同成長</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className="text-lg md:text-xl font-medium text-[#8B7E74] italic tracking-wide"
                        >
                            Built by educator for educators
                        </motion.p>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-[#8B7E74] max-w-3xl mx-auto text-lg leading-relaxed"
                        >
                            我們深知經營教育中心的成本壓力。因此，我們打破傳統昂貴的收費模式，提供全港最具競爭力的管理系統方案。<br className="hidden md:block" />
                            無論您是剛起步的獨立導師，還是具規模的連鎖院校，都能找到最合適的選擇。
                        </motion.p>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                            className="pt-4 flex flex-col sm:flex-row gap-4 justify-center"
                        >
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => router.push('/aihome/teacher-link/create/subscription-checkout')}
                                className="px-8 py-4 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] font-bold rounded-xl shadow-lg hover:shadow-xl transition-all inline-flex items-center justify-center gap-2"
                            >
                                <CreditCardIcon className="w-5 h-5" />
                                開始訂閱
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => router.push('/aihome/teacher-link/create/subscription-checkout?plan=seed')}
                                className="px-8 py-4 bg-white text-[#4B4036] font-bold rounded-xl shadow-lg hover:shadow-xl transition-all inline-flex items-center justify-center gap-2 border border-[#EADBC8]"
                            >
                                <SparklesIcon className="w-5 h-5" />
                                免費開始使用
                            </motion.button>
                        </motion.div>
                    </div>

                    {/* Pricing Table - Desktop */}
                    <div className="hidden lg:block mb-16">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="overflow-hidden rounded-[2rem] border border-[#EADBC8] shadow-xl"
                        >
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gradient-to-r from-[#4B4036] to-[#2C241B] text-white">
                                        <th className="px-6 py-5 text-left font-bold">方案級別</th>
                                        <th className="px-6 py-5 text-center font-bold">學生人數上限</th>
                                        <th className="px-6 py-5 text-center font-bold">月費 (HKD)</th>
                                        <th className="px-6 py-5 text-center font-bold">平均每位學生成本</th>
                                        <th className="px-6 py-5 text-left font-bold">方案亮點與優勢</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {PRICING_PLANS.map((plan, idx) => (
                                        <motion.tr
                                            key={plan.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.4 + idx * 0.1 }}
                                            className={`${idx % 2 === 0 ? 'bg-white' : 'bg-[#FFF9F2]'} hover:bg-[#FFD59A]/10 transition-colors border-b border-[#EADBC8]/50 ${plan.isPopular ? 'ring-2 ring-[#FFB6C1] ring-inset bg-gradient-to-r from-amber-50/50 to-orange-50/50' : ''}`}
                                        >
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center shadow-sm`}>
                                                        <plan.icon className="w-5 h-5 text-[#4B4036]" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-[#4B4036]">{plan.name}</div>
                                                        {plan.isPopular && (
                                                            <div className="flex items-center gap-1 text-xs text-[#D48347]">
                                                                <StarIcon className="w-3 h-3" />
                                                                最受歡迎
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span className="font-mono font-bold text-lg text-[#4B4036]">{plan.studentRange}</span>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span className={`font-bold text-2xl ${plan.isFree ? 'text-green-600' : 'text-[#D48347]'}`}>
                                                    {plan.monthlyFeeDisplay}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span className="font-mono text-[#4B4036]">{plan.avgCostPerStudent}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div>
                                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-2 ${plan.badgeColor}`}>
                                                        {plan.highlight}
                                                    </span>
                                                    <p className="text-sm text-[#8B7E74] leading-relaxed">
                                                        {plan.description}
                                                    </p>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </motion.div>
                    </div>

                    {/* Pricing Cards - Mobile & Tablet */}
                    <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
                        {PRICING_PLANS.map((plan, idx) => (
                            <motion.div
                                key={plan.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + idx * 0.1 }}
                                className={`relative p-6 rounded-[2rem] bg-gradient-to-b ${plan.color} border border-white/50 ${plan.isPopular ? 'shadow-[0_20px_40px_-10px_rgba(255,182,193,0.3)] ring-2 ring-[#FFB6C1]' : 'shadow-xl'} transition-all duration-300`}
                            >
                                {plan.isPopular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FFB6C1] text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                                        <StarIcon className="w-3 h-3 text-white" />
                                        最受歡迎
                                    </div>
                                )}

                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`w-12 h-12 rounded-xl bg-white/60 flex items-center justify-center shadow-sm`}>
                                        <plan.icon className="w-6 h-6 text-[#4B4036]" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-[#4B4036]">{plan.name}</h3>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${plan.badgeColor}`}>{plan.badge}</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {/* Student Range */}
                                    <div className="bg-white/60 p-4 rounded-xl backdrop-blur-sm">
                                        <div className="text-xs font-bold text-[#8B7E74] uppercase tracking-wider mb-1">學生人數上限</div>
                                        <div className="font-mono font-bold text-xl text-[#4B4036]">{plan.studentRange}</div>
                                    </div>

                                    {/* Monthly Fee */}
                                    <div className="bg-white/60 p-4 rounded-xl backdrop-blur-sm">
                                        <div className="text-xs font-bold text-[#8B7E74] uppercase tracking-wider mb-1">月費 (HKD)</div>
                                        <div className={`font-bold text-3xl ${plan.isFree ? 'text-green-600' : 'text-[#D48347]'}`}>{plan.monthlyFeeDisplay}</div>
                                        <div className="text-xs text-[#8B7E74] mt-1">平均每位學生: {plan.avgCostPerStudent}</div>
                                    </div>

                                    {/* Description */}
                                    <div className="p-4 bg-white/40 rounded-xl">
                                        <p className="text-sm text-[#8B7E74] leading-relaxed">{plan.description}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Custom Plan for 500+ Students */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="mb-16 p-8 rounded-[2rem] bg-gradient-to-r from-[#4B4036] to-[#2C241B] text-white text-center shadow-xl"
                    >
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex-1 text-center md:text-left">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/80 text-sm font-medium mb-3">
                                    <UserGroupIcon className="w-4 h-4" />
                                    <span>500+ 人</span>
                                </div>
                                <h3 className="text-2xl md:text-3xl font-bold mb-2">大於 500 人？</h3>
                                <p className="text-white/70">
                                    請聯絡我們為您定制專屬方案，享受更優惠的價格和AI專屬服務。
                                </p>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-8 py-4 bg-white text-[#4B4036] font-bold rounded-xl shadow-lg hover:shadow-xl transition-all inline-flex items-center gap-2"
                            >
                                <ChatBubbleBottomCenterTextIcon className="w-5 h-5" />
                                聯繫我們
                            </motion.button>
                        </div>
                    </motion.div>

                    {/* Why Choose Us Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="mb-16"
                    >
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-[#4B4036] mb-4">為什麼選擇我們的系統？</h2>
                            <p className="text-[#8B7E74] max-w-2xl mx-auto">
                                我們致力於為教育中心提供最具價值的管理解決方案
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {WHY_CHOOSE_US.map((benefit, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.7 + idx * 0.1 }}
                                    className="p-6 rounded-3xl bg-white shadow-[6px_6px_12px_#E6D9C5,-6px_-6px_12px_#FFFFFF] border border-[#EADBC8]/30 hover:scale-105 transition-transform"
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FFD59A]/30 to-[#FFB6C1]/30 flex items-center justify-center mb-4">
                                        <benefit.icon className="w-7 h-7 text-[#D48347]" />
                                    </div>
                                    <h3 className="font-bold text-lg mb-2 text-[#4B4036]">{benefit.title}</h3>
                                    <p className="text-sm text-[#8B7E74] leading-relaxed">{benefit.description}</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Features Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="mb-16"
                    >
                        <div className="text-center mb-8">
                            <h2 className="text-2xl md:text-3xl font-bold text-[#4B4036] mb-2">功能</h2>
                            <p className="text-[#8B7E74]">完整的教學管理工具集</p>
                        </div>

                        {/* Basic Features Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            {[
                                { title: '學生管理', description: '輕鬆管理學生資料、課程記錄和學習進度', color: 'from-green-100 to-emerald-50', iconPath: '/icons/bear-face.PNG' },
                                { title: '課程排程', description: '智能排課系統，自動優化課程安排', color: 'from-purple-100 to-pink-50', iconPath: '/icons/clock.PNG' },
                                { title: '學習追蹤', description: '詳細的學習進度分析和能力評估', color: 'from-blue-100 to-blue-50', iconPath: '/icons/elephant.PNG' },
                                { title: '教案管理', description: '建立和管理您的教學資源庫', color: 'from-amber-100 to-orange-50', iconPath: '/icons/book-elephant.PNG' },
                                { title: '教師協作', description: '與團隊成員共享資源和協作教學', color: 'from-slate-100 to-gray-50', iconPath: '/icons/music.PNG' },
                                { title: '財務管理', description: '智能管理收入和支出，清晰掌握機構財務狀況', color: 'from-green-100 to-emerald-50', iconPath: '/icons/bear-face.PNG' },
                                { title: '家長端應用', description: '讓家長查看孩子學習進度和成長狀況，增進家校溝通', color: 'from-blue-100 to-blue-50', iconPath: '/icons/elephant.PNG' },
                                { title: '多角色分層系統', description: '創建者、管理員、老師、成員分層權限，保護用戶資料安全', color: 'from-purple-100 to-pink-50', iconPath: '/icons/penguin-face.PNG' },
                            ].map((feature, idx) => (
                                <motion.div
                                    key={feature.title}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.8 + idx * 0.05 }}
                                    className={`p-6 rounded-3xl bg-gradient-to-b ${feature.color} shadow-[6px_6px_12px_#E6D9C5,-6px_-6px_12px_#FFFFFF] border border-[#EADBC8]/30 hover:scale-105 transition-transform`}
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-white/60 flex items-center justify-center mb-4 shadow-sm">
                                        <Image
                                            src={feature.iconPath}
                                            alt={feature.title}
                                            width={36}
                                            height={36}
                                            className="object-contain"
                                        />
                                    </div>
                                    <h3 className="font-bold text-lg mb-2 text-[#4B4036]">{feature.title}</h3>
                                    <p className="text-sm text-[#8B7E74] leading-relaxed">{feature.description}</p>
                                </motion.div>
                            ))}
                        </div>

                        {/* Featured AI Features - Table (Desktop) */}
                        <div className="hidden lg:block">
                            <div className="overflow-hidden rounded-[2rem] border border-[#EADBC8] shadow-xl">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gradient-to-r from-[#4B4036] to-[#2C241B] text-white">
                                            <th className="px-6 py-5 text-left font-bold">推薦功能</th>
                                            <th className="px-6 py-5 text-left font-bold">功能說明</th>
                                            <th className="px-6 py-5 text-center font-bold">狀態</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[
                                            { title: 'AI 多角色智能助手', description: 'Hibi、墨墨、皮可等多個 AI 角色協助教學規劃、學習分析和創意設計，讓教學更智能', color: 'from-blue-100 to-blue-50', badgeColor: 'bg-blue-100 text-blue-700', iconPath: '/icons/penguin-face.PNG' },
                                            { title: '自由畫布學習路徑', description: '視覺化學習路徑設計，自由拖拽節點，創建個性化學習旅程，讓每個學生都能找到最適合的成長路徑', color: 'from-amber-100 to-orange-50', badgeColor: 'bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036]', iconPath: '/icons/elephant.PNG' },
                                        ].map((feature, idx) => (
                                            <tr
                                                key={feature.title}
                                                className={`${idx % 2 === 0 ? 'bg-white' : 'bg-[#FFF9F2]'} hover:bg-[#FFD59A]/10 transition-colors border-b border-[#EADBC8]/50`}
                                            >
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-sm`}>
                                                            <Image
                                                                src={feature.iconPath}
                                                                alt={feature.title}
                                                                width={32}
                                                                height={32}
                                                                className="object-contain"
                                                            />
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-[#4B4036]">{feature.title}</div>
                                                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${feature.badgeColor}`}>
                                                                <SparklesIcon className="w-3 h-3 inline mr-1" />
                                                                推薦
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <p className="text-sm text-[#8B7E74] leading-relaxed">{feature.description}</p>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                                                        <CheckIcon className="w-3 h-3" />
                                                        已包含
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Featured AI Features - Cards (Mobile & Tablet) */}
                        <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                { title: 'AI 多角色智能助手', description: 'Hibi、墨墨、皮可等多個 AI 角色協助教學規劃、學習分析和創意設計，讓教學更智能', color: 'from-blue-100 to-blue-50', badgeColor: 'bg-blue-100 text-blue-700', iconPath: '/icons/penguin-face.PNG' },
                                { title: '自由畫布學習路徑', description: '視覺化學習路徑設計，自由拖拽節點，創建個性化學習旅程，讓每個學生都能找到最適合的成長路徑', color: 'from-amber-100 to-orange-50', badgeColor: 'bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036]', iconPath: '/icons/elephant.PNG' },
                            ].map((feature, idx) => (
                                <motion.div
                                    key={feature.title}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.9 + idx * 0.1 }}
                                    className={`relative p-6 rounded-[2rem] bg-gradient-to-b ${feature.color} border border-white/50 shadow-xl transition-all duration-300`}
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-white/60 flex items-center justify-center shadow-sm">
                                            <Image
                                                src={feature.iconPath}
                                                alt={feature.title}
                                                width={32}
                                                height={32}
                                                className="object-contain"
                                            />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-[#4B4036]">{feature.title}</h3>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${feature.badgeColor}`}>
                                                <SparklesIcon className="w-3 h-3 inline mr-1" />
                                                推薦
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-white/40 rounded-xl">
                                        <p className="text-sm text-[#8B7E74] leading-relaxed">{feature.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Security Features */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="relative mb-16 p-10 rounded-[2.5rem] bg-gradient-to-br from-[#FFF9F2] to-[#FFF0E0] shadow-[inset_0_0_40px_rgba(255,255,255,0.8),0_10px_40px_-10px_rgba(212,131,71,0.2)] border border-[#EADBC8]/50 overflow-hidden"
                    >
                        {/* Abstract Background Blobs */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#FFD59A]/20 to-[#FFB6C1]/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-[#C6DBF0]/20 to-[#E5D4EF]/20 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />

                        <div className="relative z-10 text-center">
                            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur text-[#D48347] font-bold text-sm shadow-sm">
                                <ShieldCheckIcon className="w-4 h-4" />
                                <span>安全保障</span>
                            </div>
                            <h3 className="text-2xl md:text-3xl font-bold text-[#4B4036] mb-6">
                                您的數據安全是我們的首要任務
                            </h3>

                            <div className="flex flex-wrap gap-4 justify-center">
                                {[
                                    { label: 'ISO 27001 認證', icon: '🔒' },
                                    { label: '數據加密', icon: '🛡️' },
                                    { label: '定期備份', icon: '💾' },
                                    { label: '隱私保護', icon: '🔐' },
                                ].map((item, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.9 + index * 0.1 }}
                                        className="bg-white/80 backdrop-blur p-4 rounded-2xl shadow-lg text-center min-w-[140px]"
                                    >
                                        <div className="text-2xl mb-2">{item.icon}</div>
                                        <div className="text-sm font-bold text-[#4B4036]">{item.label}</div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* Cost Comparison Highlight */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="relative mb-16 p-10 rounded-[2.5rem] bg-gradient-to-br from-[#FFF9F2] to-[#FFF0E0] shadow-[inset_0_0_40px_rgba(255,255,255,0.8),0_10px_40px_-10px_rgba(212,131,71,0.2)] border border-[#EADBC8]/50 overflow-hidden"
                    >
                        {/* Abstract Background Blobs */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#FFD59A]/20 to-[#FFB6C1]/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-[#C6DBF0]/20 to-[#E5D4EF]/20 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />

                        <div className="relative z-10 text-center">
                            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur text-[#D48347] font-bold text-sm shadow-sm">
                                <ChartBarIcon className="w-4 h-4" />
                                <span>價格比較</span>
                            </div>
                            <h3 className="text-2xl md:text-4xl font-bold text-[#4B4036] mb-4">
                                平均節省 <span className="text-[#D48347]">50%</span> 以上
                            </h3>
                            <p className="text-[#8B7E74] text-lg leading-relaxed max-w-2xl mx-auto mb-8">
                                相較於市面主流管理系統，我們的定價更加親民。<br className="hidden md:block" />
                                以 50 名學生為例，每月只需 $188，而市場參考價高達 $430+。
                            </p>

                            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                                <div className="bg-white/80 backdrop-blur p-6 rounded-2xl shadow-lg text-center min-w-[200px]">
                                    <div className="text-sm text-[#8B7E74] mb-2">市場參考價</div>
                                    <div className="text-3xl font-bold text-[#8B7E74] line-through">$430+</div>
                                </div>
                                <div className="text-4xl text-[#D48347]">→</div>
                                <div className="bg-gradient-to-br from-[#4AAE8C] to-[#3A9D7B] p-6 rounded-2xl shadow-lg text-center min-w-[200px] text-white">
                                    <div className="text-sm opacity-90 mb-2">我們的價格</div>
                                    <div className="text-3xl font-bold">$188</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Call to Action */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9 }}
                        className="text-center bg-gradient-to-r from-[#4B4036] to-[#2C241B] rounded-[2rem] p-10 text-white shadow-xl"
                    >
                        <h2 className="text-2xl md:text-3xl font-bold mb-4">準備好升級您的教育中心管理了嗎？</h2>
                        <p className="text-white/70 mb-8 max-w-xl mx-auto">
                            從免費的種子版開始，隨著您的機構成長，靈活升級到更適合的方案。<br />
                            無須更換系統，即可無縫升級。
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => router.push('/aihome/teacher-link/create/subscription-checkout')}
                                className="px-8 py-4 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] font-bold rounded-xl shadow-lg hover:shadow-xl transition-all inline-flex items-center justify-center gap-2"
                            >
                                <CreditCardIcon className="w-5 h-5" />
                                開始訂閱
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => router.push('/aihome/teacher-link/create/subscription-checkout?plan=seed')}
                                className="px-8 py-4 bg-white text-[#4B4036] font-bold rounded-xl shadow-lg hover:shadow-xl transition-all inline-flex items-center justify-center gap-2"
                            >
                                <SparklesIcon className="w-5 h-5" />
                                免費開始使用
                            </motion.button>
                        </div>
                    </motion.div>

                    {/* FAQ Section */}
                    <div className="mt-20 max-w-4xl mx-auto">
                        <h2 className="text-3xl font-bold text-[#4B4036] text-center mb-12">常見問題 (FAQ)</h2>
                        <div className="space-y-6">
                            {[
                                {
                                    q: "Q1：什麼是學生人數上限？如何計算？",
                                    a: "學生人數上限是指您機構中可管理的活躍學生總數。我們每月會根據您系統中的活躍學生數量來計算，確保您只為實際使用的服務付費。"
                                },
                                {
                                    q: "Q2：如果我的學生人數超過當前方案怎麼辦？",
                                    a: "系統會自動提醒您升級到更合適的方案。您可以隨時升級，新方案會立即生效，並按比例計算費用。升級過程無縫銜接，不會影響您的日常運作。"
                                },
                                {
                                    q: "Q3：種子版真的完全免費嗎？有什麼限制？",
                                    a: "是的！種子版對於 10 名或以下學生的機構完全免費，沒有任何隱藏費用。您可以使用所有基礎功能，讓您零成本體驗我們的平台。"
                                },
                                {
                                    q: "Q4：與市面其他系統相比，你們的優勢是什麼？",
                                    a: "我們的定價全線低於市場主流系統，最高可節省 50% 以上。例如，同樣管理 50 名學生，市場參考價約 $430+，而我們只需 $188。此外，我們採用「學生越多，單價越平」的定價邏輯，讓您的規模效益更加明顯。"
                                },
                                {
                                    q: "Q5：可以隨時取消訂閱嗎？",
                                    a: "當然可以。您可以隨時取消訂閱，我們不會自動續費。取消後，您仍可在當月剩餘時間內使用服務，並可隨時匯出您的資料。"
                                },
                                {
                                    q: "Q6：系統支援哪些功能？",
                                    a: "我們的系統支援學生管理、考勤追蹤、課程安排、家長通訊、財務報表等核心功能。不同方案會有更多進階功能，如多校區支援、進階數據分析、專屬客服等。詳情請聯繫我們的銷售團隊。"
                                }
                            ].map((faq, idx) => (
                                <FaqItem key={idx} q={faq.q} a={faq.a} />
                            ))}
                        </div>
                    </div>

                </main>
            </div>
        </div>
    );
}

function FaqItem({ q, a }: { q: string, a: string }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border border-[#EADBC8] bg-white rounded-2xl overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-[#FFF9F2] transition-colors"
            >
                <span className="font-bold text-[#4B4036] pr-4">{q}</span>
                <ChevronDownIcon className={`w-5 h-5 text-[#8B7E74] transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
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
