'use client';

import { useEffect } from 'react';

/**
 * 生產環境禁用 Console 輸出
 * 防止用戶在 Developer Tools 中看到任何 log 信息
 */
export function DisableConsole() {
    useEffect(() => {
        // 只在生產環境下禁用 console
        if (process.env.NODE_ENV === 'production') {
            const noop = () => { };

            // 保存原始方法（以備需要恢復）
            const originalConsole = {
                log: console.log,
                warn: console.warn,
                error: console.error,
                info: console.info,
                debug: console.debug,
                trace: console.trace,
                dir: console.dir,
                group: console.group,
                groupCollapsed: console.groupCollapsed,
                groupEnd: console.groupEnd,
                table: console.table,
                time: console.time,
                timeEnd: console.timeEnd,
                timeLog: console.timeLog,
                count: console.count,
                countReset: console.countReset,
                assert: console.assert,
                clear: console.clear,
                profile: console.profile,
                profileEnd: console.profileEnd,
            };

            // 禁用所有 console 方法
            console.log = noop;
            console.warn = noop;
            console.error = noop;
            console.info = noop;
            console.debug = noop;
            console.trace = noop;
            console.dir = noop;
            console.group = noop;
            console.groupCollapsed = noop;
            console.groupEnd = noop;
            console.table = noop;
            console.time = noop;
            console.timeEnd = noop;
            console.timeLog = noop;
            console.count = noop;
            console.countReset = noop;
            console.assert = noop;
            console.clear = noop;
            // @ts-ignore - profile may not exist in all browsers
            console.profile = noop;
            // @ts-ignore
            console.profileEnd = noop;

            // 存儲到 window 對象以便需要時恢復（僅供內部調試使用）
            if (typeof window !== 'undefined') {
                (window as any).__originalConsole = originalConsole;
            }
        }
    }, []);

    return null;
}

export default DisableConsole;
