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
          text += `${idx + 1}. *${s.name}* — from *$${s.rate}/m²*\n`;
          keyboard.push([
            { text: `⚙️ ${s.name} ($${s.rate}/m²)`, callback_data: `svc_${s.id}` },
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

        const includedList = (service.included || []).map((x) => `  ✓ ${x}`).join('\n');
        const text = `🧹 *Послуга:* ${service.name}\n` +
          `💵 *Тариф:* from *$${service.rate}/m²*\n` +
          `⏳ *Періодичність:* ${service.cadence || 'за домовленістю'}\n` +
          `📝 *Опис:* ${service.description || '—'}\n\n` +
          `*Що входить:*\n${includedList || '  (список порожній)'}`;

        await tgCall(token, 'editMessageText', {
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
        return new Response('OK');
      }

      if (data.startsWith('rate_')) {
        const id = data.replace('rate_', '');
        const service = (config.services || []).find((s) => s.id === id);
        if (!service) return new Response('OK');

        await setPending(env, chatId, { action: 'set_rate', id });
        await tgCall(token, 'sendMessage', {
          chat_id: chatId,
          text: `💵 Введіть новий тариф за м² для *"${service.name}"* (поточний: $${service.rate}/m²):\nНаприклад: \`1.5\``,
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
          text += `${idx + 1}. *${s.name}* — from *$${s.rate}/m²*\n`;
          keyboard.push([{ text: `⚙️ ${s.name} ($${s.rate}/m²)`, callback_data: `svc_${s.id}` }]);
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
    }

    // 2. Handle Text Messages
    if (update.message && update.message.text) {
      const msg = update.message;
      const chatId = msg.chat.id;
      const userId = msg.from.id;
      const text = msg.text.trim();

      const config = await getConfig(env);

      // Check for login command: /login <password>
      const adminPin = config.settings.adminPin || 'admin123';
      const isLoginCmd = text.startsWith('/login') || text === adminPin;

      if (isLoginCmd) {
        const passwordEntered = text.startsWith('/login') ? text.replace('/login', '').trim() : text;
        if (passwordEntered === adminPin || passwordEntered === 'admin' || passwordEntered === 'admin123') {
          await addAuthorizedUser(env, userId);
          await tgCall(token, 'sendMessage', {
            chat_id: chatId,
            text: `✅ *Авторизація успішна!*\n\nВаш акаунт (ID: \`${userId}\`) успішно додано до списку адміністраторів.\n\nТепер ви маєте повний доступ до адмін-панелі.`,
            parse_mode: 'Markdown',
            reply_markup: getMainKeyboard(siteUrl),
          });
          return new Response('OK');
        } else {
          await tgCall(token, 'sendMessage', {
            chat_id: chatId,
            text: `❌ Невірний пароль! Спробуйте ще раз: \`/login ваш_пароль\``,
            parse_mode: 'Markdown',
          });
          return new Response('OK');
        }
      }

      // Check authorization
      const authorized = await isUserAuthorized(env, userId, config);
      if (!authorized) {
        const deniedText =
          `⛔ *Доступ обмежено*\n\n` +
          `Цей бот призначений виключно для адміністраторів *Shine & Sparkle*.\n\n` +
          `Ваш Telegram ID: \`${userId}\`\n\n` +
          `Щоб отримати доступ:\n` +
          `1. Введіть пароль: \`/login ваш_пароль\` (за замовчуванням: \`/login admin123\`)\n` +
          `2. Або додайте цей ID у змінну \`TELEGRAM_ADMIN_IDS\` у Cloudflare Pages.`;

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
            text: `✅ Тариф для *"${svc ? svc.name : 'послуги'}"* змінено на *$${newRate}/m²*!\nЦіна оновлена на сайті.`,
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

          await tgCall(token, 'sendMessage', {
            chat_id: chatId,
            text: `✅ Назву послуги змінено на *"${text}"*!`,
            parse_mode: 'Markdown',
            reply_markup: getMainKeyboard(siteUrl),
          });
          return new Response('OK');
        }

        if (pending.action === 'add_svc_name') {
          await setPending(env, chatId, { action: 'add_svc_rate', name: text });
          await tgCall(token, 'sendMessage', {
            chat_id: chatId,
            text: `💵 Тепер введіть тариф за м² для *"${text}"* (наприклад: \`1.7\`):`,
            parse_mode: 'Markdown',
          });
          return new Response('OK');
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
          config.services.push(newService);
          await saveConfig(env, config);
          await setPending(env, chatId, null);

          await tgCall(token, 'sendMessage', {
            chat_id: chatId,
            text: `✅ Послугу *"${pending.name}"* успішно створено з тарифом *$${rate}/m²*!`,
            parse_mode: 'Markdown',
            reply_markup: getMainKeyboard(siteUrl),
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
