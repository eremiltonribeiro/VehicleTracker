// Responsive utilities and breakpoints for the VehicleTracker app

export const breakpoints = {
  xs: '475px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export const mediaQueries = {
  xs: `@media (min-width: ${breakpoints.xs})`,
  sm: `@media (min-width: ${breakpoints.sm})`,
  md: `@media (min-width: ${breakpoints.md})`,
  lg: `@media (min-width: ${breakpoints.lg})`,
  xl: `@media (min-width: ${breakpoints.xl})`,
  '2xl': `@media (min-width: ${breakpoints['2xl']})`,
} as const;

// Hook for detecting screen size
import { useState, useEffect } from 'react';

export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<keyof typeof breakpoints>('xs');
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    function handleResize() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setWindowSize({ width, height });

      if (width >= parseInt(breakpoints['2xl'])) {
        setBreakpoint('2xl');
      } else if (width >= parseInt(breakpoints.xl)) {
        setBreakpoint('xl');
      } else if (width >= parseInt(breakpoints.lg)) {
        setBreakpoint('lg');
      } else if (width >= parseInt(breakpoints.md)) {
        setBreakpoint('md');
      } else if (width >= parseInt(breakpoints.sm)) {
        setBreakpoint('sm');
      } else {
        setBreakpoint('xs');
      }
    }

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { breakpoint, windowSize };
}

// Utility function to check if screen is mobile
export function useIsMobile() {
  const { breakpoint } = useBreakpoint();
  return breakpoint === 'xs' || breakpoint === 'sm';
}

// Utility function to check if screen is tablet
export function useIsTablet() {
  const { breakpoint } = useBreakpoint();
  return breakpoint === 'md';
}

// Utility function to check if screen is desktop
export function useIsDesktop() {
  const { breakpoint } = useBreakpoint();
  return breakpoint === 'lg' || breakpoint === 'xl' || breakpoint === '2xl';
}

// Responsive grid classes generator
export const responsiveGrid = {
  // Mobile-first responsive columns
  cols: {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
    6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6',
  },
  // Gap classes
  gap: {
    sm: 'gap-2 sm:gap-3',
    md: 'gap-3 sm:gap-4 lg:gap-6',
    lg: 'gap-4 sm:gap-6 lg:gap-8',
  },
} as const;

// Responsive flex classes
export const responsiveFlex = {
  // Direction
  direction: {
    colToRow: 'flex-col sm:flex-row',
    rowToCol: 'flex-row sm:flex-col',
  },
  // Alignment
  align: {
    centerToStart: 'items-center sm:items-start',
    startToCenter: 'items-start sm:items-center',
  },
  // Justify
  justify: {
    centerToBetween: 'justify-center sm:justify-between',
    betweenToCenter: 'justify-between sm:justify-center',
  },
} as const;

// Responsive spacing classes
export const responsiveSpacing = {
  padding: {
    sm: 'p-2 sm:p-3 lg:p-4',
    md: 'p-3 sm:p-4 lg:p-6',
    lg: 'p-4 sm:p-6 lg:p-8',
  },
  margin: {
    sm: 'm-2 sm:m-3 lg:m-4',
    md: 'm-3 sm:m-4 lg:m-6',
    lg: 'm-4 sm:m-6 lg:m-8',
  },
} as const;

// Responsive text classes
export const responsiveText = {
  size: {
    xs: 'text-xs sm:text-sm',
    sm: 'text-sm sm:text-base',
    base: 'text-base sm:text-lg',
    lg: 'text-lg sm:text-xl',
    xl: 'text-xl sm:text-2xl',
    '2xl': 'text-2xl sm:text-3xl lg:text-4xl',
    '3xl': 'text-3xl sm:text-4xl lg:text-5xl',
  },
  align: {
    centerToLeft: 'text-center sm:text-left',
    leftToCenter: 'text-left sm:text-center',
  },
} as const;

// Container max-widths
export const containers = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full',
  prose: 'max-w-prose',
  screen: {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
  },
} as const;

// Utility to combine classes conditionally
export function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Mobile-optimized component classes
export const mobileOptimized = {
  button: {
    size: 'px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base',
    touch: 'min-h-[44px] min-w-[44px]', // Apple's recommended touch target size
  },
  input: {
    size: 'px-3 py-2 sm:px-4 sm:py-2 text-base', // Prevent zoom on iOS
    touch: 'min-h-[44px]',
  },
  card: {
    padding: 'p-3 sm:p-4 lg:p-6',
    spacing: 'space-y-3 sm:space-y-4',
  },
  navigation: {
    mobile: 'block sm:hidden',
    desktop: 'hidden sm:block',
  },
} as const;

// Performance utilities
export const performanceOptimized = {
  // Use transform instead of changing position for animations
  slideIn: 'transform transition-transform duration-300 ease-in-out',
  fadeIn: 'opacity-0 transition-opacity duration-300 ease-in-out',
  // Reduce motion for users who prefer it
  reduceMotion: 'motion-reduce:transition-none motion-reduce:transform-none',
} as const;
