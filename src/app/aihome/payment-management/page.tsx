'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCardIcon,
  PhotoIcon,
  ChartBarIcon,
  EyeIcon,
  TrashIcon,
  ArrowPathIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  FolderIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';
import toast from 'react-hot-toast';

interface PaymentRecord {
  id: string;
  payment_method: string;
  amount: number;
  currency: string;
  description: string;
  status: string;
  created_at: string;
  screenshot_url?: string;
  airwallex_intent_id?: string;
  user_email?: string;
}

interface PaymentStatistics {
  overview: {
    totalPayments: number;
    totalAmount: number;
    successfulPayments: number;
    failedPayments: number;
    pendingPayments: number;
    successRate: number;
    averageAmount: number;
  };
  paymentMethods: Record<string, any>;
  recentTransactions: PaymentRecord[];
}

interface DateFolder {
  name: string;
  created_at: string;
  fileCount: number;
  formattedDate: string;
}

interface StorageFile {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: any;
  publicUrl: string;
  downloadUrl: string;
}

export default function PaymentManagementPage() {
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [statistics, setStatistics] = useState<PaymentStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<PaymentRecord | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [dateFolders, setDateFolders] = useState<DateFolder[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [storageFiles, setStorageFiles] = useState<StorageFile[]>([]);
  const [showFileManager, setShowFileManager] = useState(false);
  const [filter, setFilter] = useState({
    status: '',
    payment_method: '',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 載入付款記錄
      const params = new URLSearchParams();
      if (filter.status) params.append('status', filter.status);
      if (filter.payment_method) params.append('payment_method', filter.payment_method);
      if (filter.start_date) params.append('start_date', filter.start_date);
      if (filter.end_date) params.append('end_date', filter.end_date);

      const recordsResponse = await fetch(`/api/aihome/payment/records?${params}`);
      const recordsData = await recordsResponse.json();

      if (recordsData.success) {
        setRecords(recordsData.data);
      }

      // 載入統計數據
      const statsResponse = await fetch(`/api/aihome/payment/statistics?${params}`);
      const statsData = await statsResponse.json();

      if (statsData.success) {
        setStatistics(statsData.data);
      }

    } catch (error) {
      console.error('載入數據錯誤:', error);
      toast.error('載入數據失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!confirm('確定要刪除這筆付款記錄嗎？')) return;

    try {
      const response = await fetch(`/api/aihome/payment/records?id=${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();

      if (data.success) {
        toast.success('付款記錄已刪除');
        loadData();
      } else {
        toast.error(data.error || '刪除失敗');
      }
    } catch (error) {
      console.error('刪除錯誤:', error);
      toast.error('刪除失敗');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'processing': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'failed': return '失敗';
      case 'pending': return '待處理';
      case 'processing': return '處理中';
      default: return status;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'screenshot': return PhotoIcon;
      case 'airwallex': return CreditCardIcon;
      default: return CreditCardIcon;
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'screenshot': return '付款截圖';
      case 'airwallex': return 'Airwallex';
      default: return method;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#FFD59A] mx-auto mb-4"></div>
          <p className="text-[#4B4036]">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A] py-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* 頁面標題 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-[#4B4036] mb-4">
            支付管理
          </h1>
          <p className="text-lg text-[#2B3A3B]">
            管理所有付款記錄和統計數據
          </p>
        </motion.div>

        {/* 統計卡片 */}
        {statistics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <HanamiCard className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-[#FFD59A] rounded-full flex items-center justify-center mr-4">
                  <CreditCardIcon className="w-6 h-6 text-[#2B3A3B]" />
                </div>
                <div>
                  <p className="text-sm text-[#2B3A3B]">總付款數</p>
                  <p className="text-2xl font-bold text-[#4B4036]">{statistics.overview.totalPayments}</p>
                </div>
              </div>
            </HanamiCard>

            <HanamiCard className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-[#10B981] rounded-full flex items-center justify-center mr-4">
                  <CurrencyDollarIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-[#2B3A3B]">總金額</p>
                  <p className="text-2xl font-bold text-[#4B4036]">HKD {statistics.overview.totalAmount}</p>
                </div>
              </div>
            </HanamiCard>

            <HanamiCard className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-[#3B82F6] rounded-full flex items-center justify-center mr-4">
                  <ChartBarIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-[#2B3A3B]">成功率</p>
                  <p className="text-2xl font-bold text-[#4B4036]">{statistics.overview.successRate}%</p>
                </div>
              </div>
            </HanamiCard>

            <HanamiCard className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-[#F59E0B] rounded-full flex items-center justify-center mr-4">
                  <CalendarIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-[#2B3A3B]">待處理</p>
                  <p className="text-2xl font-bold text-[#4B4036]">{statistics.overview.pendingPayments}</p>
                </div>
              </div>
            </HanamiCard>
          </motion.div>
        )}

        {/* 篩選器 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <HanamiCard className="p-6">
            <h2 className="text-xl font-semibold text-[#4B4036] mb-4">篩選條件</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-2">狀態</label>
                <select
                  value={filter.status}
                  onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                  className="w-full px-4 py-2 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                >
                  <option value="">全部狀態</option>
                  <option value="pending">待處理</option>
                  <option value="processing">處理中</option>
                  <option value="completed">已完成</option>
                  <option value="failed">失敗</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-2">付款方式</label>
                <select
                  value={filter.payment_method}
                  onChange={(e) => setFilter({ ...filter, payment_method: e.target.value })}
                  className="w-full px-4 py-2 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                >
                  <option value="">全部方式</option>
                  <option value="screenshot">付款截圖</option>
                  <option value="airwallex">Airwallex</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-2">開始日期</label>
                <input
                  type="date"
                  value={filter.start_date}
                  onChange={(e) => setFilter({ ...filter, start_date: e.target.value })}
                  className="w-full px-4 py-2 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4B4036] mb-2">結束日期</label>
                <input
                  type="date"
                  value={filter.end_date}
                  onChange={(e) => setFilter({ ...filter, end_date: e.target.value })}
                  className="w-full px-4 py-2 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent"
                />
              </div>
            </div>
            <div className="mt-4">
              <HanamiButton
                onClick={() => setFilter({ status: '', payment_method: '', start_date: '', end_date: '' })}
                variant="secondary"
                size="sm"
              >
                清除篩選
              </HanamiButton>
            </div>
          </HanamiCard>
        </motion.div>

        {/* 付款記錄列表 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <HanamiCard className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-[#4B4036]">付款記錄</h2>
              <HanamiButton
                onClick={loadData}
                variant="secondary"
                size="sm"
                className="flex items-center"
              >
                <ArrowPathIcon className="w-4 h-4 mr-2" />
                重新載入
              </HanamiButton>
            </div>

            {records.length === 0 ? (
              <div className="text-center py-12">
                <CreditCardIcon className="w-16 h-16 text-[#EADBC8] mx-auto mb-4" />
                <p className="text-[#2B3A3B]">沒有找到付款記錄</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#EADBC8]">
                      <th className="text-left py-3 px-4 text-[#4B4036] font-semibold">付款方式</th>
                      <th className="text-left py-3 px-4 text-[#4B4036] font-semibold">金額</th>
                      <th className="text-left py-3 px-4 text-[#4B4036] font-semibold">狀態</th>
                      <th className="text-left py-3 px-4 text-[#4B4036] font-semibold">說明</th>
                      <th className="text-left py-3 px-4 text-[#4B4036] font-semibold">時間</th>
                      <th className="text-left py-3 px-4 text-[#4B4036] font-semibold">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => {
                      const MethodIcon = getPaymentMethodIcon(record.payment_method);
                      return (
                        <tr key={record.id} className="border-b border-[#EADBC8] hover:bg-[#FFF9F2]">
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <MethodIcon className="w-5 h-5 text-[#4B4036] mr-2" />
                              <span className="text-[#2B3A3B]">
                                {getPaymentMethodText(record.payment_method)}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-[#4B4036]">
                              {record.currency} {record.amount}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                              {getStatusText(record.status)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-[#2B3A3B] truncate max-w-xs">
                              {record.description}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-[#2B3A3B] text-sm">
                              {new Date(record.created_at).toLocaleString('zh-TW')}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedRecord(record);
                                  setShowDetails(true);
                                }}
                                className="p-1 text-[#4B4036] hover:text-[#2B3A3B] transition-colors"
                                title="查看詳情"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteRecord(record.id)}
                                className="p-1 text-red-500 hover:text-red-700 transition-colors"
                                title="刪除記錄"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </HanamiCard>
        </motion.div>

        {/* 詳情彈窗 */}
        {showDetails && selectedRecord && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-[#4B4036]">付款詳情</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-[#2B3A3B] hover:text-[#4B4036] transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#4B4036] mb-1">付款方式</label>
                    <p className="text-[#2B3A3B]">{getPaymentMethodText(selectedRecord.payment_method)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4B4036] mb-1">狀態</label>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedRecord.status)}`}>
                      {getStatusText(selectedRecord.status)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4B4036] mb-1">金額</label>
                    <p className="text-[#2B3A3B] font-semibold">{selectedRecord.currency} {selectedRecord.amount}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4B4036] mb-1">創建時間</label>
                    <p className="text-[#2B3A3B]">{new Date(selectedRecord.created_at).toLocaleString('zh-TW')}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#4B4036] mb-1">說明</label>
                  <p className="text-[#2B3A3B]">{selectedRecord.description}</p>
                </div>

                {selectedRecord.screenshot_url && (
                  <div>
                    <label className="block text-sm font-medium text-[#4B4036] mb-1">付款截圖</label>
                    <img
                      src={selectedRecord.screenshot_url}
                      alt="付款截圖"
                      className="max-w-full h-auto rounded-lg border border-[#EADBC8]"
                    />
                  </div>
                )}

                {selectedRecord.airwallex_intent_id && (
                  <div>
                    <label className="block text-sm font-medium text-[#4B4036] mb-1">Airwallex 交易 ID</label>
                    <p className="text-[#2B3A3B] font-mono text-sm">{selectedRecord.airwallex_intent_id}</p>
                  </div>
                )}

                {selectedRecord.user_email && (
                  <div>
                    <label className="block text-sm font-medium text-[#4B4036] mb-1">用戶郵箱</label>
                    <p className="text-[#2B3A3B]">{selectedRecord.user_email}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end space-x-4">
                <HanamiButton
                  onClick={() => setShowDetails(false)}
                  variant="secondary"
                >
                  關閉
                </HanamiButton>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

