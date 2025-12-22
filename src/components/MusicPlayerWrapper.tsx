'use client';

import { MusicPlayerProvider } from '@/contexts/MusicPlayerContext';

export default function MusicPlayerWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    return <MusicPlayerProvider>{children}</MusicPlayerProvider>;
}
