import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    XMarkIcon,
    HeartIcon,
    ArrowPathIcon,
    UserIcon,
    PuzzlePieceIcon,
    ChatBubbleLeftRightIcon,
    PhotoIcon,
    StarIcon,
    PaperAirplaneIcon,
    TrashIcon,
    PencilIcon,
    CheckIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid, StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { MindBlock, MindBlockType } from '@/types/mind-block';
import { getSaasSupabaseClient } from '@/lib/supabase';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface MindBlockDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    block: MindBlock | null;
    onLoadBlock: (block: MindBlock) => void;
}

// 積木類型配置
const blockTypeLabels: Record<string, string> = {
    'role': '角色',
    'style': '風格',
    'context': '背景',
    'rule': '規則',
    'task': '任務',
    'variable': '變數',
    'search': '搜尋',
    'reason': '推理',
    'output': '輸出'
};

const blockTypeConfig: Record<string, { icon: any; color: string; bg: string; borderColor: string }> = {
    'role': { icon: UserIcon, color: 'text-purple-600', bg: 'bg-purple-100', borderColor: 'border-purple-300' },
    'style': { icon: PaintBrushIcon, color: 'text-pink-600', bg: 'bg-pink-100', borderColor: 'border-pink-300' },
    'context': { icon: DocumentTextIcon, color: 'text-blue-600', bg: 'bg-blue-100', borderColor: 'border-blue-300' },
    'rule': { icon: ExclamationTriangleIcon, color: 'text-red-600', bg: 'bg-red-100', borderColor: 'border-red-300' },
    'task': { icon: CubeIcon, color: 'text-amber-600', bg: 'bg-amber-100', borderColor: 'border-amber-300' },
    'search': { icon: MagnifyingGlassIcon, color: 'text-cyan-600', bg: 'bg-cyan-100', borderColor: 'border-cyan-300' },
    'reason': { icon: LightBulbIcon, color: 'text-yellow-600', bg: 'bg-yellow-100', borderColor: 'border-yellow-300' },
    'variable': { icon: PuzzlePieceIcon, color: 'text-indigo-600', bg: 'bg-indigo-100', borderColor: 'border-indigo-300' },
    'output': { icon: SparklesIcon, color: 'text-emerald-600', bg: 'bg-emerald-100', borderColor: 'border-emerald-300' }
};

const getBlockTypes = (b: MindBlock): string[] => {
    if (b.category === 'Composition' && b.content_json?.blocks) {
        return b.content_json.blocks.map((blk: any) => blk.type).filter(Boolean);
    }
    return b.block_type ? [b.block_type] : [];
};

interface Review {
    id: string;
    user_id: string;
    rating: number;
    content: string;
    image_url?: string;
    created_at: string;
    user?: {
        full_name: string;
        avatar_url?: string;
    };
}

