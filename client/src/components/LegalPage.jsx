import { useState, useEffect } from 'react';
import { useConfig } from '../context/ConfigContext.jsx';
import ThemeToggle from './ThemeToggle.jsx';

export default function LegalPage({ initialTab = 'terms', onNavigate, onOpenQuote }) {
  const { settings, getWhatsAppUrl } = useConfig();
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    if (onNavigate) {
      onNavigate(tab === 'privacy' ? '/privacy' : '/terms');
    }
  };

  const handleBackHome = (e) => {
    e?.preventDefault();
    if (onNavigate) {
      onNavigate('/');
    } else {
      window.location.href = '/';
    }
  };

  const lastUpdated = 'April 2025';

  return (
    <div className="legal-page-root">
      {/* Top Navigation Bar */}
      <header className="legal-header">
        <div className="wrap legal-header-wrap">
          <a href="/" onClick={handleBackHome} className="legal-brand" title="Back to Home">
            <img src="/logo.png" alt={settings.brandName} className="logo-img" />
          </a>

          <div className="legal-header-actions">
            <ThemeToggle />
            <button type="button" onClick={handleBackHome} className="legal-btn-ghost">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              <span>Back to Website</span>
            </button>

            <a
              href={getWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="legal-btn-primary"
            >
              <span>Book via WhatsApp</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Header with Dynamic Floating Blobs */}
      <section className={`legal-hero legal-theme-${activeTab}`}>
        {/* Golden Blobs for Terms & Conditions */}
        <div className={`legal-blobs-layer terms-blobs ${activeTab === 'terms' ? 'is-active' : ''}`} aria-hidden="true">
          <div className="blob blob-1 blob-gold-1" />
          <div className="blob blob-2 blob-gold-2" />
          <div className="blob blob-3 blob-gold-3" />
        </div>

        {/* Emerald Green Blobs for Privacy Policy */}
        <div className={`legal-blobs-layer privacy-blobs ${activeTab === 'privacy' ? 'is-active' : ''}`} aria-hidden="true">
          <div className="blob blob-1 blob-green-1" />
          <div className="blob blob-2 blob-green-2" />
          <div className="blob blob-3 blob-green-3" />
        </div>

        <div className="wrap legal-hero-inner">
          <div className="legal-hero-text">
            <h1 className="legal-hero-title">
              {activeTab === 'privacy' ? 'Privacy Policy' : 'Terms & Conditions'}
            </h1>
            <p className="legal-hero-subtitle">
              {activeTab === 'privacy'
                ? 'Information on how personal data is collected, processed, and protected under GDPR.'
                : 'Terms and conditions governing the booking, payment, and provision of cleaning services.'}
            </p>
          </div>

          <div className="legal-hero-meta">
            <span>Last updated: <strong>{lastUpdated}</strong></span>
            <span className="dot-sep">•</span>
            <span>Entity: <strong>{settings.brandName}</strong></span>
          </div>

          {/* Interactive Document Switcher Tabs (Swiper/Slider) */}
          <div className="legal-tabs-bar" role="tablist">
            <span className={`legal-tabs-glider ${activeTab}`} aria-hidden="true" />
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'terms'}
              className={`legal-tab-btn legal-tab-terms ${activeTab === 'terms' ? 'is-active' : ''}`}
              onClick={() => handleTabSwitch('terms')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              <span>Terms & Conditions</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'privacy'}
              className={`legal-tab-btn legal-tab-privacy ${activeTab === 'privacy' ? 'is-active' : ''}`}
              onClick={() => handleTabSwitch('privacy')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <span>Privacy Policy</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Document Body */}
      <main className="legal-content-wrap">
        <div className="wrap">
          <div className="legal-card">
            {activeTab === 'terms' ? (
              <TermsContent settings={settings} getWhatsAppUrl={getWhatsAppUrl} onOpenQuote={onOpenQuote} />
            ) : (
              <PrivacyContent settings={settings} getWhatsAppUrl={getWhatsAppUrl} />
            )}
          </div>

          {/* Contact / Help Banner */}
          <div className="legal-help-box">
            <div className="legal-help-info">
              <h3>Have questions about our terms or privacy policy?</h3>
              <p>Our team is available 7 days a week to clarify any booking conditions or data protection inquiries.</p>
            </div>
            <div className="legal-help-actions">
              <a
                href={getWhatsAppUrl('Hello! I have a question regarding your Terms and Privacy Policy.')}
                target="_blank"
                rel="noopener noreferrer"
                className="legal-btn-primary"
              >
                Chat on WhatsApp
              </a>
              <a href={`mailto:${settings.email}`} className="legal-btn-ghost">
                Email Us
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ==========================================================================
   TERMS & CONDITIONS CONTENT
   ========================================================================== */
