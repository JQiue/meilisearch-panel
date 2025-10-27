import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MeilisearchService } from '../services/meilisearch';
import { Index, IndexStats } from '../types';
import { DocumentViewer } from './DocumentViewer';
import { SettingsEditor } from './SettingsEditor';
import { SearchPlayground } from './SearchPlayground';
import { SpinnerIcon } from './icons';

interface IndexDetailProps {
  indexUid: string;
  service: MeilisearchService;
  onBack: () => void;
}

type Tab = 'documents' | 'settings' | 'stats' | 'playground';

export const IndexDetail: React.FC<IndexDetailProps> = ({ indexUid, service, onBack }) => {
  const [activeTab, setActiveTab] = useState<Tab>('documents');
  const [index, setIndex] = useState<Index | null>(null);
  const [stats, setStats] = useState<IndexStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isInitialLoad = useRef(true);

  const fetchData = useCallback(async () => {
    if (isInitialLoad.current) {
      setLoading(true);
    } else {
      setIsPolling(true);
    }
    setError(null);
    try {
      const [indexData, statsData] = await Promise.all([
        service.getIndex(indexUid),
        service.getIndexStats(indexUid),
      ]);
      setIndex(indexData);
      setStats(statsData);
      isInitialLoad.current = false;
    } catch (e: any) {
      setError(e.message || 'Failed to fetch index details.');
    } finally {
      setLoading(false);
      setIsPolling(false);
    }
  }, [indexUid, service]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Poll for stats
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) return <div className="p-8 text-center">Loading index details...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'documents':
        return <DocumentViewer indexUid={indexUid} service={service} />;
      case 'settings':
        return <SettingsEditor indexUid={indexUid} service={service} />;
      case 'playground':
        return <SearchPlayground indexUid={indexUid} service={service} />;
      case 'stats':
        return (
          <div className="mt-6 bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Number of Documents
                </h3>
                <p className="text-2xl font-semibold">
                  {stats?.numberOfDocuments.toLocaleString()}
                </p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Indexing Status
                </h3>
                <div className="flex items-center space-x-2">
                  <p
                    className={`text-2xl font-semibold ${
                      stats?.isIndexing ? 'text-blue-500' : 'text-green-500'
                    }`}
                  >
                    {stats?.isIndexing ? 'Processing' : 'Idle'}
                  </p>
                  {isPolling && <SpinnerIcon className="h-5 w-5 text-gray-500 animate-spin" />}
                </div>
              </div>
            </div>
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Field Distribution</h3>
              <div className="max-h-64 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left">Field</th>
                      <th className="px-4 py-2 text-left">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats?.fieldDistribution &&
                      Object.entries(stats.fieldDistribution).map(([field, count]) => (
                        <tr key={field}>
                          <td className="px-4 py-2 font-mono">{field}</td>
                          <td className="px-4 py-2">{count}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
    }
  };

  const tabClasses = (tab: Tab) => `px-4 py-2 text-sm font-medium rounded-t-lg border-b-2
        ${
          activeTab === tab
            ? 'border-red-500 text-red-600 dark:text-red-400'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
        }`;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold font-mono">{index?.uid}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Primary Key: {index?.primaryKey || 'Not set'}
        </p>
      </div>
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-6">
          <button onClick={() => setActiveTab('documents')} className={tabClasses('documents')}>
            Documents
          </button>
          <button onClick={() => setActiveTab('settings')} className={tabClasses('settings')}>
            Settings
          </button>
          <button onClick={() => setActiveTab('stats')} className={tabClasses('stats')}>
            Stats
          </button>
          <button onClick={() => setActiveTab('playground')} className={tabClasses('playground')}>
            Search Playground
          </button>
        </nav>
      </div>
      {renderTabContent()}
    </div>
  );
};
