import { useState, useEffect } from 'react';
import { ConfigProvider } from './context/ConfigContext.jsx';
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

function MainApp() {
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [quoteServiceId, setQuoteServiceId] = useState(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Check URL hash for #admin
  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash === '#admin') {
        setIsAdminOpen(true);
      }
    };

    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
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
    if (window.location.hash === '#admin') {
      window.history.replaceState(null, '', window.location.pathname);
    }
  };

  return (
    <>
      <Nav onOpenQuote={() => handleOpenQuote()} />
      <Hero onOpenQuote={() => handleOpenQuote()} />
      <ServiceAccordion onOpenQuote={handleOpenQuote} />
      <Process />
      <Testimonials />
      <Contact />
      <CTA onOpenQuote={() => handleOpenQuote()} />
      <Footer />

      <QuoteModal
        isOpen={isQuoteOpen}
        onClose={handleCloseQuote}
        initialServiceId={quoteServiceId}
      />

      <AdminPanel
        isOpen={isAdminOpen}
        onClose={handleCloseAdmin}
      />
    </>
  );
}

export default function App() {
  return (
    <ConfigProvider>
      <MainApp />
    </ConfigProvider>
  );
}
