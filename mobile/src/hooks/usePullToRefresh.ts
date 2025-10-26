import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to detect and respond to iOS pull-to-refresh gesture
 */
export const usePullToRefresh = (
  onRefresh: () => Promise<void> | void,
  enabled: boolean = true
) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
    }
  }, [onRefresh, isRefreshing]);

  useEffect(() => {
    if (!enabled) return;

    let startY = 0;
    let currentY = 0;
    let scrollTop = 0;
    const threshold = 80; // Pull threshold in pixels

    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      const scrollableParent = findScrollableParent(target);

      if (scrollableParent) {
        scrollTop = scrollableParent.scrollTop;
      }

      if (scrollTop === 0) {
        startY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (startY === 0 || scrollTop > 0) return;

      currentY = e.touches[0].clientY;
      const distance = currentY - startY;

      if (distance > 0) {
        setPullDistance(Math.min(distance, threshold * 1.5));

        // Prevent default scroll when pulling down from top
        if (distance > 10) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = () => {
      if (pullDistance >= threshold && !isRefreshing) {
        handleRefresh();
      } else {
        setPullDistance(0);
      }
      startY = 0;
    };

    const findScrollableParent = (element: HTMLElement | null): HTMLElement | null => {
      while (element) {
        const overflowY = window.getComputedStyle(element).overflowY;
        if (overflowY === 'auto' || overflowY === 'scroll') {
          return element;
        }
        element = element.parentElement;
      }
      return document.documentElement;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, pullDistance, isRefreshing, handleRefresh]);

  return {
    isRefreshing,
    pullDistance,
  };
};
