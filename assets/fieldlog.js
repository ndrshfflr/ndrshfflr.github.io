/* The field log (fieldlog.html / fieldlog.da.html).
 *
 * Two files are combined here, every time the page loads:
 *   content/observations.json – finds pulled nightly from iNaturalist,
 *                               Svampeatlas, Arter.dk and DOFbasen
 *                               (src/sync_observations.py, do not edit)
 *   content/fieldlog.json     – your choices from the CMS: hidden finds and
 *                               species, cover photos, notes, goals and
 *                               finds you add by hand
 * so hiding or adding something shows up as soon as it is published.
 */
(function () {
  'use strict';
  var grid = document.getElementById('fl-grid');
  if (!grid) return;

  var LANG = (document.documentElement.lang || 'en').slice(0, 2);
  var UI = {};
  try { UI = JSON.parse(document.getElementById('ui-strings').textContent); } catch (e) {}
  var TEXT = {};
  try { TEXT = JSON.parse(document.getElementById('fl-text').textContent); } catch (e) {}
  var GROUPS = UI.flGroups || {};
  var GROUP_ORDER = ['fungi', 'birds', 'insects', 'arachnids', 'mammals', 'herps', 'fish', 'molluscs', 'plants', 'other'];
  var SOURCE = { inaturalist: 'iNaturalist', svampeatlas: 'Svampeatlas', arter: 'Arter.dk', dofbasen: 'DOFbasen', manual: UI.flNotebook || 'Notebook' };
  var MONTHS = LANG === 'da'
    ? ['jan.', 'feb.', 'mar.', 'apr.', 'maj', 'jun.', 'jul.', 'aug.', 'sep.', 'okt.', 'nov.', 'dec.']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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
    var y = +iso.slice(0, 4), m = +iso.slice(5, 7), d = +iso.slice(8, 10);
    if (!m) return String(y);
    return LANG === 'da' ? d + '. ' + MONTHS[m - 1] + ' ' + y : d + ' ' + MONTHS[m - 1] + ' ' + y;
  }
  function pad(n) { return ('00' + n).slice(-3); }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function arr(x) { return Array.isArray(x) ? x : []; }
  function isSpecies(name) {
    var parts = String(name).trim().split(/\s+/);
    return parts.length >= 2 && !/^(sp|spp)\.?$/i.test(parts[1]);
  }
  // Photos from Svampeatlas and Arter.dk are full-size originals; GBIF's image
  // service makes a small copy. If that ever fails, the original is used.
  function thumb(url, size) {
    if (!url) return '';
    if (/inaturalist|static\.inaturalist/.test(url) || !/^https?:/.test(url)) return url;
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
      if (i.src !== url) i.src = url;
    });
    return i;
  }

  // ---------- merge synced finds with the CMS choices ----------
  function build(obs, cfg) {
    obs = obs || {};
    cfg = cfg || {};
    var sources = cfg.sources || {};
    var opts = cfg.options || {};
    var hidden = {}; arr(cfg.hide).forEach(function (id) { hidden[id] = 1; });
    var hiddenSp = {}; arr(cfg.hideSpecies).forEach(function (n) { hiddenSp[norm(n)] = 1; });
    var covers = {}; arr(cfg.covers).forEach(function (id) { covers[id] = 1; });
    var notes = {};
    arr(cfg.notes).forEach(function (n) {
      if (n && n.species && (n.text || n.textDa)) notes[norm(n.species)] = LANG === 'da' ? (n.textDa || n.text) : (n.text || n.textDa);
    });

    var items = arr(obs.items).filter(function (o) {
      if (!o || !o.name || hidden[o.id]) return false;
      var s = sources[o.source];
      return !(s && s.enabled === false);
    });
    arr(cfg.manual).forEach(function (m, i) {
      if (!m || !m.name) return;
      items.push({
        id: 'manual:' + i, source: 'manual', url: m.link || '', date: String(m.date || '').slice(0, 10),
        name: m.name.trim(), common_en: m.common || '', common_da: m.commonDa || '', group: m.group || 'other',
        photo: m.photo || '', place: m.place || '', note: m.notes || '', manualCover: !!m.photo
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
      var sp = byName[k];
      sp.recs.sort(function (a, b) { return (a.date || '9999').localeCompare(b.date || '9999'); });
      sp.first = sp.recs[0].date || '';
      sp.last = sp.recs[sp.recs.length - 1].date || '';
      var withPhoto = sp.recs.filter(function (r) { return r.photo; });
      var chosen = withPhoto.filter(function (r) { return covers[r.id] || r.manualCover; })[0];
      sp.cover = (chosen || withPhoto[withPhoto.length - 1] || {}).photo || '';
      sp.common = LANG === 'da' ? (sp.da || sp.en) : sp.en;
      sp.note = notes[k] || '';
      sp.isSpecies = isSpecies(sp.name);
      sp.search = norm([sp.name, sp.en, sp.da, GROUPS[sp.group]].join(' '));
      return sp;
    });
    // Numbered in the order first found (ties: alphabetical, so it stays stable).
    list.sort(function (a, b) { return (a.first || '9999').localeCompare(b.first || '9999') || a.name.localeCompare(b.name); });
    list.forEach(function (sp, i) { sp.no = i + 1; });
    return { list: list, records: items.length, goals: arr(cfg.goals), obs: obs };
  }

  // ---------- drawing ----------
  var state = { group: '', q: '', sort: 'number' };
  var data = null;
  var recentCut = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);

  function renderStats() {
    var year = String(new Date().getFullYear());
    var species = data.list.filter(function (s) { return s.isSpecies; }).length;
    var newYear = data.list.filter(function (s) { return s.first.slice(0, 4) === year; }).length;
    $('fl-stat-species').textContent = species;
    $('fl-stat-records').textContent = data.records;
    $('fl-stat-year').textContent = newYear;
    $('fl-stat-year-label').textContent = (UI.flThisYear || 'New this year') + ' (' + year + ')';
    $('fl-stats').hidden = false;
  }

  function countBy(group) {
    return data.list.filter(function (s) { return s.group === group && s.isSpecies; }).length;
  }

  function renderGoals() {
    var box = $('fl-goals');
    box.innerHTML = '';
    var goals = data.goals.filter(function (g) { return g && g.group && +g.target > 0; });
    goals.forEach(function (g) {
      var have = countBy(g.group), target = +g.target;
      var row = el('div', 'fl-goal');
      var head = el('div', 'fl-goal-head');
      head.appendChild(el('span', 'fl-goal-name', (LANG === 'da' ? (g.labelDa || g.label) : (g.label || g.labelDa)) || GROUPS[g.group] || g.group));
      head.appendChild(el('span', 'fl-goal-count', have + ' ' + (UI.flOf || 'of') + ' ' + target));
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
    var box = $('fl-chips');
    box.innerHTML = '';
    var present = GROUP_ORDER.filter(function (g) { return data.list.some(function (s) { return s.group === g; }); });
    var chips = [''].concat(present);
    chips.forEach(function (g) {
      var b = el('button', 'tag-chip' + (state.group === g ? ' is-on' : ''));
      b.type = 'button';
      b.setAttribute('aria-pressed', state.group === g ? 'true' : 'false');
      var n = g ? data.list.filter(function (s) { return s.group === g; }).length : data.list.length;
      b.appendChild(document.createTextNode(g ? (GROUPS[g] || g) : (UI.flAll || 'All')));
      b.appendChild(el('span', 'fl-chip-n', String(n)));
      b.addEventListener('click', function () { state.group = g; renderChips(); renderGrid(); });
      box.appendChild(b);
    });
  }

  function card(sp) {
    var li = el('li', 'fl-card' + (sp.cover ? '' : ' no-photo'));
    var b = el('button', 'fl-card-btn');
    b.type = 'button';
    b.setAttribute('data-key', sp.key);
    var ph = el('span', 'fl-photo');
    if (sp.cover) ph.appendChild(img(sp.cover, '', 360));
    else ph.appendChild(el('span', 'fl-photo-mark', sp.name.charAt(0)));
    b.appendChild(ph);
    var no = el('span', 'fl-no', 'Nº ' + pad(sp.no));
    b.appendChild(no);
    if (sp.first >= recentCut) b.appendChild(el('span', 'fl-new', UI.flNew || 'New'));
    var body = el('span', 'fl-card-body');
    body.appendChild(el('span', 'fl-group', GROUPS[sp.group] || ''));
    var nm = el('span', 'fl-name');
    nm.appendChild(el('em', null, sp.isSpecies || / sp\.?$/.test(sp.name) ? sp.name : sp.name + ' sp.'));
    body.appendChild(nm);
    if (sp.common) body.appendChild(el('span', 'fl-common', sp.common));
    var foot = el('span', 'fl-foot');
    foot.appendChild(el('span', 'fl-first', sp.first ? fmtDate(sp.first) : ''));
    if (sp.recs.length > 1) foot.appendChild(el('span', 'fl-count', '×' + sp.recs.length));
    body.appendChild(foot);
    b.appendChild(body);
    li.appendChild(b);
    return li;
  }

  function renderGrid() {
    var q = norm(state.q.trim());
    var list = data.list.filter(function (s) {
      return (!state.group || s.group === state.group) && (!q || s.search.indexOf(q) !== -1);
    }).slice();
    if (state.sort === 'newest') list.sort(function (a, b) { return (b.first || '').localeCompare(a.first || '') || b.no - a.no; });
    else if (state.sort === 'az') list.sort(function (a, b) { return a.name.localeCompare(b.name); });
    else if (state.sort === 'most') list.sort(function (a, b) { return b.recs.length - a.recs.length || a.no - b.no; });
    grid.innerHTML = '';
    var frag = document.createDocumentFragment();
    list.forEach(function (sp) { frag.appendChild(card(sp)); });
    grid.appendChild(frag);
    $('fl-nomatch').hidden = list.length > 0;
  }

  function renderSync() {
    var o = data.obs || {};
    var st = o.status || {};
    var parts = Object.keys(st).filter(function (k) { return st[k] && st[k].state === 'ok' && st[k].count; })
      .map(function (k) { return SOURCE[k] + ' ' + st[k].count; });
    var p = $('fl-sync');
    if (!o.updated && !parts.length) { p.hidden = true; return; }
    p.textContent = (o.updated ? (UI.flSynced || 'Last synced') + ' ' + fmtDate(o.updated.slice(0, 10)) : '') + (parts.length ? ' · ' + parts.join(' · ') : '');
    p.hidden = false;
  }

  // ---------- detail dialog ----------
  var dialog = $('fl-dialog');
  var lastFocus = null;
  function openSpecies(key) {
    var sp = data.list.filter(function (s) { return s.key === key; })[0];
    if (!sp || !dialog) return;
    lastFocus = document.activeElement;
    $('fl-d-no').textContent = 'Nº ' + pad(sp.no) + (GROUPS[sp.group] ? ' · ' + GROUPS[sp.group] : '');
    var nm = $('fl-d-name');
    nm.innerHTML = '';
    nm.appendChild(el('em', null, sp.name));
    $('fl-d-common').textContent = [sp.common, LANG === 'da' ? sp.en : sp.da].filter(function (x, i, a) { return x && a.indexOf(x) === i; }).join(' · ');
    $('fl-d-group').textContent = (UI.flFirst || 'First found') + ' ' + fmtDate(sp.first) +
      (sp.last && sp.last !== sp.first ? ' · ' + (UI.flLast || 'Last seen') + ' ' + fmtDate(sp.last) : '');
    var notes = $('fl-d-notes');
    notes.innerHTML = '';
    if (sp.note) sp.note.split(/\n+/).forEach(function (para) { if (para.trim()) notes.appendChild(el('p', null, para.trim())); });

    var photos = $('fl-d-photos');
    photos.innerHTML = '';
    var withPhoto = sp.recs.filter(function (r) { return r.photo; });
    var cover = withPhoto.filter(function (r) { return r.photo === sp.cover; })[0];
    var ordered = (cover ? [cover] : []).concat(withPhoto.filter(function (r) { return r !== cover; })).slice(0, 6);
    ordered.forEach(function (r, i) {
      var f = el('figure', i === 0 ? 'is-main' : '');
      f.appendChild(img(r.photo, i === 0 ? sp.name : '', i === 0 ? 900 : 300));
      photos.appendChild(f);
    });
    photos.hidden = ordered.length === 0;

    var recs = $('fl-d-recs');
    recs.innerHTML = '';
    sp.recs.slice().reverse().forEach(function (r) {
      var li = el('li');
      li.appendChild(el('span', 'fl-r-date', fmtDate(r.date)));
      li.appendChild(el('span', 'fl-r-place', r.place || ''));
      if (r.url) {
        var a = el('a', 'fl-r-src', SOURCE[r.source] || r.source);
        a.href = r.url; a.target = '_blank'; a.rel = 'noopener';
        a.title = UI.flOpenRecord || 'Open the record';
        li.appendChild(a);
      } else {
        li.appendChild(el('span', 'fl-r-src', SOURCE[r.source] || r.source));
      }
      if (r.note) li.appendChild(el('span', 'fl-r-note', r.note));
      recs.appendChild(li);
    });

    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    document.body.classList.add('fl-open');
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
      document.body.classList.remove('fl-open');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    });
  }
  grid.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.fl-card-btn');
    if (b) openSpecies(b.getAttribute('data-key'));
  });

  // ---------- controls ----------
  var search = $('fl-search');
  var sort = $('fl-sort');
  var timer = null;
  if (search) search.addEventListener('input', function () {
    clearTimeout(timer);
    timer = setTimeout(function () { state.q = search.value; renderGrid(); }, 120);
  });
  if (sort) sort.addEventListener('change', function () { state.sort = sort.value; renderGrid(); });

  // ---------- go ----------
  Promise.all([getJSON('content/observations.json'), getJSON('content/fieldlog.json')]).then(function (res) {
    data = build(res[0], res[1]);
    var empty = $('fl-empty');
    if (!data.list.length) {
      var t = window.__fieldlogText || TEXT;
      empty.textContent = t.emptyText || '';
      empty.setAttribute('data-state', 'empty');
      return;
    }
    empty.hidden = true;
    renderStats();
    renderGoals();
    renderChips();
    renderGrid();
    renderSync();
    $('fl-tools').hidden = false;
    var m = /^#n(\d+)$/.exec(location.hash);
    if (m) {
      var sp = data.list.filter(function (s) { return s.no === +m[1]; })[0];
      if (sp) openSpecies(sp.key);
    }
  });
})();
