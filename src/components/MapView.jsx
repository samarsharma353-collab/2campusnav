import { useRef, useState, useMemo } from 'react';
import { Navigation2, Layers, X, Info } from 'lucide-react';
import locations from '../data/locations.json';
import graph from '../data/graph.json';

// ─── Canvas size ─────────────────────────────────────────────────────────────
const W = 1000;
const H = 780;

// ─── Fixed pixel positions for every location on the campus SVG ─────────────
const POS = {
  main_gate:       { x: 500, y: 720 },
  bus_stop:        { x: 380, y: 720 },
  parking:         { x: 440, y: 670 },
  medical_center:  { x: 300, y: 620 },
  admin_block:     { x: 500, y: 560 },
  auditorium:      { x: 400, y: 520 },
  examination_hall:{ x: 420, y: 490 },
  central_junction:{ x: 500, y: 440 },
  library:         { x: 360, y: 400 },
  cafeteria:       { x: 540, y: 590 },
  atm:             { x: 590, y: 590 },
  mini_canteen:    { x: 370, y: 310 },
  block_a:         { x: 360, y: 270 },
  block_b:         { x: 520, y: 270 },
  block_c:         { x: 360, y: 170 },
  block_d:         { x: 520, y: 170 },
  cse_lab:         { x: 340, y: 250 },
  innovation_lab:  { x: 380, y: 290 },
  conference_room: { x: 360, y: 255 },
  hod_cse:         { x: 350, y: 230 },
  electronics_lab: { x: 540, y: 250 },
  hod_ece:         { x: 550, y: 230 },
  mech_lab:        { x: 340, y: 150 },
  physics_lab:     { x: 510, y: 150 },
  chem_lab:        { x: 540, y: 155 },
  sports_ground:   { x: 180, y: 180 },
  gymnasium:       { x: 210, y: 220 },
  indoor_stadium:  { x: 155, y: 210 },
  hostel_boys:     { x: 650, y: 660 },
  hostel_girls:    { x: 760, y: 640 },
  room_201_a:      { x: 330, y: 240 },
  room_202_a:      { x: 350, y: 240 },
  lab_101_b:       { x: 500, y: 240 },
};

// ─── Building footprints ─────────────────────────────────────────────────────
const BUILDINGS = [
  { id: 'block_a',  key: 'Block A', x: 310, y: 230, w: 100, h: 80,  label: 'Block A\n(CSE / IT)' },
  { id: 'block_b',  key: 'Block B', x: 465, y: 230, w: 100, h: 80,  label: 'Block B\n(ECE / EEE)' },
  { id: 'block_c',  key: 'Block C', x: 310, y: 130, w: 100, h: 70,  label: 'Block C\n(Mech/Civil)' },
  { id: 'block_d',  key: 'Block D', x: 465, y: 130, w: 100, h: 70,  label: 'Block D\n(Phy/Chem)' },
  { id: 'library',  key: 'Library Block', x: 305, y: 368, w: 110, h: 65,  label: 'Central\nLibrary' },
  { id: 'admin_block', key: 'Admin Block', x: 445, y: 520, w: 110, h: 70, label: 'Admin Block' },
  { id: 'auditorium',  key: 'Main Building', x: 335, y: 490, w: 100, h: 60, label: 'Auditorium' },
  { id: 'cafeteria',   key: 'Student Center', x: 505, y: 555, w: 120, h: 65, label: 'Student\nCenter' },
  { id: 'medical_center', key: 'Medical Block', x: 245, y: 590, w: 90, h: 55, label: 'Medical\nCenter' },
  { id: 'sports_complex', key: 'Sports Complex', x: 100, y: 130, w: 160, h: 130, label: 'Sports\nComplex', isGround: true },
  { id: 'hostel_boys',  key: 'Krishna Bhawan', x: 600, y: 625, w: 105, h: 70, label: 'Krishna\nBhawan ♂' },
  { id: 'hostel_girls', key: 'Saraswati Bhawan', x: 710, y: 605, w: 105, h: 70, label: 'Saraswati\nBhawan ♀' },
  { id: 'parking',   key: 'Near Main Gate', x: 395, y: 645, w: 90, h: 45, label: 'Parking' },
];

