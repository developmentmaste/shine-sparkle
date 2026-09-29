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

// Cryptographic verification of Telegram WebApp initData
async function verifyTelegramWebAppData(initData, botToken) {
  if (!initData || !botToken) return null;
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return null;

    params.delete('hash');
    const items = [];
    for (const [key, value] of params.entries()) {
      items.push(`${key}=${value}`);
    }
    items.sort();
    const dataCheckString = items.join('\n');

    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode('WebAppData'),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const secretKey = await crypto.subtle.sign('HMAC', keyMaterial, encoder.encode(botToken));

    const hmacKey = await crypto.subtle.importKey(
      'raw',
      secretKey,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', hmacKey, encoder.encode(dataCheckString));
    const hexHash = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    if (hexHash.toLowerCase() === hash.toLowerCase()) {
      const userStr = params.get('user');
      if (userStr) {
        return JSON.parse(userStr);
      }
    }
  } catch (err) {
    console.error('Error verifying Telegram WebApp data:', err);
  }
  return null;
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

function getMainKeyboard(siteUrl) {
  const adminUrl = siteUrl ? `${siteUrl.replace(/\/+$/, '')}/?tg_admin=1` : 'https://shine-sparkle.pages.dev/?tg_admin=1';
  const liveUrl = siteUrl ? siteUrl.replace(/\/+$/, '') : 'https://shine-sparkle.pages.dev';

  return {
    inline_keyboard: [
      [
        {
          text: '📱 Open Admin Panel (WebApp)',
          web_app: { url: adminUrl },
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
        { text: '🌐 View Live Site', url: liveUrl },
        { text: '🔄 Refresh', callback_data: 'menu_main' },
      ],
    ],
  };
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const token = env.TELEGRAM_BOT_TOKEN;

  // 0. Handle Admin Verification API call from WebApp
  try {
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const clonedReq = request.clone();
      const body = await clonedReq.json().catch(() => null);
      if (body && (body.action === 'verify_admin' || body.action === 'check_admin')) {
        let verifiedUser = null;
        if (body.initData && token) {
          verifiedUser = await verifyTelegramWebAppData(body.initData, token);
        }

        const targetUserId = (verifiedUser && verifiedUser.id) ? verifiedUser.id : body.userId;
        if (!targetUserId) {
          return new Response(JSON.stringify({ authorized: false, error: 'No user ID provided' }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          });
        }

        const config = await getConfig(env);
        const authorized = await isUserAuthorized(env, targetUserId, config);

        return new Response(JSON.stringify({
          authorized,
          user: {
            id: targetUserId,
            firstName: verifiedUser?.first_name || body.firstName || '',
            username: verifiedUser?.username || body.username || '',
          },
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    }
  } catch (authErr) {
    console.error('Error handling admin verification in onRequestPost:', authErr);
  }

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
          text: `⛔ Access Denied! Your ID: ${userId}. Enter /login <code> to authenticate.`,
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
          text: `🧹 *Admin Control Panel*\n\nManage services, pricing per m², contacts, and team access.\n\nTap *Open Admin Panel (WebApp)* below to launch the full-screen mobile app directly in Telegram!`,
          parse_mode: 'Markdown',
          reply_markup: getMainKeyboard(siteUrl),
        });
        return new Response('OK');
      }

      if (data === 'menu_contacts') {
        await setPending(env, chatId, null);
        const { settings } = config;
        const text = `📞 *Current Website Contacts:*\n\n` +
          `• *Phone / WhatsApp:* \`${settings.whatsappDisplay}\`\n` +
          `• *Email:* \`${settings.email}\`\n` +
          `• *Service Areas:* \`${settings.cities || 'Dublin & surrounding areas'}\`\n\n` +
          `Select a contact field to edit:`;

        await tgCall(token, 'editMessageText', {
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
        return new Response('OK');
      }

      if (data === 'menu_codes') {
        await setPending(env, chatId, null);
        const codes = await getAccessCodes(env);
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
          `🎉 *New Invite Code Generated!*\n\n` +
          `Key: \`${newCode}\`\n\n` +
          `📋 *How to share:*\n` +
          `1. Send this code to the person you want to give access to.\n` +
          `2. They open this bot and send:\n` +
          `\`/login ${newCode}\` (or simply send \`${newCode}\` in chat).\n\n` +
          `_The code is single-use. Once redeemed, admin access is linked to their Telegram ID permanently._`;

        await tgCall(token, 'editMessageText', {
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
        return new Response('OK');
      }

      if (data === 'act_clean_codes') {
        const codes = await getAccessCodes(env);
        const remaining = codes.filter((c) => c.status === 'active');
        await saveAccessCodes(env, remaining);
        await tgCall(token, 'answerCallbackQuery', {
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

        await tgCall(token, 'editMessageText', {
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
        return new Response('OK');
      }

      if (data === 'act_list_admins') {
        const admins = await getAuthorizedUsers(env);
        const envAdmins = (env.TELEGRAM_ADMIN_IDS || '')
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean);

        let text = `👥 *Authorized Administrators*\n\n`;
        if (envAdmins.length > 0) {
          text += `⚙️ *Via Cloudflare Environment (${envAdmins.length}):*\n`;
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

        await tgCall(token, 'editMessageText', {
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
        return new Response('OK');
      }

      if (data === 'act_phone') {
        await setPending(env, chatId, { action: 'set_phone' });
        await tgCall(token, 'sendMessage', {
          chat_id: chatId,
          text: `✏️ *Send the new phone / WhatsApp number* in reply to this message:\n(e.g.: \`+353 85 285 0720\`)`,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'menu_contacts' }]],
          },
        });
        return new Response('OK');
      }

      if (data === 'act_email') {
        await setPending(env, chatId, { action: 'set_email' });
        await tgCall(token, 'sendMessage', {
          chat_id: chatId,
          text: `✏️ *Send the new contact Email* in reply to this message:\n(e.g.: \`shineandsparkle.mm@gmail.com\`)`,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'menu_contacts' }]],
          },
        });
        return new Response('OK');
      }

      if (data === 'act_cities') {
        await setPending(env, chatId, { action: 'set_cities' });
        await tgCall(token, 'sendMessage', {
          chat_id: chatId,
          text: `✏️ *Send the new service areas / cities* in reply to this message:\n(e.g.: \`Dublin & surrounding areas\`)`,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'menu_contacts' }]],
          },
        });
        return new Response('OK');
      }

      if (data === 'menu_services') {
        await setPending(env, chatId, null);
        const { services } = config;
        let text = `🧹 *Services on Website:*\n\n`;
        const keyboard = [];

        services.forEach((s, idx) => {
          text += `${idx + 1}. *${s.name}* — from *€${s.rate}/m²*\n`;
          keyboard.push([
            { text: `⚙️ ${s.name} (€${s.rate}/m²)`, callback_data: `svc_${s.id}` },
          ]);
        });

        text += `\nTap any service below to configure its rate, description, or tasks:`;
        keyboard.push([{ text: '➕ Add New Service', callback_data: 'act_add_svc' }]);
        keyboard.push([{ text: '🔙 Back to Menu', callback_data: 'menu_main' }]);

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
          await tgCall(token, 'sendMessage', { chat_id: chatId, text: '❌ Service not found.' });
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
          text: `💶 Enter the new rate per m² for *"${service.name}"* (current: €${service.rate}/m²):\nExample: \`1.5\``,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: '❌ Cancel', callback_data: `svc_${id}` }]],
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
          text: `✏️ Enter the new name for *"${service.name}"*:`,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: '❌ Cancel', callback_data: `svc_${id}` }]],
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
          `⏳ *Change Frequency for "${service.name}"*\n\n` +
          `Current value: \`${service.cadence || 'custom'}\`\n\n` +
          `Choose an option or enter custom text:`;

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
              [{ text: '✏️ Enter custom text', callback_data: `customcad_${id}` }],
              [{ text: '🔙 Cancel', callback_data: `svc_${id}` }],
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

        const { text, reply_markup } = renderServiceMessage(service || { name: 'Service', rate: 1, cadence: val, included: [] });
        await tgCall(token, 'editMessageText', {
          chat_id: chatId,
          message_id: messageId,
          text: `✅ Frequency updated to *${val}*!\n\n` + text,
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
          text: `⏳ Enter frequency for *"${service.name}"*:\n(e.g.: \`one-time or seasonal\` or \`2-3 times a week\`)`,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: '❌ Cancel', callback_data: `svc_${id}` }]],
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
            `📝 Enter new detailed description for *"${service.name}"*:\n\n` +
            `_Current description:_\n${service.description || '—'}`,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: '❌ Cancel', callback_data: `svc_${id}` }]],
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
        return new Response('OK');
      }

      if (data.startsWith('del_')) {
        const id = data.replace('del_', '');
        config.services = (config.services || []).filter((s) => s.id !== id);
        await saveConfig(env, config);

        await tgCall(token, 'sendMessage', {
          chat_id: chatId,
          text: `🗑 Service successfully deleted!`,
        });

        // Show updated services menu
        let text = `🧹 *Services on Website:*\n\n`;
        const keyboard = [];
        config.services.forEach((s, idx) => {
          text += `${idx + 1}. *${s.name}* — from *€${s.rate}/m²*\n`;
          keyboard.push([{ text: `⚙️ ${s.name} (€${s.rate}/m²)`, callback_data: `svc_${s.id}` }]);
        });
        keyboard.push([{ text: '➕ Add New Service', callback_data: 'act_add_svc' }]);
        keyboard.push([{ text: '🔙 Back to Menu', callback_data: 'menu_main' }]);

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
          text: `➕ Enter the name for the new service (e.g.: \`Office Cleaning\`):`,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'menu_services' }]],
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
            text: `⏳ Enter custom frequency for *"${pending.name}"*:\n(e.g.: \`one-time or seasonal\` or \`weekly\`)`,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'menu_services' }]],
            },
          });
          return new Response('OK');
        }

        const cadence = data === 'newcad_skip' ? 'one-time or seasonal' : data.replace('newcad_', '');
        pending.cadence = cadence;
        pending.action = 'add_svc_desc';
        await setPending(env, chatId, pending);

        await tgCall(token, 'sendMessage', {
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
        return new Response('OK');
      }

      if (data === 'newdesc_skip') {
        const pending = await getPending(env, chatId);
        if (!pending) return new Response('OK');

        pending.description = 'Professional cleaning service from trusted Shine & Sparkle specialists.';
        pending.action = 'add_svc_included';
        await setPending(env, chatId, pending);

        await tgCall(token, 'sendMessage', {
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
          description: pending.description || 'Professional cleaning service from trusted Shine & Sparkle specialists.',
          included: ['Kitchen surfaces and sink', 'Bathroom disinfection', 'Floor vacuuming and mopping'],
          iconBg: '#E3EFFB',
        };
        config.services.push(newService);
        await saveConfig(env, config);
        await setPending(env, chatId, null);

        const { text, reply_markup } = renderServiceMessage(newService);
        await tgCall(token, 'sendMessage', {
          chat_id: chatId,
          text: `✅ *New service successfully created and published on the website!*\n\n` + text,
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
          text: `👑 *Authentication Successful (Primary Administrator)!*\n\n` +
            `Your Telegram ID (\`${userId}\`) has been added to the administrators list.\n\n` +
            `You have full admin access: update services, rates, contacts, and *create invite codes* for your team via «🔑 Access Codes».`,
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
          text: `🎉 *Access Code Activated Successfully!*\n\n` +
            `Your Telegram ID (\`${userId}\`) has been added to the administrators of *Shine & Sparkle*.\n\n` +
            `One-time code \`${matchedCode.code}\` has been redeemed. Access is now unlocked:`,
          parse_mode: 'Markdown',
          reply_markup: getMainKeyboard(siteUrl),
        });
        return new Response('OK');
      }

      if (rawText.startsWith('/login')) {
        await tgCall(token, 'sendMessage', {
          chat_id: chatId,
          text: `❌ *Invalid or already used access code!*\n\nPlease verify the code or contact the business owner for a new invite.`,
          parse_mode: 'Markdown',
        });
        return new Response('OK');
      }

      // Check authorization
      const authorized = await isUserAuthorized(env, userId, config);
      if (!authorized) {
        const deniedText =
          `⛔ *Access Restricted*\n\n` +
          `This bot is strictly reserved for *Shine & Sparkle* administrators.\n\n` +
          `Your Telegram ID: \`${userId}\`\n\n` +
          `🔑 *To gain access:*\n` +
          `Enter the access code provided by the owner:\n` +
          `\`/login your_code\` (or simply reply with your code).`;

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
            text: `✅ WhatsApp phone number updated to *${text}*!\nUpdated live on the website.`,
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
            text: `✅ Contact email updated to *${text}*!\nUpdated live on the website.`,
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
            text: `✅ Service areas updated to *${text}*!`,
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
              text: `⚠️ Please enter a valid rate number (e.g.: \`1.5\`):`,
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
            text: `✅ Rate for *"${svc ? svc.name : 'Service'}"* updated to *€${newRate}/m²*!\nUpdated live on the website.`,
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
            text: `✅ Service name updated to *"${text}"*!\n\n` + svcText,
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

          const { text: svcText, reply_markup } = renderServiceMessage(svc || { name: 'Service', rate: 1, cadence: text, included: [] });
          await tgCall(token, 'sendMessage', {
            chat_id: chatId,
            text: `✅ Frequency for *"${svc ? svc.name : 'Service'}"* updated to *"${text}"*!\n\n` + svcText,
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

          const { text: svcText, reply_markup } = renderServiceMessage(svc || { name: 'Service', rate: 1, description: text, included: [] });
          await tgCall(token, 'sendMessage', {
            chat_id: chatId,
            text: `✅ Description for *"${svc ? svc.name : 'Service'}"* updated successfully!\n\n` + svcText,
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

          const { text: svcText, reply_markup } = renderServiceMessage(svc || { name: 'Service', rate: 1, included: items });
          await tgCall(token, 'sendMessage', {
            chat_id: chatId,
            text: `✅ Checklist for *"${svc ? svc.name : 'Service'}"* updated (${items.length} items)!\n\n` + svcText,
            parse_mode: 'Markdown',
            reply_markup,
          });
          return new Response('OK');
        }

        if (pending.action === 'add_svc_name') {
          await setPending(env, chatId, { action: 'add_svc_rate', name: text });
          await tgCall(token, 'sendMessage', {
            chat_id: chatId,
            text: `💵 Now enter the rate per m² for *"${text}"* (e.g.: \`1.8\`):`,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'menu_services' }]],
            },
          });
          return new Response('OK');
        }

        if (pending.action === 'add_svc_rate') {
          const rate = parseFloat(text.replace(',', '.')) || 1.0;
          await setPending(env, chatId, { action: 'add_svc_cadence', name: pending.name, rate });
          await tgCall(token, 'sendMessage', {
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
            text: `📝 Enter detailed description for *"${pending.name}"*:\n(What this clean includes, who it is for, etc.)\n\nOr tap below to skip:`,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '➡️ Skip description', callback_data: 'newdesc_skip' }],
                [{ text: '❌ Cancel', callback_data: 'menu_services' }],
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
            text: `📋 Enter checklist items for *"${pending.name}"*:\n(Write each item on a new line or separated by commas)\n\nOr tap below to add standard checklist:`,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '➡️ Skip (standard checklist)', callback_data: 'newincl_skip' }],
                [{ text: '❌ Cancel', callback_data: 'menu_services' }],
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
            description: pending.description || 'Professional cleaning service from trusted Shine & Sparkle specialists.',
            included: items,
            iconBg: '#E3EFFB',
          };
          config.services.push(newService);
          await saveConfig(env, config);
          await setPending(env, chatId, null);

          const { text: svcMsg, reply_markup } = renderServiceMessage(newService);
          await tgCall(token, 'sendMessage', {
            chat_id: chatId,
            text: `✅ *New service successfully created and published on the website!*\n\n` + svcMsg,
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
          `👋 *Welcome to Shine & Sparkle Admin Bot!*\n\n` +
          `Here you can manage:\n` +
          `• 🧹 *Services & rates* per m²\n` +
          `• 📞 *Contacts* (WhatsApp number, Email, service areas)\n` +
          `• 🔑 *Access codes* (generate single-use invite codes for teammates)\n` +
          `• 📱 Open the full *Web Admin App* directly in Telegram\n\n` +
          `Choose an action below:`;

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
        text: `Press /start to open the website management menu.`,
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
  const urlObj = new URL(request.url);

  // 1. Handle Admin Verification via GET (e.g. /api/telegram?action=verify_admin&userId=...)
  const action = urlObj.searchParams.get('action');
  if (action === 'verify_admin' || action === 'check_admin') {
    const userId = urlObj.searchParams.get('userId');
    const initData = urlObj.searchParams.get('initData');

    let verifiedUser = null;
    if (initData && token) {
      verifiedUser = await verifyTelegramWebAppData(initData, token);
    }

    const targetUserId = (verifiedUser && verifiedUser.id) ? verifiedUser.id : userId;
    if (!targetUserId) {
      return new Response(JSON.stringify({ authorized: false, error: 'No user ID provided' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const config = await getConfig(env);
    const authorized = await isUserAuthorized(env, targetUserId, config);

    return new Response(JSON.stringify({
      authorized,
      user: {
        id: targetUserId,
        firstName: verifiedUser?.first_name || urlObj.searchParams.get('firstName') || '',
        username: verifiedUser?.username || urlObj.searchParams.get('username') || '',
      },
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  if (!token) {
    return new Response(JSON.stringify({ error: 'TELEGRAM_BOT_TOKEN environment variable is not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  // If user visits /api/telegram?setup=1, automatically configure Telegram Webhook!
  if (urlObj.searchParams.get('setup')) {
    const webhookUrl = `${urlObj.protocol}//${urlObj.host}/api/telegram`;
    const res = await tgCall(token, 'setWebhook', { url: webhookUrl });

    // Also configure native menu button to open WebApp with tg_admin=1
    const adminUrl = `${urlObj.protocol}//${urlObj.host}/?tg_admin=1`;
    await tgCall(token, 'setChatMenuButton', {
      menu_button: {
        type: 'web_app',
        text: 'Admin',
        web_app: { url: adminUrl },
      },
    });

    return new Response(JSON.stringify({ webhookUrl, telegramResponse: res }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  return new Response(JSON.stringify({ status: 'Telegram bot webhook endpoint active.' }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
