#!/bin/bash

# 自動執行 build 並修復錯誤
MAX_ATTEMPTS=50
ATTEMPT=0

echo "開始自動 build 修復流程..."
echo "=================================="

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    ATTEMPT=$((ATTEMPT + 1))
    echo ""
    echo "嘗試 $ATTEMPT/$MAX_ATTEMPTS"
    echo "----------------------------------"
    
    # 執行 build 並捕獲輸出
    npm run build > build-output.log 2>&1
    BUILD_EXIT_CODE=$?
    
    # 檢查是否成功
    if [ $BUILD_EXIT_CODE -eq 0 ]; then
        echo ""
        echo "✅ Build 成功！"
        echo "=================================="
        cat build-output.log | tail -5
        exit 0
    else
        echo "❌ Build 失敗，分析錯誤..."
        
        # 提取錯誤信息
        ERROR_LINES=$(grep -E "(Error|Failed|Type error)" build-output.log | head -5)
        
        if [ -n "$ERROR_LINES" ]; then
            echo "發現錯誤："
            echo "$ERROR_LINES"
            
            # 嘗試修復常見錯誤
            # 1. TypeScript 類型錯誤 - boolean 類型問題
            if echo "$ERROR_LINES" | grep -q "Type.*is not assignable to type 'boolean'"; then
                ERROR_FILE=$(echo "$ERROR_LINES" | grep -oP '\.\/src\/[^\s:]+\.tsx?:\d+:\d+' | head -1 | cut -d: -f1 | sed 's|^\./||')
                if [ -n "$ERROR_FILE" ] && [ -f "$ERROR_FILE" ]; then
                    echo "  修復: $ERROR_FILE 的 boolean 類型問題"
                    # 這裡可以添加自動修復邏輯
                fi
            fi
        fi
        
        echo ""
        echo "等待 2 秒後重試..."
        sleep 2
    fi
done

echo ""
echo "❌ 達到最大嘗試次數 ($MAX_ATTEMPTS)"
echo "請檢查 build-output.log 文件"
exit 1
