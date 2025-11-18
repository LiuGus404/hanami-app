'use client';

import { useState } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { upsertOrgReview, OrgReview } from '@/lib/reviews';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface OrgReviewFormProps {
  orgId: string;
  existingReview?: OrgReview | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function OrgReviewForm({
  orgId,
  existingReview,
  onSuccess,
  onCancel,
}: OrgReviewFormProps) {
  const router = useRouter();
  const [content, setContent] = useState(existingReview?.content || '');
  const [rating, setRating] = useState<number | null>(existingReview?.rating || null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      toast.error('請輸入評論內容');
      return;
    }

    if (content.trim().length > 2000) {
      toast.error('評論內容不能超過 2000 個字元');
      return;
    }

    setIsSubmitting(true);
    try {
      await upsertOrgReview(orgId, {
        content: content.trim(),
        rating: rating,
      });
      
      toast.success(existingReview ? '評論已更新' : '評論已提交');
      onSuccess?.();
      
      // 重置表單（如果是新評論）
      if (!existingReview) {
        setContent('');
        setRating(null);
      }
    } catch (error: any) {
      console.error('提交評論失敗:', error);
      
      // 處理錯誤信息
      let errorMessage = '提交評論失敗，請稍後再試';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = error.message || error.details || errorMessage;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      if (errorMessage === 'NOT_AUTHENTICATED' || errorMessage.includes('未認證')) {
        toast.error('請先登入才能發表評論');
        router.push('/login');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayRating = hoveredRating || rating || 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 評分選擇 */}
      <div>
        <label className="block text-sm font-semibold text-[#4B4036] mb-2">
          評分（可選）
        </label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star === rating ? null : star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(null)}
              className="focus:outline-none transition-transform hover:scale-110"
            >
              {star <= displayRating ? (
                <StarIcon className="w-6 h-6 text-[#FFD59A]" />
              ) : (
                <StarOutlineIcon className="w-6 h-6 text-[#EADBC8]" />
              )}
            </button>
          ))}
          {rating && (
            <span className="ml-2 text-sm text-[#8A7C70]">
              {rating} 星
            </span>
          )}
        </div>
      </div>

      {/* 評論內容 */}
      <div>
        <label className="block text-sm font-semibold text-[#4B4036] mb-2">
          評論內容 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="分享您對這個機構的體驗和意見..."
          rows={4}
          maxLength={2000}
          className="w-full rounded-2xl border-2 border-[#EADBC8] bg-white/80 px-4 py-3 text-sm text-[#4B4036] shadow-sm focus:border-[#FFD59A] focus:outline-none focus:ring-2 focus:ring-[#FFD59A] resize-none"
        />
        <div className="mt-1 flex justify-between text-xs text-[#8A7C70]">
          <span>最多 2000 個字元</span>
          <span>{content.length} / 2000</span>
        </div>
      </div>

      {/* 按鈕 */}
      <div className="flex items-center gap-3">
        <HanamiButton
          type="submit"
          variant="primary"
          disabled={isSubmitting || !content.trim()}
          loading={isSubmitting}
        >
          {existingReview ? '更新評論' : '提交評論'}
        </HanamiButton>
        {onCancel && (
          <HanamiButton
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            取消
          </HanamiButton>
        )}
      </div>
    </form>
  );
}

