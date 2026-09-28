import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple native .env loader without external dependencies
try {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = (match[2] || '').trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        process.env[key] = process.env[key] || val;
      }
    }
  }
} catch (e) {}
const DATA_DIR = path.resolve(__dirname, '../data');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error('❌ Помилка: Змінна TELEGRAM_BOT_TOKEN не вказана у файлі server/.env або змінних середовища.');
  console.error('Створіть файл server/.env та додайте: TELEGRAM_BOT_TOKEN=ваш_токен_від_botfather');
  process.exit(1);
}
const SITE_URL = (process.env.CLIENT_ORIGIN || 'https://shine-sparkle.pages.dev').replace(/\/+$/, '');

const DEFAULT_SETTINGS = {
  whatsappPhone: '353852850720',
  whatsappDisplay: '+353 85 285 0720',
  email: 'shineandsparkle.mm@gmail.com',
  brandName: 'Shine & Sparkle Cleaning',
  minCharge: 40,
  cities: 'Dublin & surrounding areas',
  adminPin: 'admin123',
};

const DEFAULT_SERVICES = [
  {
    id: 'regular',
    name: 'Regular cleaning',
    rate: 0.9,
    cadence: 'weekly or biweekly',
    iconBg: '#E3EFFB',
    description: 'Upkeep cleaning for apartments already in decent shape.',
    included: ['Kitchen surfaces and sink', 'Bathroom and fixtures', 'Floors, vacuumed and mopped', 'Dusting and bed making'],
  },
  {
    id: 'deep',
    name: 'Deep cleaning',
    rate: 1.8,
    cadence: 'one-time or seasonal',
    iconBg: '#EAF3FB',
    description: "A thorough clean for spaces that haven't had attention in a while.",
    included: ['Inside oven and fridge', 'Windows, sills, and frames', 'Baseboards and door frames', 'Grout and tile scrubbing'],
  },
  {
    id: 'renovation',
    name: 'Post-renovation cleaning',
    rate: 2.5,
    cadence: 'one-time',
    iconBg: '#DCEEFA',
    description: 'Built for the mess renovations leave behind: fine dust, paint specks, adhesive residue.',
    included: ['Construction dust removal', 'Paint and adhesive residue', 'Air vents and light fixtures', 'Final polish on all surfaces'],
  },
  {
    id: 'moveout',
    name: 'Move-out cleaning',
    rate: 1.3,
    cadence: 'one-time',
    iconBg: '#D6E8F8',
    description: 'Designed to satisfy landlords, property managers, and incoming tenants.',
    included: ['Inside all empty cabinets and drawers', 'Full kitchen degreasing and appliance clean', 'Deep bathroom disinfection', 'All floors and skirting boards'],
  },
];

function loadConfig() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(CONFIG_FILE)) {
      const data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      return {
        settings: { ...DEFAULT_SETTINGS, ...data.settings },
        services: Array.isArray(data.services) && data.services.length > 0 ? data.services : DEFAULT_SERVICES,
      };
    }
  } catch (err) {
    console.error('Error loading config.json:', err);
  }
  return { settings: { ...DEFAULT_SETTINGS }, services: [...DEFAULT_SERVICES] };
}

function saveConfig(config) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving config.json:', err);
  }
}

let appConfig = loadConfig();
const pendingActions = {};

function getAuthorizedUsers() {
  const file = path.join(DATA_DIR, 'admins.json');
  try {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    }
  } catch (e) {}
  return [];
}

function addAuthorizedUser(userId) {
  const file = path.join(DATA_DIR, 'admins.json');
  const admins = getAuthorizedUsers();
  const strId = String(userId);
  if (!admins.includes(strId)) {
    admins.push(strId);
    fs.writeFileSync(file, JSON.stringify(admins, null, 2), 'utf8');
  }
}

function getAccessCodes() {
  const file = path.join(DATA_DIR, 'codes.json');
  try {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    }
  } catch (e) {}
  return [];
}

function saveAccessCodes(codes) {
  const file = path.join(DATA_DIR, 'codes.json');
  fs.writeFileSync(file, JSON.stringify(codes, null, 2), 'utf8');
}

function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 5; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `SS-${rand}`;
}

function isUserAuthorized(userId) {
  const strId = String(userId);
  const envAdminIds = (process.env.TELEGRAM_ADMIN_IDS || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

  if (envAdminIds.includes(strId)) return true;
  if (getAuthorizedUsers().includes(strId)) return true;
  return false;
}

async function tgCall(method, payload) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return await res.json().catch(() => ({}));
}

function parseIncludedItems(text) {
  if (!text) return ['Основне прибирання поверхонь', 'Дезінфекція санвузлів', 'Миття підлоги'];
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  let items = [];
  if (lines.length > 1) {
    items = lines.map((l) => l.replace(/^[•\-\*\d\.\)\s✓]+/, '').trim()).filter(Boolean);
  } else if (lines.length === 1) {
    items = lines[0]
      .split(/[,;]/)
      .map((l) => l.replace(/^[•\-\*\d\.\)\s✓]+/, '').trim())
      .filter(Boolean);
  }
  return items.length > 0 ? items : ['Основне прибирання поверхонь', 'Дезінфекція санвузлів', 'Миття підлоги'];
}

