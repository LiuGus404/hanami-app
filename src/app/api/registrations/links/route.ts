import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// 生成隨機 token
function generateToken(): string {
  return randomBytes(32).toString('hex');
}

// GET: 獲取所有報名連結
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    
    // 只選擇需要的字段，提高查詢性能
    // 注意：expiry_hours 字段可能不存在（如果遷移未執行），先不包含它
    const selectFields = `
      id,
      token,
      link_type,
      org_id,
      form_data,
      status,
      created_by,
      created_at,
      expires_at,
      completed_at,
      pending_student_id,
      trial_student_id,
      notes
    `;
    
    // 並行執行：查詢連結和更新過期狀態（不等待更新完成）
    const [queryResult, updateResult] = await Promise.allSettled([
      // 查詢連結（主要操作）
      (async () => {
        let query = supabase
          .from('hanami_registration_links')
          .select(selectFields)
          .order('created_at', { ascending: false })
          .limit(1000); // 限制返回數量，避免過多數據
        
        if (orgId) {
          query = query.eq('org_id', orgId);
        }
        
        return await query;
      })(),
      // 更新過期狀態（後台操作，不阻塞查詢）
      (async () => {
        try {
          const { error } = await supabase.rpc('update_expired_registration_links');
          if (error) {
            console.warn('更新過期狀態失敗:', error);
          }
          return null;
        } catch (error) {
          // 如果更新失敗，不影響查詢結果
          console.warn('更新過期狀態異常:', error);
          return null;
        }
      })()
    ]);
    
    // 處理查詢結果
    if (queryResult.status === 'rejected') {
      throw queryResult.reason;
    }
    
    const { data, error } = queryResult.value;
    
    if (error) throw error;
    
    // 處理數據：如果 expiry_hours 字段不存在，根據 expires_at 和 created_at 計算
    const processedData = (data || []).map((link: any) => {
      if (!link.expiry_hours && link.expires_at && link.created_at) {
        const created = new Date(link.created_at);
        const expires = new Date(link.expires_at);
        const hours = Math.round((expires.getTime() - created.getTime()) / (1000 * 60 * 60));
        link.expiry_hours = hours > 0 ? hours : 24; // 如果計算失敗，預設24小時
      } else if (!link.expiry_hours) {
        link.expiry_hours = 24; // 預設值
      }
      return link;
    });
    
    return NextResponse.json({
      success: true,
      data: processedData,
      count: processedData.length
    });
    
  } catch (error: any) {
    console.error('❌ API: 查詢報名連結失敗:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '查詢失敗',
      data: [],
      count: 0
    }, { status: 500 });
  }
}

// POST: 創建新的報名連結
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      linkType, 
      orgId, 
      formData, 
      createdBy,
      expiresInHours,
      notes 
    } = body;
    
    if (!linkType || !formData) {
      return NextResponse.json({
        success: false,
        error: '缺少必要參數：linkType 和 formData'
      }, { status: 400 });
    }
    
    if (!['trial', 'regular'].includes(linkType)) {
      return NextResponse.json({
        success: false,
        error: 'linkType 必須是 trial 或 regular'
      }, { status: 400 });
    }
    
    console.log('🔍 API: 開始創建報名連結...', { linkType, orgId });
    
    // 生成唯一 token
    let token: string = '';
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (!isUnique && attempts < maxAttempts) {
      token = generateToken();
      const { data: existing } = await supabase
        .from('hanami_registration_links')
        .select('id')
        .eq('token', token)
        .single();
      
      if (!existing) {
        isUnique = true;
      } else {
        attempts++;
      }
    }
    
    if (!isUnique || !token) {
      throw new Error('無法生成唯一的 token');
    }
    
    // 計算過期時間（使用用戶設定的時限，預設24小時）
    const hours = expiresInHours && !isNaN(Number(expiresInHours)) && Number(expiresInHours) > 0 
      ? Number(expiresInHours) 
      : 24;
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    
    // 準備插入數據
    const insertData: any = {
      token: token!,
      link_type: linkType,
      org_id: orgId || null,
      form_data: formData,
      created_by: createdBy || null,
      notes: notes || null,
      status: 'active',
      expires_at: expiresAt
    };
    
    // 嘗試添加 expiry_hours（如果字段存在）
    // 如果字段不存在，會自動忽略或由觸發器處理
    try {
      insertData.expiry_hours = hours;
    } catch (e) {
      // 忽略，繼續不包含該字段
    }
    
    // 創建連結記錄
    let { data, error } = await supabase
      .from('hanami_registration_links')
      .insert([insertData])
      .select()
      .single();
    
    // 如果錯誤是因為 expiry_hours 字段不存在，重試不包含該字段
    if (error && (error.message?.includes('expiry_hours') || error.message?.includes('does not exist'))) {
      delete insertData.expiry_hours;
      const retryResult = await supabase
        .from('hanami_registration_links')
        .insert([insertData])
        .select()
        .single();
      
      if (retryResult.error) throw retryResult.error;
      data = retryResult.data;
    } else if (error) {
      throw error;
    }
    
    // 如果數據中沒有 expiry_hours，手動添加（用於前端顯示）
    if (data && !data.expiry_hours) {
      data.expiry_hours = hours;
    }
    
    // 生成完整 URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const registrationUrl = `${baseUrl}/aihome/course-activities/register?token=${token}`;
    
    return NextResponse.json({
      success: true,
      data: {
        ...data,
        registrationUrl
      },
      message: '報名連結創建成功'
    });
    
  } catch (error: any) {
    console.error('❌ API: 創建報名連結失敗:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '創建失敗'
    }, { status: 500 });
  }
}

// DELETE: 刪除報名連結
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const linkId = searchParams.get('id');
    const token = searchParams.get('token');
    
    if (!linkId && !token) {
      return NextResponse.json({
        success: false,
        error: '缺少必要參數：id 或 token'
      }, { status: 400 });
    }
    
    console.log('🔍 API: 開始刪除報名連結...', { linkId, token });
    
    let query = supabase
      .from('hanami_registration_links')
      .delete();
    
    if (linkId) {
      query = query.eq('id', linkId);
    } else if (token) {
      query = query.eq('token', token);
    }
    
    const { error } = await query;
    
    if (error) throw error;
    
    console.log('✅ API: 成功刪除報名連結');
    
    return NextResponse.json({
      success: true,
      message: '報名連結已刪除'
    });
    
  } catch (error: any) {
    console.error('❌ API: 刪除報名連結失敗:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '刪除失敗'
    }, { status: 500 });
  }
}

