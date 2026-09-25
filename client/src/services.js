import mopIcon from './assets/cleaning-mop-svgrepo-com.svg';
import serviceIcon from './assets/cleaning-service-svgrepo-com.svg';
import outIcon from './assets/out-svgrepo-com.svg';
import renovationIcon from './assets/refresh-home-svgrepo-com.svg';

export const SERVICES = [
  {
    id: 'regular',
    name: 'Regular cleaning',
    rate: 0.9,
    cadence: 'weekly or biweekly',
    iconBg: '#E3EFFB',
    icon: mopIcon,
    description:
      "Upkeep cleaning for apartments already in decent shape. The same cleaner returns each visit so they learn your space and preferences over time.",
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
    icon: serviceIcon,
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
    icon: renovationIcon,
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
    icon: outIcon,
    description:
      "Timed for lease turnovers, so you get your deposit back without spending your last weekend scrubbing. Includes the spots most landlord checklists look at first.",
    included: [
      'Cabinets, inside and out',
      'Appliances, deep cleaned',
      'Bathroom descaling',
      'Closets and storage areas',
    ],
  },
];

export const MIN_CHARGE = 25;