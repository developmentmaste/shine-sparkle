import { createContext, useContext, useState, useEffect } from 'react';
import { SERVICES as INITIAL_SERVICES, MIN_CHARGE } from '../services.js';
import {
  WHATSAPP_PHONE as INITIAL_PHONE,
  WHATSAPP_DISPLAY as INITIAL_DISPLAY,
  DEFAULT_MESSAGE,
} from '../whatsapp.js';

export const DEFAULT_SETTINGS = {
  whatsappPhone: INITIAL_PHONE,
  whatsappDisplay: INITIAL_DISPLAY,
  email: 'shineandsparkle.mm@gmail.com',
  brandName: 'Shine & Sparkle Cleaning',
  minCharge: MIN_CHARGE,
  cities: 'Serving Dublin & surrounding areas',
  adminPin: 'admin123',
};

const STORAGE_KEY_SETTINGS = 'shine_sparkle_settings_v3';
const STORAGE_KEY_SERVICES = 'shine_sparkle_services_v1';

const ConfigContext = createContext(null);

export function ConfigProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const saved =
        localStorage.getItem(STORAGE_KEY_SETTINGS) ||
        localStorage.getItem('shine_sparkle_settings_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.email === 'hello@shinesparklecleaning.com') parsed.email = DEFAULT_SETTINGS.email;
        if (parsed.whatsappPhone === '15551234567') {
          parsed.whatsappPhone = DEFAULT_SETTINGS.whatsappPhone;
          parsed.whatsappDisplay = DEFAULT_SETTINGS.whatsappDisplay;
        }
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
      return DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [services, setServices] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SERVICES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_SERVICES;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings to localStorage:', e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SERVICES, JSON.stringify(services));
    } catch (e) {
      console.error('Failed to save services to localStorage:', e);
    }
  }, [services]);

  const updateSettings = (newFields) => {
    setSettings((prev) => ({ ...prev, ...newFields }));
  };

  const updateServices = (newServicesList) => {
    setServices(newServicesList);
  };

  const addService = (newService) => {
    const id = newService.id || 'service_' + Date.now();
    const serviceToAdd = {
      ...newService,
      id,
      rate: Number(newService.rate) || 1,
      included: Array.isArray(newService.included)
        ? newService.included
        : typeof newService.included === 'string'
        ? newService.included
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    };
    setServices((prev) => [...prev, serviceToAdd]);
    return serviceToAdd;
  };

  const editService = (id, updatedFields) => {
    setServices((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        return {
          ...s,
          ...updatedFields,
          rate: updatedFields.rate !== undefined ? Number(updatedFields.rate) : s.rate,
          included: Array.isArray(updatedFields.included)
            ? updatedFields.included
            : typeof updatedFields.included === 'string'
            ? updatedFields.included
                .split('\n')
                .map((x) => x.trim())
                .filter(Boolean)
            : s.included,
        };
      })
    );
  };

  const deleteService = (id) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    setServices(INITIAL_SERVICES);
    try {
      localStorage.removeItem(STORAGE_KEY_SETTINGS);
      localStorage.removeItem(STORAGE_KEY_SERVICES);
    } catch (e) {
      console.error(e);
    }
  };

  const exportConfigJson = () => {
    return JSON.stringify({ settings, services }, null, 2);
  };

  const importConfigJson = (jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      if (data.settings) setSettings((prev) => ({ ...prev, ...data.settings }));
      if (Array.isArray(data.services) && data.services.length > 0) {
        setServices(data.services);
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const getWhatsAppUrl = (message = DEFAULT_MESSAGE) => {
    const phone = (settings.whatsappPhone || INITIAL_PHONE).replace(/\D/g, '');
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  return (
    <ConfigContext.Provider
      value={{
        settings,
        services,
        updateSettings,
        updateServices,
        addService,
        editService,
        deleteService,
        resetToDefaults,
        exportConfigJson,
        importConfigJson,
        getWhatsAppUrl,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}
