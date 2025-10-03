// 支付相關工具函數

import { PaymentMethod, PaymentRequest, AirwallexPaymentResponse, ScreenshotUploadData } from '@/types/payment';
import { ScreenshotIcon, AirwallexIcon } from '@/components/payment/PaymentIcons';

// 支付方法配置
export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'screenshot',
    name: '上傳付款截圖',
    description: '上傳您的PAYME和FPS付款截圖\n我們將在1工作天內確認付款',
    icon: ScreenshotIcon,
    type: 'screenshot',
    enabled: true
  },
  {
    id: 'airwallex',
    name: 'Airwallex 線上支付',
    description: '支援信用卡、轉數快、Alipay、WeChat Pay等支付方法\n手續費為1.5%',
    icon: AirwallexIcon,
    type: 'airwallex',
    enabled: true
  }
];

// 驗證檔案類型
export const validateFileType = (file: File): boolean => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return allowedTypes.includes(file.type);
};

// 驗證檔案大小
export const validateFileSize = (file: File, maxSizeMB: number = 10): boolean => {
  return file.size <= maxSizeMB * 1024 * 1024;
};

// 生成檔案名稱
export const generateFileName = (file: File): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateFolder = `${year}-${month}-${day}`;
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2);
  const fileExt = file.name.split('.').pop();
  return `payment-screenshots/${dateFolder}/${timestamp}-${randomId}.${fileExt}`;
};

// 格式化金額
export const formatAmount = (amount: number, currency: string = 'HKD'): string => {
  return new Intl.NumberFormat('zh-HK', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// 創建 Airwallex 支付請求
export const createAirwallexPayment = async (request: PaymentRequest): Promise<AirwallexPaymentResponse> => {
  try {
    const response = await fetch('/api/aihome/payment/airwallex-simple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error('響應 JSON 解析錯誤:', jsonError);
      throw new Error(`響應格式錯誤: ${response.status} ${response.statusText}`);
    }
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return data;
  } catch (error) {
    console.error('Airwallex 支付創建失敗:', error);
    throw error;
  }
};

// 上傳付款截圖
export const uploadScreenshot = async (uploadData: ScreenshotUploadData & { userId?: string }): Promise<{ success: boolean; url?: string; data?: any; error?: string }> => {
  try {
    // 驗證檔案
    if (!validateFileType(uploadData.file)) {
      throw new Error('請選擇圖片檔案 (JPG, PNG, GIF, WebP)');
    }

    if (!validateFileSize(uploadData.file)) {
      throw new Error('檔案大小不能超過 10MB');
    }

    // 創建 FormData
    const formData = new FormData();
    formData.append('file', uploadData.file);
    formData.append('amount', uploadData.amount.toString());
    formData.append('description', uploadData.description);
    if (uploadData.userId) {
      formData.append('userId', uploadData.userId);
    }
    if (uploadData.metadata) {
      formData.append('metadata', JSON.stringify(uploadData.metadata));
    }

    const response = await fetch('/api/aihome/payment/upload-screenshot', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return {
      success: data.success,
      url: data.data?.screenshot_url,
      data: data.data,
      error: data.error
    };
  } catch (error) {
    console.error('截圖上傳失敗:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '上傳失敗，請稍後再試'
    };
  }
};

// 獲取支付記錄
export const getPaymentRecords = async (params?: {
  user_id?: string;
  status?: string;
  payment_method?: string;
  limit?: number;
  offset?: number;
}): Promise<{ success: boolean; data?: any[]; error?: string }> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.user_id) queryParams.append('user_id', params.user_id);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.payment_method) queryParams.append('payment_method', params.payment_method);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const response = await fetch(`/api/aihome/payment/records?${queryParams.toString()}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return data;
  } catch (error) {
    console.error('獲取支付記錄失敗:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '獲取支付記錄失敗'
    };
  }
};

// 獲取支付統計
export const getPaymentStatistics = async (params?: {
  start_date?: string;
  end_date?: string;
  group_by?: 'day' | 'week' | 'month';
}): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    if (params?.group_by) queryParams.append('group_by', params.group_by);

    const response = await fetch(`/api/aihome/payment/statistics?${queryParams.toString()}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return data;
  } catch (error) {
    console.error('獲取支付統計失敗:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '獲取支付統計失敗'
    };
  }
};
