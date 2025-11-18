'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  MapPinIcon,
  EnvelopeIcon,
  PhoneIcon,
  LinkIcon,
  SparklesIcon,
  AcademicCapIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  HeartIcon,
} from '@heroicons/react/24/outline';
import { getOrgLikeState, toggleOrgLike } from '@/lib/likes';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import { useRouter } from 'next/navigation';

interface SocialLink {
  platform: string;
  label: string;
  url: string;
  icon?: string | null;
  customLabel?: string | null;
}

interface OrganizationPreviewCardProps {
  orgId?: string;
  orgName: string;
  description?: string | null;
  coverImageUrl?: string | null;
  categories?: string[] | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  location?: string | null;
  socialLinks?: SocialLink[] | null;
  onEnroll?: () => void;
  showEnrollButton?: boolean;
}

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

export default function OrganizationPreviewCard({
  orgId,
  orgName,
  description,
  coverImageUrl,
  categories,
  contactPhone,
  contactEmail,
  location,
  socialLinks,
  onEnroll,
  showEnrollButton = false,
}: OrganizationPreviewCardProps) {
  const { user } = useSaasAuth();
  const router = useRouter();
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const isUuid = orgId ? /^[0-9a-fA-F-]{36}$/.test(orgId) : false;

  useEffect(() => {
    let mounted = true;
    if (!isUuid || !orgId) return;
    const userId = user?.id;
    getOrgLikeState(orgId, userId).then((s) => {
      if (mounted) {
        setLiked(s.likedByMe);
        setLikeCount(s.totalLikes);
      }
    });
    return () => {
      mounted = false;
    };
  }, [orgId, isUuid, user?.id]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!isUuid || !orgId) return;
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
      const result = await toggleOrgLike(orgId, userId);
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
  
  const displayCategories = categories && categories.length > 0 
    ? categories.map(cat => CATEGORY_LABEL_MAP[cat] || cat).filter(Boolean)
    : [];

  const MAX_DESCRIPTION_LENGTH = 300;
  const shouldTruncate = description && description.length > MAX_DESCRIPTION_LENGTH;
  const displayDescription = shouldTruncate && !isDescriptionExpanded
    ? description.substring(0, MAX_DESCRIPTION_LENGTH) + '...'
    : description;

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
        {/* 機構封面圖片 */}
        <div className="relative w-full overflow-hidden">
          {coverImageUrl ? (
            <div className="relative w-full" style={{ aspectRatio: '16/9', minHeight: '180px', maxHeight: '200px' }}>
              <Image
                src={coverImageUrl}
                alt={orgName}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          ) : (
            <div className="w-full h-48 bg-gradient-to-br from-[#FFE6C9] via-[#FFD8DC] to-[#F9D5FF] flex items-center justify-center">
              <AcademicCapIcon className="w-16 h-16 text-white/60" />
            </div>
          )}
        </div>

        {/* 機構內容 */}
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
                    <SparklesIcon className="w-4 h-4 text-white" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-[#4B4036] group-hover:text-[#FFB6C1] transition-colors">
                    {orgName}
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
                <div className="mb-4">
                  <p className="text-[#2B3A3B] leading-relaxed whitespace-pre-wrap">
                    {displayDescription}
                  </p>
                  {shouldTruncate && (
                    <button
                      type="button"
                      onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                      className="mt-2 flex items-center space-x-1 text-sm text-[#FFD59A] hover:text-[#EBC9A4] transition-colors font-medium"
                    >
                      <span>{isDescriptionExpanded ? '收起' : '展開'}</span>
                      {isDescriptionExpanded ? (
                        <ChevronUpIcon className="w-4 h-4" />
                      ) : (
                        <ChevronDownIcon className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 機構類別 */}
          {displayCategories.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {displayCategories.slice(0, 3).map((category, index) => (
                  <motion.span
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-[#FFF9F2] to-[#FFFDF8] text-[#4B4036] border border-[#EADBC8]"
                  >
                    {category}
                  </motion.span>
                ))}
                {displayCategories.length > 3 && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-[#FFF9F2] to-[#FFFDF8] text-[#4B4036] border border-[#EADBC8]">
                    +{displayCategories.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* 聯絡資訊 */}
          <div className="space-y-3 mb-4">
            {location && (
              <motion.div 
                whileHover={{ scale: 1.05, x: 5 }}
                className="flex items-center space-x-2 text-sm text-[#2B3A3B]"
              >
                <MapPinIcon className="w-4 h-4 text-[#FFD59A]" />
                <span>{location}</span>
              </motion.div>
            )}

            {contactPhone && (
              <motion.div 
                whileHover={{ scale: 1.05, x: 5 }}
                className="flex items-center space-x-2 text-sm text-[#2B3A3B]"
              >
                <PhoneIcon className="w-4 h-4 text-[#FFD59A]" />
                <span>{contactPhone}</span>
              </motion.div>
            )}

            {contactEmail && (
              <motion.div 
                whileHover={{ scale: 1.05, x: 5 }}
                className="flex items-center space-x-2 text-sm text-[#2B3A3B]"
              >
                <EnvelopeIcon className="w-4 h-4 text-[#FFB6C1]" />
                <span>{contactEmail}</span>
              </motion.div>
            )}
          </div>

          {/* 社交媒體連結 */}
          {socialLinks && socialLinks.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {socialLinks.map((link, index) => (
                  <motion.a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1, y: -2 }}
                    className="flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium bg-white/80 border border-[#EADBC8] text-[#4B4036] hover:bg-[#FFF9F2] transition-all shadow-sm"
                    title={link.label}
                  >
                    {link.icon ? (
                      <Image
                        src={link.icon}
                        alt={link.label}
                        width={16}
                        height={16}
                        className="object-contain"
                      />
                    ) : (
                      <LinkIcon className="w-4 h-4" />
                    )}
                  </motion.a>
                ))}
              </div>
            </div>
          )}

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

