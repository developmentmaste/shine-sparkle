import { useState } from 'react';
import { useConfig } from '../context/ConfigContext.jsx';

// Meadow layout of tiny pure-white 4-leaf clovers sprouting around the sitting character
const MEADOW_CLOVERS = [
  // Left outer meadow cluster
  { id: 1, right: 148, bottom: 1, size: 10, tilt: -22, delay: 290, opacity: 0.55, sway: 3.4, variant: 'solid' },
  { id: 2, right: 136, bottom: 2, size: 14, tilt: -10, delay: 250, opacity: 0.78, sway: 2.9, variant: 'line' },
  { id: 3, right: 124, bottom: 0, size: 11, tilt: 15, delay: 220, opacity: 0.65, sway: 3.2, variant: 'solid' },
  { id: 4, right: 112, bottom: 3, size: 16, tilt: -14, delay: 190, opacity: 0.9, sway: 2.7, variant: 'solid' },
  { id: 5, right: 99, bottom: 1, size: 12, tilt: 12, delay: 160, opacity: 0.72, sway: 3.5, variant: 'line' },
  { id: 6, right: 86, bottom: 2, size: 18, tilt: -8, delay: 130, opacity: 0.95, sway: 2.6, variant: 'solid' },
  { id: 7, right: 74, bottom: 0, size: 11, tilt: 19, delay: 105, opacity: 0.7, sway: 3.1, variant: 'solid' },
  { id: 8, right: 62, bottom: 3, size: 15, tilt: -16, delay: 75, opacity: 0.88, sway: 2.8, variant: 'line' },
  // Immediately left of the sitting character's knees
  { id: 9, right: 49, bottom: 1, size: 17, tilt: -24, delay: 40, opacity: 0.96, sway: 2.5, variant: 'solid' },
  { id: 10, right: 41, bottom: 0, size: 11, tilt: -12, delay: 20, opacity: 0.8, sway: 3.0, variant: 'solid' },
  // Foreground tiny clovers right at the character's feet
  { id: 11, right: 32, bottom: -2, size: 9, tilt: -18, delay: 0, opacity: 0.75, sway: 3.3, variant: 'line' },
  { id: 12, right: 7, bottom: -2, size: 10, tilt: 16, delay: 15, opacity: 0.78, sway: 3.1, variant: 'solid' },
  // Right side of the sitting character
  { id: 13, right: -6, bottom: 1, size: 15, tilt: 22, delay: 35, opacity: 0.92, sway: 2.7, variant: 'solid' },
  { id: 14, right: -16, bottom: 0, size: 11, tilt: 30, delay: 70, opacity: 0.7, sway: 3.2, variant: 'line' },
];

const MEADOW_SPORES = [
  { id: 1, right: 122, bottom: 18, size: 2.5, delay: 180 },
  { id: 2, right: 88, bottom: 24, size: 3, delay: 90 },
  { id: 3, right: 54, bottom: 22, size: 2.5, delay: 40 },
  { id: 4, right: 24, bottom: 44, size: 3, delay: 120 },
  { id: 5, right: -4, bottom: 20, size: 2.5, delay: 150 },
];

