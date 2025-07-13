/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Hanami 專案色彩系統
      colors: {
        hanami: {
          primary: '#FFD59A',      // 主要櫻花色
          secondary: '#EBC9A4',    // 次要溫暖色
          accent: '#FFB6C1',       // 可愛粉色
          background: '#FFF9F2',   // 溫暖背景色
          surface: '#FFFDF8',      // 表面色
          text: '#4B4036',         // 主要文字色
          'text-secondary': '#2B3A3B', // 次要文字色
          border: '#EADBC8',       // 邊框色
          success: '#E0F2E0',      // 成功色
          danger: '#FFE0E0',       // 危險色
          warning: '#FFF3CD',      // 警告色
          info: '#D1ECF1',         // 資訊色
        },
        brown: {
          50: '#FFFDF8',
          100: '#FFF9F2',
          200: '#F5E7D4',
          300: '#EADBC8',
          400: '#E0CFBC',
          500: '#D6C3B0',
          600: '#CCB7A4',
          700: '#4B4036',
          800: '#2B3A3B',
          900: '#1A1A1A',
        },
        pink: {
          50: '#FFF0F5',
          100: '#FFE4E1',
          200: '#FFD4D4',
          300: '#FFC0CB',
          400: '#FFB6C1',
          500: '#FFA0B5',
          600: '#FF8AA9',
          700: '#FF749D',
          800: '#FF5E91',
          900: '#FF4885',
        },
      },
      // 字體系統
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
        quicksand: ['Quicksand', 'sans-serif'],
        hanami: ['Quicksand', 'var(--font-geist-sans)', 'sans-serif'],
      },
      // 字體大小
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },
      // 間距系統
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      // 圓角系統
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      // 陰影系統
      boxShadow: {
        'hanami': '0 4px 12px 0 rgba(235, 201, 164, 0.15), 0 2px 4px 0 rgba(235, 201, 164, 0.1)',
        'hanami-lg': '0 8px 25px 0 rgba(235, 201, 164, 0.25), 0 4px 8px 0 rgba(235, 201, 164, 0.15)',
        'hanami-xl': '0 12px 35px 0 rgba(235, 201, 164, 0.3), 0 6px 12px 0 rgba(235, 201, 164, 0.2)',
        'cute': '0 4px 12px 0 rgba(255, 182, 193, 0.15), 0 2px 4px 0 rgba(255, 182, 193, 0.1)',
        'cute-lg': '0 8px 25px 0 rgba(255, 182, 193, 0.25), 0 4px 8px 0 rgba(255, 182, 193, 0.15)',
        'soft': '0 4px 12px 0 rgba(245, 231, 212, 0.15), 0 2px 4px 0 rgba(245, 231, 212, 0.1)',
        'soft-lg': '0 8px 25px 0 rgba(245, 231, 212, 0.25), 0 4px 8px 0 rgba(245, 231, 212, 0.15)',
      },
      // 動畫系統
      animation: {
        'bounce-subtle': 'bounce-subtle 0.6s ease-in-out',
        'press': 'press 0.2s ease-in-out',
        'wiggle': 'wiggle 0.5s ease-in-out',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
        'search-glow': 'search-glow 1.5s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'gentle-bounce': 'gentle-bounce 2s ease-in-out infinite',
      },
      // 關鍵幀動畫
      keyframes: {
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0) scale(1.05)' },
          '50%': { transform: 'translateY(-4px) scale(1.05)' },
        },
        'press': {
          '0%': { transform: 'scale(1.05)' },
          '50%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
        'wiggle': {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(2deg)' },
          '75%': { transform: 'rotate(-2deg)' },
        },
        'pulse-glow': {
          '0%, 100%': { 
            boxShadow: '0 4px 12px 0 rgba(235, 201, 164, 0.15), 0 2px 4px 0 rgba(235, 201, 164, 0.1)' 
          },
          '50%': { 
            boxShadow: '0 8px 25px 0 rgba(235, 201, 164, 0.25), 0 4px 8px 0 rgba(235, 201, 164, 0.15)' 
          },
        },
        'fade-in': {
          'from': { opacity: '0', transform: 'translateY(-10px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          'from': { opacity: '0', transform: 'translateX(20px)' },
          'to': { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          'from': { opacity: '0', transform: 'scale(0.95)' },
          'to': { opacity: '1', transform: 'scale(1)' },
        },
        'search-glow': {
          '0%, 100%': { 
            boxShadow: '0 0 5px rgba(255, 182, 193, 0.5)' 
          },
          '50%': { 
            boxShadow: '0 0 20px rgba(255, 182, 193, 0.8)' 
          },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'gentle-bounce': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      // 背景漸層
      backgroundImage: {
        'hanami-gradient': 'linear-gradient(135deg, #FFD59A 0%, #EBC9A4 100%)',
        'hanami-gradient-reverse': 'linear-gradient(135deg, #EBC9A4 0%, #FFD59A 100%)',
        'cute-gradient': 'linear-gradient(135deg, #FFB6C1 0%, #FFC0CB 100%)',
        'cute-gradient-reverse': 'linear-gradient(135deg, #FFC0CB 0%, #FFB6C1 100%)',
        'soft-gradient': 'linear-gradient(135deg, #F5E7D4 0%, #F0E0C8 100%)',
        'soft-gradient-reverse': 'linear-gradient(135deg, #F0E0C8 0%, #F5E7D4 100%)',
        'success-gradient': 'linear-gradient(135deg, #E0F2E0 0%, #D4F2D4 100%)',
        'danger-gradient': 'linear-gradient(135deg, #FFE0E0 0%, #FFD4D4 100%)',
        'radial-hanami': 'radial-gradient(circle, #FFD59A 0%, #EBC9A4 100%)',
        'radial-cute': 'radial-gradient(circle, #FFB6C1 0%, #FFC0CB 100%)',
      },
      // 容器配置
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '2rem',
          lg: '4rem',
          xl: '5rem',
          '2xl': '6rem',
        },
      },
      // 響應式斷點
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      // 透明度
      opacity: {
        '15': '0.15',
        '25': '0.25',
        '35': '0.35',
        '45': '0.45',
        '55': '0.55',
        '65': '0.65',
        '75': '0.75',
        '85': '0.85',
        '95': '0.95',
      },
      // 過渡效果
      transitionProperty: {
        'all': 'all',
        'colors': 'color, background-color, border-color, text-decoration-color, fill, stroke',
        'opacity': 'opacity',
        'shadow': 'box-shadow',
        'transform': 'transform',
      },
      transitionDuration: {
        '2000': '2000ms',
        '1500': '1500ms',
        '1000': '1000ms',
        '750': '750ms',
        '500': '500ms',
        '300': '300ms',
        '200': '200ms',
        '150': '150ms',
        '100': '100ms',
        '75': '75ms',
        '50': '50ms',
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'gentle': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'cute': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
      // 網格系統
      gridTemplateColumns: {
        'auto-fit': 'repeat(auto-fit, minmax(250px, 1fr))',
        'auto-fill': 'repeat(auto-fill, minmax(200px, 1fr))',
      },
      // 最小高度
      minHeight: {
        'screen-75': '75vh',
        'screen-50': '50vh',
      },
      // 最大寬度
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      // Z-index
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },
  plugins: [
    // 自定義插件
    function({ addUtilities, theme }) {
      const newUtilities = {
        '.hanami-text-shadow': {
          textShadow: '0 2px 4px rgba(75, 64, 54, 0.1)',
        },
        '.hanami-text-shadow-lg': {
          textShadow: '0 4px 8px rgba(75, 64, 54, 0.15)',
        },
        '.hanami-backdrop-blur': {
          backdropFilter: 'blur(8px)',
        },
        '.hanami-glass': {
          background: 'rgba(255, 253, 248, 0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(234, 219, 200, 0.2)',
        },
        '.hanami-scrollbar': {
          scrollbarWidth: 'thin',
          scrollbarColor: theme('colors.hanami.border') + ' transparent',
        },
        '.hanami-scrollbar::-webkit-scrollbar': {
          width: '6px',
        },
        '.hanami-scrollbar::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '.hanami-scrollbar::-webkit-scrollbar-thumb': {
          backgroundColor: theme('colors.hanami.border'),
          borderRadius: '3px',
        },
        '.hanami-scrollbar::-webkit-scrollbar-thumb:hover': {
          backgroundColor: theme('colors.hanami.secondary'),
        },
        // Line clamp utilities
        '.line-clamp-1': {
          overflow: 'hidden',
          display: '-webkit-box',
          '-webkit-box-orient': 'vertical',
          '-webkit-line-clamp': '1',
        },
        '.line-clamp-2': {
          overflow: 'hidden',
          display: '-webkit-box',
          '-webkit-box-orient': 'vertical',
          '-webkit-line-clamp': '2',
        },
        '.line-clamp-3': {
          overflow: 'hidden',
          display: '-webkit-box',
          '-webkit-box-orient': 'vertical',
          '-webkit-line-clamp': '3',
        },
      }
      addUtilities(newUtilities)
    },
  ],
  // 安全列表 - 確保某些類別在生產環境中不會被清除
  safelist: [
    'hanami-btn',
        'hanami-btn-primary',
        'hanami-btn-secondary',
        'hanami-btn-accent',
    'hanami-btn-cute',
    'hanami-btn-soft',
    'hanami-btn-success',
    'hanami-btn-danger',
    'animate-bounce-subtle',
    'animate-press',
    'animate-wiggle',
    'animate-pulse-glow',
    'animate-fade-in',
    'animate-slide-in-right',
    'animate-scale-in',
    'animate-search-glow',
    'animate-float',
    'animate-gentle-bounce',
  ],
} 