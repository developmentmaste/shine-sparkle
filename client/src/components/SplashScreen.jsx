import { useState, useEffect, useCallback } from 'react';
import DrawLoopSvg from './DrawLoopSvg.jsx';

export default function SplashScreen({ onFinish }) {
  const [isFading, setIsFading] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const handleDismiss = useCallback(() => {
    setIsFading(true);
    setTimeout(() => {
      setIsDismissed(true);
      if (onFinish) onFinish();
    }, 500);
  }, [onFinish]);

  useEffect(() => {
    // Total animation cycle in Draw loop is ~5.5-6s.
    // Start auto fade-out after drawing completes and settles:
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, 5200);

    const removeTimer = setTimeout(() => {
      setIsDismissed(true);
      if (onFinish) onFinish();
    }, 5800);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        handleDismiss();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleDismiss, onFinish]);

  if (isDismissed || (typeof window !== 'undefined' && window.location.hash === '#admin')) {
    return null;
  }

  return (
    <div
      className={`splash-overlay ${isFading ? 'is-fading' : ''}`}
      onClick={handleDismiss}
      role="banner"
      aria-label="Welcome animation"
    >
      <button
        type="button"
        className="splash-skip-btn"
        onClick={(e) => {
          e.stopPropagation();
          handleDismiss();
        }}
        aria-label="Skip intro animation"
      >
        Пропустити ✕
      </button>

      <div className="splash-stage">
        <DrawLoopSvg className="splash-svg" />
      </div>

      <span className="splash-hint">Натисніть у будь-якому місці, щоб пропустити</span>
    </div>
  );
}
