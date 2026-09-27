import { useState } from 'react';
import { useConfig } from '../context/ConfigContext.jsx';
import { buildContactWhatsAppMessage, DEFAULT_MESSAGE } from '../whatsapp.js';
import SendButton from './SendButton.jsx';
import whatsappIcon from '../assets/whatsapp-svgrepo-com.svg';

const initialForm = { name: '', message: '' };

export default function Contact() {
  const { settings, getWhatsAppUrl } = useConfig();
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState({ state: 'idle', message: '' });

  function handleSubmit(e) {
    e.preventDefault();
    const message = buildContactWhatsAppMessage({
      ...form,
      brandName: settings.brandName,
    });
    const url = getWhatsAppUrl(message);
    window.open(url, '_blank');
    setStatus({
      state: 'success',
      message: "Opening WhatsApp with your message! We'll reply shortly.",
    });
    setForm(initialForm);
  }

  return (
    <section className="section" id="contact">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">Contact</span>
          <h2>Questions before you book?</h2>
          <p>Fastest way to reach us is WhatsApp. The form below works too.</p>
        </div>

        <div className="contact-card">
          <a
            className="btn-primary"
            style={{
              width: '100%',
              justifyContent: 'center',
              textAlign: 'center',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '10px',
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
          <div className="divider" />

          <form onSubmit={handleSubmit}>
            <label className="field-label">Name</label>
            <input
              className="field-input"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Your name"
            />

            <label className="field-label">Message</label>
            <textarea
              className="field-textarea"
              required
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="What would you like to know?"
            />

            <SendButton text="Send message to WhatsApp" />
          </form>

          {status.state === 'success' && (
            <div className="form-msg success" style={{ marginTop: '16px' }}>
              {status.message}
            </div>
          )}
          {status.state === 'error' && (
            <div className="form-msg error" style={{ marginTop: '16px' }}>
              {status.message}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
