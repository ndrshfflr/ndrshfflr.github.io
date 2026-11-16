/* ==========================================================================
   Photography — editing on the page itself.
   Fetched by assets/photos.js only when a sign-in is kept on this device (from
   /admin, the Photos page or here), or with photography.html#edit. Visitors
   never load it.

   Edit (bottom right) turns the stream into an editor:
   - tap a photo to select it; a panel shows its caption, its size in the grid
     (1–3 cells wide and tall), what to keep in frame, and its place in the order
   - laptop: drag a photo to move it (a line shows where it lands), drag the
     corner of the selected photo to resize it
   - phone: the First / Earlier / Later / Last buttons and the size grid
   - "Take off the page" keeps the photo in the library (Photos page);
     "Delete for good" is its own, confirmed step and removes it everywhere
   Changes gather until Save: one commit to content/gallery.json, applied on top
   of the newest version (so photos added meanwhile are kept). Discard undoes.
   Signing in, saving and deleting come from assets/edit-core.js.
   ========================================================================== */
(function () {
  'use strict';

  var P = window.Photos, E = window.SiteEdit, doc = document;
  if (!P || !E || !P.data || !P.data.edit || window.PhotosEdit) return;
  window.PhotosEdit = true;
  E.setup(P.data.edit);

  var mosaic = doc.getElementById('mosaic');
  var FILE = 'content/gallery.json';
  var FIELDS = ['caption', 'weight', 'width', 'height', 'focus', 'onPhotoPage']; // what this editor changes on a photo
  var WEIGHT = { '1x1': 1, '2x1': 2, '2x2': 3, '3x2': 4, '3x3': 5 };           // the shapes the old sizes 1–5 stand for
  var CELLS = { 1: [1, 1], 2: [2, 1], 3: [2, 2], 4: [3, 2], 5: [3, 3] };
  var FOCUS = [['top', 'Top', '↑'], ['left', 'Left', '←'], ['center', 'Middle', '•'], ['right', 'Right', '→'], ['bottom', 'Bottom', '↓']];
  var fine = !!(window.matchMedia && matchMedia('(hover:hover) and (pointer:fine)').matches);

  /* st.work: the photo library as it will be saved; st.saved: as it is on the site now */
  var st = { on: false, busy: false, work: [], saved: '[]', base: {}, order0: [], off: {}, sel: null, site: null, note: '', kind: '' };

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
  function key(e) { return E.same(e.image); }
  function fileName(e) { return String(e.image).replace(/^.*\//, ''); }
  function entry(k) { for (var i = 0; i < st.work.length; i++) if (key(st.work[i]) === k) return st.work[i]; return null; }
  function onPage(e) { return e.onPhotoPage !== false; }
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
  /* the photos shown while editing: those on the page, and those taken off it since the last save (dimmed) */
  function shown() { return st.work.filter(function (e) { return onPage(e) || st.off[key(e)]; }); }

  /* ------------------------------------------------------------------ what has changed */
  function snap(e) { var o = {}; FIELDS.forEach(function (f) { if (e[f] !== undefined && e[f] !== '') o[f] = e[f]; }); return JSON.stringify(o); }
  function remember() {
    st.saved = JSON.stringify(st.work);
    st.base = {}; st.off = {};
    st.work.forEach(function (e) { st.base[key(e)] = snap(e); });
    st.order0 = st.work.map(key);
  }
  function changed() { return st.work.filter(function (e) { return snap(e) !== st.base[key(e)]; }); }
  function reordered() { return st.work.map(key).join('\n') !== st.order0.join('\n'); }
  function dirty() { return changed().length + (reordered() ? 1 : 0); }

  /* ------------------------------------------------------------------ the controls */
  var fab = btn('pe-fab', '', 'Edit the photography page');
  fab.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/></svg><span>Edit</span>';

  var bar = h('div', 'pe-bar');
  bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Editing the photography page');
  bar.hidden = true;
  var status = h('p', 'pe-status'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
  var addLink = h('a', 'pe-link', 'Add photos'); addLink.href = 'upload.html';
  var discardB = btn('pe-btn', 'Discard'), saveB = btn('pe-btn pe-primary', 'Save'), doneB = btn('pe-btn', 'Done');
  var acts = h('div', 'pe-acts');
  [addLink, discardB, saveB, doneB].forEach(function (n) { acts.appendChild(n); });
  bar.appendChild(status); bar.appendChild(acts);

  var panel = h('aside', 'pe-panel');
  panel.setAttribute('aria-label', 'The selected photo');
  panel.hidden = true;
  var thumb = h('img', 'pe-thumb'); thumb.alt = '';
  var nameP = h('p', 'pe-name'), closeB = btn('pe-x', '×', 'Close this panel');
  var capL = h('label', 'pe-label pe-cap', 'Caption'), cap = h('input', 'pe-input');
  cap.type = 'text'; cap.maxLength = 160; cap.setAttribute('enterkeyhint', 'done'); cap.autocomplete = 'off';
  capL.appendChild(cap);
  var head = h('div', 'pe-head'); head.appendChild(thumb); head.appendChild(capL); head.appendChild(closeB);

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

  var orderBox = h('div', 'pe-group pe-order-box'), orderRow = h('div', 'pe-order');
  orderBox.appendChild(h('p', 'pe-label', fine ? 'Order (or drag the photo)' : 'Order'));
  var MOVES = [['first', '«', 'First'], ['earlier', '‹', 'Earlier'], ['later', '›', 'Later'], ['last', '»', 'Last']];
  var moveBtns = MOVES.map(function (m) {
    var b = btn('pe-btn pe-move', '', 'Move ' + (m[0] === 'first' ? 'to the start' : m[0] === 'last' ? 'to the end' : m[0]));
    var a = h('span', 'pe-arrow', m[1]), t = h('span', 'pe-move-t', m[2]); a.setAttribute('aria-hidden', 'true');
    if (m[0] === 'later' || m[0] === 'last') { b.appendChild(t); b.appendChild(a); }
    else { b.appendChild(a); b.appendChild(t); }
    b.addEventListener('click', function () { move(m[0]); });
    orderRow.appendChild(b);
    return { b: b, v: m[0] };
  });
  orderBox.appendChild(orderRow);

  var tools = h('div', 'pe-tools');
  tools.appendChild(sizeBox); tools.appendChild(focusBox); tools.appendChild(orderBox);

  var offB = btn('pe-btn', 'Take off the page'), delB = btn('pe-btn pe-danger-line', 'Delete…');
  var foot = h('div', 'pe-foot'); foot.appendChild(offB); foot.appendChild(delB);
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

  [head, nameP, tools, foot, offNote, confirmBox].forEach(function (n) { panel.appendChild(n); });

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
  [fab, bar, panel, signin].forEach(function (n) { ui.appendChild(n); });
  doc.body.appendChild(ui);

  /* ------------------------------------------------------------------ drawing */
  function say(text, kind) { st.note = text || ''; st.kind = kind || ''; drawBar(); }
  function drawBar() {
    var n = dirty();
    status.className = 'pe-status' + (st.kind ? ' ' + st.kind : '');
    status.textContent = st.note || (away() ? 'Editing works in the Stream for now; albums and field trips come next.'
      : n ? (n === 1 ? '1 change' : n + ' changes') + ' not saved yet'
      : 'Tap a photo to change it' + (fine ? ', or drag it to a new place.' : '.'));
    saveB.disabled = discardB.disabled = st.busy || !n;
    doneB.disabled = st.busy;
    doc.documentElement.style.setProperty('--pe-bar', bar.offsetHeight + 'px');
    doc.body.style.paddingBottom = st.on ? (bar.offsetHeight + (panel.hidden || fine ? 0 : panel.offsetHeight) + 24) + 'px' : '';
  }
  /* looking at Albums or Field trips while editing: the editor waits */
  var streamPane = doc.getElementById('pane-stream');
  function away() { return !!(streamPane && streamPane.hidden); }
  Array.prototype.forEach.call(doc.querySelectorAll('.pv'), function (b) {
    b.addEventListener('click', function () { if (st.on) { if (away()) select(null); else drawBar(); } });
  });
  function drawPanel() {
    var e = st.sel && entry(st.sel);
    panel.hidden = !e;
    if (!e) { confirmBox.hidden = true; return; }
    var cr = cells(e), list = shown(), i = list.indexOf(e);
    if (thumb.getAttribute('src') !== e.image) thumb.src = e.image;
    nameP.textContent = fileName(e);
    if (doc.activeElement !== cap) cap.value = e.caption || '';
    sizeT.textContent = 'Size: ' + cr[0] + ' × ' + cr[1];
    sizeCells.forEach(function (s) {
      s.b.classList.toggle('on', s.c <= cr[0] && s.r <= cr[1]);
      s.b.setAttribute('aria-pressed', s.c === cr[0] && s.r === cr[1] ? 'true' : 'false');
    });
    focusBtns.forEach(function (f) {
      var on = (e.focus || 'center') === f.v;
      f.b.classList.toggle('on', on); f.b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    moveBtns.forEach(function (m) { m.b.disabled = st.busy || !onPage(e) || ((m.v === 'first' || m.v === 'earlier') ? i <= 0 : i >= list.length - 1); });
    offB.textContent = onPage(e) ? 'Take off the page' : 'Put back on the page';
    offNote.textContent = onPage(e) ? '' : 'Off the photography page once you save. It stays in your library (Add photos → Library).';
    offNote.hidden = onPage(e);
    offB.disabled = delB.disabled = st.busy;
    tools.classList.toggle('pe-dim', !onPage(e));
  }
  function decorate() {
    var list = shown();
    Array.prototype.forEach.call(mosaic.children, function (li, i) {
      var e = list[i], a = li.querySelector('.tile-a');
      if (!e) return;
      li.setAttribute('data-key', key(e));
      if (a) { a.draggable = false; var im = a.querySelector('img'); if (im) im.draggable = false; }
      if (!onPage(e)) { li.classList.add('pe-off'); li.appendChild(h('span', 'pe-badge', 'Off the page')); }
      if (key(e) === st.sel) {
        li.classList.add('pe-sel');
        if (a) a.setAttribute('aria-current', 'true');
        if (onPage(e)) { var hd = h('span', 'pe-handle'); hd.setAttribute('aria-hidden', 'true'); li.appendChild(hd); }
      }
    });
  }
  /* show the working list on the page */
  function render() {
    P.show(shown().map(function (e) { var c = {}; Object.keys(e).forEach(function (k) { if (k !== 'onPhotoPage') c[k] = e[k]; }); return c; }));
    decorate();
    drawPanel();
    drawBar();
  }
  function tileOf(k) { return k ? mosaic.querySelector('.tile[data-key="' + String(k).replace(/["\\]/g, '\\$&') + '"]') : null; }
  function select(k, reveal) {
    st.sel = k && entry(k) ? k : null;
    confirmBox.hidden = true;
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
      if (e && onPage(e)) { var hd = h('span', 'pe-handle'); hd.setAttribute('aria-hidden', 'true'); li.appendChild(hd); }
    }
    if (st.note && st.kind !== 'err') st.note = '';
    drawPanel(); drawBar();
    if (li && reveal) inView(li);
  }
  /* keep the selected photo clear of the bar and (on the phone) the panel */
  function inView(li) {
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
    var li = tileOf(st.sel);
    if (li) inView(li);
  }

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
    var li = tileOf(k);
    if (li) inView(li);
  }
  function move(how) {
    var e = st.sel && entry(st.sel), list = shown(), i = list.indexOf(e);
    if (!e || i < 0) return;
    var t = how === 'first' ? list[0] : how === 'last' ? list[list.length - 1] : how === 'earlier' ? list[i - 1] : list[i + 1];
    if (t && t !== e) place(st.sel, key(t), how === 'first' || how === 'earlier');
    var b = moveBtns.filter(function (m) { return m.v === how; })[0];
    if (b && !b.b.disabled) b.b.focus(); // Safari doesn't focus buttons on click
  }

  /* tapping a photo selects it (it doesn't open the viewer while editing) */
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

  /* laptop: drag a photo to a new place, or drag the selected photo's corner to resize it */
  var drag = null;
  function metrics() {
    var cs = getComputedStyle(mosaic);
    var cols = parseInt(cs.getPropertyValue('--cols'), 10) || 8, gap = parseFloat(cs.columnGap) || 0;
    return { cols: cols, gap: gap, cell: (mosaic.clientWidth - (cols - 1) * gap) / cols };
  }
  function clearMarks() {
    Array.prototype.forEach.call(mosaic.querySelectorAll('.pe-before,.pe-after'), function (n) { n.classList.remove('pe-before', 'pe-after'); });
  }
  mosaic.addEventListener('pointerdown', function (ev) {
    if (!st.on || st.busy || ev.button) return;
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
    drag = { kind: 'wait', li: li, x: ev.clientX, y: ev.clientY, id: ev.pointerId };
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
  /* which photo the dragged one would land next to, and on which side */
  function aim() {
    var under = doc.elementFromPoint(drag.cx, drag.cy);
    var li = under && under.closest ? under.closest('.tile') : null;
    clearMarks();
    drag.target = null;
    if (!li || li === drag.li || li.parentNode !== mosaic) return;
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
    if (!cancel && d.target) place(d.li.getAttribute('data-key'), d.target.getAttribute('data-key'), d.before);
  }
  window.addEventListener('pointerup', function (ev) { endDrag(ev, false); });
  window.addEventListener('pointercancel', function (ev) { endDrag(ev, true); });
  window.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Escape' || !st.on) return;
    if (drag) endDrag(null, true);
    else if (!confirmBox.hidden) confirmBox.hidden = true;
    else if (st.sel) select(null);
  });

  /* ------------------------------------------------------------------ the panel's buttons */
  cap.addEventListener('input', function () {
    var e = st.sel && entry(st.sel);
    if (!e) return;
    var v = cap.value.replace(/\s+/g, ' ').replace(/^ /, '');
    if (v) e.caption = v; else e.caption = '';
    st.note = '';
    drawBar();
  });
  cap.addEventListener('change', function () {
    var e = st.sel && entry(st.sel);
    if (e) { e.caption = String(e.caption || '').trim(); render(); }
  });
  cap.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') cap.blur(); });
  closeB.addEventListener('click', function () { select(null); });
  offB.addEventListener('click', function () {
    change(function (e) {
      if (onPage(e)) { e.onPhotoPage = false; st.off[key(e)] = true; }
      else delete e.onPhotoPage;
    });
    offB.focus();
  });

  /* delete for good: its own step, confirmed, and done right away */
  delB.addEventListener('click', function () {
    var e = st.sel && entry(st.sel);
    if (!e || st.busy) return;
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
      st.saved = JSON.stringify(JSON.parse(st.saved).filter(function (x) { return key(x) !== k; }));
      st.order0 = st.order0.filter(function (x) { return x !== k; });
      delete st.base[k]; delete st.off[k];
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

  /* ------------------------------------------------------------------ saving */
  function save() {
    if (st.busy || !dirty()) return;
    var patches = {}, ch = changed(), order = reordered() ? st.work.map(key) : null;
    ch.forEach(function (e) { var p = {}; FIELDS.forEach(function (f) { p[f] = e[f]; }); patches[key(e)] = p; });
    var parts = [];
    if (ch.length) parts.push(ch.length === 1 ? '1 photo changed' : ch.length + ' photos changed');
    if (order) parts.push('new order');
    st.busy = true;
    say('Saving…');
    drawPanel();
    E.commit('Photography: ' + parts.join(', '), { edits: [{ path: FILE, fn: function (t) {
      /* on top of the newest version: only the photos and fields changed here are touched */
      if (t === null) throw new Error(FILE + ' is missing');
      var d = JSON.parse(t), list = E.arr(d.images);
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
      d.images = list;
      return E.jsonText(d, /\n$/.test(t));
    } }] }).then(function () {
      return load();
    }).then(function () {
      st.busy = false;
      if (st.sel && (!entry(st.sel) || !onPage(entry(st.sel)))) st.sel = null;
      render();
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
    st.work = JSON.parse(st.saved);
    st.off = {};
    if (st.sel && (!entry(st.sel) || !onPage(entry(st.sel)))) st.sel = null;
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
      remember();
    });
  }
  function enter() {
    if (st.on || st.busy) return;
    if (!E.findAuth()) return askSignin('');
    st.busy = true;
    fab.disabled = true; fab.lastChild.textContent = 'Opening…';
    load().then(function () {
      st.busy = false; st.on = true; st.sel = null; st.note = '';
      var stream = doc.querySelector('.pv[data-view="stream"]');
      if (stream && stream.getAttribute('aria-pressed') !== 'true') stream.click();
      doc.body.classList.add('pe-on');
      fab.hidden = true; bar.hidden = false;
      render();
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
    st.on = false; st.sel = null;
    doc.body.classList.remove('pe-on');
    doc.body.style.paddingBottom = '';
    bar.hidden = true; panel.hidden = true;
    fab.hidden = false; fab.disabled = false; fab.lastChild.textContent = 'Edit';
    /* keep showing what was just saved: the site itself catches up in a minute or two */
    P.show(st.work.filter(onPage));
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