const ROADS = [
  { d: 'M 100 600 L 900 600', w: 22 },
  { d: 'M 500 720 L 500 100', w: 18 },
  { d: 'M 200 440 L 800 440', w: 14 },
  { d: 'M 280 270 L 640 270', w: 12 },
  { d: 'M 280 170 L 640 170', w: 12 },
  { d: 'M 290 100 L 290 680', w: 12 },
  { d: 'M 680 580 L 680 720', w: 12 },
  { d: 'M 500 600 L 760 600', w: 12 },
];

const GARDENS = [
  { x: 430, y: 380, rx: 50, ry: 35, label: 'Campus Garden' },
  { x: 170, y: 440, rx: 40, ry: 28, label: 'Green Zone' },
  { x: 750, y: 450, rx: 35, ry: 25, label: 'Park' },
  { x: 500, y: 680, rx: 30, ry: 18, label: '' },
];

// Dark 3D style palette
const THEME = {
  bg: '#25252c',
  road: '#343440',
  roadStripe: '#525266',
  grass: '#2a3b32',
  grassAccent: '#33473c',
  route: '#3b82f6',
  routeGlow: '#60a5fa',
  text: '#cbd5e1'
};

function Building3D({ x, y, w, h, label, isGround, onClick, isActive, isSelectedBlock }) {
  // Isometric pseudo-3D offsets
  const dx = 12;
  const dy = -16;

  // Dark 3D building colors
  const roofColor = isActive || isSelectedBlock ? '#4F46E5' : '#5A5A6A';
  const frontColor = isActive || isSelectedBlock ? '#4338CA' : '#454550';
  const sideColor = isActive || isSelectedBlock ? '#3730A3' : '#363640';

  if (isGround) {
    return (
      <g onClick={onClick} className="cursor-pointer">
        <rect x={x} y={y} width={w} height={h} rx="8" fill="#2d4233" stroke="#3b5944" strokeWidth="2" />
        <ellipse cx={x + w/2} cy={y + h/2} rx={w*0.38} ry={h*0.38} fill="none" stroke="#41634b" strokeWidth="1.5" />
        <line x1={x + w/2} y1={y + 6} x2={x + w/2} y2={y + h - 6} stroke="#41634b" strokeWidth="1.5" />
      </g>
    );
  }

  return (
    <g onClick={onClick} className="cursor-pointer transition-all hover:opacity-90">
      {/* Base shadow */}
      <rect x={x} y={y} width={w} height={h} fill="#14141a" opacity="0.7" filter="url(#shadow)" />
      {/* Front Face (bottom) */}
      <polygon points={`${x},${y+h} ${x+w},${y+h} ${x+w+dx},${y+h+dy} ${x+dx},${y+h+dy}`} fill={frontColor} />
      {/* Left Face */}
      <polygon points={`${x},${y} ${x},${y+h} ${x+dx},${y+h+dy} ${x+dx},${y+dy}`} fill={sideColor} />
      {/* Roof */}
      <rect x={x+dx} y={y+dy} width={w} height={h} fill={roofColor} stroke="#6E6E82" strokeWidth="1" />
      {/* Label on roof */}
      {label && (
         <text x={x + dx + w/2} y={y + dy + h/2} textAnchor="middle" dominantBaseline="middle"
               fontSize="10" fill="#f8fafc" fontWeight="bold" style={{pointerEvents: 'none'}}>
           {label.split('\n').map((l, i) => <tspan key={i} x={x + dx + w/2} dy={i === 0 ? 0 : 12}>{l}</tspan>)}
         </text>
      )}
    </g>
  );
}

