import { supabase } from './supabase';

// Storage 資料夾結構配置
export const STORAGE_FOLDERS = [
  // 學生媒體資料夾
  'students',
  
  // 範本資料夾
  'templates/lesson-plans',
  'templates/activities',
  'templates/resources',
  
  // 共享資料夾
  'shared/avatars/teachers',
  'shared/avatars/students',
  'shared/documents/lesson-plans',
  'shared/documents/worksheets',
  'shared/music-files/backing-tracks',
  'shared/music-files/sheet-music',
  
  // 公開資料夾
  'public/icons',
  'public/backgrounds',
  'public/default-avatars'
];

// 檢查 Storage 是否可用
export const checkStorageAvailable = async (): Promise<{
  available: boolean;
  error?: string;
}> => {
  try {
    // 嘗試列出 bucket
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      return {
        available: false,
        error: `無法獲取 Storage buckets: ${bucketsError.message}`
      };
    }
    
    const hanamiBucket = buckets.find(bucket => bucket.name === 'hanami-media');
    if (!hanamiBucket) {
      return {
        available: false,
        error: '找不到 hanami-media bucket'
      };
    }
    
    return { available: true };
  } catch (error) {
    return {
      available: false,
      error: error instanceof Error ? error.message : '未知錯誤'
    };
  }
};

// 測試 Storage 功能
export const testStorageFunctionality = async (): Promise<{
  success: boolean;
  tests: {
    upload: boolean;
    read: boolean;
    delete: boolean;
  };
  error?: string;
}> => {
  const tests = {
    upload: false,
    read: false,
    delete: false
  };
  
  try {
    // 測試上傳
    const testFile = new Blob(['Storage test content'], { type: 'text/plain' });
    const testPath = 'test/storage-test.txt';
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('hanami-media')
      .upload(testPath, testFile);
    
    if (uploadError) {
      return {
        success: false,
        tests,
        error: `上傳測試失敗: ${uploadError.message}`
      };
    }
    
    tests.upload = true;
    
    // 測試讀取
    const { data: urlData } = supabase.storage
      .from('hanami-media')
      .getPublicUrl(testPath);
    
    if (urlData.publicUrl) {
      tests.read = true;
    }
    
    // 測試刪除
    const { error: deleteError } = await supabase.storage
      .from('hanami-media')
      .remove([testPath]);
    
    if (deleteError) {
      return {
        success: false,
        tests,
        error: `刪除測試失敗: ${deleteError.message}`
      };
    }
    
    tests.delete = true;
    
    return {
      success: true,
      tests
    };
  } catch (error) {
    return {
      success: false,
      tests,
      error: error instanceof Error ? error.message : '測試過程中發生錯誤'
    };
  }
};

// 初始化 Storage（實際上是測試功能）
export const initializeStorage = async (): Promise<{
  success: boolean;
  message: string;
  tests?: any;
}> => {
  console.log('開始檢查 Storage 設定...');
  
  // 檢查 Storage 是否可用
  const availabilityCheck = await checkStorageAvailable();
  if (!availabilityCheck.available) {
    return {
      success: false,
      message: `Storage 不可用: ${availabilityCheck.error}`
    };
  }
  
  // 測試功能
  const functionalityTest = await testStorageFunctionality();
  if (!functionalityTest.success) {
    return {
      success: false,
      message: `功能測試失敗: ${functionalityTest.error}`
    };
  }
  
  return {
    success: true,
    message: 'Storage 設定正確，所有功能正常',
    tests: functionalityTest.tests
  };
};

// 檢查 Storage 是否已初始化
export const checkStorageInitialized = async (): Promise<boolean> => {
  try {
    const availabilityCheck = await checkStorageAvailable();
    if (!availabilityCheck.available) {
      return false;
    }
    
    const functionalityTest = await testStorageFunctionality();
    return functionalityTest.success;
  } catch (error) {
    console.error('檢查 Storage 狀態時發生錯誤:', error);
    return false;
  }
};

// 獲取 Storage 使用統計
export const getStorageStats = async (): Promise<{
  totalFiles: number;
  totalSize: number;
  folders: string[];
  bucketInfo: any;
}> => {
  try {
    // 獲取 bucket 資訊
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      throw bucketsError;
    }
    
    const hanamiBucket = buckets.find(bucket => bucket.name === 'hanami-media');
    
    // 列出檔案
    const { data: files, error: listError } = await supabase.storage
      .from('hanami-media')
      .list('', { limit: 1000 });
    
    if (listError) {
      throw listError;
    }
    
    const fileList = files || [];
    const totalSize = fileList.reduce((sum, file) => sum + (file.metadata?.size || 0), 0);
    
    // 從檔案路徑中提取資料夾
    const folders = [...new Set(
      fileList
        .map(file => file.name.split('/')[0])
        .filter(folder => folder && !folder.includes('.'))
    )];
    
    return {
      totalFiles: fileList.length,
      totalSize,
      folders,
      bucketInfo: hanamiBucket
    };
  } catch (error) {
    console.error('獲取 Storage 統計失敗:', error);
    return {
      totalFiles: 0,
      totalSize: 0,
      folders: [],
      bucketInfo: null
    };
  }
};

// 清理測試檔案
export const cleanupTestFiles = async (): Promise<{
  success: boolean;
  deletedCount: number;
  error?: string;
}> => {
  try {
    const { data, error } = await supabase.storage
      .from('hanami-media')
      .list('', { limit: 1000 });
    
    if (error) {
      return {
        success: false,
        deletedCount: 0,
        error: `無法列出檔案: ${error.message}`
      };
    }
    
    const testFiles = data?.filter(file => 
      file.name.includes('test/') || 
      file.name.includes('.keep')
    ) || [];
    
    if (testFiles.length === 0) {
      return {
        success: true,
        deletedCount: 0
      };
    }
    
    const filePaths = testFiles.map(file => file.name);
    const { error: deleteError } = await supabase.storage
      .from('hanami-media')
      .remove(filePaths);
    
    if (deleteError) {
      return {
        success: false,
        deletedCount: 0,
        error: `刪除測試檔案失敗: ${deleteError.message}`
      };
    }
    
    return {
      success: true,
      deletedCount: testFiles.length
    };
  } catch (error) {
    return {
      success: false,
      deletedCount: 0,
      error: error instanceof Error ? error.message : '清理過程中發生錯誤'
    };
  }
}; 