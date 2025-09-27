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

    // 查詢 incoming_messages 表（接收到的訊息）
    // 查找 session_id 中包含電話號碼的記錄
    const { data: incomingMessages, error: incomingError } = await supabase
      .from('incoming_messages')
      .select('timestamp')
      .like('session_id', `%${phone}%`)
      .order('timestamp', { ascending: false })
      .limit(1);

    if (incomingError) {
      console.error('查詢 incoming_messages 錯誤:', incomingError);
    }

    // 查詢 outgoing_messages 表（發送的訊息）
    // 查找 session_id 中包含電話號碼的記錄
    const { data: outgoingMessages, error: outgoingError } = await supabase
      .from('outgoing_messages')
      .select('sent_at')
      .like('session_id', `%${phone}%`)
      .order('sent_at', { ascending: false })
      .limit(1);

    if (outgoingError) {
      console.error('查詢 outgoing_messages 錯誤:', outgoingError);
    }

    // 比較兩個時間，取最新的
    let lastContactTime: Date | null = null;
    
    console.log(`查詢電話號碼 ${phone} 的聯繫記錄:`);
    console.log('incoming_messages 結果:', incomingMessages);
    console.log('outgoing_messages 結果:', outgoingMessages);
    
    if (incomingMessages && incomingMessages.length > 0) {
      const incomingTime = new Date(incomingMessages[0].timestamp);
      console.log('最新的 incoming 時間:', incomingTime);
      if (!lastContactTime || incomingTime > (lastContactTime as Date)) {
        lastContactTime = incomingTime;
      }
    }

    if (outgoingMessages && outgoingMessages.length > 0) {
      const outgoingTime = new Date(outgoingMessages[0].sent_at);
      console.log('最新的 outgoing 時間:', outgoingTime);
      if (!lastContactTime || outgoingTime > (lastContactTime as Date)) {
        lastContactTime = outgoingTime;
      }
    }

    // 計算天數
    let daysSinceContact = null;
    if (lastContactTime) {
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - lastContactTime.getTime());
      daysSinceContact = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }

    console.log('最終結果:', {
      phone,
      lastContactTime: lastContactTime?.toISOString() || null,
      daysSinceContact,
      hasContact: lastContactTime !== null
    });

    return NextResponse.json({
      phone,
      lastContactTime: lastContactTime?.toISOString() || null,
      daysSinceContact,
      hasContact: lastContactTime !== null
    });

  } catch (error) {
    console.error('計算聯繫天數錯誤:', error);
    return NextResponse.json(
      { error: '計算聯繫天數時發生錯誤' },
      { status: 500 }
    );
  }
}
