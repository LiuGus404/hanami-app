// 電話號碼和電郵驗證工具函數

// 國碼選項
export const countryCodes = [
  { code: '+852', country: '香港', flag: '🇭🇰' },
  { code: '+86', country: '中國', flag: '🇨🇳' },
  { code: '+886', country: '台灣', flag: '🇹🇼' },
  { code: '+65', country: '新加坡', flag: '🇸🇬' },
  { code: '+60', country: '馬來西亞', flag: '🇲🇾' },
  { code: '+66', country: '泰國', flag: '🇹🇭' },
  { code: '+84', country: '越南', flag: '🇻🇳' },
  { code: '+63', country: '菲律賓', flag: '🇵🇭' },
  { code: '+62', country: '印尼', flag: '🇮🇩' },
  { code: '+1', country: '美國/加拿大', flag: '🇺🇸' },
  { code: '+44', country: '英國', flag: '🇬🇧' },
  { code: '+81', country: '日本', flag: '🇯🇵' },
  { code: '+82', country: '韓國', flag: '🇰🇷' },
  { code: '+61', country: '澳洲', flag: '🇦🇺' },
  { code: '+64', country: '紐西蘭', flag: '🇳🇿' }
];

// 電話號碼格式驗證
export const validatePhoneNumber = (phoneNumber: string, countryCode: string): { isValid: boolean; error?: string } => {
  if (!phoneNumber.trim()) {
    return { isValid: false, error: '請輸入電話號碼' };
  }

  // 移除所有非數字字符
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  
  if (cleanPhone.length === 0) {
    return { isValid: false, error: '電話號碼不能為空' };
  }

  // 根據國碼驗證格式
  switch (countryCode) {
    case '+852': // 香港
      if (cleanPhone.length !== 8) {
        return { isValid: false, error: '香港電話號碼應為8位數字' };
      }
      if (!/^[2-9]\d{7}$/.test(cleanPhone)) {
        return { isValid: false, error: '香港電話號碼格式不正確' };
      }
      break;
      
    case '+86': // 中國
      if (cleanPhone.length !== 11) {
        return { isValid: false, error: '中國手機號碼應為11位數字' };
      }
      if (!/^1[3-9]\d{9}$/.test(cleanPhone)) {
        return { isValid: false, error: '中國手機號碼格式不正確' };
      }
      break;
      
    case '+886': // 台灣
      if (cleanPhone.length !== 9 && cleanPhone.length !== 10) {
        return { isValid: false, error: '台灣手機號碼應為9-10位數字' };
      }
      if (!/^09\d{8}$/.test(cleanPhone)) {
        return { isValid: false, error: '台灣手機號碼格式不正確' };
      }
      break;
      
    case '+65': // 新加坡
      if (cleanPhone.length !== 8) {
        return { isValid: false, error: '新加坡電話號碼應為8位數字' };
      }
      if (!/^[689]\d{7}$/.test(cleanPhone)) {
        return { isValid: false, error: '新加坡電話號碼格式不正確' };
      }
      break;
      
    case '+60': // 馬來西亞
      if (cleanPhone.length !== 9 && cleanPhone.length !== 10) {
        return { isValid: false, error: '馬來西亞手機號碼應為9-10位數字' };
      }
      if (!/^1[0-9]\d{7,8}$/.test(cleanPhone)) {
        return { isValid: false, error: '馬來西亞手機號碼格式不正確' };
      }
      break;
      
    case '+1': // 美國/加拿大
      if (cleanPhone.length !== 10) {
        return { isValid: false, error: '美國/加拿大電話號碼應為10位數字' };
      }
      if (!/^[2-9]\d{2}[2-9]\d{2}\d{4}$/.test(cleanPhone)) {
        return { isValid: false, error: '美國/加拿大電話號碼格式不正確' };
      }
      break;
      
    case '+44': // 英國
      if (cleanPhone.length !== 10 && cleanPhone.length !== 11) {
        return { isValid: false, error: '英國電話號碼應為10-11位數字' };
      }
      break;
      
    case '+81': // 日本
      if (cleanPhone.length !== 11) {
        return { isValid: false, error: '日本手機號碼應為11位數字' };
      }
      if (!/^0[789]0\d{8}$/.test(cleanPhone)) {
        return { isValid: false, error: '日本手機號碼格式不正確' };
      }
      break;
      
    case '+82': // 韓國
      if (cleanPhone.length !== 11) {
        return { isValid: false, error: '韓國手機號碼應為11位數字' };
      }
      if (!/^01[0-9]\d{8}$/.test(cleanPhone)) {
        return { isValid: false, error: '韓國手機號碼格式不正確' };
      }
      break;
      
    case '+61': // 澳洲
      if (cleanPhone.length !== 9) {
        return { isValid: false, error: '澳洲手機號碼應為9位數字' };
      }
      if (!/^4\d{8}$/.test(cleanPhone)) {
        return { isValid: false, error: '澳洲手機號碼格式不正確' };
      }
      break;
      
    case '+64': // 紐西蘭
      if (cleanPhone.length !== 9) {
        return { isValid: false, error: '紐西蘭手機號碼應為9位數字' };
      }
      if (!/^2[0-9]\d{7}$/.test(cleanPhone)) {
        return { isValid: false, error: '紐西蘭手機號碼格式不正確' };
      }
      break;
      
    default:
      // 其他國碼的基本驗證
      if (cleanPhone.length < 7 || cleanPhone.length > 15) {
        return { isValid: false, error: '電話號碼長度應為7-15位數字' };
      }
      break;
  }

  return { isValid: true };
};

