// ============================================================
// 美术素材：无脸时尚插画风
// 3 个基础形象（人台式打底）× 6 套服装 overlay = 18 种组合
// 服装按「标准版型 m2」绘制，其他模特通过 fit 变换贴合
// ============================================================

const ART = (() => {
  const BASE = '#DBD5CB'; // 打底衣
  const BASE_D = '#C9C1B4'; // 打底衣暗部
  const SHOE = '#3B3937';

  // 基础身体参数：肩/腰/胯半宽、腿宽、臂宽、腿长终点
  const BODY = {
    m1: { sh: 62, wa: 44, hi: 54, leg: 20, arm: 13, legY: 692 },
    m2: { sh: 72, wa: 54, hi: 66, leg: 26, arm: 17, legY: 700 },
    m3: { sh: 88, wa: 74, hi: 92, leg: 32, arm: 21, legY: 704 },
  };

  function torsoPath(sh, wa, hi) {
    const L = 150;
    return (
      `M${L - sh},152 C${L - sh - 4},230 ${L - wa - 2},285 ${L - wa},302` +
      ` C${L - wa - 2},330 ${L - hi - 4},358 ${L - hi},390` +
      ` L${L + hi},390 C${L + hi + 4},358 ${L + wa + 2},330 ${L + wa},302` +
      ` C${L + wa + 2},285 ${L + sh + 4},230 ${L + sh},152` +
      ` C${L + sh - 30},132 ${L - sh + 30},132 ${L - sh},152 Z`
    );
  }

  // 发型：后发块（头后层）+ 前额刘海（头前层，避免被头型盖住）
  function hairBack(model) {
    const c = model.hair;
    const long = model.hairStyle === 'long';
    const curly = model.hairStyle === 'curly';
    const blobH = long ? 196 : 128;
    let s = `<rect x="84" y="22" width="132" height="${blobH}" rx="62" fill="${c}"/>`;
    if (long) {
      s += `<rect x="88" y="118" width="26" height="126" rx="13" fill="${c}"/>` +
           `<rect x="186" y="118" width="26" height="126" rx="13" fill="${c}"/>`;
    }
    if (curly) {
      const r = 15;
      [[92, 58], [86, 98], [208, 58], [214, 98], [112, 30], [188, 30], [98, 132], [202, 132]]
        .forEach(([x, y]) => { s += `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`; });
    }
    return s;
  }

  function hairFront(model) {
    return `<path d="M114,68 Q150,2 186,68 Q150,54 114,68 Z" fill="${model.hair}"/>`;
  }

  // 基础形象：头/颈/手臂肤色，躯干与腿为浅灰打底衣
  function baseFigure(model) {
    const b = BODY[model.id];
    const sk = model.skin;
    const armX = 150 - b.sh + 6;
    const legOff = b.hi * 0.32;
    return `
      ${hairBack(model)}
      <ellipse cx="150" cy="76" rx="31" ry="39" fill="${sk}"/>
      ${hairFront(model)}
      <rect x="141" y="104" width="18" height="30" rx="9" fill="${sk}"/>
      <path d="${torsoPath(b.sh, b.wa, b.hi)}" fill="${BASE}"/>
      <path d="M150,392 L150,540" stroke="${BASE_D}" stroke-width="3"/>
      <path d="M${150 - legOff},392 L${150 - legOff - 2},545 L${150 - legOff - 1},${b.legY}"
            stroke="${BASE}" stroke-width="${b.leg}" fill="none" stroke-linecap="round"/>
      <path d="M${150 + legOff},392 L${150 + legOff + 2},545 L${150 + legOff + 1},${b.legY}"
            stroke="${BASE}" stroke-width="${b.leg}" fill="none" stroke-linecap="round"/>
      <ellipse cx="${150 - legOff}" cy="${b.legY + 8}" rx="${b.leg + 2}" ry="11" fill="${SHOE}"/>
      <ellipse cx="${150 + legOff}" cy="${b.legY + 8}" rx="${b.leg + 2}" ry="11" fill="${SHOE}"/>
      <path d="M${armX},162 C${armX - 7},235 ${armX - 2},300 ${armX + 4},362"
            stroke="${sk}" stroke-width="${b.arm}" fill="none" stroke-linecap="round"/>
      <path d="M${300 - armX},162 C${300 - armX + 7},235 ${300 - armX + 2},300 ${300 - armX - 4},362"
            stroke="${sk}" stroke-width="${b.arm}" fill="none" stroke-linecap="round"/>
      <ellipse cx="${armX + 5}" cy="372" rx="8" ry="11" fill="${sk}"/>
      <ellipse cx="${300 - armX - 5}" cy="372" rx="8" ry="11" fill="${sk}"/>
      <ellipse cx="150" cy="${b.legY + 26}" rx="66" ry="10" fill="#2B2B2B" opacity="0.07"/>
    `;
  }

  // 袖子（随标准手臂走向）
  function sleeves(w, color, cuff, yEnd) {
    const c = cuff || color;
    return `
      <path d="M82,160 C76,238 80,300 86,${yEnd}" stroke="${color}" stroke-width="${w}" fill="none" stroke-linecap="round"/>
      <path d="M218,160 C224,238 220,300 214,${yEnd}" stroke="${color}" stroke-width="${w}" fill="none" stroke-linecap="round"/>
      <path d="M85,${yEnd - 18} L86,${yEnd}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/>
      <path d="M215,${yEnd - 18} L214,${yEnd}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/>
    `;
  }

  const PLAID = `
    <pattern id="plaidP" width="26" height="26" patternUnits="userSpaceOnUse">
      <rect width="26" height="26" fill="#9A8C74"/>
      <rect x="0" y="0" width="26" height="9" fill="#8A7C64"/>
      <rect x="0" y="0" width="9" height="26" fill="#8A7C64"/>
      <rect x="0" y="11" width="26" height="3" fill="#4E5A48"/>
      <rect x="11" y="0" width="3" height="26" fill="#4E5A48"/>
    </pattern>`;

  const GARMENT_ART = {
    // 焦糖色长风衣
    c1: () => `
      <path d="M76,148 C72,240 90,300 94,330 C88,420 84,500 82,556 C130,570 170,570 218,556 C216,500 212,420 206,330 C210,300 228,240 224,148 C196,134 104,134 76,148 Z" fill="#B07B4F"/>
      <path d="M145,168 L147,556 L153,556 L155,168 Z" fill="#96683F"/>
      <path d="M80,150 L150,152 L120,202 Z" fill="#96683F"/>
      <path d="M220,150 L150,152 L180,202 Z" fill="#96683F"/>
      <path d="M120,142 C132,130 168,130 180,142 L174,156 C166,147 134,147 126,156 Z" fill="#96683F"/>
      <rect x="94" y="298" width="112" height="20" rx="4" fill="#96683F"/>
      <rect x="141" y="295" width="18" height="26" rx="3" fill="#7A5A38"/>
      <rect x="102" y="384" width="26" height="8" rx="2" fill="#96683F"/>
      <rect x="172" y="384" width="26" height="8" rx="2" fill="#96683F"/>
      <circle cx="150" cy="352" r="4.5" fill="#7A5A38"/>
      <circle cx="150" cy="404" r="4.5" fill="#7A5A38"/>
      <circle cx="150" cy="456" r="4.5" fill="#7A5A38"/>
      ${sleeves(24, '#B07B4F', '#96683F', 352)}
    `,
    // 米白麻花针织衫 + 炭灰直筒裤
    c2: () => `
      <path d="M70,148 C66,215 78,282 84,330 L216,330 C222,282 234,215 230,148 C200,134 100,134 70,148 Z" fill="#EAE3D2"/>
      <rect x="84" y="318" width="132" height="16" rx="7" fill="#D9D0BB"/>
      <path d="M126,144 Q150,162 174,144" stroke="#D9D0BB" stroke-width="13" fill="none" stroke-linecap="round"/>
      <path d="M124,186 q7,28 0,56 q-7,28 0,56" stroke="#D9D0BB" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M150,186 q7,28 0,56 q-7,28 0,56" stroke="#D9D0BB" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M176,186 q7,28 0,56 q-7,28 0,56" stroke="#D9D0BB" stroke-width="5" fill="none" stroke-linecap="round"/>
      ${sleeves(26, '#EAE3D2', '#D9D0BB', 348)}
      <rect x="94" y="324" width="112" height="14" rx="4" fill="#40403E"/>
      <path d="M127,332 L125,545 L127,690" stroke="#4A4A48" stroke-width="34" fill="none" stroke-linecap="round"/>
      <path d="M173,332 L175,545 L173,690" stroke="#4A4A48" stroke-width="34" fill="none" stroke-linecap="round"/>
    `,
    // 墨绿收腰连衣裙
    c3: () => `
      <path d="M82,150 C78,220 92,272 96,300 L88,310 C80,420 76,500 74,556 C130,572 170,572 226,556 C224,500 220,420 212,310 L204,300 C208,272 222,220 218,150 C190,136 110,136 82,150 Z" fill="#2F5D50"/>
      <path d="M95,296 Q150,308 205,296 L204,316 Q150,328 96,316 Z" fill="#234A3F"/>
      <path d="M128,146 Q150,160 172,146" stroke="#234A3F" stroke-width="10" fill="none" stroke-linecap="round"/>
      <path d="M118,332 C112,420 108,490 106,546" stroke="#234A3F" stroke-width="4" opacity="0.55" fill="none" stroke-linecap="round"/>
      <path d="M140,338 C138,424 136,492 136,558" stroke="#234A3F" stroke-width="4" opacity="0.55" fill="none" stroke-linecap="round"/>
      <path d="M164,338 C166,424 168,492 168,558" stroke="#234A3F" stroke-width="4" opacity="0.55" fill="none" stroke-linecap="round"/>
      <path d="M186,332 C192,420 196,490 198,546" stroke="#234A3F" stroke-width="4" opacity="0.55" fill="none" stroke-linecap="round"/>
      <path d="M74,556 C130,572 170,572 226,556 L226,566 C170,582 130,582 74,566 Z" fill="#234A3F"/>
      ${sleeves(22, '#2F5D50', '#234A3F', 318)}
    `,
    // 雾霾蓝宽松衬衫 + 燕麦阔腿裤
    c4: () => `
      <path d="M72,148 C68,220 82,278 88,316 L212,316 C218,278 232,220 228,148 C198,134 102,134 72,148 Z" fill="#AFC6D6"/>
      <path d="M132,140 L150,158 L124,162 Z" fill="#93AEC2"/>
      <path d="M168,140 L150,158 L176,162 Z" fill="#93AEC2"/>
      <line x1="150" y1="162" x2="150" y2="314" stroke="#93AEC2" stroke-width="3"/>
      <circle cx="150" cy="192" r="3.5" fill="#6E8CA3"/>
      <circle cx="150" cy="232" r="3.5" fill="#6E8CA3"/>
      <circle cx="150" cy="272" r="3.5" fill="#6E8CA3"/>
      <rect x="182" y="196" width="22" height="25" rx="3" fill="none" stroke="#93AEC2" stroke-width="3"/>
      ${sleeves(24, '#AFC6D6', '#93AEC2', 338)}
      <rect x="92" y="310" width="116" height="15" rx="4" fill="#C4B79E"/>
      <path d="M128,322 L126,540 L128,684" stroke="#D8CCB4" stroke-width="42" fill="none" stroke-linecap="round"/>
      <path d="M172,322 L174,540 L172,684" stroke="#D8CCB4" stroke-width="42" fill="none" stroke-linecap="round"/>
      <path d="M128,330 L127,540 L128,676" stroke="#C4B79E" stroke-width="3" fill="none" opacity="0.7"/>
      <path d="M172,330 L173,540 L172,676" stroke="#C4B79E" stroke-width="3" fill="none" opacity="0.7"/>
    `,
    // 驼色羊绒大衣
    c5: () => `
      <path d="M74,148 C70,240 88,300 92,336 C86,430 84,520 82,596 C130,610 170,610 218,596 C216,520 214,430 208,336 C212,300 230,240 226,148 C196,134 104,134 74,148 Z" fill="#C9A568"/>
      <path d="M78,150 L150,156 L114,212 Z" fill="#B18C52"/>
      <path d="M222,150 L150,156 L186,212 Z" fill="#B18C52"/>
      <path d="M118,142 C132,128 168,128 182,142 L174,158 C166,148 134,148 126,158 Z" fill="#B18C52"/>
      <line x1="150" y1="180" x2="150" y2="590" stroke="#B18C52" stroke-width="3" opacity="0.6"/>
      <circle cx="132" cy="300" r="5" fill="#8A6A3D"/>
      <circle cx="132" cy="356" r="5" fill="#8A6A3D"/>
      <circle cx="132" cy="412" r="5" fill="#8A6A3D"/>
      <circle cx="168" cy="300" r="5" fill="#8A6A3D"/>
      <circle cx="168" cy="356" r="5" fill="#8A6A3D"/>
      <circle cx="168" cy="412" r="5" fill="#8A6A3D"/>
      <rect x="96" y="446" width="30" height="9" rx="3" fill="#B18C52"/>
      <rect x="174" y="446" width="30" height="9" rx="3" fill="#B18C52"/>
      ${sleeves(26, '#C9A568', '#B18C52', 358)}
    `,
    // 格纹呢料连衣裙
    c6: () => `
      <path d="M82,150 C78,220 92,272 96,300 L88,310 C80,420 76,490 74,544 C130,560 170,560 226,544 C224,490 220,420 212,310 L204,300 C208,272 222,220 218,150 C190,136 110,136 82,150 Z" fill="url(#plaidP)"/>
      <path d="M94,296 Q150,308 206,296 L205,314 Q150,326 95,314 Z" fill="#4E5A48"/>
      <path d="M128,142 Q150,158 172,142 L168,150 Q150,162 132,150 Z" fill="#F4EFE6"/>
      <path d="M118,330 C112,414 108,478 106,532" stroke="#4E5A48" stroke-width="4" opacity="0.5" fill="none" stroke-linecap="round"/>
      <path d="M140,336 C138,418 136,482 136,540" stroke="#4E5A48" stroke-width="4" opacity="0.5" fill="none" stroke-linecap="round"/>
      <path d="M164,336 C166,418 168,482 168,540" stroke="#4E5A48" stroke-width="4" opacity="0.5" fill="none" stroke-linecap="round"/>
      <path d="M186,330 C192,414 196,478 198,532" stroke="#4E5A48" stroke-width="4" opacity="0.5" fill="none" stroke-linecap="round"/>
      <path d="M74,544 C130,560 170,560 226,544 L226,554 C170,570 130,570 74,554 Z" fill="#4E5A48"/>
      <path d="M82,160 C76,240 80,284 85,310" stroke="url(#plaidP)" stroke-width="22" fill="none" stroke-linecap="round"/>
      <path d="M218,160 C224,240 220,284 215,310" stroke="url(#plaidP)" stroke-width="22" fill="none" stroke-linecap="round"/>
    `,
  };

  function garmentArt(id) {
    return GARMENT_ART[id] ? GARMENT_ART[id]() : '';
  }

  function defsFor(id) {
    return id === 'c6' ? `<defs>${PLAID}</defs>` : '';
  }

  // 试穿合成图：基础形象 + 服装（按模特 fit 参数贴合）
  function composeFitting(model, garment, mono) {
    const f = model.fit;
    const garmentLayer =
      `<g transform="translate(${150 + f.dx},${140 + f.dy}) scale(${f.sx},${f.sy}) translate(-150,-140)">` +
      `${garmentArt(garment.id)}</g>`;
    const monoStyle = mono
      ? `<style>.mono *{fill:#E7E1D6!important;stroke:#E7E1D6!important}</style>`
      : '';
    return (
      `<svg viewBox="0 0 300 760" xmlns="http://www.w3.org/2000/svg" class="fitting-svg${mono ? ' mono' : ''}" preserveAspectRatio="xMidYMax meet">` +
      `${monoStyle}${defsFor(garment.id)}${baseFigure(model)}${garmentLayer}</svg>`
    );
  }

  // 服装缩略图（挂片示意）
  function garmentThumb(garment) {
    return (
      `<svg viewBox="24 92 252 560" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">` +
      `${defsFor(garment.id)}${garmentArt(garment.id)}</svg>`
    );
  }

  return { composeFitting, garmentThumb };
})();
