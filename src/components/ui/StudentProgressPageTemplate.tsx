'use client';

import React, { ReactNode, useState } from 'react';
import Image from 'next/image';
import BackButton from './BackButton';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface StepGuide {
  step: number;
  title: string;
  description: string;
  icon?: string;
}

interface FeatureCard {
  title: string;
  description: string;
  icon: string;
}

interface StudentProgressPageTemplateProps {
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  illustration: string;
  illustrationAlt: string;
  features: FeatureCard[];
  steps: StepGuide[];
  backHref: string;
  backLabel: string;
  children: ReactNode;
  organizationName?: string;
}

export default function StudentProgressPageTemplate({
  title,
  subtitle,
  description,
  badge,
  illustration,
  illustrationAlt,
  features,
  steps,
  backHref,
  backLabel,
  children,
  organizationName,
}: StudentProgressPageTemplateProps) {
  const [isStepsExpanded, setIsStepsExpanded] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFF3E6] to-[#FFE1F0]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 sm:px-5 py-6 sm:py-10">
        <BackButton href={backHref} label={backLabel} />

        {/* 標題區塊 */}
        <section className="relative overflow-hidden rounded-[32px] border border-white/60 bg-gradient-to-br from-white/80 via-[#FFEFE2] to-[#FFE4F5] shadow-[0_32px_80px_rgba(228,192,155,0.35)]">
          <div className="absolute -right-14 top-10 h-48 w-48 rounded-full bg-white/40 blur-2xl" aria-hidden="true" />
          <div className="absolute -bottom-16 left-10 h-40 w-40 rounded-full bg-[#FFD6E7]/60 blur-3xl" aria-hidden="true" />
          <div className="relative grid gap-6 sm:gap-8 px-6 sm:px-8 py-8 sm:py-10 lg:grid-cols-[3fr_2fr]">
            <div className="space-y-3 sm:space-y-4 text-[#4B4036]">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-[#D48347] shadow-sm">
                {badge}
              </span>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-snug tracking-wide">
                {organizationName ? `${organizationName} — ` : ''}{title}
              </h1>
              <p className="text-xs sm:text-sm leading-relaxed text-[#6E5A4A] lg:text-base">
                {description}
              </p>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {features.map((feature, index) => (
                  <span
                    key={index}
                    className="rounded-full bg-white/80 px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-medium text-[#84624A] shadow"
                  >
                    ✔️ {feature.title}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative flex items-end justify-end mt-4 lg:mt-0">
              <div className="relative h-40 w-40 sm:h-48 sm:w-48 overflow-hidden rounded-3xl border border-white/60 bg-white/70 shadow-xl">
                <Image
                  src={illustration}
                  alt={illustrationAlt}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 功能卡片 */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex items-start gap-3 sm:gap-4 rounded-2xl border border-[#F1E4D3] bg-white/90 px-4 py-4 sm:py-5 shadow-sm"
            >
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-[#FFF4ED] flex-shrink-0">
                <Image
                  src={feature.icon}
                  alt={feature.title}
                  width={24}
                  height={24}
                  className="object-contain sm:w-8 sm:h-8"
                />
              </div>
              <div className="space-y-1 min-w-0">
                <h3 className="text-sm sm:text-base font-semibold text-[#4B4036]">{feature.title}</h3>
                <p className="text-xs sm:text-sm leading-relaxed text-[#786355]">{feature.description}</p>
              </div>
            </div>
          ))}
        </section>

        {/* 步驟教學 */}
        {steps.length > 0 && (
          <section className="rounded-[28px] border border-[#F1E4D3] bg-white/90 px-4 sm:px-6 py-5 sm:py-6 shadow-[0_24px_60px_rgba(231,200,166,0.28)]">
            <button
              onClick={() => setIsStepsExpanded(!isStepsExpanded)}
              className="w-full flex items-center justify-between mb-4 sm:mb-6 text-left hover:opacity-80 transition-opacity"
            >
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-[#4B4036] mb-2">設定步驟</h2>
                <p className="text-xs sm:text-sm text-[#6E5A4A]">
                  展開以了解，按照以下步驟完成 {subtitle} 的設定
                </p>
              </div>
              <div className="flex-shrink-0 ml-4">
                {isStepsExpanded ? (
                  <ChevronUpIcon className="h-6 w-6 text-[#4B4036]" />
                ) : (
                  <ChevronDownIcon className="h-6 w-6 text-[#4B4036]" />
                )}
              </div>
            </button>
            {isStepsExpanded && (
              <div className="space-y-3 sm:space-y-4">
                {steps.map((step, index) => (
                  <div
                    key={index}
                    className="flex gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl border border-[#EADBC8] bg-gradient-to-r from-white to-[#FFF9F2] hover:shadow-md transition-shadow"
                  >
                    <div className="flex-shrink-0">
                      <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] text-white font-bold text-sm sm:text-base shadow-sm">
                        {step.step}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-base font-semibold text-[#4B4036] mb-1">
                        {step.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#6E5A4A] leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                    {step.icon && (
                      <div className="flex-shrink-0 hidden sm:block">
                        <Image
                          src={step.icon}
                          alt={step.title}
                          width={32}
                          height={32}
                          className="object-contain opacity-60"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 主要內容區域 */}
        <section className="rounded-[28px] border border-[#F1E4D3] bg-white/90 px-4 sm:px-5 py-5 sm:py-6 shadow-[0_24px_60px_rgba(231,200,166,0.28)]">
          {children}
        </section>
      </div>
    </div>
  );
}

