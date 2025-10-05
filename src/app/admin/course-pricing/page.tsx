'use client';

import React, { useState, useEffect } from 'react';
import { coursePricingApi, courseTypeApi, enrollmentApi } from '@/lib/course-pricing-api';
import type { 
  CourseType, 
  CoursePricingPlan, 
  CourseEnrollmentStats 
} from '@/types/course-pricing';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';
import { HanamiInput } from '@/components/ui/HanamiInput';
import { HanamiSelect } from '@/components/ui/HanamiSelect';
import { toast } from 'react-hot-toast';

export default function CoursePricingManagementPage() {
  const [courses, setCourses] = useState<CourseType[]>([]);
  const [pricingPlans, setPricingPlans] = useState<CoursePricingPlan[]>([]);
  const [enrollmentStats, setEnrollmentStats] = useState<CourseEnrollmentStats[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseType | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'pricing' | 'stats'>('pricing');

  // 載入數據
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [courseList, stats] = await Promise.all([
        courseTypeApi.getPricingEnabledCourses(),
        enrollmentApi.getEnrollmentStats()
      ]);
      
      setCourses(courseList);
      setEnrollmentStats(stats);
      
      if (courseList.length > 0) {
        setSelectedCourse(courseList[0]);
        await loadPricingPlans(courseList[0].id);
      }
    } catch (error) {
      console.error('載入數據失敗:', error);
      toast.error('載入數據失敗');
    } finally {
      setLoading(false);
    }
  };

  const loadPricingPlans = async (courseTypeId: string) => {
    try {
      const plans = await coursePricingApi.getCoursePricingPlans(courseTypeId);
      setPricingPlans(plans);
    } catch (error) {
      console.error('載入價格計劃失敗:', error);
      toast.error('載入價格計劃失敗');
    }
  };

  const handleCourseSelect = async (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    setSelectedCourse(course || null);
    if (course) {
      await loadPricingPlans(course.id);
    }
  };

  const formatPrice = (price: number, currency: string = 'HKD') => {
    return new Intl.NumberFormat('zh-HK', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
        <span className="ml-3 text-lg text-gray-600">載入中...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">課程價格管理</h1>
        <p className="text-gray-600">管理課程價格計劃和查看報名統計</p>
      </div>

      {/* 標籤頁 */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('pricing')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pricing'
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              價格計劃管理
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'stats'
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              報名統計
            </button>
          </nav>
        </div>
      </div>

      {/* 價格計劃管理 */}
      {activeTab === 'pricing' && (
        <div className="space-y-6">
          {/* 課程選擇 */}
          <HanamiCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">選擇課程</h3>
            
            <HanamiSelect
              label="課程類型"
              placeholder="請選擇課程"
              value={selectedCourse?.id || ''}
              onChange={handleCourseSelect}
              options={courses.map(course => ({
                value: course.id,
                label: course.name,
                description: course.description
              }))}
            />
          </HanamiCard>

          {/* 價格計劃列表 */}
          {selectedCourse && (
            <HanamiCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800">
                  {selectedCourse.name} - 價格計劃
                </h3>
                <HanamiButton variant="primary">
                  新增價格計劃
                </HanamiButton>
              </div>

              {pricingPlans.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>暫無價格計劃</p>
                  <p className="text-sm mt-1">點擊「新增價格計劃」開始創建</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pricingPlans.map((plan) => (
                    <div
                      key={plan.id}
                      className="p-4 border border-gray-200 rounded-lg hover:border-pink-300 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h4 className="font-medium text-gray-800">{plan.plan_name}</h4>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              plan.plan_type === 'standard' 
                                ? 'bg-blue-100 text-blue-800'
                                : plan.plan_type === 'premium'
                                ? 'bg-purple-100 text-purple-800'
                                : plan.plan_type === 'trial'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {plan.plan_type === 'standard' ? '標準' :
                               plan.plan_type === 'premium' ? '高級' :
                               plan.plan_type === 'trial' ? '試聽' : plan.plan_type}
                            </span>
                            {plan.is_featured && (
                              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                                推薦
                              </span>
                            )}
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              plan.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {plan.is_active ? '啟用' : '停用'}
                            </span>
                          </div>
                          
                          {plan.plan_description && (
                            <p className="text-sm text-gray-600 mt-1">{plan.plan_description}</p>
                          )}
                          
                          <div className="flex gap-6 mt-2 text-sm text-gray-600">
                            {plan.price_monthly && (
                              <span>月費: {formatPrice(plan.price_monthly, plan.currency)}</span>
                            )}
                            {plan.price_yearly && (
                              <span>年費: {formatPrice(plan.price_yearly, plan.currency)}</span>
                            )}
                            {plan.price_per_lesson && (
                              <span>單堂: {formatPrice(plan.price_per_lesson, plan.currency)}</span>
                            )}
                            {plan.package_price && plan.package_lessons && (
                              <span>{plan.package_lessons}堂: {formatPrice(plan.package_price, plan.currency)}</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <HanamiButton variant="secondary" size="sm">
                            編輯
                          </HanamiButton>
                          <HanamiButton 
                            variant={plan.is_active ? "danger" : "success"} 
                            size="sm"
                          >
                            {plan.is_active ? '停用' : '啟用'}
                          </HanamiButton>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </HanamiCard>
          )}
        </div>
      )}

      {/* 報名統計 */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          <HanamiCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">課程報名統計</h3>
            
            {enrollmentStats.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>暫無報名數據</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        課程名稱
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        總報名人數
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        活躍報名
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        已完成
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        總收入
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        平均價格
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {enrollmentStats.map((stat, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {stat.course_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {stat.total_enrollments}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {stat.active_enrollments}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {stat.completed_enrollments}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatPrice(stat.total_revenue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatPrice(stat.average_price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </HanamiCard>
        </div>
      )}
    </div>
  );
}
