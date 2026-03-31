export interface BulletItem {
  text: string
  bold?: boolean
  subtext?: string
}

export interface CalloutItem {
  variant: 'pro' | 'warning' | 'critical'
  label?: string
  content: string
}

export interface BulletListData {
  heading?: string
  items: BulletItem[]
  variant?: 'dot' | 'number' | 'check' | 'dash'
}

export interface ChecklistSection {
  heading?: string
  items: string[]
}

export interface MythFact {
  myth: string
  fact: string
}

export const tocEntries = [
  { number: '00', title: 'Introduction', subtitle: 'Why Retention Is Everything', page: 3 },
  { number: '01', title: 'Nail Science', subtitle: 'Understanding What You\'re Bonding To', page: 4 },
  { number: '02', title: 'Prep Master System', subtitle: 'The Professional 5-Step Protocol', page: 6 },
  { number: '03', title: 'Tip Application', subtitle: 'Sizing, Etching & Placement', page: 10 },
  { number: '04', title: 'Anti-Lifting Masterclass', subtitle: 'Every Cause. Every Fix.', page: 13 },
  { number: '05', title: 'Retention Protocol', subtitle: 'The Gold Standard System', page: 18 },
  { number: '06', title: 'Common Mistakes', subtitle: 'What Not To Do', page: 20 },
  { number: '07', title: 'Pro Tips', subtitle: 'Secrets for 3–4 Week Retention', page: 21 },
  { number: '08', title: 'Aftercare', subtitle: 'Protecting Your Work', page: 22 },
]

export const introductionContent = {
  sectionNumber: '00',
  sectionLabel: 'INTRODUCTION',
  title: 'Why Retention Is Everything',
  textBlock: 'The difference between a 5-day wear and a 4-week wear isn\'t luck — it\'s precision in prep and application. 95% of lifting issues stem from prep mistakes, not product failure.',
  bulletList: {
    heading: 'When clients experience premature lifting:',
    variant: 'dash' as const,
    items: [
      { text: 'They lose trust in your skill' },
      { text: 'You spend more time on free fixes' },
      { text: 'Your professional reputation suffers' },
      { text: 'Your income is directly impacted' },
    ],
  },
  callout: {
    variant: 'critical' as const,
    content: 'Master retention = professional credibility + client loyalty + scalable income',
  },
}

export const nailScienceContent = {
  sectionNumber: '01',
  sectionLabel: 'NAIL SCIENCE',
  title: 'Understanding What You\'re Bonding To',
  nailPlate: {
    heading: 'The Nail Plate Structure',
    items: [
      { text: 'Dorsal layer', subtext: 'Top, oil-rich surface — the outermost protective layer' },
      { text: 'Intermediate layer', subtext: 'Porous and ideal for bonding — mechanical adhesion occurs here' },
      { text: 'Ventral layer', subtext: 'Thin and sensitive — closest to the nail bed' },
    ],
    callout: {
      variant: 'pro' as const,
      content: 'Buffing removes the oil-rich dorsal layer and exposes the porous intermediate layer where mechanical adhesion occurs',
    },
  },
  oilMoisture: {
    heading: 'Natural Oils & Moisture',
    text: 'The nail plate continuously produces sebum — a natural oil secreted from the surrounding skin. This oil migrates across the nail surface and creates an invisible barrier that prevents adhesion. Even after washing hands, oil quickly returns to the nail surface within minutes.',
    warningItems: [
      { text: 'Oil barrier prevents mechanical grip' },
      { text: 'Moisture causes expansion and contraction under the tip' },
      { text: 'Invisible oil residue cannot be seen but destroys adhesion' },
    ],
    callout: {
      variant: 'warning' as const,
      content: 'Even invisible oil residue left after buffing will cause lifting within days',
    },
  },
  cuticleVsPterygium: {
    heading: 'Cuticle vs Pterygium',
    cuticle: {
      title: 'Cuticle',
      text: 'The cuticle is the visible fold of skin at the base of the nail plate. Most technicians correctly identify and address this tissue. It must be softened, pushed back, and removed from the nail plate surface to ensure a clean application zone.',
    },
    pterygium: {
      title: 'Pterygium',
      text: 'Pterygium is the invisible dead tissue that grows from the cuticle directly onto the nail plate surface. It is thin, transparent, and difficult to see — yet it creates a permanent barrier between the nail plate and any product applied over it.',
    },
    callout: {
      variant: 'critical' as const,
      content: 'Most beginners only push back visible cuticle and miss the pterygium entirely — this is the #1 missed step',
    },
  },
  adhesion: {
    heading: 'How Adhesion Works',
    mechanical: {
      title: 'Mechanical Adhesion',
      text: 'Buffing and etching create a physically rough surface with microscopic peaks and valleys. When gel enters these grooves, it locks in as it cures — creating a physical grip between product and nail.',
    },
    chemical: {
      title: 'Chemical Adhesion',
      text: 'Dehydrator removes moisture and surface oils through chemical action. Primer then creates a molecular bond between the nail plate\'s keratin proteins and the gel\'s monomers. This is chemistry-level bonding that goes beyond surface contact.',
    },
    callout: {
      variant: 'critical' as const,
      content: 'Both types of adhesion are required. Skip one = guaranteed lifting',
    },
  },
}

