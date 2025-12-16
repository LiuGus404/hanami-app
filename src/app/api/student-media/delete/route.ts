import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
    try {
        const { mediaId, studentId } = await request.json();

        if (!mediaId || !studentId) {
            return NextResponse.json(
                { error: '缺少必要參數 (mediaId, studentId)' },
                { status: 400 }
            );
        }

        // 檢查環境變數
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            return NextResponse.json(
                { error: '伺服器配置錯誤' },
                { status: 500 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 1. 查詢媒體資訊 (獲取檔案路徑和大小，用於更新配額)
        const { data: media, error: fetchError } = await supabase
            .from('hanami_student_media')
            .select('file_path, file_size, media_type')
            .eq('id', mediaId)
            .single();

        if (fetchError || !media) {
            console.error('找不到媒體檔案:', fetchError);
            return NextResponse.json(
                { error: '找不到媒體檔案' },
                { status: 404 }
            );
        }

        // 2. 從 Storage 刪除檔案
        const { error: storageError } = await supabase.storage
            .from('hanami-media')
            .remove([media.file_path]);

        if (storageError) {
            console.error('Storage 刪除失敗:', storageError);
            // 繼續執行，因為我們仍需清理資料庫記錄
        }

        // 3. 從資料庫刪除記錄
        const { error: dbError } = await supabase
            .from('hanami_student_media')
            .delete()
            .eq('id', mediaId);

        if (dbError) {
            console.error('資料庫刪除失敗:', dbError);
            return NextResponse.json(
                { error: '刪除記錄失敗' },
                { status: 500 }
            );
        }

        // 4. 更新配額 (減少使用量)
        try {
            const { data: currentQuota, error: quotaError } = await supabase
                .from('hanami_student_media_quota')
                .select('*')
                .eq('student_id', studentId)
                .single();

            if (!quotaError && currentQuota) {
                const updates: any = {};

                if (media.media_type === 'video') {
                    updates.video_count = Math.max(0, (currentQuota.video_count || 0) - 1);
                } else {
                    updates.photo_count = Math.max(0, (currentQuota.photo_count || 0) - 1);
                }

                updates.total_used_space = Math.max(0, (currentQuota.total_used_space || 0) - (media.file_size || 0));
                updates.last_updated = new Date().toISOString();

                await supabase
                    .from('hanami_student_media_quota')
                    .update(updates)
                    .eq('student_id', studentId);

                console.log('配額已更新 (釋放):', updates);
            }
        } catch (e) {
            console.error('更新配額失敗 (非致命):', e);
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('刪除處理失敗:', error);
        return NextResponse.json(
            { error: '刪除失敗 (Internal Server Error)' },
            { status: 500 }
        );
    }
}
