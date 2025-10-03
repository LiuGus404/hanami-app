// 優惠碼相關類型定義

export interface PromoCode {
  id: string;
  code: string;
  name: string;
  description?: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  max_discount_amount?: number;
  usage_limit?: number;
  usage_limit_per_user: number;
  min_order_amount?: number;
  valid_from: string;
  valid_until?: string;
  applicable_products?: string[];
  applicable_course_types?: string[];
  is_active: boolean;
  is_public: boolean;
  total_used: number;
  total_discount_amount: number;
  created_at: string;
  updated_at: string;
}

export interface PromoCodeUsage {
  id: string;
  promo_code_id: string;
  user_id?: string;
  user_email?: string;
  order_id?: string;
  original_amount: number;
  discount_amount: number;
  final_amount: number;
  used_at: string;
  metadata?: Record<string, any>;
}

export interface PromoCodeValidation {
  is_valid: boolean;
  promo_code_id?: string;
  discount_amount: number;
  final_amount: number;
  error_message?: string;
}

export interface PromoCodeValidationRequest {
  code: string;
  user_id?: string;
  user_email?: string;
  order_amount: number;
  course_type?: string;
}

export interface PromoCodeValidationResponse {
  success: boolean;
  data?: PromoCodeValidation;
  error?: string;
}

export interface PromoCodeUsageRequest {
  promo_code_id: string;
  user_id?: string;
  user_email?: string;
  order_id?: string;
  original_amount: number;
  discount_amount: number;
  final_amount: number;
  metadata?: Record<string, any>;
}

export interface PromoCodeUsageResponse {
  success: boolean;
  data?: {
    usage_id: string;
  };
  error?: string;
}

// 前端使用的折扣資訊
export interface DiscountInfo {
  code: string;
  name: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  discount_amount: number;
  original_amount: number;
  final_amount: number;
  description?: string;
}

// 優惠碼管理相關
export interface CreatePromoCodeRequest {
  code: string;
  name: string;
  description?: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  max_discount_amount?: number;
  usage_limit?: number;
  usage_limit_per_user?: number;
  min_order_amount?: number;
  valid_from?: string;
  valid_until?: string;
  applicable_products?: string[];
  applicable_course_types?: string[];
  is_active?: boolean;
  is_public?: boolean;
}

export interface UpdatePromoCodeRequest extends Partial<CreatePromoCodeRequest> {
  id: string;
}

export interface PromoCodeListResponse {
  success: boolean;
  data?: PromoCode[];
  error?: string;
}

export interface PromoCodeResponse {
  success: boolean;
  data?: PromoCode;
  error?: string;
}
