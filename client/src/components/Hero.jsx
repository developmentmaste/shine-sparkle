import { buildWhatsAppUrl, DEFAULT_MESSAGE } from '../whatsapp.js';

export default function Hero() {
  return (
    <section className="hero">
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />
      <div className="hero-inner">
        <span className="eyebrow">Now booking in 6 cities</span>
        <h1>Home cleaning, without the back and forth</h1>
        <p className="lead">
          Shine & Sparkle Cleaning matches you with a vetted local cleaner and gets
          you a straight answer on WhatsApp in minutes, no forms to fill out.
        </p>
        <div className="hero-actions">
          <a
            className="btn-primary"
            href={buildWhatsAppUrl(DEFAULT_MESSAGE)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Chat on WhatsApp
          </a>
          <a href="#services" className="btn-secondary">
            See our services
          </a>
        </div>
      </div>
    </section>
  );
}
