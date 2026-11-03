// Bestiaire : l'encyclopédie pixel art des créatures de NeoBase (1050 fiches : noms uniques, raretés, statistiques, types, capacités, illustrations).
// La base de créatures est la même que celle du jeu de cartes et du jeu d'exploration : un identifiant par créature, jamais réutilisé.
// Les favoris et ton dernier réglage sont dans le dossier du plugin, que NeoBase sauvegarde (synchro cloud comprise).
/* ===== Base de créatures NeoBase (neobase-creatures) : noyau, données, interface ===== */
// Noyau commun des créatures NeoBase : types, raretés, calcul des statistiques et dessin pixel art (32 x 32).
// Ce fichier est collé tel quel dans chaque plugin qui utilise la base (bestiaire, cartes, jeu) par build.js.
// Un sprite est dessiné à partir de l'entrée seule (plan, graine, types, rareté) : même entrée = même créature, partout.
const CR = (() => {
  const TYPES = {
    feu:      { n: 'Feu',      h: 10,  s: 78, l: 52, icon: '🔥', weak: 'eau', strong: 'plante' },
    eau:      { n: 'Eau',      h: 205, s: 72, l: 52, icon: '💧', weak: 'foudre', strong: 'feu' },
    plante:   { n: 'Plante',   h: 118, s: 52, l: 44, icon: '🌿', weak: 'feu', strong: 'eau' },
    foudre:   { n: 'Foudre',   h: 50,  s: 92, l: 56, icon: '⚡', weak: 'roche', strong: 'eau' },
    glace:    { n: 'Glace',    h: 188, s: 62, l: 66, icon: '❄', weak: 'feu', strong: 'vent' },
    roche:    { n: 'Roche',    h: 28,  s: 30, l: 42, icon: '⛰', weak: 'eau', strong: 'foudre' },
    vent:     { n: 'Vent',     h: 158, s: 48, l: 60, icon: '🌀', weak: 'glace', strong: 'poison' },
    ombre:    { n: 'Ombre',    h: 268, s: 40, l: 34, icon: '🌑', weak: 'lumiere', strong: 'esprit' },
    lumiere:  { n: 'Lumière',  h: 44,  s: 88, l: 70, icon: '✨', weak: 'ombre', strong: 'ombre' },
    poison:   { n: 'Poison',   h: 292, s: 52, l: 42, icon: '☠', weak: 'acier', strong: 'plante' },
    acier:    { n: 'Acier',    h: 214, s: 16, l: 56, icon: '⚙', weak: 'feu', strong: 'glace' },
    esprit:   { n: 'Esprit',   h: 322, s: 62, l: 62, icon: '👁', weak: 'ombre', strong: 'poison' },
  };
  const TYPE_KEYS = Object.keys(TYPES);
  const RARITIES = [
    { k: 'commun',     n: 'Commun',     col: '#b8b8c8', w: 0.52,  budget: 230, sell: 10,   packW: 52 },
    { k: 'peu',        n: 'Peu commun', col: '#7be08a', w: 0.27,  budget: 290, sell: 25,   packW: 27 },
    { k: 'rare',       n: 'Rare',       col: '#5cb8ff', w: 0.14,  budget: 350, sell: 70,   packW: 14 },
    { k: 'epique',     n: 'Épique',     col: '#c070ff', w: 0.055, budget: 420, sell: 220,  packW: 5.5 },
    { k: 'legendaire', n: 'Légendaire', col: '#ffb43c', w: 0.014, budget: 500, sell: 800,  packW: 1.4 },
    { k: 'mythique',   n: 'Mythique',   col: '#ff5c8a', w: 0.001, budget: 590, sell: 4000, packW: 0.1 },
  ];
  const RK = Object.fromEntries(RARITIES.map((r, i) => [r.k, i]));
  const STATS = ['pv', 'atq', 'def', 'vit', 'mag'];
  const STAT_NAMES = { pv: 'PV', atq: 'ATQ', def: 'DÉF', vit: 'VIT', mag: 'MAG' };

  const rng = seed => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

  /* ---------- colours ---------- */
  const hsl = (h, s, l) => { h = ((h % 360) + 360) % 360; s = Math.max(0, Math.min(100, s)) / 100; l = Math.max(0, Math.min(100, l)) / 100; const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)]; };
  const clamp100 = v => Math.max(0, Math.min(100, v));
  const hex = c => '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
  const palette = (c, R) => {
    const T1 = TYPES[c.t], T2 = TYPES[c.t2 || c.t], rarity = RK[c.r], j = (R() - .5) * 44;
    const H = c.hu != null ? c.hu : T1.h + j, S = clamp100(T1.s + (R() - .5) * 24 + (c.sa || 0)), L = T1.l - 7 + (R() - .5) * 8 + (rarity >= 3 ? 5 : 0) + (c.lt || 0);
    const AH = c.hu2 != null ? c.hu2 : c.t2 ? T2.h + (R() - .5) * 16 : H + [28, 55, 150, 180, 215, 330][Math.floor(R() * 6)], AS = c.t2 ? T2.s : Math.min(92, S + 14), AL = c.t2 ? T2.l + 8 : L + 14 + R() * 8;
    const P = { body: [], acc: [], bone: [], mem: [] };
    [-24, -11, 0, 11, 24].forEach(d => { P.body.push(hsl(H + d * .08, S + (d < 0 ? 6 : -6), L + d)); P.acc.push(hsl(AH + d * .08, AS, AL + d)); });
    const bh = [H + 20, AH, 40, 200, 280, H + 180][(c.seed >>> 9) % 6], bs = 22 + (c.seed >>> 13) % 30;   // horns, claws and feet each get their own tint
    P.bone = [hsl(bh, bs, 26), hsl(bh, bs + 6, 60), hsl(bh, bs + 12, 82)];
    P.mem = [hsl(AH, AS, AL - 22), hsl(AH, AS, AL - 6), hsl(AH, AS - 8, AL + 12)];
    P.glow = hsl(AH, 90, 72); P.out = hsl(H, 36, 9);
    P.eye = rarity >= 4 ? hsl(48, 100, 80) : hsl(AH + [0, 0, 120, 180, 240, 60, 300][(c.seed >>> 3) % 7], 100, 68);   // eyes glow in a colour of their own
    P.pupil = [12, 7, 20];
    return P;
  };

  /* ---------- the 32 x 32 grid ---------- */
  const N = 32;
  // cell values: 0 empty · 1 body · 2 accent · 3 bone (horns, claws, beak) · 4 membrane (wings, fins) · 5 eye white · 6 pupil · 7 glow · 8 dark detail
  const K = 8, FX = N * K;   // the exact twin of the grid: 256 x 256
  const mk = () => ({ g: new Uint8Array(N * N), h: new Uint8Array(FX * FX), sym: true, nf: 0 });
  const hset = (b, fx, fy, v) => { if (fx < 0 || fy < 0 || fx >= FX || fy >= FX) return; b.h[fy * FX + fx] = v; if (b.sym) b.h[fy * FX + (FX - 1 - fx)] = v; };
  const hblock = (b, x, y, v) => { for (let j = 0; j < K; j++) for (let i = 0; i < K; i++) hset(b, x * K + i, y * K + j, v); };
  const put = (b, x, y, v) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= N || y >= N) return; b.g[y * N + x] = v; if (b.sym) b.g[y * N + (N - 1 - x)] = v; if (!b.nf) hblock(b, x, y, v); };
  const get = (b, x, y) => (x < 0 || y < 0 || x >= N || y >= N) ? 0 : b.g[y * N + x];
  // direct recolouring of a body cell (markings, eyes): the coarse cell and the fine pixels that already belong to the body
  const setc = (b, x, y, v) => { b.g[y * N + x] = v; for (let j = 0; j < K; j++) for (let i = 0; i < K; i++) { const k = (y * K + j) * FX + x * K + i; if (b.h[k] && (v <= 4 || b.h[k] <= 4)) b.h[k] = v; } };
  const cellOf = f => Math.floor(f / K);
  const ell = (b, cx, cy, rx, ry, v, only) => {
    b.nf++; for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) { const dx = (x - cx) / (rx + .35), dy = (y - cy) / (ry + .35); if (dx * dx + dy * dy <= 1 && (!only || get(b, x, y) === only)) put(b, x, y, v); } b.nf--;
    if (b.nf) return;
    const x0 = Math.max(0, Math.floor((cx - rx - .85) * K)), x1 = Math.min(FX - 1, Math.ceil((cx + rx + .85) * K)), y0 = Math.max(0, Math.floor((cy - ry - .85) * K)), y1 = Math.min(FX - 1, Math.ceil((cy + ry + .85) * K));
    for (let fy = y0; fy <= y1; fy++) for (let fx = x0; fx <= x1; fx++) { const X = (fx + .5) / K - .5, Y = (fy + .5) / K - .5, dx = (X - cx) / (rx + .35), dy = (Y - cy) / (ry + .35); if (dx * dx + dy * dy <= 1 && (!only || get(b, Math.round(X), Math.round(Y)) === only)) hset(b, fx, fy, v); }
  };
  const rect = (b, x0, y0, x1, y1, v) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) put(b, x, y, v); };
  const line = (b, x0, y0, x1, y1, v, w = 1) => {
    b.nf++; const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1); for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; if (w <= 1) put(b, x, y, v); else ell(b, x, y, (w - 1) / 2, (w - 1) / 2, v); } b.nf--;
    if (b.nf) return;
    const rad = Math.max(w, 1) / 2 - .06, dx = x1 - x0, dy = y1 - y0, L2 = dx * dx + dy * dy || 1;
    const ax = Math.max(0, Math.floor((Math.min(x0, x1) - rad - .5) * K)), bx = Math.min(FX - 1, Math.ceil((Math.max(x0, x1) + rad + 1.5) * K)), ay = Math.max(0, Math.floor((Math.min(y0, y1) - rad - .5) * K)), by = Math.min(FX - 1, Math.ceil((Math.max(y0, y1) + rad + 1.5) * K));
    for (let fy = ay; fy <= by; fy++) for (let fx = ax; fx <= bx; fx++) { const X = (fx + .5) / K - .5, Y = (fy + .5) / K - .5; let t = ((X - x0) * dx + (Y - y0) * dy) / L2; t = t < 0 ? 0 : t > 1 ? 1 : t; if (Math.hypot(X - (x0 + dx * t), Y - (y0 + dy * t)) <= rad) hset(b, fx, fy, v); }
  };
  const tri = (b, x0, y0, x1, y1, x2, y2, v) => {
    const s = (ax, ay, bx, by, cx, cy) => (ax - cx) * (by - cy) - (bx - cx) * (ay - cy);
    const inside = (x, y) => { const d1 = s(x, y, x0, y0, x1, y1), d2 = s(x, y, x1, y1, x2, y2), d3 = s(x, y, x2, y2, x0, y0); return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0)); };
    const mnx = Math.floor(Math.min(x0, x1, x2)), mxx = Math.ceil(Math.max(x0, x1, x2)), mny = Math.floor(Math.min(y0, y1, y2)), mxy = Math.ceil(Math.max(y0, y1, y2));
    b.nf++; for (let y = mny; y <= mxy; y++) for (let x = mnx; x <= mxx; x++) if (inside(x, y)) put(b, x, y, v); b.nf--;
    if (b.nf) return;
    for (let fy = Math.max(0, Math.floor((mny - .5) * K)); fy <= Math.min(FX - 1, Math.ceil((mxy + .5) * K)); fy++) for (let fx = Math.max(0, Math.floor((mnx - .5) * K)); fx <= Math.min(FX - 1, Math.ceil((mxx + .5) * K)); fx++) if (inside((fx + .5) / K - .5, (fy + .5) / K - .5)) hset(b, fx, fy, v);
  };
  const ri = (R, a, bb) => a + Math.floor(R() * (bb - a + 1)), rf = (R, a, bb) => a + R() * (bb - a), pick = (R, arr) => arr[Math.floor(R() * arr.length)];

  /* ---------- shared decorations ---------- */
  const eyes = (b, R, cx, cy, gap, o, c) => {  // front view: 12 different eye arrangements, picked by the creature's seed (left eye drawn, mirrored by put())
    const k = o.eyeKind ?? ((c.seed >>> 11) % 12), x = Math.min(Math.round(cx - Math.max(2, gap)), 13), sym0 = b.sym, sock = (x0, y0, x1, y1) => rect(b, x0, y0, x1, y1, 6);
    switch (k) {
      case 0: sock(x - 2, cy - 1, x + 1, cy + 1); put(b, x - 1, cy, 5); put(b, x, cy, 5); line(b, x - 2, cy - 2, x + 1, cy - 1, 8); break;                       // angry slits
      case 1: ell(b, 15.5, cy, 3.2, 3.2, 6); ell(b, 15.5, cy, 1.9, 1.9, 5); put(b, 15, cy - 1, 6); put(b, 15, cy, 6); break;                                      // one big eye
      case 2: sock(x - 1, cy, x + 1, cy + 1); put(b, x, cy, 5); put(b, x - 1, cy, 5); rect(b, 14, cy - 3, 17, cy - 2, 6); put(b, 15, cy - 3, 5); break;          // three eyes
      case 3: for (const [yy, d] of [[cy, 0], [cy - 3, 1]]) { put(b, x + d, yy, 5); put(b, x + d - 1, yy, 6); put(b, x + d, yy + 1, 6); } break;                // four eyes, two rows
      case 4: for (const [dx, dy] of [[0, 0], [-2, -1], [-1, 2]]) { put(b, x + dx, cy + dy, 5); put(b, x + dx - 1, cy + dy, 6); put(b, x + dx, cy + dy + 1, 6); } break;   // spider cluster
      case 5: for (let xx = x - 3; xx <= 15; xx++) { put(b, xx, cy - 1, 6); put(b, xx, cy, 6); } for (let xx = x - 2; xx <= x + 2; xx++) put(b, xx, cy, 5); break;   // visor
      case 6: ell(b, x, cy, 2.3, 3, 6); ell(b, x, cy, 1.4, 2.2, 5); put(b, x, cy - 1, 6); put(b, x, cy, 6); put(b, x, cy + 1, 6); break;                           // cat eyes
      case 7: b.sym = false; ell(b, x, cy, 1.8, 1.8, 6); ell(b, 31 - x, cy, 1.8, 1.8, 6); put(b, x, cy, 5); b.sym = sym0; break;                                  // hollow sockets, one lit
      case 8: { const ty = Math.max(3, (o.top || 8) - 3); line(b, x + 1, (o.top || 8) + 1, x - 1, ty, 1, 1); ell(b, x - 1, ty - 1, 1.5, 1.5, 5); put(b, x - 1, ty - 1, 6); break; }   // eye stalks
      case 9: b.sym = false; ell(b, x, cy, 2.2, 2.2, 6); ell(b, x, cy, 1.2, 1.2, 5); put(b, 31 - x, cy, 5); put(b, 31 - x, cy - 1, 8); b.sym = sym0; break;           // one big, one small
      case 10: for (let i = 0; i < 5; i++) { put(b, x - 2 + i, cy - 1 + (i >> 1), 5); put(b, x - 2 + i, cy - 2 + (i >> 1), 6); } break;                            // long slanted slits
      default: sock(x - 1, cy, x, cy + 1); put(b, x, cy, 5); ell(b, 15.5, cy - 4, 1.7, 1.7, 6); put(b, 15, cy - 4, 5); break;                                       // tiny eyes + third eye
    }
  };
  const hornsFront = (b, R, cx, top, kind, w) => {
    if (kind === 0) return;
    const x = cx - w;
    if (kind === 1) { tri(b, x - 1, top + 1, x + 1, top + 1, x - 2, top - 4, 3); }                    // two horns
    if (kind === 2) { line(b, x, top + 1, x - 2, top - 3, 3, 2); put(b, x - 3, top - 4, 3); }          // curved
    if (kind === 3) { tri(b, x - 2, top + 1, x + 1, top + 1, x + 1, top - 5, 3); put(b, x - 2, top - 5, 3); }  // ears
    if (kind === 4) { rect(b, x - 1, top - 2, x, top + 1, 3); put(b, x - 2, top - 3, 3); put(b, x, top - 3, 3); }  // antlers
    if (kind === 5) { line(b, x, top + 1, x, top - 3, 3); put(b, x, top - 4, 7); }                      // antennae with a bead
  };
  const markings = (b, R, kind, cx0, cy0, rx, ry) => {
    if (kind === 0) return;
    const cells = []; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (get(b, x, y) === 1) cells.push([x, y]);
    if (kind === 1) { const per = ri(R, 4, 6), ph = ri(R, 0, 5); for (const [x, y] of cells) if (((x + y * 2 + ph) % per) < 2 && y > cy0 - ry * .6) setc(b, x, y, 2); }       // stripes
    if (kind === 2) { const n = ri(R, 4, 8); for (let i = 0; i < n; i++) { const [x, y] = cells[Math.floor(R() * cells.length)]; ell(b, x, y, rf(R, .6, 1.4), rf(R, .6, 1.4), 2, 1); } }  // spots
    if (kind === 3) { for (const [x, y] of cells) if (y > cy0 + ry * .2 && Math.abs(x - cx0) < rx * .6) setc(b, x, y, 2); }   // belly
    if (kind === 4) { for (const [x, y] of cells) if (Math.abs(x - 15.5) < 1.5 && y < cy0) setc(b, x, y, 2); }                // dorsal line
    if (kind === 5) { for (const [x, y] of cells) if (((x >> 1) + (y >> 1)) % 2 === 0 && y > cy0) setc(b, x, y, 2); }              // checks
    if (kind === 6) { for (const [x, y] of cells) if (y < cy0 - ry * .45) setc(b, x, y, 2); }                                    // cap
  };
  const mouth = (b, R, cx, y, w, kind) => {
    if (kind <= 1) return;                                                                                                       // no visible mouth
    if (kind === 2) { rect(b, cx - w, y, cx + w, y + 1, 8); put(b, cx - w + 1, y + 1, 3); put(b, cx + w - 1, y + 1, 3); }         // two fangs
    else { rect(b, cx - w - 1, y, cx + w + 1, y + 1, 8); for (let i = -w; i <= w; i += 2) put(b, cx + i, y, 3); }                // toothed maw
  };
  /* ---------- body kits: what makes a silhouette read as armoured / masked / ribbed rather than a plain shape ---------- */
  const KITS = {
    crown(b, R, o) { const n = ri(R, 2, 3); for (let i = 0; i < n; i++) { const x = 15 - i * 2, h = 3 + (i === 0 ? 2 : 0) + ri(R, 0, 1); tri(b, x - 1, o.top + 2, x + 1, o.top + 2, x, o.top - h + 1, 3); } },
    pauldron(b, R, o) { const y = o.sh ?? o.cy - 3, x = 15 - o.rx - 2; ell(b, x, y, 3.4, 2.6, 2); ell(b, x - .5, y - 1, 2, 1.2, 3, 2); tri(b, x - 2, y - 1, x + 1, y - 2, x - 1, y - 6, 3); },
    mask(b, R, o) { const y = o.faceY, w = (o.gap || 3) + 2; ell(b, 15.5, y, w, 3.4, 3); rect(b, 15, y + 2, 16, y + 4, 3); line(b, 15, y - 3, 15, y - 2, 8); },
    ribs(b, R, o) { const y0 = (o.faceY || o.cy - 4) + 5; for (let k = 0; k < 3; k++) { const y = y0 + k * 2, w = 3 - (k > 1 ? 1 : 0); for (let x = 15 - w; x <= 15; x++) if (get(b, x, y) === 1 || get(b, x, y) === 2) put(b, x, y, 3); } for (let y = y0 - 1; y <= y0 + 5; y++) if (get(b, 15, y) === 1 || get(b, 15, y) === 2) put(b, 15, y, 8); },
    spines(b, R, o) { const S = surfaces(b); for (const [x, y] of spread(R, S.top.filter(p => p[0] < 16), 3)) { const h = ri(R, 2, 4); for (let k = 1; k <= h; k++) put(b, x, y - k, 3); } },
    cloak(b, R, o) { const y = o.sh ?? o.cy - 3; tri(b, 15 - o.rx - 1, y, 14, y + 1, 15 - o.rx - 3, y + 11, 2); tri(b, 15 - o.rx - 1, y, 14, y + 1, 14, y + 12, 2); line(b, 15 - o.rx - 3, y + 11, 14, y + 12, 8); },
    shell(b, R, o) { ell(b, 15.5, o.cy - 2, (o.rx || 7) * .9, (o.ry || 6) * .62, 2, 1); line(b, 15, o.cy - (o.ry || 6) * .62 - 2, 15, o.cy + 1, 8); for (let k = 0; k < 2; k++) line(b, 15 - 4 - k * 2, o.cy - 3 + k * 3, 14, o.cy - 2 + k * 3, 8); },
    tendrils(b, R, o) { const S = surfaces(b); for (const [x, y] of spread(R, S.bot.filter(p => p[0] < 16), 3)) { let cx = x, cy = y; for (let k = 0; k < ri(R, 3, 5); k++) { cx += R() < .5 ? -1 : 0; cy += 1; if (cy > 29) break; put(b, cx, cy, 2); } } },
  };
  const KIT_LIST = { blob: ['mask', 'shell', 'spines', 'tendrils', 'crown'], biped: ['mask', 'pauldron', 'cloak', 'crown', 'ribs', 'spines'], golem: ['pauldron', 'mask', 'crown', 'ribs', 'spines', 'shell'], bird: ['crown', 'spines', 'shell'], serpent: ['spines', 'crown', 'ribs', 'shell'], insect: ['shell', 'spines', 'crown'], spirit: ['mask', 'cloak', 'crown', 'tendrils'], plant: ['spines', 'crown', 'mask'], floater: ['spines', 'tendrils', 'crown'] };
  const kit = (b, R, o, c) => { const list = KIT_LIST[c.plan]; if (!list) return; const n = RK[c.r] >= 3 ? 2 : 1, first = ri(R, 0, list.length - 1); for (let i = 0; i < n; i++) KITS[list[(first + i * 2) % list.length]](b, R, o); };
  const sideKit = (b, R, o, c) => {   // beast / dragon / fish: back plates and a scarred flank
    const S = surfaces(b), k = ri(R, 0, 2);
    if (k !== 1) for (const [x, y] of spread(R, S.top, ri(R, 4, 6))) { put(b, x, y, 2); put(b, x, y - 1, 3); if (R() < .6) put(b, x, y - 2, 3); }
    if (k !== 0) for (const [x, y] of spread(R, S.inn, 3)) { put(b, x, y, 8); put(b, x + 1, y + 1, 8); put(b, x + 2, y + 2, 8); }
  };

  /* ---------- body plans (front view = mirrored, side view = facing right) ---------- */
  const PLANS = {
    blob(b, R, o) {
      const rx = ri(R, 8, 11), ry = ri(R, 7, 10), cy = 27 - ry;
      ell(b, 15.5, cy, rx, ry, 1); rect(b, 15 - rx, cy + Math.ceil(ry * .6), 16 + rx, 27, 0);
      for (let x = 15 - rx; x <= 15; x += 3) put(b, x + 1, 27, 1);                                       // scalloped, dripping base
      const top = cy - ry; o.top = top; o.cy = cy; o.rx = rx; o.ry = ry; o.faceY = cy - 1; o.gap = Math.max(3, Math.round(rx * .45));
      if (R() < .4) { ell(b, 15.5, cy + 2, 3, 2.4, 7); put(b, 15, cy + 1, 3); put(b, 16, cy + 3, 3); }   // glowing core with bones inside
    },
    biped(b, R, o) {
      const hr = ri(R, 4, 6), cy = ri(R, 8, 10), tw = ri(R, 5, 7), ty = cy + hr + ri(R, 4, 6);
      rect(b, 16 - tw, ty - 4, 15 + tw, ty + 5, 1); ell(b, 15.5, ty + 1, tw + 1, 6, 1);
      ell(b, 15.5, cy, hr + 1, hr, 1);                                                                     // head
      line(b, 16 - tw - 1, ty - 3, 16 - tw - 4, ty + 4, 1, 3); ell(b, 16 - tw - 4, ty + 5, 1.5, 1.5, 3); // arms + claws
      rect(b, 16 - tw + 1, ty + 5, 14, 27, 1); rect(b, 16 - tw, 26, 14, 27, 3);                           // legs + feet
      o.top = cy - hr; o.cy = ty; o.rx = tw; o.ry = 7; o.faceY = cy; o.gap = Math.max(3, Math.round(hr * .5)); o.sh = ty - 3;
    },
    golem(b, R, o) {
      const tw = ri(R, 7, 9), th = ri(R, 8, 10), hy = 7;
      rect(b, 16 - tw, 11, 15 + tw, 11 + th, 1); rect(b, 12, hy - 3, 19, hy + 3, 1);                       // torso block + head
      rect(b, 16 - tw - 3, 11, 15 - tw, 11 + th + 2, 1); rect(b, 16 - tw - 3, 11 + th + 2, 15 - tw, 11 + th + 4, 3); // big arms
      rect(b, 16 - tw + 1, 11 + th + 1, 14, 27, 1);
      for (let i = 0; i < ri(R, 2, 5); i++) { const x = ri(R, 16 - tw, 15), y = ri(R, 12, 11 + th); ell(b, x, y, 1.2, 1.2, 2, 1); }
      o.top = hy - 3; o.cy = 11 + th / 2; o.rx = tw; o.ry = th / 2; o.faceY = hy; o.gap = 3; o.sh = 12;
    },
    bird(b, R, o) {
      const rx = ri(R, 5, 7), ry = ri(R, 6, 8), cy = 17;
      ell(b, 15.5, cy, rx, ry, 1); ell(b, 15.5, cy - ry + 1, rx - 1, 5, 1);
      const sp = ri(R, 7, 11); for (let i = 0; i < 3; i++) { tri(b, 15 - rx + 1, cy - 4 + i * 2, 15 - rx - sp + i * 2, cy + 2 + i * 3, 15 - rx + 1, cy + 4 + i * 2, 4); }   // wings
      tri(b, 13, cy - ry + 3, 18, cy - ry + 3, 15.5, cy - ry + 8, 3);                                       // beak
      tri(b, 12, cy + ry - 1, 19, cy + ry - 1, 15.5, cy + ry + 4, 4);                                       // tail
      line(b, 13, cy + ry, 12, 28, 3); line(b, 12, 28, 10, 28, 3); line(b, 12, 28, 14, 28, 3);
      if (R() < .6) tri(b, 14, cy - ry - 3, 17, cy - ry - 3, 15.5, cy - ry + 1, 2);                        // crest
      o.top = cy - ry; o.cy = cy; o.rx = rx; o.ry = ry; o.faceY = cy - ry + 4; o.gap = 2; o.noMouth = true;
    },
    serpent(b, R, o) {
      const turns = ri(R, 2, 3);
      for (let i = 0; i < turns; i++) { const y = 26 - i * 5, rx = 10 - i * 2; ell(b, 15.5, y, rx, 3.4, 1); ell(b, 15.5, y - 1, rx - 2, 1.4, 2); }
      const cy = 26 - turns * 5 + 1; rect(b, 12, cy, 19, 22, 1);
      ell(b, 15.5, cy - 2, 5, 5, 1);
      if (R() < .65) { tri(b, 15 - 9, cy + 2, 15 - 4, cy - 6, 15 - 4, cy + 4, 4); }                       // hood
      line(b, 15.5, cy + 1, 15.5, cy + 2, 8);
      o.top = cy - 7; o.cy = cy - 1; o.rx = 6; o.ry = 5; o.faceY = cy - 3; o.gap = 2; o.noMouth = false;
    },
    insect(b, R, o) {
      const ay = ri(R, 19, 21), ab = ri(R, 5, 7);
      ell(b, 15.5, ay, ab - 1, ab + 1, 1); ell(b, 15.5, ay - 8, 4, 4, 1); ell(b, 15.5, ay - 3, 5, 4, 1);
      for (let i = 0; i < 3; i++) { const y = ay - 4 + i * 3; line(b, 15 - 4, y, 15 - 10, y + 5 + i, 3); }
      const wing = ri(R, 6, 9); ell(b, 15.5 - 7, ay - 10, wing * .6, wing, 4); ell(b, 15.5 - 9, ay - 6, wing * .5, wing * .8, 4);
      line(b, 14, ay - 12, 11, ay - 16, 3); put(b, 11, ay - 17, 7); line(b, 12, ay - 5, 9, ay - 3, 3);
      for (let y = ay - 3; y < ay + ab; y += 3) rect(b, 15 - ab + 1, y, 15 + ab, y, 8);
      o.top = ay - 12; o.cy = ay; o.rx = ab; o.ry = ab; o.faceY = ay - 8; o.gap = 2; o.noMouth = true;
    },
    spirit(b, R, o) {
      const hr = ri(R, 6, 8), cy = 12; ell(b, 15.5, cy, hr, hr, 1);
      let x = 15.5, w = hr - 1; for (let y = cy + hr - 2; y <= 29; y += 2) { x += Math.sin(y * .5) * .9; w = Math.max(1, w - 1.1); ell(b, x, y, w, 2.2, 1); }
      for (let i = 0; i < ri(R, 3, 5); i++) { const px = ri(R, 4, 12), py = ri(R, 12, 26); ell(b, px, py, 1, 1, 7); }
      if (R() < .5) { tri(b, 15 - hr, cy - 2, 15 - hr - 4, cy + 6, 15 - hr + 1, cy + 4, 4); }
      o.top = cy - hr; o.cy = cy; o.rx = hr; o.ry = hr; o.faceY = cy; o.gap = Math.round(hr * .5); o.noMouth = R() < .3;
    },
    plant(b, R, o) {
      rect(b, 14, 17, 17, 26, 1); rect(b, 12, 26, 19, 27, 3); line(b, 11, 28, 14, 26, 1); line(b, 20, 28, 17, 26, 1);
      ell(b, 9, 21, 4, 2, 1); ell(b, 22, 21, 4, 2, 1);                                                    // leaves
      const cy = 11, pr = ri(R, 4, 5), n = ri(R, 5, 8);
      for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; ell(b, 15.5 + Math.cos(a) * (pr + 2), cy + Math.sin(a) * (pr + 2), 3.2, 3.2, 2); }
      ell(b, 15.5, cy, pr, pr, 1);
      o.top = cy - pr - 5; o.cy = cy; o.rx = pr; o.ry = pr; o.faceY = cy; o.gap = 2; o.noMouth = false; o.noHorns = true;
    },
    floater(b, R, o) {
      const r = ri(R, 8, 10), cy = 14; ell(b, 15.5, cy, r, r, 1);
      ell(b, 15.5, cy, r - 3, r - 3, 6); ell(b, 15.5, cy, r - 5, r - 5, 5); ell(b, 15.5, cy, 1.8, 2.6, 6); line(b, 15, cy - r + 1, 15, cy - r + 3, 8);
      const n = ri(R, 3, 5); for (let i = 0; i < n; i++) { const x = 15.5 - r + 2 + i * (2 * r - 4) / Math.max(1, n - 1); line(b, x, cy + r - 1, x + Math.sin(i * 2) * 2, 28, 1, 2); }
      for (let i = 0; i < ri(R, 4, 7); i++) { const a = R() * 6.28; put(b, 15.5 + Math.cos(a) * (r + 1), cy + Math.sin(a) * (r + 1), 3); }
      o.top = cy - r; o.cy = cy; o.rx = r; o.ry = r; o.faceY = cy; o.gap = 0; o.noEyes = true; o.noMouth = true;
    },
    /* side views, facing right */
    beast(b, R, o) {
      b.sym = false;
      const rx = rf(R, 6.5, 10), ry = rf(R, 4, 6.8), leg = ri(R, 3, 8), cy = 27 - leg - ry + 1, bx = 12 + rf(R, -1, 2);
      ell(b, bx, cy, rx, ry, 1);
      const hx = bx + rx - 1 + rf(R, 0, 2.5), hy = cy - rf(R, 2, 5), hr = rf(R, 3.2, 5);
      if (R() < .5) line(b, bx + rx - 3, cy - 1, hx, hy + 1, 1, 4);                                           // neck
      ell(b, hx, hy, hr, hr * rf(R, .85, 1.05), 1);
      const sn = ri(R, 1, 4), snh = rf(R, 1.3, 2.6); if (R() < .85) ell(b, hx + hr + sn * .5 - .5, hy + 1.2, sn + 1, snh, 1);
      const lw = ri(R, 2, 3), lx = [bx - rx + 2, bx - rx * .35, bx + rx * .25, bx + rx - 3.5];
      lx.forEach((x, i) => { const w = i % 2 ? lw - (lw > 2 ? 1 : 0) : lw; rect(b, Math.round(x), Math.round(cy + ry - 2), Math.round(x) + w - 1, 27, 1); rect(b, Math.round(x), 27, Math.round(x) + w - 1, 27, 3); });
      const tail = ri(R, 0, 4), ty = cy - 1;
      if (tail === 0) line(b, bx - rx + 1, ty, bx - rx - 6, ty - 6, 1, 2);
      else if (tail === 1) { ell(b, bx - rx - 2, ty, 2.4, 2.4, 1); ell(b, bx - rx - 3, ty - 1, 1.2, 1.2, 2); }
      else if (tail === 2) { line(b, bx - rx + 1, ty + 1, bx - rx - 7, ty + 3, 1, 2); tri(b, bx - rx - 7, ty, bx - rx - 7, ty + 6, bx - rx - 10, ty + 3, 3); }
      else if (tail === 3) { line(b, bx - rx + 1, ty, bx - rx - 3, ty - 3, 1, 2); ell(b, bx - rx - 5, ty - 5, 2, 3, 2); }
      const ear = ri(R, 0, 3), ex = hx - 1; if (ear === 0) tri(b, ex - 2, hy - hr + 1, ex + 1, hy - hr + 1, ex - 1, hy - hr - 4, 1); else if (ear === 1) ell(b, ex - 1, hy - hr, 2, 2, 1); else if (ear === 2) { tri(b, ex - 2, hy - hr + 2, ex + 1, hy - hr + 2, ex - 3, hy - hr - 6, 1); }
      const hn = ri(R, 0, 4); if (hn === 1) tri(b, hx, hy - hr + 1, hx + 2, hy - hr + 1, hx + 4, hy - hr - 5, 3); else if (hn === 2) { line(b, hx, hy - hr + 1, hx - 1, hy - hr - 4, 3, 2); line(b, hx + 2, hy - hr + 1, hx + 4, hy - hr - 4, 3, 2); } else if (hn === 3) tri(b, hx + sn + 1, hy, hx + hr + sn + 1, hy, hx + hr + sn, hy - 4, 3);
      const back = ri(R, 0, 5);
      if (back === 1) for (let i = 0; i < 5; i++) tri(b, bx - rx + 2 + i * 3, cy - ry + 1, bx - rx + 4 + i * 3, cy - ry + 1, bx - rx + 3 + i * 3, cy - ry - 3, 2);
      else if (back === 2) ell(b, bx - 1, cy - ry + 1, rx * .6, 3, 4);
      else if (back === 3) for (let i = 0; i < 6; i++) put(b, bx - rx + 2 + i * 2, cy - ry - 1 - (i % 2), 2);
      put(b, Math.round(hx + 1), Math.round(hy - 1), 6); put(b, Math.round(hx + 2), Math.round(hy - 1), 5); put(b, Math.round(hx + 1), Math.round(hy - 2), 8); put(b, Math.round(hx + 2), Math.round(hy - 2), 8); put(b, Math.round(hx + hr + sn), Math.round(hy + 1), 8);
      if (R() < .4) { put(b, Math.round(hx + hr + sn - 1), Math.round(hy + snh + 1.2), 5); }
      o.hx = Math.round(hx + 1); o.hy = Math.round(hy - 1); o.top = cy - ry - 4; o.cy = cy; o.rx = rx; o.ry = ry; o.noEyes = true; o.noMouth = true; o.noHorns = true; o.side = true;
    },
    dragon(b, R, o) {
      b.sym = false;
      const rx = rf(R, 6.5, 9), ry = rf(R, 4, 6), leg = ri(R, 3, 6), cy = 27 - leg - ry + 1, bx = 12 + rf(R, -1, 2);
      ell(b, bx, cy, rx, ry, 1);
      const long = R() < .5, nx = bx + rx - 2, hx = nx + (long ? 5 : 3), hy = cy - (long ? 8 : 5), hr = rf(R, 3, 4.4);
      line(b, nx, cy - 1, hx, hy + 1, 1, long ? 3 : 4); ell(b, hx, hy, hr, hr * .9, 1);
      const sn = ri(R, 2, 4); ell(b, hx + hr + sn * .4, hy + 1, sn, 1.5, 1);
      [bx - rx + 2, bx + rx - 4].forEach(x => { rect(b, Math.round(x), Math.round(cy + ry - 2), Math.round(x) + 2, 27, 1); rect(b, Math.round(x), 27, Math.round(x) + 3, 27, 3); });
      const tl = ri(R, 6, 11), tx = bx - rx + 1; line(b, tx, cy, tx - tl, cy + ri(R, 0, 5), 1, 3); line(b, tx - tl + 3, cy + 1, tx - tl, cy + 2, 1, 2); tri(b, tx - tl - 3, cy + 1, tx - tl + 1, cy - 1, tx - tl + 1, cy + 5, 3);
      const wing = ri(R, 0, 2), wy = cy - ry + 1;
      if (wing === 0) { tri(b, bx - 5, wy, bx + 4, wy, bx - 8, wy - 12, 4); tri(b, bx - 2, wy, bx + 4, wy, bx - 1, wy - 9, 4); }
      else if (wing === 1) { line(b, bx - 1, wy, bx - 8, wy - 10, 3, 2); tri(b, bx - 8, wy - 10, bx + 3, wy, bx - 12, wy - 4, 4); tri(b, bx - 8, wy - 10, bx + 3, wy, bx + 2, wy - 8, 4); }
      else { tri(b, bx - 6, wy, bx + 3, wy, bx - 4, wy - 7, 4); tri(b, bx - 6, wy, bx - 2, wy, bx - 9, wy - 3, 4); }
      const horn = ri(R, 0, 2); if (horn) { tri(b, hx - 2, hy - hr + 1, hx, hy - hr + 1, hx - 5, hy - hr - 5, 3); if (horn === 2) tri(b, hx, hy - hr + 1, hx + 2, hy - hr + 1, hx + 1, hy - hr - 4, 3); }
      for (let i = 0; i < ri(R, 3, 6); i++) put(b, Math.round(bx - rx + 3 + i * 2.5), Math.round(cy - ry - 1), 3);
      put(b, Math.round(hx + 1), Math.round(hy - 1), 6); put(b, Math.round(hx + 2), Math.round(hy - 1), 5); put(b, Math.round(hx + 1), Math.round(hy - 2), 8); put(b, Math.round(hx + 2), Math.round(hy - 2), 8); put(b, Math.round(hx + hr + sn), Math.round(hy + 1), 8);
      if (R() < .6) for (let i = 0; i < 3; i++) put(b, Math.round(hx + hr + sn + 1 + i), Math.round(hy + 1 + (i % 2)), 7);
      o.hx = Math.round(hx + 1); o.hy = Math.round(hy - 1); o.top = hy - hr - 5; o.cy = cy; o.rx = rx; o.ry = ry; o.noEyes = true; o.noMouth = true; o.noHorns = true; o.side = true;
    },
    fish(b, R, o) {
      b.sym = false;
      const cy = ri(R, 14, 17), rx = rf(R, 8, 11), ry = rf(R, 4.5, 8), bx = 15 + rf(R, -1, 2);
      ell(b, bx, cy, rx, ry, 1);
      const tail = ri(R, 0, 2); if (tail === 0) tri(b, bx - rx + 1, cy, 0, cy - 7, 0, cy + 7, 4); else if (tail === 1) { tri(b, bx - rx + 1, cy, 1, cy - 5, 3, cy, 4); tri(b, bx - rx + 1, cy, 1, cy + 5, 3, cy, 4); } else { line(b, bx - rx + 1, cy, 0, cy - 3, 4, 2); line(b, bx - rx + 1, cy, 0, cy + 3, 4, 2); }
      const dorsal = ri(R, 0, 2); if (dorsal === 0) tri(b, bx - 4, cy - ry + 1, bx + 5, cy - ry + 1, bx - 5, cy - ry - 6, 4); else if (dorsal === 1) for (let i = 0; i < 5; i++) tri(b, bx - 6 + i * 3, cy - ry + 1, bx - 4 + i * 3, cy - ry + 1, bx - 5 + i * 3, cy - ry - 3 - (i % 2), 2); else ell(b, bx - 1, cy - ry, 6, 3, 4);
      tri(b, bx - 2, cy + ry - 1, bx + 3, cy + ry - 1, bx - 3, cy + ry + 4, 4);
      if (R() < .6) ell(b, bx + 1, cy + 1, rx * .5, ry * .55, 2, 1);
      const ex = Math.round(bx + rx - 4); ell(b, ex, cy - 2, 1.6, 1.6, 6); put(b, ex, cy - 2, 5); put(b, ex + 1, cy - 2, 5); put(b, ex, cy - 4, 8); put(b, ex + 1, cy - 4, 8);
      const m = ri(R, 0, 2); put(b, Math.round(bx + rx - 1), cy + 1, 8); if (m === 1) { put(b, Math.round(bx + rx - 2), cy + 2, 5); put(b, Math.round(bx + rx - 4), cy + 2, 5); } if (m === 2) { line(b, Math.round(bx + rx - 4), cy + 3, Math.round(bx + rx - 1), cy + 3, 8); }
      if (R() < .4) { line(b, ex, cy - ry, ex + 4, cy - ry - 5, 3); ell(b, ex + 5, cy - ry - 6, 1.4, 1.4, 7); }
      o.hx = ex; o.hy = cy - 2; o.top = cy - ry - 5; o.cy = cy; o.rx = rx; o.ry = ry; o.noEyes = true; o.noMouth = true; o.noHorns = true; o.side = true;
    },
  };
  /* ---------- silhouette variants: each family has its plain form above (variant 0) plus 3-4 others, picked by the creature's seed ---------- */
  const VARS = {
    blob: [
      (b, R, o) => { const r = ri(R, 7, 9), cy = 11; ell(b, 15.5, cy, r, r - 1, 1); ell(b, 15.5, cy - 2, r - 3, r - 4, 2, 1); const n = ri(R, 4, 6); for (let i = 0; i < n; i++) { let cx = 15.5 - r + 2 + i * (2 * r - 4) / (n - 1); for (let y = cy + r - 2; y <= 29; y++) { cx += Math.sin(y * .7 + i) * .45; put(b, cx, y, y % 5 === 0 ? 2 : 1); } } o.top = cy - r + 1; o.cy = cy; o.rx = r; o.ry = r - 1; o.faceY = cy + 1; o.gap = Math.max(3, Math.round(r * .4)); o.noMouth = true; },   // jellyfish
      (b, R, o) => { const rx = ri(R, 11, 13); ell(b, 15.5, 22, rx, 6, 1); rect(b, 0, 28, 31, 31, 0); ell(b, 8, 16, 4, 4, 1); ell(b, 15.5, 14, 4.5, 4.5, 1); o.top = 10; o.cy = 21; o.rx = rx; o.ry = 7; o.faceY = 19; o.gap = 4; o.eyeKind = 4; o.noMouth = true; },   // mound with many eyes
      (b, R, o) => { const rx = ri(R, 9, 11); ell(b, 15.5, 26, 6, 3, 1); ell(b, 15.5, 20, rx, 8, 2); ell(b, 15.5, 20, rx - 3, 5, 1, 2); line(b, 15, 13, 15, 26, 8); line(b, 10, 16, 15, 19, 8); o.top = 12; o.cy = 20; o.rx = rx; o.ry = 8; o.faceY = 26; o.gap = 3; o.noMouth = true; },   // shelled
    ],
    biped: [
      (b, R, o) => { const tw = ri(R, 8, 9), ty = 17; ell(b, 15.5, ty, tw, 7, 1); ell(b, 15.5, 9, 4.5, 4, 1); line(b, 15 - tw, ty - 4, 13 - tw, 25, 1, 5); ell(b, 13 - tw, 26, 3, 2.6, 3); rect(b, 11, ty + 5, 14, 27, 1); rect(b, 10, 26, 14, 27, 3); o.top = 5; o.cy = ty; o.rx = tw; o.ry = 7; o.faceY = 9; o.gap = 3; o.sh = ty - 4; },   // brute
      (b, R, o) => { tri(b, 12, 12, 19, 12, 4, 28, 1); ell(b, 15.5, 8, 6, 5.5, 2); ell(b, 15.5, 9, 4, 3.5, 6); line(b, 10, 14, 6, 22, 2, 3); ell(b, 6, 23, 1.6, 1.6, 3); rect(b, 9, 18, 22, 19, 3); o.top = 2; o.cy = 19; o.rx = 8; o.ry = 8; o.faceY = 9; o.gap = 3; o.sh = 14; o.noHorns = true; },   // robed
      (b, R, o) => { ell(b, 15.5, 7, 4, 4.5, 1); rect(b, 13, 11, 18, 21, 1); line(b, 12, 12, 8, 26, 1, 2); ell(b, 8, 27, 1.5, 1.5, 3); line(b, 14, 21, 12, 27, 1, 2); rect(b, 10, 27, 13, 27, 3); o.top = 2; o.cy = 16; o.rx = 3; o.ry = 6; o.faceY = 7; o.gap = 3; o.sh = 13; },   // lanky
    ],
    golem: [
      (b, R, o) => { tri(b, 12, 28, 19, 28, 15.5, 3, 1); tri(b, 6, 28, 13, 28, 8, 10, 1); tri(b, 2, 28, 8, 28, 4, 16, 1); tri(b, 15, 27, 17, 27, 15.5, 6, 2); ell(b, 15.5, 20, 2.2, 3.5, 7); o.top = 3; o.cy = 18; o.rx = 6; o.ry = 9; o.faceY = 14; o.gap = 2; o.noHorns = true; },   // crystal
      (b, R, o) => { rect(b, 8, 21, 23, 27, 1); rect(b, 10, 14, 21, 20, 1); rect(b, 12, 8, 19, 13, 1); rect(b, 13, 4, 18, 7, 1); for (const y of [21, 14, 8]) rect(b, 8, y, 23, y, 8); rect(b, 3, 14, 6, 24, 1); rect(b, 3, 25, 7, 27, 3); o.top = 4; o.cy = 17; o.rx = 7; o.ry = 10; o.faceY = 10; o.gap = 3; o.sh = 15; },   // tower
      (b, R, o) => { ell(b, 15.5, 21, 9, 7, 1); ell(b, 8, 15, 5, 5, 1); ell(b, 15.5, 10, 4.5, 4.5, 1); rect(b, 9, 26, 13, 27, 3); o.top = 5; o.cy = 19; o.rx = 9; o.ry = 8; o.faceY = 10; o.gap = 3; o.sh = 14; },   // boulders
    ],
    bird: [
      (b, R, o) => { ell(b, 15.5, 18, 8, 9, 1); ell(b, 15.5, 12, 7, 6, 1); tri(b, 9, 8, 13, 9, 9, 3, 1); ell(b, 15.5, 13, 5.5, 4, 2, 1); ell(b, 6, 19, 3, 7, 4); tri(b, 14, 14, 17, 14, 15.5, 17, 3); rect(b, 11, 27, 13, 27, 3); o.top = 5; o.cy = 18; o.rx = 8; o.ry = 9; o.faceY = 12; o.gap = 3; o.noMouth = true; o.noHorns = true; },   // owl
      (b, R, o) => { ell(b, 15.5, 17, 5, 4, 1); line(b, 15.5, 15, 15.5, 8, 1, 3); ell(b, 15.5, 7, 3.2, 3.2, 1); tri(b, 14, 8, 17, 8, 15.5, 15, 3); line(b, 13, 20, 12, 28, 3); line(b, 12, 28, 10, 28, 3); ell(b, 8, 16, 3, 6, 4); o.top = 4; o.cy = 17; o.rx = 5; o.ry = 4; o.faceY = 7; o.gap = 2; o.noMouth = true; o.noHorns = true; },   // heron
      (b, R, o) => { ell(b, 15.5, 17, 4, 6, 1); ell(b, 15.5, 9, 3.6, 3.6, 1); tri(b, 12, 12, 1, 8, 3, 20, 4); tri(b, 12, 14, 0, 14, 4, 24, 4); tri(b, 12, 18, 3, 24, 6, 28, 4); tri(b, 13, 22, 18, 22, 15.5, 29, 4); tri(b, 14, 10, 17, 10, 15.5, 14, 3); rect(b, 12, 24, 13, 27, 3); o.top = 5; o.cy = 15; o.rx = 5; o.ry = 6; o.faceY = 9; o.gap = 2; o.noMouth = true; },   // raptor
    ],
    serpent: [
      (b, R, o) => { for (let i = 0; i < 5; i++) ell(b, 15.5, 26 - i * 4, 6 - i * .5, 2.6, i % 2 ? 1 : 2); ell(b, 15.5, 8, 6, 5, 1); ell(b, 15.5, 12, 4, 2, 8); o.top = 3; o.cy = 10; o.rx = 6; o.ry = 5; o.faceY = 7; o.gap = 3; o.noMouth = true; },   // worm
      (b, R, o) => { ell(b, 15.5, 26, 9, 3, 1); ell(b, 15.5, 23, 7, 3, 1); rect(b, 14, 10, 17, 22, 1); ell(b, 15.5, 11, 8, 6, 2); ell(b, 15.5, 8, 4, 3.4, 1); o.top = 4; o.cy = 14; o.rx = 7; o.ry = 7; o.faceY = 8; o.gap = 2; o.noMouth = true; },   // cobra
      (b, R, o) => { ell(b, 15.5, 25, 9, 4, 1); line(b, 10, 23, 6, 10, 1, 3); line(b, 15.5, 22, 15.5, 6, 1, 3); ell(b, 6, 9, 3.3, 3, 1); ell(b, 15.5, 5, 3.6, 3.2, 1); put(b, 5, 8, 5); put(b, 7, 8, 5); put(b, 14, 4, 5); put(b, 17, 4, 5); o.top = 2; o.cy = 22; o.rx = 8; o.ry = 5; o.noEyes = true; o.noMouth = true; o.noHorns = true; },   // hydra
    ],
    insect: [
      (b, R, o) => { ell(b, 15.5, 19, 9, 9, 2); ell(b, 15.5, 19, 7, 7, 1, 2); line(b, 15, 10, 15, 28, 8); ell(b, 15.5, 8, 4, 3.4, 1); tri(b, 13, 10, 15, 10, 12, 15, 3); line(b, 7, 15, 2, 12, 3); line(b, 6, 19, 1, 20, 3); line(b, 7, 23, 2, 28, 3); o.top = 5; o.cy = 19; o.rx = 9; o.ry = 9; o.faceY = 8; o.gap = 2; o.noMouth = true; },   // beetle
      (b, R, o) => { ell(b, 15.5, 21, 6, 5.5, 1); ell(b, 15.5, 14, 3.6, 3, 1); for (let k = 0; k < 4; k++) { line(b, 11, 18 + k, 5, 11 + k * 3, 3); line(b, 5, 11 + k * 3, 2 + k, 27, 3); } o.top = 11; o.cy = 20; o.rx = 6; o.ry = 5; o.faceY = 14; o.gap = 2; o.eyeKind = 4; o.noMouth = true; },   // spider
      (b, R, o) => { ell(b, 15.5, 6, 4, 3.6, 1); rect(b, 14, 9, 17, 13, 1); rect(b, 13, 13, 18, 22, 1); ell(b, 15.5, 25, 3, 4, 1); tri(b, 13, 13, 6, 26, 12, 24, 4); line(b, 12, 13, 6, 16, 1, 2); line(b, 6, 16, 5, 24, 1, 2); tri(b, 4, 24, 6, 24, 5, 28, 3); line(b, 13, 22, 9, 28, 3); o.top = 3; o.cy = 15; o.rx = 4; o.ry = 7; o.faceY = 6; o.gap = 2; o.noMouth = true; },   // mantis
    ],
    spirit: [
      (b, R, o) => { ell(b, 15.5, 11, 8, 7, 1); rect(b, 11, 16, 20, 20, 1); for (let x = 12; x < 16; x += 2) rect(b, x, 19, x, 20, 3); for (let i = 0; i < 3; i++) line(b, 10 + i * 5, 22, 9 + i * 6, 29, 7, 2); o.top = 4; o.cy = 11; o.rx = 8; o.ry = 7; o.faceY = 11; o.gap = 3; o.noMouth = true; },   // floating skull
      (b, R, o) => { tri(b, 11, 6, 16, 6, 5, 29, 4); tri(b, 13, 12, 18, 12, 9, 27, 1); ell(b, 15.5, 8, 4.5, 5, 1); line(b, 12, 14, 5, 19, 1, 2); put(b, 4, 20, 3); put(b, 5, 21, 3); o.top = 3; o.cy = 15; o.rx = 7; o.ry = 10; o.faceY = 8; o.gap = 2; o.noMouth = true; },   // banshee
      (b, R, o) => { ell(b, 15.5, 20, 6, 7, 1); tri(b, 11, 19, 16, 19, 15.5, 2, 1); ell(b, 15.5, 21, 3, 4, 2); for (let k = 0; k < 5; k++) put(b, 9 - (k % 2), 8 + k * 4, 7); o.top = 2; o.cy = 20; o.rx = 6; o.ry = 7; o.faceY = 21; o.gap = 2; o.noMouth = true; o.noHorns = true; },   // wisp
    ],
    plant: [
      (b, R, o) => { rect(b, 14, 18, 17, 28, 1); ell(b, 8, 24, 4, 2, 1); ell(b, 10, 12, 7, 8, 2); ell(b, 10, 13, 5, 6, 1); rect(b, 14, 6, 17, 17, 8); for (let y = 8; y <= 16; y += 2) put(b, 13, y, 3); put(b, 9, 9, 5); put(b, 10, 9, 5); o.top = 4; o.cy = 12; o.rx = 8; o.ry = 8; o.noEyes = true; o.noMouth = true; o.noHorns = true; },   // flytrap
      (b, R, o) => { rect(b, 11, 12, 20, 27, 1); for (const x of [13, 16, 18]) line(b, x, 14, x, 26, 8); line(b, 11, 26, 7, 28, 1, 2); line(b, 11, 14, 5, 8, 1, 2); ell(b, 4, 6, 3.4, 3, 2); ell(b, 15.5, 7, 5.5, 4, 2); o.top = 3; o.cy = 19; o.rx = 5; o.ry = 8; o.faceY = 17; o.gap = 3; o.noHorns = true; },   // treant
      (b, R, o) => { rect(b, 13, 6, 18, 27, 1); ell(b, 15.5, 7, 3, 3, 1); rect(b, 6, 14, 12, 15, 1); rect(b, 6, 9, 7, 15, 1); ell(b, 15.5, 3, 2, 1.6, 2); put(b, 15, 3, 7); for (const [x, y] of [[14, 12], [14, 19], [17, 22], [8, 11]]) put(b, x, y, 3); o.top = 2; o.cy = 17; o.rx = 3; o.ry = 8; o.faceY = 15; o.gap = 2; o.noMouth = true; o.noHorns = true; },   // cactus
      (b, R, o) => { rect(b, 13, 16, 18, 27, 1); rect(b, 11, 26, 20, 27, 3); ell(b, 15.5, 11, 10, 7, 2); for (const [x, y] of [[9, 9], [12, 6], [20, 10]]) ell(b, x, y, 1.6, 1.4, 3); rect(b, 7, 15, 24, 15, 8); o.top = 4; o.cy = 20; o.rx = 4; o.ry = 8; o.faceY = 21; o.gap = 2; o.noMouth = true; o.noHorns = true; },   // mushroom
    ],
    floater: [
      (b, R, o) => { ell(b, 15.5, 10, 9, 7, 1); ell(b, 15.5, 11, 5, 3, 7); for (let i = 0; i < 6; i++) { let cx = 15.5 - 8 + i * 3.2; for (let y = 16; y <= 29; y++) { cx += Math.sin(y * .6 + i * 1.7) * .5; put(b, cx, y, i % 2 ? 2 : 1); } } o.top = 3; o.cy = 10; o.rx = 9; o.ry = 7; o.faceY = 9; o.gap = 3; o.noMouth = true; o.noHorns = true; },   // jellyfish
      (b, R, o) => { ell(b, 15.5, 15, 5, 5, 1); for (let a = 0; a < 6.283; a += .12) put(b, 15.5 + Math.cos(a) * 12, 15 + Math.sin(a) * 4, 3); ell(b, 4, 15, 1.6, 1.6, 7); ell(b, 15.5, 4, 1.2, 1.2, 7); o.top = 9; o.cy = 15; o.rx = 12; o.ry = 5; o.faceY = 15; o.gap = 2; o.eyeKind = 1; o.noMouth = true; o.noHorns = true; },   // ringed orb
      (b, R, o) => { ell(b, 15.5, 18, 9, 9, 1); for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283 + .4, x = 15.5 + Math.cos(a) * 9, y = 18 + Math.sin(a) * 9; tri(b, x - 1, y - 1, x + 1, y + 1, x + Math.cos(a) * 5, y + Math.sin(a) * 5, 3); } line(b, 15.5, 9, 18, 4, 3); put(b, 18, 3, 7); put(b, 19, 2, 7); o.top = 3; o.cy = 18; o.rx = 9; o.ry = 9; o.faceY = 18; o.gap = 3; o.noHorns = true; },   // spiked bomb
    ],
    beast: [
      (b, R, o) => { b.sym = false; ell(b, 12, 17, 8, 3.8, 1); for (const x of [5, 7, 16, 18]) { rect(b, x, 19, x + 1, 27, 1); rect(b, x, 27, x + 1, 27, 3); } ell(b, 21, 13, 3.6, 3.2, 1); ell(b, 25, 14, 2, 1.4, 1); tri(b, 19, 11, 21, 11, 19, 5, 1); tri(b, 22, 11, 24, 11, 23, 6, 1); line(b, 4, 16, 1, 12, 1, 2); line(b, 1, 12, 3, 6, 1, 2); put(b, 22, 12, 5); put(b, 22, 11, 8); o.hx = 22; o.hy = 12; o.top = 5; o.cy = 17; o.rx = 8; o.ry = 4; o.noEyes = true; o.noMouth = true; o.noHorns = true; o.side = true; },   // cat
      (b, R, o) => { b.sym = false; ell(b, 12, 19, 9, 6.5, 1); ell(b, 22, 20, 4.5, 4, 1); ell(b, 26, 21, 2.4, 2, 1); for (const x of [5, 9, 15, 19]) { rect(b, x, 24, x + 2, 27, 1); rect(b, x, 27, x + 2, 27, 3); } tri(b, 25, 23, 27, 23, 28, 18, 3); for (let i = 0; i < 5; i++) tri(b, 5 + i * 3, 13, 7 + i * 3, 13, 6 + i * 3, 9, 2); line(b, 3, 17, 1, 14, 1, 2); put(b, 23, 18, 5); put(b, 23, 17, 8); o.hx = 23; o.hy = 18; o.top = 9; o.cy = 19; o.rx = 9; o.ry = 6; o.noEyes = true; o.noMouth = true; o.noHorns = true; o.side = true; },   // boar
      (b, R, o) => { b.sym = false; ell(b, 14, 18, 10, 7, 2); ell(b, 14, 18, 8, 5, 1, 2); line(b, 8, 12, 14, 18, 8); line(b, 14, 11, 14, 24, 8); ell(b, 25, 19, 3, 2.6, 1); for (const x of [7, 19]) { rect(b, x, 24, x + 3, 27, 1); rect(b, x, 27, x + 3, 27, 3); } tri(b, 4, 20, 4, 24, 1, 24, 1); for (let i = 0; i < 4; i++) tri(b, 6 + i * 5, 12, 8 + i * 5, 12, 7 + i * 5, 8, 3); put(b, 26, 18, 5); put(b, 26, 17, 8); o.hx = 26; o.hy = 18; o.top = 8; o.cy = 18; o.rx = 10; o.ry = 7; o.noEyes = true; o.noMouth = true; o.noHorns = true; o.side = true; },   // armoured turtle
      (b, R, o) => { b.sym = false; ell(b, 13, 18, 8, 3.4, 1); for (const x of [7, 9, 17, 19]) { rect(b, x, 20, x, 27, 1); rect(b, x, 27, x + 1, 27, 3); } ell(b, 4, 14, 4.2, 3.4, 2); ell(b, 1.5, 12, 1.8, 1.6, 3); ell(b, 22, 14, 3.2, 2.8, 1); ell(b, 26, 15, 2.4, 1.1, 1); tri(b, 20, 12, 22, 12, 20, 6, 1); tri(b, 23, 12, 25, 12, 24, 7, 1); put(b, 24, 13, 8); put(b, 27, 15, 3); put(b, 23, 13, 5); put(b, 23, 12, 8); o.hx = 23; o.hy = 13; o.top = 6; o.cy = 18; o.rx = 8; o.ry = 3; o.noEyes = true; o.noMouth = true; o.noHorns = true; o.side = true; },   // fox, bushy tail
      (b, R, o) => { b.sym = false; ell(b, 12, 13, 7, 3.4, 1); for (const x of [6, 8, 16, 18]) { rect(b, x, 15, x, 27, 1); rect(b, x, 27, x + 1, 27, 3); } line(b, 17, 12, 22, 7, 1, 3); ell(b, 23, 6, 2.8, 2.3, 1); ell(b, 26, 7, 2, 1.1, 1); line(b, 22, 4, 19, 0, 3, 1); line(b, 23, 4, 26, 0, 3, 1); line(b, 20, 2, 17, 2, 3, 1); line(b, 5, 12, 3, 14, 1, 1); put(b, 24, 6, 5); put(b, 24, 5, 8); o.hx = 24; o.hy = 6; o.top = 0; o.cy = 13; o.rx = 7; o.ry = 3; o.noEyes = true; o.noMouth = true; o.noHorns = true; o.side = true; },   // stag, long legs
      (b, R, o) => { b.sym = false; ell(b, 13, 17, 6, 7, 1); ell(b, 11, 11, 5.2, 3, 1); line(b, 9, 12, 6, 26, 1, 3); line(b, 18, 13, 20, 26, 1, 3); rect(b, 9, 23, 11, 27, 1); rect(b, 15, 23, 17, 27, 1); rect(b, 9, 27, 12, 27, 3); rect(b, 15, 27, 18, 27, 3); ell(b, 21, 11, 3.2, 3, 1); ell(b, 24, 12, 2, 1.6, 2); line(b, 7, 20, 3, 23, 1, 2); put(b, 22, 10, 5); put(b, 22, 9, 8); o.hx = 22; o.hy = 10; o.top = 8; o.cy = 17; o.rx = 6; o.ry = 7; o.noEyes = true; o.noMouth = true; o.noHorns = true; o.side = true; },   // hunched ape
      (b, R, o) => { b.sym = false; ell(b, 13, 21, 10, 2.8, 1); for (const x of [5, 8, 17, 20]) { rect(b, x, 22, x, 27, 1); rect(b, x, 27, x + 1, 27, 3); } line(b, 3, 20, 0, 15, 1, 2); put(b, 0, 14, 8); ell(b, 24, 19, 2.8, 2.4, 1); ell(b, 27, 20, 1.7, 1, 1); ell(b, 22, 16.6, 1.2, 1.2, 1); put(b, 25, 18, 5); put(b, 25, 17, 8); o.hx = 25; o.hy = 18; o.top = 14; o.cy = 21; o.rx = 10; o.ry = 3; o.noEyes = true; o.noMouth = true; o.noHorns = true; o.side = true; },   // weasel, low and long
    ],
    dragon: [
      (b, R, o) => { b.sym = false; ell(b, 11, 20, 6, 4, 1); line(b, 15, 18, 21, 9, 1, 3); ell(b, 23, 8, 3, 2.6, 1); ell(b, 26, 9, 2, 1.4, 1); tri(b, 5, 17, 14, 17, 1, 1, 4); tri(b, 8, 17, 14, 17, 11, 5, 4); rect(b, 8, 24, 9, 27, 1); rect(b, 12, 24, 13, 27, 1); rect(b, 8, 27, 10, 27, 3); line(b, 6, 21, 0, 27, 1, 2); put(b, 24, 7, 5); put(b, 24, 6, 8); tri(b, 22, 6, 23, 6, 20, 2, 3); o.hx = 24; o.hy = 7; o.top = 1; o.cy = 20; o.rx = 6; o.ry = 4; o.noEyes = true; o.noMouth = true; o.noHorns = true; o.side = true; },   // wyvern
      (b, R, o) => { b.sym = false; ell(b, 10, 21, 9, 3.6, 1); line(b, 17, 20, 22, 10, 1, 3); ell(b, 24, 9, 3, 2.6, 1); ell(b, 27, 10, 2, 1.4, 1); for (const x of [5, 15]) { rect(b, x, 23, x + 1, 27, 1); rect(b, x, 27, x + 2, 27, 3); } line(b, 2, 21, 0, 26, 1, 2); for (let i = 0; i < 6; i++) tri(b, 4 + i * 3, 18, 6 + i * 3, 18, 5 + i * 3, 14, 3); tri(b, 8, 18, 13, 18, 10, 12, 4); put(b, 25, 8, 5); put(b, 25, 7, 8); o.hx = 25; o.hy = 8; o.top = 6; o.cy = 21; o.rx = 9; o.ry = 4; o.noEyes = true; o.noMouth = true; o.noHorns = true; o.side = true; },   // long drake
    ],
    fish: [
      (b, R, o) => { b.sym = false; ell(b, 14, 18, 9, 7, 1); ell(b, 23, 20, 4, 4, 8); for (let i = 0; i < 4; i++) tri(b, 20 + i * 2, 18, 21 + i * 2, 18, 20 + i * 2, 22, 3); line(b, 19, 11, 25, 5, 3); ell(b, 26, 5, 2, 2, 7); tri(b, 6, 18, 0, 11, 0, 25, 4); put(b, 19, 14, 5); put(b, 19, 13, 8); o.hx = 19; o.hy = 14; o.top = 4; o.cy = 18; o.rx = 9; o.ry = 7; o.noEyes = true; o.noMouth = true; o.noHorns = true; o.side = true; },   // angler
      (b, R, o) => { b.sym = false; ell(b, 15, 16, 13, 3.6, 1); tri(b, 3, 16, 14, 8, 20, 16, 4); tri(b, 3, 16, 14, 24, 20, 16, 4); line(b, 3, 16, 0, 22, 1, 1); put(b, 0, 23, 3); put(b, 1, 24, 3); ell(b, 24, 15, 3, 2, 1); put(b, 25, 14, 5); put(b, 25, 13, 8); o.hx = 25; o.hy = 14; o.top = 8; o.cy = 16; o.rx = 13; o.ry = 4; o.noEyes = true; o.noMouth = true; o.noHorns = true; o.side = true; },   // ray
      (b, R, o) => { b.sym = false; for (let x = 2; x <= 26; x++) { const y = 17 + Math.sin(x * .5) * 3; ell(b, x, y, 2.2 - x * .02, 2.2 - x * .02, x % 5 < 2 ? 2 : 1); } const hy = 17 + Math.sin(13) * 3; ell(b, 27, hy, 3.4, 3, 1); for (let x = 5; x < 24; x += 3) tri(b, x, 17 + Math.sin(x * .5) * 3 - 3, x + 2, 17 + Math.sin(x * .5) * 3 - 3, x + 1, 17 + Math.sin(x * .5) * 3 - 7, 4); put(b, 28, hy - 1, 5); put(b, 28, hy - 2, 8); put(b, 30, hy + 1, 8); o.hx = 28; o.hy = hy - 1; o.top = 8; o.cy = 17; o.rx = 12; o.ry = 5; o.noEyes = true; o.noMouth = true; o.noHorns = true; o.side = true; },   // eel
      (b, R, o) => { b.sym = false; ell(b, 15, 16, 9, 9, 1); for (let k = 0; k < 10; k++) { const a = k / 10 * 6.283, x = 15 + Math.cos(a) * 9, y = 16 + Math.sin(a) * 9; tri(b, x - 1, y - 1, x + 1, y + 1, x + Math.cos(a) * 4, y + Math.sin(a) * 4, 3); } tri(b, 6, 16, 1, 11, 1, 21, 4); ell(b, 20, 17, 2.4, 2, 8); ell(b, 21, 11, 2, 2, 6); put(b, 21, 11, 5); put(b, 20, 11, 5); o.hx = 21; o.hy = 11; o.top = 7; o.cy = 16; o.rx = 9; o.ry = 9; o.noEyes = true; o.noMouth = true; o.noHorns = true; o.side = true; },   // pufferfish
    ],
  };
  for (const k of Object.keys(VARS)) { const base = PLANS[k]; PLANS[k] = (b, R, o) => { const i = (o.vk || 0) % (VARS[k].length + 1); return i === 0 ? base(b, R, o) : VARS[k][i - 1](b, R, o); }; }
  const sideEyes = (b, c, o) => {   // beast / dragon / fish: the shared eye pixel is replaced by one of 6 looks
    if (o.hx == null) return; const x = Math.round(o.hx), y = Math.round(o.hy), k = c.ek != null ? c.ek % 6 : (c.seed >>> 11) % 6;
    for (let dx = -1; dx <= 3; dx++) for (let dy = -2; dy <= 1; dy++) if (get(b, x + dx, y + dy) === 5 || get(b, x + dx, y + dy) === 6) setc(b, x + dx, y + dy, 1);
    const sp = (px, py, v) => { if (get(b, px, py)) setc(b, px, py, v); };
    if (k === 0) { sp(x, y, 6); sp(x + 1, y, 5); sp(x, y - 1, 8); sp(x + 1, y - 1, 8); }
    else if (k === 1) { sp(x, y, 6); sp(x + 1, y, 6); sp(x, y + 1, 6); sp(x + 1, y, 5); }
    else if (k === 2) { for (const [a, bb] of [[0, -1], [1, -1], [0, 0], [1, 0]]) sp(x + a, y + bb, 5); sp(x - 1, y - 1, 6); sp(x + 2, y, 6); }
    else if (k === 3) { sp(x + 1, y - 1, 5); sp(x, y + 1, 5); sp(x + 2, y + 1, 5); sp(x + 1, y, 6); }
    else if (k === 4) { for (let dx = 0; dx <= 3; dx++) { sp(x + dx, y, 5); sp(x + dx, y - 1, 6); } sp(x - 1, y - 1, 8); }
    else { sp(x, y - 1, 5); sp(x + 1, y, 5); sp(x + 2, y + 1, 5); sp(x, y, 6); sp(x + 1, y - 1, 6); }
  };
  const PLAN_KEYS = Object.keys(PLANS);
  const FRONT = new Set(['blob', 'biped', 'golem', 'bird', 'serpent', 'insect', 'spirit', 'plant', 'floater']);

  /* ---------- type decorations: each type adds its own features, whatever the body plan ---------- */
  const surfaces = b => {   // lists of body cells by where they are: top edge, left/right edge, bottom edge, inside
    const top = [], side = [], bot = [], inn = [];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (get(b, x, y) === 1 || get(b, x, y) === 2) {
      if (!get(b, x, y - 1)) top.push([x, y]); else if (!get(b, x, y + 1)) bot.push([x, y]);
      else if (!get(b, x - 1, y) || !get(b, x + 1, y)) side.push([x, y]); else inn.push([x, y]);
    }
    return { top, side, bot, inn };
  };
  const spread = (R, arr, n) => { if (!arr.length) return []; const s = arr.slice().sort((p, q) => p[0] - q[0]), out = []; for (let i = 0; i < n; i++) out.push(s[Math.min(s.length - 1, Math.floor((i + .5 + (R() - .5) * .6) / n * s.length))]); return out; };
  const DECOR = {
    feu(b, R, S) { for (const [x, y] of spread(R, S.top, ri(R, 3, 4))) { const h = ri(R, 2, 4); for (let k = 1; k <= h; k++) put(b, x, y - k, k === h ? 2 : 7); put(b, x + (R() < .5 ? -1 : 1), y - 1, 7); } for (const [x, y] of spread(R, S.inn, 3)) put(b, x, y, 7); },
    eau(b, R, S) { for (const [x, y] of spread(R, S.inn, 3)) { put(b, x, y, 7); put(b, x + 1, y + 1, 7); } for (const [x, y] of spread(R, S.bot, 2)) { put(b, x, y + 1, 2); put(b, x, y + 2, 7); } },
    plante(b, R, S) { for (const [x, y] of spread(R, S.top, 2)) { put(b, x, y - 1, 1); ell(b, x + 1, y - 3, 1.6, 1.1, 2); put(b, x + 1, y - 3, 7); } for (const [x, y] of spread(R, S.inn, 3)) { put(b, x, y, 2); put(b, x, y + 1, 2); } },
    foudre(b, R, S) { const p = spread(R, S.inn, 1)[0] || [15, 14]; let [x, y] = p; for (let i = 0; i < 6; i++) { put(b, x, y, 7); x += i % 2 ? -1 : 2; y += 1; if (get(b, x, y) === 0) break; } for (const [tx, ty] of spread(R, S.top, 3)) { put(b, tx, ty - 1, 7); put(b, tx, ty - 2, 3); } },
    glace(b, R, S) { for (const [x, y] of spread(R, S.top, 4)) { const h = ri(R, 2, 5); for (let k = 1; k <= h; k++) put(b, x, y - k, k > h - 1 ? 3 : 7); } for (const [x, y] of spread(R, S.inn, 2)) { put(b, x, y, 3); put(b, x + 1, y + 1, 3); } },
    roche(b, R, S) { for (const [x, y] of spread(R, S.inn, 3)) { let cx = x, cy = y; for (let i = 0; i < ri(R, 3, 5); i++) { put(b, cx, cy, 8); cx += R() < .5 ? -1 : 1; cy += 1; if (get(b, cx, cy) === 0) break; } } for (const [x, y] of spread(R, S.top, 3)) { put(b, x, y - 1, 1); put(b, x + 1, y - 1, 3); } },
    vent(b, R, S) { for (const [x, y] of spread(R, S.side, 4)) { const dir = x < 15.5 ? -1 : 1; for (let k = 1; k <= 3; k++) if (!get(b, x + dir * k, y)) put(b, x + dir * k, y - (k === 3 ? 1 : 0), 7); } },
    ombre(b, R, S) { for (const [x, y] of spread(R, S.top.concat(S.side), 5)) { let cx = x, cy = y; const up = R() < .6; for (let k = 0; k < ri(R, 2, 4); k++) { cx += R() < .5 ? -1 : 1; cy += up ? -1 : 1; if (!get(b, cx, cy)) put(b, cx, cy, 8); } } },
    lumiere(b, R, S) { const t = S.top.length ? S.top.reduce((a, p) => p[1] < a[1] ? p : a) : [15, 6]; const y = t[1] - 4, x = t[0]; for (let i = -2; i <= 2; i++) { put(b, x + i, y - 1, 7); put(b, x + i, y + 1, 7); } put(b, x - 3, y, 7); put(b, x + 3, y, 7); for (const [px, py] of spread(R, S.inn, 3)) put(b, px, py, 7); },
    poison(b, R, S) { for (const [x, y] of spread(R, S.inn, 3)) { put(b, x, y, 2); put(b, x + 1, y, 2); put(b, x, y + 1, 2); } for (const [x, y] of spread(R, S.bot, 3)) { put(b, x, y + 1, 2); if (R() < .6) put(b, x, y + 2, 7); } for (const [x, y] of spread(R, S.top, 2)) { put(b, x, y - 2, 7); } },
    acier(b, R, S) { const ys = S.inn.map(p => p[1]); if (ys.length) { const y0 = Math.round((Math.min(...ys) + Math.max(...ys)) / 2); for (let x = 0; x < N; x++) if (get(b, x, y0) === 1) put(b, x, y0, 8); } for (const [x, y] of spread(R, S.inn, 4)) put(b, x, y, 3); for (const [x, y] of spread(R, S.top, 2)) { put(b, x, y - 1, 3); put(b, x, y - 2, 3); } },
    esprit(b, R, S) { for (let i = 0; i < 4; i++) { const a = R() * 6.28, r = 11 + R() * 3; const x = 15.5 + Math.cos(a) * r, y = 15 + Math.sin(a) * r * .8; if (!get(b, Math.round(x), Math.round(y))) { put(b, x, y, 7); put(b, x + 1, y, 7); } } const t = spread(R, S.inn, 1)[0]; if (t) { put(b, t[0], t[1], 5); put(b, t[0], t[1], 6); } },
  };
  /* accessories: one per creature, picked by its seed, so two creatures of the same kind rarely share an outline */
  const ACC = [
    null,
    (b, R, S, o, T) => { tri(b, T[0] - 5, T[1] + 1, T[0] + 5, T[1] + 1, T[0], T[1] - 4, 3); line(b, T[0] - 5, T[1] + 1, T[0] + 5, T[1] + 1, 8); put(b, T[0], T[1] - 3, 7); },   // wide hat
    (b, R, S, o) => { const ry = o.ry || 6; for (let x = 2; x < 30; x++) { const y = Math.round((o.cy || 16) - ry * .3 + (x - 15.5) * .35); for (let d = 0; d < 2; d++) if (get(b, x, y + d) === 1 || get(b, x, y + d) === 2) put(b, x, y + d, d ? 8 : 2); } },   // sash
    (b, R, S) => { for (const [x, y] of spread(R, S.top, 5)) tri(b, x - 1, y, x + 1, y, x, y - 3, 4); },   // back fins
    (b, R, S, o, T) => { const g = S.inn.slice().sort((p, q) => p[1] - q[1])[2] || [T[0], T[1] + 3]; put(b, g[0] - 1, g[1], 8); put(b, g[0] + 1, g[1], 8); put(b, g[0], g[1] - 1, 8); put(b, g[0], g[1] + 1, 8); put(b, g[0], g[1], 7); },   // forehead gem
    (b, R, S) => { for (let i = 0; i < 3; i++) { const a = R() * 6.28, r = 12 + R() * 3, x = 15.5 + Math.cos(a) * r, y = 15 + Math.sin(a) * r * .8; if (!get(b, Math.round(x), Math.round(y))) { ell(b, x, y, 1.2, 1.2, 7); put(b, x, y, 8); } } },   // orbiting orbs
    (b, R, S) => { for (const [x, y] of spread(R, S.side, 2)) { const dir = x < 15.5 ? -1 : 1; tri(b, x, y - 1, x, y + 1, x + dir * 3, y + 2, 8); } },   // tusks
    (b, R, S) => { for (const [x, y] of S.inn) if ((x + y) % 4 === 0 && get(b, x, y) === 1) put(b, x, y, 2); },   // scales
    (b, R, S, o, T) => { for (let i = -3; i <= 3; i++) put(b, T[0] + i, T[1] - 2 - (i % 2 ? 0 : 1), 8); },   // crown
    (b, R, S, o) => { for (let t = 0; t < 9; t += .35) { const r = t * .75, x = 15.5 + Math.cos(t) * r, y = (o.cy || 16) + Math.sin(t) * r * .7; if (get(b, Math.round(x), Math.round(y)) === 1) put(b, x, y, 2); } },   // spiral
  ];
  const decor = (b, R, c, o) => { const keep = b.sym; let S = surfaces(b); for (const t of [c.t, c.t2].filter(Boolean)) DECOR[t]?.(b, R, S); const A = rng(c.seed ^ 0xacce55), k = c.ac ?? (A() < .3 ? 0 : 1 + Math.floor(A() * (ACC.length - 1))); if (ACC[k]) { S = surfaces(b); const T = S.top.length ? S.top.reduce((p, q) => q[1] < p[1] || (q[1] === p[1] && Math.abs(q[0] - 15.5) < Math.abs(p[0] - 15.5)) ? q : p) : [15, 8]; ACC[k](b, A, S, o, T); } return keep; };

  /* ---------- the picture ---------- */
  const build = c => {
    const R = rng(c.seed), b = mk(), o = { vk: c.vk != null ? c.vk : c.seed >>> 5 };
    PLANS[c.plan](b, R, o); if (c.ek != null) o.eyeKind = c.ek;
    const sym = b.sym;
    // shape variants shared by every plan
    markings(b, R, c.mk ?? [0, 1, 1, 2, 2, 3, 3, 3, 4, 6][ri(R, 0, 9)], 15.5, o.cy, o.rx || 8, o.ry || 6);
    if (sym) kit(b, R, o, c); else sideKit(b, R, o, c);
    if (sym && !o.noHorns) hornsFront(b, R, 15.5, o.top, c.hn ?? pick(R, [0, 1, 1, 2, 2, 4, 5]), c.hw ?? ri(R, 2, 4));
    if (sym && !o.noEyes) eyes(b, R, 15.5, o.faceY, o.gap || 3, o, c);
    if (!sym) sideEyes(b, c, o);
    if (sym && !o.noMouth && o.faceY) mouth(b, R, 15.5, o.faceY + 3, ri(R, 1, 2), c.mo ?? ri(R, 0, 3));
    decor(b, rng(c.seed ^ 0x51ed27), c, o);
    return { b, o, sym };
  };
  const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  const hash = (x, y, s) => { let h = Math.imul(x + 1, 73856093) ^ Math.imul(y + 1, 19349663) ^ Math.imul(s | 0, 83492791); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) % 100; };
  /* The 32 x 32 drawing is upscaled to 64 x 64 with edge smoothing (EPX), then lit pixel by pixel from a height field (distance to the edge),
     given a material texture, ink lines between parts, glowing eyes with a halo, a glint and a ground shadow. */
  const FN = N * 2;
  const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t].map(Math.round);
  const rampN = r => { const o = []; for (let j = 0; j <= 2 * (r.length - 1); j++) { const i = j >> 1; o.push(j & 1 ? mixc(r[i], r[i + 1], .5) : r[i]); } return o; };
  // EPX: doubles an index grid while smoothing diagonal steps of the body parts (values 1..4 only)
  const epx = (g, n) => {
    const m = n * 2, F = new Uint8Array(m * m), at = (x, y) => (x < 0 || y < 0 || x >= n || y >= n) ? 0 : g[y * n + x], sm = v => v <= 4;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const P = at(x, y), A = at(x, y - 1), B = at(x + 1, y), C = at(x - 1, y), D = at(x, y + 1); let p1 = P, p2 = P, p3 = P, p4 = P;
      if (sm(P)) {
        if (C === A && C !== D && A !== B && sm(A)) p1 = A; if (A === B && A !== C && B !== D && sm(B)) p2 = B;
        if (D === C && D !== B && C !== A && sm(C)) p3 = C; if (B === D && B !== A && D !== C && sm(D)) p4 = D;
      }
      F[2 * y * m + 2 * x] = p1; F[2 * y * m + 2 * x + 1] = p2; F[(2 * y + 1) * m + 2 * x] = p3; F[(2 * y + 1) * m + 2 * x + 1] = p4;
    }
    return F;
  };
  /* The 32 x 32 drawing is smoothed up to 64 (thumbnails) or 256 (detail views), then lit pixel by pixel from a height field (distance to the edge),
     given a material texture, ink lines between parts, glowing eyes with a halo, a glint and a ground shadow.
     G is the gain over the 32 grid: 2 = 64 px, 8 = 256 px. All sizes below are written for 64 px and scaled by u = G / 2. */
  // hand-drawn sprites: 128 x 128 palette-indexed pixels (see art.js), run-length encoded
  const artCache = new Map();
  const artImg = c => {
    let cv = artCache.get(c.id); if (cv) return cv; const A = c.art, w = A.w, im = new ImageData(w, w), pal = A.pal.map(h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)));
    A.px.forEach((row, y) => { let x = 0; const re = /(.)(\d*)/g; let m; while ((m = re.exec(row))) { const n = m[2] ? +m[2] : 1, k = m[1] === '.' ? 0 : m[1].charCodeAt(0) - 256; for (let i = 0; i < n; i++, x++) if (k) { const q = (y * w + x) * 4, p = pal[k - 1]; im.data[q] = p[0]; im.data[q + 1] = p[1]; im.data[q + 2] = p[2]; im.data[q + 3] = 255; } } });
    cv = document.createElement('canvas'); cv.width = cv.height = w; cv.getContext('2d').putImageData(im, 0, 0); artCache.set(c.id, cv); return cv;
  };
  const renderArt = (c, ctx2d, scale, ox, oy, frame) => {
    const A = c.art, S = N * scale, bob = frame % 2 ? -scale : 0, sm0 = ctx2d.imageSmoothingEnabled;
    if (A.sh) { ctx2d.fillStyle = 'rgba(0,0,0,.28)'; ctx2d.beginPath(); ctx2d.ellipse(ox + A.sh[0] * S, oy + A.sh[1] * S, A.sh[2] * S * .95, Math.max(1, scale * .9), 0, 0, 6.2832); ctx2d.fill(); }
    ctx2d.imageSmoothingEnabled = scale < 4; if (scale < 4) ctx2d.imageSmoothingQuality = 'high';
    ctx2d.drawImage(artImg(c), ox, oy + bob, S, S); ctx2d.imageSmoothingEnabled = sm0;
  };
  const render = (c, ctx2d, scale = 1, ox = 0, oy = 0, frame = 0) => {
    if (c.art) return renderArt(c, ctx2d, scale, ox, oy, frame);
    const G = scale >= 4 ? 8 : 2, u = G / 2, FN = N * G;
    const { b, o } = build(c), P = palette(c, rng(c.seed ^ 0x9e3779b9)), r = RK[c.r];
    let F = b.h;
    {   // eyes, glows and dark marks are single cells of the grid: turn them into round blobs (metaballs) instead of squares
      const gg = b.g, at = (x, y) => (x < 0 || y < 0 || x >= N || y >= N) ? 0 : gg[y * N + x], tmp = F.slice();
      for (let y = 0; y < FX; y++) for (let x = 0; x < FX; x++) {
        const v0 = F[y * FX + x]; if (v0 < 5) continue;
        const px = (x + .5) / K, py = (y + .5) / K, cx = Math.floor(px), cy = Math.floor(py), M = {}; let near = 0, nd = 9;
        for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
          const v = at(cx + i, cy + j), dd = Math.hypot(cx + i + .5 - px, cy + j + .5 - py);
          if (v >= 5) { const w = Math.max(0, 1 - dd / .8); M[v] = (M[v] || 0) + w; } else if (v && dd < nd) { nd = dd; near = v; }
        }
        let bv = 0, bm = .55; for (const k in M) if (M[k] > bm) { bm = M[k]; bv = +k; }
        tmp[y * FX + x] = bv || near;
      }
      F = tmp;
    }
    if (G < K) { const q = K / G, F2 = new Uint8Array(FN * FN); for (let y = 0; y < FN; y++) for (let x = 0; x < FN; x++) F2[y * FN + x] = F[(y * q + (q >> 1)) * FX + x * q + (q >> 1)]; F = F2; }
    const body9 = rampN(P.body), acc9 = rampN(P.acc), mem = rampN(P.mem);
    const fv = (x, y) => (x < 0 || y < 0 || x >= FN || y >= FN) ? 0 : F[y * FN + x], solid = v => v !== 0 && v !== 7;
    // distance to the edge (two-pass chamfer), then a dome-like height
    const d = new Float32Array(FN * FN), D = (x, y) => (x < 0 || y < 0 || x >= FN || y >= FN) ? 0 : d[y * FN + x];
    for (let i = 0; i < FN * FN; i++) d[i] = solid(F[i]) ? 999 : 0;
    for (let y = 0; y < FN; y++) for (let x = 0; x < FN; x++) { const i = y * FN + x; if (d[i]) d[i] = Math.min(d[i], D(x - 1, y) + 1, D(x, y - 1) + 1, D(x - 1, y - 1) + 1.4, D(x + 1, y - 1) + 1.4); }
    for (let y = FN - 1; y >= 0; y--) for (let x = FN - 1; x >= 0; x--) { const i = y * FN + x; if (d[i]) d[i] = Math.min(d[i], D(x + 1, y) + 1, D(x, y + 1) + 1, D(x + 1, y + 1) + 1.4, D(x - 1, y + 1) + 1.4); }
    const HR = 3.5 * G, H = (x, y) => Math.sqrt(Math.min(D(x, y), HR) / HR);
    const cy = (o.cy || 16) * G, ry = ((o.ry || 8) + 2) * G, out = new Array(FN * FN).fill(null), cat = v => v >= 1 && v <= 4 ? v : 0;
    const NK = 3.2 * u, bayK = G === 2 ? .9 : .3;
    let best = -9, bx = -1, by = -1;
    for (let y = 0; y < FN; y++) for (let x = 0; x < FN; x++) {
      const v = F[y * FN + x]; if (!v) continue; let col;
      const hx = H(x + 1, y) - H(x - 1, y), hy = H(x, y + 1) - H(x, y - 1), nz = 1 / Math.hypot(hx * NK, hy * NK, 1), dot = (-hx * NK * nz) * -.6 + (-hy * NK * nz) * -.6 + nz * .5, bay = BAYER[y & 3][x & 3] / 16 - .5;
      if (v === 1 || v === 2 || v === 4) {
        let t = 2 + (-(x / G - 15.5) * .03 - (y - cy) / ry * .5) + (dot - .5) * 3.6;
        if (v !== 4) {
          // pattern coordinates: the 64 px grid at G = 2, a 128 px grid at G = 8 (finer scales, fur and rivets)
          const X = G === 2 ? x : x >> 1, Y = G === 2 ? y : y >> 1, h = hash(X, Y, c.seed);
          const pl = c.plan;   // body texture by family
          if (pl === 'beast') { t -= (h < 11 ? .7 : 0) - ((X % 3 === 0 && hash(X, Y >> 2, c.seed) > 62) ? .35 : 0); if (G > 2 && (X * 2 + Y) % 11 === 0 && hash(X >> 2, Y >> 2, c.seed) > 45) t -= .45; }
          else if (pl === 'dragon' || pl === 'fish' || pl === 'serpent') { const off = ((Y >> 2) & 1) * 2; if (((X + off) & 3) === 0 || (Y & 3) === 0) t -= .5; else if (((X + off) & 3) === 1 && (Y & 3) === 1) t += .5; }
          else if (pl === 'bird') { if ((Y & 5) === 0) t -= .45; if (((X >> 1) + (Y >> 2)) & 1) t += .15; }
          else if (pl === 'insect') { if (Y % 6 === 0) t -= .8; if (X % 8 === 3 && Y % 6 === 2) t += .7; }
          else if (pl === 'golem') { if (Y % 9 === 0 || ((X + (Y / 9 | 0) * 5) % 10 === 0)) t -= .65; if (h < 3) t -= 1.1; }
          else if (pl === 'blob' || pl === 'spirit' || pl === 'floater') { if (h < 2) t += 1.4; }
          else if (pl === 'plant') { if ((X + Y * 2) % 8 === 0) t -= .5; }
          for (const ty of [c.t, c.t2]) { if (!ty) continue;
            if (ty === 'roche') t -= h < 12 ? 1 : h > 93 ? -.7 : 0;
            else if (ty === 'acier') t += (Y % 8 < 2 ? .7 : 0) + (X % 14 === 1 && Y % 8 === 4 ? 1 : 0);
            else if (ty === 'glace') t += ((X + Y) % 12 === 0 ? 1 : 0) - ((X - Y + 160) % 17 === 0 ? .7 : 0);
            else if (ty === 'eau') t += ((Y + Math.round(Math.sin(X * .45) * 2.4)) % 8 < 2 ? .7 : 0);
            else if (ty === 'plante') t -= (X % 10 > 4 && (Y + X) % 5 !== 0) ? .35 : 0;
            else if (ty === 'ombre') t -= .5 + (h > 95 ? -1.4 : 0);
            else if (ty === 'lumiere') t += .5;
            else if (ty === 'vent') t += (Y % 6 === 0 ? .6 : 0);
            else if (ty === 'foudre') t += h > 92 ? 1.6 : 0;
          }
          if (G > 2) t += (hash(x, y, c.seed ^ 31) < 9 ? -.18 : hash(x, y, c.seed ^ 57) > 92 ? .18 : 0);   // fine grain
        }
        const pal = v === 1 ? body9 : v === 2 ? acc9 : mem, k = pal.length - 1, scl = v === 4 ? 1 : 2;
        let j = Math.round((v === 4 ? 1 : t) * scl + bay * bayK); j = Math.max(0, Math.min(k, j));
        col = pal[j];
        if (v === 1 && (c.t === 'feu' || c.t2 === 'feu') && y < cy - ry * .3 && D(x, y) <= 2.5 * u) col = acc9[Math.min(k, j + 3)];
        if (v === 1 && (c.t === 'poison' || c.t2 === 'poison') && hash((G === 2 ? x : x >> 1) >> 2, (G === 2 ? y : y >> 1) >> 2, c.seed) < 14) col = acc9[Math.max(0, j - 2)];
        if (t > best && v === 1 && D(x, y) > 2 * u) { best = t; bx = x; by = y; }
      } else if (v === 3) col = P.bone[Math.max(0, Math.min(2, Math.round((dot - .25) * 2.4 + bay * .7)))];
      else if (v === 5) col = P.eye; else if (v === 6) col = P.pupil;
      else if (v === 7) col = P.glow; else col = P.out;
      out[y * FN + x] = col;
    }
    // ink lines where two parts of the body meet (below / right of the boundary)
    const tk = Math.max(1, G >> 2);
    for (let y = 0; y < FN; y++) for (let x = 0; x < FN; x++) { const v = cat(F[y * FN + x]); if (!v) continue; const a = cat(fv(x + tk, y)), bb = cat(fv(x, y + tk)); const diff = q => q && q !== v && !(q <= 2 && v <= 2); if (diff(a) || diff(bb)) out[y * FN + x] = mixc(out[y * FN + x], P.out, G > 2 ? .3 : .5); }
    // selective outline: the neighbour's colour, darkened (tk pixels thick)
    const line2 = new Array(FN * FN).fill(null);
    for (let y = -tk; y < FN + tk; y++) for (let x = -tk; x < FN + tk; x++) { if (x < 0 || y < 0 || x >= FN || y >= FN || solid(fv(x, y))) continue; let n = null; for (let q = 1; q <= tk && !n; q++) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (solid(fv(x + dx * q, y + dy * q))) { n = out[(y + dy * q) * FN + x + dx * q]; break; } } if (n) line2[y * FN + x] = mixc(mixc(n, P.out, .55), P.out, .35); }
    // paint into a float RGBA buffer, then one drawImage (smoothed when the sprite is shown smaller than 256 px)
    const buf = new Float32Array(FN * FN * 4), fr = frame % 2 ? 1 : 0, bob = fr ? -G : 0;
    const paint = (x, y, col, a = 1) => { y += (fr && y < 28 * G ? bob : 0); if (x < 0 || y < 0 || x >= FN || y >= FN) return; const i = (y * FN + x) * 4, da = buf[i + 3], oa = a + da * (1 - a); if (oa <= 0) return; for (let k = 0; k < 3; k++) buf[i + k] = (col[k] * a + buf[i + k] * da * (1 - a)) / oa; buf[i + 3] = oa; };
    const blk = (x, y, col, a = 1, s = u) => { for (let j = 0; j < s; j++) for (let i = 0; i < s; i++) paint(x + i, y + j, col, a); };   // one 64 px pixel
    const sh = (x, y, a) => { if (x < 0 || y < 0 || x >= FN || y >= FN) return; const i = (y * FN + x) * 4, da = buf[i + 3], oa = a + da * (1 - a); for (let k = 0; k < 3; k++) buf[i + k] = buf[i + k] * da * (1 - a) / oa; buf[i + 3] = oa; };
    // aura sparkles for the rarest ones
    if (r >= 3) { const A = rng(c.seed ^ 77), n = 5 + (r - 3) * 5; for (let i = 0; i < n; i++) { const x = ri(A, 2, 61), y = ri(A, 2, 58); if (!fv(x * u, y * u) && ((i + frame) % 3)) { const sc = r >= 4 ? [255, 236, 150] : P.glow; blk(x * u, y * u, sc, .8); if (i % 2) { blk((x + 1) * u, y * u, sc, .4); blk(x * u, (y + 1) * u, sc, .4); } } } }
    let yb = -1, x0 = FN, x1 = -1; for (let y = FN - 1; y >= 0 && yb < 0; y--) for (let x = 0; x < FN; x++) if (fv(x, y)) { yb = y; break; }
    if (yb >= 24 * G && yb < 30 * G) { for (let x = 0; x < FN; x++) if (fv(x, yb)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); } const rows = Math.round(1.5 * G); for (let kk = 1; kk <= rows; kk++) { const ix = Math.min(2, Math.floor((kk - 1) * 2 / G)), a = [.38, .3, .16][ix], mg = [G, 0, -G][ix] - (ix === 0 ? 0 : 0); for (let x = x0 - mg; x <= x1 + mg; x++) { if (ix === 1 && (x <= x0 || x >= x1)) continue; if (ix === 2 && (x <= x0 + G || x >= x1 - G)) continue; sh(x, yb + kk, a); } } }
    for (let i = 0; i < FN * FN; i++) if (line2[i]) paint(i % FN, (i / FN) | 0, line2[i]);
    for (let i = 0; i < FN * FN; i++) if (out[i]) paint(i % FN, (i / FN) | 0, out[i]);
    // glow halos around luminous parts, and on the eyes
    for (let i = 0; i < FN * FN; i++) { const v = F[i]; if (v !== 5 && v !== 7) continue; const x = i % FN, y = (i / FN) | 0, rad = (v === 5 ? 2 : 1) * u; for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) { if ((!dx && !dy) || fv(x + dx, y + dy) === v) continue; paint(x + dx, y + dy, v === 5 ? P.eye : P.glow, (v === 5 ? .2 : .14) / (u > 1 ? 1.6 : 1)); } }
    for (let i = 0; i < FN * FN; i++) if (F[i] === 5 && fv((i % FN) - u, ((i / FN) | 0) - u) !== 5) blk(i % FN, (i / FN) | 0, [255, 255, 255], .75, Math.max(1, u >> 1));
    if (bx >= 0) { blk(bx, by, [255, 255, 255], .55, u); blk(bx + u, by, [255, 255, 255], .3, u); blk(bx, by + u, [255, 255, 255], .3, u); }
    if (r >= 4) blk(Math.round(31 - (o.rx || 8) * .8) * u, Math.round((o.top || 6) * 2 + 4) * u, [255, 252, 220], .9, u);
    const off = document.createElement('canvas'); off.width = off.height = FN; const im = new ImageData(FN, FN);
    for (let i = 0; i < FN * FN; i++) { im.data[i * 4] = buf[i * 4]; im.data[i * 4 + 1] = buf[i * 4 + 1]; im.data[i * 4 + 2] = buf[i * 4 + 2]; im.data[i * 4 + 3] = Math.round(buf[i * 4 + 3] * 255); }
    off.getContext('2d').putImageData(im, 0, 0);
    const sm0 = ctx2d.imageSmoothingEnabled, ga = ctx2d.globalAlpha; ctx2d.globalAlpha = 1; ctx2d.imageSmoothingEnabled = G > 2; if (G > 2) ctx2d.imageSmoothingQuality = 'high';
    ctx2d.drawImage(off, ox, oy, N * scale, N * scale);
    ctx2d.imageSmoothingEnabled = sm0; ctx2d.globalAlpha = ga;
  };
  const cache = new Map();
  const sprite = (c, frame = 0, scale = 2) => {   // a canvas of 32 x scale pixels, shown with image-rendering:pixelated
    const k = c.id + ':' + (frame % 2) + ':' + scale;
    let cv = cache.get(k); if (cv) return cv;
    cv = document.createElement('canvas'); cv.width = N * scale; cv.height = N * scale;
    render(c, cv.getContext('2d'), scale, 0, 0, frame); cache.set(k, cv); return cv;
  };
  const spriteUrl = (c, scale = 2) => { const cv = sprite(c, 0, scale); return cv._u ||= cv.toDataURL(); };
  const total = c => STATS.reduce((a, k) => a + c[k], 0);
  // type chart: ×1.5 against the type it is strong against, ×0.67 against what it is weak to
  const typeMul = (att, def) => { const A = TYPES[att]; return A.strong === def ? 1.5 : A.weak === def ? .67 : 1; };
  const power = c => Math.round(total(c) / 5);
  return { TYPES, TYPE_KEYS, RARITIES, RK, STATS, STAT_NAMES, PLAN_KEYS, VARN: Object.fromEntries(Object.keys(VARS).map(k => [k, VARS[k].length + 1])), FRONT, rng, render, sprite, spriteUrl, total, typeMul, power, hex, hsl, palette };
})();

