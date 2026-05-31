// components/ui/SearchBar.tsx
import React, { useState, useEffect, useRef } from 'react';
import { getPlaceSuggestions, Suggestion, saveSearchToHistory, getSearchHistory, removeSearchFromHistory } from '@/services/geocodingService';

interface SearchBarProps {
  onSearch: (lat: number, lon: number, query: string) => void;
  placeholder?: string;
}

export function SearchBar({ onSearch, placeholder = "Buscar zona, calle o ciudad..." }: SearchBarProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<Array<{ query: string; lat: number; lon: number; timestamp: number }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Cargar historial al montar
  useEffect(() => {
    setHistory(getSearchHistory());
  }, []);

  // Cerrar sugerencias/historial al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setShowHistory(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounce para obtener sugerencias
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (inputValue.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      setIsLoading(true);
      const results = await getPlaceSuggestions(inputValue);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setIsLoading(false);
    }, 300);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [inputValue]);

  const handleSearch = (lat: number, lon: number, query: string) => {
    saveSearchToHistory(query, lat, lon);
    setHistory(getSearchHistory());
    setInputValue(query);
    setShowSuggestions(false);
    setShowHistory(false);
    onSearch(lat, lon, query);
  };

  const handleInputFocus = () => {
    const historyItems = getSearchHistory();
    setHistory(historyItems);
    if (historyItems.length > 0 && !inputValue.trim()) {
      setShowHistory(true);
    }
  };

  const handleSelectSuggestion = (suggestion: Suggestion) => {
    handleSearch(suggestion.lat, suggestion.lon, suggestion.displayName);
  };

  const handleSelectHistory = (item: { query: string; lat: number; lon: number }) => {
    handleSearch(item.lat, item.lon, item.query);
  };

  const handleRemoveHistory = (index: number, event: React.MouseEvent) => {
    event.stopPropagation();
    removeSearchFromHistory(index);
    setHistory(getSearchHistory());
  };

  const handleClearHistory = () => {
    localStorage.removeItem('rdp_search_history');
    setHistory([]);
    setShowHistory(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      // Si hay sugerencias, usar la primera
      if (suggestions.length > 0) {
        handleSelectSuggestion(suggestions[0]);
      }
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-[900px] mx-auto">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-4 rounded-2xl border border-[#e5e7eb] bg-white/90 px-4 py-2 shadow-sm">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="7" cy="7" r="5.5" stroke="#8c7851" strokeWidth="1.5" />
            <path d="M11.2 11.2L16 16" stroke="#8c7851" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={handleInputFocus}
            className="w-full bg-transparent text-sm font-medium text-[#716040] placeholder:text-[#b7a888] focus:outline-none"
            placeholder={placeholder}
          />
          {isLoading && (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#8c7851] border-t-transparent" />
          )}
        </div>
      </form>

      {/* Sugerencias / Historial */}
      {(showSuggestions || showHistory) && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-[#e5e7eb] bg-white shadow-lg max-h-80 overflow-y-auto">
          {showSuggestions && suggestions.length > 0 && (
            <>
              <div className="px-3 py-2 text-xs font-semibold text-[#716040] border-b">Sugerencias</div>
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.placeId}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-[#f6f1e7] transition-colors flex items-start gap-2"
                  onClick={() => handleSelectSuggestion(suggestion)}
                >
                  <svg className="w-4 h-4 text-[#8c7851] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="flex-1 truncate">{suggestion.displayName}</span>
                </button>
              ))}
            </>
          )}

          {showHistory && !inputValue.trim() && history.length > 0 && (
            <>
              <div className="px-3 py-2 text-xs font-semibold text-[#716040] border-b flex justify-between items-center">
                <span>Búsquedas recientes</span>
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Limpiar historial
                </button>
              </div>
              {history.map((item, index) => (
                <button
                  key={index}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-[#f6f1e7] transition-colors flex items-center justify-between group"
                  onClick={() => handleSelectHistory(item)}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <svg className="w-4 h-4 text-[#8c7851] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="truncate flex-1">{item.query}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleRemoveHistory(index, e)}
                    className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 p-1 rounded-full transition"
                    aria-label="Eliminar"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}