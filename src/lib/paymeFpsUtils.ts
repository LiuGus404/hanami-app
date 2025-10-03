// PAYME FPS 支付工具函數

import { PaymeFpsAccount, PaymentInfo, PaymeFpsAccountsListResponse } from '@/types/payme-fps';

// 獲取機構的主要 PAYME FPS 帳戶資訊
export const getPrimaryPaymeFpsAccount = async (
  institutionName: string = 'Hanami Music Academy'
): Promise<PaymentInfo | null> => {
  try {
    // 首先嘗試查找指定的機構名稱
    let response = await fetch(
      `/api/admin/payme-fps-accounts?institution_name=${encodeURIComponent(institutionName)}&active_only=true`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    let result: PaymeFpsAccountsListResponse = await response.json();
    
    // 如果沒找到指定機構的資料，嘗試查找其他可能的機構名稱
    if (!result.success || !result.data || result.data.length === 0) {
      console.log(`未找到機構 "${institutionName}" 的資料，嘗試查找其他機構...`);
      
      // 嘗試不同的機構名稱
      const alternativeNames = ['HanamiEcho', 'Hanami Music Academy', 'Hanami'];
      
      for (const altName of alternativeNames) {
        if (altName !== institutionName) {
          console.log(`嘗試查找機構: ${altName}`);
          response = await fetch(
            `/api/admin/payme-fps-accounts?institution_name=${encodeURIComponent(altName)}&active_only=true`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );
          
          result = await response.json();
          if (result.success && result.data && result.data.length > 0) {
            console.log(`找到機構 "${altName}" 的資料`);
            break;
          }
        }
      }
      
      // 如果還是沒找到，嘗試獲取所有活躍帳戶
      if (!result.success || !result.data || result.data.length === 0) {
        console.log('嘗試獲取所有活躍帳戶...');
        response = await fetch(
          `/api/admin/payme-fps-accounts?active_only=true`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        
        result = await response.json();
      }
    }
    
    if (!result.success || !result.data) {
      console.error('獲取 PAYME FPS 帳戶失敗:', result.error);
      return null;
    }

    // 找到主要帳戶
    const primaryAccount = result.data.find(account => account.is_primary);
    
    if (!primaryAccount) {
      console.warn('未找到主要 PAYME FPS 帳戶');
      // 如果沒有主要帳戶，使用第一個帳戶
      if (result.data.length > 0) {
        console.log('使用第一個可用帳戶');
        const firstAccount = result.data[0];
        return {
          payme_phone: firstAccount.payme_phone,
          payme_name: firstAccount.payme_name,
          payme_link: firstAccount.payme_link,
          fps_phone: firstAccount.fps_phone,
          fps_name: firstAccount.fps_name,
          fps_link: firstAccount.fps_link,
          notes: firstAccount.notes
        };
      }
      return null;
    }

    return {
      payme_phone: primaryAccount.payme_phone,
      payme_name: primaryAccount.payme_name,
      payme_link: primaryAccount.payme_link,
      fps_phone: primaryAccount.fps_phone,
      fps_name: primaryAccount.fps_name,
      fps_link: primaryAccount.fps_link,
      notes: primaryAccount.notes
    };

  } catch (error) {
    console.error('獲取 PAYME FPS 帳戶資訊失敗:', error);
    return null;
  }
};

// 獲取所有活躍的 PAYME FPS 帳戶
export const getAllActivePaymeFpsAccounts = async (): Promise<PaymeFpsAccount[]> => {
  try {
    const response = await fetch(
      '/api/admin/payme-fps-accounts?active_only=true',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const result: PaymeFpsAccountsListResponse = await response.json();
    
    if (!result.success || !result.data) {
      console.error('獲取 PAYME FPS 帳戶列表失敗:', result.error);
      return [];
    }

    return result.data;

  } catch (error) {
    console.error('獲取 PAYME FPS 帳戶列表失敗:', error);
    return [];
  }
};

// 格式化 PAYME 電話號碼顯示
export const formatPaymePhone = (phone: string): string => {
  // 移除所有非數字字符
  const digits = phone.replace(/\D/g, '');
  
  // 如果是香港號碼格式，格式化顯示
  if (digits.startsWith('852')) {
    const localNumber = digits.substring(3);
    if (localNumber.length === 8) {
      return `+852 ${localNumber.substring(0, 4)} ${localNumber.substring(4)}`;
    }
  }
  
  // 如果是以 +852 開頭
  if (phone.startsWith('+852')) {
    const localNumber = phone.substring(4).replace(/\D/g, '');
    if (localNumber.length === 8) {
      return `+852 ${localNumber.substring(0, 4)} ${localNumber.substring(4)}`;
    }
  }
  
  return phone;
};

// 生成 PAYME 支付說明文字
export const generatePaymePaymentInstructions = (paymentInfo: PaymentInfo): string => {
  let instructions = `請轉帳至以下 PAYME 帳戶：\n\n`;
  
  instructions += `📱 PAYME 電話：${formatPaymePhone(paymentInfo.payme_phone)}\n`;
  instructions += `👤 收款人：${paymentInfo.payme_name}\n`;
  
  if (paymentInfo.payme_link) {
    instructions += `🔗 PAYME 連結：${paymentInfo.payme_link}\n`;
  }
  
  if (paymentInfo.fps_phone) {
    instructions += `\n💳 或轉數快至：${formatPaymePhone(paymentInfo.fps_phone)}\n`;
    if (paymentInfo.fps_name) {
      instructions += `👤 收款人：${paymentInfo.fps_name}\n`;
    }
  }
  
  if (paymentInfo.notes) {
    instructions += `\n📝 備註：${paymentInfo.notes}\n`;
  }
  
  instructions += `\n⚠️ 請保留付款截圖並上傳確認`;
  
  return instructions;
};

// 驗證 PAYME 電話號碼格式
export const validatePaymePhone = (phone: string): boolean => {
  // 移除所有非數字字符
  const digits = phone.replace(/\D/g, '');
  
  // 檢查是否為香港號碼格式
  if (digits.startsWith('852')) {
    return digits.length === 11; // 852 + 8位本地號碼
  }
  
  // 檢查是否為本地8位號碼
  if (digits.length === 8) {
    return /^[2-9]\d{7}$/.test(digits);
  }
  
  return false;
};
