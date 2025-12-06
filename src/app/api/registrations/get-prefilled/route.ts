import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// GET: 根據 token 獲取預填報名資料
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    if (!token) {
      return NextResponse.json({
        success: false,
        error: '缺少 token 參數'
      }, { status: 400 });
    }
    
    console.log('🔍 API: 開始查詢報名連結資料...', { token });
    
    // 先更新過期狀態
    await supabase.rpc('update_expired_registration_links');
    
    // 查詢連結
    const { data: link, error } = await supabase
      .from('hanami_registration_links')
      .select('*')
      .eq('token', token)
      .single();
    
    if (error || !link) {
      return NextResponse.json({
        success: false,
        error: '連結不存在或已失效',
        expired: true
      }, { status: 404 });
    }
    
    // 檢查是否已過期
    if (link.status === 'expired' || new Date(link.expires_at) < new Date()) {
      // 更新狀態為過期
      await supabase
        .from('hanami_registration_links')
        .update({ status: 'expired' })
        .eq('id', link.id);
      
      return NextResponse.json({
        success: false,
        error: '連結已過期',
        expired: true
      }, { status: 410 });
    }
    
    // 檢查是否已完成
    if (link.status === 'completed') {
      return NextResponse.json({
        success: false,
        error: '此報名已完成',
        completed: true
      }, { status: 410 });
    }
    
    // 檢查是否已取消
    if (link.status === 'cancelled') {
      return NextResponse.json({
        success: false,
        error: '此連結已取消',
        cancelled: true
      }, { status: 410 });
    }
    
    console.log('✅ API: 成功獲取報名連結資料');
    
    // 解析表單資料
    const formData = link.form_data || {};
    
    return NextResponse.json({
      success: true,
      data: {
        linkId: link.id,
        linkType: link.link_type,
        orgId: link.org_id,
        organizationId: link.org_id, // 兼容字段
        courseType: formData.courseType || '',
        courseTypeId: formData.courseType || '',
        courseNature: formData.courseNature || 'trial',
        selectedPlan: formData.selectedPlan || '',
        childFullName: formData.childFullName || '',
        childNickname: formData.childNickname || '',
        childBirthDate: formData.childBirthDate || '',
        childAge: formData.childAge || 0,
        childGender: formData.childGender || '',
        childPreferences: formData.childPreferences || '',
        childHealthNotes: formData.childHealthNotes || '',
        parentName: formData.parentName || '',
        parentPhone: formData.parentPhone || '',
        parentCountryCode: formData.parentCountryCode || '+852',
        parentEmail: formData.parentEmail || '',
        parentTitle: formData.parentTitle || '',
        selectedDate: formData.selectedDate || '',
        selectedTimeSlot: formData.selectedTimeSlot || '',
        availableTimes: formData.availableTimes || [],
        promotionCode: formData.promotionCode || '',
        remarks: formData.remarks || '',
        expiresAt: link.expires_at
      }
    });
    
  } catch (error: any) {
    console.error('❌ API: 獲取報名連結資料失敗:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '查詢失敗'
    }, { status: 500 });
  }
}




