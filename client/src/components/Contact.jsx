import { useState } from 'react';
import { submitContact } from '../api.js';
import { buildWhatsAppUrl, DEFAULT_MESSAGE, WHATSAPP_DISPLAY } from '../whatsapp.js';

const initialForm = { name: '', email: '', phone: '', message: '' };

export default function Contact() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState({ state: 'idle', message: '' });

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ state: 'submitting', message: '' });
    try {
      await submitContact(form);
      setStatus({ state: 'success', message: "Thanks — we'll get back to you shortly." });
      setForm(initialForm);
    } catch (err) {
      setStatus({ state: 'error', message: err.message });
    }
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
            style={{ width: '100%', justifyContent: 'center', marginBottom: '10px' }}
            href={buildWhatsAppUrl(DEFAULT_MESSAGE)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Chat on WhatsApp — {WHATSAPP_DISPLAY}
          </a>
          <div className="divider" />

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div>
                <label className="field-label">Name</label>
                <input
                  className="field-input"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="field-label">Email</label>
                <input
                  type="email"
                  className="field-input"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <label className="field-label">Phone (optional)</label>
            <input
              className="field-input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+1 555 123 4567"
            />

            <label className="field-label">Message</label>
            <textarea
              className="field-textarea"
              required
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="What would you like to know?"
            />

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={status.state === 'submitting'}
            >
              {status.state === 'submitting' ? 'Sending…' : 'Send message'}
            </button>
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