const CREATURES = [];
const CBYID = Object.fromEntries(CREATURES.map(c => [c.id, c]));
// Éléments d'interface communs aux plugins qui montrent des créatures (badges, barres, sprites animés, style pixel).
const CRUI = (() => {
  const css = `
.cb{--cb-bg:#0d0620;--cb-card:#171034;--cb-card2:#21184a;--cb-line:#3a2a6e;--cb-hi:#8a5cf0;--cb-txt:#f3eaff;--cb-sub:#9a88c4;--cb-acc:#ff5ad9;--cb-gold:#ffd07a;color:var(--cb-txt);font-family:var(--text,'Pixelify Clair',monospace);font-size:15px;image-rendering:pixelated}
.cb *{box-sizing:border-box;scrollbar-width:thin;scrollbar-color:var(--cb-line) var(--cb-bg)}
.cb button{font:inherit;color:inherit;cursor:var(--cp,pointer)}
.cb-h{font:11px var(--title,monospace);letter-spacing:2px;color:var(--cb-acc);text-transform:uppercase}
.cb-sub{color:var(--cb-sub);font-size:13px}
.cb-btn{border:0;background:var(--cb-card2);color:var(--cb-txt);padding:8px 12px;font-size:14px;font-weight:600;box-shadow:0 0 0 2px var(--cb-line),0 4px 0 2px #05010b;margin:2px 4px 6px 2px;transition:transform .06s,background .1s;white-space:nowrap}
.cb-btn:hover{background:#2c2160;box-shadow:0 0 0 2px var(--cb-hi),0 4px 0 2px #05010b}
.cb-btn:active{transform:translateY(3px);box-shadow:0 0 0 2px var(--cb-hi),0 1px 0 2px #05010b}
.cb-btn.on{background:var(--cb-hi);color:#fff}
.cb-btn.main{background:var(--cb-acc);color:#220a28}.cb-btn.main:hover{background:#ff7be3}
.cb-btn[disabled]{opacity:.4;pointer-events:none}
.cb-btn.sm{padding:5px 8px;font-size:12px}
.cb-in{background:var(--cb-bg);border:0;color:#fff;padding:9px 12px;font:inherit;font-size:15px;box-shadow:inset 0 0 0 2px var(--cb-line);outline:0}
.cb-in:focus{box-shadow:inset 0 0 0 2px var(--cb-hi)}
.cb-panel{background:var(--cb-card);box-shadow:0 0 0 2px var(--cb-line),0 4px 0 2px #05010b;padding:12px}
.cb-badge{display:inline-block;padding:2px 7px;font-size:11px;font-weight:700;letter-spacing:.5px;color:#10061c;box-shadow:inset 0 -2px 0 rgba(0,0,0,.28);text-transform:uppercase;line-height:1.35}
.cb-bar{display:grid;grid-template-columns:44px 1fr 34px;align-items:center;gap:8px;font-size:13px;margin:4px 0}
.cb-bar i{display:block;height:10px;background:#0a0418;box-shadow:inset 0 0 0 2px var(--cb-line);position:relative}
.cb-bar b{position:absolute;left:0;top:0;bottom:0;background:repeating-linear-gradient(90deg,var(--c) 0 6px,color-mix(in srgb,var(--c) 70%,#000) 6px 8px);box-shadow:inset 0 2px 0 rgba(255,255,255,.35)}
.cb-spr{image-rendering:pixelated;display:block}
.cb-r-legendaire,.cb-r-mythique{animation:cbShine 2.4s linear infinite}
@keyframes cbShine{0%,100%{filter:brightness(1)}50%{filter:brightness(1.25)}}
.cb-x{border:0;background:none;color:var(--cb-sub);font-size:20px;padding:2px 8px}.cb-x:hover{color:#fff}
.cb-tabs{display:flex;gap:4px;flex-wrap:wrap}
@media (prefers-reduced-motion:reduce){.cb-r-legendaire,.cb-r-mythique{animation:none}}
`;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const typeCol = t => { const T = CR.TYPES[t]; return CR.hex(CR.hsl(T.h, Math.min(80, T.s + 8), Math.max(48, T.l + 6))); };
  const typeBadge = t => `<span class="cb-badge" style="background:${typeCol(t)}">${CR.TYPES[t].n}</span>`;
  const rarBadge = r => { const R = CR.RARITIES[CR.RK[r]]; return `<span class="cb-badge" style="background:${R.col}">${R.n}</span>`; };
  const bars = c => CR.STATS.map(k => `<div class="cb-bar"><span>${CR.STAT_NAMES[k]}</span><i><b style="width:${Math.min(100, Math.round(c[k] / 1.6))}%;--c:${k === 'pv' ? '#5be37d' : k === 'atq' ? '#ff6b6b' : k === 'def' ? '#5cb8ff' : k === 'vit' ? '#ffd45c' : '#c070ff'}"></b></i><span>${c[k]}</span></div>`).join('');
  // a static picture (data URL) at an integer scale
  const img = (c, scale = 3) => { const i = new Image(); i.className = 'cb-spr cb-r-' + c.r; i.width = 32 * scale; i.height = 32 * scale; i.src = CR.spriteUrl(c, scale); i.draggable = false; return i; };
  // an animated one: two frames, one pixel of bobbing, a single timer for all of them
  const live = new Set(); let timer = 0, phase = 0;
  const anim = (c, scale = 6) => {
    const cv = document.createElement('canvas'); cv.width = 32 * scale; cv.height = 32 * scale; cv.className = 'cb-spr cb-r-' + c.r; cv._c = c; cv._s = scale;
    const draw = () => { const g = cv.getContext('2d'); g.clearRect(0, 0, cv.width, cv.height); CR.render(c, g, scale, 0, 0, phase); };
    cv._d = draw; draw(); live.add(cv);
    if (!timer) timer = setInterval(() => { phase ^= 1; for (const k of [...live]) { if (!k.isConnected) { live.delete(k); continue; } k._d(); } if (!live.size) { clearInterval(timer); timer = 0; } }, 650);
    return cv;
  };
  const typeChips = (c) => [c.t, c.t2].filter(Boolean).map(typeBadge).join(' ');
  const kindName = { dmg: 'Attaque', heal: 'Soin', buff: 'Soutien', debuff: 'Affaiblit', status: 'Statut' };
  const kindCol = { dmg: '#ff6b6b', heal: '#5be37d', buff: '#5cb8ff', debuff: '#c070ff', status: '#ffd45c' };
  const abilityHtml = a => `<div class="cb-ab"><span class="cb-badge" style="background:${kindCol[a.k]}">${kindName[a.k]}</span> <b>${esc(a.n)}</b> <span class="cb-sub">puiss. ${a.p}</span></div>`;
  const matchup = c => { const T = CR.TYPES[c.t]; return { strong: T.strong, weak: T.weak }; };
  const addStyle = host => { if (document.getElementById('cb-style')) return; const s = document.createElement('style'); s.id = 'cb-style'; s.textContent = css; document.head.append(s); };
  return { css, esc, el, typeCol, typeBadge, rarBadge, bars, img, anim, typeChips, abilityHtml, matchup, kindName, kindCol, addStyle };
})();

