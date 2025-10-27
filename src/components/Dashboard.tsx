import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MeilisearchService } from '../services/meilisearch';
import { Index, Task, StoredConnection } from '../types';
import { IndexList } from './IndexList';
import { IndexDetail } from './IndexDetail';
import { TaskList } from './TaskList';
import { KeyManagement } from './KeyManagement';
import { InstanceOverview } from './InstanceOverview';
import { Dumps } from './Dumps';
import {
  DatabaseIcon,
  CogIcon,
  LogoutIcon,
  ChevronLeftIcon,
  ServerIcon,
  KeyIcon,
  ChevronUpDownIcon,
  ChartBarIcon,
  ArchiveBoxIcon,
  GitHubIcon,
} from './icons';

interface DashboardProps {
  service: MeilisearchService;
  connection: StoredConnection;
  onDisconnect: () => void;
  allConnections: StoredConnection[];
  onSwitchInstance: (connection: StoredConnection) => void;
}

type View =
  | 'overview'
  | 'indexes'
  | 'tasks'
  | 'keys'
  | 'dumps'
  | { type: 'index_detail'; uid: string };

export const Dashboard: React.FC<DashboardProps> = ({
  service,
  connection,
  onDisconnect,
  allConnections,
  onSwitchInstance,
}) => {
  const [view, setView] = useState<View>('overview');
  const [indexes, setIndexes] = useState<Index[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [indexesRes, tasksRes] = await Promise.all([service.getIndexes(), service.getTasks()]);
      setIndexes(indexesRes.results);
      setTasks(tasksRes.results);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch data.');
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Poll for updates
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
        setShowSwitcher(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelectIndex = (uid: string) => {
    setView({ type: 'index_detail', uid });
  };

  const handleBackToIndexList = () => {
    setView('indexes');
    fetchData(); // Refresh list after leaving detail view
  };

  const handleSwitchInstance = (conn: StoredConnection) => {
    onSwitchInstance(conn);
    setShowSwitcher(false);
  };

  const renderContent = () => {
    if (loading && indexes.length === 0) {
      return <div className="p-8 text-center">Loading dashboard...</div>;
    }
    if (error) {
      return <div className="p-8 text-center text-red-500">{error}</div>;
    }

    if (typeof view === 'object' && view.type === 'index_detail') {
      return <IndexDetail indexUid={view.uid} service={service} onBack={handleBackToIndexList} />;
    }

    switch (view) {
      case 'overview':
        return <InstanceOverview service={service} />;
      case 'indexes':
        return (
          <IndexList
            indexes={indexes}
            onSelectIndex={handleSelectIndex}
            service={service}
            refreshData={fetchData}
          />
        );
      case 'tasks':
        return <TaskList tasks={tasks} />;
      case 'keys':
        return <KeyManagement service={service} />;
      case 'dumps':
        return <Dumps service={service} tasks={tasks} refreshTasks={fetchData} />;
      default:
        return <InstanceOverview service={service} />;
    }
  };

  const isIndexDetailView = typeof view === 'object' && view.type === 'index_detail';

  const navButtonClasses = (currentView: View) => {
    return `w-full flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 ${
      view === currentView && !isIndexDetailView ? 'bg-gray-200 dark:bg-gray-700' : ''
    }`;
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <aside className="w-64 bg-white dark:bg-gray-800 shadow-md flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-red-600">MeiliPanel</div>
          <div ref={switcherRef} className="relative mt-2">
            <button
              onClick={() => setShowSwitcher(!showSwitcher)}
              className="w-full flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ServerIcon className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate font-semibold" title={connection.name}>
                {connection.name}
              </span>
              <ChevronUpDownIcon className="h-5 w-5 ml-auto text-gray-400" />
            </button>
            {showSwitcher && (
              <div className="absolute top-full mt-1 w-full bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border dark:border-gray-600">
                <ul className="py-1 max-h-48 overflow-y-auto">
                  {allConnections
                    .filter((c) => c.id !== connection.id)
                    .map((conn) => (
                      <li key={conn.id}>
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handleSwitchInstance(conn);
                          }}
                          className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 truncate"
                          title={conn.name}
                        >
                          {conn.name}
                        </a>
                      </li>
                    ))}
                  {allConnections.length <= 1 && (
                    <li className="px-3 py-2 text-sm text-gray-500 text-center">
                      No other instances
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {isIndexDetailView && (
            <button
              onClick={handleBackToIndexList}
              className="w-full flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <ChevronLeftIcon className="h-5 w-5 mr-3" />
              All Indexes
            </button>
          )}
          <button onClick={() => setView('overview')} className={navButtonClasses('overview')}>
            <ChartBarIcon className="h-5 w-5 mr-3" />
            Overview
          </button>
          <button onClick={() => setView('indexes')} className={navButtonClasses('indexes')}>
            <DatabaseIcon className="h-5 w-5 mr-3" />
            Indexes
            <span className="ml-auto text-xs font-semibold bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200 px-2 py-0.5 rounded-full">
              {indexes.length}
            </span>
          </button>
          <button onClick={() => setView('tasks')} className={navButtonClasses('tasks')}>
            <CogIcon className="h-5 w-5 mr-3" />
            Tasks{' '}
            <span className="ml-auto text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 px-2 py-0.5 rounded-full">
              {tasks.filter((t) => t.status === 'processing' || t.status === 'enqueued').length}
            </span>
          </button>
          <button onClick={() => setView('keys')} className={navButtonClasses('keys')}>
            <KeyIcon className="h-5 w-5 mr-3" />
            API Keys
          </button>
          <button onClick={() => setView('dumps')} className={navButtonClasses('dumps')}>
            <ArchiveBoxIcon className="h-5 w-5 mr-3" />
            Dumps
          </button>
        </nav>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <a
            href="https://github.com/JQiue/meili-panel"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <GitHubIcon className="h-5 w-5 mr-3" />
            Source Code
          </a>
          <button
            onClick={onDisconnect}
            className="w-full flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <LogoutIcon className="h-5 w-5 mr-3" />
            Disconnect
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">{renderContent()}</main>
    </div>
  );
};
