/* ==========================================================================
   Photography, beyond the stream (photography.html / photography.da.html):
   - My gear: a slim line that opens; each piece turns slowly in 3D. The shapes
     are simple stand-ins built from flat faces, one per kind (camera, compact,
     phone, prime, zoom). Open or closed is remembered.
   - The views: Stream (the mosaic, assets/photos.js) · Albums · Field trips.
     #albums and #trips open those views directly.
   - Albums: piles of prints that fan out; one opens as its own mosaic.
   - Field trips: a world map with a pin per trip. Trips close together gather
     into one pin that zooms in. The coastlines (Natural Earth, public domain)
     load only when the map is opened: assets/map/land-50m.json, made by
     src/map/make_land.js.
   Everything comes from content/gallery.json, prepared by src/build.py.
   ========================================================================== */
(function () {
  'use strict';

  var W = window.World, P = window.Photos;
  var doc = document;
  if (!W || !P) return;
  var $ = W.$, $$ = W.$$, U = W.U, fmt = W.fmt;
  var DATA = P.data || {};
  var albums = DATA.albums || [], trips = DATA.trips || [];
  function el(tag, cls, text) { var e = doc.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function lang() { return W.latin() === 'da' ? 'da' : 'en'; }

  /* ================================================================== my gear */
  var SH = { front: 'linear-gradient(160deg,#4a525c,#353b43)', back: '#30363d', side: 'linear-gradient(180deg,#3a4048,#262a30)', top: 'linear-gradient(90deg,#5a626c,#454c55)', bottom: '#1b1e22' };
  function face(w, h, t, bg, extra) {
    return '<span class="face" style="width:' + w + 'px;height:' + h + 'px;margin-left:' + (-w / 2) + 'px;margin-top:' + (-h / 2) +
      'px;transform:' + t + ';background:' + bg + (extra ? ';' + extra : '') + '"></span>';
  }
  function cuboid(w, h, d, x, y, z, c, round) {
    var at = 'translate3d(' + x + 'px,' + y + 'px,' + z + 'px) ', r = round ? 'border-radius:' + round + 'px' : '';
    c = c || SH;
    return face(w, h, at + 'translateZ(' + d / 2 + 'px)', c.front, r) + face(w, h, at + 'rotateY(180deg) translateZ(' + d / 2 + 'px)', c.back, r) +
      face(d, h, at + 'rotateY(90deg) translateZ(' + w / 2 + 'px)', c.side) + face(d, h, at + 'rotateY(-90deg) translateZ(' + w / 2 + 'px)', c.side) +
      face(w, d, at + 'rotateX(90deg) translateZ(' + h / 2 + 'px)', c.top) + face(w, d, at + 'rotateX(-90deg) translateZ(' + h / 2 + 'px)', c.bottom);
  }
  function cylinder(r, len, x, y, z, n, glass) {
    var out = '', sw = 2 * Math.PI * r / n * 1.04, at = 'translate3d(' + x + 'px,' + y + 'px,' + z + 'px) ';
    for (var i = 0; i < n; i++) {
      var a = i * 360 / n, lit = Math.round(24 + 24 * Math.max(0, Math.cos((a - 40) * Math.PI / 180)));
      out += face(sw, len, at + 'rotateZ(' + a + 'deg) translateY(' + (-r) + 'px) rotateX(90deg)', 'hsl(210,6%,' + lit + '%)');
    }
    out += face(2 * r, 2 * r, at + 'translateZ(' + len / 2 + 'px)', glass ? 'radial-gradient(circle at 38% 34%,#6f8aa6 0%,#1d2a3a 22%,#06080c 46%,#20252b 70%,#3a4047 72%,#1b1e22 100%)' : '#2a2f35', 'border-radius:50%');
    out += face(2 * r, 2 * r, at + 'rotateY(180deg) translateZ(' + len / 2 + 'px)', '#16191c', 'border-radius:50%');
    return out;
  }
  var SILVER = { front: SH.front, back: SH.back, side: SH.side, top: 'linear-gradient(90deg,#d3d8dd,#a9afb6)', bottom: SH.bottom };
  var PHONE = { front: 'linear-gradient(160deg,#1a2230,#06080c 60%)', back: 'linear-gradient(160deg,#5b6470,#3c434c)', side: '#4a525c', top: '#4a525c', bottom: '#4a525c' };
  var BUMP = { front: '#2a2f35', back: '#30353c', side: '#22262b', top: '#22262b', bottom: '#22262b' };
  var SHAPES = {
    camera: function () { return cuboid(200, 118, 62, 0, 0, 0) + cuboid(64, 34, 54, 0, -76, 0) + cuboid(42, 110, 24, -72, 2, 43) + cylinder(44, 78, 16, 6, 70, 20, true) + cylinder(9, 8, 72, -63, 0, 10); },
    compact: function () { return cuboid(210, 116, 44, 0, 0, 0, SILVER) + cylinder(31, 30, 42, 8, 37, 18, true) + cylinder(8, 8, 74, -62, 0, 10); },
    phone: function () { return cuboid(92, 186, 9, 0, 0, 0, PHONE, 15) + cuboid(40, 40, 3, -18, -62, -6, BUMP, 9) + cylinder(8, 4, -18, -62, -9, 14, true); },
    prime: function () { return cylinder(30, 50, 0, 0, 6, 22, true) + cylinder(26, 10, 0, 0, -25, 18, false); },
    zoom: function () { return cylinder(29, 38, 0, 0, -58, 18, false) + cylinder(35, 56, 0, 0, -11, 22, false) + cylinder(33, 44, 0, 0, 39, 22, true); }
  };
  SHAPES.other = SHAPES.camera;

  var gear = $('gear'), gearBar = $('gear-bar'), gearOpen = $('gear-open');
  function fillStage(stage, scale, big) {
    var kind = stage.getAttribute('data-kind'), make = SHAPES[kind] || SHAPES.other;
    stage.innerHTML = '<span class="g3d-scale" style="transform:scale(' + scale + ')">' + (big ? '<span class="g3d-glow"></span><span class="g3d-shadow"></span>' : '') +
      '<span class="g3d-spin">' + make() + '</span></span>';
  }
  function setGear(open, keep) {
    if (!gear) return;
    gear.classList.toggle('open', open);
    gearBar.setAttribute('aria-expanded', open ? 'true' : 'false');
    gearOpen.hidden = !open;
    W.say('gear-toggle', open ? U().hide : U().show);
    if (open && !gearOpen.getAttribute('data-filled')) {
      $$('.g3d-stage', gearOpen).forEach(function (s) { fillStage(s, 0.62, true); });
      gearOpen.setAttribute('data-filled', '1');
    }
    if (keep) W.local.set('gearOpen', open ? '1' : '0');
  }
  if (gear) {
    $$('.g3d-stage.mini', gear).forEach(function (s) { fillStage(s, 0.2, false); });
    gearBar.addEventListener('click', function () { setGear(!gear.classList.contains('open'), true); });
    W.onRender(function () { W.say('gear-toggle', gear.classList.contains('open') ? U().hide : U().show); });
    setGear(W.local.get('gearOpen') === '1', false);
  }

  /* the words written into the page: in the page's language, or as runes */
  W.onRender(function () {
    var u = U(), kinds = u.kinds || {};
    W.say('gear', u.gear); W.say('v-stream', u.stream); W.say('v-albums', u.albums); W.say('v-trips', u.trips);
    (DATA.gear || []).forEach(function (g, i) { if (kinds[g.kind]) W.say('kind-' + (i + 1), kinds[g.kind]); });
  });

  /* ================================================================== the views */
  var tabs = $$('.pv'), panes = { stream: $('pane-stream'), albums: $('pane-albums'), trips: $('pane-trips') };
  var albumTab = doc.querySelector('.pv[data-view="albums"]');
  var built = {};
  function show(view, keepHash) {
    if (!panes[view]) view = 'stream';
    tabs.forEach(function (b) { var on = b.getAttribute('data-view') === view; b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.classList.toggle('on', on); });
    Object.keys(panes).forEach(function (k) { if (panes[k]) panes[k].hidden = k !== view; });
    if (view === 'albums' && !built.albums) { built.albums = true; buildAlbums(); }
    if (view === 'trips' && !built.trips) { built.trips = true; buildTrips(); }
    if (!keepHash) {
      try { history.replaceState(null, '', location.pathname + location.search + (view === 'stream' ? '' : '#' + view)); } catch (e) { /* file:// */ }
    }
  }
  tabs.forEach(function (b) { b.addEventListener('click', function () { show(b.getAttribute('data-view')); }); });

  /* ================================================================== albums */
  function albumPhotos(a) {
    return a.images.map(function (img) { return P.indexOf(img); }).filter(function (i) { return i >= 0; });
  }
  var openAlbum = null;
  function countText(n) { return n === 1 ? U().photo1 : fmt(U().photosN, { n: n }); }
  function buildAlbums() {
    var pane = panes.albums;
    while (pane.firstChild) pane.removeChild(pane.firstChild);
    var list = albums.filter(function (a) { return albumPhotos(a).length; });
    if (openAlbum) { albumView(openAlbum); return; }
    if (!list.length) { pane.appendChild(el('p', 'mosaic-empty', U().noAlbums)); return; }
    var grid = el('div', 'albums');
    list.forEach(function (a) {
      var idx = albumPhotos(a), ph = P.list();
      var b = el('button', 'album'); b.type = 'button';
      var stack = el('span', 'stack'); stack.setAttribute('aria-hidden', 'true');
      [idx[1], idx[2], idx[0]].forEach(function (k, j) {
        if (k == null) k = idx[0];
        var im = el('img', 's' + (j + 1)); im.src = ph[k].image; im.alt = ''; im.loading = 'lazy'; im.style.objectPosition = ph[k].pos;
        stack.appendChild(im);
      });
      b.appendChild(stack);
      var name = el('span', 'album-name'); var r = el('span', 'album-rune', 'ᛒ'); r.setAttribute('aria-hidden', 'true');
      name.appendChild(r); name.appendChild(W.rv(a.name)); b.appendChild(name);
      b.appendChild(el('span', 'album-n', countText(idx.length)));
      b.addEventListener('click', function () { openAlbum = a; albumView(a); });
      grid.appendChild(b);
    });
    pane.appendChild(grid);
  }
  function albumView(a) {
    var pane = panes.albums, idx = albumPhotos(a), ph = P.list();
    while (pane.firstChild) pane.removeChild(pane.firstChild);
    var head = el('div', 'album-head');
    var back = el('button', 'pv album-back'); back.type = 'button';
    back.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
    back.appendChild(W.rv(U().allAlbums));
    back.addEventListener('click', function () { openAlbum = null; buildAlbums(); });
    var h = el('h2', 'album-title'); h.appendChild(W.rv(a.name));
    head.appendChild(back); head.appendChild(h); head.appendChild(el('span', 'album-n', countText(idx.length)));
    pane.appendChild(head);
    var ul = el('ul', 'mosaic'); ul.setAttribute('aria-label', a.name);
    idx.forEach(function (i) { ul.appendChild(P.tile(ph[i], i)); });
    $$('.tile-a img', ul).forEach(function (img) { var done = function () { img.classList.add('ld'); }; if (img.complete) done(); else { img.addEventListener('load', done); img.addEventListener('error', done); } });
    ul.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('.tile-a');
      if (!t || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
      e.preventDefault();
      P.open(+t.getAttribute('data-i'), t, idx);
    });
    pane.appendChild(ul);
    back.focus({ preventScroll: true });
  }
  if (albumTab) {
    var nAlb = albums.filter(function (a) { return albumPhotos(a).length; }).length;
    albumTab.hidden = !nAlb;
    var n = $('pv-n-albums'); if (n) n.textContent = nAlb || '';
  }

  /* ================================================================== field trips */
  var MW = 1000, MH = 400;                      // the map's drawing, 2.5 : 1
  var WORLD = { name: '', lonL: -180, lonR: 180, latT: 84, latB: -60, world: true };
  var land = null, landLoading = null, worldPath = null;
  var view = WORLD, sel = trips.length ? trips[0].id : '';
  var mapBox, svg, pinLayer, card, worldBtn, regionLabel;

  function loadLand() {
    if (land) return Promise.resolve(land);
    if (!landLoading) {
      landLoading = fetch('assets/map/land-50m.json').then(function (r) { return r.json(); }).then(function (j) {
        var q = j.q;
        land = j.rings.map(function (d) {             // delta-coded, 1/q degree steps → [lon, lat, lon, lat, …]
          var out = new Float32Array(d.length), x = 0, y = 0;
          for (var i = 0; i < d.length; i += 2) { x += d[i]; y += d[i + 1]; out[i] = x / q; out[i + 1] = y / q; }
          var lo = 999, hi = -999, lb = 999, lt = -999, jump = false;
          for (var k = 0; k < out.length; k += 2) {
            if (k && Math.abs(out[k] - out[k - 2]) > 180) jump = true;
            lo = Math.min(lo, out[k]); hi = Math.max(hi, out[k]); lb = Math.min(lb, out[k + 1]); lt = Math.max(lt, out[k + 1]);
          }
          if (jump) { for (var m = 0; m < out.length; m += 2) if (out[m] < -100) out[m] += 360; hi = 540; } // over the 180° line: keep it whole
          return { p: out, lo: lo, hi: hi, lb: lb, lt: lt };
        });
        return land;
      });
    }
    return landLoading;
  }
  function project(v) {
    if (v.world) return function (lon, lat) { return [(lon + 180) / 360 * MW, (84 - lat) / 144 * MH]; };
    return function (lon, lat) { return [(lon - v.lonL) / (v.lonR - v.lonL) * MW, (v.latT - lat) / (v.latT - v.latB) * MH]; };
  }
  function landPath(v) {
    if (v.world && worldPath) return worldPath;
    var pr = project(v), mx = (v.lonR - v.lonL) * 0.08, my = (v.latT - v.latB) * 0.08, out = [];
    var minD = v.world ? 1.1 : 1.6;
    land.forEach(function (r) {
      if (r.hi < v.lonL - mx || r.lo > v.lonR + mx || r.lt < v.latB - my || r.lb > v.latT + my) return;
      var p = r.p, d = '', lx = 1e9, ly = 1e9, n = 0;
      for (var i = 0; i < p.length; i += 2) {
        var lon = v.world ? p[i] : Math.max(v.lonL - mx, Math.min(v.lonR + mx, p[i]));
        var lat = v.world ? p[i + 1] : Math.max(v.latB - my, Math.min(v.latT + my, p[i + 1]));
        var xy = pr(lon, lat);
        if (Math.abs(xy[0] - lx) + Math.abs(xy[1] - ly) < minD && i < p.length - 2) continue;
        d += (n ? 'L' : 'M') + xy[0].toFixed(1) + ',' + xy[1].toFixed(1); lx = xy[0]; ly = xy[1]; n++;
      }
      if (n > 2) out.push(d + 'Z');
    });
    var s = out.join('');
    if (v.world) worldPath = s;
    return s;
  }
  /* the view around some trips: 2.5 : 1 on screen, east–west scaled by the cosine of the latitude */
  function around(list) {
    var lo = Infinity, hi = -Infinity, lb = Infinity, lt = -Infinity;
    list.forEach(function (t) { lo = Math.min(lo, t.lon); hi = Math.max(hi, t.lon); lb = Math.min(lb, t.lat); lt = Math.max(lt, t.lat); });
    var latC = (lb + lt) / 2, cos = Math.max(0.2, Math.cos(latC * Math.PI / 180));
    var spanLat = Math.max((lt - lb) * 1.9, 2.4), spanLon = spanLat * 2.5 / cos;
    if ((hi - lo) * 1.5 > spanLon) { spanLon = (hi - lo) * 1.5; spanLat = spanLon * cos / 2.5; }
    var lonC = (lo + hi) / 2;
    return { lonL: lonC - spanLon / 2, lonR: lonC + spanLon / 2, latT: latC + spanLat / 2, latB: latC - spanLat / 2, world: false };
  }
  function tripName(t) { return lang() === 'da' && t.nameDa ? t.nameDa : t.name; }
  function tripPlace(t) { return lang() === 'da' && t.placeDa ? t.placeDa : t.place; }
  function when(t) {
    var loc = lang() === 'da' ? 'da-DK' : 'en-GB';
    var d = function (s, o) { var x = new Date(s + 'T12:00:00'); return isNaN(x) ? s : x.toLocaleDateString(loc, o); };
    if (!t.from) return '';
    if (!t.to || t.to === t.from) return d(t.from, { day: 'numeric', month: 'long', year: 'numeric' });
    var a = t.from.slice(0, 7) === t.to.slice(0, 7) ? d(t.from, { day: 'numeric' }) : d(t.from, { day: 'numeric', month: 'short' });
    return a + ' – ' + d(t.to, { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function drawMap() {
    svg.innerHTML = '';
    var NS = 'http://www.w3.org/2000/svg';
    if (view.world) {
      var g = doc.createElementNS(NS, 'g'); g.setAttribute('class', 'grat');
      for (var lo = -150; lo < 180; lo += 30) { var l = doc.createElementNS(NS, 'line'), x = (lo + 180) / 360 * MW; l.setAttribute('x1', x); l.setAttribute('x2', x); l.setAttribute('y1', 0); l.setAttribute('y2', MH); g.appendChild(l); }
      [60, 30, 0, -30].forEach(function (la) { var l = doc.createElementNS(NS, 'line'), y = (84 - la) / 144 * MH; l.setAttribute('x1', 0); l.setAttribute('x2', MW); l.setAttribute('y1', y); l.setAttribute('y2', y); g.appendChild(l); });
      svg.appendChild(g);
    }
    var path = doc.createElementNS(NS, 'path');
    path.setAttribute('class', 'land');
    path.setAttribute('d', landPath(view));
    svg.appendChild(path);
    drawPins();
  }
  function drawPins() {
    while (pinLayer.firstChild) pinLayer.removeChild(pinLayer.firstChild);
    var pr = project(view), groups = [];
    var near = MW * 0.07;                               // pins closer than this gather into one
    trips.forEach(function (t) {
      var xy = pr(t.lon, t.lat);
      if (xy[0] < -5 || xy[0] > MW + 5 || xy[1] < -5 || xy[1] > MH + 5) return;
      var g = null;
      for (var i = 0; i < groups.length; i++) if (Math.hypot(groups[i].x - xy[0], groups[i].y - xy[1]) < near) { g = groups[i]; break; }
      if (g) { g.trips.push(t); g.x = (g.x * (g.trips.length - 1) + xy[0]) / g.trips.length; g.y = (g.y * (g.trips.length - 1) + xy[1]) / g.trips.length; }
      else groups.push({ x: xy[0], y: xy[1], trips: [t] });
    });
    groups.forEach(function (g) {
      var many = g.trips.length > 1;
      /* the same spot several times over: no zooming further, each gets its own pin */
      if (many) {
        var spread = Math.max.apply(null, g.trips.map(function (t) { return Math.abs(t.lat - g.trips[0].lat) + Math.abs(t.lon - g.trips[0].lon); }));
        if (spread < 0.02) { g.trips.forEach(function (t, k) { pin({ x: g.x, y: g.y + k * 9, trips: [t] }); }); return; }
      }
      pin(g);
    });
    function pin(g) {
      var many = g.trips.length > 1, t = g.trips[0];
      var b = el('button', 'pin' + (many ? ' group' : '') + (!many && t.id === sel ? ' on' : '')); b.type = 'button';
      b.style.left = (g.x / MW * 100).toFixed(2) + '%'; b.style.top = (g.y / MH * 100).toFixed(2) + '%';
      var label = many ? fmt(U().tripsHere, { n: g.trips.length }) : tripName(t);
      b.setAttribute('aria-label', many ? fmt(U().zoomTo, { t: label }) : fmt(U().openTrip, { t: label }));
      b.appendChild(el('span', 'pin-mark'));
      var lab = el('span', 'pin-label'); lab.appendChild(W.rv(label)); b.appendChild(lab);
      if (g.x > MW * 0.78) b.classList.add('left');
      b.addEventListener('click', function () {
        if (many) { view = around(g.trips); view.name = label; update(); }
        else { sel = t.id; drawPins(); fillCard(); }
      });
      pinLayer.appendChild(b);
    }
  }
  function fillCard() {
    var t = trips.filter(function (x) { return x.id === sel; })[0];
    while (card.firstChild) card.removeChild(card.firstChild);
    card.hidden = !t;
    if (!t) return;
    var info = el('div', 'trip-info');
    info.appendChild(el('span', 'trip-when', when(t)));
    var h = el('h2', 'trip-name'); var r = el('span', 'trip-rune', 'ᚱ'); r.setAttribute('aria-hidden', 'true');
    h.appendChild(r); h.appendChild(W.rv(tripName(t))); info.appendChild(h);
    if (tripPlace(t)) { var pl = el('span', 'trip-place'); pl.appendChild(W.rv(tripPlace(t))); info.appendChild(pl); }
    var ph = P.list(), more = DATA.more || {};
    var set = t.images.map(function (img) { var i = P.indexOf(img); return i >= 0 ? ph[i] : more[img]; }).filter(Boolean);
    var facts = el('p', 'trip-facts');
    facts.appendChild(el('span', '', countText(t.images.length)));
    if (t.finds) facts.appendChild(el('span', '', t.finds === 1 ? U().find1 : fmt(U().findsN, { n: t.finds })));
    info.appendChild(facts);
    if (t.species && t.species.length) info.appendChild(el('p', 'trip-species', t.species.join(' · ') + (t.finds > t.species.length ? ' …' : '')));
    if (t.post) {
      var a = el('a', 'trip-post'); a.href = 'post.html?slug=' + encodeURIComponent(t.post);
      var pr = el('span', 'lr', 'ᚬ'); pr.setAttribute('aria-hidden', 'true'); a.appendChild(pr);
      a.appendChild(W.rv(t.postTitle ? fmt(U().readPostTitle, { t: t.postTitle }) : U().readPost));
      var ar = el('span', 'v-arrow', '→'); ar.setAttribute('aria-hidden', 'true'); a.appendChild(ar);
      info.appendChild(a);
    }
    card.appendChild(info);
    var strip = el('ul', 'trip-photos'); strip.setAttribute('aria-label', tripName(t));
    set.slice(0, 12).forEach(function (p, k) {
      var li = el('li'), b = el('button', 'trip-photo'); b.type = 'button';
      b.setAttribute('aria-label', p.caption || (p.species && p.species[0]) || fmt(U().photoN, { i: k + 1 }));
      var im = el('img'); im.src = p.image; im.alt = ''; im.loading = 'lazy'; im.style.objectPosition = p.pos || '';
      b.appendChild(im);
      b.addEventListener('click', function () { P.openSet(set, k, b); });
      li.appendChild(b); strip.appendChild(li);
    });
    if (set.length) card.appendChild(strip);
  }
  function update() {
    worldBtn.setAttribute('aria-pressed', view.world ? 'true' : 'false');
    worldBtn.classList.toggle('on', view.world);
    regionLabel.hidden = view.world;
    if (!view.world) { while (regionLabel.firstChild) regionLabel.removeChild(regionLabel.firstChild); regionLabel.appendChild(W.rv(view.name || '')); }
    mapBox.classList.add('loading');
    loadLand().then(function () { mapBox.classList.remove('loading'); drawMap(); }).catch(function () { mapBox.classList.remove('loading'); drawPins(); });
  }
  function buildTrips() {
    var pane = panes.trips;
    if (!trips.length) { pane.appendChild(el('p', 'mosaic-empty', U().noTrips)); return; }
    var bar = el('div', 'map-bar');
    worldBtn = el('button', 'pv'); worldBtn.type = 'button'; worldBtn.appendChild(W.rv(U().world));
    worldBtn.addEventListener('click', function () { view = WORLD; update(); });
    regionLabel = el('span', 'map-region');
    bar.appendChild(worldBtn); bar.appendChild(regionLabel);
    pane.appendChild(bar);
    mapBox = el('div', 'tmap');
    svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 ' + MW + ' ' + MH); svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', U().mapLabel);
    pinLayer = el('div', 'pins');
    mapBox.appendChild(svg); mapBox.appendChild(pinLayer);
    pane.appendChild(mapBox);
    card = el('article', 'trip-card');
    pane.appendChild(card);
    update();
    fillCard();
  }
  /* switching language or runes: the words on the map and the card follow */
  W.onRender(function () {
    if (built.trips && trips.length) { worldBtn.innerHTML = ''; worldBtn.appendChild(W.rv(U().world)); drawPins(); fillCard(); }
    if (built.albums) buildAlbums();
  });

  /* ================================================================== start */
  var start = (/^#(albums|trips)\b/.exec(location.hash) || [])[1];
  if (start === 'albums' && (!albumTab || albumTab.hidden)) start = '';
  show(start || 'stream', !start);
})();