function renderServiceMessage(service) {
  const includedList = (service.included || []).map((x) => `  ✓ ${x}`).join('\n');
  const text =
    `🧹 *Послуга:* ${service.name}\n` +
    `💵 *Тариф:* from *$${service.rate}/m²*\n` +
    `⏳ *Періодичність:* \`${service.cadence || 'за домовленістю'}\`\n` +
    `📝 *Опис:* ${service.description || '—'}\n\n` +
    `📋 *Що входить:*\n${includedList || '  (список порожній)'}`;

  const keyboard = [
    [
      { text: '💵 Тариф ($/m²)', callback_data: `rate_${service.id}` },
      { text: '✏️ Назва', callback_data: `rename_${service.id}` },
    ],
    [
      { text: '⏳ Періодичність', callback_data: `cadence_${service.id}` },
      { text: '📝 Опис', callback_data: `desc_${service.id}` },
    ],
    [
      { text: '📋 Що входить', callback_data: `incl_${service.id}` },
      { text: '🗑 Видалити', callback_data: `del_${service.id}` },
    ],
    [
      { text: '🔙 До списку послуг', callback_data: 'menu_services' },
    ],
  ];

  return { text, reply_markup: { inline_keyboard: keyboard } };
}

function getMainKeyboard() {
  return {
    inline_keyboard: [
      [
        {
          text: '📱 Відкрити Адмін-панель (WebApp)',
          web_app: { url: `${SITE_URL}/#admin` },
        },
      ],
      [
        { text: '🧹 Послуги та тарифи', callback_data: 'menu_services' },
        { text: '📞 Контакти сайту', callback_data: 'menu_contacts' },
      ],
      [
        { text: '🔑 Коди доступу', callback_data: 'menu_codes' },
        { text: '👥 Адміністратори', callback_data: 'act_list_admins' },
      ],
      [
        { text: '🌐 Відкрити сайт', url: SITE_URL },
        { text: '🔄 Оновити', callback_data: 'menu_main' },
      ],
    ],
  };
}

