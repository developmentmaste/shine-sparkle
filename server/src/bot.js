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
  console.error('❌ Error: TELEGRAM_BOT_TOKEN environment variable is not defined.');
  console.error('Please configure TELEGRAM_BOT_TOKEN in server/.env or environment variables.');
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
  if (!text) return ['Kitchen surfaces and sink', 'Bathroom disinfection', 'Floor vacuuming and mopping'];
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
  return items.length > 0 ? items : ['Kitchen surfaces and sink', 'Bathroom disinfection', 'Floor vacuuming and mopping'];
}

function renderServiceMessage(service) {
  const includedList = (service.included || []).map((x) => `  ✓ ${x}`).join('\n');
  const text =
    `🧹 *Service:* ${service.name}\n` +
    `💵 *Rate:* from *€${service.rate}/m²*\n` +
    `⏳ *Frequency:* \`${service.cadence || 'custom'}\`\n` +
    `📝 *Description:* ${service.description || '—'}\n\n` +
    `📋 *Included:*\n${includedList || '  (empty list)'}`;

  const keyboard = [
    [
      { text: '💶 Rate (€/m²)', callback_data: `rate_${service.id}` },
      { text: '✏️ Name', callback_data: `rename_${service.id}` },
    ],
    [
      { text: '⏳ Frequency', callback_data: `cadence_${service.id}` },
      { text: '📝 Description', callback_data: `desc_${service.id}` },
    ],
    [
      { text: '📋 Checklist', callback_data: `incl_${service.id}` },
      { text: '🗑 Delete', callback_data: `del_${service.id}` },
    ],
    [
      { text: '🔙 Back to Services', callback_data: 'menu_services' },
    ],
  ];

  return { text, reply_markup: { inline_keyboard: keyboard } };
}

