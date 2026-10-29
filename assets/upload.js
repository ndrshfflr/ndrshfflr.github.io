/* ==========================================================================
   Upload page — send photos from the phone to the Photo Gallery.
   1. sign in: GitHub (through the same sign-in helper /admin uses), the /admin
      session already on this device, or a GitHub key (as for the Shortcut)
   2. choose photos; set caption, size (weight 1–5), crop and blog post
   3. each photo is shrunk to 2000 px and re-drawn as a JPEG on the phone, which
      drops its metadata (location included), then all photos are committed in
      one go to images/inbox/ with a <name>.json next to each
   4. the "Photo inbox" workflow files them; this page waits and says when
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

  function $(id) { return doc.getElementById(id); }
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* private mode */ } }
  };
  var standalone = window.navigator.standalone === true || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);

  var signin = $('signin'), work = $('work'), who = $('who'), signOut = $('sign-out');
  var list = $('list'), sendBar = $('send-bar'), sendBtn = $('send'), statusEl = $('status'), filesInput = $('files');
  var auth = null, items = [], nextId = 1, busy = false, batchNo = 0;

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
      loadPosts();
    }).catch(function (e) {
      if (e.status === 401) {
        if (auth && auth.via !== 'admin') store.set('uploadAuth', null);
        showSignin(auth && auth.via === 'admin' ? 'Your /admin sign-in on this device has expired. Sign in again here.' : 'That sign-in no longer works (expired or wrong key). Sign in again.');
      } else {
        who.textContent = 'Couldn’t reach GitHub just now (' + e.message + '). You can still choose photos.';
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

  /* ------------------------------------------------------------------ blog posts */
  var posts = (D.posts || []).slice();
  function labelFromSlug(slug) {
    var m = /^(\d{4}-\d{2}-\d{2})-(.*)$/.exec(slug);
    var words = (m ? m[2] : slug).replace(/-/g, ' ');
    return words.charAt(0).toUpperCase() + words.slice(1) + (m ? ' — ' + m[1] : '');
  }
  function fillPostSelect(sel) {
    var keep = sel.value;
    while (sel.options.length > 1) sel.remove(1);
    posts.forEach(function (p) {
      var o = doc.createElement('option');
      o.value = p.slug; o.textContent = p.title ? p.title + ' — ' + p.date : labelFromSlug(p.slug);
      sel.appendChild(o);
    });
    sel.value = keep;
  }
  function loadPosts() {
    gh('GET', '/repos/' + REPO + '/contents/content/posts?ref=' + encodeURIComponent(BRANCH)).then(function (files) {
      var known = {};
      posts.forEach(function (p) { known[p.slug] = true; });
      (files || []).forEach(function (f) {
        var slug = f.name.replace(/\.md$/, '');
        if (/\.md$/.test(f.name) && !known[slug]) posts.unshift({ slug: slug, title: '', date: '' });
      });
      posts.sort(function (a, b) { return a.slug < b.slug ? 1 : -1; });
      items.forEach(function (it) { fillPostSelect(it.li.querySelector('.up-post')); });
    }).catch(function () { /* the built-in list will do */ });
  }

  /* ------------------------------------------------------------------ the photo cards */
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
  function addPhoto(file) {
    var id = nextId++;
    var li = $('card-tpl').content.firstElementChild.cloneNode(true);
    var it = { id: id, file: file, li: li, url: URL.createObjectURL(file) };
    var weight = Math.min(5, Math.max(1, parseInt(store.get('uploadWeight'), 10) || 1));
    var img = li.querySelector('.up-thumb');
    img.src = it.url;
    img.alt = 'Photo ' + (items.length + 1) + ': ' + file.name;
    var row = li.querySelector('.up-size-row');
    SIZES.forEach(function (s) {
      var lab = doc.createElement('label'); lab.className = 'up-size';
      var inp = doc.createElement('input'); inp.type = 'radio'; inp.name = 'size-' + id; inp.value = s[0];
      if (s[0] === weight) inp.checked = true;
      var span = doc.createElement('span');
      span.appendChild(sizeIcon(s[2], s[3]));
      span.appendChild(doc.createTextNode(s[0] + ' ' + s[1]));
      lab.appendChild(inp); lab.appendChild(span); row.appendChild(lab);
      inp.addEventListener('change', function () { li.setAttribute('data-w', s[0]); store.set('uploadWeight', String(s[0])); });
    });
    li.setAttribute('data-w', weight);
    var focus = li.querySelector('.up-focus');
    focus.addEventListener('change', function () { img.style.objectPosition = POS[focus.value] || POS.center; });
    fillPostSelect(li.querySelector('.up-post'));
    li.querySelector('.up-remove').addEventListener('click', function () {
      if (busy) return;
      URL.revokeObjectURL(it.url);
      items = items.filter(function (x) { return x !== it; });
      li.remove();
      refreshBar();
    });
    items.push(it);
    list.appendChild(li);
  }
  function refreshBar() {
    sendBar.hidden = items.length === 0;
    sendBtn.textContent = items.length === 1 ? 'Send 1 photo' : 'Send ' + items.length + ' photos';
  }
  filesInput.addEventListener('change', function () {
    if (busy) return;
    if (list.querySelector('.up-card.sent')) { list.textContent = ''; items = []; } // start a new batch
    status('');
    Array.prototype.forEach.call(filesInput.files || [], function (f) { if (/^image\//.test(f.type) || /\.(heic|heif|jpe?g|png|webp)$/i.test(f.name)) addPhoto(f); });
    filesInput.value = '';
    refreshBar();
    var first = list.querySelector('.up-card:not(.sent) .up-caption');
    if (first && items.length) first.focus({ preventScroll: false });
  });

  /* ------------------------------------------------------------------ sending */
  function status(text, kind, link) {
    statusEl.textContent = text;
    statusEl.className = 'up-status' + (kind ? ' ' + kind : '');
    if (link) {
      statusEl.appendChild(doc.createTextNode(' '));
      var a = doc.createElement('a'); a.href = link.href; a.textContent = link.text;
      statusEl.appendChild(a);
    }
  }
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
      return new Promise(function (resolve, reject) {
        var fr = new FileReader();
        fr.onload = function () { resolve(String(fr.result).split(',')[1]); };
        fr.onerror = function () { reject(new Error('couldn’t prepare ' + file.name)); };
        fr.readAsDataURL(blob);
      });
    });
  }
  function stamp(d) {
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
  }
  function details(it) {
    var li = it.li, w = li.querySelector('.up-size input:checked');
    var meta = { caption: li.querySelector('.up-caption').value.trim(), weight: w ? +w.value : 1 };
    var f = li.querySelector('.up-focus').value, p = li.querySelector('.up-post').value;
    if (f && f !== 'center') meta.focus = f;
    if (p) meta.post = p;
    return meta;
  }
  function explain(e) {
    if (e.status === 401) return 'GitHub didn’t accept the sign-in (expired?). Sign in again — nothing was sent.';
    if (e.status === 403 || e.status === 404) return 'This sign-in can’t add files to the website (' + e.message + '). A key needs “Contents: Read and write” for ndrshfflr.github.io.';
    if (e instanceof TypeError) return 'No connection to GitHub — nothing was sent. Try again when you’re online.';
    return 'Something went wrong: ' + e.message + '. Nothing was published; try again.';
  }
  function commitFiles(files, message) {
    /* one commit holding every photo and its details, so the inbox sees them together */
    var base = '/repos/' + REPO + '/git/';
    return Promise.all(files.map(function (f) {
      return gh('POST', base + 'blobs', { content: f.content, encoding: f.encoding }).then(function (b) { return { path: f.path, mode: '100644', type: 'blob', sha: b.sha }; });
    })).then(function (tree) {
      var attempt = function (n) {
        var head;
        return gh('GET', base + 'ref/heads/' + encodeURIComponent(BRANCH))
          .then(function (ref) { head = ref.object.sha; return gh('GET', base + 'commits/' + head); })
          .then(function (c) { return gh('POST', base + 'trees', { base_tree: c.tree.sha, tree: tree }); })
          .then(function (t) { return gh('POST', base + 'commits', { message: message, tree: t.sha, parents: [head] }); })
          .then(function (c) { return gh('PATCH', base + 'refs/heads/' + encodeURIComponent(BRANCH), { sha: c.sha }); })
          .catch(function (e) {
            if (e.status === 422 && n < 3) return attempt(n + 1); // someone else committed meanwhile: try again on top
            throw e;
          });
      };
      return attempt(1);
    });
  }
  function watch(paths, no) {
    /* wait until the "Photo inbox" workflow has moved the photos out of the inbox */
    var until = Date.now() + 6 * 60 * 1000;
    var tick = function () {
      if (no !== batchNo) return; // a newer batch is being sent; let it speak
      if (Date.now() > until) {
        status('Sent. The website hasn’t filed them yet — see GitHub → Actions → “Photo inbox”.', 'ok');
        return;
      }
      gh('GET', '/repos/' + REPO + '/contents/images/inbox?ref=' + encodeURIComponent(BRANCH)).then(function (files) {
        var there = (files || []).map(function (f) { return f.path; });
        return paths.some(function (p) { return there.indexOf(p) >= 0; });
      }, function (e) { return e.status === 404 ? false : true; }).then(function (waiting) {
        if (no !== batchNo) return;
        if (waiting) { setTimeout(tick, 8000); return; }
        status('Filed ✓ They’ll be on the website within a minute.', 'ok', { href: D.photography || 'photography.html', text: 'Open the photography page' });
      });
    };
    setTimeout(tick, 10000);
  }
  sendBtn.addEventListener('click', function () {
    if (busy || !items.length) return;
    if (!auth) { showSignin(); return; }
    busy = true; sendBtn.disabled = true;
    var no = ++batchNo;
    var batch = items.slice(), files = [], s = stamp(new Date()), lines = [];
    var prep = batch.reduce(function (p, it, i) {
      return p.then(function () {
        status('Preparing photo ' + (i + 1) + ' of ' + batch.length + '…');
        return shrink(it.file).then(function (b64) {
          var name = 'images/inbox/' + s + '-' + (i + 1);
          var meta = details(it);
          files.push({ path: name + '.jpg', content: b64, encoding: 'base64' });
          files.push({ path: name + '.json', content: JSON.stringify(meta, null, 2) + '\n', encoding: 'utf-8' });
          lines.push('- ' + (meta.caption || '(no caption)') + ' · weight ' + meta.weight);
        });
      });
    }, Promise.resolve());
    var sending = function () { status('Sending ' + batch.length + (batch.length === 1 ? ' photo' : ' photos') + '…'); };
    prep.then(sending).then(function () {
      return commitFiles(files, 'Photos from the upload page\n\n' + lines.join('\n'));
    }).then(function () {
      batch.forEach(function (it) { it.li.classList.add('sent'); URL.revokeObjectURL(it.url); });
      items = [];
      busy = false; sendBtn.disabled = false; refreshBar(); sendBar.hidden = false; sendBtn.hidden = true;
      status('Sent ✓ The website is filing them…', 'ok');
      watch(files.filter(function (f) { return /\.jpg$/.test(f.path); }).map(function (f) { return f.path; }), no);
    }).catch(function (e) {
      busy = false; sendBtn.disabled = false;
      status(explain(e), 'err');
      if (e.status === 401) { if (auth.via !== 'admin') store.set('uploadAuth', null); }
    });
  });
  filesInput.addEventListener('click', function () { sendBtn.hidden = false; });
  window.addEventListener('beforeunload', function (e) { if (busy) { e.preventDefault(); e.returnValue = ''; } });

  start();
})();
