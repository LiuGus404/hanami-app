// =====================================================
// Hanami 課程價格管理系統 - TypeScript 型別定義
// =====================================================

export interface CourseType {
  id: string;
  name: string;
  status: boolean;
  created_at: string;
  trial_limit: number;
  price_per_lesson?: number;
  age_range?: string;
  description?: string;
  min_age?: number;
  max_age?: number;
  duration_minutes: number;
  max_students: number;
  difficulty_level: string;
  color_code: string;
  icon_type: string;
  display_order: number;
  is_featured: boolean;
  prerequisites?: string;
  learning_objectives?: string[];
  updated_at: string;
  // 新增的價格相關欄位
  base_price_monthly?: number;
  base_price_yearly?: number;
  base_price_per_lesson?: number;
  currency: string;
  pricing_model: 'monthly' | 'yearly' | 'per_lesson' | 'package';
  is_pricing_enabled: boolean;
  pricing_notes?: string;
}

export interface CoursePricingPlan {
  id: string;
  course_type_id: string;
  plan_name: string;
  plan_description?: string;
  plan_type: 'standard' | 'premium' | 'trial' | 'package' | 'custom';
  price_monthly?: number;
  price_yearly?: number;
  price_per_lesson?: number;
  package_lessons?: number;
  package_price?: number;
  currency: string;
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
  valid_from: string;
  valid_until?: string;
  created_at: string;
  updated_at: string;
}

export interface CourseCoupon {
  id: string;
  coupon_code: string;
  coupon_name: string;
  description?: string;
  discount_type: 'percentage' | 'fixed_amount' | 'free_lessons';
  discount_value: number;
  max_discount_amount?: number;
  applicable_course_types: string[];
  applicable_pricing_plans: string[];
  min_purchase_amount: number;
  usage_limit?: number;
  usage_count: number;
  usage_limit_per_user: number;
  valid_from: string;
  valid_until?: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CoursePromotion {
  id: string;
  promotion_name: string;
  promotion_description?: string;
  promotion_type: 'early_bird' | 'bulk_discount' | 'seasonal' | 'referral' | 'loyalty';
  applicable_course_types: string[];
  applicable_pricing_plans: string[];
  discount_percentage?: number;
  discount_amount?: number;
  min_lessons?: number;
  max_lessons?: number;
  valid_from: string;
  valid_until?: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CourseEnrollment {
  id: string;
  student_id: string;
  course_type_id: string;
  pricing_plan_id?: string;
  enrollment_date: string;
  start_date: string;
  end_date?: string;
  total_lessons?: number;
  completed_lessons: number;
  remaining_lessons?: number;
  base_price: number;
  discount_amount: number;
  final_price: number;
  currency: string;
  payment_status: 'pending' | 'paid' | 'partial' | 'refunded';
  payment_method?: string;
  coupon_code?: string;
  promotion_id?: string;
  enrollment_status: 'active' | 'paused' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CoursePriceHistory {
  id: string;
  course_type_id: string;
  pricing_plan_id?: string;
  old_price?: number;
  new_price?: number;
  price_type: 'monthly' | 'yearly' | 'per_lesson' | 'package';
  change_reason?: string;
  changed_by?: string;
  effective_date: string;
  created_at: string;
}

// 價格計算結果
export interface PriceCalculationResult {
  base_price: number;
  discount_amount: number;
  final_price: number;
  currency: string;
}

// 課程報名表單資料
export interface CourseEnrollmentFormData {
  student_id: string;
  course_type_id: string;
  pricing_plan_id?: string;
  start_date: string;
  end_date?: string;
  total_lessons?: number;
  coupon_code?: string;
  promotion_id?: string;
  payment_method?: string;
  notes?: string;
}

// 價格計劃選擇器選項
export interface PricingPlanOption {
  id: string;
  name: string;
  description?: string;
  type: string;
  price: number;
  price_type: 'monthly' | 'yearly' | 'per_lesson' | 'package';
  currency: string;
  is_featured: boolean;
  savings?: number; // 相對於其他計劃的節省金額
  original_price?: number; // 原價（用於顯示折扣）
}

// 優惠券驗證結果
export interface CouponValidationResult {
  is_valid: boolean;
  coupon?: CourseCoupon;
  discount_amount: number;
  error_message?: string;
}

// 課程報名統計
export interface CourseEnrollmentStats {
  course_name: string;
  total_enrollments: number;
  total_revenue: number;
  average_price: number;
  active_enrollments: number;
  completed_enrollments: number;
}

// API 響應型別
export interface CoursePricingApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

// 價格計劃查詢參數
export interface PricingPlanQueryParams {
  course_type_id?: string;
  is_active?: boolean;
  is_featured?: boolean;
  plan_type?: string;
  sort_by?: 'display_order' | 'price' | 'name';
  sort_order?: 'asc' | 'desc';
}

// 優惠券查詢參數
export interface CouponQueryParams {
  is_active?: boolean;
  is_valid?: boolean; // 檢查有效期
  applicable_course_type?: string;
  applicable_pricing_plan?: string;
  search?: string; // 搜尋優惠券代碼或名稱
}

// 課程報名查詢參數
export interface EnrollmentQueryParams {
  student_id?: string;
  course_type_id?: string;
  enrollment_status?: string;
  payment_status?: string;
  start_date_from?: string;
  start_date_to?: string;
  sort_by?: 'enrollment_date' | 'start_date' | 'final_price';
  sort_order?: 'asc' | 'desc';
}
