/* ==========================================================================
   Entry page — the stone circle of portals.
   - turns the ring (scroll, swipe, arrow keys, ‹ › buttons, rune row)
   - zooms through the front portal into its world
   - colours follow the season (smooth year clock) and the visitor's own sky
     (night / twilight / day from the sun's altitude at Copenhagen's latitude)
   - rune language (long-branch Younger Futhark) is the default; hover, focus
     or the Aa button reveals English or Danish, chosen from the visitor's
     language settings and time zone
   - reloads wording from content/entry.json + entry.da.json so edits made in
     /admin show up without a rebuild
   Preview another day or hour with ?day=1-365 and ?hour=0-23.5
   ========================================================================== */
(function () {
  'use strict';

  var doc = document, root = doc.documentElement;
  var world = doc.getElementById('world');
  if (!world) return;

  var DATA = {};
  try { DATA = JSON.parse(doc.getElementById('entry-data').textContent) || {}; } catch (e) { DATA = {}; }
  var PAGE = DATA.page === 'da' ? 'da' : 'en';
  var CONTENT = DATA.content || {};
  var UIS = DATA.ui || {};
  var reduced = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  function $(id) { return doc.getElementById(id); }
  function $$(sel, el) { return Array.prototype.slice.call((el || doc).querySelectorAll(sel)); }
  function store(kind) {
    return {
      get: function (k) { try { return window[kind].getItem(k); } catch (e) { return null; } },
      set: function (k, v) { try { if (v == null) window[kind].removeItem(k); else window[kind].setItem(k, v); } catch (e) { /* private mode */ } }
    };
  }
  var local = store('localStorage'), session = store('sessionStorage');
  var params = (function () { try { return new URLSearchParams(location.search); } catch (e) { return { get: function () { return null; } }; } })();

  /* ------------------------------------------------------------------ language */
  var autoDa = false;
  try {
    var langs = (navigator.languages || [navigator.language || '']).join(',').toLowerCase();
    var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    autoDa = /(^|,)da/.test(langs) || tz === 'Europe/Copenhagen';
  } catch (e) { autoDa = false; }

  var stored = local.get('entryLang');
  var runeMode = !(stored === 'en' || stored === 'da');
  if (!runeMode && stored !== PAGE) local.set('entryLang', PAGE);

  /* The language behind the runes: the page's own language when Latin letters are
     chosen; in rune mode Danish on da.html, otherwise guessed from the visitor. */
  function latin() { return runeMode ? (PAGE === 'da' || autoDa ? 'da' : 'en') : PAGE; }
  function C() { return CONTENT[latin()] || CONTENT[PAGE] || {}; }
  function U() { return UIS[latin()] || UIS[PAGE] || {}; }

  /* Latin → long-branch Younger Futhark, spelled roughly as a Viking-age carver
     would: by sound, no doubled letters, one rune for several vowels. */
  var RUNE_MAP = { a: 'ᛅ', b: 'ᛒ', c: 'ᚴ', d: 'ᛏ', e: 'ᛁ', f: 'ᚠ', g: 'ᚴ', h: 'ᚼ', i: 'ᛁ', j: 'ᛁ', k: 'ᚴ', l: 'ᛚ', m: 'ᛘ', n: 'ᚾ', o: 'ᚢ', p: 'ᛒ', q: 'ᚴ', r: 'ᚱ', s: 'ᛋ', t: 'ᛏ', u: 'ᚢ', v: 'ᚠ', w: 'ᚢ', x: 'ᚴᛋ', z: 'ᛋ', 'æ': 'ᛅ', 'ø': 'ᚢ', 'å': 'ᚬ', 'é': 'ᛁ', 'ö': 'ᚢ', 'ä': 'ᛅ', 'ü': 'ᚢ', "'": '', '’': '', '.': '', ',': '', '[': '', ']': '' };
  var DIGRAPHS = [['th', 'ᚦ'], ['sh', 'ᛋ'], ['ch', 'ᚴ'], ['ck', 'ᚴ'], ['ph', 'ᚠ'], ['qu', 'ᚴᚢ'], ['ng', 'ᚾᚴ']];
  function tr(s, lang) {
    var t = String(s || '').toLowerCase().replace(/\s*·\s*/g, '᛬').replace(/&/g, '᛭');
    DIGRAPHS.forEach(function (p) { t = t.split(p[0]).join(p[1]); });
    t = t.replace(/c(?=[eiy])/g, 's');
    var out = '';
    for (var i = 0; i < t.length; i++) {
      var ch = t.charAt(i);
      if (ch === 'y') out += (lang || latin()) === 'da' ? 'ᚢ' : 'ᛁ';
      else out += RUNE_MAP[ch] !== undefined ? RUNE_MAP[ch] : ch;
    }
    return out.replace(/(.)\1+/g, '$1').replace(/\s+/g, '᛫​');
  }

  /* text that can be shown in runes or Latin letters */
  var RV = {};
  $$('.rv[data-k]').forEach(function (el) {
    var k = el.getAttribute('data-k');
    (RV[k] = RV[k] || []).push({ rn: el.querySelector('.rn'), lt: el.querySelector('.lt') });
  });
  function say(key, text) {
    (RV[key] || []).forEach(function (o) {
      if (o.lt.textContent !== text) o.lt.textContent = text;
      var r = runeMode && text ? tr(text) : '';
      if (o.rn.textContent !== r) o.rn.textContent = r;
    });
  }
  function fmt(s, vars) { return String(s || '').replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; }); }

  /* ------------------------------------------------------------------ elements */
  var items = $$('.item'), pds = $$('.pd'), dots = $$('.dot');
  var labels = items.map(function (it) { return it.querySelector('.pl'); });
  var COUNT = items.length || 1, STEP = 360 / COUNT;
  var floor = $('floor'), stage = $('stage'), ringNav = $('ring-nav'), live = $('live');
  var dest = $('dest'), destBack = $('dest-back');
  var seasonBtn = $('season-btn'), seasonMenu = $('season-menu');
  var aa = $('aa');
  var langLinks = $$('.lang[data-mode]');

  /* ------------------------------------------------------------------ text */
  function renderText() {
    var c = C(), u = U(), L = latin();
    root.lang = L;
    say('name', c.name || '');
    say('title', c.title || '');
    (c.portals || []).forEach(function (p, i) {
      if (i >= COUNT) return;
      say('portal-' + i, p.name || '');
      pds[i].setAttribute('aria-label', p.name || '');
      pds[i].setAttribute('href', p.link || '#');
      var pr = pds[i].querySelector('.pr');
      if (pr && p.rune && pr.textContent !== p.rune) pr.textContent = p.rune;
      if (dots[i]) { dots[i].setAttribute('aria-label', p.name || ''); if (p.rune) dots[i].textContent = p.rune; }
    });
    var sms = $$('.sm');
    (c.menu || []).forEach(function (m, i) {
      if (!sms[i]) return;
      say('menu-' + i, m.name || '');
      sms[i].setAttribute('aria-label', m.name || '');
      if (m.link) sms[i].setAttribute('href', m.link);
      var mr = sms[i].querySelector('.mr');
      if (mr && m.rune) mr.textContent = m.rune;
    });
    say('dest-note', u.comingSoon || '');
    say('dest-back', u.back || '');
    var set = function (el, attr, v) { if (el && v) el.setAttribute(attr, v); };
    set(ringNav, 'aria-label', u.worlds);
    set($('prev'), 'aria-label', u.prev);
    set($('next'), 'aria-label', u.next);
    set(doc.querySelector('.dots'), 'aria-label', u.choosePortal);
    set(doc.querySelector('.small-menu'), 'aria-label', u.notesTools);
    set(doc.querySelector('.langs'), 'aria-label', u.language);
    set(doc.querySelector('.lang-runes'), 'aria-label', u.runesName);
    set(seasonMenu, 'aria-label', u.chooseSeason);
    set(aa, 'aria-label', u.aa);
    langLinks.forEach(function (a) {
      var m = a.getAttribute('data-mode');
      var cur = runeMode ? m === 'runes' : m === PAGE;
      if (cur) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }

  /* ------------------------------------------------------------------ seasons & sky */
  var PAL = {
    winter: {
      night: { sky1: '#0b1322', sky2: '#070c15', sky3: '#04070b', haze: '#d6e2ee1a', pool: '#020408d1', tree: '#b7c4d1', line: '#c4d6e8', core: '#a0b6ce', hot: '#e8eef5', draw: '#d6e1ea', floor: '#cedcea', disc1: '#f4f6f8', disc2: '#c5d0da', dglow: '#d6e2ee', title: '#9fb3c8', dsize: 72, crater: 1 },
      twi: { sky1: '#1b2a40', sky2: '#34465e', sky3: '#0b111a', haze: '#ffc0962a', pool: '#03060cc8', tree: '#c8d2dc', line: '#d2e0ee', core: '#aebfd2', hot: '#f1f4f8', draw: '#dfe7ee', floor: '#d6e0ea', disc1: '#fbe8d6', disc2: '#e2bfa0', dglow: '#ffcfa8', title: '#b6c4d4', dsize: 66, crater: 0.35 },
      day: { sky1: '#7f97ab', sky2: '#aebdca', sky3: '#1f2a34', haze: '#fff6e240', pool: '#0a1018b0', tree: '#eef2f5', line: '#eef3f8', core: '#c8d6e4', hot: '#ffffff', draw: '#f3f6f9', floor: '#eef3f8', disc1: '#fffcf4', disc2: '#f6ead6', dglow: '#fff3dc', title: '#9fb3c8', dsize: 58, crater: 0 }
    },
    spring: {
      night: { sky1: '#0a1419', sky2: '#08120f', sky3: '#040907', haze: '#bedcd018', pool: '#020605cc', tree: '#aebfb4', line: '#bcdcc6', core: '#8cbca0', hot: '#e0f0e6', draw: '#d3e6d8', floor: '#b0d4b8', disc1: '#eef3ee', disc2: '#c4d3c7', dglow: '#cfe3d6', title: '#a9c8b0', dsize: 68, crater: 0.9 },
      twi: { sky1: '#2a3a4c', sky2: '#586470', sky3: '#0e1813', haze: '#ffd8aa2e', pool: '#030806c4', tree: '#c4d0c4', line: '#d0e6d4', core: '#a6c8ac', hot: '#f4f8ee', draw: '#e2ede2', floor: '#c2dcc0', disc1: '#fde9cc', disc2: '#e8c49c', dglow: '#ffdcae', title: '#bfd2c2', dsize: 64, crater: 0.3 },
      day: { sky1: '#86a9ba', sky2: '#c2d6cc', sky3: '#1b2a20', haze: '#fffbe640', pool: '#08120cb0', tree: '#eff3ee', line: '#ecf6ec', core: '#c6e0c0', hot: '#ffffff', draw: '#f2f8f0', floor: '#d0ecc4', disc1: '#fffdee', disc2: '#f8efd0', dglow: '#fff7dc', title: '#a9c8b0', dsize: 58, crater: 0 }
    },
    summer: {
      night: { sky1: '#151b35', sky2: '#1a1d36', sky3: '#07080e', haze: '#ffc48c24', pool: '#03040ac8', tree: '#b9bfd4', line: '#d6cef0', core: '#b4aadc', hot: '#f0ecfc', draw: '#e3def3', floor: '#9cb898', disc1: '#f6ecd6', disc2: '#d8c6a2', dglow: '#f2dcb0', title: '#c3bde0', dsize: 64, crater: 0.7 },
      twi: { sky1: '#383e6a', sky2: '#8a6e86', sky3: '#131320', haze: '#ffaa7838', pool: '#04040cbe', tree: '#cfcce0', line: '#e6dcf2', core: '#c8b2d6', hot: '#fff2f0', draw: '#ece4f2', floor: '#b0c4a0', disc1: '#ffdcae', disc2: '#f0a878', dglow: '#ffbe8c', title: '#d8cce6', dsize: 70, crater: 0.15 },
      day: { sky1: '#6c9ec4', sky2: '#b9d5e2', sky3: '#1c301f', haze: '#fff4c848', pool: '#06100aa8', tree: '#f4f6f2', line: '#fbf8ec', core: '#dce4b4', hot: '#ffffff', draw: '#fbfaf2', floor: '#c4e0a0', disc1: '#fffbe6', disc2: '#fff0c0', dglow: '#fff0be', title: '#c3bde0', dsize: 58, crater: 0 }
    },
    autumn: {
      night: { sky1: '#130f11', sky2: '#0c0b0b', sky3: '#050404', haze: '#e6965024', pool: '#030202d1', tree: '#c9b9a0', line: '#e2c496', core: '#c88c50', hot: '#ffe2b4', draw: '#ead9bf', floor: '#c8a070', disc1: '#f6c98a', disc2: '#c27a3c', dglow: '#e69650', title: '#d4b48a', dsize: 92, crater: 0.9 },
      twi: { sky1: '#382a2e', sky2: '#6a4636', sky3: '#120c0a', haze: '#ff965a38', pool: '#050302c8', tree: '#d6c4aa', line: '#ecd0a6', core: '#d29a60', hot: '#ffe8c4', draw: '#f0e0c8', floor: '#d2aa78', disc1: '#ffb877', disc2: '#d9773c', dglow: '#ff9a5a', title: '#dcc0a0', dsize: 84, crater: 0.3 },
      day: { sky1: '#8c979f', sky2: '#c6bca6', sky3: '#261d14', haze: '#fff0d238', pool: '#0e0a06b0', tree: '#f3efe6', line: '#faecd2', core: '#e4c08c', hot: '#ffffff', draw: '#faf3e6', floor: '#dcb886', disc1: '#fff4dc', disc2: '#f6e0b8', dglow: '#ffe4b8', title: '#d4b48a', dsize: 58, crater: 0 }
    }
  };
  var ORDER = ['winter', 'spring', 'summer', 'autumn'];
  var COLOR_KEYS = ['sky1', 'sky2', 'sky3', 'haze', 'pool', 'tree', 'line', 'core', 'hot', 'draw', 'floor', 'disc1', 'disc2', 'dglow'];

  function hx(h) { var s = h.slice(1), p = function (i) { return parseInt(s.slice(i, i + 2), 16); }; return [p(0), p(2), p(4), s.length >= 8 ? p(6) / 255 : 1]; }
  function lerpV(a, b, t) { return typeof a === 'number' ? a + (b - a) * t : a.map(function (x, i) { return x + (b[i] - x) * t; }); }
  function parse(o) { var r = {}; Object.keys(o).forEach(function (k) { r[k] = typeof o[k] === 'number' ? o[k] : hx(o[k]); }); return r; }
  function blend(a, b, t) { var r = {}; Object.keys(a).forEach(function (k) { r[k] = lerpV(a[k], b[k], t); }); return r; }
  function css(c) { return 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + c[3].toFixed(3) + ')'; }
  function lin(v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
  function lum(c) { return 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]); }
  function smooth(e0, e1, x) { var t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); }
  var PARSED = {};
  ORDER.forEach(function (s) { PARSED[s] = { night: parse(PAL[s].night), twi: parse(PAL[s].twi), day: parse(PAL[s].day) }; });

  var pick = session.get('entrySeason');
  if (ORDER.indexOf(pick) < 0) pick = null;
  var previewDay = parseFloat(params.get('day')), previewHour = parseFloat(params.get('hour'));

  function sky(now) {
    var N = previewDay > 0 ? Math.min(366, previewDay) : Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
    var H = previewHour >= 0 ? previewHour % 24 : now.getHours() + now.getMinutes() / 60;
    var jan = new Date(now.getFullYear(), 0, 1).getTimezoneOffset();
    var jul = new Date(now.getFullYear(), 6, 1).getTimezoneOffset();
    var dst = jan !== jul && (previewDay > 0 ? (N >= 88 && N < 300) : now.getTimezoneOffset() < Math.max(jan, jul));
    var solar = H - (dst ? 1 : 0) - 0.16;
    var rad = Math.PI / 180;
    var decl = -23.44 * Math.cos(2 * Math.PI * (N + 10) / 365) * rad;
    var lat = 55.7 * rad;
    var alt = Math.asin(Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(15 * (solar - 12) * rad)) / rad;
    var tw = smooth(-14, -2, alt), dl = smooth(-3, 10, alt);

    /* smooth year clock: each season peaks mid-season and fades into the next */
    var autoW = { winter: 0, spring: 0, summer: 0, autumn: 0 };
    var A = [['winter', 35], ['spring', 126], ['summer', 219], ['autumn', 310], ['winter', 400]];
    var n = N < 35 ? N + 365 : N;
    for (var i = 0; i < 4; i++) {
      if (n >= A[i][1] && n < A[i + 1][1]) {
        var te = (1 - Math.cos(Math.PI * (n - A[i][1]) / (A[i + 1][1] - A[i][1]))) / 2;
        autoW[A[i][0]] += 1 - te;
        autoW[A[i + 1][0]] += te;
      }
    }
    var top = function (w) { return ORDER.reduce(function (a, b) { return w[b] > w[a] ? b : a; }, 'winter'); };
    var autoSeason = top(autoW);
    var W = autoW;
    if (pick) { W = { winter: 0, spring: 0, summer: 0, autumn: 0 }; W[pick] = 1; }

    var P = null;
    ORDER.forEach(function (s) {
      if (W[s] <= 0) return;
      var Ls = blend(blend(PARSED[s].night, PARSED[s].twi, tw), PARSED[s].day, dl);
      if (!P) { P = {}; Object.keys(Ls).forEach(function (k) { P[k] = typeof Ls[k] === 'number' ? 0 : [0, 0, 0, 0]; }); }
      Object.keys(Ls).forEach(function (k) {
        P[k] = typeof Ls[k] === 'number' ? P[k] + Ls[k] * W[s] : P[k].map(function (x, j) { return x + Ls[k][j] * W[s]; });
      });
    });
    return {
      P: P, W: W, dl: dl, tw: tw, season: top(W), autoSeason: autoSeason,
      tod: dl > 0.5 ? 'day' : tw > 0.45 ? (solar < 12 ? 'dawn' : 'dusk') : 'night'
    };
  }

  /* seasonal life — positions from the approved design */
  var LIFE = {
    winter: [[21.5, 28.3, 6.2, -4.6], [44.5, 78.8, 8.6, -6.4], [50, 63.6, 8.3, -2.8], [95.8, 91.6, 10.2, -7.1], [33, 27.3, 7.4, -0.7], [74.5, 41.6, 10.2, -3.9], [92.1, 79.2, 6, -2.1], [87.7, 47.5, 10.9, -4], [10.7, 60.9, 9.9, -2.7], [12, 35.9, 10.8, -7.6], [77.3, 22.9, 8.8, -4.5], [21.5, 69.5, 6.7, -6.4], [14.7, 43.3, 7.1, -2.7]],
    spring: [[61.8, 23.4, -20.7], [92.5, 23.4, -24], [4.8, 20.7, -24.5], [64.3, 25, -2.9], [47, 18.5, -14.1], [57.1, 16.1, -5.6], [28.8, 25.2, -19.9], [17.3, 24, -3.6], [38.3, 17.3, -9], [85.7, 18.1, -5.6], [76.3, 24.7, -7.5], [9.3, 21.4, -17.6], [21.7, 25.4, -18], [70.8, 24.9, -12.8]],
    summer: [[37, 53.6, 2.7, 7.3, -1.2, -6], [3.3, 77.2, 3.1, 8.5, -3.3, -4.8], [32.7, 68.1, 4, 7.3, -3.9, -0.2], [73.5, 84.9, 2.4, 10.9, -1.5, -5.8], [3.9, 48.1, 2.8, 11.8, -0.8, -7.6], [90.4, 89.3, 3.2, 8.8, -2.1, -7.8], [13.2, 80.4, 4.2, 11.3, -0.1, -9.5], [11.6, 61.7, 3.7, 11.6, -1.4, -9.2], [84.2, 60.4, 3.1, 7.9, -0.3, -1.5], [67.8, 91.8, 2.8, 7.2, -3.9, -5.3], [61.2, 56.9, 3.7, 11.1, -1.8, -4.2], [8.2, 88.1, 2.5, 9.5, -3.4, -1.3]],
    autumn: [[93.2, 13.2, 9.6, 0, 11.9, -8.3], [83.1, 9.7, 7.1, 1, 12.1, -17.5], [18.3, 12.6, 9.1, 0, 18.7, -13.1], [28.3, 10.7, 7.8, 2, 14.2, -2.8], [96.9, 11.1, 8.1, 2, 16, -9.5], [10.6, 10.8, 7.9, 1, 15.1, -10.4], [4.1, 11.8, 8.6, 3, 16.6, -12.6], [36.9, 13.4, 9.7, 1, 17.7, -5], [70.7, 14.7, 10.7, 3, 16.2, -11], [54.5, 8.9, 6.5, 1, 13.6, -5.2], [60, 10.5, 7.7, 2, 13.8, -12.2], [81.5, 13.3, 9.6, 1, 18.4, -3.3], [45.2, 14, 10.2, 0, 18.7, -9.8], [24, 12, 8.7, 1, 18.5, -9.1]],
    floorWinter: [[95.6, 58, 7.2, -7.4], [76.6, 87.9, 7, -4.7], [42.2, 94.2, 7, -5], [8.5, 74, 5.4, -2.4], [8.2, 34.8, 8.2, -5.5], [31.3, 9.9, 8.9, -7.7], [66.2, 5.6, 7.5, -1.3], [88.2, 28, 7.1, -0.5]],
    floorSummer: [[90.6, 69, 3.9, -2.9], [57.2, 90.6, 4, -2.3], [15.8, 78.7, 3.4, -2.5], [6.1, 38.2, 3.7, -2.9], [36.3, 12.2, 2.9, -1.8], [78.6, 15.9, 3, -2.7]]
  };
  var LEAF = ['#e08a3a,#9c5320', '#f6d77a,#d4a640', '#e9b23a,#a86b1f', '#f4c95a,#c9902e'];
  var built = {};
  function span(cls, style) { var s = doc.createElement('span'); s.className = cls; s.style.cssText = style; return s; }
  function grow(key) {
    if (built[key]) return;
    built[key] = true;
    var box = key === 'floorWinter' ? $('floor-winter') : key === 'floorSummer' ? $('floor-summer') : $('fx-' + key);
    if (!box) return;
    var frag = doc.createDocumentFragment();
    LIFE[key].forEach(function (a) {
      if (key === 'winter' || key === 'floorWinter') frag.appendChild(span('spark', 'left:' + a[0] + '%;top:' + a[1] + '%;animation-duration:' + a[2] + 's;animation-delay:' + a[3] + 's'));
      else if (key === 'spring') frag.appendChild(span('seed', 'left:' + a[0] + '%;animation-duration:' + a[1] + 's;animation-delay:' + a[2] + 's'));
      else if (key === 'summer') frag.appendChild(span('glow', 'left:' + a[0] + '%;top:' + a[1] + '%;animation-duration:' + a[2] + 's,' + a[3] + 's;animation-delay:' + a[4] + 's,' + a[5] + 's'));
      else if (key === 'floorSummer') frag.appendChild(span('glow', 'left:' + a[0] + '%;top:' + a[1] + '%;animation-duration:' + a[2] + 's;animation-delay:' + a[3] + 's'));
      else frag.appendChild(span('leaf', 'left:' + a[0] + '%;width:' + a[1] + 'px;height:' + a[2] + 'px;background:linear-gradient(135deg,' + LEAF[a[3]] + ');animation-duration:' + a[4] + 's;animation-delay:' + a[5] + 's'));
    });
    box.appendChild(frag);
  }
  function showLife(key, el, v) {
    if (!el) return;
    if (v > 0.01) grow(key);
    el.style.opacity = v > 0.01 ? v.toFixed(3) : '0';
  }

  var theme = doc.querySelector('meta[name="theme-color"]');
  var disc = $('disc'), craters = $('craters'), stars = $('stars');
  var lastSky = null;
  function applySky() {
    var s = sky(new Date()), P = s.P, u = U();
    lastSky = s;
    var darkTop = lum(P.sky1) > 0.19;
    var hintBg = lerpV(lerpV(P.sky2, P.sky3, 0.45), P.pool, P.pool[3] * 0.45);
    var st = world.style;
    COLOR_KEYS.forEach(function (k) { st.setProperty('--' + k, css(P[k])); });
    st.setProperty('--ink', darkTop ? '#0d1318' : '#f3f6f9');
    st.setProperty('--ink2', darkTop ? '#26333e' : css(P.title));
    st.setProperty('--muted', lum(hintBg) > 0.19 ? '#1c252e' : '#c9d2db');
    st.setProperty('--menu', lum(P.sky3) > 0.19 ? '#1c2630' : '#cbd5df');
    if (theme) theme.setAttribute('content', 'rgb(' + P.sky1.slice(0, 3).map(Math.round).join(',') + ')');
    if (disc) { disc.style.width = disc.style.height = Math.round(P.dsize) + 'px'; }
    if (craters) craters.style.opacity = (P.crater * (1 - s.dl)).toFixed(3);
    if (stars) stars.style.opacity = ((1 - s.dl) * (1 - s.tw * 0.7)).toFixed(3);
    ORDER.forEach(function (k) { world.classList.toggle('s-' + k, k === s.season); });

    var summerLife = s.W.summer * (1 - s.dl * 0.9);
    showLife('winter', $('fx-winter'), s.W.winter);
    showLife('spring', $('fx-spring'), s.W.spring);
    showLife('summer', $('fx-summer'), summerLife);
    showLife('autumn', $('fx-autumn'), s.W.autumn);
    showLife('floorWinter', $('floor-winter'), s.W.winter);
    showLife('floorSummer', $('floor-summer'), summerLife);

    var names = u.seasons || {}, tods = u.tod || {};
    var label = (names[s.season] || s.season) + ' ' + (tods[s.tod] || s.tod);
    say('season', label);
    if (seasonBtn) seasonBtn.setAttribute('aria-label', fmt(u.seasonAria, { s: label + (pick ? '' : ' ' + (u.todayHint || '')) }).replace(/\s+\./, '.'));
    ORDER.forEach(function (k) {
      say('opt-' + k, names[k] || k);
      say('note-' + k, k === s.autoSeason ? (u.today || '') : '');
    });
    say('opt-auto', u.todaySeason || '');
    say('note-auto', names[s.autoSeason] || '');
    $$('.sopt').forEach(function (b) {
      var v = b.getAttribute('data-season');
      b.setAttribute('aria-pressed', (v === 'auto' ? !pick : v === pick) ? 'true' : 'false');
    });
  }

  /* ------------------------------------------------------------------ the ring */
  var n = 0, busy = false, enterTimer = null, announced = false;
  function front() { return ((n % COUNT) + COUNT) % COUNT; }
  function layout() {
    var k = front();
    items.forEach(function (it, i) {
      var phi = i * STEP - n * STEP;
      var c = Math.cos(phi * Math.PI / 180);
      it.style.transform = 'rotateY(' + phi + 'deg) translateZ(var(--r)) rotateY(' + (-phi) + 'deg)';
      pds[i].style.opacity = (0.3 + 0.7 * (c + 1) / 2).toFixed(3);
      pds[i].classList.toggle('on', i === k);
      if (labels[i]) labels[i].style.opacity = Math.max(0, c).toFixed(3);
    });
    if (floor) floor.style.transform = 'rotateX(90deg) rotateZ(' + (n * STEP) + 'deg)';
    dots.forEach(function (d, i) { d.classList.toggle('on', i === k); d.setAttribute('aria-current', i === k ? 'true' : 'false'); });
    if (announced && live) {
      var p = (C().portals || [])[k] || {};
      live.textContent = (p.name || '') + ', ' + fmt(U().ofN, { i: k + 1, n: COUNT });
    }
    announced = true;
  }
  function step(d) { if (busy) return; n += d; layout(); }
  function goTo(i) {
    if (busy) return;
    var delta = ((i - front()) % COUNT + COUNT) % COUNT;
    if (delta > COUNT / 2) delta -= COUNT;
    if (delta) { n += delta; layout(); }
  }

  /* entering a world */
  function enter(i) {
    if (busy) return;
    var p = (C().portals || [])[i] || {};
    busy = true;
    closeMenu(false);
    world.classList.add('entering');
    clearTimeout(enterTimer);
    enterTimer = setTimeout(function () {
      if (p.link) { location.href = p.link; return; }
      showDest(i, p);
    }, reduced ? 0 : 820);
  }
  function showDest(i, p) {
    if (!dest) return;
    $('dest-rune').textContent = p.rune || '';
    say('dest-name', p.name || '');
    dest.setAttribute('aria-label', p.name || '');
    dest.hidden = false;
    if (live) live.textContent = (p.name || '') + '. ' + (U().comingSoon || '');
    if (destBack) destBack.focus({ preventScroll: true });
  }
  function leave(focusPortal) {
    clearTimeout(enterTimer);
    if (dest) dest.hidden = true;
    world.classList.remove('entering');
    busy = false;
    if (focusPortal && pds[front()]) pds[front()].focus({ preventScroll: true });
  }
  if (destBack) destBack.addEventListener('click', function () { leave(true); });
  window.addEventListener('pageshow', function (e) { if (e.persisted || busy) leave(false); });

  var lastPointer = 0;
  if (stage) stage.addEventListener('pointerdown', function () { lastPointer = Date.now(); }, true);
  pds.forEach(function (pd, i) {
    pd.addEventListener('click', function (e) {
      var isFront = i === front();
      var link = ((C().portals || [])[i] || {}).link;
      if (isFront && link && (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button)) return; // new tab / window
      e.preventDefault();
      if (isFront) enter(i); else goTo(i);
    });
    pd.addEventListener('focus', function () {
      if (Date.now() - lastPointer < 600) return; // a click is on its way — let it decide
      if (i !== front()) goTo(i);
    });
  });
  dots.forEach(function (d, i) { d.addEventListener('click', function () { goTo(i); }); });
  if ($('prev')) $('prev').addEventListener('click', function () { step(-1); });
  if ($('next')) $('next').addEventListener('click', function () { step(1); });
  if (ringNav) ringNav.addEventListener('keydown', function (e) {
    var d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!d || busy) return;
    e.preventDefault();
    step(d);
    var a = doc.activeElement;
    if (a && a.classList.contains('pd')) pds[front()].focus({ preventScroll: true });
    else if (a && a.classList.contains('dot')) dots[front()].focus({ preventScroll: true });
  });
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && dest && !dest.hidden) leave(true); });

  /* scroll and swipe turn the ring */
  if (stage) {
    var acc = 0, lockUntil = 0, tx = null, ty = null;
    stage.addEventListener('wheel', function (e) {
      var t = Date.now();
      if (t < lockUntil) return;
      acc += Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (Math.abs(acc) > 40) { step(acc > 0 ? 1 : -1); acc = 0; lockUntil = t + 700; }
    }, { passive: true });
    stage.addEventListener('touchstart', function (e) {
      var t = e.touches && e.touches[0];
      if (t) { tx = t.clientX; ty = t.clientY; }
    }, { passive: true });
    stage.addEventListener('touchend', function (e) {
      var t = e.changedTouches && e.changedTouches[0];
      if (!t || tx == null) return;
      var dx = t.clientX - tx, dy = t.clientY - ty;
      tx = null;
      var d = Math.abs(dx) > Math.abs(dy) ? -dx : -dy;
      if (Math.abs(d) > 36) step(d > 0 ? 1 : -1);
    }, { passive: true });
  }

  /* ------------------------------------------------------------------ season picker */
  function openMenu() {
    if (!seasonMenu) return;
    seasonMenu.hidden = false;
    seasonBtn.setAttribute('aria-expanded', 'true');
    var on = seasonMenu.querySelector('.sopt[aria-pressed="true"]') || seasonMenu.querySelector('.sopt');
    if (on) on.focus({ preventScroll: true });
  }
  function closeMenu(refocus) {
    if (!seasonMenu || seasonMenu.hidden) return;
    seasonMenu.hidden = true;
    seasonBtn.setAttribute('aria-expanded', 'false');
    if (refocus) seasonBtn.focus({ preventScroll: true });
  }
  if (seasonBtn && seasonMenu) {
    seasonBtn.addEventListener('click', function () { if (seasonMenu.hidden) openMenu(); else closeMenu(false); });
    $$('.sopt', seasonMenu).forEach(function (b) {
      b.addEventListener('click', function () {
        var v = b.getAttribute('data-season');
        pick = v === 'auto' ? null : v;
        session.set('entrySeason', pick);
        applySky();
        closeMenu(true);
      });
    });
    seasonMenu.parentNode.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !seasonMenu.hidden) { e.stopPropagation(); closeMenu(true); return; }
      if (seasonMenu.hidden || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return;
      var opts = $$('.sopt', seasonMenu), at = opts.indexOf(doc.activeElement);
      e.preventDefault();
      opts[(at + (e.key === 'ArrowDown' ? 1 : -1) + opts.length) % opts.length].focus();
    });
    doc.addEventListener('click', function (e) { if (!seasonMenu.hidden && !seasonMenu.parentNode.contains(e.target)) closeMenu(false); });
    seasonMenu.addEventListener('focusout', function (e) {
      if (e.relatedTarget && !seasonMenu.parentNode.contains(e.relatedTarget)) closeMenu(false);
    });
  }

  /* ------------------------------------------------------------------ runes / EN / DA */
  function setMode(m) {
    runeMode = m === 'runes';
    local.set('entryLang', m);
    root.classList.toggle('mode-runes', runeMode);
    root.classList.toggle('mode-latin', !runeMode);
    reveal(false);
    renderText();
    applySky();
  }
  langLinks.forEach(function (a) {
    a.addEventListener('click', function (e) {
      var m = a.getAttribute('data-mode');
      if (m === 'runes' || m === PAGE) { e.preventDefault(); setMode(m); return; }
      local.set('entryLang', m); // follow the link to the other language
    });
  });

  var revealTimer = null;
  function reveal(on) {
    clearTimeout(revealTimer);
    root.classList.toggle('reveal-all', on);
    if (aa) aa.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (on) revealTimer = setTimeout(function () { reveal(false); }, 4000);
  }
  if (aa) aa.addEventListener('click', function () { reveal(!root.classList.contains('reveal-all')); });

  /* ------------------------------------------------------------------ the inscription */
  /* Each rune as strokes in a box: y runs 0 (top) → 1 (foot of the stave),
     x is measured in the same units; w is the rune's width. */
  var CARVE = {
    'ᛁ': [0, [[[0, 0], [0, 1]]]],
    'ᛏ': [0.26, [[[0.13, 0], [0.13, 1]], [[0, 0.28], [0.13, 0], [0.26, 0.28]]]],
    'ᚢ': [0.2, [[[0, 1], [0, 0], [0.2, 0.38], [0.2, 1]]]],
    'ᚦ': [0.17, [[[0, 0], [0, 1]], [[0, 0.16], [0.17, 0.5], [0, 0.84]]]],
    'ᛅ': [0.22, [[[0.11, 0], [0.11, 1]], [[0, 0.62], [0.22, 0.36]]]],
    'ᚾ': [0.22, [[[0.11, 0], [0.11, 1]], [[0, 0.36], [0.22, 0.62]]]],
    'ᛘ': [0.28, [[[0.14, 0], [0.14, 1]], [[0, 0], [0.14, 0.33], [0.28, 0]]]],
    'ᛋ': [0.2, [[[0, 0], [0, 0.62], [0.2, 0.33], [0.2, 1]]]],
    'ᛚ': [0.15, [[[0, 1], [0, 0], [0.15, 0.2]]]],
    'ᚠ': [0.22, [[[0, 0], [0, 1]], [[0, 0.3], [0.12, 0.02]], [[0, 0.55], [0.22, 0.06]]]],
    'ᚱ': [0.2, [[[0, 1], [0, 0], [0.18, 0.22], [0.07, 0.47], [0.2, 1]]]],
    'ᚬ': [0.22, [[[0.11, 0], [0.11, 1]], [[0, 0.24], [0.22, 0.5]], [[0, 0.46], [0.22, 0.72]]]],
    'ᚴ': [0.2, [[[0, 0], [0, 1]], [[0, 0.54], [0.2, 0]]]],
    'ᚼ': [0.24, [[[0.12, 0], [0.12, 1]], [[0, 0.24], [0.24, 0.76]], [[0, 0.76], [0.24, 0.24]]]],
    'ᛦ': [0.3, [[[0.15, 0], [0.15, 1]], [[0.15, 0.62], [0, 1]], [[0.15, 0.62], [0.3, 1]]]],
    'ᛒ': [0.18, [[[0, 0], [0, 1]], [[0, 0], [0.18, 0.25], [0, 0.5], [0.18, 0.75], [0, 1]]]]
  };
  var lastCarve = null;
  function carve(text) {
    var g = $('inscription-runes'), svg = $('inscription');
    text = String(text || '').trim();
    if (!g || !svg || !text) return;
    if (/[a-zæøå]/i.test(text)) text = tr(text, 'en');
    if (g.getAttribute('data-carved') === text) return;
    lastCarve = text;
    var seed = 2166136261;
    for (var c = 0; c < text.length; c++) { seed ^= text.charCodeAt(c); seed = Math.imul(seed, 16777619); }
    var rand = function () { seed = (seed + 0x6D2B79F5) | 0; var t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    var BASE = 250, GAP = 17, DGAP = 20, f1 = function (v) { return v.toFixed(1); };
    var xe = 30 - GAP, out = [];
    Array.prototype.forEach.call(text, function (ch) {
      if (/[᛬᛫:·\s]/.test(ch)) {
        if (!out.length) return;
        var xd = xe + DGAP;
        out.push(['M' + f1(xd) + ' ' + f1(BASE - 175 * 0.66) + 'v6M' + f1(xd) + ' ' + f1(BASE - 175 * 0.31) + 'v6', '6', '0.2']);
        xe = xd + DGAP - GAP;
        return;
      }
      var r = CARVE[ch];
      if (!r) return;
      var h = 150 + rand() * 68, x0 = xe + GAP, top = BASE - h;
      var d = r[1].map(function (stroke) {
        return 'M' + stroke.map(function (p) { return f1(x0 + p[0] * h) + ' ' + f1(top + p[1] * h); }).join(' L');
      }).join('');
      out.push([d, (2.6 + rand() * 1.6).toFixed(1), (0.2 + rand() * 0.2).toFixed(2)]);
      xe = x0 + r[0] * h;
    });
    if (!out.length) return;
    while (g.firstChild) g.removeChild(g.firstChild);
    out.forEach(function (o) {
      var p = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', o[0]); p.setAttribute('stroke-width', o[1]); p.setAttribute('opacity', o[2]);
      g.appendChild(p);
    });
    var w = Math.ceil(xe + 30), W = Math.max(1877, w); // a short text keeps the rune height of the original
    svg.setAttribute('viewBox', ((w - W) / 2).toFixed(1) + ' 0 ' + W + ' 250');
    g.setAttribute('data-carved', text);
  }

  /* On narrow screens the inscription is cropped rather than shrunk, the way the
     birch treeline was, so the runes stand as tall behind the portals as on a desktop. */
  (function () {
    var svg = $('inscription');
    if (!svg || !window.matchMedia) return;
    var mq = matchMedia('(max-width: 1100px)');
    var fit = function () { svg.setAttribute('preserveAspectRatio', mq.matches ? 'xMidYMax slice' : 'xMidYMax meet'); };
    fit();
    if (mq.addEventListener) mq.addEventListener('change', fit); else if (mq.addListener) mq.addListener(fit);
  })();

  /* ------------------------------------------------------------------ live wording from /admin */
  function refresh() {
    if (!window.fetch || !window.Promise) return;
    var get = function (u) { return fetch(u, { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); };
    Promise.all([get('content/entry.json'), get('content/entry.da.json')]).then(function (r) {
      var changed = false;
      if (r[0] && JSON.stringify(r[0]) !== JSON.stringify(CONTENT.en)) { CONTENT.en = r[0]; changed = true; }
      if (r[1] && JSON.stringify(r[1]) !== JSON.stringify(CONTENT.da)) { CONTENT.da = r[1]; changed = true; }
      if (changed && !busy) { renderText(); carve(C().inscription); layout(); }
    });
  }

  /* ------------------------------------------------------------------ start */
  renderText();
  applySky();
  layout();
  carve(C().inscription);
  requestAnimationFrame(function () { requestAnimationFrame(function () { world.classList.add('ready'); }); });
  setInterval(function () { if (!doc.hidden) applySky(); }, 60000);
  doc.addEventListener('visibilitychange', function () { if (!doc.hidden) applySky(); });
  refresh();
})();
