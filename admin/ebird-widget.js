/* CMS widget: upload eBird's "Download my data" file (the .zip from the
 * email, or the MyEBirdData.csv inside it) and keep only what the field log
 * needs. The file is read and cleaned here in the browser — the original,
 * with exact coordinates, never reaches the website's (public) files.
 * Used by the "Merlin / eBird" collection in config.yml.
 */
(function () {
  'use strict';
  if (!window.CMS || !window.createClass || !window.h) return;
  var h = window.h;

  // Only these columns are kept. Coordinates, location names, comments etc. are dropped.
  var KEEP = ['Submission ID', 'Common Name', 'Scientific Name', 'Date', 'County', 'State/Province', 'ML Catalog Numbers'];
  // eBird has renamed columns over the years; match loosely.
  var ALIASES = [['submissionid', 'checklistid', 'samplingeventidentifier'], ['commonname'], ['scientificname'],
    ['date', 'observationdate'], ['county'], ['stateprovince', 'state'], ['mlcatalognumbers', 'mlcatalognumber', 'mediaids']];
  function key(s) { return String(s).toLowerCase().replace(/[^a-z]/g, ''); }

  function parseCSV(text) {
    var rows = [], row = [], field = '', q = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
        else field += c;
      } else if (c === '"') q = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(field); field = '';
        if (row.length > 1 || row[0] !== '') rows.push(row);
        row = [];
      } else field += c;
    }
    if (field !== '' || row.length) { row.push(field); rows.push(row); }
    return rows;
  }
  function cell(v) { v = String(v == null ? '' : v); return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }

  function clean(text) {
    var rows = parseCSV(String(text).replace(/^﻿/, ''));
    var keys = (rows.shift() || []).map(key);
    var idx = ALIASES.map(function (names) {
      for (var a = 0; a < names.length; a++) { var j = keys.indexOf(names[a]); if (j >= 0) return j; }
      return -1;
    });
    if (idx[0] < 0 || idx[2] < 0 || idx[3] < 0) throw new Error('columns');
    var out = [KEEP.join(',')];
    rows.forEach(function (r) {
      if (r[idx[2]]) out.push(idx.map(function (j) { return cell(j < 0 ? '' : r[j]); }).join(','));
    });
    return out.join('\n') + '\n';
  }

  function summary(csv) {
    var rows = parseCSV(csv || '');
    rows.shift();
    var sp = {}, last = '';
    rows.forEach(function (r) { if (r[2]) sp[r[2]] = 1; if (r[3] > last) last = r[3]; });
    return { n: rows.length, species: Object.keys(sp).length, last: last };
  }

  function readFile(file) {
    var isZip = /\.zip$/i.test(file.name) || file.type === 'application/zip';
    return file.arrayBuffer().then(function (buf) {
      var bytes = new Uint8Array(buf);
      if (!isZip) return new TextDecoder('utf-8').decode(bytes);
      if (!window.fflate) throw new Error('zip');
      var files = window.fflate.unzipSync(bytes, { filter: function (f) { return /\.csv$/i.test(f.name); } });
      var names = Object.keys(files);
      var pick = names.filter(function (n) { return /MyEBirdData/i.test(n); })[0] || names[0];
      if (!pick) throw new Error('nocsv');
      return new TextDecoder('utf-8').decode(files[pick]);
    });
  }

  var MESSAGES = {
    columns: 'This doesn’t look like eBird’s MyEBirdData.csv — the columns “Submission ID”, “Scientific Name” and “Date” are missing.',
    nocsv: 'No .csv file found inside that .zip.',
    zip: 'The .zip could not be opened here — unzip it and choose MyEBirdData.csv instead.'
  };

  var Control = window.createClass({
    getInitialState: function () { return { status: '', error: false, busy: false }; },
    onFile: function (e) {
      var self = this;
      var file = e.target.files && e.target.files[0];
      e.target.value = '';
      if (!file) return;
      self.setState({ busy: true, status: 'Reading ' + file.name + '…', error: false });
      readFile(file).then(clean).then(function (csv) {
        self.props.onChange(csv);
        var s = summary(csv);
        self.setState({ busy: false, error: false,
          status: 'Done: ' + s.n + ' sightings of ' + s.species + ' species kept, coordinates removed. Now save and publish it (buttons at the top).' });
      }).catch(function (err) {
        self.setState({ busy: false, error: true, status: MESSAGES[err && err.message] || 'The file could not be read.' });
      });
    },
    render: function () {
      var s = summary(this.props.value);
      var current = this.props.value
        ? s.n + ' sightings of ' + s.species + ' species stored' + (s.last ? ' (newest: ' + s.last + ')' : '') + '.'
        : 'No eBird data yet.';
      return h('div', { className: this.props.classNameWrapper, style: { padding: '16px' } },
        h('p', { style: { margin: '0 0 12px' } }, current),
        h('label', { style: { display: 'inline-block', padding: '8px 14px', border: '1px solid #798291', borderRadius: '5px', cursor: 'pointer' } },
          this.state.busy ? 'Working…' : (this.props.value ? 'Replace with a new eBird file' : 'Choose eBird file (.zip or .csv)'),
          h('input', { type: 'file', accept: '.zip,.csv,application/zip,text/csv', onChange: this.onFile, disabled: this.state.busy, style: { display: 'none' } })),
        this.state.status && h('p', { style: { margin: '12px 0 0', color: this.state.error ? '#c0392b' : 'inherit', fontWeight: 600 } }, this.state.status)
      );
    }
  });

  var Preview = window.createClass({
    render: function () {
      var s = summary(this.props.value);
      return h('p', {}, this.props.value ? s.n + ' sightings · ' + s.species + ' species' : '—');
    }
  });

  window.CMS.registerWidget('ebird-upload', Control, Preview);
})();
