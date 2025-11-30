'use client';

import { useState, useEffect, useMemo } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { CurrencyDollarIcon, ChartBarIcon, PresentationChartLineIcon } from '@heroicons/react/24/outline';
import { HanamiCard } from '@/components/ui/HanamiCard';
import { HanamiButton } from '@/components/ui/HanamiButton';
import BackButton from '@/components/ui/BackButton';
import { TeacherLinkShell, useTeacherLinkOrganization } from '../TeacherLinkShell';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import CuteLoadingSpinner from '@/components/ui/CuteLoadingSpinner';
import { WithPermissionCheck } from '@/components/teacher-link/withPermissionCheck';
import { CircularChart, PieChart } from '@/components/ui/CircularChart';
import FinancialManagementNavBar from '@/components/ui/FinancialManagementNavBar';
import { useFinancialData } from '@/hooks/useFinancialData';

interface FinancialData {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  studentCount: number;
  activePackages: number;
  courseTypeCount: number;
  totalLessons: number;
  actualLessons: number;
  trialLessons: number;
  expectedLessons: number;
}

interface Expense {
  id: string;
  expense_date: string;
  expense_category: string;
  expense_description: string;
  amount: number;
  payment_method: string | null;
  receipt_url: string | null;
  notes: string | null;
  created_at: string | null;
  org_id?: string | null;
}

interface Package {
  id: string;
  course_name: string;
  price: number;
  total_lessons: number;
  remaining_lessons: number;
  status: string | null;
  student_id: string;
  full_name: string | null;
}

interface CourseType {
  id: string;
  name: string | null;
  status: boolean | null;
  trial_limit: number | null;
  price_per_lesson?: number | null;
  created_at: string;
}

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

