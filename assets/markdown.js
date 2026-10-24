/* Small, dependency-free helpers shared by the CMS pages and the blog:
 * a markdown renderer (headings, paragraphs, bold, italic, links, images,
 * lists, quotes) and a front-matter reader for the YAML that Decap CMS writes.
 * Enough for a personal site — not a full CommonMark/YAML implementation. */
(function () {
  'use strict';

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function safeUrl(u) {
    u = String(u || '').trim();
    return /^(javascript|data|vbscript):/i.test(u) ? '#' : u;
  }
  function emphasis(t) {
    t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    t = t.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
    t = t.replace(/(^|[^\w])_([^_\s][^_]*)_(?![\w])/g, '$1<em>$2</em>');
    return t;
  }
  function inline(text) {
    // Links and images are swapped for placeholders first, so emphasis
    // markers inside a URL (e.g. file_name_2.jpg) are left alone.
    var held = [];
    function hold(html) { held.push(html); return '\u0000' + (held.length - 1) + '\u0000'; }
    var t = escapeHtml(text);
    t = t.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;[^&]*&quot;)?\)/g, function (_, alt, src) {
      return hold('<img src="' + safeUrl(src) + '" alt="' + alt + '" loading="lazy">');
    });
    t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (_, label, href) {
      var ext = /^https?:\/\//i.test(href) ? ' target="_blank" rel="noopener"' : '';
      return hold('<a href="' + safeUrl(href) + '"' + ext + '>' + emphasis(label) + '</a>');
    });
    t = emphasis(t);
    return t.replace(/\u0000(\d+)\u0000/g, function (_, n) { return held[+n]; });
  }
  var BLOCK = /^(#{1,4}\s+|\s*[-*]\s+|\s*\d+\.\s+|>\s?|!\[)/;

  function render(md) {
    var lines = String(md || '').replace(/\r\n/g, '\n').split('\n');
    var html = '';
    var i = 0;
    while (i < lines.length) {
      var line = lines[i];
      if (/^\s*$/.test(line)) { i++; continue; }
      var m = line.match(/^(#{1,4})\s+(.*)$/);
      if (m) {
        // the page's own <h1> is the title, so # and ## both become <h2>
        var level = Math.max(2, m[1].length);
        html += '<h' + level + '>' + inline(m[2]) + '</h' + level + '>\n';
        i++; continue;
      }
      if (/^\s*!\[[^\]]*\]\([^)]+\)\s*$/.test(line)) { // image on its own line
        html += '<figure>' + inline(line.trim()) + '</figure>\n';
        i++; continue;
      }
      if (/^>\s?/.test(line)) {
        var q = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) { q.push(lines[i].replace(/^>\s?/, '')); i++; }
        html += '<blockquote><p>' + inline(q.join(' ')) + '</p></blockquote>\n';
        continue;
      }
      if (/^\s*[-*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
        var ordered = /^\s*\d+\.\s+/.test(line);
        var re = ordered ? /^\s*\d+\.\s+/ : /^\s*[-*]\s+/;
        html += ordered ? '<ol>\n' : '<ul>\n';
        while (i < lines.length && re.test(lines[i])) {
          html += '<li>' + inline(lines[i].replace(re, '')) + '</li>\n';
          i++;
        }
        html += ordered ? '</ol>\n' : '</ul>\n';
        continue;
      }
      var para = [line];
      i++;
      while (i < lines.length && !/^\s*$/.test(lines[i]) && !BLOCK.test(lines[i])) { para.push(lines[i]); i++; }
      html += '<p>' + inline(para.join(' ')) + '</p>\n';
    }
    return html;
  }

  function unquote(v) {
    v = v.trim();
    if ((v[0] === '"' && v[v.length - 1] === '"') || (v[0] === "'" && v[v.length - 1] === "'")) {
      v = v.slice(1, -1);
      if (v.indexOf('\\"') > -1) v = v.replace(/\\"/g, '"');
    }
    return v;
  }

  // Reads `key: value`, quoted values, block text (`key: >-` / `key: |`)
  // and simple lists (`key:` followed by `  - item`, or `[a, b]`).
  function parseFrontmatter(text) {
    var match = String(text || '').replace(/\r\n/g, '\n').match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
    if (!match) return { meta: {}, body: text || '' };
    var meta = {};
    var rows = match[1].split('\n');
    for (var i = 0; i < rows.length; i++) {
      var kv = rows[i].match(/^([A-Za-z0-9_]+):\s*(.*)$/);
      if (!kv) continue;
      var key = kv[1], val = kv[2];
      if (/^[>|][-+]?$/.test(val)) {
        var fold = val[0] === '>';
        var parts = [];
        while (i + 1 < rows.length && (/^\s+/.test(rows[i + 1]) || rows[i + 1] === '')) { i++; parts.push(rows[i].trim()); }
        meta[key] = fold ? parts.join(' ').replace(/\s+/g, ' ').trim() : parts.join('\n').trim();
      } else if (val === '') {
        var list = [];
        while (i + 1 < rows.length && /^\s*-\s+/.test(rows[i + 1])) { i++; list.push(unquote(rows[i].replace(/^\s*-\s+/, ''))); }
        meta[key] = list.length ? list : '';
      } else if (/^\[.*\]$/.test(val.trim())) {
        meta[key] = val.trim().slice(1, -1).split(',').map(unquote).filter(Boolean);
      } else {
        meta[key] = unquote(val);
      }
    }
    return { meta: meta, body: match[2] };
  }

  window.SiteMD = { render: render, parseFrontmatter: parseFrontmatter, escapeHtml: escapeHtml };
})();
