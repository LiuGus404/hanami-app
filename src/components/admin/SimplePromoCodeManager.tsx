'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { SimplePromoCode } from '@/types/simple-promo-codes';

interface SimplePromoCodeManagerProps {
  className?: string;
}

export default function SimplePromoCodeManager({ className = '' }: SimplePromoCodeManagerProps) {
  const [promoCodes, setPromoCodes] = useState<SimplePromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCode, setEditingCode] = useState<SimplePromoCode | null>(null);
  const [showUsageStats, setShowUsageStats] = useState<string | null>(null);

  // 載入優惠碼列表
  useEffect(() => {
    loadPromoCodes();
  }, []);

  const loadPromoCodes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/promo-codes/simple/list');
      if (!response.ok) {
        throw new Error('載入優惠碼失敗');
      }
      const data = await response.json();
      setPromoCodes(data.promo_codes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入優惠碼時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  // 創建新優惠碼
  const handleCreatePromoCode = async (promoCodeData: Partial<SimplePromoCode>) => {
    try {
      const response = await fetch('/api/promo-codes/simple/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(promoCodeData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '創建優惠碼失敗');
      }

      await loadPromoCodes();
      setShowCreateForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '創建優惠碼時發生錯誤');
    }
  };

  // 更新優惠碼
  const handleUpdatePromoCode = async (id: string, updates: Partial<SimplePromoCode>) => {
    try {
      const response = await fetch(`/api/promo-codes/simple/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '更新優惠碼失敗');
      }

      await loadPromoCodes();
      setEditingCode(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新優惠碼時發生錯誤');
    }
  };

  // 刪除優惠碼
  const handleDeletePromoCode = async (id: string) => {
    if (!confirm('確定要刪除此優惠碼嗎？此操作無法復原。')) {
      return;
    }

    try {
      const response = await fetch(`/api/promo-codes/simple/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '刪除優惠碼失敗');
      }

      await loadPromoCodes();
    } catch (err) {
      setError(err instanceof Error ? err.message : '刪除優惠碼時發生錯誤');
    }
  };

  // 切換優惠碼狀態
  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/promo-codes/simple/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '更新優惠碼狀態失敗');
      }

      await loadPromoCodes();
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新優惠碼狀態時發生錯誤');
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl p-8 shadow-lg border border-[#EADBC8] ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFD59A]"></div>
          <span className="ml-2 text-[#4B4036]">載入優惠碼中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl p-8 shadow-lg border border-[#EADBC8] ${className}`}>
      {/* 標題和操作按鈕 */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[#4B4036]">優惠碼管理</h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] px-4 py-2 rounded-lg font-medium hover:shadow-md transition-all duration-200"
        >
          <PlusIcon className="w-5 h-5" />
          <span>新增優惠碼</span>
        </motion.button>
      </div>

      {/* 錯誤訊息 */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
          <span className="text-red-700">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 優惠碼列表 */}
      <div className="space-y-4">
        {promoCodes.length === 0 ? (
          <div className="text-center py-8 text-[#2B3A3B]/70">
            <p>暫無優惠碼</p>
            <p className="text-sm mt-1">點擊「新增優惠碼」開始創建</p>
          </div>
        ) : (
          promoCodes.map((code) => (
            <motion.div
              key={code.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-[#FFF9F2] to-[#FFD59A]/20 rounded-lg p-4 border border-[#EADBC8]"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="font-bold text-[#4B4036] text-lg">{code.code}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      code.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {code.is_active ? '啟用中' : '已停用'}
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {code.institution_name}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-[#2B3A3B]/70">名稱:</span>
                      <p className="font-medium text-[#4B4036]">{code.name}</p>
                    </div>
                    <div>
                      <span className="text-[#2B3A3B]/70">折扣:</span>
                      <p className="font-medium text-[#4B4036]">
                        {code.discount_type === 'percentage' 
                          ? `${code.discount_value}%` 
                          : `$${code.discount_value}`
                        }
                      </p>
                    </div>
                    <div>
                      <span className="text-[#2B3A3B]/70">使用次數:</span>
                      <p className="font-medium text-[#4B4036]">
                        {code.used_count}/{code.total_usage_limit || '∞'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[#2B3A3B]/70">有效期:</span>
                      <p className="font-medium text-[#4B4036]">
                        {code.valid_until 
                          ? new Date(code.valid_until).toLocaleDateString('zh-TW')
                          : '永久有效'
                        }
                      </p>
                    </div>
                  </div>

                  {code.description && (
                    <div className="mt-2">
                      <span className="text-[#2B3A3B]/70">描述:</span>
                      <p className="text-[#4B4036]">{code.description}</p>
                    </div>
                  )}

                  {code.notes && (
                    <div className="mt-2">
                      <span className="text-[#2B3A3B]/70">備註:</span>
                      <p className="text-[#4B4036]">{code.notes}</p>
                    </div>
                  )}
                </div>

                {/* 操作按鈕 */}
                <div className="flex items-center space-x-2 ml-4">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowUsageStats(code.id)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="查看使用統計"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setEditingCode(code)}
                    className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                    title="編輯優惠碼"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleToggleStatus(code.id, code.is_active)}
                    className={`p-2 rounded-lg transition-colors ${
                      code.is_active 
                        ? 'text-red-600 hover:bg-red-50' 
                        : 'text-green-600 hover:bg-green-50'
                    }`}
                    title={code.is_active ? '停用優惠碼' : '啟用優惠碼'}
                  >
                    {code.is_active ? (
                      <XMarkIcon className="w-4 h-4" />
                    ) : (
                      <CheckIcon className="w-4 h-4" />
                    )}
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleDeletePromoCode(code.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="刪除優惠碼"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* 創建/編輯表單 */}
      {(showCreateForm || editingCode) && (
        <SimplePromoCodeForm
          promoCode={editingCode}
          onSubmit={editingCode 
            ? (data) => handleUpdatePromoCode(editingCode.id, data)
            : handleCreatePromoCode
          }
          onCancel={() => {
            setShowCreateForm(false);
            setEditingCode(null);
          }}
        />
      )}

      {/* 使用統計彈窗 */}
      {showUsageStats && (
        <UsageStatsModal
          promoCodeId={showUsageStats}
          onClose={() => setShowUsageStats(null)}
        />
      )}
    </div>
  );
}

// 優惠碼表單組件
interface SimplePromoCodeFormProps {
  promoCode?: SimplePromoCode | null;
  onSubmit: (data: Partial<SimplePromoCode>) => void;
  onCancel: () => void;
}

function SimplePromoCodeForm({ promoCode, onSubmit, onCancel }: SimplePromoCodeFormProps) {
  const [formData, setFormData] = useState({
    code: promoCode?.code || '',
    name: promoCode?.name || '',
    description: promoCode?.description || '',
    institution_name: promoCode?.institution_name || 'HanamiEcho',
    institution_code: promoCode?.institution_code || 'HE',
    discount_type: promoCode?.discount_type || 'percentage',
    discount_value: promoCode?.discount_value || 0,
    max_discount_amount: promoCode?.max_discount_amount || 0,
    total_usage_limit: promoCode?.total_usage_limit || 1,
    valid_until: promoCode?.valid_until ? new Date(promoCode.valid_until).toISOString().split('T')[0] : '',
    notes: promoCode?.notes || '',
    is_active: promoCode?.is_active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <h3 className="text-xl font-bold text-[#4B4036] mb-4">
          {promoCode ? '編輯優惠碼' : '新增優惠碼'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#4B4036] mb-1">
                優惠碼 *
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                placeholder="例如: HANAMI10"
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
                className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                placeholder="例如: 新用戶優惠"
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
              className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
              rows={2}
              placeholder="優惠碼描述..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#4B4036] mb-1">
                機構名稱 *
              </label>
              <input
                type="text"
                value={formData.institution_name}
                onChange={(e) => setFormData({ ...formData, institution_name: e.target.value })}
                className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                placeholder="例如: HanamiEcho"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#4B4036] mb-1">
                機構代碼
              </label>
              <input
                type="text"
                value={formData.institution_code}
                onChange={(e) => setFormData({ ...formData, institution_code: e.target.value })}
                className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                placeholder="例如: HE"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#4B4036] mb-1">
                折扣類型 *
              </label>
              <select
                value={formData.discount_type}
                onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as 'percentage' | 'fixed_amount' })}
                className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
              >
                <option value="percentage">百分比</option>
                <option value="fixed_amount">固定金額</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#4B4036] mb-1">
                折扣值 *
              </label>
              <input
                type="number"
                min="0"
                step={formData.discount_type === 'percentage' ? '1' : '0.01'}
                value={formData.discount_value}
                onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                placeholder={formData.discount_type === 'percentage' ? '10' : '100'}
                required
              />
            </div>

            {formData.discount_type === 'percentage' && (
              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-1">
                  最大折扣金額
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.max_discount_amount}
                  onChange={(e) => setFormData({ ...formData, max_discount_amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                  placeholder="0 (無限制)"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#4B4036] mb-1">
                使用次數限制
              </label>
              <input
                type="number"
                min="1"
                value={formData.total_usage_limit}
                onChange={(e) => setFormData({ ...formData, total_usage_limit: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                placeholder="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#4B4036] mb-1">
                有效期至
              </label>
              <input
                type="date"
                value={formData.valid_until}
                onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4B4036] mb-1">
              備註
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
              rows={2}
              placeholder="額外說明..."
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-[#FFD59A] bg-gray-100 border-gray-300 rounded focus:ring-[#FFD59A] focus:ring-2"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-[#4B4036]">
              啟用此優惠碼
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-[#4B4036] border border-[#EADBC8] rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] rounded-lg font-medium hover:shadow-md transition-all duration-200"
            >
              {promoCode ? '更新' : '創建'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// 使用統計彈窗組件
interface UsageStatsModalProps {
  promoCodeId: string;
  onClose: () => void;
}

function UsageStatsModal({ promoCodeId, onClose }: UsageStatsModalProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsageStats();
  }, [promoCodeId]);

  const loadUsageStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/promo-codes/simple/${promoCodeId}/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('載入使用統計失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl p-6 w-full max-w-lg"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-[#4B4036]">使用統計</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFD59A]"></div>
            <span className="ml-2 text-[#4B4036]">載入中...</span>
          </div>
        ) : stats ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-blue-600">總使用次數</div>
                <div className="text-2xl font-bold text-blue-800">{stats.used_count}</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-green-600">剩餘次數</div>
                <div className="text-2xl font-bold text-green-800">
                  {stats.total_usage_limit ? stats.total_usage_limit - stats.used_count : '∞'}
                </div>
              </div>
            </div>

            {stats.used_by_user_ids && stats.used_by_user_ids.length > 0 && (
              <div>
                <h4 className="font-semibold text-[#4B4036] mb-2">使用過的用戶ID</h4>
                <div className="bg-gray-50 p-3 rounded-lg max-h-32 overflow-y-auto">
                  <div className="flex flex-wrap gap-2">
                    {stats.used_by_user_ids.map((userId: string, index: number) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                        {userId}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {stats.used_by_emails && stats.used_by_emails.length > 0 && (
              <div>
                <h4 className="font-semibold text-[#4B4036] mb-2">使用過的郵箱</h4>
                <div className="bg-gray-50 p-3 rounded-lg max-h-32 overflow-y-auto">
                  <div className="flex flex-wrap gap-2">
                    {stats.used_by_emails.map((email: string, index: number) => (
                      <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                        {email}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-[#2B3A3B]/70">
            <p>無法載入使用統計</p>
          </div>
        )}

        <div className="flex justify-end pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] rounded-lg font-medium hover:shadow-md transition-all duration-200"
          >
            關閉
          </button>
        </div>
      </motion.div>
    </div>
  );
}
