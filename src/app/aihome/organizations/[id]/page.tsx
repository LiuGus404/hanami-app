'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import OrganizationPreviewCard from '@/components/ui/OrganizationPreviewCard';
import CourseMiniCard from '@/components/ui/CourseMiniCard';
import OrgReviewSection from '@/components/ui/OrgReviewSection';
import { supabase } from '@/lib/supabase';

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
        const { data: orgData, error: orgError } = await supabase
          .from('hanami_organizations')
          .select('id, org_name, contact_phone, contact_email, settings')
          .eq('id', orgId)
          .maybeSingle();
        if (orgError) throw orgError;
        setOrg(orgData);

        // 載入機構課程
        const { data: ctData, error: ctError } = await supabase
          .from('Hanami_CourseTypes')
          .select('*')
          .eq('org_id', orgId);
        if (ctError) throw ctError;
        const valid = (ctData || []).filter((c: any) => c && (c.status === true || c.status === 'true'));
        setCourses(valid);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[#4B4036]">未找到機構</div>
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
      <div className="max-w-5xl mx-auto px-4 py-6">
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
          showEnrollButton={false}
        />

        {/* 機構課程列表 */}
        {builtCourses.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-[#4B4036] mb-3">機構課程</h2>
            <div className="overflow-x-auto">
              <div className="flex gap-4 pb-2">
                {builtCourses.map((c) => (
                  <CourseMiniCard
                    key={c.id}
                    id={c.id}
                    name={c.name}
                    image={c.image}
                    description={c.description}
                    price={c.price}
                    orgName={org.org_name}
                    orgLogo={settings.coverImageUrl || null}
                    categories={settings.categories || null}
                    discountConfigs={c.discountConfigs}
                    minAge={c.minAge}
                    maxAge={c.maxAge}
                    onClick={() => router.push(`/aihome/courses/${c.id}`)}
                  />
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


