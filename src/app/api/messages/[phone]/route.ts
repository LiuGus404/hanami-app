import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(
  request: NextRequest,
  { params }: { params: { phone: string } }
) {
  try {
    const phone = decodeURIComponent(params.phone);
    if (!phone) {
      return NextResponse.json({ error: '電話號碼是必需的' }, { status: 400 });
    }

    // 電話號碼格式可能是 90399475，但 session_id 格式是 85290399475@c.us
    const phoneWithCountryCode = phone.startsWith('852') ? phone : `852${phone}`;
    
    console.log(`查詢電話號碼 ${phone} (完整格式: ${phoneWithCountryCode}) 的對話記錄`);
    
    // 查詢 incoming_messages
    const { data: incomingMessages, error: incomingError } = await supabase
      .from('incoming_messages')
      .select('*')
      .like('session_id', `%${phoneWithCountryCode}%`)
      .order('timestamp', { ascending: true });

    console.log('incoming_messages 查詢結果:', incomingMessages?.length || 0, '條記錄');
    if (incomingError) {
      console.error('查詢 incoming_messages 錯誤:', incomingError);
    }

    // 查詢 outgoing_messages
    const { data: outgoingMessages, error: outgoingError } = await supabase
      .from('outgoing_messages')
      .select('*')
      .like('session_id', `%${phoneWithCountryCode}%`)
      .order('sent_at', { ascending: true });

    console.log('outgoing_messages 查詢結果:', outgoingMessages?.length || 0, '條記錄');
    if (outgoingError) {
      console.error('查詢 outgoing_messages 錯誤:', outgoingError);
    }

    // 合併和處理消息
    const allMessages = [];
    
    // 處理 incoming_messages
    if (incomingMessages) {
      for (const msg of incomingMessages) {
        allMessages.push({
          id: `in_${msg.id}`,
          content: msg.message || '', // 使用正確的欄位名 message
          sender: 'parent', // 家長發送的訊息
          timestamp: msg.timestamp,
          type: msg.source_channel || 'text',
          direction: 'incoming'
        });
      }
    }

    // 處理 outgoing_messages
    if (outgoingMessages) {
      for (const msg of outgoingMessages) {
        allMessages.push({
          id: `out_${msg.id}`,
          content: msg.reply_text || '', // 使用正確的欄位名 reply_text
          sender: 'user', // 我們發送的訊息
          timestamp: msg.sent_at,
          type: msg.source || 'text',
          direction: 'outgoing'
        });
      }
    }

    // 按時間排序
    allMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    console.log(`找到 ${allMessages.length} 條對話記錄`);

    return NextResponse.json({
      phone,
      messages: allMessages,
      totalCount: allMessages.length
    });

  } catch (error) {
    console.error('查詢對話記錄錯誤:', error);
    return NextResponse.json(
      { error: '查詢對話記錄時發生錯誤' },
      { status: 500 }
    );
  }
}
