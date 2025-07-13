# Hanami 資源庫系統前端介面設計提案

## 🎯 系統架構

### 1. 主要功能模組
- **範本管理** - 自訂和管理各種範本
- **資源庫** - 教案、活動、遊戲等資源管理
- **檔案管理** - 檔案上傳、下載、權限控制
- **權限系統** - 用戶權限管理
- **統計分析** - 使用情況統計

### 2. 頁面結構
```
/admin/
├── resource-library/
│   ├── templates/           # 範本管理
│   │   ├── page.tsx        # 範本列表
│   │   ├── [id]/           # 範本詳情/編輯
│   │   └── create/         # 創建新範本
│   ├── activities/         # 活動管理
│   │   ├── page.tsx        # 活動列表
│   │   ├── [id]/           # 活動詳情/編輯
│   │   └── create/         # 創建新活動
│   ├── files/              # 檔案管理
│   │   ├── page.tsx        # 檔案列表
│   │   └── upload/         # 檔案上傳
│   ├── permissions/        # 權限管理
│   │   └── page.tsx        # 權限設定
│   └── analytics/          # 統計分析
│       └── page.tsx        # 使用統計
```

## 🎨 介面設計

### 1. 範本管理頁面 (`/admin/resource-library/templates`)

```typescript
// 範本列表功能
- 範本類型篩選（教案、遊戲、繪本、訓練、自訂）
- 範本搜尋和排序
- 範本預覽和編輯
- 範本複製和刪除
- 範本使用統計

// 範本創建/編輯功能
- 拖拽式範本設計器
- 欄位類型選擇（文字、數字、陣列、選擇器等）
- 欄位驗證規則設定
- 範本預覽功能
```

### 2. 活動管理頁面 (`/admin/resource-library/activities`)

```typescript
// 活動列表功能
- 範本篩選（根據選擇的範本顯示對應欄位）
- 分類和標籤篩選
- 狀態篩選（草稿、已發布、已封存）
- 批量操作（發布、封存、刪除）

// 活動創建/編輯功能
- 範本選擇器
- 動態表單（根據範本自動生成表單）
- 檔案上傳區域
- 權限設定
- 版本管理
```

### 3. 檔案管理頁面 (`/admin/resource-library/files`)

```typescript
// 檔案列表功能
- 檔案類型篩選
- 檔案大小和上傳時間排序
- 檔案預覽（圖片、PDF、影片等）
- 下載統計
- 權限狀態顯示

// 檔案上傳功能
- 拖拽上傳
- 批量上傳
- 檔案類型驗證
- 上傳進度顯示
- 檔案壓縮和優化
```

## 🔧 技術實現

### 1. 範本系統實現

```typescript
// 範本類型定義
interface TemplateField {
  name: string;
  type: 'text' | 'number' | 'array' | 'select' | 'date' | 'file';
  required: boolean;
  options?: string[]; // 用於 select 類型
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

interface ResourceTemplate {
  id: string;
  template_name: string;
  template_type: 'lesson_plan' | 'storybook' | 'game' | 'training' | 'custom';
  template_description?: string;
  template_schema: {
    fields: TemplateField[];
  };
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// 動態表單組件
const DynamicForm = ({ template, onSubmit }: {
  template: ResourceTemplate;
  onSubmit: (data: any) => void;
}) => {
  const [formData, setFormData] = useState({});
  
  const renderField = (field: TemplateField) => {
    switch (field.type) {
      case 'text':
        return <TextInput field={field} onChange={handleFieldChange} />;
      case 'array':
        return <ArrayInput field={field} onChange={handleFieldChange} />;
      case 'select':
        return <SelectInput field={field} onChange={handleFieldChange} />;
      // ... 其他欄位類型
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {template.template_schema.fields.map(field => (
        <div key={field.name}>
          {renderField(field)}
        </div>
      ))}
    </form>
  );
};
```

### 2. 檔案上傳系統

```typescript
// 檔案上傳組件
const FileUpload = ({ 
  resourceId, 
  resourceType, 
  onUploadComplete 
}: {
  resourceId: string;
  resourceType: 'activity' | 'template' | 'lesson_plan';
  onUploadComplete: (file: FileResource) => void;
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const handleFileUpload = async (files: FileList) => {
    setUploading(true);
    
    for (const file of Array.from(files)) {
      // 1. 上傳到 Supabase Storage
      const { data, error } = await supabase.storage
        .from('resource-files')
        .upload(`${resourceType}/${resourceId}/${file.name}`, file, {
          onUploadProgress: (progress) => {
            setProgress(progress.loaded / progress.total * 100);
          }
        });
      
      if (error) throw error;
      
      // 2. 儲存檔案記錄到資料庫
      const fileRecord = await createFileResource({
        resource_id: resourceId,
        resource_type: resourceType,
        file_name: file.name,
        file_path: data.path,
        file_size: file.size,
        file_type: file.type,
        storage_provider: 'supabase'
      });
      
      onUploadComplete(fileRecord);
    }
    
    setUploading(false);
  };
  
  return (
    <div className="file-upload-zone">
      <input 
        type="file" 
        multiple 
        onChange={(e) => handleFileUpload(e.target.files!)}
        disabled={uploading}
      />
      {uploading && <ProgressBar progress={progress} />}
    </div>
  );
};
```

### 3. 權限控制系統

```typescript
// 權限檢查 Hook
const usePermission = (resourceId: string, resourceType: string, permission: string) => {
  const { user } = useUser();
  const [hasPermission, setHasPermission] = useState(false);
  
  useEffect(() => {
    const checkPermission = async () => {
      const { data } = await supabase
        .from('hanami_resource_permissions')
        .select('*')
        .eq('resource_id', resourceId)
        .eq('resource_type', resourceType)
        .eq('user_id', user?.id)
        .eq('permission_type', permission)
        .eq('is_active', true)
        .single();
      
      setHasPermission(!!data);
    };
    
    if (user) checkPermission();
  }, [user, resourceId, resourceType, permission]);
  
  return hasPermission;
};

// 權限控制組件
const PermissionGate = ({ 
  resourceId, 
  resourceType, 
  permission, 
  children 
}: {
  resourceId: string;
  resourceType: string;
  permission: string;
  children: React.ReactNode;
}) => {
  const hasPermission = usePermission(resourceId, resourceType, permission);
  
  if (!hasPermission) {
    return <div className="permission-denied">權限不足</div>;
  }
  
  return <>{children}</>;
};
```

## 📱 用戶體驗設計

### 1. 響應式設計
- 桌面版：完整功能，多欄位佈局
- 平板版：適中功能，雙欄位佈局
- 手機版：簡化功能，單欄位佈局

### 2. 互動設計
- 拖拽排序和分類
- 即時搜尋和篩選
- 批量操作和快捷鍵
- 進度指示和狀態反饋

### 3. 視覺設計
- 一致的色彩系統
- 清晰的層次結構
- 直觀的圖標使用
- 適當的動畫效果

## 🔄 工作流程

### 1. 創建新活動流程
```
選擇範本 → 填寫表單 → 上傳檔案 → 設定權限 → 發布活動
```

### 2. 檔案管理流程
```
選擇檔案 → 上傳處理 → 權限設定 → 發布使用
```

### 3. 權限管理流程
```
選擇資源 → 設定用戶 → 分配權限 → 設定期限
```

## 📊 統計分析

### 1. 使用統計
- 資源使用頻率
- 檔案下載次數
- 用戶活躍度
- 熱門資源排行

### 2. 效能監控
- 上傳速度統計
- 系統響應時間
- 錯誤率統計
- 用戶行為分析 