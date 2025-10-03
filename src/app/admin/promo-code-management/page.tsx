import React from 'react';
import PromoCodeManager from '@/components/admin/PromoCodeManager';

export default function PromoCodeManagementPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] to-[#FFD59A]/10 p-6">
      <div className="max-w-7xl mx-auto">
        <PromoCodeManager />
      </div>
    </div>
  );
}
