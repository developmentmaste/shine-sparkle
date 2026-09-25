import { buildWhatsAppUrl, DEFAULT_MESSAGE } from '../whatsapp.js';

export default function CTA() {
  return (
    <div className="cta-outer">
      <div className="cta">
        <div className="blob blob-1" style={{ top: '-60px', left: '-40px' }} />
        <div className="blob blob-2" style={{ bottom: '-80px', right: '-40px', top: 'auto' }} />
        <h2>Ready to book a cleaner for this week?</h2>
        <p>Message us on WhatsApp and we'll confirm a time that works for you.</p>
        <a
          className="btn-primary"
          href={buildWhatsAppUrl(DEFAULT_MESSAGE)}
          target="_blank"
          rel="noopener noreferrer"
        >
          Message us on WhatsApp
        </a>
      </div>
    </div>
  );
}
