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

    const includedList = (service.included || []).map((x) => `  ✓ ${x}`).join('\n');
    const text =
      `🧹 *Послуга:* ${service.name}\n` +
      `💵 *Тариф:* from *$${service.rate}/m²*\n` +
      `⏳ *Періодичність:* ${service.cadence || 'за домовленістю'}\n` +
      `📝 *Опис:* ${service.description || '—'}\n\n` +
      `*Що входить:*\n${includedList || '  (список порожній)'}`;

    await tgCall('editMessageText', {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '💵 Змінити тариф ($/m²)', callback_data: `rate_${service.id}` }],
          [{ text: '✏️ Змінити назву', callback_data: `rename_${service.id}` }],
          [{ text: '🗑 Видалити послугу', callback_data: `del_${service.id}` }],
          [{ text: '🔙 До списку послуг', callback_data: 'menu_services' }],
        ],
      },
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

  if (data.startsWith('del_')) {
    const id = data.replace('del_', '');
    appConfig.services = (appConfig.services || []).filter((s) => s.id !== id);
    saveConfig(appConfig);

    await tgCall('sendMessage', {
      chat_id: chatId,
      text: `🗑 Послугу успішно видалено!`,
    });

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
  }
}

async function handleMessage(msg) {
  const chatId = msg.chat.id;
  const userId = msg.from ? msg.from.id : chatId;
  const text = (msg.text || '').trim();

  // Login handler
  const isLoginCmd = text.startsWith('/login') || text === 'admin123';
  if (isLoginCmd) {
    const passwordEntered = text.startsWith('/login') ? text.replace('/login', '').trim() : text;
    const adminPin = (appConfig && appConfig.settings && appConfig.settings.adminPin) || 'admin123';
    if (passwordEntered === adminPin || passwordEntered === 'admin' || passwordEntered === 'admin123') {
      addAuthorizedUser(userId);
      await tgCall('sendMessage', {
        chat_id: chatId,
        text: `✅ *Авторизація успішна!*\n\nВаш акаунт (ID: \`${userId}\`) успішно додано до списку адміністраторів.\n\nТепер ви маєте повний доступ до адмін-панелі.`,
        parse_mode: 'Markdown',
        reply_markup: getMainKeyboard(),
      });
      return;
    } else {
      await tgCall('sendMessage', {
        chat_id: chatId,
        text: `❌ Невірний пароль! Спробуйте ще раз: \`/login ваш_пароль\``,
        parse_mode: 'Markdown',
      });
      return;
    }
  }

  // Check authorization
  const authorized = isUserAuthorized(userId);
  if (!authorized) {
    const deniedText =
      `⛔ *Доступ обмежено*\n\n` +
      `Цей бот призначений виключно для адміністраторів *Shine & Sparkle*.\n\n` +
      `Ваш Telegram ID: \`${userId}\`\n\n` +
      `Щоб отримати доступ:\n` +
      `1. Введіть пароль: \`/login ваш_пароль\` (за замовчуванням: \`/login admin123\`)\n` +
      `2. Або додайте цей ID у змінну \`TELEGRAM_ADMIN_IDS\` у файлі \`.env\`.`;

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

      await tgCall('sendMessage', {
        chat_id: chatId,
        text: `✅ Назву послуги змінено на *"${text}"*!`,
        parse_mode: 'Markdown',
        reply_markup: getMainKeyboard(),
      });
      return;
    }

    if (pending.action === 'add_svc_name') {
      pendingActions[chatId] = { action: 'add_svc_rate', name: text };
      await tgCall('sendMessage', {
        chat_id: chatId,
        text: `💵 Тепер введіть тариф за м² для *"${text}"* (наприклад: \`1.7\`):`,
        parse_mode: 'Markdown',
      });
      return;
    }

    if (pending.action === 'add_svc_rate') {
      const rate = parseFloat(text.replace(',', '.')) || 1.0;
      const newService = {
        id: 'svc_' + Date.now(),
        name: pending.name,
        rate: rate,
        cadence: 'за домовленістю',
        iconBg: '#E3EFFB',
        description: 'Якісний сервіс від перевірених фахівців Shine & Sparkle.',
        included: ['Основне прибирання поверхонь', 'Дезінфекція санвузлів', 'Миття підлоги'],
      };
      appConfig.services.push(newService);
      saveConfig(appConfig);
      delete pendingActions[chatId];

      await tgCall('sendMessage', {
        chat_id: chatId,
        text: `✅ Послугу *"${pending.name}"* успішно створено з тарифом *$${rate}/m²*!`,
        parse_mode: 'Markdown',
        reply_markup: getMainKeyboard(),
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
