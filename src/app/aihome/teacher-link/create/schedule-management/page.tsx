'use client';

import Image from 'next/image';

import MultiCourseScheduleManagementPanel from '@/components/ui/MultiCourseScheduleManagementPanel';
import BackButton from '@/components/ui/BackButton';
import { TeacherLinkShell, useTeacherLinkOrganization } from '../TeacherLinkShell';

function TeacherLinkScheduleContent() {
  const { organization } = useTeacherLinkOrganization();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFF3E6] to-[#FFE1F0]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-10">
        <BackButton href="/aihome/teacher-link/create" label="返回老師主頁" />

        <section className="relative overflow-hidden rounded-[32px] border border-white/60 bg-gradient-to-br from-white/80 via-[#FFEFE2] to-[#FFE4F5] shadow-[0_32px_80px_rgba(228,192,155,0.35)]">
          <div className="absolute -right-14 top-10 h-48 w-48 rounded-full bg-white/40 blur-2xl" aria-hidden="true" />
          <div className="absolute -bottom-16 left-10 h-40 w-40 rounded-full bg-[#FFD6E7]/60 blur-3xl" aria-hidden="true" />
          <div className="relative grid gap-8 px-8 py-10 lg:grid-cols-[3fr_2fr]">
            <div className="space-y-4 text-[#4B4036]">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-[#D48347] shadow-sm">
                課程排程中心
              </span>
              <h1 className="text-3xl font-extrabold leading-snug tracking-wide lg:text-4xl">
                {organization?.name || '專屬機構'} — 課程與課堂排期管理
              </h1>
              <p className="text-sm leading-relaxed text-[#6E5A4A] lg:text-base">
                整合課程類型、課程代碼與多課程時間表，在單一介面中協調教師、教室與套票優惠，讓每位學生的學習旅程都保持順暢。
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="rounded-full bg-white/80 px-4 py-2 text-xs font-medium text-[#84624A] shadow">
                  ✔️ 課程類型一目了然
                </span>
                <span className="rounded-full bg-white/80 px-4 py-2 text-xs font-medium text-[#84624A] shadow">
                  ✔️ 套票／試堂優惠快速配置
                </span>
                <span className="rounded-full bg-white/80 px-4 py-2 text-xs font-medium text-[#84624A] shadow">
                  ✔️ 多課程時段同步管理
                </span>
              </div>
            </div>
            <div className="relative flex items-end justify-end">
              <div className="relative h-48 w-48 overflow-hidden rounded-3xl border border-white/60 bg-white/70 shadow-xl sm:h-56 sm:w-56">
                <Image
                  src="/icons/elephant.PNG"
                  alt="Schedule Illustration"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: '課程類型',
              description: '建立可重用的課程架構，定義年齡層與難度。',
              icon: '/icons/music.PNG',
            },
            {
              title: '課程代碼',
              description: '管理班別、授課老師與教室安排。',
              icon: '/icons/book-elephant.PNG',
            },
            {
              title: '多課程時間表',
              description: '在同一時段安排多個課程與教師，保持運作彈性。',
              icon: '/icons/clock.PNG',
            },
          ].map((card) => (
            <div
              key={card.title}
              className="flex items-start gap-4 rounded-2xl border border-[#F1E4D3] bg-white/90 px-4 py-5 shadow-sm"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFF4ED]">
                <Image src={card.icon} alt={card.title} width={32} height={32} className="object-contain" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-[#4B4036]">{card.title}</h3>
                <p className="text-sm leading-relaxed text-[#786355]">{card.description}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="rounded-[28px] border border-[#F1E4D3] bg-white/90 px-5 py-6 shadow-[0_24px_60px_rgba(231,200,166,0.28)]">
          <MultiCourseScheduleManagementPanel />
        </section>
      </div>
    </div>
  );
}

export default function TeacherLinkCreateScheduleManagementPage() {
  return (
    <TeacherLinkShell currentPath="/aihome/teacher-link/create/schedule-management">
      <TeacherLinkScheduleContent />
    </TeacherLinkShell>
  );
}