// 電郵格式驗證
export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  if (!email.trim()) {
    return { isValid: false, error: '請輸入電郵地址' };
  }

  // 基本格式檢查
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: '電郵地址格式不正確' };
  }

  // 檢查長度
  if (email.length > 254) {
    return { isValid: false, error: '電郵地址過長' };
  }

  // 檢查本地部分長度
  const localPart = email.split('@')[0];
  if (localPart.length > 64) {
    return { isValid: false, error: '電郵地址用戶名部分過長' };
  }

  // 檢查是否包含連續的點
  if (email.includes('..')) {
    return { isValid: false, error: '電郵地址不能包含連續的點' };
  }

  // 檢查是否以點開始或結束
  if (email.startsWith('.') || email.endsWith('.')) {
    return { isValid: false, error: '電郵地址不能以點開始或結束' };
  }

  // 檢查域名部分
  const domainPart = email.split('@')[1];
  if (domainPart.startsWith('.') || domainPart.endsWith('.')) {
    return { isValid: false, error: '域名不能以點開始或結束' };
  }

  return { isValid: true };
};

// 格式化電話號碼顯示
export const formatPhoneNumber = (phoneNumber: string, countryCode: string): string => {
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  
  switch (countryCode) {
    case '+852': // 香港
      if (cleanPhone.length === 8) {
        return `${cleanPhone.slice(0, 4)} ${cleanPhone.slice(4)}`;
      }
      break;
      
    case '+86': // 中國
      if (cleanPhone.length === 11) {
        return `${cleanPhone.slice(0, 3)} ${cleanPhone.slice(3, 7)} ${cleanPhone.slice(7)}`;
      }
      break;
      
    case '+886': // 台灣
      if (cleanPhone.length === 10) {
        return `${cleanPhone.slice(0, 4)} ${cleanPhone.slice(4, 7)} ${cleanPhone.slice(7)}`;
      }
      break;
      
    case '+1': // 美國/加拿大
      if (cleanPhone.length === 10) {
        return `(${cleanPhone.slice(0, 3)}) ${cleanPhone.slice(3, 6)}-${cleanPhone.slice(6)}`;
      }
      break;
  }
  
  return cleanPhone;
};
