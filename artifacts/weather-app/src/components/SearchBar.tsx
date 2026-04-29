import { useState, useEffect, useRef } from "react";
import { Search, MapPin, Loader2, X } from "lucide-react";
import { searchLocations, type GeocodingResult } from "@/lib/weatherApi";

interface Props {
  onSelect: (location: GeocodingResult) => void;
  onGeolocate: () => void;
  isGeolocating: boolean;
}

export default function SearchBar({ onSelect, onGeolocate, isGeolocating }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) { setResults([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await searchLocations(query);
        setResults(r);
        setOpen(r.length > 0);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleSelect(loc: GeocodingResult) {
    setQuery('');
    setOpen(false);
    setResults([]);
    onSelect(loc);
  }

  function getFlag(countryCode: string) {
    if (!countryCode) return '';
    return countryCode
      .toUpperCase()
      .split('')
      .map(c => String.fromCodePoint(127397 + c.charCodeAt(0)))
      .join('');
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-lg">
      <div
        className={`relative flex items-center transition-all duration-300 rounded-2xl ${focused ? 'ring-2 ring-blue-400/50 ring-offset-0' : ''}`}
        style={{
          background: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${focused ? 'rgba(96,165,250,0.4)' : 'rgba(255,255,255,0.12)'}`,
        }}
      >
        <div className="pl-4 pr-2 flex items-center">
          {loading ? (
            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-white/50" />
          )}
        </div>
        <input
          type="search"
          data-testid="input-search-location"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="Search city, country..."
          className="flex-1 bg-transparent py-3.5 pr-3 text-white placeholder:text-white/40 text-sm outline-none font-medium"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setOpen(false); setResults([]); }}
            className="pr-2 text-white/40 hover:text-white/70 transition-colors"
            data-testid="button-clear-search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <div className="w-px h-6 bg-white/10 mx-1" />
        <button
          onClick={onGeolocate}
          disabled={isGeolocating}
          data-testid="button-geolocate"
          className="flex items-center gap-1.5 px-3 py-3 rounded-r-2xl text-blue-300 hover:text-blue-200 transition-colors disabled:opacity-50"
          title="Use my location"
        >
          {isGeolocating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <MapPin className="w-4 h-4" />
          )}
          <span className="text-xs font-medium hidden sm:inline">Locate</span>
        </button>
      </div>

      {open && results.length > 0 && (
        <div
          className="absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden z-50 animate-scale-in"
          style={{
            background: 'rgba(15,23,42,0.95)',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}
        >
          {results.map((r, i) => (
            <button
              key={r.id || i}
              data-testid={`location-result-${i}`}
              onClick={() => handleSelect(r)}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/05 transition-all text-left group border-b border-white/05 last:border-0"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                style={{ background: 'rgba(59,130,246,0.15)' }}
              >
                <span>{getFlag(r.country_code)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold text-sm truncate group-hover:text-blue-300 transition-colors">
                  {r.name}
                </div>
                <div className="text-white/50 text-xs">
                  {[r.admin1, r.country].filter(Boolean).join(', ')}
                </div>
              </div>
              {r.population && (
                <div className="text-white/30 text-xs flex-shrink-0">
                  Pop: {(r.population / 1000).toFixed(0)}k
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
