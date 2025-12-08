'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import OrganizationPreviewCard from '@/components/ui/OrganizationPreviewCard';
import OrgReviewSection from '@/components/ui/OrgReviewSection';

export default function OrganizationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const orgId = params?.id;
  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState<any | null>(null);
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        if (!orgId) return;
        
        // 使用 API 端點獲取機構資訊（繞過 RLS）
        const orgResponse = await fetch(`/api/organizations/get?orgId=${encodeURIComponent(orgId)}`, {
          credentials: 'include',
        });
        
        if (!orgResponse.ok) {
          const errorData = await orgResponse.json().catch(() => ({ error: '無法解析錯誤響應' }));
          console.error('❌ 獲取機構資訊失敗:', orgResponse.status, errorData);
          setOrg(null);
          setLoading(false);
          return;
        }
        
        const orgResult = await orgResponse.json();
        if (orgResult.success && orgResult.data) {
          setOrg(orgResult.data);
        } else {
          console.error('❌ 機構數據格式錯誤:', orgResult);
          setOrg(null);
        }

        // 使用 API 端點獲取機構課程（繞過 RLS）
        const coursesResponse = await fetch(`/api/courses/list?orgId=${encodeURIComponent(orgId)}&status=true`, {
          credentials: 'include',
        });
        
        if (coursesResponse.ok) {
          const coursesResult = await coursesResponse.json();
          if (coursesResult.success && coursesResult.data) {
            // 過濾有效的課程
            const valid = (coursesResult.data || []).filter((c: any) => c && (c.status === true || c.status === 'true'));
            setCourses(valid);
          }
        } else {
          const errorData = await coursesResponse.json().catch(() => ({ error: '無法解析錯誤響應' }));
          console.error('❌ 獲取課程列表失敗:', coursesResponse.status, errorData);
          setCourses([]);
        }
      } catch (error) {
        console.error('載入機構詳情失敗:', error);
        setOrg(null);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [orgId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4B4036] mx-auto mb-4"></div>
          <p className="text-[#4B4036]">載入中...</p>
        </div>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-[#4B4036]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#4B4036] mb-2">未找到機構</h2>
            <p className="text-[#2B3A3B] mb-6">抱歉，找不到您要查看的機構資訊</p>
          </div>
          <button
            onClick={() => router.push('/aihome/course-activities')}
            className="px-6 py-3 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            返回課程活動
          </button>
        </div>
      </div>
    );
  }

  const settings = (org.settings as any) || {};

  // 構建課程展示資料（對應 CourseMiniCard 需求）
  const builtCourses = (courses || []).map((ct: any) => {
    const images: string[] = Array.isArray(ct.images) ? ct.images : [];
    const firstImage = images.length > 0 ? images[0] : '/HanamiMusic/musicclass.png';
    const discountConfigs = ct.discount_configs && typeof ct.discount_configs === 'object'
      ? ct.discount_configs
      : { packages: [], trialBundles: [] };
    const trialBundles = Array.isArray(discountConfigs?.trialBundles) ? discountConfigs.trialBundles : [];
    const firstActiveTrial = trialBundles.find((b: any) => b?.is_active !== false) || trialBundles[0];
    const displayPrice = (firstActiveTrial?.price != null)
      ? Number(firstActiveTrial.price)
      : (ct.price_per_lesson || 0);

    return {
      id: ct.id,
      name: ct.name || '未命名課程',
      description: ct.description || '',
      image: firstImage,
      price: displayPrice,
      discountConfigs,
      minAge: ct.min_age ?? null,
      maxAge: ct.max_age ?? null,
    };
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A]">
      <div className="max-w-5xl mx-auto px-4 py-6 pb-24 lg:pb-6">
        <button
          onClick={() => router.push('/aihome/course-activities')}
          className="mb-4 px-4 py-2 rounded-lg border border-[#EADBC8] text-[#4B4036] bg-white hover:bg-[#FFF9F2] transition"
        >
          返回
        </button>
        <OrganizationPreviewCard
          orgId={org.id}
          orgName={org.org_name}
          description={settings.description || null}
          coverImageUrl={settings.coverImageUrl || null}
          categories={settings.categories || null}
          location={settings.location || null}
          contactPhone={org.contact_phone || settings.contactPhone || null}
          contactEmail={org.contact_email || settings.contactEmail || null}
          socialLinks={settings.socialLinks || null}
          showEnrollButton={true}
          onEnroll={() => router.push(`/aihome/course-activities/register?orgId=${org.id}`)}
        />

        {/* WhatsApp 聯繫按鈕 */}
        {(org.contact_phone || settings.contactPhone) && (() => {
          const phoneNumber = org.contact_phone || settings.contactPhone || '';
          // 處理電話號碼格式：移除所有空格、括號、破折號等，保留數字和 + 號
          const cleanPhone = phoneNumber.replace(/[\s\-()]/g, '');
          // 如果沒有 + 號，確保有國家代碼（預設 +852）
          const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone.substring(1) : (cleanPhone.startsWith('852') ? cleanPhone : `852${cleanPhone}`);
          
          return (
            <div className="mt-6 flex justify-center relative z-10">
              <a
                href={`https://api.whatsapp.com/send/?phone=${formattedPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:from-[#EBC9A4] hover:to-[#FFD59A] border-2 border-[#EAC29D]"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
                <span>立即 WhatsApp 聯繫</span>
              </a>
            </div>
          );
        })()}

        {/* 機構課程列表 - 緊湊顯示 */}
        {builtCourses.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-[#4B4036] mb-3">機構課程 ({builtCourses.length})</h2>
            <div className="overflow-x-auto">
              <div className="flex gap-3 pb-2">
                {builtCourses.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => router.push(`/aihome/courses/${c.id}`)}
                    className="flex-shrink-0 w-48 bg-white rounded-xl border border-[#EADBC8] overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="relative w-full" style={{ aspectRatio: '4/3', backgroundColor: '#FFF9F2' }}>
                      <Image
                        src={c.image}
                        alt={c.name}
                        fill
                        className="object-cover"
                        sizes="192px"
                      />
                    </div>
                    <div className="p-3">
                      <div className="text-sm font-semibold text-[#4B4036] line-clamp-1 mb-1">{c.name}</div>
                      <div className="text-xs text-[#8A7C70] line-clamp-2 mb-2">{c.description}</div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-[#4B4036]">
                          ${c.price}
                        </span>
                        {(c.minAge || c.maxAge) && (
                          <span className="text-xs text-[#8A7C70]">
                            {c.minAge && c.maxAge ? `${c.minAge}-${c.maxAge}歲` : c.minAge ? `${c.minAge}+歲` : `${c.maxAge}歲以下`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 評論區塊 */}
        <OrgReviewSection orgId={org.id} />
      </div>
    </div>
  );
}


