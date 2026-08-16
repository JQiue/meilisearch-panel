import React, { useState, useCallback } from "react";

import { MeilisearchService } from "../services/meilisearch";

interface SearchPlaygroundProps {
  indexUid: string;
  service: MeilisearchService;
}

export const SearchPlayground: React.FC<SearchPlaygroundProps> = ({ indexUid, service }) => {
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(20);
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState("");

  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const options: any = { limit };
      if (filter) options.filter = filter;
      if (sort) options.sort = sort.split(",").map((s) => s.trim());

      const res = await service.search(indexUid, query, options);
      setResults(res);
    } catch (e: any) {
      setError(e.message || "Failed to perform search.");
      setResults({ error: e.message });
    } finally {
      setLoading(false);
    }
  }, [indexUid, service, query, limit, filter, sort]);

  return (
    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="h-min space-y-4 rounded-lg bg-white p-6 shadow-md lg:col-span-1 dark:bg-gray-800">
        <h2 className="mb-4 text-2xl font-bold">Search Parameters</h2>

        <div>
          <label
            htmlFor="query"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Query (q)
          </label>
          <input
            type="text"
            id="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for..."
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-red-500 focus:ring-red-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label
            htmlFor="limit"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Limit
          </label>
          <input
            type="number"
            id="limit"
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value, 10))}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-red-500 focus:ring-red-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label
            htmlFor="filter"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Filter
          </label>
          <input
            type="text"
            id="filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="e.g. genre = 'sci-fi'"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-gray-900 shadow-sm focus:border-red-500 focus:ring-red-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label
            htmlFor="sort"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Sort
          </label>
          <input
            type="text"
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            placeholder="e.g. price:asc, rating:desc"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-gray-900 shadow-sm focus:border-red-500 focus:ring-red-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <button
          onClick={handleSearch}
          disabled={loading}
          className="w-full rounded-md bg-red-600 px-6 py-2 text-white hover:bg-red-700 disabled:bg-red-400"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      <div className="rounded-lg bg-white p-6 shadow-md lg:col-span-2 dark:bg-gray-800">
        <h2 className="mb-4 text-2xl font-bold">Results</h2>
        {results && (
          <div className="mb-4 flex space-x-4 text-sm text-gray-500 dark:text-gray-400">
            {results.processingTimeMs != null && (
              <span>
                Time: <strong>{results.processingTimeMs}ms</strong>
              </span>
            )}
            {results.estimatedTotalHits != null && (
              <span>
                Hits: <strong>{results.estimatedTotalHits}</strong>
              </span>
            )}
          </div>
        )}
        <div className="rounded-md bg-gray-100 p-4 dark:bg-gray-900">
          <pre className="h-[60vh] overflow-auto text-xs break-all whitespace-pre-wrap">
            {loading && "Loading..."}
            {error && `Error: ${error}`}
            {results ? JSON.stringify(results, null, 2) : "Perform a search to see results here."}
          </pre>
        </div>
      </div>
    </div>
  );
};
