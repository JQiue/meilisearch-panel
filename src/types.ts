export interface MeiliHealth {
  status: "available" | "unavailable";
}

export interface Index {
  uid: string;
  createdAt: string;
  updatedAt: string;
  primaryKey: string | null;
}

export interface IndexStats {
  numberOfDocuments: number;
  isIndexing: boolean;
  fieldDistribution: Record<string, number>;
}

export interface Task {
  uid: number;
  indexUid: string;
  status: "enqueued" | "processing" | "succeeded" | "failed";
  type: string;
  details: any;
  error: any;
  duration: string;
  enqueuedAt: string;
  startedAt: string;
  finishedAt: string;
}

export interface TasksResult {
  results: Task[];
  limit: number;
  from: number;
  next: number;
}

export interface Settings {
  displayedAttributes: string[];
  searchableAttributes: string[];
  filterableAttributes: string[];
  sortableAttributes: string[];
  rankingRules: string[];
  stopWords: string[];
  synonyms: Record<string, string[]>;
  distinctAttribute: string | null;
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
  key: string; // Only available on creation
  actions: string[];
  indexes: string[];
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VersionInfo {
  commitSha: string;
  buildDate: string;
  pkgVersion: string;
}

export interface InstanceStats {
  databaseSize: number;
  lastUpdate: string;
  indexes: {
    [uid: string]: {
      numberOfDocuments: number;
    };
  };
}
