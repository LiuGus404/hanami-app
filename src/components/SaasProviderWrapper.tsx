'use client';

import { SaasAuthProvider } from '@/hooks/saas/useSaasAuthSimple';

export default function SaasProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SaasAuthProvider>
      {children}
    </SaasAuthProvider>
  );
}
