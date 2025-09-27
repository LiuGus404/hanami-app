import { useState, useEffect } from 'react';

interface ContactDaysData {
  daysSinceContact: number | null;
  lastContactTime: string | null;
  hasContact: boolean;
}

export function useContactDays(phoneNumber: string | null) {
  const [contactDays, setContactDays] = useState<ContactDaysData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContactDays = async () => {
      if (!phoneNumber) {
        setContactDays(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        console.log('正在獲取聯繫天數，電話號碼:', phoneNumber);
        const response = await fetch(`/api/contact-days/${encodeURIComponent(phoneNumber)}`);
        console.log('API 響應狀態:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('API 響應數據:', data);
          setContactDays(data);
        } else {
          console.error('API 響應錯誤:', response.status, response.statusText);
          const errorData = await response.text();
          console.error('錯誤詳情:', errorData);
          setContactDays(null);
        }
      } catch (error) {
        console.error('獲取聯繫天數失敗:', error);
        setContactDays(null);
      } finally {
        setLoading(false);
      }
    };

    fetchContactDays();
  }, [phoneNumber]);

  return { contactDays, loading };
}
