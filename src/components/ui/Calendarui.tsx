import React, { useState } from 'react';

interface CalendaruiProps {
  value?: string; // YYYY-MM-DD
  onSelect: (date: string) => void;
  className?: string;
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

const Calendarui: React.FC<CalendaruiProps> = ({ value, onSelect, className }) => {
  const today = getToday();
  const [calendarMonth, setCalendarMonth] = useState(() => {
    if (value) {
      const d = new Date(value);
      return { year: d.getFullYear(), month: d.getMonth() };
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

  const getCellClass = (date: Date) => {
    const dateStr = formatDateLocal(date);
    const isToday = date.getTime() === today.getTime();
    const isSelected = value === dateStr;
    return [
      'w-12 h-12 flex items-center justify-center rounded-2xl cursor-pointer select-none font-semibold transition-all duration-150 text-base',
      isToday ? 'border-2 border-[#EAC29D] text-[#EAC29D]' : 'text-[#4B4036]',
      isSelected ? 'bg-[#EAC29D] text-white shadow-lg scale-110' : 'bg-white hover:bg-[#FDE6B8]',
    ].join(' ');
  };

  return (
    <div className={className || ''}>
      <div className="flex items-center justify-between mb-2 w-full max-w-md mx-auto">
        <button className="px-2 py-1 rounded-full bg-[#FFF9F2] border border-[#EADBC8] text-[#EAC29D] font-bold text-lg hover:bg-[#FDE6B8]" onClick={handlePrevMonth}>◀</button>
        <span className="font-bold text-[#4B4036]">{calendarMonth.year} 年 {calendarMonth.month + 1} 月</span>
        <button className="px-2 py-1 rounded-full bg-[#FFF9F2] border border-[#EADBC8] text-[#EAC29D] font-bold text-lg hover:bg-[#FDE6B8]" onClick={handleNextMonth}>▶</button>
      </div>
      <div className="grid grid-cols-7 gap-2 mb-1 w-full max-w-md mx-auto">
        {['日', '一', '二', '三', '四', '五', '六'].map((w, i) => (
          <div key={i} className="text-center text-xs text-[#A68A64] font-bold w-12 h-8 flex items-center justify-center">{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2 w-full max-w-md mx-auto">
        {Array(firstDayOfWeek).fill(null).map((_, i) => (
          <div key={i} className="w-12 h-12" />
        ))}
        {monthDays.map((date, i) => {
          const dateStr = formatDateLocal(date);
          return (
            <div
              key={dateStr}
              className={getCellClass(date)}
              onClick={() => onSelect(dateStr)}
            >
              {date.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendarui; 