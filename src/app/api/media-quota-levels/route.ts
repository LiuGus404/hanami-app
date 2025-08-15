import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 使用 service_role_key 繞過 RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: 獲取配額等級列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active_only') === 'true';

    let query = supabaseAdmin
      .from('hanami_media_quota_levels')
      .select('*')
      .order('storage_limit_mb', { ascending: true });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('獲取配額等級失敗:', error);
      
      // 如果是資料表不存在的錯誤，嘗試創建預設資料
      if (error.code === '42P01') {
        try {
          await createDefaultQuotaLevels();
          // 重新嘗試獲取資料
          const { data: newData, error: newError } = await query;
          if (newError) {
            return NextResponse.json(
              { error: '獲取配額等級失敗' },
              { status: 500 }
            );
          }
          return NextResponse.json({
            success: true,
            data: newData || [],
            count: newData?.length || 0
          });
        } catch (createError) {
          console.error('創建預設配額等級失敗:', createError);
          return NextResponse.json(
            { error: '資料表不存在，請先執行初始化' },
            { status: 404 }
          );
        }
      }
      
      return NextResponse.json(
        { error: '獲取配額等級失敗' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    });
  } catch (error) {
    console.error('獲取配額等級錯誤:', error);
    return NextResponse.json(
      { error: '獲取配額等級失敗' },
      { status: 500 }
    );
  }
}

// 創建預設配額等級的輔助函數
async function createDefaultQuotaLevels() {
  const defaultLevels = [
    {
      level_name: '基礎版',
      video_limit: 5,
      photo_limit: 10,
      storage_limit_mb: 250,
      video_size_limit_mb: 20,
      photo_size_limit_mb: 1,
      description: '適合新學生的基礎方案，提供基本的媒體上傳功能',
      is_active: true,
    },
    {
      level_name: '標準版',
      video_limit: 20,
      photo_limit: 50,
      storage_limit_mb: 1500,
      video_size_limit_mb: 100,
      photo_size_limit_mb: 20,
      description: '適合一般學習需求，提供充足的媒體配額',
      is_active: true,
    },
    {
      level_name: '進階版',
      video_limit: 50,
      photo_limit: 100,
      storage_limit_mb: 5000,
      video_size_limit_mb: 200,
      photo_size_limit_mb: 50,
      description: '適合進階學習需求，提供大量媒體配額',
      is_active: true,
    },
    {
      level_name: '專業版',
      video_limit: 100,
      photo_limit: 200,
      storage_limit_mb: 10240,
      video_size_limit_mb: 500,
      photo_size_limit_mb: 100,
      description: '適合專業學習需求，提供最大媒體配額',
      is_active: true,
    }
  ];

  const { error } = await supabaseAdmin
    .from('hanami_media_quota_levels')
    .insert(defaultLevels);

  if (error) {
    throw error;
  }
}

// POST: 創建新的配額等級
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { level_name, video_limit, photo_limit, storage_limit_mb, video_size_limit_mb, photo_size_limit_mb, description } = body;

    // 驗證必填欄位
    if (!level_name || !video_limit || !photo_limit || !storage_limit_mb) {
      return NextResponse.json(
        { error: '缺少必填欄位' },
        { status: 400 }
      );
    }

    // 驗證數值
    if (video_limit <= 0 || photo_limit <= 0 || storage_limit_mb <= 0 || video_size_limit_mb <= 0 || photo_size_limit_mb <= 0) {
      return NextResponse.json(
        { error: '配額數量必須大於0' },
        { status: 400 }
      );
    }

    const { data: insertedRecords, error } = await supabaseAdmin
      .from('hanami_media_quota_levels')
      .insert({
        level_name: level_name.trim(),
        video_limit,
        photo_limit,
        storage_limit_mb,
        video_size_limit_mb,
        photo_size_limit_mb,
        description: description?.trim() || '',
        is_active: true,
      })
      .select();

    if (error) {
      console.error('創建配額等級失敗:', error);
      if (error.code === '23505') { // 唯一約束違反
        return NextResponse.json(
          { error: '配額等級名稱已存在' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: `創建配額等級失敗: ${error.message}` },
        { status: 500 }
      );
    }
    
    if (!insertedRecords || insertedRecords.length === 0) {
      console.error('插入後沒有返回記錄');
      return NextResponse.json(
        { error: '創建失敗：沒有返回記錄' },
        { status: 500 }
      );
    }
    
    if (insertedRecords.length > 1) {
      console.error('插入後返回多條記錄:', insertedRecords.length);
      return NextResponse.json(
        { error: '創建失敗：返回多條記錄' },
        { status: 500 }
      );
    }
    
    const data = insertedRecords[0];

    return NextResponse.json({
      success: true,
      data,
      message: '配額等級創建成功'
    });
  } catch (error) {
    console.error('創建配額等級錯誤:', error);
    return NextResponse.json(
      { error: '創建配額等級失敗' },
      { status: 500 }
    );
  }
}

