import { useState, useEffect } from 'react';
import { useConfig } from '../context/ConfigContext.jsx';

const TRANSLATIONS = {
  ua: {
    appTitle: 'Адмін-панель',
    brand: 'Shine & Sparkle',
    backToBot: 'У бот',
    adminRole: 'Адміністратор',
    authTelegram: 'Авторизовано через Telegram',
    saved: '✓ Збережено!',
    // Tabs
    tabContacts: 'Контакти',
    tabServices: 'Послуги',
    tabBackup: 'Резерв',
    // Tab 1: Contacts & Settings
    contactsHeader: 'Контактні дані сайту',
    contactsSub: 'Ці контакти автоматично оновлюються на головному сайті для клієнтів.',
    whatsappPhoneLabel: 'WhatsApp номер (тільки цифри)',
    whatsappPhoneHint: 'Формат без знаку плюс, наприклад: 353852850720',
    whatsappDisplayLabel: 'Відображення телефону на сайті',
    whatsappDisplayHint: 'Наприклад: +353 85 285 0720',
    emailLabel: 'Контактний Email',
    brandNameLabel: 'Назва компанії / Бренд',
    minChargeLabel: 'Мінімальна вартість замовлення (€)',
    citiesLabel: 'Міста та регіони обслуговування',
    citiesHint: 'Наприклад: Dublin & surrounding areas',
    securityLabel: 'Безпека та доступ',
    securityTitle: 'Авторизація через Telegram',
    securityDesc: 'Доступ надається лише зареєстрованим ID у боті. Публічний доступ за PIN-кодом вимкнено для захисту.',
    saveSettingsBtn: 'Зберегти зміни контактів',
    // Tab 2: Services
    servicesHeader: 'Список активних послуг',
    servicesSub: 'Керуйте списком послуг, тарифами за м² та переліком робіт.',
    addServiceBtn: '+ Додати нову послугу',
    editBtn: '✏️ Редагувати',
    deleteBtn: '🗑️ Видалити',
    ratePerM2: '€ / м²',
    includedTitle: 'Що входить у послугу:',
    confirmDelete: (name) => `Ви впевнені, що хочете видалити послугу "${name}"?`,
    // Service Form
    formAddTitle: '✨ Створення нової послуги',
    formEditTitle: '✏️ Редагування послуги',
    serviceNameLabel: 'Назва послуги',
    serviceRateLabel: 'Тариф (€ за м²)',
    serviceCadenceLabel: 'Періодичність / Тип прибирання',
    cadenceWeekly: 'weekly or biweekly (щотижня / 2 тижні)',
    cadenceSeasonal: 'one-time or seasonal (разове / сезонне)',
    cadenceOneTime: 'one-time (разове прибирання)',
    serviceDescLabel: 'Детальний опис послуги',
    serviceIncludedLabel: 'Пункти «Що входить» (кожен пункт з нового рядка)',
    saveServiceBtn: 'Зберегти послугу',
    cancelBtn: 'Скасувати',
    // Tab 3: Backup
    backupHeader: 'Резервна копія налаштувань',
    backupSub: 'Ви можете скопіювати повну конфігурацію сайту в JSON для резерву або перенесення.',
    copyJsonBtn: '📋 Скопіювати JSON конфігурації',
    copiedMsg: 'Конфігурацію скопійовано в буфер обміну!',
    importHeader: 'Імпорт конфігурації',
    importPlaceholder: 'Вставте сюди скопійований JSON...',
    importBtn: '📥 Застосувати імпортований JSON',
    importSuccessMsg: 'Конфігурацію успішно імпортовано!',
    importErrorMsg: 'Помилка імпорту: ',
    resetHeader: 'Скидання до заводських значень',
    resetSub: 'Повертає всі контакти, послуги та тарифи до початкового стану.',
    resetBtn: '⚠️ Скинути все до початкового стану',
    confirmReset: 'Скинути всі налаштування та послуги до початкових заводських значень?',
  },
  en: {
    appTitle: 'Admin Panel',
    brand: 'Shine & Sparkle',
    backToBot: 'To Bot',
    adminRole: 'Administrator',
    authTelegram: 'Authenticated via Telegram',
    saved: '✓ Saved!',
    // Tabs
    tabContacts: 'Contacts',
    tabServices: 'Services',
    tabBackup: 'Backup',
    // Tab 1: Contacts & Settings
    contactsHeader: 'Website Contact Info',
    contactsSub: 'These details update immediately on the live website for your clients.',
    whatsappPhoneLabel: 'WhatsApp Number (digits only)',
    whatsappPhoneHint: 'Format without plus sign, e.g.: 353852850720',
    whatsappDisplayLabel: 'Phone Display Format on Website',
    whatsappDisplayHint: 'E.g.: +353 85 285 0720',
    emailLabel: 'Contact Email',
    brandNameLabel: 'Brand / Company Name',
    minChargeLabel: 'Minimum Order Charge (€)',
    citiesLabel: 'Service Cities & Areas',
    citiesHint: 'E.g.: Dublin & surrounding areas',
    securityLabel: 'Security & Access',
    securityTitle: 'Authorized via Telegram',
    securityDesc: 'Access is granted strictly to registered Telegram IDs. Public PIN access is disabled for maximum security.',
    saveSettingsBtn: 'Save Contact Details',
    // Tab 2: Services
    servicesHeader: 'Active Services List',
    servicesSub: 'Manage your services, rates per m², and included tasks.',
    addServiceBtn: '+ Add New Service',
    editBtn: '✏️ Edit',
    deleteBtn: '🗑️ Delete',
    ratePerM2: '€ / m²',
    includedTitle: "What's included in this service:",
    confirmDelete: (name) => `Are you sure you want to delete service "${name}"?`,
    // Service Form
    formAddTitle: '✨ Create New Service',
    formEditTitle: '✏️ Edit Service',
    serviceNameLabel: 'Service Name',
    serviceRateLabel: 'Rate (€ per m²)',
    serviceCadenceLabel: 'Frequency / Clean Type',
    cadenceWeekly: 'weekly or biweekly',
    cadenceSeasonal: 'one-time or seasonal',
    cadenceOneTime: 'one-time clean',
    serviceDescLabel: 'Detailed Description',
    serviceIncludedLabel: "Included Checklist (one item per line)",
    saveServiceBtn: 'Save Service',
    cancelBtn: 'Cancel',
    // Tab 3: Backup
    backupHeader: 'Configuration Backup',
    backupSub: 'You can copy the entire website configuration in JSON format to backup or migrate.',
    copyJsonBtn: '📋 Copy JSON Configuration',
    copiedMsg: 'Configuration copied to clipboard!',
    importHeader: 'Import Configuration',
    importPlaceholder: 'Paste copied JSON here...',
    importBtn: '📥 Apply Imported JSON',
    importSuccessMsg: 'Configuration successfully imported!',
    importErrorMsg: 'Import error: ',
    resetHeader: 'Reset to Factory Defaults',
    resetSub: 'Restores all contacts, rates, and services to factory default values.',
    resetBtn: '⚠️ Reset All to Initial Defaults',
    confirmReset: 'Reset all settings and services to initial factory defaults?',
  },
};

