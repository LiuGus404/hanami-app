#!/bin/bash

# 自動執行 build 直到成功
MAX_ATTEMPTS=50
ATTEMPT=0

echo "開始自動 build 修復流程..."
echo "=================================="

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    ATTEMPT=$((ATTEMPT + 1))
    echo ""
    echo "嘗試 $ATTEMPT/$MAX_ATTEMPTS"
    echo "----------------------------------"
    
    # 執行 build
    npm run build 2>&1 | tee build-output.log
    
    # 檢查是否成功
    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        echo ""
        echo "✅ Build 成功！"
        echo "=================================="
        exit 0
    else
        echo ""
        echo "❌ Build 失敗，分析錯誤..."
        
        # 提取錯誤信息
        ERROR_FILE=$(grep -oP '\.\/src\/[^\s:]+\.(tsx?|jsx?):\d+:\d+' build-output.log | head -1 | cut -d: -f1 | sed 's|^\./||')
        
        if [ -n "$ERROR_FILE" ] && [ -f "$ERROR_FILE" ]; then
            echo "發現錯誤文件: $ERROR_FILE"
            
            # 嘗試修復常見錯誤
            # 1. 修復缺少 'use client' 的問題
            if [[ "$ERROR_FILE" == *.tsx ]] && ! grep -q "'use client'" "$ERROR_FILE"; then
                echo "  修復: 添加 'use client'"
                sed -i '' "1i\\
'use client';
" "$ERROR_FILE"
            fi
            
            # 2. 修復導入路徑問題 (.ts vs .tsx)
            # 這個需要更複雜的邏輯，暫時跳過
            
        fi
        
        echo "等待 1 秒後重試..."
        sleep 1
    fi
done

echo ""
echo "❌ 達到最大嘗試次數 ($MAX_ATTEMPTS)"
echo "請手動檢查 build-output.log 文件"
exit 1