export const prepSystemContent = {
  sectionNumber: '02',
  sectionLabel: 'PREP SYSTEM',
  title: 'The Professional 5-Step Protocol',
  steps: [
    {
      number: '01',
      title: 'Cuticle Removal',
      items: [
        { text: 'Apply cuticle remover, wait 60–90 seconds' },
        { text: 'Push cuticle back with pusher held FLAT against nail plate' },
        { text: 'Scrape nail surface to remove invisible pterygium' },
        { text: 'Clean sidewalls thoroughly — pterygium grows there too' },
        { text: 'Trim only dead tissue with nippers. Never cut living skin' },
      ],
      callouts: [
        {
          variant: 'pro' as const,
          content: 'Use a cuticle bit at 10,000–12,000 RPM for faster, more thorough pterygium removal',
        },
        {
          variant: 'warning' as const,
          content: 'Leaving cuticle remover residue on the nail interferes with adhesion. Always wipe clean.',
        },
      ],
    },
    {
      number: '02',
      title: 'Buffing',
      text: 'The goal of buffing is to remove the shiny oil-rich top layer of the nail plate (dorsal layer) and expose the porous intermediate layer beneath. A correctly buffed nail will appear completely matte — no reflective spots whatsoever.',
      items: [
        { text: 'Use 180-grit buffer or medium block' },
        { text: 'Buff until entire nail is matte — no shiny spots remain' },
        { text: 'Light, even pressure. Remove shine, don\'t thin the nail' },
        { text: 'Focus on nail bed area — where the tip will sit' },
      ],
      callouts: [
        {
          variant: 'warning' as const,
          content: 'Stop as soon as the nail is matte. Over-buffing damages the nail plate and weakens the structure.',
        },
      ],
    },
    {
      number: '03',
      title: 'Cleansing',
      items: [
        { text: 'Saturate lint-free wipe with 70–99% isopropyl alcohol' },
        { text: 'Use a fresh wipe section for each nail' },
        { text: 'Wipe cuticle area and sidewalls thoroughly' },
        { text: 'Air dry 5–10 seconds. Do NOT blow on nails (adds moisture)' },
      ],
      callouts: [
        {
          variant: 'pro' as const,
          content: 'Reusing the same wipe section just redistributes dust across the nail — always move to a clean section',
        },
      ],
    },
    {
      number: '04',
      title: 'Dehydration',
      items: [
        { text: 'Apply dehydrator to entire nail surface — one thin coat' },
        { text: 'Let air dry completely (15–30 seconds)' },
        { text: 'Nail should look chalky/matte when dry' },
        { text: 'Do not over-apply — one coat is sufficient' },
      ],
      callouts: [
        {
          variant: 'critical' as const,
          content: 'DEHYDRATOR BEFORE PRIMER — always. Reversing this order strips the primer\'s bonding agents and ruins adhesion.',
        },
      ],
    },
    {
      number: '05',
      title: 'Primer',
      items: [
        { text: 'Apply thin coat of primer to natural nail only' },
        { text: 'Avoid skin, cuticles, and sidewalls' },
        { text: 'Let air dry 30–60 seconds until surface is slightly tacky' },
      ],
      callouts: [
        {
          variant: 'pro' as const,
          content: 'Less is more — a tiny amount of primer goes a long way. Excess primer doesn\'t improve adhesion and can cause over-bonding.',
        },
      ],
    },
  ],
}

