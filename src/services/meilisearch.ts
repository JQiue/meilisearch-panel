import {
  MeiliHealth,
  Index,
  IndexStats,
  Task,
  TasksResult,
  Settings,
  Key,
  VersionInfo,
  InstanceStats,
} from '../types';

export class MeilisearchService {
  private host: string;
  private apiKey: string;

  constructor(host: string, apiKey: string) {
    this.host = host.endsWith('/') ? host.slice(0, -1) : host;
    this.apiKey = apiKey;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.host}${endpoint}`;
    const headers = new Headers({
      'Content-Type': 'application/json',
      ...options.headers,
    });
    if (this.apiKey) {
      headers.set('Authorization', `Bearer ${this.apiKey}`);
    }

    try {
      const response = await fetch(url, { ...options, headers });
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: 'An unknown error occurred' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      if (response.status === 202 || response.status === 204) {
        return null as T;
      }
      return response.json() as Promise<T>;
    } catch (error) {
      console.error('Meilisearch API Error:', error);
      throw error;
    }
  }

  // Health
  getHealth = (): Promise<MeiliHealth> => this.request<MeiliHealth>('/health');

  // Indexes
  getIndexes = (): Promise<{ results: Index[] }> => this.request<{ results: Index[] }>('/indexes');
  getIndex = (uid: string): Promise<Index> => this.request<Index>(`/indexes/${uid}`);
  createIndex = (uid: string, primaryKey?: string): Promise<Task> =>
    this.request<Task>('/indexes', {
      method: 'POST',
      body: JSON.stringify({ uid, primaryKey }),
    });
  deleteIndex = (uid: string): Promise<Task> =>
    this.request<Task>(`/indexes/${uid}`, { method: 'DELETE' });
  getIndexStats = (uid: string): Promise<IndexStats> =>
    this.request<IndexStats>(`/indexes/${uid}/stats`);

  // Documents
  getDocuments = <T>(
    uid: string,
    params: Record<string, any> = {}
  ): Promise<{ results: T[]; limit: number; offset: number; total: number }> => {
    const query = new URLSearchParams(params).toString();
    return this.request<{ results: T[]; limit: number; offset: number; total: number }>(
      `/indexes/${uid}/documents?${query}`
    );
  };
  addDocuments = (uid: string, documents: any[]): Promise<Task> =>
    this.request<Task>(`/indexes/${uid}/documents`, {
      method: 'POST',
      body: JSON.stringify(documents),
    });
  deleteDocument = (uid: string, docId: string | number): Promise<Task> =>
    this.request<Task>(`/indexes/${uid}/documents/${docId}`, {
      method: 'DELETE',
    });
  deleteAllDocuments = (uid: string): Promise<Task> =>
    this.request<Task>(`/indexes/${uid}/documents`, {
      method: 'DELETE',
    });
  search = <T>(
    uid: string,
    query: string,
    options: object = {}
  ): Promise<{ hits: T[]; estimatedTotalHits: number; processingTimeMs: number }> =>
    this.request<{ hits: T[]; estimatedTotalHits: number; processingTimeMs: number }>(
      `/indexes/${uid}/search`,
      {
        method: 'POST',
        body: JSON.stringify({ q: query, ...options }),
      }
    );

  // Settings
  getSettings = (uid: string): Promise<Settings> =>
    this.request<Settings>(`/indexes/${uid}/settings`);
  updateSettings = (uid: string, settings: Partial<Settings>): Promise<Task> =>
    this.request<Task>(`/indexes/${uid}/settings`, {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });

  // Tasks
  getTasks = (indexUid?: string): Promise<TasksResult> => {
    const query = indexUid ? `?indexUids=${indexUid}` : '';
    return this.request<TasksResult>(`/tasks${query}`);
  };
  getTask = (uid: number): Promise<Task> => this.request<Task>(`/tasks/${uid}`);

  // Keys
  getKeys = (): Promise<{ results: Key[] }> => this.request<{ results: Key[] }>('/keys');
  createKey = (options: {
    description: string;
    actions: string[];
    indexes: string[];
    expiresAt: string | null;
  }): Promise<Key> =>
    this.request<Key>('/keys', {
      method: 'POST',
      body: JSON.stringify(options),
    });
  deleteKey = (uid: string): Promise<void> =>
    this.request<void>(`/keys/${uid}`, { method: 'DELETE' });

  // Instance
  getVersion = (): Promise<VersionInfo> => this.request<VersionInfo>('/version');
  getInstanceStats = (): Promise<InstanceStats> => this.request<InstanceStats>('/stats');
  createDump = (): Promise<Task> => this.request<Task>('/dumps', { method: 'POST' });
}
