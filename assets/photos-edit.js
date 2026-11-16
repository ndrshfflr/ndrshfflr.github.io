/* ==========================================================================
   Photography — editing on the page itself.
   Fetched by assets/photos.js only when a sign-in is kept on this device (from
   /admin, the Photos page or here), or with photography.html#edit. Visitors
   never load it.

   Edit (bottom right) turns the page into an editor:
   Stream
   - tap a photo to select it; a panel shows its caption, its size in the grid
     (1–3 cells wide and tall), what to keep in frame, its place in the order
     and the albums it's in
   - laptop: drag a photo to move it (a line shows where it lands), drag the
     corner of the selected photo to resize it; phone: the buttons
   - "Take off the page" keeps the photo in the library; "Delete for good" is
     its own, confirmed step and removes it everywhere, right away
   Adding photos (Add photos, in the bar)
   - from this device: shrunk on this device, location and other metadata
     removed unless "Keep metadata" is ticked; sent on Save
   - from the library: photos that aren't on the page (field log only)
   Albums
   - make, rename (English and Danish), reorder and delete albums; open one to
     add photos, order them, pick the cover or take photos out
   Field trips
   - make, edit and delete trips: names, dates, place, the pin (click the map),
     which photos it gathers, extra photos, its blog post
   Gear (✎ Gear, above the views)
   - names and kinds, in their order
   Changes gather until Save: one commit (new photo files + content/gallery.json),
   applied on top of the newest version, so photos added meanwhile are kept.
   Discard undoes. Signing in, saving and deleting come from assets/edit-core.js.
   ========================================================================== */
