import { useState, useEffect } from 'react';
import { HanamiButton } from '@/components/ui/HanamiButton';
import { HanamiInput } from '@/components/ui/HanamiInput';
import { HanamiSelect } from '@/components/ui/HanamiSelect';
import { toast } from 'react-hot-toast';
import { addDays, isBefore, isAfter, parseISO } from 'date-fns';
import { Loader2, Upload, X } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { Lesson } from '@/types';

interface LeaveApplicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    studentId: string;
    orgId: string | null;
    lessons: Lesson[];
    onSuccess: () => void;
}

export default function LeaveApplicationModal({
    isOpen,
    onClose,
    studentId,
    orgId,
    lessons,
    onSuccess,
}: LeaveApplicationModalProps) {
    const [leaveType, setLeaveType] = useState<'personal' | 'sick'>('personal');
    const [selectedLessonId, setSelectedLessonId] = useState<string>('');
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [eligibleLessons, setEligibleLessons] = useState<Lesson[]>([]);

    // Filter eligible lessons based on leave type
    useEffect(() => {
        const now = new Date();
        const filtered = lessons.filter((lesson) => {
            if (!lesson.lesson_date) return false;
            
            // 排除已請假的課堂
            if (lesson.lesson_status === '請假') {
                return false;
            }
            
            const lessonDate = parseISO(lesson.lesson_date); // Assuming lesson.lesson_date is YYYY-MM-DD or ISO string

            if (leaveType === 'personal') {
                // Personal leave: > 72 hours notice
                const minNoticeDate = addDays(now, 3);
                return isAfter(lessonDate, minNoticeDate);
            } else {
                // Sick leave: +/- 7 days window
                const minDate = addDays(now, -7);
                const maxDate = addDays(now, 7);
                return isAfter(lessonDate, minDate) && isBefore(lessonDate, maxDate);
            }
        });
        setEligibleLessons(filtered);
        setSelectedLessonId(''); // Reset selection when type changes
    }, [leaveType, lessons]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const uploadProof = async (file: File): Promise<string | null> => {
        try {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
            const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
            const supabase = createClient(supabaseUrl, supabaseKey);

            const fileExt = file.name.split('.').pop();
            const fileName = `${studentId}/${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('leave-proofs')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('leave-proofs').getPublicUrl(filePath);
            return data.publicUrl;
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('文件上傳失敗');
            return null;
        }
    };

    const handleSubmit = async () => {
        if (!selectedLessonId) {
            toast.error('請選擇課堂');
            return;
        }

        if (leaveType === 'sick' && !file) {
            toast.error('病假需上傳醫生證明');
            return;
        }

        if (!orgId) {
            toast.error('無法確認機構 ID');
            return;
        }

        setSubmitting(true);
        let proofUrl = null;

        try {
            if (leaveType === 'sick' && file) {
                setUploading(true);
                proofUrl = await uploadProof(file);
                setUploading(false);
                if (!proofUrl) {
                    setSubmitting(false);
                    return;
                }
            }

            const selectedLesson = lessons.find(l => l.id === selectedLessonId);
            if (!selectedLesson) throw new Error('Lesson not found');

            const response = await fetch('/api/student/leave-application', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    studentId,
                    orgId,
                    lessonId: selectedLessonId,
                    lessonDate: selectedLesson.lesson_date,
                    leaveType,
                    proofUrl,
                }),
            });

            const result = await response.json();

            if (result.success) {
                toast.success('申請提交成功');
                onSuccess();
                onClose();
            } else {
                toast.error(result.error || '申請提交失敗');
            }
        } catch (error) {
            console.error('Submit error:', error);
            toast.error('發生錯誤，請稍後再試');
        } finally {
            setSubmitting(false);
            setUploading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-[#4B4036]">請假申請</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Leave Type Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-[#4B4036]">請假類型</label>
                        <div className="flex space-x-4">
                            <label className={`flex-1 cursor-pointer border-2 rounded-xl p-3 flex items-center justify-center transition-all ${leaveType === 'personal'
                                ? 'border-[#FFD59A] bg-[#FFF9F2] text-[#4B4036]'
                                : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                }`}>
                                <input
                                    type="radio"
                                    name="leaveType"
                                    value="personal"
                                    checked={leaveType === 'personal'}
                                    onChange={() => setLeaveType('personal')}
                                    className="sr-only"
                                />
                                <span className="font-medium">事假</span>
                            </label>

                            <label className={`flex-1 cursor-pointer border-2 rounded-xl p-3 flex items-center justify-center transition-all ${leaveType === 'sick'
                                ? 'border-[#FFD59A] bg-[#FFF9F2] text-[#4B4036]'
                                : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                }`}>
                                <input
                                    type="radio"
                                    name="leaveType"
                                    value="sick"
                                    checked={leaveType === 'sick'}
                                    onChange={() => setLeaveType('sick')}
                                    className="sr-only"
                                />
                                <span className="font-medium">病假</span>
                            </label>
                        </div>
                        <p className="text-xs text-gray-500">
                            {leaveType === 'personal'
                                ? '需於 72 小時前申請，待審批。'
                                : '需於課堂前後 7 天內申請，並上傳醫生證明，待審批。'}
                        </p>
                    </div>

                    {/* Lesson Selection */}
                    <div className="space-y-2">
                        <HanamiSelect
                            label="選擇課堂"
                            value={selectedLessonId}
                            onChange={(value) => setSelectedLessonId(value)}
                            options={eligibleLessons.map(lesson => ({
                                value: lesson.id,
                                label: `${lesson.lesson_date} (${lesson.actual_timeslot || lesson.regular_timeslot || '未設定時間'})`
                            }))}
                            placeholder={eligibleLessons.length > 0 ? "請選擇要請假的課堂" : "無符合條件的課堂"}
                            disabled={eligibleLessons.length === 0}
                        />
                    </div>

                    {/* File Upload (Sick Leave Only) */}
                    {leaveType === 'sick' && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[#4B4036]">醫生證明</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#FFD59A] transition-colors cursor-pointer relative">
                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="flex flex-col items-center space-y-2 text-gray-500">
                                    <Upload className="w-8 h-8 text-gray-400" />
                                    <span className="text-sm">
                                        {file ? file.name : '點擊上傳或拖放文件'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-gray-50 flex justify-end space-x-3">
                    <HanamiButton
                        variant="secondary"
                        onClick={onClose}
                        disabled={submitting}
                    >
                        取消
                    </HanamiButton>
                    <HanamiButton
                        variant="primary"
                        onClick={handleSubmit}
                        loading={submitting || uploading}
                        disabled={!selectedLessonId || (leaveType === 'sick' && !file)}
                    >
                        提交申請
                    </HanamiButton>
                </div>
            </div>
        </div>
    );
}
