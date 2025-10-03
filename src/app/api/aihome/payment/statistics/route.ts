import { NextRequest, NextResponse } from 'next/server';
import { getSaasSupabaseClient } from '@/lib/supabase';

// 獲取支付統計數據
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const groupBy = searchParams.get('group_by') || 'day'; // day, week, month

    const supabase = getSaasSupabaseClient();

    // 基礎統計查詢
    let baseQuery = supabase
      .from('payment_records')
      .select('*');

    // 添加日期篩選
    if (startDate) {
      baseQuery = baseQuery.gte('created_at', startDate);
    }
    if (endDate) {
      baseQuery = baseQuery.lte('created_at', endDate);
    }

    const { data: allRecords, error: recordsError } = await baseQuery;

    if (recordsError) {
      console.error('獲取付款記錄錯誤:', recordsError);
      return NextResponse.json(
        { success: false, error: '獲取統計數據失敗' },
        { status: 500 }
      );
    }

    // 計算基礎統計
    const totalPayments = allRecords?.length || 0;
    const totalAmount = (allRecords as any)?.reduce((sum: number, record: any) => sum + (record.amount || 0), 0) || 0;
    const successfulPayments = (allRecords as any)?.filter((record: any) => record.status === 'completed').length || 0;
    const failedPayments = (allRecords as any)?.filter((record: any) => record.status === 'failed').length || 0;
    const pendingPayments = (allRecords as any)?.filter((record: any) => ['pending', 'processing'].includes(record.status)).length || 0;

    // 按付款方式統計
    const paymentMethodStats = (allRecords as any)?.reduce((acc: any, record: any) => {
      const method = record.payment_method || 'unknown';
      if (!acc[method]) {
        acc[method] = {
          count: 0,
          totalAmount: 0,
          successful: 0,
          failed: 0,
          pending: 0
        };
      }
      acc[method].count++;
      acc[method].totalAmount += record.amount || 0;
      if (record.status === 'completed') acc[method].successful++;
      else if (record.status === 'failed') acc[method].failed++;
      else acc[method].pending++;
      return acc;
    }, {} as Record<string, any>) || {};

    // 按狀態統計
    const statusStats = (allRecords as any)?.reduce((acc: any, record: any) => {
      const status = record.status || 'unknown';
      if (!acc[status]) {
        acc[status] = {
          count: 0,
          totalAmount: 0
        };
      }
      acc[status].count++;
      acc[status].totalAmount += record.amount || 0;
      return acc;
    }, {} as Record<string, any>) || {};

    // 時間序列數據
    const timeSeriesData = generateTimeSeriesData(allRecords || [], groupBy, startDate, endDate);

    // 最近交易
    const recentTransactions = (allRecords as any)
      ?.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10) || [];

    // 成功率計算
    const successRate = totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0;
    const averageAmount = totalPayments > 0 ? totalAmount / totalPayments : 0;

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalPayments,
          totalAmount: Math.round(totalAmount * 100) / 100,
          successfulPayments,
          failedPayments,
          pendingPayments,
          successRate: Math.round(successRate * 100) / 100,
          averageAmount: Math.round(averageAmount * 100) / 100
        },
        paymentMethods: paymentMethodStats,
        statusBreakdown: statusStats,
        timeSeries: timeSeriesData,
        recentTransactions: recentTransactions.map((record: any) => ({
          id: record.id,
          payment_method: record.payment_method,
          amount: record.amount,
          currency: record.currency,
          status: record.status,
          created_at: record.created_at,
          description: record.description
        }))
      }
    });

  } catch (error) {
    console.error('支付統計 API 錯誤:', error);
    return NextResponse.json(
      { success: false, error: '服務器錯誤' },
      { status: 500 }
    );
  }
}

// 生成時間序列數據
function generateTimeSeriesData(
  records: any[], 
  groupBy: string, 
  startDate?: string | null, 
  endDate?: string | null
) {
  const data: Record<string, any> = {};

  records.forEach(record => {
    const date = new Date(record.created_at);
    let key: string;

    switch (groupBy) {
      case 'week': {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      }
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      default: // day
        key = date.toISOString().split('T')[0];
    }

    if (!data[key]) {
      data[key] = {
        date: key,
        count: 0,
        totalAmount: 0,
        successful: 0,
        failed: 0,
        pending: 0
      };
    }

    data[key].count++;
    data[key].totalAmount += record.amount || 0;
    if (record.status === 'completed') data[key].successful++;
    else if (record.status === 'failed') data[key].failed++;
    else data[key].pending++;
  });

  // 轉換為陣列並排序
  return Object.values(data).sort((a: any, b: any) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

