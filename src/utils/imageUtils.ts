/**
 * 圖片網址工具函數
 * 用於統一管理 hanamiecho.com 網域的圖片路徑
 */

export type ImageFolder = 'image' | 'gemini' | 'avatars' | 'resources';

/**
 * 生成 hanamiecho.com 網域的圖片網址
 * @param fileName 檔案名稱
 * @param folder 資料夾類型，預設為 'image'
 * @returns 完整的圖片網址
 */
export const getImageUrl = (
  fileName: string, 
  folder: ImageFolder = 'image'
): string => {
  return `https://hanamiecho.com/${folder}/${fileName}`;
};

/**
 * 將 Supabase 原始網址轉換為 hanamiecho.com 網址
 * @param supabaseUrl Supabase 原始網址
 * @returns 轉換後的 hanamiecho.com 網址，如果無法轉換則返回原網址
 */
export const replaceSupabaseUrl = (supabaseUrl: string): string => {
  const supabasePattern = /https:\/\/laowyqplcthwqckyigiy\.supabase\.co\/storage\/v1\/object\/public\/([^/]+)\/(.+)/;
  const match = supabaseUrl.match(supabasePattern);
  
  if (match) {
    const [, folder, fileName] = match;
    return `https://hanamiecho.com/${folder}/${fileName}`;
  }
  
  return supabaseUrl;
};

/**
 * 批量替換字串中的 Supabase 網址
 * @param content 包含網址的字串內容
 * @returns 替換後的內容
 */
export const replaceAllSupabaseUrls = (content: string): string => {
  const supabasePattern = /https:\/\/laowyqplcthwqckyigiy\.supabase\.co\/storage\/v1\/object\/public\/([^/]+)\/([^"\s]+)/g;
  
  return content.replace(supabasePattern, (match, folder, fileName) => {
    return `https://hanamiecho.com/${folder}/${fileName}`;
  });
};

/**
 * 檢查網址是否為 Supabase 原始網址
 * @param url 要檢查的網址
 * @returns 是否為 Supabase 網址
 */
export const isSupabaseUrl = (url: string): boolean => {
  return url.includes('laowyqplcthwqckyigiy.supabase.co');
};

/**
 * 檢查網址是否為 hanamiecho.com 網址
 * @param url 要檢查的網址
 * @returns 是否為 hanamiecho.com 網址
 */
export const isHanamiEchoUrl = (url: string): boolean => {
  return url.includes('hanamiecho.com');
};

/**
 * 根據檔案類型自動選擇合適的資料夾
 * @param fileName 檔案名稱
 * @returns 建議的資料夾類型
 */
export const getSuggestedFolder = (fileName: string): ImageFolder => {
  const lowerFileName = fileName.toLowerCase();
  
  if (lowerFileName.includes('gemini') || lowerFileName.includes('ai_generated')) {
    return 'gemini';
  }
  
  if (lowerFileName.includes('avatar') || lowerFileName.includes('profile')) {
    return 'avatars';
  }
  
  if (lowerFileName.includes('resource') || lowerFileName.includes('document')) {
    return 'resources';
  }
  
  return 'image';
};

/**
 * 生成帶有時間戳的檔案名稱
 * @param prefix 檔案前綴
 * @param extension 檔案副檔名
 * @returns 帶時間戳的檔案名稱
 */
export const generateTimestampFileName = (
  prefix: string = 'image',
  extension: string = 'png'
): string => {
  const timestamp = Date.now();
  const cleanPrefix = prefix.replace(/[^a-zA-Z0-9]/g, '_');
  return `${cleanPrefix}_${timestamp}.${extension}`;
};

/**
 * 圖片網址常數
 */
export const IMAGE_URLS = {
  // 預設圖片
  DEFAULT_AVATAR: getImageUrl('default_avatar.png', 'avatars'),
  DEFAULT_IMAGE: getImageUrl('default_image.png', 'image'),
  
  // 常用圖片路徑
  GEMINI_IMAGES: (fileName: string) => getImageUrl(fileName, 'gemini'),
  USER_AVATARS: (fileName: string) => getImageUrl(fileName, 'avatars'),
  RESOURCES: (fileName: string) => getImageUrl(fileName, 'resources'),
} as const;

/**
 * 圖片網址驗證
 * @param url 要驗證的網址
 * @returns 驗證結果
 */
export const validateImageUrl = (url: string): {
  isValid: boolean;
  isHanamiEcho: boolean;
  isSupabase: boolean;
  suggestedUrl?: string;
} => {
  const isHanamiEcho = isHanamiEchoUrl(url);
  const isSupabase = isSupabaseUrl(url);
  const isValid = isHanamiEcho || isSupabase;
  
  let suggestedUrl: string | undefined;
  if (isSupabase && !isHanamiEcho) {
    suggestedUrl = replaceSupabaseUrl(url);
  }
  
  return {
    isValid,
    isHanamiEcho,
    isSupabase,
    suggestedUrl
  };
};
