'use client';

import React, { useState } from 'react';
import { CourseEnrollmentForm } from '@/components/course-pricing/CourseEnrollmentForm';
import { HanamiCard } from '@/components/ui/HanamiCard';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { toast } from 'react-hot-toast';

export default function CourseEnrollmentDemoPage() {
  const [showForm, setShowForm] = useState(false);
  const [enrollmentResult, setEnrollmentResult] = useState<any>(null);

  const handleEnrollmentSuccess = (enrollment: any) => {
    setEnrollmentResult(enrollment);
    setShowForm(false);
    toast.success('課程報名成功！');
  };

  const handleCancel = () => {
    setShowForm(false);
    setEnrollmentResult(null);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">課程包報名系統演示</h1>
        <p className="text-gray-600">體驗新的 6、8、12、16 堂課程包報名流程</p>
      </div>

      {!showForm && !enrollmentResult && (
        <div className="space-y-6">
          {/* 系統介紹 */}
          <HanamiCard className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">課程包系統特色</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-800 mb-2">📦 靈活課程包</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 6堂包：適合短期體驗</li>
                  <li>• 8堂包：適合中期學習</li>
                  <li>• 12堂包：適合長期學習</li>
                  <li>• 16堂包：適合深度學習</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-800 mb-2">💰 優惠定價</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 6堂包：10% 折扣</li>
                  <li>• 8堂包：15% 折扣</li>
                  <li>• 12堂包：20% 折扣</li>
                  <li>• 16堂包：25% 折扣</li>
                </ul>
              </div>
            </div>
          </HanamiCard>

          {/* 價格範例 */}
          <HanamiCard className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">價格範例（幼兒音樂啟蒙）</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">課程包</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">堂數</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">原價</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">優惠價</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">平均每堂</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">節省</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">6堂課程包</td>
                    <td className="px-4 py-3 text-sm text-gray-900">6 堂</td>
                    <td className="px-4 py-3 text-sm text-gray-500">HK$1,200</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">HK$1,080</td>
                    <td className="px-4 py-3 text-sm text-gray-900">HK$180</td>
                    <td className="px-4 py-3 text-sm text-green-600">HK$120 (10%)</td>
                  </tr>
                  <tr className="bg-yellow-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">8堂課程包 ⭐</td>
                    <td className="px-4 py-3 text-sm text-gray-900">8 堂</td>
                    <td className="px-4 py-3 text-sm text-gray-500">HK$1,600</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">HK$1,360</td>
                    <td className="px-4 py-3 text-sm text-gray-900">HK$170</td>
                    <td className="px-4 py-3 text-sm text-green-600">HK$240 (15%)</td>
                  </tr>
                  <tr className="bg-yellow-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">12堂課程包 ⭐</td>
                    <td className="px-4 py-3 text-sm text-gray-900">12 堂</td>
                    <td className="px-4 py-3 text-sm text-gray-500">HK$2,400</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">HK$1,920</td>
                    <td className="px-4 py-3 text-sm text-gray-900">HK$160</td>
                    <td className="px-4 py-3 text-sm text-green-600">HK$480 (20%)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">16堂課程包</td>
                    <td className="px-4 py-3 text-sm text-gray-900">16 堂</td>
                    <td className="px-4 py-3 text-sm text-gray-500">HK$3,200</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">HK$2,400</td>
                    <td className="px-4 py-3 text-sm text-gray-900">HK$150</td>
                    <td className="px-4 py-3 text-sm text-green-600">HK$800 (25%)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-500 mt-2">⭐ 標示為推薦課程包</p>
          </HanamiCard>

          {/* 開始體驗按鈕 */}
          <div className="text-center">
            <HanamiButton
              onClick={() => setShowForm(true)}
              size="lg"
              className="px-8 py-3"
            >
              開始體驗課程包報名
            </HanamiButton>
          </div>
        </div>
      )}

      {/* 報名表單 */}
      {showForm && (
        <div className="max-w-4xl mx-auto">
          <HanamiCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">課程包報名</h2>
              <HanamiButton
                variant="secondary"
                onClick={handleCancel}
              >
                取消
              </HanamiButton>
            </div>
            
            <CourseEnrollmentForm
              studentId="demo-student-id"
              onEnrollmentSuccess={handleEnrollmentSuccess}
              onCancel={handleCancel}
            />
          </HanamiCard>
        </div>
      )}

      {/* 報名結果 */}
      {enrollmentResult && (
        <div className="max-w-2xl mx-auto">
          <HanamiCard className="p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-800 mb-2">報名成功！</h2>
              <p className="text-gray-600 mb-6">您的課程包報名已成功提交</p>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-gray-800 mb-2">報名詳情</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>課程包：{enrollmentResult.pricing_plan?.plan_name || 'N/A'}</p>
                  <p>總堂數：{enrollmentResult.total_lessons} 堂</p>
                  <p>開始日期：{enrollmentResult.start_date}</p>
                  <p>最終價格：HK${enrollmentResult.final_price}</p>
                  <p>付款狀態：{enrollmentResult.payment_status}</p>
                </div>
              </div>
              
              <div className="flex gap-4 justify-center">
                <HanamiButton
                  onClick={() => {
                    setEnrollmentResult(null);
                    setShowForm(false);
                  }}
                >
                  重新報名
                </HanamiButton>
                <HanamiButton
                  variant="secondary"
                  onClick={() => window.print()}
                >
                  列印收據
                </HanamiButton>
              </div>
            </div>
          </HanamiCard>
        </div>
      )}
    </div>
  );
}
