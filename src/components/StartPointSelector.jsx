import { MapPin, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import locations from '../data/locations.json';

const START_OPTIONS = [
  'main_gate', 'hostel_boys', 'hostel_girls', 'library',
  'bus_stop', 'admin_block', 'cafeteria', 'parking'
];

const startLocations = START_OPTIONS.map(id => locations.find(l => l.id === id)).filter(Boolean);

export default function StartPointSelector({ selected, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 
                   rounded-xl text-sm shadow-sm hover:border-blue-400 transition-colors"
      >
        <MapPin className="w-4 h-4 text-blue-600" />
        <span className="text-gray-700 dark:text-gray-300 font-medium">
          From: {selected?.name || 'Main Gate'}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 
                        rounded-xl shadow-xl z-50 overflow-hidden min-w-[200px]">
          <div className="p-2">
            <div className="text-xs text-gray-400 dark:text-gray-500 font-medium px-2 py-1">Starting point</div>
            {startLocations.map(loc => (
              <button
                key={loc.id}
                onClick={() => { onChange(loc); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-colors
                  ${selected?.id === loc.id
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
              >
                <span className="text-base">{loc.icon}</span>
                <div>
                  <div className="font-medium">{loc.name}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">{loc.building}</div>
                </div>
                {selected?.id === loc.id && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-blue-500" />
                )}
              </button>
            ))}
          </div>
          <div className="border-t border-gray-100 dark:border-gray-700 p-2">
            <button
              onClick={() => {
                if ('geolocation' in navigator) {
                  navigator.geolocation.getCurrentPosition(
                    () => {
                      // In a real app, snap to nearest node
                      alert('📍 Using your current location! (GPS snapping available in production)');
                    },
                    () => alert('Location access denied.')
                  );
                }
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              <MapPin className="w-4 h-4" />
              Use my current location
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
