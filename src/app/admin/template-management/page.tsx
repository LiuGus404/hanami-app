'use client';

import { TemplateManagement } from '@/components/admin/TemplateManagement';

export default function TemplateManagementPage() {
  return (
    <div className="container mx-auto p-6">
      <TemplateManagement onBack={() => window.history.back()} />
    </div>
  );
} 