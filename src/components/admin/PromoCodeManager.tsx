'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  TicketIcon
} from '@heroicons/react/24/outline';
import { PromoCode, CreatePromoCodeRequest } from '@/types/promo-codes';

interface PromoCodeManagerProps {
  className?: string;
}

export default function PromoCodeManager({ className = '' }: PromoCodeManagerProps) {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null);
  const [formData, setFormData] = useState<CreatePromoCodeRequest>({
    code: '',
    name: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 10,
    usage_limit: 100,
    usage_limit_per_user: 1,
    min_order_amount: 0,
    is_active: true,
    is_public: true
  });

  // 載入優惠碼列表
  useEffect(() => {
    loadPromoCodes();
  }, []);

  const loadPromoCodes = async () => {
    try {
      setLoading(true);
      // 這裡應該調用 API 載入優惠碼列表
      // const response = await fetch('/api/admin/promo-codes');
      // const data = await response.json();
      // setPromoCodes(data.data || []);
      
      // 暫時使用模擬數據
      setPromoCodes([
        {
          id: '1',
          code: 'WELCOME10',
          name: '新用戶優惠',
          description: '首次報名享受10%折扣',
          discount_type: 'percentage',
          discount_value: 10,
          max_discount_amount: 100,
          usage_limit: 100,
          usage_limit_per_user: 1,
          min_order_amount: 0,
          valid_from: new Date().toISOString(),
          valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          applicable_products: ['trial', 'regular'],
          applicable_course_types: ['piano', 'violin', 'guitar'],
          is_active: true,
          is_public: true,
          total_used: 0,
          total_discount_amount: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);
    } catch (error) {
      console.error('載入優惠碼失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 這裡應該調用 API 創建或更新優惠碼
      console.log('提交優惠碼:', formData);
      
      // 重置表單
      setFormData({
        code: '',
        name: '',
        description: '',
        discount_type: 'percentage',
        discount_value: 10,
        usage_limit: 100,
        usage_limit_per_user: 1,
        min_order_amount: 0,
        is_active: true,
        is_public: true
      });
      setShowCreateForm(false);
      setEditingCode(null);
      
      // 重新載入列表
      loadPromoCodes();
    } catch (error) {
      console.error('提交優惠碼失敗:', error);
    }
  };

  const handleEdit = (code: PromoCode) => {
    setEditingCode(code);
    setFormData({
      code: code.code,
      name: code.name,
      description: code.description || '',
      discount_type: code.discount_type,
      discount_value: code.discount_value,
      max_discount_amount: code.max_discount_amount,
      usage_limit: code.usage_limit,
      usage_limit_per_user: code.usage_limit_per_user,
      min_order_amount: code.min_order_amount || 0,
      is_active: code.is_active,
      is_public: code.is_public
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除此優惠碼嗎？')) return;
    
    try {
      // 這裡應該調用 API 刪除優惠碼
      console.log('刪除優惠碼:', id);
      loadPromoCodes();
    } catch (error) {
      console.error('刪除優惠碼失敗:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-HK', {
      style: 'currency',
      currency: 'HKD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-HK');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFD59A]"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 標題和創建按鈕 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <TicketIcon className="w-8 h-8 text-[#FFD59A]" />
          <h2 className="text-2xl font-bold text-[#4B4036]">優惠碼管理</h2>
        </div>
        <motion.button
          onClick={() => setShowCreateForm(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] rounded-lg font-medium hover:from-[#EBC9A4] hover:to-[#FFD59A] transition-all duration-200 shadow-md"
        >
          <PlusIcon className="w-5 h-5" />
          <span>新增優惠碼</span>
        </motion.button>
      </div>

      {/* 創建/編輯表單 */}
      {showCreateForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 border border-[#EADBC8] shadow-lg"
        >
          <h3 className="text-lg font-bold text-[#4B4036] mb-4">
            {editingCode ? '編輯優惠碼' : '新增優惠碼'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-1">
                  優惠碼 *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="例如: WELCOME10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-1">
                  名稱 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例如: 新用戶優惠"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#4B4036] mb-1">
                描述
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="優惠碼描述"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                rows={2}
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-1">
                  折扣類型 *
                </label>
                <select
                  value={formData.discount_type}
                  onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as 'percentage' | 'fixed_amount' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                >
                  <option value="percentage">百分比折扣</option>
                  <option value="fixed_amount">固定金額折扣</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-1">
                  {formData.discount_type === 'percentage' ? '折扣百分比 *' : '折扣金額 *'}
                </label>
                <input
                  type="number"
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) })}
                  placeholder={formData.discount_type === 'percentage' ? '10' : '50'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                  required
                  min="0"
                  max={formData.discount_type === 'percentage' ? 100 : undefined}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-1">
                  使用次數限制
                </label>
                <input
                  type="number"
                  value={formData.usage_limit}
                  onChange={(e) => setFormData({ ...formData, usage_limit: parseInt(e.target.value) })}
                  placeholder="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                  min="1"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-1">
                  每用戶使用次數
                </label>
                <input
                  type="number"
                  value={formData.usage_limit_per_user}
                  onChange={(e) => setFormData({ ...formData, usage_limit_per_user: parseInt(e.target.value) })}
                  placeholder="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                  min="1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-1">
                  最低訂單金額
                </label>
                <input
                  type="number"
                  value={formData.min_order_amount}
                  onChange={(e) => setFormData({ ...formData, min_order_amount: parseFloat(e.target.value) })}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                  min="0"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-gray-300 text-[#FFD59A] focus:ring-[#FFD59A]"
                />
                <span className="text-sm text-[#4B4036]">啟用</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.is_public}
                  onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                  className="rounded border-gray-300 text-[#FFD59A] focus:ring-[#FFD59A]"
                />
                <span className="text-sm text-[#4B4036]">公開顯示</span>
              </label>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingCode(null);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] rounded-lg font-medium hover:from-[#EBC9A4] hover:to-[#FFD59A] transition-all duration-200 shadow-md"
              >
                {editingCode ? '更新' : '創建'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* 優惠碼列表 */}
      <div className="bg-white rounded-xl border border-[#EADBC8] shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#FFF9F2]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#4B4036] uppercase tracking-wider">
                  優惠碼
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#4B4036] uppercase tracking-wider">
                  名稱
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#4B4036] uppercase tracking-wider">
                  折扣
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#4B4036] uppercase tracking-wider">
                  使用情況
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#4B4036] uppercase tracking-wider">
                  狀態
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#4B4036] uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EADBC8]">
              {promoCodes.map((code) => (
                <tr key={code.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-[#4B4036]">
                        {code.code}
                      </code>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-[#4B4036]">{code.name}</div>
                      {code.description && (
                        <div className="text-sm text-gray-500">{code.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-[#4B4036]">
                      {code.discount_type === 'percentage' 
                        ? `${code.discount_value}%` 
                        : formatCurrency(code.discount_value)
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-[#4B4036]">
                      {code.total_used} / {code.usage_limit || '∞'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {code.is_active ? (
                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircleIcon className="w-5 h-5 text-red-500" />
                      )}
                      <span className="text-sm text-[#4B4036]">
                        {code.is_active ? '啟用' : '停用'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(code)}
                        className="text-[#FFD59A] hover:text-[#EBC9A4] transition-colors"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(code.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
