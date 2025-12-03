import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { X, Calendar, Clock, FileText, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface LeaveRequest {
    id: string;
    lesson_date: string;
    leave_type: 'personal' | 'sick';
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    review_notes?: string;
    rejection_reason?: string;
    proof_url?: string;
}

interface StudentPendingRequestsModalProps {
    isOpen: boolean;
    onClose: () => void;
    studentId: string;
}

export default function StudentPendingRequestsModal({
    isOpen,
    onClose,
    studentId
}: StudentPendingRequestsModalProps) {
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && studentId) {
            fetchRequests();
        }
    }, [isOpen, studentId]);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/student/leave-requests?studentId=${studentId}`);
            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch requests');
            }
            setRequests(result.data || []);
        } catch (error) {
            console.error('Error fetching requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (requestId: string) => {
        if (!confirm('確定要取消此請假申請嗎？取消後將回復待確認堂數。')) {
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`/api/student/leave-requests/${requestId}`, {
                method: 'DELETE',
            });
            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to cancel request');
            }

            // Refresh list
            fetchRequests();
        } catch (error) {
            console.error('Error cancelling request:', error);
            alert('取消申請失敗，請稍後再試');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'approved': return 'text-green-600 bg-green-50 border-green-200';
            case 'rejected': return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'pending': return '待審核';
            case 'approved': return '已批准';
            case 'rejected': return '已拒絕';
            default: return status;
        }
    };

    const getLeaveTypeText = (type: string) => {
        return type === 'sick' ? '病假' : '事假';
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden max-h-[80vh] flex flex-col"
            >
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-[#FFF9F2]">
                    <h2 className="text-lg font-bold text-[#4B4036] flex items-center">
                        <Clock className="w-5 h-5 mr-2 text-[#E65100]" />
                        審核進度查詢
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-black/5 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-4 overflow-y-auto flex-1">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFD59A]"></div>
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <FileText className="w-12 h-12 mx-auto mb-2 opacity-20" />
                            <p>目前沒有任何申請記錄</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {requests.map((request) => (
                                <div
                                    key={request.id}
                                    className="border border-[#EADBC8] rounded-xl p-4 hover:shadow-md transition-shadow bg-white"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center">
                                            <div className={`px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor(request.status)}`}>
                                                {getStatusText(request.status)}
                                            </div>
                                            <span className="mx-2 text-gray-300">|</span>
                                            <span className="text-sm font-medium text-[#4B4036]">
                                                {getLeaveTypeText(request.leave_type)}
                                            </span>
                                        </div>
                                        <span className="text-xs text-gray-400">
                                            申請於 {format(new Date(request.created_at), 'yyyy/MM/dd')}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center text-[#4B4036]">
                                            <Calendar className="w-4 h-4 mr-2 text-[#FFD59A]" />
                                            <span className="font-bold">
                                                {format(new Date(request.lesson_date), 'yyyy年MM月dd日')}
                                            </span>
                                        </div>

                                        {request.status === 'pending' && (
                                            <button
                                                onClick={() => handleCancel(request.id)}
                                                className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors border border-red-200"
                                            >
                                                取消申請
                                            </button>
                                        )}
                                    </div>

                                    {request.status === 'rejected' && request.rejection_reason && (
                                        <div className="mt-3 bg-red-50 p-3 rounded-lg border border-red-100">
                                            <div className="flex items-start">
                                                <AlertCircle className="w-4 h-4 text-red-500 mr-2 mt-0.5" />
                                                <div>
                                                    <p className="text-xs font-bold text-red-700 mb-1">拒絕原因：</p>
                                                    <p className="text-sm text-red-600">{request.rejection_reason}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {request.review_notes && (
                                        <div className="mt-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                            <p className="text-xs font-bold text-gray-500 mb-1">審核備註：</p>
                                            <p className="text-sm text-gray-600">{request.review_notes}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
