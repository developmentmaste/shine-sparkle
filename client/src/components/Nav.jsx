import { useState, useEffect } from 'react';
import { useConfig } from '../context/ConfigContext.jsx';
import { DEFAULT_MESSAGE } from '../whatsapp.js';

export default function Nav({ onOpenQuote }) {
  const { settings, getWhatsAppUrl } = useConfig();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Prevent background scrolling when fullscreen menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Close mobile menu on Escape key
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileMenuOpen]);

  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  const handleQuoteClick = () => {
    setMobileMenuOpen(false);
    if (onOpenQuote) {
      onOpenQuote();
    } else {
      window.open(getWhatsAppUrl(DEFAULT_MESSAGE), '_blank');
    }
  };

  return (
    <header className="site-header">
      <div className="nav">
        <div className="logo">
          <a href="#" style={{ display: 'flex', alignItems: 'center' }}>
            <img src="/logo.png" alt={settings.brandName} className="logo-img" />
          </a>
        </div>

        {/* Desktop nav links */}
        <nav className="nav-links">
          <a href="#services">Services</a>
          <a href="#process">How it works</a>
          <a href="#reviews">Reviews</a>
          <a href="#contact">Contact</a>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            className="nav-cta"
            onClick={onOpenQuote || (() => window.open(getWhatsAppUrl(DEFAULT_MESSAGE), '_blank'))}
          >
            Get a quote
          </button>

          {/* Static 3 horizontal stripes menu button */}
          <button
            type="button"
            className="menu-hamburger-btn"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Fullscreen Mobile Navigation Menu (Slides in from Left to Right) */}
      <div id="menu" className={mobileMenuOpen ? 'open' : ''} aria-hidden={!mobileMenuOpen}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src="/logo.png" alt={settings.brandName} style={{ height: '38px', width: 'auto' }} />
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--ink)' }}>
                  {settings.brandName}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--ink-soft)' }}>
                  Professional Cleaning Service
                </div>
              </div>
            </div>
            <button
              type="button"
              className="menu-close-btn"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close navigation menu"
            >
              ✕
            </button>
          </div>

          <ul style={{ listStyle: 'none', padding: 0, margin: '10px 0 20px' }}>
            <li>
              <a href="#services" className="menu-text-link" onClick={handleNavClick}>
                Services
              </a>
            </li>
            <li>
              <a href="#process" className="menu-text-link" onClick={handleNavClick}>
                How it works
              </a>
            </li>
            <li>
              <a href="#reviews" className="menu-text-link" onClick={handleNavClick}>
                Reviews
              </a>
            </li>
            <li>
              <a href="#contact" className="menu-text-link" onClick={handleNavClick}>
                Contact
              </a>
            </li>
          </ul>
        </div>

        <div className="menu-bottom-actions">
          <button
            type="button"
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '16px' }}
            onClick={handleQuoteClick}
          >
            <span>Request a Quote</span>
          </button>

          <a
            className="btn-secondary"
            style={{
              width: '100%',
              justifyContent: 'center',
              display: 'inline-flex',
              alignItems: 'center',
              padding: '14px',
            }}
            href={getWhatsAppUrl(DEFAULT_MESSAGE)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleNavClick}
          >
            <span>Chat on WhatsApp</span>
          </a>

          <div
            style={{
              fontSize: '0.84rem',
              color: 'var(--ink-soft)',
              textAlign: 'center',
              marginTop: '4px',
            }}
          >
            WhatsApp: <b>{settings.whatsappDisplay}</b>
          </div>
        </div>
      </div>
    </header>
  );
}
