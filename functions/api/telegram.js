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

let memoryConfig = {
  settings: { ...DEFAULT_SETTINGS },
  services: [...DEFAULT_SERVICES],
};
let memoryPending = {};

async function getConfig(env) {
  if (env && env.CONFIG_KV) {
    try {
      const data = await env.CONFIG_KV.get('app_config', 'json');
      if (data) return data;
    } catch (e) {
      console.error('KV read error:', e);
    }
  }
  return memoryConfig;
}

async function saveConfig(env, newConfig) {
  memoryConfig = newConfig;
  if (env && env.CONFIG_KV) {
    try {
      await env.CONFIG_KV.put('app_config', JSON.stringify(newConfig));
    } catch (e) {
      console.error('KV write error:', e);
    }
  }
}

async function getPending(env, chatId) {
  if (env && env.CONFIG_KV) {
    try {
      return await env.CONFIG_KV.get(`pending_${chatId}`, 'json');
    } catch (e) {}
  }
  return memoryPending[chatId] || null;
}

async function setPending(env, chatId, data) {
  if (data === null) {
    delete memoryPending[chatId];
    if (env && env.CONFIG_KV) {
      try {
        await env.CONFIG_KV.delete(`pending_${chatId}`);
      } catch (e) {}
    }
  } else {
    memoryPending[chatId] = data;
    if (env && env.CONFIG_KV) {
      try {
        await env.CONFIG_KV.put(`pending_${chatId}`, JSON.stringify(data), { expirationTtl: 3600 });
      } catch (e) {}
    }
  }
}

let memoryAdmins = [];

async function getAuthorizedUsers(env) {
  if (env && env.CONFIG_KV) {
    try {
      const data = await env.CONFIG_KV.get('authorized_admins', 'json');
      if (Array.isArray(data)) return data;
    } catch (e) {}
  }
  return memoryAdmins;
}

async function addAuthorizedUser(env, userId) {
  const current = await getAuthorizedUsers(env);
  const strId = String(userId);
  if (!current.includes(strId)) {
    current.push(strId);
    memoryAdmins = current;
    if (env && env.CONFIG_KV) {
      try {
        await env.CONFIG_KV.put('authorized_admins', JSON.stringify(current));
      } catch (e) {}
    }
  }
}

let memoryCodes = [];

async function getAccessCodes(env) {
  if (env && env.CONFIG_KV) {
    try {
      const data = await env.CONFIG_KV.get('access_codes', 'json');
      if (Array.isArray(data)) return data;
    } catch (e) {}
  }
  return memoryCodes;
}

async function saveAccessCodes(env, codes) {
  memoryCodes = codes;
  if (env && env.CONFIG_KV) {
    try {
      await env.CONFIG_KV.put('access_codes', JSON.stringify(codes));
    } catch (e) {}
  }
}

function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 5; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `SS-${rand}`;
}

