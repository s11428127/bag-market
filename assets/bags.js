// 每款包的「示意圖」：自己畫的 SVG 線稿，抓外型特徵，不用品牌官方照片（有著作權）、不畫商標。
// 顏色全部走 CSS（currentColor / .b .f .p 類別），暗色模式自動跟著換。
// 想換成自己拍的照片：在 data/models.json 那一款加 "img": "img/xxx.jpg"，就會優先顯示照片。

const pat = {
  quilt: (id, s = 12) => `<pattern id="${id}" width="${s}" height="${s}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V${s}M0 0H${s}" class="p"/></pattern>`,
  dots: id => `<pattern id="${id}" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="1" class="pd"/></pattern>`,
  check: id => `<pattern id="${id}" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="5" height="5" class="pd"/><rect x="5" y="5" width="5" height="5" class="pd"/></pattern>`,
  stripes: id => `<pattern id="${id}" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 3H6" class="p"/></pattern>`,
  chevron: id => `<pattern id="${id}" width="10" height="8" patternUnits="userSpaceOnUse"><path d="M1 6L5 2L9 6" class="p"/></pattern>`,
  ychev: id => `<pattern id="${id}" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M1 1L4 4L7 1M4 4V7" class="p"/></pattern>`,
  weave: id => `<pattern id="${id}" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M0 2.5H5M5 7.5H10M7.5 0V5M2.5 5V10" class="p"/></pattern>`,
};
const fillP = (id, d) => `<path d="${d}" fill="url(#${id})" stroke="none"/>`;
const chain = d => `<path d="${d}" class="ch"/>`;

