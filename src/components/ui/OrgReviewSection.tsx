'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import OrgReviewCard from './OrgReviewCard';
import OrgReviewForm from './OrgReviewForm';
import { getOrgReviews, getOrgReviewStats, getUserOrgReview, OrgReview, OrgReviewStats } from '@/lib/reviews';
import { toast } from 'react-hot-toast';

interface OrgReviewSectionProps {
  orgId: string;
}

export default function OrgReviewSection({ orgId }: OrgReviewSectionProps) {
  const [reviews, setReviews] = useState<OrgReview[]>([]);
  const [stats, setStats] = useState<OrgReviewStats | null>(null);
  const [userReview, setUserReview] = useState<OrgReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const [reviewsData, statsData, userReviewData] = await Promise.all([
        getOrgReviews(orgId, 20),
        getOrgReviewStats(orgId),
        getUserOrgReview(orgId),
      ]);

      setStats(statsData);
      setUserReview(userReviewData);
      
      // 如果用戶已有評論，從列表中移除（避免重複顯示）
      if (userReviewData) {
        setReviews(reviewsData.filter(r => r.id !== userReviewData.id));
      } else {
        setReviews(reviewsData);
      }
    } catch (error) {
      console.error('載入評論失敗:', error);
      toast.error('載入評論失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [orgId]);

  const handleReviewSuccess = () => {
    setShowForm(false);
    setIsEditing(false);
    loadReviews();
  };

  const handleDeleteSuccess = () => {
    setUserReview(null);
    loadReviews();
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setShowForm(true);
  };

  const handleNewReviewClick = () => {
    setIsEditing(false);
    setShowForm(true);
  };

  // 獲取用戶 ID（用於判斷是否為自己的評論）
  const getUserId = (): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      const saasSession = localStorage.getItem('saas_user_session');
      if (saasSession) {
        const sessionData = JSON.parse(saasSession);
        return sessionData?.user?.id || null;
      }
    } catch (e) {
      // 忽略錯誤
    }
    return null;
  };

  const currentUserId = getUserId();

  return (
    <div className="mt-8 rounded-3xl border border-[#EADBC8] bg-white/90 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ChatBubbleLeftRightIcon className="w-6 h-6 text-[#4B4036]" />
          <h2 className="text-xl font-semibold text-[#4B4036]">評論</h2>
          {stats && stats.totalReviews > 0 && (
            <span className="text-sm text-[#8A7C70]">
              （{stats.totalReviews} 則評論）
            </span>
          )}
        </div>
        
        {!showForm && currentUserId && (
          <button
            onClick={userReview ? handleEditClick : handleNewReviewClick}
            className="px-4 py-2 rounded-lg border border-[#EADBC8] text-[#4B4036] bg-white hover:bg-[#FFF9F2] transition text-sm"
          >
            {userReview ? '編輯我的評論' : '撰寫評論'}
          </button>
        )}
      </div>

      {/* 評論統計 */}
      {stats && stats.totalReviews > 0 && (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-[#FFF9F2] to-[#FFFDF8] border border-[#EADBC8]">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#4B4036]">
                {stats.averageRating.toFixed(1)}
              </div>
              <div className="text-xs text-[#8A7C70]">平均評分</div>
            </div>
            <div className="flex-1">
              <div className="text-sm text-[#4B4036] mb-2">評分分布</div>
              <div className="space-y-1">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = star === 5 ? stats.fiveStarCount :
                               star === 4 ? stats.fourStarCount :
                               star === 3 ? stats.threeStarCount :
                               star === 2 ? stats.twoStarCount :
                               stats.oneStarCount;
                  const percentage = stats.totalReviews > 0
                    ? (count / stats.totalReviews) * 100
                    : 0;
                  
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-xs text-[#8A7C70] w-8">{star} 星</span>
                      <div className="flex-1 h-2 bg-[#EADBC8] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.5 }}
                          className="h-full bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4]"
                        />
                      </div>
                      <span className="text-xs text-[#8A7C70] w-8 text-right">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 評論表單 */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 rounded-2xl border border-[#EADBC8] bg-[#FFFDF8]"
          >
            <OrgReviewForm
              orgId={orgId}
              existingReview={isEditing ? userReview || undefined : undefined}
              onSuccess={handleReviewSuccess}
              onCancel={() => {
                setShowForm(false);
                setIsEditing(false);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 用戶自己的評論 */}
      {userReview && !showForm && (
        <div className="mb-6">
          <div className="mb-2 text-sm font-semibold text-[#4B4036]">我的評論</div>
          <OrgReviewCard
            review={userReview}
            isOwnReview={true}
            onDelete={handleDeleteSuccess}
          />
        </div>
      )}

      {/* 評論列表 */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4B4036] mx-auto mb-2"></div>
          <p className="text-sm text-[#8A7C70]">載入評論中...</p>
        </div>
      ) : reviews.length === 0 && !userReview ? (
        <div className="text-center py-8">
          <ChatBubbleLeftRightIcon className="w-12 h-12 text-[#EADBC8] mx-auto mb-2" />
          <p className="text-sm text-[#8A7C70]">還沒有評論，成為第一個評論者吧！</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {reviews.map((review) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <OrgReviewCard
                  review={review}
                  isOwnReview={review.userId === currentUserId}
                  onDelete={handleDeleteSuccess}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}



