'use client';

import React from 'react';
import type { CoursePricingPlan } from '@/types/course-pricing';
import { HanamiCard } from '@/components/ui/HanamiCard';

interface CoursePackageComparisonProps {
  pricingPlans: CoursePricingPlan[];
  className?: string;
}

export function CoursePackageComparison({
  pricingPlans,
  className = ''
}: CoursePackageComparisonProps) {
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

  // 計算節省百分比
  const calculateSavingsPercentage = (plan: CoursePricingPlan) => {
    if (!plan.price_per_lesson || !plan.package_lessons || !plan.package_price) {
      return 0;
    }
    const originalPrice = plan.price_per_lesson * plan.package_lessons;
    const savings = originalPrice - plan.package_price;
    return Math.round((savings / originalPrice) * 100);
  };

  // 獲取最優惠的計劃
  const getBestValuePlan = () => {
    return pricingPlans.reduce((best, current) => {
      const currentSavings = calculateSavings(current);
      const bestSavings = calculateSavings(best);
      return currentSavings > bestSavings ? current : best;
    }, pricingPlans[0]);
  };

  const bestValuePlan = pricingPlans.length > 0 ? getBestValuePlan() : null;

  if (pricingPlans.length === 0) {
    return null;
  }

  return (
    <HanamiCard className={`p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-6">課程包比較</h3>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                課程包
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                堂數
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                總價
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                平均每堂
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                節省金額
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                節省比例
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pricingPlans.map((plan) => {
              const averagePrice = calculateAveragePricePerLesson(
                plan.package_price!, 
                plan.package_lessons!
              );
              const savings = calculateSavings(plan);
              const savingsPercentage = calculateSavingsPercentage(plan);
              const isBestValue = bestValuePlan?.id === plan.id;

              return (
                <tr 
                  key={plan.id} 
                  className={`hover:bg-gray-50 ${isBestValue ? 'bg-yellow-50' : ''}`}
                >
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {plan.plan_name}
                        </div>
                        {plan.plan_description && (
                          <div className="text-sm text-gray-500">
                            {plan.plan_description}
                          </div>
                        )}
                      </div>
                      {isBestValue && (
                        <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                          最優惠
                        </span>
                      )}
                      {plan.is_featured && (
                        <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          推薦
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {plan.package_lessons} 堂
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="font-medium">
                      {formatPrice(plan.package_price!, plan.currency)}
                    </div>
                    {plan.price_per_lesson && (
                      <div className="text-xs text-gray-500">
                        原價: {formatPrice(plan.price_per_lesson * plan.package_lessons!, plan.currency)}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatPrice(averagePrice, plan.currency)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600">
                    {savings > 0 ? formatPrice(savings, plan.currency) : '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600">
                    {savingsPercentage > 0 ? `${savingsPercentage}%` : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 總結資訊 */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-medium text-blue-800 mb-2">選擇建議</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p>• <strong>6堂包</strong>：適合短期體驗或試學</p>
          <p>• <strong>8堂包</strong>：適合中期學習，性價比佳</p>
          <p>• <strong>12堂包</strong>：適合長期學習，節省更多</p>
          <p>• <strong>16堂包</strong>：適合深度學習，最優惠</p>
        </div>
      </div>
    </HanamiCard>
  );
}
