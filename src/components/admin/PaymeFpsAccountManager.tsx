'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  CheckIcon, 
  XMarkIcon,
  PhoneIcon,
  LinkIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { PaymeFpsAccount, CreatePaymeFpsAccountRequest } from '@/types/payme-fps';
import { formatPaymePhone, validatePaymePhone } from '@/lib/paymeFpsUtils';

interface PaymeFpsAccountManagerProps {
  className?: string;
}

export default function PaymeFpsAccountManager({ className = '' }: PaymeFpsAccountManagerProps) {
  const [accounts, setAccounts] = useState<PaymeFpsAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<PaymeFpsAccount | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 表單狀態
  const [formData, setFormData] = useState<CreatePaymeFpsAccountRequest>({
    institution_name: 'Hanami Music Academy',
    payme_phone: '',
    payme_name: '',
    payme_link: '',
    fps_phone: '',
    fps_name: '',
    fps_link: '',
    is_primary: false,
    notes: ''
  });

  // 載入帳戶列表
  const loadAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/payme-fps-accounts?active_only=true');
      const result = await response.json();
      
      if (result.success) {
        setAccounts(result.data || []);
      } else {
        console.error('載入帳戶失敗:', result.error);
      }
    } catch (error) {
      console.error('載入帳戶失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  // 重置表單
  const resetForm = () => {
    setFormData({
      institution_name: 'Hanami Music Academy',
      payme_phone: '',
      payme_name: '',
      payme_link: '',
      fps_phone: '',
      fps_name: '',
      fps_link: '',
      is_primary: false,
      notes: ''
    });
    setErrors({});
    setEditingAccount(null);
  };

  // 驗證表單
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.institution_name.trim()) {
      newErrors.institution_name = '請輸入機構名稱';
    }

    if (!formData.payme_phone.trim()) {
      newErrors.payme_phone = '請輸入 PAYME 電話';
    } else if (!validatePaymePhone(formData.payme_phone)) {
      newErrors.payme_phone = '請輸入有效的香港電話號碼';
    }

    if (!formData.payme_name.trim()) {
      newErrors.payme_name = '請輸入 PAYME 名稱';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 提交表單
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const url = editingAccount 
        ? `/api/admin/payme-fps-accounts/${editingAccount.id}`
        : '/api/admin/payme-fps-accounts';
      
      const method = editingAccount ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingAccount ? { ...formData, id: editingAccount.id } : formData),
      });

      const result = await response.json();

      if (result.success) {
        await loadAccounts();
        resetForm();
        setShowCreateForm(false);
      } else {
        setErrors({ submit: result.error || '操作失敗' });
      }
    } catch (error) {
      console.error('提交失敗:', error);
      setErrors({ submit: '提交失敗，請稍後再試' });
    }
  };

  // 編輯帳戶
  const handleEdit = (account: PaymeFpsAccount) => {
    setFormData({
      institution_name: account.institution_name,
      institution_code: account.institution_code,
      payme_phone: account.payme_phone,
      payme_name: account.payme_name,
      payme_link: account.payme_link || '',
      fps_phone: account.fps_phone || '',
      fps_name: account.fps_name || '',
      fps_link: account.fps_link || '',
      is_primary: account.is_primary,
      notes: account.notes || ''
    });
    setEditingAccount(account);
    setShowCreateForm(true);
  };

  // 刪除帳戶
  const handleDelete = async (account: PaymeFpsAccount) => {
    if (!confirm('確定要刪除此帳戶嗎？')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/payme-fps-accounts/${account.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        await loadAccounts();
      } else {
        alert('刪除失敗：' + result.error);
      }
    } catch (error) {
      console.error('刪除失敗:', error);
      alert('刪除失敗，請稍後再試');
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 標題和操作按鈕 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#4B4036]">PAYME FPS 帳戶管理</h2>
          <p className="text-[#2B3A3B]/70">管理機構的 PAYME 和 FPS 支付帳戶</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            resetForm();
            setShowCreateForm(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-[#FFD59A] text-[#4B4036] rounded-lg font-semibold hover:bg-[#FFD59A]/80 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          <span>新增帳戶</span>
        </motion.button>
      </div>

      {/* 帳戶列表 */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFD59A] mx-auto"></div>
          <p className="text-[#2B3A3B]/70 mt-2">載入中...</p>
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-8">
          <InformationCircleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-[#2B3A3B]/70">尚未設置任何 PAYME FPS 帳戶</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {accounts.map((account) => (
            <motion.div
              key={account.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-6 border border-[#EADBC8] shadow-sm"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-bold text-[#4B4036]">{account.institution_name}</h3>
                    {account.is_primary && (
                      <span className="px-2 py-1 bg-[#FFD59A] text-[#4B4036] text-xs font-semibold rounded-full">
                        主要帳戶
                      </span>
                    )}
                  </div>
                  {account.institution_code && (
                    <p className="text-sm text-[#2B3A3B]/70">機構代碼: {account.institution_code}</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(account)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(account)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* PAYME 資訊 */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-3 flex items-center">
                    <PhoneIcon className="w-5 h-5 mr-2" />
                    PAYME 帳戶
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">電話:</span> {formatPaymePhone(account.payme_phone)}</p>
                    <p><span className="font-medium">名稱:</span> {account.payme_name}</p>
                    {account.payme_link && (
                      <p className="flex items-center">
                        <span className="font-medium">連結:</span>
                        <a href={account.payme_link} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 hover:underline flex items-center">
                          <LinkIcon className="w-4 h-4 mr-1" />
                          開啟
                        </a>
                      </p>
                    )}
                  </div>
                </div>

                {/* FPS 資訊 */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                    <PhoneIcon className="w-5 h-5 mr-2" />
                    FPS 帳戶
                  </h4>
                  {account.fps_phone ? (
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">電話:</span> {formatPaymePhone(account.fps_phone)}</p>
                      {account.fps_name && <p><span className="font-medium">名稱:</span> {account.fps_name}</p>}
                      {account.fps_link && (
                        <p className="flex items-center">
                          <span className="font-medium">連結:</span>
                          <a href={account.fps_link} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 hover:underline flex items-center">
                            <LinkIcon className="w-4 h-4 mr-1" />
                            開啟
                          </a>
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">未設置 FPS 帳戶</p>
                  )}
                </div>
              </div>

              {account.notes && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">備註:</span> {account.notes}
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* 創建/編輯表單 */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-[#4B4036]">
                  {editingAccount ? '編輯帳戶' : '新增帳戶'}
                </h3>
                <button
                  onClick={() => {
                    resetForm();
                    setShowCreateForm(false);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 機構資訊 */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#4B4036] mb-2">
                      機構名稱 *
                    </label>
                    <input
                      type="text"
                      value={formData.institution_name}
                      onChange={(e) => setFormData({ ...formData, institution_name: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent ${
                        errors.institution_name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="輸入機構名稱"
                    />
                    {errors.institution_name && (
                      <p className="text-red-500 text-sm mt-1">{errors.institution_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#4B4036] mb-2">
                      機構代碼
                    </label>
                    <input
                      type="text"
                      value={formData.institution_code || ''}
                      onChange={(e) => setFormData({ ...formData, institution_code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                      placeholder="輸入機構代碼"
                    />
                  </div>
                </div>

                {/* PAYME 資訊 */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-[#4B4036] mb-4">PAYME 帳戶資訊</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#4B4036] mb-2">
                        PAYME 電話 *
                      </label>
                      <input
                        type="tel"
                        value={formData.payme_phone}
                        onChange={(e) => setFormData({ ...formData, payme_phone: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent ${
                          errors.payme_phone ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="+852 1234 5678"
                      />
                      {errors.payme_phone && (
                        <p className="text-red-500 text-sm mt-1">{errors.payme_phone}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#4B4036] mb-2">
                        PAYME 名稱 *
                      </label>
                      <input
                        type="text"
                        value={formData.payme_name}
                        onChange={(e) => setFormData({ ...formData, payme_name: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent ${
                          errors.payme_name ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="輸入 PAYME 顯示名稱"
                      />
                      {errors.payme_name && (
                        <p className="text-red-500 text-sm mt-1">{errors.payme_name}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[#4B4036] mb-2">
                        PAYME 連結
                      </label>
                      <input
                        type="url"
                        value={formData.payme_link}
                        onChange={(e) => setFormData({ ...formData, payme_link: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                        placeholder="https://payme.hsbc.com.hk/..."
                      />
                    </div>
                  </div>
                </div>

                {/* FPS 資訊 */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-[#4B4036] mb-4">FPS 帳戶資訊 (可選)</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#4B4036] mb-2">
                        FPS 電話
                      </label>
                      <input
                        type="tel"
                        value={formData.fps_phone}
                        onChange={(e) => setFormData({ ...formData, fps_phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                        placeholder="+852 9876 5432"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#4B4036] mb-2">
                        FPS 名稱
                      </label>
                      <input
                        type="text"
                        value={formData.fps_name}
                        onChange={(e) => setFormData({ ...formData, fps_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                        placeholder="輸入 FPS 顯示名稱"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[#4B4036] mb-2">
                        FPS 連結
                      </label>
                      <input
                        type="url"
                        value={formData.fps_link}
                        onChange={(e) => setFormData({ ...formData, fps_link: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                        placeholder="https://fps.hkma.gov.hk/..."
                      />
                    </div>
                  </div>
                </div>

                {/* 其他設定 */}
                <div className="border-t pt-4">
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="is_primary"
                        checked={formData.is_primary}
                        onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                        className="w-4 h-4 text-[#FFD59A] bg-gray-100 border-gray-300 rounded focus:ring-[#FFD59A] focus:ring-2"
                      />
                      <label htmlFor="is_primary" className="ml-2 text-sm font-medium text-[#4B4036]">
                        設為主要帳戶
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#4B4036] mb-2">
                        備註
                      </label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                        placeholder="輸入備註資訊"
                      />
                    </div>
                  </div>
                </div>

                {errors.submit && (
                  <div className="text-red-500 text-sm">{errors.submit}</div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setShowCreateForm(false);
                    }}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#FFD59A] text-[#4B4036] rounded-lg font-semibold hover:bg-[#FFD59A]/80 transition-colors flex items-center space-x-2"
                  >
                    <CheckIcon className="w-4 h-4" />
                    <span>{editingAccount ? '更新' : '創建'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
