'use client';

import React, { useState, useEffect } from 'react';
import { enrollmentApi, courseTypeApi } from '@/lib/course-pricing-api';
import { CoursePackageSelector } from './CoursePackageSelector';
import type { 
  CourseType, 
  CoursePricingPlan, 
  CourseEnrollmentFormData,
  PriceCalculationResult 
} from '@/types/course-pricing';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';
import { HanamiInput } from '@/components/ui/HanamiInput';
import { HanamiSelect } from '@/components/ui/HanamiSelect';
import { toast } from 'react-hot-toast';

interface CourseEnrollmentFormProps {
  studentId: string;
  onEnrollmentSuccess?: (enrollment: any) => void;
  onCancel?: () => void;
  className?: string;
}

export function CourseEnrollmentForm({
  studentId,
  onEnrollmentSuccess,
  onCancel,
  className = ''
}: CourseEnrollmentFormProps) {
  const [courses, setCourses] = useState<CourseType[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseType | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<CoursePricingPlan | null>(null);
  const [priceCalculation, setPriceCalculation] = useState<PriceCalculationResult | null>(null);
  const [formData, setFormData] = useState<Partial<CourseEnrollmentFormData>>({
    student_id: studentId,
    start_date: new Date().toISOString().split('T')[0],
    payment_method: 'stripe'
  });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 載入課程類型
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true);
        const courseList = await courseTypeApi.getPricingEnabledCourses();
        setCourses(courseList);
      } catch (error) {
        console.error('載入課程失敗:', error);
        toast.error('載入課程失敗');
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, []);

  // 處理課程選擇
  const handleCourseSelect = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    setSelectedCourse(course || null);
    setSelectedPlan(null);
    setPriceCalculation(null);
    setFormData(prev => ({
      ...prev,
      course_type_id: courseId,
      pricing_plan_id: undefined,
      coupon_code: undefined,
      promotion_id: undefined
    }));
  };

  // 處理價格計劃選擇
  const handlePlanSelect = (plan: CoursePricingPlan) => {
    setSelectedPlan(plan);
    setFormData(prev => ({
      ...prev,
      pricing_plan_id: plan.id,
      total_lessons: plan.package_lessons || undefined,
      end_date: plan.package_lessons ? calculateEndDate(prev.start_date!, plan.package_lessons) : undefined
    }));
  };

  // 處理價格計算結果
  const handlePriceCalculated = (result: PriceCalculationResult) => {
    setPriceCalculation(result);
  };

  // 處理表單輸入
  const handleInputChange = (field: keyof CourseEnrollmentFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 提交表單
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCourse || !selectedPlan || !priceCalculation) {
      toast.error('請完成所有必填項目');
      return;
    }

    try {
      setSubmitting(true);
      
      const enrollmentData: CourseEnrollmentFormData = {
        student_id: studentId,
        course_type_id: selectedCourse.id,
        pricing_plan_id: selectedPlan.id,
        start_date: formData.start_date!,
        end_date: formData.end_date,
        total_lessons: formData.total_lessons,
        coupon_code: formData.coupon_code,
        promotion_id: formData.promotion_id,
        payment_method: formData.payment_method,
        notes: formData.notes
      };

      const enrollment = await enrollmentApi.createEnrollment(enrollmentData);
      
      toast.success('課程報名成功！');
      onEnrollmentSuccess?.(enrollment);
    } catch (error) {
      console.error('課程報名失敗:', error);
      toast.error('課程報名失敗，請稍後再試');
    } finally {
      setSubmitting(false);
    }
  };

  // 計算課程結束日期
  const calculateEndDate = (startDate: string, totalLessons?: number) => {
    if (!totalLessons) return undefined;
    
    const start = new Date(startDate);
    // 假設每週一課，計算結束日期
    const weeks = Math.ceil(totalLessons / 4); // 每月4課
    const endDate = new Date(start);
    endDate.setMonth(endDate.getMonth() + weeks);
    
    return endDate.toISOString().split('T')[0];
  };

  // 處理課程數量變化
  const handleTotalLessonsChange = (value: string) => {
    const lessons = parseInt(value) || undefined;
    setFormData(prev => ({
      ...prev,
      total_lessons: lessons,
      end_date: lessons ? calculateEndDate(prev.start_date!, lessons) : undefined
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
        <span className="ml-2 text-gray-600">載入課程中...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
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
            label: `${course.name} - ${course.description || ''}`,
            description: `適合年齡: ${course.age_range || '不限'} | 時長: ${course.duration_minutes}分鐘`
          }))}
          required
        />

        {selectedCourse && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800">{selectedCourse.name}</h4>
            <p className="text-sm text-blue-600 mt-1">{selectedCourse.description}</p>
            <div className="flex gap-4 mt-2 text-xs text-blue-600">
              <span>適合年齡: {selectedCourse.age_range || '不限'}</span>
              <span>課程時長: {selectedCourse.duration_minutes}分鐘</span>
              <span>最大人數: {selectedCourse.max_students}人</span>
            </div>
          </div>
        )}
      </HanamiCard>

      {/* 課程包選擇 */}
      {selectedCourse && (
        <CoursePackageSelector
          courseTypeId={selectedCourse.id}
          onPackageSelected={handlePlanSelect}
          onPriceCalculated={handlePriceCalculated}
        />
      )}

      {/* 報名詳情 */}
      {selectedPlan && (
        <HanamiCard className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">報名詳情</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <HanamiInput
              label="開始日期"
              type="date"
              value={formData.start_date || ''}
              onChange={(value) => handleInputChange('start_date', value)}
              required
            />
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                課程包資訊
              </label>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-blue-800">
                  <div className="font-medium">{selectedPlan.plan_name}</div>
                  <div className="text-blue-600">
                    包含 {selectedPlan.package_lessons} 堂課
                    {selectedPlan.plan_description && (
                      <div className="mt-1">{selectedPlan.plan_description}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {formData.end_date && (
              <HanamiInput
                label="預計結束日期"
                type="date"
                value={formData.end_date}
                disabled
                className="md:col-span-2"
              />
            )}
            
            <HanamiSelect
              label="付款方式"
              value={formData.payment_method || ''}
              onChange={(value) => handleInputChange('payment_method', value)}
              options={[
                { value: 'stripe', label: '信用卡 (Stripe)' },
                { value: 'hk_payment', label: '香港支付' },
                { value: 'bank_transfer', label: '銀行轉帳' }
              ]}
              required
            />
          </div>
          
          <div className="mt-4">
            <HanamiInput
              label="備註"
              placeholder="其他需要說明的資訊"
              value={formData.notes || ''}
              onChange={(value) => handleInputChange('notes', value)}
            />
          </div>
        </HanamiCard>
      )}

      {/* 提交按鈕 */}
      <div className="flex gap-4 justify-end">
        {onCancel && (
          <HanamiButton
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={submitting}
          >
            取消
          </HanamiButton>
        )}
        
        <HanamiButton
          type="submit"
          disabled={!selectedCourse || !selectedPlan || !priceCalculation || submitting}
        >
          {submitting ? '報名中...' : '確認報名'}
        </HanamiButton>
      </div>
    </form>
  );
}
