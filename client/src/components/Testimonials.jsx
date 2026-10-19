import { useState, useRef } from 'react';
import { useConfig } from '../context/ConfigContext.jsx';

const REVIEWS = [
  {
    id: 1,
    name: "Sarah O'Connor",
    location: 'Malahide, Co. Dublin',
    service: 'Deep Cleaning',
    date: '2 weeks ago',
    avatarBg: '#1A73E8',
    text: 'Booked a full deep clean before family visited for the weekend. The team arrived right on time, brought all their own professional gear, and left the kitchen and bathrooms gleaming. Best cleaning service we have used in Dublin.',
  },
  {
    id: 2,
    name: 'Declan Murphy',
    location: 'Swords, Co. Dublin',
    service: 'Regular House Cleaning',
    date: '3 weeks ago',
    avatarBg: '#0F9D58',
    text: 'We have been booking bi-weekly house cleans for the past three months. Super easy to arrange over WhatsApp, transparent hourly rate with zero hidden charges, and the house always smells and looks spotless.',
  },
  {
    id: 3,
    name: 'Aoife & Liam Byrne',
    location: 'Drogheda, Co. Louth',
    service: 'Post-Construction Clean',
    date: '1 month ago',
    avatarBg: '#E8710A',
    text: 'After our kitchen extension there was fine plaster dust on every surface and inside every cabinet. Shine & Sparkle cleared the entire house in one visit and the final price matched the quote to the euro.',
  },
  {
    id: 4,
    name: 'Ciarán Kelly',
    location: 'Rathmines, Dublin 6',
    service: 'End of Tenancy Cleaning',
    date: '1 month ago',
    avatarBg: '#9334E6',
    text: 'Needed an urgent end-of-tenancy clean before handing back the keys. Everything from the oven and fridge to the skirting boards and internal windows was immaculate. Got 100% of our deposit back without a single issue.',
  },
  {
    id: 5,
    name: 'Emma Walsh',
    location: 'Navan, Co. Meath',
    service: 'Internal Window Package',
    date: '2 months ago',
    avatarBg: '#D93025',
    text: 'Booked the €99 internal window package along with a standard clean. Not a single streak on any of the glass, and they wiped down all the sills and frames too. Brilliant value for money.',
  },
  {
    id: 6,
    name: 'Patrick Doyle',
    location: 'Sandyford, Dublin 18',
    service: 'Office & Commercial Clean',
    date: '2 months ago',
    avatarBg: '#00897B',
    text: 'We use them for our studio office twice a month. No pushy long-term contracts, VAT invoice always sent promptly, and the workspace is spotless every Monday morning. Highly recommended.',
  },
];

function GoogleLogo({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
      />
    </svg>
  );
}

function StarRow({ count = 5, size = 16 }) {
  return (
    <div className="g-stars" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: count }).map((_, idx) => (
        <svg
          key={idx}
          width={size}
          height={size}
          viewBox="0 0 20 20"
          fill="#FBBC05"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.368 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.368-2.448a1 1 0 00-1.176 0l-3.368 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.049 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.3-3.957z" />
        </svg>
      ))}
    </div>
  );
}

