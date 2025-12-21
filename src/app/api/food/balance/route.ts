import { NextRequest, NextResponse } from 'next/server';
import { createSaasAdminClient } from '@/lib/supabase-saas';

const INITIAL_BALANCE = 100; // Free plan initial balance

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: '缺少 userId 參數' },
        { status: 400 }
      );
    }

    const supabase = createSaasAdminClient();

    // 1. Try to get existing balance
    const { data: balance, error: fetchError } = await supabase
      .from('user_food_balance')
      .select('*')
      .eq('user_id', userId)
      .single();

    // PGRST116 = no rows found
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ [Food API] 獲取餘額失敗:', fetchError);
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      );
    }

    // 2. If no record exists, create one
    if (!balance) {
      console.log('🍎 [Food API] 用戶無餘額記錄，創建新記錄:', userId);
      
      const { data: newBalance, error: createError } = await supabase
        .from('user_food_balance')
        .insert({
          user_id: userId,
          current_balance: INITIAL_BALANCE,
          total_earned: INITIAL_BALANCE,
          total_spent: 0,
          monthly_allowance: INITIAL_BALANCE,
          daily_usage: 0,
          weekly_usage: 0,
          monthly_usage: 0
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ [Food API] 創建餘額記錄失敗:', createError);
        return NextResponse.json(
          { success: false, error: createError.message },
          { status: 500 }
        );
      }

      // Also create initial transaction record
      await supabase
        .from('food_transactions')
        .insert({
          user_id: userId,
          transaction_type: 'initial_grant',
          amount: INITIAL_BALANCE,
          balance_after: INITIAL_BALANCE,
          description: '新用戶初始食量'
        });

      console.log('✅ [Food API] 已為用戶創建初始餘額:', INITIAL_BALANCE);
      
      return NextResponse.json({ 
        success: true, 
        data: newBalance,
        isNew: true 
      });
    }

    return NextResponse.json({ success: true, data: balance });

  } catch (error: any) {
    console.error('❌ [Food API] 異常:', error);
    return NextResponse.json(
      { success: false, error: error.message || '內部伺服器錯誤' },
      { status: 500 }
    );
  }
}

// POST for manual balance operations (admin only)
export async function POST(request: NextRequest) {
  try {
    const { userId, amount, reason, type = 'adjustment' } = await request.json();

    if (!userId || amount === undefined) {
      return NextResponse.json(
        { success: false, error: '缺少必要參數' },
        { status: 400 }
      );
    }

    const supabase = createSaasAdminClient();

    // Get current balance
    const { data: currentData, error: fetchError } = await supabase
      .from('user_food_balance')
      .select('current_balance')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { success: false, error: '無法獲取當前餘額' },
        { status: 500 }
      );
    }

    const currentBalance = currentData?.current_balance || 0;
    const newBalance = currentBalance + amount;

    // Update balance
    const { error: updateError } = await supabase
      .from('user_food_balance')
      .update({
        current_balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    // Record transaction
    await supabase
      .from('food_transactions')
      .insert({
        user_id: userId,
        transaction_type: type,
        amount: amount,
        balance_after: newBalance,
        description: reason || `Manual ${type}`
      });

    return NextResponse.json({ 
      success: true, 
      data: { 
        previous_balance: currentBalance,
        amount_changed: amount,
        new_balance: newBalance 
      } 
    });

  } catch (error: any) {
    console.error('❌ [Food API] POST 異常:', error);
    return NextResponse.json(
      { success: false, error: error.message || '內部伺服器錯誤' },
      { status: 500 }
    );
  }
}
















