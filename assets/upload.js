/* ==========================================================================
   Photos (upload.html): one place for every picture on the site.

   New      pictures (from this device or the library), and, in the same go,
            a find in the field log (an existing sighting or a new one) and/or
            a blog post. Any mix; each part also works on its own.
   Library  every picture in images/ with where it's used: portfolio, field log
            sightings, blog posts, pages. Open one to change its caption, put it
            in or out of the portfolio, link it to sightings or a post.

   Everything is saved straight into the repository, one commit per Publish/
   Save, on top of the newest version of each file:
     content/gallery.json   the photo library (portfolio order, caption, size,
                            crop, sightings, species, post)
     content/fieldlog.json  new sightings ("Finds I add by hand"), story links
     content/posts/*.md     new blog posts; pictures added to a post's text
   New pictures are shrunk to 2000 px and re-drawn on this device (no location
   or other metadata) before they're sent to images/gallery/.
   ========================================================================== */
(function () {
  'use strict';

  var doc = document;
  var D = {};
  try { D = JSON.parse(doc.getElementById('upload-data').textContent) || {}; } catch (e) { D = {}; }
  /* signing in, saving, preparing photos and deleting them: the shared engine (assets/edit-core.js) */
  var E = window.SiteEdit.setup({ repo: D.repo, branch: D.branch || 'main', proxy: D.proxy, authEndpoint: D.authEndpoint });
  var SIZES = E.SIZES, POS = E.POS;
  var store = E.store, arr = E.arr, norm = E.norm, same = E.same, isoDay = E.isoDay, slugify = E.slugify, jsonText = E.jsonText;
  var gh = E.gh, readFile = E.readFile, commit = E.commit, explain = E.explain;
  var GROUP = { fungi: 'Fungi', birds: 'Birds', insects: 'Insects', arachnids: 'Spiders & kin', mammals: 'Mammals', herps: 'Amphibians & reptiles', fish: 'Fish', molluscs: 'Molluscs', plants: 'Plants', other: 'Other' };
  var GROUP_DA = { fungi: 'Svampe', birds: 'Fugle', insects: 'Insekter', arachnids: 'Edderkopper m.fl.', mammals: 'Pattedyr', herps: 'Padder og krybdyr', fish: 'Fisk', molluscs: 'Bløddyr', plants: 'Planter', other: 'Andet' };
  var SOURCE = { inaturalist: 'iNaturalist', svampeatlas: 'Svampeatlas', arter: 'Arter.dk', dofbasen: 'DOFbasen', ebird: 'Merlin/eBird', manual: 'by hand' };
  var MONTHS = { en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    da: ['januar', 'februar', 'marts', 'april', 'maj', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'december'] };

  function $(id) { return doc.getElementById(id); }
  function el(tag, cls, text) {
    var n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null && text !== '') n.textContent = text;
    return n;
  }
  var standalone = window.navigator.standalone === true || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
  var signin = $('signin'), work = $('work'), who = $('who'), signOut = $('sign-out');
  var auth = null, busy = false;

  /* ------------------------------------------------------------------ small helpers */
  function longDate(iso, lang) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
    if (!m) return iso || '';
    var M = MONTHS[lang] || MONTHS.en;
    return lang === 'da' ? (+m[3]) + '. ' + M[+m[2] - 1] + ' ' + m[1] : (+m[3]) + ' ' + M[+m[2] - 1] + ' ' + m[1];
  }
  function shortDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
    return m ? (+m[3]) + ' ' + MONTHS.en[+m[2] - 1].slice(0, 3) + ' ' + m[1] : (iso || 'no date');
  }
  function latinName(name) { name = String(name || '').trim().replace(/\s+/g, ' '); return name.charAt(0).toUpperCase() + name.slice(1); }
  function newId(date) {
    var r = new Uint8Array(2); (window.crypto || {}).getRandomValues ? crypto.getRandomValues(r) : (r[0] = Math.random() * 256, r[1] = Math.random() * 256);
    return 'm' + String(date || isoDay(new Date())).replace(/-/g, '') + '-' + ('0' + r[0].toString(16)).slice(-2) + ('0' + r[1].toString(16)).slice(-2);
  }
  /* ------------------------------------------------------------------ signing in */
  function showSignin(message) {
    auth = null;
    work.hidden = true; signOut.hidden = true; signin.hidden = false;
    $('signin-msg').textContent = message || (standalone ? 'Opened from the home screen: use a key (below) — GitHub sign-in can’t return to a home-screen app.' : '');
    if (standalone) $('key-box').open = true;
  }
  function start() {
    auth = E.findAuth();
    if (!auth) return showSignin();
    who.textContent = 'Checking your sign-in…';
    signin.hidden = true; work.hidden = false;
    gh('GET', '/user').then(function (u) {
      var how = auth.via === 'admin' ? 'through /admin on this device' : auth.via === 'key' ? 'with a key' : 'with GitHub';
      who.textContent = 'Signed in as ' + (u && u.login ? '@' + u.login : 'you') + ' ' + how + '.';
      signOut.hidden = auth.via === 'admin';
      loadAll();
    }).catch(function (e) {
      if (e.status === 401) {
        if (auth && auth.via !== 'admin') E.signOut();
        showSignin(auth && auth.via === 'admin' ? 'Your /admin sign-in on this device has expired. Sign in again here.' : 'That sign-in no longer works (expired or wrong key). Sign in again.');
      } else {
        who.textContent = 'Couldn’t reach GitHub just now (' + e.message + ').';
      }
    });
  }
  $('gh-signin').addEventListener('click', function () {
    E.githubSignIn(function (text) { $('signin-msg').textContent = text.replace('use a key.', 'use a key below.'); }, start);
  });
  $('key-save').addEventListener('click', function () {
    if (!E.useKey($('key').value)) { $('signin-msg').textContent = 'That doesn’t look like a GitHub key (it starts with github_pat_).'; return; }
    $('key').value = '';
    start();
  });
  signOut.addEventListener('click', function () {
    E.signOut();
    showSignin('Signed out on this device.');
  });

  /* ------------------------------------------------------------------ the site's content */
  var S = { loaded: false, images: [], gallery: { images: [] }, galleryNL: true, cfg: {}, cfgNL: true, obs: {}, posts: [], texts: [], pics: [], byPath: {}, temp: {} };
  function loadAll() {
    $('lib-msg').textContent = 'Loading the pictures…';
    return E.loadSite({ observations: true }).then(function (r) {
      S.images = r.images;
      try { S.gallery = r.gallery ? JSON.parse(r.gallery.text) : { images: [] }; S.galleryNL = !r.gallery || /\n$/.test(r.gallery.text); } catch (e) { S.gallery = { images: [] }; }
      try { S.cfg = r.fieldlog ? JSON.parse(r.fieldlog.text) : {}; S.cfgNL = !r.fieldlog || /\n$/.test(r.fieldlog.text); } catch (e) { S.cfg = {}; }
      try { S.obs = r.observations ? JSON.parse(r.observations.text) : {}; } catch (e) { S.obs = {}; }
      S.texts = r.texts;
      S.posts = r.posts;
      S.loaded = true;
      index();
      fillSpecies();
      fillPostSelect($('pic-post'));
      renderLibrary();
      refreshNew();
    }).catch(function (e) {
      $('lib-msg').textContent = 'Couldn’t load the pictures: ' + e.message;
    });
  }

  /* ---------- sightings: synced ones and the ones added by hand ---------- */
  var provisional = {}; // hand-added sightings without an id yet: given one when first linked
  function manualId(m, i) {
    if (m.id) return 'manual:' + m.id;
    var k = norm(m.name) + '|' + String(m.date || '').slice(0, 10) + '|' + i;
    provisional[k] = provisional[k] || newId(String(m.date || '').slice(0, 10));
    return 'manual:' + provisional[k];
  }
  function sightings() {
    var out = [];
    arr(S.obs.items).forEach(function (o) {
      if (o && o.id && o.name) out.push({ id: o.id, name: o.name, date: o.date || '', place: o.place || '', source: o.source, group: o.group, common: o.common_da || o.common_en || '' });
    });
    arr(S.cfg.manual).forEach(function (m, i) {
      if (m && m.name) out.push({ id: manualId(m, i), name: m.name, date: String(m.date || '').slice(0, 10), place: m.place || '', source: 'manual', group: m.group, common: m.commonDa || m.common || '', manual: m, provisional: !m.id });
    });
    return out;
  }
  function sightingById(id) { return sightings().filter(function (s) { return s.id === id; })[0]; }
  function sightingLabel(s) { return [shortDate(s.date), s.place, SOURCE[s.source] || s.source].filter(Boolean).join(' · '); }
  function speciesInfo(name) {
    var k = norm(name), all = sightings().filter(function (s) { return norm(s.name) === k; });
    var m = arr(S.cfg.manual).filter(function (x) { return x && norm(x.name) === k; })[0] || {};
    var item = arr(S.obs.items).filter(function (o) { return o && norm(o.name) === k; })[0] || {};
    return { known: all.length > 0, name: all[0] ? all[0].name : latinName(name), group: m.group || item.group || '',
      en: m.common || item.common_en || '', da: m.commonDa || item.common_da || '', sightings: all.sort(function (a, b) { return a.date < b.date ? 1 : -1; }) };
  }
  function fillSpecies() {
    var list = $('species-list'), seen = {};
    list.textContent = '';
    var add = function (name, label) {
      if (!name || seen[norm(name)]) return;
      seen[norm(name)] = 1;
      var o = doc.createElement('option'); o.value = name; if (label && label !== name) o.label = label;
      list.appendChild(o);
    };
    arr(S.cfg.manual).forEach(function (m) { if (m && m.name) add(m.name, m.name + (m.commonDa || m.common ? ' (' + (m.commonDa || m.common) + ')' : '')); });
    arr(S.obs.species).forEach(function (sp) { if (sp && sp.name) add(sp.name, sp.label); });
  }
  /* a <select> of the sightings of one species, plus "A new sighting" */
  function fillSightings(sel, name, preferDate) {
    var info = speciesInfo(name), keep = sel.value;
    sel.textContent = '';
    var nw = el('option', null, info.known ? 'A new sighting' : 'A new sighting (new species)'); nw.value = 'new'; sel.appendChild(nw);
    info.sightings.forEach(function (s) { var o = el('option', null, sightingLabel(s)); o.value = s.id; sel.appendChild(o); });
    var match = preferDate && info.sightings.filter(function (s) { return s.date === preferDate; })[0];
    sel.value = match ? match.id : (Array.prototype.some.call(sel.options, function (o) { return o.value === keep; }) ? keep : 'new');
    return info;
  }

  /* ---------- where every picture is used ---------- */
  function postBySlug(slug) { return S.posts.filter(function (p) { return p.slug === slug; })[0]; }
  function galleryEntry(path) { return arr(S.gallery.images).filter(function (g) { return g && same(g.image) === path; })[0] || null; }
  function index() {
    var pics = {}, order = [];
    var pic = function (path) {
      path = same(path);
      if (!/^\/images\//.test(path)) return null;
      if (!pics[path]) { pics[path] = { path: path, uses: [], g: null, caption: '' }; order.push(path); }
      return pics[path];
    };
    var use = function (path, kind, label, href) {
      var p = pic(path); if (!p) return;
      if (!p.uses.some(function (u) { return u.kind === kind && u.label === label; })) p.uses.push({ kind: kind, label: label, href: href || '' });
    };
    // the photo library first (portfolio order), then everything else
    arr(S.gallery.images).forEach(function (g) {
      if (!g || !g.image) return;
      var p = pic(g.image); if (!p) return;
      p.g = g; p.caption = g.caption || '';
      if (g.onPhotoPage !== false) use(g.image, 'portfolio', 'Portfolio · size ' + (g.weight || 1), 'photography.html#photo=' + encodeURIComponent(g.image.replace(/^.*\//, '').replace(/\.[a-z]+$/i, '')));
      var named = {};
      arr(g.sightings).forEach(function (id) {
        var s = sightingById(id);
        if (s) { named[norm(s.name)] = 1; use(g.image, 'find', s.name + ' · ' + sightingLabel(s), 'fieldlog.html#sp=' + encodeURIComponent(s.name)); }
      });
      (Array.isArray(g.species) ? g.species : g.species ? [g.species] : []).forEach(function (n) {
        if (n && !named[norm(n)]) use(g.image, 'find', n, 'fieldlog.html#sp=' + encodeURIComponent(n));
      });
      if (g.post) { var pp = postBySlug(g.post); use(g.image, 'post', 'Blog: ' + (pp ? pp.title : g.post), 'post.html?slug=' + encodeURIComponent(g.post)); }
    });
    arr(S.cfg.manual).forEach(function (m) {
      if (!m) return;
      arr(m.photos).concat(m.photo ? [m.photo] : []).forEach(function (ph) {
        use(typeof ph === 'string' ? ph : ph && ph.src, 'find', m.name + ' · ' + sightingLabel({ date: String(m.date || '').slice(0, 10), place: m.place, source: 'manual' }), 'fieldlog.html#sp=' + encodeURIComponent(m.name));
      });
    });
    arr(S.cfg.finds).forEach(function (f) {
      if (!f || !f.species) return;
      arr(f.photos).forEach(function (ph) { use(typeof ph === 'string' ? ph : ph && ph.src, 'find', f.species, 'fieldlog.html#sp=' + encodeURIComponent(f.species)); });
      if (f.cover) use(f.cover, 'find', 'Cover of ' + f.species, 'fieldlog.html#sp=' + encodeURIComponent(f.species));
    });
    var IMG = /(?:https?:\/\/ndrshfflr\.github\.io)?\/?images\/[^\s"')\]]+\.(?:jpe?g|png|webp|gif|avif)/gi;
    S.posts.forEach(function (p) {
      (p.text.match(IMG) || []).forEach(function (path) { use(path, 'post', 'Blog: ' + p.title, 'post.html?slug=' + encodeURIComponent(p.slug)); });
    });
    S.texts.forEach(function (t) {
      (String(t.text || '').match(IMG) || []).forEach(function (path) { use(path, 'page', t.label, t.href || ''); });
    });
    S.images.forEach(function (path) { pic(path); });
    S.byPath = pics;
    S.pics = order.map(function (k) { return pics[k]; });
    // pictures only in the library list (no file yet) are left out unless just sent from here
    S.pics = S.pics.filter(function (p) { return S.images.indexOf(p.path) >= 0 || S.temp[p.path]; });
    $('lib-count').textContent = String(S.pics.length);
  }
  function srcOf(path) { return S.temp[path] || path; }

  /* ------------------------------------------------------------------ the library */
  var FILTERS = [['', 'All'], ['portfolio', 'Portfolio'], ['find', 'Field log'], ['post', 'Blog'], ['page', 'Pages'], ['unused', 'Not used']];
  var libState = { filter: '', q: '' };
  function picMatches(p) {
    var f = libState.filter;
    if (f === 'unused' && p.uses.length) return false;
    if (f && f !== 'unused' && !p.uses.some(function (u) { return u.kind === f; })) return false;
    if (!libState.q) return true;
    var hay = norm([p.path, p.caption].concat(p.uses.map(function (u) { return u.label; })).join(' '));
    return hay.indexOf(norm(libState.q)) >= 0;
  }
  function tile(p, onClick, selected) {
    var li = el('li', 'up-tile');
    var b = el('button', 'up-tile-btn' + (selected ? ' is-on' : ''));
    b.type = 'button';
    if (selected !== undefined) b.setAttribute('aria-pressed', selected ? 'true' : 'false');
    var im = el('img'); im.loading = 'lazy'; im.decoding = 'async'; im.alt = p.caption || p.path.replace(/^.*\//, ''); im.src = srcOf(p.path);
    b.appendChild(im);
    var marks = el('span', 'up-marks');
    var kinds = { portfolio: 'Portfolio', find: 'Field log', post: 'Blog', page: 'Page' };
    Object.keys(kinds).forEach(function (k) { if (p.uses.some(function (u) { return u.kind === k; })) marks.appendChild(el('span', 'up-mark up-mark-' + k, kinds[k])); });
    if (!p.uses.length) marks.appendChild(el('span', 'up-mark up-mark-unused', 'Not used'));
    b.appendChild(marks);
    if (p.caption) b.appendChild(el('span', 'up-tile-cap', p.caption));
    b.addEventListener('click', function () { onClick(p, b); });
    li.appendChild(b);
    return li;
  }
  var picked = {}; // pictures chosen in select mode, by path
  function selecting() { return $('library').classList.contains('is-selecting'); }
  function onTile(p, b) {
    if (!selecting()) return openPic(p);
    if (picked[p.path]) delete picked[p.path]; else picked[p.path] = true;
    b.classList.toggle('is-on', !!picked[p.path]);
    b.setAttribute('aria-pressed', picked[p.path] ? 'true' : 'false');
    selectionChanged();
  }
  function selectionChanged() {
    var n = Object.keys(picked).length;
    $('sel-delete').disabled = !n || busy;
    $('sel-delete').textContent = n ? 'Delete ' + (n === 1 ? '1 picture' : n + ' pictures') + '…' : 'Delete…';
    $('sel-count').textContent = n ? n + ' chosen' : 'Tap pictures to choose them';
  }
  function setSelecting(on) {
    $('library').classList.toggle('is-selecting', on);
    $('lib-select').textContent = on ? 'Cancel' : 'Select';
    $('lib-select').setAttribute('aria-pressed', on ? 'true' : 'false');
    $('sel-bar').hidden = !on;
    if (!on) picked = {};
    hideConfirm('lib');
    renderLibrary();
    selectionChanged();
  }
  $('lib-select').addEventListener('click', function () { setSelecting(!selecting()); });
  $('sel-all').addEventListener('click', function () {
    S.pics.filter(picMatches).forEach(function (p) { picked[p.path] = true; });
    renderLibrary(); selectionChanged();
  });
  function renderLibrary() {
    var box = $('lib-filters');
    box.textContent = '';
    FILTERS.forEach(function (f) {
      var n = S.pics.filter(function (p) { return f[0] === '' ? true : f[0] === 'unused' ? !p.uses.length : p.uses.some(function (u) { return u.kind === f[0]; }); }).length;
      var b = el('button', 'up-filter' + (libState.filter === f[0] ? ' is-on' : ''), f[1] + ' ' + n);
      b.type = 'button';
      b.setAttribute('aria-pressed', libState.filter === f[0] ? 'true' : 'false');
      b.addEventListener('click', function () { libState.filter = f[0]; renderLibrary(); });
      box.appendChild(b);
    });
    var grid = $('lib-grid');
    grid.textContent = '';
    var shown = S.pics.filter(picMatches);
    shown.forEach(function (p) { grid.appendChild(tile(p, onTile, selecting() ? !!picked[p.path] : undefined)); });
    $('lib-msg').textContent = shown.length ? '' : (S.pics.length ? 'No pictures match.' : 'No pictures yet.');
  }
  $('lib-search').addEventListener('input', function () { libState.q = this.value.trim(); renderLibrary(); });

  /* ---------- one picture, opened ---------- */
  var cur = null; // { p, links: [{id}|{species}|{find}] }
  var dlg = $('pic');
  function sizeIcon(c, r) {
    var ns = 'http://www.w3.org/2000/svg', svg = doc.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 20 20'); svg.setAttribute('width', '20'); svg.setAttribute('height', '20'); svg.setAttribute('aria-hidden', 'true');
    var frame = doc.createElementNS(ns, 'rect');
    frame.setAttribute('x', '0.5'); frame.setAttribute('y', '0.5'); frame.setAttribute('width', '19'); frame.setAttribute('height', '19'); frame.setAttribute('rx', '1.5');
    frame.setAttribute('fill', 'none'); frame.setAttribute('stroke', 'currentColor'); frame.setAttribute('stroke-opacity', '.45');
    var fill = doc.createElementNS(ns, 'rect');
    fill.setAttribute('x', '1.5'); fill.setAttribute('y', '1.5'); fill.setAttribute('width', String(c * 17 / 3)); fill.setAttribute('height', String(r * 17 / 3)); fill.setAttribute('rx', '1');
    fill.setAttribute('fill', 'currentColor');
    svg.appendChild(frame); svg.appendChild(fill);
    return svg;
  }
  function sizeRadios(row, name, weight, onChange) {
    row.textContent = '';
    SIZES.forEach(function (s) {
      var lab = el('label', 'up-size');
      var inp = el('input'); inp.type = 'radio'; inp.name = name; inp.value = s[0];
      if (s[0] === weight) inp.checked = true;
      var span = el('span');
      span.appendChild(sizeIcon(s[2], s[3]));
      span.appendChild(doc.createTextNode(s[0] + ' ' + s[1]));
      lab.appendChild(inp); lab.appendChild(span); row.appendChild(lab);
      inp.addEventListener('change', function () { if (onChange) onChange(s[0]); });
    });
  }
  function fillPostSelect(sel) {
    var keep = sel.value;
    while (sel.options.length > 1) sel.remove(1);
    S.posts.forEach(function (p) { var o = el('option', null, p.title + (p.date ? ' — ' + p.date : '')); o.value = p.slug; sel.appendChild(o); });
    sel.value = keep;
  }
  function linkLabel(l) {
    if (l.find) return l.find.name + ' · ' + shortDate(l.find.date) + ' · new sighting';
    if (l.species) return l.species + ' (species only)';
    var s = sightingById(l.id);
    return s ? s.name + ' · ' + sightingLabel(s) : l.id;
  }
  function renderLinks() {
    var box = $('pic-sightings');
    box.textContent = '';
    cur.links.forEach(function (l, i) {
      var c = el('li', 'up-chip', linkLabel(l));
      var x = el('button', null, '×'); x.type = 'button'; x.setAttribute('aria-label', 'Remove ' + linkLabel(l));
      x.addEventListener('click', function () { cur.links.splice(i, 1); renderLinks(); });
      c.appendChild(x); box.appendChild(c);
    });
    if (!cur.links.length) box.appendChild(el('li', 'up-small up-none', 'Not linked to any sighting.'));
  }
  function openPic(p) {
    var g = p.g || {};
    cur = { p: p, links: [] };
    arr(g.sightings).forEach(function (id) { cur.links.push({ id: id }); });
    var named = {};
    cur.links.forEach(function (l) { var s = sightingById(l.id); if (s) named[norm(s.name)] = 1; });
    (Array.isArray(g.species) ? g.species : g.species ? [g.species] : []).forEach(function (n) { if (n && !named[norm(n)]) cur.links.push({ species: n }); });
    $('pic-img').src = srcOf(p.path);
    $('pic-img').alt = p.caption || '';
    $('pic-path').textContent = p.path.replace(/^\//, '');
    var used = $('pic-used');
    used.textContent = '';
    if (!p.uses.length) used.appendChild(el('li', 'up-small', 'Not used anywhere yet.'));
    p.uses.forEach(function (u) {
      var li = el('li', 'up-use up-use-' + u.kind);
      if (u.href) { var a = el('a', null, u.label); a.href = u.href; a.target = '_blank'; a.rel = 'noopener'; li.appendChild(a); }
      else li.textContent = u.label;
      used.appendChild(li);
    });
    $('pic-caption').value = g.caption || '';
    $('pic-portfolio').checked = !!p.g && g.onPhotoPage !== false;
    sizeRadios($('pic-sizes'), 'pic-size', Math.min(5, Math.max(1, +g.weight || 1)));
    $('pic-focus').value = g.focus || 'center';
    $('pic-pf').hidden = !$('pic-portfolio').checked;
    $('pic-post').value = g.post || '';
    syncInPost();
    $('pic-add').open = false;
    $('ps-species').value = '';
    fillSightings($('ps-sighting'), '', '');
    $('ps-new').hidden = false;
    $('ps-date').value = isoDay(new Date());
    $('pic-status').textContent = ''; $('pic-status').className = 'up-status';
    hideConfirm('pic');
    renderLinks();
    if (!dlg.open) { if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); }
  }
  function syncInPost() {
    var slug = $('pic-post').value, p = postBySlug(slug);
    var inText = p && p.text.indexOf(cur.p.path) >= 0;
    $('pic-inpost-l').hidden = !slug || inText;
    if (!slug || inText) $('pic-inpost').checked = false;
  }
  $('pic-post').addEventListener('change', syncInPost);
  $('pic-portfolio').addEventListener('change', function () { $('pic-pf').hidden = !this.checked; });
  $('pic-close').addEventListener('click', function () { dlg.close(); });
  $('ps-species').addEventListener('change', function () {
    var info = fillSightings($('ps-sighting'), this.value, '');
    $('ps-group-l').hidden = info.known;
    if (info.group) $('ps-group').value = info.group;
    $('ps-new').hidden = $('ps-sighting').value !== 'new';
  });
  $('ps-sighting').addEventListener('change', function () { $('ps-new').hidden = this.value !== 'new'; });
  $('ps-add').addEventListener('click', function () {
    var name = latinName($('ps-species').value);
    if (!name) { $('ps-species').focus(); return; }
    var info = speciesInfo(name), v = $('ps-sighting').value;
    if (v !== 'new') { if (!cur.links.some(function (l) { return l.id === v; })) cur.links.push({ id: v }); }
    else {
      var date = $('ps-date').value || isoDay(new Date());
      cur.links.push({ find: { id: newId(date), name: info.name || name, date: date, place: $('ps-place').value.trim(), group: info.group || $('ps-group').value, common: info.en, commonDa: info.da } });
    }
    cur.links = cur.links.filter(function (l) { return !(l.species && norm(l.species) === norm(name)); });
    $('pic-add').open = false; $('ps-species').value = ''; $('ps-place').value = '';
    renderLinks();
  });
  /* ---------- deleting pictures: the file, and every place that shows it ---------- */
  function deletePlan(paths) { return E.deletePlan(paths, { images: S.images, posts: S.posts, texts: S.texts }); }
  /* the confirm step, shown in the picture's window ('pic') or under the library ('lib') */
  function showConfirm(where, paths) {
    var box = $(where + '-confirm'), uses = [];
    paths.forEach(function (path) {
      (S.byPath[path] || { uses: [] }).uses.forEach(function (u) { if (uses.indexOf(u.label) < 0) uses.push(u.label); });
    });
    var list = box.querySelector('.up-confirm-uses');
    list.textContent = '';
    uses.forEach(function (u) { list.appendChild(el('li', null, u)); });
    box.querySelector('.up-confirm-what').textContent = (paths.length === 1 ? 'This picture is' : paths.length + ' pictures are') +
      ' deleted from the website' + (uses.length ? ' and taken out of:' : '. ' + (paths.length === 1 ? 'It isn’t' : 'They aren’t') + ' used anywhere.');
    list.hidden = !uses.length;
    box.hidden = false;
    box.querySelector('.up-danger').focus();
  }
  function hideConfirm(where) { var box = $(where + '-confirm'); if (box) box.hidden = true; }
  function doDelete(paths, st, done) {
    if (busy || !paths.length) return;
    busy = true;
    st.textContent = 'Deleting…'; st.className = 'up-status';
    var plan = deletePlan(paths);
    var name = paths.length === 1 ? paths[0].replace(/^.*\//, '') : paths.length + ' pictures';
    commit('Photos: delete ' + name, plan).then(function () {
      paths.forEach(function (p) { if (S.temp[p]) { URL.revokeObjectURL(S.temp[p]); delete S.temp[p]; } delete picked[p]; });
      // pictures in the New form that were just deleted go too
      items.filter(function (it) { return it.path && paths.indexOf(it.path) >= 0; }).forEach(function (it) { it.li.remove(); });
      items = items.filter(function (it) { return !(it.path && paths.indexOf(it.path) >= 0); });
      refreshNew();
      return loadAll().then(function () {
        done();
        st.textContent = 'Deleted ✓ ' + (paths.length === 1 ? 'It’s' : 'They’re') + ' off the site in a minute or two.'; st.className = 'up-status ok';
      });
    }).catch(function (e) {
      st.textContent = explain(e).replace('Nothing was saved', 'Nothing was deleted'); st.className = 'up-status err';
    }).then(function () { busy = false; selectionChanged(); });
  }
  $('pic-delete').addEventListener('click', function () { if (cur) showConfirm('pic', [cur.p.path]); });
  $('pic-confirm-no').addEventListener('click', function () { hideConfirm('pic'); $('pic-delete').focus(); });
  $('pic-confirm-yes').addEventListener('click', function () {
    var path = cur.p.path;
    doDelete([path], $('pic-status'), function () { hideConfirm('pic'); if (dlg.open) dlg.close(); $('lib-msg').textContent = ''; });
  });
  $('sel-delete').addEventListener('click', function () { showConfirm('lib', Object.keys(picked)); });
  $('lib-confirm-no').addEventListener('click', function () { hideConfirm('lib'); $('sel-delete').focus(); });
  $('lib-confirm-yes').addEventListener('click', function () {
    doDelete(Object.keys(picked), $('sel-status'), function () { hideConfirm('lib'); setSelecting(false); });
  });

  $('pic-newpost').addEventListener('click', function () {
    var p = cur.p;
    dlg.close();
    showTab('new');
    addLibraryItem(p);
    $('want-post').checked = true; partsChanged();
  });

  /* Changes to one picture's entry in the library, used by both forms */
  function applyEntry(doc0, path, set) {
    var list = doc0.images = arr(doc0.images);
    var g = list.filter(function (x) { return x && same(x.image) === path; })[0];
    if (!g) {
      g = { image: path, caption: '' };
      if (set.portfolio) list.unshift(g); else list.push(g);
    }
    if (set.caption !== undefined) g.caption = set.caption;
    if (set.portfolio !== undefined) {
      if (set.portfolio) {
        delete g.onPhotoPage;
        // a size 1–5 chosen here replaces a width × height set on the photography page
        if (set.weight && set.weight !== (g.weight || 1)) { delete g.width; delete g.height; }
        g.weight = set.weight || g.weight || 1;
        if (set.focus && set.focus !== 'center') g.focus = set.focus; else if (set.focus) delete g.focus;
      }
      else g.onPhotoPage = false;
    }
    if (set.sightings) { if (set.sightings.length) g.sightings = set.sightings; else delete g.sightings; }
    if (set.addSighting && arr(g.sightings).indexOf(set.addSighting) < 0) g.sightings = arr(g.sightings).concat([set.addSighting]);
    if (set.species) { if (set.species.length) g.species = set.species; else delete g.species; }
    if (set.addSpecies) {
      var sp = Array.isArray(g.species) ? g.species : g.species ? [g.species] : [];
      if (!sp.some(function (n) { return norm(n) === norm(set.addSpecies); })) sp.push(set.addSpecies);
      g.species = sp;
    }
    if (set.post !== undefined) { if (set.post) g.post = set.post; else delete g.post; }
    // "Keep metadata": it stays in the file; marked here so the photo inbox leaves it alone, with the parts to sort by
    if (set.meta) {
      g.keepMetadata = true;
      ['taken', 'camera', 'lens', 'lat', 'lon'].forEach(function (k) { if (set.meta[k] !== undefined && set.meta[k] !== '') g[k] = set.meta[k]; });
    }
    if (set.postIfEmpty && !g.post) g.post = set.postIfEmpty;
    return g;
  }
  /* new sightings, and ids for hand-added sightings that are linked for the first time */
  function applyFieldlog(cfg, newFinds, ids) {
    cfg.manual = arr(cfg.manual);
    ids.forEach(function (id) {
      var raw = String(id).replace(/^manual:/, '');
      if (cfg.manual.some(function (m) { return m && m.id === raw; })) return;
      Object.keys(provisional).forEach(function (k) {
        if (provisional[k] !== raw) return;
        var parts = k.split('|');
        var m = cfg.manual.filter(function (x) { return x && !x.id && norm(x.name) === parts[0] && String(x.date || '').slice(0, 10) === parts[1]; })[0];
        if (m) { var copy = { id: raw }; Object.keys(m).forEach(function (key) { copy[key] = m[key]; }); cfg.manual[cfg.manual.indexOf(m)] = copy; }
      });
    });
    newFinds.forEach(function (f) {
      if (cfg.manual.some(function (m) { return m && m.id === f.id; })) return;
      var m = { id: f.id, name: f.name };
      if (f.common) m.common = f.common;
      if (f.commonDa) m.commonDa = f.commonDa;
      m.group = f.group || 'other';
      m.date = f.date;
      if (f.place) m.place = f.place;
      if (f.notes) m.notes = f.notes;
      cfg.manual.push(m);
    });
    return cfg;
  }
  function addToPostText(text, path, alt) {
    if (text.indexOf(path) >= 0) return text;
    return text.replace(/\s*$/, '') + '\n\n![' + String(alt || '').replace(/[\[\]]/g, '') + '](' + path + ')\n';
  }
  $('pic-save').addEventListener('click', function () {
    if (busy || !cur) return;
    var p = cur.p, st = $('pic-status');
    var w = doc.querySelector('#pic-sizes input:checked');
    var newFinds = cur.links.filter(function (l) { return l.find; }).map(function (l) { return l.find; });
    var ids = cur.links.filter(function (l) { return l.id; }).map(function (l) { return l.id; }).concat(newFinds.map(function (f) { return 'manual:' + f.id; }));
    var species = [];
    cur.links.forEach(function (l) {
      var n = l.find ? l.find.name : l.species ? l.species : (sightingById(l.id) || {}).name;
      if (n && !species.some(function (x) { return norm(x) === norm(n); })) species.push(n);
    });
    var set = { caption: $('pic-caption').value.trim(), portfolio: $('pic-portfolio').checked, weight: w ? +w.value : 1, focus: $('pic-focus').value,
      sightings: ids, species: species, post: $('pic-post').value };
    var edits = [{ path: 'content/gallery.json', fn: function (t) {
      var d0; try { d0 = t ? JSON.parse(t) : { images: [] }; } catch (e) { throw new Error('content/gallery.json can’t be read'); }
      applyEntry(d0, p.path, set);
      return jsonText(d0, t ? /\n$/.test(t) : true);
    } }];
    var manualIds = ids.filter(function (id) { return /^manual:/.test(id); });
    if (newFinds.length || manualIds.length) edits.push({ path: 'content/fieldlog.json', fn: function (t) {
      var c; try { c = t ? JSON.parse(t) : {}; } catch (e) { throw new Error('content/fieldlog.json can’t be read'); }
      var before = JSON.stringify(c);
      applyFieldlog(c, newFinds, manualIds);
      return JSON.stringify(c) === before ? t : jsonText(c, t ? /\n$/.test(t) : true);
    } });
    var postSlug = $('pic-post').value, pp = postBySlug(postSlug);
    if (pp && $('pic-inpost').checked) edits.push({ path: pp.path, fn: function (t) { return t === null ? null : addToPostText(t, p.path, set.caption || pp.title); } });
    busy = true; $('pic-save').disabled = true;
    st.textContent = 'Saving…'; st.className = 'up-status';
    commit('Photos: ' + (set.caption || p.path.replace(/^.*\//, '')), { edits: edits }).then(function () {
      return loadAll().then(function () {
        var np = S.byPath[p.path];
        if (np && dlg.open) openPic(np); // show where it's used now
        st.textContent = 'Saved ✓ On the site in a minute or two.'; st.className = 'up-status ok';
      });
    }).catch(function (e) {
      st.textContent = explain(e); st.className = 'up-status err';
    }).then(function () { busy = false; $('pic-save').disabled = false; });
  });

  /* ------------------------------------------------------------------ tabs */
  function showTab(which) {
    var lib = which === 'library';
    $('library').hidden = !lib; $('new').hidden = lib;
    $('tab-lib').setAttribute('aria-selected', lib ? 'true' : 'false');
    $('tab-new').setAttribute('aria-selected', lib ? 'false' : 'true');
    try { history.replaceState(null, '', lib ? '#library' : location.pathname + location.search); } catch (e) { /* file:// */ }
  }
  $('tab-new').addEventListener('click', function () { showTab('new'); });
  $('tab-lib').addEventListener('click', function () { showTab('library'); });
  if (location.hash === '#library') showTab('library');

  /* ------------------------------------------------------------------ New: pictures, a find, a post */
  var items = [], nextId = 1;
  var list = $('list'), statusEl = $('status'), sendBtn = $('send');
  function makeCard(it) {
    var li = $('card-tpl').content.firstElementChild.cloneNode(true);
    it.li = li;
    var img = li.querySelector('.up-thumb');
    img.src = it.url; img.alt = '';
    li.querySelector('.up-from').textContent = it.path ? 'From the library · ' + it.path.replace(/^.*\//, '') : 'New · ' + it.file.name;
    var g = it.path ? galleryEntry(it.path) : null;
    li.querySelector('.up-caption').value = g ? g.caption || '' : '';
    var pf = li.querySelector('.up-portfolio');
    pf.checked = g ? g.onPhotoPage !== false : store.get('uploadPortfolio') !== '0';
    var weight = g ? Math.min(5, Math.max(1, +g.weight || 1)) : Math.min(5, Math.max(1, parseInt(store.get('uploadWeight'), 10) || 1));
    li.setAttribute('data-w', weight);
    sizeRadios(li.querySelector('.up-size-row'), 'size-' + it.id, weight, function (w) { li.setAttribute('data-w', w); store.set('uploadWeight', String(w)); });
    var focus = li.querySelector('.up-focus');
    focus.value = g && g.focus || 'center';
    img.style.objectPosition = POS[focus.value];
    focus.addEventListener('change', function () { img.style.objectPosition = POS[focus.value] || POS.center; });
    var pfBox = li.querySelector('.up-pf');
    pfBox.hidden = !pf.checked;
    pf.addEventListener('change', function () { pfBox.hidden = !pf.checked; if (!it.path) store.set('uploadPortfolio', pf.checked ? '1' : '0'); });
    showMeta(it);
    li.querySelector('.up-caption').addEventListener('input', prefill);
    li.querySelector('.up-in-post').addEventListener('change', prefill);
    li.querySelector('.up-remove').addEventListener('click', function () {
      if (busy) return;
      if (it.file) URL.revokeObjectURL(it.url);
      items = items.filter(function (x) { return x !== it; });
      li.remove();
      refreshNew();
    });
    list.appendChild(li);
  }
  /* "Keep metadata" on a new picture: offered when the photo carries any */
  function showMeta(it) {
    if (!it.li) return;
    var box = it.li.querySelector('.up-loc'), keep = it.li.querySelector('.up-keep-l'), note = it.li.querySelector('.up-loc-note');
    box.hidden = !it.file;
    if (!it.file) return;
    var x = it.meta, m = x && x.meta || {};
    keep.hidden = !(x && x.keep);
    if (!x) { note.textContent = ''; return; }
    var has = [m.camera, m.lens, m.taken ? 'taken ' + shortDate(m.taken) + (m.taken.length > 10 ? ' ' + m.taken.slice(11, 16) : '') : '',
      x.gps ? 'at ' + x.gps.lat.toFixed(4) + ', ' + x.gps.lon.toFixed(4) : ''].filter(Boolean).join(' · ');
    note.textContent = x.keep
      ? (has ? has + '. ' : '') + 'If kept, anyone can read all of it from the photo' + (x.gps ? ', the exact spot included' : '') + '. Otherwise it’s removed.'
      : 'No metadata in this photo, so there’s none to keep.';
  }
  function addFile(file) {
    var it = { id: nextId++, file: file, url: URL.createObjectURL(file), taken: '', meta: null };
    items.push(it);
    makeCard(it);
    /* the day it was taken, and what else the photo says about itself, read here from its own data */
    E.exif(file).then(function (x) {
      it.taken = x.date; it.meta = x;
      showMeta(it);
      if (items[0] === it) prefillFindDate();
    });
  }
  function addLibraryItem(p) {
    if (items.some(function (x) { return x.path === p.path; })) return;
    var it = { id: nextId++, path: p.path, url: srcOf(p.path), taken: '' };
    items.push(it);
    makeCard(it);
    refreshNew();
  }
  $('files').addEventListener('change', function () {
    if (busy) return;
    statusEl.textContent = ''; statusEl.className = 'up-status';
    Array.prototype.forEach.call(this.files || [], function (f) { if (/^image\//.test(f.type) || /\.(heic|heif|jpe?g|png|webp)$/i.test(f.name)) addFile(f); });
    this.value = '';
    refreshNew();
  });

  /* choosing pictures from the library */
  var picker = $('picker');
  $('from-lib').addEventListener('click', function () {
    if (!S.loaded) { statusEl.textContent = 'The library is still loading…'; return; }
    var grid = $('picker-grid');
    grid.textContent = '';
    S.pics.forEach(function (p) {
      var on = items.some(function (x) { return x.path === p.path; });
      grid.appendChild(tile(p, function (pp, b) {
        var have = items.filter(function (x) { return x.path === pp.path; })[0];
        if (have) { have.li.remove(); items = items.filter(function (x) { return x !== have; }); b.classList.remove('is-on'); b.setAttribute('aria-pressed', 'false'); }
        else { addLibraryItem(pp); b.classList.add('is-on'); b.setAttribute('aria-pressed', 'true'); }
        refreshNew();
      }, on));
    });
    if (picker.showModal) picker.showModal(); else picker.setAttribute('open', '');
  });
  $('picker-close').addEventListener('click', function () { picker.close(); });

  /* the find */
  var touched = { title: false, text: false, date: false };
  function partsChanged() {
    $('find').hidden = !$('want-find').checked;
    $('post').hidden = !$('want-post').checked;
    $('new').classList.toggle('has-find', $('want-find').checked);
    $('new').classList.toggle('has-post', $('want-post').checked);
    prefill();
    refreshNew();
  }
  $('want-find').addEventListener('change', partsChanged);
  $('want-post').addEventListener('change', partsChanged);
  function findInfo() {
    var name = $('f-species').value.trim();
    return name ? speciesInfo(name) : null;
  }
  function onSpecies() {
    var info = findInfo();
    var first = items[0];
    fillSightings($('f-sighting'), $('f-species').value, (first && first.taken) || $('f-date').value);
    $('f-newspecies').hidden = !info || info.known;
    $('f-known').textContent = !info ? '' : info.known
      ? (info.en || info.da ? (info.en || info.da) + ' · ' : '') + (GROUP[info.group] || '') + ' · ' + info.sightings.length + (info.sightings.length === 1 ? ' sighting' : ' sightings') + ' in the log'
      : 'New in the field log.';
    if (info && info.known && info.group) $('f-group').value = info.group;
    onSighting();
  }
  function onSighting() {
    $('f-new').hidden = $('f-sighting').value !== 'new';
    prefill();
    refreshNew();
  }
  function prefillFindDate() {
    if (touched.date) return;
    var first = items.filter(function (x) { return x.taken; })[0];
    $('f-date').value = first ? first.taken : ($('f-date').value || isoDay(new Date()));
    if ($('f-species').value) onSpecies(); else prefill();
  }
  $('f-species').addEventListener('change', onSpecies);
  $('f-species').addEventListener('input', onSpecies);
  $('f-sighting').addEventListener('change', onSighting);
  $('f-date').addEventListener('change', function () { touched.date = true; prefill(); });
  ['f-place', 'f-common', 'f-commonda'].forEach(function (id) { $(id).addEventListener('input', prefill); });
  $('f-group').addEventListener('change', function () { store.set('uploadGroup', this.value); });
  $('f-group').value = store.get('uploadGroup') || 'fungi';

  /* the post: title and text start filled in from the find and the pictures */
  function chosenSighting() {
    if (!$('want-find').checked) return null;
    var name = latinName($('f-species').value);
    if (!name) return null;
    var info = speciesInfo(name), v = $('f-sighting').value;
    if (v !== 'new') { var s = sightingById(v); return s ? { name: s.name, date: s.date, place: s.place, en: info.en, da: info.da } : null; }
    return { name: info.known ? info.name : name, date: $('f-date').value, place: $('f-place').value.trim(),
      en: info.known ? info.en : $('f-common').value.trim(), da: info.known ? info.da : $('f-commonda').value.trim() };
  }
  function prefill() {
    if (!$('want-post').checked) return;
    var lang = $('p-lang').value, s = chosenSighting();
    var cap = items.map(function (it) { return it.li.querySelector('.up-caption').value.trim(); }).filter(Boolean)[0] || '';
    if (!touched.title) {
      var common = s ? (lang === 'da' ? s.da : s.en) : ''; // a Danish name doesn't go in an English title
      $('p-title').value = s ? (common ? common.charAt(0).toUpperCase() + common.slice(1) + ' (' + s.name + ')' : s.name) : cap;
    }
    if (!touched.text) {
      var t = '';
      if (s) {
        var link = (lang === 'da' ? 'fieldlog.da.html' : 'fieldlog.html') + '#sp=' + encodeURIComponent(s.name);
        var common2 = lang === 'da' ? s.da : s.en;
        t = lang === 'da'
          ? '*' + s.name + '*' + (common2 ? ' (' + common2 + ')' : '') + ' — fra min [feltlog](' + link + ')' + (s.date ? ', set ' + longDate(s.date, 'da') : '') + (s.place ? ' i ' + s.place : '') + '.'
          : '*' + s.name + '*' + (common2 ? ' (' + common2 + ')' : '') + ' — from my [field log](' + link + ')' + (s.date ? ', seen on ' + longDate(s.date, 'en') : '') + (s.place ? ' in ' + s.place : '') + '.';
      }
      $('p-text').value = t;
    }
  }
  $('p-title').addEventListener('input', function () { touched.title = true; refreshNew(); });
  $('p-text').addEventListener('input', function () { touched.text = true; });
  $('p-lang').addEventListener('change', prefill);

  function refreshNew() {
    var wantFind = $('want-find').checked, wantPost = $('want-post').checked;
    var ready = S.loaded && (items.length > 0 || wantFind || wantPost);
    sendBtn.disabled = busy || !ready;
    var parts = [];
    if (items.length) parts.push(items.length === 1 ? '1 picture' : items.length + ' pictures');
    if (wantFind) parts.push('a find');
    if (wantPost) parts.push('a post');
    sendBtn.textContent = parts.length ? 'Publish ' + parts.join(' + ') : 'Publish';
  }

  /* ---------- publishing ---------- */
  function status(text, kind, links) {
    statusEl.textContent = text;
    statusEl.className = 'up-status' + (kind ? ' ' + kind : '');
    (links || []).forEach(function (l) {
      statusEl.appendChild(doc.createTextNode(' '));
      var a = el('a', null, l.text); a.href = l.href; statusEl.appendChild(a);
    });
  }
  function check() {
    if ($('want-find').checked) {
      if (!$('f-species').value.trim()) return { field: 'f-species', msg: 'Which species is the find?' };
      if ($('f-sighting').value === 'new' && !/^\d{4}-\d{2}-\d{2}$/.test($('f-date').value)) return { field: 'f-date', msg: 'When was it found?' };
      if ($('f-sighting').value !== 'new' && !items.length && !$('want-post').checked) return { field: 'f-sighting', msg: 'That sighting is already in the log: add pictures or a post to go with it.' };
    }
    if ($('want-post').checked && !$('p-title').value.trim()) return { field: 'p-title', msg: 'The post needs a title.' };
    return null;
  }
  sendBtn.addEventListener('click', function () {
    if (busy) return;
    var bad = check();
    if (bad) { status(bad.msg, 'err'); $(bad.field).focus(); return; }
    busy = true; refreshNew();
    var today = isoDay(new Date());
    var wantFind = $('want-find').checked, wantPost = $('want-post').checked;
    var batch = items.slice(), files = [];
    // the find: an existing sighting, or a new one
    var sightingId = '', newFind = null, speciesName = '';
    if (wantFind) {
      var info = speciesInfo($('f-species').value);
      speciesName = info.known ? info.name : latinName($('f-species').value);
      if ($('f-sighting').value !== 'new') sightingId = $('f-sighting').value;
      else {
        var date = $('f-date').value;
        newFind = { id: newId(date), name: speciesName, date: date, place: $('f-place').value.trim(),
          group: info.known ? info.group || $('f-group').value : $('f-group').value,
          common: info.known ? '' : $('f-common').value.trim(), commonDa: info.known ? '' : $('f-commonda').value.trim(), // a known species has its names already
          notes: $('f-note').value.trim() };
        sightingId = 'manual:' + newFind.id;
      }
    }
    // the post
    var slug = '', postPath = '';
    if (wantPost) {
      var base = today + '-' + (slugify($('p-title').value) || 'post'), n = 2;
      slug = base;
      while (postBySlug(slug)) slug = base + '-' + (n++);
      postPath = 'content/posts/' + slug + '.md';
    }
    var prep = batch.reduce(function (p, it, i) {
      return p.then(function () {
        it.caption = it.li.querySelector('.up-caption').value.trim();
        it.portfolio = it.li.querySelector('.up-portfolio').checked;
        var w = it.li.querySelector('.up-size input:checked');
        it.weight = w ? +w.value : 1;
        it.focus = it.li.querySelector('.up-focus').value;
        it.inFind = wantFind && it.li.querySelector('.up-in-find').checked;
        it.inPost = wantPost && it.li.querySelector('.up-in-post').checked;
        if (it.path) return null;
        status('Preparing picture ' + (i + 1) + ' of ' + batch.length + '…');
        it.keep = it.meta && it.meta.keep && it.li.querySelector('.up-keep-loc').checked ? it.meta : null;
        return E.shrink(it.file, it.keep && it.keep.keep).then(function (r) {
          it.path = '/images/gallery/' + (it.taken || today) + '-' + (slugify(it.caption || speciesName || 'photo').slice(0, 40) || 'photo') + '-' + r.hash + '.jpg';
          it.isNew = true;
          it.preview = URL.createObjectURL(r.blob);
          files.push({ path: it.path.slice(1), content: r.b64, encoding: 'base64' });
        });
      });
    }, Promise.resolve());
    prep.then(function () {
      var edits = [];
      var inPost = batch.filter(function (it) { return it.inPost; });
      if (batch.length) edits.push({ path: 'content/gallery.json', fn: function (t) {
        var d0; try { d0 = t ? JSON.parse(t) : { images: [] }; } catch (e) { throw new Error('content/gallery.json can’t be read'); }
        // new portfolio pictures go to the top, in the order chosen
        batch.slice().reverse().forEach(function (it) {
          var set = { portfolio: it.portfolio, weight: it.weight, focus: it.focus };
          if (it.caption || it.isNew) set.caption = it.caption;
          if (it.isNew && it.keep) set.meta = it.keep.meta;
          if (it.inFind) { set.addSighting = sightingId; set.addSpecies = speciesName; }
          if (it.inPost) set.postIfEmpty = slug;
          applyEntry(d0, it.path, set);
        });
        return jsonText(d0, t ? /\n$/.test(t) : true);
      } });
      if (wantFind) edits.push({ path: 'content/fieldlog.json', fn: function (t) {
        var c; try { c = t ? JSON.parse(t) : {}; } catch (e) { throw new Error('content/fieldlog.json can’t be read'); }
        var before = JSON.stringify(c);
        applyFieldlog(c, newFind ? [newFind] : [], /^manual:/.test(sightingId) ? [sightingId] : []);
        if (wantPost) { // the find's card gets "Read about this find"
          c.finds = arr(c.finds);
          var f = c.finds.filter(function (x) { return x && norm(x.species) === norm(speciesName); })[0];
          if (!f) { f = { species: speciesName }; c.finds.push(f); }
          if (!f.post) f.post = slug;
        }
        return JSON.stringify(c) === before ? t : jsonText(c, t ? /\n$/.test(t) : true);
      } });
      if (wantPost) {
        var lang = $('p-lang').value, s = chosenSighting();
        var info2 = wantFind ? speciesInfo(speciesName) : null;
        var group = newFind ? newFind.group : info2 && info2.group;
        var tags = wantFind ? ['Field log'].concat(group ? [(lang === 'da' ? GROUP_DA : GROUP)[group] || group] : []) : (batch.some(function (it) { return it.portfolio; }) ? ['Photography'] : []);
        var q = function (x) { return JSON.stringify(String(x)); };
        var fm = ['---', 'title: ' + q($('p-title').value.trim()), 'date: ' + today, 'language: ' + lang];
        if ($('p-summary').value.trim()) fm.push('summary: ' + q($('p-summary').value.trim()));
        if (inPost.length) fm.push('cover: ' + q(inPost[0].path));
        if (tags.length) { fm.push('tags:'); tags.forEach(function (t) { fm.push('  - ' + t); }); }
        if (s) fm.push('fieldlog: ' + q(s.name));
        fm.push('---', '');
        var body = $('p-text').value.replace(/\s+$/, '');
        inPost.slice(1).forEach(function (it) { body = addToPostText(body, it.path, it.caption || $('p-title').value.trim()); });
        files.push({ path: postPath, content: fm.join('\n') + (body ? body + '\n' : ''), encoding: 'utf-8' });
      }
      var what = [];
      if (batch.length) what.push(batch.length === 1 ? '1 picture' : batch.length + ' pictures');
      if (newFind) what.push('new sighting of ' + newFind.name);
      else if (wantFind) what.push(speciesName);
      if (wantPost) what.push('post “' + $('p-title').value.trim() + '”');
      status('Publishing…');
      return commit('New: ' + what.join(', '), { files: files, edits: edits });
    }).then(function () {
      var links = [];
      if (wantPost) links.push({ text: 'Open the post', href: 'post.html?slug=' + encodeURIComponent(slug) });
      if (wantFind) links.push({ text: 'Open the field log', href: 'fieldlog.html#sp=' + encodeURIComponent(speciesName) });
      if (batch.some(function (it) { return it.portfolio; })) links.push({ text: 'Open the photography page', href: D.photography || 'photography.html' });
      batch.forEach(function (it) { if (it.isNew) S.temp[it.path] = it.preview; });
      // a fresh form for the next one
      items.forEach(function (it) { if (it.file) URL.revokeObjectURL(it.url); });
      items = []; list.textContent = '';
      ['f-species', 'f-place', 'f-common', 'f-commonda', 'f-note', 'p-title', 'p-summary', 'p-text'].forEach(function (id) { $(id).value = ''; });
      $('want-find').checked = false; $('want-post').checked = false;
      touched = { title: false, text: false, date: false };
      partsChanged();
      status('Published ✓ On the site in a minute or two.', 'ok', links);
      return loadAll();
    }).catch(function (e) {
      status(explain(e), 'err');
    }).then(function () { busy = false; refreshNew(); });
  });
  window.addEventListener('beforeunload', function (e) { if (busy) { e.preventDefault(); e.returnValue = ''; } });

  partsChanged();
  start();
})();
