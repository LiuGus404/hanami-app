'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { EyeIcon, XMarkIcon, LinkIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

import { HanamiButton } from '@/components/ui/HanamiButton';
import HanamiInput from '@/components/ui/HanamiInput';
import HanamiSelect from '@/components/ui/HanamiSelect';
import OrganizationPreviewCard from '@/components/ui/OrganizationPreviewCard';
import CuteLoadingSpinner from '@/components/ui/CuteLoadingSpinner';
import { TeacherLinkShell, useTeacherLinkOrganization } from '../TeacherLinkShell';
import { WithPermissionCheck } from '@/components/teacher-link/withPermissionCheck';
import {
  CATEGORY_GROUPS,
  CATEGORY_LABEL_MAP,
  COUNTRY_CODE_OPTIONS,
  SOCIAL_PLATFORM_OPTIONS,
  SOCIAL_PLATFORM_MAP,
} from '../CreateOrganizationPanel';
import { supabase } from '@/lib/supabase';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';

const MAX_COVER_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

type OrganizationSettings = {
  coverImageUrl?: string | null;
  coverImagePath?: string | null;
  description?: string | null;
  categories?: string[];
  contactPhoneCountryCode?: string | null;
  contactPhoneNumber?: string | null;
  contactEmail?: string | null;
  location?: string | null;
  customCategoryLabel?: string | null;
  customDomain?: string | null;
  socialLinks?: Array<{
    platform: string;
    label: string;
    url: string;
    customLabel?: string | null;
    icon?: string | null;
  }>;
};

