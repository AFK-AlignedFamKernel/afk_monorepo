'use client';

import React, { useState } from 'react';

interface SearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export const Search: React.FC<SearchProps> = ({ onSearch, placeholder = 'Search tokens...' }) => {
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={handleSearch}
        placeholder={placeholder}
        className="w-full px-4 py-2 pl-10 bg-shade-50 dark:bg-shade-800 border border-shade-200 dark:border-shade-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
      <svg
        className="absolute left-3 top-2.5 h-5 w-5 text-shade-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    </div>
  );
}; 