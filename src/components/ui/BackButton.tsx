'use client';

import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

interface BackButtonProps {
  href?: string
  label?: string
  className?: string
}

export default function BackButton({ 
  href, 
  label = '返回', 
  className = '', 
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <button
      aria-label={label}
      className={`
        inline-flex items-center gap-2 px-4 py-2 
        bg-white border border-[#EADBC8] rounded-lg
        text-[#2B3A3B] hover:text-[#A64B2A] 
        hover:bg-[#FFF9F2] hover:border-[#FFD59A]
        transition-all duration-200 shadow-sm hover:shadow-md
        focus:outline-none focus:ring-2 focus:ring-[#FFD59A] focus:ring-offset-2
        ${className}
      `}
      onClick={handleClick}
    >
      <ArrowLeftIcon className="w-4 h-4" />
      <span className="font-medium">{label}</span>
    </button>
  );
} 