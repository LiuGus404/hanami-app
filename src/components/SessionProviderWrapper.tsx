"use client";

import { useState, useEffect } from "react";
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
  initialSession: Session | null;
}) {
  const [supabaseClient] = useState(() => getSupabaseClient());

  useEffect(() => {
    console.log("[SessionProviderWrapper] Supabase client initialized");
    console.log("[SessionProviderWrapper] Initial session:", initialSession);
  }, [initialSession]);

  return (
    <SessionContextProvider
      supabaseClient={supabaseClient}
      initialSession={initialSession}
    >
      {children}
    </SessionContextProvider>
  );
}