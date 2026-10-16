const DEFAULT_SETTINGS = {
  whatsappPhone: '353852850720',
  whatsappDisplay: '+353 85 285 0720',
  email: 'shineandsparkle.mm@gmail.com',
  brandName: 'Shine & Sparkle Cleaning',
  minCharge: 90,
  cities: 'Dublin, Co. Meath, Co. Louth & surrounding areas',
};

const DEFAULT_SERVICES = [
  {
    id: 'house_apartment',
    name: 'House & Apartment Cleaning',
    rate: 30,
    rateType: 'hourly',
    priceDisplay: '€30 / hr (min. 3 hrs · €90)',
    cadence: 'Regular or one-off',
    iconBg: '#E3EFFB',
    description:
      'Standard residential upkeep and maintenance cleaning tailored to client priorities. Operatives follow an agreed task list for booked hours. Cleaning products and equipment included. All prices include Irish VAT.',
    included: [
      'Kitchen worktops, surfaces, and sink sanitisation',
      'Bathrooms and toilets: toilet, sink, mirrors, and accessible surfaces',
      'Vacuuming of carpets, rugs, and all flooring',
      'Mopping of hard floors throughout',
      'Dusting of accessible furniture and surfaces',
      'Wiping doors, handles, and accessible skirting boards',
      'Internal bins emptied and relined',
    ],
    terms: [
      'Rate: €30/hr · Minimum booking: 3 hours (€90)',
      'Cleaning products and standard equipment included',
      'Deep cleaning and oven degreasing excluded (arranged separately)',
      'Parking must be available nearby (parking fees payable by client)',
    ],
  },
  {
    id: 'deep_cleaning',
    name: 'Comprehensive Deep Cleaning',
    rate: 295,
    rateType: 'fixed',
    priceDisplay: 'From €295 (Fixed by property size)',
    cadence: 'One-off or seasonal',
    iconBg: '#EAF3FB',
    description:
      'Intensive restorative clean targeting built-up grime, limescale, and neglected areas across the entire home. Fixed tiered rates: 1 Bed: €295 | 2 Bed: €325 | 3 Bed: €355 | 4+ Bed: €385. Covering Dublin, Co. Meath, and Co. Louth. VAT included.',
    included: [
      'Complete bathroom descaling, tile scrubbing, and fixture disinfection',
      'Kitchen degreasing of exterior surfaces, splashbacks, and hobs',
      'Detailed dusting of skirting boards, door frames, sockets, and switches',
      'High-reach cobweb removal and radiator dusting',
      'Intensive vacuuming of all carpeted areas and edges',
      'Deep floor washing and sanitisation of all hard floor spaces',
      'Wiping accessible furniture and interior ledges',
    ],
    terms: [
      'Pricing: 1 Bed €295 | 2 Bed €325 | 3 Bed €355 | 4+ Bed €385',
      'Professional equipment and heavy-duty supplies provided',
      'Interior oven, fridge, and window cleaning available as add-ons',
      'Nearby parking must be available (parking fees client responsibility)',
    ],
  },
  {
    id: 'end_of_tenancy',
    name: 'End of Tenancy Cleaning',
    rate: 30,
    rateType: 'hourly',
    priceDisplay: '€30 / hr (min. 3 hrs · €90)',
    cadence: 'Move-in / move-out',
    iconBg: '#D6E8F8',
    description:
      'Turnover cleaning for houses and apartments after tenant vacating. Tailored to landlord inspection and deposit return checklists according to property condition. All prices include Irish VAT.',
    included: [
      'Sanitisation of kitchen worktops, sinks, and exterior cupboards',
      'Bathroom descaling, toilet disinfection, and fixture polishing',
      'Vacuuming of carpets, rugs, and floor edges',
      'Hard floor washing and degreasing throughout',
      'Wiping doors, door handles, and accessible skirting boards',
      'Dusting accessible surfaces, window boards, and ledges',
      'Emptying and sanitising rubbish bins',
    ],
    terms: [
      'Rate: €30/hr · Minimum booking: 3 hours (€90)',
      'Cleaning products and equipment provided by prior agreement',
      'Interior oven, fridge, and window cleaning arranged separately',
      'Property must be cleared of tenant personal belongings',
      'Parking must be available near property (fees client responsibility)',
    ],
  },
  {
    id: 'post_construction',
    name: 'Post-Construction Cleaning',
    rate: 350,
    rateType: 'package',
    priceDisplay: '€350 Package (Base 5-room spec)',
    cadence: 'Post-renovation',
    iconBg: '#DCEEFA',
    description:
      'Specialised fine-dust removal and intensive clean following renovation work. Base €350 package covers: 1 Bedroom, 1 Living Room, 1 Kitchen, 1 Bathroom, 1 Hallway, plus up to 4 interior window panes. Additional rooms and glazing quoted on request. VAT included.',
    included: [
      'Complete construction dust extraction from all accessible surfaces',
      'Cleaning of 1 Bedroom, 1 Living Room, 1 Kitchen, 1 Bathroom & 1 Hallway',
      'Kitchen cabinets and empty wardrobes cleaned inside and out',
      'Sanitary fittings, tiles, and bathroom fixtures deep cleaned',
      'Up to 4 interior window panes and window frames cleaned',
      'Thorough washing of floors and detailed wiping of skirting boards',
      'Exterior dusting and wiping of major appliances',
    ],
    terms: [
      'Base package: €350 (extra rooms & panes quoted per specification)',
      'All renovation trades and construction works must be 100% completed',
      'Cupboards and wardrobes must be empty for internal cleaning',
      'Excludes removal of builder rubble or bulky construction waste',
      'Nearby parking required (applicable parking fees payable by client)',
    ],
  },
  {
    id: 'window_cleaning',
    name: 'Internal Window Cleaning Package',
    rate: 99,
    rateType: 'package',
    priceDisplay: '€99 Package (up to 20 windows)',
    cadence: 'One-off or regular',
    iconBg: '#E3EFFB',
    description:
      'Professional internal glazing and frame cleaning for up to 20 standard window units. Smear-free finish using commercial tools. Removal of dust, finger marks, and water spots. VAT included.',
    included: [
      'Internal glass cleaning of up to 20 standard windows',
      'Wiping and dusting of accessible internal window frames',
      'Cleaning of internal window sills and ledges',
      'Removal of marks, dust, and grime where accessible',
      'Streak-free drying using commercial microfiber and squeegee tools',
    ],
    terms: [
      'Fixed package: €99.00 for up to 20 standard windows',
      'Windows larger than 1.5 m² count as 2 units; bay windows count as 3',
      'Internal glass only; excludes conservatory roofs or rope access',
      'Clear, safe internal access to windows required',
      'Nearby vehicle parking required (parking fees payable by customer)',
    ],
  },
  {
    id: 'office_commercial',
    name: 'Office & Commercial Cleaning',
    rate: 35,
    rateType: 'hourly',
    priceDisplay: '€35 / hr (min. 3 hrs · €105)',
    cadence: 'Flexible / Contract-free',
    iconBg: '#EAF3FB',
    description:
      'Commercial cleaning for offices, schools, medical spaces, and childcare facilities. Available for regular visits, one-off deep cleans, or temporary staff cover. No long-term lock-in contract. €35/hr includes Irish VAT (min. 3 hours / €105).',
    included: [
      'Sanitisation of desks, accessible work surfaces, and keyboards',
      'Staff kitchen: surfaces wiped, sink and microwave cleaned',
      'Toilets and washrooms: full sanitation and mirror polishing',
      'Commercial vacuuming of carpets and damp mopping of hard floors',
      'High-touch contact point disinfection (handles, push plates)',
      'Waste bins and recycling emptied with liners replaced',
    ],
    terms: [
      'Rate: €35.00/hr (VAT included) · Minimum booking: 3 hours (€105)',
      'No contract required; one-off and scheduled services available',
      'Commercial equipment and detergents provided',
      'Service scheduled according to office operating hours',
      'Parking access required (fees client responsibility)',
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
        if (Array.isArray(kvData.services) && kvData.services.some((s) => s.id === 'renovation' || s.id === 'moveout')) {
          config = {
            ...kvData,
            services: [...DEFAULT_SERVICES],
          };
          env.CONFIG_KV.put('app_config', JSON.stringify(config)).catch(() => {});
        } else {
          config = kvData;
        }
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
