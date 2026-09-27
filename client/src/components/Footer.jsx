import { useConfig } from '../context/ConfigContext.jsx';

export default function Footer() {
  const { settings, getWhatsAppUrl } = useConfig();

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
              Professional cleaning service tailored to your home and office. Book in minutes via WhatsApp, with transparent per-m² pricing and zero hidden fees.
            </p>
          </div>

          {/* Contact column */}
          <div className="footer-col footer-contact-col">
            <h4 className="footer-col-title">CONTACT US</h4>

            <div className="footer-info-group">
              <div className="footer-info-label">Address:</div>
              <div className="footer-info-val">
                {settings.cities || 'Kyiv & surrounding areas'}
              </div>
            </div>

            <div className="footer-info-group">
              <div className="footer-info-label">Contact:</div>
              <div className="footer-info-val">
                <a href={getWhatsAppUrl()} target="_blank" rel="noopener noreferrer">
                  {settings.whatsappDisplay}
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
              <li><a href="#">Home</a></li>
              <li><a href="#services">Services</a></li>
              <li><a href="#process">How it works</a></li>
              <li><a href="#reviews">Reviews</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} {settings.brandName}. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
