/* ==========================================================================
   Entry page — the stone circle of portals (index.html / da.html).
   - turns the ring (scroll, swipe, arrow keys, ‹ › buttons, rune row)
   - zooms through the front portal into its world
   - carves the inscription behind the circle
   - reloads wording from content/entry.json + entry.da.json so edits made in
     /admin show up without a rebuild
   The sky, seasons, header and rune language come from assets/world.js.
   ========================================================================== */
(function () {
  'use strict';

  var W = window.World;
  var doc = document;
  var world = doc.getElementById('world');
  if (!W || !world) return;

  var DATA = {};
  try { DATA = JSON.parse(doc.getElementById('entry-data').textContent) || {}; } catch (e) { DATA = {}; }
  var CONTENT = DATA.content || {};
  var $ = W.$, $$ = W.$$, say = W.say, tr = W.tr, fmt = W.fmt, U = W.U, reduced = W.reduced;
  function C() { return CONTENT[W.latin()] || CONTENT[W.page] || {}; }

  /* ------------------------------------------------------------------ elements */
  var items = $$('.item'), pds = $$('.pd'), dots = $$('.dot');
  var labels = items.map(function (it) { return it.querySelector('.pl'); });
  var COUNT = items.length || 1, STEP = 360 / COUNT;
  var floor = $('floor'), stage = $('stage'), ringNav = $('ring-nav'), live = $('live');
  var dest = $('dest'), destBack = $('dest-back');

  /* ------------------------------------------------------------------ text */
  function renderText() {
    var c = C(), u = U();
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
    W.closeMenu(false);
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
  W.onRender(renderText);
  layout();
  carve(C().inscription);
  refresh();
})();
