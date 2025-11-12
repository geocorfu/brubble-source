'use client';

import React, { useState } from 'react';
import { Search, Sparkles } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

export default function SearchBar({ onSearch, isLoading = false }: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <div className="absolute left-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your search query to explore different perspectives..."
            disabled={isLoading}
            className="w-full pl-12 pr-32 py-4 text-lg border-2 border-gray-300 rounded-xl
                     focus:border-blue-500 focus:ring-4 focus:ring-blue-100
                     transition-all duration-200 outline-none
                     disabled:bg-gray-100 disabled:cursor-not-allowed"
          />

          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="absolute right-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600
                     text-white font-semibold rounded-lg
                     hover:from-blue-700 hover:to-purple-700
                     disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed
                     transition-all duration-200 flex items-center gap-2
                     shadow-lg hover:shadow-xl"
          >
            {isLoading ? (
              <>
                <Sparkles className="h-4 w-4 animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Brubble</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Quick examples */}
      <div className="mt-4 flex flex-wrap gap-2 justify-center">
        <span className="text-sm text-gray-600">Try:</span>
        {[
          'climate change solutions',
          'artificial intelligence ethics',
          'renewable energy future',
          'healthcare reform'
        ].map((example) => (
          <button
            key={example}
            onClick={() => setQuery(example)}
            disabled={isLoading}
            className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200
                     rounded-full transition-colors duration-150
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}
