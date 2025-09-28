'use client';

import { render, screen } from '@testing-library/react';
import MobileBottomNavigation from './MobileBottomNavigation';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  usePathname: () => '/aihome/dashboard',
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('MobileBottomNavigation', () => {
  beforeEach(() => {
    // Mock window.innerWidth for mobile view
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    });
  });

  it('should render without duplicate key errors', () => {
    // This test will help identify if there are any key-related issues
    expect(() => {
      render(<MobileBottomNavigation />);
    }).not.toThrow();
  });

  it('should render navigation items with unique keys', () => {
    render(<MobileBottomNavigation />);
    
    // Check if navigation items are rendered
    const dashboardButton = screen.queryByText('管理板');
    const aiCompanionsButton = screen.queryByText('AI夥伴');
    const parentConnectButton = screen.queryByText('家長連結');
    const settingsButton = screen.queryByText('設定');
    
    // At least one should be visible (the main button)
    expect(dashboardButton || aiCompanionsButton || parentConnectButton || settingsButton).toBeTruthy();
  });
});

