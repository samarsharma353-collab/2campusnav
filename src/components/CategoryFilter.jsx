import { Filter } from 'lucide-react';

const CATEGORIES = [
  { name: 'Academic', icon: '🏫', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { name: 'Labs', icon: '🔬', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { name: 'Admin', icon: '🏛️', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { name: 'Food', icon: '🍽️', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { name: 'Hostels', icon: '🏠', color: 'bg-green-100 text-green-700 border-green-200' },
  { name: 'Sports', icon: '⚽', color: 'bg-red-100 text-red-700 border-red-200' },
  { name: 'Medical', icon: '🏥', color: 'bg-pink-100 text-pink-700 border-pink-200' },
  { name: 'Landmark', icon: '📍', color: 'bg-gray-100 text-gray-700 border-gray-200' },
];

export default function CategoryFilter({ selected, onChange }) {
  const toggleCat = (cat) => {
    const next = new Set(selected);
    if (next.has(cat)) {
      next.delete(cat);
    } else {
      next.add(cat);
    }
    onChange(next);
  };

  const isAll = selected.size === 0;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
        <Filter className="w-3.5 h-3.5" />
        <span>Filter:</span>
      </div>
      <button
        onClick={() => onChange(new Set())}
        className={`text-xs px-3 py-1 rounded-full border font-medium transition-all
          ${isAll
            ? 'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 border-gray-800 dark:border-gray-200'
            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:border-gray-400'
          }`}
      >
        All
      </button>
      {CATEGORIES.map(cat => {
        const active = selected.has(cat.name);
        return (
          <button
            key={cat.name}
            onClick={() => toggleCat(cat.name)}
            className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium transition-all
              ${active ? cat.color + ' border-current' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:border-gray-400'}`}
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        );
      })}
    </div>
  );
}
