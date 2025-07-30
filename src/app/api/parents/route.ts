import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'list': {
        // 獲取家長列表
        const { data: parents, error: parentsError } = await supabase
          .from('hanami_parents')
          .select('*')
          .order('parent_name');

        if (parentsError) throw parentsError;

        return NextResponse.json({
          success: true,
          data: parents
        });
      }

      case 'statistics': {
        // 獲取家長統計
        const { data: stats, error: statsError } = await supabase
          .rpc('get_parent_statistics');

        if (statsError) throw statsError;

        return NextResponse.json({
          success: true,
          data: stats
        });
      }

      case 'links': {
        // 獲取家長-學生連結
        const { data: links, error: linksError } = await supabase
          .from('hanami_parent_student_links')
          .select(`
            *,
            parent:hanami_parents(*),
            student:Hanami_Students(*)
          `)
          .order('created_at', { ascending: false });

        if (linksError) throw linksError;

        return NextResponse.json({
          success: true,
          data: links
        });
      }

      default:
        return NextResponse.json({
          error: '無效的操作'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('家長 API 錯誤:', error);
    return NextResponse.json({
      error: '獲取家長資料失敗: ' + (error instanceof Error ? error.message : '未知錯誤')
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'check_account': {
        // 檢查家長帳戶
        const { data: parentData, error: parentError } = await supabase
          .from('hanami_parents')
          .select('*')
          .eq('parent_email', data.email)
          .single();

        if (parentError && parentError.code !== 'PGRST116') {
          throw parentError;
        }

        // 檢查權限記錄
        const { data: permissionData, error: permissionError } = await supabase
          .from('hanami_user_permissions_v2')
          .select(`
            *,
            hanami_roles (
              role_name, display_name
            )
          `)
          .eq('user_email', data.email)
          .eq('status', 'approved')
          .eq('is_active', true)
          .single();

        if (permissionError && permissionError.code !== 'PGRST116') {
          throw permissionError;
        }

        return NextResponse.json({
          success: true,
          data: {
            parent_exists: !!parentData,
            parent_data: parentData,
            permission_exists: !!permissionData,
            permission_data: permissionData
          }
        });
      }

      case 'create_account': {
        // 創建家長帳戶
        const { data: accountResult, error: accountError } = await supabase
          .rpc('create_parent_account', {
            p_email: data.email,
            p_name: data.name,
            p_phone: data.phone || '',
            p_password: data.password,
            p_address: data.address || '',
            p_notes: data.notes || ''
          });

        if (accountError) throw accountError;

        if (!accountResult[0]?.success) {
          return NextResponse.json({
            error: accountResult[0]?.message || '創建家長帳戶失敗'
          }, { status: 400 });
        }

        return NextResponse.json({
          success: true,
          data: {
            parent_id: accountResult[0].parent_id,
            message: accountResult[0].message
          }
        });
      }

      case 'create_permission': {
        // 創建家長權限
        const { data: permissionResult, error: permissionResultError } = await supabase
          .rpc('create_parent_permission', {
            p_email: data.email,
            p_phone: data.phone || '',
            p_approved_by: data.approved_by || null
          });

        if (permissionResultError) throw permissionResultError;

        if (!permissionResult[0]?.success) {
          return NextResponse.json({
            error: permissionResult[0]?.message || '創建權限記錄失敗'
          }, { status: 400 });
        }

        return NextResponse.json({
          success: true,
          data: {
            permission_id: permissionResult[0].permission_id,
            message: permissionResult[0].message
          }
        });
      }

      case 'create_link': {
        // 創建家長-學生連結
        const { data: linkResult, error: linkError } = await supabase
          .rpc('create_parent_student_link', {
            p_parent_id: data.parent_id,
            p_student_id: data.student_id,
            p_relationship_type: data.relationship_type || 'parent',
            p_is_primary_contact: data.is_primary_contact || false
          });

        if (linkError) throw linkError;

        if (!linkResult[0]?.success) {
          return NextResponse.json({
            error: linkResult[0]?.message || '創建連結失敗'
          }, { status: 400 });
        }

        return NextResponse.json({
          success: true,
          data: {
            link_id: linkResult[0].link_id,
            message: linkResult[0].message
          }
        });
      }

      case 'authenticate': {
        // 家長登入驗證
        const { data: authResult, error: authError } = await supabase
          .rpc('authenticate_parent', {
            p_email: data.email,
            p_password: data.password
          });

        if (authError) throw authError;

        if (!authResult[0]?.success) {
          return NextResponse.json({
            error: authResult[0]?.message || '登入失敗'
          }, { status: 401 });
        }

        return NextResponse.json({
          success: true,
          data: {
            parent_id: authResult[0].parent_id,
            parent_name: authResult[0].parent_name,
            parent_email: authResult[0].parent_email,
            message: authResult[0].message
          }
        });
      }

      default:
        return NextResponse.json({
          error: '無效的操作'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('家長 API 錯誤:', error);
    return NextResponse.json({
      error: '操作失敗: ' + (error instanceof Error ? error.message : '未知錯誤')
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        error: '缺少 ID 參數'
      }, { status: 400 });
    }

    switch (action) {
      case 'delete_parent': {
        // 刪除家長帳戶
        const { error: parentError } = await supabase
          .from('hanami_parents')
          .delete()
          .eq('id', id);

        if (parentError) throw parentError;

        return NextResponse.json({
          success: true,
          message: '家長帳戶刪除成功'
        });
      }

      case 'delete_link': {
        // 刪除家長-學生連結
        const { error: linkError } = await supabase
          .from('hanami_parent_student_links')
          .delete()
          .eq('id', id);

        if (linkError) throw linkError;

        return NextResponse.json({
          success: true,
          message: '連結刪除成功'
        });
      }

      default:
        return NextResponse.json({
          error: '無效的操作'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('家長 API 錯誤:', error);
    return NextResponse.json({
      error: '刪除失敗: ' + (error instanceof Error ? error.message : '未知錯誤')
    }, { status: 500 });
  }
} 