export const tipApplicationContent = {
  sectionNumber: '03',
  sectionLabel: 'TIP APPLICATION',
  title: 'Sizing, Etching & Placement',
  sizing: {
    heading: 'Tip Sizing',
    items: [
      { text: 'Hold tip against nail before applying gel — dry fit only' },
      { text: 'Tip must fit sidewall to sidewall with zero gaps' },
      { text: 'Should sit close to cuticle without touching skin' },
      { text: 'If between sizes, choose the larger size and file to fit' },
      { text: 'Size each nail individually — every finger is different' },
    ],
    callout: {
      variant: 'warning' as const,
      content: 'Gaps at sidewalls create weak points where water enters and lifting begins. Never force an undersized tip.',
    },
  },
  etching: {
    heading: 'Tip Etching',
    intro: 'The inside of every Gel-X tip is smooth and glossy. Without etching, gel has no texture to grip — it will slide and lift.',
    chemical: {
      title: 'Chemical Method',
      text: 'Apply Gel-X Prep solution to the interior of the tip. Scrub gently until the surface turns from glossy to a dull matte finish. Wipe clean and allow to dry fully before applying gel.',
    },
    efile: {
      title: 'E-File Method',
      text: 'Use a ceramic cone bit at 15,000–20,000 RPM across the entire interior surface. Remove all dust with a clean brush. Apply non-acid primer before gel application.',
    },
    callout: {
      variant: 'critical' as const,
      content: 'Etch the ENTIRE nail bed area — not just the center. Skipping the edges causes sidewall lifting.',
    },
  },
  gelApplication: {
    heading: 'Gel Application',
    items: [
      { text: 'Apply thin layer of extend gel across entire tip interior' },
      { text: 'Add small bead near cuticle zone (highest stress area)' },
      { text: 'Amount: fills gap when pressed, does not overflow' },
    ],
    amounts: [
      { label: 'Too Little', effect: 'Air pockets form → weak bond at center' },
      { label: 'Too Much', effect: 'Flooding occurs → gel touches cuticle skin → lifting' },
      { label: 'Just Right', effect: 'Spreads to all edges, minimal excess, clean cuticle line' },
    ],
    callout: {
      variant: 'pro' as const,
      content: 'Start conservative — you can always add more. You cannot remove gel once flooding occurs.',
    },
  },
  placement: {
    heading: 'Placement & Curing',
    items: [
      { text: 'Press from cuticle first, roll pressure toward free edge' },
      { text: 'Hold firm without moving — zero movement during flash cure' },
      { text: 'Flash cure: 5–10 seconds to secure placement' },
      { text: 'Adjust placement if needed before full cure' },
      { text: 'Full cure: 60 seconds minimum in 48W+ LED lamp' },
    ],
    callout: {
      variant: 'warning' as const,
      content: 'Under-curing creates a permanently weak bond. Replace lamp bulbs if old — they lose curing strength over time.',
    },
  },
}