export default function MindBlockDetailModal({ isOpen, onClose, block, onLoadBlock }: MindBlockDetailModalProps) {
    const supabase = getSaasSupabaseClient();
    const { user: currentUser } = useSaasAuth();
    const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details'); // Merged examples into reviews
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [newReview, setNewReview] = useState('');
    const [newRating, setNewRating] = useState(5);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Description Editing State
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [description, setDescription] = useState('');
    const [descriptionSaving, setDescriptionSaving] = useState(false);

    // Reset state when block changes
    useEffect(() => {
        if (block) {
            setLikesCount(block.likes_count || 0);
            setIsLiked(false);
            setReviews([]);
            setNewReview('');
            setNewRating(5);
            setSelectedImage(null);
            setImagePreview(null);
            setDescription(block.description || '');
            setIsEditingDescription(false);

            checkLikeStatus();
            fetchReviews();
        }
    }, [block, currentUser]);

    const checkLikeStatus = async () => {
        if (!currentUser || !block) return;

        const { data, error } = await supabase
            .from('mind_block_likes' as any)
            .select('id')
            .eq('user_id', currentUser.id)
            .eq('mind_block_id', block.id)
            .maybeSingle();

        if (!error && data) {
            setIsLiked(true);
        }
    };

    const fetchReviews = async () => {
        if (!block) return;
        setLoadingReviews(true);

        try {
            // 1. Fetch reviews
            const { data: reviewsData, error } = await supabase
                .from('mind_block_reviews' as any)
                .select('*')
                .eq('mind_block_id', block.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (!reviewsData || reviewsData.length === 0) {
                setReviews([]);
                return;
            }

            // 2. Fetch user details for these reviews
            const userIds = Array.from(new Set(reviewsData.map((r: any) => r.user_id)));
            const { data: usersData, error: usersError } = await supabase
                .from('saas_users')
                .select('id, full_name, avatar_url')
                .in('id', userIds);

            if (usersError) console.error('Error fetching users:', usersError);

            // 3. Merge data
            const userMap = (usersData || []).reduce((acc: any, user: any) => {
                acc[user.id] = user;
                return acc;
            }, {});

            const fullReviews = reviewsData.map((r: any) => ({
                ...r,
                user: userMap[r.user_id] || { full_name: '未知用戶' }
            }));

            setReviews(fullReviews);
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoadingReviews(false);
        }
    };

    if (!isOpen || !block) return null;

    const handleLike = async () => {
        if (!currentUser) {
            toast.error('請先登入');
            return;
        }

        // Optimistic update
        const previousLiked = isLiked;
        const previousCount = likesCount;

        setIsLiked(!isLiked);
        setLikesCount(prev => isLiked ? prev - 1 : prev + 1);

        try {
            if (previousLiked) {
                // Unlike
                const { error } = await supabase
                    .from('mind_block_likes' as any)
                    .delete()
                    .eq('user_id', currentUser.id)
                    .eq('mind_block_id', block.id);
                if (error) throw error;
            } else {
                // Like
                const { error } = await supabase
                    .from('mind_block_likes' as any)
                    .insert({
                        user_id: currentUser.id,
                        mind_block_id: block.id
                    });
                if (error) throw error;
            }
        } catch (error) {
            console.error('Error toggling like:', error);
            // Revert on error
            setIsLiked(previousLiked);
            setLikesCount(previousCount);
            toast.error('操作失敗，請稍後再試');
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast.error('圖片大小不能超過 5MB');
                return;
            }
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmitReview = async () => {
        if (!currentUser) {
            toast.error('請先登入');
            return;
        }
        if (!newReview.trim()) return;

        setSubmitting(true);
        try {
            let imageUrl = null;

            // Upload image if selected
            if (selectedImage) {
                const fileExt = selectedImage.name.split('.').pop();
                const fileName = `${block.id}/${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('mind-block-assets')
                    .upload(fileName, selectedImage);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('mind-block-assets')
                    .getPublicUrl(fileName);

                imageUrl = publicUrl;
            }

            // Insert review
            const { data, error } = await supabase
                .from('mind_block_reviews' as any)
                .insert({
                    user_id: currentUser.id,
                    mind_block_id: block.id,
                    rating: newRating,
                    content: newReview,
                    image_url: imageUrl
                })
                .select()
                .single();

            if (error) throw error;
            if (!data) throw new Error('No data returned');

            // Update local state
            const newReviewObj: Review = {
                ...(data as any),
                user: {
                    full_name: currentUser.full_name || '我',
                    avatar_url: currentUser.avatar_url
                }
            };

            setReviews([newReviewObj, ...reviews]);
            setNewReview('');
            setSelectedImage(null);
            setImagePreview(null);
            toast.success('評價已發佈！');

        } catch (error: any) {
            console.error('Error submitting review:', error);
            toast.error(error.message || '發佈評價失敗');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteReview = async (reviewId: string) => {
        if (!confirm('確定要刪除這則評價嗎？')) return;

        try {
            const { error } = await supabase
                .from('mind_block_reviews' as any)
                .delete()
                .eq('id', reviewId);

            if (error) throw error;

            setReviews(reviews.filter(r => r.id !== reviewId));
            toast.success('評價已刪除');
        } catch (error: any) {
            console.error('Error deleting review:', error);
            toast.error('刪除失敗');
        }
    };

    const handleSaveDescription = async () => {
        if (!block || !currentUser) return;
        setDescriptionSaving(true);

        try {
            const { error } = await supabase
                .from('mind_blocks' as any)
                .update({ description: description })
                .eq('id', block.id);

            if (error) throw error;

            block.description = description; // Update local block object reference if needed
            setIsEditingDescription(false);
            toast.success('描述已更新');
        } catch (error: any) {
            console.error('Error updating description:', error);
            toast.error('更新失敗');
        } finally {
            setDescriptionSaving(false);
        }
    };

    const isOwner = currentUser && block.user_id === currentUser.id;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 md:inset-10 z-[70] flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-full md:h-auto md:max-h-[90vh] flex flex-col pointer-events-auto overflow-hidden border border-[#EADBC8]">
                            {/* Header */}
                            <div className="p-6 border-b border-[#EADBC8] flex justify-between items-start bg-[#FFF9F2]/50 flex-shrink-0">
                                <div className="flex items-start gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FFB6C1]/20 to-[#FFD59A]/20 flex items-center justify-center border border-[#EADBC8]">
                                        <PuzzlePieceIcon className="w-8 h-8 text-[#4B4036]" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-[#4B4036] mb-1">{block.title}</h2>
                                        <div className="flex items-center gap-4 text-sm text-[#4B4036]/60">
                                            <div className="flex items-center gap-1">
                                                <UserIcon className="w-4 h-4" />
                                                <span>{block.user_id === 'system' ? '官方' : `用戶 ${block.user_id.substring(0, 6)}...`}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <ArrowPathIcon className="w-4 h-4" />
                                                <span>{block.usage_count || 0} 次使用</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <HeartIconSolid className="w-4 h-4 text-red-400" />
                                                <span>{likesCount} 個讚</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-[#EADBC8]/20 rounded-full transition-colors"
                                >
                                    <XMarkIcon className="w-6 h-6 text-[#4B4036]" />
                                </button>
                            </div>

                            {/* Content - Scrollable */}
                            <div className="flex-1 overflow-y-auto p-6 bg-[#FAFAFA]">
                                {/* Visual Block Display */}
                                <div className="bg-white p-8 rounded-2xl border border-[#EADBC8] shadow-sm mb-8 flex justify-center items-center min-h-[160px] bg-[url('/assets/grid-pattern.png')] bg-repeat">
                                    <div className="flex items-center gap-4 flex-wrap justify-center">
                                        {getBlockTypes(block).map((type, idx) => {
                                            const config = blockTypeConfig[type] || { icon: PuzzlePieceIcon, color: 'text-gray-600', bg: 'bg-gray-100', borderColor: 'border-gray-300' };
                                            const Icon = config.icon;
                                            return (
                                                <motion.div
                                                    key={idx}
                                                    initial={{ scale: 0, y: 20 }}
                                                    animate={{ scale: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.1 }}
                                                    className="relative group"
                                                >
                                                    <div className={`
                                                        w-20 h-20 rounded-2xl ${config.bg} ${config.color}
                                                        border-2 ${config.borderColor}
                                                        flex flex-col items-center justify-center gap-1
                                                        shadow-lg transform transition-transform group-hover:-translate-y-1
                                                    `}>
                                                        <Icon className="w-8 h-8" />
                                                        <span className="text-xs font-bold">{blockTypeLabels[type] || type}</span>
                                                    </div>
                                                    {/* Connector Line */}
                                                    {idx < getBlockTypes(block).length - 1 && (
                                                        <div className="absolute top-1/2 -right-6 w-6 h-1 bg-[#EADBC8] -z-10" />
                                                    )}
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="mb-8 group relative">
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="text-lg font-bold text-[#4B4036] flex items-center gap-2">
                                            <DocumentTextIcon className="w-5 h-5" />
                                            積木描述
                                        </h3>
                                        {isOwner && !isEditingDescription && (
                                            <button
                                                onClick={() => setIsEditingDescription(true)}
                                                className="text-sm text-[#4B4036]/60 hover:text-[#FFD59A] flex items-center gap-1 transition-colors"
                                            >
                                                <PencilIcon className="w-4 h-4" />
                                                編輯
                                            </button>
                                        )}
                                    </div>

                                    {isEditingDescription ? (
                                        <div className="bg-white p-4 rounded-xl border border-[#EADBC8] shadow-sm">
                                            <textarea
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                className="w-full min-h-[100px] p-2 border border-[#EADBC8] rounded-lg focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent outline-none resize-none mb-3"
                                                placeholder="輸入描述..."
                                            />
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => {
                                                        setDescription(block.description || '');
                                                        setIsEditingDescription(false);
                                                    }}
                                                    className="px-3 py-1.5 text-sm text-[#4B4036]/60 hover:bg-gray-100 rounded-lg transition-colors"
                                                >
                                                    取消
                                                </button>
                                                <button
                                                    onClick={handleSaveDescription}
                                                    disabled={descriptionSaving}
                                                    className="px-3 py-1.5 text-sm bg-[#FFD59A] text-[#4B4036] rounded-lg font-bold hover:bg-[#FFC880] transition-colors flex items-center gap-1"
                                                >
                                                    {descriptionSaving ? '儲存中...' : (
                                                        <>
                                                            <CheckIcon className="w-4 h-4" />
                                                            儲存
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-[#4B4036]/80 leading-relaxed bg-white p-4 rounded-xl border border-[#EADBC8] whitespace-pre-wrap">
                                            {description || '沒有描述。'}
                                        </p>
                                    )}
                                </div>

                                {/* Reviews & Examples Section - Only show if public */}
                                {block.is_public && (
                                    <div>
                                        <h3 className="text-lg font-bold text-[#4B4036] mb-4 flex items-center gap-2">
                                            <ChatBubbleLeftRightIcon className="w-5 h-5" />
                                            評價與成功案例
                                        </h3>

                                        {/* Write Review Box */}
                                        <div className="bg-white p-6 rounded-xl border border-[#EADBC8] shadow-sm mb-6">
                                            <div className="flex gap-2 mb-4">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <button
                                                        key={star}
                                                        onClick={() => setNewRating(star)}
                                                        className="focus:outline-none transition-transform hover:scale-110"
                                                    >
                                                        <StarIconSolid className={`w-6 h-6 ${star <= newRating ? 'text-yellow-400' : 'text-gray-200'}`} />
                                                    </button>
                                                ))}
                                            </div>
                                            <textarea
                                                value={newReview}
                                                onChange={(e) => setNewReview(e.target.value)}
                                                placeholder="分享您的使用心得，或是貼上成功案例..."
                                                className="w-full p-3 rounded-lg border border-[#EADBC8] focus:ring-2 focus:ring-[#FFD59A] focus:border-transparent outline-none min-h-[100px] mb-3 resize-none"
                                            />

                                            {/* Image Preview */}
                                            {imagePreview && (
                                                <div className="mb-3 relative inline-block">
                                                    <img src={imagePreview} alt="Preview" className="h-20 w-auto rounded-lg border border-[#EADBC8]" />
                                                    <button
                                                        onClick={() => {
                                                            setSelectedImage(null);
                                                            setImagePreview(null);
                                                            if (fileInputRef.current) fileInputRef.current.value = '';
                                                        }}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
                                                    >
                                                        <XMarkIcon className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            )}

                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <input
                                                        type="file"
                                                        ref={fileInputRef}
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={handleImageSelect}
                                                    />
                                                    <button
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="flex items-center gap-2 px-4 py-2 text-[#4B4036]/60 hover:bg-[#FFF9F2] rounded-lg transition-colors text-sm font-medium"
                                                    >
                                                        <PhotoIcon className="w-5 h-5" />
                                                        {selectedImage ? '更換圖片' : '加入圖片 (選填)'}
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={handleSubmitReview}
                                                    disabled={!newReview.trim() || submitting}
                                                    className="px-6 py-2 bg-[#FFD59A] text-[#4B4036] rounded-lg font-bold hover:bg-[#FFC880] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                                                >
                                                    {submitting ? (
                                                        <div className="w-4 h-4 border-2 border-[#4B4036] border-t-transparent rounded-full animate-spin" />
                                                    ) : (
                                                        <PaperAirplaneIcon className="w-4 h-4" />
                                                    )}
                                                    發佈評價
                                                </button>
                                            </div>
                                        </div>

                                        {/* Reviews List */}
                                        <div className="space-y-4">
                                            {loadingReviews ? (
                                                <div className="text-center py-8 text-[#4B4036]/40">載入評價中...</div>
                                            ) : reviews.length === 0 ? (
                                                <div className="text-center py-8 text-[#4B4036]/40 bg-white rounded-xl border border-dashed border-[#EADBC8]">
                                                    還沒有評價，成為第一個分享的人吧！
                                                </div>
                                            ) : (
                                                reviews.map(review => (
                                                    <div key={review.id} className="bg-white p-5 rounded-xl border border-[#EADBC8] shadow-sm group relative">
                                                        {/* Delete Button */}
                                                        {currentUser && review.user_id === currentUser.id && (
                                                            <button
                                                                onClick={() => handleDeleteReview(review.id)}
                                                                className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                                                title="刪除評價"
                                                            >
                                                                <TrashIcon className="w-4 h-4" />
                                                            </button>
                                                        )}

                                                        <div className="flex justify-between items-start mb-3">
                                                            <div className="flex items-center gap-3">
                                                                {review.user?.avatar_url ? (
                                                                    <img src={review.user.avatar_url} alt={review.user.full_name} className="w-10 h-10 rounded-full border border-[#EADBC8]" />
                                                                ) : (
                                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FFF9F2] to-[#EADBC8] flex items-center justify-center border border-[#EADBC8]">
                                                                        <UserIcon className="w-5 h-5 text-[#4B4036]/60" />
                                                                    </div>
                                                                )}
                                                                <div>
                                                                    <div className="font-bold text-[#4B4036] text-sm">{review.user?.full_name || '未知用戶'}</div>
                                                                    <div className="text-xs text-[#4B4036]/40">{new Date(review.created_at).toLocaleDateString()}</div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-0.5 bg-[#FFF9F2] px-2 py-1 rounded-full mr-8">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <StarIconSolid key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'text-yellow-400' : 'text-gray-200'}`} />
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <p className="text-[#4B4036]/80 text-sm leading-relaxed mb-3 pl-[52px] whitespace-pre-wrap">{review.content}</p>

                                                        {/* Image Display */}
                                                        {review.image_url && (
                                                            <div className="pl-[52px]">
                                                                <div className="relative w-full max-w-xs h-40 bg-gray-100 rounded-lg overflow-hidden border border-[#EADBC8] group/image cursor-pointer">
                                                                    <img src={review.image_url} alt="Review attachment" className="w-full h-full object-cover transition-transform group-hover/image:scale-105" />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t border-[#EADBC8] bg-white flex justify-between items-center flex-shrink-0">
                                {block.is_public ? (
                                    <button
                                        onClick={handleLike}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors ${isLiked
                                                ? 'bg-red-50 border-red-200 text-red-500'
                                                : 'bg-white border-[#EADBC8] text-[#4B4036]/60 hover:bg-gray-50'
                                            }`}
                                    >
                                        {isLiked ? <HeartIconSolid className="w-5 h-5" /> : <HeartIcon className="w-5 h-5" />}
                                        <span className="font-bold">{likesCount}</span>
                                    </button>
                                ) : (
                                    <div className="text-sm text-[#4B4036]/40 italic">
                                        私人積木
                                    </div>
                                )}

                                <button
                                    onClick={() => onLoadBlock(block)}
                                    className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white rounded-xl font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all"
                                >
                                    <PuzzlePieceIcon className="w-5 h-5" />
                                    載入此積木
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )
            }
        </AnimatePresence >
    );
}

// Helper icon imports (ensure all used icons are imported)
import {
    DocumentTextIcon,
    CubeIcon,
    PaintBrushIcon,
    ExclamationTriangleIcon,
    MagnifyingGlassIcon,
    LightBulbIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';
