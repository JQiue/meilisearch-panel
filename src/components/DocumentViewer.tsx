import React, { useState, useEffect, useCallback } from "react";

import { MeilisearchService } from "../services/meilisearch";

import { SearchIcon, TrashIcon, PlusIcon } from "./icons";

interface DocumentViewerProps {
  indexUid: string;
  service: MeilisearchService;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ indexUid, service }) => {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDocsJson, setNewDocsJson] = useState(
    '[\n  {\n    "id": 1,\n    "title": "My first document"\n  }\n]',
  );

  const fetchDocuments = useCallback(
    async (currentOffset: number) => {
      setLoading(true);
      setError(null);
      try {
        if (searchQuery) {
          const res = await service.search(indexUid, searchQuery, { limit, offset: currentOffset });
          setDocs(res.hits);
          setTotal(res.estimatedTotalHits);
        } else {
          const res = await service.getDocuments(indexUid, { limit, offset: currentOffset });
          setDocs(res.results);
          setTotal(res.total);
        }
      } catch (e: any) {
        setError(e.message || "Failed to fetch documents.");
      } finally {
        setLoading(false);
      }
    },
    [indexUid, service, searchQuery, limit],
  );

  useEffect(() => {
    setOffset(0);
    fetchDocuments(0);
  }, [searchQuery, fetchDocuments]);

  useEffect(() => {
    fetchDocuments(offset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleDeleteDoc = async (docId: string | number) => {
    if (window.confirm(`Are you sure you want to delete document ${docId}?`)) {
      try {
        await service.deleteDocument(indexUid, docId);
        setTimeout(() => fetchDocuments(offset), 500);
      } catch (e: any) {
        alert(`Error deleting document: ${e.message}`);
      }
    }
  };

  const handleAddDocuments = async () => {
    try {
      const documents = JSON.parse(newDocsJson);
      if (!Array.isArray(documents)) {
        throw new Error("Input must be a JSON array of documents.");
      }
      await service.addDocuments(indexUid, documents);
      setShowAddModal(false);
      setNewDocsJson('[\n  {\n    "id": 1,\n    "title": "My first document"\n  }\n]');
      setTimeout(() => fetchDocuments(offset), 500);
    } catch (e: any) {
      alert(`Error adding documents: ${e.message}`);
    }
  };

  const primaryKey =
    docs.length > 0
      ? Object.keys(docs[0]).find((k) => k === "id") || Object.keys(docs[0])[0]
      : "id";

  return (
    <div className="mt-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full rounded-lg border py-2 pr-4 pl-10 focus:ring-2 focus:ring-red-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
          />
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <SearchIcon className="h-5 w-5 text-gray-400" />
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          <PlusIcon className="mr-2 h-5 w-5" />
          Add Documents
        </button>
      </div>

      {loading && <p>Loading documents...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div className="overflow-hidden rounded-lg bg-white shadow-md dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300">
                  Document
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {docs.map((doc, index) => (
                <tr key={doc[primaryKey] || index}>
                  <td className="px-6 py-4">
                    <pre className="max-h-60 overflow-auto rounded bg-gray-100 p-2 text-xs dark:bg-gray-900">
                      {JSON.stringify(doc, null, 2)}
                    </pre>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => handleDeleteDoc(doc[primaryKey])}
                      className="p-2 text-red-600 hover:text-red-800"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Showing {offset + 1} to {Math.min(offset + limit, total)} of {total} results
        </p>
        <div className="space-x-2">
          <button
            onClick={() => setOffset(Math.max(0, offset - limit))}
            disabled={offset === 0}
            className="rounded-md border px-4 py-2 disabled:opacity-50 dark:border-gray-600"
          >
            Previous
          </button>
          <button
            onClick={() => setOffset(offset + limit)}
            disabled={offset + limit >= total}
            className="rounded-md border px-4 py-2 disabled:opacity-50 dark:border-gray-600"
          >
            Next
          </button>
        </div>
      </div>
      {showAddModal && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
            <h2 className="mb-4 text-2xl font-bold">Add/Update Documents</h2>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              Enter a JSON array of documents to add or update.
            </p>
            <textarea
              value={newDocsJson}
              onChange={(e) => setNewDocsJson(e.target.value)}
              className="h-80 w-full rounded border p-2 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
            />
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-md bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleAddDocuments}
                className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Add Documents
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
