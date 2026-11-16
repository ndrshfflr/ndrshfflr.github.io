/* Makes assets/map/land-50m.json, the coastlines for the field trip map on the
   photography page (assets/photos-more.js). Data: Natural Earth 1:50m land
   (public domain), via the world-atlas package.

   Run from an empty folder:
     npm install world-atlas@2.0.2 topojson-client@3.1.0
     node /path/to/src/map/make_land.js > land-50m.json

   Format: { q: 50, rings: [[lon0, lat0, dlon, dlat, …], …] } — whole steps of
   1/q degree, each point after the first stored as the step from the one
   before. Antarctica is left out; points closer than two steps are dropped. */
const topo = require('topojson-client');
const t = require('world-atlas/land-50m.json');
const g = topo.feature(t, t.objects.land);
const rings = [];
(g.features || [g]).forEach(f => {
  const geo = f.geometry;
  (geo.type === 'Polygon' ? [geo.coordinates] : geo.coordinates).forEach(p => p.forEach(r => rings.push(r)));
});
const Q = 50, out = [];
rings.forEach(r => {
  if (r.every(([lo, la]) => la < -60)) return;
  const pts = []; let px = null, py = null;
  r.forEach(([lo, la]) => {
    const x = Math.round(lo * Q), y = Math.round(la * Q);
    if (px !== null && Math.abs(x - px) + Math.abs(y - py) < 2) return;
    pts.push(x, y); px = x; py = y;
  });
  if (pts.length < 8) return;
  const d = [pts[0], pts[1]];
  for (let i = 2; i < pts.length; i += 2) d.push(pts[i] - pts[i - 2], pts[i + 1] - pts[i - 1]);
  out.push(d);
});
process.stdout.write(JSON.stringify({ q: Q, rings: out }));
