'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  ClockIcon,
  UserGroupIcon,
  AcademicCapIcon,
  MapPinIcon,
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  GiftIcon,
  SparklesIcon,
  HeartIcon,
} from '@heroicons/react/24/outline';
import { getCourseLikeState, toggleCourseLike } from '@/lib/likes';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import { useRouter } from 'next/navigation';

interface CoursePackage {
  lessons: number;
  price: number;
  discount?: number;
  name?: string;
}

interface TrialBundle {
  lessons: number;
  price: number;
  discount?: number;
  name?: string;
}

interface DiscountConfigs {
  packages?: CoursePackage[];
  trialBundles?: TrialBundle[];
}

interface CourseTypePreviewCardProps {
  courseId?: string;
  name: string;
  description?: string | null;
  durationMinutes?: number | null;
  maxStudents?: number | null;
  pricePerLesson?: number | null;
  currency?: string | null;
  images?: string[] | null;
  minAge?: number | null;
  maxAge?: number | null;
  location?: string;
  status?: boolean;
  discountConfigs?: DiscountConfigs | null;
  onEnroll?: () => void;
  showEnrollButton?: boolean;
}

export default function CourseTypePreviewCard({
  courseId,
  name,
  description,
  durationMinutes,
  maxStudents,
  pricePerLesson,
  currency = 'HKD',
  images,
  minAge,
  maxAge,
  location,
  status = true,
  discountConfigs,
  onEnroll,
  showEnrollButton = false,
}: CourseTypePreviewCardProps) {
  const { user } = useSaasAuth();
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const isUuid = courseId ? /^[0-9a-fA-F-]{36}$/.test(courseId) : false;

  useEffect(() => {
    let mounted = true;
    if (!isUuid || !courseId) return;
    const userId = user?.id;
    getCourseLikeState(courseId, userId).then((s) => {
      if (mounted) {
        setLiked(s.likedByMe);
        setLikeCount(s.totalLikes);
      }
    });
    return () => {
      mounted = false;
    };
  }, [courseId, isUuid, user?.id]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!isUuid || !courseId) return;
    if (!user) {
      router.push('/aihome/auth/login');
      return;
    }
    if (loading) return;
    
    setLoading(true);
    const previousLiked = liked;
    const previousCount = likeCount;
    
    // optimistic update
    setLiked((v) => !v);
    setLikeCount((n) => (liked ? Math.max(0, n - 1) : n + 1));
    
    try {
      const userId = user?.id;
      const result = await toggleCourseLike(courseId, userId);
      setLiked(result.likedByMe);
      setLikeCount(result.totalLikes);
    } catch (error) {
      // rollback on error
      setLiked(previousLiked);
      setLikeCount(previousCount);
    } finally {
      setLoading(false);
    }
  };
  
  // 如果沒有圖片，使用默認圖片
  const displayImages = images && images.length > 0 ? images : ['/HanamiMusic/musicclass.png'];
  const currentImage = displayImages[currentImageIndex];
  const hasMultipleImages = displayImages.length > 1;
  
  // 調試：輸出圖片信息
  useEffect(() => {
    console.log('📸 CourseTypePreviewCard 圖片信息:', {
      images,
      displayImages,
      displayImagesLength: displayImages.length,
      hasMultipleImages,
      currentImageIndex
    });
  }, [images, displayImages, hasMultipleImages, currentImageIndex]);
  
  // 確保 currentImageIndex 在有效範圍內
  useEffect(() => {
    if (currentImageIndex >= displayImages.length) {
      setCurrentImageIndex(0);
    }
  }, [displayImages.length, currentImageIndex]);
  
  const ageRange = 
    minAge && maxAge 
      ? `${minAge}-${maxAge}歲`
      : minAge 
      ? `${minAge}歲以上`
      : maxAge 
      ? `${maxAge}歲以下`
      : null;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % displayImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      whileHover={{ 
        y: -8, 
        scale: 1.02,
        boxShadow: "0 25px 50px rgba(255, 182, 193, 0.2)"
      }}
      className="relative bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 border-2 border-[#EADBC8] group"
    >
      {/* 動態背景裝飾 */}
      <motion.div
        animate={{ 
          background: [
            "radial-gradient(circle at 20% 20%, rgba(255, 182, 193, 0.1) 0%, transparent 50%)",
            "radial-gradient(circle at 80% 80%, rgba(255, 213, 154, 0.1) 0%, transparent 50%)",
            "radial-gradient(circle at 20% 20%, rgba(255, 182, 193, 0.1) 0%, transparent 50%)"
          ]
        }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute inset-0"
      />
      
      {/* 懸停光效 */}
      <motion.div
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        className="absolute inset-0 bg-gradient-to-r from-[#FFB6C1]/5 to-[#FFD59A]/5"
      />

      <div className="relative z-10">
        {/* 課程圖片輪播 */}
        <div className="relative w-full h-64 bg-[#FFF9F2] overflow-hidden group">
          {/* 圖片容器 */}
          <div className="relative w-full h-full pointer-events-none">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentImageIndex}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0"
              >
                <Image
                  src={currentImage}
                  alt={`${name} - 圖片 ${currentImageIndex + 1}`}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  priority={currentImageIndex === 0}
                />
              </motion.div>
            </AnimatePresence>
          </div>
          
          {/* 狀態標籤 */}
          <div className="absolute top-4 right-4 z-50 pointer-events-auto">
            <motion.span
              whileHover={{ scale: 1.05 }}
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium shadow-lg ${
                status
                  ? 'bg-gradient-to-r from-green-100 to-green-50 text-green-800 border border-green-200'
                  : 'bg-white text-gray-600 border border-gray-300'
              }`}
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className={`w-2 h-2 rounded-full mr-2 ${
                  status ? 'bg-green-400' : 'bg-gray-400'
                }`}
              />
              {status ? '招生中' : '已停用'}
            </motion.span>
          </div>

          {/* 圖片切換按鈕（如果有多張圖片） */}
          {hasMultipleImages ? (
            <>
              {/* 左箭頭 */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  prevImage();
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-white/95 backdrop-blur-sm border-2 border-[#EADBC8] text-[#4B4036] flex items-center justify-center hover:bg-white hover:scale-110 transition-all shadow-lg pointer-events-auto"
                aria-label="上一張圖片"
                style={{ zIndex: 50 }}
              >
                <ChevronLeftIcon className="w-6 h-6" />
              </button>
              
              {/* 右箭頭 */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  nextImage();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-white/95 backdrop-blur-sm border-2 border-[#EADBC8] text-[#4B4036] flex items-center justify-center hover:bg-white hover:scale-110 transition-all shadow-lg pointer-events-auto"
                aria-label="下一張圖片"
                style={{ zIndex: 50 }}
              >
                <ChevronRightIcon className="w-6 h-6" />
              </button>

              {/* 圖片指示器 */}
              <div 
                className="absolute bottom-3 left-1/2 -translate-x-1/2 z-50 flex gap-1.5 px-2 py-1 rounded-full bg-black/20 backdrop-blur-sm pointer-events-auto"
                style={{ zIndex: 50 }}
              >
                {displayImages.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setCurrentImageIndex(index);
                    }}
                    className={`rounded-full transition-all ${
                      index === currentImageIndex
                        ? 'bg-[#FFD59A] w-6 h-1.5'
                        : 'bg-white/70 hover:bg-white/90 w-1.5 h-1.5'
                    }`}
                    aria-label={`查看圖片 ${index + 1}`}
                  />
                ))}
              </div>

              {/* 圖片計數 */}
              <div 
                className="absolute bottom-3 right-4 z-50 pointer-events-none"
                style={{ zIndex: 50 }}
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-medium"
                >
                  {currentImageIndex + 1} / {displayImages.length}
                </motion.div>
              </div>
            </>
          ) : (
            <div className="absolute bottom-3 right-4 z-50 pointer-events-none text-xs text-[#4B4036]/60">
              單張圖片
            </div>
          )}
        </div>

        {/* 課程內容 */}
        <div className="p-6">
          {/* 標題 */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3 flex-1">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 bg-gradient-to-br from-[#FFB6C1] to-[#FFD59A] rounded-full flex items-center justify-center shadow-md"
                  >
                    <AcademicCapIcon className="w-4 h-4 text-white" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-[#4B4036] group-hover:text-[#FFB6C1] transition-colors">
                    {name}
                  </h3>
                </div>
                {/* Like 按鈕和計數 */}
                {isUuid && (
                  <div className="flex items-center gap-3 ml-4">
                    <span className="text-sm text-[#8A7C70]">{likeCount} 人喜歡</span>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleToggle}
                      disabled={loading}
                      className={`inline-flex items-center justify-center w-10 h-10 rounded-full border transition-all ${
                        liked ? 'bg-[#FFB6C1]/20 border-[#FFB6C1]' : 'bg-white border-[#EADBC8]'
                      }`}
                      aria-label="like"
                    >
                      <HeartIcon className={`w-5 h-5 ${liked ? 'text-[#FF6B8A] fill-[#FF6B8A]' : 'text-[#4B4036]'}`} />
                    </motion.button>
                  </div>
                )}
              </div>
              
              {/* 描述 */}
              {description && (
                <p className="text-[#2B3A3B] mb-4 leading-relaxed line-clamp-3">
                  {description}
                </p>
              )}
            </div>
          </div>

          {/* 課程資訊 */}
          <div className="space-y-3 mb-4">
            {/* 時長 */}
            {durationMinutes && (
              <motion.div 
                whileHover={{ scale: 1.05, x: 5 }}
                className="flex items-center space-x-2 text-sm text-[#2B3A3B]"
              >
                <ClockIcon className="w-4 h-4 text-[#FFD59A]" />
                <span>{durationMinutes} 分鐘</span>
              </motion.div>
            )}

            {/* 年齡範圍 */}
            {ageRange && (
              <motion.div 
                whileHover={{ scale: 1.05, x: 5 }}
                className="flex items-center space-x-2 text-sm text-[#2B3A3B]"
              >
                <UserGroupIcon className="w-4 h-4 text-[#FFB6C1]" />
                <span>適合 {ageRange}</span>
              </motion.div>
            )}

            {/* 人數上限 */}
            {maxStudents && (
              <motion.div 
                whileHover={{ scale: 1.05, x: 5 }}
                className="flex items-center space-x-2 text-sm text-[#2B3A3B]"
              >
                <UserGroupIcon className="w-4 h-4 text-[#EBC9A4]" />
                <span>最多 {maxStudents} 人</span>
              </motion.div>
            )}

            {/* 地點 */}
            {location && (
              <motion.div 
                whileHover={{ scale: 1.05, x: 5 }}
                className="flex items-center space-x-2 text-sm text-[#2B3A3B]"
              >
                <MapPinIcon className="w-4 h-4 text-[#FFB6C1]" />
                <span>{location}</span>
              </motion.div>
            )}
          </div>

          {/* 套票和試堂優惠 */}
          {(discountConfigs?.packages && discountConfigs.packages.length > 0) ||
           (discountConfigs?.trialBundles && discountConfigs.trialBundles.length > 0) ? (
            <div className="mb-4 space-y-3">
              {/* 試堂優惠（只顯示第一個） */}
              {discountConfigs?.trialBundles && discountConfigs.trialBundles.length > 0 && (
                <div className="bg-gradient-to-br from-[#FFF9F2] to-[#FFFDF8] rounded-xl p-4 border border-[#EADBC8]">
                  <div className="flex items-center space-x-2 mb-3">
                    <SparklesIcon className="w-5 h-5 text-[#FFD59A]" />
                    <h4 className="text-sm font-semibold text-[#4B4036]">試堂優惠</h4>
                  </div>
                  <div className="space-y-2">
                    {(() => {
                      const bundle = discountConfigs.trialBundles[0];
                      return (
                        <motion.div
                          whileHover={{ scale: 1.02, x: 5 }}
                          className="flex items-center justify-between bg-white/80 rounded-lg p-3 border border-[#EADBC8]"
                        >
                          <div className="flex items-center space-x-3">
                            <CalendarDaysIcon className="w-4 h-4 text-[#FFB6C1]" />
                            <div>
                              <div className="text-sm font-medium text-[#4B4036]">
                                {bundle.name || '新生試堂'}
                              </div>
                              <div className="text-xs text-[#8A7C70]">
                                {bundle.lessons} 堂試堂課程
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-[#4B4036]">
                              ${bundle.price}
                            </div>
                            {bundle.discount && (
                              <div className="text-xs text-[#FFB6C1] font-medium">
                                省 ${bundle.discount}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* 課程套票（只顯示前3個） */}
              {discountConfigs?.packages && discountConfigs.packages.length > 0 && (
                <div className="bg-gradient-to-br from-[#FFF9F2] to-[#FFFDF8] rounded-xl p-4 border border-[#EADBC8]">
                  <div className="flex items-center space-x-2 mb-3">
                    <GiftIcon className="w-5 h-5 text-[#FFB6C1]" />
                    <h4 className="text-sm font-semibold text-[#4B4036]">課程套票優惠</h4>
                  </div>
                  <div className="space-y-2">
                    {discountConfigs.packages.slice(0, 3).map((pkg, index) => (
                      <motion.div
                        key={index}
                        whileHover={{ scale: 1.02, x: 5 }}
                        className="flex items-center justify-between bg-white/80 rounded-lg p-3 border border-[#EADBC8]"
                      >
                        <div className="flex items-center space-x-3">
                          <SparklesIcon className="w-4 h-4 text-[#FFD59A]" />
                          <div>
                            <div className="text-sm font-medium text-[#4B4036]">
                              {pkg.name || `${pkg.lessons} 堂套票`}
                            </div>
                            <div className="text-xs text-[#8A7C70]">
                              {pkg.lessons} 堂課程
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-[#4B4036]">
                            ${pkg.price}
                          </div>
                          {pkg.discount && (
                            <div className="text-xs text-[#FFB6C1] font-medium">
                              省 ${pkg.discount}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* 報名按鈕 */}
          {showEnrollButton && onEnroll && (
            <div className="flex items-center justify-end pt-4 border-t border-[#EADBC8]">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onEnroll}
                className="px-6 py-2.5 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2"
              >
                <span>立即報名</span>
                <motion.div
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.div>
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

