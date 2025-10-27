import React, { useState } from 'react';
import { Index } from '../types';
import { MeilisearchService } from '../services/meilisearch';
import { PlusIcon, TrashIcon, EyeIcon } from './icons';

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
  const [newIndexUid, setNewIndexUid] = useState('');
  const [primaryKey, setPrimaryKey] = useState('');
  const [error, setError] = useState('');

  const handleCreateIndex = async () => {
    if (!newIndexUid) {
      setError('Index UID is required.');
      return;
    }
    setError('');
    try {
      await service.createIndex(newIndexUid, primaryKey || undefined);
      setNewIndexUid('');
      setPrimaryKey('');
      setShowCreateModal(false);
      setTimeout(refreshData, 500); // Give time for task to process
    } catch (e: any) {
      setError(e.message || 'Failed to create index.');
    }
  };

  const handleDeleteIndex = async (uid: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete the index "${uid}"? This action cannot be undone.`
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Indexes</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Index
        </button>
      </div>
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                UID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Primary Key
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Created At
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {indexes.map((index) => (
              <tr key={index.uid}>
                <td className="px-6 py-4 whitespace-nowrap font-mono text-red-600 dark:text-red-400">
                  {index.uid}
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-mono">
                  {index.primaryKey || 'Not set'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {new Date(index.createdAt).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => onSelectIndex(index.uid)}
                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200 p-2"
                  >
                    <EyeIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteIndex(index.uid)}
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 p-2"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
            {indexes.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-10 text-gray-500 dark:text-gray-400">
                  No indexes found. Create one to get started!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Create New Index</h2>
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
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm text-gray-900 dark:text-white dark:bg-gray-700"
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
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm text-gray-900 dark:text-white dark:bg-gray-700"
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateIndex}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
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
