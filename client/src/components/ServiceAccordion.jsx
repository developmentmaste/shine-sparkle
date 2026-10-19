import { useState, useEffect, useRef } from 'react';
import { useConfig } from '../context/ConfigContext.jsx';
import { resolveServiceIcon } from '../services.js';
import whatsappIcon from '../assets/whatsapp-svgrepo-com.svg';

export default function ServiceAccordion({ onOpenQuote }) {
  const { services, getWhatsAppUrl } = useConfig();
  const [openId, setOpenId] = useState(null);
  const [current, setCurrent] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });
  const directionLockRef = useRef(null); // 'horizontal' | 'vertical' | null

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

  // Pointer / Touch gestures for real-time finger dragging
  const handlePointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
    touchStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    directionLockRef.current = null;
    setIsDragging(false);
    setDragOffset(0);
  };

  const handlePointerMove = (e) => {
    if (!touchStartRef.current.time) return;
    const dx = e.clientX - touchStartRef.current.x;
    const dy = e.clientY - touchStartRef.current.y;

    if (directionLockRef.current === null) {
      if (Math.abs(dy) > 7 && Math.abs(dy) > Math.abs(dx)) {
        directionLockRef.current = 'vertical';
        return;
      } else if (Math.abs(dx) > 7 && Math.abs(dx) > Math.abs(dy)) {
        directionLockRef.current = 'horizontal';
        setIsDragging(true);
      }
    }

    if (directionLockRef.current === 'horizontal') {
      setDragOffset(dx);
    }
  };

  const handlePointerUp = (e) => {
    try {
      if (e?.currentTarget?.hasPointerCapture?.(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // ignore
    }
    if (touchStartRef.current.time && isDragging) {
      const dt = Date.now() - touchStartRef.current.time;
      const velocity = Math.abs(dragOffset) / Math.max(dt, 1);
      if (dragOffset < -50 || (dragOffset < -20 && velocity > 0.35)) {
        next();
      } else if (dragOffset > 50 || (dragOffset > 20 && velocity > 0.35)) {
        prev();
      }
    }
    setIsDragging(false);
    setDragOffset(0);
    touchStartRef.current = { x: 0, y: 0, time: 0 };
    directionLockRef.current = null;
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
          {services.map((service, idx) => {
            const isOpen = openId === service.id;
            const iconSrc = resolveServiceIcon(service, idx);
            return (
              <div className={`service-card${isOpen ? ' open' : ''}`} key={service.id}>
                <button
                  type="button"
                  className="service-head"
                  onClick={() => setOpenId(isOpen ? null : service.id)}
                >
                  <div className="service-icon" style={{ background: service.iconBg || '#E3EFFB' }}>
                    <img
                      src={iconSrc}
                      alt={service.name}
                      style={{ width: '28px', height: '28px', objectFit: 'contain' }}
                    />
                  </div>
                  <div className="info">
                    <h3>{service.name}</h3>
                    <div className="price-tag">
                      {service.priceDisplay || `from €${service.rate}/m² · ${service.cadence}`}
                    </div>
                  </div>
                  <div className="chevron">+</div>
                </button>

                <div
                  className="service-detail"
                  style={{ maxHeight: isOpen ? '750px' : '0px' }}
                >
                  <div className="service-detail-inner">
                    <p>{service.description}</p>
                    <ul>
                      {(service.included || []).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    {service.terms && service.terms.length > 0 && (
                      <div style={{ margin: '14px 0', padding: '10px 14px', background: 'rgba(20, 57, 95, 0.04)', borderRadius: '10px' }}>
                        <strong style={{ display: 'block', fontSize: '0.78rem', color: 'var(--ink)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Key Terms & Conditions:
                        </strong>
                        <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.82rem', color: 'var(--ink-soft)' }}>
                          {service.terms.map((t, idx) => (
                            <li key={idx} style={{ marginBottom: '3px' }}>{t}</li>
                          ))}
                        </ul>
                      </div>
                    )}
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
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <div className="service-slider-track">
              {services.map((service, i) => {
                let offset = i - current;
                if (offset > len / 2) offset -= len;
                if (offset < -len / 2) offset += len;

                const abs = Math.abs(offset);
                if (abs > 1) {
                  return (
                    <div
                      key={service.id || i}
                      className="service-deck-card is-hidden"
                      style={{ display: 'none' }}
                      aria-hidden="true"
                    />
                  );
                }

                // Smooth responsive physics calculations
                const dragProgress = dragOffset / 300;
                let x = offset * 46;
                let scale = abs === 0 ? 1 : 0.93;
                let rotate = 0;
                let opacity = abs === 0 ? 1 : 0.82;
                let zIndex = abs === 0 ? 10 : 8;

                if (offset === 0) {
                  x = dragOffset;
                  rotate = dragOffset * 0.035;
                  const pull = Math.min(Math.abs(dragProgress), 0.9);
                  scale = 1 - pull * 0.06;
                  opacity = 1 - pull * 0.12;
                  zIndex = 10;
                } else if (offset === 1) {
                  if (dragOffset < 0) {
                    const factor = Math.min(Math.abs(dragProgress), 1);
                    x = 46 * (1 - factor);
                    scale = 0.93 + 0.07 * factor;
                    opacity = 0.82 + 0.18 * factor;
                    zIndex = factor > 0.6 ? 10 : 9;
                  } else {
                    x = 46 + dragOffset * 0.15;
                    opacity = Math.max(0, 0.82 - dragProgress * 0.6);
                  }
                } else if (offset === -1) {
                  if (dragOffset > 0) {
                    const factor = Math.min(dragProgress, 1);
                    x = -46 * (1 - factor);
                    scale = 0.93 + 0.07 * factor;
                    opacity = 0.82 + 0.18 * factor;
                    zIndex = factor > 0.6 ? 10 : 9;
                  } else {
                    x = -46 + dragOffset * 0.15;
                    opacity = Math.max(0, 0.82 - Math.abs(dragProgress) * 0.6);
                  }
                }

                const isActive = abs === 0;

                return (
                  <div
                    key={service.id || i}
                    className={`service-deck-card ${isActive ? 'card-active' : 'card-side'}`}
                    style={{
                      transform: `translate(-50%, -50%) translateX(${x}px) rotate(${rotate}deg) scale(${scale})`,
                      zIndex,
                      opacity,
                      transition: isDragging
                        ? 'none'
                        : 'transform 0.38s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease, background 0.3s ease, border-color 0.3s ease',
                      cursor: isDragging ? 'grabbing' : isActive ? 'grab' : 'pointer',
                    }}
                    onClick={() => {
                      if (isDragging || Math.abs(dragOffset) > 8) return;
                      if (offset === 1) next();
                      else if (offset === -1) prev();
                    }}
                  >
                    <div style={{ opacity: isActive ? 1 : 0.55, transition: 'opacity 0.3s ease' }}>
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
                          <img
                            src={resolveServiceIcon(service, i)}
                            alt={service.name}
                            style={{ width: '28px', height: '28px', objectFit: 'contain' }}
                          />
                        </div>
                        <div>
                          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
                            {service.name}
                          </h3>
                          <div
                            className="card-price"
                            style={{ fontSize: '0.88rem', color: 'var(--ink-soft)', marginTop: '2px' }}
                          >
                            <b>{service.priceDisplay || `from €${service.rate}/m²`}</b>
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
                        opacity: isActive ? 1 : 0,
                        pointerEvents: isActive ? 'auto' : 'none',
                        transition: 'opacity 0.25s ease',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isDragging || Math.abs(dragOffset) > 6) return;
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

          {/* Indicator pagination dots */}
          <div className="service-slider-dots" aria-label="Slider pagination">
            {services.map((s, idx) => (
              <button
                key={s.id || idx}
                type="button"
                className={`service-slider-dot ${idx === current ? 'active' : ''}`}
                onClick={() => setCurrent(idx)}
                aria-label={`Go to ${s.name}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}