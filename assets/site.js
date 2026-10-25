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
    ['about', 'microbiology', 'projects', 'mycology', 'blog', 'contact'].forEach(function (k) {
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
    setText('mycology-portal-eyebrow', m.portalEyebrow);
    setText('mycology-portal-heading', m.portalHeading);
    setText('mycology-portal-text', m.portalText);
    setText('mycology-portal-cta', m.portalCta);
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

  // ---------- the fungi portal page (fungi.html / fungi.da.html) ----------
  function renderOffers(id, offers, fallback, durationLabel) {
    var box = $(id);
    if (!box || !Array.isArray(offers)) return;
    box.innerHTML = '';
    offers.forEach(function (o) {
      if (!o || !o.title) return;
      var art = el('article', 'offer');
      var head = el('div', 'offer-head');
      head.appendChild(el('h4', null, o.title));
      if (o.audience) head.appendChild(el('p', 'offer-audience', o.audience));
      art.appendChild(head);
      var inc = lines(o.includes);
      if (inc.length) {
        var ul = el('ul', 'offer-includes');
        inc.forEach(function (l) { ul.appendChild(el('li', null, l)); });
        art.appendChild(ul);
      }
      var meta = el('div', 'offer-meta');
      meta.appendChild(el('span', 'offer-price', o.price || fallback || ''));
      if (o.duration) meta.appendChild(el('span', 'offer-turnaround', durationLabel + ': ' + o.duration));
      var foot = el('div', 'offer-foot');
      foot.appendChild(meta);
      var cta = el('a', 'offer-cta', UI.offerCta || 'Ask about this');
      cta.href = '#contact';
      cta.setAttribute('data-offer', o.title);
      cta.setAttribute('data-topic', '2');
      foot.appendChild(cta);
      art.appendChild(foot);
      box.appendChild(art);
    });
  }

  function applyLibrary(lib, fallback) {
    if (!lib) return;
    var items = Array.isArray(lib.items) ? lib.items.filter(function (c) { return c && c.name; }) : [];
    ['eyebrow', 'heading'].forEach(function (k) {
      setText('fungi-library-' + k, lib[k]);
      setText('fungi-library-door-' + (k === 'eyebrow' ? 'label' : k), lib[k]);
    });
    setText('fungi-library-door-text', lib.doorText);
    setText('fungi-library-intro', lib.intro);
    setText('fungi-library-note', lib.orderNote);
    show('fungi-library-note', !!lib.orderNote);
    show('library', items.length > 0);
    show('fungi-library-door', items.length > 0);
    var box = $('fungi-library-list');
    if (!box) return;
    box.innerHTML = '';
    items.forEach(function (c) {
      var avail = c.available !== false;
      var art = el('article', 'culture' + (avail ? '' : ' is-out'));
      var dish = el('div', 'dish' + (c.image ? ' has-image' : ''));
      if (c.image) { var img = el('img'); img.src = c.image; img.alt = c.name; img.loading = 'lazy'; dish.appendChild(img); }
      else { var m = el('span', 'dish-mark', c.name.charAt(0)); m.setAttribute('aria-hidden', 'true'); dish.appendChild(m); }
      art.appendChild(dish);
      var label = el('div', 'culture-label');
      var h = el('h3'); h.appendChild(el('em', null, c.name)); label.appendChild(h);
      if (c.common) label.appendChild(el('p', 'culture-common', c.common));
      var dl = el('dl', 'culture-facts');
      [['origin', UI.origin], ['format', UI.format]].forEach(function (pair) {
        if (!c[pair[0]]) return;
        var row = el('div'); row.appendChild(el('dt', null, pair[1])); row.appendChild(el('dd', null, c[pair[0]])); dl.appendChild(row);
      });
      if (dl.children.length) label.appendChild(dl);
      if (c.notes) label.appendChild(el('p', 'culture-notes', c.notes));
      art.appendChild(label);
      var foot = el('div', 'offer-foot');
      var meta = el('div', 'offer-meta');
      meta.appendChild(el('span', 'offer-price', c.price || fallback || ''));
      meta.appendChild(el('span', 'offer-turnaround', avail ? (UI.inStock || '') : (UI.soldOut || '')));
      foot.appendChild(meta);
      if (avail) {
        var a;
        if (c.buyLink) {
          a = el('a', 'btn btn-primary btn-small', UI.buy || 'Buy');
          a.href = c.buyLink; a.target = '_blank'; a.rel = 'noopener';
        } else {
          a = el('a', 'offer-cta', UI.orderCulture || 'Order this culture');
          a.href = '#contact';
          a.setAttribute('data-offer', c.name + (c.format ? ' (' + c.format + ')' : ''));
          a.setAttribute('data-topic', '3');
        }
        foot.appendChild(a);
      }
      art.appendChild(foot);
      box.appendChild(art);
    });
  }

  function applyFungi(f, d) {
    if (!f || !$('fungi-heading')) return;
    var fallback = d.services && d.services.priceFallback;
    var dur = UI.duration || 'Duration';
    setText('fungi-eyebrow', f.eyebrow);
    setText('fungi-heading', f.heading);
    setText('fungi-intro', f.intro);
    ['grow', 'tours'].forEach(function (k) {
      var s = f[k];
      if (!s) return;
      setText('fungi-' + k + '-door-label', s.eyebrow);
      setText('fungi-' + k + '-door-heading', s.heading);
      setText('fungi-' + k + '-door-text', s.doorText);
      setText('fungi-' + k + '-eyebrow', s.eyebrow);
      setText('fungi-' + k + '-heading', s.heading);
      setText('fungi-' + k + '-intro', s.intro);
      renderOffers('fungi-' + k + '-offers', s.offers, fallback, dur);
    });
    if (f.tours) {
      setText('fungi-tours-season', f.tours.season);
      show('fungi-tours-season', !!f.tours.season);
    }
    var dates = f.dates && Array.isArray(f.dates.items) ? f.dates.items.filter(function (x) { return x && x.date; }) : [];
    if (f.dates) setText('fungi-dates-heading', f.dates.heading);
    var dl = $('fungi-dates-list');
    if (dl) {
      dl.innerHTML = '';
      dates.forEach(function (x) {
        var li = el('li');
        li.appendChild(el('span', 'date-when', x.date));
        var what = el('span', 'date-what');
        what.appendChild(el('strong', null, x.title || ''));
        if (x.place) what.appendChild(el('span', null, x.place));
        li.appendChild(what);
        var a = el('a', 'offer-cta', UI.book || 'Book a spot');
        if (x.link) { a.href = x.link; a.target = '_blank'; a.rel = 'noopener'; }
        else { a.href = '#contact'; a.setAttribute('data-offer', (x.title || '') + ' — ' + x.date); a.setAttribute('data-topic', '2'); }
        li.appendChild(a);
        dl.appendChild(li);
      });
    }
    show('fungi-dates', dates.length > 0);
    if (f.practical) {
      setText('fungi-practical-heading', f.practical.heading);
      var pl = $('fungi-practical-list');
      if (pl && Array.isArray(f.practical.items)) {
        pl.innerHTML = '';
        f.practical.items.forEach(function (it) {
          if (!it || !it.q) return;
          var det = el('details');
          det.appendChild(el('summary', null, it.q));
          lines(it.a).forEach(function (para) { det.appendChild(el('p', null, para)); });
          pl.appendChild(det);
        });
      }
    }
    applyLibrary(f.library, fallback);
    // the closing contact band on this page has its own heading and intro
    setText('contact-heading', f.contactHeading);
    setText('contact-intro', f.contactIntro);
  }

  // ---------- the terrarium page (terrarium.html / terrarium.da.html) ----------
  function applyTerrarium(tt, d) {
    if (!tt) return;
    setText('terra-door-eyebrow', tt.teaserEyebrow);
    setText('terra-door-heading', tt.teaserHeading);
    setText('terra-door-text', tt.teaserText);
    setText('terra-door-cta', tt.teaserCta);
    if (!$('terra-heading')) return;
    setText('terra-eyebrow', tt.eyebrow);
    setText('terra-heading', tt.heading);
    setText('terra-intro', tt.intro);
    setText('terra-note', tt.note);
    show('terra-note', !!tt.note);
    var fallback = d.services && d.services.priceFallback;
    var tanks = tt.tanks && Array.isArray(tt.tanks.items) ? tt.tanks.items.filter(function (x) { return x && x.name; }) : [];
    if (tt.tanks) { setText('terra-tanks-eyebrow', tt.eyebrow); setText('terra-tanks-heading', tt.tanks.heading); setText('terra-tanks-intro', tt.tanks.intro); }
    show('tanks', tanks.length > 0);
    var tl = $('terra-tanks-list');
    if (tl) {
      tl.innerHTML = '';
      tanks.forEach(function (x) {
        var art = el('article', 'tank');
        var ph = el('div', 'tank-photo');
        if (x.image) { var img = el('img'); img.src = x.image; img.alt = x.name; img.loading = 'lazy'; ph.appendChild(img); }
        art.appendChild(ph);
        var body = el('div', 'tank-body');
        body.appendChild(el('h3', null, x.name));
        if (x.size) body.appendChild(el('p', 'tank-size', x.size));
        if (x.setup) body.appendChild(el('p', 'tank-setup', x.setup));
        if (x.inhabitants) {
          var pi = el('p', 'tank-inhabitants');
          pi.appendChild(el('span', null, (UI.inhabitants || 'Lives here') + ':'));
          pi.appendChild(document.createTextNode(' ' + x.inhabitants));
          body.appendChild(pi);
        }
        art.appendChild(body);
        tl.appendChild(art);
      });
    }
    var sp = tt.species && Array.isArray(tt.species.items) ? tt.species.items.filter(function (x) { return x && x.name; }) : [];
    if (tt.species) { setText('terra-species-eyebrow', tt.eyebrow); setText('terra-species-heading', tt.species.heading); setText('terra-species-intro', tt.species.intro); }
    show('species', sp.length > 0);
    var sl = $('terra-species-list');
    if (sl) {
      sl.innerHTML = '';
      sp.forEach(function (c) {
        var art = el('article', 'culture critter');
        var ph = el('div', 'dish critter-photo' + (c.image ? ' has-image' : ''));
        if (c.image) { var img = el('img'); img.src = c.image; img.alt = c.name; img.loading = 'lazy'; ph.appendChild(img); }
        else { var m = el('span', 'dish-mark', c.name.charAt(0)); m.setAttribute('aria-hidden', 'true'); ph.appendChild(m); }
        art.appendChild(ph);
        var label = el('div', 'culture-label');
        if (c.group) label.appendChild(el('p', 'critter-group', c.group));
        var h = el('h3'); h.appendChild(el('em', null, c.name)); label.appendChild(h);
        if (c.common) label.appendChild(el('p', 'culture-common', c.common));
        if (c.notes) label.appendChild(el('p', 'culture-notes', c.notes));
        art.appendChild(label);
        if (c.careGuide || c.forSale) {
          var foot = el('div', 'offer-foot');
          if (c.forSale) { var meta = el('div', 'offer-meta'); meta.appendChild(el('span', 'offer-price', c.price || fallback || '')); foot.appendChild(meta); }
          if (c.careGuide) { var g = el('a', 'offer-cta', UI.careGuide || 'Care guide'); g.href = c.careGuide; foot.appendChild(g); }
          if (c.forSale) {
            var a;
            if (c.buyLink) { a = el('a', 'btn btn-primary btn-small', UI.buy || 'Buy'); a.href = c.buyLink; a.target = '_blank'; a.rel = 'noopener'; }
            else { a = el('a', 'offer-cta', UI.askAvailability || 'Ask about availability'); a.href = '#contact'; a.setAttribute('data-offer', c.name); a.setAttribute('data-topic', '4'); }
            foot.appendChild(a);
          }
          art.appendChild(foot);
        }
        sl.appendChild(art);
      });
    }
    setText('contact-heading', tt.contactHeading);
    setText('contact-intro', tt.contactIntro);
  }

  // ---------- the field log (fieldlog.html) and its door on the main page ----------
  // The list itself is drawn by assets/fieldlog.js; here only the editable texts.
  function applyFieldlog(fl) {
    if (!fl) return;
    setText('log-door-eyebrow', fl.teaserEyebrow);
    setText('log-door-heading', fl.teaserHeading);
    setText('log-door-text', fl.teaserText);
    setText('log-door-cta', fl.teaserCta);
    if (!$('fl-heading')) return;
    setText('fl-eyebrow', fl.eyebrow);
    setText('fl-heading', fl.heading);
    setText('fl-intro', fl.intro);
    window.__fieldlogText = fl;
    var empty = $('fl-empty');
    if (empty && empty.getAttribute('data-state') === 'empty' && fl.emptyText) empty.textContent = fl.emptyText;
  }

  // ---------- blog ----------
  // Posts are markdown files in content/posts/, written through /admin.
  // The HTML ships with the list as it was at the last build; here the live
  // list is fetched from GitHub so a newly published post appears right away.
  function applyBlogText(b) {
    if (!b) return;
    setText('blog-eyebrow', b.eyebrow);
    setText('blog-heading', b.heading);
    setText('blog-intro', b.intro);
    setText('blog-latest-heading', b.latestHeading);
    setText('blog-empty', b.emptyText);
  }

  var MONTHS = {
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    da: ['januar', 'februar', 'marts', 'april', 'maj', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'december']
  };
  function dateLabel(iso) {
    var m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return '';
    var day = +m[3], month = MONTHS[LANG === 'da' ? 'da' : 'en'][+m[2] - 1], year = m[1];
    return LANG === 'da' ? day + '. ' + month + ' ' + year : day + ' ' + month + ' ' + year;
  }
  function postCard(p) {
    var art = el('article', 'post-card');
    if (p.tags.length) art.setAttribute('data-tags', p.tags.join('|'));
    var a = el('a', 'post-link');
    a.href = 'post.html?slug=' + encodeURIComponent(p.slug);
    var cover = el('span', 'post-cover' + (p.cover ? ' has-image' : ''));
    if (p.cover) { var img = el('img'); img.src = p.cover; img.alt = ''; img.loading = 'lazy'; cover.appendChild(img); }
    else {
      var r = el('span', 'post-cover-rune', 'ᚨ'); r.setAttribute('aria-hidden', 'true'); cover.appendChild(r);
    }
    a.appendChild(cover);
    var text = el('span', 'post-text');
    var meta = el('span', 'post-meta');
    var t = el('time', null, dateLabel(p.date)); t.dateTime = p.date; meta.appendChild(t);
    if (p.language && p.language !== LANG) meta.appendChild(el('span', 'post-lang', p.language.toUpperCase()));
    text.appendChild(meta);
    text.appendChild(el('span', 'post-title', p.title));
    if (p.summary) text.appendChild(el('span', 'post-summary', p.summary));
    if (p.tags.length) {
      var tg = el('span', 'post-tags');
      p.tags.forEach(function (x) { tg.appendChild(el('span', null, x)); });
      text.appendChild(tg);
    }
    var more = el('span', 'post-more', (UI.readMore || 'Read more') + ' ');
    var arrow = el('span', null, '→'); arrow.setAttribute('aria-hidden', 'true'); more.appendChild(arrow);
    text.appendChild(more);
    a.appendChild(text);
    art.appendChild(a);
    return art;
  }
  function toPost(file, text) {
    var parsed = window.SiteMD ? window.SiteMD.parseFrontmatter(text) : { meta: {} };
    var m = parsed.meta || {};
    if (!m.title) return null;
    var slug = file.name.replace(/\.md$/, '');
    var date = String(m.date || slug.slice(0, 10));
    var d = new Date(date);
    var iso = isNaN(d) ? slug.slice(0, 10) : d.toISOString().slice(0, 10);
    var tags = Array.isArray(m.tags) ? m.tags : (m.tags ? String(m.tags).split(',') : []);
    return {
      slug: slug, title: m.title, summary: m.summary || '', cover: m.cover || '', language: m.language || '',
      date: iso, tags: tags.map(function (x) { return String(x).trim(); }).filter(Boolean)
    };
  }
  function renderPosts(posts) {
    var list = $('blog-list');
    var latest = $('blog-latest-list');
    if (list) {
      list.innerHTML = '';
      posts.forEach(function (p) { list.appendChild(postCard(p)); });
      show('blog-empty', posts.length === 0);
      buildTagChips(posts);
    }
    if (latest) {
      latest.innerHTML = '';
      posts.slice(0, 3).forEach(function (p) { latest.appendChild(postCard(p)); });
      show('blog-latest', posts.length > 0);
    }
    show('nav-label-blog', posts.length > 0);
  }
  function buildTagChips(posts) {
    var box = $('blog-tags');
    if (!box) return;
    var tags = [];
    posts.forEach(function (p) { p.tags.forEach(function (t) { if (tags.indexOf(t) < 0) tags.push(t); }); });
    box.innerHTML = '';
    var all = el('button', 'tag-chip is-on', UI.allPosts || 'All posts');
    all.type = 'button'; all.setAttribute('data-tag', '');
    box.appendChild(all);
    tags.forEach(function (t) {
      var b = el('button', 'tag-chip', t); b.type = 'button'; b.setAttribute('data-tag', t); box.appendChild(b);
    });
    box.hidden = tags.length < 2;
  }
  function wireTagFilter() {
    var box = $('blog-tags');
    if (!box) return;
    box.addEventListener('click', function (e) {
      var chip = e.target.closest && e.target.closest('.tag-chip');
      if (!chip) return;
      var tag = chip.getAttribute('data-tag');
      box.querySelectorAll('.tag-chip').forEach(function (c) {
        c.classList.toggle('is-on', c === chip);
        c.setAttribute('aria-pressed', c === chip ? 'true' : 'false');
      });
      document.querySelectorAll('#blog-list .post-card').forEach(function (card) {
        var tags = (card.getAttribute('data-tags') || '').split('|');
        card.hidden = !!tag && tags.indexOf(tag) < 0;
      });
    });
  }
  function loadPosts() {
    if (!$('blog-list') && !$('blog-latest-list') && !$('nav-label-blog')) return;
    var host = window.location.hostname;
    if (!host || !/\.github\.io$/.test(host)) return;
    var KEY = 'posts-v1';
    try {
      var cached = JSON.parse(sessionStorage.getItem(KEY) || 'null');
      if (cached && Date.now() - cached.at < 5 * 60 * 1000 && Array.isArray(cached.posts)) { renderPosts(cached.posts); return; }
    } catch (e) {}
    var owner = host.split('.')[0];
    fetch('https://api.github.com/repos/' + owner + '/' + host + '/contents/content/posts', { cache: 'no-cache' })
      .then(function (r) { if (r.status === 404) return []; if (!r.ok) throw new Error('api'); return r.json(); })
      .then(function (files) {
        if (!Array.isArray(files)) throw new Error('api');
        var md = files.filter(function (f) { return f.name && /\.md$/.test(f.name); });
        return Promise.all(md.map(function (f) {
          // read from this site, not raw.githubusercontent, so a post is only listed once it's actually published here
          return fetch('content/posts/' + encodeURIComponent(f.name), { cache: 'no-cache' })
            .then(function (r) { return r.ok ? r.text() : null; })
            .then(function (t) { return t ? toPost(f, t) : null; })
            .catch(function () { return null; });
        }));
      })
      .then(function (posts) {
        posts = posts.filter(Boolean).sort(function (a, b) {
          return a.date === b.date ? (a.slug < b.slug ? 1 : -1) : (a.date < b.date ? 1 : -1);
        });
        try { sessionStorage.setItem(KEY, JSON.stringify({ at: Date.now(), posts: posts })); } catch (e) {}
        renderPosts(posts);
      })
      .catch(function () {}); // keep the list baked into the page
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
    applyFungi(d.fungi, d);
    applyTerrarium(d.terrarium, d);
    applyFieldlog(d.fieldlog);
    applyBlogText(d.blog);
  }

  // A gallery photo can point to a species in the field log and/or a blog post.
  function photoLinks(item) {
    if (!item.species && !item.post) return null;
    var box = el('span', 'cap-links');
    if (item.species) {
      var a = el('a', null, UI.photoFieldlog || 'In the field log');
      a.href = (LANG === 'da' ? 'fieldlog.da.html' : 'fieldlog.html') + '#sp=' + encodeURIComponent(item.species);
      box.appendChild(a);
    }
    if (item.post && /^[A-Za-z0-9._-]+$/.test(item.post)) {
      var b = el('a', null, UI.photoPost || 'Read the post');
      b.href = 'post.html?slug=' + encodeURIComponent(item.post);
      box.appendChild(b);
    }
    return box;
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
      var links = photoLinks(item);
      if (item.caption || links) {
        var cap = el('figcaption', 'cap', item.caption || null);
        if (links) cap.appendChild(links);
        fig.appendChild(cap);
      }
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

  function getJSON(url) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; });
  }
  // Photos are shared between languages: if the Danish page has no hero photo
  // or portrait of its own, it uses the ones set on the English page.
  function withSharedPhotos(d) {
    if (!d || LANG === 'en') return d;
    var needHero = d.hero && !d.hero.image;
    var needPortrait = d.about && !d.about.portrait;
    if (!needHero && !needPortrait) return d;
    return getJSON('content/home.json').then(function (en) {
      if (en && needHero && en.hero) { d.hero.image = en.hero.image; d.hero.imageAlt = d.hero.imageAlt || en.hero.imageAlt; }
      if (en && needPortrait && en.about) d.about.portrait = en.about.portrait;
      return d;
    }).catch(function () { return d; });
  }
  getJSON(CONTENT_URL).then(withSharedPhotos).then(applyHome).catch(function () {});
  if ($('photography')) {
    fetch('content/gallery.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).then(applyGallery).catch(function () {});
  }
  applyDynamicPages();
  loadPosts();
  wireTagFilter();

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
      var ti = parseInt(link.getAttribute('data-topic') || '0', 10);
      if (topic && topic.options.length) topic.selectedIndex = Math.min(ti || 0, topic.options.length - 1);
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
