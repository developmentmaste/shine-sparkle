const DEFAULT_SETTINGS = {
  whatsappPhone: '353852850720',
  whatsappDisplay: '+353 85 285 0720',
  email: 'shineandsparkle.mm@gmail.com',
  brandName: 'Shine & Sparkle Cleaning',
  minCharge: 40,
  cities: 'Dublin & surrounding areas',
};

const DEFAULT_SERVICES = [
  {
    id: 'regular',
    name: 'Regular cleaning',
    rate: 0.9,
    cadence: 'weekly or biweekly',
    iconBg: '#E3EFFB',
    description:
      'Upkeep cleaning for apartments already in decent shape. The same cleaner returns each visit so they learn your space and preferences over time.',
    included: [
      'Kitchen surfaces and sink',
      'Bathroom and fixtures',
      'Floors, vacuumed and mopped',
      'Dusting and bed making',
    ],
  },
  {
    id: 'deep',
    name: 'Deep cleaning',
    rate: 1.8,
    cadence: 'one-time or seasonal',
    iconBg: '#EAF3FB',
    description:
      "A thorough clean for spaces that haven't had attention in a while, or before a big event. Takes longer than a regular visit and covers spots that get skipped week to week.",
    included: [
      'Inside oven and fridge',
      'Windows, sills, and frames',
      'Baseboards and door frames',
      'Grout and tile scrubbing',
    ],
  },
  {
    id: 'renovation',
    name: 'Post-renovation cleaning',
    rate: 2.5,
    cadence: 'one-time',
    iconBg: '#DCEEFA',
    description:
      'Built for the mess renovations leave behind: fine dust on every surface, paint specks, and adhesive residue. Crews bring heavier-duty equipment for this one.',
    included: [
      'Construction dust removal',
      'Paint and adhesive residue',
      'Air vents and light fixtures',
      'Final polish on all surfaces',
    ],
  },
  {
    id: 'moveout',
    name: 'Move-out cleaning',
    rate: 1.3,
    cadence: 'one-time',
    iconBg: '#D6E8F8',
    description:
      'Designed to satisfy landlords, property managers, and incoming tenants. Leaves every surface move-in ready and deposit-safe.',
    included: [
      'Inside all empty cabinets and drawers',
      'Full kitchen degreasing and appliance clean',
      'Deep bathroom disinfection and scale removal',
      'All floors, carpets, and skirting boards',
    ],
  },
];

// Fallback in-memory cache for Cloudflare Worker instance
let memoryConfig = {
  settings: { ...DEFAULT_SETTINGS },
  services: [...DEFAULT_SERVICES],
};

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
    console.error('Error verifying Telegram WebApp data in config:', err);
  }
  return null;
}

async function isUserAuthorized(env, userId) {
  const strId = String(userId);
  const envAdminIds = (env.TELEGRAM_ADMIN_IDS || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

  if (envAdminIds.includes(strId)) return true;

  if (env.CONFIG_KV) {
    try {
      const data = await env.CONFIG_KV.get('authorized_admins', 'json');
      if (Array.isArray(data) && data.includes(strId)) return true;
    } catch (e) {}
  }
  return false;
}

export async function onRequestGet(context) {
  const { env } = context;
  let config = memoryConfig;

  if (env.CONFIG_KV) {
    try {
      const kvData = await env.CONFIG_KV.get('app_config', 'json');
      if (kvData) {
        config = kvData;
      }
    } catch (e) {
      console.error('KV read error:', e);
    }
  }

  // Ensure sensitive fields are never returned in public config
  const safeConfig = {
    settings: { ...config.settings },
    services: config.services,
  };
  delete safeConfig.settings.adminPin;

  return new Response(JSON.stringify(safeConfig), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache',
    },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();

    // Verify admin authorization
    const adminKey = request.headers.get('x-admin-key');
    const initData = request.headers.get('x-telegram-init-data') || body.initData;

    let authorized = false;

    if (env.ADMIN_API_KEY && adminKey && adminKey === env.ADMIN_API_KEY) {
      authorized = true;
    } else if (env.TELEGRAM_BOT_TOKEN && initData) {
      const verifiedUser = await verifyTelegramWebAppData(initData, env.TELEGRAM_BOT_TOKEN);
      if (verifiedUser && verifiedUser.id) {
        authorized = await isUserAuthorized(env, verifiedUser.id);
      }
    } else if (!env.TELEGRAM_BOT_TOKEN && !env.ADMIN_API_KEY && !env.CONFIG_KV) {
      // Local dev fallback only
      authorized = true;
    }

    if (!authorized) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Valid admin authentication required to update configuration.' }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const newSettings = body.settings ? { ...DEFAULT_SETTINGS, ...body.settings } : memoryConfig.settings;
    delete newSettings.adminPin;

    const newServices = Array.isArray(body.services) && body.services.length > 0 ? body.services : memoryConfig.services;

    const newConfig = {
      settings: newSettings,
      services: newServices,
    };

    memoryConfig = newConfig;

    if (env.CONFIG_KV) {
      await env.CONFIG_KV.put('app_config', JSON.stringify(newConfig));
    }

    return new Response(JSON.stringify({ success: true, ...newConfig }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Telegram-Init-Data, X-Admin-Key',
    },
  });
}
