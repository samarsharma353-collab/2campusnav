import Fuse from 'fuse.js';
import locations from '../data/locations.json';

const fuseOptions = {
  keys: [
    { name: 'name', weight: 0.4 },
    { name: 'aliases', weight: 0.4 },
    { name: 'category', weight: 0.1 },
    { name: 'building', weight: 0.1 },
  ],
  threshold: 0.45,
  includeScore: true,
  minMatchCharLength: 2,
};

const fuse = new Fuse(locations, fuseOptions);

export function searchLocations(query, limit = 8) {
  if (!query || query.trim().length < 2) return [];
  const results = fuse.search(query.trim(), { limit });
  return results.map(r => ({ ...r.item, score: r.score }));
}

export function findLocationById(id) {
  return locations.find(l => l.id === id) || null;
}

export function findLocationByQuery(query) {
  const results = searchLocations(query, 1);
  return results.length > 0 ? results[0] : null;
}

export function getLocationsByCategory(category) {
  return locations.filter(l => l.category === category);
}

export const allLocations = locations;
export const categories = [...new Set(locations.map(l => l.category))];
