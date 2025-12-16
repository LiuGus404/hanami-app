import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { QuotaChecker } from '@/lib/quota-checker';

// 生成新的文件名格式：student_id_日期_時間.副檔名
function generateFileName(originalName: string, studentId: string) {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
    const timeStr = today.toTimeString().split(' ')[0].replace(/:/g, ''); // HHMMSS

    // 獲取文件擴展名
    const fileExt = originalName.split('.').pop();

    // 生成隨機標識符以確保唯一性
    const randomStr = Math.random().toString(36).substring(2, 8);

    // 生成新文件名：student_id_日期_時間_隨機.擴展名
    const safeStudentId = (studentId || 'student').toString().replace(/[^\w-]/g, '_');
    const newFileName = `${safeStudentId}_${dateStr}_${timeStr}_${randomStr}.${fileExt}`;

    return newFileName;
}

export async function POST(request: NextRequest) {
    try {
        const { studentId, fileSize, mediaType, originalName, orgId } = await request.json();

        if (!studentId || !fileSize || !mediaType || !originalName) {
            return NextResponse.json(
                { error: '缺少必要參數 (studentId, fileSize, mediaType, originalName)' },
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

        // 檢查配額限制
        try {
            const quotaChecker = new QuotaChecker();
            const quotaCheck = await quotaChecker.checkUploadQuota(
                studentId,
                mediaType as 'video' | 'photo',
                fileSize
            );

            if (!quotaCheck.allowed) {
                return NextResponse.json({
                    error: quotaCheck.reason || '配額檢查失敗',
                    quotaInfo: {
                        currentUsage: quotaCheck.currentUsage,
                        limits: quotaCheck.limits
                    }
                }, { status: 403 });
            }
        } catch (quotaError) {
            console.error('配額檢查錯誤:', quotaError);
            return NextResponse.json({
                error: '配額檢查失敗',
                details: quotaError instanceof Error ? quotaError.message : '未知錯誤'
            }, { status: 500 });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 生成新文件名和路徑
        const newFileName = generateFileName(originalName, studentId);
        const fileName = `${studentId}/${mediaType}s/${newFileName}`;

        // 生成 Signed Upload URL
        const { data, error } = await supabase.storage
            .from('hanami-media')
            .createSignedUploadUrl(fileName);

        if (error || !data) {
            console.error('生成上傳 URL 失敗:', error);
            return NextResponse.json(
                { error: `生成上傳 URL 失敗: ${error?.message}` },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            uploadUrl: data.signedUrl,
            path: data.path,
            token: data.token,
            newFileName: newFileName,
            fullPath: fileName
        });

    } catch (error) {
        console.error('Prepare upload error:', error);
        return NextResponse.json(
            { error: '準備上傳失敗' },
            { status: 500 }
        );
    }
}
