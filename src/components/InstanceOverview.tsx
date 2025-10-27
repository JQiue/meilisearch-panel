import React, { useState, useEffect, useCallback } from 'react';
import { MeilisearchService } from '../services/meilisearch';
import { VersionInfo, InstanceStats } from '../types';

interface InstanceOverviewProps {
  service: MeilisearchService;
}

const StatCard: React.FC<{ title: string; value: string }> = ({ title, value }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</h3>
    <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{value}</p>
  </div>
);

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const InstanceOverview: React.FC<InstanceOverviewProps> = ({ service }) => {
  const [version, setVersion] = useState<VersionInfo | null>(null);
  const [stats, setStats] = useState<InstanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [versionData, statsData] = await Promise.all([
        service.getVersion(),
        service.getInstanceStats(),
      ]);
      setVersion(versionData);
      setStats(statsData);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch instance overview.');
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <div>Loading instance overview...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!version || !stats) return <div>No data available.</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Instance Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Meilisearch Version" value={version.pkgVersion} />
        <StatCard title="Database Size" value={formatBytes(stats.databaseSize)} />
        <StatCard title="Last Updated" value={new Date(stats.lastUpdate).toLocaleString()} />
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Index Summary</h2>
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Index UID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Number of Documents
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {Object.entries(stats.indexes).map(([uid, indexStats]) => (
                <tr key={uid}>
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-red-600 dark:text-red-400">
                    {uid}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {indexStats.numberOfDocuments.toLocaleString()}
                  </td>
                </tr>
              ))}
              {Object.keys(stats.indexes).length === 0 && (
                <tr>
                  <td colSpan={2} className="text-center py-10 text-gray-500 dark:text-gray-400">
                    No indexes found on this instance.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
