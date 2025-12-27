'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, DevicePhoneMobileIcon, ComputerDesktopIcon, PlusIcon, ShareIcon } from '@heroicons/react/24/outline';

// 擴展 BeforeInstallPromptEvent 類型
interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
    prompt(): Promise<void>;
}

// 擴展 Navigator 類型以包含 standalone 屬性（iOS Safari）
interface IOSNavigator extends Navigator {
    standalone?: boolean;
}

type DeviceType = 'ios' | 'android' | 'windows' | 'mac' | 'unknown';

// 全局存儲 deferredPrompt，供其他組件使用
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;

// PWA 安裝 Context
interface PWAInstallContextType {
    canInstall: boolean;
    isInstalled: boolean;
    deviceType: DeviceType;
    triggerInstall: () => Promise<void>;
    showIOSInstructions: () => void;
}

const PWAInstallContext = createContext<PWAInstallContextType | null>(null);

// 導出 Hook 供其他組件使用
export function usePWAInstall() {
    const context = useContext(PWAInstallContext);
    if (!context) {
        // 如果沒有 context，返回一個默認值（用於不在 Provider 內的情況）
        return {
            canInstall: false,
            isInstalled: false,
            deviceType: 'unknown' as DeviceType,
            triggerInstall: async () => { },
            showIOSInstructions: () => { },
        };
    }
    return context;
}

