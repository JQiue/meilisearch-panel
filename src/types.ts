export interface MeiliHealth {
  status: "available" | "unavailable";
}

export interface Index {
  uid: string;
  createdAt: string;
  updatedAt: string;
  primaryKey?: string | null;
}

export interface IndexStats {
  numberOfDocuments: number;
  isIndexing: boolean;
  fieldDistribution: Record<string, number>;
}

export interface Task {
  uid: number;
  indexUid: string | null;
  status: "enqueued" | "processing" | "succeeded" | "failed" | "canceled";
  type: string;
  details?: any;
  error: any;
  duration: string | null;
  enqueuedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface TasksResult {
  results: Task[];
  limit: number;
  from: number;
  next: number;
}

export interface Settings {
  displayedAttributes?: string[] | null;
  searchableAttributes?: string[] | null;
  filterableAttributes?: string[] | null;
  sortableAttributes?: string[] | null;
  rankingRules?: string[] | null;
  stopWords?: string[] | null;
  synonyms?: Record<string, string[]> | null;
  distinctAttribute?: string | null;
  [key: string]: any;
}

export interface StoredConnection {
  id: string;
  name: string;
  host: string;
  apiKey: string;
}

export interface Key {
  uid: string;
  description: string;
  name: string | null;
  key: string; // Only available on creation
  actions: string[];
  indexes: string[];
  expiresAt: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface VersionInfo {
  commitSha: string;
  buildDate: string;
  pkgVersion: string;
}

export interface InstanceStats {
  databaseSize: number;
  usedDatabaseSize: number;
  lastUpdate: string;
  indexes: {
    [uid: string]: {
      numberOfDocuments: number;
      isIndexing: boolean;
    };
  };
}
