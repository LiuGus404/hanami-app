import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 獲取今天的課堂信息
async function getTodayLesson(supabase: any, studentId: string) {
    try {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD 格式

        const { data: lessons, error } = await supabase
            .from('hanami_student_lesson')
            .select('*')
            .eq('student_id', studentId)
            .eq('lesson_date', todayStr)
            .order('actual_timeslot', { ascending: true })
            .limit(1);

        if (error) {
            return null;
        }

        return lessons && lessons.length > 0 ? lessons[0] : null;
    } catch (error) {
        return null;
    }
}

export async function POST(request: NextRequest) {
    try {
        const { studentId, path, mediaType, fileSize, newFileName, orgId } = await request.json();

        if (!studentId || !path || !mediaType || !fileSize) {
            return NextResponse.json(
                { error: '缺少必要參數' },
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

        // 獲取今天的課堂 (可選)
        const todayLesson = await getTodayLesson(supabase, studentId);

        // 準備資料庫資料
        const mediaData: any = {
            student_id: studentId,
            media_type: mediaType,
            file_name: newFileName,
            file_path: path,
            file_size: fileSize,
            title: newFileName.replace(/\.[^/.]+$/, ''),
            uploaded_by: null,
            lesson_id: todayLesson?.id || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        if (orgId) {
            mediaData.org_id = orgId;
        }

        // 儲存到資料庫
        const { data: dbData, error: dbError } = await supabase
            .from('hanami_student_media')
            .insert(mediaData)
            .select()
            .single();

        if (dbError) {
            console.error('資料庫插入錯誤:', dbError);
            return NextResponse.json(
                { error: `資料庫插入失敗: ${dbError.message}` },
                { status: 500 }
            );
        }

        // 更新配額
        try {
            const { data: currentQuota, error: quotaError } = await supabase
                .from('hanami_student_media_quota')
                .select('*')
                .eq('student_id', studentId)
                .single();

            if (!quotaError && currentQuota) {
                const updates: any = {};
                if (mediaType === 'video') {
                    updates.video_count = (currentQuota.video_count || 0) + 1;
                } else {
                    updates.photo_count = (currentQuota.photo_count || 0) + 1;
                }
                updates.total_used_space = (currentQuota.total_used_space || 0) + fileSize;
                updates.last_updated = new Date().toISOString();

                await supabase
                    .from('hanami_student_media_quota')
                    .update(updates)
                    .eq('student_id', studentId);
            }
        } catch (e) {
            console.error('配額更新失敗 (非致命):', e);
        }

        // 獲取公開 URL
        const { data: urlData } = supabase.storage
            .from('hanami-media')
            .getPublicUrl(path);

        // 構建與原始 API 一致的響應
        const responseData = {
            success: true,
            data: {
                id: dbData.id,
                student_id: dbData.student_id,
                media_type: dbData.media_type,
                file_name: dbData.file_name,
                file_path: dbData.file_path,
                file_size: dbData.file_size,
                title: dbData.title,
                publicUrl: urlData.publicUrl,
                file_duration: dbData.file_duration,
                thumbnail_path: dbData.thumbnail_path,
                description: dbData.description,
                uploaded_by: dbData.uploaded_by,
                lesson_id: dbData.lesson_id,
                created_at: dbData.created_at,
                updated_at: dbData.updated_at,
                is_favorite: dbData.is_favorite
            }
        };

        return NextResponse.json(responseData);

    } catch (error) {
        console.error('Complete upload error:', error);
        return NextResponse.json(
            { error: '完成上傳失敗' },
            { status: 500 }
        );
    }
}
