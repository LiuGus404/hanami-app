# Hanami 登入系統指南

## 系統概述

Hanami 教育機構管理系統現在支援三種用戶類型的統一登入系統：

1. **管理員** - 系統管理與監控
2. **老師** - 課程管理與學生追蹤  
3. **家長** - 查看學生進度與課程安排

## 資料庫結構

### 管理員帳戶 (hanami_admin)
- `admin_email` - 管理員電子郵件
- `admin_password` - 管理員密碼
- `admin_name` - 管理員姓名
- `role` - 角色 (admin)

### 老師帳戶 (hanami_employee)
- `teacher_email` - 老師電子郵件
- `teacher_password` - 老師密碼
- `teacher_fullname` - 老師全名
- `teacher_nickname` - 老師暱稱
- `teacher_role` - 老師角色
- `teacher_status` - 老師狀態

### 學生/家長帳戶 (Hanami_Students)
- `student_email` - 學生電子郵件
- `student_password` - 學生密碼
- `parent_email` - 家長電子郵件
- `full_name` - 學生姓名
- `student_teacher` - 負責老師ID

## 登入流程

### 1. 統一入口
用戶首先訪問主頁 (`/`)，選擇對應的登入類型：
- 管理員登入 → `/admin/login`
- 老師登入 → `/teacher/login`
- 家長登入 → `/parent/login`

### 2. 認證驗證
系統會按照以下順序驗證用戶憑證：

1. **管理員驗證**：檢查 `hanami_admin` 表的 `admin_email` 和 `admin_password`
2. **老師驗證**：檢查 `hanami_employee` 表的 `teacher_email` 和 `teacher_password`
3. **學生/家長驗證**：
   - 先檢查 `Hanami_Students` 表的 `student_email` 和 `student_password`
   - 再檢查 `Hanami_Students` 表的 `parent_email` (無密碼驗證)

### 3. 會話管理
- 使用 localStorage 管理用戶會話
- 會話有效期為 24 小時
- 自動重定向到對應的儀表板

## 測試帳戶

### 管理員帳戶
- Email: `admin@hanami.com` / Password: `admin123`
- Email: `test@hanami.com` / Password: `test123`

### 老師帳戶
- Email: `teacher@hanami.com` / Password: `teacher123`
- Email: `music@hanami.com` / Password: `music123`
- Email: `piano@hanami.com` / Password: `piano123`

### 學生/家長帳戶
- Email: `student1@hanami.com` / Password: `student123`
- Email: `student2@hanami.com` / Password: `student456`
- Email: `student3@hanami.com` / Password: `student789`

## 設置步驟

### 1. 執行測試資料腳本
```sql
-- 在 Supabase SQL Editor 中執行 test_login_data.sql
```

### 2. 驗證資料插入
```sql
-- 檢查管理員資料
SELECT admin_email, admin_name FROM hanami_admin;

-- 檢查老師資料
SELECT teacher_email, teacher_fullname FROM hanami_employee;

-- 檢查學生資料
SELECT student_email, full_name, parent_email FROM Hanami_Students;
```

## 安全注意事項

1. **密碼安全**：實際部署時應使用加密密碼
2. **會話安全**：考慮使用更安全的會話管理方式
3. **家長密碼**：建議為家長帳戶添加獨立的密碼欄位
4. **權限控制**：確保用戶只能訪問對應角色的功能

## 故障排除

### 常見問題

1. **登入失敗**
   - 檢查資料庫中是否存在對應的 email 和 password
   - 確認用戶角色是否正確

2. **會話過期**
   - 清除瀏覽器 localStorage
   - 重新登入

3. **權限錯誤**
   - 確認用戶在正確的登入頁面登入
   - 檢查用戶角色是否匹配

### 調試工具

```javascript
// 檢查當前會話
console.log(localStorage.getItem('hanami_user_session'));

// 清除會話
localStorage.removeItem('hanami_user_session');
```

## 未來改進

1. **密碼加密**：實現密碼雜湊加密
2. **JWT Token**：使用更安全的 JWT 認證
3. **家長密碼**：為家長帳戶添加獨立密碼欄位
4. **雙因素認證**：添加簡訊或郵件驗證
5. **密碼重置**：實現密碼重置功能

## 技術架構

- **前端**：Next.js 14 + TypeScript
- **後端**：Supabase (PostgreSQL)
- **認證**：自定義認證系統 + localStorage
- **UI**：Tailwind CSS + 自定義 Hanami 組件 