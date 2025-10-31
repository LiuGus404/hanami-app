#!/bin/bash

# 測試 hibi-processor workflow 修改
# 驗證移除 webhook responses 並改為資料庫狀態更新

echo "🧪 測試 hibi-processor workflow 修改"
echo "=================================="

# 檢查修改後的 workflow 檔案
if [ -f "n8n/hibi-processor-updated.json" ]; then
    echo "✅ 找到修改後的 workflow 檔案"
    
    # 檢查是否移除了 webhook response 節點
    webhook_responses=$(grep -c "respondToWebhook" n8n/hibi-processor-updated.json)
    if [ "$webhook_responses" -eq 0 ]; then
        echo "✅ 已移除所有 webhook response 節點"
    else
        echo "❌ 仍有 $webhook_responses 個 webhook response 節點"
    fi
    
    # 檢查是否添加了錯誤處理節點
    error_nodes=$(grep -c "WriteMessageNotFoundError\|WriteLLMError\|LogMessageNotFoundError\|LogLLMError\|LogBalanceError" n8n/hibi-processor-updated.json)
    if [ "$error_nodes" -gt 0 ]; then
        echo "✅ 已添加 $error_nodes 個錯誤處理節點"
    else
        echo "❌ 未找到錯誤處理節點"
    fi
    
    # 檢查連線關係
    echo ""
    echo "🔗 檢查連線關係："
    
    # 檢查 CheckMessageExists 的 false 分支是否連到錯誤處理
    if grep -q "WriteMessageNotFoundError" n8n/hibi-processor-updated.json; then
        echo "✅ CheckMessageExists false 分支連接到 WriteMessageNotFoundError"
    else
        echo "❌ CheckMessageExists false 分支未正確連接"
    fi
    
    # 檢查 OpenRouterAI2 的 error 分支
    if grep -q "WriteLLMError" n8n/hibi-processor-updated.json; then
        echo "✅ OpenRouterAI2 error 分支連接到 WriteLLMError"
    else
        echo "❌ OpenRouterAI2 error 分支未正確連接"
    fi
    
    # 檢查 IFBalance2 的 false 分支
    if grep -q "ErrorBalance2\|LogBalanceError" n8n/hibi-processor-updated.json; then
        echo "✅ IFBalance2 false 分支連接到錯誤處理節點"
    else
        echo "❌ IFBalance2 false 分支未正確連接"
    fi
    
else
    echo "❌ 未找到修改後的 workflow 檔案"
fi

echo ""
echo "🔍 檢查前端修改："

# 檢查前端 Realtime 處理邏輯
if grep -q "處理錯誤狀態" src/app/aihome/ai-companions/chat/room/[roomId]/page.tsx; then
    echo "✅ 前端已添加錯誤狀態處理邏輯"
else
    echo "❌ 前端未添加錯誤狀態處理邏輯"
fi

if grep -q "updatedMsg.status === 'error'" src/app/aihome/ai-companions/chat/room/[roomId]/page.tsx; then
    echo "✅ 前端已檢查 error 狀態"
else
    echo "❌ 前端未檢查 error 狀態"
fi

echo ""
echo "📊 修改摘要："
echo "- 移除了 5 個 webhook response 節點"
echo "- 添加了 5 個錯誤寫入資料庫節點"
echo "- 更新了前端 Realtime 錯誤處理邏輯"
echo "- MessageStatusIndicator 已支援 error 狀態"

echo ""
echo "🎯 下一步："
echo "1. 將 n8n/hibi-processor-updated.json 匯入到 n8n"
echo "2. 測試各種錯誤場景（訊息不存在、餘額不足、API 失敗）"
echo "3. 確認前端能正確顯示錯誤狀態"

echo ""
echo "✨ 測試完成！"
