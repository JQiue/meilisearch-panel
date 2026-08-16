import React, { useState } from "react";

import { MeilisearchService } from "../services/meilisearch";

import { PlusIcon, TrashIcon, EyeIcon } from "./icons";

import type { Index } from "../types";

interface IndexListProps {
  indexes: Index[];
  onSelectIndex: (uid: string) => void;
  service: MeilisearchService;
  refreshData: () => void;
}

export const IndexList: React.FC<IndexListProps> = ({
  indexes,
  onSelectIndex,
  service,
  refreshData,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newIndexUid, setNewIndexUid] = useState("");
  const [primaryKey, setPrimaryKey] = useState("");
  const [error, setError] = useState("");

  const handleCreateIndex = async () => {
    if (!newIndexUid) {
      setError("Index UID is required.");
      return;
    }
    setError("");
    try {
      await service.createIndex(newIndexUid, primaryKey || undefined);
      setNewIndexUid("");
      setPrimaryKey("");
      setShowCreateModal(false);
      setTimeout(refreshData, 500); // Give time for task to process
    } catch (e: any) {
      setError(e.message || "Failed to create index.");
    }
  };

  const handleDeleteIndex = async (uid: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete the index "${uid}"? This action cannot be undone.`,
      )
    ) {
      try {
        await service.deleteIndex(uid);
        setTimeout(refreshData, 500);
      } catch (e: any) {
        alert(`Failed to delete index: ${e.message}`);
      }
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Indexes</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        >
          <PlusIcon className="mr-2 h-5 w-5" />
          Create Index
        </button>
      </div>
      <div className="rounded-lg bg-white shadow-md dark:bg-gray-800">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300">
                UID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300">
                Primary Key
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300">
                Created At
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {indexes.map((index) => (
              <tr key={index.uid}>
                <td className="px-6 py-4 font-mono whitespace-nowrap text-red-600 dark:text-red-400">
                  {index.uid}
                </td>
                <td className="px-6 py-4 font-mono whitespace-nowrap">
                  {index.primaryKey || "Not set"}
                </td>
                <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                  {new Date(index.createdAt).toLocaleString()}
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                  <button
                    onClick={() => onSelectIndex(index.uid)}
                    className="p-2 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200"
                  >
                    <EyeIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteIndex(index.uid)}
                    className="p-2 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
            {indexes.length === 0 && (
              <tr>
                <td colSpan={4} className="py-10 text-center text-gray-500 dark:text-gray-400">
                  No indexes found. Create one to get started!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
            <h2 className="mb-4 text-2xl font-bold">Create New Index</h2>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="indexUid"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Index UID
                </label>
                <input
                  type="text"
                  id="indexUid"
                  value={newIndexUid}
                  onChange={(e) => setNewIndexUid(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-red-500 focus:ring-red-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label
                  htmlFor="primaryKey"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Primary Key (optional)
                </label>
                <input
                  type="text"
                  id="primaryKey"
                  value={primaryKey}
                  onChange={(e) => setPrimaryKey(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-red-500 focus:ring-red-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-md bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateIndex}
                className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
