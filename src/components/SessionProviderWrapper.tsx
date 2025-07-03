"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import type { Session } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/lib/database.types";

// 創建一個單例的 Supabase 客戶端
let supabaseClientSingleton: ReturnType<typeof createClientComponentClient<Database>> | null = null;

const getSupabaseClient = () => {
  if (!supabaseClientSingleton) {
    supabaseClientSingleton = createClientComponentClient<Database>({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    });
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
  const [supabaseClient] = useState(() => getSupabaseClient());

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
            role: initialSession.role
          },
          app_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString()
        }
      } as Session
    : initialSession;

  return (
    <SessionContextProvider
      supabaseClient={supabaseClient}
      initialSession={supabaseSession}
    >
      {children}
    </SessionContextProvider>
  );
}