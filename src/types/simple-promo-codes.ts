// 簡化版優惠碼相關類型定義

export interface SimplePromoCode {
  id: string;
  code: string;
  name: string;
  description?: string;
  institution_name: string; // 所屬機構
  institution_code?: string; // 機構代碼
  total_usage_limit: number; // 總使用次數限制
  used_count: number; // 已使用次數
  used_by_user_ids: string[]; // 使用過的用戶ID列表
  used_by_emails: string[]; // 使用過的用戶郵箱列表
  valid_from: string;
  valid_until?: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  max_discount_amount?: number;
  is_active: boolean;
  notes?: string; // 備註欄位
  created_at: string;
  updated_at: string;
}

export interface SimplePromoCodeValidation {
  is_valid: boolean;
  promo_code_id?: string;
  discount_amount: number;
  final_amount: number;
  error_message?: string;
  institution_name?: string;
}

export interface SimplePromoCodeValidationRequest {
  code: string;
  user_id?: string;
  user_email?: string;
  order_amount: number;
}

export interface SimplePromoCodeValidationResponse {
  success: boolean;
  data?: SimplePromoCodeValidation;
  error?: string;
}

export interface SimplePromoCodeUsageRequest {
  promo_code_id: string;
  user_id?: string;
  user_email?: string;
  order_amount: number;
  discount_amount: number;
}

export interface SimplePromoCodeUsageResponse {
  success: boolean;
  data?: {
    used: boolean;
  };
  error?: string;
}

// 創建優惠碼請求
export interface CreateSimplePromoCodeRequest {
  code: string;
  name: string;
  description?: string;
  institution_name: string;
  institution_code?: string;
  total_usage_limit?: number;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  max_discount_amount?: number;
  valid_from?: string;
  valid_until?: string;
  is_active?: boolean;
  notes?: string;
}

// 更新優惠碼請求
export interface UpdateSimplePromoCodeRequest extends Partial<CreateSimplePromoCodeRequest> {
  id: string;
}

// 前端使用的折扣資訊
export interface SimpleDiscountInfo {
  code: string;
  name: string;
  institution_name: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  discount_amount: number;
  original_amount: number;
  final_amount: number;
  notes?: string;
}

// 機構優惠碼統計
export interface InstitutionPromoCodeStats {
  institution_name: string;
  institution_code?: string;
  total_codes: number;
  active_codes: number;
  total_usage: number;
  total_discount_amount: number;
}

// API 響應類型
export interface SimplePromoCodeListResponse {
  success: boolean;
  data?: SimplePromoCode[];
  error?: string;
}

export interface SimplePromoCodeResponse {
  success: boolean;
  data?: SimplePromoCode;
  error?: string;
}

export interface InstitutionStatsResponse {
  success: boolean;
  data?: InstitutionPromoCodeStats[];
  error?: string;
}
