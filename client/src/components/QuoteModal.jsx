import { useState, useEffect } from 'react';
import { useConfig } from '../context/ConfigContext.jsx';
import { buildQuoteWhatsAppMessage } from '../whatsapp.js';
import SendButton from './SendButton.jsx';

export default function QuoteModal({ isOpen, onClose, initialServiceId }) {
  const { services, settings, getWhatsAppUrl } = useConfig();

  const defaultServiceId = services.length > 0 ? services[0].id : '';
  const [serviceId, setServiceId] = useState(initialServiceId || defaultServiceId);
  const [area, setArea] = useState('');
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');

  // Update selected service if initialServiceId changes
  useEffect(() => {
    if (initialServiceId) {
      setServiceId(initialServiceId);
    } else if (services.length > 0 && !serviceId) {
      setServiceId(services[0].id);
    }
  }, [initialServiceId, services]);

  // Handle ESC key and body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentService = services.find((s) => s.id === serviceId) || services[0] || {};

  function handleSubmit(e) {
    e.preventDefault();

    const quoteText = buildQuoteWhatsAppMessage({
      serviceName: currentService.name,
      cadence: currentService.cadence,
      areaSqm: area.trim() ? area.trim() : undefined,
      name: name,
      notes: notes,
      brandName: settings.brandName,
    });

    const url = getWhatsAppUrl(quoteText);
    window.open(url, '_blank');
    onClose();
  }

  return (
    <div className="modal-overlay open" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="Close quote modal"
        >
          ✕
        </button>

        <h3>Request a Quote</h3>
        <p className="modal-sub">
          Fill in your details and we’ll format an instant message for WhatsApp.
        </p>

        <form onSubmit={handleSubmit}>
          <label className="field-label">Select Service</label>
          <select
            className="field-input"
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <label className="field-label">Apartment / Space details (optional)</label>
          <input
            type="text"
            className="field-input"
            placeholder="e.g. 65 m² or 2 bedrooms"
            value={area}
            onChange={(e) => setArea(e.target.value)}
          />

          <label className="field-label">Your Name (optional)</label>
          <input
            type="text"
            className="field-input"
            placeholder="e.g. Alex"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <label className="field-label">Notes or specific requests</label>
          <textarea
            className="field-textarea"
            placeholder="e.g. 2 bedrooms, have 1 cat, windows need washing, prefer Saturday morning..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />

          <div className="divider" style={{ margin: '16px 0 20px' }} />

          <SendButton text="Send Quote to WhatsApp" />
        </form>
      </div>
    </div>
  );
}
