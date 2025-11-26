// 直接使用現有的 Supabase 客戶端
// 注意：這假設 hanami-ai-system 和 hanami-saas-system 使用相同的 Supabase 實例
// 如果需要使用不同的資料庫，請設置專用的環境變數
import { supabase } from '@/lib/supabase';

// 課程價格計劃介面
export interface CoursePricingPlan {
  id: string;
  course_type_id: string;
  plan_name: string;
  plan_description?: string;
  plan_type: 'per_lesson' | 'monthly' | 'yearly' | 'package' | 'trial';
  price_per_lesson?: number;
  price_monthly?: number;
  price_yearly?: number;
  package_lessons?: number;
  package_price?: number;
  currency: string;
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// 課程類型介面
export interface CourseType {
  id: string;
  name: string;
  description?: string;
  price_per_lesson?: number;
  pricing_model?: 'per_lesson' | 'monthly' | 'yearly' | 'package' | 'trial';
  is_pricing_enabled?: boolean;
  pricing_notes?: string;
  age_range?: string;
  min_age?: number;
  max_age?: number;
  duration_minutes?: number;
  max_students?: number;
  difficulty_level?: string;
  color_code?: string;
  icon_type?: string;
  display_order?: number;
  is_featured?: boolean;
  prerequisites?: string;
  learning_objectives?: string[];
  created_at: string;
  updated_at: string;
}

// 優惠券介面
export interface CourseCoupon {
  id: string;
  coupon_code: string;
  coupon_name: string;
  description?: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  min_purchase_amount: number;
  usage_limit?: number;
  usage_count: number;
  valid_from: string;
  valid_until?: string;
  is_active: boolean;
}

// 價格計算結果介面
export interface PriceCalculationResult {
  base_price: number;
  discount_amount: number;
  final_price: number;
  currency: string;
  applied_coupon?: CourseCoupon;
  error?: string;
}

// 優惠券驗證結果介面
export interface CouponValidationResult {
  isValid: boolean;
  coupon?: CourseCoupon;
  message: string;
}

// 課程類型 API
export const courseTypeApi = {
  // 獲取所有啟用價格的課程類型
  async getCourseTypes(): Promise<CourseType[]> {
    console.log('🔍 開始查詢課程類型...');
    
    // 首先查詢所有課程類型來調試
    const { data: allData, error: allError } = await supabase
      .from('Hanami_CourseTypes')
      .select('*')
      .eq('status', true)
      .order('display_order', { ascending: true });
    
    if (allError) {
      console.error('❌ 查詢所有課程類型錯誤:', allError);
      throw allError;
    }
    
    console.log('📊 所有課程類型:', allData);
    
    // 過濾啟用價格的課程類型
    const typedAllData = allData as Array<{ is_pricing_enabled?: boolean; [key: string]: any; }> | null;
    const enabledData = typedAllData?.filter(course => course.is_pricing_enabled === true) || [];
    console.log('✅ 啟用價格的課程類型:', enabledData);
    
    return enabledData as CourseType[];
  },

  // 根據 ID 獲取課程類型
  async getCourseTypeById(id: string): Promise<CourseType | null> {
    const { data, error } = await supabase
      .from('Hanami_CourseTypes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('獲取課程類型錯誤:', error);
      throw error;
    }
    
    return data;
  },
};

// 課程價格計劃 API
export const coursePricingApi = {
  // 獲取指定課程類型的價格計劃
  async getCoursePricingPlans(courseTypeId: string): Promise<CoursePricingPlan[]> {
    const { data, error } = await supabase
      .from('hanami_course_pricing_plans')
      .select('*')
      .eq('course_type_id', courseTypeId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    
    if (error) {
      console.error('獲取課程價格計劃錯誤:', error);
      throw error;
    }
    
    return data || [];
  },

  // 根據 ID 獲取價格計劃
  async getCoursePricingPlanById(planId: string): Promise<CoursePricingPlan | null> {
    const { data, error } = await supabase
      .from('hanami_course_pricing_plans')
      .select('*')
      .eq('id', planId)
      .single();
    
    if (error) {
      console.error('獲取價格計劃錯誤:', error);
      throw error;
    }
    
    return data;
  },

  // 獲取課程包計劃（6, 8, 12, 16堂等）
  async getCoursePackagePlans(courseTypeId: string): Promise<CoursePricingPlan[]> {
    console.log('🔍 開始查詢課程包計劃，課程類型ID:', courseTypeId);
    
    // 首先查詢所有價格計劃來調試
    const { data: allPlans, error: allError } = await supabase
      .from('hanami_course_pricing_plans')
      .select('*')
      .eq('course_type_id', courseTypeId);
    
    if (allError) {
      console.error('❌ 查詢所有價格計劃錯誤:', allError);
      throw allError;
    }
    
    console.log('📊 所有價格計劃:', allPlans);
    
    // 過濾課程包計劃
    const typedAllPlans = allPlans as Array<{ plan_type?: string; is_active?: boolean; package_lessons?: number; [key: string]: any; }> | null;
    const packagePlans = typedAllPlans?.filter(plan => 
      plan.plan_type === 'package' && plan.is_active === true
    ) || [];
    
    console.log('✅ 課程包計劃:', packagePlans);
    
    // 按堂數排序
    const sortedPlans = packagePlans.sort((a, b) => (a.package_lessons || 0) - (b.package_lessons || 0));
    
    return sortedPlans as CoursePricingPlan[];
  },
};

// 優惠券 API
export const couponApi = {
  // 驗證優惠券
  async validateCoupon(couponCode: string): Promise<CouponValidationResult> {
    if (!couponCode.trim()) {
      return { isValid: false, message: '請輸入優惠券代碼' };
    }

    const { data, error } = await supabase
      .from('hanami_course_coupons')
      .select('*')
      .eq('coupon_code', couponCode.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return { isValid: false, message: '無效的優惠券代碼' };
    }

    // 檢查使用限制
    const typedData = data as { usage_limit?: number | null; usage_count?: number; valid_from?: string; valid_until?: string | null; [key: string]: any; };
    if (typedData.usage_limit && typedData.usage_count && typedData.usage_count >= typedData.usage_limit) {
      return { isValid: false, message: '此優惠券已達使用上限' };
    }

    // 檢查有效期
    const now = new Date();
    const validFrom = typedData.valid_from ? new Date(typedData.valid_from) : null;
    const validUntil = typedData.valid_until ? new Date(typedData.valid_until) : null;

    if (validFrom && now < validFrom) {
      return { isValid: false, message: '此優惠券尚未生效' };
    }

    if (validUntil && now > validUntil) {
      return { isValid: false, message: '此優惠券已過期' };
    }

    return {
      isValid: true,
      coupon: typedData as any,
      message: '優惠券驗證成功！'
    };
  },
};

// 價格計算 API
export const pricingCalculationApi = {
  // 計算最終價格
  async calculateFinalPrice(
    courseTypeId: string,
    pricingPlanId: string,
    couponCode?: string
  ): Promise<PriceCalculationResult> {
    try {
      // 獲取價格計劃
      const plan = await coursePricingApi.getCoursePricingPlanById(pricingPlanId);
      if (!plan) {
        return { 
          base_price: 0, 
          discount_amount: 0, 
          final_price: 0, 
          currency: 'HKD', 
          error: '找不到價格計劃' 
        };
      }

      // 計算基礎價格
      let basePrice = 0;
      if (plan.plan_type === 'per_lesson' && plan.price_per_lesson) {
        basePrice = plan.price_per_lesson;
      } else if (plan.plan_type === 'monthly' && plan.price_monthly) {
        basePrice = plan.price_monthly;
      } else if (plan.plan_type === 'yearly' && plan.price_yearly) {
        basePrice = plan.price_yearly;
      } else if (plan.plan_type === 'package' && plan.package_price) {
        basePrice = plan.package_price;
      } else if (plan.plan_type === 'trial') {
        basePrice = plan.price_per_lesson || 0;
      }

      let finalPrice = basePrice;
      let discountAmount = 0;
      let appliedCoupon: CourseCoupon | undefined;

      // 應用優惠券
      if (couponCode) {
        const validationResult = await couponApi.validateCoupon(couponCode);
        if (validationResult.isValid && validationResult.coupon) {
          appliedCoupon = validationResult.coupon;
          
          // 檢查最低購買金額
          if (appliedCoupon.min_purchase_amount > 0 && basePrice < appliedCoupon.min_purchase_amount) {
            return {
              base_price: basePrice,
              discount_amount: 0,
              final_price: basePrice,
              currency: plan.currency,
              error: `此優惠券需要最低購買金額 ${appliedCoupon.min_purchase_amount} ${plan.currency}`
            };
          }

          // 計算折扣
          if (appliedCoupon.discount_type === 'percentage') {
            discountAmount = basePrice * (appliedCoupon.discount_value / 100);
          } else {
            discountAmount = appliedCoupon.discount_value;
          }
          
          finalPrice = Math.max(0, basePrice - discountAmount);
        }
      }

      return {
        base_price: basePrice,
        discount_amount: discountAmount,
        final_price: finalPrice,
        currency: plan.currency,
        applied_coupon: appliedCoupon,
      };

    } catch (error) {
      console.error('價格計算錯誤:', error);
      return {
        base_price: 0,
        discount_amount: 0,
        final_price: 0,
        currency: 'HKD',
        error: error instanceof Error ? error.message : '價格計算失敗'
      };
    }
  },

  // 計算課程包的平均每堂價格
  calculateAveragePricePerLesson(totalPrice: number, lessons: number): number {
    if (lessons === 0) return 0;
    return totalPrice / lessons;
  },

  // 計算課程包的節省金額
  calculateSavings(originalPricePerLesson: number, packagePrice: number, lessons: number): number {
    const originalTotalPrice = originalPricePerLesson * lessons;
    return originalTotalPrice - packagePrice;
  },
};

// 格式化價格顯示
export const formatPrice = (price: number, currency: string = 'HKD'): string => {
  return new Intl.NumberFormat('en-HK', {
    style: 'currency',
    currency: currency,
  }).format(price);
};

// 導出所有 API
export const hanamiAiPricingApi = {
  courseTypeApi,
  coursePricingApi,
  couponApi,
  pricingCalculationApi,
  formatPrice,
};
