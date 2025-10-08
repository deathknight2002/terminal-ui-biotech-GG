import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import './GlobalSearch.css';

export interface SearchResult {
  id: number;
  name?: string;
  title?: string;
  ticker?: string;
  category?: string;
  type: 'disease' | 'company' | 'therapeutic' | 'catalyst' | 'article' | 'trial';
}

export interface SearchResults {
  diseases: SearchResult[];
  companies: SearchResult[];
  therapeutics: SearchResult[];
  catalysts: SearchResult[];
  articles: SearchResult[];
  trials: SearchResult[];
}

export interface GlobalSearchProps {
  onSearch: (query: string) => Promise<SearchResults>;
  onSelectResult: (result: SearchResult) => void;
  placeholder?: string;
  debounceMs?: number;
  minChars?: number;
  className?: string;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  onSearch,
  onSelectResult,
  placeholder = 'Search diseases, companies, therapeutics...',
  debounceMs = 300,
  minChars = 2,
  className = ''
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Flatten results for keyboard navigation
  const flatResults = results ? [
    ...results.diseases.map(r => ({ ...r, section: 'Diseases' })),
    ...results.companies.map(r => ({ ...r, section: 'Companies' })),
    ...results.therapeutics.map(r => ({ ...r, section: 'Therapeutics' })),
    ...results.catalysts.map(r => ({ ...r, section: 'Catalysts' })),
    ...results.articles.map(r => ({ ...r, section: 'Articles' })),
    ...results.trials.map(r => ({ ...r, section: 'Trials' }))
  ] : [];

  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < minChars) {
      setResults(null);
      return;
    }

    setLoading(true);
    try {
      const searchResults = await onSearch(searchQuery);
      setResults(searchResults);
      setSelectedIndex(0);
    } catch (error) {
      console.error('Search error:', error);
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, [onSearch, minChars]);

  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    if (query.length === 0) {
      setResults(null);
      return;
    }

    debounceTimeout.current = setTimeout(() => {
      performSearch(query);
    }, debounceMs);

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [query, debounceMs, performSearch]);

  const handleClear = () => {
    setQuery('');
    setResults(null);
    inputRef.current?.focus();
  };

  const handleSelectResult = (result: SearchResult) => {
    onSelectResult(result);
    setQuery('');
    setResults(null);
    setFocused(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!flatResults.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < flatResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : flatResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (flatResults[selectedIndex]) {
          handleSelectResult(flatResults[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        handleClear();
        break;
    }
  };

  const renderResultSection = (title: string, items: SearchResult[], icon: string) => {
    if (!items.length) return null;

    return (
      <div className="search-section">
        <div className="search-section-header">
          <span className="section-icon">{icon}</span>
          <span className="section-title">{title}</span>
          <span className="section-count">{items.length}</span>
        </div>
        <div className="search-section-items">
          {items.map((item, index) => {
            const flatIndex = flatResults.findIndex(r => r.id === item.id && r.type === item.type);
            return (
              <button
                key={`${item.type}-${item.id}`}
                className={`search-result-item ${selectedIndex === flatIndex ? 'selected' : ''}`}
                onClick={() => handleSelectResult(item)}
                onMouseEnter={() => setSelectedIndex(flatIndex)}
              >
                <div className="result-primary">
                  {item.name || item.title}
                  {item.ticker && <span className="result-ticker">{item.ticker}</span>}
                </div>
                {item.category && (
                  <div className="result-secondary">{item.category}</div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const showResults = focused && results && (
    results.diseases.length > 0 ||
    results.companies.length > 0 ||
    results.therapeutics.length > 0 ||
    results.catalysts.length > 0 ||
    results.articles.length > 0 ||
    results.trials.length > 0
  );

  return (
    <div className={`global-search ${className}`}>
      <div className="search-input-wrapper">
        <Search size={18} className="search-icon" />
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          onKeyDown={handleKeyDown}
          aria-label="Global search"
          aria-autocomplete="list"
          aria-controls="search-results"
          aria-expanded={showResults}
        />
        {loading && <div className="search-loading" />}
        {query && !loading && (
          <button
            className="search-clear"
            onClick={handleClear}
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {showResults && (
        <div
          ref={resultsRef}
          id="search-results"
          className="search-results"
          role="listbox"
        >
          {renderResultSection('Diseases', results.diseases, '🏥')}
          {renderResultSection('Companies', results.companies, '🏢')}
          {renderResultSection('Therapeutics', results.therapeutics, '💊')}
          {renderResultSection('Catalysts', results.catalysts, '📅')}
          {renderResultSection('Articles', results.articles, '📰')}
          {renderResultSection('Trials', results.trials, '🔬')}
          
          {flatResults.length === 0 && !loading && (
            <div className="search-empty">
              No results found for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
