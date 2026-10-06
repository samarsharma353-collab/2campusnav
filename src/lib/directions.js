import { findLocationById } from './fuzzySearch';

/**
 * Generate clear, numbered step-by-step directions from a Dijkstra path result.
 * Each step is a rich object (not just a string) for better UI rendering.
 */
export function generateDirections(pathResult, graph) {
  if (!pathResult || !pathResult.path || pathResult.path.length === 0) {
    return { steps: [], summary: 'No path found.', distance: 0, walkingMinutes: 0 };
  }

  const { path, edgeInfo, distance, walkingMinutes } = pathResult;

  if (path.length === 1) {
    const loc = findLocationById(path[0]);
    return {
      steps: [{
        type: 'arrive',
        icon: '🎯',
        text: `You are already at ${loc?.name || path[0]}.`,
        detail: '',
      }],
      summary: `You're already there!`,
      distance: 0,
      walkingMinutes: 0,
    };
  }

  const steps = [];
  const startLoc = findLocationById(path[0]);
  const endLoc   = findLocationById(path[path.length - 1]);

  // Step 0 — START
  steps.push({
    type: 'start',
    icon: '📍',
    text: `Start at ${startLoc?.name || path[0]}`,
    detail: startLoc ? `${startLoc.building}, Floor ${startLoc.floor ?? 0}` : '',
    color: 'green',
  });

  for (let i = 0; i < path.length - 1; i++) {
    const fromLoc = findLocationById(path[i]);
    const toLoc   = findLocationById(path[i + 1]);
    const info    = (edgeInfo && edgeInfo[i]) || {};

    const edge = graph.edges.find(
      e => (e.from === path[i] && e.to === path[i + 1]) ||
           (e.to   === path[i] && e.from === path[i + 1])
    );
    const dist = edge?.distance || 0;
    const landmark = info?.landmark || edge?.landmark || '';
    const accessible = info?.accessible !== false;

    const fromFloor = fromLoc?.floor ?? 0;
    const toFloor   = toLoc?.floor   ?? 0;

    let icon = '➡️';
    let text = '';
    let detail = '';
    let type = 'walk';

    if (toFloor > fromFloor) {
      // Going up
      icon = accessible ? '🛗' : '🪜';
      type = 'floor';
      text = accessible
        ? `Take elevator up to Floor ${toFloor}`
        : `Take stairs up to Floor ${toFloor}`;
      detail = `in ${toLoc?.building || ''}`;
    } else if (toFloor < fromFloor) {
      // Going down
      icon = accessible ? '🛗' : '🪜';
      type = 'floor';
      text = accessible
        ? `Take elevator down to Floor ${toFloor}`
        : `Take stairs down to Floor ${toFloor}`;
      detail = `in ${toLoc?.building || ''}`;
    } else {
      // Same floor — walking
      const distText = dist >= 50 ? `Walk ~${dist}m` : `Walk a short distance`;
      const landmarkText = landmark ? ` ${landmark}` : '';

      // Derive direction word from landmark text
      if (landmark.includes('right')) {
        icon = '↪️'; type = 'turn';
        text = `Turn right and ${distText.toLowerCase()}${landmarkText}`;
      } else if (landmark.includes('left')) {
        icon = '↩️'; type = 'turn';
        text = `Turn left and ${distText.toLowerCase()}${landmarkText}`;
      } else {
        icon = '🚶';
        text = `${distText}${landmarkText}`;
      }

      if (fromLoc?.building !== toLoc?.building) {
        detail = `Enter ${toLoc?.building || toLoc?.name || ''}`;
      } else {
        detail = toLoc ? `Heading to ${toLoc.name}` : '';
      }
    }

    steps.push({ type, icon, text, detail, stepNumber: i + 1 });
  }

  // Final arrival step
  steps.push({
    type: 'arrive',
    icon: '🎯',
    text: `Arrive at ${endLoc?.name || path[path.length - 1]}`,
    detail: endLoc
      ? `${endLoc.building} · Floor ${endLoc.floor ?? 0}`
      : '',
    color: 'blue',
  });

  return {
    steps,
    summary: `${distance}m · ~${walkingMinutes} min walk`,
    distance,
    walkingMinutes,
  };
}

/**
 * Get nearby locations (BFS up to maxHops on graph)
 */
export function getNearbyLocations(locationId, graph, maxHops = 2) {
  const visited = new Set([locationId]);
  let frontier = [locationId];

  for (let hop = 0; hop < maxHops; hop++) {
    const next = [];
    for (const nodeId of frontier) {
      graph.edges
        .filter(e => e.from === nodeId || e.to === nodeId)
        .forEach(edge => {
          const neighbor = edge.from === nodeId ? edge.to : edge.from;
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            next.push(neighbor);
          }
        });
    }
    frontier = next;
  }

  visited.delete(locationId);
  return [...visited].map(id => findLocationById(id)).filter(Boolean);
}
