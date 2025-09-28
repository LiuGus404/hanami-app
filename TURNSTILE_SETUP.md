# Cloudflare Turnstile 設置指南

## 📋 設置步驟

### 1. 獲取 Cloudflare Turnstile 密鑰

1. 訪問 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 登入您的 Cloudflare 帳戶
3. 在左側選單中選擇 "Turnstile"
4. 點擊 "Add site" 創建新站點
5. 填寫以下資訊：
   - **Site name**: HanamiEcho Login
   - **Domain**: 您的域名 (例如: hanamiecho.com, localhost)
   - **Widget mode**: Managed (推薦)
6. 創建後，您將獲得：
   - **Site Key** (公開密鑰)
   - **Secret Key** (私有密鑰)

### 2. 配置環境變數

在您的 `.env.local` 文件中添加以下配置：

```bash
# Cloudflare Turnstile 配置
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAAYourSiteKey
TURNSTILE_SECRET_KEY=0x4AAAAAAAYourSecretKey
```

### 3. 測試環境設置

對於開發環境，您可以使用 Cloudflare 提供的測試密鑰：

```bash
# 測試密鑰 (僅用於開發)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```

### 4. 生產環境配置

在生產環境中，請確保：

1. 使用真實的 Turnstile 密鑰
2. 在 Cloudflare Dashboard 中添加您的生產域名
3. 設置適當的安全策略

## 🔧 功能特點

### ✅ 已實現的功能

- **單一勾選驗證**: 用戶只需勾選一次即可完成驗證
- **自動過期處理**: Token 過期時自動提示重新驗證
- **錯誤處理**: 驗證失敗時顯示友好錯誤訊息
- **登入保護**: 未完成驗證時無法提交登入表單
- **狀態管理**: 登入成功/失敗後自動清除驗證狀態

### 🎨 UI 設計

- **Hanami 風格**: 符合系統設計風格
- **響應式設計**: 適配各種螢幕尺寸
- **載入狀態**: 顯示驗證載入和成功狀態
- **錯誤提示**: 清晰的錯誤訊息顯示

## 🚀 使用方式

### 前端組件

```tsx
import TurnstileWidget from '@/components/ui/TurnstileWidget';

// 在登入表單中使用
<TurnstileWidget
  onVerify={handleTurnstileVerify}
  onError={handleTurnstileError}
  onExpire={handleTurnstileExpire}
  className="flex justify-center"
/>
```

### 後端驗證 (可選)

如果需要後端驗證 Turnstile token，可以創建 API 端點：

```typescript
// app/api/verify-turnstile/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { token } = await request.json();
  
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      secret: process.env.TURNSTILE_SECRET_KEY!,
      response: token,
    }),
  });
  
  const result = await response.json();
  
  return NextResponse.json({ success: result.success });
}
```

## 📱 測試指南

### 本地測試

1. 啟動開發服務器：`npm run dev`
2. 訪問登入頁面：`http://localhost:3000/aihome/auth/login`
3. 檢查 Turnstile 組件是否正常載入
4. 測試驗證流程

### 生產測試

1. 確保域名已在 Cloudflare 中配置
2. 使用真實的 Turnstile 密鑰
3. 測試各種驗證場景

## 🛠️ 故障排除

### 常見問題

1. **組件不顯示**
   - 檢查 `NEXT_PUBLIC_TURNSTILE_SITE_KEY` 是否正確設置
   - 確認域名在 Cloudflare 中已添加

2. **驗證失敗**
   - 檢查 `TURNSTILE_SECRET_KEY` 是否正確
   - 確認網絡連接正常

3. **樣式問題**
   - 檢查 Tailwind CSS 是否正確載入
   - 確認組件樣式是否被覆蓋

### 調試模式

在開發環境中，您可以在瀏覽器控制台查看 Turnstile 相關的日誌信息。

## 📚 相關資源

- [Cloudflare Turnstile 文檔](https://developers.cloudflare.com/turnstile/)
- [Turnstile React 組件](https://github.com/marsidev/react-turnstile)
- [Cloudflare Dashboard](https://dash.cloudflare.com/)


