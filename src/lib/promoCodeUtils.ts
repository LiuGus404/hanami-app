// 優惠碼相關工具函數

import { 
  PromoCodeValidationRequest, 
  PromoCodeValidationResponse, 
  PromoCodeUsageRequest,
  PromoCodeUsageResponse,
  DiscountInfo 
} from '@/types/promo-codes';

// 驗證優惠碼
export const validatePromoCode = async (
  code: string,
  orderAmount: number,
  userId?: string,
  userEmail?: string,
  courseType?: string
): Promise<PromoCodeValidationResponse> => {
  try {
    const request: PromoCodeValidationRequest = {
      code: code.toUpperCase().trim(),
      order_amount: orderAmount,
      user_id: userId,
      user_email: userEmail,
      course_type: courseType
    };

    const response = await fetch('/api/promo-codes/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const result: PromoCodeValidationResponse = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || '驗證優惠碼失敗');
    }

    return result;

  } catch (error) {
    console.error('❌ 驗證優惠碼失敗:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '驗證優惠碼失敗'
    };
  }
};

// 記錄優惠碼使用
export const recordPromoCodeUsage = async (
  promoCodeId: string,
  originalAmount: number,
  discountAmount: number,
  finalAmount: number,
  userId?: string,
  userEmail?: string,
  orderId?: string,
  metadata?: Record<string, any>
): Promise<PromoCodeUsageResponse> => {
  try {
    const request: PromoCodeUsageRequest = {
      promo_code_id: promoCodeId,
      user_id: userId,
      user_email: userEmail,
      order_id: orderId,
      original_amount: originalAmount,
      discount_amount: discountAmount,
      final_amount: finalAmount,
      metadata
    };

    const response = await fetch('/api/promo-codes/usage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const result: PromoCodeUsageResponse = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || '記錄優惠碼使用失敗');
    }

    return result;

  } catch (error) {
    console.error('❌ 記錄優惠碼使用失敗:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '記錄優惠碼使用失敗'
    };
  }
};

// 格式化折扣顯示
export const formatDiscountDisplay = (discountInfo: DiscountInfo): string => {
  if (discountInfo.discount_type === 'percentage') {
    return `${discountInfo.discount_value}% 折扣`;
  } else {
    return `減 $${discountInfo.discount_amount}`;
  }
};

// 格式化金額顯示
export const formatCurrency = (amount: number, currency: string = 'HKD'): string => {
  return new Intl.NumberFormat('zh-HK', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// 驗證優惠碼格式
export const isValidPromoCodeFormat = (code: string): boolean => {
  // 優惠碼應該是 3-20 個字符，只包含字母、數字和連字符
  const regex = /^[A-Z0-9-]{3,20}$/i;
  return regex.test(code);
};

// 清理優惠碼輸入
export const cleanPromoCode = (code: string): string => {
  return code.toUpperCase().trim().replace(/[^A-Z0-9-]/g, '');
};