export default function PWAInstallPrompt() {
    const [isVisible, setIsVisible] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [deviceType, setDeviceType] = useState<DeviceType>('unknown');
    const [showIOSInstructionsModal, setShowIOSInstructionsModal] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [hasNavbar, setHasNavbar] = useState(false);
    const [isScrolledDown, setIsScrolledDown] = useState(false);

    // 檢測頁面是否有導航欄
    useEffect(() => {
        const checkNavbar = () => {
            // 檢查是否存在 sticky 的 nav 元素（UnifiedNavbar 使用 sticky top-0）
            const navbar = document.querySelector('nav.sticky');
            setHasNavbar(!!navbar);
        };

        // 初始檢查
        checkNavbar();

        // 使用 MutationObserver 監聯 DOM 變化
        const observer = new MutationObserver(checkNavbar);
        observer.observe(document.body, { childList: true, subtree: true });

        return () => observer.disconnect();
    }, []);

    // 滾動偵測 - 向下滑動時隱藏 PWA 提示
    useEffect(() => {
        let lastScrollY = window.scrollY;
        let ticking = false;

        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const currentScrollY = window.scrollY;
                    // 向下滑動超過 50px 且已經離開頂部時隱藏
                    if (currentScrollY > lastScrollY && currentScrollY > 50) {
                        setIsScrolledDown(true);
                    } else if (currentScrollY < lastScrollY || currentScrollY <= 50) {
                        // 向上滑動或接近頂部時顯示
                        setIsScrolledDown(false);
                    }
                    lastScrollY = currentScrollY;
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // 檢測設備類型
    const detectDeviceType = useCallback((): DeviceType => {
        if (typeof window === 'undefined') return 'unknown';

        const userAgent = navigator.userAgent.toLowerCase();
        const platform = navigator.platform?.toLowerCase() || '';

        if (/iphone|ipad|ipod/.test(userAgent) || /mac/.test(platform) && navigator.maxTouchPoints > 1) {
            return 'ios';
        }
        if (/android/.test(userAgent)) {
            return 'android';
        }
        if (/win/.test(platform)) {
            return 'windows';
        }
        if (/mac/.test(platform)) {
            return 'mac';
        }
        return 'unknown';
    }, []);

    // 檢查是否已經安裝為 PWA
    const checkIfInstalled = useCallback((): boolean => {
        if (typeof window === 'undefined') return false;

        // 檢查是否在獨立模式下運行（已安裝為 PWA）
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        const isIOSStandalone = (navigator as IOSNavigator).standalone === true;

        return isStandalone || isIOSStandalone;
    }, []);

    // 檢查是否應該顯示提示（使用 sessionStorage，每次會話顯示一次）
    const shouldShowPrompt = useCallback((): boolean => {
        if (typeof window === 'undefined') return false;

        // 使用 sessionStorage 檢查當前會話是否已關閉過提示
        const dismissedThisSession = sessionStorage.getItem('pwa_prompt_dismissed_session');
        if (dismissedThisSession === 'true') {
            return false;
        }

        return true;
    }, []);

    useEffect(() => {
        const device = detectDeviceType();
        setDeviceType(device);

        const installed = checkIfInstalled();
        setIsInstalled(installed);

        // 如果已經安裝，不顯示提示
        if (installed) {
            return;
        }

        // 檢查是否應該顯示
        if (!shouldShowPrompt()) {
            return;
        }

        // 對於支持 beforeinstallprompt 的瀏覽器（Chrome, Edge, Samsung Internet 等）
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            const promptEvent = e as BeforeInstallPromptEvent;
            setDeferredPrompt(promptEvent);
            globalDeferredPrompt = promptEvent; // 存儲到全局變量
            // 延遲顯示，讓頁面先加載完成
            setTimeout(() => {
                setIsVisible(true);
            }, 2000);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // 對於 iOS Safari，顯示手動安裝指引
        if (device === 'ios') {
            // 檢查是否在 Safari 中
            const isSafari = /safari/.test(navigator.userAgent.toLowerCase()) && !/crios|fxios/.test(navigator.userAgent.toLowerCase());
            if (isSafari) {
                setTimeout(() => {
                    setIsVisible(true);
                }, 2000);
            }
        }

        // 監聽安裝完成事件
        const handleAppInstalled = () => {
            setIsInstalled(true);
            setIsVisible(false);
            setDeferredPrompt(null);
            globalDeferredPrompt = null;
        };

        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, [detectDeviceType, checkIfInstalled, shouldShowPrompt]);

    // 處理安裝按鈕點擊
    const handleInstallClick = async () => {
        if (deviceType === 'ios') {
            setShowIOSInstructionsModal(true);
            return;
        }

        if (deferredPrompt) {
            try {
                await deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;

                if (outcome === 'accepted') {
                    setIsVisible(false);
                }

                setDeferredPrompt(null);
                globalDeferredPrompt = null;
            } catch (error) {
                console.error('安裝 PWA 失敗:', error);
            }
        }
    };

    // 處理關閉按鈕點擊
    const handleDismiss = () => {
        setIsVisible(false);
        setShowIOSInstructionsModal(false);
        // 使用 sessionStorage 記錄當前會話已關閉（關閉瀏覽器後會重置）
        sessionStorage.setItem('pwa_prompt_dismissed_session', 'true');
    };

    // 獲取設備對應的圖標和文字
    const getDeviceInfo = () => {
        switch (deviceType) {
            case 'ios':
                return {
                    icon: DevicePhoneMobileIcon,
                    buttonText: '加入主畫面',
                    description: 'Apple 裝置'
                };
            case 'android':
                return {
                    icon: DevicePhoneMobileIcon,
                    buttonText: '安裝',
                    description: 'Android 裝置'
                };
            case 'windows':
                return {
                    icon: ComputerDesktopIcon,
                    buttonText: '安裝',
                    description: 'Windows 電腦'
                };
            case 'mac':
                return {
                    icon: ComputerDesktopIcon,
                    buttonText: '安裝',
                    description: 'Mac 電腦'
                };
            default:
                return {
                    icon: DevicePhoneMobileIcon,
                    buttonText: '安裝',
                    description: ''
                };
        }
    };

    const deviceInfo = getDeviceInfo();

    // Context 值
    const contextValue: PWAInstallContextType = {
        canInstall: !!deferredPrompt || deviceType === 'ios',
        isInstalled,
        deviceType,
        triggerInstall: handleInstallClick,
        showIOSInstructions: () => setShowIOSInstructionsModal(true),
    };

    return (
        <PWAInstallContext.Provider value={contextValue}>
            <AnimatePresence>
                {/* 主提示橫幅 - 只在未安裝且應顯示時出現 */}
                {!isInstalled && isVisible && !showIOSInstructionsModal && (
                    <motion.div
                        key="pwa-install-prompt"
                        initial={{ y: -100, opacity: 0 }}
                        animate={{
                            y: isScrolledDown ? -100 : 0,
                            opacity: isScrolledDown ? 0 : 1
                        }}
                        exit={{ y: -100, opacity: 0 }}
                        transition={{ duration: 0.3, type: "spring", bounce: 0.2 }}
                        className={`fixed ${hasNavbar ? 'top-16' : 'top-0'} left-0 right-0 z-[9999] pointer-events-auto`}
                    >
                        <div className="bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-lg">
                            <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
                                {/* 左側：關閉按鈕 + 圖標 + 文字 */}
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    {/* 關閉按鈕 */}
                                    <button
                                        onClick={handleDismiss}
                                        className="flex-shrink-0 p-1 rounded-full hover:bg-gray-100 transition-colors"
                                        aria-label="關閉"
                                    >
                                        <XMarkIcon className="w-5 h-5 text-gray-500" />
                                    </button>

                                    {/* 應用圖標 */}
                                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center shadow-sm border border-amber-200/50">
                                        <img
                                            src="/favicon-192.png"
                                            alt="HanamiEcho"
                                            className="w-7 h-7 rounded-lg"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                            }}
                                        />
                                    </div>

                                    {/* 文字說明 */}
                                    <div className="min-w-0 flex-1">
                                        <div className="font-semibold text-gray-900 text-sm truncate">HanamiEcho</div>
                                        <div className="text-xs text-gray-500 truncate">在 Web App 中開啟</div>
                                    </div>
                                </div>

                                {/* 右側：安裝按鈕 */}
                                <button
                                    onClick={handleInstallClick}
                                    className="flex-shrink-0 px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white font-medium text-sm rounded-full shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
                                >
                                    {deviceInfo.buttonText}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* iOS 安裝指引彈窗 */}
                {showIOSInstructionsModal && (
                    <motion.div
                        key="ios-instructions"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
                        onClick={handleDismiss}
                    >
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            transition={{ duration: 0.3, type: "spring", bounce: 0.2 }}
                            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* 標題欄 */}
                            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gray-900">加入主畫面</h3>
                                <button
                                    onClick={handleDismiss}
                                    className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                                >
                                    <XMarkIcon className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            {/* 說明內容 */}
                            <div className="px-5 py-4 space-y-4">
                                <p className="text-sm text-gray-600">
                                    在 Safari 瀏覽器中，請按照以下步驟將 HanamiEcho 加入主畫面：
                                </p>

                                {/* 步驟 1 */}
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                        <span className="text-sm font-bold text-blue-600">1</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-700 font-medium">
                                            點擊底部的
                                            <span className="inline-flex items-center mx-1 px-2 py-0.5 rounded bg-gray-100">
                                                <ShareIcon className="w-4 h-4 text-blue-500" />
                                            </span>
                                            分享按鈕
                                        </p>
                                    </div>
                                </div>

                                {/* 步驟 2 */}
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                        <span className="text-sm font-bold text-blue-600">2</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-700 font-medium">
                                            向下滑動並點擊
                                            <span className="inline-flex items-center mx-1 px-2 py-0.5 rounded bg-gray-100">
                                                <PlusIcon className="w-4 h-4 text-gray-600" />
                                                <span className="ml-1 text-xs">加入主畫面</span>
                                            </span>
                                        </p>
                                    </div>
                                </div>

                                {/* 步驟 3 */}
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                        <span className="text-sm font-bold text-blue-600">3</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-700 font-medium">
                                            點擊右上角的「新增」確認
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* 底部按鈕 */}
                            <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
                                <button
                                    onClick={handleDismiss}
                                    className="w-full py-3 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-98"
                                >
                                    我知道了
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </PWAInstallContext.Provider>
    );
}

// 導出獨立的安裝按鈕組件，可在設定頁等地方使用
export function PWAInstallButton({ className = '' }: { className?: string }) {
    const [isInstalled, setIsInstalled] = useState(false);
    const [deviceType, setDeviceType] = useState<DeviceType>('unknown');
    const [browserType, setBrowserType] = useState<'chrome' | 'safari' | 'firefox' | 'edge' | 'other'>('other');
    const [showModal, setShowModal] = useState(false);
    const [canNativeInstall, setCanNativeInstall] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // 檢測設備類型
        const userAgent = navigator.userAgent.toLowerCase();
        const platform = navigator.platform?.toLowerCase() || '';

        let device: DeviceType = 'unknown';
        if (/iphone|ipad|ipod/.test(userAgent) || /mac/.test(platform) && navigator.maxTouchPoints > 1) {
            device = 'ios';
        } else if (/android/.test(userAgent)) {
            device = 'android';
        } else if (/win/.test(platform)) {
            device = 'windows';
        } else if (/mac/.test(platform)) {
            device = 'mac';
        }
        setDeviceType(device);

        // 檢測瀏覽器類型
        if (/edg/.test(userAgent)) {
            setBrowserType('edge');
        } else if (/chrome/.test(userAgent) && !/edg/.test(userAgent)) {
            setBrowserType('chrome');
        } else if (/safari/.test(userAgent) && !/chrome/.test(userAgent)) {
            setBrowserType('safari');
        } else if (/firefox/.test(userAgent)) {
            setBrowserType('firefox');
        } else {
            setBrowserType('other');
        }

        // 檢查是否已安裝
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        const isIOSStandalone = (navigator as IOSNavigator).standalone === true;
        setIsInstalled(isStandalone || isIOSStandalone);

        // 檢查是否有全局的 deferredPrompt（支援原生安裝）
        if (globalDeferredPrompt) {
            setCanNativeInstall(true);
        }

        // 監聽 beforeinstallprompt 事件
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            globalDeferredPrompt = e as BeforeInstallPromptEvent;
            setCanNativeInstall(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // 監聽安裝完成事件
        const handleAppInstalled = () => {
            setIsInstalled(true);
            setCanNativeInstall(false);
            globalDeferredPrompt = null;
        };

        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstall = async () => {
        // 如果支援原生安裝（Chrome/Edge），使用原生方式
        if (canNativeInstall && globalDeferredPrompt) {
            try {
                await globalDeferredPrompt.prompt();
                const { outcome } = await globalDeferredPrompt.userChoice;

                if (outcome === 'accepted') {
                    setIsInstalled(true);
                }

                globalDeferredPrompt = null;
                setCanNativeInstall(false);
            } catch (error) {
                console.error('安裝 PWA 失敗:', error);
            }
        } else {
            // 顯示手動安裝指引
            setShowModal(true);
        }
    };

    // 獲取安裝說明內容
    const getInstallInstructions = () => {
        if (deviceType === 'ios') {
            return {
                title: '加入主畫面',
                description: '在 Safari 瀏覽器中，請按照以下步驟將 HanamiEcho 加入主畫面：',
                steps: [
                    { icon: 'share', text: '點擊底部的分享按鈕' },
                    { icon: 'plus', text: '向下滑動並點擊「加入主畫面」' },
                    { icon: 'check', text: '點擊右上角的「新增」確認' },
                ],
            };
        } else if (browserType === 'safari') {
            return {
                title: '安裝為 App',
                description: 'Safari 暫不支援直接安裝為 App。建議使用 Chrome 或 Edge 瀏覽器來安裝 HanamiEcho。',
                steps: [
                    { icon: 'chrome', text: '打開 Chrome 或 Edge 瀏覽器' },
                    { icon: 'link', text: '訪問 hanamiecho.com' },
                    { icon: 'install', text: '點擊地址欄右側的安裝按鈕' },
                ],
                alternativeNote: '或者您可以將此頁面加入書籤以便快速訪問。',
            };
        } else if (browserType === 'chrome' || browserType === 'edge') {
            return {
                title: '安裝為 App',
                description: '請按照以下步驟將 HanamiEcho 安裝為應用程式：',
                steps: [
                    { icon: 'menu', text: '點擊瀏覽器右上角的選單（⋮）' },
                    { icon: 'install', text: '選擇「安裝 HanamiEcho」或「安裝應用程式」' },
                    { icon: 'check', text: '在彈出視窗中點擊「安裝」確認' },
                ],
            };
        } else if (browserType === 'firefox') {
            return {
                title: '安裝為 App',
                description: 'Firefox 暫不支援直接安裝為 App。建議使用 Chrome 或 Edge 瀏覽器來安裝 HanamiEcho。',
                steps: [
                    { icon: 'chrome', text: '打開 Chrome 或 Edge 瀏覽器' },
                    { icon: 'link', text: '訪問 hanamiecho.com' },
                    { icon: 'install', text: '點擊地址欄右側的安裝按鈕' },
                ],
            };
        } else {
            return {
                title: '安裝為 App',
                description: '建議使用 Chrome 或 Edge 瀏覽器來安裝 HanamiEcho 作為應用程式。',
                steps: [
                    { icon: 'chrome', text: '打開 Chrome 或 Edge 瀏覽器' },
                    { icon: 'link', text: '訪問 hanamiecho.com' },
                    { icon: 'install', text: '點擊地址欄右側的安裝按鈕' },
                ],
            };
        }
    };

    const instructions = getInstallInstructions();

    // 如果已安裝，顯示已安裝狀態
    if (isInstalled) {
        return (
            <div className={`flex items-center gap-2 px-4 py-3 bg-green-50 rounded-xl border border-green-200 ${className}`}>
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <div>
                    <div className="font-medium text-green-800 text-sm">已安裝為 App</div>
                    <div className="text-xs text-green-600">您已經將 HanamiEcho 安裝為應用程式</div>
                </div>
            </div>
        );
    }

    const buttonText = deviceType === 'ios' ? '加入主畫面' : '安裝為 App';

    return (
        <>
            <button
                onClick={handleInstall}
                className={`flex items-center gap-3 w-full px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 rounded-xl border border-amber-200 transition-all duration-200 ${className}`}
            >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center shadow-sm">
                    <img
                        src="/favicon-192.png"
                        alt="HanamiEcho"
                        className="w-6 h-6 rounded-lg"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                        }}
                    />
                </div>
                <div className="flex-1 text-left">
                    <div className="font-semibold text-gray-900 text-sm">{buttonText}</div>
                    <div className="text-xs text-gray-500">快速啟動 HanamiEcho</div>
                </div>
                <div className="px-3 py-1.5 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-xs font-medium rounded-full">
                    安裝
                </div>
            </button>

            {/* 安裝指引彈窗 */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        key="install-modal"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            transition={{ duration: 0.3, type: "spring", bounce: 0.2 }}
                            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gray-900">{instructions.title}</h3>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                                >
                                    <XMarkIcon className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                            <div className="px-5 py-4 space-y-4">
                                <p className="text-sm text-gray-600">
                                    {instructions.description}
                                </p>
                                {instructions.steps.map((step, index) => (
                                    <div key={index} className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                            <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-700 font-medium flex items-center gap-2">
                                                {step.icon === 'share' && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100">
                                                        <ShareIcon className="w-4 h-4 text-blue-500" />
                                                    </span>
                                                )}
                                                {step.icon === 'plus' && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100">
                                                        <PlusIcon className="w-4 h-4 text-gray-600" />
                                                    </span>
                                                )}
                                                {step.text}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {instructions.alternativeNote && (
                                    <p className="text-xs text-gray-500 italic mt-4 p-3 bg-gray-50 rounded-lg">
                                        💡 {instructions.alternativeNote}
                                    </p>
                                )}
                            </div>
                            <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="w-full py-3 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
                                >
                                    我知道了
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
