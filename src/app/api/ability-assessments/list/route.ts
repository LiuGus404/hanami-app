import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';

/**
 * GET /api/ability-assessments/list
 * 獲取能力評估記錄列表（使用服務角色 key 繞過 RLS）
 * 
 * 查詢參數：
 * - orgId: 機構 ID（可選）
 * - assessmentDate: 評估日期（可選）
 * - studentIds: 學生 ID 列表（可選，逗號分隔）
 * - limit: 限制數量（可選）
 * - orderBy: 排序欄位（可選，默認為 created_at）
 * - ascending: 是否升序（可選，默認為 false）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    const assessmentDate = searchParams.get('assessmentDate');
    const studentIds = searchParams.get('studentIds');
    const limit = searchParams.get('limit');
    const orderBy = searchParams.get('orderBy') || 'created_at';
    const ascending = searchParams.get('ascending') === 'true';

    // 使用服務端客戶端（繞過 RLS）
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('API: 缺少 Supabase 環境變數');
      return NextResponse.json(
        { error: '服務器配置錯誤' },
        { status: 500 }
      );
    }
    
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 構建查詢
    let query = (supabase as any)
      .from('hanami_ability_assessments')
      .select('*');

    // 應用過濾器
    if (orgId) {
      query = query.eq('org_id', orgId);
    }

    if (assessmentDate) {
      query = query.eq('assessment_date', assessmentDate);
    }

    if (studentIds) {
      const studentIdArray = studentIds.split(',').filter(id => id.trim());
      if (studentIdArray.length > 0) {
        query = query.in('student_id', studentIdArray);
      }
    }

    // 應用排序
    query = query.order(orderBy, { ascending });

    // 應用限制
    if (limit) {
      const limitNum = parseInt(limit, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        query = query.limit(limitNum);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('API: 查詢能力評估記錄錯誤', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // 如果需要關聯學生和成長樹資料，分別查詢
    if (data && data.length > 0) {
      const assessments = data as any[];
      const studentIds = [...new Set(assessments.map(a => a.student_id).filter(Boolean))];
      const treeIds = [...new Set(assessments.map(a => a.tree_id).filter(Boolean))];

      const [studentResults, treeResults] = await Promise.all([
        studentIds.length > 0
          ? (() => {
              let studentQuery = (supabase as any)
                .from('Hanami_Students')
                .select('id, full_name, nick_name, course_type')
                .in('id', studentIds);
              if (orgId) {
                studentQuery = studentQuery.eq('org_id', orgId);
              }
              return studentQuery;
            })()
          : Promise.resolve({ data: [], error: null }),
        treeIds.length > 0
          ? (supabase as any)
              .from('hanami_growth_trees')
              .select('id, tree_name, tree_description')
              .in('id', treeIds)
          : Promise.resolve({ data: [], error: null })
      ]);

      // 建立映射
      const students = (studentResults.data || []) as any[];
      const trees = (treeResults.data || []) as any[];
      const studentMap = new Map(students.map(s => [s.id, s]));
      const treeMap = new Map(trees.map(t => [t.id, t]));

      // 組合結果
      const assessmentsWithRelations = assessments.map(assessment => ({
        ...assessment,
        student: studentMap.get(assessment.student_id) || null,
        tree: treeMap.get(assessment.tree_id) || null
      }));

      return NextResponse.json({
        success: true,
        data: assessmentsWithRelations,
        count: assessmentsWithRelations.length
      });
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    });
  } catch (error: any) {
    console.error('API: 查詢能力評估記錄異常', error);
    return NextResponse.json(
      { error: error?.message || '查詢能力評估記錄時發生錯誤' },
      { status: 500 }
    );
  }
}