function WhiteFourLeafClover({ size = 14, variant = 'solid' }) {
  if (variant === 'line') {
    return (
      <svg
        width={size}
        height={size * 1.15}
        viewBox="0 0 24 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* 4 heart-shaped white line-art leaves matching character head */}
        <path
          d="M12 11C12 11 8 7 8 4.3C8 2.8 9.2 1.7 10.6 1.7C11.4 1.7 12 2.2 12 2.9C12 2.2 12.6 1.7 13.4 1.7C14.8 1.7 16 2.8 16 4.3C16 7 12 11 12 11Z"
          fill="rgba(255,255,255,0.18)"
          stroke="#FFFFFF"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path
          d="M12.5 11.5C12.5 11.5 16.5 7.5 19.2 7.5C20.7 7.5 21.8 8.7 21.8 10.1C21.8 10.9 21.3 11.5 20.6 11.5C21.3 11.5 21.8 12.1 21.8 12.9C21.8 14.3 20.7 15.5 19.2 15.5C16.5 15.5 12.5 11.5 12.5 11.5Z"
          fill="rgba(255,255,255,0.18)"
          stroke="#FFFFFF"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path
          d="M11.5 11.5C11.5 11.5 7.5 7.5 4.8 7.5C3.3 7.5 2.2 8.7 2.2 10.1C2.2 10.9 2.7 11.5 3.4 11.5C2.7 11.5 2.2 12.1 2.2 12.9C2.2 14.3 3.3 15.5 4.8 15.5C7.5 15.5 11.5 11.5 11.5 11.5Z"
          fill="rgba(255,255,255,0.18)"
          stroke="#FFFFFF"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path
          d="M12 12C12 12 15.8 15.8 15.8 18.4C15.8 19.8 14.7 20.9 13.3 20.9C12.6 20.9 12 20.4 12 19.7C12 20.4 11.4 20.9 10.7 20.9C9.3 20.9 8.2 19.8 8.2 18.4C8.2 15.8 12 12 12 12Z"
          fill="rgba(255,255,255,0.18)"
          stroke="#FFFFFF"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path
          d="M12 13C12 18.5 13.3 23 15.2 26.8"
          stroke="#FFFFFF"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size * 1.15}
      viewBox="0 0 24 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Pure white filled 4-leaf clover with stem */}
      <path
        d="M12 10.6C12 10.6 8.2 6.8 8.2 4.2C8.2 2.8 9.3 1.7 10.7 1.7C11.4 1.7 12 2.1 12 2.8C12 2.1 12.6 1.7 13.3 1.7C14.7 1.7 15.8 2.8 15.8 4.2C15.8 6.8 12 10.6 12 10.6Z"
        fill="#FFFFFF"
      />
      <path
        d="M12.5 11.2C12.5 11.2 16.3 7.4 18.9 7.4C20.3 7.4 21.4 8.5 21.4 9.9C21.4 10.6 21 11.2 20.3 11.2C21 11.2 21.4 11.8 21.4 12.5C21.4 13.9 20.3 15 18.9 15C16.3 15 12.5 11.2 12.5 11.2Z"
        fill="#FFFFFF"
      />
      <path
        d="M11.5 11.2C11.5 11.2 7.7 7.4 5.1 7.4C3.7 7.4 2.6 8.5 2.6 9.9C2.6 10.6 3 11.2 3.7 11.2C3 11.2 2.6 11.8 2.6 12.5C2.6 13.9 3.7 15 5.1 15C7.7 15 11.5 11.2 11.5 11.2Z"
        fill="#FFFFFF"
      />
      <path
        d="M12 11.8C12 11.8 15.6 15.4 15.6 17.9C15.6 19.2 14.6 20.3 13.2 20.3C12.5 20.3 12 19.9 12 19.2C12 19.9 11.5 20.3 10.8 20.3C9.4 20.3 8.4 19.2 8.4 17.9C8.4 15.4 12 11.8 12 11.8Z"
        fill="#FFFFFF"
      />
      <path
        d="M12 13C12 18.5 13.3 23 15.2 26.8"
        stroke="#FFFFFF"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Footer({ onNavigate }) {
  const { settings, getWhatsAppUrl } = useConfig();
  const [meadowOpen, setMeadowOpen] = useState(false);

  const handleLegalClick = (e, path) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.location.href = path;
    }
  };

  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-main">
          {/* Brand info on left */}
          <div className="footer-brand">
            <img
              src="/footerlogo.png"
              alt={settings.brandName}
              className="footer-logo"
            />
            <p className="footer-brand-desc">
              Professional residential and commercial cleaning across Dublin, Co. Meath, and Co. Louth. Book in minutes via WhatsApp with transparent pricing and zero hidden fees.
            </p>
          </div>

          {/* Contact column */}
          <div className="footer-col footer-contact-col">
            <h4 className="footer-col-title">CONTACT US</h4>

            <div className="footer-info-group">
              <div className="footer-info-label">Address:</div>
              <div className="footer-info-val">
                {settings.cities || 'Dublin & surrounding areas'}
              </div>
            </div>

            <div className="footer-info-group">
              <div className="footer-info-label">Contact:</div>
              <div className="footer-info-val">
                <a href={getWhatsAppUrl()} target="_blank" rel="noopener noreferrer">
                  WhatsApp Chat
                </a>
              </div>
            </div>

            <div className="footer-info-group">
              <div className="footer-info-label">E-mail:</div>
              <div className="footer-info-val">
                <a href={`mailto:${settings.email}`}>{settings.email}</a>
              </div>
            </div>
          </div>

          {/* Navigate column */}
          <div className="footer-col footer-nav-col">
            <h4 className="footer-col-title">NAVIGATE</h4>
            <ul className="footer-nav-list">
              <li><a href="#" onClick={(e) => { if (onNavigate) { e.preventDefault(); onNavigate('/'); } }}>Home</a></li>
              <li><a href="#services" onClick={(e) => { if (onNavigate) { e.preventDefault(); onNavigate('/#services'); } }}>Services</a></li>
              <li><a href="#process" onClick={(e) => { if (onNavigate) { e.preventDefault(); onNavigate('/#process'); } }}>How it works</a></li>
              <li><a href="#reviews" onClick={(e) => { if (onNavigate) { e.preventDefault(); onNavigate('/#reviews'); } }}>Reviews</a></li>
              <li><a href="#contact" onClick={(e) => { if (onNavigate) { e.preventDefault(); onNavigate('/#contact'); } }}>Contact</a></li>
              <li><a href="/terms" onClick={(e) => handleLegalClick(e, '/terms')}>Terms & Conditions</a></li>
              <li><a href="/privacy" onClick={(e) => handleLegalClick(e, '/privacy')}>Privacy Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-bottom-left">
            <span>© {new Date().getFullYear()} {settings.brandName}. All rights reserved.</span>
            <div className="footer-legal-inline">
              <a href="/terms" onClick={(e) => handleLegalClick(e, '/terms')}>Terms & Conditions</a>
              <span className="dot">•</span>
              <a href="/privacy" onClick={(e) => handleLegalClick(e, '/privacy')}>Privacy Policy</a>
              <span className="dot">•</span>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('open_cookie_settings'))}
                className="footer-cookie-btn"
              >
                Cookie Preferences
              </button>
            </div>
          </div>

          <div className={`footer-creator ${meadowOpen ? 'is-blooming' : ''}`}>
            {/* Interactive Meadow of tiny pure-white 4-leaf clovers */}
            <div className="clover-meadow" aria-hidden="true">
              {/* Soft ground horizon line when meadow blooms */}
              <span className="clover-meadow-ground" />

              {MEADOW_CLOVERS.map((c) => (
                <span
                  key={c.id}
                  className="clover-sprout"
                  style={{
                    right: `${c.right}px`,
                    bottom: `${c.bottom}px`,
                    '--clover-tilt': `${c.tilt}deg`,
                    '--clover-delay': `${c.delay}ms`,
                    '--clover-opacity': c.opacity,
                    '--clover-sway': `${c.sway}s`,
                  }}
                >
                  <span className="clover-sway-inner">
                    <WhiteFourLeafClover size={c.size} variant={c.variant} />
                  </span>
                </span>
              ))}

              {MEADOW_SPORES.map((s) => (
                <span
                  key={s.id}
                  className="clover-spore"
                  style={{
                    right: `${s.right}px`,
                    bottom: `${s.bottom}px`,
                    width: `${s.size}px`,
                    height: `${s.size}px`,
                    '--spore-delay': `${s.delay}ms`,
                  }}
                />
              ))}
            </div>

            <button
              type="button"
              className="footer-creator-btn"
              onClick={() => setMeadowOpen((prev) => !prev)}
              aria-label="Creator logo"
            >
              <img
                src="/creator-logo.png"
                alt="Creator Logo"
                className="footer-creator-logo"
              />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