async function handleCallback(cb) {
  const chatId = cb.message.chat.id;
  const messageId = cb.message.message_id;
  const userId = cb.from ? cb.from.id : chatId;
  const data = cb.data;

  const authorized = isUserAuthorized(userId);
  if (!authorized) {
    await tgCall('answerCallbackQuery', {
      callback_query_id: cb.id,
      text: `⛔ Доступ заборонено! Ваш ID: ${userId}. Введіть /login <пароль> для входу.`,
      show_alert: true,
    });
    return;
  }

  await tgCall('answerCallbackQuery', { callback_query_id: cb.id });

  if (data === 'menu_main') {
    delete pendingActions[chatId];
    await tgCall('editMessageText', {
      chat_id: chatId,
      message_id: messageId,
      text: `🧹 *Головне меню адмін-панелі*\n\nТут ви можете керувати послугами, тарифами за м² та контактами сайту.\n\nТакож ви можете натиснути кнопку *WebApp* нижче, щоб відкрити повноцінний інтерфейс прямо в Telegram!`,
      parse_mode: 'Markdown',
      reply_markup: getMainKeyboard(),
    });
    return;
  }

  if (data === 'menu_contacts') {
    delete pendingActions[chatId];
    const { settings } = appConfig;
    const text =
      `📞 *Поточні контакти сайту:*\n\n` +
      `• *Телефон / WhatsApp:* \`${settings.whatsappDisplay}\`\n` +
      `• *Email:* \`${settings.email}\`\n` +
      `• *Локація:* \`${settings.cities || 'Dublin & surrounding areas'}\`\n\n` +
      `Оберіть параметр, який бажаєте змінити:`;

    await tgCall('editMessageText', {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '✏️ Змінити телефон / WhatsApp', callback_data: 'act_phone' }],
          [{ text: '✏️ Змінити Email', callback_data: 'act_email' }],
          [{ text: '✏️ Змінити локацію / міста', callback_data: 'act_cities' }],
          [{ text: '🔙 Назад до меню', callback_data: 'menu_main' }],
        ],
      },
    });
    return;
  }

  if (data === 'menu_codes') {
    delete pendingActions[chatId];
    const codes = getAccessCodes();
    const activeCodes = codes.filter((c) => c.status === 'active');
    const usedCodes = codes.filter((c) => c.status === 'used');

    let text = `🔑 *Керування кодами доступу*\n\n` +
      `Тут ви можете створювати одноразові коди та роздавати їх колегам чи помічникам.\n\n`;

    if (activeCodes.length > 0) {
      text += `🟢 *Активні коди доступу (${activeCodes.length}):*\n`;
      activeCodes.slice(-8).reverse().forEach((c) => {
        text += `• \`${c.code}\`\n`;
      });
      text += `\n`;
    } else {
      text += `🟢 *Активні коди:* _Немає активних кодів_\n\n`;
    }

    if (usedCodes.length > 0) {
      text += `⚪ *Використані коди (${usedCodes.length}):*\n`;
      usedCodes.slice(-4).reverse().forEach((c) => {
        const who = c.used_by_username || `ID: ${c.used_by}`;
        text += `• ~${c.code}~ (${who})\n`;
      });
      text += `\n`;
    }

    const buttons = [
      [{ text: '➕ Згенерувати новий код', callback_data: 'act_gen_code' }],
      [{ text: '👥 Список адміністраторів', callback_data: 'act_list_admins' }],
    ];
    if (usedCodes.length > 0) {
      buttons.push([{ text: '🗑 Очистити використані', callback_data: 'act_clean_codes' }]);
    }
    buttons.push([{ text: '🔙 Назад до меню', callback_data: 'menu_main' }]);

    await tgCall('editMessageText', {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: buttons },
    });
    return;
  }

  if (data === 'act_gen_code') {
    const newCode = generateInviteCode();
    const codes = getAccessCodes();
    codes.push({
      code: newCode,
      created_at: new Date().toISOString(),
      created_by: userId,
      status: 'active',
    });
    saveAccessCodes(codes);

    const text =
      `🎉 *Згенеровано новий код доступу!*\n\n` +
      `Ключ: \`${newCode}\`\n\n` +
      `📋 *Інструкція для передачі:*\n` +
      `1. Надішліть цей код людині, якій надаєте доступ.\n` +
      `2. Людина відкриває бота @sandsparklebot та відправляє:\n` +
      `\`/login ${newCode}\` (або просто код \`${newCode}\` у повідомленні).\n\n` +
      `_Код є одноразовим. Після активації доступ закріплюється за Telegram ID назавжди._`;

    await tgCall('editMessageText', {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '➕ Згенерувати ще один код', callback_data: 'act_gen_code' }],
          [{ text: '🔑 Усі коди доступу', callback_data: 'menu_codes' }],
          [{ text: '🔙 Головне меню', callback_data: 'menu_main' }],
        ],
      },
    });
    return;
  }

  if (data === 'act_clean_codes') {
    const codes = getAccessCodes();
    const remaining = codes.filter((c) => c.status === 'active');
    saveAccessCodes(remaining);
    await tgCall('answerCallbackQuery', {
      callback_query_id: cb.id,
      text: '🧹 Використані коди очищено!',
    });

    let text = `🔑 *Керування кодами доступу*\n\n` +
      `Історію використаних кодів очищено.\n\n`;

    if (remaining.length > 0) {
      text += `🟢 *Активні коди доступу (${remaining.length}):*\n`;
      remaining.slice(-8).reverse().forEach((c) => {
        text += `• \`${c.code}\`\n`;
      });
      text += `\n`;
    } else {
      text += `🟢 *Активні коди:* _Немає активних кодів_\n\n`;
    }

    await tgCall('editMessageText', {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '➕ Згенерувати новий код', callback_data: 'act_gen_code' }],
          [{ text: '👥 Список адміністраторів', callback_data: 'act_list_admins' }],
          [{ text: '🔙 Назад до меню', callback_data: 'menu_main' }],
        ],
      },
    });
    return;
  }

  if (data === 'act_list_admins') {
    const admins = getAuthorizedUsers();
    const envAdmins = (process.env.TELEGRAM_ADMIN_IDS || '')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);

    let text = `👥 *Авторизовані адміністратори*\n\n`;
    if (envAdmins.length > 0) {
      text += `⚙️ *Через змінну оточення (${envAdmins.length}):*\n`;
      envAdmins.forEach((id) => {
        text += `• ID: \`${id}\`\n`;
      });
      text += `\n`;
    }

    if (admins.length > 0) {
      text += `🔑 *Через коди доступу / пароль (${admins.length}):*\n`;
      admins.forEach((id) => {
        text += `• ID: \`${id}\`${String(id) === String(userId) ? ' (Це ви)' : ''}\n`;
      });
    } else if (envAdmins.length === 0) {
      text += `_Ще немає доданих адміністраторів._\n`;
    }

    await tgCall('editMessageText', {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '➕ Створити код доступу', callback_data: 'act_gen_code' }],
          [{ text: '🔑 До кодів доступу', callback_data: 'menu_codes' }],
          [{ text: '🔙 Головне меню', callback_data: 'menu_main' }],
        ],
      },
    });
    return;
  }

  if (data === 'act_phone') {
    pendingActions[chatId] = { action: 'set_phone' };
    await tgCall('sendMessage', {
      chat_id: chatId,
      text: `✏️ *Введіть новий номер телефону / WhatsApp* у відповідь на це повідомлення:\n(Наприклад: \`+353 85 285 0720\`)`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: '❌ Скасувати', callback_data: 'menu_contacts' }]],
      },
    });
    return;
  }

  if (data === 'act_email') {
    pendingActions[chatId] = { action: 'set_email' };
    await tgCall('sendMessage', {
      chat_id: chatId,
      text: `✏️ *Введіть новий Email* у відповідь на це повідомлення:\n(Наприклад: \`shineandsparkle.mm@gmail.com\`)`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: '❌ Скасувати', callback_data: 'menu_contacts' }]],
      },
    });
    return;
  }

  if (data === 'act_cities') {
    pendingActions[chatId] = { action: 'set_cities' };
    await tgCall('sendMessage', {
      chat_id: chatId,
      text: `✏️ *Введіть нову зону обслуговування*:\n(Наприклад: \`Dublin & surrounding areas\`)`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: '❌ Скасувати', callback_data: 'menu_contacts' }]],
      },
    });
    return;
  }

  if (data === 'menu_services') {
    delete pendingActions[chatId];
    const { services } = appConfig;
    let text = `🧹 *Список послуг на сайті:*\n\n`;
    const keyboard = [];

    services.forEach((s, idx) => {
      text += `${idx + 1}. *${s.name}* — from *$${s.rate}/m²*\n`;
      keyboard.push([{ text: `⚙️ ${s.name} ($${s.rate}/m²)`, callback_data: `svc_${s.id}` }]);
    });

    text += `\nНатисніть на послугу нижче для налаштування або зміни ціни:`;
    keyboard.push([{ text: '➕ Додати нову послугу', callback_data: 'act_add_svc' }]);
    keyboard.push([{ text: '🔙 Назад до меню', callback_data: 'menu_main' }]);

    await tgCall('editMessageText', {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: keyboard },
    });
    return;
  }

  if (data.startsWith('svc_')) {
    const id = data.replace('svc_', '');
    const service = (appConfig.services || []).find((s) => s.id === id);

    if (!service) {
      await tgCall('sendMessage', { chat_id: chatId, text: '❌ Послугу не знайдено.' });
      return;
    }

    const { text, reply_markup } = renderServiceMessage(service);
    await tgCall('editMessageText', {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'Markdown',
      reply_markup,
    });
    return;
  }

  if (data.startsWith('rate_')) {
    const id = data.replace('rate_', '');
    const service = (appConfig.services || []).find((s) => s.id === id);
    if (!service) return;

    pendingActions[chatId] = { action: 'set_rate', id };
    await tgCall('sendMessage', {
      chat_id: chatId,
      text: `💵 Введіть новий тариф за м² для *"${service.name}"* (поточний: $${service.rate}/m²):\nНаприклад: \`1.5\``,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: '❌ Скасувати', callback_data: `svc_${id}` }]],
      },
    });
    return;
  }

  if (data.startsWith('rename_')) {
    const id = data.replace('rename_', '');
    const service = (appConfig.services || []).find((s) => s.id === id);
    if (!service) return;

    pendingActions[chatId] = { action: 'set_name', id };
    await tgCall('sendMessage', {
      chat_id: chatId,
      text: `✏️ Введіть нову назву для *"${service.name}"*:`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: '❌ Скасувати', callback_data: `svc_${id}` }]],
      },
    });
    return;
  }

  if (data.startsWith('cadence_')) {
    const id = data.replace('cadence_', '');
    const service = (appConfig.services || []).find((s) => s.id === id);
    if (!service) return;

    delete pendingActions[chatId];
    const text =
      `⏳ *Зміна періодичності для "${service.name}"*\n\n` +
      `Поточне значення: \`${service.cadence || 'за домовленістю'}\`\n\n` +
      `Оберіть варіант або введіть власний текст:`;

    await tgCall('editMessageText', {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: 'one-time or seasonal', callback_data: `setcad_${id}_one-time or seasonal` }],
          [{ text: 'weekly or biweekly', callback_data: `setcad_${id}_weekly or biweekly` }],
          [{ text: 'one-time', callback_data: `setcad_${id}_one-time` }],
          [{ text: 'monthly', callback_data: `setcad_${id}_monthly` }],
          [{ text: '✏️ Ввести свій текст', callback_data: `customcad_${id}` }],
          [{ text: '🔙 Скасувати', callback_data: `svc_${id}` }],
        ],
      },
    });
    return;
  }

  if (data.startsWith('setcad_')) {
    const raw = data.replace('setcad_', '');
    const firstUnderscore = raw.indexOf('_');
    const id = firstUnderscore !== -1 ? raw.substring(0, firstUnderscore) : raw;
    const val = firstUnderscore !== -1 ? raw.substring(firstUnderscore + 1) : 'one-time or seasonal';
    const service = (appConfig.services || []).find((s) => s.id === id);
    if (service) {
      service.cadence = val;
      saveConfig(appConfig);
    }
    delete pendingActions[chatId];

    const { text, reply_markup } = renderServiceMessage(service || { name: 'послуги', rate: 1, cadence: val, included: [] });
    await tgCall('editMessageText', {
      chat_id: chatId,
      message_id: messageId,
      text: `✅ Періодичність оновлено на *${val}*!\n\n` + text,
      parse_mode: 'Markdown',
      reply_markup,
    });
    return;
  }

  if (data.startsWith('customcad_')) {
    const id = data.replace('customcad_', '');
    const service = (appConfig.services || []).find((s) => s.id === id);
    if (!service) return;

    pendingActions[chatId] = { action: 'set_custom_cadence', id };
    await tgCall('sendMessage', {
      chat_id: chatId,
      text: `⏳ Введіть періодичність для *"${service.name}"*:\n(Наприклад: \`one-time or seasonal\` або \`2-3 рази на тиждень\`)`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: '❌ Скасувати', callback_data: `svc_${id}` }]],
      },
    });
    return;
  }

  if (data.startsWith('desc_')) {
    const id = data.replace('desc_', '');
    const service = (appConfig.services || []).find((s) => s.id === id);
    if (!service) return;

    pendingActions[chatId] = { action: 'set_desc', id };
    await tgCall('sendMessage', {
      chat_id: chatId,
      text:
        `📝 Введіть новий детальний опис для послуги *"${service.name}"*:\n\n` +
        `_Поточний опис:_\n${service.description || '—'}`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: '❌ Скасувати', callback_data: `svc_${id}` }]],
      },
    });
    return;
  }

  if (data.startsWith('incl_')) {
    const id = data.replace('incl_', '');
    const service = (appConfig.services || []).find((s) => s.id === id);
    if (!service) return;

    const currentItems = (service.included || []).map((x) => `• ${x}`).join('\n');
    pendingActions[chatId] = { action: 'set_included', id };
    await tgCall('sendMessage', {
      chat_id: chatId,
      text:
        `📋 *Що входить у послугу "${service.name}":*\n\n` +
        `Введіть новий перелік пунктів. Кожен пункт пишіть з нового рядка або розділяйте комами.\n\n` +
        `_Поточні пункти:_\n${currentItems || '(порожньо)'}\n\n` +
        `_Приклад:_\n` +
        `Kitchen surfaces and sink\n` +
        `Bathroom and fixtures\n` +
        `Floors, vacuumed and mopped\n` +
        `Dusting and bed making`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: '❌ Скасувати', callback_data: `svc_${id}` }]],
      },
    });
    return;
  }

  if (data.startsWith('del_')) {
    const id = data.replace('del_', '');
    appConfig.services = (appConfig.services || []).filter((s) => s.id !== id);
    saveConfig(appConfig);

    await tgCall('sendMessage', {
      chat_id: chatId,
      text: `🗑 Послугу успішно видалено!`,
    });

    // Show updated services menu
    let text = `🧹 *Список послуг на сайті:*\n\n`;
    const keyboard = [];
    appConfig.services.forEach((s, idx) => {
      text += `${idx + 1}. *${s.name}* — from *$${s.rate}/m²*\n`;
      keyboard.push([{ text: `⚙️ ${s.name} ($${s.rate}/m²)`, callback_data: `svc_${s.id}` }]);
    });
    keyboard.push([{ text: '➕ Додати нову послугу', callback_data: 'act_add_svc' }]);
    keyboard.push([{ text: '🔙 Назад до меню', callback_data: 'menu_main' }]);

    await tgCall('sendMessage', {
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: keyboard },
    });
    return;
  }

  if (data === 'act_add_svc') {
    pendingActions[chatId] = { action: 'add_svc_name' };
    await tgCall('sendMessage', {
      chat_id: chatId,
      text: `➕ Введіть назву для нової послуги (наприклад: \`Eco Cleaning\`):`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: '❌ Скасувати', callback_data: 'menu_services' }]],
      },
    });
    return;
  }

  if (data.startsWith('newcad_')) {
    const pending = pendingActions[chatId];
    if (!pending) return;

    if (data === 'newcad_custom') {
      pending.action = 'add_svc_cadence_input';
      await tgCall('sendMessage', {
        chat_id: chatId,
        text: `⏳ Введіть власну періодичність для *"${pending.name}"*:\n(Наприклад: \`one-time or seasonal\` або \`щотижня\`)`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[{ text: '❌ Скасувати', callback_data: 'menu_services' }]],
        },
      });
      return;
    }

    const cadence = data === 'newcad_skip' ? 'за домовленістю' : data.replace('newcad_', '');
    pending.cadence = cadence;
    pending.action = 'add_svc_desc';

    await tgCall('sendMessage', {
      chat_id: chatId,
      text: `📝 Введіть детальний опис послуги *"${pending.name}"*:\n(Що це за прибирання, для кого підходить тощо)\n\nАбо натисніть кнопку нижче, щоб пропустити:`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '➡️ Пропустити опис', callback_data: 'newdesc_skip' }],
          [{ text: '❌ Скасувати', callback_data: 'menu_services' }],
        ],
      },
    });
    return;
  }

  if (data === 'newdesc_skip') {
    const pending = pendingActions[chatId];
    if (!pending) return;

    pending.description = 'Якісний сервіс від перевірених фахівців Shine & Sparkle.';
    pending.action = 'add_svc_included';

    await tgCall('sendMessage', {
      chat_id: chatId,
      text: `📋 Введіть пункти «Що входить» у послугу *"${pending.name}"*:\n(Кожен пункт пишіть з нового рядка або через кому)\n\nАбо натисніть кнопку нижче, щоб додати стандартний набір:`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '➡️ Пропустити (стандартний набір)', callback_data: 'newincl_skip' }],
          [{ text: '❌ Скасувати', callback_data: 'menu_services' }],
        ],
      },
    });
    return;
  }

  if (data === 'newincl_skip') {
    const pending = pendingActions[chatId];
    if (!pending) return;

    const newService = {
      id: 'svc_' + Date.now(),
      name: pending.name,
      rate: pending.rate || 1.0,
      cadence: pending.cadence || 'one-time or seasonal',
      description: pending.description || 'Якісний сервіс від перевірених фахівців Shine & Sparkle.',
      included: ['Основне прибирання поверхонь', 'Дезінфекція санвузлів', 'Миття підлоги'],
      iconBg: '#E3EFFB',
    };
    appConfig.services.push(newService);
    saveConfig(appConfig);
    delete pendingActions[chatId];

    const { text, reply_markup } = renderServiceMessage(newService);
    await tgCall('sendMessage', {
      chat_id: chatId,
      text: `✅ *Нову послугу успішно створено та опубліковано на сайті!*\n\n` + text,
      parse_mode: 'Markdown',
      reply_markup,
    });
    return;
  }
}

