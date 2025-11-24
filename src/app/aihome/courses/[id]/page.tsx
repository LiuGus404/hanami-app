'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import CourseTypePreviewCard from '@/components/ui/CourseTypePreviewCard';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';

export default function CourseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const courseId = params?.id;
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<any | null>(null);
  const [orgSettings, setOrgSettings] = useState<any | null>(null);
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
      <div className="max-w-5xl mx-auto px-4 py-6">
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
      </div>
    </div>
  );
}


