'use client';

import { SaasAuthProvider } from '@/hooks/saas/useSaasAuthSimple';
import { Toaster } from 'react-hot-toast';

export default function AIHomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SaasAuthProvider>
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A]">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#FFFDF8',
              color: '#4B4036',
              border: '1px solid #EADBC8',
            },
          }}
        />
      </div>
    </SaasAuthProvider>
  );
}
