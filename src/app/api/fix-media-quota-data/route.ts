import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 使用 service_role_key 繞過 RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('開始修復媒體配額資料...');
    
    // 1. 檢查當前狀態
    const { data: currentData, error: checkError } = await supabaseAdmin
      .from('hanami_media_quota_levels')
      .select('*');
    
    if (checkError) {
      console.error('檢查資料失敗:', checkError);
      return NextResponse.json({
        success: false,
        error: '檢查資料失敗',
        details: checkError
      }, { status: 500 });
    }
    
    console.log('當前記錄數:', currentData?.length || 0);
    
    // 2. 如果沒有資料，插入預設資料
    if (!currentData || currentData.length === 0) {
      console.log('表中沒有資料，插入預設資料...');
      
      const { data: insertedData, error: insertError } = await supabaseAdmin
        .from('hanami_media_quota_levels')
        .insert([
          {
            level_name: '基礎版',
            video_limit: 5,
            photo_limit: 10,
            storage_limit_mb: 250,
            video_size_limit_mb: 50,
            photo_size_limit_mb: 10,
            description: '適合新學生的基礎方案，提供基本的媒體上傳功能',
            is_active: true
          },
          {
            level_name: '標準版',
            video_limit: 20,
            photo_limit: 50,
            storage_limit_mb: 1500,
            video_size_limit_mb: 100,
            photo_size_limit_mb: 20,
            description: '適合一般學習需求，提供充足的媒體配額',
            is_active: true
          },
          {
            level_name: '進階版',
            video_limit: 50,
            photo_limit: 100,
            storage_limit_mb: 5000,
            video_size_limit_mb: 200,
            photo_size_limit_mb: 50,
            description: '適合進階學習需求，提供大量媒體配額',
            is_active: true
          },
          {
            level_name: '專業版',
            video_limit: 100,
            photo_limit: 200,
            storage_limit_mb: 10240,
            video_size_limit_mb: 500,
            photo_size_limit_mb: 100,
            description: '適合專業學習需求，提供最大媒體配額',
            is_active: true
          }
        ])
        .select();
      
      if (insertError) {
        console.error('插入預設資料失敗:', insertError);
        return NextResponse.json({
          success: false,
          error: '插入預設資料失敗',
          details: insertError
        }, { status: 500 });
      }
      
      console.log('預設資料插入成功');
      
      return NextResponse.json({
        success: true,
        message: '預設資料插入成功',
        data: insertedData,
        action: 'inserted_default_data'
      });
    }
    
    // 3. 檢查重複記錄
    const duplicateIds = new Set();
    const duplicateNames = new Set();
    const seenIds = new Set();
    const seenNames = new Set();
    
    currentData.forEach(record => {
      if (seenIds.has(record.id)) {
        duplicateIds.add(record.id);
      } else {
        seenIds.add(record.id);
      }
      
      if (seenNames.has(record.level_name)) {
        duplicateNames.add(record.level_name);
      } else {
        seenNames.add(record.level_name);
      }
    });
    
    console.log('重複 ID 數量:', duplicateIds.size);
    console.log('重複名稱數量:', duplicateNames.size);
    
    // 4. 如果有重複記錄，清理它們
    if (duplicateIds.size > 0 || duplicateNames.size > 0) {
      console.log('發現重複記錄，開始清理...');
      
      // 清理重複的 ID（保留最新的）
      for (const duplicateId of duplicateIds) {
        const { data: duplicateRecords, error: fetchError } = await supabaseAdmin
          .from('hanami_media_quota_levels')
          .select('*')
          .eq('id', duplicateId)
          .order('updated_at', { ascending: false });
        
        if (fetchError) {
          console.error('獲取重複記錄失敗:', fetchError);
          continue;
        }
        
        // 刪除除最新記錄外的所有記錄
        for (let i = 1; i < duplicateRecords.length; i++) {
          const { error: deleteError } = await supabaseAdmin
            .from('hanami_media_quota_levels')
            .delete()
            .eq('id', duplicateRecords[i].id);
          
          if (deleteError) {
            console.error('刪除重複記錄失敗:', deleteError);
          }
        }
      }
      
      // 清理重複的名稱（保留最新的）
      for (const duplicateName of duplicateNames) {
        const { data: duplicateRecords, error: fetchError } = await supabaseAdmin
          .from('hanami_media_quota_levels')
          .select('*')
          .eq('level_name', duplicateName)
          .order('updated_at', { ascending: false });
        
        if (fetchError) {
          console.error('獲取重複記錄失敗:', fetchError);
          continue;
        }
        
        // 刪除除最新記錄外的所有記錄
        for (let i = 1; i < duplicateRecords.length; i++) {
          const { error: deleteError } = await supabaseAdmin
            .from('hanami_media_quota_levels')
            .delete()
            .eq('id', duplicateRecords[i].id);
          
          if (deleteError) {
            console.error('刪除重複記錄失敗:', deleteError);
          }
        }
      }
      
      console.log('重複記錄清理完成');
    }
    
    // 5. 修復缺失的欄位
    const { data: recordsToFix, error: fixCheckError } = await supabaseAdmin
      .from('hanami_media_quota_levels')
      .select('id, level_name, video_size_limit_mb, photo_size_limit_mb')
      .or('video_size_limit_mb.is.null,photo_size_limit_mb.is.null');
    
    if (fixCheckError) {
      console.error('檢查需要修復的記錄失敗:', fixCheckError);
    } else if (recordsToFix && recordsToFix.length > 0) {
      console.log('修復缺失欄位的記錄數:', recordsToFix.length);
      
      for (const record of recordsToFix) {
        const { error: updateError } = await supabaseAdmin
          .from('hanami_media_quota_levels')
          .update({
            video_size_limit_mb: record.video_size_limit_mb || 50,
            photo_size_limit_mb: record.photo_size_limit_mb || 10,
            updated_at: new Date().toISOString()
          })
          .eq('id', record.id);
        
        if (updateError) {
          console.error('修復記錄失敗:', updateError);
        }
      }
      
      console.log('缺失欄位修復完成');
    }
    
    // 6. 獲取最終狀態
    const { data: finalData, error: finalError } = await supabaseAdmin
      .from('hanami_media_quota_levels')
      .select('*')
      .order('storage_limit_mb', { ascending: true });
    
    if (finalError) {
      console.error('獲取最終資料失敗:', finalError);
      return NextResponse.json({
        success: false,
        error: '獲取最終資料失敗',
        details: finalError
      }, { status: 500 });
    }
    
    console.log('資料修復完成，最終記錄數:', finalData?.length || 0);
    
    return NextResponse.json({
      success: true,
      message: '資料修復完成',
      data: finalData,
      summary: {
        originalCount: currentData?.length || 0,
        finalCount: finalData?.length || 0,
        duplicateIdsRemoved: duplicateIds.size,
        duplicateNamesRemoved: duplicateNames.size,
        recordsFixed: recordsToFix?.length || 0
      }
    });
    
  } catch (error) {
    console.error('修復資料過程中發生錯誤:', error);
    return NextResponse.json({
      success: false,
      error: '修復資料失敗',
      details: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
} 