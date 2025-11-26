'use client';

import { MindBlock } from '@/types/mind-block';
import { HeartIcon, ArrowPathIcon, UserIcon, PuzzlePieceIcon, MagnifyingGlassIcon, PencilSquareIcon, CommandLineIcon } from '@heroicons/react/24/outline';

interface MindBlockCardProps {
    block: MindBlock;
    onFork: (block: MindBlock) => void;
}

export default function MindBlockCard({ block, onFork }: MindBlockCardProps) {
    // Helper to map emoji/string to Heroicon
    const getIcon = (iconStr: string) => {
        switch (iconStr) {
            case '🔍': return <MagnifyingGlassIcon className="w-6 h-6 text-[#4B4036]" />;
            case '✍️': return <PencilSquareIcon className="w-6 h-6 text-[#4B4036]" />;
            case '👨‍💻': return <CommandLineIcon className="w-6 h-6 text-[#4B4036]" />;
            default: return <PuzzlePieceIcon className="w-6 h-6 text-[#4B4036]" />;
        }
    };

    return (
        <div className="group relative h-full">
            <div className="absolute inset-0 bg-white/40 rounded-2xl transform translate-y-2 translate-x-0 transition-transform group-hover:translate-y-3 border border-[#EADBC8]"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-[#EADBC8] p-5 h-full flex flex-col transition-transform transform group-hover:-translate-y-1 group-hover:shadow-xl group-hover:border-[#FFD59A]">

                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FFF9F2] to-[#FFF0D4] flex items-center justify-center border border-[#EADBC8] shadow-sm group-hover:shadow-md transition-all">
                            {getIcon(block.icon)}
                        </div>
                        <div>
                            <h3 className="font-bold text-[#4B4036] text-lg leading-tight group-hover:text-[#FFB6C1] transition-colors">
                                {block.title}
                            </h3>
                            <div className="flex items-center text-xs text-[#4B4036]/60 mt-1 font-medium">
                                <UserIcon className="w-3.5 h-3.5 mr-1.5" />
                                <span>{block.user_id === 'system' ? '官方' : `用戶 ${block.user_id.substring(0, 4)}`}</span>
                            </div>
                        </div>
                    </div>
                    {block.is_official && (
                        <span className="px-2.5 py-1 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-sm">
                            官方
                        </span>
                    )}
                </div>

                {/* Description */}
                <p className="text-sm text-[#4B4036]/70 mb-6 flex-1 line-clamp-3 leading-relaxed">
                    {block.description || '暫無描述'}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-dashed border-[#EADBC8]">
                    <div className="flex items-center space-x-4 text-xs font-semibold text-[#4B4036]/50">
                        <div className="flex items-center hover:text-red-400 transition-colors">
                            <HeartIcon className="w-4 h-4 mr-1.5" />
                            {block.likes_count}
                        </div>
                        <div className="flex items-center hover:text-blue-400 transition-colors">
                            <ArrowPathIcon className="w-4 h-4 mr-1.5" />
                            {block.usage_count}
                        </div>
                    </div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onFork(block);
                        }}
                        className="flex items-center px-4 py-2 bg-gradient-to-r from-[#FFB6C1] to-[#FFD59A] text-white text-xs font-bold rounded-xl hover:shadow-lg hover:scale-105 transition-all shadow-md active:scale-95"
                    >
                        <ArrowPathIcon className="w-3.5 h-3.5 mr-2" />
                        Remix
                    </button>
                </div>
            </div>
        </div>
    );
}
