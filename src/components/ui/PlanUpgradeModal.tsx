'use client';

import { useState } from 'react';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { HanamiButton, HanamiCard } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { StudentMediaQuota } from '@/types/progress';
import { toast } from 'react-hot-toast';

interface PlanUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: {
    id: string;
    full_name: string;
    nick_name?: string | null;
    quota: StudentMediaQuota;
  } | null;
  onUpgradeSuccess: () => void;
}

interface PlanOption {
  id: string;
  name: string;
  description: string;
  storage: string;
  videoLimit: number;
  photoLimit: number;
  price: string;
  features: string[];
  color: string;
  bgColor: string;
}

const planOptions: PlanOption[] = [
  {
    id: 'free:create',
    name: '250MB (新建)',
    description: '適合新學生的基礎方案',
    storage: '250MB',
    videoLimit: 5,
    photoLimit: 10,
    price: '免費',
    features: ['基礎影片上傳', '基礎相片上傳', '標準支援'],
    color: 'text-green-700',
    bgColor: 'bg-green-50'
  },
  {
    id: 'basic',
    name: '1.5GB',
    description: '適合一般學習需求',
    storage: '1.5GB',
    videoLimit: 20,
    photoLimit: 50,
    price: '升級',
    features: ['約20個影片配額', '約50張相片配額', '優先支援'],
    color: 'text-blue-700',
    bgColor: 'bg-blue-50'
  },
  {
    id: 'premium',
    name: '5GB',
    description: '適合進階學習需求',
    storage: '5GB',
    videoLimit: 50,
    photoLimit: 100,
    price: '升級',
    features: ['約50個影片配額', '約100張相片配額', '優先支援', '進階功能'],
    color: 'text-purple-700',
    bgColor: 'bg-purple-50'
  },
  {
    id: 'professional',
    name: '10GB',
    description: '適合專業學習需求',
    storage: '10GB',
    videoLimit: 100,
    photoLimit: 200,
    price: '升級',
    features: ['約100個影片配額', '約200張相片配額', '24/7 支援', '所有進階功能'],
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50'
  }
];

export function PlanUpgradeModal({ isOpen, onClose, student, onUpgradeSuccess }: PlanUpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !student) return null;

  const currentPlan = planOptions.find(plan => plan.id === student.quota.plan_type);
  const availablePlans = planOptions.filter(plan => plan.id !== student.quota.plan_type);

  const handleUpgrade = async () => {
    if (!selectedPlan) {
      toast.error('請選擇要更改的方案');
      return;
    }

    setLoading(true);
    try {
      // hanami_student_media_quota table type may not be fully defined
      const { error } = await ((supabase as any)
        .from('hanami_student_media_quota')
        .update({
          plan_type: selectedPlan,
          video_limit: planOptions.find(p => p.id === selectedPlan)?.videoLimit || 5,
          photo_limit: planOptions.find(p => p.id === selectedPlan)?.photoLimit || 10,
          last_updated: new Date().toISOString()
        })
        .eq('student_id', student.id));

      if (error) {
        console.error('更改方案失敗:', error);
        toast.error('更改方案失敗，請稍後再試');
      } else {
        toast.success('方案更改成功！');
        onUpgradeSuccess();
        onClose();
      }
    } catch (error) {
      console.error('更改方案錯誤:', error);
      toast.error('更改方案失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* 標題欄 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">更改學生方案</h2>
            <p className="text-gray-600 mt-1">
              為 {student.full_name} {student.nick_name ? `(${student.nick_name})` : ''} 選擇新的媒體方案
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* 當前方案 */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">當前方案</h3>
          {currentPlan && (
            <HanamiCard className={`p-4 ${currentPlan.bgColor} border-2 border-gray-300`}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`text-lg font-bold ${currentPlan.color}`}>{currentPlan.name}</h4>
                  <p className="text-gray-600 text-sm">{currentPlan.description}</p>
                  <div className="mt-2 text-sm text-gray-600">
                    <span>儲存空間: {currentPlan.storage}</span>
                    <span className="mx-2">•</span>
                    <span>影片: 約{currentPlan.videoLimit} 個</span>
                    <span className="mx-2">•</span>
                    <span>相片: 約{currentPlan.photoLimit} 張</span>
                  </div>
                </div>
                <div className="text-sm text-gray-500">當前方案</div>
              </div>
            </HanamiCard>
          )}
        </div>

        {/* 可選方案 */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">選擇新方案</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availablePlans.map((plan) => (
              <HanamiCard
                key={plan.id}
                className={`p-4 cursor-pointer transition-all duration-200 hover:scale-105 ${
                  selectedPlan === plan.id 
                    ? `${plan.bgColor} border-2 border-current ${plan.color}` 
                    : 'border border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className={`text-lg font-bold ${plan.color}`}>{plan.name}</h4>
                  {selectedPlan === plan.id && (
                    <CheckIcon className={`h-5 w-5 ${plan.color}`} />
                  )}
                </div>
                <p className="text-gray-600 text-sm mb-3">{plan.description}</p>
                <div className="space-y-2 mb-4">
                  <div className="text-sm">
                    <span className="font-medium">儲存空間:</span> {plan.storage}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">影片配額:</span> 約{plan.videoLimit} 個
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">相片配額:</span> 約{plan.photoLimit} 張
                  </div>
                </div>
                <div className="space-y-1">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center text-xs text-gray-600">
                      <CheckIcon className="h-3 w-3 text-green-500 mr-2" />
                      {feature}
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <span className={`text-sm font-medium ${plan.color}`}>{plan.price}</span>
                </div>
              </HanamiCard>
            ))}
          </div>
        </div>

        {/* 操作按鈕 */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <HanamiButton
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            取消
          </HanamiButton>
          <HanamiButton
            variant="primary"
            onClick={handleUpgrade}
            disabled={!selectedPlan || loading}
          >
            {loading ? '更改中...' : '確認更改'}
          </HanamiButton>
        </div>
      </div>
    </div>
  );
} 