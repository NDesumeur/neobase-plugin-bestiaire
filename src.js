// Bestiaire : l'encyclopédie pixel art des créatures de NeoBase (1050 fiches : noms uniques, raretés, statistiques, types, capacités, illustrations).
// La base de créatures est la même que celle du jeu de cartes et du jeu d'exploration : un identifiant par créature, jamais réutilisé.
// Les favoris et ton dernier réglage sont dans le dossier du plugin, que NeoBase sauvegarde (synchro cloud comprise).
/*@CREATURES@*/
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
.bs-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(var(--cw,118px),1fr));gap:8px;max-height:calc(100vh - 200px);overflow:auto;padding:4px 6px 10px 4px}
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
.bs-stage{position:relative;display:grid;place-items:center;height:238px;background:radial-gradient(ellipse at 50% 85%,color-mix(in srgb,var(--c) 45%,transparent),transparent 62%),repeating-linear-gradient(0deg,#120a2c 0 4px,#15103a 4px 8px);box-shadow:inset 0 0 0 2px var(--cb-line)}
.bs-stage::after{content:"";position:absolute;left:25%;right:25%;bottom:22px;height:14px;background:radial-gradient(ellipse,rgba(0,0,0,.55),transparent 70%)}
.bs-stage canvas{position:relative;z-index:1;margin-bottom:6px}
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
  const rnd = CRUI.el('button', 'cb-btn', 'Au hasard'); rnd.onclick = () => { const l = filtered(); const c = l[Math.floor(Math.random() * l.length)] || CREATURES[0]; select(c.id, true); };
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
    if (!l.length) grid.append(CRUI.el('div', 'bs-empty', 'Aucune créature ne correspond.<br>Essaie d\'effacer un filtre.'));
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
