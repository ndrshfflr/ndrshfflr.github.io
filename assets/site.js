/* Shared behaviour for every page on the site.
 *
 * The HTML files ship with the content baked in (good for search engines and
 * for visitors without JavaScript). This script then overlays the latest text
 * from content/home.json (English) or content/home.da.json (Danish) — the files
 * the /admin CMS edits — so CMS changes show up without rebuilding the HTML.
 * Every step fails silently and leaves the baked-in version in place.
 */
(function () {
  'use strict';

  var LANG = (document.documentElement.lang || 'en').slice(0, 2);
  var SELF = document.currentScript;
  var MYCELIUM_SRC = (SELF && SELF.getAttribute('data-mycelium')) || 'assets/mycelium.js';
  var CONTENT_URL = LANG === 'da' ? 'content/home.da.json' : 'content/home.json';
  var UI = {};
  try { UI = JSON.parse(document.getElementById('ui-strings').textContent); } catch (e) {}

  // ---------- small helpers ----------
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }
  function setText(id, value) {
    if (value === undefined || value === null) return;
    var n = $(id);
    if (n) n.textContent = value;
  }
  function setHref(id, value) {
    if (!value) return;
    var n = $(id);
    if (n) n.setAttribute('href', value);
  }
  function show(id, on) {
    var n = $(id);
    if (n) n.hidden = !on;
  }
  function lines(text) {
    return String(text || '').split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
  }
  function isExternal(url) { return /^https?:\/\//i.test(url || ''); }

  // ---------- chrome: year, theme, menu, reveal ----------
  var year = $('year');
  if (year) year.textContent = new Date().getFullYear();

  var themeToggle = $('theme-toggle');
  if (themeToggle) themeToggle.addEventListener('click', function () {
    var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
  });

  var nav = $('site-nav');
  var menuBtn = $('menu-toggle');
  function closeMenu() {
    if (!nav) return;
    nav.classList.remove('open');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
  }
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('.navlinks a')) closeMenu();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  }

  // Keep the current section anchor when switching language.
  document.querySelectorAll('[data-lang-switch]').forEach(function (a) {
    a.addEventListener('click', function () {
      if (location.hash && a.getAttribute('href').indexOf('#') === -1) {
        a.setAttribute('href', a.getAttribute('href') + location.hash);
      }
    });
  });

  function observeReveals(root) {
    var els = (root || document).querySelectorAll('.reveal:not(.in-view)');
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (n) { n.classList.add('in-view'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (n) { io.observe(n); });
  }
  observeReveals();

  // ---------- content overlay ----------
  function applyNav(d) {
    if (!d.nav) return;
    ['about', 'microbiology', 'projects', 'mycology', 'contact'].forEach(function (k) {
      setText('nav-label-' + k, d.nav[k]);
    });
  }

  function applyFooter(d) {
    if (d.footer) {
      setText('footer-tagline', d.footer.tagline);
      setText('footer-exploration', d.footer.explorationLabel);
    }
    if (d.business) {
      setText('footer-cvr-value', d.business.cvr || '');
      show('footer-cvr', !!d.business.cvr);
    }
  }

  function applyHero(h) {
    if (!h) return;
    setText('hero-eyebrow', h.eyebrow);
    setText('hero-headline', h.headline);
    setText('hero-lead', h.lead);
    setText('hero-cta-primary', h.primaryCtaLabel);
    setHref('hero-cta-primary', h.primaryCtaLink);
    setText('hero-cta-secondary', h.secondaryCtaLabel);
    setHref('hero-cta-secondary', h.secondaryCtaLink);
    var paths = $('hero-paths');
    if (paths && Array.isArray(h.paths)) {
      paths.innerHTML = '';
      h.paths.forEach(function (p) {
        if (!p || !p.title) return;
        var a = el('a', 'path');
        a.href = p.link || '#';
        var r = el('span', 'path-rune', p.rune || '');
        r.setAttribute('aria-hidden', 'true');
        var t = el('span', 'path-text');
        t.appendChild(el('strong', null, p.title));
        t.appendChild(el('span', null, p.text || ''));
        a.appendChild(r); a.appendChild(t);
        paths.appendChild(a);
      });
      paths.hidden = paths.children.length === 0;
    }
    var img = $('hero-image');
    if (img && h.image) {
      if (img.getAttribute('src') !== h.image) img.src = h.image;
      img.alt = h.imageAlt || '';
      img.hidden = false;
    }
  }

  function applyAbout(a) {
    if (!a) return;
    setText('about-eyebrow', a.eyebrow);
    setText('about-heading', a.heading);
    setText('about-intro', a.intro);
    setText('about-body', a.body);
    var img = $('about-portrait');
    if (img && a.portrait) { img.src = a.portrait; img.hidden = false; }
    var box = $('about-credentials');
    if (box && Array.isArray(a.credentials) && a.credentials.length) {
      box.innerHTML = '';
      a.credentials.forEach(function (row) {
        var div = el('div');
        div.appendChild(el('dt', null, row.label || ''));
        div.appendChild(el('dd', null, row.value || ''));
        box.appendChild(div);
      });
    }
  }

  function applyServices(s) {
    if (!s) return;
    setText('services-eyebrow', s.eyebrow);
    setText('services-heading', s.heading);
    setText('services-intro', s.intro);
    var box = $('services-cards');
    if (box && Array.isArray(s.cards) && s.cards.length) {
      box.innerHTML = '';
      s.cards.forEach(function (card) {
        var c = el('li', 'step');
        c.appendChild(el('span', 'step-tag', card.tag || ''));
        c.appendChild(el('h3', null, card.title || ''));
        c.appendChild(el('p', null, card.text || ''));
        box.appendChild(c);
      });
    }
    setText('offers-heading', s.offersHeading);
    var offers = $('services-offers');
    if (offers && Array.isArray(s.offers)) {
      offers.innerHTML = '';
      show('offers-heading', s.offers.length > 0);
      s.offers.forEach(function (o) {
        var art = el('article', 'offer');
        var head = el('div', 'offer-head');
        head.appendChild(el('h4', null, o.title || ''));
        if (o.audience) head.appendChild(el('p', 'offer-audience', o.audience));
        art.appendChild(head);
        var inc = lines(o.includes);
        if (inc.length) {
          var ul = el('ul', 'offer-includes');
          inc.forEach(function (l) { ul.appendChild(el('li', null, l)); });
          art.appendChild(ul);
        }
        var meta = el('div', 'offer-meta');
        meta.appendChild(el('span', 'offer-price', o.price || s.priceFallback || ''));
        if (o.turnaround) meta.appendChild(el('span', 'offer-turnaround', (UI.turnaround || 'Turnaround') + ': ' + o.turnaround));
        var foot = el('div', 'offer-foot');
        foot.appendChild(meta);
        var cta = el('a', 'offer-cta', UI.offerCta || 'Ask about this');
        cta.href = '#contact';
        cta.setAttribute('data-offer', o.title || '');
        foot.appendChild(cta);
        art.appendChild(foot);
        offers.appendChild(art);
      });
    }
  }

  function applyTrust(t) {
    var section = $('trust');
    if (!section || !t) return;
    setText('trust-eyebrow', t.eyebrow);
    setText('trust-heading', t.heading);
    setText('trust-intro', t.intro || '');
    show('trust-intro', !!t.intro);

    var cases = Array.isArray(t.cases) ? t.cases.filter(function (c) { return c && c.title; }) : [];
    var quotes = Array.isArray(t.testimonials) ? t.testimonials.filter(function (q) { return q && q.quote; }) : [];

    var cbox = $('trust-cases');
    cbox.innerHTML = '';
    cases.forEach(function (c) {
      var art = el('article', 'case');
      art.appendChild(el('h3', null, c.title));
      var dl = el('dl');
      [['problem', UI.caseProblem], ['finding', UI.caseFinding], ['outcome', UI.caseOutcome]].forEach(function (pair) {
        if (!c[pair[0]]) return;
        var row = el('div');
        row.appendChild(el('dt', null, pair[1] || pair[0]));
        row.appendChild(el('dd', null, c[pair[0]]));
        dl.appendChild(row);
      });
      art.appendChild(dl);
      cbox.appendChild(art);
    });
    cbox.hidden = !cases.length;

    var qbox = $('trust-testimonials');
    qbox.innerHTML = '';
    quotes.forEach(function (q) {
      var fig = el('figure', 'quote');
      fig.appendChild(el('blockquote', null, q.quote));
      if (q.name) fig.appendChild(el('figcaption', null, '— ' + q.name));
      qbox.appendChild(fig);
    });
    qbox.hidden = !quotes.length;

    var rep = $('trust-report');
    if (rep) {
      rep.hidden = !t.sampleReport;
      if (t.sampleReport) rep.href = t.sampleReport;
      if (t.sampleReportLabel) rep.textContent = t.sampleReportLabel;
    }
    section.hidden = !(cases.length || quotes.length || t.sampleReport);
    observeReveals(section);
  }

  function applyProjects(p) {
    if (!p) return;
    setText('projects-eyebrow', p.eyebrow);
    setText('projects-heading', p.heading);
    setText('projects-intro', p.intro || '');
    show('projects-intro', !!p.intro);
    var list = $('projects-list');
    if (list && Array.isArray(p.items) && p.items.length) {
      list.innerHTML = '';
      p.items.forEach(function (it) {
        var li = el('li');
        li.appendChild(el('span', 'tl-year', it.year || ''));
        var div = el('div');
        div.appendChild(el('h3', null, it.title || ''));
        div.appendChild(el('p', 'desc', it.desc || ''));
        if (it.link) {
          var a = el('a', 'tl-link', it.linkLabel || it.link);
          a.href = it.link;
          if (isExternal(it.link)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
          div.appendChild(a);
        }
        li.appendChild(div);
        list.appendChild(li);
      });
    }
    setText('projects-cv', p.cvLabel);
    setHref('projects-cv', p.cvLink);
    setText('projects-cvpdf', p.cvPdfLabel);
    setHref('projects-cvpdf', p.cvPdf);
    show('projects-cvpdf', !!p.cvPdf);
  }

  function applyMycology(m) {
    if (!m) return;
    setText('mycology-eyebrow', m.eyebrow);
    setText('mycology-heading', m.heading);
    setText('mycology-intro', m.intro);
    setText('mycology-callout-heading', m.calloutHeading);
    setText('mycology-callout-body', m.calloutBody);
    setText('mycology-callout-note', m.calloutNote);
    var list = $('mycology-list');
    if (list && Array.isArray(m.list) && m.list.length) {
      list.innerHTML = '';
      m.list.forEach(function (item, i) {
        var li = el('li');
        li.appendChild(el('span', 'num', String(i + 1).padStart(2, '0')));
        var div = el('div');
        div.appendChild(el('h3', null, item.title || ''));
        div.appendChild(el('span', 'desc', item.desc || ''));
        li.appendChild(div);
        list.appendChild(li);
      });
    }
  }

  function applyExploration(x) {
    if (!x) return;
    setText('exploration-eyebrow', x.eyebrow);
    setText('exploration-heading', x.heading);
    setText('exploration-intro', x.intro);
    setText('exploration-body', x.body);
  }

  function applyPhotography(p) {
    if (!p) return;
    setText('photography-eyebrow', p.eyebrow);
    setText('photography-heading', p.heading);
    setText('photography-intro', p.intro);
  }

  function applyFaq(f) {
    if (!f) return;
    setText('faq-eyebrow', f.eyebrow);
    setText('faq-heading', f.heading);
    var box = $('faq-list');
    if (box && Array.isArray(f.items)) {
      box.innerHTML = '';
      f.items.forEach(function (it) {
        if (!it || !it.q) return;
        var det = el('details');
        det.appendChild(el('summary', null, it.q));
        lines(it.a).forEach(function (para) { det.appendChild(el('p', null, para)); });
        box.appendChild(det);
      });
      show('faq', box.children.length > 0);
    }
  }

  function applyContact(c) {
    if (!c) return;
    setText('contact-eyebrow', c.eyebrow);
    setText('contact-heading', c.heading);
    setText('contact-intro', c.intro);
    if (c.email) {
      setText('contact-email', c.email);
      setHref('contact-email', 'mailto:' + c.email);
    }
    setText('contact-phone', c.phone || '');
    if (c.phone) setHref('contact-phone', 'tel:' + c.phone.replace(/\s+/g, ''));
    show('contact-phone-row', !!c.phone);
    setText('contact-area', c.area || '');
    show('contact-area-row', !!c.area);
    var book = $('contact-booking');
    if (book) {
      book.hidden = !c.bookingUrl;
      if (c.bookingUrl) book.href = c.bookingUrl;
      if (c.bookingLabel) book.textContent = c.bookingLabel;
    }
    var form = $('contact-form');
    if (form) form.setAttribute('data-endpoint', c.formEndpoint || '');
    form && form.setAttribute('data-email', c.email || '');
    if (Array.isArray(c.socials)) {
      var box = $('contact-socials');
      if (box) {
        box.innerHTML = '';
        c.socials.forEach(function (link) {
          if (!link || !link.url || !link.label) return;
          var a = el('a', null, link.label);
          a.href = link.url;
          if (isExternal(link.url)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
          box.appendChild(a);
        });
      }
    }
  }

  function applyHome(d) {
    if (!d || typeof d !== 'object') return;
    applyNav(d);
    applyFooter(d);
    applyHero(d.hero);
    applyAbout(d.about);
    applyServices(d.services);
    applyTrust(d.trust);
    applyProjects(d.projects);
    applyMycology(d.mycology);
    applyExploration(d.exploration);
    applyPhotography(d.photography);
    applyFaq(d.faq);
    applyContact(d.contact);
  }

  function applyGallery(data) {
    var section = $('photography');
    var strip = $('photography-strip');
    if (!section || !strip) return;
    var items = data && Array.isArray(data.images) ? data.images.filter(function (i) { return i && i.image; }) : [];
    strip.innerHTML = '';
    items.forEach(function (item) {
      var fig = el('figure', 'photo-tile has-image');
      var img = el('img');
      img.src = item.image;
      img.alt = item.caption || '';
      img.loading = 'lazy';
      fig.appendChild(img);
      if (item.caption) fig.appendChild(el('figcaption', 'cap', item.caption));
      strip.appendChild(fig);
    });
    section.hidden = items.length === 0; // no empty "coming soon" boxes
  }

  function parseTitle(text, fallback) {
    var m = text.match(/^---\s*([\s\S]*?)\s*---/);
    if (m) {
      var t = m[1].match(/title:\s*(.+)/);
      if (t) return t[1].trim().replace(/^["']|["']$/g, '');
    }
    return fallback;
  }

  // Extra CMS pages (e.g. the CV) appear in the menu automatically.
  function applyDynamicPages() {
    var host = window.location.hostname;
    var mount = $('nav-dynamic');
    if (!mount || !host || !/\.github\.io$/.test(host)) return;
    var owner = host.split('.')[0];
    fetch('https://api.github.com/repos/' + owner + '/' + host + '/contents/content/pages')
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (files) {
        if (!Array.isArray(files)) return;
        var md = files.filter(function (f) { return f.name && /\.md$/.test(f.name); });
        return Promise.all(md.map(function (f) {
          var slug = f.name.replace(/\.md$/, '');
          return fetch(f.download_url).then(function (r) { return r.text(); })
            .then(function (text) { return { slug: slug, title: parseTitle(text, slug) }; })
            .catch(function () { return null; });
        }));
      })
      .then(function (pages) {
        if (!pages) return;
        mount.innerHTML = '';
        pages.filter(Boolean).forEach(function (p) {
          var a = el('a', null, p.title);
          a.href = 'page.html?slug=' + encodeURIComponent(p.slug);
          mount.appendChild(a);
        });
      })
      .catch(function () {});
  }

  fetch(CONTENT_URL, { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).then(applyHome).catch(function () {});
  if ($('photography')) {
    fetch('content/gallery.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).then(applyGallery).catch(function () {});
  }
  applyDynamicPages();

  // ---------- contact form ----------
  // With a Formspree (or similar) endpoint set in the CMS, messages are sent
  // straight to your inbox. Without one, the form opens the visitor's email
  // app with everything pre-filled, so it is never a dead end.
  var form = $('contact-form');
  if (form) {
    var status = $('form-status');

    document.addEventListener('click', function (e) {
      var link = e.target.closest && e.target.closest('[data-offer]');
      if (!link) return;
      var topic = $('form-topic');
      var msg = form.querySelector('textarea[name="message"]');
      if (topic && topic.options.length) topic.selectedIndex = 0;
      if (msg && !msg.value) msg.value = (UI.offerPrefill || 'About: ') + link.getAttribute('data-offer') + '\n\n';
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      if (fd.get('_gotcha')) return; // bot
      var name = String(fd.get('name') || '').trim();
      var email = String(fd.get('email') || '').trim();
      var message = String(fd.get('message') || '').trim();
      var topic = String(fd.get('topic') || '').trim();
      if (!name || !email || !message || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        status.textContent = UI.formInvalid || 'Please fill in your name, a valid email and a message.';
        status.className = 'form-status error';
        return;
      }
      var endpoint = form.getAttribute('data-endpoint');
      if (!endpoint) {
        var to = form.getAttribute('data-email') || ($('contact-email') && $('contact-email').textContent.trim());
        var subject = topic + ' — ' + name;
        var body = message + '\n\n— ' + name + ' (' + email + ')';
        window.location.href = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
        status.textContent = UI.formMailto || '';
        status.className = 'form-status';
        return;
      }
      var btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      status.textContent = UI.formSending || 'Sending…';
      status.className = 'form-status';
      fd.append('_subject', topic + ' — ' + name);
      fd.append('language', LANG);
      fetch(endpoint, { method: 'POST', body: fd, headers: { 'Accept': 'application/json' } })
        .then(function (r) {
          if (!r.ok) throw new Error('send failed');
          form.reset();
          status.textContent = UI.formSent || 'Thanks — message sent.';
          status.className = 'form-status ok';
        })
        .catch(function () {
          status.textContent = UI.formError || 'Something went wrong — please email me directly.';
          status.className = 'form-status error';
        })
        .then(function () { btn.disabled = false; });
    });
  }

  // ---------- easter egg: the 3D mycelium ----------
  // Hidden behind the little mushroom in the menu (and the ⁂ on the
  // "Beyond the lab" page). three.js is only downloaded when it's opened.
  var egg = $('egg');
  var scene = null;
  var lastFocus = null;

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[src="' + src + '"]');
      if (existing) {
        if (existing.dataset.loaded) return resolve();
        existing.addEventListener('load', function () { resolve(); });
        existing.addEventListener('error', reject);
        return;
      }
      var s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = function () { s.dataset.loaded = '1'; resolve(); };
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function openEgg() {
    if (!egg || !egg.hidden) return;
    lastFocus = document.activeElement;
    egg.hidden = false;
    document.body.classList.add('egg-open');
    $('egg-fallback').hidden = true;
    $('egg-close').focus();
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js')
      .then(function () { return loadScript(MYCELIUM_SRC); })
      .then(function () {
        if (egg.hidden) return;
        scene = window.MyceliumScene && window.MyceliumScene.start($('egg-stage'), {
          motionButton: $('motion-btn'),
          pointerTarget: egg
        });
        if (!scene) throw new Error('no webgl');
      })
      .catch(function () { $('egg-fallback').hidden = false; });
  }

  function closeEgg() {
    if (!egg || egg.hidden) return;
    egg.hidden = true;
    document.body.classList.remove('egg-open');
    if (scene) { scene.stop(); scene = null; }
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  if (egg) {
    document.querySelectorAll('[data-egg]').forEach(function (b) { b.addEventListener('click', openEgg); });
    $('egg-close').addEventListener('click', closeEgg);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeEgg(); });
    if (location.hash === '#mycelium') openEgg();
  }
})();
