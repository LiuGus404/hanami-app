'use client';

import { useState, useEffect, useMemo } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { ArrowTrendingUpIcon, PresentationChartLineIcon, CurrencyDollarIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { HanamiCard } from '@/components/ui/HanamiCard';
import { HanamiButton } from '@/components/ui/HanamiButton';
import BackButton from '@/components/ui/BackButton';
import { TeacherLinkShell, useTeacherLinkOrganization } from '../../TeacherLinkShell';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import CuteLoadingSpinner from '@/components/ui/CuteLoadingSpinner';
import { WithPermissionCheck } from '@/components/teacher-link/withPermissionCheck';
import { createPortal } from 'react-dom';
import FinancialManagementNavBar from '@/components/ui/FinancialManagementNavBar';

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

interface Income {
  id: string;
  income_date: string;
  income_category: string;
  income_description: string;
  amount: number;
  payment_method: string | null;
  receipt_url: string | null;
  notes: string | null;
  created_at: string | null;
  org_id?: string | null;
}

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

function IncomeManagementContent() {
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

  const [packages, setPackages] = useState<Package[]>([]);
  const [courseTypes, setCourseTypes] = useState<CourseType[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [showPriceEditor, setShowPriceEditor] = useState(false);
  const [showCourseTypePriceEditor, setShowCourseTypePriceEditor] = useState(false);
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [showEditIncome, setShowEditIncome] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [editingCourseType, setEditingCourseType] = useState<CourseType | null>(null);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [newPrice, setNewPrice] = useState(0);
  const [newCourseTypePrice, setNewCourseTypePrice] = useState(0);
  const [newIncome, setNewIncome] = useState({
    income_date: new Date().toISOString().slice(0, 10),
    income_category: '',
    income_description: '',
    amount: 0,
    payment_method: '',
    notes: ''
  });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 收入分類選項（包含分類標題作為分隔）
  const incomeCategories = [
    '────────── 一、主要收入（Core Revenue） ──────────',
    '課堂收入（Lesson Revenue）',
    '產品銷售（Product Sales）',
    '服務收入（Service Fee）',
    '專案收入（Project Income）',
    '訂閱收入（Subscription）',
    '顧問服務、專業諮詢（Consultation）',
    '内容創作收入（Content Monetization）',
    '表演、活動收入（Performance/Event Income）',
    '租場收入（Location Rental）',
    '工程或開發收入（Development Fee）',
    '────────── 二、附加收入（Extra Revenue） ──────────',
    '補堂費用（Make-up Lesson Fee）',
    '加購服務（Add-on Services）',
    '課後照顧/延時費（After-class Care Fee）',
    '設備租借費（Equipment Rental）',
    '運費收入（Shipping Fee）',
    '上門費（On-site Fee）',
    '小組/團體活動收入（Group Activity Income）',
    '────────── 三、金融收入（Financial Income） ──────────',
    '投資收益（Investment Return）',
    '利息收入（Interest Income）',
    '分潤收入（Profit-sharing）',
    '股息（Dividends）',
    '────────── 四、雜項收入（Miscellaneous Income） ──────────',
    '贈款/捐款（Donation）',
    '退款收入（Refund Return）',
    '補助金（Subsidy/Grant）',
    '其他未分類收入（Other Income）'
  ];

  // 付款方式選項
  const paymentMethods = [
    '電子錢包（E-Wallet）',
    '銀行轉賬（Bank Transfer）',
    '信用卡（Credit/Debit Card）',
    '現金（Cash）',
    '支票（Cheque）',
    '線上支付平台（Online Platforms）',
    '其他（Other）'
  ];

  useEffect(() => {
    if (!organizationResolved || orgDataDisabled) {
      return;
    }

    if (!resolvedOrgId) {
      setLoading(false);
      return;
    }

    fetchIncomeData();
  }, [selectedMonth, resolvedOrgId, organizationResolved, orgDataDisabled]);

  const fetchIncomeData = async () => {
    if (!resolvedOrgId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const supabase = getSupabaseClient();

      // 獲取常規學生數量（使用 API 端點以繞過 RLS）
      const userEmail = saasUser?.email || '';
      const studentsResponse = await fetch(
        `/api/students/list?orgId=${encodeURIComponent(resolvedOrgId)}&userEmail=${encodeURIComponent(userEmail)}&studentType=常規`
      );
      const studentsResult = await studentsResponse.json();
      const studentData = studentsResult.data || [];

      // 獲取活躍課程包
      const studentIds = studentData.map((s: any) => s.id);
      let packageData: Package[] = [];
      if (studentIds.length > 0) {
        try {
          const { data: packageDataResult, error: packageError } = await (supabase
            .from('Hanami_Student_Package') as any)
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
            .eq('status', 'active')
            .in('student_id', studentIds);

          if (packageError) {
            console.error('查詢課程包失敗:', packageError);
            packageData = [];
          } else {
            packageData = (packageDataResult || []) as Package[];
            if (packageData.length > 0 && (packageData[0] as any).org_id) {
              packageData = packageData.filter((pkg: any) => pkg.org_id === resolvedOrgId);
            }
          }
        } catch (error: any) {
          console.error('查詢課程包時發生錯誤:', error);
          packageData = [];
        }
      }

      // 獲取課程類型（根據 org_id 過濾）
      const { data: courseTypeData, error: courseTypeError } = await (supabase
        .from('Hanami_CourseTypes') as any)
        .select('*')
        .eq('status', true)
        .eq('org_id', resolvedOrgId)
        .order('name');

      if (courseTypeError) {
        console.error('獲取課程類型錯誤:', courseTypeError);
      }

      const typedCourseTypeData = (courseTypeData || []) as CourseType[];

      // 獲取收入記錄（使用 API 端點繞過 RLS）
      const [year, month] = selectedMonth.split('-');
      const startDate = `${year}-${month}-01`;
      const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().slice(0, 10);

      const incomeResponse = await fetch(
        `/api/financial/income?orgId=${encodeURIComponent(resolvedOrgId)}&userEmail=${encodeURIComponent(userEmail)}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
      );

      let typedIncomeData: Income[] = [];
      if (incomeResponse.ok) {
        const incomeResult = await incomeResponse.json();
        typedIncomeData = (incomeResult.data || []) as Income[];
      } else {
        console.error('獲取收入記錄錯誤:', await incomeResponse.json());
      }

      setPackages(packageData || []);
      setCourseTypes(typedCourseTypeData);
      setIncomes(typedIncomeData);

    } catch (error) {
      console.error('獲取收入數據時發生錯誤:', error);
      setError('載入收入數據時發生錯誤');
    } finally {
      setLoading(false);
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
      const { error } = await (supabase
        .from('Hanami_Student_Package') as any)
        .update({ price: newPrice })
        .eq('id', editingPackage.id);

      if (error) throw error;

      alert('價格更新成功！');
      setShowPriceEditor(false);
      setEditingPackage(null);
      setNewPrice(0);
      fetchIncomeData();
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
      const { error } = await (supabase
        .from('Hanami_CourseTypes') as any)
        .update({ price_per_lesson: newCourseTypePrice })
        .eq('id', editingCourseType.id);

      if (error) throw error;

      alert('課程類型價格更新成功！');
      setShowCourseTypePriceEditor(false);
      setEditingCourseType(null);
      setNewCourseTypePrice(0);
      fetchIncomeData();
    } catch (error) {
      console.error('更新課程類型價格時發生錯誤:', error);
      alert('更新課程類型價格失敗');
    }
  };

  const handleAddIncome = async () => {
    if (!resolvedOrgId) {
      alert('請先選擇機構');
      return;
    }

    try {
      if (!newIncome.income_category || !newIncome.income_description || newIncome.amount <= 0) {
        alert('請填寫完整的收入資訊');
        return;
      }

      // 使用 API 端點繞過 RLS
      const userEmail = saasUser?.email || '';
      const response = await fetch('/api/financial/income', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orgId: resolvedOrgId,
          userEmail,
          income_date: newIncome.income_date,
          income_category: newIncome.income_category,
          income_description: newIncome.income_description,
          amount: newIncome.amount,
          payment_method: newIncome.payment_method,
          notes: newIncome.notes
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '新增收入失敗');
      }

      setNewIncome({
        income_date: new Date().toISOString().slice(0, 10),
        income_category: '',
        income_description: '',
        amount: 0,
        payment_method: '',
        notes: ''
      });
      setShowAddIncome(false);
      fetchIncomeData();

    } catch (error: any) {
      console.error('新增收入時發生錯誤:', error);
      alert(error.message || '新增收入失敗');
    }
  };

  const handleEditIncome = (income: Income) => {
    setEditingIncome(income);
    setNewIncome({
      income_date: income.income_date,
      income_category: income.income_category,
      income_description: income.income_description,
      amount: income.amount,
      payment_method: income.payment_method || '',
      notes: income.notes || ''
    });
    setShowEditIncome(true);
  };

  const handleUpdateIncome = async () => {
    if (!editingIncome || !resolvedOrgId) {
      alert('請先選擇機構');
      return;
    }

    try {
      if (!newIncome.income_category || !newIncome.income_description || newIncome.amount <= 0) {
        alert('請填寫完整的收入資訊');
        return;
      }

      // 使用 API 端點繞過 RLS
      const userEmail = saasUser?.email || '';
      const response = await fetch('/api/financial/income', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingIncome.id,
          orgId: resolvedOrgId,
          userEmail,
          income_date: newIncome.income_date,
          income_category: newIncome.income_category,
          income_description: newIncome.income_description,
          amount: newIncome.amount,
          payment_method: newIncome.payment_method,
          notes: newIncome.notes
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '更新收入失敗');
      }

      setShowEditIncome(false);
      setEditingIncome(null);
      setNewIncome({
        income_date: new Date().toISOString().slice(0, 10),
        income_category: '',
        income_description: '',
        amount: 0,
        payment_method: '',
        notes: ''
      });
      fetchIncomeData();

    } catch (error: any) {
      console.error('更新收入時發生錯誤:', error);
      alert(error.message || '更新收入失敗');
    }
  };

  const handleDeleteIncome = async (incomeId: string) => {
    if (!confirm('確定要刪除這筆收入記錄嗎？')) return;

    try {
      // 使用 API 端點繞過 RLS
      const response = await fetch(
        `/api/financial/income?id=${encodeURIComponent(incomeId)}&orgId=${encodeURIComponent(resolvedOrgId || '')}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '刪除收入失敗');
      }

      fetchIncomeData();
    } catch (error: any) {
      console.error('刪除收入時發生錯誤:', error);
      alert(error.message || '刪除收入失敗');
    }
  };

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

  if (orgDataDisabled) {
    return null;
  }

  if (loading) {
    return <CuteLoadingSpinner message="載入收入數據..." className="h-full min-h-[320px] p-8" />;
  }

  // 價格編輯模態框內容
  const priceEditorModalContent = showPriceEditor && editingPackage && isMounted && typeof document !== 'undefined' && document.body ? (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto my-8">
      <div
        className="p-6 w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
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
  ) : null;

  // 新增收入模態框內容
  const addIncomeModalContent = showAddIncome && isMounted && typeof document !== 'undefined' && document.body ? (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-[32px] bg-[#FFFDF7] shadow-[0_28px_80px_rgba(209,166,133,0.35)] ring-1 ring-[#F2E6D7]/80">
        <button
          type="button"
          className="absolute right-5 top-5 rounded-full border border-white/70 bg-white/90 px-3 py-1 text-sm text-[#4B4036] shadow-sm transition hover:bg-[#FFF3E4]"
          onClick={() => setShowAddIncome(false)}
        >
          關閉
        </button>
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="relative flex flex-col gap-6 bg-gradient-to-br from-[#FFE8D4] via-[#FFD6F0] to-[#FAD5FF] px-6 py-8">
            <div className="absolute -top-12 right-2 h-48 w-48 rounded-full bg-white/25 blur-3xl" aria-hidden="true" />
            <div className="absolute -bottom-16 left-6 h-44 w-44 rounded-full bg-white/20 blur-3xl" aria-hidden="true" />
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/75 shadow-lg">
              <ArrowTrendingUpIcon className="w-8 h-8 text-[#10B981]" />
            </div>
            <div className="space-y-3 text-[#4B4036]">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/75 px-3 py-1 text-xs font-semibold text-[#D48347] shadow-sm">
                財務管理 · 收入記錄
              </span>
              <h3 className="text-2xl font-semibold leading-snug">
                記錄機構的每一筆收入，追蹤財務來源。
              </h3>
              <p className="text-sm leading-relaxed text-[#604D3F]">
                詳細記錄收入日期、分類、金額與付款方式，幫助您掌握機構的財務狀況和收入來源。
              </p>
            </div>
            <div className="rounded-2xl bg-white/80 p-4 shadow-inner">
              <span className="text-xs font-semibold text-[#8A7C70]">記錄提醒</span>
              <ul className="mt-2 space-y-1 text-xs text-[#6E5A4A]">
                <li>・ 選擇合適的分類，方便後續統計分析。</li>
                <li>・ 詳細描述有助於日後查詢和對帳。</li>
                <li>・ 記錄付款方式，便於財務管理。</li>
              </ul>
            </div>
          </div>

          <div className="max-h-[80vh] overflow-y-auto px-6 py-6">
            <div className="space-y-5">
              <section className="rounded-3xl border border-[#F1E4D3] bg-white/90 p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-[#4B4036]">基本資訊</h4>
                  <span className="text-xs text-[#A68A64]">必填欄位</span>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#8A7C70]">收入日期 *</label>
                    <input
                      type="date"
                      value={newIncome.income_date}
                      onChange={(e) => setNewIncome({ ...newIncome, income_date: e.target.value })}
                      className="w-full rounded-2xl border border-[#F1E4D3] bg-gradient-to-r from-[#FFF5EC] via-[#FFF0F6] to-[#FFF8E8] px-4 py-3 text-sm font-medium text-[#4B4036] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F59BB5]/40 focus:border-[#F59BB5]/60"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#8A7C70]">收入分類 *</label>
                    <select
                      value={newIncome.income_category}
                      onChange={(e) => setNewIncome({ ...newIncome, income_category: e.target.value })}
                      className="w-full rounded-2xl border border-[#F1E4D3] bg-gradient-to-r from-[#FFF5EC] via-[#FFF0F6] to-[#FFF8E8] px-4 py-3 text-sm font-medium text-[#4B4036] shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#F59BB5]/40 focus:border-[#F59BB5]/60 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23D48347%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpath d=%22M6 9l6 6 6-6%22/%3E%3C/svg%3E')] bg-no-repeat bg-right-4 bg-[length:16px_16px] pr-10"
                    >
                      <option value="">請選擇分類</option>
                      {incomeCategories.map(category => {
                        const isSeparator = category.startsWith('──────────');
                        if (isSeparator) {
                          // 提取分類標題（移除分隔線）
                          const title = category.replace(/──────────/g, '').trim();
                          return (
                            <option
                              key={category}
                              value=""
                              disabled
                              style={{
                                fontWeight: 'bold',
                                backgroundColor: '#FFF9F2',
                                color: '#D48347',
                                fontSize: '0.8rem',
                                padding: '8px 4px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                              }}
                            >
                              {title}
                            </option>
                          );
                        }
                        return (
                          <option
                            key={category}
                            value={category}
                            style={{
                              paddingLeft: '20px',
                              color: '#4B4036'
                            }}
                          >
                            {category}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-[#F1E4D3] bg-white/90 p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-[#4B4036]">收入詳情</h4>
                  <span className="text-xs text-[#A68A64]">描述與金額</span>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#8A7C70]">收入描述 *</label>
                    <input
                      type="text"
                      value={newIncome.income_description}
                      onChange={(e) => setNewIncome({ ...newIncome, income_description: e.target.value })}
                      placeholder="例如：課程包收入"
                      className="w-full rounded-2xl border border-[#F1E4D3] bg-gradient-to-r from-[#FFF5EC] via-[#FFF0F6] to-[#FFF8E8] px-4 py-3 text-sm font-medium text-[#4B4036] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F59BB5]/40 focus:border-[#F59BB5]/60"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#8A7C70]">金額 *</label>
                    <input
                      type="number"
                      value={newIncome.amount}
                      onChange={(e) => setNewIncome({ ...newIncome, amount: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="w-full rounded-2xl border border-[#F1E4D3] bg-gradient-to-r from-[#FFF5EC] via-[#FFF0F6] to-[#FFF8E8] px-4 py-3 text-sm font-medium text-[#4B4036] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F59BB5]/40 focus:border-[#F59BB5]/60"
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-[#F1E4D3] bg-white/90 p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-[#4B4036]">付款資訊</h4>
                  <span className="text-xs text-[#A68A64]">可選欄位</span>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#8A7C70]">付款方式</label>
                    <select
                      value={newIncome.payment_method}
                      onChange={(e) => setNewIncome({ ...newIncome, payment_method: e.target.value })}
                      className="w-full rounded-2xl border border-[#F1E4D3] bg-gradient-to-r from-[#FFF5EC] via-[#FFF0F6] to-[#FFF8E8] px-4 py-3 text-sm font-medium text-[#4B4036] shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#F59BB5]/40 focus:border-[#F59BB5]/60 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23D48347%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpath d=%22M6 9l6 6 6-6%22/%3E%3C/svg%3E')] bg-no-repeat bg-right-4 bg-[length:16px_16px] pr-10"
                    >
                      <option value="">請選擇付款方式</option>
                      {paymentMethods.map(method => (
                        <option key={method} value={method}>{method}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#8A7C70]">備註</label>
                    <textarea
                      value={newIncome.notes}
                      onChange={(e) => setNewIncome({ ...newIncome, notes: e.target.value })}
                      placeholder="可選的備註資訊"
                      rows={3}
                      className="w-full rounded-2xl border border-[#F1E4D3] bg-gradient-to-r from-[#FFF5EC] via-[#FFF0F6] to-[#FFF8E8] px-4 py-3 text-sm text-[#4B4036] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F59BB5]/40 focus:border-[#F59BB5]/60"
                    />
                  </div>
                </div>
              </section>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  className="flex-1 rounded-2xl bg-gradient-to-r from-[#F59BB5] via-[#FFD59A] to-[#F7C8D1] py-3 text-sm font-semibold text-[#4B4036] shadow-md transition hover:shadow-xl"
                  onClick={handleAddIncome}
                >
                  新增收入
                </button>
                <button
                  className="flex-1 rounded-2xl border border-[#EADBC8] bg-white/80 py-3 text-sm font-semibold text-[#8A7C70] shadow-sm transition hover:bg-[#FFF4DF]"
                  onClick={() => setShowAddIncome(false)}
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  // 編輯收入模態框內容
  const editIncomeModalContent = showEditIncome && editingIncome && isMounted && typeof document !== 'undefined' && document.body ? (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-[32px] bg-[#FFFDF7] shadow-[0_28px_80px_rgba(209,166,133,0.35)] ring-1 ring-[#F2E6D7]/80">
        <button
          type="button"
          className="absolute right-5 top-5 rounded-full border border-white/70 bg-white/90 px-3 py-1 text-sm text-[#4B4036] shadow-sm transition hover:bg-[#FFF3E4]"
          onClick={() => {
            setShowEditIncome(false);
            setEditingIncome(null);
            setNewIncome({
              income_date: new Date().toISOString().slice(0, 10),
              income_category: '',
              income_description: '',
              amount: 0,
              payment_method: '',
              notes: ''
            });
          }}
        >
          關閉
        </button>
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="relative flex flex-col gap-6 bg-gradient-to-br from-[#FFE8D4] via-[#FFD6F0] to-[#FAD5FF] px-6 py-8">
            <div className="absolute -top-12 right-2 h-48 w-48 rounded-full bg-white/25 blur-3xl" aria-hidden="true" />
            <div className="absolute -bottom-16 left-6 h-44 w-44 rounded-full bg-white/20 blur-3xl" aria-hidden="true" />
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/75 shadow-lg">
              <ArrowTrendingUpIcon className="w-8 h-8 text-[#10B981]" />
            </div>
            <div className="space-y-3 text-[#4B4036]">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/75 px-3 py-1 text-xs font-semibold text-[#D48347] shadow-sm">
                編輯收入記錄
              </span>
              <h3 className="text-2xl font-semibold leading-snug">
                更新收入資訊，確保財務記錄準確。
              </h3>
              <p className="text-sm leading-relaxed text-[#604D3F]">
                修改收入日期、分類、金額等資訊，保持財務資料的完整性和準確性。
              </p>
            </div>
            <div className="rounded-2xl bg-white/80 p-4 shadow-inner">
              <span className="text-xs font-semibold text-[#8A7C70]">編輯提示</span>
              <ul className="mt-2 space-y-1 text-xs text-[#6E5A4A]">
                <li>・ 確認所有資訊正確無誤。</li>
                <li>・ 修改後將立即更新記錄。</li>
                <li>・ 可隨時再次編輯調整。</li>
              </ul>
            </div>
          </div>

          <div className="max-h-[80vh] overflow-y-auto px-6 py-6">
            <div className="space-y-5">
              <section className="rounded-3xl border border-[#F1E4D3] bg-white/90 p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-[#4B4036]">基本資訊</h4>
                  <span className="text-xs text-[#A68A64]">必填欄位</span>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#8A7C70]">收入日期 *</label>
                    <input
                      type="date"
                      value={newIncome.income_date}
                      onChange={(e) => setNewIncome({ ...newIncome, income_date: e.target.value })}
                      className="w-full rounded-2xl border border-[#F1E4D3] bg-gradient-to-r from-[#FFF5EC] via-[#FFF0F6] to-[#FFF8E8] px-4 py-3 text-sm font-medium text-[#4B4036] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F59BB5]/40 focus:border-[#F59BB5]/60"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#8A7C70]">收入分類 *</label>
                    <select
                      value={newIncome.income_category}
                      onChange={(e) => setNewIncome({ ...newIncome, income_category: e.target.value })}
                      className="w-full rounded-2xl border border-[#F1E4D3] bg-gradient-to-r from-[#FFF5EC] via-[#FFF0F6] to-[#FFF8E8] px-4 py-3 text-sm font-medium text-[#4B4036] shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#F59BB5]/40 focus:border-[#F59BB5]/60 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23D48347%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpath d=%22M6 9l6 6 6-6%22/%3E%3C/svg%3E')] bg-no-repeat bg-right-4 bg-[length:16px_16px] pr-10"
                    >
                      <option value="">請選擇分類</option>
                      {incomeCategories.map(category => {
                        const isSeparator = category.startsWith('──────────');
                        if (isSeparator) {
                          // 提取分類標題（移除分隔線）
                          const title = category.replace(/──────────/g, '').trim();
                          return (
                            <option
                              key={category}
                              value=""
                              disabled
                              style={{
                                fontWeight: 'bold',
                                backgroundColor: '#FFF9F2',
                                color: '#D48347',
                                fontSize: '0.8rem',
                                padding: '8px 4px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                              }}
                            >
                              {title}
                            </option>
                          );
                        }
                        return (
                          <option
                            key={category}
                            value={category}
                            style={{
                              paddingLeft: '20px',
                              color: '#4B4036'
                            }}
                          >
                            {category}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-[#F1E4D3] bg-white/90 p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-[#4B4036]">收入詳情</h4>
                  <span className="text-xs text-[#A68A64]">描述與金額</span>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#8A7C70]">收入描述 *</label>
                    <input
                      type="text"
                      value={newIncome.income_description}
                      onChange={(e) => setNewIncome({ ...newIncome, income_description: e.target.value })}
                      placeholder="例如：課程包收入"
                      className="w-full rounded-2xl border border-[#F1E4D3] bg-gradient-to-r from-[#FFF5EC] via-[#FFF0F6] to-[#FFF8E8] px-4 py-3 text-sm font-medium text-[#4B4036] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F59BB5]/40 focus:border-[#F59BB5]/60"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#8A7C70]">金額 *</label>
                    <input
                      type="number"
                      value={newIncome.amount}
                      onChange={(e) => setNewIncome({ ...newIncome, amount: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="w-full rounded-2xl border border-[#F1E4D3] bg-gradient-to-r from-[#FFF5EC] via-[#FFF0F6] to-[#FFF8E8] px-4 py-3 text-sm font-medium text-[#4B4036] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F59BB5]/40 focus:border-[#F59BB5]/60"
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-[#F1E4D3] bg-white/90 p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-[#4B4036]">付款資訊</h4>
                  <span className="text-xs text-[#A68A64]">可選欄位</span>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#8A7C70]">付款方式</label>
                    <select
                      value={newIncome.payment_method}
                      onChange={(e) => setNewIncome({ ...newIncome, payment_method: e.target.value })}
                      className="w-full rounded-2xl border border-[#F1E4D3] bg-gradient-to-r from-[#FFF5EC] via-[#FFF0F6] to-[#FFF8E8] px-4 py-3 text-sm font-medium text-[#4B4036] shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#F59BB5]/40 focus:border-[#F59BB5]/60 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23D48347%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpath d=%22M6 9l6 6 6-6%22/%3E%3C/svg%3E')] bg-no-repeat bg-right-4 bg-[length:16px_16px] pr-10"
                    >
                      <option value="">請選擇付款方式</option>
                      {paymentMethods.map(method => (
                        <option key={method} value={method}>{method}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#8A7C70]">備註</label>
                    <textarea
                      value={newIncome.notes}
                      onChange={(e) => setNewIncome({ ...newIncome, notes: e.target.value })}
                      placeholder="可選的備註資訊"
                      rows={3}
                      className="w-full rounded-2xl border border-[#F1E4D3] bg-gradient-to-r from-[#FFF5EC] via-[#FFF0F6] to-[#FFF8E8] px-4 py-3 text-sm text-[#4B4036] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F59BB5]/40 focus:border-[#F59BB5]/60"
                    />
                  </div>
                </div>
              </section>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  className="flex-1 rounded-2xl bg-gradient-to-r from-[#F59BB5] via-[#FFD59A] to-[#F7C8D1] py-3 text-sm font-semibold text-[#4B4036] shadow-md transition hover:shadow-xl"
                  onClick={handleUpdateIncome}
                >
                  更新收入
                </button>
                <button
                  className="flex-1 rounded-2xl border border-[#EADBC8] bg-white/80 py-3 text-sm font-semibold text-[#8A7C70] shadow-sm transition hover:bg-[#FFF4DF]"
                  onClick={() => {
                    setShowEditIncome(false);
                    setEditingIncome(null);
                    setNewIncome({
                      income_date: new Date().toISOString().slice(0, 10),
                      income_category: '',
                      income_description: '',
                      amount: 0,
                      payment_method: '',
                      notes: ''
                    });
                  }}
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  // 課程類型價格編輯模態框內容
  const courseTypePriceEditorModalContent = showCourseTypePriceEditor && editingCourseType && isMounted && typeof document !== 'undefined' && document.body ? (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto my-8">
      <div
        className="p-6 w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
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
  ) : null;

  const totalPackageValue = packages.reduce((sum, pkg) => sum + pkg.price, 0);

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
            <BackButton href="/aihome/teacher-link/create/financial-management" label="返回財務總覽" />
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
                <div className="w-16 h-16 bg-gradient-to-br from-[#10B981] to-[#059669] rounded-3xl flex items-center justify-center shadow-lg">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <ArrowTrendingUpIcon className="w-8 h-8 text-white" />
                  </motion.div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-[#4B4036]">收入管理</h1>
                  <p className="mt-2 text-sm sm:text-base text-[#2B3A3B]/70 max-w-3xl leading-relaxed">
                    管理收入記錄、課程包收入和課程類型價格設定。新增、編輯和查看所有收入詳情。
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

          {/* 月份選擇器和統計 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6"
          >
            {/* 月份選擇器 */}
            <HanamiCard className="p-6 bg-white/80 backdrop-blur-md border border-[#EADBC8] rounded-3xl shadow-xl">
              <label className="block text-sm font-medium text-[#2B3A3B] mb-2">選擇月份</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD59A]"
              />
            </HanamiCard>

            {/* 總收入統計 */}
            <HanamiCard className="p-6 bg-gradient-to-br from-green-50 to-green-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                  <CurrencyDollarIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-xl font-bold text-green-600">
                    {formatCurrency(incomes.reduce((sum, inc) => sum + (inc.amount || 0), 0))}
                  </div>
                  <div className="text-xs text-[#2B3A3B] mt-1">總收入</div>
                </div>
              </div>
            </HanamiCard>

            {/* 收入筆數 */}
            <HanamiCard className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <ArrowTrendingUpIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-xl font-bold text-blue-600">
                    {incomes.length}
                  </div>
                  <div className="text-xs text-[#2B3A3B] mt-1">收入筆數</div>
                </div>
              </div>
            </HanamiCard>

            {/* 課程包價值 */}
            <HanamiCard className="p-6 bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <PresentationChartLineIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-xl font-bold text-purple-600">
                    {formatCurrency(totalPackageValue)}
                  </div>
                  <div className="text-xs text-[#2B3A3B] mt-1">課程包價值</div>
                </div>
              </div>
            </HanamiCard>
          </motion.div>

          {/* 收入記錄列表 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* 收入記錄 */}
            <HanamiCard className="p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <ArrowTrendingUpIcon className="w-6 h-6 text-[#FFB6C1]" />
                  </motion.div>
                  <h2 className="text-xl font-semibold text-[#2B3A3B]">收入記錄</h2>
                </div>
                <HanamiButton
                  onClick={() => {
                    setNewIncome({
                      income_date: new Date().toISOString().slice(0, 10),
                      income_category: '',
                      income_description: '',
                      amount: 0,
                      payment_method: '',
                      notes: ''
                    });
                    setShowAddIncome(true);
                  }}
                  variant="primary"
                  size="sm"
                >
                  新增收入
                </HanamiButton>
              </div>

              {incomes.length > 0 ? (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {incomes.map((income, index) => (
                    <motion.div
                      key={income.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-sm border border-green-200 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-[#2B3A3B] mb-1 truncate">{income.income_description}</div>
                        <div className="text-sm text-gray-600 flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-1 bg-white/80 rounded-lg text-xs font-medium">
                            {income.income_category}
                          </span>
                          <span>•</span>
                          <span>{income.income_date}</span>
                          {income.payment_method && (
                            <>
                              <span>•</span>
                              <span>{income.payment_method}</span>
                            </>
                          )}
                        </div>
                        {income.notes && (
                          <div className="text-xs text-gray-500 mt-1 truncate">
                            {income.notes}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 ml-3">
                        <div className="text-right">
                          <div className="font-semibold text-green-600 text-lg">
                            {formatCurrency(income.amount)}
                          </div>
                        </div>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex gap-2"
                        >
                          <HanamiButton
                            onClick={() => handleEditIncome(income)}
                            variant="secondary"
                            size="sm"
                            className="bg-white/90 hover:bg-white text-blue-600 border-blue-300 shadow-sm"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </HanamiButton>
                          <HanamiButton
                            onClick={() => handleDeleteIncome(income.id)}
                            variant="danger"
                            size="sm"
                            className="bg-white/90 hover:bg-white text-red-600 border-red-300 shadow-sm"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </HanamiButton>
                        </motion.div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center"
                  >
                    <ArrowTrendingUpIcon className="w-12 h-12 text-gray-400" />
                  </motion.div>
                  <p className="text-lg font-medium">本月尚無收入記錄</p>
                </div>
              )}
            </HanamiCard>

            {/* 收入分類統計 */}
            <HanamiCard className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <CurrencyDollarIcon className="w-6 h-6 text-[#FFB6C1]" />
                </motion.div>
                <h2 className="text-xl font-semibold text-[#2B3A3B]">分類統計</h2>
              </div>

              {(() => {
                const totalIncome = incomes.reduce((sum, inc) => sum + (inc.amount || 0), 0);
                const incomesByCategory = incomes.reduce((acc, inc) => {
                  const category = inc.income_category || '其他';
                  acc[category] = (acc[category] || 0) + inc.amount;
                  return acc;
                }, {} as Record<string, number>);

                return Object.keys(incomesByCategory).length > 0 ? (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {Object.entries(incomesByCategory)
                      .sort(([, a], [, b]) => b - a)
                      .map(([category, amount], index) => {
                        const percentage = totalIncome > 0 ? (amount / totalIncome) * 100 : 0;
                        return (
                          <motion.div
                            key={category}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-sm border border-gray-200"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-medium text-[#2B3A3B]">{category}</div>
                              <div className="font-semibold text-green-600">
                                {formatCurrency(amount)}
                              </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full"
                              />
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {percentage.toFixed(1)}%
                            </div>
                          </motion.div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    尚無分類數據
                  </div>
                );
              })()}
            </HanamiCard>
          </motion.div>

          {/* 課程類型管理和課程包收入詳情 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* 課程類型管理 */}
            <HanamiCard className="p-6">
              <div className="flex items-center mb-6">
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <PresentationChartLineIcon className="w-6 h-6 text-[#FFB6C1]" />
                  </motion.div>
                  <h2 className="text-xl font-semibold text-[#2B3A3B]">課程類型管理</h2>
                </div>
              </div>

              {courseTypes.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {courseTypes.map((courseType, index) => {
                    const theme = getCourseTypeTheme(courseType.name || '其他');
                    return (
                      <motion.div
                        key={courseType.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`flex items-center justify-between p-4 bg-gradient-to-br ${theme.bg} rounded-xl shadow-sm border ${theme.border} hover:shadow-md transition-all duration-200`}
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            className={`w-12 h-12 rounded-xl ${theme.priceBg} flex items-center justify-center shadow-md flex-shrink-0`}
                          >
                            <span className={`${theme.priceText} font-bold text-lg`}>
                              {courseType.name?.charAt(0) || '?'}
                            </span>
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <div className={`font-bold ${theme.text} text-lg mb-1 truncate`}>
                              {courseType.name}
                            </div>
                            <div className={`text-xs ${theme.text} opacity-70`}>
                              課程類型
                            </div>
                          </div>
                          <div className={`px-4 py-2 ${theme.priceBg} rounded-lg ${theme.priceText} font-semibold text-base shadow-sm border ${theme.border} flex-shrink-0`}>
                            {courseType.price_per_lesson ? formatCurrency(courseType.price_per_lesson) : '未設定'}
                          </div>
                        </div>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="ml-3 flex-shrink-0"
                        >
                          <HanamiButton
                            onClick={() => handleEditCourseTypePrice(courseType)}
                            variant="secondary"
                            size="sm"
                            className="bg-white/90 hover:bg-white text-gray-700 border-gray-300 shadow-sm"
                          >
                            設定價格
                          </HanamiButton>
                        </motion.div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center"
                  >
                    <PresentationChartLineIcon className="w-12 h-12 text-gray-400" />
                  </motion.div>
                  <p className="text-lg font-medium">尚無課程類型</p>
                </div>
              )}
            </HanamiCard>

            {/* 課程包收入詳情 */}
            <HanamiCard className="p-6">
              <div className="flex items-center mb-6">
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <CurrencyDollarIcon className="w-6 h-6 text-[#FFB6C1]" />
                  </motion.div>
                  <h2 className="text-xl font-semibold text-[#2B3A3B]">課程包收入詳情</h2>
                </div>
              </div>

              {packages.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {packages.map((pkg) => (
                    <motion.div
                      key={pkg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-sm border border-green-200 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-[#2B3A3B] mb-1 truncate">{pkg.course_name}</div>
                        <div className="text-sm text-gray-600">
                          {pkg.full_name} • 剩餘 {pkg.remaining_lessons}/{pkg.total_lessons} 堂
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-3">
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
                          className="bg-white/90 hover:bg-white text-gray-700 border-gray-300 shadow-sm"
                        >
                          編輯價格
                        </HanamiButton>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center"
                  >
                    <CurrencyDollarIcon className="w-12 h-12 text-gray-400" />
                  </motion.div>
                  <p className="text-lg font-medium">尚無活躍課程包</p>
                </div>
              )}
            </HanamiCard>
          </motion.div>
        </div>
      </div>

      {/* 使用 createPortal 渲染模態框 */}
      {isMounted && typeof document !== 'undefined' && document.body && (
        <>
          {priceEditorModalContent && createPortal(priceEditorModalContent, document.body)}
          {courseTypePriceEditorModalContent && createPortal(courseTypePriceEditorModalContent, document.body)}
          {addIncomeModalContent && createPortal(addIncomeModalContent, document.body)}
          {editIncomeModalContent && createPortal(editIncomeModalContent, document.body)}
        </>
      )}
    </>
  );
}

export default function IncomeManagementPage() {
  return (
    <TeacherLinkShell currentPath="/aihome/teacher-link/create/financial-management/income">
      <WithPermissionCheck pageKey="finance">
        <IncomeManagementContent />
      </WithPermissionCheck>
    </TeacherLinkShell>
  );
}

