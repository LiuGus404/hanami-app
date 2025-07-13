import React from 'react';

interface StudentProfileHeaderProps {
  avatarUrl?: string;
  name: string;
  ageOrStage: string;
  subLabel?: string;
  className?: string;
}

export default function StudentProfileHeader({ avatarUrl, name, ageOrStage, subLabel, className = '' }: StudentProfileHeaderProps) {
  return (
    <div className={`flex items-center gap-4 mb-4 ${className}`}>
      <div className="w-16 h-16 rounded-full bg-[#FFE0E0] flex items-center justify-center overflow-hidden">
        {avatarUrl ? (
          <img alt={name} className="w-full h-full object-cover" src={avatarUrl} />
        ) : (
          <svg fill="none" height="48" viewBox="0 0 48 48" width="48"><circle cx="24" cy="24" fill="#FFD59A" r="24" /><ellipse cx="24" cy="20" fill="#fff" rx="10" ry="8" /><ellipse cx="24" cy="36" fill="#fff" rx="14" ry="8" /><circle cx="19" cy="20" fill="#A67C52" r="2" /><circle cx="29" cy="20" fill="#A67C52" r="2" /><path d="M20 28c1.5 2 6.5 2 8 0" stroke="#A67C52" strokeLinecap="round" strokeWidth="2" /></svg>
        )}
      </div>
      <div>
        <div className="font-bold text-xl text-hanami-text">{name}</div>
        <div className="text-hanami-text-secondary text-base">{ageOrStage}</div>
        {subLabel && <div className="text-xs text-hanami-accent mt-1">{subLabel}</div>}
      </div>
    </div>
  );
} 