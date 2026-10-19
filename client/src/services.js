import houseIcon from './assets/service-house.svg';
import deepIcon from './assets/service-deep.svg';
import tenancyIcon from './assets/service-tenancy.svg';
import constructionIcon from './assets/service-construction.svg';
import windowIcon from './assets/service-window.svg';
import officeIcon from './assets/service-office.svg';

export const SERVICE_ICONS = {
  house_apartment: houseIcon,
  deep_cleaning: deepIcon,
  end_of_tenancy: tenancyIcon,
  post_construction: constructionIcon,
  window_cleaning: windowIcon,
  office_commercial: officeIcon,
};

const ICON_FALLBACK_ORDER = [
  houseIcon,
  deepIcon,
  tenancyIcon,
  constructionIcon,
  windowIcon,
  officeIcon,
];

export function resolveServiceIcon(service, index = 0) {
  if (service?.id && SERVICE_ICONS[service.id]) {
    return SERVICE_ICONS[service.id];
  }
  const name = (service?.name || '').toLowerCase();
  if (name.includes('house') || name.includes('apartment')) return houseIcon;
  if (name.includes('deep')) return deepIcon;
  if (name.includes('tenancy') || name.includes('move')) return tenancyIcon;
  if (name.includes('construction') || name.includes('renovation') || name.includes('build')) return constructionIcon;
  if (name.includes('window')) return windowIcon;
  if (name.includes('office') || name.includes('commercial')) return officeIcon;
  if (service?.icon && !String(service.icon).includes('svgrepo')) {
    return service.icon;
  }
  return ICON_FALLBACK_ORDER[index % ICON_FALLBACK_ORDER.length];
}

export const SERVICES = [
  {
    id: 'house_apartment',
    name: 'House & Apartment Cleaning',
    rate: 30,
    rateType: 'hourly',
    priceDisplay: '€30 / hr (min. 3 hrs · €90)',
    cadence: 'Regular or one-off',
    iconBg: '#E3EFFB',
    icon: houseIcon,
    description:
      'Standard residential upkeep and maintenance cleaning tailored to client priorities. Operatives follow an agreed task list for booked hours. Cleaning products and equipment included. Transparent final pricing with no hidden charges.',
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
    icon: deepIcon,
    description:
      'Intensive restorative clean targeting built-up grime, limescale, and neglected areas across the entire home. Fixed tiered rates: 1 Bed: €295 | 2 Bed: €325 | 3 Bed: €355 | 4+ Bed: €385. Covering Dublin, Co. Meath, and Co. Louth. Final price with no hidden fees.',
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
    icon: tenancyIcon,
    description:
      'Turnover cleaning for houses and apartments after tenant vacating. Tailored to landlord inspection and deposit return checklists according to property condition. Transparent final rates with no hidden charges.',
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
    icon: constructionIcon,
    description:
      'Specialised fine-dust removal and intensive clean following renovation work. Base €350 package covers: 1 Bedroom, 1 Living Room, 1 Kitchen, 1 Bathroom, 1 Hallway, plus up to 4 interior window panes. Additional rooms and glazing quoted on request. Final package price with no hidden charges.',
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
    icon: windowIcon,
    description:
      'Professional internal glazing and frame cleaning for up to 20 standard window units. Smear-free finish using commercial tools. Removal of dust, finger marks, and water spots. Fixed final price with no hidden fees.',
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
    icon: officeIcon,
    description:
      'Commercial cleaning for offices, schools, medical spaces, and childcare facilities. Available for regular visits, one-off deep cleans, or temporary staff cover. No long-term lock-in contract. €35/hr final rate with official invoicing (min. 3 hours / €105).',
    included: [
      'Sanitisation of desks, accessible work surfaces, and keyboards',
      'Staff kitchen: surfaces wiped, sink and microwave cleaned',
      'Toilets and washrooms: full sanitation and mirror polishing',
      'Commercial vacuuming of carpets and damp mopping of hard floors',
      'High-touch contact point disinfection (handles, push plates)',
      'Waste bins and recycling emptied with liners replaced',
    ],
    terms: [
      'Rate: €35.00/hr (final rate, no hidden fees) · Minimum booking: 3 hours (€105)',
      'No contract required; one-off and scheduled services available',
      'Commercial equipment and detergents provided',
      'Service scheduled according to office operating hours',
      'Parking access required (fees client responsibility)',
    ],
  },
];

export const MIN_CHARGE = 90;