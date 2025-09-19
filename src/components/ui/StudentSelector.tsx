'use client';
import React, { useState, useEffect } from 'react';
import HanamiInput from './HanamiInput';
import { HanamiSelect } from './HanamiSelect';

interface Student {
  id: string;
  full_name: string;
  nick_name?: string;
  student_age?: number;
  gender?: string;
  contact_number?: string;
  student_email?: string;
  parent_email?: string;
  school?: string;
  student_type?: string;
  course_type?: string;
  student_teacher?: string;
  regular_weekday?: number;
  regular_timeslot?: string;
  started_date?: string;
  trial_status?: string;
  table_source: 'regular' | 'trial';
}

interface StudentSelectorProps {
  selectedStudents: string[];
  onSelectionChange: (studentIds: string[]) => void;
  className?: string;
}

export default function StudentSelector({ 
  selectedStudents, 
  onSelectionChange, 
  className = '' 
}: StudentSelectorProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    studentType: 'all', // 'all', 'regular', 'trial'
    courseType: 'all',
    weekday: 'all',
    gender: 'all'
  });

  // 載入學生數據
  useEffect(() => {
    const loadStudents = async () => {
      try {
        setLoading(true);
        
        // 載入常規學生
        const regularResponse = await fetch('/api/students');
        const regularStudents = await regularResponse.json();
        
        // 載入試聽學生
        const trialResponse = await fetch('/api/trial-students');
        const trialStudents = await trialResponse.json();
        
        // 合併並標記來源
        const allStudents = [
          ...regularStudents.map((s: any) => ({ ...s, table_source: 'regular' as const })),
          ...trialStudents.map((s: any) => {
            // 處理試堂學生的星期幾資料
            let weekday = null;
            if (s.lesson_date) {
              // 如果有 lesson_date，從日期計算星期幾
              const lessonDate = new Date(s.lesson_date);
              weekday = lessonDate.getDay(); // 0=日, 1=一, ..., 6=六
            } else if (s.weekday) {
              // 如果有 weekday 欄位，轉換為數字
              weekday = parseInt(s.weekday);
            } else if (s.regular_weekday) {
              // 如果有 regular_weekday 欄位，轉換為數字
              weekday = parseInt(s.regular_weekday);
            }

            return {
              ...s,
              regular_weekday: weekday, // 統一使用 regular_weekday 欄位
              table_source: 'trial' as const
            };
          })
        ];
        
        setStudents(allStudents);
        setFilteredStudents(allStudents);
      } catch (error) {
        console.error('載入學生數據失敗:', error);
        // 如果API不可用，使用模擬數據
        const mockStudents: Student[] = [
          {
            id: '1',
            full_name: '張小明',
            nick_name: '小明',
            student_age: 8,
            gender: '男',
            contact_number: '0912-345-678',
            student_email: 'xiaoming@example.com',
            parent_email: 'parent1@example.com',
            school: '台北國小',
            student_type: 'regular',
            course_type: '鋼琴',
            student_teacher: '王老師',
            regular_weekday: 1,
            regular_timeslot: '14:00-15:00',
            started_date: '2024-01-15',
            table_source: 'regular'
          },
          {
            id: '2',
            full_name: '李小華',
            nick_name: '小華',
            student_age: 10,
            gender: '女',
            contact_number: '0923-456-789',
            student_email: 'xiaohua@example.com',
            parent_email: 'parent2@example.com',
            school: '台北國小',
            student_type: 'regular',
            course_type: '小提琴',
            student_teacher: '李老師',
            regular_weekday: 3,
            regular_timeslot: '16:00-17:00',
            started_date: '2024-02-01',
            table_source: 'regular'
          },
          {
            id: '3',
            full_name: '王小美',
            nick_name: '小美',
            student_age: 7,
            gender: '女',
            contact_number: '0934-567-890',
            student_email: 'xiaomei@example.com',
            parent_email: 'parent3@example.com',
            school: '台北國小',
            student_type: 'trial',
            course_type: '鋼琴',
            trial_status: 'pending',
            table_source: 'trial'
          },
          {
            id: '4',
            full_name: '陳小強',
            nick_name: '小強',
            student_age: 9,
            gender: '男',
            contact_number: '0945-678-901',
            student_email: 'xiaoqiang@example.com',
            parent_email: 'parent4@example.com',
            school: '台北國小',
            student_type: 'trial',
            course_type: '吉他',
            trial_status: 'approved',
            table_source: 'trial'
          }
        ];
        setStudents(mockStudents);
        setFilteredStudents(mockStudents);
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, []);

  // 篩選和搜尋邏輯
  useEffect(() => {
    let filtered = students;

    // 搜尋篩選
    if (searchQuery) {
      filtered = filtered.filter(student =>
        student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.nick_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.contact_number?.includes(searchQuery) ||
        student.student_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.parent_email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 學生類型篩選
    if (filters.studentType !== 'all') {
      filtered = filtered.filter(student => student.table_source === filters.studentType);
    }

    // 課程類型篩選
    if (filters.courseType !== 'all') {
      filtered = filtered.filter(student => student.course_type === filters.courseType);
    }

    // 星期幾篩選
    if (filters.weekday !== 'all') {
      filtered = filtered.filter(student => student.regular_weekday?.toString() === filters.weekday);
    }

    // 性別篩選
    if (filters.gender !== 'all') {
      filtered = filtered.filter(student => student.gender === filters.gender);
    }

    setFilteredStudents(filtered);
  }, [students, searchQuery, filters]);

  // 切換學生選擇
  const toggleStudent = (studentId: string) => {
    const newSelection = selectedStudents.includes(studentId)
      ? selectedStudents.filter(id => id !== studentId)
      : [...selectedStudents, studentId];
    onSelectionChange(newSelection);
  };

  // 全選/取消全選
  const toggleAllStudents = () => {
    if (selectedStudents.length === filteredStudents.length) {
      onSelectionChange([]);
    } else {
      const allIds = filteredStudents.map(s => s.id);
      onSelectionChange(allIds);
    }
  };

  // 獲取唯一值列表
  const getUniqueValues = (field: keyof Student) => {
    const values = students.map(s => s[field]).filter(Boolean);
    return Array.from(new Set(values));
  };

  const [courseTypes, setCourseTypes] = useState<string[]>([]);
  const weekdays = getUniqueValues('regular_weekday');

  // 將月齡轉換為歲數的函數
  const convertMonthsToAge = (months: number | null): string => {
    if (months === null || months === undefined) return '未知';
    
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (years === 0) {
      return `${remainingMonths}個月`;
    } else if (remainingMonths === 0) {
      return `${years}歲`;
    } else {
      return `${years}歲${remainingMonths}個月`;
    }
  };

  // 載入課程類型
  useEffect(() => {
    const loadCourseTypes = async () => {
      try {
        const response = await fetch('/api/course-types');
        const data = await response.json();
        if (response.ok && Array.isArray(data)) {
          setCourseTypes(data.map((course: any) => course.name).filter(Boolean));
        } else {
          // 如果 API 失敗，使用學生數據中的課程類型作為備用
          setCourseTypes(getUniqueValues('course_type').map(String).filter(Boolean));
        }
      } catch (error) {
        console.error('載入課程類型失敗:', error);
        // 使用學生數據中的課程類型作為備用
        setCourseTypes(getUniqueValues('course_type').map(String).filter(Boolean));
      }
    };
    
    loadCourseTypes();
  }, []);

  if (loading) {
    return (
      <div className={`p-4 bg-[#FFF9F2] rounded-lg ${className}`}>
        <div className="text-center text-[#4B4036]">載入學生數據中...</div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 搜尋和篩選區域 */}
      <div className="space-y-3">
        {/* 搜尋框 */}
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <HanamiInput
            value={searchQuery}
            onChange={(value) => setSearchQuery(value)}
            placeholder="搜尋姓名、暱稱、電話或郵箱..."
            type="text"
            className="pl-10"
          />
        </div>

        {/* 篩選器 - 簡化為圖案＋文字 */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilters(prev => ({ ...prev, studentType: prev.studentType === 'all' ? 'regular' : prev.studentType === 'regular' ? 'trial' : 'all' }))}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              filters.studentType === 'all' 
                ? 'bg-[#FFF9F2] text-[#4B4036]' 
                : filters.studentType === 'regular'
                ? 'bg-green-100 text-green-700'
                : 'bg-blue-100 text-blue-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            {filters.studentType === 'all' ? '全部學生' : 
             filters.studentType === 'regular' ? '常規學生' : '試堂學生'}
          </button>

          <button
            type="button"
            onClick={() => {
              if (courseTypes.length === 0) return;
              setFilters(prev => {
                if (prev.courseType === 'all') {
                  return { ...prev, courseType: courseTypes[0] };
                } else {
                  const currentIndex = courseTypes.indexOf(prev.courseType);
                  const nextIndex = (currentIndex + 1) % courseTypes.length;
                  if (nextIndex === 0) {
                    return { ...prev, courseType: 'all' };
                  }
                  return { ...prev, courseType: courseTypes[nextIndex] };
                }
              });
            }}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              filters.courseType === 'all' 
                ? 'bg-[#FFF9F2] text-[#4B4036]' 
                : 'bg-purple-100 text-purple-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {filters.courseType === 'all' ? '全部課程' : filters.courseType}
          </button>

          <button
            type="button"
            onClick={() => setFilters(prev => ({ 
              ...prev, 
              weekday: prev.weekday === 'all' ? '0' : 
                       prev.weekday === '6' ? 'all' : 
                       String(Number(prev.weekday) + 1) 
            }))}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              filters.weekday === 'all' 
                ? 'bg-[#FFF9F2] text-[#4B4036]' 
                : 'bg-orange-100 text-orange-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {filters.weekday === 'all' ? '全部日期' : 
             `週${['日','一','二','三','四','五','六'][Number(filters.weekday)]}`}
          </button>

          <button
            type="button"
            onClick={() => setFilters(prev => ({ ...prev, gender: prev.gender === 'all' ? '男' : prev.gender === '男' ? '女' : 'all' }))}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              filters.gender === 'all' 
                ? 'bg-[#FFF9F2] text-[#4B4036]' 
                : filters.gender === '男'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-pink-100 text-pink-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {filters.gender === 'all' ? '全部性別' : filters.gender}
          </button>
        </div>
      </div>

      {/* 學生列表 */}
      <div className="bg-gradient-to-r from-[#FFF9F2] to-[#FFF3E0] rounded-lg border border-[#EADBC8]">
        <div className="p-3 border-b border-[#EADBC8] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#FFD59A] rounded-full"></div>
            <span className="text-sm font-medium text-[#4B4036]">
              學生列表 ({filteredStudents.length} 人)
            </span>
          </div>
          <button
            type="button"
            onClick={toggleAllStudents}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036] hover:from-[#EBC9A4] hover:to-[#FFD59A] transition-all duration-200 shadow-sm"
          >
            {selectedStudents.length === filteredStudents.length ? '取消全選' : '全選'}
          </button>
        </div>

        <div className="max-h-60 overflow-y-auto">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-hanami-text-secondary">
              <svg className="h-12 w-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <p>沒有找到符合條件的學生</p>
            </div>
          ) : (
            <div className="space-y-2 p-2">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedStudents.includes(student.id)
                      ? 'bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] border border-[#EADBC8] hover:border-[#FFD59A]'
                      : 'bg-gradient-to-r from-[#FFF9F2] to-[#FFF3E0] border border-[#EADBC8] hover:border-[#FFD59A]'
                  }`}
                  onClick={() => toggleStudent(student.id)}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => toggleStudent(student.id)}
                      className="h-4 w-4 text-[#FFD59A] border-[#EADBC8] rounded focus:ring-[#FFD59A]"
                    />
                    <div className="w-6 h-6 bg-gradient-to-br from-[#FFD59A] to-[#EBC9A4] rounded-full flex items-center justify-center shadow-sm">
                      <span className="text-[#4B4036] text-xs font-bold">
                        {student.full_name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-[#4B4036] text-sm">
                          {student.full_name}
                        </span>
                        {student.nick_name && (
                          <span className="text-xs text-[#2B3A3B] opacity-75">
                            ({student.nick_name})
                          </span>
                        )}
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          student.table_source === 'regular' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {student.table_source === 'regular' ? '常規' : '試堂'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-[#4B4036] bg-[#FFD59A] px-2 py-1 rounded-full">
                          {student.course_type} • {convertMonthsToAge(student.student_age ?? null)} • {student.gender}
                        </span>
                        {student.regular_weekday !== undefined && student.regular_weekday !== null && (
                          <span className="text-[#2B3A3B]">
                            週{['日','一','二','三','四','五','六'][student.regular_weekday]} {student.regular_timeslot}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#2B3A3B] opacity-60 mt-1">
                        {student.contact_number} • {student.student_email}
                      </div>
                    </div>
                  </div>
                  {selectedStudents.includes(student.id) && (
                    <div className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] text-[#4B4036]">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      已選擇
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 已選擇的學生摘要 */}
      {selectedStudents.length > 0 && (
        <div className="p-3 bg-gradient-to-r from-[#FFF9F2] to-[#FFF3E0] rounded-lg border border-[#EADBC8]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-[#FFD59A] rounded-full"></div>
            <span className="text-sm font-medium text-[#4B4036]">
              已選擇 {selectedStudents.length} 位學生
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-[#4B4036] bg-[#FFD59A] px-2 py-1 rounded-full">
              常規學生: {students.filter(s => selectedStudents.includes(s.id) && s.table_source === 'regular').length} 人
            </span>
            <span className="text-[#4B4036] bg-[#EBC9A4] px-2 py-1 rounded-full">
              試堂學生: {students.filter(s => selectedStudents.includes(s.id) && s.table_source === 'trial').length} 人
            </span>
          </div>
        </div>
      )}
    </div>
  );
} 