'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { HeartIcon } from '@heroicons/react/24/outline';
import { getOrgLikeState, toggleOrgLike, OrgLikeState } from '@/lib/likes';
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

interface OrganizationMiniCardProps {
  orgId: string;
  name: string;
  coverImageUrl?: string | null;
  description?: string | null;
  categories?: string[] | null;
  onClick?: () => void;
}

export default function OrganizationMiniCard({
  orgId,
  name,
  coverImageUrl,
  description,
  categories,
  onClick,
}: OrganizationMiniCardProps) {
  const { user } = useSaasAuth();
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const isUuid = /^[0-9a-fA-F-]{36}$/.test(orgId);

  useEffect(() => {
    let mounted = true;
    if (!isUuid) return;
    const userId = user?.id;
    getOrgLikeState(orgId, userId).then((s: OrgLikeState) => {
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
    
    if (!isUuid) return;
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

  const shortDesc =
    (description || '')
      .replace(/\s+/g, ' ')
      .slice(0, 60) + ((description || '').length > 60 ? '…' : '');

  const displayImage = coverImageUrl || '/@hanami.png';
  
  const displayCategories = categories && categories.length > 0 
    ? categories.map(cat => CATEGORY_LABEL_MAP[cat] || cat).filter(Boolean)
    : [];

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-[280px] flex-shrink-0 text-left bg-white rounded-2xl overflow-hidden border border-[#EADBC8] shadow-sm hover:shadow-lg transition-all relative cursor-pointer"
    >
      <div className="relative w-full" style={{ aspectRatio: '4/3' }}>
        <Image
          src={displayImage}
          alt={name}
          fill
          className="object-contain bg-[#FFFDF8]"
          sizes="(max-width: 768px) 80vw, 280px"
        />
      </div>
      <div className="p-4">
        <div className="text-[#4B4036] font-semibold line-clamp-1">{name}</div>
        {shortDesc && <div className="text-sm text-[#2B3A3B] mt-1 line-clamp-2">{shortDesc}</div>}
        
        {/* 機構類別 */}
        {displayCategories.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {displayCategories.slice(0, 2).map((category, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-[#FFF9F2] to-[#FFFDF8] text-[#4B4036] border border-[#EADBC8]"
              >
                {category}
              </span>
            ))}
            {displayCategories.length > 2 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-[#FFF9F2] to-[#FFFDF8] text-[#4B4036] border border-[#EADBC8]">
                +{displayCategories.length - 2}
              </span>
            )}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-[#8A7C70]">{likeCount} 人喜歡</span>
          <motion.button
            type="button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleToggle}
            disabled={!isUuid || loading}
            className={`inline-flex items-center justify-center w-9 h-9 rounded-full border ${
              liked ? 'bg-[#FFB6C1]/20 border-[#FFB6C1]' : 'bg-white border-[#EADBC8]'
            }`}
            aria-label="like"
          >
            <HeartIcon className={`w-5 h-5 ${liked ? 'text-[#FF6B8A]' : 'text-[#4B4036]'}`} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}


