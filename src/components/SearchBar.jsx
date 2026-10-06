import { useState, useRef, useEffect } from 'react';
import { Search, X, MapPin, Mic, MicOff } from 'lucide-react';
import { searchLocations } from '../lib/fuzzySearch';

const categoryColors = {
  Academic: 'bg-blue-100 text-blue-700',
  Labs: 'bg-purple-100 text-purple-700',
  Admin: 'bg-orange-100 text-orange-700',
  Food: 'bg-yellow-100 text-yellow-700',
  Hostels: 'bg-green-100 text-green-700',
  Sports: 'bg-red-100 text-red-700',
  Medical: 'bg-pink-100 text-pink-700',
  Landmark: 'bg-gray-100 text-gray-700',
};

export default function SearchBar({ onSearch, onSelectLocation, placeholder }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SR();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'en-IN';
      recognitionRef.current.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        setQuery(transcript);
        handleSearch(transcript);
        setListening(false);
      };
      recognitionRef.current.onend = () => setListening(false);
    }
  }, []);

  const handleSearch = (q) => {
    const results = searchLocations(q, 8);
    setSuggestions(results);
    setIsOpen(results.length > 0);
    setSelectedIdx(-1);
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (val.length >= 2) {
      handleSearch(val);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
      setIsOpen(false);
    }
  };

  const handleSelect = (loc) => {
    setQuery(loc.name);
    setSuggestions([]);
    setIsOpen(false);
    onSelectLocation?.(loc);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) return;
    if (e.key === 'ArrowDown') {
      setSelectedIdx(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      setSelectedIdx(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      if (selectedIdx >= 0) {
        handleSelect(suggestions[selectedIdx]);
      } else {
        handleSubmit();
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const toggleVoice = () => {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
    } else {
      setListening(true);
      recognitionRef.current.start();
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => query.length >= 2 && setIsOpen(suggestions.length > 0)}
            placeholder={placeholder || 'Search labs, classrooms, offices…'}
            className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 dark:border-gray-600 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                       focus:outline-none focus:ring-2 focus:ring-blue-500 text-base shadow-sm
                       placeholder-gray-400"
            aria-label="Search campus locations"
            aria-autocomplete="list"
            aria-expanded={isOpen}
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setSuggestions([]); setIsOpen(false); inputRef.current?.focus(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={toggleVoice}
          className={`p-3 rounded-xl border ${listening
            ? 'bg-red-500 border-red-500 text-white animate-pulse'
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-500 hover:text-blue-600'
          } shadow-sm transition-colors`}
          title="Voice search"
          aria-label="Voice search"
        >
          {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
        <button
          type="submit"
          className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-sm transition-colors text-sm"
        >
          Search
        </button>
      </form>

      {/* Autocomplete dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden">
          {suggestions.map((loc, i) => (
            <button
              key={loc.id}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors
                         ${selectedIdx === i ? 'bg-blue-50 dark:bg-gray-700' : ''}`}
              onClick={() => handleSelect(loc)}
              onMouseEnter={() => setSelectedIdx(i)}
            >
              <span className="text-xl">{loc.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 dark:text-gray-100 truncate">{loc.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {loc.building} · Floor {loc.floor}
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${categoryColors[loc.category] || 'bg-gray-100 text-gray-600'}`}>
                {loc.category}
              </span>
              <MapPin className="w-4 h-4 text-gray-300 flex-shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
