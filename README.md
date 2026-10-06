# 🗺️ CampusNav — Campus Navigation Assistant

> Find any lab, classroom, office, or facility on campus — instantly.

A complete, zero-login, mobile-first campus navigation web app built with **React + Vite + Tailwind CSS**.

---

## ✨ Features

| Feature | Status |
|---------|--------|
| 🔍 Fuzzy search with autocomplete | ✅ |
| 💬 Chat-style natural language assistant | ✅ |
| 🗺️ Interactive SVG campus map | ✅ |
| 🧭 Dijkstra shortest-path routing | ✅ |
| 📋 Step-by-step human-readable directions | ✅ |
| 🏷️ Category filters (7 categories) | ✅ |
| 📍 Start-point selector + geolocation | ✅ |
| ♿ Accessibility mode (elevator-only routes) | ✅ |
| 🌙 Dark / Light theme | ✅ |
| 🎙️ Voice search (Web Speech API) | ✅ |
| 📱 Mobile-first responsive design | ✅ |
| 30+ campus locations seeded | ✅ |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 9+

### Install & Run
```bash
cd campus-nav
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

### Production Build
```bash
npm run build
npm run preview
```

---

## 📁 Project Structure

```
campus-nav/
├── src/
│   ├── data/
│   │   ├── locations.json      # 30 campus locations
│   │   └── graph.json          # Campus graph (nodes + weighted edges)
│   ├── lib/
│   │   ├── dijkstra.js         # Shortest path algorithm
│   │   ├── fuzzySearch.js      # Fuse.js powered search
│   │   ├── nlpParser.js        # Natural language intent parser
│   │   └── directions.js       # Human-readable directions generator
│   ├── components/
│   │   ├── SearchBar.jsx       # Fuzzy autocomplete + voice input
│   │   ├── ChatPanel.jsx       # Chat-style AI assistant
│   │   ├── MapView.jsx         # SVG campus map with routing
│   │   ├── CategoryFilter.jsx  # Category toggle buttons
│   │   └── StartPointSelector.jsx
│   ├── App.jsx                 # Main layout + state management
│   └── main.jsx
├── test-queries.mjs            # 12 automated test queries
└── vite.config.js
```

---

## 🏗️ Architecture

### Data Layer
- **locations.json**: Each location has `id, name, aliases[], category, building, floor, coordinates, description, openingHours, icon`
- **graph.json**: Campus as a weighted undirected graph. Nodes = locations/junctions. Edges have `distance` (meters) and `accessible` (ramp/elevator-friendly)

### Search
- **Fuse.js** with weighted fields (name 40%, aliases 40%, category 10%, building 10%)
- Threshold: 0.45 (permissive for typos like "chem laab", "cafateria")

### Pathfinding
- **Dijkstra's algorithm** (priority queue implementation)
- Edge weights = walking distance in meters
- Accessibility mode filters out non-ramp/elevator edges
- Walking speed: 80 m/min (~5 km/h)

### NLP Intent Parsing
- Rule-based regex patterns handle:
  - "Where is X?" / "Find X" / "Locate X"
  - "From X to Y" / "How to get to X from Y"
  - "Nearby X" / "What's near X"
- Falls back to fuzzy search on the entire query

### Directions
- Converts path array to landmark-based sentences
- Floor changes trigger elevator/stair instructions
- Building transitions use named landmarks from edge metadata

---

## 🧪 Test Queries (all verified ✅)

| Query | Result |
|-------|--------|
| `physics lab` | Physics Laboratory, Block D, Floor 1 — 6 min |
| `canteen` | Main Cafeteria, Student Center — 5 min |
| `chem lab` | Chemistry Laboratory, Block D, Floor 2 — 6 min |
| `hod cse` | HOD Office CSE, Block A, Floor 3 — 1 min |
| `library` | Central Library — 4 min |
| `medical center` | Medical Center — 2 min |
| `room 204` | Conference & Seminar Room, Block A, Floor 2 — 5 min |
| `sports ground` | Sports Ground — 4 min |
| `girls hostel` | Girls Hostel (Saraswati Bhawan) — 1 min |
| `innovation lab` | Innovation Lab, Block A, Floor 1 — 5 min |
| `ece lab` | Electronics & Communication Lab — 1 min |
| `atm` | ATM/Bank Counter, Student Center — 5 min |

---

## 🗺️ Campus Layout (seed data)

**Academic:** Block A (CSE/IT), Block B (ECE/EEE), Block C (Mech/Civil), Block D (Physics/Chem/Math)

**Labs:** CSE Computer Lab, Physics Lab, Chemistry Lab, Electronics Lab, Mech Workshop, Innovation Lab

**Admin:** Admin Block, HOD CSE, HOD ECE, Auditorium, Examination Hall, Conference Room

**Facilities:** Central Library, Main Cafeteria, Mini Canteen, ATM/Bank

**Hostels:** Boys Hostel (Krishna Bhawan), Girls Hostel (Saraswati Bhawan)

**Sports:** Sports Ground, Gymnasium, Indoor Sports Hall

**Other:** Main Gate, Bus Stop, Parking, Medical Center, Central Plaza

---

## ➕ Adding New Locations

Edit `src/data/locations.json`:
```json
{
  "id": "new_lab",
  "name": "New Research Lab",
  "aliases": ["research lab", "new lab"],
  "category": "Labs",
  "building": "Block E",
  "floor": 2,
  "coordinates": [28.6220, 77.2160],
  "description": "Advanced research facility.",
  "openingHours": "Mon–Sat 9:00–18:00",
  "icon": "🔬"
}
```

Then add edges in `src/data/graph.json`:
```json
{ "from": "block_d", "to": "new_lab", "distance": 100, "accessible": true, "landmark": "east of Block D" }
```

---

## 🎯 Usage Tips

- **Voice search**: Click the 🎙️ mic button (Chrome/Edge only)
- **Map navigation**: Scroll to zoom, drag to pan, click any pin for details
- **Accessibility mode**: Click ♿ to get elevator-friendly routes only
- **Category filter**: Click tags to show only specific location types
- **Start point**: Change your starting location using the "From:" dropdown

---

## 📝 License

MIT — Feel free to adapt for your campus!
