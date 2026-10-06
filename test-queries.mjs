// Self-contained test — all logic inline
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const graph = require('./src/data/graph.json');
const locations = require('./src/data/locations.json');

// ─── Dijkstra ────────────────────────────────────────────────────────────────
function dijkstra(startId, endId, accessibleOnly = false) {
  const edges = graph.edges;
  const nodes = graph.nodes.map(n => n.id);
  const adj = {};
  nodes.forEach(n => (adj[n] = []));
  edges.forEach(edge => {
    if (accessibleOnly && !edge.accessible) return;
    adj[edge.from] = adj[edge.from] || [];
    adj[edge.to]   = adj[edge.to]   || [];
    adj[edge.from].push({ to: edge.to,   dist: edge.distance, landmark: edge.landmark });
    adj[edge.to].push({   to: edge.from, dist: edge.distance, landmark: edge.landmark });
  });

  const dist  = {}; const prev  = {}; const visited = new Set();
  nodes.forEach(n => (dist[n] = Infinity)); dist[startId] = 0;
  const pq = [{ id: startId, d: 0 }];

  while (pq.length) {
    pq.sort((a, b) => a.d - b.d);
    const { id: u } = pq.shift();
    if (visited.has(u)) continue;
    visited.add(u);
    if (u === endId) break;
    (adj[u] || []).forEach(({ to, dist: w }) => {
      const alt = dist[u] + w;
      if (alt < dist[to]) { dist[to] = alt; prev[to] = u; pq.push({ id: to, d: alt }); }
    });
  }

  if (dist[endId] === Infinity) return null;
  const path = []; let cur = endId;
  while (cur !== undefined) { path.unshift(cur); cur = prev[cur]; }
  const totalDistance = Math.round(dist[endId]);
  return { path, distance: totalDistance, walkingMinutes: Math.ceil(totalDistance / 80) };
}

// ─── Fuzzy Search (simple in-memory) ─────────────────────────────────────────
function normalize(s) { return s.toLowerCase().replace(/[^a-z0-9 ]/g, ''); }

function score(loc, q) {
  const fields = [loc.name, ...(loc.aliases || []), loc.category, loc.building].map(normalize);
  const nq = normalize(q);
  for (const f of fields) {
    if (f === nq) return 1.0;
    if (f.includes(nq)) return 0.85;
    if (nq.split(' ').every(word => f.includes(word))) return 0.7;
  }
  // Character overlap
  const overlap = nq.split('').filter(c => fields.some(f => f.includes(c))).length / nq.length;
  return overlap * 0.5;
}

function search(query) {
  return locations
    .map(loc => ({ loc, s: score(loc, query) }))
    .filter(x => x.s > 0.3)
    .sort((a, b) => b.s - a.s)
    .map(x => x.loc);
}

// ─── Test Queries ─────────────────────────────────────────────────────────────
const tests = [
  { q: 'physics lab',                  from: 'main_gate'   },
  { q: 'canteen',                      from: 'main_gate'   },
  { q: 'chem lab',                     from: 'main_gate'   },
  { q: 'hod cse',                      from: 'block_a'     },
  { q: 'library',                      from: 'hostel_boys' },
  { q: 'medical center',               from: 'main_gate'   },
  { q: 'room 204',                     from: 'main_gate'   },
  { q: 'sports ground',                from: 'library'     },
  { q: 'girls hostel',                 from: 'hostel_boys' },
  { q: 'innovation lab',               from: 'main_gate'   },
  { q: 'ece lab',                      from: 'block_b'     },
  { q: 'atm',                          from: 'main_gate'   },
];

console.log('\n🧪 Campus Navigation — 12 Test Queries\n' + '='.repeat(60));

let passed = 0;
for (const { q, from } of tests) {
  const results = search(q);
  const dest = results[0];
  if (!dest) {
    console.log(`❌ "${q}" — Location not found`);
    continue;
  }
  const path = dijkstra(from, dest.id, false);
  if (path) {
    console.log(`✅ "${q}"`);
    console.log(`   → ${dest.icon} ${dest.name} (${dest.building}, Floor ${dest.floor})`);
    console.log(`   🗺️  ${path.path.length} hops · ${path.distance}m · ~${path.walkingMinutes} min`);
    passed++;
  } else {
    console.log(`⚠️  "${q}" → ${dest.name} found but no path from ${from}`);
  }
}

console.log('='.repeat(60));
console.log(`\n✅ ${passed}/${tests.length} queries passed\n`);
