// =====================================================
// Hanami 課程價格管理系統 - API 服務函數
// =====================================================

import { supabase } from './supabase';
import type {
  CourseType,
  CoursePricingPlan,
  CourseCoupon,
  CoursePromotion,
  CourseEnrollment,
  CourseEnrollmentFormData,
  PriceCalculationResult,
  CouponValidationResult,
  PricingPlanOption,
  CourseEnrollmentStats,
  PricingPlanQueryParams,
  CouponQueryParams,
  EnrollmentQueryParams
} from '@/types/course-pricing';

// =====================================================
// 課程價格計劃 API
// =====================================================

export const coursePricingApi = {
  // 獲取課程價格計劃
  async getPricingPlans(params?: PricingPlanQueryParams): Promise<CoursePricingPlan[]> {
    let query = supabase
      .from('hanami_course_pricing_plans')
      .select('*')
      .eq('is_active', true);

    if (params?.course_type_id) {
      query = query.eq('course_type_id', params.course_type_id);
    }

    if (params?.is_featured !== undefined) {
      query = query.eq('is_featured', params.is_featured);
    }

    if (params?.plan_type) {
      query = query.eq('plan_type', params.plan_type);
    }

    // 排序
    const sortBy = params?.sort_by || 'display_order';
    const sortOrder = params?.sort_order || 'asc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const { data, error } = await query;

    if (error) {
      console.error('獲取課程價格計劃錯誤:', error);
      throw new Error(`獲取課程價格計劃失敗: ${error.message}`);
    }

    return data || [];
  },

  // 獲取特定課程的價格計劃
  async getCoursePricingPlans(courseTypeId: string): Promise<CoursePricingPlan[]> {
    const { data, error } = await supabase
      .from('hanami_course_pricing_plans')
      .select('*')
      .eq('course_type_id', courseTypeId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('獲取課程價格計劃錯誤:', error);
      throw new Error(`獲取課程價格計劃失敗: ${error.message}`);
    }

    return data || [];
  },

  // 創建價格計劃
  async createPricingPlan(plan: Omit<CoursePricingPlan, 'id' | 'created_at' | 'updated_at'>): Promise<CoursePricingPlan> {
    const { data, error } = await supabase
      .from('hanami_course_pricing_plans')
      .insert(plan)
      .select()
      .single();

    if (error) {
      console.error('創建價格計劃錯誤:', error);
      throw new Error(`創建價格計劃失敗: ${error.message}`);
    }

    return data;
  },

  // 更新價格計劃
  async updatePricingPlan(id: string, updates: Partial<CoursePricingPlan>): Promise<CoursePricingPlan> {
    const { data, error } = await supabase
      .from('hanami_course_pricing_plans')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('更新價格計劃錯誤:', error);
      throw new Error(`更新價格計劃失敗: ${error.message}`);
    }

    return data;
  },

  // 刪除價格計劃
  async deletePricingPlan(id: string): Promise<void> {
    const { error } = await supabase
      .from('hanami_course_pricing_plans')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('刪除價格計劃錯誤:', error);
      throw new Error(`刪除價格計劃失敗: ${error.message}`);
    }
  }
};

// =====================================================
// 優惠券 API
// =====================================================

