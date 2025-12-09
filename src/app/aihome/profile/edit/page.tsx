'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSaasAuth } from '@/hooks/saas/useSaasAuthSimple';
import { getSaasSupabaseClient } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User,
    Camera,
    Lock,
    Save,
    ArrowLeft,
    Loader2,
    Phone,
    Mail,
    CheckCircle2,
    AlertCircle,
    Eye,
    EyeOff,
    Image as ImageIcon
} from 'lucide-react';
import UnifiedRightContent from '@/components/UnifiedRightContent';
import { Bars3Icon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import AppSidebar from '@/components/AppSidebar';
import { useFoodDisplay } from '@/hooks/useFoodDisplay';

// Country Codes Data
const COUNTRY_CODES = [
    { code: '852', flag: '🇭🇰', name: 'Hong Kong' },
    { code: '86', flag: '🇨🇳', name: 'China' },
    { code: '853', flag: '🇲🇴', name: 'Macau' },
    { code: '886', flag: '🇹🇼', name: 'Taiwan' },
    { code: '1', flag: '🇺🇸', name: 'USA/Canada' },
    { code: '44', flag: '🇬🇧', name: 'UK' },
    { code: '81', flag: '🇯🇵', name: 'Japan' },
    { code: '82', flag: '🇰🇷', name: 'Korea' },
    { code: '65', flag: '🇸🇬', name: 'Singapore' },
    { code: '60', flag: '🇲🇾', name: 'Malaysia' },
    { code: '66', flag: '🇹🇭', name: 'Thailand' },
    { code: '61', flag: '🇦🇺', name: 'Australia' },
];

export default function ProfileEditPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useSaasAuth();
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { logout } = useSaasAuth();

    // Food Display Hook
    const { foodBalance, foodHistory, showFoodHistory, toggleFoodHistory, fetchFoodInfo } = useFoodDisplay(user?.id);

    // Form States
    const [formData, setFormData] = useState({
        full_name: '',
        phoneCode: '852',
        phoneNumber: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load User Data
    useEffect(() => {
        if (user) {
            if (user.id) fetchFoodInfo(); // Ensure food info is loaded

            // Parse Phone Number if it contains code
            let code = '852';
            let number = user.phone || '';

            // Simple heuristic: if starts with + and code exists in list
            if (number.startsWith('+')) {
                const match = COUNTRY_CODES.find(c => number.startsWith(`+${c.code}`));
                if (match) {
                    code = match.code;
                    number = number.replace(`+${code}`, '').trim();
                }
            }

            setFormData(prev => ({
                ...prev,
                full_name: user.full_name || '',
                phoneCode: code,
                phoneNumber: number,
            }));
            setAvatarPreview(user.avatar_url || null);
        }
    }, [user, fetchFoodInfo]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setMessage(null);
        setSaving(true);
        const supabase = getSaasSupabaseClient();

        try {
            // 1. Validate Password Change First (if provided)
            if (formData.newPassword) {
                if (!formData.currentPassword) throw new Error('Please enter your current password to change it.');
                if (formData.newPassword !== formData.confirmPassword) throw new Error('New passwords do not match.');
                if (formData.newPassword.length < 6) throw new Error('Password must be at least 6 characters.');

                // Verify Current Password by signing in
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email: user.email || '',
                    password: formData.currentPassword
                });

                if (signInError) throw new Error('Current password is incorrect.');

                // Update Password
                const { error: updateError } = await supabase.auth.updateUser({ password: formData.newPassword });
                if (updateError) throw updateError;
            }

            // 2. Upload Avatar (if changed)
            let finalAvatarUrl = user.avatar_url;
            if (avatarFile) {
                const fileExt = avatarFile.name.split('.').pop();
                const timestamp = Date.now();
                const fileName = `${user.id}-${timestamp}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, avatarFile, { upsert: true });

                if (uploadError) throw new Error(`Avatar Upload Failed: ${uploadError.message}. Ensure 'avatars' bucket exists.`);

                const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

                // Add a cache-buster query param to ensure immediate update in UI
                finalAvatarUrl = `${publicUrl}?t=${timestamp}`;
            }

            // 3. Update Profile Data
            const fullPhone = `+${formData.phoneCode}${formData.phoneNumber}`;

            const { error: profileError } = await supabase
                .from('saas_users')
                .update({
                    full_name: formData.full_name,
                    avatar_url: finalAvatarUrl,
                    phone: fullPhone,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (profileError) throw profileError;

            // 4. Cleanup Old Avatar (if changed and existed in our storage)
            if (avatarFile && user.avatar_url && user.avatar_url !== finalAvatarUrl) {
                // Check if the old URL is from our Supabase 'avatars' bucket
                if (user.avatar_url.includes('/avatars/')) {
                    try {
                        // Extract filename: .../avatars/userid-timestamp.ext -> userid-timestamp.ext
                        const oldPath = user.avatar_url.split('/avatars/').pop();
                        if (oldPath) {
                            const { error: removeError } = await supabase.storage
                                .from('avatars')
                                .remove([oldPath]);

                            if (removeError) console.error('Failed to remove old avatar:', removeError);
                        }
                    } catch (err) {
                        console.error('Error cleaning up old avatar:', err);
                        // Don't block success just because cleanup failed
                    }
                }
            }

            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' })); // Clear sensitive fields

            // Refresh user session data locally if needed or rely on SWR re-fetch
            // Redirect back after delay
            setTimeout(() => {
                router.push('/aihome/profile');
            }, 1500);

        } catch (error: any) {
            console.error('Error updating profile:', error);
            setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
        } finally {
            setSaving(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-[#FFF9F2] flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-[#FFF9F2] shadow-[6px_6px_12px_#E6D9C5,-6px_-6px_12px_#FFFFFF] flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full border-4 border-[#FFD59A] border-t-transparent animate-spin" />
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#FFF9F2] font-sans text-[#4B4036] flex flex-col overflow-hidden">
            {/* Sidebar */}
            <AppSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* Navbar - Unified AI Companions Style */}
            <nav className="w-full bg-white/80 backdrop-blur-sm border-b border-[#EADBC8] sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
                            <motion.button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="p-2 rounded-lg hover:bg-[#FFD59A]/20 transition-colors relative z-40 flex-shrink-0"
                            >
                                <Bars3Icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#4B4036]" />
                            </motion.button>
                            <div className="w-8 h-8 sm:w-10 sm:h-10 relative flex-shrink-0">
                                <Image src="/@hanami.png" alt="Logo" width={40} height={40} className="w-full h-full object-contain" />
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            {/* Food Display */}
                            <div className="relative mx-2">
                                <motion.button onClick={toggleFoodHistory} className="flex items-center space-x-1 px-3 py-1.5 bg-white/80 backdrop-blur-sm border border-[#FFD59A] rounded-full shadow-sm hover:shadow-md transition-all cursor-pointer">
                                    <img src="/apple-icon.svg" alt="Food" className="w-4 h-4" />
                                    <span className="text-sm font-bold text-[#4B4036]">{foodBalance}</span>
                                </motion.button>
                                <AnimatePresence>
                                    {showFoodHistory && (
                                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="absolute top-12 right-0 w-64 bg-white rounded-xl shadow-xl border border-[#EADBC8] p-3 z-50 overflow-hidden">
                                            <div className="text-xs font-bold text-[#8C7A6B] mb-2 px-1">Recent History</div>
                                            <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
                                                {foodHistory.length === 0 ? <div className="text-center text-xs text-gray-400 py-2">No history</div> : foodHistory.map((r: any) => (
                                                    <div key={r.id} className="flex justify-between text-xs p-2 bg-[#F8F5EC] rounded-lg">
                                                        <span>{r.amount > 0 ? '+' : ''}{r.amount}</span>
                                                        <span className="text-[#8C7A6B]">{new Date(r.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            <UnifiedRightContent user={user} onLogout={logout} onNavigate={() => { }} />
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="flex-1 w-full overflow-y-auto overflow-x-hidden p-6 lg:p-12 flex justify-center">
                <div className="w-full max-w-2xl space-y-8 pb-20">

                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <NeuButton onClick={() => router.back()} className="w-12 h-12 rounded-xl flex items-center justify-center !p-0">
                            <ArrowLeft className="w-5 h-5 text-[#8B7E74]" />
                        </NeuButton>
                        <h1 className="text-2xl font-bold text-[#4B4036]">Edit Profile</h1>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-[2.5rem] p-8 lg:p-10 bg-[#FFF9F2] shadow-[12px_12px_24px_#E6D9C5,-12px_-12px_24px_#FFFFFF]"
                    >

                        {/* Avatar Section */}
                        <div className="flex flex-col items-center mb-10">
                            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <div className="w-32 h-32 rounded-full bg-[#FFF9F2] shadow-[inset_6px_6px_12px_#E6D9C5,inset_-6px_-6px_12px_#FFFFFF] flex items-center justify-center p-2 relative mb-2 transition-all group-hover:shadow-[inset_4px_4px_8px_#E6D9C5,inset_-4px_-4px_8px_#FFFFFF]">
                                    <div className="w-full h-full rounded-full overflow-hidden bg-white/50 relative">
                                        {avatarPreview ? (
                                            <img
                                                src={avatarPreview}
                                                alt="Avatar"
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    console.error("Avatar Load Error:", e);
                                                    e.currentTarget.src = ''; // Clear source to trigger fallback if logic supports, or just let UI handle it
                                                    setAvatarPreview(null); // Fallback to icon
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-[#FFD59A]/20">
                                                <User className="w-10 h-10 text-[#EBC9A4]" />
                                            </div>
                                        )}
                                        {/* Hover Overlay */}
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Camera className="w-8 h-8 text-white drop-shadow-md" />
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute bottom-2 right-0 p-2 bg-[#4B4036] rounded-full text-white shadow-lg transform group-hover:scale-110 transition-transform">
                                    <Camera className="w-4 h-4" />
                                </div>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                className="hidden"
                            />
                            <p className="text-xs text-[#8B7E74] mt-2 font-medium">Click to upload new picture</p>
                        </div>

                        {/* Public Info */}
                        <div className="space-y-6 mb-10">
                            <h3 className="text-lg font-bold text-[#4B4036] border-l-4 border-[#FFD59A] pl-3">Personal Info</h3>

                            <NeuInput
                                label="Full Name"
                                name="full_name"
                                value={formData.full_name}
                                onChange={handleChange}
                                icon={User}
                            />

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-[#8B7E74] ml-1 uppercase tracking-wide">Phone Number</label>
                                <div className="flex gap-3">
                                    <div className="relative min-w-[140px]">
                                        <select
                                            name="phoneCode"
                                            value={formData.phoneCode}
                                            onChange={handleChange}
                                            className="w-full py-3.5 pl-4 pr-8 rounded-xl bg-[#FFF9F2] text-[#4B4036] font-medium outline-none shadow-[inset_4px_4px_8px_#E6D9C5,inset_-4px_-4px_8px_#FFFFFF] appearance-none"
                                        >
                                            {COUNTRY_CODES.map((c) => (
                                                <option key={c.code} value={c.code}>{c.flag} +{c.code}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#8B7E74]">
                                            ▼
                                        </div>
                                    </div>
                                    <div className="flex-1 relative">
                                        <input
                                            type="tel"
                                            name="phoneNumber"
                                            value={formData.phoneNumber}
                                            onChange={handleChange}
                                            placeholder="1234 5678"
                                            className="w-full py-3.5 px-4 rounded-xl bg-[#FFF9F2] text-[#4B4036] font-medium placeholder-[#4B4036]/30 outline-none shadow-[inset_4px_4px_8px_#E6D9C5,inset_-4px_-4px_8px_#FFFFFF] focus:shadow-[inset_6px_6px_12px_#E6D9C5,inset_-6px_-6px_12px_#FFFFFF] transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="opacity-60 cursor-not-allowed">
                                <NeuInput
                                    label="Email (Cannot be changed)"
                                    name="email"
                                    value={user.email || ''}
                                    onChange={() => { }}
                                    icon={Mail}
                                    readOnly
                                />
                            </div>
                        </div>

                        {/* Security */}
                        <div className="space-y-6 mb-10 p-6 rounded-2xl bg-[#FFF9F2] shadow-[inset_6px_6px_14px_#E6D9C5,inset_-6px_-6px_14px_#FFFFFF]">
                            <div className="flex items-center gap-2 mb-2">
                                <Lock className="w-5 h-5 text-red-400" />
                                <h3 className="text-lg font-bold text-[#4B4036]">Security</h3>
                            </div>

                            <p className="text-xs text-[#8B7E74]">To change your password, you must verify your current password first.</p>

                            <NeuPasswordInput
                                label="Current Password"
                                name="currentPassword"
                                value={formData.currentPassword}
                                onChange={handleChange}
                                placeholder="Required to set new password"
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#EADBC8]/50">
                                <NeuPasswordInput
                                    label="New Password"
                                    name="newPassword"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    placeholder="Min 6 chars"
                                />
                                <NeuPasswordInput
                                    label="Confirm Password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Re-enter new password"
                                />
                            </div>
                        </div>

                        {/* Feedback Message */}
                        {message && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`p-4 rounded-xl mb-6 flex items-center gap-3 ${message.type === 'success'
                                    ? 'bg-green-50 text-green-700 border border-green-100'
                                    : 'bg-red-50 text-red-700 border border-red-100'
                                    }`}
                            >
                                {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                <span className="text-sm font-medium">{message.text}</span>
                            </motion.div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-end gap-4 pt-6 border-t border-[#EADBC8]/30">
                            <NeuButton onClick={() => router.back()} className="px-6 py-3 rounded-xl font-bold text-[#8B7E74]">
                                Cancel
                            </NeuButton>
                            <NeuButton
                                onClick={handleSave}
                                disabled={saving}
                                className="px-8 py-3 rounded-xl bg-[#FFD59A]/10 text-[#4B4036] font-bold flex items-center gap-2 hover:text-[#E89234]"
                            >
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                Save Changes
                            </NeuButton>
                        </div>

                    </motion.div>
                </div>
            </div>
        </div>
    );
}

// --- Components ---

function NeuInput({ label, value, onChange, name, type = "text", placeholder, icon: Icon, readOnly = false }: any) {
    return (
        <div className="space-y-2">
            <label className="text-xs font-bold text-[#8B7E74] ml-1 uppercase tracking-wide">{label}</label>
            <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#EBC9A4] group-focus-within:text-[#FFD59A] transition-colors">
                    {Icon && <Icon className="w-5 h-5" />}
                </div>
                <input
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    readOnly={readOnly}
                    className={`
              w-full py-3.5 pl-12 pr-4 rounded-xl bg-[#FFF9F2] text-[#4B4036] font-medium placeholder-[#4B4036]/30 outline-none
              shadow-[inset_4px_4px_8px_#E6D9C5,inset_-4px_-4px_8px_#FFFFFF]
              focus:shadow-[inset_6px_6px_12px_#E6D9C5,inset_-6px_-6px_12px_#FFFFFF]
              transition-all duration-200
              ${readOnly ? 'opacity-70 cursor-not-allowed' : ''}
            `}
                />
            </div>
        </div>
    )
}

function NeuPasswordInput({ label, value, onChange, name, placeholder }: any) {
    const [show, setShow] = useState(false);
    return (
        <div className="space-y-2">
            <label className="text-xs font-bold text-[#8B7E74] ml-1 uppercase tracking-wide">{label}</label>
            <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#EBC9A4] group-focus-within:text-[#FFD59A] transition-colors">
                    <Lock className="w-5 h-5" />
                </div>
                <input
                    type={show ? "text" : "password"}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className="w-full py-3.5 pl-12 pr-12 rounded-xl bg-[#FFF9F2] text-[#4B4036] font-medium placeholder-[#4B4036]/30 outline-none shadow-[inset_4px_4px_8px_#E6D9C5,inset_-4px_-4px_8px_#FFFFFF] focus:shadow-[inset_6px_6px_12px_#E6D9C5,inset_-6px_-6px_12px_#FFFFFF] transition-all"
                />
                <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8B7E74] hover:text-[#4B4036]"
                >
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            </div>
        </div>
    )
}

function NeuButton({ children, onClick, className = '', disabled = false }: { children: React.ReactNode, onClick?: () => void, className?: string, disabled?: boolean }) {
    return (
        <motion.button
            whileHover={disabled ? {} : { scale: 1.02 }}
            whileTap={disabled ? {} : { scale: 0.96 }}
            onClick={onClick}
            disabled={disabled}
            className={`
            bg-[#FFF9F2] 
            shadow-[6px_6px_14px_#E6D9C5,-6px_-6px_14px_#FFFFFF] 
            hover:shadow-[8px_8px_18px_#E6D9C5,-8px_-8px_18px_#FFFFFF]
            active:shadow-[inset_4px_4px_8px_#E6D9C5,inset_-4px_-4px_8px_#FFFFFF]
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}
         `}
        >
            {children}
        </motion.button>
    )
}
