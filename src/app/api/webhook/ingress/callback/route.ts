import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_SAAS_URL!;
const supabaseServiceKey = process.env.SUPABASE_SAAS_SERVICE_ROLE_KEY!;
const ingressSecret = process.env.INGRESS_SECRET || 'your-secret-key';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// n8n 回調請求介面
interface N8nCallbackRequest {
  message_id: string;
  thread_id: string;
  status: 'processing' | 'completed' | 'error';
  result?: {
    content: string;
    agent_id?: string;
    message_type?: string;
    processing_time_ms?: number;
    token_usage?: {
      input_tokens: number;
      output_tokens: number;
      total_tokens: number;
    };
    model_info?: {
      provider: string;
      model_name: string;
    };
    cost_info?: {
      input_cost_usd: number;
      output_cost_usd: number;
      total_cost_usd: number;
    };
  };
  error_message?: string;
}

// 簽名驗證函數
function verifySignature(payload: string, signature: string, secret: string): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('簽名驗證錯誤:', error);
    return false;
  }
}

// 更新訊息狀態
async function updateMessageStatus(
  messageId: string,
  status: string,
  content?: string,
  agentId?: string,
  messageType?: string,
  processingTime?: number,
  errorMessage?: string
): Promise<void> {
  try {
    const updateData: any = {
      status: status,
      updated_at: new Date().toISOString()
    };

    if (content) {
      updateData.content = content;
    }

    if (agentId) {
      updateData.agent_id = agentId;
    }

    if (messageType) {
      updateData.message_type = messageType;
    }

    if (processingTime) {
      updateData.processing_time_ms = processingTime;
    }

    if (errorMessage) {
      updateData.error_message = errorMessage;
    }

    const { error } = await supabase
      .from('chat_messages')
      .update(updateData)
      .eq('id', messageId);

    if (error) {
      console.error('更新訊息狀態錯誤:', error);
      throw error;
    }

    console.log('成功更新訊息狀態:', messageId, status);
  } catch (error) {
    console.error('更新訊息狀態異常:', error);
    throw error;
  }
}

// 記錄訊息成本
async function recordMessageCost(
  messageId: string,
  threadId: string,
  userId: string,
  tokenUsage: any,
  modelInfo: any,
  costInfo: any
): Promise<void> {
  try {
    // 1. 獲取用戶計劃
    const { data: user } = await supabase
      .from('saas_users')
      .select('subscription_plan_id')
      .eq('id', userId)
      .single();

    const isFreePlan = !user?.subscription_plan_id || !['basic', 'pro'].includes(user?.subscription_plan_id);

    // 2. 計算食量成本
    let foodAmount = 0;
    const foodCostUsd = costInfo.total_cost_usd * 3.0;

    if (isFreePlan) {
      // Free user: fixed 3 credits per use
      foodAmount = 3;
    } else {
      // Standard calculation
      foodAmount = Math.ceil(foodCostUsd * 100);
    }

    // 3. 記錄詳細成本 (Message Costs)
    const { error } = await supabase
      .from('message_costs')
      .insert({
        message_id: messageId,
        thread_id: threadId,
        user_id: userId,
        input_tokens: tokenUsage.input_tokens,
        output_tokens: tokenUsage.output_tokens,
        total_tokens: tokenUsage.total_tokens,
        model_provider: modelInfo.provider,
        model_name: modelInfo.model_name,
        input_cost_usd: costInfo.input_cost_usd,
        output_cost_usd: costInfo.output_cost_usd,
        total_cost_usd: costInfo.total_cost_usd,
        food_cost_usd: foodCostUsd,
        food_amount: foodAmount
      });

    if (error) {
      console.error('記錄訊息成本錯誤:', error);
      // Don't throw here, prioritize deduction
    }

    // 4. 使用 RPC 扣除食量 (Credit Ledger System)
    // 這會自動更新餘額並記錄交易
    const { error: deductionError } = await supabase.rpc('deduct_user_food', {
      p_user_id: userId,
      p_amount: foodAmount,
      p_reason: 'AI 對話消耗', // Description
      p_ai_message_id: messageId,
      p_ai_room_id: null // Optional
    });

    if (deductionError) {
      console.error('扣除食量失敗:', deductionError);
      throw deductionError;
    }

    console.log('成功記錄訊息成本:', messageId, '食量消耗:', foodAmount);
  } catch (error) {
    console.error('記錄訊息成本異常:', error);
    throw error;
  }
}



export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. 獲取請求體
    const body = await request.text();
    const signature = request.headers.get('X-Signature') || '';

    // 2. 驗證簽名
    if (!verifySignature(body, signature, ingressSecret)) {
      console.error('簽名驗證失敗');
      return NextResponse.json({
        success: false,
        error: '簽名驗證失敗'
      }, { status: 401 });
    }

    // 3. 解析請求
    const callbackRequest: N8nCallbackRequest = JSON.parse(body);
    const { message_id, thread_id, status, result, error_message } = callbackRequest;

    // 4. 基本驗證
    if (!message_id || !thread_id || !status) {
      return NextResponse.json({
        success: false,
        error: '缺少必要參數'
      }, { status: 400 });
    }

    // 5. 獲取用戶 ID
    const { data: threadData, error: threadError } = await supabase
      .from('chat_threads')
      .select('user_id')
      .eq('id', thread_id)
      .single();

    if (threadError || !threadData) {
      return NextResponse.json({
        success: false,
        error: '找不到對應的聊天線程'
      }, { status: 404 });
    }

    const userId = threadData.user_id;

    // 6. 根據狀態處理
    if (status === 'processing') {
      // 更新為處理中狀態
      await updateMessageStatus(message_id, 'processing');

    } else if (status === 'completed' && result) {
      // 處理完成，創建 AI 回應訊息
      const aiMessageId = await createAIMessage(
        thread_id,
        result.content,
        result.agent_id,
        result.message_type,
        result.processing_time_ms
      );

      // 更新原始訊息狀態
      await updateMessageStatus(message_id, 'completed');

      // 記錄成本信息
      if (result.token_usage && result.model_info && result.cost_info) {
        await recordMessageCost(
          aiMessageId,
          thread_id,
          userId,
          result.token_usage,
          result.model_info,
          result.cost_info
        );
      }

    } else if (status === 'error') {
      // 處理錯誤
      await updateMessageStatus(
        message_id,
        'error',
        undefined,
        undefined,
        undefined,
        undefined,
        error_message
      );
    }

    // 7. 返回成功響應
    return NextResponse.json({
      success: true,
      message_id: message_id,
      status: status
    });

  } catch (error) {
    console.error('回調處理錯誤:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}

// 創建 AI 回應訊息
async function createAIMessage(
  threadId: string,
  content: string,
  agentId?: string,
  messageType?: string,
  processingTime?: number
): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        thread_id: threadId,
        role: 'assistant',
        message_type: messageType || 'final',
        agent_id: agentId,
        content: content,
        client_msg_id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'completed',
        processing_time_ms: processingTime,
        turn_no: 1
      })
      .select('id')
      .single();

    if (error) {
      console.error('創建 AI 訊息錯誤:', error);
      throw error;
    }

    return data.id;
  } catch (error) {
    console.error('創建 AI 訊息異常:', error);
    throw error;
  }
}