/* ===== fin de la base ===== */

const CSS = `
.bs{display:flex;flex-direction:column;gap:12px;min-height:78vh}
.bs-top{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.bs-top .cb-h{font-size:14px}
.bs-body{display:grid;grid-template-columns:230px minmax(0,1fr) 380px;gap:14px;align-items:start}
.bs.noDet .bs-body{grid-template-columns:230px minmax(0,1fr)}
.bs-side{display:flex;flex-direction:column;gap:12px;position:sticky;top:0}
.bs-chips{display:flex;flex-wrap:wrap;gap:5px}
.bs-chip{border:0;padding:4px 8px;font-size:12px;font-weight:700;background:var(--cb-bg);color:var(--cb-sub);box-shadow:inset 0 0 0 2px var(--cb-line);text-transform:uppercase}
.bs-chip.on{color:#10061c;background:var(--c,#fff);box-shadow:inset 0 0 0 2px #fff}
.bs-chip:hover{color:#fff}.bs-chip.on:hover{color:#10061c}
.bs-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(var(--cw,118px),1fr));gap:8px;max-height:calc(100vh - 140px);overflow:auto;padding:4px 6px 10px 4px}
.bs-cell{position:relative;border:0;background:var(--cb-card);padding:6px 4px 8px;display:flex;flex-direction:column;align-items:center;gap:3px;box-shadow:0 0 0 2px var(--cb-line),0 3px 0 2px #05010b;text-align:center;min-height:152px}
.bs-cell:hover{box-shadow:0 0 0 2px var(--cb-hi),0 3px 0 2px #05010b;transform:translateY(-2px)}
.bs-cell.sel{box-shadow:0 0 0 3px #fff,0 3px 0 3px #05010b;background:var(--cb-card2)}
.bs-cell .no{font-size:9px;color:var(--cb-sub);align-self:flex-start;margin-left:4px;letter-spacing:1px}
.bs-cell .ph{width:96px;height:96px;background:radial-gradient(circle at 50% 70%,color-mix(in srgb,var(--c) 35%,transparent),transparent 70%)}
.bs-cell .nm{font-size:12px;font-weight:700;line-height:1.15;word-break:break-word}
.bs-cell .rs{position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--rc)}
.bs-cell .fv{position:absolute;right:4px;top:3px;font-size:13px;color:#ffd07a}
.bs-cell .ty{display:flex;gap:3px}.bs-cell .ty i{width:10px;height:10px;box-shadow:inset 0 -2px 0 rgba(0,0,0,.3)}
.bs-det{overflow-x:hidden;overflow-wrap:anywhere;min-width:0;position:sticky;top:0;max-height:calc(100vh - 150px);overflow:auto;display:flex;flex-direction:column;gap:10px}
.bs-det>*{flex:none}
.bs-stage{position:relative;display:grid;place-items:end center;height:296px;padding-bottom:16px;box-sizing:border-box;overflow:hidden;background:radial-gradient(ellipse at 50% 85%,color-mix(in srgb,var(--c) 45%,transparent),transparent 62%),repeating-linear-gradient(0deg,#120a2c 0 4px,#15103a 4px 8px);box-shadow:inset 0 0 0 2px var(--cb-line)}
.bs-stage::after{content:"";position:absolute;left:25%;right:25%;bottom:12px;height:14px;background:radial-gradient(ellipse,rgba(0,0,0,.55),transparent 70%)}
.bs-stage canvas{position:relative;z-index:1;max-width:100%;height:auto;image-rendering:pixelated}
.bs-no{position:absolute;left:8px;top:6px;font:10px var(--title,monospace);color:var(--cb-sub);z-index:2}
.bs-pw{position:absolute;right:8px;top:6px;font:10px var(--title,monospace);color:var(--cb-gold);z-index:2}
.bs-name{font:15px var(--title,monospace);line-height:1.4;word-break:break-word}
.bs-ab{padding:5px 0;border-top:2px dashed var(--cb-line)}.bs-ab:first-child{border-top:0}
.bs-desc{line-height:1.45;color:#d9cdf6}
.bs-mu{display:flex;gap:6px;align-items:center;flex-wrap:wrap;font-size:13px;margin:3px 0}
.bs-nav{display:flex;gap:4px;align-items:center;flex-wrap:wrap}
.bs-cmp{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.bs-cmp .cb-panel{display:flex;flex-direction:column;align-items:center;gap:6px}
.bs-dl{font-weight:800}.bs-dl.up{color:#5be37d}.bs-dl.dn{color:#ff6b6b}
.bs-mod{position:fixed;inset:0;z-index:300;background:rgba(5,1,12,.8);display:grid;place-items:center}
.bs-mod .box{width:min(760px,94vw);max-height:90vh;overflow:auto}
.bs-dist{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px}
.bs-row{display:grid;grid-template-columns:90px 1fr 40px;align-items:center;gap:8px;margin:5px 0;font-size:13px}
.bs-row i{height:14px;background:#0a0418;box-shadow:inset 0 0 0 2px var(--cb-line);position:relative}.bs-row b{position:absolute;inset:0 auto 0 0;background:var(--c);box-shadow:inset 0 3px 0 rgba(255,255,255,.3)}
.bs-empty{padding:60px 10px;text-align:center;color:var(--cb-sub)}
@media (max-width:1180px){.bs-body{grid-template-columns:200px minmax(0,1fr)}.bs-det{position:fixed;right:10px;top:70px;bottom:10px;width:min(400px,92vw);z-index:200;max-height:none;background:var(--cb-bg);box-shadow:0 0 0 3px var(--cb-hi),0 10px 30px #000}}
`;
const SORTS = {
  num: ['N° dans le bestiaire', (a, b) => (a.id.slice(3) - b.id.slice(3))],
  nom: ['Nom (A → Z)', (a, b) => a.n.localeCompare(b.n, 'fr')],
  rar: ['Rareté (plus rare d\'abord)', (a, b) => CR.RK[b.r] - CR.RK[a.r] || CR.total(b) - CR.total(a)],
  pui: ['Puissance totale', (a, b) => CR.total(b) - CR.total(a)],
  pv: ['Points de vie', (a, b) => b.pv - a.pv], atq: ['Attaque', (a, b) => b.atq - a.atq], def: ['Défense', (a, b) => b.def - a.def], vit: ['Vitesse', (a, b) => b.vit - a.vit], mag: ['Magie', (a, b) => b.mag - a.mag],
};
const PLAN_NAMES = { blob: 'Gélatineux', biped: 'Bipèdes', golem: 'Colosses', bird: 'Oiseaux', serpent: 'Serpents', insect: 'Insectes', spirit: 'Esprits', plant: 'Plantes', floater: 'Flottants', beast: 'Bêtes', dragon: 'Dragons', fish: 'Poissons' };
export default async function (ctx) {
  const view = ctx.view;
  const addStyle = css => (ctx.host?.addStyle ? ctx.host.addStyle(css) : (() => { const s = document.createElement('style'); s.textContent = css; document.head.append(s); })());
  CRUI.addStyle(); addStyle(CSS);
  const saved = (await ctx.folder.read('bestiaire').catch(() => null)) || {};
  const S = { fav: new Set(saved.fav || []), q: '', types: new Set(), rars: new Set(), plan: '', sort: saved.sort || 'num', favOnly: false, sel: saved.last && CBYID[saved.last] ? saved.last : null, tab: 'dex', cw: saved.cw || 118, cmp: null, ...{} };
  let persistT = 0;
  const persist = () => { clearTimeout(persistT); persistT = setTimeout(() => ctx.folder.write('bestiaire', { fav: [...S.fav], sort: S.sort, last: S.sel, cw: S.cw }).catch(() => {}), 400); };
  const toast = (m, e) => (ctx.host?.toast || ctx.ui.toast)(m, e);
  view.innerHTML = '';
  const root = CRUI.el('div', 'cb bs');
  view.append(root);
  const top = CRUI.el('div', 'bs-top'), body = CRUI.el('div', 'bs-body'), side = CRUI.el('div', 'bs-side'), mid = CRUI.el('div'), det = CRUI.el('div', 'cb-panel bs-det');
  root.append(top, body); body.append(side, mid, det);
  /* ---------- top ---------- */
  const title = CRUI.el('div', 'cb-h', 'Bestiaire'), count = CRUI.el('span', 'cb-sub');
  const tabs = CRUI.el('div', 'cb-tabs');
  const tabBtn = (k, n) => { const b = CRUI.el('button', 'cb-btn' + (S.tab === k ? ' on' : ''), n); b.onclick = () => { S.tab = k; renderAll(); }; return b; };
  const rnd = CRUI.el('button', 'cb-btn', 'Au hasard'); rnd.onclick = () => { const l = filtered(); const c = l[Math.floor(Math.random() * l.length)] || CREATURES[0]; if (c) select(c.id, true); };
  const spc = CRUI.el('span'); spc.style.flex = '1'; top.append(title, tabs, count, spc, rnd);
  /* ---------- filters ---------- */
  const q = CRUI.el('input', 'cb-in'); q.placeholder = 'Chercher un nom, une capacité…'; q.style.width = '100%';
  q.oninput = () => { S.q = q.value.trim().toLowerCase(); renderGrid(); };
  const mkChips = (items, set, colOf, label) => { const w = CRUI.el('div', 'bs-chips'); items.forEach(k => { const b = CRUI.el('button', 'bs-chip' + (set.has(k) ? ' on' : ''), label(k)); b.style.setProperty('--c', colOf(k)); b.onclick = () => { set.has(k) ? set.delete(k) : set.add(k); b.classList.toggle('on', set.has(k)); renderGrid(); }; w.append(b); }); return w; };
  const sel = (opts, val, fn) => { const s = CRUI.el('select', 'cb-in'); s.style.width = '100%'; opts.forEach(([v, t]) => { const o = document.createElement('option'); o.value = v; o.textContent = t; if (v === val) o.selected = true; s.append(o); }); s.onchange = () => fn(s.value); return s; };
  const favBtn = CRUI.el('button', 'cb-btn', 'Favoris seulement'); favBtn.onclick = () => { S.favOnly = !S.favOnly; favBtn.classList.toggle('on', S.favOnly); renderGrid(); };
  const sizeIn = CRUI.el('input'); sizeIn.type = 'range'; sizeIn.min = 96; sizeIn.max = 190; sizeIn.value = S.cw; sizeIn.oninput = () => { S.cw = +sizeIn.value; grid.style.setProperty('--cw', S.cw + 'px'); persist(); };
  const reset = CRUI.el('button', 'cb-btn sm', 'Tout effacer'); reset.onclick = () => { S.types.clear(); S.rars.clear(); S.plan = ''; S.q = ''; S.favOnly = false; q.value = ''; buildSide(); renderGrid(); };
  const buildSide = () => {
    side.innerHTML = '';
    const p1 = CRUI.el('div', 'cb-panel'), l = t => { const e = CRUI.el('div', 'cb-sub', t); e.style.margin = '10px 0 5px'; return e; };
    p1.append(q, l('Type'), mkChips(CR.TYPE_KEYS, S.types, CRUI.typeCol, k => CR.TYPES[k].n), l('Rareté'), mkChips(CR.RARITIES.map(r => r.k), S.rars, k => CR.RARITIES[CR.RK[k]].col, k => CR.RARITIES[CR.RK[k]].n),
      l('Forme'), sel([['', 'Toutes les formes'], ...Object.entries(PLAN_NAMES)], S.plan, v => { S.plan = v; renderGrid(); }), l('Trier par'), sel(Object.entries(SORTS).map(([k, v]) => [k, v[0]]), S.sort, v => { S.sort = v; persist(); renderGrid(); }),
      l('Taille des cartes'), sizeIn, CRUI.el('div', null, '<div style="height:8px"></div>'), favBtn, reset);
    side.append(p1);
  };
  /* ---------- grid ---------- */
  const grid = CRUI.el('div', 'bs-grid'); grid.style.setProperty('--cw', S.cw + 'px');
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { const h = e.target; io.unobserve(h); if (!h.firstChild) h.append(CRUI.img(CBYID[h.dataset.id], 3)); } }), { root: grid, rootMargin: '200px' });
  const cache = new Map();
  const filtered = () => {
    const sort = SORTS[S.sort][1];
    return CREATURES.filter(c => (!S.types.size || S.types.has(c.t) || S.types.has(c.t2)) && (!S.rars.size || S.rars.has(c.r)) && (!S.plan || c.plan === S.plan) && (!S.favOnly || S.fav.has(c.id)) &&
      (!S.q || c.n.toLowerCase().includes(S.q) || c.id.includes(S.q) || c.ab.some(a => a.n.toLowerCase().includes(S.q)) || CR.TYPES[c.t].n.toLowerCase().includes(S.q) || (c.t2 && CR.TYPES[c.t2].n.toLowerCase().includes(S.q)) || c.hab.toLowerCase().includes(S.q))).sort(sort);
  };
  const cell = c => {
    let b = cache.get(c.id); if (!b) {
      b = CRUI.el('button', 'bs-cell'); b.dataset.id = c.id; b.style.setProperty('--rc', CR.RARITIES[CR.RK[c.r]].col); b.style.setProperty('--c', CRUI.typeCol(c.t));
      b.append(CRUI.el('i', 'rs'), CRUI.el('span', 'no', c.id.slice(3)), CRUI.el('div', 'ph'), CRUI.el('div', 'nm', CRUI.esc(c.n)), CRUI.el('div', 'ty', [c.t, c.t2].filter(Boolean).map(t => `<i style="background:${CRUI.typeCol(t)}" title="${CR.TYPES[t].n}"></i>`).join('')));
      b.onclick = () => select(c.id);
      cache.set(c.id, b);
    }
    b.classList.toggle('sel', S.sel === c.id); let f = b.querySelector('.fv'); if (S.fav.has(c.id) && !f) b.append(CRUI.el('span', 'fv', '★')); else if (!S.fav.has(c.id) && f) f.remove();
    return b;
  };
  const renderGrid = () => {
    const l = filtered(); grid.innerHTML = '';
    if (!l.length) grid.append(CRUI.el('div', 'bs-empty', CREATURES.length ? 'Aucune créature ne correspond.<br>Essaie d\'effacer un filtre.' : 'Le bestiaire est vide pour l\'instant.<br>Les nouvelles créatures arrivent bientôt.'));
    const fr = document.createDocumentFragment(); l.forEach(c => { const b = cell(c), ph = b.querySelector('.ph'); fr.append(b); if (!ph.firstChild) io.observe(ph); ph.dataset.id = c.id; }); grid.append(fr);
    count.textContent = l.length === CREATURES.length ? CREATURES.length + ' créatures' : l.length + ' / ' + CREATURES.length + ' créatures · ' + S.fav.size + ' favori' + (S.fav.size > 1 ? 's' : '');
    mid.contains(grid) || mid.append(grid);
  };
  /* ---------- detail ---------- */
  const select = (id, scroll) => { S.sel = id; persist(); root.classList.remove('noDet'); renderDetail(); grid.querySelectorAll('.bs-cell.sel').forEach(b => b.classList.remove('sel')); const b = cache.get(id); if (b) { b.classList.add('sel'); if (scroll) b.scrollIntoView({ block: 'center' }); } };
  const step = d => { const l = filtered(); if (!l.length) return; let i = l.findIndex(c => c.id === S.sel); i = i < 0 ? 0 : (i + d + l.length) % l.length; select(l[i].id, true); };
  const matchHtml = c => { const T = CR.TYPES[c.t], st = CR.TYPES[T.strong], wk = CR.TYPES[T.weak]; return `<div class="bs-mu">Fort contre ${CRUI.typeBadge(T.strong)} <span class="cb-sub">×1.5</span></div><div class="bs-mu">Faible face à ${CRUI.typeBadge(T.weak)} <span class="cb-sub">×0.67</span></div>`; };
  const renderDetail = () => {
    const c = CBYID[S.sel]; det.innerHTML = '';
    if (!c) { det.append(CRUI.el('div', 'bs-empty', 'Choisis une créature<br>dans la liste.')); return; }
    const R = CR.RARITIES[CR.RK[c.r]], isFav = S.fav.has(c.id);
    det.style.setProperty('--c', CRUI.typeCol(c.t));
    const nav = CRUI.el('div', 'bs-nav'); const mkb = (t, f, cls = '') => { const b = CRUI.el('button', 'cb-btn sm ' + cls, t); b.onclick = f; nav.append(b); return b; };
    mkb('◀', () => step(-1)); mkb('▶', () => step(1)); mkb(isFav ? '★ Favori' : '☆ Favori', () => { isFav ? S.fav.delete(c.id) : S.fav.add(c.id); persist(); renderDetail(); const b = cache.get(c.id); b && cell(c); count.textContent = count.textContent; }, isFav ? 'on' : '');
    mkb('Comparer', () => compare(c)); const sp = CRUI.el('span'); sp.style.flex = '1'; nav.append(sp); mkb('✕', () => { root.classList.add('noDet'); S.sel = null; renderGrid(); }, 'x');
    const stage = CRUI.el('div', 'bs-stage'); stage.style.setProperty('--c', CRUI.typeCol(c.t));
    stage.append(CRUI.el('span', 'bs-no', 'N° ' + c.id.slice(3)), CRUI.el('span', 'bs-pw', 'PUISS. ' + CR.power(c)), CRUI.anim(c, 8));
    const info = CRUI.el('div'); info.innerHTML = `<div class="bs-name">${CRUI.esc(c.n)}</div><div style="margin:6px 0 10px">${CRUI.typeChips(c)} ${CRUI.rarBadge(c.r)} <span class="cb-badge" style="background:#3a2a6e;color:#d9cdf6">${PLAN_NAMES[c.plan]}</span></div>
      <div class="bs-desc">${CRUI.esc(c.d)}</div>`;
    const stats = CRUI.el('div'); stats.innerHTML = `<div class="cb-h" style="margin:10px 0 4px;font-size:9px">Statistiques · total ${CR.total(c)}</div>` + CRUI.bars(c);
    const ab = CRUI.el('div'); ab.innerHTML = `<div class="cb-h" style="margin:12px 0 4px;font-size:9px">Capacités</div>` + c.ab.map(CRUI.abilityHtml).join('') + (c.pa ? `<div class="bs-ab"><span class="cb-badge" style="background:#ffd07a">Passif</span> <b>${CRUI.esc(c.pa)}</b></div>` : '');
    const mu = CRUI.el('div'); mu.innerHTML = `<div class="cb-h" style="margin:12px 0 4px;font-size:9px">Affinités</div>` + matchHtml(c) + `<div class="bs-mu cb-sub">Habitat : ${CRUI.esc(c.hab)}</div>`;
    det.append(nav, stage, info, stats, ab, mu);
  };
  /* ---------- compare ---------- */
  const compare = a => {
    const pickB = () => { const m = CBYID[S.cmp && S.cmp !== a.id ? S.cmp : CREATURES[(CREATURES.indexOf(a) + 1) % CREATURES.length].id]; return m; };
    let b = pickB();
    const mod = CRUI.el('div', 'bs-mod'), box = CRUI.el('div', 'cb-panel box cb'); mod.append(box); view.append(mod);
    const close = () => { mod.remove(); document.removeEventListener('keydown', onKey); }, onKey = e => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey); mod.onclick = e => e.target === mod && close();
    const draw = () => {
      box.innerHTML = ''; const h = CRUI.el('div', 'bs-nav'); h.append(CRUI.el('div', 'cb-h', 'Comparer')); const sp = CRUI.el('span'); sp.style.flex = '1'; h.append(sp);
      const dl = CRUI.el('select', 'cb-in'); CREATURES.forEach(c => { const o = document.createElement('option'); o.value = c.id; o.textContent = c.id.slice(3) + ' · ' + c.n; if (c.id === b.id) o.selected = true; dl.append(o); }); dl.onchange = () => { b = CBYID[dl.value]; S.cmp = b.id; draw(); };
      const x = CRUI.el('button', 'cb-btn sm', '✕'); x.onclick = close; h.append(dl, x); box.append(h);
      const g = CRUI.el('div', 'bs-cmp'); [a, b].forEach((c, i) => { const p = CRUI.el('div', 'cb-panel'); p.append(CRUI.anim(c, 4)); const n = CRUI.el('div', 'bs-name', CRUI.esc(c.n)); n.style.fontSize = '12px'; p.append(n); const t = CRUI.el('div', null, CRUI.typeChips(c) + ' ' + CRUI.rarBadge(c.r)); p.append(t);
        const o = i ? a : b; p.append(Object.assign(CRUI.el('div'), { innerHTML: CR.STATS.map(k => { const d = c[k] - o[k]; return `<div class="cb-bar"><span>${CR.STAT_NAMES[k]}</span><i><b style="width:${Math.min(100, Math.round(c[k] / 1.6))}%;--c:${d > 0 ? '#5be37d' : d < 0 ? '#ff6b6b' : '#9a88c4'}"></b></i><span class="bs-dl ${d > 0 ? 'up' : d < 0 ? 'dn' : ''}">${c[k]}</span></div>`; }).join('') + `<div class="cb-sub" style="margin-top:6px">Total ${CR.total(c)} · Puissance ${CR.power(c)}</div>` })); g.append(p); });
      box.append(g);
      const mulA = CR.typeMul(a.t, b.t), mulB = CR.typeMul(b.t, a.t);
      box.append(Object.assign(CRUI.el('div', 'cb-sub'), { style: 'margin-top:10px;text-align:center', innerHTML: `${CRUI.esc(a.n)} contre ${CRUI.esc(b.n)} : ×${mulA.toFixed(2)} · l'inverse : ×${mulB.toFixed(2)}` }));
    };
    draw();
  };
  /* ---------- distribution tab ---------- */
  const renderDist = () => {
    mid.innerHTML = ''; const wrap = CRUI.el('div', 'bs-dist');
    const mkTable = (title, rows) => { const p = CRUI.el('div', 'cb-panel'); p.append(CRUI.el('div', 'cb-h', title)); const mx = Math.max(...rows.map(r => r[1])); rows.forEach(([n, v, col]) => { const r = CRUI.el('div', 'bs-row'); r.append(CRUI.el('span', null, CRUI.esc(n))); const i = CRUI.el('i'); const b = CRUI.el('b'); b.style.width = (v / mx * 100) + '%'; b.style.setProperty('--c', col); i.append(b); r.append(i, CRUI.el('span', null, v)); p.append(r); }); return p; };
    wrap.append(
      mkTable('Par type', CR.TYPE_KEYS.map(t => [CR.TYPES[t].n, CREATURES.filter(c => c.t === t || c.t2 === t).length, CRUI.typeCol(t)])),
      mkTable('Par rareté', CR.RARITIES.map(r => [r.n, CREATURES.filter(c => c.r === r.k).length, r.col])),
      mkTable('Par forme', Object.entries(PLAN_NAMES).map(([k, n]) => [n, CREATURES.filter(c => c.plan === k).length, '#8a5cf0'])),
      mkTable('Les plus puissantes', [...CREATURES].sort((a, b) => CR.total(b) - CR.total(a)).slice(0, 10).map(c => [c.n, CR.total(c), CR.RARITIES[CR.RK[c.r]].col])),
      mkTable('Les plus rapides', [...CREATURES].sort((a, b) => b.vit - a.vit).slice(0, 10).map(c => [c.n, c.vit, '#ffd45c'])),
      mkTable('Les plus résistantes', [...CREATURES].sort((a, b) => b.def - a.def).slice(0, 10).map(c => [c.n, c.def, '#5cb8ff'])));
    mid.append(wrap);
  };
  /* ---------- assembly ---------- */
  const renderAll = () => {
    tabs.innerHTML = ''; tabs.append(tabBtn('dex', 'Bestiaire'), tabBtn('dist', 'Répartition'));
    const dex = S.tab === 'dex'; side.style.display = dex ? '' : 'none'; det.style.display = dex ? '' : 'none'; rnd.style.display = dex ? '' : 'none'; body.style.gridTemplateColumns = dex ? '' : '1fr';
    if (dex) { buildSide(); renderGrid(); renderDetail(); if (!S.sel) root.classList.add('noDet'); } else { count.textContent = CREATURES.length + ' créatures'; renderDist(); }
  };
  const onKey = e => { if (!view.isConnected || S.tab !== 'dex' || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) { if (e.key === '/' && view.isConnected && !/INPUT|TEXTAREA/.test(e.target.tagName)) { e.preventDefault(); q.focus(); } return; }
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); step(1); } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); step(-1); } else if (e.key === '/') { e.preventDefault(); q.focus(); } else if (e.key.toLowerCase() === 'f' && S.sel) { S.fav.has(S.sel) ? S.fav.delete(S.sel) : S.fav.add(S.sel); persist(); renderDetail(); cell(CBYID[S.sel]); } };
  document.addEventListener('keydown', onKey);
  ctx.onClose?.(() => document.removeEventListener('keydown', onKey));
  renderAll();
  if (S.sel) { const b = cache.get(S.sel); b && setTimeout(() => b.scrollIntoView({ block: 'center' }), 50); }
}