function FinancialManagementContent() {
  const { user: saasUser } = useSaasAuth();
  const { orgId, organization, organizationResolved, orgDataDisabled } = useTeacherLinkOrganization();

  const resolvedOrgId = useMemo(() => {
    if (orgId && UUID_REGEX.test(orgId) && orgId !== 'unassigned-org-placeholder') {
      return orgId;
    }
    if (organization?.id && UUID_REGEX.test(organization.id)) {
      return organization.id;
    }
    return null;
  }, [orgId, organization?.id]);

  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [courseTypeDistribution, setCourseTypeDistribution] = useState<{ [key: string]: number }>({});
  const [trialStats, setTrialStats] = useState({
    fromTrialTable: 0,
    fromLessonTable: 0,
    total: 0
  });

  // 使用 SWR 缓存的财务数据
  const { data: cachedFinancialData, isLoading: financialLoading, error: financialError, mutate: mutateFinancial } = useFinancialData(
    resolvedOrgId,
    saasUser?.email || '',
    selectedMonth
  );

  // 计算扩展的财务数据
  const financialData = useMemo<FinancialData>(() => {
    if (!cachedFinancialData) {
      return {
        totalIncome: 0,
        totalExpenses: 0,
        netProfit: 0,
        studentCount: 0,
        activePackages: 0,
        courseTypeCount: 0,
        totalLessons: 0,
        actualLessons: 0,
        trialLessons: 0,
        expectedLessons: 0
      };
    }

    // 从缓存的数据中提取信息
    const regularStudents = cachedFinancialData.regularStudents || [];
    const expenses = cachedFinancialData.expenses || [];
    const trialStudents = cachedFinancialData.trialStudents || [];
    const courseTypes = cachedFinancialData.courseTypes || [];

    // 计算总支出
    const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

    // 计算总收入（这里需要根据实际业务逻辑计算）
    // TODO: 根据实际业务逻辑计算总收入
    const totalIncome = 0;

    // 计算净利
    const netProfit = totalIncome - totalExpenses;

    // 计算学生数量
    const studentCount = regularStudents.length;

    // 计算活跃课程包（需要从其他地方获取）
    const activePackages = 0; // TODO: 从缓存数据中获取

    // 计算课程类型数量
    const courseTypeCount = courseTypes.length;

    // 计算堂数统计（需要从其他地方获取）
    const totalLessons = 0; // TODO: 从缓存数据中获取
    const actualLessons = 0; // TODO: 从缓存数据中获取
    const trialLessons = trialStudents.length;

    // 计算理应上堂数
    const [year, month] = selectedMonth.split('-');
    const firstDayOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
    const lastDayOfMonth = new Date(parseInt(year), parseInt(month), 0);
    const weeksInMonth = Math.ceil((lastDayOfMonth.getDate() - firstDayOfMonth.getDate() + 1) / 7);
    const expectedLessons = studentCount * weeksInMonth;

    return {
      totalIncome,
      totalExpenses,
      netProfit,
      studentCount,
      activePackages,
      courseTypeCount,
      totalLessons,
      actualLessons,
      trialLessons,
      expectedLessons
    };
  }, [cachedFinancialData, selectedMonth]);

  const loading = financialLoading;
  const error = financialError ? '載入財務數據時發生錯誤' : null;

  useEffect(() => {
    if (!organizationResolved || orgDataDisabled || !resolvedOrgId) {
      return;
    }

    // 计算课程类型分布
    if (cachedFinancialData?.regularStudents) {
      const courseTypeCounts: { [key: string]: number } = {};
      cachedFinancialData.regularStudents.forEach((student: any) => {
        const courseType = student.course_type || student.student_course_type || '未分類';
        courseTypeCounts[courseType] = (courseTypeCounts[courseType] || 0) + 1;
      });
      setCourseTypeDistribution(courseTypeCounts);
    }

    // 计算试堂统计
    if (cachedFinancialData?.trialStudents) {
      const trialFromTrialTable = cachedFinancialData.trialStudents.length || 0;
      // TODO: 从课程记录中获取试堂数据
      const trialFromLessonTable = 0;
      setTrialStats({
        fromTrialTable: trialFromTrialTable,
        fromLessonTable: trialFromLessonTable,
        total: trialFromTrialTable + trialFromLessonTable
      });
    }
  }, [cachedFinancialData, organizationResolved, orgDataDisabled, resolvedOrgId]);

  // 刷新财务数据
  const fetchFinancialData = async () => {
    if (!resolvedOrgId) {
      return;
    }
    await mutateFinancial();
  };


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-HK', {
      style: 'currency',
      currency: 'HKD'
    }).format(amount);
  };

  if (orgDataDisabled) {
    return null;
  }

  if (loading) {
    return <CuteLoadingSpinner message="載入財務數據..." className="h-full min-h-[320px] p-8" />;
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#F8F5EC] px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* 返回按鈕 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <BackButton href="/aihome/teacher-link/create" label="返回管理面板" />
          </motion.div>

          {/* 導航欄 */}
          <FinancialManagementNavBar orgId={resolvedOrgId} />

          {/* 標題區域 */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white/80 backdrop-blur-md border border-[#EADBC8] rounded-3xl shadow-xl p-6 sm:p-8"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] rounded-3xl flex items-center justify-center shadow-lg">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <CurrencyDollarIcon className="w-8 h-8 text-white" />
                  </motion.div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-[#4B4036]">財務狀況管理</h1>
                  <p className="mt-2 text-sm sm:text-base text-[#2B3A3B]/70 max-w-3xl leading-relaxed">
                    管理機構的財務收支、課程收入和支出記錄。查看月度財務報表和課程統計。
                  </p>
                </div>
              </div>
            </div>
            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600 flex items-start gap-3">
                <p>{error}</p>
              </div>
            )}
          </motion.section>

          {/* 月份選擇器 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white/80 backdrop-blur-md border border-[#EADBC8] rounded-3xl shadow-xl p-6"
          >
            <div className="flex items-center gap-4">
              <label className="text-[#2B3A3B] font-semibold">選擇月份：</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 border border-[#EADBC8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD59A]"
              />
              <HanamiButton
                onClick={fetchFinancialData}
                variant="primary"
                disabled={loading}
              >
                {loading ? '載入中...' : '重新載入'}
              </HanamiButton>
            </div>
          </motion.div>

          {/* 收入計算說明 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="p-4 bg-blue-50 rounded-lg border border-blue-200"
          >
            <div className="text-sm text-blue-700">
              <strong>收入計算方式：</strong> 本月收入 = 常規課程收入 + 試堂收入
              <br />
              <span className="text-xs text-blue-600">
                常規課程：根據課程類型價格計算 | 試堂：每堂 HK$138
              </span>
            </div>
          </motion.div>
          
          {/* 財務概覽 - 帶圓形圖表 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* 收入/支出比例圓形圖表 */}
            <HanamiCard className="p-6 bg-gradient-to-br from-white to-[#FFF9F2]">
              <div className="flex items-center justify-center mb-4">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <ChartBarIcon className="w-6 h-6 text-[#FFB6C1] mr-2" />
                </motion.div>
                <h2 className="text-xl font-semibold text-[#2B3A3B]">財務概覽</h2>
              </div>
              <div className="flex flex-col items-center">
                <CircularChart
                  percentage={
                    financialData.totalIncome + financialData.totalExpenses > 0
                      ? (financialData.totalIncome / (financialData.totalIncome + financialData.totalExpenses)) * 100
                      : 0
                  }
                  size={180}
                  strokeWidth={16}
                  color="#10B981"
                  backgroundColor="#FEE2E2"
                  value={formatCurrency(financialData.totalIncome)}
                  label="本月收入"
                />
                <div className="mt-6 grid grid-cols-2 gap-4 w-full">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(financialData.totalIncome)}
                    </div>
                    <div className="text-xs text-[#2B3A3B] mt-1">收入</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-lg font-bold text-red-600">
                      {formatCurrency(financialData.totalExpenses)}
                    </div>
                    <div className="text-xs text-[#2B3A3B] mt-1">支出</div>
                  </div>
                </div>
                <div className="mt-4 w-full p-4 bg-gradient-to-r from-green-50 to-red-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#2B3A3B]">淨利潤</span>
                    <span className={`text-xl font-bold ${financialData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(financialData.netProfit)}
                    </span>
                  </div>
                </div>
              </div>
            </HanamiCard>

            {/* 統計卡片組 */}
            <div className="grid grid-cols-2 gap-4">
              <HanamiCard className="p-4 text-center bg-gradient-to-br from-blue-50 to-blue-100">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                  className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg"
                >
                  <CurrencyDollarIcon className="w-8 h-8 text-white" />
                </motion.div>
                <div className="text-2xl font-bold text-blue-600">
                  {financialData.studentCount}
                </div>
                <div className="text-sm text-[#2B3A3B] mt-1">常規學生</div>
              </HanamiCard>
              
              <HanamiCard className="p-4 text-center bg-gradient-to-br from-purple-50 to-purple-100">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.35, type: 'spring', stiffness: 200 }}
                  className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center shadow-lg"
                >
                  <PresentationChartLineIcon className="w-8 h-8 text-white" />
                </motion.div>
                <div className="text-2xl font-bold text-purple-600">
                  {financialData.activePackages}
                </div>
                <div className="text-sm text-[#2B3A3B] mt-1">活躍課程包</div>
              </HanamiCard>
              
              <HanamiCard className="p-4 text-center bg-gradient-to-br from-indigo-50 to-indigo-100">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
                  className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center shadow-lg"
                >
                  <ChartBarIcon className="w-8 h-8 text-white" />
                </motion.div>
                <div className="text-2xl font-bold text-indigo-600">
                  {financialData.courseTypeCount}
                </div>
                <div className="text-sm text-[#2B3A3B] mt-1">課程類型</div>
              </HanamiCard>
              
              <HanamiCard className="p-4 text-center bg-gradient-to-br from-teal-50 to-teal-100">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.45, type: 'spring', stiffness: 200 }}
                  className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center shadow-lg"
                >
                  <CurrencyDollarIcon className="w-8 h-8 text-white" />
                </motion.div>
                <div className="text-2xl font-bold text-teal-600">
                  {financialData.expectedLessons > 0 
                    ? `${((financialData.totalLessons / financialData.expectedLessons) * 100).toFixed(0)}%`
                    : '0%'
                  }
                </div>
                <div className="text-sm text-[#2B3A3B] mt-1">出席率</div>
              </HanamiCard>
            </div>

            {/* 收入/支出餅圖 */}
            <HanamiCard className="p-6 bg-gradient-to-br from-white to-[#FFF9F2]">
              <div className="flex items-center justify-center mb-4">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <PresentationChartLineIcon className="w-6 h-6 text-[#FFB6C1] mr-2" />
                </motion.div>
                <h2 className="text-xl font-semibold text-[#2B3A3B]">收支分析</h2>
              </div>
              <PieChart
                data={[
                  {
                    label: '收入',
                    value: financialData.totalIncome,
                    color: '#10B981'
                  },
                  {
                    label: '支出',
                    value: financialData.totalExpenses,
                    color: '#EF4444'
                  }
                ]}
                size={200}
                showLegend={true}
              />
            </HanamiCard>
          </motion.div>

          {/* 堂數統計概覽 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {/* 總堂數 */}
            <div className="p-6 bg-gradient-to-br from-[#F0F4F8] to-[#E2E8F0] rounded-2xl shadow-sm">
              <div className="text-3xl font-bold text-[#4A70E8] mb-2">
                {financialData.totalLessons}
              </div>
              <div className="text-lg font-semibold text-gray-800 mb-1">總堂數</div>
              <div className="text-sm text-gray-600">本月常規課程記錄</div>
            </div>
            
            {/* 試堂數 */}
            <div className="p-6 bg-gradient-to-br from-[#FFF8F0] to-[#FFE4CC] rounded-2xl shadow-sm">
              <div className="text-3xl font-bold text-[#FF7043] mb-2">
                {financialData.trialLessons}
              </div>
              <div className="text-lg font-semibold text-gray-800 mb-1">試堂數</div>
              <div className="text-sm text-gray-600">試堂表 + 課程表中的試堂記錄</div>
            </div>
            
            {/* 理應上堂數 */}
            <div className="p-6 bg-gradient-to-br from-[#F0F9FB] to-[#CCF2F7] rounded-2xl shadow-sm">
              <div className="text-3xl font-bold text-[#2196F3] mb-2">
                {financialData.expectedLessons}
              </div>
              <div className="text-lg font-semibold text-gray-800 mb-1">理應上堂數</div>
              <div className="text-sm text-gray-600">常規學生 × 週數 (每星期一堂)</div>
            </div>
            
            {/* 總課程數 */}
            <div className="p-6 bg-gradient-to-br from-[#FFF0F5] to-[#FFE6F0] rounded-2xl shadow-sm">
              <div className="text-3xl font-bold text-[#E91E63] mb-2">
                {financialData.totalLessons + financialData.trialLessons}
              </div>
              <div className="text-lg font-semibold text-gray-800 mb-1">總課程數</div>
              <div className="text-sm text-gray-600">常規課程 + 試堂</div>
            </div>
            
            {/* 出席率 */}
            <div className="p-6 bg-gradient-to-br from-[#FFFBF0] to-[#FFF3E0] rounded-2xl shadow-sm">
              <div className="text-3xl font-bold text-[#FFC107] mb-2">
                {financialData.expectedLessons > 0 ? ((financialData.totalLessons / financialData.expectedLessons) * 100).toFixed(1) : '0.0'}%
              </div>
              <div className="text-lg font-semibold text-gray-800 mb-1">出席率</div>
              <div className="text-sm text-gray-600">實際出席率</div>
            </div>
          </motion.div>

          {/* 堂數統計詳情 - 帶圓形圖表 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* 堂數統計詳情 */}
            <HanamiCard className="p-6">
              <div className="flex items-center justify-center mb-4">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <ChartBarIcon className="w-6 h-6 text-[#FFB6C1] mr-2" />
                </motion.div>
                <h2 className="text-xl font-semibold text-[#2B3A3B]">堂數統計詳情</h2>
              </div>
              <p className="text-sm text-gray-600 mb-6 text-center">
                數據來源：常規課程來自 hanami_student_lesson 表，試堂來自 hanami_trial_students 表（已根據當前機構過濾）
              </p>
              
              {/* 出席率圓形圖表 */}
              <div className="mb-6 flex justify-center">
                <CircularChart
                  percentage={
                    financialData.expectedLessons > 0
                      ? (financialData.totalLessons / financialData.expectedLessons) * 100
                      : 0
                  }
                  size={160}
                  strokeWidth={14}
                  color="#10B981"
                  backgroundColor="#E5E7EB"
                  value={`${financialData.expectedLessons > 0 
                    ? ((financialData.totalLessons / financialData.expectedLessons) * 100).toFixed(1)
                    : '0'
                  }%`}
                  label="出席率"
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg">
                  <div>
                    <div className="font-medium text-[#2B3A3B]">總堂數</div>
                    <div className="text-sm text-gray-600">本月常規課程記錄</div>
                  </div>
                  <div className="text-2xl font-bold text-indigo-600">
                    {financialData.totalLessons}
                  </div>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <div>
                    <div className="font-medium text-[#2B3A3B]">試堂數</div>
                    <div className="text-sm text-gray-600">試堂表 + 課程表中的試堂記錄</div>
                  </div>
                  <div className="text-2xl font-bold text-orange-600">
                    {financialData.trialLessons}
                  </div>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-cyan-50 rounded-lg">
                  <div>
                    <div className="font-medium text-[#2B3A3B]">理應上堂數</div>
                    <div className="text-sm text-gray-600">常規學生 × 週數</div>
                  </div>
                  <div className="text-2xl font-bold text-cyan-600">
                    {financialData.expectedLessons}
                  </div>
                </div>
              </div>
            </HanamiCard>

            {/* 不同課程的人數佔比 */}
            <HanamiCard className="p-6">
              <div className="flex items-center justify-center mb-6">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <PresentationChartLineIcon className="w-6 h-6 text-[#FFB6C1] mr-2" />
                </motion.div>
                <h2 className="text-xl font-semibold text-[#2B3A3B]">不同課程的人數佔比</h2>
              </div>
              {Object.keys(courseTypeDistribution).length > 0 ? (
                <div>
                  {/* 圓形圖表網格 */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-6">
                    {Object.entries(courseTypeDistribution)
                      .filter(([_, count]) => count > 0)
                      .map(([courseType, count], index) => {
                        const totalStudents = Object.values(courseTypeDistribution).reduce((sum, val) => sum + val, 0);
                        const percentage = totalStudents > 0 ? (count / totalStudents) * 100 : 0;
                        
                        // 為每個課程類型分配顏色
                        const colors = [
                          '#10B981', '#3B82F6', '#EF4444', '#A855F7', '#F97316', 
                          '#EAB308', '#06B6D4', '#8B5CF6', '#EC4899', '#14B8A6'
                        ];
                        const color = colors[index % colors.length];
                        
                        return (
                          <motion.div
                            key={courseType}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex flex-col items-center"
                          >
                            <CircularChart
                              percentage={percentage}
                              size={120}
                              strokeWidth={12}
                              color={color}
                              backgroundColor="#E5E7EB"
                              value={`${percentage.toFixed(1)}%`}
                              label={courseType || '未分類'}
                              showLabel={true}
                            />
                            <div className="mt-2 text-center">
                              <div className="text-lg font-semibold text-[#4B4036]">{count}</div>
                              <div className="text-xs text-gray-500">人</div>
                            </div>
                          </motion.div>
                        );
                      })}
                  </div>
                  
                  {/* 圖例 */}
                  <div className="mt-6 pt-6 border-t border-[#EADBC8]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.entries(courseTypeDistribution)
                        .filter(([_, count]) => count > 0)
                        .map(([courseType, count], index) => {
                          const totalStudents = Object.values(courseTypeDistribution).reduce((sum, val) => sum + val, 0);
                          const percentage = totalStudents > 0 ? (count / totalStudents) * 100 : 0;
                          
                          const colors = [
                            '#10B981', '#3B82F6', '#EF4444', '#A855F7', '#F97316', 
                            '#EAB308', '#06B6D4', '#8B5CF6', '#EC4899', '#14B8A6'
                          ];
                          const color = colors[index % colors.length];
                          
                          return (
                            <motion.div
                              key={courseType}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 + 0.3 }}
                              className="flex items-center justify-between p-2 bg-white/50 rounded-lg"
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: color }}
                                />
                                <span className="text-sm text-[#2B3A3B] font-medium">
                                  {courseType || '未分類'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-[#4B4036]">
                                  {count}
                                </span>
                                <span className="text-xs text-gray-500">
                                  ({percentage.toFixed(1)}%)
                                </span>
                              </div>
                            </motion.div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>暫無課程類型數據</p>
                </div>
              )}
            </HanamiCard>
          </motion.div>
        </div>
      </div>

    </>
  );
}

export default function FinancialManagementPage() {
  return (
    <TeacherLinkShell currentPath="/aihome/teacher-link/create/financial-management">
      <WithPermissionCheck pageKey="finance">
        <FinancialManagementContent />
      </WithPermissionCheck>
    </TeacherLinkShell>
  );
}
