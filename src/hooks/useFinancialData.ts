import useSWR from 'swr';
import { getSupabaseClient } from '@/lib/supabase';

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

interface FinancialData {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  expenses: Expense[];
  trialStudents: any[];
  courseTypes: any[];
  regularStudents: any[];
}

const fetchFinancialData = async (
  orgId: string | null,
  userEmail: string,
  selectedMonth: string
): Promise<FinancialData> => {
  if (!orgId || !userEmail) {
    return {
      totalIncome: 0,
      totalExpenses: 0,
      netIncome: 0,
      expenses: [],
      trialStudents: [],
      courseTypes: [],
      regularStudents: [],
    };
  }

  const supabase = getSupabaseClient();
  const [year, month] = selectedMonth.split('-');
  const startDate = `${year}-${month}-01`;
  const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().slice(0, 10);

  // 并行获取所有数据
  const [
    studentsResponse,
    expenseResult,
    trialResult,
    courseTypeResult
  ] = await Promise.all([
    fetch(
      `/api/students/list?orgId=${encodeURIComponent(orgId)}&userEmail=${encodeURIComponent(userEmail)}&studentType=常規`
    ),
    supabase
      .from('hanami_financial_expenses')
      .select('id, expense_date, expense_category, expense_description, amount, payment_method, receipt_url, notes, created_at, org_id')
      .gte('expense_date', startDate)
      .lte('expense_date', endDate)
      .eq('org_id', orgId)
      .order('expense_date', { ascending: false }),
    supabase
      .from('hanami_trial_students')
      .select('id, lesson_date, full_name, course_type')
      .gte('lesson_date', startDate)
      .lte('lesson_date', endDate)
      .eq('org_id', orgId),
    supabase
      .from('Hanami_CourseTypes')
      .select('id, name, status, trial_limit, price_per_lesson, created_at')
      .eq('status', true)
      .eq('org_id', orgId)
      .order('name')
  ]);

  const studentsResult = await studentsResponse.json();
  const regularStudents = studentsResult.data || [];
  const expenses: Expense[] = expenseResult.data || [];
  const trialStudents = trialResult.data || [];
  const courseTypes = courseTypeResult.data || [];

  // 计算总收入（这里需要根据实际业务逻辑计算）
  const totalIncome = 0; // TODO: 根据实际业务逻辑计算

  // 计算总支出
  const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);

  return {
    totalIncome,
    totalExpenses,
    netIncome: totalIncome - totalExpenses,
    expenses,
    trialStudents,
    courseTypes,
    regularStudents,
  };
};

export function useFinancialData(
  orgId: string | null,
  userEmail: string,
  selectedMonth: string
) {
  const { data, error, isLoading, mutate } = useSWR<FinancialData>(
    orgId && userEmail && selectedMonth ? ['financial-data', orgId, userEmail, selectedMonth] : null,
    () => fetchFinancialData(orgId!, userEmail, selectedMonth),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 60秒内去重
      refreshInterval: 300000, // 5分钟自动刷新
      keepPreviousData: true,
    }
  );

  return {
    data: data || {
      totalIncome: 0,
      totalExpenses: 0,
      netIncome: 0,
      expenses: [],
      trialStudents: [],
      courseTypes: [],
      regularStudents: [],
    },
    isLoading,
    error,
    mutate,
  };
}

