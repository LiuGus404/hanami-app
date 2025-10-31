/**
 * 測試 Storage 存取權限的 API 端點
 * 用於驗證 RLS 政策和 Signed URL 生成
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSaasClient } from '@/lib/supabase-saas';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filePath = searchParams.get('path');
    
    if (!filePath) {
      return NextResponse.json({
        success: false,
        error: '請提供 path 參數（例如：?path=user_id/role_name/filename.png）'
      }, { status: 400 });
    }
    
    console.log('🧪 [測試] 開始測試 Storage 存取:', filePath);
    
    const supabase = createSaasClient();
    
    // 測試 1：檢查檔案是否存在
    console.log('🧪 [測試 1] 檢查檔案是否存在...');
    const { data: listData, error: listError } = await supabase.storage
      .from('ai-images')
      .list(filePath.split('/').slice(0, -1).join('/'), {
        search: filePath.split('/').pop()
      });
    
    if (listError) {
      console.error('❌ [測試 1] 列表失敗:', listError);
      return NextResponse.json({
        success: false,
        error: '列表檔案失敗',
        details: listError,
        step: 1
      }, { status: 500 });
    }
    
    console.log('✅ [測試 1] 檔案列表成功:', listData);
    
    // 測試 2：生成 Signed URL
    console.log('🧪 [測試 2] 生成 Signed URL...');
    const { data: signedData, error: signedError } = await supabase.storage
      .from('ai-images')
      .createSignedUrl(filePath, 3600); // 1 小時
    
    if (signedError) {
      console.error('❌ [測試 2] 生成 Signed URL 失敗:', signedError);
      return NextResponse.json({
        success: false,
        error: '生成 Signed URL 失敗',
        details: signedError,
        step: 2,
        fileExists: listData && listData.length > 0
      }, { status: 500 });
    }
    
    console.log('✅ [測試 2] Signed URL 生成成功');
    
    // 測試 3：獲取 Public URL（即使 bucket 是 private，也應該能獲取）
    console.log('🧪 [測試 3] 獲取 Public URL...');
    const { data: publicData } = supabase.storage
      .from('ai-images')
      .getPublicUrl(filePath);
    
    console.log('✅ [測試 3] Public URL 獲取成功（但可能無法存取）');
    
    // 返回測試結果
    return NextResponse.json({
      success: true,
      message: '所有測試通過',
      results: {
        fileExists: listData && listData.length > 0,
        files: listData,
        signedUrl: signedData.signedUrl,
        publicUrl: publicData.publicUrl,
        expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
        recommendations: [
          'Signed URL 應該可以正常存取',
          'Public URL 會因為 bucket 是 private 而返回 400/403',
          '前端應使用 Signed URL 來顯示圖片'
        ]
      }
    });
    
  } catch (error) {
    console.error('❌ [測試] 意外錯誤:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;
    
    if (!url) {
      return NextResponse.json({
        success: false,
        error: '請提供 url 參數'
      }, { status: 400 });
    }
    
    console.log('🧪 [測試] 測試 URL 轉換:', url);
    
    // 提取路徑
    const match = url.match(/ai-images\/(.+?)(?:\?|$)/);
    if (!match) {
      return NextResponse.json({
        success: false,
        error: '無法從 URL 提取路徑'
      }, { status: 400 });
    }
    
    const filePath = decodeURIComponent(match[1]);
    console.log('🔍 [測試] 提取的路徑:', filePath);
    
    // 生成 Signed URL
    const supabase = createSaasClient();
    const { data, error } = await supabase.storage
      .from('ai-images')
      .createSignedUrl(filePath, 3600);
    
    if (error) {
      console.error('❌ [測試] 生成 Signed URL 失敗:', error);
      return NextResponse.json({
        success: false,
        error: '生成 Signed URL 失敗',
        details: error
      }, { status: 500 });
    }
    
    console.log('✅ [測試] Signed URL 生成成功');
    
    return NextResponse.json({
      success: true,
      originalUrl: url,
      extractedPath: filePath,
      signedUrl: data.signedUrl,
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString()
    });
    
  } catch (error) {
    console.error('❌ [測試] 意外錯誤:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}

