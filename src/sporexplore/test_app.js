// Sporexplore v4 tests — run: node src/sporexplore/test_app.js
// Loads the shipped data.js and the scoring code from app.js (via its test hook) in a stub DOM.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..', '..');
let fails = 0;
const ok = (cond, msg) => { if (!cond) { fails++; console.log('FAIL', msg); } };

// minimal DOM stub so app.js can boot
const el = () => ({ innerHTML: '', textContent: '', value: '', style: {}, dataset: {}, classList: { toggle() {}, add() {}, remove() {} },
  setAttribute() {}, toggleAttribute() {}, addEventListener() {}, querySelector: () => el(), querySelectorAll: () => [], appendChild() {}, focus() {} });
global.window = { addEventListener() {}, innerWidth: 1200, scrollTo() {} };
global.document = { querySelector: () => el(), querySelectorAll: () => [], documentElement: { dataset: {} }, title: '' };
global.location = { hash: '#/browse' };
global.history = { replaceState() {} };
global.localStorage = { getItem: () => null, setItem() {} };
global.fetch = () => Promise.reject(new Error('offline'));
new Function(fs.readFileSync(path.join(root, 'sporexplore', 'data.js'), 'utf8'))();
new Function(fs.readFileSync(path.join(root, 'sporexplore', 'app.js'), 'utf8'))();
const { score, SPECIES } = window.__sporex;
const X = window.SPOREX;

// 1. every species ranks first on its own consensus measurements + print + shape
SPECIES.forEach(s => {
  const Q = { lmin: s.sp.lo, lmax: s.sp.hi, wmin: s.sp.wlo, wmax: s.sp.whi, tol: 1.5, print: s.sp.print, shape: s.sp.shape, ft: s.ft,
    pore: [], stipe: [], cap: [], host: [] };
  const me = score(s, Q).pct;
  const better = SPECIES.filter(o => o !== s && score(o, Q).pct > me + 1e-9);
  ok(!better.length, `${s.n} is outranked on its own values by ${better.map(b => b.n).join(', ')}`);
});

// 2. score stays within [0,1] for random queries
let rnd = 1; const R = () => (rnd = (rnd * 16807) % 2147483647) / 2147483647;
for (let i = 0; i < 30000; i++) {
  const s = SPECIES[Math.floor(R() * SPECIES.length)];
  const a = R() * 40, b = R() * 40, c = R() * 20, d = R() * 20;
  const Q = { lmin: R() < .2 ? null : a, lmax: R() < .2 ? null : b, wmin: R() < .2 ? null : c, wmax: R() < .2 ? null : d, tol: [0.5, 1.5, 3][i % 3],
    pore: [], stipe: [], cap: [], host: [] };
  const p = score(s, Q).pct;
  ok(p === null || (p >= 0 && p <= 1 && !isNaN(p)), `score out of bounds for ${s.n}: ${p}`);
}

// 3. provenance: every measurement and concept reference resolves to a source
SPECIES.forEach(s => {
  s.meas.forEach(m => ok(X.sources[m.src], `${s.n}: unknown source ${m.src}`));
  (s.refs || []).forEach(r => ok(X.sources[r], `${s.n}: unknown concept reference ${r}`));
  ok(s.meas.length || s.flags.some(f => f.k === 'legacy'), `${s.n}: no measurement and no 'unverified' flag`);
  ok(s.sp.lo > 0 && s.sp.hi >= s.sp.lo && s.sp.wlo > 0 && s.sp.whi >= s.sp.wlo, `${s.n}: bad range ${JSON.stringify(s.sp)}`);
  s.meas.forEach(m => ok(m.verbatim && m.verbatim.length > 10, `${s.n}: measurement without verbatim text`));
});

// 4. citation rules: every non-database source is DOI-verified or explicitly has no DOI; APA string present
Object.entries(X.sources).forEach(([id, s]) => {
  ok(s.apa && s.apa.includes(String(s.year || 'n.d.')), `${id}: APA string missing year`);
  if (s.type === 'database-entry') ok(/Retrieved .+, from https:\/\//.test(s.apa), `${id}: database entry without retrieval date/URL`);
  else ok(s.doiVerified || s.noDoi, `${id}: DOI neither verified nor marked absent`);
  if (s.doi) ok(s.apa.includes('https://doi.org/' + s.doi), `${id}: APA string lacks DOI link`);
});

// 5. no duplicate species names
const seen = new Set(); SPECIES.forEach(s => { ok(!seen.has(s.n), 'duplicate ' + s.n); seen.add(s.n); });

console.log(fails ? `${fails} failure(s)` : `all tests passed (${SPECIES.length} species, ${Object.keys(X.sources).length} sources)`);
process.exit(fails ? 1 : 0);
