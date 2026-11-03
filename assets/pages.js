/* ==========================================================================
   The world's reading pages: the Labdiary (blog.html), a post (post.html),
   the CV and other extra pages (page.html), Bioinformatics.
   - Labdiary: the topic buttons filter the posts
   - post / page: reads the markdown from content/ and shows it
   The sky, header and rune language come from assets/world.js.
   ========================================================================== */
(function () {
  'use strict';

  var W = window.World;
  var doc = document;
  var main = doc.getElementById('main');
  if (!W || !main) return;
  var kind = main.getAttribute('data-page');
  var U = W.U, $ = W.$;
  var slug = W.params.get('slug');
  var okSlug = !!slug && /^[A-Za-z0-9._-]+$/.test(slug);

  /* runes for the text written into the page (heading, intro, way back) */
  W.onRender(function () {
    W.$$('.rv[data-k]').forEach(function (el) {
      var lt = el.querySelector('.lt');
      if (lt) W.setRV(el, lt.textContent);
    });
  });

  /* the EN / DA links keep the post or page you're reading */
  if ((kind === 'post' || kind === 'page') && location.search) {
    W.$$('.lang[data-mode="en"], .lang[data-mode="da"]').forEach(function (a) {
      a.setAttribute('href', a.getAttribute('href').split('?')[0] + location.search);
    });
  }

  /* ------------------------------------------------------------------ Labdiary */
  if (kind === 'labdiary') {
    var box = $('pg-tags');
    if (box) box.addEventListener('click', function (e) {
      var b = e.target.closest('.pg-tag');
      if (!b) return;
      var tag = b.getAttribute('data-tag');
      W.$$('.pg-tag', box).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      W.$$('.pg-card').forEach(function (card) {
        var tags = (card.getAttribute('data-tags') || '').split('|');
        card.hidden = !!tag && tags.indexOf(tag) < 0;
      });
    });
    return;
  }
  if (kind !== 'post' && kind !== 'page') return;

  /* ------------------------------------------------------------------ post / page */
  var title = '', titleKey = kind === 'post' ? 'post-title' : 'page-title';
  function showTitle() { W.say(titleKey, title || U().loading || ''); }
  W.onRender(showTitle);
  function setTitle(t) {
    title = t;
    doc.title = t + ' — Pieter Shiffler Carpentier';
    showTitle();
  }
  function notFound() {
    setTitle(U().notFound || 'Page not found');
    var body = $('pg-body');
    body.textContent = '';
    var p = doc.createElement('p'); p.textContent = U().notFoundBody || ''; body.appendChild(p);
  }
  function load(path, done) {
    if (!okSlug || !window.fetch || !window.SiteMD) { notFound(); return; }
    fetch(path, { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error('404'); return r.text(); })
      .then(function (text) { done(window.SiteMD.parseFrontmatter(text)); })
      .catch(notFound);
  }

  if (kind === 'page') {
    if (slug === 'cv') $('pg-actions').hidden = false;
    load('content/pages/' + slug + '.md', function (parsed) {
      setTitle(parsed.meta.title || slug);
      $('pg-body').innerHTML = window.SiteMD.render(parsed.body);
    });
    return;
  }

  load('content/posts/' + slug + '.md', function (parsed) {
    var m = parsed.meta;
    setTitle(m.title || slug);
    var d = m.date ? new Date(m.date) : null;
    if (d && !isNaN(d)) {
      $('pg-date').dateTime = d.toISOString().slice(0, 10);
      $('pg-date').textContent = d.toLocaleDateString(W.page === 'da' ? 'da-DK' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    if (m.language) {
      $('pg-article').setAttribute('lang', m.language);
      $('pg-lang').textContent = String(m.language).toUpperCase();
      $('pg-lang').hidden = m.language === W.page;
    }
    if (m.summary) { $('pg-summary').textContent = m.summary; $('pg-summary').hidden = false; }
    if (m.description || m.summary) {
      var md = doc.querySelector('meta[name="description"]');
      if (md) md.setAttribute('content', m.description || m.summary);
    }
    var tags = Array.isArray(m.tags) ? m.tags : (m.tags ? [m.tags] : []);
    tags.forEach(function (t) { var s = doc.createElement('span'); s.textContent = t; $('pg-tags').appendChild(s); });
    if (m.cover) { var fig = $('pg-cover'); fig.querySelector('img').src = m.cover; fig.hidden = false; }
    $('pg-body').innerHTML = window.SiteMD.render(parsed.body);
    photos();
  });

  /* gallery photos linked to this post (Photo Gallery → Blog post) follow the text */
  function photos() {
    var data = {};
    try { data = JSON.parse($('pg-data').textContent) || {}; } catch (e) { data = {}; }
    fetch('content/gallery.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (g) {
      var pics = (g && Array.isArray(g.images) ? g.images : []).filter(function (p) { return p && p.image && p.post === slug; });
      if (!pics.length) return;
      var sec = doc.createElement('section'); sec.className = 'pg-photos';
      var h = doc.createElement('h2'); h.textContent = U().postPhotos || 'Photos'; sec.appendChild(h);
      var strip = doc.createElement('div'); strip.className = 'pg-strip'; sec.appendChild(strip);
      pics.forEach(function (p) {
        var fig = doc.createElement('figure');
        var img = doc.createElement('img'); img.src = p.image; img.alt = p.caption || ''; img.loading = 'lazy'; fig.appendChild(img);
        var tagged = (Array.isArray(p.species) ? p.species : [p.species]).filter(Boolean);
        if (p.caption || tagged.length) {
          var cap = doc.createElement('figcaption');
          if (p.caption) cap.appendChild(doc.createTextNode(p.caption));
          tagged.forEach(function (name) {
            var a = doc.createElement('a');
            a.href = (data.fieldlog || 'fieldlog.html') + '#sp=' + encodeURIComponent(name);
            a.textContent = tagged.length > 1 ? name : (U().photoFieldlog || 'In the field log');
            cap.appendChild(a);
          });
          fig.appendChild(cap);
        }
        strip.appendChild(fig);
      });
      $('pg-body').appendChild(sec);
    }).catch(function () {});
  }
})();
