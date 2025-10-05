'use client';

import React, { useState, useEffect } from 'react';
import { coursePricingApi, pricingCalculationApi, couponApi } from '@/lib/course-pricing-api';
import type { 
  CoursePricingPlan, 
  CouponValidationResult,
  PriceCalculationResult 
} from '@/types/course-pricing';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';
import { HanamiInput } from '@/components/ui/HanamiInput';
import { CoursePackageComparison } from './CoursePackageComparison';
import { toast } from 'react-hot-toast';

interface CoursePackageSelectorProps {
  courseTypeId: string;
  onPackageSelected?: (plan: CoursePricingPlan) => void;
  onPriceCalculated?: (result: PriceCalculationResult) => void;
  className?: string;
}

export function CoursePackageSelector({
  courseTypeId,
  onPackageSelected,
  onPriceCalculated,
  className = ''
}: CoursePackageSelectorProps) {
  const [pricingPlans, setPricingPlans] = useState<CoursePricingPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<CoursePricingPlan | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponValidation, setCouponValidation] = useState<CouponValidationResult | null>(null);
  const [priceCalculation, setPriceCalculation] = useState<PriceCalculationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // 載入課程包價格計劃
  useEffect(() => {
    const loadPricingPlans = async () => {
      try {
        setLoading(true);
        const plans = await coursePricingApi.getCoursePricingPlans(courseTypeId);
        // 只顯示課程包類型的計劃
        const packagePlans = plans.filter(plan => plan.plan_type === 'package');
        setPricingPlans(packagePlans);
        
        // 預設選擇第一個計劃
        if (packagePlans.length > 0) {
          setSelectedPlan(packagePlans[0]);
          onPackageSelected?.(packagePlans[0]);
        }
      } catch (error) {
        console.error('載入課程包失敗:', error);
        toast.error('載入課程包失敗');
      } finally {
        setLoading(false);
      }
    };

    if (courseTypeId) {
      loadPricingPlans();
    }
  }, [courseTypeId, onPackageSelected]);

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

  // 處理課程包選擇
  const handlePackageSelect = (planId: string) => {
    const plan = pricingPlans.find(p => p.id === planId);
    if (plan) {
      setSelectedPlan(plan);
      onPackageSelected?.(plan);
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

  // 計算每堂課平均價格
  const calculateAveragePricePerLesson = (totalPrice: number, lessonCount: number) => {
    return totalPrice / lessonCount;
  };

  // 計算節省金額
  const calculateSavings = (plan: CoursePricingPlan) => {
    if (!plan.price_per_lesson || !plan.package_lessons || !plan.package_price) {
      return 0;
    }
    const originalPrice = plan.price_per_lesson * plan.package_lessons;
    return originalPrice - plan.package_price;
  };

  // 獲取課程包顯示資訊
  const getPackageDisplayInfo = (plan: CoursePricingPlan) => {
    if (!plan.package_lessons || !plan.package_price) return null;
    
    const averagePrice = calculateAveragePricePerLesson(plan.package_price, plan.package_lessons);
    const savings = calculateSavings(plan);
    const savingsPercentage = plan.price_per_lesson ? 
      Math.round((savings / (plan.price_per_lesson * plan.package_lessons)) * 100) : 0;

    return {
      averagePrice,
      savings,
      savingsPercentage
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
        <span className="ml-2 text-gray-600">載入課程包中...</span>
      </div>
    );
  }

  if (pricingPlans.length === 0) {
    return (
      <HanamiCard className="p-6 text-center">
        <p className="text-gray-500">暫無可用的課程包</p>
      </HanamiCard>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 課程包選擇 */}
      <HanamiCard className="p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">選擇課程包</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {pricingPlans.map((plan) => {
            const displayInfo = getPackageDisplayInfo(plan);
            const isSelected = selectedPlan?.id === plan.id;
            
            return (
              <div
                key={plan.id}
                className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? 'border-pink-400 bg-pink-50'
                    : 'border-gray-200 hover:border-pink-300'
                } ${plan.is_featured ? 'ring-2 ring-yellow-400 ring-opacity-50' : ''}`}
                onClick={() => handlePackageSelect(plan.id)}
              >
                <div className="text-center">
                  {/* 課程包名稱和堂數 */}
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <h4 className="font-medium text-gray-800">{plan.plan_name}</h4>
                    {plan.is_featured && (
                      <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                        推薦
                      </span>
                    )}
                  </div>
                  
                  {/* 堂數顯示 */}
                  <div className="text-2xl font-bold text-pink-600 mb-2">
                    {plan.package_lessons} 堂
                  </div>
                  
                  {/* 描述 */}
                  {plan.plan_description && (
                    <p className="text-xs text-gray-500 mb-2">{plan.plan_description}</p>
                  )}
                  
                  {/* 價格顯示 */}
                  <div className="text-center">
                    {/* 原價（刪除線） */}
                    {plan.price_per_lesson && plan.package_lessons && (
                      <div className="text-sm text-gray-400 line-through mb-2 w-full block">
                        HK${(plan.price_per_lesson * plan.package_lessons).toFixed(0)}
                      </div>
                    )}
                    
                    {/* 現價 */}
                    <div className="text-lg font-semibold text-gray-800 w-full block">
                      {formatPrice(plan.package_price!, plan.currency)}
                    </div>
                    
                    {displayInfo && (
                      <div className="text-sm text-gray-600">
                        <div>平均每堂 {formatPrice(displayInfo.averagePrice, plan.currency)}</div>
                        {displayInfo.savings > 0 && (
                          <div className="text-green-600 font-medium">
                            節省 {formatPrice(displayInfo.savings, plan.currency)} ({displayInfo.savingsPercentage}%)
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
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

      {/* 課程包比較表 */}
      <CoursePackageComparison pricingPlans={pricingPlans} />

      {/* 價格計算結果 */}
      {priceCalculation && selectedPlan && (
        <HanamiCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">價格明細</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">課程包原價</span>
              <span className="font-medium">
                {formatPrice(priceCalculation.base_price, priceCalculation.currency)}
              </span>
            </div>
            
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>包含 {selectedPlan.package_lessons} 堂課</span>
              <span>
                平均每堂 {formatPrice(
                  calculateAveragePricePerLesson(priceCalculation.base_price, selectedPlan.package_lessons!), 
                  priceCalculation.currency
                )}
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
              
              {priceCalculation.discount_amount > 0 && (
                <div className="flex justify-between items-center text-sm text-gray-500 mt-1">
                  <span>優惠後平均每堂</span>
                  <span>
                    {formatPrice(
                      calculateAveragePricePerLesson(priceCalculation.final_price, selectedPlan.package_lessons!), 
                      priceCalculation.currency
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        </HanamiCard>
      )}
    </div>
  );
}
