'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowTrendingDownIcon, CurrencyDollarIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { HanamiCard } from '@/components/ui/HanamiCard';
import { HanamiButton } from '@/components/ui/HanamiButton';
import BackButton from '@/components/ui/BackButton';
import { TeacherLinkShell, useTeacherLinkOrganization } from '../../TeacherLinkShell';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import CuteLoadingSpinner from '@/components/ui/CuteLoadingSpinner';
import { createPortal } from 'react-dom';
import FinancialManagementNavBar from '@/components/ui/FinancialManagementNavBar';

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

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

function ExpensesManagementContent() {
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

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showEditExpense, setShowEditExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [newExpense, setNewExpense] = useState({
    expense_date: new Date().toISOString().slice(0, 10),
    expense_category: '',
    expense_description: '',
    amount: 0,
    payment_method: '',
    notes: ''
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 支出分類選項（包含分類標題作為分隔）
  const expenseCategories = [
    '────────── 一、人力成本（Personnel / HR） ──────────',
    '員工薪金（Staff Salary）',
    '兼職鐘點費（Part-time Hourly Wage）',
    'MPF / 保險（MPF / Insurance）',
    '外判費用（Outsourcing）',
    '顧問費用（Consultant Fee）',
    '佣金分成（Commission）',
    '────────── 二、場地與營運（Rent & Operations） ──────────',
    '租金（Rent）',
    '水電煤（Utilities）',
    '網絡費用（Internet）',
    '保安 / 清潔費（Security & Cleaning）',
    '維修保養（Maintenance）',
    '裝修工程（Renovation）',
    '器材維修（Equipment Repair）',
    '────────── 三、教學與用品（Teaching & Supplies） ──────────',
    '教具（Teaching Materials）',
    '文具與耗材（Stationery & Consumables）',
    '樂器購買（Instruments）',
    '書籍 / 課程資源（Books & Curriculum）',
    '打印與影印費（Printing）',
    '────────── 四、行銷與廣告（Marketing） ──────────',
    '社交媒體廣告（Ads：IG/FB/Google）',
    'KOL / 合作費用（Influencer Fee）',
    '設計費（Design Fee）',
    '影片製作（Video Production）',
    '網站費用（Domain / Hosting / SaaS）',
    '────────── 五、行政與管理（Admin & Management） ──────────',
    '系統費用（Software Subscription）',
    '銀行費（Bank Fee）',
    '稅項（Tax）',
    '法律與會計費（Legal & Accounting）',
    '辦公用品（Office Supplies）',
    '────────── 六、設備與資產（Equipment & Assets） ──────────',
    '電腦、iPad（Electronics）',
    '相機、燈光設備（Video Gear）',
    '家具（Furniture）',
    '樂器（Music Instruments）',
    '大型設備（Large Equipment）',
    '────────── 七、內容創作（Content Production） ──────────',
    '拍攝場地（Studio Rental）',
    '道具（Props）',
    '音效 / 授權（Music Licensing）',
    '外判剪片（Editing Fee）',
    '插畫 / 平面設計（Illustrations）',
    '────────── 八、交通與差旅（Travel） ──────────',
    '交通費（Transportation）',
    '旅行（Travel）',
    '出差補貼（Allowance）',
    '住宿（Hotel）',
    '────────── 九、個人成長與訓練（Training & Education） ──────────',
    '課程費用（Courses）',
    '工作坊（Workshops）',
    '證書考試（Certification）',
    '書籍（Books）',
    '────────── 十、雜項支出（Miscellaneous） ──────────',
    '餐飲（Meals）',
    '禮物（Gifts）',
    '小額消費（Misc Small Purchases）',
    '罰款／票（Penalties）',
    '────────── 其他 ──────────',
    '其他支出（Other）'
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

    fetchExpensesData();
  }, [selectedMonth, resolvedOrgId, organizationResolved, orgDataDisabled]);

  const fetchExpensesData = async () => {
    if (!resolvedOrgId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [year, month] = selectedMonth.split('-');
      const startDate = `${year}-${month}-01`;
      const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().slice(0, 10);

      // 使用 API 端點繞過 RLS
      const userEmail = saasUser?.email || '';
      const response = await fetch(
        `/api/financial/expenses?orgId=${encodeURIComponent(resolvedOrgId)}&userEmail=${encodeURIComponent(userEmail)}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '獲取支出數據失敗');
      }

      const result = await response.json();
      const typedExpenseData = (result.data || []) as Expense[];
      setExpenses(typedExpenseData);

    } catch (error) {
      console.error('獲取支出數據時發生錯誤:', error);
      setError('載入支出數據時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async () => {
    if (!resolvedOrgId) {
      alert('請先選擇機構');
      return;
    }

    try {
      if (!newExpense.expense_category || !newExpense.expense_description || newExpense.amount <= 0) {
        alert('請填寫完整的支出資訊');
        return;
      }

      // 使用 API 端點繞過 RLS
      const userEmail = saasUser?.email || '';
      const response = await fetch('/api/financial/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orgId: resolvedOrgId,
          userEmail,
          expense_date: newExpense.expense_date,
          expense_category: newExpense.expense_category,
          expense_description: newExpense.expense_description,
          amount: newExpense.amount,
          payment_method: newExpense.payment_method,
          notes: newExpense.notes
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '新增支出失敗');
      }

      setNewExpense({
        expense_date: new Date().toISOString().slice(0, 10),
        expense_category: '',
        expense_description: '',
        amount: 0,
        payment_method: '',
        notes: ''
      });
      setShowAddExpense(false);
      fetchExpensesData();

    } catch (error: any) {
      console.error('新增支出時發生錯誤:', error);
      alert(error.message || '新增支出失敗');
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setNewExpense({
      expense_date: expense.expense_date,
      expense_category: expense.expense_category,
      expense_description: expense.expense_description,
      amount: expense.amount,
      payment_method: expense.payment_method || '',
      notes: expense.notes || ''
    });
    setShowEditExpense(true);
  };

  const handleUpdateExpense = async () => {
    if (!editingExpense || !resolvedOrgId) {
      alert('請先選擇機構');
      return;
    }

    try {
      if (!newExpense.expense_category || !newExpense.expense_description || newExpense.amount <= 0) {
        alert('請填寫完整的支出資訊');
        return;
      }

      // 使用 API 端點繞過 RLS
      const userEmail = saasUser?.email || '';
      const response = await fetch('/api/financial/expenses', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingExpense.id,
          orgId: resolvedOrgId,
          userEmail,
          expense_date: newExpense.expense_date,
          expense_category: newExpense.expense_category,
          expense_description: newExpense.expense_description,
          amount: newExpense.amount,
          payment_method: newExpense.payment_method,
          notes: newExpense.notes
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '更新支出失敗');
      }

      setShowEditExpense(false);
      setEditingExpense(null);
      setNewExpense({
        expense_date: new Date().toISOString().slice(0, 10),
        expense_category: '',
        expense_description: '',
        amount: 0,
        payment_method: '',
        notes: ''
      });
      fetchExpensesData();

    } catch (error: any) {
      console.error('更新支出時發生錯誤:', error);
      alert(error.message || '更新支出失敗');
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('確定要刪除這筆支出記錄嗎？')) return;

    try {
      // 使用 API 端點繞過 RLS
      const response = await fetch(
        `/api/financial/expenses?id=${encodeURIComponent(expenseId)}&orgId=${encodeURIComponent(resolvedOrgId || '')}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '刪除支出失敗');
      }

      fetchExpensesData();
    } catch (error: any) {
      console.error('刪除支出時發生錯誤:', error);
      alert(error.message || '刪除支出失敗');
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
    return <CuteLoadingSpinner message="載入支出數據..." className="h-full min-h-[320px] p-8" />;
  }

  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  const expensesByCategory = expenses.reduce((acc, exp) => {
    const category = exp.expense_category || '其他';
    acc[category] = (acc[category] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);

  // 編輯支出模態框內容
  const editExpenseModalContent = showEditExpense && editingExpense && isMounted && typeof document !== 'undefined' && document.body ? (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-[32px] bg-[#FFFDF7] shadow-[0_28px_80px_rgba(209,166,133,0.35)] ring-1 ring-[#F2E6D7]/80">
        <button
          type="button"
          className="absolute right-5 top-5 rounded-full border border-white/70 bg-white/90 px-3 py-1 text-sm text-[#4B4036] shadow-sm transition hover:bg-[#FFF3E4]"
          onClick={() => {
            setShowEditExpense(false);
            setEditingExpense(null);
            setNewExpense({
              expense_date: new Date().toISOString().slice(0, 10),
              expense_category: '',
              expense_description: '',
              amount: 0,
              payment_method: '',
              notes: ''
            });
          }}
        >
          關閉
        </button>
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="relative flex flex-col gap-6 bg-gradient-to-br from-[#FFD6F0] via-[#FFE9D6] to-[#FAD5FF] px-6 py-8">
            <div className="absolute -top-12 right-2 h-48 w-48 rounded-full bg-white/25 blur-3xl" aria-hidden="true" />
            <div className="absolute -bottom-16 left-6 h-44 w-44 rounded-full bg-white/20 blur-3xl" aria-hidden="true" />
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/75 shadow-lg">
              <ArrowTrendingDownIcon className="w-8 h-8 text-[#EF4444]" />
            </div>
            <div className="space-y-3 text-[#4B4036]">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/75 px-3 py-1 text-xs font-semibold text-[#D48347] shadow-sm">
                編輯支出記錄
              </span>
              <h3 className="text-2xl font-semibold leading-snug">
                更新支出資訊，確保財務記錄準確。
              </h3>
              <p className="text-sm leading-relaxed text-[#604D3F]">
                修改支出日期、分類、金額等資訊，保持財務資料的完整性和準確性。
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
                    <label className="mb-1 block text-xs font-semibold text-[#8A7C70]">支出日期 *</label>
                    <input
                      type="date"
                      value={newExpense.expense_date}
                      onChange={(e) => setNewExpense({...newExpense, expense_date: e.target.value})}
                      className="w-full rounded-2xl border border-[#F1E4D3] bg-gradient-to-r from-[#FFF5EC] via-[#FFF0F6] to-[#FFF8E8] px-4 py-3 text-sm font-medium text-[#4B4036] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F59BB5]/40 focus:border-[#F59BB5]/60"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#8A7C70]">支出分類 *</label>
                    <select
                      value={newExpense.expense_category}
                      onChange={(e) => setNewExpense({...newExpense, expense_category: e.target.value})}
                      className="w-full rounded-2xl border border-[#F1E4D3] bg-gradient-to-r from-[#FFF5EC] via-[#FFF0F6] to-[#FFF8E8] px-4 py-3 text-sm font-medium text-[#4B4036] shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#F59BB5]/40 focus:border-[#F59BB5]/60 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23D48347%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpath d=%22M6 9l6 6 6-6%22/%3E%3C/svg%3E')] bg-no-repeat bg-right-4 bg-[length:16px_16px] pr-10"
                    >
                      <option value="">請選擇分類</option>
                      {expenseCategories.map(category => {
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
                  <h4 className="text-sm font-semibold text-[#4B4036]">支出詳情</h4>
                  <span className="text-xs text-[#A68A64]">描述與金額</span>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#8A7C70]">支出描述 *</label>
                    <input
                      type="text"
                      value={newExpense.expense_description}
                      onChange={(e) => setNewExpense({...newExpense, expense_description: e.target.value})}
                      placeholder="例如：購買教學器材"
                      className="w-full rounded-2xl border border-[#F1E4D3] bg-gradient-to-r from-[#FFF5EC] via-[#FFF0F6] to-[#FFF8E8] px-4 py-3 text-sm font-medium text-[#4B4036] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F59BB5]/40 focus:border-[#F59BB5]/60"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#8A7C70]">金額 *</label>
                    <input
                      type="number"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({...newExpense, amount: parseFloat(e.target.value) || 0})}
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
                      value={newExpense.payment_method}
                      onChange={(e) => setNewExpense({...newExpense, payment_method: e.target.value})}
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
                      value={newExpense.notes}
                      onChange={(e) => setNewExpense({...newExpense, notes: e.target.value})}
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
                  onClick={handleUpdateExpense}
                >
                  更新支出
                </button>
                <button
                  className="flex-1 rounded-2xl border border-[#EADBC8] bg-white/80 py-3 text-sm font-semibold text-[#8A7C70] shadow-sm transition hover:bg-[#FFF4DF]"
                  onClick={() => {
                    setShowEditExpense(false);
                    setEditingExpense(null);
                    setNewExpense({
                      expense_date: new Date().toISOString().slice(0, 10),
                      expense_category: '',
                      expense_description: '',
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

  // 新增支出模態框內容
  const addExpenseModalContent = showAddExpense && isMounted && typeof document !== 'undefined' && document.body ? (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-[32px] bg-[#FFFDF7] shadow-[0_28px_80px_rgba(209,166,133,0.35)] ring-1 ring-[#F2E6D7]/80">
        <button
          type="button"
          className="absolute right-5 top-5 rounded-full border border-white/70 bg-white/90 px-3 py-1 text-sm text-[#4B4036] shadow-sm transition hover:bg-[#FFF3E4]"
          onClick={() => setShowAddExpense(false)}
        >
          關閉
        </button>
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="relative flex flex-col gap-6 bg-gradient-to-br from-[#FFD6F0] via-[#FFE9D6] to-[#FAD5FF] px-6 py-8">
            <div className="absolute -top-12 right-2 h-48 w-48 rounded-full bg-white/25 blur-3xl" aria-hidden="true" />
            <div className="absolute -bottom-16 left-6 h-44 w-44 rounded-full bg-white/20 blur-3xl" aria-hidden="true" />
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/75 shadow-lg">
              <ArrowTrendingDownIcon className="w-8 h-8 text-[#EF4444]" />
            </div>
            <div className="space-y-3 text-[#4B4036]">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/75 px-3 py-1 text-xs font-semibold text-[#D48347] shadow-sm">
                財務管理 · 支出記錄
              </span>
              <h3 className="text-2xl font-semibold leading-snug">
                記錄機構的每一筆支出，掌握財務流向。
              </h3>
              <p className="text-sm leading-relaxed text-[#604D3F]">
                詳細記錄支出日期、分類、金額與付款方式，幫助您追蹤和管理機構的財務狀況。
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
                    <label className="mb-1 block text-xs font-semibold text-[#8A7C70]">支出日期 *</label>
                    <input
                      type="date"
                      value={newExpense.expense_date}
                      onChange={(e) => setNewExpense({...newExpense, expense_date: e.target.value})}
                      className="w-full rounded-2xl border border-[#F1E4D3] bg-gradient-to-r from-[#FFF5EC] via-[#FFF0F6] to-[#FFF8E8] px-4 py-3 text-sm font-medium text-[#4B4036] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F59BB5]/40 focus:border-[#F59BB5]/60"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#8A7C70]">支出分類 *</label>
                    <select
                      value={newExpense.expense_category}
                      onChange={(e) => setNewExpense({...newExpense, expense_category: e.target.value})}
                      className="w-full rounded-2xl border border-[#F1E4D3] bg-gradient-to-r from-[#FFF5EC] via-[#FFF0F6] to-[#FFF8E8] px-4 py-3 text-sm font-medium text-[#4B4036] shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#F59BB5]/40 focus:border-[#F59BB5]/60 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23D48347%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpath d=%22M6 9l6 6 6-6%22/%3E%3C/svg%3E')] bg-no-repeat bg-right-4 bg-[length:16px_16px] pr-10"
                    >
                      <option value="">請選擇分類</option>
                      {expenseCategories.map(category => {
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
                  <h4 className="text-sm font-semibold text-[#4B4036]">支出詳情</h4>
                  <span className="text-xs text-[#A68A64]">描述與金額</span>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#8A7C70]">支出描述 *</label>
                    <input
                      type="text"
                      value={newExpense.expense_description}
                      onChange={(e) => setNewExpense({...newExpense, expense_description: e.target.value})}
                      placeholder="例如：購買教學器材"
                      className="w-full rounded-2xl border border-[#F1E4D3] bg-gradient-to-r from-[#FFF5EC] via-[#FFF0F6] to-[#FFF8E8] px-4 py-3 text-sm font-medium text-[#4B4036] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F59BB5]/40 focus:border-[#F59BB5]/60"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#8A7C70]">金額 *</label>
                    <input
                      type="number"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({...newExpense, amount: parseFloat(e.target.value) || 0})}
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
                      value={newExpense.payment_method}
                      onChange={(e) => setNewExpense({...newExpense, payment_method: e.target.value})}
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
                      value={newExpense.notes}
                      onChange={(e) => setNewExpense({...newExpense, notes: e.target.value})}
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
                  onClick={handleAddExpense}
                >
                  新增支出
                </button>
                <button
                  className="flex-1 rounded-2xl border border-[#EADBC8] bg-white/80 py-3 text-sm font-semibold text-[#8A7C70] shadow-sm transition hover:bg-[#FFF4DF]"
                  onClick={() => setShowAddExpense(false)}
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
                <div className="w-16 h-16 bg-gradient-to-br from-[#EF4444] to-[#DC2626] rounded-3xl flex items-center justify-center shadow-lg">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <ArrowTrendingDownIcon className="w-8 h-8 text-white" />
                  </motion.div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-[#4B4036]">支出管理</h1>
                  <p className="mt-2 text-sm sm:text-base text-[#2B3A3B]/70 max-w-3xl leading-relaxed">
                    管理機構的支出記錄。新增、編輯和查看所有支出詳情。
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

            {/* 總支出統計 */}
            <HanamiCard className="p-6 bg-gradient-to-br from-red-50 to-red-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                  <CurrencyDollarIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-xl font-bold text-red-600">
                    {formatCurrency(totalExpenses)}
                  </div>
                  <div className="text-xs text-[#2B3A3B] mt-1">總支出</div>
                </div>
              </div>
            </HanamiCard>

            {/* 支出筆數 */}
            <HanamiCard className="p-6 bg-gradient-to-br from-orange-50 to-orange-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                  <ArrowTrendingDownIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-xl font-bold text-orange-600">
                    {expenses.length}
                  </div>
                  <div className="text-xs text-[#2B3A3B] mt-1">支出筆數</div>
                </div>
              </div>
            </HanamiCard>

            {/* 平均支出 */}
            <HanamiCard className="p-6 bg-gradient-to-br from-pink-50 to-pink-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                  <CurrencyDollarIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-xl font-bold text-pink-600">
                    {expenses.length > 0 ? formatCurrency(totalExpenses / expenses.length) : formatCurrency(0)}
                  </div>
                  <div className="text-xs text-[#2B3A3B] mt-1">平均支出</div>
                </div>
              </div>
            </HanamiCard>
          </motion.div>

          {/* 支出列表 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* 支出列表 */}
            <HanamiCard className="p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <ArrowTrendingDownIcon className="w-6 h-6 text-[#FFB6C1]" />
                  </motion.div>
                  <h2 className="text-xl font-semibold text-[#2B3A3B]">支出記錄</h2>
                </div>
                <HanamiButton
                  onClick={() => {
                    setNewExpense({
                      expense_date: new Date().toISOString().slice(0, 10),
                      expense_category: '',
                      expense_description: '',
                      amount: 0,
                      payment_method: '',
                      notes: ''
                    });
                    setShowAddExpense(true);
                  }}
                  variant="primary"
                  size="sm"
                >
                  新增支出
                </HanamiButton>
              </div>

              {expenses.length > 0 ? (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {expenses.map((expense, index) => (
                    <motion.div
                      key={expense.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-sm border border-red-200 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-[#2B3A3B] mb-1 truncate">{expense.expense_description}</div>
                        <div className="text-sm text-gray-600 flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-1 bg-white/80 rounded-lg text-xs font-medium">
                            {expense.expense_category}
                          </span>
                          <span>•</span>
                          <span>{expense.expense_date}</span>
                          {expense.payment_method && (
                            <>
                              <span>•</span>
                              <span>{expense.payment_method}</span>
                            </>
                          )}
                        </div>
                        {expense.notes && (
                          <div className="text-xs text-gray-500 mt-1 truncate">
                            {expense.notes}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 ml-3">
                        <div className="text-right">
                          <div className="font-semibold text-red-600 text-lg">
                            {formatCurrency(expense.amount)}
                          </div>
                        </div>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex gap-2"
                        >
                          <HanamiButton
                            onClick={() => handleEditExpense(expense)}
                            variant="secondary"
                            size="sm"
                            className="bg-white/90 hover:bg-white text-blue-600 border-blue-300 shadow-sm"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </HanamiButton>
                          <HanamiButton
                            onClick={() => handleDeleteExpense(expense.id)}
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
                    <ArrowTrendingDownIcon className="w-12 h-12 text-gray-400" />
                  </motion.div>
                  <p className="text-lg font-medium">本月尚無支出記錄</p>
                </div>
              )}
            </HanamiCard>

            {/* 支出分類統計 */}
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

              {Object.keys(expensesByCategory).length > 0 ? (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {Object.entries(expensesByCategory)
                    .sort(([, a], [, b]) => b - a)
                    .map(([category, amount], index) => {
                      const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
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
                            <div className="font-semibold text-red-600">
                              {formatCurrency(amount)}
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 0.5, delay: index * 0.1 }}
                              className="bg-gradient-to-r from-red-400 to-red-600 h-2 rounded-full"
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
              )}
            </HanamiCard>
          </motion.div>
        </div>
      </div>

      {/* 使用 createPortal 渲染模態框 */}
      {isMounted && typeof document !== 'undefined' && document.body && (
        <>
          {addExpenseModalContent && createPortal(addExpenseModalContent, document.body)}
          {editExpenseModalContent && createPortal(editExpenseModalContent, document.body)}
        </>
      )}
    </>
  );
}

export default function ExpensesManagementPage() {
  return (
    <TeacherLinkShell currentPath="/aihome/teacher-link/create/financial-management/expenses">
      <ExpensesManagementContent />
    </TeacherLinkShell>
  );
}

