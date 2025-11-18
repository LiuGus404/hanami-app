import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { treeId, pathData, orgId } = body;

    console.log('=== API 接收到的數據 ===');
    console.log('treeId:', treeId);
    console.log('pathData:', pathData);
    console.log('pathData.nodes:', pathData?.nodes);
    console.log('pathData.name:', pathData?.name);
    console.log('pathData.description:', pathData?.description);

    if (!treeId) {
      console.error('缺少 treeId');
      return NextResponse.json(
        { error: '缺少必填欄位', required: ['treeId'], received: { treeId, hasPathData: !!pathData } },
        { status: 400 }
      );
    }

    if (!pathData) {
      console.error('缺少 pathData');
      return NextResponse.json(
        { error: '缺少必填欄位', required: ['pathData'], received: { treeId, pathData } },
        { status: 400 }
      );
    }

    if (!pathData.nodes || !Array.isArray(pathData.nodes)) {
      console.error('pathData.nodes 無效:', pathData.nodes);
      return NextResponse.json(
        { error: 'pathData.nodes 必須是有效的數組', received: { nodes: pathData.nodes } },
        { status: 400 }
      );
    }

    // 檢查該成長樹是否已經有學習路線
    const { data: existingPath, error: checkError } = await supabase
      .from('hanami_learning_paths')
      .select('id')
      .eq('tree_id', treeId)
      .eq('is_active', true)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 表示沒有找到記錄
      console.error('檢查現有學習路徑失敗:', checkError);
      return NextResponse.json(
        { error: '檢查現有學習路徑失敗', details: checkError.message },
        { status: 500 }
      );
    }

    let result;
    let message;

    if (existingPath) {
      // 如果已存在，則更新現有的學習路線
      const updateData: any = {
        name: pathData.name,
        description: pathData.description,
        nodes: pathData.nodes,
        start_node_id: pathData.startNodeId || 'start',
        end_node_id: pathData.endNodeId || 'end',
        total_duration: pathData.totalDuration || 0,
        difficulty: pathData.difficulty || 1,
        tags: pathData.tags || [],
        updated_at: new Date().toISOString()
      };
      
      // 如果提供了 orgId，則更新它
      if (orgId) {
        updateData.org_id = orgId;
      }

      const { data, error } = await supabase
        .from('hanami_learning_paths')
        .update(updateData)
        .eq('id', existingPath.id)
        .select()
        .single();

      if (error) {
        console.error('更新學習路徑失敗:', error);
        return NextResponse.json(
          { error: '更新學習路徑失敗', details: error.message },
          { status: 500 }
        );
      }

      result = data;
      message = '學習路徑更新成功';
    } else {
      // 如果不存在，則創建新的學習路線
      const learningPathData: any = {
        name: pathData.name,
        description: pathData.description,
        tree_id: treeId,
        nodes: pathData.nodes,
        start_node_id: pathData.startNodeId || 'start',
        end_node_id: pathData.endNodeId || 'end',
        total_duration: pathData.totalDuration || 0,
        difficulty: pathData.difficulty || 1,
        tags: pathData.tags || [],
        is_active: true,
        created_by: null, // 可以根據需要添加用戶ID
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // 如果提供了 orgId，則包含它
      if (orgId) {
        learningPathData.org_id = orgId;
      }

      const { data, error } = await supabase
        .from('hanami_learning_paths')
        .insert(learningPathData)
        .select()
        .single();

      if (error) {
        console.error('創建學習路徑失敗:', error);
        return NextResponse.json(
          { error: '創建學習路徑失敗', details: error.message },
          { status: 500 }
        );
      }

      result = data;
      message = '學習路徑創建成功';
    }

    return NextResponse.json({
      success: true,
      data: result,
      message,
      isUpdate: !!existingPath
    }, { status: existingPath ? 200 : 201 });

  } catch (error) {
    console.error('儲存學習路徑時發生錯誤:', error);
    return NextResponse.json(
      { error: '儲存學習路徑時發生錯誤' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const treeId = searchParams.get('treeId');

    if (!treeId) {
      return NextResponse.json(
        { error: '請提供成長樹ID' },
        { status: 400 }
      );
    }

    // 獲取指定成長樹的學習路徑
    const { data, error } = await supabase
      .from('hanami_learning_paths')
      .select('*')
      .eq('tree_id', treeId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('獲取學習路徑失敗:', error);
      return NextResponse.json(
        { error: '獲取學習路徑失敗', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || []
    });

  } catch (error) {
    console.error('獲取學習路徑時發生錯誤:', error);
    return NextResponse.json(
      { error: '獲取學習路徑時發生錯誤' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { pathId, pathData } = body;

    console.log('=== PUT API 接收到的數據 ===');
    console.log('pathId:', pathId);
    console.log('pathData:', pathData);
    console.log('pathData.nodes:', pathData?.nodes);
    console.log('pathData.name:', pathData?.name);
    console.log('pathData.description:', pathData?.description);

    if (!pathId) {
      console.error('缺少 pathId');
      return NextResponse.json(
        { error: '缺少必填欄位', required: ['pathId'], received: { pathId, hasPathData: !!pathData } },
        { status: 400 }
      );
    }

    if (!pathData) {
      console.error('缺少 pathData');
      return NextResponse.json(
        { error: '缺少必填欄位', required: ['pathData'], received: { pathId, pathData } },
        { status: 400 }
      );
    }

    if (!pathData.nodes || !Array.isArray(pathData.nodes)) {
      console.error('pathData.nodes 無效:', pathData.nodes);
      return NextResponse.json(
        { error: 'pathData.nodes 必須是有效的數組', received: { nodes: pathData.nodes } },
        { status: 400 }
      );
    }

    // 更新學習路徑 - 符合現有資料表結構
    const updateData = {
      name: pathData.name,
      description: pathData.description,
      nodes: pathData.nodes,
      start_node_id: pathData.startNodeId || 'start',
      end_node_id: pathData.endNodeId || 'end',
      total_duration: pathData.totalDuration || 0,
      difficulty: pathData.difficulty || 1,
      tags: pathData.tags || [],
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('hanami_learning_paths')
      .update(updateData)
      .eq('id', pathId)
      .select()
      .single();

    if (error) {
      console.error('更新學習路徑失敗:', error);
      return NextResponse.json(
        { error: '更新學習路徑失敗', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: '學習路徑更新成功'
    });

  } catch (error) {
    console.error('更新學習路徑時發生錯誤:', error);
    return NextResponse.json(
      { error: '更新學習路徑時發生錯誤' },
      { status: 500 }
    );
  }
}

// 刪除學習路徑
export async function DELETE(request: NextRequest) {
  try {
    // supabase 已在文件頂部導入
    
    // 檢查用戶認證 - 從請求頭獲取用戶信息
    const userEmail = request.headers.get('X-User-Email');
    const userId = request.headers.get('X-User-ID');
    const userRole = request.headers.get('X-User-Role');
    
    console.log('從請求頭獲取的用戶信息:', { userEmail, userId, userRole });
    
    if (!userEmail || !userId) {
      console.error('缺少用戶認證信息');
      return NextResponse.json({
        error: '用戶未認證',
        details: '缺少用戶認證信息'
      }, { status: 401 });
    }
    
    // 創建用戶對象
    const user = {
      id: userId,
      email: userEmail,
      role: userRole || 'unknown'
    };
    
    console.log('當前用戶:', user.email);
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: '缺少路徑 ID' }, { status: 400 });
    }
    
    const { error } = await supabase
      .from('hanami_learning_paths')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('刪除學習路徑失敗:', error);
      return NextResponse.json({ error: '刪除學習路徑失敗' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: '學習路徑刪除成功' 
    });
    
  } catch (error) {
    console.error('API 錯誤:', error);
    return NextResponse.json({ error: '內部服務器錯誤' }, { status: 500 });
  }
}
