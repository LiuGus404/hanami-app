'use client';

import { useState } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { OrgReview } from '@/lib/reviews';
import { deleteOrgReview } from '@/lib/reviews';
import { toast } from 'react-hot-toast';

interface OrgReviewCardProps {
  review: OrgReview;
  isOwnReview?: boolean;
  onDelete?: () => void;
}

export default function OrgReviewCard({ review, isOwnReview = false, onDelete }: OrgReviewCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('確定要刪除此評論嗎？')) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteOrgReview(review.id);
      toast.success('評論已刪除');
      onDelete?.();
    } catch (error: any) {
      console.error('刪除評論失敗:', error);
      toast.error(error.message || '刪除評論失敗，請稍後再試');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-[#EADBC8] bg-white/90 p-4 shadow-sm"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          {/* 用戶名稱 */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] flex items-center justify-center text-sm font-semibold text-[#4B4036]">
              {(review.userName || '匿名用戶').charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-semibold text-[#4B4036]">
              {review.userName || '匿名用戶'}
            </span>
          </div>

          {/* 評分顯示 */}
          {review.rating && (
            <div className="flex items-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <StarIcon
                  key={star}
                  className={`w-4 h-4 ${
                    star <= review.rating!
                      ? 'text-[#FFD59A]'
                      : 'text-[#EADBC8]'
                  }`}
                />
              ))}
              <span className="ml-2 text-sm text-[#8A7C70]">
                {review.rating} 星
              </span>
            </div>
          )}
          
          {/* 評論內容 */}
          <p className="text-[#4B4036] text-sm leading-relaxed whitespace-pre-wrap">
            {review.content}
          </p>
        </div>
        
        {/* 刪除按鈕（僅自己的評論） */}
        {isOwnReview && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="ml-4 text-xs text-[#D95C5C] hover:text-red-600 transition-colors disabled:opacity-50"
          >
            {isDeleting ? '刪除中...' : '刪除'}
          </button>
        )}
      </div>
      
      {/* 時間資訊 */}
      <div className="text-xs text-[#8A7C70] mt-2">
        {new Date(review.createdAt).toLocaleDateString('zh-TW', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
        {review.updatedAt !== review.createdAt && (
          <span className="ml-2">（已編輯）</span>
        )}
      </div>
    </motion.div>
  );
}

