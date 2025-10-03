'use client';

import { GlobeAltIcon } from '@heroicons/react/24/outline';

interface CountryFlagProps {
  countryCode: string;
  className?: string;
}

export default function CountryFlag({ countryCode, className = "w-5 h-5" }: CountryFlagProps) {
  // 國旗圖標映射 - 使用簡化的圖標系統
  const flagIcons: Record<string, { emoji: string; color: string; name: string }> = {
    '+852': { emoji: '🇭🇰', color: 'bg-red-500', name: '香港' },
    '+86': { emoji: '🇨🇳', color: 'bg-red-600', name: '中國' },
    '+886': { emoji: '🇹🇼', color: 'bg-blue-600', name: '台灣' },
    '+65': { emoji: '🇸🇬', color: 'bg-red-500', name: '新加坡' },
    '+60': { emoji: '🇲🇾', color: 'bg-red-500', name: '馬來西亞' },
    '+66': { emoji: '🇹🇭', color: 'bg-red-600', name: '泰國' },
    '+84': { emoji: '🇻🇳', color: 'bg-red-600', name: '越南' },
    '+63': { emoji: '🇵🇭', color: 'bg-blue-600', name: '菲律賓' },
    '+62': { emoji: '🇮🇩', color: 'bg-red-500', name: '印尼' },
    '+1': { emoji: '🇺🇸', color: 'bg-blue-600', name: '美國/加拿大' },
    '+44': { emoji: '🇬🇧', color: 'bg-blue-600', name: '英國' },
    '+81': { emoji: '🇯🇵', color: 'bg-red-500', name: '日本' },
    '+82': { emoji: '🇰🇷', color: 'bg-blue-600', name: '韓國' },
    '+61': { emoji: '🇦🇺', color: 'bg-blue-600', name: '澳洲' },
    '+64': { emoji: '🇳🇿', color: 'bg-blue-600', name: '紐西蘭' }
  };

  const flagInfo = flagIcons[countryCode];

  if (!flagInfo) {
    return (
      <div className={`${className} rounded-full bg-gray-200 flex items-center justify-center`}>
        <GlobeAltIcon className="w-3 h-3 text-gray-600" />
      </div>
    );
  }

  return (
    <div className={`${className} relative`}>
      {/* 使用 emoji 作為背景，但添加一個圓形容器 */}
      <div className="w-full h-full rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
        <span className="text-sm leading-none">{flagInfo.emoji}</span>
      </div>
    </div>
  );
}
