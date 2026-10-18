import { useState, useEffect } from 'react';
import { ConfigProvider } from './context/ConfigContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import Nav from './components/Nav.jsx';
import Hero from './components/Hero.jsx';
import ServiceAccordion from './components/ServiceAccordion.jsx';
import Process from './components/Process.jsx';
import Testimonials from './components/Testimonials.jsx';
import Contact from './components/Contact.jsx';
import CTA from './components/CTA.jsx';
import Footer from './components/Footer.jsx';
import QuoteModal from './components/QuoteModal.jsx';
import AdminPanel from './components/AdminPanel.jsx';
import LegalPage from './components/LegalPage.jsx';
import CookieBanner from './components/CookieBanner.jsx';

const getInitialRoute = () => {
  if (typeof window === 'undefined') return '/';
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  if (path.startsWith('/terms') || hash === '#terms' || hash === '#/terms') return '/terms';
  if (path.startsWith('/privacy') || hash === '#privacy' || hash === '#/privacy') return '/privacy';
  return '/';
};

function MainApp() {
  const [currentRoute, setCurrentRoute] = useState(getInitialRoute);
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [quoteServiceId, setQuoteServiceId] = useState(null);

  // Synchronize route with browser history (back/forward and hashchange)
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentRoute(getInitialRoute());
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const navigate = (targetPath) => {
    let cleanPath = targetPath;
    let targetHash = '';
    if (targetPath.includes('#')) {
      const parts = targetPath.split('#');
      cleanPath = parts[0] || '/';
      targetHash = parts[1];
    }

    if (cleanPath === '' || cleanPath === '/') {
      window.history.pushState(null, '', targetHash ? `#${targetHash}` : '/');
      setCurrentRoute('/');
      if (targetHash) {
        setTimeout(() => {
          const el = document.getElementById(targetHash);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 80);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      window.history.pushState(null, '', cleanPath);
      setCurrentRoute(cleanPath);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Telegram Admin State
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [telegramUser, setTelegramUser] = useState(null);
  const [isVerifyingAdmin, setIsVerifyingAdmin] = useState(false);
  const [adminAuthError, setAdminAuthError] = useState(null);

  // Strictly verify Telegram WebApp admin identity
  useEffect(() => {
    // If URL hash was #admin, strip it out completely from URL
    if (window.location.hash === '#admin') {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }

    const tg = window.Telegram?.WebApp;
    const urlParams = new URLSearchParams(window.location.search);
    const hasTgAdminParam = urlParams.get('tg_admin') === '1';
    const isTg = Boolean(tg && (tg.initData || tg.initDataUnsafe?.user));

    if (tg) {
      try {
        tg.ready();
        if (hasTgAdminParam || isTg) {
          tg.expand?.();
        }
      } catch (e) {}
    }

    const tgUser = tg?.initDataUnsafe?.user;
    const tgInitData = tg?.initData || '';

    // Only attempt admin authorization if Telegram WebApp user or initData exists
    if (tgUser?.id || tgInitData) {
      setIsVerifyingAdmin(true);

      const userId = tgUser?.id;
      const firstName = tgUser?.first_name || '';
      const username = tgUser?.username || '';

      fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_admin',
          userId,
          initData: tgInitData,
          firstName,
          username,
        }),
      })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((data) => {
          setIsVerifyingAdmin(false);
          if (data && data.authorized) {
            setTelegramUser({
              id: data.user?.id || userId,
              firstName: data.user?.firstName || firstName,
              username: data.user?.username || username,
            });
            setIsAdminOpen(true);
          } else {
            setTelegramUser(null);
            setIsAdminOpen(false);
            if (hasTgAdminParam || isTg) {
              setAdminAuthError(
                `Your Telegram ID (${userId || 'unknown'}) is not registered in the Shine & Sparkle administrators list.`
              );
            }
          }
        })
        .catch((err) => {
          console.error('Error verifying Telegram admin:', err);
          setIsVerifyingAdmin(false);
          setIsAdminOpen(false);
          if (hasTgAdminParam || isTg) {
            setAdminAuthError('Could not reach the server to verify administrator credentials.');
          }
        });
    }
  }, []);

  const handleOpenQuote = (serviceId = null) => {
    setQuoteServiceId(serviceId);
    setIsQuoteOpen(true);
  };

  const handleCloseQuote = () => {
    setIsQuoteOpen(false);
  };

  const handleCloseAdmin = () => {
    setIsAdminOpen(false);
    if (window.Telegram?.WebApp?.close) {
      try {
        window.Telegram.WebApp.close();
      } catch (e) {}
    }
  };

  const isLegalRoute = currentRoute === '/terms' || currentRoute === '/privacy';

  return (
    <>
      {isLegalRoute ? (
        <>
          <LegalPage
            initialTab={currentRoute === '/privacy' ? 'privacy' : 'terms'}
            onNavigate={navigate}
            onOpenQuote={handleOpenQuote}
          />
          <Footer onNavigate={navigate} />
        </>
      ) : (
        <>
          <Nav onOpenQuote={() => handleOpenQuote()} />
          <Hero onOpenQuote={() => handleOpenQuote()} />
          <ServiceAccordion onOpenQuote={handleOpenQuote} />
          <Process />
          <Testimonials />
          <Contact />
          <CTA onOpenQuote={() => handleOpenQuote()} />
          <Footer onNavigate={navigate} />
        </>
      )}

      <QuoteModal
        isOpen={isQuoteOpen}
        onClose={handleCloseQuote}
        initialServiceId={quoteServiceId}
      />

      <AdminPanel
        isOpen={isAdminOpen}
        onClose={handleCloseAdmin}
        telegramUser={telegramUser}
      />

      <CookieBanner onNavigate={navigate} />

      {adminAuthError && (
        <div className="modal-overlay open" style={{ zIndex: 10001 }}>
          <div className="modal-card" style={{ maxWidth: '420px', textAlign: 'center', padding: '32px 24px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⛔</div>
            <h3 style={{ marginBottom: '10px' }}>Access Restricted</h3>
            <p style={{ color: 'var(--ink-soft)', fontSize: '0.92rem', lineHeight: '1.5', marginBottom: '20px' }}>
              {adminAuthError}
            </p>
            <div
              style={{
                fontSize: '0.82rem',
                color: 'var(--ink)',
                marginBottom: '24px',
                background: '#F0F6FC',
                border: '1px solid #D0E1F5',
                padding: '12px',
                borderRadius: '8px',
                textAlign: 'left',
                lineHeight: '1.4',
              }}
            >
              🔑 <strong>How to get access:</strong>
              <div style={{ marginTop: '4px', color: 'var(--ink-soft)' }}>
                Contact the business owner or send your invite code in the Telegram bot: <code>/login your_code</code>.
              </div>
            </div>
            <button
              type="button"
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => {
                setAdminAuthError(null);
                if (window.Telegram?.WebApp?.close) {
                  try {
                    window.Telegram.WebApp.close();
                  } catch (e) {}
                }
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ConfigProvider>
        <MainApp />
      </ConfigProvider>
    </ThemeProvider>
  );
}
