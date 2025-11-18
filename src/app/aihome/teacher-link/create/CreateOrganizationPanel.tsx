'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { PlusIcon, TrashIcon, ChevronDownIcon, EyeIcon, XMarkIcon, LinkIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import { motion, AnimatePresence } from 'framer-motion';

import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiCard } from '@/components/ui/HanamiCard';
import HanamiInput from '@/components/ui/HanamiInput';
import HanamiSelect from '@/components/ui/HanamiSelect';
import OrganizationPreviewCard from '@/components/ui/OrganizationPreviewCard';
import { supabase, getSaasSupabaseClient } from '@/lib/supabase';
import type { OrganizationProfile } from '@/lib/authUtils';

type SocialLink = {
  id: string;
  platform: string;
  customLabel: string;
  url: string;
};

type CreateOrganizationPanelProps = {
  onCreated: (org: OrganizationProfile) => void;
  userEmail?: string | null;
  userId?: string | null;
};

const generateSlug = (name: string, fallback: string) => {
  const normalized = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (normalized.length > 0) {
    return normalized;
  }

  return fallback;
};

const createEmptySocialLink = (): SocialLink => ({
  id: crypto.randomUUID(),
  platform: 'instagram',
  customLabel: '',
  url: '',
});

export const CATEGORY_GROUPS = [
  {
    title: '藝術與創意 (Arts & Creativity)',
    options: [
      { value: 'music_education', label: '音樂教育中心' },
      { value: 'dance_performance', label: '舞蹈 / 表演藝術' },
      { value: 'visual_arts_design', label: '視覺藝術 / 設計' },
      { value: 'creative_media_digital', label: '創意媒體 / 數位藝術' },
    ],
  },
  {
    title: '學術與科技 (Academic & Technology)',
    options: [
      { value: 'early_childhood', label: '幼兒啟蒙 / 學前教育' },
      { value: 'language_learning', label: '語言學習 / 溝通技巧' },
      { value: 'academic_tutoring', label: '學科輔導 (K-12 / 大學預科)' },
      { value: 'stem_creative', label: 'STEM / 科技創意' },
      { value: 'programming_robotics', label: '程式設計 / 機器人教育' },
      { value: 'ai_education', label: '人工智能 / AI 教育' },
    ],
  },
  {
    title: '身心發展與專業治療 (Development & Therapy)',
    options: [
      { value: 'sports_fitness', label: '體育 / 體能發展' },
      { value: 'mind_body_wellness', label: '身心靈健康 (瑜珈 / 靜觀 / 冥想)' },
      { value: 'sen_support', label: '特殊教育支援 (SEN)' },
      { value: 'professional_therapy_services', label: '專業治療服務' },
      { value: 'speech_therapy', label: '言語治療' },
      { value: 'music_therapy', label: '音樂治療' },
      { value: 'behavior_therapy', label: '行為治療' },
      { value: 'occupational_therapy', label: '職能治療' },
      { value: 'physical_therapy', label: '物理治療' },
      { value: 'psychological_counseling', label: '心理輔導 / 遊戲治療' },
    ],
  },
  {
    title: '綜合與其他 (General & Other)',
    options: [
      { value: 'vocational_training', label: '職業技能培訓 (烹飪 / 金融 / IT 證照)' },
      { value: 'parental_education', label: '家長教育 / 親職課程' },
      { value: 'custom', label: '其他 (自訂)' },
    ],
  },
];

export const CATEGORY_LABEL_MAP = CATEGORY_GROUPS.reduce<Record<string, string>>((acc, group) => {
  group.options.forEach((option) => {
    acc[option.value] = option.label;
  });
  return acc;
}, {});

const MAX_COVER_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

export const COUNTRY_CODE_OPTIONS = [
  { value: '+852', label: '+852（香港）' },
  { value: '+853', label: '+853（澳門）' },
  { value: '+886', label: '+886（台灣）' },
  { value: '+81', label: '+81（日本）' },
  { value: '+82', label: '+82（韓國）' },
  { value: '+65', label: '+65（新加坡）' },
  { value: '+60', label: '+60（馬來西亞）' },
  { value: '+86', label: '+86（中國）' },
  { value: '+1', label: '+1（美國 / 加拿大）' },
  { value: '+44', label: '+44（英國）' },
];

