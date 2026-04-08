"use client";

import { FormEvent, useEffect, useState } from "react";

interface SearchBarProps {
  defaultValue?: string;
  onSearch: (q: string) => void;
  loading?: boolean;
}

export default function SearchBar({ defaultValue = "", onSearch, loading = false }: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState(false);

  useEffect(() => { setQuery(defaultValue); }, [defaultValue]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length < 2) { setError("Enter at least 2 characters"); return; }
    setError("");
    onSearch(trimmed);
  };

  return (
    <div className="w-full">
      <form
        onSubmit={handleSubmit}
        className={`glass-card glow-ring flex w-full flex-col gap-3 rounded-2xl p-2 transition-all duration-500 sm:flex-row ${
          focused ? "border-[rgba(255,255,255,0.2)] shadow-glow-md" : ""
        }`}
      >
        <div className="relative min-w-0 flex-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className={`absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 transition-all duration-500 ${focused ? "text-white scale-110" : "text-[#525252]"}`}>
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="text" value={query}
            onChange={(e) => { setQuery(e.target.value); if (error) setError(""); }}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            placeholder="Search for headphones, milk, phone case..."
            className="w-full rounded-xl bg-transparent py-4 pl-12 pr-4 text-[15px] text-white placeholder:text-[#3a3a3a] focus:outline-none"
            aria-label="Search products"
          />
        </div>
        <button type="submit" disabled={loading} className="btn-gradient inline-flex items-center justify-center gap-2 rounded-xl px-7 py-4 text-sm">
          {loading ? (<><span className="spinner-orbital-sm" /> Searching</>) : (<>Search</>)}
        </button>
      </form>
      {error ? <p className="mt-2 text-sm font-medium text-[#a3a3a3]">{error}</p> : null}
    </div>
  );
}
