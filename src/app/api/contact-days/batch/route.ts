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

    // 批量查詢所有電話號碼的聯繫記錄
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
      .select('session_id, timestamp')
      .or(phoneConditions)
      .order('timestamp', { ascending: false });

    console.log('incoming_messages 查詢結果:', incomingMessages?.length || 0, '條記錄');

    if (incomingError) {
      console.error('查詢 incoming_messages 錯誤:', incomingError);
    }

    // 查詢 outgoing_messages
    const { data: outgoingMessages, error: outgoingError } = await supabase
      .from('outgoing_messages')
      .select('session_id, sent_at')
      .or(phoneConditions)
      .order('sent_at', { ascending: false });

    console.log('outgoing_messages 查詢結果:', outgoingMessages?.length || 0, '條記錄');

    if (outgoingError) {
      console.error('查詢 outgoing_messages 錯誤:', outgoingError);
    }

    // 處理結果
    for (const phone of phoneNumbers) {
      const phoneWithCountryCode = phone.startsWith('852') ? phone : `852${phone}`;
      
      // 找到該電話號碼的最新記錄
      const incomingRecord = incomingMessages?.find(msg => 
        msg.session_id.includes(phoneWithCountryCode)
      );
      
      const outgoingRecord = outgoingMessages?.find(msg => 
        msg.session_id.includes(phoneWithCountryCode)
      );

      // 調試信息 - 只顯示前幾個電話號碼
      if (phoneNumbers.indexOf(phone) < 3) {
        console.log(`處理電話號碼 ${phone} (完整: ${phoneWithCountryCode}):`);
        console.log('  incomingRecord:', incomingRecord ? '找到' : '未找到');
        console.log('  outgoingRecord:', outgoingRecord ? '找到' : '未找到');
        if (incomingRecord) {
          console.log('  incoming timestamp:', incomingRecord.timestamp);
        }
        if (outgoingRecord) {
          console.log('  outgoing sent_at:', outgoingRecord.sent_at);
        }
      }

      let lastContactTime: Date | null = null;
      
      if (incomingRecord) {
        const incomingTime = new Date(incomingRecord.timestamp);
        if (!lastContactTime || incomingTime > lastContactTime) {
          lastContactTime = incomingTime;
        }
      }

      if (outgoingRecord) {
        const outgoingTime = new Date(outgoingRecord.sent_at);
        if (!lastContactTime || outgoingTime > lastContactTime) {
          lastContactTime = outgoingTime;
        }
      }

      let daysSinceContact = null;
      if (lastContactTime) {
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - lastContactTime.getTime());
        daysSinceContact = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      }

      results[phone] = {
        phone,
        lastContactTime: lastContactTime?.toISOString() || null,
        daysSinceContact,
        hasContact: lastContactTime !== null
      };
    }

    console.log(`批量查詢完成，處理了 ${phoneNumbers.length} 個電話號碼`);

    return NextResponse.json(results);

  } catch (error) {
    console.error('批量計算聯繫天數錯誤:', error);
    return NextResponse.json(
      { error: '批量計算聯繫天數時發生錯誤' },
      { status: 500 }
    );
  }
}
