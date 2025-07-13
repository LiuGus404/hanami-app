import React from 'react';

interface CuteCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  status?: 'success' | 'progress' | 'goal';
  right?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

const statusColor = {
  success: 'text-green-600',
  progress: 'text-orange-500',
  goal: 'text-hanami-accent',
};

export default function CuteCard({ icon, title, subtitle, status, right, onClick, className = '' }: CuteCardProps) {
  return (
    <div
      className={`flex items-center rounded-2xl bg-white shadow-md px-4 py-3 mb-3 transition hover:shadow-lg cursor-pointer ${className}`}
      onClick={onClick}
    >
      <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#FFF9F2] mr-4 text-2xl">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-hanami-text text-base truncate">{title}</div>
        {subtitle && <div className="text-sm text-hanami-text-secondary truncate">{subtitle}</div>}
      </div>
      {status && (
        <div className={`ml-2 font-bold ${statusColor[status]}`}>{status === 'success' ? '✔' : status === 'progress' ? '→' : '!'}</div>
      )}
      {right && <div className="ml-2">{right}</div>}
    </div>
  );
} 