export const antiLiftingCauses = [
  {
    number: '01',
    name: 'Oil Left on Natural Nail',
    whatItIs: 'Sebum and environmental oils coating the nail plate surface, often invisible to the naked eye.',
    whyItLifts: 'Oil creates a molecular barrier that prevents both mechanical and chemical adhesion from forming.',
    howToPrevent: [
      'Always buff before dehydrating — buffing disrupts the oil layer',
      'Apply dehydrator immediately after buffing, before oil returns',
      'Do not touch the nail surface after dehydrating',
    ],
  },
  {
    number: '02',
    name: 'Pterygium Not Removed',
    whatItIs: 'Thin, transparent dead tissue that grows from the cuticle onto the nail plate surface.',
    whyItLifts: 'Pterygium sits between the nail plate and the tip — creating a permanent separation layer at the cuticle zone.',
    howToPrevent: [
      'Use cuticle remover and a flat pusher to scrape the nail plate',
      'Check sidewalls — pterygium grows there too',
      'Use an e-file cuticle bit for thorough, consistent removal',
    ],
  },
  {
    number: '03',
    name: 'Under-Buffing (Nail Still Shiny)',
    whatItIs: 'Insufficient buffing that leaves the oil-rich dorsal layer intact in patches across the nail.',
    whyItLifts: 'Shiny areas are the oil-rich dorsal layer — gel cannot mechanically grip a smooth, oily surface.',
    howToPrevent: [
      'Buff under bright lighting and check from multiple angles',
      'The nail must appear 100% matte — zero reflective patches',
      'Pay extra attention to sidewalls and near the cuticle',
    ],
  },
  {
    number: '04',
    name: 'Over-Buffing (Nail Plate Damaged)',
    whatItIs: 'Excessive buffing that thins the nail plate beyond the intermediate layer into the ventral layer.',
    whyItLifts: 'A thinned, weakened nail plate flexes and bends more than a healthy nail — causing the rigid tip to pop off.',
    howToPrevent: [
      'Stop buffing the moment the nail goes matte',
      'Use light, even pressure — never aggressive back-and-forth motion',
      'If client\'s nails feel thin, use 220-grit buffer instead',
    ],
  },
  {
    number: '05',
    name: 'Dust Left on Nail After Buffing',
    whatItIs: 'Fine nail dust particles remaining on the nail surface after buffing, before cleansing.',
    whyItLifts: 'Dust acts as a physical barrier preventing the dehydrator and primer from reaching the nail plate surface.',
    howToPrevent: [
      'Always wipe with a fresh lint-free alcohol wipe after buffing',
      'Use a clean, dry brush to remove dust before wiping',
      'Check for remaining dust before applying dehydrator',
    ],
  },
  {
    number: '06',
    name: 'Moisture Trapped Under Tip',
    whatItIs: 'Water or moisture sealed between the natural nail and the Gel-X tip during application.',
    whyItLifts: 'Moisture expands and contracts with temperature changes, forcing the tip away from the nail plate over time.',
    howToPrevent: [
      'Do not blow on nails — exhaled breath contains moisture',
      'Allow dehydrator to fully dry (15–30 seconds) before proceeding',
      'Ensure client\'s hands are dry before starting prep',
    ],
  },
  {
    number: '07',
    name: 'Primer Applied Before Dehydrator',
    whatItIs: 'Reversing the correct order of dehydrator and primer application.',
    whyItLifts: 'Primer requires a dehydrated, moisture-free surface to form its molecular bonds. Moisture destroys primer chemistry.',
    howToPrevent: [
      'Always: dehydrator → dry → primer → dry → tip application',
      'Never skip the drying step between products',
      'Label your bottles or arrange them left-to-right in order of use',
    ],
  },
  {
    number: '08',
    name: 'Tip Not Etched (Smooth Interior)',
    whatItIs: 'Using a Gel-X tip without first roughening the smooth, glossy interior surface.',
    whyItLifts: 'Gel cannot grip a smooth plastic surface — it slides during curing and lifts cleanly once stress is applied.',
    howToPrevent: [
      'Etch every tip before application without exception',
      'Check that the entire interior surface is matte after etching',
      'Pre-etch all 10 tips before beginning gel application for efficiency',
    ],
  },
  {
    number: '09',
    name: 'Incorrect Tip Size (Gaps at Sidewalls)',
    whatItIs: 'Using a tip that is too narrow, leaving visible gaps between the tip edges and the natural nail sidewalls.',
    whyItLifts: 'Gaps allow water to enter and pool beneath the tip. Repeated moisture exposure destroys adhesion from the sides inward.',
    howToPrevent: [
      'Dry-fit every tip before applying any gel',
      'Choose the larger size and file down if between sizes',
      'Size nails individually — dominant hand often differs from non-dominant',
    ],
  },
  {
    number: '10',
    name: 'Air Bubbles Trapped During Application',
    whatItIs: 'Air pockets sealed between the natural nail surface and the interior of the Gel-X tip during press-on.',
    whyItLifts: 'Air bubbles create uncured voids — areas with zero adhesion. These weak points expand under pressure and cause separation.',
    howToPrevent: [
      'Press from the cuticle zone first, rolling toward the free edge',
      'Apply firm, even pressure — do not bounce or readjust once contact is made',
      'Use the correct gel amount — too little gel causes air pockets',
    ],
  },
  {
    number: '11',
    name: 'Too Much Gel (Flooding at Cuticle)',
    whatItIs: 'Excess extend gel that flows onto the cuticle skin or surrounding tissue during tip application.',
    whyItLifts: 'Gel bonded to skin — not nail plate — creates a lever effect. As skin moves and flexes, it pulls the tip away from the nail.',
    howToPrevent: [
      'Start with a conservative gel amount — add more if needed',
      'Before flash cure, use an acetone brush to clean the cuticle line',
      'Hold the tip at a slight angle when pressing to allow excess gel to push toward the free edge',
    ],
  },
  {
    number: '12',
    name: 'Touching Nail After Prep',
    whatItIs: 'Any contact between a prepped nail surface and fingers, tools, or surfaces after dehydrator and primer have been applied.',
    whyItLifts: 'Human skin transfers oils instantly on contact. A single touch after primer application completely compromises the adhesion chemistry.',
    howToPrevent: [
      'After dehydrator and primer: touch nothing except the tip and gel applicator',
      'Train the habit of holding nails without contacting the nail plate',
      'Work one nail at a time from prep through application',
    ],
  },
]

