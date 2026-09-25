export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <img src="/logo.png" alt="Shine & Sparkle Cleaning" style={{ height: '52px', width: 'auto', marginBottom: '14px' }} />
            <p>Book home cleaning through WhatsApp. Vetted cleaners, transparent pricing, pay only after the job is done.</p>
          </div>
          <div>
            <h4>Contact</h4>
            <ul>
              <li><a href="https://wa.me/15551234567" target="_blank" rel="noopener noreferrer">WhatsApp: +1 555 123 4567</a></li>
              <li><a href="mailto:hello@shinesparklecleaning.com">hello@shinesparklecleaning.com</a></li>
              <li>Serving 6 metro areas</li>
            </ul>
          </div>
          <div>
            <h4>Services</h4>
            <ul>
              <li><a href="#services">Apartment cleaning</a></li>
              <li><a href="#services">Post-renovation cleaning</a></li>
              <li><a href="#services">Move-out cleaning</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Shine & Sparkle Cleaning</span>
        </div>
      </div>
    </footer>
  );
}
