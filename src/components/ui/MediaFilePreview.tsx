import { useState, useEffect } from 'react';
import { formatFileSize } from '@/lib/storageUtils';

interface FilePreviewProps {
    file: File;
    progress?: number;
    onRemove: () => void;
}

export default function MediaFilePreview({ file, progress, onRemove }: FilePreviewProps) {
    const [objectUrl, setObjectUrl] = useState<string | null>(null);
    const isVideo = file.type.startsWith('video/');
    const isPhoto = file.type.startsWith('image/');

    useEffect(() => {
        if (!file) return;

        let url: string | null = null;

        // 只有圖片才生成預覽，影片使用圖標以節省記憶體
        if (isPhoto) {
            url = URL.createObjectURL(file);
            setObjectUrl(url);
        }

        return () => {
            if (url) {
                URL.revokeObjectURL(url);
            }
        };
    }, [file, isPhoto]);

    return (
        <div className="relative flex-shrink-0 w-24 h-24 rounded-xl border border-[#EADBC8] shadow-sm overflow-hidden group bg-gray-100">
            {/* Thumbnail / Icon */}
            <div className="w-full h-full flex items-center justify-center">
                {isPhoto && objectUrl ? (
                    <img
                        src={objectUrl}
                        alt={file.name}
                        className="w-full h-full object-cover"
                    />
                ) : isVideo ? (
                    <div className="flex flex-col items-center justify-center p-2 text-center w-full">
                        {/* Video Icon SVG */}
                        <svg className="w-8 h-8 text-blue-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span className="text-[10px] text-gray-500 truncate w-full px-1">{file.name}</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center p-2 text-center w-full">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mb-1">
                            <span className="text-gray-500 text-xs">📄</span>
                        </div>
                        <span className="text-[10px] text-gray-500 truncate w-full px-1">{file.name}</span>
                    </div>
                )}
            </div>

            {/* Remove Button (Top Right) */}
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                }}
                className="absolute top-1 right-1 bg-white/90 text-gray-500 rounded-full p-1 shadow-md hover:bg-white transition-all hover:scale-110 opacity-0 group-hover:opacity-100 z-10"
                title="移除"
            >
                {/* X Icon SVG */}
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            {/* Size Badge (Bottom) */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-1 py-0.5 text-center truncate">
                {formatFileSize(file.size)}
            </div>

            {/* Upload Progress Overlay */}
            {progress !== undefined && progress >= 0 && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center flex-col gap-1 backdrop-blur-[1px] z-20">
                    <div className="text-white font-bold text-xs drop-shadow-md">
                        {progress}%
                    </div>
                    <div className="w-16 h-1.5 bg-gray-200/30 rounded-full overflow-hidden backdrop-blur-sm shadow-inner">
                        <div
                            className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-200 shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
