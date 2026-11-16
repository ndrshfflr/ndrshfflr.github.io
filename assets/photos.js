/* ==========================================================================
   Photography — the mosaic and the full-screen viewer.
   - every photo opens full-screen; one linked to a blog post shows a clear link to it there
   - each photo spans 1–3 cells each way (width/height, or its weight 1–5)
     (‹ › / arrow keys / swipe to move on, Esc to close)
   - reloads content/gallery.json so photos added in /admin show up without
     a rebuild
   - a photo can be linked directly: photography.html#photo=<file name>
   The sky, seasons, header and rune language come from assets/world.js.
   ========================================================================== */
(function () {
  'use strict';

  var W = window.World;
  var doc = document;
  if (!W || !doc.getElementById('mosaic')) return;

  var DATA = {};
  try { DATA = JSON.parse(doc.getElementById('photo-data').textContent) || {}; } catch (e) { DATA = {}; }
  var $ = W.$, $$ = W.$$, U = W.U, say = W.say, fmt = W.fmt;
  var photos = DATA.photos || [];
  var POSTS = DATA.posts || {};
  var PAGE_TEXT = DATA.text || {};
  var POS = { center: '50% 50%', top: '50% 18%', bottom: '50% 82%', left: '22% 50%', right: '78% 50%' };
  var SLUG = /^[A-Za-z0-9._-]+$/;

  var mosaic = $('mosaic'), empty = $('mosaic-empty');
  var viewer = $('viewer'), vImg = $('v-img'), vCap = $('v-cap'), vLinks = $('v-links'), vCount = $('v-count');
  var vPrev = $('v-prev'), vNext = $('v-next'), vClose = $('v-close');
  var current = -1, opener = null, seq = null; // seq: the photos the viewer walks through (an album), else all
  var vlist = null;                             // or a set of its own (a field trip, which may hold field-log-only photos)
  function vp() { return vlist || photos; }

  function T(key) { var t = PAGE_TEXT[W.latin()] || PAGE_TEXT[W.page] || {}; return t[key] || ''; }

  /* cells a photo spans (columns, rows): width and height 1–3 win, else the weight 1–5 (as build.py) */
  var WEIGHT_CELLS = { 1: [1, 1], 2: [2, 1], 3: [2, 2], 4: [3, 2], 5: [3, 3] };
  function cells(p, w) {
    var f = function (v) { v = parseInt(v, 10); return v >= 1 ? Math.min(3, v) : 0; };
    var cw = f(p.width), ch = f(p.height);
    if (cw || ch) return [cw || 1, ch || 1];
    return WEIGHT_CELLS[w] || [1, 1];
  }
  /* the same clean-up build.py does, for photos that arrive live */
  function normalise(list) {
    return (Array.isArray(list) ? list : []).filter(function (p) { return p && p.image && p.onPhotoPage !== false; }).map(function (p) {
      var w = Math.min(5, Math.max(1, Math.round(Number(p.weight) || 1))), cr = cells(p, w);
      return {
        image: String(p.image), caption: p.caption ? String(p.caption) : '',
        weight: w, c: cr[0], r: cr[1], pos: POS[p.focus] || POS.center,
        post: p.post && SLUG.test(p.post) ? String(p.post) : '',
        species: (Array.isArray(p.species) ? p.species : [p.species]).filter(Boolean).map(String)
      };
    });
  }
  function postTitle(slug) { return POSTS[slug] || ''; }
  function idOf(p) { return (p.image.split('/').pop() || '').replace(/\.[^.]+$/, ''); }

  /* ------------------------------------------------------------------ text */
  function tileLabel(p, i) {
    var u = U(), name = p.caption || fmt(u.photoN, { i: i + 1 });
    return name;
  }
  function renderText() {
    var u = U();
    say('heading', T('heading'));
    var intro = T('intro');
    say('intro', intro);
    var introP = doc.querySelector('.photo-hero .title');
    if (introP) introP.hidden = !intro;
    say('empty', u.empty);
    say('back', u.back);
    mosaic.setAttribute('aria-label', u.gridLabel || '');
    if (viewer) viewer.setAttribute('aria-label', T('heading'));
    if (vPrev) vPrev.setAttribute('aria-label', u.prevPhoto || '');
    if (vNext) vNext.setAttribute('aria-label', u.nextPhoto || '');
    if (vClose) vClose.setAttribute('aria-label', u.close || '');
    $$('.tile-a', mosaic).forEach(function (a) {
      var i = +a.getAttribute('data-i'), p = photos[i];
      if (!p) return;
      a.setAttribute('aria-label', tileLabel(p, i));
      var rv = a.querySelector('.rv');
      if (rv) W.setRV(rv, p.caption);
    });
    if (current >= 0) fillViewer(current);
  }

  /* ------------------------------------------------------------------ the mosaic */
  function el(tag, cls) { var e = doc.createElement(tag); if (cls) e.className = cls; return e; }
  function buildTile(p, i) {
    var li = el('li', 'tile');
    li.style.setProperty('--c', p.c); li.style.setProperty('--r', p.r);
    var a = el('a', 'tile-a');
    a.href = p.image;
    a.setAttribute('data-i', i);
    a.setAttribute('aria-label', tileLabel(p, i));
    var img = el('img');
    img.src = p.image; img.alt = p.caption; img.loading = 'lazy'; img.decoding = 'async';
    img.style.objectPosition = p.pos;
    var cap = el('span', 'tile-cap'); cap.setAttribute('aria-hidden', 'true');
    var r = el('span', 'tile-rune'); r.textContent = p.post ? 'ᚬ' : 'ᛋ';
    cap.appendChild(r);
    if (p.caption) cap.appendChild(W.rv(p.caption, 'cap-' + i));
    a.appendChild(img); a.appendChild(cap); li.appendChild(a);
    return li;
  }
  function wire() {
    $$('.tile-a img', mosaic).forEach(function (img) {
      var done = function () { img.classList.add('ld'); };
      if (img.complete) done(); else { img.addEventListener('load', done); img.addEventListener('error', done); }
    });
  }
  function rebuild() {
    while (mosaic.firstChild) mosaic.removeChild(mosaic.firstChild);
    var frag = doc.createDocumentFragment();
    photos.forEach(function (p, i) { frag.appendChild(buildTile(p, i)); });
    mosaic.appendChild(frag);
    if (empty) empty.hidden = photos.length > 0;
    wire();
  }

  mosaic.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('.tile-a');
    if (!a) return;
    var i = +a.getAttribute('data-i'), p = photos[i];
    if (!p) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return; // new tab
    e.preventDefault();
    open(i, a);
  });

  /* ------------------------------------------------------------------ the viewer */
  function link(rune, text, href, cls) {
    var a = el('a', cls); a.href = href;
    var r = el('span', 'lr'); r.setAttribute('aria-hidden', 'true'); r.textContent = rune;
    a.appendChild(r); a.appendChild(W.rv(text));
    return a;
  }
  function fillViewer(i) {
    var all = vp(), p = all[i], u = U();
    if (!p) return;
    vImg.style.objectPosition = '';
    if (vImg.getAttribute('src') !== p.image) vImg.src = p.image;
    vImg.alt = p.caption || fmt(u.photoN, { i: i + 1 });
    while (vCap.firstChild) vCap.removeChild(vCap.firstChild);
    if (p.caption) vCap.appendChild(W.rv(p.caption));
    while (vLinks.firstChild) vLinks.removeChild(vLinks.firstChild);
    if (p.post) {
      var pl = link('ᚬ', postTitle(p.post) ? fmt(u.readPostTitle, { t: postTitle(p.post) }) : u.readPost, 'post.html?slug=' + encodeURIComponent(p.post), 'v-post');
      var arrow = el('span', 'v-arrow'); arrow.setAttribute('aria-hidden', 'true'); arrow.textContent = '\u2192'; pl.appendChild(arrow);
      vLinks.appendChild(pl);
    }
    p.species.forEach(function (name) {
      vLinks.appendChild(link('ᚱ', p.species.length > 1 ? name : u.inFieldlog, DATA.fieldlog[W.latin()] + '#sp=' + encodeURIComponent(name)));
    });
    var list = seq || null, at = list ? list.indexOf(i) : i, n = list ? list.length : all.length;
    vCount.textContent = fmt(u.count, { i: at + 1, n: n });
    vPrev.hidden = vNext.hidden = n < 2;
    [at - 1, at + 1].forEach(function (j) { var k = list ? list[(j + n) % n] : (j + n) % n; var q = all[k]; if (q) { var im = new Image(); im.src = q.image; } });
  }
  function grow(fromEl) {
    /* the photo grows out of its tile */
    if (W.reduced || !fromEl || !vImg.animate) return;
    var from = fromEl.getBoundingClientRect();
    var run = function () {
      var to = vImg.getBoundingClientRect();
      if (!to.width || !from.width) return;
      var s = Math.max(from.width / to.width, from.height / to.height);
      var dx = (from.left + from.width / 2) - (to.left + to.width / 2);
      var dy = (from.top + from.height / 2) - (to.top + to.height / 2);
      vImg.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + s + ')', opacity: 0.4 }, { transform: 'none', opacity: 1 }],
        { duration: 460, easing: 'cubic-bezier(.2,.7,.2,1)' });
    };
    if (vImg.complete && vImg.naturalWidth) run(); else vImg.addEventListener('load', run, { once: true });
  }
  function open(i, fromLink, list, own) {
    vlist = own || null;
    if (!viewer || !viewer.showModal) { location.href = vp()[i].image; return; }
    seq = list && list.length ? list : null;
    current = i;
    opener = fromLink || null;
    fillViewer(i);
    if (!viewer.open) { viewer.showModal(); doc.body.classList.add('v-open'); }
    grow(fromLink && fromLink.querySelector('img'));
    mark(i);
    vClose.focus({ preventScroll: true });
  }
  function mark(i) {
    if (vlist) return; // a field trip's own set: no link to the photo
    try { history.replaceState(null, '', location.pathname + location.search + '#photo=' + encodeURIComponent(idOf(photos[i]))); } catch (e) { /* file:// */ }
  }
  function go(d) {
    var n = seq ? seq.length : vp().length;
    if (current < 0 || n < 2) return;
    if (seq) current = seq[(seq.indexOf(current) + d + n) % n];
    else current = (current + d + n) % n;
    fillViewer(current);
    mark(current);
    if (!W.reduced && vImg.animate) vImg.animate([{ opacity: 0.2, transform: 'translateX(' + (d * 24) + 'px)' }, { opacity: 1, transform: 'none' }], { duration: 280, easing: 'ease-out' });
  }
  function closed() {
    doc.body.classList.remove('v-open');
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* file:// */ }
    var back = (opener && doc.body.contains(opener) && opener.offsetParent) ? opener : mosaic.querySelector('.tile-a[data-i="' + current + '"]');
    current = -1; seq = null; vlist = null;
    if (back) back.focus({ preventScroll: true });
  }
  if (viewer) {
    vClose.addEventListener('click', function () { viewer.close(); });
    vPrev.addEventListener('click', function () { go(-1); });
    vNext.addEventListener('click', function () { go(1); });
    viewer.addEventListener('close', closed);
    viewer.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    });
    /* a click on the dark around the photo closes */
    viewer.addEventListener('click', function (e) { if (e.target === viewer || e.target.id === 'v-stage') viewer.close(); });
    var tx = null, ty = null;
    viewer.addEventListener('touchstart', function (e) { var t = e.touches && e.touches[0]; if (t) { tx = t.clientX; ty = t.clientY; } }, { passive: true });
    viewer.addEventListener('touchend', function (e) {
      var t = e.changedTouches && e.changedTouches[0];
      if (!t || tx == null) return;
      var dx = t.clientX - tx, dy = t.clientY - ty;
      tx = null;
      if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
    }, { passive: true });
  }
  function openFromHash() {
    var m = /#photo=([^&]+)/.exec(location.hash);
    if (!m || (viewer && viewer.open)) return;
    var id = decodeURIComponent(m[1]);
    for (var i = 0; i < photos.length; i++) {
      if (idOf(photos[i]) === id) { open(i, mosaic.querySelector('.tile-a[data-i="' + i + '"]')); return; }
    }
  }

  /* ------------------------------------------------------------------ live photos from /admin */
  function refresh() {
    if (!window.fetch) return;
    fetch('content/gallery.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (g) {
      if (!g) return;
      var fresh = normalise(g.images);
      if (g.intro && typeof g.intro === 'object') { PAGE_TEXT.en.intro = g.intro.en || ''; PAGE_TEXT.da.intro = g.intro.da || ''; }
      if (g.look) W.setLook(g.look);
      if (JSON.stringify(fresh) !== JSON.stringify(photos)) {
        photos = fresh;
        if (viewer && viewer.open) viewer.close();
        rebuild();
        openFromHash(); // a linked photo that only just arrived
      }
      renderText();
    }).catch(function () {});
  }

  /* ------------------------------------------------------------------ for photos-more.js */
  /* albums and field trips show their own tiles and open the viewer on their own set of photos */
  window.Photos = {
    list: function () { return photos; },
    tile: buildTile,
    indexOf: function (image) { for (var i = 0; i < photos.length; i++) if (photos[i].image === image) return i; return -1; },
    open: function (i, fromEl, list) { open(i, fromEl, list); },
    openSet: function (set, k, fromEl) { open(k, fromEl, null, set); },
    data: DATA
  };

  /* ------------------------------------------------------------------ start */
  PAGE_TEXT.en = PAGE_TEXT.en || {}; PAGE_TEXT.da = PAGE_TEXT.da || {};
  DATA.fieldlog = DATA.fieldlog || { en: 'fieldlog.html', da: 'fieldlog.da.html' };
  wire();
  W.onRender(renderText);
  openFromHash();
  refresh();
})();
