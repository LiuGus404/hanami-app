import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: 獲取成長樹的版本列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const treeId = searchParams.get('treeId');

    if (!treeId) {
      return NextResponse.json({ error: '缺少 treeId 參數' }, { status: 400 });
    }

    // 暫時返回空資料，因為相關表可能不存在
    return NextResponse.json({ versions: [] });

  } catch (error) {
    console.error('獲取成長樹版本失敗:', error);
    return NextResponse.json({ error: '伺服器內部錯誤' }, { status: 500 });
  }
}

// POST: 創建新版本
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { treeId, version, versionName, versionDescription, changesSummary, createdBy } = body;

    if (!treeId || !version) {
      return NextResponse.json({ error: '缺少必要參數' }, { status: 400 });
    }

    // 暫時返回成功訊息，因為相關表可能不存在
    return NextResponse.json({ 
      success: true, 
      message: '版本創建功能正在開發中',
      versionId: 'temp-id'
    });

  } catch (error) {
    console.error('創建版本失敗:', error);
    return NextResponse.json({ error: '伺服器內部錯誤' }, { status: 500 });
  }
}
