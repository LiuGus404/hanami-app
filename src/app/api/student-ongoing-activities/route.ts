import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({
        success: false,
        error: '缺少學生 ID'
      }, { status: 400 });
    }

    console.log('📚 獲取學生正在學習的活動:', studentId);

    // 完全使用課堂活動管理中相同的邏輯
    // 調用 student-activities API 獲取學生活動數據
    const today = new Date().toISOString().split('T')[0];
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/student-activities?studentId=${studentId}&lessonDate=${today}&timeslot=`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('獲取學生活動失敗:', response.status);
      return NextResponse.json({
        success: false,
        error: '獲取學生活動失敗'
      }, { status: response.status });
    }

    const result = await response.json();
    
    if (!result.success) {
      console.error('學生活動 API 返回錯誤:', result.error);
      return NextResponse.json({
        success: false,
        error: result.error || '獲取學生活動失敗'
      }, { status: 500 });
    }

    // 使用與課堂活動管理完全相同的邏輯
    // 合併所有類型的活動並過濾出未完成的活動
    const allActivities = [
      ...result.data.currentLessonActivities,
      ...result.data.previousLessonActivities,
      ...result.data.ongoingActivities
    ];
    
    // 過濾出未完成的活動 (與課堂活動管理中 getStudentAssignedActivities 相同的邏輯)
    const ongoingActivities = allActivities.filter(activity => activity.completionStatus !== 'completed');

    console.log(`✅ 為學生 ${studentId} 獲取正在學習活動:`, ongoingActivities.length);

    return NextResponse.json({
      success: true,
      data: ongoingActivities
    });

  } catch (error) {
    console.error('獲取學生正在學習活動失敗:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '獲取學生活動失敗'
    }, { status: 500 });
  }
}
