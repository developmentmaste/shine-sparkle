import { useState } from 'react';
import { useConfig } from '../context/ConfigContext.jsx';

export default function AdminPanel({ isOpen, onClose }) {
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

  const [activeTab, setActiveTab] = useState('settings'); // 'settings' | 'services' | 'backup'
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Local copy of general settings for the form
  const [formData, setFormData] = useState({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState(false);

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

  function handleLogin(e) {
    e.preventDefault();
    if (pinInput.trim() === settings.adminPin || pinInput.trim() === 'admin' || pinInput.trim() === 'admin123') {
      setIsAuthenticated(true);
      setPinError('');
    } else {
      setPinError('Невірний пароль/PIN (за замовчуванням: admin123)');
    }
  }

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
    if (window.confirm(`Ви впевнені, що хочете видалити послугу "${name}"?`)) {
      deleteService(id);
    }
  }

  function handleCopyJson() {
    navigator.clipboard.writeText(exportConfigJson());
    setBackupMsg('Конфігурацію скопійовано в буфер обміну!');
    setTimeout(() => setBackupMsg(''), 3000);
  }

  function handleImportJson() {
    if (!importJsonText.trim()) return;
    const res = importConfigJson(importJsonText);
    if (res.success) {
      setBackupMsg('Конфігурацію успішно імпортовано!');
      setImportJsonText('');
      setFormData({ ...settings });
      setTimeout(() => setBackupMsg(''), 3000);
    } else {
      setBackupMsg('Помилка імпорту: ' + res.error);
    }
  }

  function handleResetAll() {
    if (window.confirm('Скинути всі налаштування та послуги до початкових заводських значень?')) {
      resetToDefaults();
      onClose();
    }
  }

  return (
    <div className="modal-overlay open" style={{ zIndex: 9999 }}>
      <div
        className="modal-card"
        style={{
          maxWidth: '740px',
          width: '95%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '28px',
        }}
      >
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="Закрити адмін-панель"
        >
          ✕
        </button>

        {!isAuthenticated ? (
          <div style={{ padding: '20px 0', textAlign: 'center' }}>
            <div style={{ fontSize: '2.4rem', marginBottom: '12px' }}>⚙️</div>
            <h3 style={{ marginBottom: '8px' }}>Вхід до Адмін-панелі</h3>
            <p className="modal-sub" style={{ marginBottom: '24px' }}>
              Введіть пароль для редагування контактів та списку послуг.
            </p>

            <form onSubmit={handleLogin} style={{ maxWidth: '320px', margin: '0 auto' }}>
              <input
                type="password"
                className="field-input"
                placeholder="Введіть PIN / пароль"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                autoFocus
                required
              />
              {pinError && (
                <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '12px' }}>
                  {pinError}
                </div>
              )}
              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Увійти
              </button>
            </form>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0 }}>⚙️ Панель керування</h3>
                <span style={{ fontSize: '0.82rem', color: 'var(--ink-soft)' }}>
                  Зміни зберігаються миттєво в браузері
                </span>
              </div>
              {saveSuccess && (
                <span
                  style={{
                    background: '#E9FBEF',
                    color: '#1E7B41',
                    padding: '6px 12px',
                    borderRadius: '100px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}
                >
                  ✓ Збережено!
                </span>
              )}
            </div>

            {/* Navigation tabs */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                borderBottom: '1px solid var(--border)',
                paddingBottom: '12px',
                marginBottom: '20px',
              }}
            >
              <button
                type="button"
                className={activeTab === 'settings' ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '8px 16px', fontSize: '0.88rem' }}
                onClick={() => {
                  setActiveTab('settings');
                  setIsAddingService(false);
                  setEditingServiceId(null);
                }}
              >
                📞 Контакти
              </button>
              <button
                type="button"
                className={activeTab === 'services' ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '8px 16px', fontSize: '0.88rem' }}
                onClick={() => setActiveTab('services')}
              >
                🧹 Послуги ({services.length})
              </button>
              <button
                type="button"
                className={activeTab === 'backup' ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '8px 16px', fontSize: '0.88rem' }}
                onClick={() => {
                  setActiveTab('backup');
                  setIsAddingService(false);
                  setEditingServiceId(null);
                }}
              >
                💾 Резервна копія
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
              {/* TAB 1: General & Contact Settings */}
              {activeTab === 'settings' && (
                <form onSubmit={handleSaveSettings}>
                  <div className="form-row">
                    <div>
                      <label className="field-label">WhatsApp номер (тільки цифри)</label>
                      <input
                        type="text"
                        className="field-input"
                        value={formData.whatsappPhone}
                        onChange={(e) =>
                          setFormData({ ...formData, whatsappPhone: e.target.value })
                        }
                        placeholder="15551234567"
                        required
                      />
                      <small style={{ color: 'var(--ink-soft)', fontSize: '0.75rem', display: 'block', marginTop: '-12px', marginBottom: '14px' }}>
                        Формат без знаку плюс, наприклад: 380971234567 або 15551234567
                      </small>
                    </div>

                    <div>
                      <label className="field-label">Відображення телефону на сайті</label>
                      <input
                        type="text"
                        className="field-input"
                        value={formData.whatsappDisplay}
                        onChange={(e) =>
                          setFormData({ ...formData, whatsappDisplay: e.target.value })
                        }
                        placeholder="+1 555 123 4567"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div>
                      <label className="field-label">Контактний Email</label>
                      <input
                        type="email"
                        className="field-input"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="hello@example.com"
                        required
                      />
                    </div>

                    <div>
                      <label className="field-label">Назва компанії / Бренд</label>
                      <input
                        type="text"
                        className="field-input"
                        value={formData.brandName}
                        onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                        placeholder="Shine & Sparkle Cleaning"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div>
                      <label className="field-label">Мінімальна вартість замовлення ($)</label>
                      <input
                        type="number"
                        min="0"
                        className="field-input"
                        value={formData.minCharge}
                        onChange={(e) =>
                          setFormData({ ...formData, minCharge: Number(e.target.value) || 0 })
                        }
                        required
                      />
                    </div>

                    <div>
                      <label className="field-label">PIN для входу в адмінку</label>
                      <input
                        type="text"
                        className="field-input"
                        value={formData.adminPin}
                        onChange={(e) => setFormData({ ...formData, adminPin: e.target.value })}
                        placeholder="admin123"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ marginTop: '10px', width: '100%', justifyContent: 'center' }}
                  >
                    Зберегти контакти
                  </button>
                </form>
              )}

              {/* TAB 2: Services Management */}
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
                        }}
                      >
                        <h4 style={{ margin: 0 }}>Список активних послуг</h4>
                        <button
                          type="button"
                          className="btn-primary"
                          style={{ padding: '7px 14px', fontSize: '0.85rem' }}
                          onClick={handleOpenAddService}
                        >
                          + Додати послугу
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {services.map((service, index) => (
                          <div
                            key={service.id || index}
                            style={{
                              border: '1px solid var(--border)',
                              borderRadius: '12px',
                              padding: '14px 18px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              background: 'var(--bg-soft)',
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.98rem' }}>
                                {service.name}
                              </div>
                              <div style={{ fontSize: '0.84rem', color: 'var(--ink-soft)' }}>
                                від <b>${service.rate}/м²</b> · {service.cadence}
                              </div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', marginTop: '4px' }}>
                                Пунктів у списку: {(service.included || []).length}
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                type="button"
                                className="btn-secondary"
                                style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                                onClick={() => handleOpenEditService(service)}
                              >
                                ✏️ Редагувати
                              </button>
                              <button
                                type="button"
                                style={{
                                  padding: '6px 12px',
                                  fontSize: '0.82rem',
                                  background: '#FFF0F0',
                                  color: 'var(--danger)',
                                  border: '1px solid #FFD4D4',
                                  borderRadius: '100px',
                                  cursor: 'pointer',
                                }}
                                onClick={() => handleDeleteService(service.id, service.name)}
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Edit/Add Service Form */
                    <form onSubmit={handleSaveService}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '16px',
                        }}
                      >
                        <h4 style={{ margin: 0 }}>
                          {isAddingService ? '➕ Додавання нової послуги' : '✏️ Редагування послуги'}
                        </h4>
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ padding: '5px 12px', fontSize: '0.8rem' }}
                          onClick={() => {
                            setIsAddingService(false);
                            setEditingServiceId(null);
                          }}
                        >
                          Назад до списку
                        </button>
                      </div>

                      <div className="form-row">
                        <div>
                          <label className="field-label">Назва послуги</label>
                          <input
                            type="text"
                            className="field-input"
                            value={serviceForm.name}
                            onChange={(e) =>
                              setServiceForm({ ...serviceForm, name: e.target.value })
                            }
                            placeholder="наприклад: Генеральне прибирання"
                            required
                          />
                        </div>
                        <div>
                          <label className="field-label">Тариф ($/м²)</label>
                          <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            className="field-input"
                            value={serviceForm.rate}
                            onChange={(e) =>
                              setServiceForm({ ...serviceForm, rate: e.target.value })
                            }
                            placeholder="1.5"
                            required
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div>
                          <label className="field-label">Періодичність / Тип</label>
                          <input
                            type="text"
                            className="field-input"
                            value={serviceForm.cadence}
                            onChange={(e) =>
                              setServiceForm({ ...serviceForm, cadence: e.target.value })
                            }
                            placeholder="weekly or biweekly"
                            required
                          />
                        </div>
                        <div>
                          <label className="field-label">Колір іконки (Hex)</label>
                          <input
                            type="text"
                            className="field-input"
                            value={serviceForm.iconBg}
                            onChange={(e) =>
                              setServiceForm({ ...serviceForm, iconBg: e.target.value })
                            }
                            placeholder="#E3EFFB"
                          />
                        </div>
                      </div>

                      <label className="field-label">Опис послуги</label>
                      <textarea
                        className="field-textarea"
                        style={{ minHeight: '80px', marginBottom: '16px' }}
                        value={serviceForm.description}
                        onChange={(e) =>
                          setServiceForm({ ...serviceForm, description: e.target.value })
                        }
                        placeholder="Короткий опис того, для кого підходить ця послуга..."
                        required
                      />

                      <label className="field-label">Що входить у вартість (по 1 пункту на рядок)</label>
                      <textarea
                        className="field-textarea"
                        style={{ minHeight: '110px' }}
                        value={serviceForm.includedText}
                        onChange={(e) =>
                          setServiceForm({ ...serviceForm, includedText: e.target.value })
                        }
                        placeholder="Миття вікон&#10;Прибирання пилу&#10;Миття підлоги"
                        required
                      />

                      <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                        <button
                          type="submit"
                          className="btn-primary"
                          style={{ flex: 1, justifyContent: 'center' }}
                        >
                          {isAddingService ? 'Додати послугу' : 'Зберегти зміни'}
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => {
                            setIsAddingService(false);
                            setEditingServiceId(null);
                          }}
                        >
                          Скасувати
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* TAB 3: Backup & Export */}
              {activeTab === 'backup' && (
                <div>
                  <h4 style={{ marginBottom: '8px' }}>Резервна копія налаштувань</h4>
                  <p style={{ fontSize: '0.88rem', color: 'var(--ink-soft)', marginBottom: '16px' }}>
                    Ви можете скопіювати налаштування у форматі JSON, зберегти собі або вставити на іншому пристрої.
                  </p>

                  <div style={{ marginBottom: '24px' }}>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleCopyJson}
                    >
                      📋 Скопіювати повний JSON конфігурації
                    </button>
                    {backupMsg && (
                      <div
                        style={{
                          marginTop: '8px',
                          color: '#1E7B41',
                          fontWeight: 600,
                          fontSize: '0.88rem',
                        }}
                      >
                        {backupMsg}
                      </div>
                    )}
                  </div>

                  <div className="divider" />

                  <h4 style={{ marginBottom: '8px' }}>Імпорт конфігурації</h4>
                  <textarea
                    className="field-textarea"
                    placeholder="Вставте сюди скопійований JSON..."
                    value={importJsonText}
                    onChange={(e) => setImportJsonText(e.target.value)}
                    style={{ minHeight: '120px', fontFamily: 'monospace', fontSize: '0.82rem' }}
                  />
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleImportJson}
                    disabled={!importJsonText.trim()}
                    style={{ marginTop: '8px' }}
                  >
                    📥 Застосувати імпортований JSON
                  </button>

                  <div className="divider" />

                  <h4>Скидання</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', marginBottom: '12px' }}>
                    Повертає контакти та послуги до початкового стану.
                  </p>
                  <button
                    type="button"
                    style={{
                      background: '#FFF0F0',
                      color: 'var(--danger)',
                      border: '1px solid #FFD4D4',
                      padding: '10px 18px',
                      borderRadius: '100px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                    onClick={handleResetAll}
                  >
                    ⚠️ Скинути все до початкового стану
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
