import React, { useState, useMemo } from 'react';
import { BusStop } from '../types/transit';
import { Search, MapPin, X, Bookmark, BookmarkCheck } from 'lucide-react';

interface StopSelectorProps {
  stops: BusStop[];
  selectedStop: BusStop;
  onSelectStop: (stop: BusStop) => void;
  favorites: string[]; // stop codes
  onToggleFavorite: (stopCode: string) => void;
}

const QUICK_HUBS = [
  { label: 'Dhoby Ghaut', code: '08057' },
  { label: 'Clarke Quay', code: '04168' },
  { label: 'Chinatown', code: '05013' },
  { label: 'Somerset', code: '03211' },
  { label: 'Orchard Plaza', code: '09048' },
  { label: 'Opp VivoCity', code: '10169' },
  { label: 'Bugis Stn', code: '02111' },
  { label: 'Botanic Gdns', code: '17181' },
];

export const StopSelector: React.FC<StopSelectorProps> = ({
  stops,
  selectedStop,
  onSelectStop,
  favorites,
  onToggleFavorite,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const filteredStops = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return stops;

    return stops.filter((stop) => {
      const matchCode = stop.code.includes(q);
      const matchName = stop.name.toLowerCase().includes(q);
      const matchRoad = stop.road.toLowerCase().includes(q);
      const matchService = stop.services.some((s) => s.toLowerCase() === q || s.includes(q));
      const matchDesc = stop.description?.toLowerCase().includes(q) ?? false;
      return matchCode || matchName || matchRoad || matchService || matchDesc;
    });
  }, [stops, searchQuery]);

  const isFavorite = favorites.includes(selectedStop.code);

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
      {/* Search Input Box */}
      <div className="relative mb-3">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            placeholder="Search 5-digit code, road, bus no. (e.g. 08057, 190, Orchard)"
            className="w-full h-11 pl-10 pr-10 text-sm bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-900 dark:text-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setIsSearchOpen(false);
              }}
              className="absolute right-3 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dropdown Results */}
        {isSearchOpen && searchQuery && (
          <div className="absolute top-12 left-0 right-0 z-50 max-h-72 overflow-y-auto bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl divide-y divide-slate-100 dark:divide-slate-800">
            {filteredStops.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                No Singapore bus stops found matching &quot;{searchQuery}&quot;
              </div>
            ) : (
              filteredStops.map((stop) => (
                <button
                  key={stop.code}
                  onClick={() => {
                    onSelectStop(stop);
                    setIsSearchOpen(false);
                    setSearchQuery('');
                  }}
                  className="w-full p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/70 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded">
                        {stop.code}
                      </span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {stop.name}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {stop.road} · Services: {stop.services.slice(0, 5).join(', ')}
                      {stop.services.length > 5 ? ` +${stop.services.length - 5}` : ''}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Quick Hub Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        <span className="text-xs font-medium text-slate-400 shrink-0 mr-1">Hubs:</span>
        {QUICK_HUBS.map((hub) => {
          const isCurrent = selectedStop.code === hub.code;
          return (
            <button
              key={hub.code}
              onClick={() => {
                const target = stops.find((s) => s.code === hub.code);
                if (target) onSelectStop(target);
              }}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 transition-all ${
                isCurrent
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {hub.label}
            </button>
          );
        })}
      </div>

      {/* Active Selected Stop Header Card */}
      <div className="mt-2 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-md">
              {selectedStop.code}
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate">
              {selectedStop.name}
            </h2>
            {selectedStop.mrtLines && (
              <div className="flex items-center gap-1">
                {selectedStop.mrtLines.map((line) => (
                  <span
                    key={line}
                    className="text-[10px] font-bold font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    {line}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{selectedStop.road}</span>
            <span aria-hidden="true">·</span>
            <span>{selectedStop.services.length} Bus Services</span>
          </div>
        </div>

        <button
          onClick={() => onToggleFavorite(selectedStop.code)}
          className={`p-2.5 rounded-xl border transition-all shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center ${
            isFavorite
              ? 'border-amber-300 bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:border-amber-800'
              : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
          title={isFavorite ? 'Remove from favorites' : 'Bookmark this bus stop'}
        >
          {isFavorite ? <BookmarkCheck className="w-4 h-4 fill-current" /> : <Bookmark className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