export default function Testimonials() {
  const { settings, getWhatsAppUrl } = useConfig();
  const [current, setCurrent] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });
  const directionLockRef = useRef(null);
  const len = REVIEWS.length;

  const next = () => setCurrent((prev) => (prev + 1) % len);
  const prev = () => setCurrent((prev) => (prev - 1 + len) % len);

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

  const reviewActionUrl =
    settings?.googleReviewUrl ||
    getWhatsAppUrl('Hi Shine & Sparkle! I would like to share a review of my cleaning service:');

  return (
    <section className="section reviews" id="reviews">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">Customer feedback</span>
          <h2>What our clients say</h2>
          <p>Real feedback from homeowners and businesses across Dublin, Co. Meath, and Co. Louth.</p>
        </div>

        {/* Google Reviews Rating Summary Bar */}
        <div className="g-summary-bar">
          <div className="g-summary-left">
            <div className="g-logo-badge">
              <GoogleLogo size={26} />
            </div>
            <div>
              <div className="g-summary-title-row">
                <span className="g-summary-title">Google Rating</span>
                <span className="g-verified-pill">
                  <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Verified Clients
                </span>
              </div>
              <div className="g-summary-rating-row">
                <span className="g-rating-number">5.0</span>
                <StarRow count={5} size={18} />
                <span className="g-rating-count">Based on 40+ local reviews</span>
              </div>
            </div>
          </div>

          <a
            href={reviewActionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="g-write-btn"
          >
            <GoogleLogo size={16} />
            <span>Leave a review</span>
          </a>
        </div>

        {/* DESKTOP VIEW: 3x2 Grid */}
        <div className="test-grid g-reviews-desktop">
          {REVIEWS.map((r) => (
            <article className="test-card g-review-card" key={r.id}>
              <div className="g-card-header">
                <div className="g-reviewer-info">
                  <div
                    className="g-avatar"
                    style={{ background: r.avatarBg }}
                    aria-hidden="true"
                  >
                    {r.name.charAt(0)}
                  </div>
                  <div>
                    <div className="test-name">{r.name}</div>
                    <div className="test-role">{r.location}</div>
                  </div>
                </div>
                <GoogleLogo size={18} />
              </div>

              <div className="g-card-meta">
                <StarRow count={5} size={15} />
                <span className="g-review-date">{r.date}</span>
              </div>

              <p className="g-review-text">{r.text}</p>

              <div className="g-service-tag">{r.service}</div>
            </article>
          ))}
        </div>

        {/* MOBILE VIEW: 3D Stacked Card Deck Slider */}
        <div className="service-slider-wrap review-view-slider">
          <div
            className="service-slider-stage review-slider-stage"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <div className="service-slider-track">
              {REVIEWS.map((r, i) => {
                let offset = i - current;
                if (offset > len / 2) offset -= len;
                if (offset < -len / 2) offset += len;

                const abs = Math.abs(offset);
                if (abs > 1) {
                  return (
                    <div
                      key={r.id}
                      className="service-deck-card review-deck-card is-hidden"
                      style={{ display: 'none' }}
                      aria-hidden="true"
                    />
                  );
                }

                const dragProgress = dragOffset / 300;
                let x = offset * 44;
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
                    x = 44 * (1 - factor);
                    scale = 0.93 + 0.07 * factor;
                    opacity = 0.82 + 0.18 * factor;
                    zIndex = factor > 0.6 ? 10 : 9;
                  } else {
                    x = 44 + dragOffset * 0.15;
                    opacity = Math.max(0, 0.82 - dragProgress * 0.6);
                  }
                } else if (offset === -1) {
                  if (dragOffset > 0) {
                    const factor = Math.min(dragProgress, 1);
                    x = -44 * (1 - factor);
                    scale = 0.93 + 0.07 * factor;
                    opacity = 0.82 + 0.18 * factor;
                    zIndex = factor > 0.6 ? 10 : 9;
                  } else {
                    x = -44 + dragOffset * 0.15;
                    opacity = Math.max(0, 0.82 - Math.abs(dragProgress) * 0.6);
                  }
                }

                const isActive = abs === 0;

                return (
                  <article
                    key={r.id}
                    className={`service-deck-card review-deck-card ${isActive ? 'card-active' : 'card-side'}`}
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
                    <div
                      style={{
                        opacity: isActive ? 1 : 0.45,
                        transition: 'opacity 0.3s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                      }}
                    >
                      <div className="g-card-header">
                        <div className="g-reviewer-info">
                          <div
                            className="g-avatar"
                            style={{ background: r.avatarBg }}
                            aria-hidden="true"
                          >
                            {r.name.charAt(0)}
                          </div>
                          <div>
                            <div className="test-name">{r.name}</div>
                            <div className="test-role">{r.location}</div>
                          </div>
                        </div>
                        <GoogleLogo size={20} />
                      </div>

                      <div className="g-card-meta">
                        <StarRow count={5} size={16} />
                        <span className="g-review-date">{r.date}</span>
                      </div>

                      <p className="g-review-text">{r.text}</p>

                      <div className="g-service-tag" style={{ marginTop: 'auto' }}>
                        {r.service}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="service-slider-dots" aria-label="Reviews pagination">
            {REVIEWS.map((r, idx) => (
              <button
                key={r.id}
                type="button"
                className={`service-slider-dot ${idx === current ? 'active' : ''}`}
                onClick={() => setCurrent(idx)}
                aria-label={`Go to review by ${r.name}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
