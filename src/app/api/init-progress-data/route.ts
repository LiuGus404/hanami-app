import { NextRequest, NextResponse } from 'next/server';

import { initializeAllProgressData } from '@/lib/initProgressData';

export async function POST(request: NextRequest) {
  try {
    console.log('開始執行學生進度系統資料初始化...');
    
    await initializeAllProgressData();
    
    return NextResponse.json({
      success: true,
      message: '學生進度系統資料初始化完成',
    });
  } catch (error) {
    console.error('初始化失敗：', error);
    
    return NextResponse.json(
      {
        success: false,
        message: '初始化失敗',
        error: error instanceof Error ? error.message : '未知錯誤',
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: '請使用 POST 方法來初始化學生進度系統資料',
  });
} 