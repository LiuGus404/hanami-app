'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import AITeacherSchedulerModal from '@/components/ui/AITeacherSchedulerModal';
import HanamiTC from '@/components/ui/HanamiTC';
import HanamiTCDefaultTime from '@/components/ui/HanamiTCDefaultTime';
import { getSupabaseClient } from '@/lib/supabase';
import { Teacher } from '@/types';

export default function HanamiTCPage() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isAISchedulerOpen, setIsAISchedulerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'actual' | 'default'>('actual');

  useEffect(() => {
    const fetchTeachers = async () => {
      const supabase = getSupabaseClient();
      const { data } = await supabase
        .from('hanami_employee')
        .select('id, teacher_fullname, teacher_nickname, teacher_role, teacher_status, teacher_email, teacher_phone, teacher_address, teacher_gender, teacher_dob, teacher_hsalary, teacher_msalary, teacher_background, teacher_bankid, created_at, updated_at')
        .eq('teacher_status', 'active');
      if (data) {
        // teacher_gender 可能為 undefined，補 null
        setTeachers(
          data.map((t: any) => ({
            ...t,
            teacher_gender: t.teacher_gender ?? null,
          })),
        );
      }
    };
    fetchTeachers();
  }, []);

  return (
    <div className="min-h-screen bg-[#FFF9F2] font-['Quicksand',_sans-serif] px-6 py-8">
      <AITeacherSchedulerModal
        open={isAISchedulerOpen}
        teachers={teachers}
        onClose={() => setIsAISchedulerOpen(false)}
      />
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl p-6 mb-6 border border-[#EADBC8]">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-[#2B3A3B]">課堂管理</h1>
            <div className="flex items-center gap-4">
              <button
                className="flex items-center gap-2 hanami-btn px-4 py-2"
                onClick={() => setIsAISchedulerOpen(true)}
              >
                <img alt="AI" className="w-5 h-5" src="/icons/edit-pencil.png" />
                <span className="text-base font-bold">AI 安排老師</span>
              </button>
              <Link href="/admin/class-activities">
                <button className="flex items-center gap-2 hanami-btn px-4 py-2">
                  <img alt="列表" className="w-5 h-5" src="/details.png" />
                  <span className="text-base font-bold">列表顯示</span>
                </button>
              </Link>
            </div>
          </div>
          
          {/* 切換按鈕 */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                viewMode === 'actual' ? 'hanami-btn text-[#4B4036]' : 'hanami-btn-soft text-[#4B4036]'
              }`}
              onClick={() => setViewMode('actual')}
            >
              <img alt="實際時間" className="w-5 h-5" src="/calendar.png" />
              <span className="text-base font-bold">實際時間</span>
            </button>
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                viewMode === 'default' ? 'hanami-btn text-[#4B4036]' : 'hanami-btn-soft text-[#4B4036]'
              }`}
              onClick={() => setViewMode('default')}
            >
              <img alt="預設時間" className="w-5 h-5" src="/refresh.png" />
              <span className="text-base font-bold">預設時間</span>
            </button>
          </div>
          
          {viewMode === 'actual' ? (
            <HanamiTC teachers={teachers} />
          ) : (
            <HanamiTCDefaultTime teachers={teachers} />
          )}
        </div>
      </div>
    </div>
  );
} 