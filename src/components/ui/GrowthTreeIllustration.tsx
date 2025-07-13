import React from 'react';

interface GrowthTreeIllustrationProps {
  apples?: number;
  oranges?: number;
  showStar?: boolean;
  className?: string;
}

export default function GrowthTreeIllustration({ apples = 1, oranges = 1, showStar = true, className = '' }: GrowthTreeIllustrationProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 240 200" xmlns="http://www.w3.org/2000/svg">
      {/* 樹幹 */}
      <rect fill="#A67C52" height="50" rx="8" width="20" x="110" y="120" />
      {/* 樹冠 */}
      <ellipse cx="120" cy="100" fill="#7BC47F" rx="80" ry="60" />
      <ellipse cx="70" cy="90" fill="#5FA463" rx="30" ry="25" />
      <ellipse cx="170" cy="90" fill="#5FA463" rx="30" ry="25" />
      {/* 星星 */}
      {showStar && (
        <polygon fill="#FFD93B" points="120,55 126,75 147,75 130,87 136,107 120,95 104,107 110,87 93,75 114,75" stroke="#F7C948" strokeWidth="2" />
      )}
      {/* 蘋果 */}
      {apples > 0 && (
        <circle cx="80" cy="110" fill="#FF6B6B" r="13" stroke="#B84040" strokeWidth="2" />
      )}
      {apples > 1 && (
        <circle cx="100" cy="80" fill="#FF6B6B" r="11" stroke="#B84040" strokeWidth="2" />
      )}
      {/* 橘子 */}
      {oranges > 0 && (
        <circle cx="160" cy="110" fill="#FFA94D" r="13" stroke="#C97A2B" strokeWidth="2" />
      )}
      {oranges > 1 && (
        <circle cx="140" cy="80" fill="#FFA94D" r="11" stroke="#C97A2B" strokeWidth="2" />
      )}
    </svg>
  );
} 