export default function MapView({ activeLocation, routePath, visibleCategories, onLocationClick, startLocation }) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedBlock, setSelectedBlock] = useState(null);
  
  const isDragging = useRef(false);
  const lastPos = useRef(null);
  const svgRef = useRef(null);

  // Group locations by building for the popup
  const locationsByBuilding = useMemo(() => {
    const acc = {};
    locations.forEach(loc => {
      if (!acc[loc.building]) acc[loc.building] = [];
      acc[loc.building].push(loc);
    });
    return acc;
  }, []);

  const routePoints = routePath && routePath.length > 1
    ? routePath.map(id => POS[id] || {x:0, y:0})
    : [];

  const handleWheel = (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.87;
    const rect = svgRef.current.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / rect.width  * W;
    const my = (e.clientY - rect.top)  / rect.height * H;
    setZoom(z => {
      const nz = Math.min(Math.max(z * factor, 0.5), 5);
      setPan(p => ({
        x: mx - (mx - p.x) * (nz / z),
        y: my - (my - p.y) * (nz / z),
      }));
      return nz;
    });
  };

  const handleMouseDown = (e) => {
    isDragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  };
  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    const dx = (e.clientX - lastPos.current.x);
    const dy = (e.clientY - lastPos.current.y);
    setPan(p => ({ x: p.x + dx, y: p.y + dy }));
    lastPos.current = { x: e.clientX, y: e.clientY };
  };
  const handleMouseUp = () => { isDragging.current = false; };

  const lastTouch = useRef(null);
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };
  const handleTouchMove = (e) => {
    if (e.touches.length === 1 && lastTouch.current) {
      const dx = e.touches[0].clientX - lastTouch.current.x;
      const dy = e.touches[0].clientY - lastTouch.current.y;
      setPan(p => ({ x: p.x + dx, y: p.y + dy }));
      lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const transform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`;

  return (
    <div className="relative w-full h-full overflow-hidden rounded-xl bg-[#202028]">
      
      {/* ── Block Details Panel (Over map) ── */}
      {selectedBlock && (
        <div 
          className="absolute top-4 left-4 z-40 bg-gray-900/95 backdrop-blur border border-gray-700 rounded-xl p-4 shadow-2xl w-72 text-white"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-3">
             <div className="flex items-center gap-2">
               <Info className="text-blue-400 w-5 h-5"/>
               <h3 className="font-bold text-lg">{selectedBlock.key}</h3>
             </div>
             <button onClick={() => setSelectedBlock(null)} className="text-gray-400 hover:text-white transition-colors">
               <X size={20}/>
             </button>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
             {(locationsByBuilding[selectedBlock.key] || []).length === 0 ? (
                <div className="text-gray-400 text-sm">No locations listed for this block.</div>
             ) : (
                (locationsByBuilding[selectedBlock.key] || []).map(loc => (
                  <div 
                    key={loc.id} 
                    className={`p-2.5 rounded-lg cursor-pointer transition-colors border
                      ${activeLocation?.id === loc.id ? 'bg-blue-900/50 border-blue-500' : 'bg-gray-800 border-gray-700 hover:bg-gray-750 hover:border-gray-500'}`}
                    onClick={() => { onLocationClick?.(loc); }}
                  >
                     <div className="flex items-center gap-2">
                        <span className="text-lg">{loc.icon}</span>
                        <span className="font-semibold text-sm">{loc.name}</span>
                     </div>
                     <div className="text-xs text-gray-400 mt-1 ml-7">Floor {loc.floor} • {loc.category}</div>
                  </div>
                ))
             )}
          </div>
        </div>
      )}

      {/* ── Zoom controls ── */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-1 shadow-xl">
        {[
          ['+', () => setZoom(z => Math.min(z * 1.3, 5))],
          ['−', () => setZoom(z => Math.max(z * 0.77, 0.5))],
        ].map(([label, fn]) => (
          <button key={label} onClick={fn}
            className="w-10 h-10 bg-gray-800/90 rounded-lg flex items-center justify-center text-xl font-bold text-white hover:bg-gray-700 border border-gray-600 transition-colors">
            {label}
          </button>
        ))}
        <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
          className="w-10 h-10 bg-gray-800/90 rounded-lg flex items-center justify-center text-gray-300 hover:bg-gray-700 border border-gray-600 transition-colors" title="Reset view">
          <Navigation2 className="w-5 h-5" />
        </button>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-full cursor-grab active:cursor-grabbing select-none"
        style={{ touchAction: 'none' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
      >
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="4" stdDeviation="5" floodOpacity="0.4" />
          </filter>
        </defs>

        <g style={{ transform, transformOrigin: '0 0', transition: isDragging.current ? 'none' : 'transform 0.05s' }}>
          
          {/* Base Background */}
          <rect x="0" y="0" width={W} height={H} fill={THEME.bg} />

          {/* Grass Areas */}
          {GARDENS.map((g, i) => (
            <ellipse key={`g${i}`} cx={g.x} cy={g.y} rx={g.rx} ry={g.ry} fill={THEME.grass} />
          ))}

          {/* Roads */}
          {ROADS.map((r, i) => (
            <g key={`r${i}`}>
              <path d={r.d} stroke={THEME.road} strokeWidth={r.w} strokeLinecap="round" fill="none" />
              <path d={r.d} stroke={THEME.roadStripe} strokeWidth="1" strokeLinecap="round" strokeDasharray="10 15" fill="none" opacity="0.6" />
            </g>
          ))}

          {/* Buildings */}
          {BUILDINGS.map(b => (
            <Building3D 
              key={b.id} 
              {...b} 
              isActive={activeLocation?.building === b.key}
              isSelectedBlock={selectedBlock?.key === b.key}
              onClick={() => {
                setSelectedBlock(b);
                // Optionally center map on block
                const cx = b.x + b.w/2;
                const cy = b.y + b.h/2;
                // Simple centering math (could be improved)
              }}
            />
          ))}

          {/* Route Edges (Graph) */}
          {graph.edges.map((edge, i) => {
            const from = POS[edge.from];
            const to   = POS[edge.to];
            if (!from || !to) return null;
            
            // Only draw route line if it is NOT part of the active path (active path is drawn layered above)
            const onRoute = routePath && routePath.some((id, idx) => 
                idx < routePath.length - 1 &&
                ((id === edge.from && routePath[idx + 1] === edge.to) || (id === edge.to && routePath[idx + 1] === edge.from))
            );
            if (onRoute) return null;

            return (
              <line key={`e${i}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                stroke="#3f3f4e" strokeWidth="2" strokeDasharray="4 4" opacity="0.5" strokeLinecap="round" />
            );
          })}

          {/* Animated Route Line */}
          {routePoints.length > 1 && (
            <g filter="url(#shadow)">
              {/* Outer Glow */}
              <polyline points={routePoints.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none" stroke={THEME.routeGlow} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" opacity="0.25" />
              {/* Inner Core */}
              <polyline points={routePoints.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none" stroke={THEME.route} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
              
              {/* Route Path Animation overlay */}
              <polyline points={routePoints.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none" stroke="#93C5FD" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="15 15">
                <animate attributeName="stroke-dashoffset" from="30" to="0" dur="1s" repeatCount="indefinite" />
              </polyline>
              
              {/* Start & End Marker Dots */}
              <circle cx={routePoints[0].x} cy={routePoints[0].y} r="6" fill="#10B981" stroke="#fff" strokeWidth="2"/>
              <circle cx={routePoints[routePoints.length-1].x} cy={routePoints[routePoints.length-1].y} r="7" fill="#3B82F6" stroke="#fff" strokeWidth="2"/>
            </g>
          )}

          {/* Floating Location Marker for the specific selected room/lab if it's active */}
          {activeLocation && POS[activeLocation.id] && (
            <g transform={`translate(${POS[activeLocation.id].x}, ${POS[activeLocation.id].y - 20})`} style={{ pointerEvents: 'none' }}>
               <path d="M0,0 L-8,-12 A10,10 0 1,1 8,-12 Z" fill="#3B82F6" filter="url(#shadow)" />
               <circle cx="0" cy="-16" r="4" fill="white" />
            </g>
          )}
        </g>
      </svg>
    </div>
  );
}
