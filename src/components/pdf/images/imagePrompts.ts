export interface ImagePrompt {
  id: string
  section: string
  label: string
  usage: string
  prompt: string
}

export const imagePrompts: ImagePrompt[] = [
  {
    id: 'cover-hero',
    section: 'cover',
    label: 'Cover Hero Image',
    usage: 'Cover page background or hero visual',
    prompt: 'Macro close-up of flawlessly applied Gel-X nails on elegant hands, champagne and nude tones, soft bokeh background, premium studio lighting, ultra-realistic, editorial beauty photography, neutral beige surface, negative space on left side',
  },
  {
    id: 'nail-anatomy',
    section: 'nail-science',
    label: 'Nail Plate Structure',
    usage: 'Illustrates nail anatomy section',
    prompt: 'Extreme macro photograph of natural fingernail surface, clean unpolished nail, visible nail layers, soft diffused studio lighting, clean white background, ultra-realistic, high-detail beauty photography, medical educational aesthetic',
  },
  {
    id: 'oil-on-nail',
    section: 'nail-science',
    label: 'Oil Barrier Visualization',
    usage: 'Shows why nail oils prevent adhesion',
    prompt: 'Macro close-up of natural fingernail with visible glossy oil sheen on surface, skin texture visible at cuticle, soft warm studio lighting, minimal cream background, ultra-realistic, beauty education photography style',
  },
  {
    id: 'pterygium-before',
    section: 'prep',
    label: 'Pterygium Present (Before)',
    usage: 'Shows invisible dead tissue on nail plate',
    prompt: 'Extreme macro close-up of natural fingernail with thin transparent pterygium tissue visible growing onto nail plate from cuticle, soft warm lighting, cream/beige background, ultra-realistic, high-detail nail education photography',
  },
  {
    id: 'pterygium-after',
    section: 'prep',
    label: 'Pterygium Removed (After)',
    usage: 'Shows clean nail plate after pterygium removal',
    prompt: 'Macro close-up of clean natural fingernail with cuticle pushed back and pterygium completely removed, smooth nail plate, clean cuticle line, soft studio lighting, minimal white/cream background, luxury nail education aesthetic, ultra-realistic',
  },
  {
    id: 'buffed-vs-unbuffed',
    section: 'prep',
    label: 'Buffed vs Unbuffed Nail',
    usage: 'Comparison for buffing step',
    prompt: 'Side by side macro photograph: left nail glossy and reflective (unbuffed), right nail completely matte and dull (correctly buffed), clean natural hands, soft studio lighting, white background, nail education comparison style, ultra-realistic',
  },
  {
    id: 'dehydrator-application',
    section: 'prep',
    label: 'Dehydrator Application',
    usage: 'Shows dehydrator being applied to nail',
    prompt: 'Close-up of small brush applying clear dehydrator solution to matte natural fingernail, clean cuticle line, soft directional studio lighting, neutral beige background, premium nail product photography, ultra-realistic',
  },
  {
    id: 'tip-sizing',
    section: 'application',
    label: 'Correct Tip Sizing',
    usage: 'Shows perfect tip fit sidewall to sidewall',
    prompt: 'Close-up of Gel-X extension tip being dry-fitted against natural fingernail, tip touching both sidewalls perfectly with no gaps, elegant hands, soft studio lighting, clean cream background, luxury nail education photography, ultra-realistic',
  },
  {
    id: 'tip-etching',
    section: 'application',
    label: 'Tip Etching Process',
    usage: 'Shows e-file etching inside tip',
    prompt: 'Close-up of nail technician using small e-file ceramic bit to etch inside of Gel-X nail tip, matte interior texture visible, soft professional lighting, clean white background, nail tech education photography, ultra-realistic',
  },
  {
    id: 'gel-bead-correct',
    section: 'application',
    label: 'Correct Gel Bead Placement',
    usage: 'Shows proper gel amount inside tip',
    prompt: 'Macro close-up of inside of Gel-X nail tip showing correct amount of clear extend gel, thin layer with small bead near cuticle zone, soft studio lighting, neutral background, nail education photography, ultra-realistic',
  },
  {
    id: 'flooding-vs-correct',
    section: 'anti-lifting',
    label: 'Flooding vs Correct Cuticle Line',
    usage: 'Anti-lifting section comparison',
    prompt: 'Side by side close-up: left shows Gel-X nail with gel flooding onto cuticle skin (incorrect), right shows perfect clean cuticle line with 1mm gap (correct), soft studio lighting, white background, nail education comparison, ultra-realistic',
  },
  {
    id: 'air-bubble',
    section: 'anti-lifting',
    label: 'Air Bubble Under Tip',
    usage: 'Shows trapped air causing weak bond',
    prompt: 'Macro close-up of Gel-X nail extension with visible trapped air bubble between tip and natural nail, side view showing gap, soft lighting, clean background, educational nail photography, ultra-realistic',
  },
  {
    id: 'lifting-cuticle',
    section: 'anti-lifting',
    label: 'Cuticle Area Lifting',
    usage: 'Shows lifting starting at cuticle',
    prompt: 'Close-up of Gel-X nail extension beginning to lift at cuticle area, visible separation between tip and natural nail near cuticle, educational illustration, soft studio lighting, neutral background, ultra-realistic nail photography',
  },
  {
    id: 'perfect-finish',
    section: 'closing',
    label: 'Perfect Finished Gel-X Set',
    usage: 'Closing page / aspirational result',
    prompt: 'Macro close-up of flawlessly finished Gel-X nail set, clean cuticle lines, no lifting, elegant nude/champagne nail color, beautiful hands, premium studio lighting, cream and gold background tones, luxury beauty editorial aesthetic, ultra-realistic, aspirational',
  },
]
