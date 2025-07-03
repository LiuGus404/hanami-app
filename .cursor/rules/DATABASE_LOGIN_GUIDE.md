# 資料庫帳戶登入指南

## 🎯 目標

讓 Supabase 資料庫中現有的真實帳戶能夠直接登入 Hanami 系統，無需額外的 Supabase Auth 設置。

## 📊 資料庫結構對應

### 1. 管理員帳戶 (hanami_admin)
```sql
-- 登入憑證
admin_email: 管理員的電子郵件
admin_password: 管理員的密碼

-- 示例查詢
SELECT admin_email, admin_name, admin_password 
FROM hanami_admin 
WHERE admin_email IS NOT NULL AND admin_password IS NOT NULL;
```

### 2. 老師帳戶 (hanami_employee)
```sql
-- 登入憑證
teacher_email: 老師的電子郵件
teacher_password: 老師的密碼

-- 示例查詢
SELECT teacher_email, teacher_fullname, teacher_nickname, teacher_password 
FROM hanami_employee 
WHERE teacher_email IS NOT NULL AND teacher_password IS NOT NULL;
```

### 3. 學生/家長帳戶 (Hanami_Students)
```sql
-- 登入憑證
student_email: 學生的電子郵件
student_password: 學生的密碼
parent_email: 家長的電子郵件 (無密碼驗證)

-- 示例查詢
SELECT student_email, full_name, student_password, parent_email 
FROM Hanami_Students 
WHERE student_email IS NOT NULL AND student_password IS NOT NULL;
```

## 🔧 認證流程

### 登入驗證順序
1. **管理員驗證** → 檢查 `hanami_admin` 表
2. **老師驗證** → 檢查 `hanami_employee` 表
3. **學生驗證** → 檢查 `Hanami_Students` 表的 `student_email`
4. **家長驗證** → 檢查 `Hanami_Students` 表的 `parent_email`

### 認證邏輯
```typescript
// 管理員登入
SELECT * FROM hanami_admin 
WHERE admin_email = ? AND admin_password = ?

// 老師登入
SELECT * FROM hanami_employee 
WHERE teacher_email = ? AND teacher_password = ?

// 學生/家長登入
SELECT * FROM Hanami_Students 
WHERE student_email = ? AND student_password = ?

// 家長登入 (無密碼)
SELECT * FROM Hanami_Students 
WHERE parent_email = ?
```

## 🧪 測試工具

### 1. 帳戶測試頁面
訪問 `/admin/account-test` 來測試資料庫中的實際帳戶：

- **檢查所有帳戶**：顯示資料庫中所有可用的登入帳戶
- **測試特定登入**：使用實際的郵箱和密碼測試登入功能
- **雙重驗證**：同時使用認證系統和測試工具驗證

### 2. 測試步驟
1. 登入管理員帳戶
2. 點擊側邊欄的「帳戶測試」按鈕
3. 點擊「開始測試」查看所有可用帳戶
4. 使用實際帳戶進行登入測試

## 📝 實際使用步驟

### 步驟 1: 檢查資料庫帳戶
```sql
-- 在 Supabase SQL Editor 中執行以下查詢

-- 檢查管理員帳戶
SELECT admin_email, admin_name FROM hanami_admin WHERE admin_email IS NOT NULL;

-- 檢查老師帳戶
SELECT teacher_email, teacher_fullname, teacher_nickname FROM hanami_employee WHERE teacher_email IS NOT NULL;

-- 檢查學生帳戶
SELECT student_email, full_name, parent_email FROM Hanami_Students WHERE student_email IS NOT NULL;
```

### 步驟 2: 測試登入
1. 訪問主頁 (`/`)
2. 選擇對應的登入類型
3. 使用資料庫中的實際郵箱和密碼
4. 系統會自動識別用戶類型並重定向

### 步驟 3: 驗證功能
- 檢查用戶資訊是否正確顯示
- 確認權限控制是否正常
- 測試登出功能

## 🔍 故障排除

### 常見問題

#### 1. 登入失敗
**問題**：輸入正確的郵箱和密碼但登入失敗
**解決方案**：
```sql
-- 檢查帳戶是否存在
SELECT * FROM hanami_admin WHERE admin_email = 'your_email@example.com';
SELECT * FROM hanami_employee WHERE teacher_email = 'your_email@example.com';
SELECT * FROM Hanami_Students WHERE student_email = 'your_email@example.com';
```

#### 2. 密碼不匹配
**問題**：密碼正確但系統說密碼錯誤
**解決方案**：
```sql
-- 檢查密碼欄位是否有空格或特殊字元
SELECT admin_email, LENGTH(admin_password), admin_password 
FROM hanami_admin 
WHERE admin_email = 'your_email@example.com';
```

#### 3. 角色識別錯誤
**問題**：登入成功但被重定向到錯誤的儀表板
**解決方案**：
- 確認在正確的登入頁面登入
- 檢查資料庫中的角色欄位

### 調試工具

#### 瀏覽器控制台
```javascript
// 檢查當前會話
console.log(localStorage.getItem('hanami_user_session'));

// 清除會話
localStorage.removeItem('hanami_user_session');

// 測試認證函數
import { validateUserCredentials } from '@/lib/authUtils';
validateUserCredentials('your_email@example.com', 'your_password').then(console.log);
```

#### 資料庫查詢
```sql
-- 檢查所有帳戶的狀態
SELECT 'admin' as type, admin_email as email, admin_name as name, 
       CASE WHEN admin_password IS NOT NULL THEN '有密碼' ELSE '無密碼' END as password_status
FROM hanami_admin WHERE admin_email IS NOT NULL
UNION ALL
SELECT 'teacher' as type, teacher_email as email, teacher_fullname as name,
       CASE WHEN teacher_password IS NOT NULL THEN '有密碼' ELSE '無密碼' END as password_status
FROM hanami_employee WHERE teacher_email IS NOT NULL
UNION ALL
SELECT 'student' as type, student_email as email, full_name as name,
       CASE WHEN student_password IS NOT NULL THEN '有密碼' ELSE '無密碼' END as password_status
FROM Hanami_Students WHERE student_email IS NOT NULL;
```

## 🚀 最佳實踐

### 1. 密碼管理
- 確保所有帳戶都有密碼
- 使用一致的密碼格式
- 定期更新密碼

### 2. 帳戶維護
- 定期檢查無效帳戶
- 更新過期的郵箱地址
- 維護用戶資訊的準確性

### 3. 安全建議
- 考慮實現密碼加密
- 添加登入嘗試限制
- 實現密碼重置功能

## 📋 檢查清單

### 部署前檢查
- [ ] 資料庫中有可用的管理員帳戶
- [ ] 資料庫中有可用的老師帳戶
- [ ] 資料庫中有可用的學生/家長帳戶
- [ ] 所有帳戶都有對應的密碼
- [ ] 郵箱地址格式正確

### 功能測試
- [ ] 管理員可以正常登入
- [ ] 老師可以正常登入
- [ ] 學生/家長可以正常登入
- [ ] 家長可以通過 parent_email 登入
- [ ] 登出功能正常
- [ ] 會話管理正常

### 權限測試
- [ ] 管理員只能訪問管理員功能
- [ ] 老師只能訪問老師功能
- [ ] 家長只能訪問家長功能
- [ ] 無權限用戶被正確重定向

## 🎉 完成

現在您的 Hanami 系統已經完全支援使用 Supabase 資料庫中的實際帳戶進行登入！用戶可以使用他們在資料庫中現有的郵箱和密碼直接登入系統，無需額外的設置。 