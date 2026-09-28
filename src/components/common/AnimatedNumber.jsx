import { useEffect, useState } from 'react';

export default function AnimatedNumber({ 
  value, 
  duration = 900, 
  prefix = '', 
  suffix = '', 
  decimals = 0,
  triggerKey = 0 
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayValue(value);
      return;
    }

    const target = typeof value === 'number' ? value : parseFloat(value) || 0;
    const start = 0;
    const startTime = performance.now();

    const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);

    const updateCounter = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);

      const current = start + (target - start) * easedProgress;
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        setDisplayValue(target);
      }
    };

    const animId = requestAnimationFrame(updateCounter);
    return () => cancelAnimationFrame(animId);
  }, [value, duration, triggerKey]);

  const formatted = decimals > 0 
    ? displayValue.toFixed(decimals) 
    : Math.round(displayValue).toLocaleString();

  return (
    <span style={{ fontVariantNumeric: 'tabular-nums' }}>
      {prefix}{formatted}{suffix}
    </span>
  );
}
