import { useState, useCallback } from 'react';
import { Sun, Moon, Accessibility, Menu, X, Map, MessageCircle, Info } from 'lucide-react';
import SearchBar from './components/SearchBar';
import ChatPanel from './components/ChatPanel';
import MapView from './components/MapView';
import CategoryFilter from './components/CategoryFilter';
import StartPointSelector from './components/StartPointSelector';
import { dijkstra } from './lib/dijkstra';
import { findLocationByQuery, findLocationById } from './lib/fuzzySearch';
import { parseIntent } from './lib/nlpParser';
import graph from './data/graph.json';
import locations from './data/locations.json';

const mainGate = locations.find(l => l.id === 'main_gate');

export default function App() {
  const [dark, setDark] = useState(false);
  const [accessibleOnly, setAccessibleOnly] = useState(false);
  const [startPoint, setStartPoint] = useState(mainGate);
  const [activeLocation, setActiveLocation] = useState(null);
  const [routePath, setRoutePath] = useState([]);
  const [visibleCategories, setVisibleCategories] = useState(new Set());
  const [activeTab, setActiveTab] = useState('map'); // 'map' | 'chat'
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [locationDetail, setLocationDetail] = useState(null);

  const [activeStartLocation, setActiveStartLocation] = useState(mainGate);

  const handleNavigate = useCallback((destination, path, startLoc) => {
    setActiveLocation(destination);
    setRoutePath(path);
    setLocationDetail(destination);
    if (startLoc) setActiveStartLocation(startLoc);
  }, []);

  const handleSearch = useCallback((query) => {
    const intent = parseIntent(query);
    if (intent.type === 'navigate' && intent.destination) {
      const dest = intent.destination;
      const startId = intent.source?.id || startPoint?.id || 'main_gate';
      const pathResult = dijkstra(graph, startId, dest.id, accessibleOnly);
      setActiveLocation(dest);
      setRoutePath(pathResult?.path || [dest.id]);
      setLocationDetail(dest);
      setActiveTab('map');
    }
  }, [startPoint, accessibleOnly]);

  const handleSelectLocation = useCallback((loc) => {
    const startId = startPoint?.id || 'main_gate';
    const pathResult = dijkstra(graph, startId, loc.id, accessibleOnly);
    setActiveLocation(loc);
    setRoutePath(pathResult?.path || [loc.id]);
    setLocationDetail(loc);
    setActiveTab('map');
  }, [startPoint, accessibleOnly]);

  const handleMapClick = useCallback((loc) => {
    const startId = startPoint?.id || 'main_gate';
    const pathResult = dijkstra(graph, startId, loc.id, accessibleOnly);
    setActiveLocation(loc);
    setRoutePath(pathResult?.path || [loc.id]);
    setLocationDetail(loc);
  }, [startPoint, accessibleOnly]);

  return (
    <div className={dark ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors flex flex-col">

        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 shadow-sm px-4 py-3 flex items-center gap-3 flex-wrap z-30">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white text-xl shadow">
              🗺️
            </div>
            <div>
              <div className="font-bold text-base leading-none text-gray-900 dark:text-gray-100">CampusNav</div>
              <div className="text-[10px] text-gray-400 dark:text-gray-500">Find your way instantly</div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 min-w-[240px]">
            <SearchBar
              onSearch={handleSearch}
              onSelectLocation={handleSelectLocation}
              placeholder="Search labs, rooms, offices…"
            />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setAccessibleOnly(!accessibleOnly)}
              title="Accessibility mode"
              className={`p-2.5 rounded-xl border transition-colors ${accessibleOnly
                ? 'bg-green-500 border-green-500 text-white'
                : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 hover:text-green-600'
              }`}
            >
              <Accessibility className="w-5 h-5" />
            </button>
            <button
              onClick={() => setDark(!dark)}
              className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:text-yellow-500 transition-colors"
            >
              {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Sub-header: filters + start point */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 py-2 flex flex-wrap items-center gap-3">
          <StartPointSelector selected={startPoint} onChange={setStartPoint} />
          <div className="flex-1 overflow-x-auto">
            <CategoryFilter selected={visibleCategories} onChange={setVisibleCategories} />
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 overflow-hidden">

          {/* Sidebar / Chat */}
          <div className={`flex-shrink-0 border-r border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 
                          flex flex-col transition-all duration-300
                          ${sidebarOpen ? 'w-full sm:w-80 lg:w-96' : 'w-0 overflow-hidden'}`}
               style={{ maxHeight: 'calc(100vh - 130px)' }}>
            {/* Tab bar */}
            <div className="flex border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors
                  ${activeTab === 'chat'
                    ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
              >
                <MessageCircle className="w-4 h-4" />
                Chat
              </button>
              <button
                onClick={() => setActiveTab('info')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors
                  ${activeTab === 'info'
                    ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
              >
                <Info className="w-4 h-4" />
                Location
              </button>
            </div>

            <div className="flex-1 overflow-hidden">
              {activeTab === 'chat' && (
                <ChatPanel
                  startPoint={startPoint}
                  onNavigate={handleNavigate}
                  accessibleOnly={accessibleOnly}
                />
              )}
              {activeTab === 'info' && (
                <div className="p-4 overflow-y-auto h-full">
                  {locationDetail ? (
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-3xl">
                          {locationDetail.icon}
                        </div>
                        <div>
                          <h2 className="font-bold text-lg text-gray-900 dark:text-gray-100">{locationDetail.name}</h2>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {locationDetail.building} · Floor {locationDetail.floor}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <InfoCard label="Category" value={locationDetail.category} />
                        <InfoCard label="Description" value={locationDetail.description} />
                        <InfoCard label="Opening Hours" value={locationDetail.openingHours} />
                        <button
                          onClick={() => {
                            const startId = startPoint?.id || 'main_gate';
                            const pathResult = dijkstra(graph, startId, locationDetail.id, accessibleOnly);
                            setRoutePath(pathResult?.path || [locationDetail.id]);
                            setActiveTab('chat');
                          }}
                          className="w-full mt-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
                        >
                          🗺️ Get Directions
                        </button>
                      </div>

                      {/* All locations list */}
                      <div className="mt-6">
                        <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
                          All Locations
                        </div>
                        <div className="space-y-1">
                          {locations.map(loc => (
                            <button
                              key={loc.id}
                              onClick={() => {
                                setLocationDetail(loc);
                                handleMapClick(loc);
                              }}
                              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm transition-colors
                                ${locationDetail.id === loc.id
                                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                  : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
                                }`}
                            >
                              <span>{loc.icon}</span>
                              <div className="flex-1 min-w-0">
                                <div className="truncate font-medium">{loc.name}</div>
                                <div className="text-xs text-gray-400 dark:text-gray-500 truncate">{loc.category}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                      <div className="text-5xl mb-3">📍</div>
                      <h3 className="font-semibold text-gray-700 dark:text-gray-300">No location selected</h3>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                        Search for a location or click a pin on the map
                      </p>
                      {/* Quick location cards */}
                      <div className="mt-6 w-full space-y-2">
                        {locations.slice(0, 6).map(loc => (
                          <button
                            key={loc.id}
                            onClick={() => { setLocationDetail(loc); handleMapClick(loc); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          >
                            <span className="text-xl">{loc.icon}</span>
                            <div>
                              <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{loc.name}</div>
                              <div className="text-xs text-gray-400 dark:text-gray-500">{loc.category}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Toggle sidebar button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="absolute left-0 bottom-24 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                       shadow-md rounded-r-lg p-1.5 text-gray-500 hover:text-blue-600 transition-colors hidden sm:flex"
            style={{ left: sidebarOpen ? (window.innerWidth < 640 ? '100%' : '320px') : '0' }}
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          {/* Map area */}
          <div className="flex-1 flex flex-col overflow-hidden relative">
            <div className="flex-1 p-2">
              <MapView
                activeLocation={activeLocation}
                routePath={routePath}
                visibleCategories={visibleCategories}
                onLocationClick={handleMapClick}
                startLocation={routePath.length > 0 ? activeStartLocation : null}
              />
            </div>

            {/* Route info bar at bottom */}
            {routePath.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 
                             shadow-xl rounded-2xl px-5 py-3 flex items-center gap-4 text-sm z-10">
                <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400">
                  <span>📍</span>
                  <span className="font-medium">{findLocationById(routePath[0])?.name}</span>
                </div>
                <div className="text-gray-300 dark:text-gray-600">→</div>
                <div className="flex items-center gap-1.5 text-green-700 dark:text-green-400">
                  <span>🎯</span>
                  <span className="font-medium">{findLocationById(routePath[routePath.length - 1])?.name}</span>
                </div>
                <button
                  onClick={() => { setRoutePath([]); setActiveLocation(null); }}
                  className="text-gray-400 hover:text-gray-600 ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile bottom nav */}
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex z-30">
          <button
            onClick={() => setActiveTab('map')}
            className={`flex-1 flex flex-col items-center py-3 gap-0.5 text-xs ${activeTab === 'map' ? 'text-blue-600' : 'text-gray-400'}`}
          >
            <Map className="w-5 h-5" />
            Map
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 flex flex-col items-center py-3 gap-0.5 text-xs ${activeTab === 'chat' ? 'text-blue-600' : 'text-gray-400'}`}
          >
            <MessageCircle className="w-5 h-5" />
            Chat
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 flex flex-col items-center py-3 gap-0.5 text-xs ${activeTab === 'info' ? 'text-blue-600' : 'text-gray-400'}`}
          >
            <Info className="w-5 h-5" />
            Info
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-3">
      <div className="text-xs text-gray-400 dark:text-gray-500 font-medium mb-0.5">{label}</div>
      <div className="text-sm text-gray-800 dark:text-gray-200">{value}</div>
    </div>
  );
}