const BAGS = {
  'hermes-birkin-25': `
    <path d="M38 42C38 16 56 16 56 42M64 42C64 16 82 16 82 42" class="h"/>
    <path d="M18 42H102L108 92H12Z" class="b"/>
    <path d="M18 42H102L100 60H20Z" class="f"/>
    <rect x="33" y="52" width="7" height="14" rx="1" class="f"/><rect x="80" y="52" width="7" height="14" rx="1" class="f"/>
    <rect x="53" y="55" width="14" height="8" rx="2" class="m"/>
    <path d="M60 63V68" /><rect x="55" y="68" width="10" height="9" rx="2" class="m"/>`,

  'hermes-kelly-25': `
    <path d="M18 50C10 10 110 10 102 50" class="thin"/>
    <path d="M46 46C46 22 74 22 74 46" class="h"/>
    <path d="M22 46H98L106 92H14Z" class="b"/>
    <path d="M22 46H98L95 66H25Z" class="f"/>
    <rect x="22" y="56" width="76" height="6" class="f"/>
    <rect x="54" y="54" width="12" height="11" rx="2" class="m"/>`,

  'chanel-classic-flap-m': `${pat.quilt('q-ccf')}
    ${chain('M24 42C22 6 98 6 96 42')}
    <rect x="16" y="40" width="88" height="52" rx="4" class="b"/>${fillP('q-ccf', 'M16 44q0-4 4-4h80q4 0 4 4v44q0 4-4 4H20q-4 0-4-4z')}
    <path d="M16 40H104V68H16Z" class="f"/>${fillP('q-ccf', 'M16 40H104V68H16Z')}
    <rect x="53" y="63" width="14" height="9" rx="3" class="m"/>`,

  'chanel-19': `${pat.quilt('q-c19', 18)}
    ${chain('M22 40C18 2 102 2 98 40')}<path d="M22 40C18 2 102 2 98 40" class="thin"/>
    <rect x="14" y="36" width="92" height="56" rx="10" class="b"/>${fillP('q-c19', 'M24 36H96Q106 36 106 46V82Q106 92 96 92H24Q14 92 14 82V46Q14 36 24 36Z')}
    <path d="M14 46Q14 36 24 36H96Q106 36 106 46V62Q60 70 14 62Z" class="f"/>
    <rect x="54" y="60" width="12" height="8" rx="3" class="m"/>`,

  'lv-neverfull-mm': `${pat.check('c-nf')}
    <path d="M30 40C34 6 50 6 52 40M68 40C70 6 86 6 90 40" class="thin"/>
    <path d="M8 40H112L96 92H24Z" class="b"/>${fillP('c-nf', 'M8 40H112L96 92H24Z')}
    <path d="M8 40H112L111 45H9Z" class="f"/>
    <path d="M14 46L22 56M106 46L98 56" class="thin"/>`,

  'lv-speedy-25-b': `${pat.check('c-sp')}
    <path d="M18 54C10 6 110 6 102 54" class="thin"/>
    <path d="M40 34C40 18 54 18 54 34M66 34C66 18 80 18 80 34" class="h"/>
    <path d="M14 90V54C14 36 30 30 60 30S106 36 106 54V90Z" class="b"/>${fillP('c-sp', 'M14 90V54C14 36 30 30 60 30S106 36 106 54V90Z')}
    <path d="M22 38C40 32 80 32 98 38" class="zip"/>
    <rect x="90" y="40" width="8" height="10" rx="2" class="m"/>`,

  'dior-lady-m': `${pat.quilt('q-ld', 11)}
    <path d="M36 42C36 14 84 14 84 42M42 42C42 20 78 20 78 42" class="h"/>
    <rect x="20" y="42" width="80" height="50" rx="3" class="b"/>${fillP('q-ld', 'M20 42H100V92H20Z')}
    <path d="M84 44L90 58" class="thin"/><circle cx="90" cy="61" r="3" class="m"/><circle cx="85" cy="62" r="2.5" class="m"/><circle cx="94" cy="64" r="2.5" class="m"/>`,

  'dior-book-tote-m': `${pat.stripes('s-bt')}
    <path d="M32 36C32 12 52 12 52 36M68 36C68 12 88 12 88 36" class="hw"/>
    <path d="M16 36H104L102 92H18Z" class="b"/>${fillP('s-bt', 'M16 36H104L102 92H18Z')}
    <rect x="38" y="56" width="44" height="12" rx="1" class="f"/>`,

  'gucci-jackie-1961-s': `
    <path d="M18 42C24 4 96 4 102 42" class="h"/>
    <path d="M16 40Q60 54 104 40Q104 90 60 92Q16 90 16 40Z" class="b"/>
    <path d="M60 52V66" /><rect x="52" y="64" width="16" height="7" rx="3" class="m"/><path d="M50 67.5H70"/>`,

  'prada-re-edition-2005': `
    <path d="M16 52C10 12 110 12 104 52" class="thin"/>
    <path d="M14 54Q14 46 22 46H98Q106 46 106 54V74Q106 82 98 82H22Q14 82 14 74Z" class="b"/>
    <path d="M22 52H98" class="zip"/>
    <path d="M60 60L67 72H53Z" class="m"/>
    <path d="M24 82V88"/><rect x="18" y="88" width="14" height="9" rx="2" class="f"/>`,

  'bv-jodie-mini': `${pat.weave('w-jd')}
    <path d="M28 46C30 18 50 12 56 22M92 46C90 18 70 12 64 22" class="hw"/>
    <ellipse cx="60" cy="22" rx="7" ry="5" class="f"/>
    <path d="M28 46Q20 92 60 92Q100 92 92 46Q60 54 28 46Z" class="b"/>${fillP('w-jd', 'M28 46Q20 92 60 92Q100 92 92 46Q60 54 28 46Z')}`,

  'celine-triomphe': `
    <path d="M18 48C12 8 108 8 102 48" class="thin"/>
    <rect x="18" y="40" width="84" height="52" rx="4" class="b"/>
    <path d="M18 44Q18 40 22 40H98Q102 40 102 44V62Q60 74 18 62Z" class="f"/>
    <circle cx="55" cy="66" r="5.5" class="ring"/><circle cx="65" cy="66" r="5.5" class="ring"/>`,

  'goyard-st-louis-pm': `${pat.ychev('y-gy')}
    <path d="M34 34C36 4 52 4 54 34M66 34C68 4 84 4 86 34" class="thin"/>
    <path d="M14 34H106L100 92H20Z" class="b"/>${fillP('y-gy', 'M14 34H106L100 92H20Z')}
    <path d="M14 34L26 52L20 92M106 34L94 52L100 92" class="thin"/>`,

  'loewe-puzzle-s': `
    <path d="M44 42C44 18 76 18 76 42" class="h"/>
    <path d="M16 46L60 40L104 46L100 92H20Z" class="b"/>
    <path d="M60 40V92M16 46L60 68L104 46M20 92L60 68L100 92" class="seam"/>
    <path d="M60 68L40 57M60 68L80 57" class="seam"/>`,

  'ysl-loulou-m': `${pat.chevron('v-ys')}
    ${chain('M22 40C18 6 102 6 98 40')}
    <rect x="16" y="40" width="88" height="52" rx="6" class="b"/>${fillP('v-ys', 'M22 40H98Q104 40 104 46V86Q104 92 98 92H22Q16 92 16 86V46Q16 40 22 40Z')}
    <path d="M16 46Q16 40 22 40H98Q104 40 104 46V64H16Z" class="f"/>
    <rect x="54" y="57" width="12" height="9" rx="1.5" class="m"/>`,
};

const TINT = {
  'Hermès': 'orange', 'Chanel': 'ink', 'Louis Vuitton': 'brown', 'Dior': 'stone', 'Gucci': 'green',
  'Prada': 'ink', 'Bottega Veneta': 'green', 'Celine': 'brown', 'Goyard': 'stone', 'Loewe': 'orange', 'Saint Laurent': 'ink',
};

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function bagArt(m, size = 'sm') {
  const label = `${m.brand} ${m.name}`;
  if (m.img) return `<img class="bag ${size}" src="${esc(m.img)}" alt="${esc(label)}" loading="lazy">`;
  const body = BAGS[m.id] || '<path d="M20 40H100L104 92H16Z" class="b"/><path d="M42 40C42 18 78 18 78 40" class="h"/>';
  return `<svg class="bag ${size} t-${TINT[m.brand] || 'stone'}" viewBox="0 0 120 100" role="img" aria-label="${esc(label)}（示意圖）"><g>${body}</g></svg>`;
}

export const hasArt = id => id in BAGS;
