import React, { useState, useEffect } from 'react';
import { StoredConnection } from '../types';
import { PlusIcon, TrashIcon, ServerIcon, PencilIcon } from './icons';

interface ConnectionFormProps {
  onSave: (connection: Omit<StoredConnection, 'id'>) => Promise<void>;
  onCancel: () => void;
  initialData?: StoredConnection | null;
}

const ConnectionModal: React.FC<ConnectionFormProps> = ({ onSave, onCancel, initialData }) => {
  const isEditing = !!initialData;
  const [name, setName] = useState(initialData?.name || '');
  const [host, setHost] = useState(initialData?.host || 'http://localhost:7700');
  const [apiKey, setApiKey] = useState(initialData?.apiKey || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setHost(initialData.host);
      setApiKey(initialData.apiKey);
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setError('Instance Name is required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSave({ name, host, apiKey });
    } catch (err: any) {
      setError(err.message || 'Failed to connect and save.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">
          {isEditing ? 'Edit Instance' : 'Add New Instance'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Instance Name
            </label>
            <input
              id="name"
              type="text"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm text-gray-900 dark:text-white dark:bg-gray-700"
              placeholder="My Local Meili"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label
              htmlFor="host"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Meilisearch Host
            </label>
            <input
              id="host"
              type="url"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm text-gray-900 dark:text-white dark:bg-gray-700"
              placeholder="http://localhost:7700"
              value={host}
              onChange={(e) => setHost(e.target.value)}
            />
          </div>
          <div>
            <label
              htmlFor="api-key"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              API Key
            </label>
            <input
              id="api-key"
              type="password"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm text-gray-900 dark:text-white dark:bg-gray-700"
              placeholder="API Key (optional)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:bg-red-400"
            >
              {loading ? 'Testing...' : isEditing ? 'Test & Save' : 'Test & Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface InstanceManagementScreenProps {
  connections: StoredConnection[];
  onConnect: (connection: StoredConnection) => void;
  onAdd: (connection: Omit<StoredConnection, 'id'>) => Promise<StoredConnection>;
  onUpdate: (connection: StoredConnection) => Promise<StoredConnection>;
  onDelete: (id: string) => void;
}

export const ConnectionScreen: React.FC<InstanceManagementScreenProps> = ({
  connections,
  onConnect,
  onAdd,
  onUpdate,
  onDelete,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [connectionToEdit, setConnectionToEdit] = useState<StoredConnection | null>(null);

  const handleSaveConnection = async (data: Omit<StoredConnection, 'id'>) => {
    if (connectionToEdit) {
      await onUpdate({ ...data, id: connectionToEdit.id });
    } else {
      const newConnection = await onAdd(data);
      onConnect(newConnection);
    }
    setShowModal(false);
    setConnectionToEdit(null);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this connection?')) {
      onDelete(id);
    }
  };

  const handleOpenEditModal = (e: React.MouseEvent, conn: StoredConnection) => {
    e.stopPropagation();
    setConnectionToEdit(conn);
    setShowModal(true);
  };

  const handleOpenAddModal = () => {
    setConnectionToEdit(null);
    setShowModal(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-2xl p-8 space-y-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Meilisearch Panel</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Select an instance to connect to
          </p>
        </div>
        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
          {connections.map((conn) => (
            <div
              key={conn.id}
              onClick={() => onConnect(conn)}
              className="p-4 border dark:border-gray-700 rounded-lg flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
            >
              <div className="flex items-center">
                <ServerIcon className="h-6 w-6 text-gray-500 mr-4" />
                <div>
                  <h3 className="font-semibold text-lg">{conn.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{conn.host}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => handleOpenEditModal(e, conn)}
                  className="p-2 text-gray-500 hover:text-blue-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={(e) => handleDelete(e, conn.id)}
                  className="p-2 text-gray-500 hover:text-red-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => onConnect(conn)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Connect
                </button>
              </div>
            </div>
          ))}
          {connections.length === 0 && (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400">
              <p>No instances saved yet.</p>
              <p>Add one to get started.</p>
            </div>
          )}
        </div>
        <div>
          <button
            onClick={handleOpenAddModal}
            className="group relative w-full flex justify-center items-center py-2 px-4 border border-dashed border-gray-400 dark:border-gray-500 text-sm font-medium rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add New Instance
          </button>
        </div>
        {showModal && (
          <ConnectionModal
            onSave={handleSaveConnection}
            onCancel={() => setShowModal(false)}
            initialData={connectionToEdit}
          />
        )}
      </div>
    </div>
  );
};