export const couponApi = {
  // 獲取優惠券列表
  async getCoupons(params?: CouponQueryParams): Promise<CourseCoupon[]> {
    let query = supabase
      .from('hanami_course_coupons')
      .select('*')
      .eq('is_active', true);

    if (params?.is_valid) {
      query = query
        .lte('valid_from', new Date().toISOString())
        .or(`valid_until.is.null,valid_until.gte.${new Date().toISOString()}`);
    }

    if (params?.search) {
      query = query.or(`coupon_code.ilike.%${params.search}%,coupon_name.ilike.%${params.search}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('獲取優惠券錯誤:', error);
      throw new Error(`獲取優惠券失敗: ${error.message}`);
    }

    return data || [];
  },

  // 驗證優惠券
  async validateCoupon(couponCode: string, courseTypeId?: string, pricingPlanId?: string): Promise<CouponValidationResult> {
    const { data, error } = await supabase
      .from('hanami_course_coupons')
      .select('*')
      .eq('coupon_code', couponCode)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return {
        is_valid: false,
        discount_amount: 0,
        error_message: '優惠券不存在或已失效'
      };
    }

    // 檢查有效期
    const now = new Date();
    const validFrom = new Date(data.valid_from);
    const validUntil = data.valid_until ? new Date(data.valid_until) : null;

    if (now < validFrom || (validUntil && now > validUntil)) {
      return {
        is_valid: false,
        discount_amount: 0,
        error_message: '優惠券已過期'
      };
    }

    // 檢查使用次數限制
    if (data.usage_limit && data.usage_count >= data.usage_limit) {
      return {
        is_valid: false,
        discount_amount: 0,
        error_message: '優惠券使用次數已達上限'
      };
    }

    // 檢查適用課程類型
    if (courseTypeId && data.applicable_course_types.length > 0) {
      if (!data.applicable_course_types.includes(courseTypeId)) {
        return {
          is_valid: false,
          discount_amount: 0,
          error_message: '此優惠券不適用於所選課程'
        };
      }
    }

    // 檢查適用價格計劃
    if (pricingPlanId && data.applicable_pricing_plans.length > 0) {
      if (!data.applicable_pricing_plans.includes(pricingPlanId)) {
        return {
          is_valid: false,
          discount_amount: 0,
          error_message: '此優惠券不適用於所選價格計劃'
        };
      }
    }

    return {
      is_valid: true,
      coupon: data,
      discount_amount: 0 // 實際折扣金額需要根據價格計算
    };
  },

  // 使用優惠券（增加使用次數）
  async useCoupon(couponCode: string): Promise<void> {
    const { error } = await supabase
      .from('hanami_course_coupons')
      .update({ usage_count: (supabase as any).sql`usage_count + 1` })
      .eq('coupon_code', couponCode);

    if (error) {
      console.error('使用優惠券錯誤:', error);
      throw new Error(`使用優惠券失敗: ${error.message}`);
    }
  }
};

// =====================================================
// 價格計算 API
// =====================================================

export const pricingCalculationApi = {
  // 計算課程最終價格
  async calculateFinalPrice(
    courseTypeId: string,
    pricingPlanId?: string,
    couponCode?: string,
    promotionId?: string,
    quantity: number = 1
  ): Promise<PriceCalculationResult> {
    const { data, error } = await supabase.rpc('calculate_course_final_price', {
      p_course_type_id: courseTypeId,
      p_pricing_plan_id: pricingPlanId,
      p_coupon_code: couponCode,
      p_promotion_id: promotionId,
      p_quantity: quantity
    });

    if (error) {
      console.error('計算價格錯誤:', error);
      throw new Error(`計算價格失敗: ${error.message}`);
    }

    return data[0] || { base_price: 0, discount_amount: 0, final_price: 0, currency: 'HKD' };
  },

  // 獲取價格計劃選項（用於前端選擇器）
  async getPricingPlanOptions(courseTypeId: string): Promise<PricingPlanOption[]> {
    const plans = await coursePricingApi.getCoursePricingPlans(courseTypeId);
    
    return plans.map(plan => {
      let price = 0;
      let priceType: 'monthly' | 'yearly' | 'per_lesson' | 'package' = 'monthly';
      
      if (plan.price_monthly) {
        price = plan.price_monthly;
        priceType = 'monthly';
      } else if (plan.price_yearly) {
        price = plan.price_yearly;
        priceType = 'yearly';
      } else if (plan.price_per_lesson) {
        price = plan.price_per_lesson;
        priceType = 'per_lesson';
      } else if (plan.package_price) {
        price = plan.package_price;
        priceType = 'package';
      }

      return {
        id: plan.id,
        name: plan.plan_name,
        description: plan.plan_description,
        type: plan.plan_type,
        price,
        price_type: priceType,
        currency: plan.currency,
        is_featured: plan.is_featured
      };
    });
  }
};

// =====================================================
// 課程報名 API
// =====================================================

export const enrollmentApi = {
  // 創建課程報名
  async createEnrollment(enrollmentData: CourseEnrollmentFormData): Promise<CourseEnrollment> {
    // 計算最終價格
    const priceResult = await pricingCalculationApi.calculateFinalPrice(
      enrollmentData.course_type_id,
      enrollmentData.pricing_plan_id,
      enrollmentData.coupon_code,
      enrollmentData.promotion_id
    );

    // 創建報名記錄
    const enrollment: Omit<CourseEnrollment, 'id' | 'created_at' | 'updated_at'> = {
      student_id: enrollmentData.student_id,
      course_type_id: enrollmentData.course_type_id,
      pricing_plan_id: enrollmentData.pricing_plan_id,
      enrollment_date: new Date().toISOString().split('T')[0],
      start_date: enrollmentData.start_date,
      end_date: enrollmentData.end_date,
      total_lessons: enrollmentData.total_lessons,
      completed_lessons: 0,
      remaining_lessons: enrollmentData.total_lessons,
      base_price: priceResult.base_price,
      discount_amount: priceResult.discount_amount,
      final_price: priceResult.final_price,
      currency: priceResult.currency,
      payment_status: 'pending',
      payment_method: enrollmentData.payment_method,
      coupon_code: enrollmentData.coupon_code,
      promotion_id: enrollmentData.promotion_id,
      enrollment_status: 'active',
      notes: enrollmentData.notes
    };

    const { data, error } = await supabase
      .from('hanami_course_enrollments')
      .insert(enrollment)
      .select()
      .single();

    if (error) {
      console.error('創建課程報名錯誤:', error);
      throw new Error(`創建課程報名失敗: ${error.message}`);
    }

    // 如果使用了優惠券，增加使用次數
    if (enrollmentData.coupon_code) {
      await couponApi.useCoupon(enrollmentData.coupon_code);
    }

    return data;
  },

  // 獲取課程報名列表
  async getEnrollments(params?: EnrollmentQueryParams): Promise<CourseEnrollment[]> {
    let query = supabase
      .from('hanami_course_enrollments')
      .select(`
        *,
        course_type:Hanami_CourseTypes(name),
        pricing_plan:hanami_course_pricing_plans(plan_name),
        student:Hanami_Students(full_name, student_oid)
      `);

    if (params?.student_id) {
      query = query.eq('student_id', params.student_id);
    }

    if (params?.course_type_id) {
      query = query.eq('course_type_id', params.course_type_id);
    }

    if (params?.enrollment_status) {
      query = query.eq('enrollment_status', params.enrollment_status);
    }

    if (params?.payment_status) {
      query = query.eq('payment_status', params.payment_status);
    }

    if (params?.start_date_from) {
      query = query.gte('start_date', params.start_date_from);
    }

    if (params?.start_date_to) {
      query = query.lte('start_date', params.start_date_to);
    }

    // 排序
    const sortBy = params?.sort_by || 'enrollment_date';
    const sortOrder = params?.sort_order || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const { data, error } = await query;

    if (error) {
      console.error('獲取課程報名錯誤:', error);
      throw new Error(`獲取課程報名失敗: ${error.message}`);
    }

    return data || [];
  },

  // 更新課程報名
  async updateEnrollment(id: string, updates: Partial<CourseEnrollment>): Promise<CourseEnrollment> {
    const { data, error } = await supabase
      .from('hanami_course_enrollments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('更新課程報名錯誤:', error);
      throw new Error(`更新課程報名失敗: ${error.message}`);
    }

    return data;
  },

  // 獲取課程報名統計
  async getEnrollmentStats(): Promise<CourseEnrollmentStats[]> {
    const { data, error } = await supabase.rpc('get_course_enrollment_stats');

    if (error) {
      console.error('獲取課程報名統計錯誤:', error);
      throw new Error(`獲取課程報名統計失敗: ${error.message}`);
    }

    return data || [];
  }
};

// =====================================================
// 課程類型 API（擴展現有功能）
// =====================================================

export const courseTypeApi = {
  // 獲取啟用價格的課程類型
  async getPricingEnabledCourses(): Promise<CourseType[]> {
    const { data, error } = await supabase
      .from('Hanami_CourseTypes')
      .select('*')
      .eq('status', true)
      .eq('is_pricing_enabled', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('獲取課程類型錯誤:', error);
      throw new Error(`獲取課程類型失敗: ${error.message}`);
    }

    return data || [];
  },

  // 更新課程類型價格設定
  async updateCoursePricing(
    courseTypeId: string, 
    pricingData: Partial<Pick<CourseType, 'base_price_monthly' | 'base_price_yearly' | 'base_price_per_lesson' | 'pricing_model' | 'is_pricing_enabled' | 'pricing_notes'>>
  ): Promise<CourseType> {
    const { data, error } = await supabase
      .from('Hanami_CourseTypes')
      .update(pricingData)
      .eq('id', courseTypeId)
      .select()
      .single();

    if (error) {
      console.error('更新課程價格設定錯誤:', error);
      throw new Error(`更新課程價格設定失敗: ${error.message}`);
    }

    return data;
  }
};