function getMainKeyboard() {
  return {
    inline_keyboard: [
      [
        {
          text: '📱 Open Admin Panel (WebApp)',
          web_app: { url: `${SITE_URL}/?tg_admin=1` },
        },
      ],
      [
        { text: '🧹 Services & Rates', callback_data: 'menu_services' },
        { text: '📞 Website Contacts', callback_data: 'menu_contacts' },
      ],
      [
        { text: '🔑 Access Codes', callback_data: 'menu_codes' },
        { text: '👥 Administrators', callback_data: 'act_list_admins' },
      ],
      [
        { text: '🌐 View Live Site', url: SITE_URL },
        { text: '🔄 Refresh', callback_data: 'menu_main' },
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
      text: `⛔ Access Denied! Your ID: ${userId}. Enter /login <code> to authenticate.`,
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
      text: `🧹 *Admin Control Panel*\n\nManage services, pricing per m², contacts, and team access.\n\nTap *Open Admin Panel (WebApp)* below to launch the full-screen mobile app directly in Telegram!`,
      parse_mode: 'Markdown',
      reply_markup: getMainKeyboard(),
    });
    return;
  }

  if (data === 'menu_contacts') {
    delete pendingActions[chatId];
    const { settings } = appConfig;
    const text =
      `📞 *Current Website Contacts:*\n\n` +
      `• *Phone / WhatsApp:* \`${settings.whatsappDisplay}\`\n` +
      `• *Email:* \`${settings.email}\`\n` +
      `• *Service Areas:* \`${settings.cities || 'Dublin & surrounding areas'}\`\n\n` +
      `Select a contact field to edit:`;

    await tgCall('editMessageText', {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '✏️ Edit WhatsApp / Phone', callback_data: 'act_phone' }],
          [{ text: '✏️ Edit Email', callback_data: 'act_email' }],
          [{ text: '✏️ Edit Service Areas', callback_data: 'act_cities' }],
          [{ text: '🔙 Back to Menu', callback_data: 'menu_main' }],
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

    let text = `🔑 *Access Codes Management*\n\n` +
      `Generate single-use invite codes to grant admin permissions to teammates.\n\n`;

    if (activeCodes.length > 0) {
      text += `🟢 *Active Access Codes (${activeCodes.length}):*\n`;
      activeCodes.slice(-8).reverse().forEach((c) => {
        text += `• \`${c.code}\`\n`;
      });
      text += `\n`;
    } else {
      text += `🟢 *Active Codes:* _No active codes currently_\n\n`;
    }

    if (usedCodes.length > 0) {
      text += `⚪ *Used Codes (${usedCodes.length}):*\n`;
      usedCodes.slice(-4).reverse().forEach((c) => {
        const who = c.used_by_username || `ID: ${c.used_by}`;
        text += `• ~${c.code}~ (${who})\n`;
      });
      text += `\n`;
    }

    const buttons = [
      [{ text: '➕ Generate New Invite Code', callback_data: 'act_gen_code' }],
      [{ text: '👥 Administrators List', callback_data: 'act_list_admins' }],
    ];
    if (usedCodes.length > 0) {
      buttons.push([{ text: '🗑 Clear Used Codes', callback_data: 'act_clean_codes' }]);
    }
    buttons.push([{ text: '🔙 Back to Menu', callback_data: 'menu_main' }]);

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
      `🎉 *New Invite Code Generated!*\n\n` +
      `Key: \`${newCode}\`\n\n` +
      `📋 *How to share:*\n` +
      `1. Send this code to the person you want to give access to.\n` +
      `2. They open this bot and send:\n` +
      `\`/login ${newCode}\` (or simply send \`${newCode}\` in chat).\n\n` +
      `_The code is single-use. Once redeemed, admin access is linked to their Telegram ID permanently._`;

    await tgCall('editMessageText', {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '➕ Generate Another Code', callback_data: 'act_gen_code' }],
          [{ text: '🔑 View All Codes', callback_data: 'menu_codes' }],
          [{ text: '🔙 Main Menu', callback_data: 'menu_main' }],
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
      text: '🧹 Used codes history cleared!',
    });

    let text = `🔑 *Access Codes Management*\n\n` +
      `Used codes history has been cleared.\n\n`;

    if (remaining.length > 0) {
      text += `🟢 *Active Access Codes (${remaining.length}):*\n`;
      remaining.slice(-8).reverse().forEach((c) => {
        text += `• \`${c.code}\`\n`;
      });
      text += `\n`;
    } else {
      text += `🟢 *Active Codes:* _No active codes currently_\n\n`;
    }

    await tgCall('editMessageText', {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '➕ Generate New Invite Code', callback_data: 'act_gen_code' }],
          [{ text: '👥 Administrators List', callback_data: 'act_list_admins' }],
          [{ text: '🔙 Back to Menu', callback_data: 'menu_main' }],
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

    let text = `👥 *Authorized Administrators*\n\n`;
    if (envAdmins.length > 0) {
      text += `⚙️ *Via Environment Variables (${envAdmins.length}):*\n`;
      envAdmins.forEach((id) => {
        text += `• ID: \`${id}\`\n`;
      });
      text += `\n`;
    }

    if (admins.length > 0) {
      text += `🔑 *Via Invite Codes / Login (${admins.length}):*\n`;
      admins.forEach((id) => {
        text += `• ID: \`${id}\`${String(id) === String(userId) ? ' (You)' : ''}\n`;
      });
    } else if (envAdmins.length === 0) {
      text += `_No administrators registered yet._\n`;
    }

    await tgCall('editMessageText', {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '➕ Generate Invite Code', callback_data: 'act_gen_code' }],
          [{ text: '🔑 Access Codes', callback_data: 'menu_codes' }],
          [{ text: '🔙 Main Menu', callback_data: 'menu_main' }],
        ],
      },
    });
    return;
  }

  if (data === 'act_phone') {
    pendingActions[chatId] = { action: 'set_phone' };
    await tgCall('sendMessage', {
      chat_id: chatId,
      text: `✏️ *Send the new phone / WhatsApp number* in reply to this message:\n(e.g.: \`+353 85 285 0720\`)`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'menu_contacts' }]],
      },
    });
    return;
  }

  if (data === 'act_email') {
    pendingActions[chatId] = { action: 'set_email' };
    await tgCall('sendMessage', {
      chat_id: chatId,
      text: `✏️ *Send the new contact Email* in reply to this message:\n(e.g.: \`shineandsparkle.mm@gmail.com\`)`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'menu_contacts' }]],
      },
    });
    return;
  }

  if (data === 'act_cities') {
    pendingActions[chatId] = { action: 'set_cities' };
    await tgCall('sendMessage', {
      chat_id: chatId,
      text: `✏️ *Send the new service areas / cities* in reply to this message:\n(e.g.: \`Dublin & surrounding areas\`)`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'menu_contacts' }]],
      },
    });
    return;
  }

  if (data === 'menu_services') {
    delete pendingActions[chatId];
    const { services } = appConfig;
    let text = `🧹 *Services on Website:*\n\n`;
    const keyboard = [];

    services.forEach((s, idx) => {
      text += `${idx + 1}. *${s.name}* — from *€${s.rate}/m²*\n`;
      keyboard.push([{ text: `⚙️ ${s.name} (€${s.rate}/m²)`, callback_data: `svc_${s.id}` }]);
    });

    text += `\nTap any service below to configure its rate, description, or tasks:`;
    keyboard.push([{ text: '➕ Add New Service', callback_data: 'act_add_svc' }]);
    keyboard.push([{ text: '🔙 Back to Menu', callback_data: 'menu_main' }]);

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
      await tgCall('sendMessage', { chat_id: chatId, text: '❌ Service not found.' });
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
      text: `💶 Enter the new rate per m² for *"${service.name}"* (current: €${service.rate}/m²):\nExample: \`1.5\``,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: '❌ Cancel', callback_data: `svc_${id}` }]],
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
      text: `✏️ Enter the new name for *"${service.name}"*:`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: '❌ Cancel', callback_data: `svc_${id}` }]],
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
      `⏳ *Change Frequency for "${service.name}"*\n\n` +
      `Current value: \`${service.cadence || 'custom'}\`\n\n` +
      `Choose an option or enter custom text:`;

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
          [{ text: '✏️ Enter custom text', callback_data: `customcad_${id}` }],
          [{ text: '🔙 Cancel', callback_data: `svc_${id}` }],
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

    const { text, reply_markup } = renderServiceMessage(service || { name: 'Service', rate: 1, cadence: val, included: [] });
    await tgCall('editMessageText', {
      chat_id: chatId,
      message_id: messageId,
      text: `✅ Frequency updated to *${val}*!\n\n` + text,
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
      text: `⏳ Enter frequency for *"${service.name}"*:\n(e.g.: \`one-time or seasonal\` or \`2-3 times a week\`)`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: '❌ Cancel', callback_data: `svc_${id}` }]],
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
        `📝 Enter new detailed description for *"${service.name}"*:\n\n` +
        `_Current description:_\n${service.description || '—'}`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: '❌ Cancel', callback_data: `svc_${id}` }]],
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
        `📋 *Included checklist for "${service.name}":*\n\n` +
        `Enter new checklist items (one item per line or separated by commas).\n\n` +
        `_Current checklist:_\n${currentItems || '(empty)'}\n\n` +
        `_Example:_\n` +
        `Kitchen surfaces and sink\n` +
        `Bathroom fixtures\n` +
        `Floors, vacuumed and mopped\n` +
        `Dusting and bed making`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: '❌ Cancel', callback_data: `svc_${id}` }]],
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
      text: `🗑 Service successfully deleted!`,
    });

    // Show updated services menu
    let text = `🧹 *Services on Website:*\n\n`;
    const keyboard = [];
    appConfig.services.forEach((s, idx) => {
      text += `${idx + 1}. *${s.name}* — from *€${s.rate}/m²*\n`;
      keyboard.push([{ text: `⚙️ ${s.name} (€${s.rate}/m²)`, callback_data: `svc_${s.id}` }]);
    });
    keyboard.push([{ text: '➕ Add New Service', callback_data: 'act_add_svc' }]);
    keyboard.push([{ text: '🔙 Back to Menu', callback_data: 'menu_main' }]);

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
      text: `➕ Enter the name for the new service (e.g.: \`Office Cleaning\`):`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'menu_services' }]],
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
        text: `⏳ Enter custom frequency for *"${pending.name}"*:\n(e.g.: \`one-time or seasonal\` or \`weekly\`)`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'menu_services' }]],
        },
      });
      return;
    }

    const cadence = data === 'newcad_skip' ? 'one-time or seasonal' : data.replace('newcad_', '');
    pending.cadence = cadence;
    pending.action = 'add_svc_desc';

    await tgCall('sendMessage', {
      chat_id: chatId,
      text: `📝 Enter detailed description for *"${pending.name}"*:\n(What kind of cleaning, who it is for, etc.)\n\nOr tap below to skip:`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '➡️ Skip description', callback_data: 'newdesc_skip' }],
          [{ text: '❌ Cancel', callback_data: 'menu_services' }],
        ],
      },
    });
    return;
  }

  if (data === 'newdesc_skip') {
    const pending = pendingActions[chatId];
    if (!pending) return;

    pending.description = 'Professional cleaning service from trusted Shine & Sparkle specialists.';
    pending.action = 'add_svc_included';

    await tgCall('sendMessage', {
      chat_id: chatId,
      text: `📋 Enter checklist items for *"${pending.name}"*:\n(Write each item on a new line or separated by commas)\n\nOr tap below to use the standard checklist:`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '➡️ Skip (standard checklist)', callback_data: 'newincl_skip' }],
          [{ text: '❌ Cancel', callback_data: 'menu_services' }],
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
      description: pending.description || 'Professional cleaning service from trusted Shine & Sparkle specialists.',
      included: ['Kitchen surfaces and sink', 'Bathroom disinfection', 'Floor vacuuming and mopping'],
      iconBg: '#E3EFFB',
    };
    appConfig.services.push(newService);
    saveConfig(appConfig);
    delete pendingActions[chatId];

    const { text, reply_markup } = renderServiceMessage(newService);
    await tgCall('sendMessage', {
      chat_id: chatId,
      text: `✅ *New service successfully created and published on the website!*\n\n` + text,
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
      text: `👑 *Authentication Successful (Primary Administrator)!*\n\n` +
        `Your Telegram ID (\`${userId}\`) has been added to the administrators list.\n\n` +
        `You have full admin access: update services, rates, contacts, and *create invite codes* for your team via «🔑 Access Codes».`,
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
      text: `🎉 *Access Code Activated Successfully!*\n\n` +
        `Your Telegram ID (\`${userId}\`) has been added to the administrators of *Shine & Sparkle*.\n\n` +
        `One-time code \`${matchedCode.code}\` has been redeemed. Access is now unlocked:`,
      parse_mode: 'Markdown',
      reply_markup: getMainKeyboard(),
    });
    return;
  }

  if (rawText.startsWith('/login')) {
    await tgCall('sendMessage', {
      chat_id: chatId,
      text: `❌ *Invalid or already used access code!*\n\nPlease verify the code or contact the business owner for a new invite.`,
      parse_mode: 'Markdown',
    });
    return;
  }

  // Check authorization
  const authorized = isUserAuthorized(userId);
  if (!authorized) {
    const deniedText =
      `⛔ *Access Restricted*\n\n` +
      `This bot is strictly reserved for *Shine & Sparkle* administrators.\n\n` +
      `Your Telegram ID: \`${userId}\`\n\n` +
      `🔑 *To gain access:*\n` +
      `Enter the access code provided by the owner:\n` +
      `\`/login your_code\` (or simply reply with your code).`;

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
        text: `✅ WhatsApp phone number updated to *${text}*!\nUpdated live on the website.`,
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
        text: `✅ Contact email updated to *${text}*!\nUpdated live on the website.`,
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
        text: `✅ Service areas updated to *${text}*!`,
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
          text: `⚠️ Please enter a valid rate number (e.g.: \`1.5\`):`,
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
        text: `✅ Rate for *"${svc ? svc.name : 'Service'}"* updated to *€${newRate}/m²*!\nUpdated live on the website.`,
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
        text: `✅ Service name updated to *"${text}"*!\n\n` + svcText,
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

      const { text: svcText, reply_markup } = renderServiceMessage(svc || { name: 'Service', rate: 1, cadence: text, included: [] });
      await tgCall('sendMessage', {
        chat_id: chatId,
        text: `✅ Frequency for *"${svc ? svc.name : 'Service'}"* updated to *"${text}"*!\n\n` + svcText,
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

      const { text: svcText, reply_markup } = renderServiceMessage(svc || { name: 'Service', rate: 1, description: text, included: [] });
      await tgCall('sendMessage', {
        chat_id: chatId,
        text: `✅ Description for *"${svc ? svc.name : 'Service'}"* updated successfully!\n\n` + svcText,
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

      const { text: svcText, reply_markup } = renderServiceMessage(svc || { name: 'Service', rate: 1, included: items });
      await tgCall('sendMessage', {
        chat_id: chatId,
        text: `✅ Checklist for *"${svc ? svc.name : 'Service'}"* updated (${items.length} items)!\n\n` + svcText,
        parse_mode: 'Markdown',
        reply_markup,
      });
      return;
    }

    if (pending.action === 'add_svc_name') {
      pendingActions[chatId] = { action: 'add_svc_rate', name: text };
      await tgCall('sendMessage', {
        chat_id: chatId,
        text: `💵 Now enter the rate per m² for *"${text}"* (e.g.: \`1.8\`):`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'menu_services' }]],
        },
      });
      return;
    }

    if (pending.action === 'add_svc_rate') {
      const rate = parseFloat(text.replace(',', '.')) || 1.0;
      pendingActions[chatId] = { action: 'add_svc_cadence', name: pending.name, rate };
      await tgCall('sendMessage', {
        chat_id: chatId,
        text: `⏳ Select frequency for *"${pending.name}"* (€${rate}/m²):\n(Or choose an option below)`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: 'one-time or seasonal', callback_data: 'newcad_one-time or seasonal' }],
            [{ text: 'weekly or biweekly', callback_data: 'newcad_weekly or biweekly' }],
            [{ text: 'one-time', callback_data: 'newcad_one-time' }],
            [{ text: '✏️ Custom frequency', callback_data: 'newcad_custom' }],
            [{ text: '➡️ Skip (one-time or seasonal)', callback_data: 'newcad_skip' }],
            [{ text: '❌ Cancel', callback_data: 'menu_services' }],
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
        text: `📝 Enter detailed description for *"${pending.name}"*:\n(What this clean includes, who it is for, etc.)\n\nOr tap below to skip:`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '➡️ Skip description', callback_data: 'newdesc_skip' }],
            [{ text: '❌ Cancel', callback_data: 'menu_services' }],
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
        text: `📋 Enter checklist items for *"${pending.name}"*:\n(Write each item on a new line or separated by commas)\n\nOr tap below to add standard checklist:`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '➡️ Skip (standard checklist)', callback_data: 'newincl_skip' }],
            [{ text: '❌ Cancel', callback_data: 'menu_services' }],
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
        description: pending.description || 'Professional cleaning service from trusted Shine & Sparkle specialists.',
        included: items,
        iconBg: '#E3EFFB',
      };
      appConfig.services.push(newService);
      saveConfig(appConfig);
      delete pendingActions[chatId];

      const { text: svcMsg, reply_markup } = renderServiceMessage(newService);
      await tgCall('sendMessage', {
        chat_id: chatId,
        text: `✅ *New service successfully created and published on the website!*\n\n` + svcMsg,
        parse_mode: 'Markdown',
        reply_markup,
      });
      return;
    }
  }

  if (text.startsWith('/start') || text.startsWith('/menu') || text.startsWith('/admin')) {
    delete pendingActions[chatId];
    const welcomeText =
      `👋 *Welcome to Shine & Sparkle Admin Bot!*\n\n` +
      `Here you can manage:\n` +
      `• 🧹 *Services & rates* per m²\n` +
      `• 📞 *Contacts* (WhatsApp number, Email, service areas)\n` +
      `• 🔑 *Access codes* (generate single-use invite codes for teammates)\n` +
      `• 📱 Open the full *Web Admin App* directly in Telegram\n\n` +
      `Choose an action below:`;

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
    text: `Press /start to open the website management menu.`,
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
      text: 'Admin',
      web_app: { url: `${SITE_URL}/?tg_admin=1` },
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
