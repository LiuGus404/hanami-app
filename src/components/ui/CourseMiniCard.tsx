'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { HeartIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { getCourseLikeState, toggleCourseLike } from '@/lib/likes';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import { useRouter } from 'next/navigation';

const CATEGORY_LABEL_MAP: Record<string, string> = {
  music_education: '音樂教育中心',
  dance_performance: '舞蹈 / 表演藝術',
  visual_arts_design: '視覺藝術 / 設計',
  creative_media_digital: '創意媒體 / 數位藝術',
  early_childhood: '幼兒啟蒙 / 學前教育',
  language_learning: '語言學習 / 溝通技巧',
  academic_tutoring: '學科輔導 (K-12 / 大學預科)',
  stem_creative: 'STEM / 科技創意',
  programming_robotics: '程式設計 / 機器人教育',
  ai_education: '人工智能 / AI 教育',
  sports_fitness: '體育 / 體能發展',
  mind_body_wellness: '身心靈健康 (瑜珈 / 靜觀 / 冥想)',
  sen_support: '特殊教育支援 (SEN)',
  professional_therapy_services: '專業治療服務',
  speech_therapy: '言語治療',
  music_therapy: '音樂治療',
  behavior_therapy: '行為治療',
  occupational_therapy: '職能治療',
  physical_therapy: '物理治療',
  psychological_counseling: '心理輔導 / 遊戲治療',
  vocational_training: '職業技能培訓 (烹飪 / 金融 / IT 證照)',
  parental_education: '家長教育 / 親職課程',
  custom: '其他',
};

interface CourseMiniCardProps {
  id: string;
  name: string;
  image?: string | null;
  images?: string[] | null;
  description?: string | null;
  price?: number | null;
  orgName?: string | null;
  orgLogo?: string | null;
  categories?: string[] | null;
  discountConfigs?: {
    packages?: Array<{ price?: number; lessons?: number; name?: string; title?: string; is_active?: boolean }>;
    trialBundles?: Array<{ price?: number; duration_minutes?: number; name?: string; title?: string; is_active?: boolean }>;
  } | null;
  minAge?: number | null;
  maxAge?: number | null;
  onClick?: () => void;
}

