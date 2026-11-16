/* ==========================================================================
   The editing engine, shared by the Photos page (assets/upload.js) and the
   photography page's edit mode (assets/photos-edit.js). Loaded only on pages
   where the owner edits; visitors never fetch it.

   - signing in: GitHub (through the same helper as /admin), a key, or the
     sign-in /admin already keeps on this device
   - saving: one commit per save, straight into the repository, on top of the
     newest version of each file
   - preparing photos: shrunk to 2000 px and re-drawn on this device, so they
     carry no metadata; with "keep location" the GPS position alone is written
     back into the new file
   - deleting a picture for good: the file, and every place that shows it

   window.SiteEdit.setup({ repo, branch, proxy, authEndpoint }) first.
   ========================================================================== */
(function () {
  'use strict';

  var doc = document, API = 'https://api.github.com';
  var cfg = { repo: '', branch: 'main', proxy: '', authEndpoint: 'auth' };
  var auth = null;
  var LONG_SIDE = 2000, QUALITY = 0.86;
  /* the old sizes 1–5 and the cells they span (columns, rows) */
  var SIZES = [[1, 'small', 1, 1], [2, 'wide', 2, 1], [3, 'large', 2, 2], [4, 'larger', 3, 2], [5, 'largest', 3, 3]];
  var POS = { center: '50% 50%', top: '50% 18%', bottom: '50% 82%', left: '22% 50%', right: '78% 50%' };

  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* private mode */ } }
  };

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
  function slugify(t) {
    t = String(t || '').toLowerCase().replace(/æ/g, 'ae').replace(/ø/g, 'oe').replace(/å/g, 'aa').normalize('NFKD').replace(/[̀-ͯ]/g, '');
    return (t.match(/[a-z0-9]+/g) || []).join('-').slice(0, 50).replace(/-+$/, '');
  }
  function fromB64(s) {
    var bin = atob(String(s || '').replace(/\s/g, '')), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  function bytesToB64(bytes) {
    var bin = '';
    for (var i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }
  function jsonText(obj, nl) { return JSON.stringify(obj, null, 2) + (nl ? '\n' : ''); }

  /* ------------------------------------------------------------------ GitHub */
  function gh(method, path, body) {
    var headers = { Authorization: 'Bearer ' + (auth && auth.token), Accept: 'application/vnd.github+json' };
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
    return gh('GET', '/repos/' + cfg.repo + '/contents/' + path.split('/').map(encodeURIComponent).join('/') + '?ref=' + encodeURIComponent(ref || cfg.branch))
      .then(function (f) {
        if (f && f.content) return { text: fromB64(f.content) };
        // files over 1 MB come without their content: fetch the blob
        return gh('GET', '/repos/' + cfg.repo + '/git/blobs/' + f.sha).then(function (b) { return { text: fromB64(b.content) }; });
      }, function (e) { if (e.status === 404) return null; throw e; });
  }
  /* One commit with new files and changes to existing ones. Changes are
     functions applied to the newest version of each file, so nothing done
     meanwhile (in /admin, on the field log, by a workflow) is lost; if someone
     commits in between, it simply tries again on top. */
  function commit(message, plan) {
    var base = '/repos/' + cfg.repo + '/git/', blobs = {};
    var blob = function (f) {
      if (blobs[f.path + '|' + f.content.length] && f.encoding === 'base64') return Promise.resolve(blobs[f.path + '|' + f.content.length]);
      return gh('POST', base + 'blobs', { content: f.content, encoding: f.encoding || 'utf-8' }).then(function (b) {
        if (f.encoding === 'base64') blobs[f.path + '|' + f.content.length] = b.sha;
        return b.sha;
      });
    };
    var attempt = function (n) {
      var head, files = (plan.files || []).slice();
      return gh('GET', base + 'ref/heads/' + encodeURIComponent(cfg.branch)).then(function (ref) {
        head = ref.object.sha;
        return Promise.all((plan.edits || []).map(function (ed) {
          return readFile(ed.path, head).then(function (f) {
            var out = ed.fn(f ? f.text : null);
            if (out !== null && out !== undefined && (!f || out !== f.text)) files.push({ path: ed.path, content: out, encoding: 'utf-8' });
          });
        }));
      }).then(function () {
        var gone = (plan.deletes || []).map(function (path) { return { path: path, mode: '100644', type: 'blob', sha: null }; }); // sha null: the file is removed
        if (!files.length && !gone.length) return 'nothing';
        return Promise.all(files.map(function (f) {
          return blob(f).then(function (sha) { return { path: f.path, mode: '100644', type: 'blob', sha: sha }; });
        })).then(function (tree) {
          tree = tree.concat(gone);
          return gh('GET', base + 'commits/' + head)
            .then(function (c) { return gh('POST', base + 'trees', { base_tree: c.tree.sha, tree: tree }); })
            .then(function (t) { return gh('POST', base + 'commits', { message: message, tree: t.sha, parents: [head] }); })
            .then(function (c) { return gh('PATCH', base + 'refs/heads/' + encodeURIComponent(cfg.branch), { sha: c.sha }); });
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
  /* is a sign-in kept on this device? (cheap: used to decide whether to load the editor at all) */
  function findAuth() {
    auth = null;
    try { var own = JSON.parse(store.get('uploadAuth') || 'null'); if (own && own.token) auth = own; } catch (e) { /* ignore */ }
    var keys = ['decap-cms-user', 'netlify-cms-user', 'sveltia-cms.user']; // /admin's sign-in
    for (var i = 0; !auth && i < keys.length; i++) {
      try { var u = JSON.parse(store.get(keys[i]) || 'null'); if (u && u.token) auth = { token: u.token, via: 'admin' }; } catch (e) { /* ignore */ }
    }
    return auth;
  }
  /* GitHub sign-in in a pop-up, through the same helper as /admin.
     say(text) reports progress; done() is called once signed in. */
  function githubSignIn(say, done) {
    var proxy = String(cfg.proxy || '').replace(/\/$/, '');
    var origin;
    try { origin = new URL(proxy).origin; } catch (e) { say('Sign-in helper isn’t set up.'); return; }
    var url = proxy + '/' + (cfg.authEndpoint || 'auth') + '?provider=github&site_id=' + encodeURIComponent(location.host) + '&scope=public_repo';
    var popup = window.open(url, 'github-sign-in', 'width=620,height=760');
    if (!popup) { say('The sign-in window was blocked. Allow pop-ups for this page, or use a key.'); return; }
    say('Finish signing in in the GitHub window…');
    var onMessage = function (e) {
      if (e.origin !== origin || typeof e.data !== 'string') return;
      if (e.data === 'authorizing:github') { e.source.postMessage(e.data, e.origin); return; }
      var m = /^authorization:github:(success|error):([\s\S]*)$/.exec(e.data);
      if (!m) return;
      window.removeEventListener('message', onMessage);
      var token = null;
      try { token = JSON.parse(m[2]).token; } catch (err) { token = null; }
      if (m[1] === 'success' && token) { store.set('uploadAuth', JSON.stringify({ token: token, via: 'github' })); findAuth(); done(); }
      else say('GitHub sign-in didn’t work. Try again, or use a key.');
    };
    window.addEventListener('message', onMessage);
  }
  function useKey(k) {
    k = String(k || '').trim();
    if (!/^(github_pat_|ghp_|gho_)[A-Za-z0-9_]+$/.test(k)) return false;
    store.set('uploadAuth', JSON.stringify({ token: k, via: 'key' }));
    findAuth();
    return true;
  }
  /* forget this page's own sign-in (a sign-in made in /admin is /admin's to forget) */
  function signOut() { store.set('uploadAuth', null); auth = null; }

  /* ------------------------------------------------------------------ a photo's own data */
  /* The day a photo was taken and where, from its EXIF data (read here, on
     this device). → { date: 'YYYY-MM-DD' or '', gps: { lat, lon } or null } */
  function exif(file) {
    var fallback = file.lastModified ? isoDay(new Date(file.lastModified)) : '';
    if (!/jpe?g$/i.test(file.type || file.name)) return Promise.resolve({ date: fallback, gps: null });
    return file.slice(0, 256 * 1024).arrayBuffer().then(function (buf) {
      var x = readExif(new DataView(buf));
      return { date: x.date || fallback, gps: x.gps };
    }).catch(function () { return { date: fallback, gps: null }; });
  }
  function readExif(v) {
    var out = { date: '', gps: null };
    if (v.byteLength < 4 || v.getUint16(0) !== 0xFFD8) return out;
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
        /* degrees, minutes, seconds as three fractions → decimal degrees */
        var angle = function (e) {
          if (!e || u16(e + 2) !== 5 || u32(e + 4) !== 3) return null;
          var at = t + u32(e + 8), deg = 0;
          if (at + 24 > v.byteLength) return null;
          for (var i = 0; i < 3; i++) {
            var den = u32(at + i * 8 + 4);
            if (!den) return null;
            deg += u32(at + i * 8) / den / Math.pow(60, i);
          }
          return deg;
        };
        var ifd0 = t + u32(t + 4), ptr = find(ifd0, 0x8769);
        out.date = (ptr ? text(find(t + u32(ptr + 8), 0x9003)) : '') || text(find(ifd0, 0x0132));
        var gp = find(ifd0, 0x8825);
        if (gp) {
          var g = t + u32(gp + 8);
          var lat = angle(find(g, 2)), lon = angle(find(g, 4));
          var ref = function (tag) { var e = find(g, tag); return e ? String.fromCharCode(v.getUint8(e + 8)) : ''; };
          if (lat !== null && lon !== null && (lat || lon) && lat <= 90 && lon <= 180) {
            if (ref(1) === 'S') lat = -lat;
            if (ref(3) === 'W') lon = -lon;
            out.gps = { lat: Math.round(lat * 1e5) / 1e5, lon: Math.round(lon * 1e5) / 1e5, exact: [lat, lon] }; // 5 decimals (about a metre) to show and note; exact for the file
          }
        }
        return out;
      }
      if ((marker & 0xFF00) !== 0xFF00 || marker === 0xFFDA) break;
      o += 2 + len;
    }
    return out;
  }
  /* A JPEG's bytes with a GPS position written into it, and nothing else:
     a small EXIF block holding only the latitude and longitude. */
  function withGps(bytes, gps) {
    if (bytes[0] !== 0xFF || bytes[1] !== 0xD8) return bytes;
    var T = 140, seg = new Uint8Array(4 + 6 + T), v = new DataView(seg.buffer), t = 10; // t: where the TIFF data starts
    v.setUint16(0, 0xFFE1); v.setUint16(2, 2 + 6 + T);
    v.setUint32(4, 0x45786966); v.setUint16(8, 0);                    // "Exif\0\0"
    v.setUint16(t, 0x4D4D); v.setUint16(t + 2, 42); v.setUint32(t + 4, 8); // big-endian TIFF, first directory at 8
    var entry = function (at, tag, type, count) { v.setUint16(at, tag); v.setUint16(at + 2, type); v.setUint32(at + 4, count); return at + 8; };
    v.setUint16(t + 8, 1);                                             // the main directory: one entry, pointing at the GPS directory
    v.setUint32(entry(t + 10, 0x8825, 4, 1), 26);
    var g = t + 26;
    v.setUint16(g, 5);
    var val = entry(g + 2, 0, 1, 4); v.setUint8(val, 2); v.setUint8(val + 1, 3);           // GPS version 2.3
    v.setUint8(entry(g + 14, 1, 2, 2), gps.lat < 0 ? 0x53 : 0x4E);                          // N or S
    v.setUint32(entry(g + 26, 2, 5, 3), 92);
    v.setUint8(entry(g + 38, 3, 2, 2), gps.lon < 0 ? 0x57 : 0x45);                          // E or W
    v.setUint32(entry(g + 50, 4, 5, 3), 116);
    var dms = function (at, deg) {
      deg = Math.abs(deg);
      var d = Math.floor(deg), m = Math.floor((deg - d) * 60), s = Math.round(((deg - d) * 60 - m) * 60 * 10000);
      if (s >= 600000) { s = 0; m += 1; }
      if (m >= 60) { m = 0; d += 1; }
      [[d, 1], [m, 1], [s, 10000]].forEach(function (f, i) { v.setUint32(at + i * 8, f[0]); v.setUint32(at + i * 8 + 4, f[1]); });
    };
    var at = gps.exact || [gps.lat, gps.lon];
    dms(t + 92, at[0]); dms(t + 116, at[1]);
    var out = new Uint8Array(bytes.length + seg.length);
    out.set(bytes.subarray(0, 2), 0); out.set(seg, 2); out.set(bytes.subarray(2), 2 + seg.length);
    return out;
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
     new JPEG carries no metadata, so the location is gone — unless a position
     is passed in (keepGps: { lat, lon }), which is then written back, alone.
     → { b64, hash, blob } */
  function shrink(file, keepGps) {
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
        var bytes = new Uint8Array(buf);
        if (keepGps && isFinite(keepGps.lat) && isFinite(keepGps.lon)) bytes = withGps(bytes, keepGps);
        return crypto.subtle.digest('SHA-1', bytes).then(function (h) {
          var hex = Array.prototype.map.call(new Uint8Array(h), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('').slice(0, 6);
          return { b64: bytesToB64(bytes), hash: hex, blob: new Blob([bytes], { type: 'image/jpeg' }) };
        });
      });
    });
  }

  /* ------------------------------------------------------------------ the site's content */
  /* Everything that can show a picture: the image files, the photo library,
     the field log, the blog posts, the pages and the page texts.
     → { images, gallery, fieldlog, observations, posts, texts } (texts as { path, label, text, href }) */
  function loadSite(opts) {
    opts = opts || {};
    var R = '/repos/' + cfg.repo;
    var list = function (dir) { return gh('GET', R + '/contents/' + dir + '?ref=' + encodeURIComponent(cfg.branch)).catch(function () { return []; }); };
    return Promise.all([
      gh('GET', R + '/git/trees/' + encodeURIComponent(cfg.branch) + '?recursive=1'),
      readFile('content/gallery.json'), readFile('content/fieldlog.json'),
      opts.observations ? readFile('content/observations.json') : Promise.resolve(null),
      list('content/posts'), list('content/pages'),
      readFile('content/home.json'), readFile('content/home.da.json'), readFile('content/entry.json'), readFile('content/entry.da.json')
    ]).then(function (r) {
      var site = { gallery: r[1], fieldlog: r[2], observations: r[3], posts: [] };
      site.images = arr(r[0] && r[0].tree).filter(function (t) {
        return t.type === 'blob' && /^images\//.test(t.path) && !/^images\/(inbox|icons)\//.test(t.path) && /\.(jpe?g|png|webp|gif|avif)$/i.test(t.path);
      }).map(function (t) { return '/' + t.path; });
      site.texts = [
        { path: 'content/home.json', label: 'Classic page (English)', text: r[6] && r[6].text },
        { path: 'content/home.da.json', label: 'Classic page (Danish)', text: r[7] && r[7].text },
        { path: 'content/entry.json', label: 'Stone circle', text: r[8] && r[8].text },
        { path: 'content/entry.da.json', label: 'Stone circle (Danish)', text: r[9] && r[9].text }
      ];
      var md = function (files, dir) { return arr(files).filter(function (f) { return /\.md$/.test(f.name); }).map(function (f) { return dir + '/' + f.name; }); };
      var postPaths = md(r[4], 'content/posts'), pagePaths = md(r[5], 'content/pages');
      return Promise.all(postPaths.concat(pagePaths).map(function (p) { return readFile(p).catch(function () { return null; }); })).then(function (texts) {
        postPaths.concat(pagePaths).forEach(function (p, i) {
          var t = texts[i] && texts[i].text || '';
          var slug = p.replace(/^.*\//, '').replace(/\.md$/, '');
          var title = (/^---[\s\S]*?\ntitle:\s*["']?(.+?)["']?\s*\n[\s\S]*?---/.exec(t) || [])[1] || slug;
          var date = (/\ndate:\s*["']?(\d{4}-\d{2}-\d{2})/.exec(t) || [])[1] || '';
          if (i < postPaths.length) site.posts.push({ slug: slug, path: p, title: title, date: date, text: t });
          else site.texts.push({ path: p, label: 'Page: ' + title, text: t, href: 'page.html?slug=' + encodeURIComponent(slug) });
        });
        site.posts.sort(function (a, b) { return a.slug < b.slug ? 1 : -1; });
        return site;
      });
    });
  }

  /* ------------------------------------------------------------------ deleting pictures: the file, and every place that shows it */
  function esc(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function pathPattern(path) { // the picture's path, written any of the ways the site writes it
    return '(?:https?:\\/\\/ndrshfflr\\.github\\.io)?\\/?' + esc(path.replace(/^\//, ''));
  }
  function stripMarkdown(text, path) {
    var P = pathPattern(path);
    return text
      .replace(new RegExp('^cover:\\s*["\']?' + P + '["\']?\\s*\\n', 'm'), '')             // the cover in the front matter
      .replace(new RegExp('^[ \\t]*!\\[[^\\]]*\\]\\(' + P + '(?:\\s+"[^"]*")?\\)[ \\t]*\\n?', 'gm'), '') // a picture on its own line
      .replace(new RegExp('!\\[[^\\]]*\\]\\(' + P + '(?:\\s+"[^"]*")?\\)', 'g'), '')    // a picture inside a paragraph
      .replace(new RegExp('<img[^>]*' + P + '[^>]*>', 'g'), '')
      .replace(/\n{3,}/g, '\n\n');
  }
  function stripJSON(value, gone) { // a page field that holds the picture is emptied
    if (typeof value === 'string') return gone[same(value)] ? '' : value;
    if (Array.isArray(value)) return value.filter(function (v) { return !(typeof v === 'string' && gone[same(v)]); }).map(function (v) { return stripJSON(v, gone); });
    if (value && typeof value === 'object') { Object.keys(value).forEach(function (k) { value[k] = stripJSON(value[k], gone); }); }
    return value;
  }
  /* what a commit must do to delete these pictures (paths like /images/gallery/x.jpg);
     site: { images, posts, texts } as loadSite() gives them */
  function deletePlan(paths, site) {
    var gone = {};
    paths.forEach(function (p) { gone[p] = true; });
    var photoGone = function (x) { return gone[same(typeof x === 'string' ? x : x && (x.src || x.image || x.photo))]; };
    var edits = [];
    edits.push({ path: 'content/gallery.json', fn: function (t) {
      if (t === null) return null;
      var d0 = JSON.parse(t), before = (d0.images || []).length;
      d0.images = arr(d0.images).filter(function (g) { return !(g && gone[same(g.image)]); });
      return d0.images.length === before ? t : jsonText(d0, /\n$/.test(t));
    } });
    edits.push({ path: 'content/fieldlog.json', fn: function (t) {
      if (t === null) return null;
      var c = JSON.parse(t), before = JSON.stringify(c);
      arr(c.manual).forEach(function (m) {
        if (!m) return;
        if (m.photos) m.photos = arr(m.photos).filter(function (x) { return !photoGone(x); });
        if (m.photo && photoGone(m.photo)) delete m.photo;
      });
      arr(c.finds).forEach(function (f) {
        if (!f) return;
        if (f.photos) f.photos = arr(f.photos).filter(function (x) { return !photoGone(x); });
        if (f.cover && photoGone(f.cover)) delete f.cover;
      });
      return JSON.stringify(c) === before ? t : jsonText(c, /\n$/.test(t));
    } });
    var mentions = function (text) { return paths.some(function (p) { return String(text || '').indexOf(p.replace(/^\//, '')) >= 0; }); };
    arr(site.posts).forEach(function (post) {
      if (!mentions(post.text)) return;
      edits.push({ path: post.path, fn: function (t) {
        if (t === null) return null;
        paths.forEach(function (p) { t = stripMarkdown(t, p); });
        return t;
      } });
    });
    arr(site.texts).forEach(function (doc0) {
      if (!mentions(doc0.text)) return;
      edits.push({ path: doc0.path, fn: function (t) {
        if (t === null) return null;
        if (/\.json$/.test(doc0.path)) { var j = JSON.parse(t), before = JSON.stringify(j); j = stripJSON(j, gone); return JSON.stringify(j) === before ? t : jsonText(j, /\n$/.test(t)); }
        paths.forEach(function (p) { t = stripMarkdown(t, p); });
        return t;
      } });
    });
    return { deletes: paths.filter(function (p) { return arr(site.images).indexOf(p) >= 0; }).map(function (p) { return p.replace(/^\//, ''); }), edits: edits };
  }
  /* where one picture is used, in plain words (for the "Delete for good?" step) */
  function usesOf(path, site) {
    var uses = [], rel = path.replace(/^\//, '');
    var has = function (text) { return String(text || '').indexOf(rel) >= 0; };
    var g = null;
    try { g = arr(JSON.parse(site.gallery && site.gallery.text || '{}').images).filter(function (x) { return x && same(x.image) === path; })[0]; } catch (e) { g = null; }
    if (g && g.onPhotoPage !== false) uses.push('The photography page');
    var species = g ? (Array.isArray(g.species) ? g.species : g.species ? [g.species] : []) : [];
    if (species.length || (g && arr(g.sightings).length) || has(site.fieldlog && site.fieldlog.text)) uses.push('The field log' + (species.length ? ': ' + species.join(', ') : ''));
    arr(site.posts).forEach(function (p) { if (has(p.text) || (g && g.post === p.slug)) uses.push('Blog: ' + p.title); });
    arr(site.texts).forEach(function (t) { if (has(t.text)) uses.push(t.label); });
    return uses;
  }

  window.SiteEdit = {
    setup: function (c) { Object.keys(c || {}).forEach(function (k) { if (c[k]) cfg[k] = c[k]; }); return window.SiteEdit; },
    SIZES: SIZES, POS: POS,
    store: store, arr: arr, norm: norm, same: same, isoDay: isoDay, slugify: slugify, jsonText: jsonText,
    gh: gh, readFile: readFile, commit: commit, explain: explain,
    auth: function () { return auth; }, findAuth: findAuth, githubSignIn: githubSignIn, useKey: useKey, signOut: signOut,
    exif: exif, shrink: shrink,
    loadSite: loadSite, deletePlan: deletePlan, usesOf: usesOf
  };
})();
