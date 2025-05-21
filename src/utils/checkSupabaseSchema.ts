import { getSupabaseClient } from '@/lib/supabase'

export const checkSupabaseSchema = async (table: string) => {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from(table as any)
    .select('*')
    .limit(1)

  if (error) {
    console.error(`Error checking schema for table ${table}:`, error)
    return false
  }

  return true
}