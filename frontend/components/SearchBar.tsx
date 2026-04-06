"use client";

import { FormEvent, useEffect, useState } from "react";

interface SearchBarProps {
  defaultValue?: string;
  onSearch: (q: string) => void;
  loading?: boolean;
}

export default function SearchBar({
  defaultValue = "",
  onSearch,
  loading = false,
}: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);
  const [error, setError] = useState("");

  useEffect(() => {
    setQuery(defaultValue);
  }, [defaultValue]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setError("Enter at least 2 characters");
      return;
    }

    setError("");
    onSearch(trimmed);
  };

  return (
    <div className="w-full">
      <form
        onSubmit={handleSubmit}
        className="flex w-full flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-3 shadow-lg shadow-blue-100/40 sm:flex-row"
      >
        <input
          type="text"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            if (error) {
              setError("");
            }
          }}
          placeholder="Search for headphones, milk, phone case..."
          className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          aria-label="Search products"
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Searching
            </>
          ) : (
            "Search"
          )}
        </button>
      </form>
      {error ? <p className="mt-2 text-sm font-medium text-red-600">{error}</p> : null}
    </div>
  );
}
