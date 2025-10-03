import { NextRequest, NextResponse } from 'next/server';
import { getSaasSupabaseClient } from '@/lib/supabase';

// 獲取按日期組織的檔案列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date'); // YYYY-MM-DD 格式
    const limit = parseInt(searchParams.get('limit') || '100');

    const supabase = getSaasSupabaseClient();
    
    let folderPath = 'payment-screenshots';
    if (date) {
      // 驗證日期格式
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        return NextResponse.json(
          { success: false, error: '日期格式錯誤，請使用 YYYY-MM-DD 格式' },
          { status: 400 }
        );
      }
      folderPath = `payment-screenshots/${date}`;
    }

    const { data: files, error } = await supabase.storage
      .from('hanami-saas-system')
      .list(folderPath, {
        limit,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      console.error('獲取檔案列表錯誤:', error);
      return NextResponse.json(
        { success: false, error: '獲取檔案列表失敗' },
        { status: 500 }
      );
    }

    // 過濾掉 .keep 檔案
    const filteredFiles = files?.filter(file => file.name !== '.keep') || [];

    // 為每個檔案生成公開 URL
    const filesWithUrls = await Promise.all(
      filteredFiles.map(async (file) => {
        const { data: urlData } = supabase.storage
          .from('hanami-saas-system')
          .getPublicUrl(`${folderPath}/${file.name}`);
        
        return {
          ...file,
          publicUrl: urlData.publicUrl,
          downloadUrl: urlData.publicUrl
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: filesWithUrls,
      folderPath,
      count: filesWithUrls.length
    });

  } catch (error) {
    console.error('檔案管理 API 錯誤:', error);
    return NextResponse.json(
      { success: false, error: '服務器錯誤' },
      { status: 500 }
    );
  }
}

// 刪除檔案
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');

    if (!filePath) {
      return NextResponse.json(
        { success: false, error: '缺少檔案路徑' },
        { status: 400 }
      );
    }

    const supabase = getSaasSupabaseClient();
    
    const { error } = await supabase.storage
      .from('hanami-saas-system')
      .remove([filePath]);

    if (error) {
      console.error('刪除檔案錯誤:', error);
      return NextResponse.json(
        { success: false, error: '刪除檔案失敗' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '檔案已刪除'
    });

  } catch (error) {
    console.error('刪除檔案 API 錯誤:', error);
    return NextResponse.json(
      { success: false, error: '服務器錯誤' },
      { status: 500 }
    );
  }
}

// 獲取日期資料夾列表
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'list_date_folders') {
      const supabase = getSaasSupabaseClient();
      
      const { data: folders, error } = await supabase.storage
        .from('hanami-saas-system')
        .list('payment-screenshots', {
          sortBy: { column: 'name', order: 'desc' }
        });

      if (error) {
        console.error('獲取資料夾列表錯誤:', error);
        return NextResponse.json(
          { success: false, error: '獲取資料夾列表失敗' },
          { status: 500 }
        );
      }

      // 過濾出日期格式的資料夾 (YYYY-MM-DD)
      const dateFolders = folders?.filter(folder => 
        /^\d{4}-\d{2}-\d{2}$/.test(folder.name)
      ) || [];

      // 為每個日期資料夾獲取檔案數量
      const foldersWithCounts = await Promise.all(
        dateFolders.map(async (folder) => {
          const { data: files } = await supabase.storage
            .from('hanami-saas-system')
            .list(`payment-screenshots/${folder.name}`);
          
          const fileCount = files?.filter(file => file.name !== '.keep').length || 0;
          
          return {
            name: folder.name,
            created_at: folder.created_at,
            fileCount,
            formattedDate: new Date(folder.name).toLocaleDateString('zh-TW')
          };
        })
      );

      return NextResponse.json({
        success: true,
        data: foldersWithCounts
      });
    }

    return NextResponse.json(
      { success: false, error: '無效的操作' },
      { status: 400 }
    );

  } catch (error) {
    console.error('檔案管理 API 錯誤:', error);
    return NextResponse.json(
      { success: false, error: '服務器錯誤' },
      { status: 500 }
    );
  }
}
