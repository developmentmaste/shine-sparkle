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

  return new Response(JSON.stringify(config), {
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
    const newSettings = body.settings ? { ...DEFAULT_SETTINGS, ...body.settings } : memoryConfig.settings;
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
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
