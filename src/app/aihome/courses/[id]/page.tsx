'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import CourseTypePreviewCard from '@/components/ui/CourseTypePreviewCard';
import { supabase } from '@/lib/supabase';

export default function CourseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const courseId = params?.id;
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<any | null>(null);
  const [orgSettings, setOrgSettings] = useState<any | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        if (!courseId) return;
        const { data: ct, error } = await supabase
          .from('Hanami_CourseTypes')
          .select('id, name, description, duration_minutes, difficulty_level, max_students, price_per_lesson, images, status, org_id, discount_configs')
          .eq('id', courseId)
          .maybeSingle();
        if (error) throw error;
        setCourse(ct);
        if (ct?.org_id) {
          const { data: org, error: orgErr } = await supabase
            .from('hanami_organizations')
            .select('settings')
            .eq('id', ct.org_id)
            .maybeSingle();
          if (!orgErr && org) setOrgSettings(org.settings || {});
        }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A]">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <button
          onClick={() => router.push('/aihome/course-activities')}
          className="mb-4 px-4 py-2 rounded-lg border border-[#EADBC8] text-[#4B4036] bg-white hover:bg-[#FFF9F2] transition"
        >
          返回
        </button>
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


