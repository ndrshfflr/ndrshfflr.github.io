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
  var REPO = D.repo, BRANCH = D.branch || 'main', API = 'https://api.github.com';
  var LONG_SIDE = 2000, QUALITY = 0.86;
  var SIZES = [[1, 'small', 1, 1], [2, 'wide', 2, 1], [3, 'large', 2, 2], [4, 'larger', 3, 2], [5, 'largest', 3, 3]];
  var POS = { center: '50% 50%', top: '50% 18%', bottom: '50% 82%', left: '22% 50%', right: '78% 50%' };
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
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* private mode */ } }
  };
  var standalone = window.navigator.standalone === true || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
  var signin = $('signin'), work = $('work'), who = $('who'), signOut = $('sign-out');
  var auth = null, busy = false;

  /* ------------------------------------------------------------------ small helpers */
  function arr(x) { return Array.isArray(x) ? x : []; }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim(); }
  function same(url) { // every picture is known by its path on this site: /images/…
    var u = String(url || '').trim().replace(/^https?:\/\/ndrshfflr\.github\.io(?=\/)/, '');
    return /^images\//.test(u) ? '/' + u : u;
  }
  function isoDay(d) {
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }
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
  function slugify(t) {
    t = String(t || '').toLowerCase().replace(/æ/g, 'ae').replace(/ø/g, 'oe').replace(/å/g, 'aa').normalize('NFKD').replace(/[̀-ͯ]/g, '');
    return (t.match(/[a-z0-9]+/g) || []).join('-').slice(0, 50).replace(/-+$/, '');
  }
  function latinName(name) { name = String(name || '').trim().replace(/\s+/g, ' '); return name.charAt(0).toUpperCase() + name.slice(1); }
  function newId(date) {
    var r = new Uint8Array(2); (window.crypto || {}).getRandomValues ? crypto.getRandomValues(r) : (r[0] = Math.random() * 256, r[1] = Math.random() * 256);
    return 'm' + String(date || isoDay(new Date())).replace(/-/g, '') + '-' + ('0' + r[0].toString(16)).slice(-2) + ('0' + r[1].toString(16)).slice(-2);
  }
  function fromB64(s) {
    var bin = atob(String(s || '').replace(/\s/g, '')), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  function toB64(text) {
    var bytes = new TextEncoder().encode(text), bin = '';
    for (var i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }
  function jsonText(obj, nl) { return JSON.stringify(obj, null, 2) + (nl ? '\n' : ''); }

  /* ------------------------------------------------------------------ GitHub */
  function gh(method, path, body) {
    var headers = { Authorization: 'Bearer ' + auth.token, Accept: 'application/vnd.github+json' };
    if (body) headers['Content-Type'] = 'application/json';
    return fetch(API + path, { method: method, headers: headers, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' })
      .then(function (r) {
        return r.text().then(function (t) {
          var data = null;
          try { data = t ? JSON.parse(t) : null; } catch (e) { data = null; }
          if (!r.ok) { var err = new Error((data && data.message) || ('GitHub answered ' + r.status)); err.status = r.status; throw err; }
          return data;
        });
      });
  }
  function readFile(path, ref) { // → { text } or null when the file isn't there
    return gh('GET', '/repos/' + REPO + '/contents/' + path.split('/').map(encodeURIComponent).join('/') + '?ref=' + encodeURIComponent(ref || BRANCH))
      .then(function (f) { return { text: fromB64(f.content) }; }, function (e) { if (e.status === 404) return null; throw e; });
  }
  /* One commit with new files and changes to existing ones. Changes are
     functions applied to the newest version of each file, so nothing done
     meanwhile (in /admin, on the field log) is lost; if someone commits in
     between, it simply tries again on top. */
  function commit(message, plan) {
    var base = '/repos/' + REPO + '/git/', blobs = {};
    var blob = function (f) {
      if (blobs[f.path + '|' + f.content.length] && f.encoding === 'base64') return Promise.resolve(blobs[f.path + '|' + f.content.length]);
      return gh('POST', base + 'blobs', { content: f.content, encoding: f.encoding || 'utf-8' }).then(function (b) {
        if (f.encoding === 'base64') blobs[f.path + '|' + f.content.length] = b.sha;
        return b.sha;
      });
    };
    var attempt = function (n) {
      var head, files = (plan.files || []).slice();
      return gh('GET', base + 'ref/heads/' + encodeURIComponent(BRANCH)).then(function (ref) {
        head = ref.object.sha;
        return Promise.all((plan.edits || []).map(function (ed) {
          return readFile(ed.path, head).then(function (f) {
            var out = ed.fn(f ? f.text : null);
            if (out !== null && out !== undefined && (!f || out !== f.text)) files.push({ path: ed.path, content: out, encoding: 'utf-8' });
          });
        }));
      }).then(function () {
        if (!files.length) return 'nothing';
        return Promise.all(files.map(function (f) {
          return blob(f).then(function (sha) { return { path: f.path, mode: '100644', type: 'blob', sha: sha }; });
        })).then(function (tree) {
          return gh('GET', base + 'commits/' + head)
            .then(function (c) { return gh('POST', base + 'trees', { base_tree: c.tree.sha, tree: tree }); })
            .then(function (t) { return gh('POST', base + 'commits', { message: message, tree: t.sha, parents: [head] }); })
            .then(function (c) { return gh('PATCH', base + 'refs/heads/' + encodeURIComponent(BRANCH), { sha: c.sha }); });
        });
      }).catch(function (e) {
        if (e.status === 422 && n < 4) return attempt(n + 1); // someone else committed meanwhile
        throw e;
      });
    };
    return attempt(1);
  }
  function explain(e) {
    if (e.status === 401) return 'GitHub didn’t accept the sign-in (expired?). Sign in again — nothing was saved.';
    if (e.status === 403 || e.status === 404) return 'This sign-in can’t change the website (' + e.message + '). A key needs “Contents: Read and write” for ndrshfflr.github.io.';
    if (e instanceof TypeError) return 'No connection to GitHub — nothing was saved. Try again when you’re online.';
    return 'Something went wrong: ' + e.message + '. Nothing was saved; try again.';
  }

  /* ------------------------------------------------------------------ signing in */
  function findAuth() {
    try { var own = JSON.parse(store.get('uploadAuth') || 'null'); if (own && own.token) return own; } catch (e) { /* ignore */ }
    var keys = ['decap-cms-user', 'netlify-cms-user'];
    for (var i = 0; i < keys.length; i++) {
      try { var u = JSON.parse(store.get(keys[i]) || 'null'); if (u && u.token) return { token: u.token, via: 'admin' }; } catch (e) { /* ignore */ }
    }
    return null;
  }
  function showSignin(message) {
    auth = null;
    work.hidden = true; signOut.hidden = true; signin.hidden = false;
    $('signin-msg').textContent = message || (standalone ? 'Opened from the home screen: use a key (below) — GitHub sign-in can’t return to a home-screen app.' : '');
    if (standalone) $('key-box').open = true;
  }
  function start() {
    auth = findAuth();
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
        if (auth && auth.via !== 'admin') store.set('uploadAuth', null);
        showSignin(auth && auth.via === 'admin' ? 'Your /admin sign-in on this device has expired. Sign in again here.' : 'That sign-in no longer works (expired or wrong key). Sign in again.');
      } else {
        who.textContent = 'Couldn’t reach GitHub just now (' + e.message + ').';
      }
    });
  }
  $('gh-signin').addEventListener('click', function () {
    var proxy = String(D.proxy || '').replace(/\/$/, '');
    var origin;
    try { origin = new URL(proxy).origin; } catch (e) { $('signin-msg').textContent = 'Sign-in helper isn’t set up.'; return; }
    var url = proxy + '/' + (D.authEndpoint || 'auth') + '?provider=github&site_id=' + encodeURIComponent(location.host) + '&scope=public_repo';
    var popup = window.open(url, 'github-sign-in', 'width=620,height=760');
    if (!popup) { $('signin-msg').textContent = 'The sign-in window was blocked. Allow pop-ups for this page, or use a key below.'; return; }
    $('signin-msg').textContent = 'Finish signing in in the GitHub window…';
    var onMessage = function (e) {
      if (e.origin !== origin || typeof e.data !== 'string') return;
      if (e.data === 'authorizing:github') { e.source.postMessage(e.data, e.origin); return; }
      var m = /^authorization:github:(success|error):([\s\S]*)$/.exec(e.data);
      if (!m) return;
      window.removeEventListener('message', onMessage);
      var token = null;
      try { token = JSON.parse(m[2]).token; } catch (err) { token = null; }
      if (m[1] === 'success' && token) { store.set('uploadAuth', JSON.stringify({ token: token, via: 'github' })); start(); }
      else $('signin-msg').textContent = 'GitHub sign-in didn’t work. Try again, or use a key below.';
    };
    window.addEventListener('message', onMessage);
  });
  $('key-save').addEventListener('click', function () {
    var k = $('key').value.trim();
    if (!/^(github_pat_|ghp_|gho_)[A-Za-z0-9_]+$/.test(k)) { $('signin-msg').textContent = 'That doesn’t look like a GitHub key (it starts with github_pat_).'; return; }
    store.set('uploadAuth', JSON.stringify({ token: k, via: 'key' }));
    $('key').value = '';
    start();
  });
  signOut.addEventListener('click', function () {
    store.set('uploadAuth', null);
    showSignin('Signed out on this device.');
  });

  /* ------------------------------------------------------------------ the site's content */
  var S = { loaded: false, images: [], gallery: { images: [] }, galleryNL: true, cfg: {}, cfgNL: true, obs: {}, posts: [], texts: [], pics: [], byPath: {}, temp: {} };
  function loadAll() {
    $('lib-msg').textContent = 'Loading the pictures…';
    var R = '/repos/' + REPO;
    var list = function (dir) { return gh('GET', R + '/contents/' + dir + '?ref=' + encodeURIComponent(BRANCH)).catch(function () { return []; }); };
    return Promise.all([
      gh('GET', R + '/git/trees/' + encodeURIComponent(BRANCH) + '?recursive=1'),
      readFile('content/gallery.json'), readFile('content/fieldlog.json'), readFile('content/observations.json'),
      list('content/posts'), list('content/pages'),
      readFile('content/home.json'), readFile('content/home.da.json'), readFile('content/entry.json'), readFile('content/entry.da.json')
    ]).then(function (r) {
      S.images = arr(r[0] && r[0].tree).filter(function (t) {
        return t.type === 'blob' && /^images\//.test(t.path) && !/^images\/(inbox|icons)\//.test(t.path) && /\.(jpe?g|png|webp|gif|avif)$/i.test(t.path);
      }).map(function (t) { return '/' + t.path; });
      try { S.gallery = r[1] ? JSON.parse(r[1].text) : { images: [] }; S.galleryNL = !r[1] || /\n$/.test(r[1].text); } catch (e) { S.gallery = { images: [] }; }
      try { S.cfg = r[2] ? JSON.parse(r[2].text) : {}; S.cfgNL = !r[2] || /\n$/.test(r[2].text); } catch (e) { S.cfg = {}; }
      try { S.obs = r[3] ? JSON.parse(r[3].text) : {}; } catch (e) { S.obs = {}; }
      S.texts = [
        { path: 'content/home.json', label: 'Classic page (English)', text: r[6] && r[6].text },
        { path: 'content/home.da.json', label: 'Classic page (Danish)', text: r[7] && r[7].text },
        { path: 'content/entry.json', label: 'Stone circle', text: r[8] && r[8].text },
        { path: 'content/entry.da.json', label: 'Stone circle (Danish)', text: r[9] && r[9].text }
      ];
      var md = function (files, dir) { return arr(files).filter(function (f) { return /\.md$/.test(f.name); }).map(function (f) { return dir + '/' + f.name; }); };
      var postPaths = md(r[4], 'content/posts'), pagePaths = md(r[5], 'content/pages');
      return Promise.all(postPaths.concat(pagePaths).map(function (p) { return readFile(p).catch(function () { return null; }); })).then(function (texts) {
        S.posts = [];
        postPaths.concat(pagePaths).forEach(function (p, i) {
          var t = texts[i] && texts[i].text || '';
          var slug = p.replace(/^.*\//, '').replace(/\.md$/, '');
          var title = (/^---[\s\S]*?\ntitle:\s*["']?(.+?)["']?\s*\n[\s\S]*?---/.exec(t) || [])[1] || slug;
          var date = (/\ndate:\s*["']?(\d{4}-\d{2}-\d{2})/.exec(t) || [])[1] || '';
          if (i < postPaths.length) S.posts.push({ slug: slug, path: p, title: title, date: date, text: t });
          else S.texts.push({ path: p, label: 'Page: ' + title, text: t, href: 'page.html?slug=' + encodeURIComponent(slug) });
        });
        S.posts.sort(function (a, b) { return a.slug < b.slug ? 1 : -1; });
        S.loaded = true;
        index();
        fillSpecies();
        fillPostSelect($('pic-post'));
        renderLibrary();
        refreshNew();
      });
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
    shown.forEach(function (p) { grid.appendChild(tile(p, openPic)); });
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
      if (set.portfolio) { delete g.onPhotoPage; g.weight = set.weight || g.weight || 1; if (set.focus && set.focus !== 'center') g.focus = set.focus; else if (set.focus) delete g.focus; }
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
  /* The day a photo was taken, from its EXIF data (read here, on the phone;
     the photo sent to the website carries none). Falls back to the file date. */
  function takenOn(file) {
    var fallback = file.lastModified ? isoDay(new Date(file.lastModified)) : '';
    if (!/jpe?g$/i.test(file.type || file.name)) return Promise.resolve(fallback);
    return file.slice(0, 256 * 1024).arrayBuffer().then(function (buf) {
      return exifDate(new DataView(buf)) || fallback;
    }).catch(function () { return fallback; });
  }
  function exifDate(v) {
    if (v.byteLength < 4 || v.getUint16(0) !== 0xFFD8) return '';
    var o = 2;
    while (o + 4 <= v.byteLength) {
      var marker = v.getUint16(o), len = v.getUint16(o + 2);
      if (marker === 0xFFE1 && o + 10 <= v.byteLength && v.getUint32(o + 4) === 0x45786966) { // "Exif"
        var t = o + 10, le = v.getUint16(t) === 0x4949;
        var u16 = function (a) { return v.getUint16(a, le); }, u32 = function (a) { return v.getUint32(a, le); };
        var find = function (ifd, tag) {
          if (ifd + 2 > v.byteLength) return null;
          for (var i = 0, n = u16(ifd); i < n; i++) {
            var e = ifd + 2 + i * 12;
            if (e + 12 > v.byteLength) return null;
            if (u16(e) === tag) return e;
          }
          return null;
        };
        var text = function (e) {
          if (!e) return '';
          var at = t + u32(e + 8), s = '';
          for (var i = 0; i < 19 && at + i < v.byteLength; i++) s += String.fromCharCode(v.getUint8(at + i));
          var m = /^(\d{4}):(\d{2}):(\d{2})/.exec(s);
          return m && m[1] !== '0000' ? m[1] + '-' + m[2] + '-' + m[3] : '';
        };
        var ifd0 = t + u32(t + 4), ptr = find(ifd0, 0x8769);
        var original = ptr ? text(find(t + u32(ptr + 8), 0x9003)) : '';
        return original || text(find(ifd0, 0x0132));
      }
      if ((marker & 0xFF00) !== 0xFF00 || marker === 0xFFDA) break;
      o += 2 + len;
    }
    return '';
  }
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
  function addFile(file) {
    var it = { id: nextId++, file: file, url: URL.createObjectURL(file), taken: '' };
    items.push(it);
    makeCard(it);
    takenOn(file).then(function (d) { it.taken = d; if (items[0] === it) prefillFindDate(); });
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
  function loadImage(file) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () { resolve({ img: img, url: url }); };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('couldn’t read ' + file.name)); };
      img.src = url;
    });
  }
  /* Re-draw at most 2000 px on a canvas: the browser turns it upright, and the
     new JPEG carries no metadata, so the location is gone. */
  function shrink(file) {
    return loadImage(file).then(function (r) {
      var w = r.img.naturalWidth, h = r.img.naturalHeight, s = Math.min(1, LONG_SIDE / Math.max(w, h));
      var c = doc.createElement('canvas');
      c.width = Math.max(1, Math.round(w * s)); c.height = Math.max(1, Math.round(h * s));
      var ctx = c.getContext('2d');
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(r.img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(r.url);
      return new Promise(function (resolve, reject) {
        c.toBlob(function (b) { if (b) resolve(b); else reject(new Error('couldn’t prepare ' + file.name)); }, 'image/jpeg', QUALITY);
      });
    }).then(function (blob) {
      return blob.arrayBuffer().then(function (buf) {
        var bytes = new Uint8Array(buf), bin = '';
        for (var i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
        return crypto.subtle.digest('SHA-1', buf).then(function (h) {
          var hex = Array.prototype.map.call(new Uint8Array(h), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('').slice(0, 6);
          return { b64: btoa(bin), hash: hex, blob: blob };
        });
      });
    });
  }
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
        return shrink(it.file).then(function (r) {
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