function TermsContent({ settings, getWhatsAppUrl, onOpenQuote }) {
  return (
    <article className="legal-article">
      <div className="legal-intro-callout">
        <p>
          Welcome to <strong>{settings.brandName}</strong>. By accessing our website, requesting a quote, or engaging our cleaning services via WhatsApp, telephone, or online booking, you acknowledge that you have read, understood, and agreed to be bound by these Terms and Conditions.
        </p>
      </div>

      <nav className="legal-toc">
        <h4 className="legal-toc-title">Table of Contents</h4>
        <ol>
          <li><a href="#t-1">Scope of Services</a></li>
          <li><a href="#t-2">Quotations, Pricing & Minimum Booking</a></li>
          <li><a href="#t-3">Booking Confirmations & Scheduling</a></li>
          <li><a href="#t-4">Client Responsibilities & Site Access</a></li>
          <li><a href="#t-5">Payment Terms & Methods</a></li>
          <li><a href="#t-6">Cancellation, Rescheduling & Lockout Policy</a></li>
          <li><a href="#t-7">24-Hour Quality & Satisfaction Guarantee</a></li>
          <li><a href="#t-8">Damage, Breakage & Liability Insurance</a></li>
          <li><a href="#t-9">Health, Safety & Hazardous Substances</a></li>
          <li><a href="#t-10">Amendments, Governing Law & Jurisdiction</a></li>
        </ol>
      </nav>

      {/* Section 1 */}
      <section id="t-1" className="legal-section">
        <h2>1. Scope of Services</h2>
        <p>
          {settings.brandName} operates as an Irish business delivering professional residential and commercial cleaning services across {settings.cities || 'Dublin, Co. Meath, Co. Louth & surrounding areas'}. Our offerings include:
        </p>
        <ul>
          <li><strong>House & Apartment Cleaning:</strong> Standard upkeep and maintenance cleaning tailored to client priorities (€30/hr, min. 3 hours / €90).</li>
          <li><strong>Comprehensive Deep Cleaning:</strong> Intensive restorative cleaning across the entire property (from €295 based on bedroom count).</li>
          <li><strong>End of Tenancy Cleaning:</strong> Turnover cleaning for landlord inspections and deposit return checklists (€30/hr, min. 3 hours / €90).</li>
          <li><strong>Post-Construction Cleaning:</strong> Fine-dust removal and intensive sanitisation following renovation work (€350 base 5-room package).</li>
          <li><strong>Internal Window Cleaning Package:</strong> Fixed-price glazing and frame cleaning package (€99 for up to 20 windows).</li>
          <li><strong>Office & Commercial Cleaning:</strong> Contract-free professional commercial cleaning (€35/hr, min. 3 hours / €105).</li>
        </ul>
        <p>
          Specific tasks included in your service will align with the checklist confirmed during your WhatsApp booking consultation.
        </p>
      </section>

      {/* Section 2 */}
      <section id="t-2" className="legal-section">
        <h2>2. Quotations, Pricing & Minimum Booking</h2>
        <p>
          All initial price quotes provided via our website or WhatsApp chat are based on the service selected, property specification, and required hours.
        </p>
        <div className="legal-highlight-box">
          <strong>Transparent Final Pricing & Minimum Booking:</strong> In accordance with Irish consumer protection standards, all quoted prices are final and inclusive of any applicable taxes, with zero hidden charges. Standard residential services operate on a minimum booking of 3 hours (€90). Commercial cleaning operates on a minimum booking of 3 hours (€105). Fixed packages apply to Window Cleaning (€99), Post-Construction (€350), and Deep Cleaning (from €295).
        </div>
        <ul>
          <li><strong>Price Adjustments:</strong> If on-site inspection reveals that actual property condition, layout, or level of soiling differs significantly from the description provided (e.g. biohazards, hoarding, excessive pet hair, or ongoing construction), {settings.brandName} reserves the right to revise the quotation or time estimate with the client's consent before commencing work.</li>
          <li><strong>Included Equipment & Products:</strong> Standard cleaning detergents, microfiber cloths, professional vacuums, and equipment are included in the service unless specialized machinery is requested in advance.</li>
        </ul>
      </section>

      {/* Section 3 */}
      <section id="t-3" className="legal-section">
        <h2>3. Booking Confirmations & Scheduling</h2>
        <p>
          Bookings are formally confirmed once date, time window, service address, and scope of work are verified via our official WhatsApp business channel or direct agreement with an authorized representative.
        </p>
        <p>
          While we strive for punctual arrivals, arrival times are provided as a 1-to-2 hour operational window to accommodate urban traffic conditions, adverse weather, or preceding job complexities. Clients will be notified promptly via WhatsApp in the event of unexpected delays.
        </p>
      </section>

      {/* Section 4 */}
      <section id="t-4" className="legal-section">
        <h2>4. Client Responsibilities, Site Access & Parking</h2>
        <p>To ensure thorough, safe, and uninterrupted execution of your cleaning service, the client agrees to:</p>
        <ul>
          <li><strong>Provide Access:</strong> Grant timely entry to the property at the agreed appointment time (via personal presence, concierge, key-lockbox, or key handover).</li>
          <li><strong>Vehicle Parking & Charges:</strong> Safe vehicle parking must be available near or adjacent to the property for the transport of cleaning equipment and detergents. Any applicable parking fees, disc charges, or meter costs are the customer's responsibility.</li>
          <li><strong>Provide Working Utilities:</strong> Ensure uninterrupted access to running hot and cold water and active electricity. If utilities are disconnected, cleaning cannot proceed safely, and lockout policy applies.</li>
          <li><strong>Secure Valuables:</strong> Safely secure all currency, high-value jewelry, confidential documents, and fragile sentimental heirlooms prior to cleaner arrival.</li>
          <li><strong>Pet Safety:</strong> Restrain or place household pets in secure, separate rooms during the cleaning process to prevent accidental escapes or distress.</li>
        </ul>
      </section>

      {/* Section 5 */}
      <section id="t-5" className="legal-section">
        <h2>5. Payment Terms & Methods</h2>
        <p>
          Full payment is due immediately upon completion of the cleaning service on the day of work, unless a corporate invoicing account has been formally approved in writing.
        </p>
        <ul>
          <li><strong>Accepted Methods:</strong> Electronic bank transfer (SEPA), instant debit/credit card payment link, or cash where agreed.</li>
          <li><strong>Receipts & Invoicing:</strong> Official digital receipts and itemised invoices are issued electronically to the client's email address or WhatsApp upon receipt of payment.</li>
          <li><strong>Late Payments:</strong> Commercial or residential accounts unpaid after 7 business days from invoice delivery may incur administrative late recovery charges as permitted under applicable Irish legislation.</li>
        </ul>
      </section>

      {/* Section 6 */}
      <section id="t-6" className="legal-section">
        <h2>6. Cancellation, Rescheduling & Statutory Cooling-Off Rights</h2>
        <p>
          We allocate specific team members and equipment for your appointment. Therefore, the following notice requirements and statutory provisions apply:
        </p>
        <ul>
          <li><strong>Free Cancellation / Rescheduling:</strong> You may cancel or postpone your booking with <strong>at least 24 hours prior notice</strong> before your scheduled arrival window at zero charge.</li>
          <li><strong>Late Cancellation Notice:</strong> Cancellations or rescheduling requests submitted with less than 24 hours notice are subject to a cancellation fee of <strong>50% of the estimated quote</strong> (or the minimum charge of €{settings.minCharge || 90}) to compensate dispatched staff.</li>
          <li><strong>Client Lockout / No-Show:</strong> If cleaners arrive at the scheduled property and cannot gain access within 30 minutes, or if power/water is unavailable, the full minimum callout charge is payable.</li>
          <li><strong>Statutory Cooling-Off Period (Consumer Rights Act 2022):</strong> Under Part 5 of the Irish Consumer Rights Act 2022, consumers booking distance contracts have a 14-day right to cancel from booking confirmation. By requesting a cleaning appointment scheduled within 14 days of booking, you expressly request us to perform the service during the cooling-off period and acknowledge that once the service has been fully performed, the statutory right to cancel ends.</li>
        </ul>
      </section>

      {/* Section 7 */}
      <section id="t-7" className="legal-section">
        <h2>7. 24-Hour Quality & Satisfaction Guarantee</h2>
        <p>
          Your satisfaction is our primary priority. We encourage clients to conduct a walkthrough inspection with our lead cleaner upon completion of the service.
        </p>
        <div className="legal-highlight-box">
          <strong>24-Hour Reporting Window:</strong> If any area included in the agreed scope of work was missed or not cleaned to professional standards, please notify us via WhatsApp within <strong>24 hours of service completion</strong> accompanied by clear photographic evidence.
        </div>
        <p>
          Upon verification, {settings.brandName} will dispatch a cleaning specialist to re-clean the specific disputed area <strong>free of charge</strong> within 48 hours of notification. Nothing in these Terms and Conditions limits or affects your statutory rights and remedies as a consumer under the <strong>Consumer Rights Act 2022 (Ireland)</strong>.
        </p>
      </section>

      {/* Section 8 */}
      <section id="t-8" className="legal-section">
        <h2>8. Damage, Breakage & Liability Insurance</h2>
        <p>
          Our cleaning personnel are rigorously trained, vetted, and covered by Public Liability Insurance. In the rare event of accidental damage:
        </p>
        <ul>
          <li><strong>Immediate Reporting:</strong> Any alleged breakage or property damage must be reported in writing with photographs within <strong>24 hours</strong> of the service.</li>
          <li><strong>Repair or Replacement:</strong> Verified accidental damage directly caused by staff negligence will be repaired or replaced at fair market value.</li>
          <li><strong>Exclusions:</strong> Subject to mandatory Irish consumer law, we are not liable for:
            <ul>
              <li>Pre-existing damage, wear-and-tear, unsealed natural stone, loose grout, or unstable wall fixtures.</li>
              <li>Improperly hung pictures, mirrors, or unsecured shelves that fall during routine surface dusting.</li>
              <li>Delicate, fragile antiques, custom artwork, or cash/jewelry not declared or secured in advance.</li>
              <li>Freezer defrosting leaks or permanent stains (dye transfers, acid burns, old burn marks) that cannot be safely lifted without surface destruction.</li>
            </ul>
          </li>
        </ul>
        <p>
          Nothing in these Terms excludes or limits liability for death or personal injury caused by negligence, fraud, or any other liability that cannot be excluded under the laws of Ireland.
        </p>
      </section>

      {/* Section 9 */}
      <section id="t-9" className="legal-section">
        <h2>9. Health, Safety & Hazardous Substances</h2>
        <p>
          In accordance with the <strong>Safety, Health and Welfare at Work Act 2005 (Ireland)</strong>, the safety of our cleaners is paramount. {settings.brandName} reserves the right to withdraw personnel immediately if:
        </p>
        <ul>
          <li>Hazardous biological matter, human/animal bodily waste, mold infestations, or pest infestations (e.g. bedbugs, rodents) are present without prior disclosure and hazard gear.</li>
          <li>Cleaners are asked to clean exterior windows at heights exceeding standard safe internal access, or work in conditions violating statutory Irish occupational health and safety regulations.</li>
          <li>Cleaners are subjected to verbal abuse, harassment, or unsafe physical environments.</li>
        </ul>
      </section>

      {/* Section 10 */}
      <section id="t-10" className="legal-section">
        <h2>10. Amendments, Governing Law & Jurisdiction</h2>
        <p>
          {settings.brandName} reserves the right to amend these Terms and Conditions at any time. Continued use of our booking channels following updates constitutes acceptance of the modified terms.
        </p>
        <p>
          These Terms and Conditions shall be governed by and construed in accordance with the laws of the <strong>Republic of Ireland</strong>. Any dispute arising out of or in connection with these terms shall be subject to the jurisdiction of the courts of Ireland (without prejudice to a consumer's access to the Small Claims procedure of the District Court of Ireland where applicable).
        </p>
      </section>
    </article>
  );
}

/* ==========================================================================
   PRIVACY POLICY CONTENT (GDPR COMPLIANT)
   ========================================================================== */
function PrivacyContent({ settings, getWhatsAppUrl }) {
  return (
    <article className="legal-article">
      <div className="legal-intro-callout">
        <p>
          At <strong>{settings.brandName}</strong>, we respect your privacy and are committed to protecting your personal data in full compliance with the <strong>General Data Protection Regulation (EU) 2016/679 (GDPR)</strong>, the <strong>Data Protection Act 2018 (Ireland)</strong>, and the <strong>Irish ePrivacy Regulations (S.I. No. 336 of 2011)</strong>.
        </p>
      </div>

      <nav className="legal-toc">
        <h4 className="legal-toc-title">Table of Contents</h4>
        <ol>
          <li><a href="#p-1">Data Controller Information</a></li>
          <li><a href="#p-2">Personal Data We Collect</a></li>
          <li><a href="#p-3">How & Why We Use Your Personal Data</a></li>
          <li><a href="#p-4">Legal Grounds for Processing</a></li>
          <li><a href="#p-5">Communication via WhatsApp & Third Parties</a></li>
          <li><a href="#p-6">Data Retention Period</a></li>
          <li><a href="#p-7">Your Data Protection Rights under GDPR</a></li>
          <li><a href="#p-8">Cookies & Local Storage</a></li>
          <li><a href="#p-9">Data Security Safeguards</a></li>
          <li><a href="#p-10">Contacting Our Data Privacy Officer</a></li>
        </ol>
      </nav>

      {/* Section 1 */}
      <section id="p-1" className="legal-section">
        <h2>1. Data Controller Information</h2>
        <p>
          The data controller responsible for the collection and processing of your personal data in the Republic of Ireland is:
        </p>
        <div className="legal-contact-card">
          <p><strong>Trading Name:</strong> {settings.brandName} (Sole Trader registered in Ireland)</p>
          <p><strong>Primary Contact Email:</strong> <a href={`mailto:${settings.email}`}>{settings.email}</a></p>
          <p><strong>WhatsApp Support:</strong> <a href={getWhatsAppUrl()} target="_blank" rel="noopener noreferrer">Official WhatsApp Channel</a></p>
          <p><strong>Operating Base & Service Territory:</strong> {settings.cities || 'Dublin, Co. Meath & Co. Louth, Republic of Ireland'}</p>
        </div>
      </section>

      {/* Section 2 */}
      <section id="p-2" className="legal-section">
        <h2>2. Personal Data We Collect</h2>
        <p>We only collect personal information that is strictly necessary to calculate quotes, schedule visits, and provide cleaning services:</p>
        <ul>
          <li><strong>Contact Details:</strong> Your name, phone number, WhatsApp profile identifier, and email address.</li>
          <li><strong>Location & Property Details:</strong> Physical service address, postal code, entry instructions (e.g. intercom or keybox codes), apartment size in square meters (m²), number of bedrooms/bathrooms, and property photographs optionally submitted for quote accuracy.</li>
          <li><strong>Booking History:</strong> Scheduled dates, service categories requested (regular, deep, move-in/out), cleaner notes, and special customer preferences.</li>
          <li><strong>Financial & Transaction Data:</strong> Invoicing history, payment transaction references, and payment status (we do not store full credit card numbers on our servers).</li>
          <li><strong>Technical Data:</strong> Browser user-agent, IP address, device type, and visit timestamps collected automatically during website navigation for security and optimization.</li>
        </ul>
      </section>

      {/* Section 3 */}
      <section id="p-3" className="legal-section">
        <h2>3. How & Why We Use Your Personal Data</h2>
        <p>Your information is used strictly for legitimate business operations:</p>
        <ul>
          <li><strong>Service Delivery:</strong> To generate accurate quotes, schedule cleaning slots, navigate staff to your property, and perform agreed cleaning duties.</li>
          <li><strong>Customer Communications:</strong> To send booking confirmations, arrival updates, walkthrough notifications, and digital invoices via WhatsApp or email.</li>
          <li><strong>Quality Control & Dispute Resolution:</strong> To verify work completed, investigate 24-hour guarantee claims, and improve operational standards.</li>
          <li><strong>Accounting & Legal Compliance:</strong> To maintain compliant financial records and tax audit reports in accordance with statutory obligations.</li>
        </ul>
      </section>

      {/* Section 4 */}
      <section id="p-4" className="legal-section">
        <h2>4. Legal Grounds for Processing (GDPR Article 6)</h2>
        <p>We process your personal information under the following legal frameworks:</p>
        <ul>
          <li><strong>Performance of a Contract (Art. 6(1)(b)):</strong> Processing is essential to fulfill your cleaning reservation and provide agreed services.</li>
          <li><strong>Legitimate Interests (Art. 6(1)(f)):</strong> To communicate with customers, coordinate cleaning teams, prevent fraud, and manage customer service inquiries.</li>
          <li><strong>Legal Obligation (Art. 6(1)(c)):</strong> To comply with tax, bookkeeping, and statutory accounting regulations.</li>
          <li><strong>Explicit Consent (Art. 6(1)(a)):</strong> When you voluntarily upload property photos or opt in to receive promotional updates.</li>
        </ul>
      </section>

      {/* Section 5 */}
      <section id="p-5" className="legal-section">
        <h2>5. Communication via WhatsApp & Third Parties</h2>
        <p>
          We will <strong>never sell, lease, or monetize</strong> your personal data to advertisers or third-party marketing companies. Data is shared exclusively with necessary operational service providers:
        </p>
        <ul>
          <li><strong>WhatsApp (Meta Platforms Ireland Ltd.):</strong> Used as our direct client consultation and instant booking channel. By communicating with us on WhatsApp, your messages are processed in accordance with WhatsApp's privacy policy and encrypted protocols.</li>
          <li><strong>Operational Staff & Cleaners:</strong> Dispatched cleaners receive only your name, service address, entry instructions, and agreed task checklist on the day of work.</li>
          <li><strong>Cloud & Hosting Infrastructure:</strong> Cloudflare Pages and secure cloud database providers adhering to strict EU data processing agreements.</li>
          <li><strong>Telegram WebApp Admin System:</strong> Used exclusively by authenticated business managers to monitor booking requests and customer service alerts.</li>
        </ul>
      </section>

      {/* Section 6 */}
      <section id="p-6" className="legal-section">
        <h2>6. Data Retention Period</h2>
        <p>
          We retain your personal data only for as long as is necessary to fulfill the purposes outlined in this policy:
        </p>
        <ul>
          <li><strong>Active Customer Records:</strong> Retained for the duration of your active service relationship to facilitate repeat bookings.</li>
          <li><strong>Financial & Invoice Records:</strong> Retained for up to <strong>6 years</strong> in compliance with Irish Revenue and statutory accounting record-keeping requirements.</li>
          <li><strong>Property Photos:</strong> Photos submitted for quotation or quality audits are automatically deleted or archived upon completed job sign-off.</li>
        </ul>
      </section>

      {/* Section 7 */}
      <section id="p-7" className="legal-section">
        <h2>7. Your Data Protection Rights under GDPR</h2>
        <p>Under European privacy laws, you possess fundamental rights regarding your data:</p>
        <ul>
          <li><strong>Right of Access (Art. 15):</strong> Request a copy of the personal information we hold about you.</li>
          <li><strong>Right to Rectification (Art. 16):</strong> Request correction of inaccurate, incomplete, or outdated details.</li>
          <li><strong>Right to Erasure / "To Be Forgotten" (Art. 17):</strong> Request deletion of your personal data where statutory retention obligations do not apply.</li>
          <li><strong>Right to Restriction of Processing (Art. 18):</strong> Request temporary limitation of data processing under certain circumstances.</li>
          <li><strong>Right to Data Portability (Art. 20):</strong> Receive your personal data in a structured, commonly used machine-readable format.</li>
          <li><strong>Right to Object (Art. 21):</strong> Object to processing based on legitimate interests at any time.</li>
        </ul>
        <p>
          To exercise any of these rights, contact us at <a href={`mailto:${settings.email}`}>{settings.email}</a>. We respond to all verified requests within 30 days without charge.
        </p>
      </section>

      {/* Section 8 */}
      <section id="p-8" className="legal-section">
        <h2>8. Cookies & Local Storage</h2>
        <p>
          Our website uses minimal, privacy-compliant technical storage and cookies:
        </p>
        <ul>
          <li><strong>Essential Storage & Cookies:</strong> Strictly necessary for core website operations, including remembering your selected cleaning parameters in the quote calculator, saving your cookie consent preferences, and maintaining secure administrative sessions.</li>
          <li><strong>Analytics Cookies:</strong> With your consent, we use anonymous aggregated analytics cookies to understand how visitors interact with our pages, diagnose performance bottlenecks, and improve service usability. These cookies do not identify you personally.</li>
        </ul>
        <p>
          You can update or withdraw your cookie preferences at any time by clicking "Cookie Preferences" in the footer of our website.
        </p>
      </section>

      {/* Section 9 */}
      <section id="p-9" className="legal-section">
        <h2>9. Data Security Safeguards</h2>
        <p>
          We employ robust organizational and technical safeguards, including SSL/TLS encryption for all website communications, secure tokenized authentication for administrator consoles, and access-limited internal protocols.
        </p>
      </section>

      {/* Section 10 */}
      <section id="p-10" className="legal-section">
        <h2>10. Contacting Our Data Privacy Officer</h2>
        <p>
          If you have questions, comments, or complaints regarding this Privacy Policy or our data handling practices, please contact our team:
        </p>
        <p>
          Email: <a href={`mailto:${settings.email}`}>{settings.email}</a><br />
          WhatsApp: <a href={getWhatsAppUrl()} target="_blank" rel="noopener noreferrer">Official WhatsApp Channel</a>
        </p>
        <p>
          You also have the right to lodge a complaint with the <strong>Data Protection Commission (DPC)</strong> of Ireland (dataprotection.ie) if you believe your data has been handled unlawfully.
        </p>
      </section>
    </article>
  );
}

