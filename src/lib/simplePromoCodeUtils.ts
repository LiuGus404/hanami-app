// 簡化版優惠碼相關工具函數

import { 
  SimplePromoCodeValidationRequest, 
  SimplePromoCodeValidationResponse, 
  SimplePromoCodeUsageRequest,
  SimplePromoCodeUsageResponse,
  SimpleDiscountInfo 
} from '@/types/simple-promo-codes';

// 驗證簡化版優惠碼
export const validateSimplePromoCode = async (
  code: string,
  orderAmount: number,
  userId?: string,
  userEmail?: string,
  orgId?: string
): Promise<SimplePromoCodeValidationResponse> => {
  try {
    const request: SimplePromoCodeValidationRequest = {
      code: code.toUpperCase().trim(),
      order_amount: orderAmount,
      user_id: userId,
      user_email: userEmail,
      org_id: orgId
    };

    const response = await fetch('/api/promo-codes/simple/validate-direct', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const result: SimplePromoCodeValidationResponse = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || '驗證優惠碼失敗');
    }

    return result;

  } catch (error) {
    console.error('❌ 驗證簡化版優惠碼失敗:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '驗證優惠碼失敗'
    };
  }
};

// 記錄簡化版優惠碼使用
export const useSimplePromoCode = async (
  promoCodeId: string,
  orderAmount: number,
  discountAmount: number,
  userId?: string,
  userEmail?: string
): Promise<SimplePromoCodeUsageResponse> => {
  try {
    const request: SimplePromoCodeUsageRequest = {
      promo_code_id: promoCodeId,
      user_id: userId,
      user_email: userEmail,
      order_amount: orderAmount,
      discount_amount: discountAmount
    };

    const response = await fetch('/api/promo-codes/simple/use-direct', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const result: SimplePromoCodeUsageResponse = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || '記錄優惠碼使用失敗');
    }

    return result;

  } catch (error) {
    console.error('❌ 記錄簡化版優惠碼使用失敗:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '記錄優惠碼使用失敗'
    };
  }
};

// 格式化折扣顯示
export const formatSimpleDiscountDisplay = (discountInfo: SimpleDiscountInfo): string => {
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

// 獲取機構優惠碼統計
export const getInstitutionPromoCodeStats = async (institutionName: string) => {
  try {
    const response = await fetch(`/api/promo-codes/simple/stats?institution=${encodeURIComponent(institutionName)}`);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || '獲取統計失敗');
    }

    return result;
  } catch (error) {
    console.error('❌ 獲取機構優惠碼統計失敗:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '獲取統計失敗'
    };
  }
};