export const antiLiftingSectionCallout: CalloutItem = {
  variant: 'critical',
  content: 'Where lifting starts tells you exactly what went wrong:\nCuticle area → pterygium or flooding\nSidewalls → sizing or etching issue\nFull pop-off → adhesion failure (prep or curing)',
}

export const retentionProtocolContent = {
  sectionNumber: '05',
  sectionLabel: 'PROTOCOL',
  title: 'The Gold Standard System',
  prepPhase: [
    'Pterygium removed (not just pushed back)',
    'Entire nail buffed to matte',
    'Dust removed with fresh wipe per nail',
    'Dehydrator applied FIRST and dried',
    'Primer applied after dehydrator',
  ],
  applicationPhase: [
    'Tips sized individually per nail',
    'All tips etched (entire interior)',
    'Correct gel amount used',
    'Firm rolling pressure applied',
    'Flash cured before moving on',
    'Full cure 60+ seconds',
    'Cuticle area inspected + cleaned',
  ],
  callout: {
    variant: 'critical' as const,
    content: 'If ANY box is unchecked, retention is compromised. There are no optional steps.',
  },
}

export const commonMistakesContent = {
  sectionNumber: '06',
  sectionLabel: 'MISTAKES',
  title: 'What Not To Do',
  beginner: [
    { text: 'Only pushing cuticle back (pterygium remains)' },
    { text: 'Under-buffing — leaving shiny spots' },
    { text: 'Skipping dehydrator' },
    { text: 'Not etching tips' },
    { text: 'Using too much gel (flooding)' },
    { text: 'Under-curing' },
  ],
  advanced: [
    { text: 'Applying primer before dehydrator' },
    { text: 'Touching prepped nails with bare fingers' },
    { text: 'Reusing dirty wipe sections' },
    { text: 'Etching center only, missing edges' },
    { text: 'Ignoring small cuticle flooding' },
    { text: 'Using same tip size for all nails' },
  ],
}