// PUT: 更新配額等級
export async function PUT(request: NextRequest) {
  try {
    console.log('PUT 請求開始處理');
    
    const body = await request.json();
    console.log('請求體:', body);
    
    const { id, level_name, video_limit, photo_limit, storage_limit_mb, video_size_limit_mb, photo_size_limit_mb, description, is_active } = body;

    if (!id) {
      console.error('缺少配額等級ID');
      return NextResponse.json(
        { error: '缺少配額等級ID' },
        { status: 400 }
      );
    }

    console.log('處理更新資料，ID:', id);

    const updateData: any = {};
    if (level_name !== undefined) updateData.level_name = level_name.trim();
    if (video_limit !== undefined) updateData.video_limit = video_limit;
    if (photo_limit !== undefined) updateData.photo_limit = photo_limit;
    if (storage_limit_mb !== undefined) updateData.storage_limit_mb = storage_limit_mb;
    if (video_size_limit_mb !== undefined) updateData.video_size_limit_mb = video_size_limit_mb;
    if (photo_size_limit_mb !== undefined) updateData.photo_size_limit_mb = photo_size_limit_mb;
    if (description !== undefined) updateData.description = description?.trim() || '';
    if (is_active !== undefined) updateData.is_active = is_active;

    console.log('準備更新的資料:', updateData);

    // 驗證數值（只驗證有提供的欄位）
    if (updateData.video_limit !== undefined && updateData.video_limit <= 0) {
      console.error('影片配額驗證失敗:', updateData.video_limit);
      return NextResponse.json(
        { error: '影片配額必須大於0' },
        { status: 400 }
      );
    }
    if (updateData.photo_limit !== undefined && updateData.photo_limit <= 0) {
      console.error('相片配額驗證失敗:', updateData.photo_limit);
      return NextResponse.json(
        { error: '相片配額必須大於0' },
        { status: 400 }
      );
    }
    if (updateData.storage_limit_mb !== undefined && updateData.storage_limit_mb <= 0) {
      console.error('儲存空間限制驗證失敗:', updateData.storage_limit_mb);
      return NextResponse.json(
        { error: '儲存空間限制必須大於0' },
        { status: 400 }
      );
    }
    if (updateData.video_size_limit_mb !== undefined && updateData.video_size_limit_mb <= 0) {
      console.error('影片大小限制驗證失敗:', updateData.video_size_limit_mb);
      return NextResponse.json(
        { error: '影片大小限制必須大於0' },
        { status: 400 }
      );
    }
    if (updateData.photo_size_limit_mb !== undefined && updateData.photo_size_limit_mb <= 0) {
      console.error('相片大小限制驗證失敗:', updateData.photo_size_limit_mb);
      return NextResponse.json(
        { error: '相片大小限制必須大於0' },
        { status: 400 }
      );
    }

    console.log('開始執行資料庫更新');
    
    // 首先檢查記錄是否存在
    const { data: existingRecords, error: checkError } = await supabaseAdmin
      .from('hanami_media_quota_levels')
      .select('id, level_name')
      .eq('id', id);
    
    if (checkError) {
      console.error('檢查記錄存在性失敗:', checkError);
      return NextResponse.json(
        { error: `檢查記錄失敗: ${checkError.message}` },
        { status: 500 }
      );
    }
    
    if (!existingRecords || existingRecords.length === 0) {
      console.error('找不到指定的配額等級，ID:', id);
      return NextResponse.json(
        { error: '找不到指定的配額等級，請重新載入頁面' },
        { status: 404 }
      );
    }
    
    if (existingRecords.length > 1) {
      console.error('發現重複記錄，ID:', id, '記錄數:', existingRecords.length);
      return NextResponse.json(
        { error: '發現重複記錄，請聯繫管理員' },
        { status: 409 }
      );
    }
    
    const existingRecord = existingRecords[0];
    console.log('找到現有記錄:', existingRecord);
    
    // 執行更新
    console.log('執行更新操作，ID:', id, '更新資料:', updateData);
    
    const { data: updatedRecords, error } = await supabaseAdmin
      .from('hanami_media_quota_levels')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      console.error('資料庫更新失敗:', error);
      if (error.code === '23505') { // 唯一約束違反
        return NextResponse.json(
          { error: '配額等級名稱已存在' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: `更新配額等級失敗: ${error.message}` },
        { status: 500 }
      );
    }
    
    console.log('更新操作完成，返回記錄數:', updatedRecords?.length || 0);
    
    if (!updatedRecords || updatedRecords.length === 0) {
      console.error('更新後沒有返回記錄，可能是更新條件不匹配或資料沒有變化');
      
      // 重新檢查記錄是否存在
      const { data: checkRecord, error: checkError } = await supabaseAdmin
        .from('hanami_media_quota_levels')
        .select('*')
        .eq('id', id)
        .single();
      
      if (checkError) {
        console.error('重新檢查記錄失敗:', checkError);
        return NextResponse.json(
          { error: '更新失敗：記錄不存在' },
          { status: 404 }
        );
      }
      
      console.log('記錄仍然存在，可能是資料沒有變化:', checkRecord);
      
      // 如果記錄存在但沒有變化，返回成功
      return NextResponse.json({
        success: true,
        data: checkRecord,
        message: '配額等級更新成功（資料無變化）'
      });
    }
    
    if (updatedRecords.length > 1) {
      console.error('更新後返回多條記錄:', updatedRecords.length);
      return NextResponse.json(
        { error: '更新失敗：返回多條記錄' },
        { status: 500 }
      );
    }
    
    const data = updatedRecords[0];

    console.log('更新成功，返回資料:', data);

    return NextResponse.json({
      success: true,
      data,
      message: '配額等級更新成功'
    });
  } catch (error) {
    console.error('PUT 請求處理錯誤:', error);
    return NextResponse.json(
      { error: `更新配額等級失敗: ${error instanceof Error ? error.message : '未知錯誤'}` },
      { status: 500 }
    );
  }
}

// DELETE: 刪除配額等級
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: '缺少配額等級ID' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('hanami_media_quota_levels')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('刪除配額等級失敗:', error);
      return NextResponse.json(
        { error: '刪除配額等級失敗' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '配額等級刪除成功'
    });
  } catch (error) {
    console.error('刪除配額等級錯誤:', error);
    return NextResponse.json(
      { error: '刪除配額等級失敗' },
      { status: 500 }
    );
  }
} 