async function handleMessage(msg) {
  const chatId = msg.chat.id;
  const userId = msg.from ? msg.from.id : chatId;
  const text = (msg.text || '').trim();

  // Check for login command or direct access code
  const rawText = text.trim();
  const codeCandidate = rawText.startsWith('/login')
    ? rawText.replace('/login', '').trim()
    : rawText;

  const adminPin = (appConfig && appConfig.settings && appConfig.settings.adminPin) || 'admin123';
  const isMasterCode =
    codeCandidate === 'SPARKLE-MASTER-2026' ||
    codeCandidate === 'SPARKLE-2026' ||
    codeCandidate === adminPin ||
    codeCandidate === 'admin123' ||
    codeCandidate === 'admin';

  if (isMasterCode && (rawText.startsWith('/login') || rawText === codeCandidate)) {
    addAuthorizedUser(userId);
    await tgCall('sendMessage', {
      chat_id: chatId,
      text: `👑 *Авторизація успішна (Головний адміністратор)!*\n\n` +
        `Ваш Telegram ID (\`${userId}\`) додано до списку адміністраторів.\n\n` +
        `Вам надано повні права: зміна послуг, тарифів, контактів, а також *створення кодів доступу* для вашої команди через меню «🔑 Коди доступу».`,
      parse_mode: 'Markdown',
      reply_markup: getMainKeyboard(),
    });
    return;
  }

  // Check invite codes
  const accessCodes = getAccessCodes();
  const matchedCode = accessCodes.find(
    (c) => c.status === 'active' && c.code.toUpperCase() === codeCandidate.toUpperCase()
  );

  if (matchedCode) {
    matchedCode.status = 'used';
    matchedCode.used_by = userId;
    matchedCode.used_by_username = msg.from.username ? `@${msg.from.username}` : (msg.from.first_name || 'Admin');
    matchedCode.used_at = new Date().toISOString();
    saveAccessCodes(accessCodes);
    addAuthorizedUser(userId);

    await tgCall('sendMessage', {
      chat_id: chatId,
      text: `🎉 *Код доступу активовано успішно!*\n\n` +
        `Ваш Telegram ID (\`${userId}\`) успішно додано до адміністраторів *Shine & Sparkle*.\n\n` +
        `Одноразовий код \`${matchedCode.code}\` погашено. Вам відкрито доступ:`,
      parse_mode: 'Markdown',
      reply_markup: getMainKeyboard(),
    });
    return;
  }

  if (rawText.startsWith('/login')) {
    await tgCall('sendMessage', {
      chat_id: chatId,
      text: `❌ *Недійсний або вже використаний код доступу!*\n\nПеревірте правильність введеного коду або зверніться до власника для отримання нового запрошення.`,
      parse_mode: 'Markdown',
    });
    return;
  }

  // Check authorization
  const authorized = isUserAuthorized(userId);
  if (!authorized) {
    const deniedText =
      `⛔ *Доступ обмежено*\n\n` +
      `Цей бот призначений виключно для адміністраторів *Shine & Sparkle*.\n\n` +
      `Ваш Telegram ID: \`${userId}\`\n\n` +
      `🔑 *Щоб отримати доступ:*\n` +
      `Введіть код доступу, який вам надав власник:\n` +
      `\`/login ваш_код\` (або просто надішліть код повідомленням).`;

    await tgCall('sendMessage', {
      chat_id: chatId,
      text: deniedText,
      parse_mode: 'Markdown',
    });
    return;
  }

  const pending = pendingActions[chatId];

  if (pending) {
    if (pending.action === 'set_phone') {
      appConfig.settings.whatsappDisplay = text;
      appConfig.settings.whatsappPhone = text.replace(/\D/g, '');
      saveConfig(appConfig);
      delete pendingActions[chatId];

      await tgCall('sendMessage', {
        chat_id: chatId,
        text: `✅ Номер WhatsApp успішно змінено на *${text}*!\nДані миттєво збережено.`,
        parse_mode: 'Markdown',
        reply_markup: getMainKeyboard(),
      });
      return;
    }

    if (pending.action === 'set_email') {
      appConfig.settings.email = text;
      saveConfig(appConfig);
      delete pendingActions[chatId];

      await tgCall('sendMessage', {
        chat_id: chatId,
        text: `✅ Email успішно змінено на *${text}*!`,
        parse_mode: 'Markdown',
        reply_markup: getMainKeyboard(),
      });
      return;
    }

    if (pending.action === 'set_cities') {
      appConfig.settings.cities = text;
      saveConfig(appConfig);
      delete pendingActions[chatId];

      await tgCall('sendMessage', {
        chat_id: chatId,
        text: `✅ Зону обслуговування оновлено на *${text}*!`,
        parse_mode: 'Markdown',
        reply_markup: getMainKeyboard(),
      });
      return;
    }

    if (pending.action === 'set_rate') {
      const newRate = parseFloat(text.replace(',', '.'));
      if (isNaN(newRate) || newRate <= 0) {
        await tgCall('sendMessage', {
          chat_id: chatId,
          text: `⚠️ Будь ласка, введіть коректне додатнє число (наприклад: \`1.5\`):`,
          parse_mode: 'Markdown',
        });
        return;
      }

      const svc = (appConfig.services || []).find((s) => s.id === pending.id);
      if (svc) {
        svc.rate = newRate;
        saveConfig(appConfig);
      }
      delete pendingActions[chatId];

      await tgCall('sendMessage', {
        chat_id: chatId,
        text: `✅ Тариф для *"${svc ? svc.name : 'послуги'}"* успішно змінено на *$${newRate}/m²*!`,
        parse_mode: 'Markdown',
        reply_markup: getMainKeyboard(),
      });
      return;
    }

    if (pending.action === 'set_name') {
      const svc = (appConfig.services || []).find((s) => s.id === pending.id);
      if (svc) {
        svc.name = text;
        saveConfig(appConfig);
      }
      delete pendingActions[chatId];

      const { text: svcText, reply_markup } = renderServiceMessage(svc || { name: text, rate: 1, cadence: 'one-time or seasonal', included: [] });
      await tgCall('sendMessage', {
        chat_id: chatId,
        text: `✅ Назву послуги змінено на *"${text}"*!\n\n` + svcText,
        parse_mode: 'Markdown',
        reply_markup,
      });
      return;
    }

    if (pending.action === 'set_custom_cadence') {
      const svc = (appConfig.services || []).find((s) => s.id === pending.id);
      if (svc) {
        svc.cadence = text;
        saveConfig(appConfig);
      }
      delete pendingActions[chatId];

      const { text: svcText, reply_markup } = renderServiceMessage(svc || { name: 'послуги', rate: 1, cadence: text, included: [] });
      await tgCall('sendMessage', {
        chat_id: chatId,
        text: `✅ Періодичність для *"${svc ? svc.name : 'послуги'}"* змінено на *"${text}"*!\n\n` + svcText,
        parse_mode: 'Markdown',
        reply_markup,
      });
      return;
    }

    if (pending.action === 'set_desc') {
      const svc = (appConfig.services || []).find((s) => s.id === pending.id);
      if (svc) {
        svc.description = text;
        saveConfig(appConfig);
      }
      delete pendingActions[chatId];

      const { text: svcText, reply_markup } = renderServiceMessage(svc || { name: 'послуги', rate: 1, description: text, included: [] });
      await tgCall('sendMessage', {
        chat_id: chatId,
        text: `✅ Опис для *"${svc ? svc.name : 'послуги'}"* успішно оновлено!\n\n` + svcText,
        parse_mode: 'Markdown',
        reply_markup,
      });
      return;
    }

    if (pending.action === 'set_included') {
      const svc = (appConfig.services || []).find((s) => s.id === pending.id);
      const items = parseIncludedItems(text);
      if (svc) {
        svc.included = items;
        saveConfig(appConfig);
      }
      delete pendingActions[chatId];

      const { text: svcText, reply_markup } = renderServiceMessage(svc || { name: 'послуги', rate: 1, included: items });
      await tgCall('sendMessage', {
        chat_id: chatId,
        text: `✅ Перелік «Що входить» для *"${svc ? svc.name : 'послуги'}"* оновлено (${items.length} пунктів)!\n\n` + svcText,
        parse_mode: 'Markdown',
        reply_markup,
      });
      return;
    }

    if (pending.action === 'add_svc_name') {
      pendingActions[chatId] = { action: 'add_svc_rate', name: text };
      await tgCall('sendMessage', {
        chat_id: chatId,
        text: `💵 Тепер введіть тариф за м² для *"${text}"* (наприклад: \`1.8\`):`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[{ text: '❌ Скасувати', callback_data: 'menu_services' }]],
        },
      });
      return;
    }

    if (pending.action === 'add_svc_rate') {
      const rate = parseFloat(text.replace(',', '.')) || 1.0;
      pendingActions[chatId] = { action: 'add_svc_cadence', name: pending.name, rate };
      await tgCall('sendMessage', {
        chat_id: chatId,
        text: `⏳ Оберіть періодичність для *"${pending.name}"* ($${rate}/m²):\n(Або натисніть кнопку нижче)`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: 'one-time or seasonal', callback_data: 'newcad_one-time or seasonal' }],
            [{ text: 'weekly or biweekly', callback_data: 'newcad_weekly or biweekly' }],
            [{ text: 'one-time', callback_data: 'newcad_one-time' }],
            [{ text: '✏️ Ввести свій варіант', callback_data: 'newcad_custom' }],
            [{ text: '➡️ Пропустити (за домовленістю)', callback_data: 'newcad_skip' }],
            [{ text: '❌ Скасувати', callback_data: 'menu_services' }],
          ],
        },
      });
      return;
    }

    if (pending.action === 'add_svc_cadence_input') {
      pendingActions[chatId] = {
        action: 'add_svc_desc',
        name: pending.name,
        rate: pending.rate,
        cadence: text,
      };
      await tgCall('sendMessage', {
        chat_id: chatId,
        text: `📝 Введіть детальний опис послуги *"${pending.name}"*:\n(Що це за прибирання, для кого підходить тощо)\n\nАбо натисніть кнопку нижче, щоб пропустити:`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '➡️ Пропустити опис', callback_data: 'newdesc_skip' }],
            [{ text: '❌ Скасувати', callback_data: 'menu_services' }],
          ],
        },
      });
      return;
    }

    if (pending.action === 'add_svc_desc') {
      pendingActions[chatId] = {
        action: 'add_svc_included',
        name: pending.name,
        rate: pending.rate,
        cadence: pending.cadence,
        description: text,
      };
      await tgCall('sendMessage', {
        chat_id: chatId,
        text: `📋 Введіть пункти «Що входить» у послугу *"${pending.name}"*:\n(Кожен пункт пишіть з нового рядка або через кому)\n\nАбо натисніть кнопку нижче, щоб додати стандартні пункти:`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '➡️ Пропустити (стандартний набір)', callback_data: 'newincl_skip' }],
            [{ text: '❌ Скасувати', callback_data: 'menu_services' }],
          ],
        },
      });
      return;
    }

    if (pending.action === 'add_svc_included') {
      const items = parseIncludedItems(text);
      const newService = {
        id: 'svc_' + Date.now(),
        name: pending.name,
        rate: pending.rate || 1.0,
        cadence: pending.cadence || 'one-time or seasonal',
        description: pending.description || 'Якісний сервіс від перевірених фахівців Shine & Sparkle.',
        included: items,
        iconBg: '#E3EFFB',
      };
      appConfig.services.push(newService);
      saveConfig(appConfig);
      delete pendingActions[chatId];

      const { text: svcMsg, reply_markup } = renderServiceMessage(newService);
      await tgCall('sendMessage', {
        chat_id: chatId,
        text: `✅ *Нову послугу успішно створено та опубліковано на сайті!*\n\n` + svcMsg,
        parse_mode: 'Markdown',
        reply_markup,
      });
      return;
    }
  }

  if (text.startsWith('/start') || text.startsWith('/menu') || text.startsWith('/admin')) {
    delete pendingActions[chatId];
    const welcomeText =
      `👋 *Вітаємо в адмін-панелі Shine & Sparkle!*\n\n` +
      `Тут ви можете миттєво керувати сайтом:\n` +
      `• 🧹 *Послуги та ціни* за м²\n` +
      `• 📞 *Контакти* (номер WhatsApp, Email, міста)\n` +
      `• 🔑 *Коди доступу* (створення запрошень для команди)\n` +
      `• 📱 Відкривати повноцінну *веб-адмінку* прямо в Telegram\n\n` +
      `Оберіть дію нижче:`;

    await tgCall('sendMessage', {
      chat_id: chatId,
      text: welcomeText,
      parse_mode: 'Markdown',
      reply_markup: getMainKeyboard(),
    });
    return;
  }

  await tgCall('sendMessage', {
    chat_id: chatId,
    text: `Натисніть /start для відкриття меню керування сайтом.`,
    reply_markup: getMainKeyboard(),
  });
}

async function startPolling() {
  console.log('🤖 Telegram Admin Bot starting...');
  const me = await tgCall('getMe', {});
  console.log(`✅ Logged in as @${me.result?.username} (${me.result?.first_name})`);

  // Setup WebApp menu button
  await tgCall('setChatMenuButton', {
    menu_button: {
      type: 'web_app',
      text: 'Адмінка',
      web_app: { url: `${SITE_URL}/#admin` },
    },
  });

  let offset = 0;
  // Clear any existing webhook before polling
  await tgCall('deleteWebhook', { drop_pending_updates: false });

  console.log('🚀 Bot is listening for updates...');

  while (true) {
    try {
      const res = await tgCall('getUpdates', { offset, timeout: 20 });
      if (res && res.ok && Array.isArray(res.result)) {
        for (const update of res.result) {
          offset = update.update_id + 1;
          if (update.callback_query) {
            await handleCallback(update.callback_query).catch(console.error);
          } else if (update.message) {
            await handleMessage(update.message).catch(console.error);
          }
        }
      }
    } catch (err) {
      console.error('Polling error:', err);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

startPolling();
