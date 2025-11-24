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
import { CircularChart, PieChart } from '@/components/ui/CircularChart';
import FinancialManagementNavBar from '@/components/ui/FinancialManagementNavBar';

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

  const [financialData, setFinancialData] = useState<FinancialData>({
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
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [courseTypeDistribution, setCourseTypeDistribution] = useState<{ [key: string]: number }>({});
  const [trialStats, setTrialStats] = useState({
    fromTrialTable: 0,
    fromLessonTable: 0,
    total: 0
  });

  useEffect(() => {
    if (!organizationResolved || orgDataDisabled) {
      return;
    }

    if (!resolvedOrgId) {
      setLoading(false);
      return;
    }

    fetchFinancialData();
  }, [selectedMonth, resolvedOrgId, organizationResolved, orgDataDisabled]);

  const fetchFinancialData = async () => {
    if (!resolvedOrgId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 使用 getSupabaseClient 查詢主要數據庫中的表（Hanami_Student_Package 和 hanami_financial_expenses 在主要數據庫中）
      const supabase = getSupabaseClient();
      const [year, month] = selectedMonth.split('-');
      const startDate = `${year}-${month}-01`;
      const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().slice(0, 10);

      const userEmail = saasUser?.email || '';

      // 第一步：並行執行所有不依賴學生 ID 的查詢，同時獲取學生列表
      const [
        studentsResponse,
        expenseResult,
        trialResult,
        courseTypeResult
      ] = await Promise.all([
        // 獲取常規學生數量（使用 API 端點以繞過 RLS）
        fetch(
          `/api/students/list?orgId=${encodeURIComponent(resolvedOrgId)}&userEmail=${encodeURIComponent(userEmail)}&studentType=常規`
        ),
        // 獲取本月支出（根據 org_id 過濾，只選擇需要的字段）
        supabase
          .from('hanami_financial_expenses')
          .select('id, expense_date, expense_category, expense_description, amount, payment_method, receipt_url, notes, created_at, org_id')
          .gte('expense_date', startDate)
          .lte('expense_date', endDate)
          .eq('org_id', resolvedOrgId)
          .order('expense_date', { ascending: false }),
        
        // 獲取本月試堂學生記錄（根據 org_id 過濾）
        supabase
          .from('hanami_trial_students')
          .select('id, lesson_date, full_name, course_type')
          .gte('lesson_date', startDate)
          .lte('lesson_date', endDate)
          .eq('org_id', resolvedOrgId),
        
        // 獲取課程類型（根據 org_id 過濾，只選擇需要的字段）
        supabase
          .from('Hanami_CourseTypes')
          .select('id, name, status, trial_limit, price_per_lesson, created_at')
          .eq('status', true)
          .eq('org_id', resolvedOrgId)
          .order('name')
      ]);

      // 處理學生數據
      const studentsResult = await studentsResponse.json();
      const studentData = studentsResult.data || [];
      const studentIds = studentData.map((s: any) => s.id);

      // 處理支出數據
      if (expenseResult.error) throw expenseResult.error;
      const expenseData = expenseResult.data || [];

      // 處理試堂數據
      if (trialResult.error) throw trialResult.error;
      const trialData = trialResult.data || [];

      // 處理課程類型數據
      if (courseTypeResult.error) {
        console.error('獲取課程類型錯誤:', courseTypeResult.error);
      }
      const courseTypeData = (courseTypeResult.data || []) as CourseType[];

      // 第三步：並行執行依賴學生 ID 的查詢
      let packageData: Package[] = [];
      let lessonData: any[] = [];

      if (studentIds.length > 0) {
        const [
          packageResult,
          lessonResult
        ] = await Promise.all([
          // 查詢課程包（使用主要 Supabase 客戶端，只選擇需要的字段）
          supabase
            .from('Hanami_Student_Package')
            .select('id, course_name, price, total_lessons, remaining_lessons, status, student_id, full_name')
            .eq('status', 'active')
            .in('student_id', studentIds),
          
          // 獲取本月常規學生課程記錄（根據 org_id 過濾，只選擇需要的字段）
          supabase
            .from('hanami_student_lesson')
            .select('id, lesson_date, lesson_status, status, course_type, student_id, full_name, notes, remarks')
            .gte('lesson_date', startDate)
            .lte('lesson_date', endDate)
            .eq('org_id', resolvedOrgId)
            .in('student_id', studentIds)
        ]);

        // 處理課程包數據
        if (packageResult.error) {
          console.error('查詢課程包失敗:', packageResult.error);
          packageData = [];
        } else {
          packageData = (packageResult.data || []) as Package[];
          // 如果數據中有 org_id 欄位，在客戶端過濾
          if (packageData.length > 0 && (packageData[0] as any).org_id) {
            packageData = packageData.filter((pkg: any) => pkg.org_id === resolvedOrgId);
          }
        }

        // 處理課程記錄數據
        if (lessonResult.error) throw lessonResult.error;
        lessonData = lessonResult.data || [];
      }

      const typedCourseTypeData = courseTypeData;

      // 計算堂數統計
      const totalLessons = lessonData?.length || 0;
      const actualLessons = lessonData?.filter(lesson => 
        (lesson.lesson_status === 'attended' || lesson.lesson_status === 'completed') ||
        (lesson.status === 'attended' || lesson.status === 'completed')
      ).length || 0;
      
      // 試堂數：綜合統計
      const trialFromTrialTable = trialData?.length || 0;
      const trialFromLessonTable = lessonData?.filter(lesson => 
        lesson.lesson_status === 'trial' || 
        lesson.status === 'trial' ||
        lesson.course_type?.includes('試堂') ||
        lesson.full_name?.includes('試堂') ||
        lesson.notes?.includes('試堂') ||
        lesson.remarks?.includes('試堂')
      ).length || 0;
      const trialLessons = trialFromTrialTable + trialFromLessonTable;

      // 計算財務數據
      let regularIncome = 0;
      if (lessonData && typedCourseTypeData) {
        const courseTypePrices: { [key: string]: number } = {};
        typedCourseTypeData.forEach(courseType => {
          if (courseType.name && courseType.price_per_lesson) {
            courseTypePrices[courseType.name] = courseType.price_per_lesson;
          }
        });
        
        lessonData.forEach(lesson => {
          const isTrial = lesson.lesson_status === 'trial' || 
                         lesson.status === 'trial' ||
                         lesson.course_type?.includes('試堂') ||
                         lesson.full_name?.includes('試堂') ||
                         lesson.notes?.includes('試堂') ||
                         lesson.remarks?.includes('試堂');
          
          if (!isTrial) {
            const courseType = lesson.course_type || '鋼琴';
            const price = courseTypePrices[courseType] || 220;
            regularIncome += price;
          }
        });
      } else {
        const nonTrialLessons = lessonData?.filter(lesson => {
          const isTrial = lesson.lesson_status === 'trial' || 
                         lesson.status === 'trial' ||
                         lesson.course_type?.includes('試堂') ||
                         lesson.full_name?.includes('試堂') ||
                         lesson.notes?.includes('試堂') ||
                         lesson.remarks?.includes('試堂');
          return !isTrial;
        }).length || 0;
        regularIncome = nonTrialLessons * 220;
      }
      
      const trialIncome = trialLessons * 138;
      const totalIncome = regularIncome + trialIncome;
      const typedExpenseData = (expenseData || []) as Expense[];
      const totalExpenses = typedExpenseData.reduce((sum, exp) => sum + (exp.amount || 0), 0);
      const netProfit = totalIncome - totalExpenses;
      const studentCount = studentData?.length || 0;
      const activePackages = packageData?.length || 0;

      // 統計不同課程類型的人數佔比
      const courseTypeCounts: { [key: string]: number } = {};
      studentData.forEach((student: any) => {
        const courseType = student.course_type || student.student_course_type || '未分類';
        courseTypeCounts[courseType] = (courseTypeCounts[courseType] || 0) + 1;
      });

      const trialStats = {
        fromTrialTable: trialFromTrialTable,
        fromLessonTable: trialFromLessonTable,
        total: trialLessons
      };
      
      // 計算理應上堂數
      const firstDayOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
      const lastDayOfMonth = new Date(parseInt(year), parseInt(month), 0);
      const weeksInMonth = Math.ceil((lastDayOfMonth.getDate() - firstDayOfMonth.getDate() + 1) / 7);
      const expectedLessons = studentCount * weeksInMonth;

      setFinancialData({
        totalIncome,
        totalExpenses,
        netProfit,
        studentCount,
        activePackages,
        courseTypeCount: typedCourseTypeData.length,
        totalLessons,
        actualLessons,
        trialLessons,
        expectedLessons
      });

      setCourseTypeDistribution(courseTypeCounts);
      setTrialStats(trialStats);

    } catch (error) {
      console.error('獲取財務數據時發生錯誤:', error);
      setError('載入財務數據時發生錯誤');
    } finally {
      setLoading(false);
    }
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
              >
                重新載入
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
      <FinancialManagementContent />
    </TeacherLinkShell>
  );
}
