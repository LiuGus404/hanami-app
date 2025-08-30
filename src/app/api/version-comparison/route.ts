import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: 比較兩個版本
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const treeId = searchParams.get('treeId');
    const fromVersion = searchParams.get('fromVersion');
    const toVersion = searchParams.get('toVersion');

    if (!treeId || !fromVersion || !toVersion) {
      return NextResponse.json({ error: '缺少必要參數' }, { status: 400 });
    }

    // 暫時返回空比較結果，因為相關函數可能不存在
    return NextResponse.json({
      success: true,
      data: {
        added: [],
        modified: [],
        removed: [],
        summary: '版本比較功能正在開發中'
      }
    });

  } catch (error) {
    console.error('版本比較失敗:', error);
    return NextResponse.json({ error: '伺服器內部錯誤' }, { status: 500 });
  }
}
