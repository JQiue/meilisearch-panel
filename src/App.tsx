import { createRouter, RouterProvider } from "@tanstack/react-router";
import { Meilisearch } from "meilisearch";
import React, { useEffect, useSyncExternalStore } from "react";

import { generateUUID } from "./helper";
import { routeTree } from "./routeTree.gen";

import type { StoredConnection } from "./types";

const STORAGE_KEY = "meilisearch-connections";

let connections: StoredConnection[] = loadFromStorage();
const listeners = new Set<() => void>();

function loadFromStorage(): StoredConnection[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to load connections from localStorage", e);
    return [];
  }
}

function persist(next: StoredConnection[]) {
  connections = next;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

export function useConnections(): StoredConnection[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    () => connections,
  );
}

export interface RouterContext {
  connections: StoredConnection[];
  addConnection: (data: Omit<StoredConnection, "id">) => Promise<StoredConnection>;
  updateConnection: (conn: StoredConnection) => Promise<StoredConnection>;
  deleteConnection: (id: string) => void;
}

async function assertHealthy(host: string, apiKey: string) {
  const client = new Meilisearch({ host, apiKey });
  const health = await client.health();
  if (health.status !== "available") {
    throw new Error("Meilisearch is not available. Status: " + health.status);
  }
}

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  scrollRestoration: true,
  context: {
    connections,
    addConnection: async (data) => {
      await assertHealthy(data.host, data.apiKey);
      const connection = { ...data, id: generateUUID() };
      persist([...connections, connection]);
      return connection;
    },
    updateConnection: async (updated) => {
      await assertHealthy(updated.host, updated.apiKey);
      persist(connections.map((c) => (c.id === updated.id ? updated : c)));
      return updated;
    },
    deleteConnection: (id) => {
      persist(connections.filter((c) => c.id !== id));
    },
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export const App: React.FC = () => {
  const conns = useConnections();

  useEffect(() => {
    router.update({ context: { ...router.options.context, connections: conns } });
  }, [conns]);

  return <RouterProvider router={router} />;
};

export default App;
