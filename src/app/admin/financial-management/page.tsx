'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { getUserSession } from '@/lib/authUtils';
import { useRouter } from 'next/navigation';
import { HanamiCard } from '@/components/ui/HanamiCard';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { FinanceIcon } from '@/components/ui/PermissionIcons';

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

export default function FinancialManagementPage() {
  const router = useRouter();
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
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [courseTypes, setCourseTypes] = useState<CourseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showPriceEditor, setShowPriceEditor] = useState(false);
  const [showCourseTypePriceEditor, setShowCourseTypePriceEditor] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [editingCourseType, setEditingCourseType] = useState<CourseType | null>(null);
  const [newPrice, setNewPrice] = useState(0);
  const [newCourseTypePrice, setNewCourseTypePrice] = useState(0);
  const [lessonStatusStats, setLessonStatusStats] = useState({
    attended: 0,
    completed: 0,
    absent: 0,
    cancelled: 0,
    makeup: 0,
    trial: 0,
    other: 0
  });
  const [trialStats, setTrialStats] = useState({
    fromTrialTable: 0,
    fromLessonTable: 0,
    total: 0
  });
  const [newExpense, setNewExpense] = useState({
    expense_date: new Date().toISOString().slice(0, 10),
    expense_category: '',
    expense_description: '',
    amount: 0,
    payment_method: '',
    notes: ''
  });

  // 支出分類選項
  const expenseCategories = [
    '租金', '水電費', '教材費', '教師薪資', '行政費用', '設備維護', '其他支出'
  ];

  // 付款方式選項
  const paymentMethods = [
    '現金', '銀行轉帳', '支票', '信用卡', '其他'
  ];

  useEffect(() => {
    // 檢查用戶權限
    const userSession = getUserSession();
    if (!userSession || userSession.role !== 'admin') {
      router.replace('/admin/login');
      return;
    }

    fetchFinancialData();
  }, [selectedMonth]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = getSupabaseClient();
      const [year, month] = selectedMonth.split('-');
      const startDate = `${year}-${month}-01`;
      const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().slice(0, 10);

      // 獲取本月收入（活躍課程包總價值）
      const { data: packageData, error: packageError } = await supabase
        .from('Hanami_Student_Package')
        .select(`
          id,
          course_name,
          price,
          total_lessons,
          remaining_lessons,
          status,
          student_id,
          full_name
        `)
        .eq('status', 'active');

      if (packageError) throw packageError;

      // 獲取本月支出
      const { data: expenseData, error: expenseError } = await supabase
        .from('hanami_financial_expenses')
        .select('*')
        .gte('expense_date', startDate)
        .lte('expense_date', endDate)
        .order('expense_date', { ascending: false });

      if (expenseError) throw expenseError;

      // 獲取常規學生數量
      const { data: studentData, error: studentError } = await supabase
        .from('Hanami_Students')
        .select('id')
        .eq('student_type', '常規');

      if (studentError) throw studentError;

      // 獲取本月常規學生課程記錄
      const { data: lessonData, error: lessonError } = await supabase
        .from('hanami_student_lesson')
        .select('id, lesson_date, lesson_status, status, course_type, student_id, full_name, notes, remarks')
        .gte('lesson_date', startDate)
        .lte('lesson_date', endDate);

      if (lessonError) throw lessonError;

      // 獲取本月試堂學生記錄（參考 Hanami 日曆邏輯）
      const { data: trialData, error: trialError } = await supabase
        .from('hanami_trial_students')
        .select('id, lesson_date, full_name, course_type')
        .gte('lesson_date', startDate)
        .lte('lesson_date', endDate);

      if (trialError) throw trialError;

      // 獲取課程類型
      const { data: courseTypeData, error: courseTypeError } = await supabase
        .from('Hanami_CourseTypes')
        .select('*')
        .eq('status', true)
        .order('name');

      if (courseTypeError) {
        console.error('獲取課程類型錯誤:', courseTypeError);
        throw courseTypeError;
      }

      console.log('課程類型數據:', courseTypeData);

      // 計算堂數統計（參考 Hanami 日曆邏輯）
      const totalLessons = lessonData?.length || 0;
      const actualLessons = lessonData?.filter(lesson => 
        (lesson.lesson_status === 'attended' || lesson.lesson_status === 'completed') ||
        (lesson.status === 'attended' || lesson.status === 'completed')
      ).length || 0;
      
      // 試堂數：綜合統計
      // 1. 從 hanami_trial_students 表獲取
      const trialFromTrialTable = trialData?.length || 0;
      
      // 2. 從 hanami_student_lesson 表中篩選試堂相關記錄
      const trialFromLessonTable = lessonData?.filter(lesson => 
        lesson.lesson_status === 'trial' || 
        lesson.status === 'trial' ||
        lesson.course_type?.includes('試堂') ||
        lesson.full_name?.includes('試堂') ||
        lesson.notes?.includes('試堂') ||
        lesson.remarks?.includes('試堂')
      ).length || 0;
      
      // 3. 總試堂數
      const trialLessons = trialFromTrialTable + trialFromLessonTable;

      // 計算財務數據
      // 本月收入 = 常規課程收入 + 試堂收入
      const lessonCount = lessonData?.length || 0;
      
      // 根據課程類型計算常規課程收入
      let regularIncome = 0;
      if (lessonData && courseTypeData) {
        // 建立課程類型價格映射
        const courseTypePrices: { [key: string]: number } = {};
        courseTypeData.forEach(courseType => {
          if (courseType.name && courseType.price_per_lesson) {
            courseTypePrices[courseType.name] = courseType.price_per_lesson;
          }
        });
        
        // 計算每堂課的收入（排除試堂）
        lessonData.forEach(lesson => {
          // 檢查是否為試堂
          const isTrial = lesson.lesson_status === 'trial' || 
                         lesson.status === 'trial' ||
                         lesson.course_type?.includes('試堂') ||
                         lesson.full_name?.includes('試堂') ||
                         lesson.notes?.includes('試堂') ||
                         lesson.remarks?.includes('試堂');
          
          if (!isTrial) {
            const courseType = lesson.course_type || '鋼琴'; // 預設為鋼琴
            const price = courseTypePrices[courseType] || 220; // 預設價格220元
            regularIncome += price;
          }
        });
      } else {
        // 如果沒有課程類型數據，使用預設價格（排除試堂）
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
      
      // 計算試堂收入（試堂數 × 138元）
      const trialIncome = trialLessons * 138;
      
      // 總收入 = 常規課程收入 + 試堂收入
      const totalIncome = regularIncome + trialIncome;
      
      const totalExpenses = expenseData?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;
      const netProfit = totalIncome - totalExpenses;
      const studentCount = studentData?.length || 0;
      const activePackages = packageData?.length || 0;

      // 統計各種課程狀態（同時檢查 lesson_status 和 status 欄位）
      const newLessonStatusStats = {
        attended: lessonData?.filter(lesson => 
          lesson.lesson_status === 'attended' || lesson.status === 'attended'
        ).length || 0,
        completed: lessonData?.filter(lesson => 
          lesson.lesson_status === 'completed' || lesson.status === 'completed'
        ).length || 0,
        absent: lessonData?.filter(lesson => 
          lesson.lesson_status === 'absent' || lesson.status === 'absent'
        ).length || 0,
        cancelled: lessonData?.filter(lesson => 
          lesson.lesson_status === 'cancelled' || lesson.status === 'cancelled'
        ).length || 0,
        makeup: lessonData?.filter(lesson => 
          lesson.lesson_status === 'makeup' || lesson.status === 'makeup'
        ).length || 0,
        trial: lessonData?.filter(lesson => 
          lesson.lesson_status === 'trial' || lesson.status === 'trial'
        ).length || 0,
        other: lessonData?.filter(lesson => {
          const lessonStatus = lesson.lesson_status || lesson.status || '';
          return !['attended', 'completed', 'absent', 'cancelled', 'makeup', 'trial'].includes(lessonStatus);
        }).length || 0
      };

      // 試堂數詳細統計
      const trialStats = {
        fromTrialTable: trialFromTrialTable,
        fromLessonTable: trialFromLessonTable,
        total: trialLessons
      };
      
      // 計算理應上堂數（每星期一堂，基於常規學生數量）
      const currentDate = new Date();
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
        courseTypeCount: courseTypeData?.length || 0,
        totalLessons,
        actualLessons,
        trialLessons,
        expectedLessons
      });

      setExpenses(expenseData || []);
      setPackages(packageData || []);
      setCourseTypes(courseTypeData || []);
      setLessonStatusStats(newLessonStatusStats);
      setTrialStats(trialStats);
      
      // 保存試堂統計數據供調試使用
      console.log('試堂數統計:', {
        fromTrialTable: trialFromTrialTable,
        fromLessonTable: trialFromLessonTable,
        total: trialLessons,
        trialData: trialData,
        lessonDataWithTrial: lessonData?.filter(lesson => 
          lesson.lesson_status === 'trial' || 
          lesson.status === 'trial' ||
          lesson.course_type?.includes('試堂') ||
          lesson.full_name?.includes('試堂') ||
          lesson.notes?.includes('試堂') ||
          lesson.remarks?.includes('試堂')
        )
      });

    } catch (error) {
      console.error('獲取財務數據時發生錯誤:', error);
      setError('載入財務數據時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async () => {
    try {
      if (!newExpense.expense_category || !newExpense.expense_description || newExpense.amount <= 0) {
        alert('請填寫完整的支出資訊');
        return;
      }

      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('hanami_financial_expenses')
        .insert({
          expense_date: newExpense.expense_date,
          expense_category: newExpense.expense_category,
          expense_description: newExpense.expense_description,
          amount: newExpense.amount,
          payment_method: newExpense.payment_method,
          notes: newExpense.notes || null
        });

      if (error) throw error;

      // 重置表單並重新載入數據
      setNewExpense({
        expense_date: new Date().toISOString().slice(0, 10),
        expense_category: '',
        expense_description: '',
        amount: 0,
        payment_method: '',
        notes: ''
      });
      setShowAddExpense(false);
      fetchFinancialData();

    } catch (error) {
      console.error('新增支出時發生錯誤:', error);
      alert('新增支出失敗');
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('確定要刪除這筆支出記錄嗎？')) return;

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('hanami_financial_expenses')
        .delete()
        .eq('id', expenseId);

      if (error) throw error;

      fetchFinancialData();
    } catch (error) {
      console.error('刪除支出時發生錯誤:', error);
      alert('刪除支出失敗');
    }
  };

  const handleEditPrice = (pkg: Package) => {
    setEditingPackage(pkg);
    setNewPrice(pkg.price);
    setShowPriceEditor(true);
  };

  const handleUpdatePrice = async () => {
    if (!editingPackage || newPrice <= 0) {
      alert('請輸入有效的價格');
      return;
    }

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('Hanami_Student_Package')
        .update({ price: newPrice })
        .eq('id', editingPackage.id);

      if (error) throw error;

      alert('價格更新成功！');
      setShowPriceEditor(false);
      setEditingPackage(null);
      setNewPrice(0);
      fetchFinancialData();
    } catch (error) {
      console.error('更新價格時發生錯誤:', error);
      alert('更新價格失敗');
    }
  };

  const handleEditCourseTypePrice = (courseType: CourseType) => {
    setEditingCourseType(courseType);
    setNewCourseTypePrice(courseType.price_per_lesson || 0);
    setShowCourseTypePriceEditor(true);
  };

  const handleUpdateCourseTypePrice = async () => {
    if (!editingCourseType || newCourseTypePrice < 0) {
      alert('請輸入有效的價格');
      return;
    }

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('Hanami_CourseTypes')
        .update({ price_per_lesson: newCourseTypePrice })
        .eq('id', editingCourseType.id);

      if (error) throw error;

      alert('課程類型價格更新成功！');
      setShowCourseTypePriceEditor(false);
      setEditingCourseType(null);
      setNewCourseTypePrice(0);
      fetchFinancialData();
    } catch (error) {
      console.error('更新課程類型價格時發生錯誤:', error);
      alert('更新課程類型價格失敗');
    }
  };

  // 獲取課程類型的統計資訊
  const getCourseTypeStats = (courseTypeName: string) => {
    const packagesForType = packages.filter(pkg => pkg.course_name === courseTypeName);
    const totalValue = packagesForType.reduce((sum, pkg) => sum + pkg.price, 0);
    const totalLessons = packagesForType.reduce((sum, pkg) => sum + pkg.total_lessons, 0);
    const remainingLessons = packagesForType.reduce((sum, pkg) => sum + pkg.remaining_lessons, 0);
    
    return {
      packageCount: packagesForType.length,
      totalValue,
      totalLessons,
      remainingLessons
    };
  };

  // 獲取課程類型的柔和顏色主題
  const getCourseTypeTheme = (courseTypeName: string) => {
    const themes = {
      '鋼琴': {
        bg: 'from-[#F0F4F8] to-[#E2E8F0]',
        text: 'text-gray-800',
        priceBg: 'bg-white',
        priceText: 'text-[#4A70E8]',
        border: 'border-[#CBD5E0]'
      },
      '音樂專注力': {
        bg: 'from-[#F0FBF5] to-[#E0F2E0]',
        text: 'text-gray-800',
        priceBg: 'bg-white',
        priceText: 'text-[#4CAF50]',
        border: 'border-[#C6F6D5]'
      },
      '小提琴': {
        bg: 'from-[#FFF8F0] to-[#FFE4CC]',
        text: 'text-gray-800',
        priceBg: 'bg-white',
        priceText: 'text-[#FF7043]',
        border: 'border-[#FED7AA]'
      },
      '大提琴': {
        bg: 'from-[#F0F9FB] to-[#CCF2F7]',
        text: 'text-gray-800',
        priceBg: 'bg-white',
        priceText: 'text-[#2196F3]',
        border: 'border-[#B3E5FC]'
      },
      '長笛': {
        bg: 'from-[#FFF0F5] to-[#FFE6F0]',
        text: 'text-gray-800',
        priceBg: 'bg-white',
        priceText: 'text-[#E91E63]',
        border: 'border-[#FCE4EC]'
      },
      '吉他': {
        bg: 'from-[#FFFBF0] to-[#FFF3E0]',
        text: 'text-gray-800',
        priceBg: 'bg-white',
        priceText: 'text-[#FFC107]',
        border: 'border-[#FFE082]'
      },
      '鼓組': {
        bg: 'from-[#FEF2F2] to-[#FEE2E2]',
        text: 'text-gray-800',
        priceBg: 'bg-white',
        priceText: 'text-[#F44336]',
        border: 'border-[#FECACA]'
      },
      '聲樂': {
        bg: 'from-[#F3E8FF] to-[#E9D5FF]',
        text: 'text-gray-800',
        priceBg: 'bg-white',
        priceText: 'text-[#9C27B0]',
        border: 'border-[#DDD6FE]'
      }
    };
    
    return themes[courseTypeName as keyof typeof themes] || {
      bg: 'from-[#F7FAFC] to-[#EDF2F7]',
      text: 'text-gray-800',
      priceBg: 'bg-white',
      priceText: 'text-[#718096]',
      border: 'border-[#E2E8F0]'
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-HK', {
      style: 'currency',
      currency: 'HKD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FFF9F2]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD59A] mx-auto" />
          <p className="mt-4 text-[#2B3A3B]">載入財務數據...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 bg-[#FFF9F2] min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* 頁面標題 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FinanceIcon className="w-8 h-8 text-[#FFD59A]" />
            <h1 className="text-3xl font-bold text-[#2B3A3B]">財務狀況管理</h1>
          </div>
          <HanamiButton
            onClick={() => router.push('/admin')}
            variant="secondary"
          >
            返回管理面板
          </HanamiButton>
        </div>

        {error && (
          <HanamiCard className="mb-6 p-4 bg-red-50 border-red-200">
            <p className="text-red-700">{error}</p>
          </HanamiCard>
        )}

        {/* 月份選擇器 */}
        <HanamiCard className="mb-6 p-4">
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
        </HanamiCard>

        {/* 收入計算說明 */}
        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-700">
            <strong>收入計算方式：</strong> 本月收入 = 常規課程收入 + 試堂收入
            <br />
            <span className="text-xs text-blue-600">
              常規課程：根據課程類型價格計算 | 試堂：每堂 HK$138
            </span>
          </div>
        </div>
        
        {/* 財務概覽 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <HanamiCard className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(financialData.totalIncome)}
            </div>
            <div className="text-sm text-[#2B3A3B]">本月收入</div>
          </HanamiCard>
          
          <HanamiCard className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(financialData.totalExpenses)}
            </div>
            <div className="text-sm text-[#2B3A3B]">本月支出</div>
          </HanamiCard>
          
          <HanamiCard className="p-4 text-center">
            <div className={`text-2xl font-bold ${financialData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(financialData.netProfit)}
            </div>
            <div className="text-sm text-[#2B3A3B]">淨利潤</div>
          </HanamiCard>
          
          <HanamiCard className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {financialData.studentCount}
            </div>
            <div className="text-sm text-[#2B3A3B]">常規學生</div>
          </HanamiCard>
          
          <HanamiCard className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {financialData.activePackages}
            </div>
            <div className="text-sm text-[#2B3A3B]">活躍課程包</div>
          </HanamiCard>

          <HanamiCard className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {financialData.courseTypeCount}
            </div>
            <div className="text-sm text-[#2B3A3B]">課程類型</div>
          </HanamiCard>
        </div>

        {/* 堂數統計概覽 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {/* 總堂數 */}
          <div className="p-6 bg-gradient-to-br from-[#F0F4F8] to-[#E2E8F0] rounded-2xl shadow-sm">
            <div className="text-3xl font-bold text-[#4A70E8] mb-2">
              {financialData.totalLessons}
            </div>
            <div className="text-lg font-semibold text-gray-800 mb-1">總堂數</div>
            <div className="text-sm text-gray-600">本月常規課程記錄</div>
          </div>
          
          {/* 實際上堂數 */}
          <div className="p-6 bg-gradient-to-br from-[#F0FBF5] to-[#E0F2E0] rounded-2xl shadow-sm">
            <div className="text-3xl font-bold text-[#4CAF50] mb-2">
              {financialData.actualLessons}
            </div>
            <div className="text-lg font-semibold text-gray-800 mb-1">實際上堂數</div>
            <div className="text-sm text-gray-600">狀態為 attended/completed 的課程</div>
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
        </div>

        {/* 支出管理和堂數統計 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 支出列表 */}
          <HanamiCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-[#2B3A3B]">支出管理</h2>
              <HanamiButton
                onClick={() => setShowAddExpense(true)}
                variant="primary"
                size="sm"
              >
                新增支出
              </HanamiButton>
            </div>

            {expenses.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {expenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-[#2B3A3B]">{expense.expense_description}</div>
                      <div className="text-sm text-gray-600">
                        {expense.expense_category} • {expense.expense_date}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-red-600">
                        {formatCurrency(expense.amount)}
                      </span>
                      <HanamiButton
                        onClick={() => handleDeleteExpense(expense.id)}
                        variant="danger"
                        size="sm"
                      >
                        刪除
                      </HanamiButton>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                本月尚無支出記錄
              </div>
            )}
          </HanamiCard>

          {/* 堂數統計詳情 */}
          <HanamiCard className="p-6">
            <h2 className="text-xl font-semibold text-[#2B3A3B] mb-4">堂數統計詳情</h2>
            <p className="text-sm text-gray-600 mb-4">
              數據來源：常規課程來自 hanami_student_lesson 表，試堂來自 hanami_trial_students 表
            </p>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg">
                <div>
                  <div className="font-medium text-[#2B3A3B]">總堂數</div>
                  <div className="text-sm text-gray-600">本月常規課程記錄</div>
                </div>
                <div className="text-2xl font-bold text-indigo-600">
                  {financialData.totalLessons}
                </div>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-teal-50 rounded-lg">
                <div>
                  <div className="font-medium text-[#2B3A3B]">實際上堂數</div>
                  <div className="text-sm text-gray-600">狀態為 attended/completed 的課程</div>
                </div>
                <div className="text-2xl font-bold text-teal-600">
                  {financialData.actualLessons}
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
              
              <div className="flex justify-between items-center p-3 bg-pink-50 rounded-lg">
                <div>
                  <div className="font-medium text-[#2B3A3B]">總課程數</div>
                  <div className="text-sm text-gray-600">常規課程 + 試堂</div>
                </div>
                <div className="text-2xl font-bold text-pink-600">
                  {financialData.totalLessons + financialData.trialLessons}
                </div>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <div>
                  <div className="font-medium text-[#2B3A3B]">出席率</div>
                  <div className="text-sm text-gray-600">總堂數 / 理應上堂</div>
                </div>
                <div className="text-2xl font-bold text-yellow-600">
                  {financialData.expectedLessons > 0 
                    ? `${((financialData.totalLessons / financialData.expectedLessons) * 100).toFixed(1)}%`
                    : '0%'
                  }
                </div>
              </div>
            </div>

            {/* 試堂數詳細統計 */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-[#2B3A3B] mb-3">試堂數詳細統計</h3>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                  <span className="text-sm text-[#2B3A3B]">試堂表</span>
                  <span className="font-semibold text-blue-600">{trialStats?.fromTrialTable || 0}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                  <span className="text-sm text-[#2B3A3B]">課程表</span>
                  <span className="font-semibold text-green-600">{trialStats?.fromLessonTable || 0}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
                  <span className="text-sm text-[#2B3A3B]">總計</span>
                  <span className="font-semibold text-orange-600">{trialStats?.total || 0}</span>
                </div>
              </div>
            </div>

            {/* 課程狀態統計 */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-[#2B3A3B] mb-3">課程狀態統計</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                  <span className="text-sm text-[#2B3A3B]">已出席</span>
                  <span className="font-semibold text-green-600">{lessonStatusStats.attended}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                  <span className="text-sm text-[#2B3A3B]">已完成</span>
                  <span className="font-semibold text-blue-600">{lessonStatusStats.completed}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                  <span className="text-sm text-[#2B3A3B]">缺席</span>
                  <span className="font-semibold text-red-600">{lessonStatusStats.absent}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm text-[#2B3A3B]">取消</span>
                  <span className="font-semibold text-gray-600">{lessonStatusStats.cancelled}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                  <span className="text-sm text-[#2B3A3B]">補課</span>
                  <span className="font-semibold text-purple-600">{lessonStatusStats.makeup}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
                  <span className="text-sm text-[#2B3A3B]">試堂</span>
                  <span className="font-semibold text-orange-600">{lessonStatusStats.trial}</span>
                </div>
                {lessonStatusStats.other > 0 && (
                  <div className="flex justify-between items-center p-2 bg-yellow-50 rounded col-span-2">
                    <span className="text-sm text-[#2B3A3B]">其他狀態</span>
                    <span className="font-semibold text-yellow-600">{lessonStatusStats.other}</span>
                  </div>
                )}
              </div>
            </div>
          </HanamiCard>

          {/* 課程類型管理 */}
          <HanamiCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-[#2B3A3B]">課程類型管理</h2>
              <div className="flex gap-2">
                <HanamiButton
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/check-course-type-schema');
                      const result = await response.json();
                      console.log('表結構檢查結果:', result);
                      alert('檢查完成，請查看控制台');
                    } catch (error) {
                      console.error('檢查失敗:', error);
                      alert('檢查失敗');
                    }
                  }}
                  variant="secondary"
                  size="sm"
                >
                  檢查表結構
                </HanamiButton>
                <HanamiButton
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/add-price-per-lesson-column', {
                        method: 'POST'
                      });
                      const result = await response.json();
                      console.log('添加欄位結果:', result);
                      if (result.success) {
                        alert(result.message);
                        fetchFinancialData();
                      } else {
                        alert('添加欄位失敗: ' + result.error);
                      }
                    } catch (error) {
                      console.error('添加欄位失敗:', error);
                      alert('添加欄位失敗');
                    }
                  }}
                  variant="primary"
                  size="sm"
                >
                  添加價格欄位
                </HanamiButton>
              </div>
            </div>
            

            
            {courseTypes.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {courseTypes.map((courseType) => {
                  const theme = getCourseTypeTheme(courseType.name || '其他');
                  return (
                    <div key={courseType.id} className={`flex items-center justify-between p-6 bg-gradient-to-br ${theme.bg} rounded-2xl shadow-sm border ${theme.border} hover:shadow-md transition-all duration-200`}>
                      <div className="flex items-center gap-6">
                        <div className={`font-bold ${theme.text} text-2xl`}>
                          {courseType.name}
                        </div>
                        <div className={`px-6 py-3 ${theme.priceBg} rounded-xl ${theme.priceText} font-semibold text-xl shadow-sm border ${theme.border}`}>
                          {courseType.price_per_lesson ? formatCurrency(courseType.price_per_lesson) : '未設定價格'}
                        </div>
                      </div>
                      <HanamiButton
                        onClick={() => handleEditCourseTypePrice(courseType)}
                        variant="secondary"
                        size="md"
                        className="bg-white/80 hover:bg-white text-gray-700 border-gray-300 shadow-sm"
                      >
                        設定價格
                      </HanamiButton>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                尚無課程類型
              </div>
            )}
          </HanamiCard>

          {/* 課程包收入詳情 */}
          <HanamiCard className="p-6">
            <h2 className="text-xl font-semibold text-[#2B3A3B] mb-4">課程包收入詳情</h2>
            
            {packages.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {packages.map((pkg) => (
                  <div key={pkg.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-[#2B3A3B]">{pkg.course_name}</div>
                      <div className="text-sm text-gray-600">
                        {pkg.full_name} • 剩餘 {pkg.remaining_lessons}/{pkg.total_lessons} 堂
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="font-semibold text-green-600">
                          {formatCurrency(pkg.price)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {pkg.status === 'active' ? '使用中' : '暫停'}
                        </div>
                      </div>
                      <HanamiButton
                        onClick={() => handleEditPrice(pkg)}
                        variant="secondary"
                        size="sm"
                      >
                        編輯價格
                      </HanamiButton>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                尚無活躍課程包
              </div>
            )}
          </HanamiCard>
        </div>

        {/* 課程類型價格編輯模態框 */}
        {showCourseTypePriceEditor && editingCourseType && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="p-6 w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200">
              <h3 className="text-lg font-semibold text-[#2B3A3B] mb-4">設定課程類型價格</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#2B3A3B] mb-1">課程名稱</label>
                  <div className="p-2 bg-gray-50 rounded text-sm">
                    {editingCourseType.name}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2B3A3B] mb-1">當前每堂價格</label>
                  <div className="p-2 bg-gray-50 rounded text-sm">
                    {editingCourseType.price_per_lesson ? formatCurrency(editingCourseType.price_per_lesson) : '未設定'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2B3A3B] mb-1">新每堂價格</label>
                  <input
                    type="number"
                    value={newCourseTypePrice}
                    onChange={(e) => setNewCourseTypePrice(parseFloat(e.target.value) || 0)}
                    placeholder="請輸入每堂價格"
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD59A]"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <HanamiButton
                  onClick={handleUpdateCourseTypePrice}
                  variant="primary"
                  className="flex-1"
                >
                  更新價格
                </HanamiButton>
                <HanamiButton
                  onClick={() => {
                    setShowCourseTypePriceEditor(false);
                    setEditingCourseType(null);
                    setNewCourseTypePrice(0);
                  }}
                  variant="secondary"
                  className="flex-1"
                >
                  取消
                </HanamiButton>
              </div>
            </div>
          </div>
        )}

        {/* 價格編輯模態框 */}
        {showPriceEditor && editingPackage && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="p-6 w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200">
              <h3 className="text-lg font-semibold text-[#2B3A3B] mb-4">編輯課程包價格</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#2B3A3B] mb-1">課程名稱</label>
                  <div className="p-2 bg-gray-50 rounded text-sm">
                    {editingPackage.course_name}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2B3A3B] mb-1">學生姓名</label>
                  <div className="p-2 bg-gray-50 rounded text-sm">
                    {editingPackage.full_name}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2B3A3B] mb-1">當前價格</label>
                  <div className="p-2 bg-gray-50 rounded text-sm">
                    {formatCurrency(editingPackage.price)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2B3A3B] mb-1">新價格</label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(parseFloat(e.target.value) || 0)}
                    placeholder="請輸入新價格"
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD59A]"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <HanamiButton
                  onClick={handleUpdatePrice}
                  variant="primary"
                  className="flex-1"
                >
                  更新價格
                </HanamiButton>
                <HanamiButton
                  onClick={() => {
                    setShowPriceEditor(false);
                    setEditingPackage(null);
                    setNewPrice(0);
                  }}
                  variant="secondary"
                  className="flex-1"
                >
                  取消
                </HanamiButton>
              </div>
            </div>
          </div>
        )}

        {/* 新增支出表單 */}
        {showAddExpense && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="p-6 w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200">
              <h3 className="text-lg font-semibold text-[#2B3A3B] mb-4">新增支出</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#2B3A3B] mb-1">支出日期</label>
                  <input
                    type="date"
                    value={newExpense.expense_date}
                    onChange={(e) => setNewExpense({...newExpense, expense_date: e.target.value})}
                    className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD59A]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2B3A3B] mb-1">支出分類</label>
                  <select
                    value={newExpense.expense_category}
                    onChange={(e) => setNewExpense({...newExpense, expense_category: e.target.value})}
                    className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD59A]"
                  >
                    <option value="">請選擇分類</option>
                    {expenseCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2B3A3B] mb-1">支出描述</label>
                  <input
                    type="text"
                    value={newExpense.expense_description}
                    onChange={(e) => setNewExpense({...newExpense, expense_description: e.target.value})}
                    placeholder="請輸入支出描述"
                    className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD59A]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2B3A3B] mb-1">金額</label>
                  <input
                    type="number"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({...newExpense, amount: parseFloat(e.target.value) || 0})}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD59A]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2B3A3B] mb-1">付款方式</label>
                  <select
                    value={newExpense.payment_method}
                    onChange={(e) => setNewExpense({...newExpense, payment_method: e.target.value})}
                    className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD59A]"
                  >
                    <option value="">請選擇付款方式</option>
                    {paymentMethods.map(method => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2B3A3B] mb-1">備註</label>
                  <textarea
                    value={newExpense.notes}
                    onChange={(e) => setNewExpense({...newExpense, notes: e.target.value})}
                    placeholder="可選的備註"
                    rows={3}
                    className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD59A]"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <HanamiButton
                  onClick={handleAddExpense}
                  variant="primary"
                  className="flex-1"
                >
                  新增支出
                </HanamiButton>
                <HanamiButton
                  onClick={() => setShowAddExpense(false)}
                  variant="secondary"
                  className="flex-1"
                >
                  取消
                </HanamiButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
