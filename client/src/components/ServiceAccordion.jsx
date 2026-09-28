import { useState, useEffect } from 'react';
import { useConfig } from '../context/ConfigContext.jsx';
import whatsappIcon from '../assets/whatsapp-svgrepo-com.svg';

export default function ServiceAccordion({ onOpenQuote }) {
  const { services, getWhatsAppUrl } = useConfig();
  const [openId, setOpenId] = useState(null);
  const [current, setCurrent] = useState(0);
  const [startX, setStartX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const len = services.length;

  const next = () => {
    if (len === 0) return;
    setCurrent((prev) => (prev + 1) % len);
  };

  const prev = () => {
    if (len === 0) return;
    setCurrent((prev) => (prev - 1 + len) % len);
  };

  useEffect(() => {
    if (current >= len && len > 0) {
      setCurrent(0);
    }
  }, [len, current]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [len]);

  const handlePointerDown = (e) => {
    setIsDragging(true);
    const clientX = e.clientX ?? (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    setStartX(clientX);
  };

  const handlePointerUp = (e) => {
    if (!isDragging) return;
    setIsDragging(false);
    const clientX = e.clientX ?? (e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX : 0);
    const dx = clientX - startX;
    if (dx > 40) {
      prev();
    } else if (dx < -40) {
      next();
    }
  };

  return (
    <section className="section" id="services">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">Choose a cleaning type</span>
          <h2>Pick what your space needs</h2>
          <p>Tap a service to see what's included, then request a quote for that job.</p>
        </div>

        {/* DESKTOP VIEW: Classic Expandable Accordion */}
        <div className="service-list service-view-accordion">
          {services.map((service) => {
            const isOpen = openId === service.id;
            return (
              <div className={`service-card${isOpen ? ' open' : ''}`} key={service.id}>
                <button
                  type="button"
                  className="service-head"
                  onClick={() => setOpenId(isOpen ? null : service.id)}
                >
                  <div className="service-icon" style={{ background: service.iconBg || '#E3EFFB' }}>
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
                      from €{service.rate}/m² · {service.cadence}
                    </div>
                  </div>
                  <div className="chevron">+</div>
                </button>

                <div
                  className="service-detail"
                  style={{ maxHeight: isOpen ? '460px' : '0px' }}
                >
                  <div className="service-detail-inner">
                    <p>{service.description}</p>
                    <ul>
                      {(service.included || []).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      className="btn-quote"
                      onClick={() =>
                        onOpenQuote
                          ? onOpenQuote(service.id)
                          : window.open(getWhatsAppUrl(), '_blank')
                      }
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
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* MOBILE VIEW: 3D Stacked Card Deck Slider */}
        <div className="service-slider-wrap service-view-slider">
          <div
            className="service-slider-stage"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchEnd={handlePointerUp}
          >
            <div className="service-slider-track">
              {services.map((service, i) => {
                let offset = i - current;
                if (offset > len / 2) offset -= len;
                if (offset < -len / 2) offset += len;

                const abs = Math.abs(offset);
                const x = offset * 54;
                const scale = abs === 0 ? 1 : 0.94;
                const opacity = abs > 1 ? 0 : abs === 0 ? 1 : 0.92;
                const z = 10 - abs;
                const bg = abs === 0 ? 'var(--white)' : '#E6F0FA';
                const border = abs === 0 ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(20, 57, 95, 0.16)';
                const boxShadow = abs === 0 ? '0 16px 40px rgba(20, 57, 95, 0.16)' : '0 8px 24px rgba(20, 57, 95, 0.12)';

                return (
                  <div
                    key={service.id || i}
                    className="service-deck-card"
                    style={{
                      transform: `translate(-50%, -50%) translateX(${x}px) scale(${scale})`,
                      zIndex: z,
                      opacity: opacity,
                      background: bg,
                      border: border,
                      boxShadow: boxShadow,
                      pointerEvents: 'auto',
                      cursor: abs === 0 ? 'grab' : 'pointer',
                      display: abs > 1 ? 'none' : 'flex',
                    }}
                    onClick={() => {
                      if (i !== current) setCurrent(i);
                    }}
                  >
                    <div style={{ opacity: abs === 0 ? 1 : 0.55, transition: 'opacity 0.3s ease' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          marginBottom: '12px',
                        }}
                      >
                        <div
                          className="service-icon"
                          style={{
                            background: service.iconBg || '#E3EFFB',
                            width: '46px',
                            height: '46px',
                            borderRadius: '12px',
                            margin: 0,
                            flexShrink: 0,
                          }}
                        >
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
                        <div>
                          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
                            {service.name}
                          </h3>
                          <div
                            className="card-price"
                            style={{ fontSize: '0.88rem', color: 'var(--ink-soft)', marginTop: '2px' }}
                          >
                            from <b>€{service.rate}/m²</b>
                          </div>
                        </div>
                      </div>

                      <p className="card-desc" style={{ fontSize: '0.88rem', lineHeight: 1.45, margin: '10px 0 12px' }}>
                        {service.description}
                      </p>

                      <ul className="card-included" style={{ gap: '6px', fontSize: '0.84rem', margin: '0 0 14px 0' }}>
                        {(service.included || []).slice(0, 4).map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    <button
                      type="button"
                      className="btn-quote"
                      style={{
                        width: '100%',
                        justifyContent: 'center',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 18px',
                        fontSize: '0.92rem',
                        borderRadius: '100px',
                        marginTop: 'auto',
                        flexShrink: 0,
                        opacity: abs === 0 ? 1 : 0,
                        pointerEvents: abs === 0 ? 'auto' : 'none',
                        transition: 'opacity 0.25s ease',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onOpenQuote) onOpenQuote(service.id);
                      }}
                    >
                      <span>Quote on WhatsApp</span>
                      <img
                        src={whatsappIcon}
                        alt="WhatsApp"
                        style={{ width: '18px', height: '18px', objectFit: 'contain' }}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}