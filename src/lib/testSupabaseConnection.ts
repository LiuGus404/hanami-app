import { createSaasClient } from './supabase-saas';

export async function testSupabaseConnection(threadId: string) {
  console.log('🧪 [測試] 開始測試 Supabase 連接...');
  
  try {
    const supabase = createSaasClient();
    console.log('🧪 [測試] Supabase 客戶端已創建');
    
    // 測試 1: 簡單的計數查詢
    console.log('🧪 [測試] 測試 1: 計數查詢...');
    console.log('🧪 [測試] 查詢參數:', { threadId });
    
    const countPromise = supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('thread_id', threadId);
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('計數查詢超時')), 2000);
    });
    
    const { count, error: countError } = await Promise.race([countPromise, timeoutPromise]) as any;
    
    if (countError) {
      console.error('❌ [測試] 計數查詢失敗:', countError);
      return false;
    }
    
    console.log('✅ [測試] 計數查詢成功:', count);
    
    // 測試 2: 簡單的選擇查詢
    console.log('🧪 [測試] 測試 2: 選擇查詢...');
    const { data, error } = await supabase
      .from('chat_messages')
      .select('id, content, created_at')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('❌ [測試] 選擇查詢失敗:', error);
      return false;
    }
    
    console.log('✅ [測試] 選擇查詢成功:', data?.length, '條記錄');
    
    return true;
    
  } catch (error) {
    console.error('❌ [測試] Supabase 連接測試失敗:', error);
    return false;
  }
}