export default function CourseMiniCard({
  id,
  name,
  image,
  images,
  description,
  price,
  orgName,
  orgLogo,
  categories,
  discountConfigs,
  minAge,
  maxAge,
  onClick,
}: CourseMiniCardProps) {
  const { user } = useSaasAuth();
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const isUuid = /^[0-9a-fA-F-]{36}$/.test(id);

  // 處理圖片列表
  const imageList: string[] = (() => {
    if (images && Array.isArray(images) && images.length > 0) {
      return images.filter((img): img is string => typeof img === 'string' && img.trim() !== '');
    }
    if (image && image !== '/@hanami.png') {
      return [image];
    }
    return ['/HanamiMusic/musicclass.png'];
  })();

  // 當圖片列表改變時，重置索引
  useEffect(() => {
    if (currentImageIndex >= imageList.length) {
      setCurrentImageIndex(0);
    }
  }, [imageList.length, currentImageIndex]);

  useEffect(() => {
    let mounted = true;
    if (!isUuid) return;
    const userId = user?.id;
    getCourseLikeState(id, userId).then((s) => {
      if (mounted) {
        setLiked(s.likedByMe);
        setLikeCount(s.totalLikes);
      }
    });
    return () => {
      mounted = false;
    };
  }, [id, isUuid, user?.id]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    console.log('❤️ 點擊 Like 按鈕', { id, isUuid, user: !!user, loading });
    
    if (!isUuid) {
      console.warn('⚠️ 課程 ID 不是有效的 UUID:', id);
      return;
    }
    
    if (!user) {
      console.log('🔒 用戶未登入，導向登入頁');
      router.push('/aihome/auth/login');
      return;
    }
    
    if (loading) {
      console.log('⏳ 正在處理中，忽略重複點擊');
      return;
    }
    
    setLoading(true);
    const previousLiked = liked;
    const previousCount = likeCount;
    
    // optimistic update
    setLiked((v) => !v);
    setLikeCount((n) => (liked ? Math.max(0, n - 1) : n + 1));
    
    try {
      const userId = user?.id;
      console.log('🔄 調用 toggleCourseLike，courseId:', id, 'userId:', userId);
      const result = await toggleCourseLike(id, userId);
      console.log('✅ Like 切換成功:', result);
      setLiked(result.likedByMe);
      setLikeCount(result.totalLikes);
    } catch (error) {
      console.error('❌ Like 切換失敗:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ 錯誤詳情:', {
        message: errorMessage,
        courseId: id,
        userId: user?.id
      });
      
      // rollback on error
      setLiked(previousLiked);
      setLikeCount(previousCount);
      
      // 顯示錯誤訊息（如果需要）
      if (errorMessage === 'NOT_AUTHENTICATED') {
        console.warn('⚠️ 用戶未認證');
        router.push('/aihome/auth/login');
      } else {
        console.error('❌ 未知錯誤:', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const currentImage = imageList[currentImageIndex] || imageList[0];
  const hasMultipleImages = imageList.length > 1;

  const handlePreviousImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentImageIndex((prev) => (prev === 0 ? imageList.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentImageIndex((prev) => (prev === imageList.length - 1 ? 0 : prev + 1));
  };

  const shortDesc =
    (description || '')
      .replace(/\s+/g, ' ')
      .slice(0, 60) + ((description || '').length > 60 ? '…' : '');

  // 從優惠配置抓取試堂與套票價格
  const trialBundles = Array.isArray(discountConfigs?.trialBundles) ? discountConfigs!.trialBundles! : [];
  const firstActiveTrial = trialBundles.find((b) => b?.is_active !== false) || trialBundles[0];
  const trialPrice = typeof firstActiveTrial?.price === 'number' ? firstActiveTrial!.price : undefined;

  const packages = Array.isArray(discountConfigs?.packages) ? discountConfigs!.packages! : [];
  const firstActivePackage = packages.find((p) => p?.is_active !== false) || packages[0];
  const packagePrice = typeof firstActivePackage?.price === 'number' ? firstActivePackage!.price : undefined;

  const displayCategories = categories && categories.length > 0 
    ? categories
        .map((cat) => CATEGORY_LABEL_MAP[cat] || cat)
        .filter(Boolean)
        .slice(0, 2)
    : [];

  const ageText = typeof minAge === 'number' && typeof maxAge === 'number'
    ? `${minAge}-${maxAge} 歲`
    : typeof minAge === 'number'
    ? `${minAge} 歲以上`
    : typeof maxAge === 'number'
    ? `${maxAge} 歲以下`
    : null;

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl overflow-hidden border border-[#EADBC8] shadow-sm hover:shadow-lg transition-all relative cursor-pointer"
    >
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: '4/3', backgroundColor: '#FFF9F2' }}>
        <div className="relative w-full h-full">
          <Image
            src={currentImage}
            alt={`${name} - 圖片 ${currentImageIndex + 1}`}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 80vw, 280px"
            priority={currentImageIndex === 0}
          />
        </div>
        
        {/* 左右箭頭按鈕（僅在多張圖片時顯示） */}
        {hasMultipleImages && (
          <>
            {/* 左箭頭 */}
            <button
              type="button"
              onClick={handlePreviousImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/95 backdrop-blur-sm border-2 border-[#EADBC8] flex items-center justify-center shadow-lg hover:bg-white hover:scale-110 transition-all"
              aria-label="上一張圖片"
            >
              <ChevronLeftIcon className="w-6 h-6 text-[#4B4036]" />
            </button>
            
            {/* 右箭頭 */}
            <button
              type="button"
              onClick={handleNextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/95 backdrop-blur-sm border-2 border-[#EADBC8] flex items-center justify-center shadow-lg hover:bg-white hover:scale-110 transition-all"
              aria-label="下一張圖片"
            >
              <ChevronRightIcon className="w-6 h-6 text-[#4B4036]" />
            </button>
            
            {/* 圖片指示器 */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 px-2 py-1 rounded-full bg-black/20 backdrop-blur-sm">
              {imageList.map((_, index) => (
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
                  aria-label={`跳轉到圖片 ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
      <div className="p-4">
        {/* 機構資訊 */}
        {orgName && (
          <div className="flex items-center gap-2 mb-2">
            {orgLogo && (
              <div className="relative w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
                <Image
                  src={orgLogo}
                  alt={orgName}
                  fill
                  className="object-cover"
                  sizes="20px"
                />
              </div>
            )}
            <span className="text-xs text-[#8A7C70] line-clamp-1">{orgName}</span>
          </div>
        )}
        
        <div className="text-[#4B4036] font-semibold line-clamp-1">{name}</div>
        
        {/* 歲數顯示 */}
        {ageText && (
          <div className="mt-1 text-xs text-[#8A7C70]">適合 {ageText}</div>
        )}
        
        {/* 類別徽章（只在大螢幕顯示） */}
        {displayCategories.length > 0 && (
          <div className="mt-1 hidden flex-wrap gap-1 lg:flex">
            {displayCategories.map((cat, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gradient-to-r from-[#FFF9F2] to-[#FFFDF8] text-[#4B4036] border border-[#EADBC8]"
              >
                {cat}
              </span>
            ))}
            {categories && categories.length > 2 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gradient-to-r from-[#FFF9F2] to-[#FFFDF8] text-[#4B4036] border border-[#EADBC8]">
                +{categories.length - 2}
              </span>
            )}
          </div>
        )}
        {shortDesc && <div className="text-sm text-[#2B3A3B] mt-1 line-clamp-2">{shortDesc}</div>}
        
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* 試堂與套票價格（優先顯示兩者），若皆無則回退顯示單價 */}
            {typeof trialPrice === 'number' && (
              <div className="text-xs text-[#4B4036]"><span className="text-[#8A7C70] mr-1">試堂</span><span className="font-bold">${trialPrice}</span></div>
            )}
            {typeof packagePrice === 'number' && (
              <div className="text-xs text-[#4B4036]"><span className="text-[#8A7C70] mr-1">套票</span><span className="font-bold">${packagePrice}</span></div>
            )}
            {typeof trialPrice !== 'number' && typeof packagePrice !== 'number' && typeof price === 'number' && price > 0 && (
              <div className="text-[#4B4036] font-bold">${price}</div>
            )}
          </div>
          <motion.button
            type="button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleToggle}
            disabled={!isUuid || loading}
            className={`inline-flex items-center justify-center gap-1 px-3 py-2 rounded-full border ${
              liked ? 'bg-[#FFB6C1]/20 border-[#FFB6C1]' : 'bg-white border-[#EADBC8]'
            }`}
            aria-label="like"
          >
            <HeartIcon className={`w-4 h-4 ${liked ? 'text-[#FF6B8A]' : 'text-[#4B4036]'}`} />
            <span className="text-sm font-semibold text-[#4B4036]">{likeCount}</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}


