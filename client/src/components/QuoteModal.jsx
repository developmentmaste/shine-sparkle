import { useState, useEffect } from 'react';
import { useConfig } from '../context/ConfigContext.jsx';
import { buildContactWhatsAppMessage, DEFAULT_MESSAGE } from '../whatsapp.js';
import SendButton from './SendButton.jsx';
import whatsappIcon from '../assets/whatsapp-svgrepo-com.svg';

export default function QuoteModal({ isOpen, onClose, initialServiceId }) {
  const { services, settings, getWhatsAppUrl } = useConfig();

  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [serviceId, setServiceId] = useState(initialServiceId || '');
  const [nameError, setNameError] = useState(false);
  const [messageError, setMessageError] = useState(false);

  // When opened with a specific serviceId or when initialServiceId changes
  useEffect(() => {
    if (initialServiceId) {
      setServiceId(initialServiceId);
      const svc = services.find((s) => s.id === initialServiceId);
      if (svc) {
        setMessage(`Hi! I'd like to ask about ${svc.name}. `);
      }
    } else {
      setServiceId('');
      setMessage('');
    }
    setName('');
    setNameError(false);
    setMessageError(false);
  }, [initialServiceId, services, isOpen]);

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

  const currentService = services.find((s) => s.id === serviceId);

  function handleSubmit(e) {
    e.preventDefault();
    let hasError = false;

    if (!name.trim()) {
      setNameError(true);
      hasError = true;
    } else {
      setNameError(false);
    }

    if (!message.trim()) {
      setMessageError(true);
      hasError = true;
    } else {
      setMessageError(false);
    }

    if (hasError) return;

    const formattedMessage = buildContactWhatsAppMessage({
      name: name.trim(),
      message: currentService
        ? `[Inquiry: ${currentService.name}]\n${message.trim()}`
        : message.trim(),
      brandName: settings.brandName,
    });

    const url = getWhatsAppUrl(formattedMessage);
    window.open(url, '_blank');
    setName('');
    setMessage('');
    setNameError(false);
    setMessageError(false);
    onClose();
  }

  return (
    <div className="modal-overlay open" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="Close modal"
        >
          ✕
        </button>

        <h3>Questions or Booking?</h3>
        <p className="modal-sub">
          Fastest way to reach us is WhatsApp. Send your message below.
        </p>

        <a
          className="btn-primary"
          style={{
            width: '100%',
            justifyContent: 'center',
            textAlign: 'center',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '14px',
            padding: '13px 20px',
            fontSize: '0.94rem',
          }}
          href={getWhatsAppUrl(DEFAULT_MESSAGE)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>Chat on WhatsApp</span>
          <img
            src={whatsappIcon}
            alt="WhatsApp"
            style={{ width: '18px', height: '18px', objectFit: 'contain' }}
          />
        </a>

        <div className="divider" style={{ margin: '14px 0 18px' }} />

        <form onSubmit={handleSubmit} noValidate>
          {services.length > 0 && (
            <>
              <label className="field-label">Service (optional)</label>
              <select
                className="field-input"
                value={serviceId}
                onChange={(e) => {
                  const newId = e.target.value;
                  setServiceId(newId);
                  const svc = services.find((s) => s.id === newId);
                  if (svc && (!message || message.startsWith("Hi! I'd like to ask about"))) {
                    setMessage(`Hi! I'd like to ask about ${svc.name}. `);
                  }
                }}
              >
                <option value="">General inquiry / Other</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </>
          )}

          <label className="field-label">Name</label>
          <input
            className={`field-input${nameError ? ' has-error' : ''}`}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError(false);
            }}
            placeholder="Your name"
          />

          <label className="field-label">Message</label>
          <textarea
            className={`field-textarea${messageError ? ' has-error' : ''}`}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              if (messageError) setMessageError(false);
            }}
            placeholder="What would you like to know or book?"
            rows={4}
          />

          <div style={{ marginTop: '8px' }}>
            <SendButton text="Send message to WhatsApp" />
          </div>
        </form>
      </div>
    </div>
  );
}
