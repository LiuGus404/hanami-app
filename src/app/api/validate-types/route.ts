import { NextRequest, NextResponse } from 'next/server';
import { validateAllTypes, generateTypeValidationReport } from '@/lib/typeValidation';

export async function GET(request: NextRequest) {
  try {
    console.log('開始執行型別驗證...');
    
    // 執行型別驗證
    const validationResult = await validateAllTypes();
    
    // 生成報告
    const report = generateTypeValidationReport(validationResult);
    
    console.log('型別驗證完成:', {
      isValid: validationResult.isValid,
      errorCount: validationResult.errors.length,
      warningCount: validationResult.warnings.length,
      suggestionCount: validationResult.suggestions.length
    });
    
    return NextResponse.json({
      success: true,
      data: {
        validation: validationResult,
        report: report,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('型別驗證失敗:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error instanceof Error ? error.message : '型別驗證過程中發生未知錯誤',
        details: error
      }
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    
    switch (action) {
      case 'validate_all':
        return await GET(request);
        
      case 'validate_table': {
        const { tableName } = body;
        if (!tableName) {
          return NextResponse.json({
            success: false,
            error: {
              code: 'MISSING_TABLE_NAME',
              message: '缺少表名參數'
            }
          }, { status: 400 });
        }
        
        // 這裡可以添加單表驗證邏輯
        return NextResponse.json({
          success: true,
          data: {
            message: `表 ${tableName} 驗證功能待實現`,
            tableName
          }
        });
      }
        
      default:
        return NextResponse.json({
          success: false,
          error: {
            code: 'INVALID_ACTION',
            message: '無效的操作類型'
          }
        }, { status: 400 });
    }
    
  } catch (error) {
    console.error('POST 型別驗證失敗:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'POST_VALIDATION_ERROR',
        message: error instanceof Error ? error.message : 'POST 型別驗證過程中發生未知錯誤',
        details: error
      }
    }, { status: 500 });
  }
}
