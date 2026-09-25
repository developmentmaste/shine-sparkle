const REVIEWS = [
  {
    text: 'Booked a deep clean before my parents visited. The cleaner arrived on time and the windows are spotless.',
    name: 'Natalie K.',
    role: 'Austin, TX',
  },
  {
    text: "I've used the weekly plan for three months now. It's great that the same person comes every time.",
    name: 'Arthur L.',
    role: 'Chicago, IL',
  },
  {
    text: 'Post-renovation dust was everywhere. They cleaned it all in one visit and the price matched the quote.',
    name: 'Irene & Paul',
    role: 'Denver, CO',
  },
];

export default function Testimonials() {
  return (
    <section className="section" id="reviews" style={{ background: 'var(--bg-soft)' }}>
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">Reviews</span>
          <h2>What customers say</h2>
        </div>
        <div className="test-grid">
          {REVIEWS.map((r) => (
            <div className="test-card" key={r.name}>
              <p>{r.text}</p>
              <div className="test-name">{r.name}</div>
              <div className="test-role">{r.role}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
