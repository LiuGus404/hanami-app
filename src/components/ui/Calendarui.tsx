import React, { useState } from 'react';

interface CalendaruiProps {
  value?: Date[] | string; // 支援多選日期陣列或單選字串
  onChange?: (dates: Date[]) => void; // 多選回調
  onSelect?: (date: string) => void; // 單選回調（向後相容）
  onClose?: () => void; // 關閉回調
  className?: string;
  multiple?: boolean; // 是否為多選模式
}

const getToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const getMonthDays = (year: number, month: number) => {
  const days = [];
  const lastDay = new Date(year, month + 1, 0);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  return days;
};

const formatDateLocal = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const Calendarui: React.FC<CalendaruiProps> = ({ 
  value, 
  onChange, 
  onSelect, 
  onClose, 
  className, 
  multiple = false 
}) => {
  const today = getToday();
  
  // 處理初始值
  const getInitialSelectedDates = (): Date[] => {
    if (!value) return [];
    
    if (multiple && Array.isArray(value)) {
      return value;
    } else if (!multiple && typeof value === 'string') {
      return [new Date(value)];
    } else if (Array.isArray(value)) {
      return value;
    }
    
    return [];
  };

  const [selectedDates, setSelectedDates] = useState<Date[]>(getInitialSelectedDates);
  
  const [calendarMonth, setCalendarMonth] = useState(() => {
    if (value) {
      if (Array.isArray(value) && value.length > 0) {
        const d = value[0];
        return { year: d.getFullYear(), month: d.getMonth() };
      } else if (typeof value === 'string') {
        const d = new Date(value);
        return { year: d.getFullYear(), month: d.getMonth() };
      }
    }
    return { year: today.getFullYear(), month: today.getMonth() };
  });

  const monthDays = getMonthDays(calendarMonth.year, calendarMonth.month);
  const firstDayOfWeek = new Date(calendarMonth.year, calendarMonth.month, 1).getDay();

  const handlePrevMonth = () => {
    setCalendarMonth(prev => {
      const m = prev.month - 1;
      if (m < 0) return { year: prev.year - 1, month: 11 };
      return { year: prev.year, month: m };
    });
  };
  
  const handleNextMonth = () => {
    setCalendarMonth(prev => {
      const m = prev.month + 1;
      if (m > 11) return { year: prev.year + 1, month: 0 };
      return { year: prev.year, month: m };
    });
  };

  const handleDateClick = (date: Date) => {
    if (multiple) {
      const dateStr = formatDateLocal(date);
      const isSelected = selectedDates.some(d => formatDateLocal(d) === dateStr);
      
      let newSelectedDates: Date[];
      if (isSelected) {
        // 移除日期
        newSelectedDates = selectedDates.filter(d => formatDateLocal(d) !== dateStr);
      } else {
        // 添加日期
        newSelectedDates = [...selectedDates, date];
      }
      
      setSelectedDates(newSelectedDates);
      
      if (onChange) {
        onChange(newSelectedDates);
      }
    } else {
      // 單選模式
      const dateStr = formatDateLocal(date);
      if (onSelect) {
        onSelect(dateStr);
      }
    }
  };

  const getCellClass = (date: Date) => {
    const dateStr = formatDateLocal(date);
    const isToday = date.getTime() === today.getTime();
    
    let isSelected = false;
    if (multiple) {
      isSelected = selectedDates.some(d => formatDateLocal(d) === dateStr);
    } else if (typeof value === 'string') {
      isSelected = value === dateStr;
    }
    
    return [
      'w-12 h-12 flex items-center justify-center rounded-2xl cursor-pointer select-none font-semibold transition-all duration-150 text-base',
      isToday ? 'border-2 border-[#EAC29D] text-[#EAC29D]' : 'text-[#4B4036]',
      isSelected ? 'bg-[#EAC29D] text-white shadow-lg scale-110' : 'bg-white hover:bg-[#FDE6B8]',
    ].join(' ');
  };

  const handleConfirm = () => {
    if (multiple && onChange) {
      onChange(selectedDates);
    }
    if (onClose) {
      onClose();
    }
  };

  const handleCancel = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#FFFDF8] border border-[#D8CDBF] rounded-[24px] shadow-xl text-[#4B4036] max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* 標題區域 */}
        <div className="p-6 pb-4">
          <h2 className="text-xl font-bold text-center text-[#4B4036]">
            {multiple ? '選擇多個日期' : '選擇日期'}
          </h2>
        </div>
        
        {/* 顯示已選擇的日期 */}
        {multiple && selectedDates.length > 0 && (
          <div className="px-6 pb-4">
            <div className="p-3 bg-[#F3F0E5] rounded-lg border border-[#EADBC8]">
              <div className="text-sm font-medium mb-2 text-[#4B4036]">已選擇：</div>
              <div className="flex flex-wrap gap-2">
                {selectedDates.map((date, index) => (
                  <span key={index} className="text-xs bg-[#E8E3D5] px-2 py-1 rounded-full text-[#4B4036] border border-[#D8CDBF]">
                    {date.toLocaleDateString('zh-TW')}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* 日曆區域 */}
        <div className="px-6 pb-4 flex-1 overflow-y-auto">
          <div className={className || ''}>
            {/* 月份導航 */}
            <div className="flex items-center justify-between mb-4">
              <button 
                className="w-10 h-10 rounded-full bg-[#FFF9F2] border border-[#EADBC8] text-[#EAC29D] font-bold text-lg hover:bg-[#FDE6B8] transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md" 
                onClick={handlePrevMonth}
              >
                ◀
              </button>
              <span className="font-bold text-[#4B4036] text-lg">
                {calendarMonth.year} 年 {calendarMonth.month + 1} 月
              </span>
              <button 
                className="w-10 h-10 rounded-full bg-[#FFF9F2] border border-[#EADBC8] text-[#EAC29D] font-bold text-lg hover:bg-[#FDE6B8] transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md" 
                onClick={handleNextMonth}
              >
                ▶
              </button>
            </div>
            
            {/* 星期標題 */}
            <div className="grid grid-cols-7 gap-2 mb-3">
              {['日', '一', '二', '三', '四', '五', '六'].map((w, i) => (
                <div key={i} className="text-center text-sm text-[#A68A64] font-bold h-8 flex items-center justify-center">
                  {w}
                </div>
              ))}
            </div>
            
            {/* 日期網格 */}
            <div className="grid grid-cols-7 gap-2">
              {Array(Math.max(0, firstDayOfWeek)).fill(null).map((_, i) => (
                <div key={i} className="w-12 h-12" />
              ))}
              {monthDays.map((date, i) => {
                return (
                  <div
                    key={formatDateLocal(date)}
                    className={getCellClass(date)}
                    onClick={() => handleDateClick(date)}
                  >
                    {date.getDate()}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* 按鈕區域 */}
        <div className="p-6 pt-4 border-t border-[#EADBC8] bg-[#FFF9F2]">
          <div className="flex justify-around gap-3">
            <button
              className="flex-1 px-6 py-3 border-2 border-[#FFD59A] bg-transparent text-[#A68A64] font-semibold rounded-2xl transition-all duration-200 shadow-sm hover:bg-[#FFF9F2] hover:border-[#FFB6C1] hover:text-[#FFB6C1] active:scale-95 active:shadow-lg focus:outline-none mr-2"
              onClick={handleCancel}
            >
              取消
            </button>
            <button
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#FFD59A] via-[#FFB6C1] to-[#EBC9A4] text-[#4B4036] font-bold rounded-2xl shadow-md hover:from-[#FFB6C1] hover:to-[#FFD59A] hover:shadow-xl active:scale-95 active:shadow-2xl transition-all duration-200 focus:outline-none ml-2"
              onClick={handleConfirm}
            >
              確定
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendarui; 