function OrganizationSettingsContent() {
  const { orgId, organization, orgDataDisabled, organizationResolved } =
    useTeacherLinkOrganization();
  const { user } = useSaasAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false); // 是否公開顯示於課程活動頁面

  const [orgName, setOrgName] = useState('');
  const [countryCode, setCountryCode] = useState('+852');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [settings, setSettings] = useState<OrganizationSettings>({});
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [customCategory, setCustomCategory] = useState('');
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    CATEGORY_GROUPS.reduce<Record<string, boolean>>((acc, group) => {
      acc[group.title] = false;
      return acc;
    }, {}),
  );
  const [editableSocialLinks, setEditableSocialLinks] = useState<
    Array<{
      id: string;
      platform: string;
      customLabel: string;
      url: string;
    }>
  >([]);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [newCoverFile, setNewCoverFile] = useState<File | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const socialLinks = useMemo(
    () =>
      editableSocialLinks
        .map((link) => {
          const trimmedUrl = link.url.trim();
          if (!trimmedUrl) return null;

          const platformMeta = SOCIAL_PLATFORM_MAP[link.platform];
          const displayLabel =
            link.platform === 'custom'
              ? link.customLabel.trim() || '自訂'
              : platformMeta?.label ?? link.platform;

          return {
            platform: link.platform,
            label: displayLabel,
            url: trimmedUrl,
            icon: platformMeta?.icon ?? null,
            customLabel: link.customLabel.trim() || null,
          };
        })
        .filter((link): link is NonNullable<typeof link> => Boolean(link)),
    [editableSocialLinks],
  );

  const handleCoverChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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

    setNewCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const uploadCoverImage = async (): Promise<{
    path: string | null;
    publicUrl: string | null;
  }> => {
    if (!newCoverFile || !orgId) {
      return {
        path: settings.coverImagePath ?? null,
        publicUrl: coverPreview ?? null,
      };
    }

    setUploadingCover(true);
    try {
      const ext = newCoverFile.name.split('.').pop()?.toLowerCase() ?? 'png';
      const storagePath = `covers/${orgId}/${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage
        .from('org-media')
        .upload(storagePath, newCoverFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: newCoverFile.type,
        });

      if (error) {
        throw error;
      }

      const { data: publicData } = supabase.storage
        .from('org-media')
        .getPublicUrl(storagePath);

      return {
        path: storagePath,
        publicUrl: publicData.publicUrl,
      };
    } finally {
      setUploadingCover(false);
    }
  };

  useEffect(() => {
    if (newCoverFile && coverPreview && coverPreview.startsWith('blob:')) {
      return () => {
        URL.revokeObjectURL(coverPreview);
      };
    }
    return undefined;
  }, [newCoverFile, coverPreview]);

  useEffect(() => {
    const loadOrganization = async () => {
      if (!organizationResolved) return;

      if (!orgId || orgDataDisabled) {
        setLoading(false);
        setError('尚未設定機構，請先建立機構資料。');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // 使用 API 端點查詢機構資訊（繞過 RLS）
        const userEmail = user?.email || '';

        const orgResponse = await fetch(
          `/api/organizations/get?orgId=${encodeURIComponent(orgId)}&userEmail=${encodeURIComponent(userEmail)}`
        );

        if (!orgResponse.ok) {
          const errorData = await orgResponse.json().catch(() => ({}));
          throw new Error(errorData.error || '獲取機構資訊失敗');
        }

        const orgData = await orgResponse.json();
        const data = orgData.data;

        const fetchedSettings: OrganizationSettings =
          (data?.settings as OrganizationSettings | null) ?? {};

        setSettings(fetchedSettings);

        const fetchedCategories = Array.isArray(fetchedSettings.categories)
          ? fetchedSettings.categories
          : [];
        const normalizedCategories = fetchedCategories
          .map((entry) => {
            if (typeof entry === 'string') return entry;
            if (entry && typeof entry === 'object' && 'value' in entry) {
              return (entry as any).value as string;
            }
            return '';
          })
          .filter((value): value is string => Boolean(value));

        setSelectedCategories(
          normalizedCategories.length > 0 ? normalizedCategories : [],
        );
        if (normalizedCategories.includes('custom')) {
          setCustomCategory(fetchedSettings.customCategoryLabel ?? '');
        } else {
          setCustomCategory('');
        }

        const initialSocialLinks = (
          Array.isArray(fetchedSettings.socialLinks)
            ? fetchedSettings.socialLinks
            : []
        ).map((link) => ({
          id: crypto.randomUUID(),
          platform:
            typeof link?.platform === 'string' && SOCIAL_PLATFORM_MAP[link.platform]
              ? link.platform
              : 'custom',
          customLabel:
            typeof link?.customLabel === 'string'
              ? link.customLabel
              : typeof link?.label === 'string'
                ? link.label
                : '',
          url: typeof link?.url === 'string' ? link.url : '',
        }));

        setEditableSocialLinks(
          initialSocialLinks.length > 0
            ? initialSocialLinks
            : [
              {
                id: crypto.randomUUID(),
                platform: 'instagram',
                customLabel: '',
                url: '',
              },
            ],
        );

        setCoverPreview(
          fetchedSettings.coverImageUrl && typeof fetchedSettings.coverImageUrl === 'string'
            ? fetchedSettings.coverImageUrl
            : null,
        );

        // 設置是否公開（預設為不公開 false）
        setIsPublic(data?.is_public === true);

        setOrgName(data?.org_name ?? organization.name ?? '');
        setDescription(fetchedSettings.description ?? '');
        setLocation(fetchedSettings.location ?? '');
        setCustomDomain(fetchedSettings.customDomain ?? '');

        const emailFromSettings = fetchedSettings.contactEmail;
        setContactEmail(emailFromSettings ?? data?.contact_email ?? '');

        const codeFromSettings = fetchedSettings.contactPhoneCountryCode;
        const numberFromSettings = fetchedSettings.contactPhoneNumber;

        if (codeFromSettings && numberFromSettings) {
          setCountryCode(codeFromSettings);
          setPhoneNumber(numberFromSettings);
        } else if (typeof data?.contact_phone === 'string') {
          const trimmed = data.contact_phone.trim();
          const match = trimmed.match(/^(\+\d+)\s*(.*)$/);
          if (match) {
            setCountryCode(match[1]);
            setPhoneNumber(match[2]);
          } else {
            setPhoneNumber(trimmed);
          }
        }
      } catch (err: any) {
        console.error('OrganizationSettings: load failed', err);
        setError(err?.message ?? '載入機構資料時發生錯誤');
      } finally {
        setLoading(false);
      }
    };

    loadOrganization();
  }, [orgId, organizationResolved, orgDataDisabled, organization.name]);

  const handleSave = async () => {
    if (!orgId) {
      toast.error('找不到機構 ID，請稍後再試。');
      return;
    }

    const trimmedName = orgName.trim();
    const trimmedPhone = phoneNumber.trim();
    const trimmedEmail = contactEmail.trim();
    const trimmedDomain = customDomain.trim().toLowerCase();

    if (!trimmedName) {
      toast.error('請輸入機構名稱');
      return;
    }

    if (!trimmedPhone) {
      toast.error('請輸入 WhatsApp 聯絡方式');
      return;
    }

    if (selectedCategories.length === 0) {
      toast.error('請至少選擇一個機構類別');
      return;
    }

    if (selectedCategories.includes('custom') && !customCategory.trim()) {
      toast.error('請輸入自訂機構類別名稱');
      return;
    }

    // 檢查機構名稱唯一性（排除當前機構）
    // 注意：這個檢查在更新時由資料庫約束處理，如果名稱重複會返回錯誤
    // 暫時跳過前端檢查，讓 API 端點處理

    // 驗證自訂網域格式和唯一性
    if (trimmedDomain) {
      // 只允許小寫字母、數字和連字號
      const domainRegex = /^[a-z0-9-]+$/;
      if (!domainRegex.test(trimmedDomain)) {
        toast.error('自訂網域只能包含小寫字母、數字和連字號');
        return;
      }
      if (trimmedDomain.length < 2 || trimmedDomain.length > 50) {
        toast.error('自訂網域長度必須在 2-50 個字元之間');
        return;
      }

      // 檢查網域唯一性（由資料庫約束處理，如果網域重複會返回錯誤）
      // 前端只做格式驗證，唯一性檢查由 API 端點處理
    }

    let coverUploadResult;
    try {
      coverUploadResult = await uploadCoverImage();
    } catch (err: any) {
      console.error('OrganizationSettings: cover upload failed', err);
      toast.error(err?.message ?? '封面圖片上傳失敗，請稍後再試');
      return;
    }

    const updatedSettings: OrganizationSettings = {
      ...settings,
      categories: selectedCategories,
      customCategoryLabel:
        selectedCategories.includes('custom') && customCategory.trim().length > 0
          ? customCategory.trim()
          : null,
      description,
      location: location.trim() || null,
      customDomain: trimmedDomain || null,
      contactPhoneCountryCode: countryCode,
      contactPhoneNumber: trimmedPhone,
      contactEmail: trimmedEmail || null,
      socialLinks: socialLinks.map((link) => ({
        platform: link.platform,
        label: link.label,
        url: link.url,
        customLabel: link.customLabel,
        icon: link.icon ?? null,
      })),
      coverImagePath: coverUploadResult.path ?? settings.coverImagePath ?? null,
      coverImageUrl: coverUploadResult.publicUrl ?? settings.coverImageUrl ?? null,
    };

    try {
      setSaving(true);

      // 使用 API 端點更新機構資訊（繞過 RLS）
      const userEmail = user?.email || '';
      const updateResponse = await fetch('/api/organizations/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orgId,
          userEmail,
          updates: {
            org_name: trimmedName,
            contact_phone: `${countryCode} ${trimmedPhone}`,
            contact_email: trimmedEmail || null,
            settings: updatedSettings,
            is_public: isPublic,
          },
        }),
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json().catch(() => ({}));
        throw new Error(errorData.error || '更新機構資訊失敗');
      }

      setSettings(updatedSettings);
      setEditableSocialLinks(
        socialLinks.length > 0
          ? socialLinks.map((link) => ({
            id: crypto.randomUUID(),
            platform: link.platform,
            customLabel: link.customLabel ?? '',
            url: link.url,
          }))
          : [
            {
              id: crypto.randomUUID(),
              platform: 'instagram',
              customLabel: '',
              url: '',
            },
          ],
      );
      if (!selectedCategories.includes('custom')) {
        setCustomCategory('');
      }
      if (coverUploadResult.publicUrl) {
        setCoverPreview(coverUploadResult.publicUrl);
        setNewCoverFile(null);
      }
      toast.success('已更新機構資料');
    } catch (err: any) {
      console.error('OrganizationSettings: update failed', err);
      toast.error(err?.message ?? '更新失敗，請稍後再試');
    } finally {
      setSaving(false);
    }
  };

  if (orgDataDisabled) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md rounded-3xl border border-[#EADBC8] bg-white p-8 text-center shadow">
          <Image alt="建立機構" src="/rabbit.png" width={72} height={72} className="mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-[#4B4036]">尚未設定機構資料</h2>
          <p className="mt-2 text-sm text-[#8A7C70]">
            請先建立您的專屬機構，再管理相關資訊。
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <CuteLoadingSpinner message="載入機構資料..." className="h-full min-h-[320px] p-8" />;
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 text-[#2B3A3B]">
      <div className="mb-6 flex items-center justify-between">
        <HanamiButton
          type="button"
          variant="secondary"
          onClick={() => window.history.back()}
          className="flex items-center gap-2 px-4 py-2 text-sm"
        >
          返回上一頁
        </HanamiButton>
        <div className="text-right flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#4B4036]">管理您的機構資料</h1>
            <p className="mt-1 text-sm text-[#8A7C70]">
              查看與更新機構資訊，讓家長與老師了解您的品牌故事。
            </p>
          </div>
          <HanamiButton
            type="button"
            variant="secondary"
            className="flex items-center space-x-2 border border-[#EADBC8] bg-white/80"
            onClick={() => setShowPreviewModal(true)}
            disabled={!orgName.trim()}
          >
            <EyeIcon className="w-4 h-4" />
            <span>預覽機構</span>
          </HanamiButton>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <div className="rounded-3xl border border-[#EADBC8] bg-white/90 p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-[#4B4036]">基本資訊</h2>
          <div className="space-y-4">
            <HanamiInput
              placeholder="請輸入機構名稱"
              value={orgName}
              onChange={setOrgName}
              className="rounded-2xl border-2 border-[#EADBC8] bg-[#FFFDF8] shadow-sm focus:border-[#FFD59A] focus:ring-[#FFD59A] focus:ring-2"
            />

            <div>
              <label className="text-sm font-semibold text-[#4B4036]">
                WhatsApp 聯絡方式<span className="ml-1 text-red-500">*</span>
              </label>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <HanamiSelect
                  options={COUNTRY_CODE_OPTIONS}
                  value={countryCode}
                  onChange={setCountryCode}
                  className="sm:w-40"
                />
                <HanamiInput
                  placeholder="請輸入電話號碼"
                  value={phoneNumber}
                  onChange={setPhoneNumber}
                />
              </div>
              <p className="mt-1 text-xs text-[#8A7C70]">
                將會以「國碼 + 電話號碼」格式儲存，例如：+852 9123 4567
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold text-[#4B4036]">聯絡 Email</label>
              <HanamiInput
                placeholder="例如：contact@hanami.com"
                value={contactEmail}
                onChange={setContactEmail}
                className="rounded-2xl border-2 border-[#EADBC8] bg-[#FFFDF8] shadow-sm focus:border-[#FFD59A] focus:ring-[#FFD59A] focus:ring-2"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-[#4B4036]">機構地址</label>
              <HanamiInput
                placeholder="例如：香港九龍旺角威達商業大廈504-505室"
                value={location}
                onChange={setLocation}
                className="rounded-2xl border-2 border-[#EADBC8] bg-[#FFFDF8] shadow-sm focus:border-[#FFD59A] focus:ring-[#FFD59A] focus:ring-2"
              />
              <p className="mt-1 text-xs text-[#8A7C70]">
                填寫機構的實際地址，方便家長和學生找到您
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold text-[#4B4036]">自訂網域</label>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm text-[#8A7C70] whitespace-nowrap">www.hanamiecho.com/</span>
                <HanamiInput
                  placeholder="例如：aicat"
                  value={customDomain}
                  onChange={(value) => {
                    // 自動轉換為小寫並移除空格
                    const cleaned = value.toLowerCase().replace(/\s/g, '');
                    setCustomDomain(cleaned);
                  }}
                  className="flex-1 rounded-2xl border-2 border-[#EADBC8] bg-[#FFFDF8] shadow-sm focus:border-[#FFD59A] focus:ring-[#FFD59A] focus:ring-2"
                />
              </div>
              <p className="mt-1 text-xs text-[#8A7C70]">
                {customDomain ? (
                  <span>
                    完整網址：<span className="font-medium text-[#4B4036]">www.hanamiecho.com/{customDomain}</span>
                  </span>
                ) : (
                  '設定後，用戶可透過此網址直接訪問您的機構頁面（只能包含小寫字母、數字和連字號）'
                )}
              </p>
            </div>

            {/* 公開/隱藏 Toggle Switch */}
            <div className="rounded-2xl border-2 border-[#EADBC8] bg-[#FFFDF8] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-semibold text-[#4B4036]">機構公開顯示</label>
                  <p className="mt-1 text-xs text-[#8A7C70]">
                    {isPublic
                      ? '您的機構將會顯示在「課程活動」頁面，讓用戶可以探索您的課程'
                      : '您的機構目前為隱藏狀態，不會顯示在「課程活動」頁面'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPublic(!isPublic)}
                  className={`
                    relative inline-flex h-8 w-16 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
                    transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#FFD59A] focus:ring-offset-2
                    ${isPublic ? 'bg-gradient-to-r from-[#4CAF50] to-[#81C784]' : 'bg-[#D9D9D9]'}
                  `}
                >
                  <span className="sr-only">{isPublic ? '公開' : '隱藏'}</span>
                  <span
                    className={`
                      pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-md ring-0
                      transition-transform duration-300 ease-in-out
                      ${isPublic ? 'translate-x-8' : 'translate-x-0'}
                    `}
                  />
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className={`px-2 py-1 rounded-full ${!isPublic ? 'bg-[#EADBC8] text-[#4B4036] font-medium' : 'text-[#8A7C70]'}`}>
                  隱藏
                </span>
                <span className={`px-2 py-1 rounded-full ${isPublic ? 'bg-[#C8E6C9] text-[#2E7D32] font-medium' : 'text-[#8A7C70]'}`}>
                  公開
                </span>
              </div>
            </div>

            <div>
              <span className="text-sm font-semibold text-[#4B4036]">
                機構類別<span className="ml-1 text-red-500">*</span>
              </span>
              <div className="mt-3 space-y-4 rounded-2xl border border-[#EADBC8] bg-white/80 p-4 shadow-sm">
                {CATEGORY_GROUPS.map((group) => {
                  const isOpen = openGroups[group.title];
                  return (
                    <div key={group.title} className="space-y-2 rounded-xl border border-[#F5E7D6] bg-[#FFFCF6] p-3">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenGroups((prev) => ({
                            ...prev,
                            [group.title]: !prev[group.title],
                          }))
                        }
                        className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1 text-left text-sm font-semibold text-[#4B4036] transition hover:bg-[#FFEFD9]"
                      >
                        <span>{group.title}</span>
                        <span className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                          ▾
                        </span>
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
                                  onChange={() =>
                                    setSelectedCategories((prev) => {
                                      const exists = prev.includes(option.value);
                                      if (exists) {
                                        const next = prev.filter((item) => item !== option.value);
                                        if (option.value === 'custom') {
                                          setCustomCategory('');
                                        }
                                        return next;
                                      }
                                      return [...prev, option.value];
                                    })
                                  }
                                />
                                <div
                                  className={`
                                    flex w-full items-center gap-3 rounded-2xl border-2 px-3 py-3 text-sm font-medium transition-all duration-200
                                    ${checked
                                      ? 'border-[#FFD59A] bg-gradient-to-r from-[#FFF4DF] via-[#FFE9C6] to-[#FFF4DF] text-[#4B4036] shadow-sm'
                                      : 'border-transparent bg-white text-[#2B3A3B] shadow-[0_1px_4px_rgba(234,219,200,0.35)]'
                                    }
                                    hover:border-[#FFE0B2] hover:shadow-md
                                  `}
                                >
                                  <span
                                    className={`
                                      flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#EADBC8] bg-white text-transparent transition
                                      peer-checked:border-transparent peer-checked:bg-[#FFD59A]/90 peer-checked:text-[#4B4036]
                                      group-hover:border-[#FFD59A]
                                    `}
                                  >
                                    ✓
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
                    placeholder="請輸入自訂類別名稱"
                    value={customCategory}
                    onChange={setCustomCategory}
                  />
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-[#4B4036]">機構簡介</label>
              <textarea
                className="mt-2 w-full rounded-2xl border-2 border-[#EADBC8] bg-white/80 px-4 py-3 text-sm text-[#4B4036] shadow-sm focus:border-[#FFD59A] focus:outline-none focus:ring-2 focus:ring-[#FFD59A]"
                placeholder="介紹您的教學理念、課程特色或品牌故事..."
                rows={4}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
          </div>
          <div className="mt-6 flex justify-between">
            <HanamiButton
              type="button"
              variant="secondary"
              className="flex items-center space-x-2 border border-[#EADBC8] bg-white/80"
              onClick={() => setShowPreviewModal(true)}
              disabled={!orgName.trim()}
            >
              <EyeIcon className="w-4 h-4" />
              <span>預覽機構</span>
            </HanamiButton>
            <HanamiButton
              type="button"
              variant="primary"
              onClick={handleSave}
              disabled={saving}
              loading={saving}
            >
              儲存變更
            </HanamiButton>
          </div>
        </div>

        <div className="rounded-3xl border border-[#EADBC8] bg-white/90 p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-[#4B4036]">品牌展示</h2>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex min-w-[160px] flex-col items-center gap-3">
              <div className="relative h-32 w-32 overflow-hidden rounded-3xl border border-[#FFE3C6] bg-[#FFF9F2] shadow-sm">
                {coverPreview ? (
                  <Image src={coverPreview} alt="封面圖片" fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-[#8A7C70]">
                    尚未設定封面
                  </div>
                )}
              </div>
              <label
                className={`
                  flex cursor-pointer flex-col items-center justify-center rounded-full border-2 border-dashed border-[#EADBC8] px-4 py-3 text-center text-xs text-[#8A7C70]
                  transition hover:border-[#FFD59A] hover:bg-[#FFF4DF]
                  ${uploadingCover ? 'cursor-not-allowed opacity-60' : ''}
                `}
              >
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCoverChange}
                  disabled={uploadingCover}
                />
                <span className="font-medium text-[#4B4036]">
                  {uploadingCover ? '上傳中...' : '點擊重新上傳封面圖片'}
                </span>
                <span className="mt-1 text-[11px] text-[#8A7C70]">
                  支援 JPG / PNG / WebP，大小限制 2MB
                </span>
              </label>
              {newCoverFile && (
                <button
                  type="button"
                  className="text-xs text-[#D95C5C] underline"
                  onClick={() => {
                    setNewCoverFile(null);
                    setCoverPreview(settings.coverImageUrl ?? null);
                  }}
                >
                  取消重新上傳
                </button>
              )}
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <p className="text-sm font-semibold text-[#4B4036]">機構類別</p>
                {selectedCategories.length === 0 ? (
                  <p className="mt-2 text-sm text-[#8A7C70]">尚未設定機構類別</p>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedCategories.map((category) => (
                      <span
                        key={category}
                        className="rounded-full border border-[#FFD59A] bg-[#FFF9F2] px-3 py-1 text-xs font-medium text-[#4B4036]"
                      >
                        {category === 'custom'
                          ? customCategory || '自訂類別'
                          : CATEGORY_LABEL_MAP[category] ?? category}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-semibold text-[#4B4036] mb-2">
                  社交媒體連結
                </p>
                <div className="space-y-3">
                  {editableSocialLinks.map((link) => {
                    const platformMeta = SOCIAL_PLATFORM_MAP[link.platform];
                    return (
                      <div
                        key={link.id}
                        className="rounded-2xl border border-[#EADBC8] bg-[#FFFDF8] p-4 shadow-sm"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF4DF]">
                              {platformMeta?.icon ? (
                                <img
                                  src={platformMeta.icon}
                                  alt={platformMeta.label}
                                  className="h-5 w-5 object-contain"
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
                              onChange={(value) => {
                                setEditableSocialLinks((prev) =>
                                  prev.map((item) =>
                                    item.id === link.id
                                      ? {
                                        ...item,
                                        platform: value,
                                        customLabel:
                                          value === 'custom' ? item.customLabel : '',
                                      }
                                      : item,
                                  ),
                                );
                              }}
                              className="min-w-[160px]"
                            />
                          </div>
                          <HanamiInput
                            placeholder="https://your-social-link"
                            value={link.url}
                            onChange={(value) =>
                              setEditableSocialLinks((prev) =>
                                prev.map((item) =>
                                  item.id === link.id ? { ...item, url: value } : item,
                                ),
                              )
                            }
                          />
                        </div>
                        {link.platform === 'custom' && (
                          <div className="mt-3">
                            <HanamiInput
                              placeholder="請輸入自訂平台名稱"
                              value={link.customLabel}
                              onChange={(value) =>
                                setEditableSocialLinks((prev) =>
                                  prev.map((item) =>
                                    item.id === link.id
                                      ? { ...item, customLabel: value }
                                      : item,
                                  ),
                                )
                              }
                            />
                          </div>
                        )}
                        <div className="mt-3 flex justify-end">
                          <HanamiButton
                            variant="soft"
                            size="sm"
                            onClick={() =>
                              setEditableSocialLinks((prev) =>
                                prev.length === 1
                                  ? prev
                                  : prev.filter((item) => item.id !== link.id),
                              )
                            }
                          >
                            移除
                          </HanamiButton>
                        </div>
                      </div>
                    );
                  })}
                  <HanamiButton
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      setEditableSocialLinks((prev) => [
                        ...prev,
                        {
                          id: crypto.randomUUID(),
                          platform: 'instagram',
                          customLabel: '',
                          url: '',
                        },
                      ])
                    }
                  >
                    新增社交媒體連結
                  </HanamiButton>
                </div>
              </div>
            </div>
          </div>
        </div>
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
                coverImageUrl={coverPreview || settings.coverImageUrl || null}
                categories={selectedCategories.length > 0 ? selectedCategories : null}
                location={location.trim() || null}
                contactPhone={
                  phoneNumber.trim()
                    ? `${countryCode} ${phoneNumber.trim()}`
                    : null
                }
                contactEmail={contactEmail.trim() || null}
                socialLinks={socialLinks.length > 0 ? socialLinks : null}
                showEnrollButton={false}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function OrganizationSettingsPage() {
  return (
    <TeacherLinkShell currentPath="/aihome/teacher-link/create/organization-settings">
      <WithPermissionCheck pageKey="organization-settings">
        <OrganizationSettingsContent />
      </WithPermissionCheck>
    </TeacherLinkShell>
  );
}

