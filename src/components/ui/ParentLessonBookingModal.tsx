'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    XMarkIcon,
    CalendarDaysIcon,
    ClockIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday, isBefore, startOfDay } from 'date-fns';
import { toast } from 'react-hot-toast';
import { getSupabaseClient } from '@/lib/supabase';

interface ParentLessonBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    studentId: string;
    studentName: string;
    orgId: string | null;
    courseType: string;
    onSuccess: () => void;
}

interface CalendarDay {
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    isPast: boolean;
    hasSchedule: boolean;
    availableSlots: number;
    isFullyBooked: boolean;
    isBeyondTwoMonths: boolean;
}

interface TimeSlot {
    time: string;
    isAvailable: boolean;
    remainingSpots: number;
    assignedTeachers?: string;
}

export default function ParentLessonBookingModal({
    isOpen,
    onClose,
    studentId,
    studentName,
    orgId,
    courseType,
    onSuccess
}: ParentLessonBookingModalProps) {
    const supabase = getSupabaseClient();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
    const [calendarData, setCalendarData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setCurrentMonth(new Date());
            setSelectedDate('');
            setSelectedTimeSlot('');
            setShowSuccess(false);
        }
    }, [isOpen]);

    // Fetch calendar data when month changes
    useEffect(() => {
        if (isOpen && orgId) {
            fetchCalendarData();
        }
    }, [currentMonth, isOpen, orgId, courseType]);

    const fetchCalendarData = async () => {
        try {
            setLoading(true);

            const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
            const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

            const response = await fetch('/api/calendar-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    startDate,
                    endDate,
                    isTrial: false, // This is for existing students
                    courseType,
                    orgId
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch calendar data');
            }

            const result = await response.json();
            // The API returns { success: true, data: [...] }
            setCalendarData(result.data || []);
        } catch (error) {
            console.error('Error fetching calendar data:', error);
            toast.error('無法載入課程表，請稍後再試');
        } finally {
            setLoading(false);
        }
    };

    const generateCalendarDays = useMemo(() => {
        const start = startOfWeek(startOfMonth(currentMonth));
        const end = endOfWeek(endOfMonth(currentMonth));
        const days = eachDayOfInterval({ start, end });
        const today = startOfDay(new Date());
        const twoMonthsLater = addMonths(new Date(), 2);

        return days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            // The API returns data with 'date' property
            const dayData = calendarData.find((d: any) => d.date === dateStr);

            const isPast = isBefore(day, today);
            const isBeyondTwoMonths = isBefore(twoMonthsLater, day);

            return {
                date: day,
                isCurrentMonth: isSameMonth(day, currentMonth),
                isToday: isSameDay(day, today),
                isPast,
                hasSchedule: !!dayData && dayData.hasSchedule,
                availableSlots: dayData?.availableSlots || 0,
                isFullyBooked: dayData?.isFullyBooked || false,
                isBeyondTwoMonths
            };
        });
    }, [currentMonth, calendarData]);

    const getTimeSlotsForDate = (dateStr: string): TimeSlot[] => {
        const dayData = calendarData.find((d: any) => d.date === dateStr);
        // The API returns 'timeSlots' array in the day object
        return dayData?.timeSlots || [];
    };

    const handleConfirm = async () => {
        if (!selectedDate || !selectedTimeSlot) return;

        try {
            setSubmitting(true);

            // 2. Call API to book lesson
            const response = await fetch('/api/book-parent-lesson', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    studentId,
                    // studentOid, fullName, regularWeekday are now fetched by the API
                    lessonDate: selectedDate,
                    timeSlot: selectedTimeSlot,
                    courseType,
                    orgId
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Booking API Error Details:', errorData);
                throw new Error(errorData.details || errorData.error || 'Booking failed');
            }

            setShowSuccess(true);
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 2000);

        } catch (error) {
            console.error('Booking failed:', error);
            toast.error('預約失敗，請稍後再試');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-6">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm"
                    onClick={onClose}
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-lg bg-[#FFFDF8] rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-[#EADBC8] flex items-center justify-between bg-[#FFF9F2]">
                        <div>
                            <h2 className="text-xl font-bold text-[#4B4036]">預約課堂</h2>
                            <p className="text-sm text-[#4B4036]/70">為 {studentName} 安排課堂</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-[#EADBC8]/20 rounded-full transition-colors"
                        >
                            <XMarkIcon className="w-6 h-6 text-[#4B4036]" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {showSuccess ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6"
                                >
                                    <CheckCircleIcon className="w-12 h-12 text-green-600" />
                                </motion.div>
                                <h3 className="text-2xl font-bold text-[#4B4036] mb-2">預約成功！</h3>
                                <p className="text-[#4B4036]/70">已成功為學生安排課堂</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Month Navigation */}
                                <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border border-[#EADBC8]">
                                    <button
                                        onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
                                        className="p-2 hover:bg-[#FFF9F2] rounded-lg transition-colors"
                                        disabled={isSameMonth(currentMonth, new Date())}
                                    >
                                        <ChevronLeftIcon className={`w-5 h-5 ${isSameMonth(currentMonth, new Date()) ? 'text-gray-300' : 'text-[#4B4036]'}`} />
                                    </button>
                                    <h3 className="text-lg font-bold text-[#4B4036]">
                                        {format(currentMonth, 'yyyy年MM月')}
                                    </h3>
                                    <button
                                        onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
                                        className="p-2 hover:bg-[#FFF9F2] rounded-lg transition-colors"
                                    >
                                        <ChevronRightIcon className="w-5 h-5 text-[#4B4036]" />
                                    </button>
                                </div>

                                {/* Calendar Grid */}
                                <div className="bg-white rounded-xl p-4 shadow-sm border border-[#EADBC8]">
                                    {loading ? (
                                        <div className="py-12 text-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFD59A] mx-auto mb-2"></div>
                                            <p className="text-sm text-gray-500">載入中...</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-7 gap-1 mb-2">
                                                {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                                                    <div key={d} className="text-center text-xs font-bold text-[#4B4036] py-2">
                                                        {d}
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="grid grid-cols-7 gap-1">
                                                {generateCalendarDays.map((day, idx) => {
                                                    const dateStr = format(day.date, 'yyyy-MM-dd');
                                                    const isSelected = selectedDate === dateStr;
                                                    const isDisabled = day.isPast || !day.isCurrentMonth || day.isBeyondTwoMonths;

                                                    return (
                                                        <button
                                                            key={idx}
                                                            disabled={isDisabled || day.isFullyBooked}
                                                            onClick={() => {
                                                                setSelectedDate(dateStr);
                                                                setSelectedTimeSlot('');
                                                            }}
                                                            className={`
                                relative h-14 rounded-lg flex flex-col items-center justify-center border transition-all
                                ${isSelected
                                                                    ? 'border-[#FFD59A] bg-[#FFF9F2] ring-2 ring-[#FFD59A] ring-offset-1'
                                                                    : isDisabled
                                                                        ? 'border-transparent bg-gray-50 text-gray-300'
                                                                        : 'border-gray-100 hover:border-[#FFD59A] hover:bg-[#FFF9F2]'
                                                                }
                              `}
                                                        >
                                                            <span className={`text-sm font-medium ${day.isToday ? 'text-[#FFD59A]' : ''}`}>
                                                                {format(day.date, 'd')}
                                                            </span>
                                                            {!isDisabled && (
                                                                <div className="mt-1">
                                                                    {day.isFullyBooked ? (
                                                                        <span className="text-[10px] text-red-500 font-medium">滿</span>
                                                                    ) : day.availableSlots > 0 ? (
                                                                        <span className="text-[10px] text-green-600 font-medium">{Math.min(day.availableSlots, 2)}空位</span>
                                                                    ) : (
                                                                        <span className="text-[10px] text-gray-400">-</span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Time Slots */}
                                <AnimatePresence mode="wait">
                                    {selectedDate && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="space-y-3"
                                        >
                                            <h4 className="font-bold text-[#4B4036] flex items-center gap-2">
                                                <ClockIcon className="w-5 h-5" />
                                                選擇時段 ({format(new Date(selectedDate), 'MM/dd')})
                                            </h4>

                                            {getTimeSlotsForDate(selectedDate).length > 0 ? (
                                                <div className="grid grid-cols-3 gap-3">
                                                    {getTimeSlotsForDate(selectedDate).map((slot, idx) => (
                                                        <button
                                                            key={idx}
                                                            disabled={!slot.isAvailable}
                                                            onClick={() => setSelectedTimeSlot(slot.time)}
                                                            className={`
                                p-3 rounded-xl border-2 text-sm font-medium transition-all
                                ${selectedTimeSlot === slot.time
                                                                    ? 'border-[#FFD59A] bg-[#FFF9F2] text-[#4B4036]'
                                                                    : slot.isAvailable
                                                                        ? 'border-[#EADBC8] bg-white hover:border-[#FFD59A]/50'
                                                                        : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                                                                }
                              `}
                                                        >
                                                            <div className="mb-1">{slot.time}</div>
                                                            <div className="text-xs font-normal opacity-70">
                                                                {slot.isAvailable ? `剩餘 ${Math.min(slot.remainingSpots, 2)}` : '已滿'}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                                    此日期暫無可用時段
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {!showSuccess && (
                        <div className="p-6 border-t border-[#EADBC8] bg-white">
                            <button
                                onClick={handleConfirm}
                                disabled={!selectedDate || !selectedTimeSlot || submitting}
                                className={`
                  w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all
                  ${!selectedDate || !selectedTimeSlot || submitting
                                        ? 'bg-gray-300 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-[#FFD59A] to-[#EBC9A4] hover:shadow-xl active:scale-[0.98]'
                                    }
                `}
                            >
                                {submitting ? '處理中...' : '確認預約'}
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
