'use client';

import React, { useState, useEffect } from 'react';
import { coursePricingApi, pricingCalculationApi, couponApi } from '@/lib/course-pricing-api';
import type { 
  CoursePricingPlan, 
  PricingPlanOption, 
  CouponValidationResult,
  PriceCalculationResult 
} from '@/types/course-pricing';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';
import { HanamiInput } from '@/components/ui/HanamiInput';
import { HanamiSelect } from '@/components/ui/HanamiSelect';
import { toast } from 'react-hot-toast';

interface CoursePricingSelectorProps {
  courseTypeId: string;
  onPriceCalculated?: (result: PriceCalculationResult) => void;
  onPlanSelected?: (plan: CoursePricingPlan) => void;
  className?: string;
}

export function CoursePricingSelector({
  courseTypeId,
  onPriceCalculated,
  onPlanSelected,
  className = ''
}: CoursePricingSelectorProps) {
  const [pricingPlans, setPricingPlans] = useState<CoursePricingPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<CoursePricingPlan | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponValidation, setCouponValidation] = useState<CouponValidationResult | null>(null);
  const [priceCalculation, setPriceCalculation] = useState<PriceCalculationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // 載入課程價格計劃
  useEffect(() => {
    const loadPricingPlans = async () => {
      try {
        setLoading(true);
        const plans = await coursePricingApi.getCoursePricingPlans(courseTypeId);
        setPricingPlans(plans);
        
        // 預設選擇第一個計劃
        if (plans.length > 0) {
          setSelectedPlan(plans[0]);
          onPlanSelected?.(plans[0]);
        }
      } catch (error) {
        console.error('載入價格計劃失敗:', error);
        toast.error('載入價格計劃失敗');
      } finally {
        setLoading(false);
      }
    };

    if (courseTypeId) {
      loadPricingPlans();
    }
  }, [courseTypeId, onPlanSelected]);

  // 計算價格
  useEffect(() => {
    const calculatePrice = async () => {
      if (!selectedPlan) return;

      try {
        const result = await pricingCalculationApi.calculateFinalPrice(
          courseTypeId,
          selectedPlan.id,
          couponCode || undefined
        );
        
        setPriceCalculation(result);
        onPriceCalculated?.(result);
      } catch (error) {
        console.error('計算價格失敗:', error);
        toast.error('計算價格失敗');
      }
    };

    calculatePrice();
  }, [selectedPlan, couponCode, courseTypeId, onPriceCalculated]);

  // 驗證優惠券
  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponValidation(null);
      return;
    }

    try {
      setValidatingCoupon(true);
      const result = await couponApi.validateCoupon(
        couponCode.trim(),
        courseTypeId,
        selectedPlan?.id
      );
      setCouponValidation(result);

      if (result.is_valid) {
        toast.success('優惠券驗證成功！');
      } else {
        toast.error(result.error_message || '優惠券無效');
      }
    } catch (error) {
      console.error('驗證優惠券失敗:', error);
      toast.error('驗證優惠券失敗');
    } finally {
      setValidatingCoupon(false);
    }
  };

  // 處理價格計劃選擇
  const handlePlanSelect = (planId: string) => {
    const plan = pricingPlans.find(p => p.id === planId);
    if (plan) {
      setSelectedPlan(plan);
      onPlanSelected?.(plan);
      // 清除優惠券驗證（因為可能不適用於新計劃）
      setCouponValidation(null);
    }
  };

  // 格式化價格顯示
  const formatPrice = (price: number, currency: string = 'HKD') => {
    return new Intl.NumberFormat('zh-HK', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(price);
  };

  // 獲取價格計劃顯示名稱
  const getPlanDisplayName = (plan: CoursePricingPlan) => {
    let priceText = '';
    if (plan.price_monthly) {
      priceText = `月費 ${formatPrice(plan.price_monthly, plan.currency)}`;
    } else if (plan.price_yearly) {
      priceText = `年費 ${formatPrice(plan.price_yearly, plan.currency)}`;
    } else if (plan.price_per_lesson) {
      priceText = `單堂 ${formatPrice(plan.price_per_lesson, plan.currency)}`;
    } else if (plan.package_price && plan.package_lessons) {
      priceText = `${plan.package_lessons}堂 ${formatPrice(plan.package_price, plan.currency)}`;
    }

    return `${plan.plan_name} - ${priceText}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
        <span className="ml-2 text-gray-600">載入價格計劃中...</span>
      </div>
    );
  }

  if (pricingPlans.length === 0) {
    return (
      <HanamiCard className="p-6 text-center">
        <p className="text-gray-500">暫無可用的價格計劃</p>
      </HanamiCard>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 價格計劃選擇 */}
      <HanamiCard className="p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">選擇價格計劃</h3>
        
        <div className="space-y-3">
          {pricingPlans.map((plan) => (
            <div
              key={plan.id}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedPlan?.id === plan.id
                  ? 'border-pink-400 bg-pink-50'
                  : 'border-gray-200 hover:border-pink-300'
              } ${plan.is_featured ? 'ring-2 ring-yellow-400 ring-opacity-50' : ''}`}
              onClick={() => handlePlanSelect(plan.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-800">{plan.plan_name}</h4>
                    {plan.is_featured && (
                      <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                        推薦
                      </span>
                    )}
                    {plan.plan_type === 'trial' && (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        試聽
                      </span>
                    )}
                  </div>
                  {plan.plan_description && (
                    <p className="text-sm text-gray-600 mt-1">{plan.plan_description}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-semibold text-lg text-gray-800">
                    {getPlanDisplayName(plan)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </HanamiCard>

      {/* 優惠券輸入 */}
      <HanamiCard className="p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">優惠券</h3>
        
        <div className="flex gap-3">
          <div className="flex-1">
            <HanamiInput
              label="優惠券代碼"
              placeholder="輸入優惠券代碼"
              value={couponCode}
              onChange={setCouponCode}
              error={couponValidation?.error_message}
            />
          </div>
          <div className="flex items-end">
            <HanamiButton
              onClick={validateCoupon}
              disabled={!couponCode.trim() || validatingCoupon}
              variant="secondary"
            >
              {validatingCoupon ? '驗證中...' : '驗證'}
            </HanamiButton>
          </div>
        </div>

        {couponValidation?.is_valid && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm">
              ✓ 優惠券驗證成功：{couponValidation.coupon?.coupon_name}
            </p>
          </div>
        )}
      </HanamiCard>

      {/* 價格計算結果 */}
      {priceCalculation && (
        <HanamiCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">價格明細</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">原價</span>
              <span className="font-medium">
                {formatPrice(priceCalculation.base_price, priceCalculation.currency)}
              </span>
            </div>
            
            {priceCalculation.discount_amount > 0 && (
              <div className="flex justify-between items-center text-green-600">
                <span>優惠折扣</span>
                <span className="font-medium">
                  -{formatPrice(priceCalculation.discount_amount, priceCalculation.currency)}
                </span>
              </div>
            )}
            
            <div className="border-t pt-3">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-800">最終價格</span>
                <span className="text-xl font-bold text-pink-600">
                  {formatPrice(priceCalculation.final_price, priceCalculation.currency)}
                </span>
              </div>
            </div>
          </div>
        </HanamiCard>
      )}
    </div>
  );
}
