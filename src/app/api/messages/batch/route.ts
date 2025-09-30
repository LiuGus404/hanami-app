import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const { phoneNumbers } = await request.json();
    
    if (!phoneNumbers || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
      return NextResponse.json({ error: '電話號碼列表是必需的' }, { status: 400 });
    }

    console.log(`批量查詢對話記錄，電話號碼數量: ${phoneNumbers.length}`);
    
    // 批量查詢所有電話號碼的對話記錄
    const results: Record<string, any> = {};
    
    // 為每個電話號碼構建查詢條件
    const phoneConditions = phoneNumbers.map(phone => {
      const phoneWithCountryCode = phone.startsWith('852') ? phone : `852${phone}`;
      return `session_id.ilike.%${phoneWithCountryCode}%`;
    }).join(',');

    console.log('批量查詢條件:', phoneConditions);

    // 查詢 incoming_messages
    const { data: incomingMessages, error: incomingError } = await supabase
      .from('incoming_messages')
      .select('session_id, timestamp, message')
      .or(phoneConditions)
      .order('timestamp', { ascending: true });

    console.log('incoming_messages 查詢結果:', incomingMessages?.length || 0, '條記錄');

    if (incomingError) {
      console.error('查詢 incoming_messages 錯誤:', incomingError);
    }

    // 查詢 outgoing_messages
    const { data: outgoingMessages, error: outgoingError } = await supabase
      .from('outgoing_messages')
      .select('session_id, sent_at, reply_text')
      .or(phoneConditions)
      .order('sent_at', { ascending: true });

    console.log('outgoing_messages 查詢結果:', outgoingMessages?.length || 0, '條記錄');

    if (outgoingError) {
      console.error('查詢 outgoing_messages 錯誤:', outgoingError);
    }

    // 處理結果
    for (const phone of phoneNumbers) {
      const phoneWithCountryCode = phone.startsWith('852') ? phone : `852${phone}`;
      
      // 找到該電話號碼的所有記錄
      const phoneIncomingMessages = incomingMessages?.filter(msg => 
        msg.session_id.includes(phoneWithCountryCode)
      ) || [];
      
      const phoneOutgoingMessages = outgoingMessages?.filter(msg => 
        msg.session_id.includes(phoneWithCountryCode)
      ) || [];

      // 合併和處理消息
      const allMessages = [];
      
      // 處理 incoming_messages
      for (const msg of phoneIncomingMessages) {
        allMessages.push({
          id: `in_${msg.session_id}_${msg.timestamp}`,
          content: msg.message || '',
          sender: 'parent',
          timestamp: msg.timestamp,
          type: 'text',
          direction: 'incoming'
        });
      }

      // 處理 outgoing_messages
      for (const msg of phoneOutgoingMessages) {
        allMessages.push({
          id: `out_${msg.session_id}_${msg.sent_at}`,
          content: msg.reply_text || '',
          sender: 'user',
          timestamp: msg.sent_at,
          type: 'text',
          direction: 'outgoing'
        });
      }

      // 按時間排序
      allMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      // 計算最近對話天數
      let daysSinceLastMessage = null;
      if (allMessages.length > 0) {
        const latestMessage = allMessages[allMessages.length - 1];
        const latestTime = new Date(latestMessage.timestamp);
        const today = new Date();
        const diffTime = today.getTime() - latestTime.getTime();
        daysSinceLastMessage = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      }

      results[phone] = {
        phone,
        messages: allMessages,
        totalCount: allMessages.length,
        daysSinceLastMessage,
        hasMessages: allMessages.length > 0
      };
    }

    console.log(`批量查詢完成，處理了 ${phoneNumbers.length} 個電話號碼`);

    return NextResponse.json(results);

  } catch (error) {
    console.error('批量查詢對話記錄錯誤:', error);
    return NextResponse.json(
      { error: '批量查詢對話記錄時發生錯誤' },
      { status: 500 }
    );
  }
}