export default function AdminPanel({ isOpen, onClose, telegramUser }) {
  const {
    settings,
    services,
    updateSettings,
    addService,
    editService,
    deleteService,
    resetToDefaults,
    exportConfigJson,
    importConfigJson,
  } = useConfig();

  // Language state (Exclusive to Admin Panel, defaults to English)
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('shine_sparkle_admin_lang') || 'en';
    } catch {
      return 'en';
    }
  });

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const handleSwitchLang = (newLang) => {
    setLang(newLang);
    try {
      localStorage.setItem('shine_sparkle_admin_lang', newLang);
    } catch {}
  };

  const [activeTab, setActiveTab] = useState('settings'); // 'settings' | 'services' | 'backup'
  const [formData, setFormData] = useState({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync settings whenever external settings update
  useEffect(() => {
    setFormData({ ...settings });
  }, [settings]);

  // Service form state (for editing or adding)
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [isAddingService, setIsAddingService] = useState(false);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    rate: '',
    cadence: '',
    description: '',
    includedText: '',
    iconBg: '#E3EFFB',
  });

  // Backup state
  const [importJsonText, setImportJsonText] = useState('');
  const [backupMsg, setBackupMsg] = useState('');

  if (!isOpen) return null;

  function handleSaveSettings(e) {
    e.preventDefault();
    updateSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  }

  function handleOpenAddService() {
    setEditingServiceId(null);
    setServiceForm({
      name: '',
      rate: '1.0',
      cadence: 'one-time',
      description: '',
      includedText: 'General cleaning\nTrash removal\nFloors mopped',
      iconBg: '#E3EFFB',
    });
    setIsAddingService(true);
  }

  function handleOpenEditService(service) {
    setIsAddingService(false);
    setEditingServiceId(service.id);
    setServiceForm({
      name: service.name,
      rate: String(service.rate),
      cadence: service.cadence,
      description: service.description,
      includedText: (service.included || []).join('\n'),
      iconBg: service.iconBg || '#E3EFFB',
    });
  }

  function handleSaveService(e) {
    e.preventDefault();
    const payload = {
      name: serviceForm.name,
      rate: parseFloat(serviceForm.rate) || 1,
      cadence: serviceForm.cadence,
      description: serviceForm.description,
      included: serviceForm.includedText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      iconBg: serviceForm.iconBg,
    };

    if (isAddingService) {
      addService(payload);
      setIsAddingService(false);
    } else if (editingServiceId) {
      editService(editingServiceId, payload);
      setEditingServiceId(null);
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  }

  function handleDeleteService(id, name) {
    if (window.confirm(t.confirmDelete(name))) {
      deleteService(id);
    }
  }

  function handleCopyJson() {
    navigator.clipboard.writeText(exportConfigJson());
    setBackupMsg(t.copiedMsg);
    setTimeout(() => setBackupMsg(''), 3000);
  }

  function handleImportJson() {
    if (!importJsonText.trim()) return;
    const res = importConfigJson(importJsonText);
    if (res.success) {
      setBackupMsg(t.importSuccessMsg);
      setImportJsonText('');
      setFormData({ ...settings });
      setTimeout(() => setBackupMsg(''), 3000);
    } else {
      setBackupMsg(t.importErrorMsg + res.error);
    }
  }

  function handleResetAll() {
    if (window.confirm(t.confirmReset)) {
      resetToDefaults();
      onClose();
    }
  }

  return (
    <div className="admin-app-root">
      {/* Top Header */}
      <header className="admin-app-header">
        <div className="admin-header-row">
          <div className="admin-header-left">
            <button
              type="button"
              className="admin-back-btn"
              onClick={onClose}
              title={t.backToBot}
            >
              <span>←</span> {t.backToBot}
            </button>
            <div className="admin-title-wrap">
              <h2>{t.appTitle}</h2>
            </div>
          </div>

          <div className="admin-header-right">
            {/* Exclusive Language Switcher */}
            <div className="admin-lang-switcher" role="group" aria-label="Language selection">
              <button
                type="button"
                className={`admin-lang-btn ${lang === 'ua' ? 'active' : ''}`}
                onClick={() => handleSwitchLang('ua')}
                aria-pressed={lang === 'ua'}
              >
                🇺🇦 UA
              </button>
              <button
                type="button"
                className={`admin-lang-btn ${lang === 'en' ? 'active' : ''}`}
                onClick={() => handleSwitchLang('en')}
                aria-pressed={lang === 'en'}
              >
                🇬🇧 EN
              </button>
            </div>

            <button
              type="button"
              className="admin-close-btn"
              onClick={onClose}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Telegram Profile Banner */}
        <div className="admin-profile-banner">
          <div className="admin-profile-info">
            <span className="admin-online-dot"></span>
            <span>
              {t.adminRole}:{' '}
              <strong>
                {telegramUser?.firstName || telegramUser?.username || 'Telegram User'}
              </strong>
              {telegramUser?.username && ` (@${telegramUser.username})`}
              {telegramUser?.id && ` · ID: ${telegramUser.id}`}
            </span>
          </div>

          {saveSuccess && (
            <span className="admin-toast-badge">{t.saved}</span>
          )}
        </div>
      </header>

      {/* Main Scrollable Content */}
      <main className="admin-scroll-area">
        {/* ================= TAB 1: CONTACTS & SETTINGS ================= */}
        {activeTab === 'settings' && (
          <div className="admin-card">
            <div className="admin-card-header">
              <h3>📞 {t.contactsHeader}</h3>
              <p>{t.contactsSub}</p>
            </div>

            <form onSubmit={handleSaveSettings}>
              <div className="admin-field-group">
                <label className="field-label">{t.whatsappPhoneLabel}</label>
                <input
                  type="tel"
                  className="admin-input-touch"
                  value={formData.whatsappPhone || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, whatsappPhone: e.target.value })
                  }
                  placeholder="353852850720"
                  required
                />
                <small style={{ color: 'var(--ink-soft)', fontSize: '0.78rem', display: 'block', marginTop: '4px' }}>
                  {t.whatsappPhoneHint}
                </small>
              </div>

              <div className="admin-field-group">
                <label className="field-label">{t.whatsappDisplayLabel}</label>
                <input
                  type="text"
                  className="admin-input-touch"
                  value={formData.whatsappDisplay || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, whatsappDisplay: e.target.value })
                  }
                  placeholder="+353 85 285 0720"
                  required
                />
                <small style={{ color: 'var(--ink-soft)', fontSize: '0.78rem', display: 'block', marginTop: '4px' }}>
                  {t.whatsappDisplayHint}
                </small>
              </div>

              <div className="admin-field-group">
                <label className="field-label">{t.emailLabel}</label>
                <input
                  type="email"
                  className="admin-input-touch"
                  value={formData.email || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="shineandsparkle.mm@gmail.com"
                  required
                />
              </div>

              <div className="admin-field-group">
                <label className="field-label">{t.brandNameLabel}</label>
                <input
                  type="text"
                  className="admin-input-touch"
                  value={formData.brandName || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, brandName: e.target.value })
                  }
                  placeholder="Shine & Sparkle Cleaning"
                  required
                />
              </div>

              <div className="admin-field-group">
                <label className="field-label">{t.minChargeLabel}</label>
                <input
                  type="number"
                  min="0"
                  className="admin-input-touch"
                  value={formData.minCharge || 0}
                  onChange={(e) =>
                    setFormData({ ...formData, minCharge: Number(e.target.value) || 0 })
                  }
                  required
                />
              </div>

              <div className="admin-field-group">
                <label className="field-label">{t.citiesLabel}</label>
                <input
                  type="text"
                  className="admin-input-touch"
                  value={formData.cities || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, cities: e.target.value })
                  }
                  placeholder="Dublin & surrounding areas"
                  required
                />
                <small style={{ color: 'var(--ink-soft)', fontSize: '0.78rem', display: 'block', marginTop: '4px' }}>
                  {t.citiesHint}
                </small>
              </div>

              {/* Security info card */}
              <div className="admin-field-group" style={{ marginTop: '20px' }}>
                <label className="field-label">{t.securityLabel}</label>
                <div
                  style={{
                    background: '#F0F7FF',
                    border: '1px solid #C8E1FF',
                    borderRadius: '12px',
                    padding: '14px',
                    fontSize: '0.84rem',
                    color: 'var(--ink)',
                    lineHeight: '1.45',
                  }}
                >
                  🔒 <strong>{t.securityTitle}</strong>
                  <div style={{ color: 'var(--ink-soft)', marginTop: '4px', fontSize: '0.79rem' }}>
                    {t.securityDesc}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '24px' }}>
                <button
                  type="submit"
                  className="btn-primary admin-btn-touch"
                >
                  💾 {t.saveSettingsBtn}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ================= TAB 2: SERVICES ================= */}
        {activeTab === 'services' && (
          <div>
            {!isAddingService && !editingServiceId ? (
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px',
                    flexWrap: 'wrap',
                    gap: '10px',
                  }}
                >
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem' }}>🧹 {t.servicesHeader}</h3>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: 'var(--ink-soft)' }}>
                      {t.servicesSub}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ padding: '8px 16px', fontSize: '0.86rem', borderRadius: '100px' }}
                    onClick={handleOpenAddService}
                  >
                    {t.addServiceBtn}
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {services.map((service, index) => (
                    <div key={service.id || index} className="admin-service-card">
                      <div className="admin-service-top">
                        <div className="admin-service-info">
                          <h4>{service.name}</h4>
                          <div className="admin-service-meta">
                            <span className="admin-badge-rate">
                              €{service.rate} {t.ratePerM2}
                            </span>
                            <span className="admin-badge-cadence">
                              {service.cadence}
                            </span>
                          </div>
                        </div>
                      </div>

                      {service.description && (
                        <p className="admin-service-desc">{service.description}</p>
                      )}

                      {service.included && service.included.length > 0 && (
                        <div className="admin-service-included">
                          <strong style={{ display: 'block', marginBottom: '6px', fontSize: '0.78rem', color: 'var(--ink)' }}>
                            {t.includedTitle}
                          </strong>
                          <ul style={{ paddingLeft: '16px', margin: 0, lineHeight: '1.4' }}>
                            {service.included.map((item, i) => (
                              <li key={i} style={{ marginBottom: '3px' }}>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="admin-service-actions">
                        <button
                          type="button"
                          className="btn-secondary admin-action-btn"
                          onClick={() => handleOpenEditService(service)}
                        >
                          {t.editBtn}
                        </button>
                        <button
                          type="button"
                          className="admin-action-btn"
                          style={{
                            background: '#FFF1F2',
                            color: '#E11D48',
                            border: '1px solid #FFE4E6',
                          }}
                          onClick={() => handleDeleteService(service.id, service.name)}
                        >
                          {t.deleteBtn}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Add or Edit Service Form */
              <div className="admin-card">
                <div className="admin-card-header">
                  <h3>{isAddingService ? t.formAddTitle : t.formEditTitle}</h3>
                </div>

                <form onSubmit={handleSaveService}>
                  <div className="admin-field-group">
                    <label className="field-label">{t.serviceNameLabel}</label>
                    <input
                      type="text"
                      className="admin-input-touch"
                      value={serviceForm.name}
                      onChange={(e) =>
                        setServiceForm({ ...serviceForm, name: e.target.value })
                      }
                      placeholder="Regular cleaning"
                      required
                    />
                  </div>

                  <div className="admin-field-group">
                    <label className="field-label">{t.serviceRateLabel}</label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.1"
                      className="admin-input-touch"
                      value={serviceForm.rate}
                      onChange={(e) =>
                        setServiceForm({ ...serviceForm, rate: e.target.value })
                      }
                      placeholder="1.2"
                      required
                    />
                  </div>

                  <div className="admin-field-group">
                    <label className="field-label">{t.serviceCadenceLabel}</label>
                    <select
                      className="admin-input-touch"
                      value={serviceForm.cadence}
                      onChange={(e) =>
                        setServiceForm({ ...serviceForm, cadence: e.target.value })
                      }
                    >
                      <option value="weekly or biweekly">{t.cadenceWeekly}</option>
                      <option value="one-time or seasonal">{t.cadenceSeasonal}</option>
                      <option value="one-time">{t.cadenceOneTime}</option>
                    </select>
                  </div>

                  <div className="admin-field-group">
                    <label className="field-label">{t.serviceDescLabel}</label>
                    <textarea
                      className="admin-input-touch"
                      rows={3}
                      value={serviceForm.description}
                      onChange={(e) =>
                        setServiceForm({ ...serviceForm, description: e.target.value })
                      }
                      placeholder="A thorough clean for spaces that need extra care."
                    />
                  </div>

                  <div className="admin-field-group">
                    <label className="field-label">{t.serviceIncludedLabel}</label>
                    <textarea
                      className="admin-input-touch"
                      rows={5}
                      value={serviceForm.includedText}
                      onChange={(e) =>
                        setServiceForm({ ...serviceForm, includedText: e.target.value })
                      }
                      placeholder={"Kitchen surfaces and sink\nBathroom disinfection\nFloors vacuumed and mopped"}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button
                      type="submit"
                      className="btn-primary admin-btn-touch"
                      style={{ flex: 2 }}
                    >
                      💾 {t.saveServiceBtn}
                    </button>
                    <button
                      type="button"
                      className="btn-secondary admin-btn-touch"
                      style={{ flex: 1 }}
                      onClick={() => {
                        setIsAddingService(false);
                        setEditingServiceId(null);
                      }}
                    >
                      {t.cancelBtn}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: BACKUP & DATA ================= */}
        {activeTab === 'backup' && (
          <div className="admin-card">
            <div className="admin-card-header">
              <h3>💾 {t.backupHeader}</h3>
              <p>{t.backupSub}</p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <button
                type="button"
                className="btn-primary admin-btn-touch"
                onClick={handleCopyJson}
              >
                {t.copyJsonBtn}
              </button>
              {backupMsg && (
                <div
                  style={{
                    marginTop: '10px',
                    color: '#15803D',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    background: '#DCFCE7',
                    padding: '8px 12px',
                    borderRadius: '8px',
                  }}
                >
                  {backupMsg}
                </div>
              )}
            </div>

            <div className="divider" />

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '1rem', marginBottom: '8px' }}>{t.importHeader}</h4>
              <textarea
                className="admin-input-touch"
                placeholder={t.importPlaceholder}
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                style={{ minHeight: '120px', fontFamily: 'monospace', fontSize: '0.82rem' }}
              />
              <button
                type="button"
                className="btn-secondary admin-btn-touch"
                onClick={handleImportJson}
                disabled={!importJsonText.trim()}
                style={{ marginTop: '10px' }}
              >
                {t.importBtn}
              </button>
            </div>

            <div className="divider" />

            <div>
              <h4 style={{ fontSize: '1rem', color: '#E11D48', marginBottom: '6px' }}>
                {t.resetHeader}
              </h4>
              <p style={{ fontSize: '0.84rem', color: 'var(--ink-soft)', marginBottom: '12px' }}>
                {t.resetSub}
              </p>
              <button
                type="button"
                className="admin-btn-touch"
                style={{
                  background: '#FFF1F2',
                  color: '#E11D48',
                  border: '1px solid #FFE4E6',
                }}
                onClick={handleResetAll}
              >
                {t.resetBtn}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Mobile App Bottom Navigation Bar */}
      <nav className="admin-bottom-nav">
        <button
          type="button"
          className={`admin-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('settings');
            setIsAddingService(false);
            setEditingServiceId(null);
          }}
        >
          <div className="admin-nav-icon-wrap">
            <span>📞</span>
          </div>
          <span className="admin-nav-label">{t.tabContacts}</span>
        </button>

        <button
          type="button"
          className={`admin-nav-item ${activeTab === 'services' ? 'active' : ''}`}
          onClick={() => setActiveTab('services')}
        >
          <div className="admin-nav-icon-wrap">
            <span>🧹</span>
            {services.length > 0 && (
              <span className="admin-nav-badge">{services.length}</span>
            )}
          </div>
          <span className="admin-nav-label">{t.tabServices}</span>
        </button>

        <button
          type="button"
          className={`admin-nav-item ${activeTab === 'backup' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('backup');
            setIsAddingService(false);
            setEditingServiceId(null);
          }}
        >
          <div className="admin-nav-icon-wrap">
            <span>💾</span>
          </div>
          <span className="admin-nav-label">{t.tabBackup}</span>
        </button>
      </nav>
    </div>
  );
}
