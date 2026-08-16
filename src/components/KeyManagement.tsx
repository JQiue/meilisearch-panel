import React, { useState, useEffect, useCallback } from "react";

import { MeilisearchService } from "../services/meilisearch";

import { PlusIcon, TrashIcon, ClipboardCopyIcon } from "./icons";

import type { Key } from "../types";

interface KeyManagementProps {
  service: MeilisearchService;
}

const KeyCreateModal: React.FC<{
  onSave: (key: Omit<Key, "uid" | "key" | "createdAt" | "updatedAt">) => Promise<void>;
  onCancel: () => void;
}> = ({ onSave, onCancel }) => {
  const [description, setDescription] = useState("");
  const [actions, setActions] = useState("search");
  const [indexes, setIndexes] = useState("*");
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!description) {
      setError("Description is required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onSave({
        description,
        actions: actions
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        indexes: indexes
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      });
    } catch (e: any) {
      setError(e.message || "Failed to create key.");
      setLoading(false);
    }
  };

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
        <h2 className="mb-4 text-2xl font-bold">Create API Key</h2>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="key-desc"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Description
            </label>
            {/* FIX: Replaced custom 'input' class with standard Tailwind CSS classes and removed <style jsx> tag. */}
            <input
              id="key-desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-red-500 focus:ring-red-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="e.g. Frontend search key"
            />
          </div>
          <div>
            <label
              htmlFor="key-actions"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Actions (comma-separated)
            </label>
            <textarea
              id="key-actions"
              value={actions}
              onChange={(e) => setActions(e.target.value)}
              rows={2}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-gray-900 shadow-sm focus:border-red-500 focus:ring-red-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="search, documents.add, indexes.create"
            />
          </div>
          <div>
            <label
              htmlFor="key-indexes"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Indexes (comma-separated)
            </label>
            <textarea
              id="key-indexes"
              value={indexes}
              onChange={(e) => setIndexes(e.target.value)}
              rows={2}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-gray-900 shadow-sm focus:border-red-500 focus:ring-red-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="*, movies, products"
            />
          </div>
          <div>
            <label
              htmlFor="key-expires"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Expires At (optional)
            </label>
            <input
              id="key-expires"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-red-500 focus:ring-red-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:bg-red-400"
          >
            {loading ? "Creating..." : "Create Key"}
          </button>
        </div>
      </div>
    </div>
  );
};

const NewKeyModal: React.FC<{ apiKey: Key; onClose: () => void }> = ({ apiKey, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
        <h2 className="mb-2 text-2xl font-bold">API Key Created</h2>
        <p className="mb-4 text-sm text-yellow-600 dark:text-yellow-400">
          Please copy this key and store it securely. You will not be able to see it again.
        </p>
        <div className="relative rounded bg-gray-100 p-3 font-mono text-sm break-all dark:bg-gray-900">
          {apiKey.key}
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 rounded p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700"
            aria-label="Copy API Key"
          >
            <ClipboardCopyIcon className="h-5 w-5" />
          </button>
        </div>
        {copied && <p className="mt-2 text-xs text-green-500">Copied to clipboard!</p>}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export const KeyManagement: React.FC<KeyManagementProps> = ({ service }) => {
  const [keys, setKeys] = useState<Key[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<Key | null>(null);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await service.getKeys();
      setKeys(res.results);
    } catch (e: any) {
      setError(e.message || "Failed to fetch API keys.");
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleCreateKey = async (keyData: Omit<Key, "uid" | "key" | "createdAt" | "updatedAt">) => {
    const newKey = await service.createKey(keyData);
    setNewlyCreatedKey(newKey);
    setShowCreateModal(false);
  };

  const handleDeleteKey = async (uid: string) => {
    if (
      window.confirm("Are you sure you want to delete this API key? This action is irreversible.")
    ) {
      try {
        await service.deleteKey(uid);
        fetchKeys();
      } catch (e: any) {
        alert(`Failed to delete key: ${e.message}`);
      }
    }
  };

  const closeNewKeyModal = () => {
    setNewlyCreatedKey(null);
    fetchKeys();
  };

  if (loading) return <div>Loading API keys...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">API Keys</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        >
          <PlusIcon className="mr-2 h-5 w-5" />
          Create API Key
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg bg-white shadow-md dark:bg-gray-800">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300">
                Key (prefix)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300">
                Actions
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300">
                Indexes
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300">
                Expires At
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {keys.map((key) => (
              <tr key={key.uid}>
                <td className="max-w-sm px-6 py-4 break-words">{key.description || "-"}</td>
                <td className="px-6 py-4 font-mono text-sm whitespace-nowrap">
                  {key.uid.slice(0, 8)}...
                </td>
                <td className="px-6 py-4">
                  <div className="flex max-w-xs flex-wrap gap-1">
                    {key.actions.map((action) => (
                      <span
                        key={action}
                        className="rounded bg-gray-200 px-2 py-1 font-mono text-xs break-all dark:bg-gray-600"
                      >
                        {action}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex max-w-xs flex-wrap gap-1">
                    {key.indexes.map((index) => (
                      <span
                        key={index}
                        className="rounded bg-blue-100 px-2 py-1 font-mono text-xs break-all text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      >
                        {index}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {key.expiresAt ? new Date(key.expiresAt).toLocaleString() : "Never"}
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                  <button
                    onClick={() => handleDeleteKey(key.uid)}
                    className="p-2 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200"
                    aria-label={`Delete key ${key.description}`}
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
            {keys.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-gray-500 dark:text-gray-400">
                  No API keys found. Default keys may be hidden by Meilisearch.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <KeyCreateModal onSave={handleCreateKey} onCancel={() => setShowCreateModal(false)} />
      )}
      {newlyCreatedKey && <NewKeyModal apiKey={newlyCreatedKey} onClose={closeNewKeyModal} />}
    </div>
  );
};
