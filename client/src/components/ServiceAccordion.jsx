import { useState } from 'react';
import { SERVICES } from '../services.js';
import { buildWhatsAppUrl } from '../whatsapp.js';
import whatsappIcon from '../assets/whatsapp-svgrepo-com.svg'; // Імпортуємо іконку WhatsApp

export default function ServiceAccordion() {
  const [openId, setOpenId] = useState(null);

  return (
    <section className="section" id="services">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">Choose a cleaning type</span>
          <h2>Pick what your space needs</h2>
          <p>Tap a service to see what's included, then request a quote for that job.</p>
        </div>

        <div className="service-list">
          {SERVICES.map((service) => {
            const isOpen = openId === service.id;
            return (
              <div className={`service-card${isOpen ? ' open' : ''}`} key={service.id}>
                <button
                  type="button"
                  className="service-head"
                  onClick={() => setOpenId(isOpen ? null : service.id)}
                >
                  <div className="service-icon" style={{ background: service.iconBg }}>
                    {service.icon ? (
                      <img
                        src={service.icon}
                        alt={service.name}
                        style={{ width: '24px', height: '24px', objectFit: 'contain' }}
                      />
                    ) : (
                      service.name.charAt(0)
                    )}
                  </div>
                  <div className="info">
                    <h3>{service.name}</h3>
                    <div className="price-tag">
                      from ${service.rate}/m² · {service.cadence}
                    </div>
                  </div>
                  <div className="chevron">+</div>
                </button>

                <div
                  className="service-detail"
                  style={{ maxHeight: isOpen ? '420px' : '0px' }}
                >
                  <div className="service-detail-inner">
                    <p>{service.description}</p>
                    <ul>
                      {service.included.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <a
                      className="btn-quote"
                      href={buildWhatsAppUrl(
                        `Hi Shine & Sparkle Cleaning, I'd like a quote for ${service.name} (${service.cadence}). My apartment is about __ m2.`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <span>Quote this on WhatsApp</span>
                      <img
                        src={whatsappIcon}
                        alt="WhatsApp"
                        style={{ width: '18px', height: '18px', objectFit: 'contain' }}
                      />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}