export const SOCIAL_PLATFORM_OPTIONS = [
  { value: 'website', label: '網站', icon: '/globe.svg' },
  { value: 'instagram', label: 'Instagram', icon: '/socialmedia logo/instagram.png' },
  { value: 'tiktok', label: 'TikTok', icon: '/socialmedia logo/tiktok.png' },
  { value: 'thread', label: 'Thread', icon: null },
  { value: 'facebook', label: 'Facebook', icon: '/socialmedia logo/facebook.png' },
  { value: 'xiaohongshu', label: '小紅書', icon: '/socialmedia logo/xionghaoshu.png' },
  { value: 'x', label: 'X', icon: null },
  { value: 'youtube', label: 'YouTube', icon: '/socialmedia logo/youtube.png' },
  { value: 'custom', label: '其他', icon: '/file.svg' },
] as const;

export const SOCIAL_PLATFORM_MAP = SOCIAL_PLATFORM_OPTIONS.reduce<
  Record<string, { label: string; icon: string | null }>
>(
  (acc, option) => {
    acc[option.value] = { label: option.label, icon: option.icon };
    return acc;
  },
  {},
);

export function CreateOrganizationPanel({
  onCreated,
  userEmail,
  userId,
}: CreateOrganizationPanelProps) {
  const defaultOrgId = useMemo(() => crypto.randomUUID(), []);

  const [orgName, setOrgName] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [customCategory, setCustomCategory] = useState('');
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreviewUrl, setCoverImagePreviewUrl] = useState<string | null>(null);
  const [coverImagePath, setCoverImagePath] = useState<string | null>(null);
  const [coverImagePublicUrl, setCoverImagePublicUrl] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [whatsappCountryCode, setWhatsappCountryCode] = useState('+852');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([
    createEmptySocialLink(),
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    CATEGORY_GROUPS.reduce<Record<string, boolean>>((acc, group) => {
      acc[group.title] = false;
      return acc;
    }, {}),
  );

  useEffect(() => {
    if (!coverImagePreviewUrl) return;
    return () => {
      URL.revokeObjectURL(coverImagePreviewUrl);
    };
  }, [coverImagePreviewUrl]);

  const handleSocialLinkChange = (id: string, key: 'platform' | 'customLabel' | 'url', value: string) => {
    setSocialLinks((prev) =>
      prev.map((link) => {
        if (link.id !== id) return link;

        if (key === 'platform') {
          return {
            ...link,
            platform: value,
            customLabel: value === 'custom' ? link.customLabel : '',
          };
        }

        return { ...link, [key]: value };
      }),
    );
  };

  const handleAddSocialLink = () => {
    setSocialLinks((prev) => [...prev, createEmptySocialLink()]);
  };

  const handleRemoveSocialLink = (id: string) => {
    setSocialLinks((prev) => prev.filter((link) => link.id !== id));
  };

  const toggleCategory = (value: string) => {
    setSelectedCategories((prev) => {
      const exists = prev.includes(value);
      if (exists) {
        return prev.filter((item) => item !== value);
      }
      return [...prev, value];
    });
    if (value === 'custom') {
      setCustomCategory('');
    }
  };

  const toggleGroupOpen = (title: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const filteredSocialLinks = socialLinks
    .map(({ platform, customLabel, url }) => {
      const trimmedUrl = url.trim();
      if (!trimmedUrl) {
        return null;
      }

      const platformMeta = SOCIAL_PLATFORM_MAP[platform];
      const normalizedCustomLabel = customLabel.trim();
      const displayLabel =
        platform === 'custom'
          ? normalizedCustomLabel
          : platformMeta?.label ?? platform;

      if (!displayLabel) {
        return null;
      }

      return {
        platform,
        label: displayLabel,
        url: trimmedUrl,
        icon: platformMeta?.icon ?? null,
        customLabel: platform === 'custom' ? normalizedCustomLabel : null,
      };
    })
    .filter((link): link is {
      platform: string;
      label: string;
      url: string;
      icon: string | null;
      customLabel: string | null;
    } => link !== null);

  const resolvedCategories = selectedCategories
    .map((value) => ({
      value,
      label:
        value === 'custom'
          ? customCategory.trim()
          : CATEGORY_LABEL_MAP[value] ?? value,
    }))
    .filter((item) => item.label.length > 0);

  const resetCoverImageState = () => {
    setCoverImageFile(null);
    setCoverImagePreviewUrl(null);
    setCoverImagePath(null);
    setCoverImagePublicUrl(null);
  };

  const handleCoverFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;

    if (file.size > MAX_COVER_IMAGE_SIZE_BYTES) {
      toast.error('封面圖片大小不可超過 2MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('請上傳圖片檔案（JPG / PNG / WebP ...）');
      return;
    }

    setCoverImageFile(file);
    setCoverImagePreviewUrl(URL.createObjectURL(file));
    setCoverImagePath(null);
    setCoverImagePublicUrl(null);
  };

  const uploadCoverImage = async () => {
    if (!coverImageFile) {
      return {
        path: coverImagePath,
        publicUrl: coverImagePublicUrl,
      };
    }

    try {
      setUploadingCover(true);
      const fileExt = coverImageFile.name.split('.').pop()?.toLowerCase() ?? 'png';
      const storagePath = `covers/${defaultOrgId}/${crypto.randomUUID()}.${fileExt}`;

      const { error } = await supabase.storage
        .from('org-media')
        .upload(storagePath, coverImageFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: coverImageFile.type,
        });

      if (error) {
        throw error;
      }

      const { data: publicUrlData } = supabase.storage
        .from('org-media')
        .getPublicUrl(storagePath);

      setCoverImagePath(storagePath);
      setCoverImagePublicUrl(publicUrlData.publicUrl);
      toast.success('封面圖片已上傳');

      return {
        path: storagePath,
        publicUrl: publicUrlData.publicUrl,
      };
    } catch (error: any) {
      console.error('CreateOrganizationPanel: cover upload failed', error);
      toast.error(error?.message ?? '封面圖片上傳失敗，請稍後再試');
      throw error;
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    if (!orgName.trim()) {
      setErrorMessage('請輸入機構名稱');
      toast.error('請輸入機構名稱');
      return;
    }

    const trimmedWhatsappNumber = whatsappNumber.trim();
    const trimmedContactEmail = contactEmail.trim();

    if (selectedCategories.length === 0) {
      setErrorMessage('請至少選擇一個機構類別');
      toast.error('請至少選擇一個機構類別');
      return;
    }

    if (selectedCategories.includes('custom') && !customCategory.trim()) {
      setErrorMessage('請輸入自訂機構類別');
      toast.error('請輸入自訂機構類別');
      return;
    }

    if (!trimmedWhatsappNumber) {
      setErrorMessage('請輸入 WhatsApp 聯絡方式');
      toast.error('請輸入 WhatsApp 聯絡方式');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    const newOrgId = defaultOrgId;
    const slugFallback = `org-${newOrgId.slice(0, 8)}`;
    const orgSlug = generateSlug(orgName, slugFallback);

    let coverUploadResult: { path: string | null; publicUrl: string | null } = {
      path: coverImagePath,
      publicUrl: coverImagePublicUrl,
    };

    try {
      coverUploadResult = await uploadCoverImage();
    } catch (error) {
      setIsSubmitting(false);
      return;
    }

    const combinedWhatsApp = `${whatsappCountryCode} ${trimmedWhatsappNumber}`;

    const settingsPayload = {
      coverImagePath: coverUploadResult.path ?? null,
      coverImageUrl: coverUploadResult.publicUrl ?? null,
      contactPhoneCountryCode: whatsappCountryCode,
      contactPhoneNumber: trimmedWhatsappNumber,
      contactEmail: trimmedContactEmail || null,
      categories: selectedCategories,
      description: description.trim() || null,
      socialLinks: filteredSocialLinks.map(({ platform, label, url, customLabel }) => ({
        platform,
        label,
        url,
        customLabel: customLabel ?? null,
      })),
      customCategoryLabel:
        selectedCategories.includes('custom') && customCategory.trim().length > 0
          ? customCategory.trim()
          : null,
    };

    try {
      // 使用 API 端點創建機構，避免 RLS 權限問題
      const response = await fetch('/api/organizations/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orgName: orgName.trim(),
          orgSlug: orgSlug,
          contactPhone: combinedWhatsApp,
          contactEmail: trimmedContactEmail || null,
          settings: settingsPayload,
          userId: userId || null,
          userEmail: userEmail || null,
          createdBy: userId || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '創建機構失敗' }));
        throw new Error(errorData.error || '創建機構失敗');
      }

      const { data: orgInsertData } = await response.json();

      // Update SaaS profile so subsequent logins resolve the new organization
      if (userId || userEmail) {
        const saasSupabase = getSaasSupabaseClient();
        if (userId) {
          await (saasSupabase as any)
            .from('saas_users')
            .update({ organization_id: orgInsertData.id })
            .eq('id', userId);
        } else if (userEmail) {
          await (saasSupabase as any)
            .from('saas_users')
            .update({ organization_id: orgInsertData.id })
            .eq('email', userEmail);
        }
      }

      const createdOrg: OrganizationProfile = {
        id: orgInsertData.id,
        name: orgInsertData.name,
        slug: orgInsertData.slug,
        status: orgInsertData.status ?? 'active',
      };

      toast.success('機構建立成功！');
      onCreated(createdOrg);
    } catch (error: any) {
      console.error('CreateOrganizationPanel: failed to create organization', error);
      const message =
        error?.message ||
        '建立機構時發生錯誤，請稍後再試。';
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A] py-12 px-4">
      <div className="mx-auto w-full max-w-4xl space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold text-[#4B4036]">建立屬於您專屬的機構</h1>
          <p className="text-sm text-[#2B3A3B]">
            完成以下資料，即可開始管理課程、學生與教學路徑。
          </p>
        </div>

        <HanamiCard className="p-8 shadow-lg border border-[#EADBC8] bg-white/90 backdrop-blur">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#4B4036]">
                機構封面圖片
              </label>
              <div className="flex flex-col items-center gap-3">
                {(coverImagePreviewUrl || coverImagePublicUrl) ? (
                  <div className="flex flex-col items-center gap-3 text-center">
                    <label
                      className={`
                        relative flex h-40 w-40 cursor-pointer items-center justify-center overflow-hidden rounded-full border-4 border-[#FFD59A] bg-white shadow-md
                        ${uploadingCover || isSubmitting ? 'cursor-not-allowed opacity-60' : 'hover:shadow-lg'}
                      `}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleCoverFileChange}
                        disabled={uploadingCover || isSubmitting}
                      />
                      <img
                        src={coverImagePreviewUrl ?? coverImagePublicUrl ?? ''}
                        alt="封面預覽"
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                      <div className="absolute -bottom-3 flex w-[80%] items-center justify-center rounded-full bg-[#4B4036]/85 px-3 py-1 text-xs text-white shadow">
                        點擊可重新上傳
                      </div>
                    </label>
                    {coverImagePublicUrl && (
                      <div className="rounded-full bg-[#FFF4DF] px-4 py-1 text-xs font-medium text-[#4B4036] shadow-sm">
                        已上傳成功
                      </div>
                    )}
                    <HanamiButton
                      type="button"
                      variant="secondary"
                      className="border border-[#EADBC8] bg-white/80 px-4 py-1.5 text-xs text-[#D95C5C] hover:bg-[#FFE8E8]"
                      onClick={resetCoverImageState}
                      disabled={uploadingCover || isSubmitting}
                    >
                      移除封面
                    </HanamiButton>
                  </div>
                ) : (
                  <label
                    className={`
                      relative flex h-40 w-40 cursor-pointer flex-col items-center justify-center rounded-full border-4 border-dashed border-[#EADBC8] bg-[#FFFDF8] text-sm text-[#8A7C70]
                      transition hover:border-[#FFD59A] hover:bg-[#FFF4DF]
                      ${uploadingCover || isSubmitting ? 'cursor-not-allowed opacity-60' : ''}
                    `}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleCoverFileChange}
                      disabled={uploadingCover || isSubmitting}
                    />
                    <div className="flex flex-col items-center justify-center gap-1 px-4 text-center">
                      <span className="text-sm font-semibold text-[#4B4036]">
                        {uploadingCover ? '上傳中...' : '點擊上傳封面圖片'}
                      </span>
                      <span className="text-[11px] leading-tight text-[#8A7C70]">
                        支援 JPG / PNG / WebP
                        <br />
                        大小限制 2MB 以內
                      </span>
                    </div>
                  </label>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#4B4036]">
                  機構名稱<span className="text-red-500">*</span>
                </label>
                <HanamiInput
                  placeholder="例如：Hanami Music Studio"
                  value={orgName}
                  onChange={setOrgName}
                  required
                  disabled={isSubmitting}
                  className="rounded-2xl border-2 border-[#EADBC8] bg-[#FFFDF8] shadow-sm focus:border-[#FFD59A] focus:ring-[#FFD59A] focus:ring-2"
                />
              </div>

              <div className="space-y-2">
                <span className="text-sm font-semibold text-[#4B4036]">
                  機構類別<span className="text-red-500 ml-1">*</span>
                </span>
                <div className="space-y-4 rounded-2xl border border-[#EADBC8] bg-white/80 p-4 shadow-sm">
                  {CATEGORY_GROUPS.map((group) => {
                    const isOpen = openGroups[group.title];
                    return (
                      <div key={group.title} className="space-y-2 rounded-xl border border-[#F5E7D6] bg-[#FFFCF6] p-3">
                        <button
                          type="button"
                          onClick={() => toggleGroupOpen(group.title)}
                          className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1 text-left text-sm font-semibold text-[#4B4036] transition hover:bg-[#FFEFD9]"
                        >
                          <span>{group.title}</span>
                          <ChevronDownIcon
                            className={`h-4 w-4 text-[#E3B77C] transition-transform duration-200 ${
                              isOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                        {isOpen && (
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {group.options.map((option) => {
                              const checked = selectedCategories.includes(option.value);
                              return (
                                <label key={option.value} className="group block cursor-pointer">
                                  <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={checked}
                                    onChange={() => toggleCategory(option.value)}
                                    disabled={isSubmitting}
                                  />
                                  <div
                                    className={`
                                      flex w-full items-center gap-3 rounded-2xl border-2 px-3 py-3 text-sm font-medium transition-all duration-200
                                      ${checked
                                        ? 'border-[#FFD59A] bg-gradient-to-r from-[#FFF4DF] via-[#FFE9C6] to-[#FFF4DF] text-[#4B4036] shadow-sm'
                                        : 'border-transparent bg-white text-[#2B3A3B] shadow-[0_1px_4px_rgba(234,219,200,0.35)]'}
                                      ${isSubmitting ? 'opacity-60 cursor-not-allowed' : 'hover:border-[#FFE0B2] hover:shadow-md'}
                                    `}
                                  >
                                    <span
                                      className={`
                                        flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#EADBC8] bg-white text-transparent transition
                                        peer-checked:border-transparent peer-checked:bg-[#FFD59A]/90 peer-checked:text-[#4B4036]
                                        ${isSubmitting ? 'peer-disabled:opacity-60' : 'group-hover:border-[#FFD59A]'}
                                      `}
                                    >
                                      <CheckIcon className="h-4 w-4" />
                                    </span>
                                    <span>{option.label}</span>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {selectedCategories.includes('custom') && (
                    <HanamiInput
                      placeholder="請輸入自訂類別，例如：兒童戲劇中心"
                      value={customCategory}
                      onChange={setCustomCategory}
                      disabled={isSubmitting}
                      required
                    />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#4B4036]">
                  WhatsApp 聯絡方式<span className="ml-1 text-red-500">*</span>
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <HanamiSelect
                    options={COUNTRY_CODE_OPTIONS}
                    value={whatsappCountryCode}
                    onChange={setWhatsappCountryCode}
                    disabled={isSubmitting}
                    className="sm:w-40"
                  />
                  <HanamiInput
                    placeholder="請輸入電話號碼"
                    value={whatsappNumber}
                    onChange={setWhatsappNumber}
                    disabled={isSubmitting}
                  />
                </div>
                <p className="text-xs text-[#8A7C70]">
                  將會以「國碼 + 電話號碼」格式儲存，例如：+852 9123 4567
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#4B4036]">
                  聯絡 Email
                </label>
                <HanamiInput
                  placeholder="例如：contact@hanami.com"
                  value={contactEmail}
                  onChange={setContactEmail}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#4B4036]">
                機構簡介
              </label>
              <textarea
                className="w-full rounded-xl border border-[#EADBC8] bg-white/80 px-4 py-3 text-sm text-[#4B4036] shadow-sm focus:border-[#FFD59A] focus:outline-none focus:ring-2 focus:ring-[#FFD59A]"
                placeholder="介紹您的教學理念、課程特色或品牌故事..."
                rows={4}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-[#4B4036]">
                  社交媒體連結
                </label>
                <HanamiButton
                  type="button"
                  variant="soft"
                  className="flex items-center gap-2 text-sm"
                  onClick={handleAddSocialLink}
                  disabled={isSubmitting}
                >
                  <PlusIcon className="h-4 w-4" />
                  新增連結
                </HanamiButton>
              </div>

              <div className="space-y-3">
                {socialLinks.map((link) => (
                  <div
                    key={link.id}
                    className="grid grid-cols-1 gap-3 rounded-xl border border-[#EADBC8] bg-white/70 p-4 shadow-sm md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto]"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF4DF] text-[#4B4036] shadow-sm">
                          {SOCIAL_PLATFORM_MAP[link.platform]?.icon ? (
                            <img
                              src={SOCIAL_PLATFORM_MAP[link.platform]?.icon ?? ''}
                              alt={SOCIAL_PLATFORM_MAP[link.platform]?.label ?? link.platform}
                              className="h-6 w-6 object-contain"
                            />
                          ) : (
                            <LinkIcon className="h-5 w-5 text-[#4B4036]" />
                          )}
                        </div>
                        <HanamiSelect
                          options={SOCIAL_PLATFORM_OPTIONS.map(({ value, label }) => ({
                            value,
                            label,
                          }))}
                          value={link.platform}
                          onChange={(value) => handleSocialLinkChange(link.id, 'platform', value)}
                          disabled={isSubmitting}
                          className="flex-1"
                        />
                      </div>
                      {link.platform === 'custom' && (
                        <HanamiInput
                          placeholder="請輸入自訂平台名稱"
                          value={link.customLabel}
                          onChange={(value) => handleSocialLinkChange(link.id, 'customLabel', value)}
                          disabled={isSubmitting}
                        />
                      )}
                    </div>
                    <HanamiInput
                      placeholder="https://instagram.com/your-page"
                      value={link.url}
                      onChange={(value) => handleSocialLinkChange(link.id, 'url', value)}
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      className="rounded-lg border border-transparent bg-red-50 px-3 py-2 text-sm text-red-500 transition hover:bg-red-100"
                      onClick={() => handleRemoveSocialLink(link.id)}
                      disabled={isSubmitting || socialLinks.length === 1}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {errorMessage && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {errorMessage}
              </div>
            )}

            <div className="flex justify-between gap-3">
              <HanamiButton
                type="button"
                variant="secondary"
                className="flex items-center space-x-2 border border-[#EADBC8] bg-white/80"
                onClick={() => setShowPreviewModal(true)}
                disabled={isSubmitting || !orgName.trim()}
              >
                <EyeIcon className="w-4 h-4" />
                <span>預覽機構</span>
              </HanamiButton>
              <HanamiButton type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? '建立中...' : '建立機構'}
              </HanamiButton>
            </div>
          </form>
        </HanamiCard>
      </div>

      {/* 預覽模態框 */}
      <AnimatePresence>
        {showPreviewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 backdrop-blur-sm px-4 py-6 overflow-y-auto"
            onClick={() => setShowPreviewModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-2xl bg-transparent my-8 min-h-0"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 關閉按鈕 */}
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="sticky top-0 float-right w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm border border-white/70 text-[#4B4036] shadow-lg hover:bg-white transition-all flex items-center justify-center z-10 mb-4"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>

              {/* 預覽卡片 */}
              <OrganizationPreviewCard
                orgName={orgName || '未命名機構'}
                description={description || null}
                coverImageUrl={coverImagePreviewUrl || coverImagePublicUrl || null}
                categories={selectedCategories.length > 0 ? selectedCategories : null}
                contactPhone={
                  whatsappNumber.trim()
                    ? `${whatsappCountryCode} ${whatsappNumber.trim()}`
                    : null
                }
                contactEmail={contactEmail.trim() || null}
                socialLinks={filteredSocialLinks.length > 0 ? filteredSocialLinks : null}
                showEnrollButton={false}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


