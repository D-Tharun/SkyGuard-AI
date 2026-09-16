import { useEffect, useRef, useState } from 'react';
import { animate } from 'animejs';

/**
 * Check if the user has requested reduced motion.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Hook to smoothly animate numeric values using Anime.js
 * Respects prefers-reduced-motion by instantly setting the target value.
 */
export function useAnimatedNumber(
  targetValue: number | string,
  decimals: number = 1,
  duration: number = 380
): string | number {
  const [displayValue, setDisplayValue] = useState<string | number>(targetValue);
  const prevValRef = useRef<number>(
    typeof targetValue === 'number' ? targetValue : parseFloat(targetValue) || 0
  );
  const animTargetRef = useRef<{ val: number }>({ val: prevValRef.current });

  useEffect(() => {
    const num = typeof targetValue === 'number' ? targetValue : parseFloat(targetValue);
    if (isNaN(num)) {
      setDisplayValue(targetValue);
      return;
    }

    if (prefersReducedMotion()) {
      setDisplayValue(decimals > 0 ? num.toFixed(decimals) : Math.round(num).toString());
      prevValRef.current = num;
      return;
    }

    const startVal = prevValRef.current;
    animTargetRef.current.val = startVal;

    const anim = animate(animTargetRef.current, {
      val: num,
      duration: duration,
      ease: 'outQuad',
      onUpdate: () => {
        const current = animTargetRef.current.val;
        setDisplayValue(
          decimals > 0 ? current.toFixed(decimals) : Math.round(current).toString()
        );
      },
      onComplete: () => {
        setDisplayValue(decimals > 0 ? num.toFixed(decimals) : Math.round(num).toString());
        prevValRef.current = num;
      },
    });

    return () => {
      anim.pause();
    };
  }, [targetValue, decimals, duration]);

  return displayValue;
}

/**
 * Framer Motion transition presets for subtle, restrained UI transitions.
 */
export const transitions = {
  page: {
    initial: { opacity: 0, y: 3 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -2 },
    transition: { duration: 0.16, ease: [0.25, 1, 0.5, 1] },
  },
  cardEnter: {
    initial: { opacity: 0, y: 4 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.18, ease: 'easeOut' },
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.14, ease: 'easeOut' },
  },
  accordion: {
    initial: { opacity: 0, height: 0 },
    animate: { opacity: 1, height: 'auto' },
    exit: { opacity: 0, height: 0 },
    transition: { duration: 0.2, ease: [0.04, 0.62, 0.23, 0.98] },
  },
};
