import { useState, useEffect } from 'react';

const STORAGE_KEY = 'shine_sparkle_cookie_consent';

export default function CookieBanner({ onNavigate }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if consent has already been recorded
    try {
      const consent = localStorage.getItem(STORAGE_KEY);
      if (!consent) {
        // Small delay so page loads gracefully first
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 600);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      // LocalStorage access failure fallback
      setIsVisible(true);
    }
  }, []);

  // Listen for external trigger to reopen banner (e.g. from footer)
  useEffect(() => {
    const handleReopen = () => setIsVisible(true);
    window.addEventListener('open_cookie_settings', handleReopen);
    return () => window.removeEventListener('open_cookie_settings', handleReopen);
  }, []);

  const updateGtagConsent = (granted) => {
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        'analytics_storage': granted ? 'granted' : 'denied'
      });
    }
  };

  const handleAcceptAll = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        essential: true,
        analytics: true,
        timestamp: new Date().toISOString()
      }));
    } catch (e) {}
    updateGtagConsent(true);
    setIsVisible(false);
  };

  const handleEssentialOnly = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        essential: true,
        analytics: false,
        timestamp: new Date().toISOString()
      }));
    } catch (e) {}
    updateGtagConsent(false);
    setIsVisible(false);
  };

  const handlePrivacyClick = (e) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate('/privacy#p-8');
    } else {
      window.location.href = '/privacy#p-8';
    }
  };

  if (!isVisible) return null;

  return (
    <aside
      className="cookie-banner-wrapper"
      role="region"
      aria-label="Cookie and Privacy Consent"
    >
      <div className="cookie-banner-card">
        <div className="cookie-banner-header">
          <div className="cookie-icon-wrap" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"></path>
              <circle cx="8.5" cy="8.5" r="1" fill="currentColor"></circle>
              <circle cx="16" cy="15.5" r="1" fill="currentColor"></circle>
              <circle cx="9" cy="16" r="1.2" fill="currentColor"></circle>
              <circle cx="13" cy="11.5" r="0.9" fill="currentColor"></circle>
            </svg>
          </div>
          <div className="cookie-banner-title">
            Cookie & Analytics Notice
          </div>
        </div>

        <p className="cookie-banner-text">
          We use essential cookies to keep our website running securely and reliably. With your consent, we also use anonymous analytics cookies to understand site performance, measure traffic, and improve our cleaning services.{' '}
          <a
            href="/privacy#p-8"
            onClick={handlePrivacyClick}
            className="cookie-privacy-link"
          >
            Learn more in our Privacy Policy
          </a>.
        </p>

        <div className="cookie-banner-actions">
          <button
            type="button"
            className="cookie-btn cookie-btn-primary"
            onClick={handleAcceptAll}
          >
            Accept All
          </button>
          <button
            type="button"
            className="cookie-btn cookie-btn-ghost"
            onClick={handleEssentialOnly}
          >
            Essential Only
          </button>
        </div>
      </div>
    </aside>
  );
}

