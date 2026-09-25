import { buildWhatsAppUrl, DEFAULT_MESSAGE } from '../whatsapp.js';

export default function Nav() {
  return (
    <header>
      <div className="nav">
        <div className="logo">
          <img src="/logo.png" alt="Shine & Sparkle Cleaning" className="logo-img" />
        </div>
        <nav className="nav-links">
          <a href="#services">Services</a>
          <a href="#process">How it works</a>
          <a href="#reviews">Reviews</a>
          <a href="#contact">Contact</a>
        </nav>
        <a
          className="nav-cta"
          href={buildWhatsAppUrl(DEFAULT_MESSAGE)}
          target="_blank"
          rel="noopener noreferrer"
        >
          Get a quote
        </a>
      </div>
    </header>
  );
}
