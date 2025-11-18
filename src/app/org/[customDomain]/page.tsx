'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import OrganizationPreviewCard from '@/components/ui/OrganizationPreviewCard';
import { supabase } from '@/lib/supabase';

type OrganizationSettings = {
  coverImageUrl?: string | null;
  description?: string | null;
  categories?: string[];
  location?: string | null;
  contactPhoneCountryCode?: string | null;
  contactPhoneNumber?: string | null;
  contactEmail?: string | null;
  customDomain?: string | null;
  socialLinks?: Array<{
    platform: string;
    label: string;
    url: string;
    customLabel?: string | null;
    icon?: string | null;
  }>;
};

export default function CustomDomainOrganizationPage() {
  const params = useParams<{ customDomain: string }>();
  const router = useRouter();
  const customDomain = params?.customDomain?.toLowerCase();
  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!customDomain) {
        setError('無效的網域');
        setLoading(false);
        return;
      }

      try {
        // 查詢所有機構並檢查 settings.customDomain
        const { data: allOrgs, error: fetchError } = await supabase
          .from('hanami_organizations')
          .select('id, org_name, contact_phone, contact_email, settings, status');

        if (fetchError) {
          throw fetchError;
        }

        // 在記憶體中查找匹配的機構
        const matchedOrg = allOrgs?.find((org: any) => {
          const settings = (org.settings as OrganizationSettings) || {};
          return settings.customDomain?.toLowerCase() === customDomain;
        });

        if (!matchedOrg) {
          setError('找不到對應的機構');
          setLoading(false);
          return;
        }

        // 檢查機構狀態
        if (matchedOrg.status !== 'active') {
          setError('此機構目前無法訪問');
          setLoading(false);
          return;
        }

        setOrg(matchedOrg);
      } catch (err: any) {
        console.error('載入機構資料時發生錯誤:', err);
        setError('載入機構資料時發生錯誤，請稍後再試');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [customDomain]);

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

  if (error || !org) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A] flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="mb-4 text-6xl">🎯</div>
          <h1 className="text-2xl font-bold text-[#4B4036] mb-2">找不到機構</h1>
          <p className="text-[#8A7C70] mb-6">{error || '此網域對應的機構不存在或已停用'}</p>
          <button
            onClick={() => router.push('/aihome/course-activities')}
            className="px-6 py-3 rounded-lg border border-[#EADBC8] text-[#4B4036] bg-white hover:bg-[#FFF9F2] transition"
          >
            返回課程活動頁面
          </button>
        </div>
      </div>
    );
  }

  const settings = (org.settings as OrganizationSettings) || {};

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
          contactPhone={org.contact_phone || null}
          contactEmail={org.contact_email || null}
          socialLinks={settings.socialLinks || null}
          showEnrollButton={false}
        />
      </div>
    </div>
  );
}