(function () {
  'use strict';

  var P = window.Photos, E = window.SiteEdit, PM = window.PhotosMore, W0 = window.World || {}, doc = document;
  if (!P || !E || !P.data || !P.data.edit || window.PhotosEdit) return;
  window.PhotosEdit = true;
  E.setup(P.data.edit);

  var mosaic = doc.getElementById('mosaic');
  var FILE = 'content/gallery.json';
  var FIELDS = ['caption', 'weight', 'width', 'height', 'focus', 'onPhotoPage']; // what this editor changes on a photo
  var NOTED = ['taken', 'camera', 'lens', 'lat', 'lon'];                        // noted on a new photo that keeps its metadata
  var WEIGHT = { '1x1': 1, '2x1': 2, '2x2': 3, '3x2': 4, '3x3': 5 };           // the shapes the old sizes 1–5 stand for
  var CELLS = { 1: [1, 1], 2: [2, 1], 3: [2, 2], 4: [3, 2], 5: [3, 3] };
  var FOCUS = [['top', 'Top', '↑'], ['left', 'Left', '←'], ['center', 'Middle', '•'], ['right', 'Right', '→'], ['bottom', 'Bottom', '↓']];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var fine = !!(window.matchMedia && matchMedia('(hover:hover) and (pointer:fine)').matches);

  /* st.work: the photo library as it will be saved; st.albums likewise; the *Saved / base copies: as on the site now.
     st.fresh: photos added from this device, not sent yet (keyed by a temporary address);
     st.preview: sent photos shown from this device until the site has them */
  var st = { on: false, busy: false, work: [], saved: '[]', base: {}, order0: [], off: {}, site: null, note: '', kind: '',
    albums: [], albumsSaved: '[]', savedIds: {}, legacy: false, legacy0: false, fresh: {}, preview: {},
    view: 'stream', sel: null, selAlbum: null, openAlbum: null,
    trips: [], tripsSaved: '[]', selTrip: null, placing: false, fl: null, flLoading: null,
    gear: [], gearSaved: '[]', gearOpen: false };

  /* ------------------------------------------------------------------ small helpers */
  function h(tag, cls, text) {
    var n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null && text !== '') n.textContent = text;
    return n;
  }
  function btn(cls, text, label) {
    var b = h('button', cls, text);
    b.type = 'button';
    if (label) b.setAttribute('aria-label', label);
    return b;
  }
  function key(e) { return st.fresh[e.image] ? e.image : E.same(e.image); }
  function fileName(e) { return st.fresh[e.image] ? st.fresh[e.image].name : String(e.image).replace(/^.*\//, ''); }
  function entry(k) { for (var i = 0; i < st.work.length; i++) if (key(st.work[i]) === k) return st.work[i]; return null; }
  function onPage(e) { return e.onPhotoPage !== false; }
  function disp(k) { return st.fresh[k] ? k : st.preview[k] || k; } // what to show for a photo
  function n2(n, one, many) { return n === 1 ? '1 ' + one : n + ' ' + many; }
  /* the cells a photo spans, as assets/photos.js and src/build.py work it out */
  function cells(e) {
    var f = function (v) { v = parseInt(v, 10); return v >= 1 ? Math.min(3, v) : 0; };
    var c = f(e.width), r = f(e.height);
    if (c || r) return [c || 1, r || 1];
    return CELLS[Math.min(5, Math.max(1, Math.round(Number(e.weight) || 1)))] || [1, 1];
  }
  function setCells(e, c, r) {
    var w = WEIGHT[c + 'x' + r];
    if (w) { e.weight = w; delete e.width; delete e.height; } // one of the five old shapes: keep it as the plain size
    else { e.width = c; e.height = r; }
  }
  /* the photos shown in the stream while editing: those on the page, and those taken off it since the last save (dimmed) */
  function shown() { return st.work.filter(function (e) { return onPage(e) || st.off[key(e)]; }); }

  /* ---------- albums ---------- */
  function album(id) { for (var i = 0; i < st.albums.length; i++) if (st.albums[i].id === id) return st.albums[i]; return null; }
  function albumPhotos(a) { return a.photos.filter(function (k) { return entry(k); }); }
  function coverOf(a) { var ph = albumPhotos(a).filter(function (k) { return onPage(entry(k)); }); return a.cover && ph.indexOf(a.cover) >= 0 ? a.cover : ph[0] || albumPhotos(a)[0] || ''; }
  function inAlbum(a, k) { return a.photos.indexOf(k) >= 0; }
  function uniqueId(name, self) {
    var base = E.slugify(name) || 'album', id = base, i = 2;
    while (st.albums.some(function (a) { return a !== self && a.id === id; })) id = base + '-' + (i++);
    return id;
  }
  var nextNew = 1;
  function newAlbum(name) {
    var a = { id: 'new-' + (nextNew++), name: name || 'New album', nameDa: '', cover: '', photos: [] };
    st.albums.push(a);
    return a;
  }
  function addToAlbum(a, k) { if (!inAlbum(a, k)) a.photos.push(k); }
  function takeFromAlbum(a, k) { a.photos = a.photos.filter(function (x) { return x !== k; }); if (a.cover === k) a.cover = ''; }
  /* the albums as content/gallery.json has them, with old-style album names on photos folded in */
  function readAlbums(d) {
    var list = [], legacy = false;
    E.arr(d.albums).forEach(function (a) {
      var name = String(a && a.name || '').trim();
      if (!name) return;
      var x = { id: String(a.id || '').trim(), name: name, nameDa: String(a.nameDa || '').trim(), cover: a.cover ? E.same(a.cover) : '', photos: [] };
      E.arr(a.photos).forEach(function (p) { p = E.same(p); if (p && x.photos.indexOf(p) < 0) x.photos.push(p); });
      if (!/^[a-z0-9-]+$/.test(x.id) || list.some(function (y) { return y.id === x.id; })) { x.id = ''; legacy = true; }
      list.push(x);
    });
    E.arr(d.images).forEach(function (g) {
      E.arr(g && g.albums).forEach(function (name) {
        name = String(name || '').trim();
        if (!name) return;
        legacy = true;
        var a = list.filter(function (y) { return y.name.toLowerCase() === name.toLowerCase(); })[0];
        if (!a) { a = { id: '', name: name, nameDa: '', cover: '', photos: [] }; list.push(a); }
        if (a.photos.indexOf(E.same(g.image)) < 0) a.photos.push(E.same(g.image));
      });
    });
    st.albums = list;
    list.forEach(function (a) { if (!a.id) a.id = uniqueId(a.name, a); });
    return legacy;
  }

  /* ---------- field trips ---------- */
  var nextTrip = 1;
  function trip(k) { for (var i = 0; i < st.trips.length; i++) if (st.trips[i]._k === k) return st.trips[i]; return null; }
  function copyObj(o) { var c = {}; Object.keys(o).forEach(function (k) { c[k] = Array.isArray(o[k]) ? o[k].slice() : o[k]; }); return c; }
  function readTrips(d) {
    st.trips = E.arr(d.trips).filter(function (t) { return t && typeof t === 'object'; }).map(function (t) {
      var o = copyObj(t);
      if (o.photos) o.photos = E.arr(o.photos).map(E.same);
      o._k = 't' + (nextTrip++);
      return o;
    });
    st.gear = E.arr(d.gear).filter(function (g) { return g && String(g.name || '').trim(); }).map(copyObj);
  }
  function hasPin(t) { return t.lat !== undefined && t.lat !== '' && t.lat !== null && t.lon !== undefined && t.lon !== '' && t.lon !== null && isFinite(+t.lat) && isFinite(+t.lon); }
  function tripLabel(t) { return String(t.name || '').trim() || 'New field trip'; }
  /* the pins the map shows while editing */
  function pins() { return st.trips.filter(hasPin).map(function (t) { return { id: t._k, name: tripLabel(t), nameDa: t.nameDa || '', lat: +t.lat, lon: +t.lon, images: [] }; }); }
  function shortDay(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); return m ? (+m[3]) + ' ' + MONTHS[+m[2] - 1] + ' ' + m[1] : ''; }
  function whenText(t) {
    var a = String(t.from || '').slice(0, 10), b = String(t.to || '').slice(0, 10);
    if (!a) return 'No dates yet';
    return !b || b === a ? shortDay(a) : shortDay(a) + ' – ' + shortDay(b);
  }
  /* the field log, for dating photos and counting finds as src/build.py does */
  function ensureFl() {
    if (st.fl) return Promise.resolve(st.fl);
    if (!st.flLoading) {
      st.flLoading = Promise.all(['content/fieldlog.json', 'content/observations.json'].map(function (u) {
        return fetch(u, { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; });
      })).then(function (r) {
        var fl = r[0] || {}, obs = r[1] || {}, manual = {}, byId = {}, records = [];
        E.arr(obs.items).forEach(function (o) { if (!o) return; if (o.id) byId[o.id] = o; if (o.date) records.push(o); });
        E.arr(fl.manual).forEach(function (m) { if (m && m.id) { manual[m.id] = m; if (m.date) records.push(m); } });
        st.fl = { records: records, sighting: function (sid) { sid = String(sid || ''); return sid.indexOf('manual:') === 0 ? manual[sid.slice(7)] : byId[sid]; } };
        return st.fl;
      });
    }
    return st.flLoading;
  }
  /* when a photo was taken (and where, if its sighting says): its sighting, its kept metadata, or its file name */
  function takenOf(e) {
    var sg = E.arr(e.sightings);
    for (var i = 0; st.fl && i < sg.length; i++) { var s = st.fl.sighting(sg[i]); if (s && s.date) return [String(s.date).slice(0, 10), s.place || '']; }
    var f = st.fresh[key(e)];
    if (f) return [f.meta && f.meta.date || '', ''];
    if (/^\d{4}-\d{2}-\d{2}/.test(e.taken || '')) return [String(e.taken).slice(0, 10), ''];
    var m = /^(\d{4}-\d{2}-\d{2})/.exec(String(e.image).replace(/^.*\//, ''));
    return [m ? m[1] : '', ''];
  }
  /* a trip's photos (added by hand first, then those taken on its dates) and its finds */
  function gather(t) {
    var start = String(t.from || '').slice(0, 10), end = String(t.to || '').slice(0, 10) || start, match = String(t.placeMatch || '').trim().toLowerCase();
    var pics = E.arr(t.photos).filter(function (k) { return entry(k); }), byDate = {};
    if (start && t.gather !== false) st.work.forEach(function (e) {
      var k = key(e), d = takenOf(e);
      if (d[0] && start <= d[0] && d[0] <= end && !(match && d[1] && d[1].toLowerCase().indexOf(match) < 0) && pics.indexOf(k) < 0) { pics.push(k); byDate[k] = true; }
    });
    var finds = !st.fl || !start ? [] : st.fl.records.filter(function (r) {
      var d = String(r.date || '').slice(0, 10);
      return start <= d && d <= end && !(match && String(r.place || '').toLowerCase().indexOf(match) < 0);
    });
    var species = [];
    finds.forEach(function (r) { var n = String(r.name || '').trim(); if (n && species.indexOf(n) < 0) species.push(n); });
    return { photos: pics, byDate: byDate, finds: finds.length, species: species.slice(0, 8), known: !!st.fl };
  }
  /* the trips as the page shows them (src/build.py's shape), for after editing */
  function shownTrips() {
    var more = P.data.more || (P.data.more = {}), titles = P.data.posts || {};
    var out = st.trips.filter(function (t) { return hasPin(t) && String(t.name || '').trim(); }).map(function (t) {
      var g = gather(t), start = String(t.from || '').slice(0, 10);
      var imgs = g.photos.map(function (k) {
        var e = entry(k);
        if (!onPage(e)) more[disp(k)] = { image: disp(k), caption: e.caption || '', pos: E.POS[e.focus] || E.POS.center, post: e.post || '',
          species: (Array.isArray(e.species) ? e.species : e.species ? [e.species] : []).map(String) };
        return disp(k);
      });
      return { id: E.slugify(t.name) || 'trip', name: String(t.name).trim(), nameDa: t.nameDa || '', from: start, to: String(t.to || '').slice(0, 10) || start,
        place: t.place || '', placeDa: t.placeDa || '', lat: +t.lat, lon: +t.lon, images: imgs, finds: g.finds, species: g.species,
        post: t.post || '', postTitle: titles[t.post] || '' };
    });
    out.sort(function (a, b) { return a.from < b.from ? 1 : a.from > b.from ? -1 : 0; });
    return out;
  }
  function tripsSorted() {
    return st.trips.slice().sort(function (a, b) { var x = String(a.from || '9999'), y = String(b.from || '9999'); return x < y ? 1 : x > y ? -1 : 0; });
  }
  function setKey(d, k, v) { // a top-level key of content/gallery.json, put before the photos when it's new
    if (k in d) { d[k] = v; return d; }
    var out = {};
    Object.keys(d).forEach(function (x) { if (x === 'images') out[k] = v; out[x] = d[x]; });
    if (!(k in out)) out[k] = v;
    return out;
  }

  /* ------------------------------------------------------------------ what has changed */
  function snap(e) { var o = {}; FIELDS.forEach(function (f) { if (e[f] !== undefined && e[f] !== '') o[f] = e[f]; }); return JSON.stringify(o); }
  function remember() {
    st.saved = JSON.stringify(st.work);
    st.base = {}; st.off = {};
    st.work.forEach(function (e) { st.base[key(e)] = snap(e); });
    st.order0 = st.work.map(key);
    st.albumsSaved = JSON.stringify(st.albums);
    st.savedIds = {};
    st.albums.forEach(function (a) { st.savedIds[a.id] = true; });
    st.tripsSaved = JSON.stringify(st.trips);
    st.gearSaved = JSON.stringify(st.gear);
  }
  function freshKeys() { return st.work.map(key).filter(function (k) { return st.fresh[k]; }); }
  function changed() { return st.work.filter(function (e) { return !st.fresh[key(e)] && snap(e) !== st.base[key(e)]; }); }
  function reordered() { return st.work.map(key).filter(function (k) { return !st.fresh[k]; }).join('\n') !== st.order0.join('\n'); }
  function albumsChanged() { return st.legacy || JSON.stringify(st.albums) !== st.albumsSaved; }
  function tripsChanged() { return JSON.stringify(st.trips) !== st.tripsSaved; }
  function gearChanged() { return JSON.stringify(st.gear) !== st.gearSaved; }
  function dirty() { return changed().length + (reordered() ? 1 : 0) + (albumsChanged() ? 1 : 0) + freshKeys().length + (tripsChanged() ? 1 : 0) + (gearChanged() ? 1 : 0); }

  /* ------------------------------------------------------------------ the controls */
  var fab = btn('pe-fab', '', 'Edit the photography page');
  fab.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/></svg><span>Edit</span>';

  /* the bar along the bottom */
  var bar = h('div', 'pe-bar');
  bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Editing the photography page');
  bar.hidden = true;
  var status = h('p', 'pe-status'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
  var addB = btn('pe-btn pe-add', '+ Add photos'), discardB = btn('pe-btn', 'Discard'), saveB = btn('pe-btn pe-primary', 'Save'), doneB = btn('pe-btn', 'Done');
  addB.setAttribute('aria-haspopup', 'true'); addB.setAttribute('aria-expanded', 'false');
  var acts = h('div', 'pe-acts');
  [addB, discardB, saveB, doneB].forEach(function (n) { acts.appendChild(n); });
  bar.appendChild(status); bar.appendChild(acts);

  /* Add photos: a small menu above the bar */
  var menu = h('div', 'pe-menu');
  menu.setAttribute('role', 'menu'); menu.hidden = true;
  var mDevice = btn('pe-mi', 'From this device…'), mLib = btn('pe-mi', 'From the library…');
  var mPage = h('a', 'pe-mi', 'Finds and blog posts: the Photos page ↗'); mPage.href = 'upload.html'; mPage.target = '_blank'; mPage.rel = 'noopener';
  [mDevice, mLib, mPage].forEach(function (n) { n.setAttribute('role', 'menuitem'); menu.appendChild(n); });
  var fileIn = h('input', 'pe-file'); fileIn.type = 'file'; fileIn.accept = 'image/*'; fileIn.multiple = true; fileIn.hidden = true; fileIn.setAttribute('aria-hidden', 'true');

  /* the panel for what's selected: a photo, an album, or a photo inside an album */
  var panel = h('aside', 'pe-panel');
  panel.setAttribute('aria-label', 'The selected photo');
  panel.hidden = true;
  var thumb = h('img', 'pe-thumb'); thumb.alt = '';
  var nameP = h('p', 'pe-name'), closeB = btn('pe-x', '×', 'Close this panel');
  var capL = h('label', 'pe-label pe-cap', 'Caption'), cap = h('input', 'pe-input');
  cap.type = 'text'; cap.maxLength = 160; cap.setAttribute('enterkeyhint', 'done'); cap.autocomplete = 'off';
  capL.appendChild(cap);
  var head = h('div', 'pe-head'); head.appendChild(thumb); head.appendChild(capL);

  /* an order row: « ‹ › » */
  function orderRow(label, onMove) {
    var box = h('div', 'pe-group pe-order-box'), row = h('div', 'pe-order');
    box.appendChild(h('p', 'pe-label', label));
    var MOVES = [['first', '«', 'First'], ['earlier', '‹', 'Earlier'], ['later', '›', 'Later'], ['last', '»', 'Last']];
    var btns = MOVES.map(function (m) {
      var b = btn('pe-btn pe-move', '', 'Move ' + (m[0] === 'first' ? 'to the start' : m[0] === 'last' ? 'to the end' : m[0]));
      var a = h('span', 'pe-arrow', m[1]), t = h('span', 'pe-move-t', m[2]); a.setAttribute('aria-hidden', 'true');
      if (m[0] === 'later' || m[0] === 'last') { b.appendChild(t); b.appendChild(a); } else { b.appendChild(a); b.appendChild(t); }
      b.addEventListener('click', function () { onMove(m[0]); if (!b.disabled) b.focus(); });
      row.appendChild(b);
      return { b: b, v: m[0] };
    });
    box.appendChild(row);
    return { box: box, update: function (i, n, off) {
      btns.forEach(function (m) { m.b.disabled = st.busy || off || ((m.v === 'first' || m.v === 'earlier') ? i <= 0 : i >= n - 1); });
    } };
  }

  /* --- a photo in the stream --- */
  var sizeBox = h('div', 'pe-group'), sizeT = h('p', 'pe-label'), sizeGrid = h('div', 'pe-grid');
  sizeGrid.setAttribute('role', 'group'); sizeGrid.setAttribute('aria-label', 'Size in the grid');
  var sizeCells = [];
  for (var rr = 1; rr <= 3; rr++) for (var cc = 1; cc <= 3; cc++) (function (c, r) {
    var b = btn('pe-cell', '', c + ' wide, ' + r + ' tall');
    b.addEventListener('click', function () { change(function (e) { setCells(e, c, r); }); });
    sizeCells.push({ b: b, c: c, r: r }); sizeGrid.appendChild(b);
  })(cc, rr);
  sizeBox.appendChild(sizeT); sizeBox.appendChild(sizeGrid);
  var focusBox = h('div', 'pe-group'), focusGrid = h('div', 'pe-cross');
  focusGrid.setAttribute('role', 'group'); focusGrid.setAttribute('aria-label', 'Keep in frame');
  focusBox.appendChild(h('p', 'pe-label', 'Keep in frame'));
  var focusBtns = FOCUS.map(function (f) {
    var b = btn('pe-cell pe-f-' + f[0], f[2], 'Keep the ' + f[1].toLowerCase() + ' in frame');
    b.addEventListener('click', function () { change(function (e) { if (f[0] === 'center') delete e.focus; else e.focus = f[0]; }); });
    focusGrid.appendChild(b);
    return { b: b, v: f[0] };
  });
  focusBox.appendChild(focusGrid);
  var streamOrder = orderRow(fine ? 'Order (or drag the photo)' : 'Order', function (how) { moveInStream(how); });
  var tools = h('div', 'pe-tools');
  tools.appendChild(sizeBox); tools.appendChild(focusBox); tools.appendChild(streamOrder.box);

  /* its albums: a chip per album, and a new one */
  var albBox = h('div', 'pe-group pe-alb'), albChips = h('div', 'pe-chips');
  albBox.appendChild(h('p', 'pe-label', 'Albums'));
  albBox.appendChild(albChips);
  var newRow = h('div', 'pe-newrow'), newIn = h('input', 'pe-input'), newOk = btn('pe-btn', 'Add');
  newIn.type = 'text'; newIn.maxLength = 60; newIn.placeholder = 'Name of the new album'; newIn.setAttribute('aria-label', 'Name of the new album'); newIn.setAttribute('enterkeyhint', 'done');
  newRow.appendChild(newIn); newRow.appendChild(newOk); newRow.hidden = true;
  albBox.appendChild(newRow);

  /* a new photo, not sent yet: keep its metadata? */
  var freshBox = h('div', 'pe-group pe-fresh');
  var keepL = h('label', 'pe-check'), keepIn = h('input'); keepIn.type = 'checkbox';
  keepL.appendChild(keepIn); keepL.appendChild(doc.createTextNode(' Keep metadata'));
  var keepNote = h('p', 'pe-small');
  freshBox.appendChild(keepL); freshBox.appendChild(keepNote);

  var offB = btn('pe-btn', 'Take off the page'), delB = btn('pe-btn pe-danger-line', 'Delete…'), dropB = btn('pe-btn pe-danger-line', 'Remove (not sent yet)');
  var foot = h('div', 'pe-foot'); foot.appendChild(offB); foot.appendChild(delB); foot.appendChild(dropB);
  var offNote = h('p', 'pe-small');
  var confirmBox = h('div', 'pe-confirm');
  confirmBox.setAttribute('role', 'alertdialog'); confirmBox.setAttribute('aria-label', 'Delete for good?');
  confirmBox.hidden = true;
  var confirmWhat = h('p'), confirmUses = h('ul', 'pe-uses');
  var yesB = btn('pe-btn pe-danger', 'Delete for good'), noB = btn('pe-btn', 'Keep it');
  var confirmRow = h('div', 'pe-foot'); confirmRow.appendChild(yesB); confirmRow.appendChild(noB);
  confirmBox.appendChild(h('p', 'pe-confirm-h', 'Delete for good?'));
  confirmBox.appendChild(confirmWhat); confirmBox.appendChild(confirmUses);
  confirmBox.appendChild(h('p', 'pe-small', 'This can’t be undone from here, and it happens right away (your other changes stay unsaved until you press Save).'));
  confirmBox.appendChild(confirmRow);

  /* --- an album --- */
  var albumBox = h('div', 'pe-album-box');
  var aNameL = h('label', 'pe-label', 'Name'), aName = h('input', 'pe-input');
  var aDaL = h('label', 'pe-label', 'Name in Danish (optional)'), aDa = h('input', 'pe-input');
  [aName, aDa].forEach(function (i) { i.type = 'text'; i.maxLength = 60; i.autocomplete = 'off'; i.setAttribute('enterkeyhint', 'done'); });
  aDa.lang = 'da';
  aNameL.appendChild(aName); aDaL.appendChild(aDa);
  var aCount = h('p', 'pe-small');
  var albumOrder = orderRow(fine ? 'Order (or drag the album)' : 'Order', function (how) { moveAlbum(st.selAlbum, how); });
  var aOpen = btn('pe-btn pe-primary', 'Open the album →'), aDel = btn('pe-btn pe-danger-line', 'Delete album');
  var aFoot = h('div', 'pe-foot'); aFoot.appendChild(aOpen); aFoot.appendChild(aDel);
  albumBox.appendChild(aNameL); albumBox.appendChild(aDaL); albumBox.appendChild(aCount); albumBox.appendChild(albumOrder.box); albumBox.appendChild(aFoot);
  albumBox.appendChild(h('p', 'pe-small', 'Deleting an album keeps its photos.'));

  /* --- a photo inside an album --- */
  var aphotoBox = h('div', 'pe-aphoto-box');
  var coverB = btn('pe-btn', '');
  var aphotoOrder = orderRow(fine ? 'Order in the album (or drag)' : 'Order in the album', function (how) { moveInAlbum(how); });
  var takeB = btn('pe-btn pe-danger-line', 'Take out of the album');
  var apFoot = h('div', 'pe-foot'); apFoot.appendChild(coverB); apFoot.appendChild(takeB);
  var apNote = h('p', 'pe-small');
  aphotoBox.appendChild(aphotoOrder.box); aphotoBox.appendChild(apFoot); aphotoBox.appendChild(apNote);

  /* --- a field trip --- */
  var tripBox = h('div', 'pe-trip-box');
  function field(label, type, parent, cls) {
    var l = h('label', 'pe-label' + (cls ? ' ' + cls : ''), label), i = h('input', 'pe-input');
    i.type = type; i.autocomplete = 'off'; if (type === 'text') { i.maxLength = 140; i.setAttribute('enterkeyhint', 'done'); }
    l.appendChild(i); (parent || tripBox).appendChild(l);
    return i;
  }
  var pair = function () { var d = h('div', 'pe-pair'); tripBox.appendChild(d); return d; };
  var p1 = pair(), tName = field('Name', 'text', p1), tDa = field('Name in Danish (optional)', 'text', p1); tDa.lang = 'da';
  var p2 = pair(), tFrom = field('From', 'date', p2), tTo = field('To (optional)', 'date', p2);
  var p3 = pair(), tPlace = field('Place', 'text', p3), tPlaceDa = field('Place in Danish (optional)', 'text', p3); tPlaceDa.lang = 'da';
  tPlace.placeholder = 'e.g. Söderåsen, Skåne, Sweden';
  var pinBox = h('div', 'pe-group pe-pin'); tripBox.appendChild(pinBox);
  var tPin = field('Pin on the map', 'text', pinBox); tPin.placeholder = 'latitude, longitude (e.g. 56.04, 13.24)'; tPin.inputMode = 'decimal';
  var pinRow = h('div', 'pe-foot'), placeB = btn('pe-btn pe-primary', '⌖ Place it on the map'), fromPhotosB = btn('pe-btn', 'Where the photos were taken');
  pinRow.appendChild(placeB); pinRow.appendChild(fromPhotosB); pinBox.appendChild(pinRow);
  var pinNote = h('p', 'pe-small'); pinBox.appendChild(pinNote);
  var gBox = h('div', 'pe-group pe-gath'); tripBox.appendChild(gBox);
  var gL = h('label', 'pe-check'), tGather = h('input'); tGather.type = 'checkbox';
  gL.appendChild(tGather); gL.appendChild(doc.createTextNode(' Gather the photos taken on these dates')); gBox.appendChild(gL);
  var tMatch = field('Only where the field log place contains (optional)', 'text', gBox); tMatch.placeholder = 'e.g. Markaryd';
  var phBox = h('div', 'pe-group'); tripBox.appendChild(phBox);
  var tFacts = h('p', 'pe-label'), tStrip = h('ul', 'pe-tstrip'), tAdd = btn('pe-btn', '+ Add photos by hand');
  phBox.appendChild(tFacts); phBox.appendChild(tStrip); phBox.appendChild(tAdd);
  var postL = h('label', 'pe-label', 'Blog post (optional)'), tPost = h('select', 'pe-input');
  postL.appendChild(tPost); tripBox.appendChild(postL);
  var tDel = btn('pe-btn pe-danger-line', 'Delete field trip');
  var tFoot = h('div', 'pe-foot'); tFoot.appendChild(tDel); tripBox.appendChild(tFoot);

  /* --- gear --- */
  var gearBox = h('div', 'pe-gear-box'), gRows = h('ul', 'pe-grows'), gAdd = btn('pe-btn', '+ Add a piece');
  gearBox.appendChild(h('p', 'pe-small', 'Shown in this order under the heading, each turning in 3D; the shape follows the kind.'));
  gearBox.appendChild(gRows); gearBox.appendChild(gAdd);
  var KINDS = [['camera', 'Camera (interchangeable lenses)'], ['compact', 'Compact camera (fixed lens)'], ['phone', 'Phone'], ['prime', 'Prime lens'], ['zoom', 'Zoom lens'], ['other', 'Other']];

  var pTitle = h('p', 'pe-ptitle');
  var topRow = h('div', 'pe-top'); topRow.appendChild(pTitle); topRow.appendChild(head); topRow.appendChild(closeB);
  [topRow, nameP, tools, albBox, freshBox, foot, offNote, confirmBox, albumBox, aphotoBox, tripBox, gearBox].forEach(function (n) { panel.appendChild(n); });

  /* placing a pin: a strip above the bar while the map takes the clicks */
  var placebar = h('div', 'pe-placebar'), placeText = h('p', 'pe-small'), worldB = btn('pe-btn', 'World map'), placeDone = btn('pe-btn pe-primary', 'Done');
  placebar.hidden = true;
  placebar.appendChild(placeText); placebar.appendChild(worldB); placebar.appendChild(placeDone);
  /* gear: its button, above the views while editing */
  var gearBtn = btn('pe-btn pe-gear-btn', '✎ Gear');

  /* choosing several photos at once: for an album, or from the library */
  var picker = h('div', 'pe-picker');
  picker.setAttribute('role', 'dialog'); picker.setAttribute('aria-modal', 'true'); picker.hidden = true;
  var pkHead = h('div', 'pe-pk-head'), pkTitle = h('p', 'pe-pk-title'), pkDone = btn('pe-btn pe-primary', 'Done');
  var pkDevice = btn('pe-btn', '+ From this device…'), pkNote = h('p', 'pe-small'), pkGrid = h('ul', 'pe-pk-grid');
  pkHead.appendChild(pkTitle); pkHead.appendChild(pkDone);
  [pkHead, pkNote, pkDevice, pkGrid].forEach(function (n) { picker.appendChild(n); });

  /* signing in, when no sign-in is kept on this device (or it has expired) */
  var signin = h('div', 'pe-signin');
  signin.setAttribute('role', 'dialog'); signin.setAttribute('aria-label', 'Sign in to edit');
  signin.hidden = true;
  var signMsg = h('p', 'pe-small'); signMsg.setAttribute('role', 'status');
  var ghB = btn('pe-btn pe-primary', 'Sign in with GitHub'), signClose = btn('pe-btn', 'Not now');
  var keyBox = h('details', 'pe-key'), keyIn = h('input', 'pe-input'), keyB = btn('pe-btn', 'Use this key');
  keyIn.type = 'password'; keyIn.autocomplete = 'off'; keyIn.spellcheck = false; keyIn.placeholder = 'github_pat_…'; keyIn.setAttribute('aria-label', 'GitHub key');
  keyBox.appendChild(h('summary', null, 'Use a key instead'));
  keyBox.appendChild(h('p', 'pe-small', 'The same key as the iPhone Shortcut. It’s kept on this device only.'));
  keyBox.appendChild(keyIn); keyBox.appendChild(keyB);
  signin.appendChild(h('p', 'pe-signin-h', 'Sign in to edit'));
  signin.appendChild(h('p', 'pe-small', 'Changes go straight into the website’s repository on GitHub, so the page needs to know it’s you.'));
  var signRow = h('div', 'pe-foot'); signRow.appendChild(ghB); signRow.appendChild(signClose);
  signin.appendChild(signRow); signin.appendChild(signMsg); signin.appendChild(keyBox);

  var ui = h('div', 'pe');
  [fab, menu, placebar, bar, panel, picker, signin, fileIn].forEach(function (n) { ui.appendChild(n); });
  doc.body.appendChild(ui);

  /* ------------------------------------------------------------------ drawing */
  function mode() {
    if (st.gearOpen) return 'gear';
    if (st.view === 'trips') return st.selTrip && trip(st.selTrip) && !st.placing ? 'trip' : '';
    if (st.view === 'stream' && st.sel && entry(st.sel)) return 'photo';
    if (st.view === 'albums' && st.openAlbum && st.sel && entry(st.sel) && album(st.openAlbum)) return 'aphoto';
    if (st.view === 'albums' && !st.openAlbum && st.selAlbum && album(st.selAlbum)) return 'album';
    return '';
  }
  function say(text, kind) { st.note = text || ''; st.kind = kind || ''; drawBar(); }
  function hint() {
    if (st.view === 'trips') return 'Tap a pin or a trip to edit it, or make a new one.';
    if (st.view === 'albums' && st.openAlbum) return 'Tap a photo to order it, make it the cover or take it out' + (fine ? ', or drag it.' : '.');
    if (st.view === 'albums') return 'Tap an album to rename or order it, or make a new one.';
    return 'Tap a photo to change it' + (fine ? ', or drag it to a new place.' : '.');
  }
  function drawBar() {
    var n = dirty(), f = freshKeys().length;
    status.className = 'pe-status' + (st.kind ? ' ' + st.kind : '');
    status.textContent = st.note || (n ? (n === 1 ? '1 change' : n + ' changes') + ' not saved yet' + (f ? ' (' + n2(f, 'new photo', 'new photos') + ' to send)' : '') : hint());
    saveB.disabled = discardB.disabled = st.busy || !n;
    doneB.disabled = addB.disabled = st.busy;
    doc.documentElement.style.setProperty('--pe-bar', bar.offsetHeight + 'px');
    doc.body.style.paddingBottom = st.on ? (bar.offsetHeight + (panel.hidden || fine ? 0 : panel.offsetHeight) + (placebar.hidden ? 0 : placebar.offsetHeight) + 24) + 'px' : '';
  }
  function show(n, on) { n.hidden = !on; }
  function drawPanel() {
    var m = mode();
    panel.hidden = !m;
    if (!m) { confirmBox.hidden = true; newRow.hidden = true; doc.body.classList.remove('pe-side'); drawBar(); return; }
    var e = (m === 'photo' || m === 'aphoto') && entry(st.sel), isFresh = e && !!st.fresh[st.sel];
    var TITLES = { album: 'Album', trip: 'Field trip', gear: 'My gear' };
    panel.setAttribute('aria-label', TITLES[m] ? 'The selected ' + TITLES[m].toLowerCase() : 'The selected photo');
    pTitle.textContent = m === 'album' ? '' : TITLES[m] || ''; show(pTitle, m === 'trip' || m === 'gear');
    show(topRow, true); show(head, m === 'photo' || m === 'aphoto'); show(nameP, m === 'photo' || m === 'aphoto');
    show(tripBox, m === 'trip'); show(gearBox, m === 'gear');
    panel.classList.toggle('pe-wide', m === 'trip' || m === 'gear');
    /* on a wide screen the trips make room for the panel, so no trip or pin hides under it */
    var side = fine && window.innerWidth >= 1000 && st.view === 'trips' && (m === 'trip' || m === 'gear');
    if (doc.body.classList.contains('pe-side') !== side) { doc.body.classList.toggle('pe-side', side); }
    show(tools, m === 'photo'); show(albBox, m === 'photo'); show(freshBox, m === 'photo' && isFresh);
    show(foot, m === 'photo'); show(offNote, m === 'photo' && !isFresh && !onPage(e));
    show(albumBox, m === 'album'); show(aphotoBox, m === 'aphoto');
    if (m !== 'photo') confirmBox.hidden = true;
    if (e) {
      if (thumb.getAttribute('src') !== disp(st.sel)) thumb.src = disp(st.sel);
      nameP.textContent = isFresh ? 'New · ' + fileName(e) + ' · sent when you press Save' : fileName(e);
      if (doc.activeElement !== cap) cap.value = e.caption || '';
    }
    if (m === 'photo') {
      var cr = cells(e), list = shown(), i = list.indexOf(e);
      sizeT.textContent = 'Size: ' + cr[0] + ' × ' + cr[1];
      sizeCells.forEach(function (s) {
        s.b.classList.toggle('on', s.c <= cr[0] && s.r <= cr[1]);
        s.b.setAttribute('aria-pressed', s.c === cr[0] && s.r === cr[1] ? 'true' : 'false');
      });
      focusBtns.forEach(function (f) {
        var on = (e.focus || 'center') === f.v;
        f.b.classList.toggle('on', on); f.b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      streamOrder.update(i, list.length, !onPage(e));
      drawChips(e);
      show(offB, !isFresh); show(delB, !isFresh); show(dropB, isFresh);
      offB.textContent = onPage(e) ? 'Take off the page' : 'Put back on the page';
      offNote.textContent = 'Off the photography page once you save. It stays in your library (Add photos → From the library).';
      offB.disabled = delB.disabled = dropB.disabled = st.busy;
      tools.classList.toggle('pe-dim', !onPage(e));
      if (isFresh) drawFresh();
    } else if (m === 'album') {
      var a = album(st.selAlbum), j = st.albums.indexOf(a);
      if (doc.activeElement !== aName) aName.value = a.name;
      if (doc.activeElement !== aDa) aDa.value = a.nameDa;
      var nOn = albumPhotos(a).filter(function (k) { return onPage(entry(k)); }).length;
      aCount.textContent = n2(nOn, 'photo', 'photos') + (albumPhotos(a).length > nOn ? ' (and ' + (albumPhotos(a).length - nOn) + ' off the page, not shown)' : '');
      albumOrder.update(j, st.albums.length, false);
      aOpen.disabled = aDel.disabled = st.busy;
    } else if (m === 'trip') {
      drawTrip();
    } else if (m === 'gear') {
      drawGear();
    } else {
      var al = album(st.openAlbum), ph = albumPhotos(al), k = ph.indexOf(st.sel), isCover = coverOf(al) === st.sel;
      aphotoOrder.update(k, ph.length, false);
      coverB.textContent = isCover ? '★ The cover' : 'Make it the cover';
      coverB.setAttribute('aria-pressed', isCover ? 'true' : 'false');
      coverB.classList.toggle('on', isCover);
      coverB.disabled = st.busy || (isCover && !al.cover);
      apNote.textContent = isCover && !al.cover ? 'The first photo is the cover until you choose one.' : onPage(e) ? '' : 'This photo is off the page, so the album doesn’t show it.';
      apNote.hidden = !apNote.textContent;
      takeB.disabled = st.busy;
    }
    drawBar();
  }
  function drawChips(e) {
    var k = key(e);
    albChips.textContent = '';
    st.albums.forEach(function (a) {
      var on = inAlbum(a, k), b = btn('pe-chip' + (on ? ' on' : ''), (on ? '✓ ' : '') + a.name);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.addEventListener('click', function () {
        if (inAlbum(a, k)) takeFromAlbum(a, k); else addToAlbum(a, k);
        st.note = ''; drawPanel();
        var again = albChips.querySelectorAll('.pe-chip')[st.albums.indexOf(a)]; if (again) again.focus();
      });
      albChips.appendChild(b);
    });
    var nb = btn('pe-chip pe-chip-new', '+ New album');
    nb.addEventListener('click', function () { newRow.hidden = false; newIn.value = ''; newIn.focus(); drawBar(); });
    albChips.appendChild(nb);
    if (!st.albums.length) albChips.insertBefore(h('span', 'pe-small', 'No albums yet. '), nb);
  }
  function drawFresh() {
    var f = st.fresh[st.sel], x = f.meta, m = x && x.meta || {};
    keepIn.checked = !!f.keep;
    keepL.hidden = !(x && x.keep);
    if (!x) { keepNote.textContent = 'Reading the photo…'; return; }
    var t = m.taken ? /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}:\d{2}))?/.exec(m.taken) : null;
    var has = [m.camera, m.lens, t ? 'taken ' + (+t[3]) + ' ' + MONTHS[+t[2] - 1] + ' ' + t[1] + (t[4] ? ' ' + t[4] : '') : '',
      x.gps ? 'at ' + x.gps.lat.toFixed(4) + ', ' + x.gps.lon.toFixed(4) : ''].filter(Boolean).join(' · ');
    keepNote.textContent = x.keep
      ? (has ? has + '. ' : '') + 'If kept, anyone can read all of it from the photo' + (x.gps ? ', the exact spot included' : '') + '. Otherwise it’s removed.'
      : 'No metadata in this photo, so there’s none to keep.';
  }
  function decorate() {
    var list = shown();
    Array.prototype.forEach.call(mosaic.children, function (li, i) {
      var e = list[i], a = li.querySelector('.tile-a');
      if (!e) return;
      var k = key(e);
      li.setAttribute('data-key', k);
      if (a) { a.draggable = false; var im = a.querySelector('img'); if (im) im.draggable = false; }
      if (!onPage(e)) { li.classList.add('pe-off'); li.appendChild(h('span', 'pe-badge', 'Off the page')); }
      else if (st.fresh[k]) li.appendChild(h('span', 'pe-badge pe-new', 'New'));
      if (k === st.sel && st.view === 'stream') {
        li.classList.add('pe-sel');
        if (a) a.setAttribute('aria-current', 'true');
        if (onPage(e) && fine) { var hd = h('span', 'pe-handle'); hd.setAttribute('aria-hidden', 'true'); li.appendChild(hd); }
      }
    });
  }
  /* show the working list on the page */
  function render() {
    P.show(shown().map(function (e) { var c = {}; Object.keys(e).forEach(function (k) { if (k !== 'onPhotoPage') c[k] = e[k]; }); c.image = disp(key(e)); return c; }));
    decorate();
    if (st.view === 'albums' && PM) PM.redraw();
    drawPanel();
  }
  function tileOf(k, root) { return k ? (root || mosaic).querySelector('[data-key="' + String(k).replace(/["\\]/g, '\\$&') + '"]') : null; }
  function select(k, reveal) {
    st.sel = k && entry(k) ? k : null;
    confirmBox.hidden = true; newRow.hidden = true;
    Array.prototype.forEach.call(mosaic.querySelectorAll('.pe-sel'), function (li) {
      li.classList.remove('pe-sel');
      var a = li.querySelector('.tile-a'), hd = li.querySelector('.pe-handle');
      if (a) a.removeAttribute('aria-current');
      if (hd) hd.remove();
    });
    var li = tileOf(st.sel), e = st.sel && entry(st.sel);
    if (li) {
      li.classList.add('pe-sel');
      var a = li.querySelector('.tile-a');
      if (a) a.setAttribute('aria-current', 'true');
      if (e && onPage(e) && fine) { var hd = h('span', 'pe-handle'); hd.setAttribute('aria-hidden', 'true'); li.appendChild(hd); }
    }
    if (st.note && st.kind !== 'err') st.note = '';
    drawPanel();
    if (li && reveal) inView(li);
  }
  /* keep the selected thing clear of the bar and (on the phone) the panel */
  function inView(li) {
    if (!li) return;
    var r = li.getBoundingClientRect();
    var bottom = window.innerHeight - bar.offsetHeight - (fine || panel.hidden ? 0 : panel.offsetHeight) - 10;
    if (r.bottom > bottom) window.scrollBy(0, Math.min(r.bottom - bottom, r.top - 10));
    else if (r.top < 10) window.scrollBy(0, r.top - 10);
  }
  /* one change to the selected photo */
  function change(fn) {
    var e = st.sel && entry(st.sel);
    if (!e || st.busy) return;
    fn(e);
    st.note = '';
    render();
    inView(tileOf(st.sel));
  }

  /* ------------------------------------------------------------------ field trips while editing */
  var tripCard = null;
  var tripHooks = {
    pin: function (id) { selectTrip(id, false); },
    click: function (lat, lon, world) { mapClick(lat, lon, world); },
    card: function (el) { drawTripList(el); }
  };
  function drawTripList(el) {
    tripCard = el;
    el.hidden = false;
    el.className = 'trip-card pe-trips';
    while (el.firstChild) el.removeChild(el.firstChild);
    var top = h('div', 'pe-trips-head');
    top.appendChild(h('p', 'pe-trips-h', n2(st.trips.length, 'field trip', 'field trips')));
    var nb = btn('pe-btn pe-primary', '+ New field trip');
    nb.addEventListener('click', newTrip);
    top.appendChild(nb); el.appendChild(top);
    if (!st.trips.length) el.appendChild(h('p', 'pe-small', 'No field trips yet. Make one, then place its pin on the map.'));
    var ul = h('ul', 'pe-tlist');
    tripsSorted().forEach(function (t) {
      var li = h('li'), b = btn('pe-trow' + (t._k === st.selTrip ? ' on' : ''));
      b.setAttribute('aria-pressed', t._k === st.selTrip ? 'true' : 'false');
      b.setAttribute('data-trip', t._k);
      var g = gather(t);
      b.appendChild(h('span', 'pe-tname', tripLabel(t)));
      b.appendChild(h('span', 'pe-twhen', whenText(t)));
      if (t.place) b.appendChild(h('span', 'pe-tplace', t.place));
      var facts = [n2(g.photos.length, 'photo', 'photos')];
      if (g.known && g.finds) facts.push(n2(g.finds, 'find', 'finds'));
      b.appendChild(h('span', 'pe-tfacts', facts.join(' · ')));
      if (!hasPin(t)) b.appendChild(h('span', 'pe-badge pe-nopin', 'No pin yet'));
      b.addEventListener('click', function () { selectTrip(t._k === st.selTrip ? null : t._k, true); });
      li.appendChild(b); ul.appendChild(li);
    });
    el.appendChild(ul);
  }
  function redrawTrips(keepList) {
    if (!PM || st.view !== 'trips') return;
    PM.setTrips(pins()); // the map again, with its pins (the list comes with it)
    PM.selTrip(st.selTrip);
    if (keepList && tripCard) drawTripList(tripCard);
  }
  function selectTrip(k, focusMap) {
    stopPlacing(true);
    st.selTrip = k && trip(k) ? k : null; st.note = '';
    if (PM) PM.selTrip(st.selTrip);
    if (tripCard) drawTripList(tripCard);
    drawPanel();
    var t = trip(st.selTrip);
    if (focusMap && t && hasPin(t) && PM) PM.zoom(+t.lat, +t.lon, 6);
  }
  function newTrip() {
    if (st.busy) return;
    var t = { name: '', from: today(), place: '', placeDa: '', _k: 't' + (nextTrip++) };
    st.trips.push(t);
    selectTrip(t._k, false);
    say('A new field trip: give it a name, then place its pin on the map.');
    tName.focus();
  }
  function drawTrip() {
    var t = trip(st.selTrip), g = gather(t);
    [[tName, 'name'], [tDa, 'nameDa'], [tFrom, 'from'], [tTo, 'to'], [tPlace, 'place'], [tPlaceDa, 'placeDa'], [tMatch, 'placeMatch']].forEach(function (f) {
      if (doc.activeElement !== f[0]) f[0].value = String(t[f[1]] || '').slice(0, f[0].type === 'date' ? 10 : 200);
    });
    if (doc.activeElement !== tPin) tPin.value = hasPin(t) ? (+t.lat) + ', ' + (+t.lon) : '';
    tGather.checked = t.gather !== false;
    tMatch.parentNode.hidden = t.gather === false;
    var at = photosPosition(t);
    fromPhotosB.hidden = !at;
    pinNote.textContent = hasPin(t) ? '' : 'No pin yet: the trip shows on the map once it has one.';
    pinNote.hidden = !pinNote.textContent;
    var nDate = Object.keys(g.byDate).length, nHand = g.photos.length - nDate;
    tFacts.textContent = n2(g.photos.length, 'photo', 'photos') + (g.photos.length ? ' (' + [nDate ? nDate + ' from the dates' : '', nHand ? nHand + ' added by hand' : ''].filter(Boolean).join(', ') + ')' : '') +
      (g.known ? ' · ' + n2(g.finds, 'find', 'finds') + ' in the field log' : '');
    tStrip.textContent = '';
    g.photos.slice(0, 16).forEach(function (k) {
      var li = h('li'), im = h('img'); im.src = disp(k); im.alt = ''; im.loading = 'lazy';
      li.appendChild(im);
      if (!g.byDate[k]) li.appendChild(h('span', 'pe-badge pe-hand', 'added'));
      tStrip.appendChild(li);
    });
    if (g.photos.length > 16) tStrip.appendChild(h('li', 'pe-more', '+' + (g.photos.length - 16)));
    var titles = P.data.posts || {}, slugs = Object.keys(titles).sort().reverse();
    if (tPost.options.length !== slugs.length + 1) {
      tPost.textContent = '';
      var o0 = h('option', null, 'None'); o0.value = ''; tPost.appendChild(o0);
      slugs.forEach(function (sl) { var o = h('option', null, titles[sl] || sl); o.value = sl; tPost.appendChild(o); });
    }
    tPost.value = t.post && titles[t.post] ? t.post : '';
    tDel.disabled = placeB.disabled = st.busy;
  }
  /* where a trip's photos were taken, if they kept their metadata: the middle of them */
  function photosPosition(t) {
    var pts = [];
    gather(t).photos.forEach(function (k) {
      var e = entry(k), f = st.fresh[k];
      if (f && f.meta && f.meta.gps) pts.push([f.meta.gps.lat, f.meta.gps.lon]);
      else if (e && isFinite(+e.lat) && isFinite(+e.lon) && e.lat !== undefined && e.lat !== '') pts.push([+e.lat, +e.lon]);
    });
    if (!pts.length) return null;
    var la = 0, lo = 0;
    pts.forEach(function (p) { la += p[0]; lo += p[1]; });
    return [Math.round(la / pts.length * 1e4) / 1e4, Math.round(lo / pts.length * 1e4) / 1e4];
  }
  function tripSet(field, value, redraw) {
    var t = trip(st.selTrip);
    if (!t) return;
    if (value === '' || value === null || value === undefined) delete t[field]; else t[field] = value;
    st.note = '';
    if (redraw) { redrawTrips(true); drawPanel(); } else drawBar();
  }
  [[tName, 'name'], [tDa, 'nameDa'], [tPlace, 'place'], [tPlaceDa, 'placeDa'], [tMatch, 'placeMatch']].forEach(function (f) {
    f[0].addEventListener('input', function () { tripSet(f[1], f[0].value.replace(/\s+/g, ' ').replace(/^ /, ''), false); });
    f[0].addEventListener('change', function () { tripSet(f[1], f[0].value.trim(), true); });
    f[0].addEventListener('keydown', function (ev) { if (ev.key === 'Enter') f[0].blur(); });
  });
  [[tFrom, 'from'], [tTo, 'to']].forEach(function (f) {
    f[0].addEventListener('change', function () {
      var t = trip(st.selTrip);
      tripSet(f[1], f[0].value, false);
      if (t && t.from && t.to && t.to < t.from) { if (f[1] === 'from') t.to = t.from; else t.from = t.to; }
      redrawTrips(true); drawPanel();
    });
  });
  tGather.addEventListener('change', function () { tripSet('gather', tGather.checked ? '' : false, true); });
  tPost.addEventListener('change', function () { tripSet('post', tPost.value, true); });
  tPin.addEventListener('change', function () {
    var t = trip(st.selTrip), v = tPin.value.trim();
    if (!t) return;
    if (!v) { delete t.lat; delete t.lon; redrawTrips(true); drawPanel(); return; }
    var m = /^\s*(-?\d+(?:[.,]\d+)?)\s*°?\s*([NS])?\s*[,; ]\s*(-?\d+(?:[.,]\d+)?)\s*°?\s*([EW])?\s*$/i.exec(v.replace(/(\d),(\d)(?=.*[,;]\s)/, '$1.$2'));
    var lat = m && parseFloat(m[1].replace(',', '.')), lon = m && parseFloat(m[3].replace(',', '.'));
    if (m && /s/i.test(m[2] || '')) lat = -Math.abs(lat);
    if (m && /w/i.test(m[4] || '')) lon = -Math.abs(lon);
    if (!m || !(Math.abs(lat) <= 90) || !(Math.abs(lon) <= 180)) { say('That pin isn’t a position. Write it as latitude, longitude, e.g. 56.04, 13.24.', 'err'); tPin.value = hasPin(t) ? t.lat + ', ' + t.lon : ''; return; }
    t.lat = Math.round(lat * 1e4) / 1e4; t.lon = Math.round(lon * 1e4) / 1e4;
    st.note = ''; redrawTrips(true); drawPanel();
    if (PM) PM.zoom(t.lat, t.lon, 6);
  });
  tPin.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') tPin.blur(); });
  fromPhotosB.addEventListener('click', function () {
    var t = trip(st.selTrip), at = t && photosPosition(t);
    if (!at) return;
    t.lat = at[0]; t.lon = at[1];
    st.note = ''; redrawTrips(true); drawPanel();
    if (PM) PM.zoom(t.lat, t.lon, 6);
    say('Pinned where the photos were taken (' + t.lat + ', ' + t.lon + ').');
  });
  /* placing the pin: the panel steps aside, the map takes the clicks */
  function startPlacing() {
    var t = trip(st.selTrip);
    if (!t) return;
    st.placing = true;
    doc.body.classList.add('pe-placing');
    placebar.hidden = false;
    placeText.textContent = 'Click the map where “' + tripLabel(t) + '” was.' + (hasPin(t) ? '' : ' On the world map, the first click zooms in.');
    if (hasPin(t) && PM) PM.zoom(+t.lat, +t.lon, 6);
    drawPanel();
    var map = doc.querySelector('#pane-trips .tmap');
    if (map) map.scrollIntoView({ block: 'center', behavior: W0.reduced ? 'auto' : 'smooth' });
  }
  function stopPlacing(quiet) {
    if (!st.placing) return;
    st.placing = false;
    doc.body.classList.remove('pe-placing');
    placebar.hidden = true;
    if (!quiet) drawPanel();
  }
  function mapClick(lat, lon, world) {
    var t = trip(st.selTrip);
    if (!st.placing || !t) return;
    if (world) { PM.zoom(lat, lon, 8); placeText.textContent = 'Zoomed in. Now click the spot (click again to move it).'; return; }
    t.lat = Math.round(lat * 1e4) / 1e4; t.lon = Math.round(lon * 1e4) / 1e4;
    st.note = '';
    redrawTrips(true);
    placeText.textContent = 'Pinned at ' + t.lat + ', ' + t.lon + '. Click again to move it, or Done.';
    drawBar();
  }
  placeB.addEventListener('click', startPlacing);
  placeDone.addEventListener('click', function () { stopPlacing(false); placeB.focus(); });
  worldB.addEventListener('click', function () { if (PM) PM.world(); placeText.textContent = 'The world map: the first click zooms in.'; });
  tAdd.addEventListener('click', function () {
    var t = trip(st.selTrip);
    if (!t) return;
    var g = gather(t);
    openPicker({
      title: 'Photos of “' + tripLabel(t) + '”',
      note: '',
      empty: 'No photos in the library yet.',
      items: function () { return st.work.map(key); },
      on: function (k) { return E.arr(t.photos).indexOf(k) >= 0; },
      badge: function (k) { return g.byDate[k] ? 'from the dates' : ''; },
      toggle: function (k) { var ph = E.arr(t.photos); t.photos = ph.indexOf(k) >= 0 ? ph.filter(function (x) { return x !== k; }) : ph.concat([k]); if (!t.photos.length) delete t.photos; },
      count: function () { return n2(E.arr(t.photos).length, 'photo', 'photos') + ' added by hand. Photos marked “from the dates” are in the trip anyway' + (t.gather === false ? ' (gathering is off now)' : '') + '.'; },
      done: function () { redrawTrips(true); }
    });
  });
  tDel.addEventListener('click', function () {
    var t = trip(st.selTrip);
    if (!t || st.busy) return;
    st.trips.splice(st.trips.indexOf(t), 1);
    st.selTrip = null;
    redrawTrips(true); drawPanel();
    say('Field trip “' + tripLabel(t) + '” deleted. Discard brings it back.');
  });

  /* ------------------------------------------------------------------ gear while editing */
  var gearTimer = null;
  function gearLive() { clearTimeout(gearTimer); gearTimer = setTimeout(function () { if (PM) PM.setGear(st.gear); }, 250); }
  function drawGear() {
    gRows.textContent = '';
    st.gear.forEach(function (g, i) {
      var li = h('li', 'pe-grow'), name = h('input', 'pe-input'), kind = h('select', 'pe-input');
      name.type = 'text'; name.maxLength = 60; name.value = g.name || ''; name.setAttribute('aria-label', 'Name of piece ' + (i + 1)); name.setAttribute('enterkeyhint', 'done');
      KINDS.forEach(function (k) { var o = h('option', null, k[1]); o.value = k[0]; kind.appendChild(o); });
      kind.value = KINDS.some(function (k) { return k[0] === g.kind; }) ? g.kind : 'other'; kind.setAttribute('aria-label', 'Kind of ' + (g.name || 'piece ' + (i + 1)));
      name.addEventListener('input', function () { g.name = name.value.replace(/\s+/g, ' ').replace(/^ /, ''); st.note = ''; drawBar(); gearLive(); });
      name.addEventListener('change', function () { g.name = name.value.trim(); drawBar(); gearLive(); });
      kind.addEventListener('change', function () { g.kind = kind.value; st.note = ''; drawBar(); gearLive(); });
      var up = btn('pe-btn pe-mini', '↑', 'Move ' + (g.name || 'it') + ' up'), down = btn('pe-btn pe-mini', '↓', 'Move ' + (g.name || 'it') + ' down'), x = btn('pe-btn pe-mini pe-danger-line', '×', 'Remove ' + (g.name || 'it'));
      up.disabled = i === 0; down.disabled = i === st.gear.length - 1;
      up.addEventListener('click', function () { st.gear.splice(i - 1, 0, st.gear.splice(i, 1)[0]); drawPanel(); gearLive(); var b = gRows.children[i - 1]; if (b) b.querySelector('.pe-mini').focus(); });
      down.addEventListener('click', function () { st.gear.splice(i + 1, 0, st.gear.splice(i, 1)[0]); drawPanel(); gearLive(); var b = gRows.children[i + 1]; if (b) b.querySelectorAll('.pe-mini')[1].focus(); });
      x.addEventListener('click', function () { st.gear.splice(i, 1); drawPanel(); gearLive(); });
      var row = h('div', 'pe-grow-b'); row.appendChild(up); row.appendChild(down); row.appendChild(x);
      li.appendChild(name); li.appendChild(kind); li.appendChild(row);
      gRows.appendChild(li);
    });
    if (!st.gear.length) gRows.appendChild(h('li', 'pe-small', 'No gear yet; the section is hidden until you add a piece.'));
  }
  gAdd.addEventListener('click', function () {
    st.gear.push({ name: '', kind: 'camera' });
    drawPanel();
    var last = gRows.lastElementChild; if (last) last.querySelector('input').focus();
  });
  gearBtn.addEventListener('click', function () {
    if (!st.on) return;
    st.gearOpen = !st.gearOpen;
    if (st.gearOpen) stopPlacing(true);
    gearBtn.setAttribute('aria-pressed', st.gearOpen ? 'true' : 'false');
    drawPanel();
  });

  /* ------------------------------------------------------------------ the albums pane while editing */
  var paneEl = null;
  function drawAlbums(pane) {
    paneEl = pane;
    while (pane.firstChild) pane.removeChild(pane.firstChild);
    if (st.openAlbum && !album(st.openAlbum)) st.openAlbum = null;
    if (st.openAlbum) return drawAlbum(pane, album(st.openAlbum));
    var ul = h('ul', 'pe-albums');
    ul.setAttribute('aria-label', 'Albums');
    st.albums.forEach(function (a) {
      var li = h('li', 'pe-acard' + (a.id === st.selAlbum ? ' pe-sel' : '')); li.setAttribute('data-key', a.id);
      var b = btn('pe-acard-b');
      b.setAttribute('aria-pressed', a.id === st.selAlbum ? 'true' : 'false');
      var fr = h('span', 'pe-acover'), c = coverOf(a);
      if (c) { var im = h('img'); im.src = disp(c); im.alt = ''; im.loading = 'lazy'; im.draggable = false; var ce = entry(c); if (ce && ce.focus) im.className = 'pe-pos-' + ce.focus; fr.appendChild(im); }
      else fr.appendChild(h('span', 'pe-aempty', 'No photos yet'));
      b.appendChild(fr);
      b.appendChild(h('span', 'pe-aname', a.name));
      if (a.nameDa) b.appendChild(h('span', 'pe-ada', a.nameDa));
      b.appendChild(h('span', 'pe-an', n2(albumPhotos(a).filter(function (k) { return onPage(entry(k)); }).length, 'photo', 'photos')));
      if (!st.savedIds[a.id]) b.appendChild(h('span', 'pe-badge pe-new', 'New'));
      b.addEventListener('click', function () {
        if (skipClick) { skipClick = false; return; }
        st.selAlbum = st.selAlbum === a.id ? null : a.id; st.note = '';
        drawAlbums(pane); drawPanel(); inView(tileOf(a.id, pane));
      });
      b.addEventListener('dblclick', function () { openAlbumView(a.id); });
      li.appendChild(b); ul.appendChild(li);
    });
    var nl = h('li', 'pe-acard pe-acard-new'), nb = btn('pe-acard-b', '');
    nb.appendChild(h('span', 'pe-acover pe-aplus', '+'));
    nb.appendChild(h('span', 'pe-aname', 'New album'));
    nb.addEventListener('click', function () {
      if (st.busy) return;
      var a = newAlbum();
      st.selAlbum = a.id; st.note = '';
      drawAlbums(pane); drawPanel();
      aName.focus(); aName.select();
    });
    nl.appendChild(nb); ul.appendChild(nl);
    pane.appendChild(ul);
    if (!st.albums.length) pane.appendChild(h('p', 'pe-small pe-pane-note', 'No albums yet. Make one here, or from a photo in the stream (its panel has “+ New album”).'));
    sortable(ul, function (from, to, before) {
      var a = album(from), t = album(to);
      if (!a || !t) return;
      st.albums.splice(st.albums.indexOf(a), 1);
      st.albums.splice(st.albums.indexOf(t) + (before ? 0 : 1), 0, a);
      st.selAlbum = from; st.note = '';
      drawAlbums(pane); drawPanel();
    });
  }
  function drawAlbum(pane, a) {
    var head0 = h('div', 'album-head pe-ahead');
    var back = btn('pv album-back', '‹ All albums');
    back.addEventListener('click', function () { st.openAlbum = null; st.sel = null; st.selAlbum = a.id; drawAlbums(pane); drawPanel(); });
    var title = h('h2', 'album-title', a.name);
    var ph = albumPhotos(a);
    var add = btn('pe-btn pe-primary', '+ Add photos');
    add.addEventListener('click', function () { pickForAlbum(a); });
    head0.appendChild(back); head0.appendChild(title); head0.appendChild(h('span', 'album-n', n2(ph.length, 'photo', 'photos'))); head0.appendChild(add);
    pane.appendChild(head0);
    if (!ph.length) { pane.appendChild(h('p', 'pe-small pe-pane-note', 'No photos in this album yet. “+ Add photos” chooses them from the stream or this device.')); return; }
    var ul = h('ul', 'pe-agrid');
    ul.setAttribute('aria-label', 'Photos in ' + a.name);
    var cov = coverOf(a);
    ph.forEach(function (k) {
      var e = entry(k), li = h('li', 'pe-aph' + (k === st.sel ? ' pe-sel' : '') + (onPage(e) ? '' : ' pe-off'));
      li.setAttribute('data-key', k);
      var b = btn('pe-aph-b', '', e.caption || fileName(e));
      b.setAttribute('aria-pressed', k === st.sel ? 'true' : 'false');
      var im = h('img'); im.src = disp(k); im.alt = ''; im.loading = 'lazy'; im.draggable = false; if (e.focus) im.className = 'pe-pos-' + e.focus;
      b.appendChild(im);
      if (k === cov) b.appendChild(h('span', 'pe-badge pe-cover', '★ Cover'));
      else if (!onPage(e)) b.appendChild(h('span', 'pe-badge', 'Off the page'));
      if (st.fresh[k]) b.appendChild(h('span', 'pe-badge pe-new pe-badge-r', 'New'));
      b.addEventListener('click', function () {
        if (skipClick) { skipClick = false; return; }
        st.sel = st.sel === k ? null : k; st.note = '';
        drawAlbums(pane); drawPanel(); inView(tileOf(k, pane));
      });
      li.appendChild(b); ul.appendChild(li);
    });
    pane.appendChild(ul);
    sortable(ul, function (from, to, before) {
      a.photos = a.photos.filter(function (x) { return x !== from; });
      a.photos.splice(a.photos.indexOf(to) + (before ? 0 : 1), 0, from);
      st.sel = from; st.note = '';
      drawAlbums(pane); drawPanel();
    });
  }
  function openAlbumView(id) {
    st.openAlbum = id; st.sel = null; st.selAlbum = null; st.note = '';
    if (paneEl) drawAlbums(paneEl);
    drawPanel();
    window.scrollTo({ top: Math.max(0, (paneEl ? paneEl.getBoundingClientRect().top + window.pageYOffset : 0) - 90) });
  }
  function redrawAlbums() { if (st.view === 'albums' && paneEl) drawAlbums(paneEl); }

  /* ------------------------------------------------------------------ the order */
  function place(k, targetK, before) {
    var e = entry(k);
    if (!e || k === targetK || !entry(targetK)) return;
    st.work.splice(st.work.indexOf(e), 1);
    var at = st.work.indexOf(entry(targetK));
    st.work.splice(before ? at : at + 1, 0, e);
    st.note = '';
    st.sel = k;
    render();
    inView(tileOf(k));
  }
  function target(list, i, how) { return how === 'first' ? 0 : how === 'last' ? list.length - 1 : how === 'earlier' ? i - 1 : i + 1; }
  function moveInStream(how) {
    var e = st.sel && entry(st.sel), list = shown(), i = list.indexOf(e);
    if (!e || i < 0) return;
    var t = list[target(list, i, how)];
    if (t && t !== e) place(st.sel, key(t), how === 'first' || how === 'earlier');
  }
  function moveAlbum(id, how) {
    var a = album(id), i = st.albums.indexOf(a);
    if (!a) return;
    var t = Math.max(0, Math.min(st.albums.length - 1, target(st.albums, i, how)));
    st.albums.splice(i, 1); st.albums.splice(t, 0, a);
    st.note = ''; redrawAlbums(); drawPanel(); inView(tileOf(id, paneEl));
  }
  function moveInAlbum(how) {
    var a = album(st.openAlbum), ph = a && albumPhotos(a), i = ph ? ph.indexOf(st.sel) : -1;
    if (i < 0) return;
    var t = ph[Math.max(0, Math.min(ph.length - 1, target(ph, i, how)))];
    if (t === st.sel) return;
    a.photos = a.photos.filter(function (x) { return x !== st.sel; });
    var at = a.photos.indexOf(t);
    a.photos.splice(how === 'first' || how === 'earlier' ? at : at + 1, 0, st.sel);
    st.note = ''; redrawAlbums(); drawPanel(); inView(tileOf(st.sel, paneEl));
  }

  /* tapping a photo in the stream selects it (it doesn't open the viewer while editing) */
  var skipClick = false;
  mosaic.addEventListener('click', function (ev) {
    if (!st.on) return;
    ev.preventDefault(); ev.stopPropagation();
    if (skipClick) { skipClick = false; return; }
    var li = ev.target.closest && ev.target.closest('.tile');
    if (!li || st.busy) return;
    var k = li.getAttribute('data-key');
    select(k === st.sel ? null : k, true);
  }, true);
  mosaic.addEventListener('dragstart', function (ev) { if (st.on) ev.preventDefault(); });

  /* laptop: drag to a new place (the stream, the albums, the photos in an album),
     and drag the corner of the selected photo in the stream to resize it */
  var drag = null;
  function metrics() {
    var cs = getComputedStyle(mosaic);
    var cols = parseInt(cs.getPropertyValue('--cols'), 10) || 8, gap = parseFloat(cs.columnGap) || 0;
    return { cols: cols, gap: gap, cell: (mosaic.clientWidth - (cols - 1) * gap) / cols };
  }
  function clearMarks() {
    Array.prototype.forEach.call(doc.querySelectorAll('.pe-before,.pe-after'), function (n) { n.classList.remove('pe-before', 'pe-after'); });
  }
  function sortable(container, onDrop) {
    container.addEventListener('pointerdown', function (ev) {
      if (!st.on || st.busy || ev.button || (ev.pointerType !== 'mouse' && ev.pointerType !== 'pen')) return;
      var li = ev.target.closest && ev.target.closest('[data-key]');
      if (!li || li.parentNode !== container) return;
      drag = { kind: 'wait', li: li, box: container, onDrop: onDrop, x: ev.clientX, y: ev.clientY, id: ev.pointerId };
    });
    container.addEventListener('dragstart', function (ev) { if (st.on) ev.preventDefault(); });
  }
  mosaic.addEventListener('pointerdown', function (ev) {
    if (!st.on || st.busy || ev.button || st.view !== 'stream') return;
    var li = ev.target.closest && ev.target.closest('.tile');
    if (!li) return;
    if (ev.target.classList.contains('pe-handle')) {
      var e = entry(li.getAttribute('data-key')), m = metrics(), box = li.getBoundingClientRect();
      if (!e) return;
      ev.preventDefault();
      drag = { kind: 'size', li: li, e: e, m: m, x: ev.clientX, y: ev.clientY, w: box.width, h: box.height, cr: cells(e), id: ev.pointerId };
      li.classList.add('pe-sizing');
      drag.tag = h('span', 'pe-badge pe-size-tag', drag.cr[0] + ' × ' + drag.cr[1]);
      li.appendChild(drag.tag);
      return;
    }
    if (ev.pointerType !== 'mouse' && ev.pointerType !== 'pen') return; // touch scrolls the page; the phone uses the buttons
    drag = { kind: 'wait', li: li, box: mosaic, onDrop: place, x: ev.clientX, y: ev.clientY, id: ev.pointerId };
  });
  window.addEventListener('pointermove', function (ev) {
    if (!drag || ev.pointerId !== drag.id) return;
    if (drag.kind === 'size') {
      var m = drag.m;
      var c = Math.max(1, Math.min(3, m.cols, Math.round((drag.w + (ev.clientX - drag.x) + m.gap) / (m.cell + m.gap))));
      var r = Math.max(1, Math.min(3, Math.round((drag.h + (ev.clientY - drag.y) + m.gap) / (m.cell + m.gap))));
      if (c !== drag.cr[0] || r !== drag.cr[1]) {
        drag.cr = [c, r];
        drag.li.style.setProperty('--c', c); drag.li.style.setProperty('--r', r);
        drag.tag.textContent = c + ' × ' + r;
      }
      return;
    }
    if (drag.kind === 'wait') {
      if (Math.abs(ev.clientX - drag.x) + Math.abs(ev.clientY - drag.y) < 8) return;
      drag.kind = 'move';
      drag.li.classList.add('pe-dragging');
      doc.body.classList.add('pe-moving');
      var im = drag.li.querySelector('img');
      drag.ghost = h('div', 'pe-ghost');
      if (im) { var g = h('img'); g.src = im.currentSrc || im.src; g.alt = ''; drag.ghost.appendChild(g); }
      ui.appendChild(drag.ghost);
      var tick = function () {
        if (!drag || drag.kind !== 'move') return;
        if (drag.cy < 90) window.scrollBy(0, -16);
        else if (drag.cy > window.innerHeight - bar.offsetHeight - 70) window.scrollBy(0, 16);
        aim();
        drag.raf = requestAnimationFrame(tick);
      };
      drag.cx = ev.clientX; drag.cy = ev.clientY;
      drag.raf = requestAnimationFrame(tick);
    }
    drag.cx = ev.clientX; drag.cy = ev.clientY;
    drag.ghost.style.transform = 'translate(' + (ev.clientX + 14) + 'px,' + (ev.clientY + 14) + 'px)';
    ev.preventDefault();
  });
  /* which item the dragged one would land next to, and on which side */
  function aim() {
    var under = doc.elementFromPoint(drag.cx, drag.cy);
    var li = under && under.closest ? under.closest('[data-key]') : null;
    clearMarks();
    drag.target = null;
    if (!li || li === drag.li || li.parentNode !== drag.box) return;
    var r = li.getBoundingClientRect();
    drag.before = drag.cx < r.left + r.width / 2;
    drag.target = li;
    li.classList.add(drag.before ? 'pe-before' : 'pe-after');
  }
  function endDrag(ev, cancel) {
    if (!drag || (ev && ev.pointerId !== undefined && ev.pointerId !== drag.id)) return;
    var d = drag;
    drag = null;
    if (d.kind === 'size') {
      d.li.classList.remove('pe-sizing');
      var was = cells(d.e);
      if (!cancel && (was[0] !== d.cr[0] || was[1] !== d.cr[1])) { st.sel = key(d.e); setCells(d.e, d.cr[0], d.cr[1]); st.note = ''; }
      skipClick = true; setTimeout(function () { skipClick = false; }, 0);
      render();
      return;
    }
    if (d.kind !== 'move') return;
    cancelAnimationFrame(d.raf);
    d.li.classList.remove('pe-dragging');
    doc.body.classList.remove('pe-moving');
    if (d.ghost) d.ghost.remove();
    clearMarks();
    skipClick = true; setTimeout(function () { skipClick = false; }, 0);
    if (!cancel && d.target) d.onDrop(d.li.getAttribute('data-key'), d.target.getAttribute('data-key'), d.before);
  }
  window.addEventListener('pointerup', function (ev) { endDrag(ev, false); });
  window.addEventListener('pointercancel', function (ev) { endDrag(ev, true); });
  window.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Escape' || !st.on) return;
    if (drag) endDrag(null, true);
    else if (st.placing) stopPlacing(false);
    else if (!picker.hidden) closePicker();
    else if (st.gearOpen) { st.gearOpen = false; gearBtn.setAttribute('aria-pressed', 'false'); drawPanel(); }
    else if (st.view === 'trips' && st.selTrip) selectTrip(null);
    else if (!menu.hidden) setMenu(false);
    else if (!confirmBox.hidden) confirmBox.hidden = true;
    else if (st.sel || st.selAlbum) { st.selAlbum = null; select(null); redrawAlbums(); }
  });

  /* ------------------------------------------------------------------ the panel's buttons */
  cap.addEventListener('input', function () {
    var e = st.sel && entry(st.sel);
    if (!e) return;
    e.caption = cap.value.replace(/\s+/g, ' ').replace(/^ /, '');
    st.note = '';
    drawBar();
  });
  cap.addEventListener('change', function () {
    var e = st.sel && entry(st.sel);
    if (e) { e.caption = String(e.caption || '').trim(); if (st.view === 'stream') render(); else { redrawAlbums(); drawPanel(); } }
  });
  cap.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') cap.blur(); });
  closeB.addEventListener('click', function () {
    if (st.gearOpen) { st.gearOpen = false; gearBtn.setAttribute('aria-pressed', 'false'); drawPanel(); return; }
    if (st.view === 'trips') { selectTrip(null); return; }
    st.selAlbum = null; select(null); redrawAlbums();
  });
  offB.addEventListener('click', function () {
    change(function (e) {
      if (onPage(e)) { e.onPhotoPage = false; st.off[key(e)] = true; }
      else delete e.onPhotoPage;
    });
    offB.focus();
  });
  /* a new album, from a photo's panel */
  function makeFromPanel() {
    var name = newIn.value.replace(/\s+/g, ' ').trim();
    if (!name) { newIn.focus(); return; }
    var a = newAlbum(name);
    if (st.sel) addToAlbum(a, st.sel);
    newRow.hidden = true; st.note = '';
    drawPanel();
  }
  newOk.addEventListener('click', makeFromPanel);
  newIn.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); makeFromPanel(); } });
  /* a new photo: keep its metadata, or take it out again */
  keepIn.addEventListener('change', function () { var f = st.fresh[st.sel]; if (f) f.keep = keepIn.checked; drawBar(); });
  dropB.addEventListener('click', function () {
    var k = st.sel;
    if (!st.fresh[k]) return;
    dropFresh(k);
    st.sel = null; render();
    say('Removed; nothing was sent.');
  });
  /* the album's own panel */
  aName.addEventListener('input', function () { var a = album(st.selAlbum); if (a) { a.name = aName.value.replace(/\s+/g, ' ').replace(/^ /, ''); st.note = ''; drawBar(); } });
  aDa.addEventListener('input', function () { var a = album(st.selAlbum); if (a) { a.nameDa = aDa.value.replace(/\s+/g, ' ').replace(/^ /, ''); st.note = ''; drawBar(); } });
  [aName, aDa].forEach(function (i) {
    i.addEventListener('change', function () {
      var a = album(st.selAlbum);
      if (!a) return;
      a.name = aName.value.trim() || a.name.trim() || 'Untitled album';
      a.nameDa = aDa.value.trim();
      redrawAlbums(); drawPanel();
    });
    i.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') i.blur(); });
  });
  aOpen.addEventListener('click', function () { if (st.selAlbum) openAlbumView(st.selAlbum); });
  aDel.addEventListener('click', function () {
    var a = album(st.selAlbum);
    if (!a || st.busy) return;
    st.albums.splice(st.albums.indexOf(a), 1);
    st.selAlbum = null;
    redrawAlbums(); drawPanel();
    say('Album “' + a.name + '” deleted (its photos stay). Discard brings it back.');
  });
  /* a photo inside an album */
  coverB.addEventListener('click', function () {
    var a = album(st.openAlbum);
    if (!a || !st.sel) return;
    a.cover = coverOf(a) === st.sel && a.cover ? '' : st.sel;
    st.note = ''; redrawAlbums(); drawPanel(); coverB.focus();
  });
  takeB.addEventListener('click', function () {
    var a = album(st.openAlbum);
    if (!a || !st.sel) return;
    takeFromAlbum(a, st.sel);
    st.sel = null; st.note = '';
    redrawAlbums(); drawPanel();
    say('Taken out of “' + a.name + '” (still on the page).');
  });

  /* delete for good: its own step, confirmed, and done right away */
  delB.addEventListener('click', function () {
    var e = st.sel && entry(st.sel);
    if (!e || st.busy || st.fresh[st.sel]) return;
    var k = st.sel;
    confirmBox.hidden = false;
    confirmUses.textContent = '';
    confirmWhat.textContent = 'Looking up where this photo is used…';
    yesB.disabled = true;
    noB.focus();
    (st.site ? Promise.resolve(st.site) : E.loadSite()).then(function (site) {
      st.site = site;
      if (st.sel !== k || confirmBox.hidden) return;
      var uses = E.usesOf(k, site);
      st.albums.forEach(function (a) { if (inAlbum(a, k)) uses.push('Album: ' + a.name); });
      confirmWhat.textContent = 'The photo is deleted from the website' + (uses.length ? ' and taken out of:' : '. It isn’t used anywhere else.');
      uses.forEach(function (u) { confirmUses.appendChild(h('li', null, u)); });
      yesB.disabled = false;
    }).catch(function (err) {
      confirmWhat.textContent = E.explain(err).replace('Nothing was saved', 'Nothing was deleted');
    });
  });
  noB.addEventListener('click', function () { confirmBox.hidden = true; delB.focus(); });
  yesB.addEventListener('click', function () {
    var k = st.sel, e = k && entry(k);
    if (!e || st.busy || !st.site) return;
    st.busy = true; yesB.disabled = true;
    say('Deleting…');
    E.commit('Photos: delete ' + fileName(e), E.deletePlan([k], st.site)).then(function () {
      st.work = st.work.filter(function (x) { return key(x) !== k; });
      st.saved = JSON.stringify(JSON.parse(st.saved).filter(function (x) { return E.same(x.image) !== k; }));
      st.order0 = st.order0.filter(function (x) { return x !== k; });
      delete st.base[k]; delete st.off[k];
      st.albums.forEach(function (a) { takeFromAlbum(a, k); });
      var sa = JSON.parse(st.albumsSaved);
      sa.forEach(function (a) { a.photos = a.photos.filter(function (x) { return x !== k; }); if (a.cover === k) a.cover = ''; });
      st.albumsSaved = JSON.stringify(sa);
      var strip = function (list) { list.forEach(function (t) { if (t.photos) { t.photos = t.photos.filter(function (x) { return x !== k; }); if (!t.photos.length) delete t.photos; } }); return list; };
      strip(st.trips);
      st.tripsSaved = JSON.stringify(strip(JSON.parse(st.tripsSaved)));
      st.sel = null; st.site = null; st.busy = false;
      render();
      say('Deleted ✓ It’s off the site in a minute or two.', 'ok');
    }).catch(function (err) {
      st.busy = false;
      confirmBox.hidden = true;
      drawPanel();
      say(E.explain(err).replace('Nothing was saved', 'Nothing was deleted'), 'err');
    });
  });

  /* ------------------------------------------------------------------ adding photos */
  function setMenu(open) {
    menu.hidden = !open;
    addB.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      var r = addB.getBoundingClientRect();
      menu.style.left = Math.max(8, Math.min(window.innerWidth - menu.offsetWidth - 8, r.left)) + 'px';
      menu.style.bottom = (window.innerHeight - r.top + 8) + 'px';
      mDevice.focus();
    }
  }
  addB.addEventListener('click', function () {
    if (st.busy) return;
    if (st.view === 'albums' && st.openAlbum) return pickForAlbum(album(st.openAlbum));
    setMenu(menu.hidden);
  });
  doc.addEventListener('pointerdown', function (ev) { if (!menu.hidden && !menu.contains(ev.target) && ev.target !== addB) setMenu(false); });
  var fileTarget = null; // the album new photos go into, if any
  function chooseFiles(intoAlbum) { fileTarget = intoAlbum || null; fileIn.value = ''; fileIn.click(); }
  mDevice.addEventListener('click', function () { setMenu(false); chooseFiles(st.view === 'albums' && st.openAlbum ? album(st.openAlbum) : null); });
  mLib.addEventListener('click', function () { setMenu(false); pickFromLibrary(); });
  mPage.addEventListener('click', function () { setMenu(false); });
  fileIn.addEventListener('change', function () {
    var files = Array.prototype.slice.call(fileIn.files || []);
    fileIn.value = '';
    if (files.length) addFiles(files, fileTarget);
  });
  /* new photos from this device: at the top of the stream (and in the album, if one is open); sent on Save */
  function addFiles(files, intoAlbum) {
    var added = [], bad = [];
    files.forEach(function (f) {
      if (!(/^image\//.test(f.type) || /\.(jpe?g|png|webp|heic|heif)$/i.test(f.name))) { bad.push(f.name); return; }
      var url = URL.createObjectURL(f);
      st.fresh[url] = { file: f, name: f.name, meta: null, keep: false };
      added.push({ image: url, caption: '', weight: 1 });
      E.exif(f).then(function (x) { if (st.fresh[url]) { st.fresh[url].meta = x; if (st.sel === url) drawPanel(); } });
      var probe = new Image(); // a photo this browser can't show can't be prepared here either (HEIC outside Safari)
      probe.onerror = function () {
        if (!st.fresh[url]) return;
        dropFresh(url);
        if (st.sel === url) st.sel = null;
        render(); if (!picker.hidden) fillPicker();
        say('This browser can’t read ' + f.name + ' (HEIC photos need Safari, or a JPEG). It was left out.', 'err');
      };
      probe.src = url;
    });
    if (!added.length) { if (bad.length) say('Not a photo: ' + bad.join(', '), 'err'); return; }
    st.work.splice.apply(st.work, [0, 0].concat(added));
    if (intoAlbum && album(intoAlbum.id)) added.forEach(function (e) { addToAlbum(intoAlbum, e.image); });
    if (st.view === 'stream') st.sel = added[0].image;
    render();
    if (!picker.hidden) fillPicker();
    else if (st.view === 'stream') inView(tileOf(st.sel));
    say(n2(added.length, 'new photo', 'new photos') + (intoAlbum ? ' in “' + intoAlbum.name + '” and' : '') + ' at the top of the stream. ' +
      (added.length === 1 ? 'It’s' : 'They’re') + ' sent when you press Save; tap one to keep its metadata.');
  }
  function dropFresh(k) {
    st.work = st.work.filter(function (x) { return key(x) !== k; });
    st.albums.forEach(function (a) { takeFromAlbum(a, k); });
    st.trips.forEach(function (t) { if (t.photos) { t.photos = t.photos.filter(function (x) { return x !== k; }); if (!t.photos.length) delete t.photos; } });
    URL.revokeObjectURL(k);
    delete st.fresh[k];
  }

  /* the picker: several photos at once */
  var pk = null;
  function openPicker(opts) {
    pk = opts;
    pkTitle.textContent = opts.title;
    pkDevice.hidden = !opts.device;
    picker.hidden = false;
    fillPicker();
    pkDone.focus();
  }
  function fillPicker() {
    if (!pk) return;
    var items = pk.items();
    pkGrid.textContent = '';
    pkNote.textContent = items.length ? pk.note || '' : pk.empty;
    items.forEach(function (k) {
      var e = entry(k), on = pk.on(k), li = h('li'), b = btn('pe-pk' + (on ? ' on' : ''), '', (e.caption || fileName(e)) + (on ? ' (chosen)' : ''));
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      var im = h('img'); im.src = disp(k); im.alt = ''; im.loading = 'lazy'; b.appendChild(im);
      b.appendChild(h('span', 'pe-pk-tick', '✓'));
      var bd = pk.badge && pk.badge(k); if (bd) b.appendChild(h('span', 'pe-badge', bd));
      b.addEventListener('click', function () {
        pk.toggle(k);
        var now = pk.on(k);
        b.classList.toggle('on', now); b.setAttribute('aria-pressed', now ? 'true' : 'false');
        b.setAttribute('aria-label', (e.caption || fileName(e)) + (now ? ' (chosen)' : ''));
        if (pk.count) pkNote.textContent = pk.count();
      });
      li.appendChild(b); pkGrid.appendChild(li);
    });
    if (pk.count && items.length) pkNote.textContent = pk.count();
  }
  function closePicker() {
    if (!pk) return;
    var done = pk.done;
    picker.hidden = true; pk = null;
    if (done) done();
    render();
  }
  pkDone.addEventListener('click', closePicker);
  pkDevice.addEventListener('click', function () { if (pk && pk.device) chooseFiles(pk.device); });
  function pickForAlbum(a) {
    if (!a) return;
    openPicker({
      title: 'Photos in “' + a.name + '”',
      device: a,
      empty: 'No photos on the page yet. Add some from this device.',
      items: function () { return shown().filter(onPage).map(key); },
      on: function (k) { return inAlbum(a, k); },
      toggle: function (k) { if (inAlbum(a, k)) takeFromAlbum(a, k); else addToAlbum(a, k); },
      count: function () { return n2(albumPhotos(a).length, 'photo', 'photos') + ' in the album. Tap to add or take out.'; }
    });
  }
  function pickFromLibrary() {
    var chosen = {};
    openPicker({
      title: 'From the library',
      note: 'Photos in your library that aren’t on the page (for example, field log photos). Tap the ones to put on the page.',
      empty: 'Every photo in the library is on the page already. Photos used only in posts or pages are on the Photos page.',
      items: function () { return st.work.filter(function (e) { return !onPage(e) && !st.off[key(e)]; }).map(key); },
      on: function (k) { return !!chosen[k]; },
      toggle: function (k) { if (chosen[k]) delete chosen[k]; else chosen[k] = true; },
      done: function () {
        var ks = Object.keys(chosen);
        if (!ks.length) return;
        var moved = st.work.filter(function (e) { return chosen[key(e)]; });
        st.work = st.work.filter(function (e) { return !chosen[key(e)]; });
        moved.forEach(function (e) { delete e.onPhotoPage; });
        st.work.splice.apply(st.work, [0, 0].concat(moved));
        st.sel = st.view === 'stream' ? key(moved[0]) : st.sel;
        say(n2(ks.length, 'photo', 'photos') + ' put on the page, at the top.');
      }
    });
  }

  /* ------------------------------------------------------------------ saving */
  function today() { return E.isoDay(new Date()); }
  function save() {
    if (st.busy || !dirty()) return;
    var bad = st.trips.filter(function (t) { return !String(t.name || '').trim() || !hasPin(t); })[0];
    if (bad) {
      if (st.view === 'trips') selectTrip(bad._k, false); // first: choosing a trip clears the message line
      say('The field trip “' + tripLabel(bad) + '” needs ' + (!String(bad.name || '').trim() ? 'a name' + (hasPin(bad) ? '' : ' and a pin') : 'a pin') + ' before saving (or delete it).', 'err');
      return;
    }
    stopPlacing(true);
    st.busy = true;
    setMenu(false);
    drawPanel();
    var news = freshKeys(), map = {}, files = [], noted = {};
    /* the new photos first: shrunk here, metadata kept or removed */
    var prep = news.reduce(function (p, k, i) {
      return p.then(function () {
        var f = st.fresh[k], e = entry(k), keep = f.keep && f.meta && f.meta.keep;
        say('Preparing photo ' + (i + 1) + ' of ' + news.length + '…');
        return E.shrink(f.file, keep || null).then(function (r) {
          var path = '/images/gallery/' + (f.meta && f.meta.date || today()) + '-' + (E.slugify(e.caption || 'photo').slice(0, 40) || 'photo') + '-' + r.hash + '.jpg';
          map[k] = path;
          files.push({ path: path.slice(1), content: r.b64, encoding: 'base64' });
          if (keep) noted[path] = f.meta.meta || {};
        });
      });
    }, Promise.resolve());
    var M = function (k) { return map[k] || k; };
    var patches = {}, ch, order, albumsOut, parts = [];
    prep.then(function () {
      ch = changed();
      ch.forEach(function (e) { var p = {}; FIELDS.forEach(function (f) { p[f] = e[f]; }); patches[key(e)] = p; });
      var added = news.map(function (k) {
        var e = entry(k), o = { image: map[k], caption: String(e.caption || '').trim() };
        ['weight', 'width', 'height', 'focus'].forEach(function (f) { if (e[f] !== undefined && e[f] !== '') o[f] = e[f]; });
        if (noted[map[k]]) { o.keepMetadata = true; NOTED.forEach(function (f) { var v = noted[map[k]][f]; if (v !== undefined && v !== '') o[f] = v; }); }
        return o;
      });
      order = reordered() || news.length ? st.work.map(function (e) { return M(key(e)); }) : null;
      if (albumsChanged()) {
        var taken = {};
        albumsOut = st.albums.map(function (a) {
          var id = st.savedIds[a.id] ? a.id : null;
          if (!id) { id = E.slugify(a.name) || 'album'; var base = id, i = 2; while (taken[id] || st.albums.some(function (b) { return b !== a && st.savedIds[b.id] && b.id === id; })) id = base + '-' + (i++); }
          taken[id] = true;
          var o = { id: id, name: a.name.trim() || 'Untitled album' };
          if (a.nameDa) o.nameDa = a.nameDa;
          var ph = a.photos.map(M), cv = a.cover ? M(a.cover) : '';
          if (cv && ph.indexOf(cv) >= 0) o.cover = cv;
          o.photos = ph;
          return o;
        });
      }
      if (ch.length) parts.push(n2(ch.length, 'photo changed', 'photos changed'));
      if (news.length) parts.push(n2(news.length, 'new photo', 'new photos'));
      if (reordered()) parts.push('new order');
      if (albumsOut) parts.push('albums');
      var tripsOut = tripsChanged() ? st.trips.map(function (t) {
        var o = {};
        Object.keys(t).forEach(function (k) {
          var v = t[k];
          if (k === '_k' || v === '' || v === null || v === undefined || (Array.isArray(v) && !v.length)) return;
          if (typeof v === 'string') v = v.trim();
          o[k] = v;
        });
        if (o.photos) o.photos = o.photos.map(M);
        o.lat = +o.lat; o.lon = +o.lon;
        return o;
      }) : null;
      var gearOut = gearChanged() ? st.gear.filter(function (g) { return String(g.name || '').trim(); }).map(function (g) { var o = copyObj(g); o.name = String(g.name).trim(); return o; }) : null;
      if (tripsOut) parts.push('field trips');
      if (gearOut) parts.push('gear');
      say('Saving…');
      return E.commit('Photography: ' + parts.join(', '), { files: files, edits: [{ path: FILE, fn: function (t) {
        /* on top of the newest version: only the photos and fields changed here are touched */
        if (t === null) throw new Error(FILE + ' is missing');
        var d = JSON.parse(t), list = E.arr(d.images), have = {};
        list.forEach(function (g) { if (g && g.image) have[E.same(g.image)] = true; });
        list = added.filter(function (o) { return !have[o.image]; }).concat(list); // new photos at the top
        list.forEach(function (g) {
          var p = g && g.image && patches[E.same(g.image)];
          if (!p) return;
          FIELDS.forEach(function (f) { if (p[f] === undefined || p[f] === '') { if (f === 'caption') g[f] = ''; else delete g[f]; } else g[f] = p[f]; });
        });
        if (order) { // the photos known here take the new order, in the places they hold; any added meanwhile stay where they are
          var pos = {};
          order.forEach(function (k, i) { pos[k] = i; });
          var known = function (g) { return g && g.image && pos[E.same(g.image)] !== undefined; };
          var sorted = list.filter(known).sort(function (a, b) { return pos[E.same(a.image)] - pos[E.same(b.image)]; }), n = 0;
          list = list.map(function (g) { return known(g) ? sorted[n++] : g; });
        }
        if (albumsOut) {
          var exists = {};
          list.forEach(function (g) { if (g && g.image) { exists[E.same(g.image)] = true; delete g.albums; } }); // album names on photos: the old way
          var out = {};
          var put = function () {
            out.albums = albumsOut.map(function (a) {
              var o = {}; Object.keys(a).forEach(function (k) { o[k] = a[k]; });
              o.photos = a.photos.filter(function (x) { return exists[x]; });
              if (o.cover && o.photos.indexOf(o.cover) < 0) delete o.cover;
              return o;
            });
          };
          Object.keys(d).forEach(function (k) { if (k === 'images' && !('albums' in d)) put(); if (k === 'albums') put(); else out[k] = d[k]; });
          if (!('albums' in out)) put();
          d = out;
        }
        if (tripsOut || gearOut) {
          var there = {};
          list.forEach(function (g) { if (g && g.image) there[E.same(g.image)] = true; });
          if (gearOut) d = setKey(d, 'gear', gearOut);
          if (tripsOut) d = setKey(d, 'trips', tripsOut.map(function (t) {
            if (t.photos) { t.photos = t.photos.filter(function (x) { return there[x]; }); if (!t.photos.length) delete t.photos; }
            return t;
          }));
        }
        d.images = list;
        return E.jsonText(d, /\n$/.test(t));
      } }] });
    }).then(function () {
      news.forEach(function (k) { st.preview[map[k]] = k; delete st.fresh[k]; }); // shown from this device until the site has them
      var tripAt = st.trips.indexOf(trip(st.selTrip));
      var sel = st.sel && M(st.sel), selAlbum = st.selAlbum, open = st.openAlbum, ids = albumsOut ? st.albums.map(function (a, i) { return [a.id, albumsOut[i].id]; }) : [];
      return load().then(function () {
        ids.forEach(function (p) { if (selAlbum === p[0]) selAlbum = p[1]; if (open === p[0]) open = p[1]; });
        st.sel = sel && entry(sel) && (st.view !== 'stream' || onPage(entry(sel))) ? sel : null;
        st.selAlbum = album(selAlbum) ? selAlbum : null;
        st.openAlbum = album(open) ? open : null;
        st.selTrip = tripAt >= 0 && st.trips[tripAt] ? st.trips[tripAt]._k : null;
      });
    }).then(function () {
      st.busy = false;
      render();
      redrawTrips(true);
      say('Saved ✓ On the site in a minute or two.', 'ok');
    }).catch(function (err) {
      st.busy = false;
      drawPanel();
      say(E.explain(err), 'err');
    });
  }
  saveB.addEventListener('click', save);
  discardB.addEventListener('click', function () {
    if (st.busy) return;
    freshKeys().forEach(function (k) { URL.revokeObjectURL(k); });
    st.fresh = {};
    st.work = JSON.parse(st.saved);
    st.albums = JSON.parse(st.albumsSaved);
    st.legacy = st.legacy0;
    st.off = {};
    st.trips = JSON.parse(st.tripsSaved);
    st.gear = JSON.parse(st.gearSaved);
    if (st.selTrip && !trip(st.selTrip)) st.selTrip = null;
    stopPlacing(true);
    if (PM) PM.setGear(st.gear);
    redrawTrips(true);
    if (st.sel && (!entry(st.sel) || (st.view === 'stream' && !onPage(entry(st.sel))))) st.sel = null;
    if (st.selAlbum && !album(st.selAlbum)) st.selAlbum = null;
    if (st.openAlbum && !album(st.openAlbum)) st.openAlbum = null;
    st.note = '';
    render();
  });
  window.addEventListener('beforeunload', function (ev) { if (st.on && (st.busy || dirty())) { ev.preventDefault(); ev.returnValue = ''; } });

  /* ------------------------------------------------------------------ in and out of edit mode */
  /* the newest photo library, straight from the repository (the site itself can be a minute behind) */
  function load() {
    return E.readFile(FILE).then(function (f) {
      var d = f ? JSON.parse(f.text) : { images: [] };
      st.work = E.arr(d.images).filter(function (e) { return e && e.image; });
      st.legacy = st.legacy0 = readAlbums(d);
      readTrips(d);
      remember();
    });
  }
  /* the albums as the page shows them (src/build.py's shape) */
  function shownAlbums() {
    return st.albums.map(function (a) {
      var ph = a.photos.filter(function (k) { var e = entry(k); return e && onPage(e); });
      return { slug: a.id, name: a.name, nameDa: a.nameDa, cover: a.cover && ph.indexOf(a.cover) >= 0 ? disp(a.cover) : '', images: ph.map(disp) };
    });
  }
  /* which view is showing: the stream, the albums or the field trips */
  Array.prototype.forEach.call(doc.querySelectorAll('.pv'), function (b) {
    b.addEventListener('click', function () {
      if (!st.on || !PM) return;
      var v = PM.view();
      if (v === st.view) return;
      st.view = v; st.sel = null; st.selAlbum = null; st.openAlbum = null; st.selTrip = null; st.note = '';
      setMenu(false); stopPlacing(true);
      if (v === 'albums') PM.redraw(); // drawn fresh: it may have changed while hidden (a save gives new albums their names)
      if (v === 'trips') { redrawTrips(false); ensureFl().then(function () { if (st.view === 'trips' && tripCard) { drawTripList(tripCard); drawPanel(); } }); }
      drawPanel();
    });
  });
  function enter() {
    if (st.on || st.busy) return;
    if (!E.findAuth()) return askSignin('');
    st.busy = true;
    fab.disabled = true; fab.lastChild.textContent = 'Opening…';
    load().then(function () {
      st.busy = false; st.on = true; st.sel = null; st.selAlbum = null; st.openAlbum = null; st.note = '';
      st.view = PM ? PM.view() : 'stream';
      doc.body.classList.add('pe-on');
      fab.hidden = true; bar.hidden = false;
      if (PM) { PM.editor = drawAlbums; PM.tripEdit = tripHooks; }
      var nav = doc.getElementById('pviews');
      if (nav) nav.parentNode.insertBefore(gearBtn, nav);
      gearBtn.setAttribute('aria-pressed', 'false'); st.gearOpen = false;
      render();
      if (PM) { PM.redraw(); PM.setTrips(pins()); }
      if (st.view === 'trips') { redrawTrips(false); ensureFl().then(function () { if (st.view === 'trips' && tripCard) drawTripList(tripCard); }); }
    }).catch(function (err) {
      st.busy = false;
      fab.disabled = false; fab.lastChild.textContent = 'Edit';
      if (err.status === 401) {
        var a = E.auth();
        if (a && a.via !== 'admin') E.signOut();
        askSignin(a && a.via === 'admin' ? 'Your /admin sign-in on this device has expired. Sign in again here.' : 'That sign-in no longer works (expired or wrong key). Sign in again.');
      } else {
        askSignin(E.explain(err).replace(' — nothing was saved', '').replace(' Nothing was saved; try again.', ''));
      }
    });
  }
  function leave() {
    if (st.busy) return;
    if (dirty()) { say('Save or discard your changes first.', 'err'); return; }
    st.on = false; st.sel = null; st.selAlbum = null; st.openAlbum = null; st.selTrip = null; st.gearOpen = false;
    setMenu(false); stopPlacing(true);
    if (gearBtn.parentNode) gearBtn.parentNode.removeChild(gearBtn);
    doc.body.classList.remove('pe-on', 'pe-side');
    doc.body.style.paddingBottom = '';
    bar.hidden = true; panel.hidden = true; picker.hidden = true;
    fab.hidden = false; fab.disabled = false; fab.lastChild.textContent = 'Edit';
    /* keep showing what was just saved: the site itself catches up in a minute or two */
    P.show(st.work.filter(onPage).map(function (e) { var c = {}; Object.keys(e).forEach(function (k) { c[k] = e[k]; }); c.image = disp(key(e)); return c; }));
    if (PM) {
      PM.editor = null; PM.tripEdit = null;
      PM.setAlbums(shownAlbums());
      PM.setGear(st.gear);
      PM.world();
      ensureFl().then(function () { if (!st.on) PM.setTrips(shownTrips()); });
    }
    try { if (/^#edit\b/.test(location.hash)) history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* file:// */ }
  }
  fab.addEventListener('click', enter);
  doneB.addEventListener('click', leave);

  function askSignin(msg) {
    signMsg.textContent = msg || '';
    signin.hidden = false;
    ghB.focus();
  }
  function signedIn() { signin.hidden = true; fab.hidden = false; enter(); }
  ghB.addEventListener('click', function () { E.githubSignIn(function (t) { signMsg.textContent = t; }, signedIn); });
  keyB.addEventListener('click', function () {
    if (!E.useKey(keyIn.value)) { signMsg.textContent = 'That doesn’t look like a GitHub key (it starts with github_pat_).'; return; }
    keyIn.value = '';
    signedIn();
  });
  signClose.addEventListener('click', function () { signin.hidden = true; });
  window.addEventListener('resize', function () { if (st.on) drawBar(); });

  /* start: the Edit button for a signed-in owner; #edit opens the editor (or the sign-in) at once */
  var wants = /^#edit\b/.test(location.hash);
  fab.hidden = !E.findAuth() && !wants;
  if (wants) enter();
})();
