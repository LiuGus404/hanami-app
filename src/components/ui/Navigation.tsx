'use client';

import { useRouter } from 'next/navigation';
import HanamiEchoLogo from './HanamiEchoLogo';
import { HanamiButton } from './HanamiButton';

interface NavigationProps {
  showBackButton?: boolean;
  backPath?: string;
  backLabel?: string;
}

export function Navigation({
  showBackButton = false,
  backPath = '/',
  backLabel = '返回首頁'
}: NavigationProps) {
  const router = useRouter();

  return (
    <nav className="bg-white/80 backdrop-blur-sm border-b border-[#EADBC8] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div
            className="cursor-pointer"
            onClick={() => router.push('/')}
          >
            <HanamiEchoLogo size="md" />
          </div>

          <div className="flex items-center space-x-4">
            {showBackButton && (
              <HanamiButton
                onClick={() => router.push(backPath)}
                variant="secondary"
                size="sm"
              >
                {backLabel}
              </HanamiButton>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

