import { useConfig } from '../context/ConfigContext.jsx';
import { DEFAULT_MESSAGE } from '../whatsapp.js';

export default function CTA({ onOpenQuote }) {
  const { getWhatsAppUrl } = useConfig();

  return (
    <div className="cta-outer">
      <div className="cta">
        <div className="blob blob-1" style={{ top: '-60px', left: '-40px' }} />
        <div className="blob blob-2" style={{ bottom: '-80px', right: '-40px', top: 'auto' }} />
        <h2>Ready to book a cleaner for this week?</h2>
        <p>Request your quote and message us on WhatsApp to confirm a time that works for you.</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', position: 'relative', zIndex: 2 }}>
          {onOpenQuote && (
            <button
              type="button"
              className="btn-primary"
              onClick={onOpenQuote}
              style={{ cursor: 'pointer' }}
            >
              Get a quote
            </button>
          )}
          <a
            className="btn-primary"
            style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}
            href={getWhatsAppUrl(DEFAULT_MESSAGE)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Chat directly on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
