/**
 * Dijkstra's shortest path algorithm
 * Returns { path: [nodeIds], distance: number, accessible: boolean }
 */
export function dijkstra(graph, startId, endId, accessibleOnly = false) {
  const edges = graph.edges;
  const nodes = graph.nodes.map(n => n.id);

  // Build adjacency list
  const adj = {};
  nodes.forEach(n => (adj[n] = []));
  edges.forEach(edge => {
    if (accessibleOnly && !edge.accessible) return;
    adj[edge.from] = adj[edge.from] || [];
    adj[edge.to] = adj[edge.to] || [];
    adj[edge.from].push({ to: edge.to, dist: edge.distance, landmark: edge.landmark, accessible: edge.accessible });
    adj[edge.to].push({ to: edge.from, dist: edge.distance, landmark: edge.landmark, accessible: edge.accessible });
  });

  const dist = {};
  const prev = {};
  const prevEdge = {};
  const visited = new Set();
  nodes.forEach(n => (dist[n] = Infinity));
  dist[startId] = 0;

  const pq = [{ id: startId, d: 0 }];

  while (pq.length) {
    pq.sort((a, b) => a.d - b.d);
    const { id: u } = pq.shift();
    if (visited.has(u)) continue;
    visited.add(u);
    if (u === endId) break;

    (adj[u] || []).forEach(({ to, dist: w, landmark, accessible }) => {
      const alt = dist[u] + w;
      if (alt < dist[to]) {
        dist[to] = alt;
        prev[to] = u;
        prevEdge[to] = { landmark, accessible };
        pq.push({ id: to, d: alt });
      }
    });
  }

  if (dist[endId] === Infinity) return null;

  // Reconstruct path
  const path = [];
  const edgeInfo = [];
  let cur = endId;
  while (cur !== undefined) {
    path.unshift(cur);
    if (prevEdge[cur]) edgeInfo.unshift(prevEdge[cur]);
    cur = prev[cur];
  }

  const totalDistance = Math.round(dist[endId]);
  const walkingMinutes = Math.ceil(totalDistance / 80); // avg 80m/min walking

  return { path, edgeInfo, distance: totalDistance, walkingMinutes };
}
