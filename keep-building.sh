#!/bin/bash

# 持續執行 build 直到成功
MAX_ATTEMPTS=100
ATTEMPT=0

echo "開始持續 build 流程..."
echo "=================================="

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    ATTEMPT=$((ATTEMPT + 1))
    echo ""
    echo "嘗試 $ATTEMPT/$MAX_ATTEMPTS"
    echo "----------------------------------"
    
    # 執行 build
    npm run build 2>&1 | tee build-output.log
    
    # 檢查是否成功（退出碼為 0）
    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        echo ""
        echo "✅ Build 成功！"
        echo "=================================="
        exit 0
    else
        echo ""
        echo "❌ Build 失敗，將重試..."
        sleep 2
    fi
done

echo ""
echo "❌ 達到最大嘗試次數 ($MAX_ATTEMPTS)"
echo "請檢查 build-output.log 文件"
exit 1

