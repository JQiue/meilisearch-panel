import React, { useState, useMemo, useCallback, useEffect } from "react";

import { ConnectionScreen } from "./components/ConnectionScreen";
import { Dashboard } from "./components/Dashboard";
import { MeilisearchService } from "./services/meilisearch";

import type { StoredConnection } from "./types";

const STORAGE_KEY = "meilisearch-connections";

// Function to generate a UUID, compatible with HTTP and HTTPS contexts.
function generateUUID() {
  // Use crypto.randomUUID if available (in secure contexts)
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for non-secure contexts
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const App: React.FC = () => {
  const [connections, setConnections] = useState<StoredConnection[]>([]);
  const [activeConnection, setActiveConnection] = useState<StoredConnection | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setConnections(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load connections from localStorage", e);
    }
  }, []);

  const saveConnections = (updatedConnections: StoredConnection[]) => {
    setConnections(updatedConnections);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedConnections));
  };

  const meilisearchService = useMemo(() => {
    if (activeConnection) {
      return new MeilisearchService(activeConnection.host, activeConnection.apiKey);
    }
    return null;
  }, [activeConnection]);

  const handleConnect = useCallback((connection: StoredConnection) => {
    setActiveConnection(connection);
  }, []);

  const handleDisconnect = useCallback(() => {
    setActiveConnection(null);
  }, []);

  const handleAddConnection = useCallback(
    async (newConnection: Omit<StoredConnection, "id">): Promise<StoredConnection> => {
      const service = new MeilisearchService(newConnection.host, newConnection.apiKey);
      const health = await service.getHealth();
      if (health.status !== "available") {
        throw new Error("Meilisearch is not available. Status: " + health.status);
      }

      const connectionWithId = { ...newConnection, id: generateUUID() };
      const updatedConnections = [...connections, connectionWithId];
      saveConnections(updatedConnections);
      return connectionWithId;
    },
    [connections],
  );

  const handleUpdateConnection = useCallback(
    async (updatedConnection: StoredConnection): Promise<StoredConnection> => {
      const service = new MeilisearchService(updatedConnection.host, updatedConnection.apiKey);
      const health = await service.getHealth();
      if (health.status !== "available") {
        throw new Error("Meilisearch is not available. Status: " + health.status);
      }

      const updatedConnections = connections.map((c) =>
        c.id === updatedConnection.id ? updatedConnection : c,
      );
      saveConnections(updatedConnections);

      if (activeConnection?.id === updatedConnection.id) {
        setActiveConnection(updatedConnection);
      }
      return updatedConnection;
    },
    [connections, activeConnection],
  );

  const handleDeleteConnection = useCallback(
    (id: string) => {
      const updatedConnections = connections.filter((c) => c.id !== id);
      saveConnections(updatedConnections);
    },
    [connections],
  );

  if (!activeConnection || !meilisearchService) {
    return (
      <ConnectionScreen
        connections={connections}
        onConnect={handleConnect}
        onAdd={handleAddConnection}
        onDelete={handleDeleteConnection}
        onUpdate={handleUpdateConnection}
      />
    );
  }

  return (
    <Dashboard
      service={meilisearchService}
      connection={activeConnection}
      onDisconnect={handleDisconnect}
      allConnections={connections}
      onSwitchInstance={handleConnect}
    />
  );
};

export default App;
