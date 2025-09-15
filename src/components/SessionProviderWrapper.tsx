'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Session } from '@supabase/auth-helpers-nextjs';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { useState } from 'react';

import { Database } from '@/lib/database.types';

// 創建一個單例的 Supabase 客戶端
let supabaseClientSingleton: ReturnType<typeof createClientComponentClient<Database>> | null = null;

const getSupabaseClient = () => {
  if (!supabaseClientSingleton) {
    supabaseClientSingleton = createClientComponentClient<Database>();
  }
  return supabaseClientSingleton;
};

export default function SessionProviderWrapper({
  children,
  initialSession,
}: {
  children: React.ReactNode;
  initialSession: Session | any | null;
}) {
  // 檢查是否在 aihome 路由中，如果是則不創建 Supabase 客戶端
  const isAIHomeRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/aihome');
  
  const [supabaseClient] = useState(() => {
    if (isAIHomeRoute) {
      return null; // 在 aihome 路由中不創建客戶端
    }
    return getSupabaseClient();
  });

  // 如果 initialSession 是自定義會話，轉換為 Supabase Session 格式
  const supabaseSession = initialSession && typeof initialSession === 'object' && 'id' in initialSession
    ? {
      access_token: '',
      refresh_token: '',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: 'bearer',
      user: {
        id: initialSession.id,
        email: initialSession.email || '',
        user_metadata: {
          role: initialSession.role,
        },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      },
    } as Session
    : initialSession;

  // 如果在 aihome 路由中，直接返回 children，不包裝 SessionContextProvider
  if (isAIHomeRoute || !supabaseClient) {
    return <>{children}</>;
  }

  return (
    <SessionContextProvider
      initialSession={supabaseSession}
      supabaseClient={supabaseClient}
    >
      {children}
    </SessionContextProvider>
  );
}