export const proTipsContent = {
  sectionNumber: '07',
  sectionLabel: 'PRO TIPS',
  title: 'Secrets for 3–4 Week Retention',
  tips: [
    {
      text: 'Very oily nails',
      bold: true,
      subtext: 'Use acid-based primer + double dehydrate. Set realistic expectations: 2–3 weeks instead of 4.',
    },
    {
      text: 'Pre-etch all 10 tips before starting',
      bold: true,
      subtext: 'Faster workflow, consistent quality. Lay all sized + etched tips in order before picking up any gel.',
    },
    {
      text: 'Detail brush + acetone at cuticle line',
      bold: true,
      subtext: 'Before final cure, use a small brush with acetone to blend excess gel at the cuticle edge cleanly.',
    },
    {
      text: 'Diagnose by location',
      bold: true,
      subtext: 'Cuticle lift = pterygium or flooding. Side lift = sizing or etching. Full pop-off = adhesion failure.',
    },
  ],
}

export const aftercareContent = {
  sectionNumber: '08',
  sectionLabel: 'AFTERCARE',
  title: 'Protecting Your Work',
  whatToDo: [
    { text: 'Avoid water for 2 hours after application' },
    { text: 'Wear gloves for dishes, cleaning, gardening' },
    { text: 'Apply cuticle oil to nail edges daily' },
    { text: 'Book maintenance in 2–4 weeks' },
  ],
  whatRuins: [
    { text: 'Excessive water/soaking' },
    { text: 'Harsh chemicals (bleach, cleaning products)' },
    { text: 'Picking or peeling at tips' },
    { text: 'Heavy oil-based hand creams' },
    { text: 'Not using cuticle oil' },
  ],
  note: 'Give every client a printed aftercare card at the end of every appointment. Educated clients get better retention — and send more referrals.',
}

export const mythsVsFacts: MythFact[] = [
  {
    myth: 'More primer = stronger bond',
    fact: 'Excess primer weakens bond. One thin layer is optimal.',
  },
  {
    myth: 'Buffing harder improves retention',
    fact: 'Over-buffing damages nails. Stop when matte.',
  },
  {
    myth: 'Alcohol prep is enough',
    fact: 'Dehydrator removes moisture alcohol cannot reach.',
  },
  {
    myth: 'Gel-X lasts 1 week max',
    fact: 'With proper prep, 3–4 weeks is standard.',
  },
  {
    myth: 'Lifting is the product\'s fault',
    fact: '95% of lifting is prep error, not product failure.',
  },
  {
    myth: 'Skip etching pre-made tips',
    fact: 'Smooth tips = no grip. Etching is non-negotiable.',
  },
]

export const fullChecklistContent = {
  title: 'Your Complete Retention Checklist',
  subtitle: 'Use before every single appointment',
  sections: [
    {
      heading: 'PREP',
      items: [
        'Pterygium removed from entire nail plate',
        'Nail buffed to complete matte — no shiny spots',
        'Dust removed with fresh wipe per nail',
        'Dehydrator applied and fully dried',
        'Primer applied correctly after dehydrator',
      ],
    },
    {
      heading: 'TIP PREPARATION',
      items: [
        'Each tip sized individually',
        'All tips etched — entire interior',
        'Tip dust removed before application',
      ],
    },
    {
      heading: 'APPLICATION',
      items: [
        'Correct gel amount (thin layer + cuticle bead)',
        'Firm rolling pressure from cuticle to tip',
        'Flash cured before moving to next nail',
        'Full cure 60+ seconds in 48W+ lamp',
        'Cuticle area inspected — no gap, no flooding',
      ],
    },
  ],
}