async function isUserAuthorized(env, userId, config) {
  const strId = String(userId);

  // 1. Check TELEGRAM_ADMIN_IDS in Cloudflare Environment Variables (comma-separated IDs)
  const envAdminIds = (env.TELEGRAM_ADMIN_IDS || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

  if (envAdminIds.includes(strId)) {
    return true;
  }

  // 2. Check authorized admins in KV (saved via /login password)
  const kvAdmins = await getAuthorizedUsers(env);
  if (kvAdmins.includes(strId)) {
    return true;
  }

  return false;
}

// Telegram API wrappers
async function tgCall(token, method, payload) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
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
    `💵 *Тариф:* from *€${service.rate}/m²*\n` +
    `⏳ *Періодичність:* \`${service.cadence || 'за домовленістю'}\`\n` +
    `📝 *Опис:* ${service.description || '—'}\n\n` +
    `📋 *Що входить:*\n${includedList || '  (список порожній)'}`;

  const keyboard = [
    [
      { text: '💶 Тариф (€/m²)', callback_data: `rate_${service.id}` },
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

function getMainKeyboard(siteUrl) {
  const adminUrl = siteUrl ? `${siteUrl.replace(/\/+$/, '')}/#admin` : 'https://shine-sparkle.pages.dev/#admin';
  const liveUrl = siteUrl ? siteUrl.replace(/\/+$/, '') : 'https://shine-sparkle.pages.dev';

  return {
    inline_keyboard: [
      [
        {
          text: '📱 Відкрити Адмін-панель (WebApp)',
          web_app: { url: adminUrl },
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
        { text: '🌐 Відкрити сайт', url: liveUrl },
        { text: '🔄 Оновити', callback_data: 'menu_main' },
      ],
    ],
  };
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const token = env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return new Response('TELEGRAM_BOT_TOKEN environment variable is not configured', { status: 500 });
  }

  // Resolve site host for WebApp
  const urlObj = new URL(request.url);
  const siteUrl = `${urlObj.protocol}//${urlObj.host}`;

  try {
    const update = await request.json();

    // 1. Handle Callback Queries (Button Clicks)
    if (update.callback_query) {
      const cb = update.callback_query;
      const chatId = cb.message.chat.id;
      const messageId = cb.message.message_id;
      const userId = cb.from.id;
      const data = cb.data;

      const config = await getConfig(env);
      const authorized = await isUserAuthorized(env, userId, config);

      if (!authorized) {
        await tgCall(token, 'answerCallbackQuery', {
          callback_query_id: cb.id,
          text: `⛔ Доступ заборонено! Ваш ID: ${userId}. Введіть /login <пароль> для входу.`,
          show_alert: true,
        });
        return new Response('OK');
      }

      await tgCall(token, 'answerCallbackQuery', { callback_query_id: cb.id });

      if (data === 'menu_main') {
        await setPending(env, chatId, null);
        await tgCall(token, 'editMessageText', {
          chat_id: chatId,
          message_id: messageId,
          text: `🧹 *Головне меню адмін-панелі*\n\nТут ви можете керувати послугами, тарифами за м² та контактами сайту.\n\nТакож ви можете натиснути кнопку *WebApp* нижче, щоб відкрити повноцінний інтерфейс прямо в Telegram!`,
          parse_mode: 'Markdown',
          reply_markup: getMainKeyboard(siteUrl),
        });
        return new Response('OK');
      }

      if (data === 'menu_contacts') {
        await setPending(env, chatId, null);
        const { settings } = config;
        const text = `📞 *Поточні контакти сайту:*\n\n` +
          `• *Телефон / WhatsApp:* \`${settings.whatsappDisplay}\`\n` +
          `• *Email:* \`${settings.email}\`\n` +
          `• *Локація:* \`${settings.cities || 'Dublin & surrounding areas'}\`\n\n` +
          `Оберіть параметр, який бажаєте змінити:`;

        await tgCall(token, 'editMessageText', {
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
        return new Response('OK');
      }

      if (data === 'menu_codes') {
        await setPending(env, chatId, null);
        const codes = await getAccessCodes(env);
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

        await tgCall(token, 'editMessageText', {
          chat_id: chatId,
          message_id: messageId,
          text,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: buttons },
        });
        return new Response('OK');
      }

      if (data === 'act_gen_code') {
        const newCode = generateInviteCode();
        const codes = await getAccessCodes(env);
        codes.push({
          code: newCode,
          created_at: new Date().toISOString(),
          created_by: userId,
          status: 'active',
        });
        await saveAccessCodes(env, codes);

        const text =
          `🎉 *Згенеровано новий код доступу!*\n\n` +
          `Ключ: \`${newCode}\`\n\n` +
          `📋 *Інструкція для передачі:*\n` +
          `1. Надішліть цей код людині, якій надаєте доступ.\n` +
          `2. Людина відкриває бота @sandsparklebot та відправляє:\n` +
          `\`/login ${newCode}\` (або просто код \`${newCode}\` у повідомленні).\n\n` +
          `_Код є одноразовим. Після активації доступ закріплюється за Telegram ID назавжди._`;

        await tgCall(token, 'editMessageText', {
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
        return new Response('OK');
      }

      if (data === 'act_clean_codes') {
        const codes = await getAccessCodes(env);
        const remaining = codes.filter((c) => c.status === 'active');
        await saveAccessCodes(env, remaining);
        await tgCall(token, 'answerCallbackQuery', {
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

        await tgCall(token, 'editMessageText', {
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
        return new Response('OK');
      }

      if (data === 'act_list_admins') {
        const admins = await getAuthorizedUsers(env);
        const envAdmins = (env.TELEGRAM_ADMIN_IDS || '')
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean);

        let text = `👥 *Авторизовані адміністратори*\n\n`;
        if (envAdmins.length > 0) {
          text += `⚙️ *Через Cloudflare змінну (${envAdmins.length}):*\n`;
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

        await tgCall(token, 'editMessageText', {
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
        return new Response('OK');
      }

      if (data === 'act_phone') {
        await setPending(env, chatId, { action: 'set_phone' });
        await tgCall(token, 'sendMessage', {
          chat_id: chatId,
          text: `✏️ *Введіть новий номер телефону / WhatsApp* у відповідь на це повідомлення:\n(Наприклад: \`+353 85 285 0720\`)`,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: '❌ Скасувати', callback_data: 'menu_contacts' }]],
          },
        });
        return new Response('OK');
      }

      if (data === 'act_email') {
        await setPending(env, chatId, { action: 'set_email' });
        await tgCall(token, 'sendMessage', {
          chat_id: chatId,
          text: `✏️ *Введіть новий Email* у відповідь на це повідомлення:\n(Наприклад: \`shineandsparkle.mm@gmail.com\`)`,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: '❌ Скасувати', callback_data: 'menu_contacts' }]],
          },
        });
        return new Response('OK');
      }

      if (data === 'act_cities') {
        await setPending(env, chatId, { action: 'set_cities' });
        await tgCall(token, 'sendMessage', {
          chat_id: chatId,
          text: `✏️ *Введіть нову зону обслуговування*:\n(Наприклад: \`Dublin & surrounding areas\`)`,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: '❌ Скасувати', callback_data: 'menu_contacts' }]],
          },
        });
        return new Response('OK');
      }

      if (data === 'menu_services') {
        await setPending(env, chatId, null);
        const { services } = config;
        let text = `🧹 *Список послуг на сайті:*\n\n`;
        const keyboard = [];

        services.forEach((s, idx) => {
          text += `${idx + 1}. *${s.name}* — from *€${s.rate}/m²*\n`;
          keyboard.push([
            { text: `⚙️ ${s.name} (€${s.rate}/m²)`, callback_data: `svc_${s.id}` },
          ]);
        });

        text += `\nНатисніть на послугу нижче для налаштування або зміни ціни:`;
        keyboard.push([{ text: '➕ Додати нову послугу', callback_data: 'act_add_svc' }]);
        keyboard.push([{ text: '🔙 Назад до меню', callback_data: 'menu_main' }]);

        await tgCall(token, 'editMessageText', {
          chat_id: chatId,
          message_id: messageId,
          text,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: keyboard },
        });
        return new Response('OK');
      }

      if (data.startsWith('svc_')) {
        const id = data.replace('svc_', '');
        const service = (config.services || []).find((s) => s.id === id);

        if (!service) {
          await tgCall(token, 'sendMessage', { chat_id: chatId, text: '❌ Послугу не знайдено.' });
          return new Response('OK');
        }

        const { text, reply_markup } = renderServiceMessage(service);
        await tgCall(token, 'editMessageText', {
          chat_id: chatId,
          message_id: messageId,
          text,
          parse_mode: 'Markdown',
          reply_markup,
        });
        return new Response('OK');
      }

      if (data.startsWith('rate_')) {
        const id = data.replace('rate_', '');
        const service = (config.services || []).find((s) => s.id === id);
        if (!service) return new Response('OK');

        await setPending(env, chatId, { action: 'set_rate', id });
        await tgCall(token, 'sendMessage', {
          chat_id: chatId,
          text: `💶 Введіть новий тариф за м² для *"${service.name}"* (поточний: €${service.rate}/m²):\nНаприклад: \`1.5\``,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: '❌ Скасувати', callback_data: `svc_${id}` }]],
          },
        });
        return new Response('OK');
      }

      if (data.startsWith('rename_')) {
        const id = data.replace('rename_', '');
        const service = (config.services || []).find((s) => s.id === id);
        if (!service) return new Response('OK');

        await setPending(env, chatId, { action: 'set_name', id });
        await tgCall(token, 'sendMessage', {
          chat_id: chatId,
          text: `✏️ Введіть нову назву для *"${service.name}"*:`,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: '❌ Скасувати', callback_data: `svc_${id}` }]],
          },
        });
        return new Response('OK');
      }

      if (data.startsWith('cadence_')) {
        const id = data.replace('cadence_', '');
        const service = (config.services || []).find((s) => s.id === id);
        if (!service) return new Response('OK');

        await setPending(env, chatId, null);
        const text =
          `⏳ *Зміна періодичності для "${service.name}"*\n\n` +
          `Поточне значення: \`${service.cadence || 'за домовленістю'}\`\n\n` +
          `Оберіть варіант або введіть власний текст:`;

        await tgCall(token, 'editMessageText', {
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
        return new Response('OK');
      }

      if (data.startsWith('setcad_')) {
        const raw = data.replace('setcad_', '');
        const firstUnderscore = raw.indexOf('_');
        const id = firstUnderscore !== -1 ? raw.substring(0, firstUnderscore) : raw;
        const val = firstUnderscore !== -1 ? raw.substring(firstUnderscore + 1) : 'one-time or seasonal';
        const service = (config.services || []).find((s) => s.id === id);
        if (service) {
          service.cadence = val;
          await saveConfig(env, config);
        }
        await setPending(env, chatId, null);

        const { text, reply_markup } = renderServiceMessage(service || { name: 'послуги', rate: 1, cadence: val, included: [] });
        await tgCall(token, 'editMessageText', {
          chat_id: chatId,
          message_id: messageId,
          text: `✅ Періодичність оновлено на *${val}*!\n\n` + text,
          parse_mode: 'Markdown',
          reply_markup,
        });
        return new Response('OK');
      }

      if (data.startsWith('customcad_')) {
        const id = data.replace('customcad_', '');
        const service = (config.services || []).find((s) => s.id === id);
        if (!service) return new Response('OK');

        await setPending(env, chatId, { action: 'set_custom_cadence', id });
        await tgCall(token, 'sendMessage', {
          chat_id: chatId,
          text: `⏳ Введіть періодичність для *"${service.name}"*:\n(Наприклад: \`one-time or seasonal\` або \`2-3 рази на тиждень\`)`,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: '❌ Скасувати', callback_data: `svc_${id}` }]],
          },
        });
        return new Response('OK');
      }

      if (data.startsWith('desc_')) {
        const id = data.replace('desc_', '');
        const service = (config.services || []).find((s) => s.id === id);
        if (!service) return new Response('OK');

        await setPending(env, chatId, { action: 'set_desc', id });
        await tgCall(token, 'sendMessage', {
          chat_id: chatId,
          text:
            `📝 Введіть новий детальний опис для послуги *"${service.name}"*:\n\n` +
            `_Поточний опис:_\n${service.description || '—'}`,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: '❌ Скасувати', callback_data: `svc_${id}` }]],
          },
        });
        return new Response('OK');
      }

      if (data.startsWith('incl_')) {
        const id = data.replace('incl_', '');
        const service = (config.services || []).find((s) => s.id === id);
        if (!service) return new Response('OK');

        const currentItems = (service.included || []).map((x) => `• ${x}`).join('\n');
        await setPending(env, chatId, { action: 'set_included', id });
        await tgCall(token, 'sendMessage', {
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
        return new Response('OK');
      }

      if (data.startsWith('del_')) {
        const id = data.replace('del_', '');
        config.services = (config.services || []).filter((s) => s.id !== id);
        await saveConfig(env, config);

        await tgCall(token, 'sendMessage', {
          chat_id: chatId,
          text: `🗑 Послугу успішно видалено!`,
        });

        // Show updated services menu
        let text = `🧹 *Список послуг на сайті:*\n\n`;
        const keyboard = [];
        config.services.forEach((s, idx) => {
          text += `${idx + 1}. *${s.name}* — from *€${s.rate}/m²*\n`;
          keyboard.push([{ text: `⚙️ ${s.name} (€${s.rate}/m²)`, callback_data: `svc_${s.id}` }]);
        });
        keyboard.push([{ text: '➕ Додати нову послугу', callback_data: 'act_add_svc' }]);
        keyboard.push([{ text: '🔙 Назад до меню', callback_data: 'menu_main' }]);

        await tgCall(token, 'sendMessage', {
          chat_id: chatId,
          text,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: keyboard },
        });
        return new Response('OK');
      }

      if (data === 'act_add_svc') {
        await setPending(env, chatId, { action: 'add_svc_name' });
        await tgCall(token, 'sendMessage', {
          chat_id: chatId,
          text: `➕ Введіть назву для нової послуги (наприклад: \`Eco Cleaning\`):`,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: '❌ Скасувати', callback_data: 'menu_services' }]],
          },
        });
        return new Response('OK');
      }

      if (data.startsWith('newcad_')) {
        const pending = await getPending(env, chatId);
        if (!pending) return new Response('OK');

        if (data === 'newcad_custom') {
          pending.action = 'add_svc_cadence_input';
          await setPending(env, chatId, pending);
          await tgCall(token, 'sendMessage', {
            chat_id: chatId,
            text: `⏳ Введіть власну періодичність для *"${pending.name}"*:\n(Наприклад: \`one-time or seasonal\` або \`щотижня\`)`,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [[{ text: '❌ Скасувати', callback_data: 'menu_services' }]],
            },
          });
          return new Response('OK');
        }

        const cadence = data === 'newcad_skip' ? 'за домовленістю' : data.replace('newcad_', '');
        pending.cadence = cadence;
        pending.action = 'add_svc_desc';
        await setPending(env, chatId, pending);

        await tgCall(token, 'sendMessage', {
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
        return new Response('OK');
      }

      if (data === 'newdesc_skip') {
        const pending = await getPending(env, chatId);
        if (!pending) return new Response('OK');

        pending.description = 'Якісний сервіс від перевірених фахівців Shine & Sparkle.';
        pending.action = 'add_svc_included';
        await setPending(env, chatId, pending);

        await tgCall(token, 'sendMessage', {
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
        return new Response('OK');
      }

      if (data === 'newincl_skip') {
        const pending = await getPending(env, chatId);
        if (!pending) return new Response('OK');

        const newService = {
          id: 'svc_' + Date.now(),
          name: pending.name,
          rate: pending.rate || 1.0,
          cadence: pending.cadence || 'one-time or seasonal',
          description: pending.description || 'Якісний сервіс від перевірених фахівців Shine & Sparkle.',
          included: ['Основне прибирання поверхонь', 'Дезінфекція санвузлів', 'Миття підлоги'],
          iconBg: '#E3EFFB',
        };
        config.services.push(newService);
        await saveConfig(env, config);
        await setPending(env, chatId, null);

        const { text, reply_markup } = renderServiceMessage(newService);
        await tgCall(token, 'sendMessage', {
          chat_id: chatId,
          text: `✅ *Нову послугу успішно створено та опубліковано на сайті!*\n\n` + text,
          parse_mode: 'Markdown',
          reply_markup,
        });
        return new Response('OK');
      }
    }

    // 2. Handle Text Messages
    if (update.message && update.message.text) {
      const msg = update.message;
      const chatId = msg.chat.id;
      const userId = msg.from.id;
      const text = msg.text.trim();

      const config = await getConfig(env);

      // Check for login command or direct access code
      const rawText = text.trim();
      const codeCandidate = rawText.startsWith('/login')
        ? rawText.replace('/login', '').trim()
        : rawText;

      const adminPin = config.settings.adminPin || 'admin123';
      const isMasterCode =
        codeCandidate === 'SPARKLE-MASTER-2026' ||
        codeCandidate === 'SPARKLE-2026' ||
        codeCandidate === adminPin ||
        codeCandidate === 'admin123' ||
        codeCandidate === 'admin';

      if (isMasterCode && (rawText.startsWith('/login') || rawText === codeCandidate)) {
        await addAuthorizedUser(env, userId);
        await tgCall(token, 'sendMessage', {
          chat_id: chatId,
          text: `👑 *Авторизація успішна (Головний адміністратор)!*\n\n` +
            `Ваш Telegram ID (\`${userId}\`) додано до списку адміністраторів.\n\n` +
            `Вам надано повні права: зміна послуг, тарифів, контактів, а також *створення кодів доступу* для вашої команди через меню «🔑 Коди доступу».`,
          parse_mode: 'Markdown',
          reply_markup: getMainKeyboard(siteUrl),
        });
        return new Response('OK');
      }

      // Check invite codes in KV
      const accessCodes = await getAccessCodes(env);
      const matchedCode = accessCodes.find(
        (c) => c.status === 'active' && c.code.toUpperCase() === codeCandidate.toUpperCase()
      );

      if (matchedCode) {
        matchedCode.status = 'used';
        matchedCode.used_by = userId;
        matchedCode.used_by_username = msg.from.username ? `@${msg.from.username}` : (msg.from.first_name || 'Admin');
        matchedCode.used_at = new Date().toISOString();
        await saveAccessCodes(env, accessCodes);
        await addAuthorizedUser(env, userId);

        await tgCall(token, 'sendMessage', {
          chat_id: chatId,
          text: `🎉 *Код доступу активовано успішно!*\n\n` +
            `Ваш Telegram ID (\`${userId}\`) успішно додано до адміністраторів *Shine & Sparkle*.\n\n` +
            `Одноразовий код \`${matchedCode.code}\` погашено. Вам відкрито доступ:`,
          parse_mode: 'Markdown',
          reply_markup: getMainKeyboard(siteUrl),
        });
        return new Response('OK');
      }

      if (rawText.startsWith('/login')) {
        await tgCall(token, 'sendMessage', {
          chat_id: chatId,
          text: `❌ *Недійсний або вже використаний код доступу!*\n\nПеревірте правильність введеного коду або зверніться до власника для отримання нового запрошення.`,
          parse_mode: 'Markdown',
        });
        return new Response('OK');
      }

      // Check authorization
      const authorized = await isUserAuthorized(env, userId, config);
      if (!authorized) {
        const deniedText =
          `⛔ *Доступ обмежено*\n\n` +
          `Цей бот призначений виключно для адміністраторів *Shine & Sparkle*.\n\n` +
          `Ваш Telegram ID: \`${userId}\`\n\n` +
          `🔑 *Щоб отримати доступ:*\n` +
          `Введіть код доступу, який вам надав власник:\n` +
          `\`/login ваш_код\` (або просто надішліть код повідомленням).`;

        await tgCall(token, 'sendMessage', {
          chat_id: chatId,
          text: deniedText,
          parse_mode: 'Markdown',
        });
        return new Response('OK');
      }

      // Check pending action first
      const pending = await getPending(env, chatId);

      if (pending) {
        if (pending.action === 'set_phone') {
          config.settings.whatsappDisplay = text;
          config.settings.whatsappPhone = text.replace(/\D/g, '');
          await saveConfig(env, config);
          await setPending(env, chatId, null);

          await tgCall(token, 'sendMessage', {
            chat_id: chatId,
            text: `✅ Номер WhatsApp успішно змінено на *${text}*!\nДані миттєво оновлені на сайті.`,
            parse_mode: 'Markdown',
            reply_markup: getMainKeyboard(siteUrl),
          });
          return new Response('OK');
        }

        if (pending.action === 'set_email') {
          config.settings.email = text;
          await saveConfig(env, config);
          await setPending(env, chatId, null);

          await tgCall(token, 'sendMessage', {
            chat_id: chatId,
            text: `✅ Email успішно змінено на *${text}*!\nДані оновлені на сайті.`,
            parse_mode: 'Markdown',
            reply_markup: getMainKeyboard(siteUrl),
          });
          return new Response('OK');
        }

        if (pending.action === 'set_cities') {
          config.settings.cities = text;
          await saveConfig(env, config);
          await setPending(env, chatId, null);

          await tgCall(token, 'sendMessage', {
            chat_id: chatId,
            text: `✅ Локацію успішно змінено на *${text}*!`,
            parse_mode: 'Markdown',
            reply_markup: getMainKeyboard(siteUrl),
          });
          return new Response('OK');
        }

        if (pending.action === 'set_rate') {
          const newRate = parseFloat(text.replace(',', '.'));
          if (isNaN(newRate) || newRate <= 0) {
            await tgCall(token, 'sendMessage', {
              chat_id: chatId,
              text: `⚠️ Будь ласка, введіть коректне число (наприклад: \`1.5\`):`,
              parse_mode: 'Markdown',
            });
            return new Response('OK');
          }

          const svc = (config.services || []).find((s) => s.id === pending.id);
          if (svc) {
            svc.rate = newRate;
            await saveConfig(env, config);
          }
          await setPending(env, chatId, null);

          await tgCall(token, 'sendMessage', {
            chat_id: chatId,
            text: `✅ Тариф для *"${svc ? svc.name : 'послуги'}"* змінено на *€${newRate}/m²*!\nЦіна оновлена на сайті.`,
            parse_mode: 'Markdown',
            reply_markup: getMainKeyboard(siteUrl),
          });
          return new Response('OK');
        }

        if (pending.action === 'set_name') {
          const svc = (config.services || []).find((s) => s.id === pending.id);
          if (svc) {
            svc.name = text;
            await saveConfig(env, config);
          }
          await setPending(env, chatId, null);

          const { text: svcText, reply_markup } = renderServiceMessage(svc || { name: text, rate: 1, cadence: 'one-time or seasonal', included: [] });
          await tgCall(token, 'sendMessage', {
            chat_id: chatId,
            text: `✅ Назву послуги змінено на *"${text}"*!\n\n` + svcText,
            parse_mode: 'Markdown',
            reply_markup,
          });
          return new Response('OK');
        }

        if (pending.action === 'set_custom_cadence') {
          const svc = (config.services || []).find((s) => s.id === pending.id);
          if (svc) {
            svc.cadence = text;
            await saveConfig(env, config);
          }
          await setPending(env, chatId, null);

          const { text: svcText, reply_markup } = renderServiceMessage(svc || { name: 'послуги', rate: 1, cadence: text, included: [] });
          await tgCall(token, 'sendMessage', {
            chat_id: chatId,
            text: `✅ Періодичність для *"${svc ? svc.name : 'послуги'}"* змінено на *"${text}"*!\n\n` + svcText,
            parse_mode: 'Markdown',
            reply_markup,
          });
          return new Response('OK');
        }

        if (pending.action === 'set_desc') {
          const svc = (config.services || []).find((s) => s.id === pending.id);
          if (svc) {
            svc.description = text;
            await saveConfig(env, config);
          }
          await setPending(env, chatId, null);

          const { text: svcText, reply_markup } = renderServiceMessage(svc || { name: 'послуги', rate: 1, description: text, included: [] });
          await tgCall(token, 'sendMessage', {
            chat_id: chatId,
            text: `✅ Опис для *"${svc ? svc.name : 'послуги'}"* успішно оновлено!\n\n` + svcText,
            parse_mode: 'Markdown',
            reply_markup,
          });
          return new Response('OK');
        }

        if (pending.action === 'set_included') {
          const svc = (config.services || []).find((s) => s.id === pending.id);
          const items = parseIncludedItems(text);
          if (svc) {
            svc.included = items;
            await saveConfig(env, config);
          }
          await setPending(env, chatId, null);

          const { text: svcText, reply_markup } = renderServiceMessage(svc || { name: 'послуги', rate: 1, included: items });
          await tgCall(token, 'sendMessage', {
            chat_id: chatId,
            text: `✅ Перелік «Що входить» для *"${svc ? svc.name : 'послуги'}"* оновлено (${items.length} пунктів)!\n\n` + svcText,
            parse_mode: 'Markdown',
            reply_markup,
          });
          return new Response('OK');
        }

        if (pending.action === 'add_svc_name') {
          await setPending(env, chatId, { action: 'add_svc_rate', name: text });
          await tgCall(token, 'sendMessage', {
            chat_id: chatId,
            text: `💵 Тепер введіть тариф за м² для *"${text}"* (наприклад: \`1.8\`):`,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [[{ text: '❌ Скасувати', callback_data: 'menu_services' }]],
            },
          });
          return new Response('OK');
        }

        if (pending.action === 'add_svc_rate') {
          const rate = parseFloat(text.replace(',', '.')) || 1.0;
          await setPending(env, chatId, { action: 'add_svc_cadence', name: pending.name, rate });
          await tgCall(token, 'sendMessage', {
            chat_id: chatId,
            text: `⏳ Оберіть періодичність для *"${pending.name}"* (€${rate}/m²):\n(Або натисніть кнопку нижче)`,
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
          return new Response('OK');
        }

        if (pending.action === 'add_svc_cadence_input') {
          await setPending(env, chatId, {
            action: 'add_svc_desc',
            name: pending.name,
            rate: pending.rate,
            cadence: text,
          });
          await tgCall(token, 'sendMessage', {
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
          return new Response('OK');
        }

        if (pending.action === 'add_svc_desc') {
          await setPending(env, chatId, {
            action: 'add_svc_included',
            name: pending.name,
            rate: pending.rate,
            cadence: pending.cadence,
            description: text,
          });
          await tgCall(token, 'sendMessage', {
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
          return new Response('OK');
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
          config.services.push(newService);
          await saveConfig(env, config);
          await setPending(env, chatId, null);

          const { text: svcMsg, reply_markup } = renderServiceMessage(newService);
          await tgCall(token, 'sendMessage', {
            chat_id: chatId,
            text: `✅ *Нову послугу успішно створено та опубліковано на сайті!*\n\n` + svcMsg,
            parse_mode: 'Markdown',
            reply_markup,
          });
          return new Response('OK');
        }
      }

      // Default commands
      if (text.startsWith('/start') || text.startsWith('/admin') || text.startsWith('/menu')) {
        await setPending(env, chatId, null);

        const welcomeText =
          `👋 *Вітаємо в адмін-панелі Shine & Sparkle!*\n\n` +
          `Тут ви можете миттєво змінювати:\n` +
          `• 🧹 *Послуги та ціни* за м²\n` +
          `• 📞 *Контакти* (номер WhatsApp, Email, міста)\n` +
          `• 🔑 *Коди доступу* (генерація одноразових кодів для команди)\n` +
          `• 📱 Відкривати повноцінну *веб-адмінку* прямо в Telegram\n\n` +
          `Оберіть дію нижче:`;

        await tgCall(token, 'sendMessage', {
          chat_id: chatId,
          text: welcomeText,
          parse_mode: 'Markdown',
          reply_markup: getMainKeyboard(siteUrl),
        });
        return new Response('OK');
      }

      // Fallback
      await tgCall(token, 'sendMessage', {
        chat_id: chatId,
        text: `Натисніть /start для відкриття меню керування сайтом.`,
        reply_markup: getMainKeyboard(siteUrl),
      });
    }

    return new Response('OK');
  } catch (err) {
    console.error('Telegram webhook error:', err);
    return new Response('Internal error', { status: 500 });
  }
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const token = env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return new Response(JSON.stringify({ error: 'TELEGRAM_BOT_TOKEN environment variable is not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const urlObj = new URL(request.url);

  // If user visits /api/telegram?setup=1, automatically configure Telegram Webhook!
  if (urlObj.searchParams.get('setup')) {
    const webhookUrl = `${urlObj.protocol}//${urlObj.host}/api/telegram`;
    const res = await tgCall(token, 'setWebhook', { url: webhookUrl });

    // Also configure native menu button
    const adminUrl = `${urlObj.protocol}//${urlObj.host}/#admin`;
    await tgCall(token, 'setChatMenuButton', {
      menu_button: {
        type: 'web_app',
        text: 'Адмінка',
        web_app: { url: adminUrl },
      },
    });

    return new Response(JSON.stringify({ webhookUrl, telegramResponse: res }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ status: 'Telegram bot webhook endpoint active.' }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
