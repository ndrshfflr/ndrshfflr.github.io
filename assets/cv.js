/* ==========================================================================
   The CV (cv.html / cv.da.html). The sky, header and rune language come from
   assets/world.js; this adds:
   - "View as" (Everything / Researcher / Consultant / Guide): dims what that
     reader doesn't need and swaps the strengths radar. cv.html#guide opens a lens.
   - the road: every entry's marker is moved onto the road's centre line at its
     own height (the same curve src/cv_page.py draws), text alternating sides.
   Hover cards (courses, blog posts) are CSS only.
   ========================================================================== */
(function () {
  'use strict';

  var W = window.World;
  var doc = document;
  var main = doc.getElementById('main');
  var world = doc.getElementById('world');
  if (!W || !main || !world) return;

  var DATA = {};
  try { DATA = JSON.parse(doc.getElementById('cv-data').textContent) || {}; } catch (e) { DATA = {}; }
  var UI = DATA.ui || {};
  var COUNTS = DATA.counts || {};

  /* runes for the page's own words */
  W.onRender(function () {
    W.$$('.rv[data-k]').forEach(function (el) {
      var lt = el.querySelector('.lt');
      if (lt) W.setRV(el, lt.textContent);
    });
  });

  /* ------------------------------------------------------------------ View as */
  var LENSES = ['all', 'researcher', 'consultant', 'guide'];
  var count = doc.getElementById('cv-count');
  function setLens(lens, fromUser) {
    if (LENSES.indexOf(lens) < 0) lens = 'all';
    main.setAttribute('data-lens', lens);
    W.$$('.cv-lens').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-lens') === lens ? 'true' : 'false'); });
    W.$$('.cv-rd').forEach(function (r) { r.hidden = r.getAttribute('data-lens') !== lens; });
    if (count) {
      var n = COUNTS.all || 0, k = COUNTS[lens] || 0;
      count.textContent = W.fmt(lens === 'all' ? UI.countAll : UI.countSome, { n: n, k: k });
    }
    if (fromUser && history.replaceState) {
      try { history.replaceState(null, '', lens === 'all' ? location.pathname + location.search : '#' + lens); } catch (e) { /* file:// */ }
    }
  }
  W.$$('.cv-lens').forEach(function (b) {
    b.addEventListener('click', function () { setLens(b.getAttribute('data-lens'), true); });
  });
  setLens((location.hash || '').slice(1), false);
  window.addEventListener('hashchange', function () { setLens((location.hash || '').slice(1), false); });

  /* ------------------------------------------------------------------ the road */
  /* The road is drawn by src/cv_page.py scenery(): a 1440 × 5000 drawing stretched from
     the foot of the mountain to the bottom of the page. Keep the curve in step. */
  var VB_W = 1440, VB_H = 5000, MIN_TEXT = 280, GUTTER = 84;
  var road = doc.querySelector('.cv-road');
  function roadX(yv) {
    var t = Math.max(0, Math.min(1, yv / VB_H));
    var amp = 40 + 260 * t;
    return 720 + amp * Math.sin(t * 9.5 + 0.4) * (0.4 + 0.6 * t);
  }
  var rows = W.$$('.cv-row');
  var narrow = window.matchMedia ? matchMedia('(max-width: 760px)') : { matches: false };
  var passes = 0, frame = 0;
  function place() {
    frame = 0;
    if (narrow.matches) { rows.forEach(function (r) { r.style.removeProperty('--x'); }); return; }
    var wb = world.getBoundingClientRect();
    var Wd = wb.width, H = wb.height;
    /* the road starts at the foot of the mountain, which grows with the window (assets/cv.css) */
    var ROAD_TOP = road ? road.getBoundingClientRect().top - wb.top : 636;
    if (!Wd || H <= ROAD_TOP) return;
    var moved = false;
    rows.forEach(function (r) {
      var b = r.getBoundingClientRect();
      var yc = b.top + b.height / 2 - wb.top;
      var x = roadX((yc - ROAD_TOP) * VB_H / (H - ROAD_TOP)) * Wd / VB_W - (b.left - wb.left);
      var room = GUTTER + MIN_TEXT;
      x = r.classList.contains('left') ? Math.max(room, x) : Math.min(b.width - room, x);
      x = Math.round(x);
      var cur = parseInt(r.style.getPropertyValue('--x'), 10);
      if (cur !== x) { r.style.setProperty('--x', x + 'px'); moved = true; }
    });
    /* moving the text can re-wrap it, which shifts what's below: settle in a few passes */
    if (moved && passes < 6) { passes += 1; schedule(); }
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(place); }
  function again() { passes = 0; schedule(); }
  again();
  window.addEventListener('load', again);
  window.addEventListener('resize', again);
  if (narrow.addEventListener) narrow.addEventListener('change', again);
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(again);
  /* images (logos, covers) arriving late change heights too */
  W.$$('.cv-wrap img').forEach(function (img) { if (!img.complete) img.addEventListener('load', again); });
})();
