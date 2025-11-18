'use client';

import { SaasAuthProvider } from '@/hooks/saas/useSaasAuthSimple';
import { Toaster } from 'react-hot-toast';
import MobileBottomNavigation from '@/components/ui/MobileBottomNavigation';
import { OrganizationProvider } from '@/contexts/OrganizationContext';

export default function AIHomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SaasAuthProvider>
      <OrganizationProvider>
        <div className="min-h-screen bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF8] to-[#FFD59A]">
          {children}
          
          {/* 響應式底部導航 - 只在手機/平板/窄螢幕時顯示 */}
          <MobileBottomNavigation />
          
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#FFFDF8',
                color: '#4B4036',
                border: '1px solid #EADBC8',
              },
              iconTheme: {
                primary: '#4B4036',
                secondary: '#FFFDF8',
              },
            }}
          />
        </div>
      </OrganizationProvider>
    </SaasAuthProvider>
  );
}
