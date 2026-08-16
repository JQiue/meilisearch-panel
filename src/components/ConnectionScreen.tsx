import React, { useState, useEffect } from "react";

import { PlusIcon, TrashIcon, ServerIcon, PencilIcon } from "./icons";

import type { StoredConnection } from "../types";

interface ConnectionFormProps {
  onSave: (connection: Omit<StoredConnection, "id">) => Promise<void>;
  onCancel: () => void;
  initialData?: StoredConnection | null;
}

const ConnectionModal: React.FC<ConnectionFormProps> = ({ onSave, onCancel, initialData }) => {
  const isEditing = !!initialData;
  const [name, setName] = useState(initialData?.name || "");
  const [host, setHost] = useState(initialData?.host || "http://localhost:7700");
  const [apiKey, setApiKey] = useState(initialData?.apiKey || "");
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
      setError("Instance Name is required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSave({ name, host, apiKey });
    } catch (err: any) {
      setError(err.message || "Failed to connect and save.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
        <h2 className="mb-4 text-2xl font-bold">
          {isEditing ? "Edit Instance" : "Add New Instance"}
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
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-red-500 focus:ring-red-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-red-500 focus:ring-red-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-red-500 focus:ring-red-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="API Key (optional)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:bg-red-400"
            >
              {loading ? "Testing..." : isEditing ? "Test & Save" : "Test & Save"}
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
  onAdd: (connection: Omit<StoredConnection, "id">) => Promise<StoredConnection>;
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

  const handleSaveConnection = async (data: Omit<StoredConnection, "id">) => {
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
    if (window.confirm("Are you sure you want to delete this connection?")) {
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
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-2xl space-y-8 rounded-lg bg-white p-8 shadow-lg dark:bg-gray-800">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Meilisearch Panel</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Select an instance to connect to
          </p>
        </div>
        <div className="max-h-[50vh] space-y-4 overflow-y-auto pr-2">
          {connections.map((conn) => (
            <div
              key={conn.id}
              onClick={() => onConnect(conn)}
              className="flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors duration-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50"
            >
              <div className="flex items-center">
                <ServerIcon className="mr-4 h-6 w-6 text-gray-500" />
                <div>
                  <h3 className="text-lg font-semibold">{conn.name}</h3>
                  <p className="font-mono text-sm text-gray-500 dark:text-gray-400">{conn.host}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => handleOpenEditModal(e, conn)}
                  className="rounded-full p-2 text-gray-500 hover:bg-gray-200 hover:text-blue-500 dark:hover:bg-gray-600"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={(e) => handleDelete(e, conn.id)}
                  className="rounded-full p-2 text-gray-500 hover:bg-gray-200 hover:text-red-500 dark:hover:bg-gray-600"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => onConnect(conn)}
                  className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                >
                  Connect
                </button>
              </div>
            </div>
          ))}
          {connections.length === 0 && (
            <div className="py-10 text-center text-gray-500 dark:text-gray-400">
              <p>No instances saved yet.</p>
              <p>Add one to get started.</p>
            </div>
          )}
        </div>
        <div>
          <button
            onClick={handleOpenAddModal}
            className="group relative flex w-full items-center justify-center rounded-md border border-dashed border-gray-400 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 focus:outline-none dark:border-gray-500 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <PlusIcon className="mr-2 h-5 w-5" />
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
