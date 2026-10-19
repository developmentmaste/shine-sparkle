import { useConfig } from '../context/ConfigContext.jsx';

export default function Footer({ onNavigate }) {
  const { settings, getWhatsAppUrl } = useConfig();

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
      </div>
    </footer>
  );
}
