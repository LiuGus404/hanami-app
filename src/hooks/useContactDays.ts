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
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/contact-days/${encodeURIComponent(phoneNumber)}`);
        if (response.ok) {
          const data = await response.json();
          setContactDays(data);
        }
      } catch (error) {
        console.error('獲取聯繫天數失敗:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContactDays();
  }, [phoneNumber]);

  return { contactDays, loading };
}
