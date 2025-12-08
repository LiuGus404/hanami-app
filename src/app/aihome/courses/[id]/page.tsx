'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import CourseTypePreviewCard from '@/components/ui/CourseTypePreviewCard';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

export default function CourseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const courseId = params?.id;
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<any | null>(null);
  const [orgSettings, setOrgSettings] = useState<any | null>(null);
  const [org, setOrg] = useState<any | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [orgSlug, setOrgSlug] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        if (!courseId) return;
        
        // 使用 API 端點獲取課程資訊（繞過 RLS）
        const courseResponse = await fetch(`/api/courses/list?status=true`, {
          credentials: 'include',
        });
        
        if (!courseResponse.ok) {
          const errorData = await courseResponse.json().catch(() => ({ error: '無法解析錯誤響應' }));
          console.error('❌ 獲取課程資訊失敗:', courseResponse.status, errorData);
          setCourse(null);
          setLoading(false);
          return;
        }
        
        const courseResult = await courseResponse.json();
        if (courseResult.success && courseResult.data) {
          const courseData = courseResult.data.find((c: any) => c.id === courseId);
          if (courseData) {
            setCourse(courseData);
            setOrgId(courseData.org_id || null);
            
            // 如果有機構 ID，獲取機構資訊
            if (courseData.org_id) {
              const orgResponse = await fetch(`/api/organizations/get?orgId=${encodeURIComponent(courseData.org_id)}`, {
                credentials: 'include',
              });
              
              if (orgResponse.ok) {
                const orgResult = await orgResponse.json();
                if (orgResult.success && orgResult.data) {
                  setOrg(orgResult.data);
                  setOrgSettings(orgResult.data.settings || {});
                  setOrgSlug(orgResult.data.org_slug || null);
                }
              }
            }
          } else {
            setCourse(null);
          }
        } else {
          console.error('❌ 課程數據格式錯誤:', courseResult);
          setCourse(null);
        }
      } catch (error) {
        console.error('載入課程詳情失敗:', error);
        setCourse(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId]);

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

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[#4B4036]">未找到課程</div>
      </div>
    );
  }

  const images = Array.isArray(course.images) ? course.images : [];
  const discountConfigs = course.discount_configs && typeof course.discount_configs === 'object'
    ? course.discount_configs
    : { packages: [], trialBundles: [] };

  // 檢查是否為花見音樂機構（優先使用 org_slug）
  const isHanamiMusic = 
    orgSlug === 'hanami-music' ||
    orgId === 'f8d269ec-b682-45d1-a796-3b74c2bf3eec';
  const orgRoute = isHanamiMusic && orgId
    ? '/aihome/hanami-music'
    : orgId
    ? `/aihome/organizations/${orgId}`
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A]">
      <div className="max-w-5xl mx-auto px-4 py-6 pb-24 lg:pb-6">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.push('/aihome/course-activities')}
            className="px-4 py-2 rounded-lg border border-[#EADBC8] text-[#4B4036] bg-white hover:bg-[#FFF9F2] transition"
          >
            返回
          </button>
          {orgRoute && (
            <button
              onClick={() => router.push(orgRoute)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#EADBC8] text-[#4B4036] bg-white hover:bg-[#FFF9F2] transition shadow-sm"
            >
              <BuildingOfficeIcon className="w-5 h-5" />
              <span>查看機構</span>
            </button>
          )}
        </div>
        <CourseTypePreviewCard
          courseId={course.id}
          name={course.name}
          description={course.description}
          durationMinutes={course.duration_minutes || undefined}
          maxStudents={course.max_students || undefined}
          pricePerLesson={course.price_per_lesson || undefined}
          images={images}
          location={orgSettings?.location || '香港九龍旺角'}
          status={course.status === true}
          discountConfigs={discountConfigs}
          showEnrollButton={false}
        />

        {/* 簡約的機構資訊區塊 */}
        {orgId && (
          <div className="mt-6 p-4 bg-white/60 rounded-xl border border-[#EADBC8]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {orgSettings?.coverImageUrl && (
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={orgSettings.coverImageUrl}
                      alt={org?.org_name || '機構'}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[#4B4036] line-clamp-1">
                    {org?.org_name || '未命名機構'}
                  </div>
                  {orgSettings?.description && (
                    <div className="text-xs text-[#8A7C70] line-clamp-1 mt-0.5">
                      {orgSettings.description}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 sm:ml-4 w-full sm:w-auto justify-end sm:justify-start">
                {orgRoute && (
                  <button
                    onClick={() => router.push(orgRoute)}
                    className="px-3 py-1.5 text-xs rounded-lg border border-[#EADBC8] text-[#4B4036] bg-white hover:bg-[#FFF9F2] transition whitespace-nowrap relative z-10"
                  >
                    查看機構
                  </button>
                )}
                {(org?.contact_phone || orgSettings?.contactPhone) && (() => {
                  const phoneNumber = org?.contact_phone || orgSettings?.contactPhone || '';
                  const cleanPhone = phoneNumber.replace(/[\s\-()]/g, '');
                  const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone.substring(1) : (cleanPhone.startsWith('852') ? cleanPhone : `852${cleanPhone}`);
                  
                  return (
                    <a
                      href={`https://api.whatsapp.com/send/?phone=${formattedPhone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] rounded-lg text-xs font-medium shadow-sm hover:shadow transition-all duration-200 border border-[#EAC29D] hover:from-[#EBC9A4] hover:to-[#FFD59A] whitespace-nowrap relative z-10"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                      </svg>
                      <span>WhatsApp</span>
                    </a>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


