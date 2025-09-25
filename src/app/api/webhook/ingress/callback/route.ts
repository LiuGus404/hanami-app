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
    // 計算食量成本 (3倍定價)
    const foodCostUsd = costInfo.total_cost_usd * 3.0;
    const foodAmount = Math.ceil(foodCostUsd * 100); // 轉換為食量單位

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
      throw error;
    }

    // 更新用戶食量餘額
    await updateUserFoodBalance(userId, -foodAmount);

    // 記錄食量交易
    await recordFoodTransaction(userId, 'spend', -foodAmount, messageId, threadId, 'AI 對話消耗');

    console.log('成功記錄訊息成本:', messageId, '食量消耗:', foodAmount);
  } catch (error) {
    console.error('記錄訊息成本異常:', error);
    throw error;
  }
}

// 更新用戶食量餘額
async function updateUserFoodBalance(userId: string, amount: number): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_food_balance')
      .upsert({
        user_id: userId,
        current_balance: amount, // 這裡應該是增量更新，實際應該用 SQL 的增量操作
        total_spent: Math.abs(amount), // 如果是負數，表示消耗
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('更新用戶食量餘額錯誤:', error);
      throw error;
    }
  } catch (error) {
    console.error('更新用戶食量餘額異常:', error);
    throw error;
  }
}

// 記錄食量交易
async function recordFoodTransaction(
  userId: string,
  transactionType: string,
  amount: number,
  messageId?: string,
  threadId?: string,
  description?: string
): Promise<void> {
  try {
    // 獲取當前餘額
    const { data: balanceData } = await supabase
      .from('user_food_balance')
      .select('current_balance')
      .eq('user_id', userId)
      .single();

    const currentBalance = balanceData?.current_balance || 0;
    const balanceAfter = currentBalance + amount;

    const { error } = await supabase
      .from('food_transactions')
      .insert({
        user_id: userId,
        transaction_type: transactionType,
        amount: amount,
        balance_after: balanceAfter,
        message_id: messageId,
        thread_id: threadId,
        description: description
      });

    if (error) {
      console.error('記錄食量交易錯誤:', error);
      throw error;
    }
  } catch (error) {
    console.error('記錄食量交易異常:', error);
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
