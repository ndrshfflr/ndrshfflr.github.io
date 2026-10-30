/* The field log (fieldlog.html / fieldlog.da.html).
 *
 * Three files are combined here, every time the page loads:
 *   content/observations.json – finds pulled nightly from iNaturalist,
 *                               Svampeatlas, Arter.dk, DOFbasen and eBird
 *                               (src/sync_observations.py, do not edit)
 *   content/fieldlog.json     – your choices in /admin: favourites, extra
 *                               photos, stories, notes, hidden finds and
 *                               species, cover photos, goals and finds you
 *                               add by hand
 *   content/gallery.json      – photos linked to a species (Photo Gallery)
 * so anything you change shows up as soon as it is published.
 *
 * Signed in (the same sign-in as /admin or the upload page, on this device)
 * with a key that can change the website, you also get a ★ on every card and
 * "Use as cover" on every picture. Those save straight into
 * content/fieldlog.json ("Favourites, photos and stories" in /admin).
 *
 * The page stands in the circle's world: sky, header and rune language come
 * from assets/world.js. Species names, dates and places stay in Latin letters.
 */
(function () {
  'use strict';
  var W = window.World;
  var grid = document.getElementById('fl-grid');
  if (!grid || !W) return;

  var DATA = {};
  try { DATA = JSON.parse(document.getElementById('fl-data').textContent) || {}; } catch (e) { DATA = {}; }
  var TEXT = DATA.text || {};
  var GROUP_ORDER = ['fungi', 'birds', 'insects', 'arachnids', 'mammals', 'herps', 'fish', 'molluscs', 'plants', 'other'];
  var MONTHS = {
    da: ['jan.', 'feb.', 'mar.', 'apr.', 'maj', 'jun.', 'jul.', 'aug.', 'sep.', 'okt.', 'nov.', 'dec.'],
    en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  };
  var SLUG = /^[A-Za-z0-9._-]+$/;

  function L() { return W.latin(); }
  function U() { return W.U(); }
  function GROUPS() { return U().flGroups || {}; }
  function T() { return TEXT[L()] || TEXT[W.page] || {}; }
  function SOURCE(k) {
    return { inaturalist: 'iNaturalist', svampeatlas: 'Svampeatlas', arter: 'Arter.dk', dofbasen: 'DOFbasen', ebird: 'Merlin/eBird', manual: U().flNotebook || 'Notebook' }[k] || k;
  }
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null && text !== '') n.textContent = text;
    return n;
  }
  function getJSON(url) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
  }
  function fmtDate(iso) {
    if (!iso || iso.length < 10) return iso || '';
    var y = +iso.slice(0, 4), m = +iso.slice(5, 7), d = +iso.slice(8, 10), M = MONTHS[L()] || MONTHS.en;
    if (!m) return String(y);
    return L() === 'da' ? d + '. ' + M[m - 1] + ' ' + y : d + ' ' + M[m - 1] + ' ' + y;
  }
  function pad(n) { return ('00' + n).slice(-3); }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim(); }
  function arr(x) { return Array.isArray(x) ? x : []; }
  function isSpecies(name) {
    var parts = String(name).trim().split(/\s+/);
    return parts.length >= 2 && !/^(sp|spp)\.?$/i.test(parts[1]);
  }
  /* Photos on this site are used as they are. Full-size originals from
     Svampeatlas and Arter.dk get a small copy from GBIF's image service; if
     that ever fails, the original is used. */
  function thumb(url, size) {
    if (!url) return '';
    if (/^\//.test(url) || url.indexOf(location.origin + '/') === 0 || /ndrshfflr\.github\.io\//.test(url)) return url.replace(/^https?:\/\/ndrshfflr\.github\.io(?=\/)/, '');
    if (/inaturalist|birds\.cornell\.edu/.test(url) || !/^https?:/.test(url)) return url;
    return 'https://api.gbif.org/v1/image/unsafe/fit-in/' + (size || 480) + 'x' + (size || 480) + '/' + encodeURIComponent(url);
  }
  function img(url, alt, size) {
    var i = el('img');
    i.loading = 'lazy';
    i.decoding = 'async';
    i.alt = alt || '';
    i.src = thumb(url, size);
    i.addEventListener('error', function onErr() {
      i.removeEventListener('error', onErr);
      if (i.getAttribute('src') !== url) i.src = url;
    });
    return i;
  }
  function photoList(x) { // a photos list from /admin may hold strings or {src}
    return arr(x).map(function (p) { return typeof p === 'string' ? p : (p && (p.src || p.image || p.photo)) || ''; }).filter(Boolean);
  }
  function same(url) { return String(url || '').replace(/^https?:\/\/ndrshfflr\.github\.io(?=\/)/, ''); }
  /* every picture a species has: your own first (extra and hand-added), then
     the gallery, then the synced ones (newest first) */
  function pictures(sp) {
    var pics = sp.extra.map(function (p) { return { photo: p }; })
      .concat(sp.recs.filter(function (r) { return r.source === 'manual'; }).reduce(function (all, r) { return all.concat(arr(r.photos).map(function (p) { return { photo: p }; })); }, []))
      .concat(sp.gallery.map(function (g) { return { photo: g.image, caption: g.caption || '' }; }))
      .concat(sp.recs.filter(function (r) { return r.photo && r.source !== 'manual'; }).slice().reverse().map(function (r) { return { photo: r.photo }; }));
    var seen = {};
    return pics.filter(function (p) { var k = same(p.photo); if (!p.photo || seen[k]) return false; seen[k] = 1; return true; });
  }

  // ---------- merge synced finds with your choices ----------
  function build(obs, cfg, gallery) {
    obs = obs || {};
    cfg = cfg || {};
    // Photos from the gallery that are linked to a species (Photo Gallery → Species in the field log).
    var galleryBy = {};
    arr(gallery && gallery.images).forEach(function (g) {
      if (!g || !g.image) return;
      (Array.isArray(g.species) ? g.species : [g.species]).forEach(function (name) {
        if (name) (galleryBy[norm(name)] = galleryBy[norm(name)] || []).push(g);
      });
    });
    var sources = cfg.sources || {};
    var opts = cfg.options || {};
    var refs = obs.reference || {};
    var useRefPhotos = opts.referencePhotos !== false;
    var hidden = {}; arr(cfg.hide).forEach(function (id) { hidden[id] = 1; });
    var hiddenSp = {}; arr(cfg.hideSpecies).forEach(function (n) { hiddenSp[norm(n)] = 1; });
    var covers = {}; arr(cfg.covers).forEach(function (id) { covers[id] = 1; });

    /* per species: favourite, extra photos, a story (blog post) and a note */
    var extra = {};
    function ex(name) { var k = norm(name); return (extra[k] = extra[k] || { fav: false, photos: [], post: '', note: '', noteDa: '', cover: '' }); }
    arr(cfg.notes).forEach(function (n) { // older notes list
      if (n && n.species) { var e = ex(n.species); e.note = e.note || n.text || ''; e.noteDa = e.noteDa || n.textDa || ''; }
    });
    arr(cfg.finds).forEach(function (f) {
      if (!f || !f.species) return;
      var e = ex(f.species);
      if (f.favourite) e.fav = true;
      e.photos = e.photos.concat(photoList(f.photos));
      if (f.post && SLUG.test(f.post)) e.post = f.post;
      if (f.text) e.note = f.text;
      if (f.textDa) e.noteDa = f.textDa;
      if (f.cover) e.cover = photoList([f.cover])[0] || '';
    });

    var items = arr(obs.items).filter(function (o) {
      if (!o || !o.name || hidden[o.id]) return false;
      var s = sources[o.source];
      return !(s && s.enabled === false);
    });
    arr(cfg.manual).forEach(function (m, i) {
      if (!m || !m.name) return;
      var photos = photoList(m.photos);
      if (m.photo && photos.indexOf(m.photo) < 0) photos.unshift(m.photo);
      var e = ex(m.name);
      if (m.favourite) e.fav = true;
      if (m.post && SLUG.test(m.post) && !e.post) e.post = m.post;
      items.push({
        id: 'manual:' + i, source: 'manual', url: m.link || '', date: String(m.date || '').slice(0, 10),
        name: m.name.trim(), common_en: m.common || '', common_da: m.commonDa || '', group: m.group || 'other',
        photo: photos[0] || '', photos: photos, place: m.place || '', note: m.notes || '', manualCover: photos.length > 0
      });
    });

    var byName = {};
    items.forEach(function (o) {
      var key = norm(o.name);
      if (hiddenSp[key]) return;
      var sp = byName[key];
      if (!sp) sp = byName[key] = { key: key, name: o.name, en: '', da: '', group: '', recs: [], cover: '' };
      if (!sp.en && o.common_en) sp.en = o.common_en;
      if (!sp.da && o.common_da) sp.da = o.common_da;
      if (!sp.group || sp.group === 'other') sp.group = o.group || 'other';
      if (opts.showPlaces === false) o.place = '';
      sp.recs.push(o);
    });

    var list = Object.keys(byName).map(function (k) {
      var sp = byName[k], e = extra[k] || { fav: false, photos: [], post: '', note: '', noteDa: '', cover: '' };
      sp.recs.sort(function (a, b) { return (a.date || '9999').localeCompare(b.date || '9999'); });
      sp.first = sp.recs[0].date || '';
      sp.last = sp.recs[sp.recs.length - 1].date || '';
      sp.fav = e.fav;
      sp.post = e.post;
      sp.extra = e.photos;
      var withPhoto = sp.recs.filter(function (r) { return r.photo; });
      var chosen = withPhoto.filter(function (r) { return covers[r.id]; })[0] || withPhoto.filter(function (r) { return r.manualCover; })[0];
      sp.gallery = galleryBy[k] || [];
      sp.cover = (chosen && chosen.photo) || sp.extra[0] || (sp.gallery[0] && sp.gallery[0].image) || (withPhoto[withPhoto.length - 1] || {}).photo || '';
      // a cover picked on the page ("Use as cover") wins, as long as the species still has that picture
      sp.pinned = false;
      if (e.cover) {
        var hit = pictures(sp).filter(function (p) { return same(p.photo) === same(e.cover); })[0];
        if (hit) { sp.cover = hit.photo; sp.pinned = true; }
      }
      // No photo or Danish name of your own: fall back to the reference from
      // iNaturalist (openly licensed, credited, and only until you have your own).
      var ref = refs[sp.name] || {};
      if (!sp.da && ref.da && ref.da.toLowerCase() !== (sp.en || '').toLowerCase()) sp.da = ref.da;
      sp.ref = null;
      if (!sp.cover && useRefPhotos && ref.photo) { sp.cover = ref.photo; sp.ref = ref; }
      sp.noteEn = e.note; sp.noteDa = e.noteDa;
      sp.isSpecies = isSpecies(sp.name);
      return sp;
    });
    // Numbered in the order first found (ties: alphabetical, so it stays stable).
    list.sort(function (a, b) { return (a.first || '9999').localeCompare(b.first || '9999') || a.name.localeCompare(b.name); });
    list.forEach(function (sp, i) { sp.no = i + 1; });
    return { list: list, records: items.length, goals: arr(cfg.goals), obs: obs };
  }
  function common(sp) { return L() === 'da' ? (sp.da || sp.en) : sp.en; }
  function note(sp) { return L() === 'da' ? (sp.noteDa || sp.noteEn) : (sp.noteEn || sp.noteDa); }
  function searchText(sp) { return norm([sp.name, sp.en, sp.da, GROUPS()[sp.group]].join(' ')); }

  // ---------- drawing ----------
  var state = { group: '', q: '', sort: 'latest' };
  var data = null;
  var recentCut = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);

  function renderText() {
    var t = T(), u = U();
    W.say('eyebrow', t.eyebrow || '');
    W.say('heading', t.heading || '');
    W.say('intro', t.intro || '');
    W.say('st-species', u.flSpecies);
    W.say('st-records', u.flRecords);
    W.say('st-year', (u.flThisYear || 'New this year') + ' (' + new Date().getFullYear() + ')');
    W.say('loading', data && !data.list.length ? (t.emptyText || '') : u.loading);
    W.say('nomatch', u.flNoMatch);
    W.say('back', u.back);
    W.say('readAbout', u.flReadAbout);
    W.say('fromBlog', u.flFromBlog);
    W.say('records', u.flRecords);
    $('fl-search').placeholder = u.flSearch || '';
    var sort = $('fl-sort');
    ['latest', 'number', 'newest', 'az', 'most'].forEach(function (v, i) {
      var key = { latest: 'flSortLatest', number: 'flSortNumber', newest: 'flSortNewest', az: 'flSortAz', most: 'flSortMost' }[v];
      if (sort.options[i] && u[key]) sort.options[i].textContent = u[key];
    });
  }

  function renderStats() {
    var year = String(new Date().getFullYear());
    $('fl-stat-species').textContent = data.list.filter(function (s) { return s.isSpecies; }).length;
    $('fl-stat-records').textContent = data.records;
    $('fl-stat-year').textContent = data.list.filter(function (s) { return s.first.slice(0, 4) === year; }).length;
    $('fl-stats').hidden = false;
  }

  function countBy(group) {
    return data.list.filter(function (s) { return s.group === group && s.isSpecies; }).length;
  }

  function renderGoals() {
    var box = $('fl-goals'), u = U();
    box.textContent = '';
    var goals = data.goals.filter(function (g) { return g && g.group && +g.target > 0; });
    goals.forEach(function (g) {
      var have = countBy(g.group), target = +g.target;
      var row = el('div', 'fl-goal');
      var head = el('div', 'fl-goal-head');
      var name = el('span', 'fl-goal-name');
      name.appendChild(W.rv((L() === 'da' ? (g.labelDa || g.label) : (g.label || g.labelDa)) || GROUPS()[g.group] || g.group));
      head.appendChild(name);
      head.appendChild(el('span', 'fl-goal-count', have + ' ' + (u.flOf || 'of') + ' ' + target));
      row.appendChild(head);
      var bar = el('div', 'fl-goal-bar');
      bar.setAttribute('role', 'progressbar');
      bar.setAttribute('aria-valuemin', '0');
      bar.setAttribute('aria-valuemax', String(target));
      bar.setAttribute('aria-valuenow', String(Math.min(have, target)));
      var fill = el('span');
      fill.style.width = Math.min(100, have / target * 100).toFixed(1) + '%';
      bar.appendChild(fill);
      row.appendChild(bar);
      box.appendChild(row);
    });
    box.hidden = goals.length === 0;
  }

  function renderChips() {
    var box = $('fl-chips'), u = U();
    box.textContent = '';
    var favs = data.list.filter(function (s) { return s.fav; }).length;
    if (!favs && state.group === 'fav') state.group = '';
    var present = GROUP_ORDER.filter(function (g) { return data.list.some(function (s) { return s.group === g; }); });
    var chips = (favs ? ['fav'] : []).concat(['']).concat(present);
    chips.forEach(function (g) {
      var on = state.group === g;
      var b = el('button', 'fl-chip' + (on ? ' is-on' : '') + (g === 'fav' ? ' is-fav' : ''));
      b.type = 'button';
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      var n = g === 'fav' ? favs : g ? data.list.filter(function (s) { return s.group === g; }).length : data.list.length;
      if (g === 'fav') b.appendChild(el('span', 'fl-star', '★'));
      b.appendChild(W.rv(g === 'fav' ? (u.flFavourites || 'Favourites') : g ? (GROUPS()[g] || g) : (u.flAll || 'All')));
      b.appendChild(el('span', 'fl-chip-n', String(n)));
      b.addEventListener('click', function () { state.group = g; renderChips(); renderGrid(); });
      box.appendChild(b);
    });
  }

  function card(sp) {
    var u = U();
    var li = el('li', 'fl-card' + (sp.cover ? '' : ' no-photo') + (sp.ref ? ' is-ref' : '') + (sp.fav ? ' is-fav' : ''));
    var b = el('button', 'fl-card-btn');
    b.type = 'button';
    b.setAttribute('data-key', sp.key);
    var label = 'Nº ' + pad(sp.no) + ' ' + sp.name + (common(sp) ? ', ' + common(sp) : '') + (sp.fav ? ', ' + (u.flFavourite || 'favourite') : '') + (sp.post ? ', ' + (u.flHasStory || 'has a story') : '');
    b.setAttribute('aria-label', label);
    var ph = el('span', 'fl-photo');
    if (sp.cover) ph.appendChild(img(sp.cover, '', 360));
    else ph.appendChild(el('span', 'fl-photo-mark', sp.name.charAt(0)));
    if (sp.ref) {
      var tag = el('span', 'fl-ref-tag', u.flRefShort || 'Ref. photo');
      tag.title = (u.flRefPhoto || 'Reference photo') + ': ' + (sp.ref.credit || '') + ' · iNaturalist';
      ph.appendChild(tag);
    }
    ph.appendChild(el('span', 'fl-no', 'Nº ' + pad(sp.no)));
    var marks = el('span', 'fl-marks');
    if (sp.fav && !edit.on) { var st = el('span', 'fl-mark fl-mark-fav', '★'); st.title = u.flFavourite || 'Favourite'; marks.appendChild(st); }
    if (sp.post) { var sr = el('span', 'fl-mark fl-mark-story', 'ᚬ'); sr.title = u.flHasStory || 'Has a story'; marks.appendChild(sr); }
    if (marks.firstChild) ph.appendChild(marks);
    if (sp.first >= recentCut) ph.appendChild(el('span', 'fl-new', u.flNew || 'New'));
    b.appendChild(ph);
    var body = el('span', 'fl-card-body');
    body.appendChild(el('span', 'fl-group', GROUPS()[sp.group] || ''));
    var nm = el('span', 'fl-name');
    nm.appendChild(el('em', null, sp.isSpecies || / sp\.?$/.test(sp.name) ? sp.name : sp.name + ' sp.'));
    body.appendChild(nm);
    if (common(sp)) body.appendChild(el('span', 'fl-common', common(sp)));
    var foot = el('span', 'fl-foot');
    // the date that fits the order: latest sighting, or when it was first found
    var when = state.sort === 'number' || state.sort === 'newest' ? sp.first : sp.last;
    foot.appendChild(el('span', 'fl-first', when ? fmtDate(when) : ''));
    if (sp.recs.length > 1) foot.appendChild(el('span', 'fl-count', '×' + sp.recs.length));
    body.appendChild(foot);
    b.appendChild(body);
    li.appendChild(b);
    if (edit.on) li.appendChild(favButton(sp, 'fl-fav-btn'));
    return li;
  }

  function renderGrid() {
    var q = norm(state.q);
    var list = data.list.filter(function (s) {
      var inGroup = !state.group || (state.group === 'fav' ? s.fav : s.group === state.group);
      return inGroup && (!q || searchText(s).indexOf(q) !== -1);
    }).slice();
    if (state.sort === 'latest') list.sort(function (a, b) { return (b.last || '').localeCompare(a.last || '') || b.no - a.no; });
    else if (state.sort === 'newest') list.sort(function (a, b) { return (b.first || '').localeCompare(a.first || '') || b.no - a.no; });
    else if (state.sort === 'az') list.sort(function (a, b) { return a.name.localeCompare(b.name); });
    else if (state.sort === 'most') list.sort(function (a, b) { return b.recs.length - a.recs.length || a.no - b.no; });
    else list.sort(function (a, b) { return a.no - b.no; });
    grid.textContent = '';
    var frag = document.createDocumentFragment();
    list.forEach(function (sp) { frag.appendChild(card(sp)); });
    grid.appendChild(frag);
    $('fl-nomatch').hidden = list.length > 0;
  }

  function renderSync() {
    var o = data.obs || {}, u = U();
    var st = o.status || {};
    var parts = Object.keys(st).filter(function (k) { return st[k] && st[k].state === 'ok' && st[k].count; })
      .map(function (k) { return SOURCE(k) + ' ' + st[k].count; });
    var p = $('fl-sync');
    if (!o.updated && !parts.length) { p.hidden = true; return; }
    p.textContent = (o.updated ? (u.flSynced || 'Last synced') + ' ' + fmtDate(o.updated.slice(0, 10)) : '') + (parts.length ? ' · ' + parts.join(' · ') : '');
    p.hidden = false;
  }

  function renderAll() {
    renderText();
    if (!data || !data.list.length) return;
    renderStats();
    renderGoals();
    renderChips();
    renderGrid();
    renderSync();
    if (current) openSpecies(current, true);
  }

  // ---------- detail dialog ----------
  var dialog = $('fl-dialog');
  var lastFocus = null, current = null;
  var titles = DATA.posts || {};
  function postTitle(slug, a) {
    if (titles[slug]) { a.textContent = titles[slug]; return; }
    a.textContent = slug.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/-/g, ' ');
    fetch('content/posts/' + slug + '.md', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.text() : ''; }).then(function (t) {
      var m = /^---[\s\S]*?\ntitle:\s*["']?(.+?)["']?\s*\n[\s\S]*?---/.exec(t);
      if (m) { titles[slug] = m[1]; a.textContent = m[1]; }
    }).catch(function () {});
  }
  function showMain(fig) {
    var photos = $('fl-d-photos');
    Array.prototype.forEach.call(photos.querySelectorAll('.fl-d-thumb'), function (t) { t.setAttribute('aria-pressed', t === fig.thumb ? 'true' : 'false'); });
    var main = photos.querySelector('.fl-d-main');
    main.textContent = '';
    main.appendChild(img(fig.photo, fig.alt, 1000));
    if (fig.caption) main.appendChild(el('figcaption', null, fig.caption));
    if (edit.on && fig.sp) main.appendChild(coverButton(fig.sp, fig.photo));
  }
  function openSpecies(key, refresh) {
    var sp = data.list.filter(function (s) { return s.key === key; })[0];
    if (!sp || !dialog) return;
    var u = U();
    current = key;
    if (!refresh) lastFocus = document.activeElement;
    $('fl-d-no').textContent = 'Nº ' + pad(sp.no) + (GROUPS()[sp.group] ? ' · ' + GROUPS()[sp.group] : '') + (sp.fav ? ' · ★ ' + (u.flFavourite || 'Favourite') : '');
    var nm = $('fl-d-name');
    nm.textContent = '';
    nm.appendChild(el('em', null, sp.name));
    $('fl-d-common').textContent = [common(sp), L() === 'da' ? sp.en : sp.da].filter(function (x, i, a) { return x && a.indexOf(x) === i; }).join(' · ');
    $('fl-d-group').textContent = (u.flFirst || 'First found') + ' ' + fmtDate(sp.first) +
      (sp.last && sp.last !== sp.first ? ' · ' + (u.flLast || 'Last seen') + ' ' + fmtDate(sp.last) : '');
    var story = $('fl-d-story');
    story.hidden = !sp.post;
    if (sp.post) story.href = 'post.html?slug=' + encodeURIComponent(sp.post);
    var editRow = $('fl-d-edit');
    if (editRow) editRow.remove();
    if (edit.on) {
      editRow = el('div', 'fl-d-edit');
      editRow.id = 'fl-d-edit';
      editRow.appendChild(favButton(sp, 'fl-d-fav'));
      editRow.appendChild(el('span', 'fl-edit-status' + (edit.kind ? ' ' + edit.kind : ''), edit.msg));
      $('fl-d-group').insertAdjacentElement('afterend', editRow);
    }
    var notes = $('fl-d-notes');
    notes.textContent = '';
    if (note(sp)) note(sp).split(/\n+/).forEach(function (para) { if (para.trim()) notes.appendChild(el('p', null, para.trim())); });

    // photos: the cover first, then your own, the gallery, and the synced ones
    var photos = $('fl-d-photos');
    photos.textContent = '';
    var pics = pictures(sp);
    var cover = pics.filter(function (p) { return same(p.photo) === same(sp.cover); })[0];
    if (cover) pics = [cover].concat(pics.filter(function (p) { return p !== cover; }));
    pics = pics.slice(0, 12);
    if (pics.length) {
      photos.appendChild(el('figure', 'fl-d-main'));
      if (pics.length > 1) {
        var strip = el('div', 'fl-d-strip');
        pics.forEach(function (p, i) {
          var t = el('button', 'fl-d-thumb');
          t.type = 'button';
          t.setAttribute('aria-label', (u.flPhoto || 'Photo') + ' ' + (i + 1));
          t.appendChild(img(p.photo, '', 200));
          p.thumb = t; p.alt = sp.name; p.sp = sp;
          t.addEventListener('click', function () { showMain(p); });
          strip.appendChild(t);
        });
        photos.appendChild(strip);
      }
      pics[0].alt = sp.name; pics[0].sp = sp;
      showMain(pics[0]);
    } else if (sp.ref) {
      var rf = el('figure', 'fl-d-main is-ref');
      rf.appendChild(img(sp.ref.photo, sp.name, 1000));
      var cap = el('figcaption', 'fl-ref-credit');
      cap.appendChild(document.createTextNode((u.flRefPhoto || 'Reference photo') + ' · ' + (sp.ref.credit || '') + ' · '));
      var src = el('a', null, 'iNaturalist');
      src.href = 'https://www.inaturalist.org/taxa/' + (sp.ref.inat || encodeURIComponent(sp.name));
      src.target = '_blank'; src.rel = 'noopener';
      cap.appendChild(src);
      rf.appendChild(cap);
      photos.appendChild(rf);
    }
    photos.hidden = !photos.firstChild;
    $('fl-dialog').classList.toggle('no-photos', !photos.firstChild);

    // Other blog posts that photos of this species are linked to.
    var slugs = [];
    sp.gallery.forEach(function (g) { if (g.post && SLUG.test(g.post) && g.post !== sp.post && slugs.indexOf(g.post) < 0) slugs.push(g.post); });
    var blog = $('fl-d-posts');
    blog.textContent = '';
    $('fl-d-blog').hidden = slugs.length === 0;
    slugs.forEach(function (slug) {
      var li = el('li');
      var a = el('a');
      a.href = 'post.html?slug=' + encodeURIComponent(slug);
      postTitle(slug, a);
      li.appendChild(a);
      blog.appendChild(li);
    });

    var recs = $('fl-d-recs');
    recs.textContent = '';
    sp.recs.slice().reverse().forEach(function (r) {
      var li = el('li');
      li.appendChild(el('span', 'fl-r-date', fmtDate(r.date)));
      li.appendChild(el('span', 'fl-r-place', r.place || ''));
      if (r.url) {
        var a = el('a', 'fl-r-src', SOURCE(r.source));
        a.href = r.url; a.target = '_blank'; a.rel = 'noopener';
        a.title = u.flOpenRecord || 'Open the record';
        li.appendChild(a);
      } else {
        li.appendChild(el('span', 'fl-r-src', SOURCE(r.source)));
      }
      if (r.note) li.appendChild(el('span', 'fl-r-note', r.note));
      recs.appendChild(li);
    });

    if (refresh) return;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    document.body.classList.add('fl-open');
    try { history.replaceState(null, '', '#sp=' + encodeURIComponent(sp.name)); } catch (e) { /* file:// */ }
    $('fl-d-close').focus();
  }
  function closeDialog() {
    if (!dialog) return;
    if (typeof dialog.close === 'function' && dialog.open) dialog.close();
    else dialog.removeAttribute('open');
  }
  if (dialog) {
    $('fl-d-close').addEventListener('click', closeDialog);
    dialog.addEventListener('click', function (e) { if (e.target === dialog) closeDialog(); });
    dialog.addEventListener('close', function () {
      current = null;
      document.body.classList.remove('fl-open');
      try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* file:// */ }
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    });
  }
  grid.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.fl-card-btn');
    if (b) openSpecies(b.getAttribute('data-key'));
  });

  // ---------- editing, when you're signed in ----------
  var raw = { obs: null, cfg: null, gallery: null };
  var edit = { on: false, token: '', login: '', sha: '', nl: true, queue: Promise.resolve(), pending: 0, msg: '', kind: '' };
  var API = 'https://api.github.com', FILE = 'content/fieldlog.json';
  /* redraw after a change, keeping the focus on the button you just used */
  function rebuild() {
    var a = document.activeElement, keep = '';
    ['fl-fav-btn', 'fl-d-fav', 'fl-d-cover', 'fl-card-btn'].forEach(function (c) { if (!keep && a && a.classList && a.classList.contains(c)) keep = c; });
    var key = keep && a.getAttribute('data-key');
    data = build(raw.obs, raw.cfg, raw.gallery);
    renderAll();
    if (keep) {
      var n = document.querySelector('.' + keep + (key ? '[data-key="' + key.replace(/["\\]/g, '\\$&') + '"]' : ''));
      if (n && n !== document.activeElement) n.focus({ preventScroll: true });
    }
  }
  function storedToken() {
    var get = function (k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
    var own = get('uploadAuth'); // the upload page's sign-in
    if (own && own.token) return own.token;
    var keys = ['decap-cms-user', 'netlify-cms-user']; // /admin's sign-in
    for (var i = 0; i < keys.length; i++) { var u = get(keys[i]); if (u && u.token) return u.token; }
    return '';
  }
  function gh(method, path, body) {
    var headers = { Authorization: 'Bearer ' + edit.token, Accept: 'application/vnd.github+json' };
    if (body) headers['Content-Type'] = 'application/json';
    return fetch(API + path, { method: method, headers: headers, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) { var err = new Error(j.message || ('HTTP ' + r.status)); err.status = r.status; throw err; }
        return j;
      });
    });
  }
  function fromB64(s) {
    var bin = atob(String(s).replace(/\s/g, '')), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  function toB64(text) {
    var bytes = new TextEncoder().encode(text), bin = '';
    for (var i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }
  function filePath() { return '/repos/' + DATA.repo + '/contents/' + FILE; }
  function readCfg() {
    return gh('GET', filePath() + '?ref=' + encodeURIComponent(DATA.branch || 'main')).then(function (f) {
      var text = fromB64(f.content);
      edit.sha = f.sha; edit.nl = /\n$/.test(text);
      return JSON.parse(text);
    });
  }
  function writeCfg(cfg, message) {
    var text = JSON.stringify(cfg, null, 2) + (edit.nl ? '\n' : '');
    return gh('PUT', filePath(), { message: message, content: toB64(text), sha: edit.sha, branch: DATA.branch || 'main' })
      .then(function (r) { edit.sha = r.content && r.content.sha; });
  }
  var sayTimer = null;
  function say(msg, kind) {
    clearTimeout(sayTimer);
    if (kind === 'ok') sayTimer = setTimeout(function () { say(''); }, 6000); // a saved note fades; errors stay
    edit.msg = msg || ''; edit.kind = kind || '';
    Array.prototype.forEach.call(document.querySelectorAll('.fl-edit-status'), function (n) {
      n.textContent = edit.msg; n.className = 'fl-edit-status' + (edit.kind ? ' ' + edit.kind : '');
    });
  }
  /* Show the change at once, then save it on top of the newest version of the
     file (so nothing done meanwhile in /admin is lost). */
  function change(message, mutate) {
    var u = U();
    var mine = JSON.parse(JSON.stringify(raw.cfg || {}));
    mutate(mine); raw.cfg = mine; rebuild();
    edit.pending++;
    say(u.flSaving || 'Saving…');
    edit.queue = edit.queue.then(function () {
      var attempt = function (n) {
        return readCfg().then(function (cfg) { mutate(cfg); return writeCfg(cfg, message).then(function () { return cfg; }); })
          .catch(function (e) { if ((e.status === 409 || e.status === 422) && n < 3) return attempt(n + 1); throw e; });
      };
      return attempt(1).then(function (cfg) {
        edit.pending--;
        if (!edit.pending) { raw.cfg = cfg; rebuild(); }
        say(u.flSaved || 'Saved.', 'ok');
      }, function (e) {
        edit.pending--;
        say((u.flSaveFailed || 'Couldn’t save') + ': ' + e.message, 'err');
        return readCfg().then(function (cfg) { raw.cfg = cfg; rebuild(); }).catch(function () {});
      });
    });
  }
  function findEntry(cfg, sp, create) {
    cfg.finds = arr(cfg.finds);
    var f = cfg.finds.filter(function (x) { return x && norm(x.species) === sp.key; })[0];
    if (!f && create) { f = { species: sp.name }; cfg.finds.push(f); }
    return f;
  }
  function tidy(cfg) { // drop entries that no longer say anything
    cfg.finds = arr(cfg.finds).filter(function (f) {
      return f && f.species && (f.favourite || f.story || f.post || f.text || f.textDa || f.cover || photoList(f.photos).length);
    });
  }
  function setFavourite(sp, on) {
    change((on ? 'Field log: ★ ' : 'Field log: no longer a favourite: ') + sp.name, function (cfg) {
      if (on) findEntry(cfg, sp, true).favourite = true;
      else {
        arr(cfg.finds).forEach(function (f) { if (f && norm(f.species) === sp.key) f.favourite = false; });
        arr(cfg.manual).forEach(function (m) { if (m && norm(m.name) === sp.key && m.favourite) m.favourite = false; });
      }
      tidy(cfg);
    });
  }
  function setCover(sp, photo) {
    change((photo ? 'Field log: new cover for ' : 'Field log: automatic cover for ') + sp.name, function (cfg) {
      var f = findEntry(cfg, sp, !!photo);
      if (f) { if (photo) f.cover = same(photo); else delete f.cover; }
      tidy(cfg);
    });
  }
  function favButton(sp, cls) {
    var u = U();
    var b = el('button', cls + (sp.fav ? ' is-on' : ''));
    b.type = 'button';
    b.setAttribute('data-key', sp.key);
    b.setAttribute('aria-pressed', sp.fav ? 'true' : 'false');
    var label = sp.fav ? (u.flFavRemove || 'Remove from favourites') : (u.flFavAdd || 'Mark as favourite');
    if (cls === 'fl-fav-btn') { b.textContent = sp.fav ? '★' : '☆'; b.setAttribute('aria-label', label + ': ' + sp.name); b.title = label; }
    else b.textContent = (sp.fav ? '★ ' : '☆ ') + label;
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      b.focus(); // Safari doesn't focus buttons on click; the redraw puts the focus back here
      setFavourite(sp, !sp.fav);
    });
    return b;
  }
  function coverButton(sp, photo) {
    var u = U(), isCover = same(photo) === same(sp.cover);
    if (isCover && !sp.pinned) return el('span', 'fl-d-cover is-on', '★ ' + (u.flIsCover || 'Cover'));
    var b = el('button', 'fl-d-cover' + (isCover ? ' is-on' : ''), isCover ? '★ ' + (u.flCoverAuto || 'Cover · back to automatic') : (u.flUseCover || 'Use as cover'));
    b.type = 'button';
    b.setAttribute('aria-pressed', isCover ? 'true' : 'false');
    b.addEventListener('click', function () { b.focus(); setCover(sp, isCover ? '' : photo); });
    return b;
  }
  function startEditing() {
    edit.token = storedToken();
    if (!edit.token || !DATA.repo || !window.TextDecoder) return;
    Promise.all([gh('GET', '/user'), gh('GET', '/repos/' + DATA.repo)]).then(function (r) {
      if (!r[1] || !r[1].permissions || !r[1].permissions.push) return null; // a sign-in that can't change the site
      edit.login = r[0].login || '';
      return readCfg().then(function (cfg) {
        raw.cfg = cfg; edit.on = true;
        document.body.classList.add('fl-editing');
        var bar = el('div', 'fl-edit');
        bar.id = 'fl-edit';
        bar.appendChild(el('span', 'fl-edit-who', (U().flEditing || 'Editing as') + ' @' + edit.login));
        var st = el('span', 'fl-edit-status');
        st.setAttribute('role', 'status');
        bar.appendChild(st);
        document.body.appendChild(bar);
        rebuild();
      });
    }).catch(function () { /* not signed in here, expired or offline: the page stays as it is */ });
  }

  // ---------- controls ----------
  var search = $('fl-search');
  var sort = $('fl-sort');
  var timer = null;
  search.addEventListener('input', function () {
    clearTimeout(timer);
    timer = setTimeout(function () { state.q = search.value; renderGrid(); }, 120);
  });
  sort.addEventListener('change', function () { state.sort = sort.value; renderGrid(); });
  sort.value = state.sort;

  // ---------- go ----------
  W.onRender(renderAll);
  Promise.all([getJSON('content/observations.json'), getJSON('content/fieldlog.json'), getJSON('content/gallery.json')]).then(function (res) {
    raw = { obs: res[0], cfg: res[1], gallery: res[2] };
    data = build(res[0], res[1], res[2]);
    var empty = $('fl-empty');
    if (!data.list.length) {
      renderText();
      empty.setAttribute('data-state', 'empty');
      return;
    }
    empty.hidden = true;
    $('fl-tools').hidden = false;
    renderAll();
    // fieldlog.html#n12 opens Nº 012; fieldlog.html#sp=Amanita%20muscaria opens that species.
    var m = /^#n(\d+)$/.exec(location.hash);
    var bySp = /^#sp=(.+)$/.exec(location.hash);
    var sp = m ? data.list.filter(function (s) { return s.no === +m[1]; })[0]
      : bySp ? data.list.filter(function (s) { return s.key === norm(decodeURIComponent(bySp[1])); })[0] : null;
    if (sp) openSpecies(sp.key);
    startEditing();
  });
  // wording edited in /admin (Main page → Field log) shows up without a rebuild
  Promise.all([getJSON('content/home.json'), getJSON('content/home.da.json')]).then(function (r) {
    if (r[0] && r[0].fieldlog) TEXT.en = r[0].fieldlog;
    if (r[1] && r[1].fieldlog) TEXT.da = r[1].fieldlog;
    renderText();
  });
})();
