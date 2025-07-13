import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

import { Database } from '@/lib/database.types';

let supabaseClientSingleton: ReturnType<typeof createClientComponentClient<Database>> | null = null;

export const getSupabaseClient = () => {
  if (!supabaseClientSingleton) {
    supabaseClientSingleton = createClientComponentClient<Database>();
  }
  return supabaseClientSingleton;
};

export const supabase = getSupabaseClient();