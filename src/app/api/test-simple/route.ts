import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  console.log('=== 簡單測試 API 被調用 ===');
  return NextResponse.json({ message: '簡單測試 API 正常工作' });
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== 簡單測試 POST API 被調用 ===');
    console.log('請求 URL:', request.url);
    console.log('請求方法:', request.method);
    
    const body = await request.json();
    console.log('請求體:', body);
    
    return NextResponse.json({ 
      message: '簡單測試 POST API 正常工作',
      receivedData: body
    });
  } catch (error) {
    console.error('簡單測試 API 錯誤:', error);
    return NextResponse.json({ 
      error: '簡單測試失敗',
      details: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}
