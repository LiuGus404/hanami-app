import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assessmentId = searchParams.get('assessmentId');

    if (!assessmentId) {
      return NextResponse.json(
        { error: '缺少評估記錄ID' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    // 獲取評估記錄的版本資訊
    const { data: versionInfo, error: versionError } = await supabase.rpc(
      'get_assessment_version_info',
      { p_assessment_id: assessmentId }
    );

    if (versionError) {
      console.error('獲取版本資訊錯誤:', versionError);
      return NextResponse.json(
        { error: '獲取版本資訊失敗', details: versionError.message },
        { status: 500 }
      );
    }

    if (!versionInfo || versionInfo.length === 0) {
      return NextResponse.json(
        { error: '找不到評估記錄的版本資訊' },
        { status: 404 }
      );
    }

    const info = versionInfo[0];

    // 如果版本不同，獲取版本比較資訊
    let versionComparison = null;
    if (info.tree_version !== info.current_tree_version) {
      const { data: comparisonData, error: comparisonError } = await supabase.rpc(
        'compare_growth_tree_versions',
        {
          p_tree_id: assessmentId, // 這裡需要傳入 tree_id，暫時用 assessmentId
          p_from_version: info.tree_version,
          p_to_version: info.current_tree_version
        }
      );

      if (!comparisonError && comparisonData) {
        versionComparison = comparisonData;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...info,
        version_comparison: versionComparison
      }
    });

  } catch (error) {
    console.error('版本資訊API錯誤:', error);
    return NextResponse.json(
      { error: '內部伺服器錯誤' },
      { status: 500 }
    );
  }
}

// 記錄新版本
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { treeId, version, versionName, versionDescription, changesSummary, createdBy } = body;

    if (!treeId || !version) {
      return NextResponse.json(
        { error: '缺少必要參數' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    // 記錄新版本
    const { data: versionId, error } = await supabase.rpc(
      'record_growth_tree_version',
      {
        p_tree_id: treeId,
        p_version: version,
        p_version_name: versionName || null,
        p_version_description: versionDescription || null,
        p_changes_summary: changesSummary || null,
        p_created_by: createdBy || null
      }
    );

    if (error) {
      console.error('記錄版本錯誤:', error);
      return NextResponse.json(
        { error: '記錄版本失敗', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { versionId }
    });

  } catch (error) {
    console.error('記錄版本API錯誤:', error);
    return NextResponse.json(
      { error: '內部伺服器錯誤' },
      { status: 500 }
    );
  }
}
