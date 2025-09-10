# 🚨 Stripe API 金鑰安全指南

## 緊急處理步驟

### 1. 立即撤銷暴露的金鑰
如果您看到此警告，請立即：
1. 登入 [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. 撤銷所有暴露的 API 金鑰
3. 生成新的 API 金鑰

### 2. 檢查暴露的金鑰
如果您看到此警告，請立即檢查您的 Stripe Dashboard 中是否有異常活動，並撤銷所有可疑的 API 金鑰。

## 正確的設置方式

### 1. 使用環境變數
**永遠不要**在代碼中硬編碼 API 金鑰。使用環境變數：

```bash
# .env.local (不要提交到 Git)
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 2. 更新 .gitignore
確保 `.gitignore` 包含：
```
.env.local
.env
*.env
```

### 3. 使用測試金鑰
在開發環境中，使用 Stripe 測試金鑰：
- 測試金鑰以 `pk_test_` 和 `sk_test_` 開頭
- 測試金鑰不會產生真實的費用

## 安全最佳實踐

### 1. 金鑰管理
- ✅ 使用環境變數
- ✅ 使用測試金鑰進行開發
- ✅ 定期輪換金鑰
- ❌ 不要在代碼中硬編碼金鑰
- ❌ 不要將金鑰提交到版本控制

### 2. 代碼審查
- 在提交代碼前檢查是否包含敏感信息
- 使用工具掃描代碼中的秘密

### 3. 監控
- 在 Stripe Dashboard 中監控 API 使用情況
- 設置異常活動警報

## 修復後的設置步驟

1. **撤銷舊金鑰**（如果尚未完成）
2. **生成新金鑰**：
   - 登入 Stripe Dashboard
   - 前往 API 金鑰頁面
   - 生成新的測試金鑰
3. **更新環境變數**：
   ```bash
   # 在 .env.local 中設置
   STRIPE_PUBLISHABLE_KEY=pk_test_your_new_key
   STRIPE_SECRET_KEY=sk_test_your_new_key
   ```
4. **測試連接**：
   ```bash
   npm run dev
   # 訪問 http://localhost:3000/saas/test-stripe
   ```

## 緊急聯繫
如果懷疑金鑰被濫用：
1. 立即撤銷所有金鑰
2. 檢查 Stripe Dashboard 中的交易記錄
3. 聯繫 Stripe 支援團隊

---
**記住：安全第一！永遠不要在代碼中硬編碼敏感信息。**
