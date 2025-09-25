import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ingressClient } from '@/lib/ingress';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 兼容現有 aihome 系統的請求介面
interface AihomeSendMessageRequest {
  roomId: string;
  message: string;
  userId: string;
  roleHint?: string;
  messageType?: string;
}

// 兼容現有 aihome 系統的響應介面
interface AihomeSendMessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  foodCost?: number;
  remainingBalance?: number;
}

export async function POST(request: NextRequest): Promise<NextResponse<AihomeSendMessageResponse>> {
  try {
    const body: AihomeSendMessageRequest = await request.json();
    const { roomId, message, userId, roleHint = 'auto', messageType = 'user_request' } = body;

    // 基本驗證
    if (!roomId || !message || !userId) {
      return NextResponse.json({
        success: false,
        error: '缺少必要參數'
      }, { status: 400 });
    }

    // 檢查聊天線程是否存在
    const { data: threadData, error: threadError } = await supabase
      .from('chat_threads')
      .select('id, user_id')
      .eq('id', roomId)
      .single();

    if (threadError || !threadData) {
      return NextResponse.json({
        success: false,
        error: '找不到聊天線程'
      }, { status: 404 });
    }

    // 檢查用戶權限
    if (threadData.user_id !== userId) {
      return NextResponse.json({
        success: false,
        error: '沒有權限發送訊息到此聊天線程'
      }, { status: 403 });
    }

    // 檢查用戶食量餘額
    const { data: balanceData, error: balanceError } = await supabase
      .from('user_food_balance')
      .select('current_balance')
      .eq('user_id', userId)
      .single();

    if (balanceError && balanceError.code !== 'PGRST116') {
      return NextResponse.json({
        success: false,
        error: '無法檢查食量餘額'
      }, { status: 500 });
    }

    const currentBalance = balanceData?.current_balance || 0;
    const estimatedCost = 10; // 預估食量消耗

    if (currentBalance < estimatedCost) {
      return NextResponse.json({
        success: false,
        error: '食量餘額不足',
        remainingBalance: currentBalance
      }, { status: 402 });
    }

    // 使用新的 HanamiEcho 系統發送訊息
    const response = await ingressClient.sendMessage(
      roomId,
      message,
      {
        roleHint,
        messageType,
        priority: 'normal'
      }
    );

    if (response.success) {
      // 獲取更新後的食量餘額
      const { data: updatedBalance } = await supabase
        .from('user_food_balance')
        .select('current_balance')
        .eq('user_id', userId)
        .single();

      return NextResponse.json({
        success: true,
        messageId: response.message_id,
        foodCost: estimatedCost,
        remainingBalance: updatedBalance?.current_balance || currentBalance
      });
    } else {
      return NextResponse.json({
        success: false,
        error: response.error || '發送失敗'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('發送訊息錯誤:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}
