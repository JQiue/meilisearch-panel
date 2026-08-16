import React, { useState, useEffect, useCallback, useRef } from "react";

import { MeilisearchService } from "../services/meilisearch";

import { Dumps } from "./Dumps";
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
} from "./icons";
import { IndexDetail } from "./IndexDetail";
import { IndexList } from "./IndexList";
import { InstanceOverview } from "./InstanceOverview";
import { KeyManagement } from "./KeyManagement";
import { TaskList } from "./TaskList";

import type { Index, Task, StoredConnection } from "../types";

interface DashboardProps {
  service: MeilisearchService;
  connection: StoredConnection;
  onDisconnect: () => void;
  allConnections: StoredConnection[];
  onSwitchInstance: (connection: StoredConnection) => void;
}

type View =
  | "overview"
  | "indexes"
  | "tasks"
  | "keys"
  | "dumps"
  | { type: "index_detail"; uid: string };

export const Dashboard: React.FC<DashboardProps> = ({
  service,
  connection,
  onDisconnect,
  allConnections,
  onSwitchInstance,
}) => {
  const [view, setView] = useState<View>("overview");
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
      setError(e.message || "Failed to fetch data.");
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
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelectIndex = (uid: string) => {
    setView({ type: "index_detail", uid });
  };

  const handleBackToIndexList = () => {
    setView("indexes");
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

    if (typeof view === "object" && view.type === "index_detail") {
      return <IndexDetail indexUid={view.uid} service={service} onBack={handleBackToIndexList} />;
    }

    switch (view) {
      case "overview":
        return <InstanceOverview service={service} />;
      case "indexes":
        return (
          <IndexList
            indexes={indexes}
            onSelectIndex={handleSelectIndex}
            service={service}
            refreshData={fetchData}
          />
        );
      case "tasks":
        return <TaskList tasks={tasks} />;
      case "keys":
        return <KeyManagement service={service} />;
      case "dumps":
        return <Dumps service={service} tasks={tasks} refreshTasks={fetchData} />;
      default:
        return <InstanceOverview service={service} />;
    }
  };

  const isIndexDetailView = typeof view === "object" && view.type === "index_detail";

  const navButtonClasses = (currentView: View) => {
    return `w-full flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 ${
      view === currentView && !isIndexDetailView ? "bg-gray-200 dark:bg-gray-700" : ""
    }`;
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <aside className="flex w-64 flex-col bg-white shadow-md dark:bg-gray-800">
        <div className="border-b border-gray-200 p-4 dark:border-gray-700">
          <div className="text-2xl font-bold text-red-600">MeiliPanel</div>
          <div ref={switcherRef} className="relative mt-2">
            <button
              onClick={() => setShowSwitcher(!showSwitcher)}
              className="flex w-full items-center rounded-md p-2 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
            >
              <ServerIcon className="mr-2 h-4 w-4 flex-shrink-0" />
              <span className="truncate font-semibold" title={connection.name}>
                {connection.name}
              </span>
              <ChevronUpDownIcon className="ml-auto h-5 w-5 text-gray-400" />
            </button>
            {showSwitcher && (
              <div className="absolute top-full z-10 mt-1 w-full rounded-md border bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
                <ul className="max-h-48 overflow-y-auto py-1">
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
                          className="block truncate px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                          title={conn.name}
                        >
                          {conn.name}
                        </a>
                      </li>
                    ))}
                  {allConnections.length <= 1 && (
                    <li className="px-3 py-2 text-center text-sm text-gray-500">
                      No other instances
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
        <nav className="flex-1 space-y-2 p-4">
          {isIndexDetailView && (
            <button
              onClick={handleBackToIndexList}
              className="flex w-full items-center rounded-md px-4 py-2 text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <ChevronLeftIcon className="mr-3 h-5 w-5" />
              All Indexes
            </button>
          )}
          <button onClick={() => setView("overview")} className={navButtonClasses("overview")}>
            <ChartBarIcon className="mr-3 h-5 w-5" />
            Overview
          </button>
          <button onClick={() => setView("indexes")} className={navButtonClasses("indexes")}>
            <DatabaseIcon className="mr-3 h-5 w-5" />
            Indexes
            <span className="ml-auto rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-700 dark:bg-gray-600 dark:text-gray-200">
              {indexes.length}
            </span>
          </button>
          <button onClick={() => setView("tasks")} className={navButtonClasses("tasks")}>
            <CogIcon className="mr-3 h-5 w-5" />
            Tasks{" "}
            <span className="ml-auto rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-900 dark:text-red-200">
              {tasks.filter((t) => t.status === "processing" || t.status === "enqueued").length}
            </span>
          </button>
          <button onClick={() => setView("keys")} className={navButtonClasses("keys")}>
            <KeyIcon className="mr-3 h-5 w-5" />
            API Keys
          </button>
          <button onClick={() => setView("dumps")} className={navButtonClasses("dumps")}>
            <ArchiveBoxIcon className="mr-3 h-5 w-5" />
            Dumps
          </button>
        </nav>
        <div className="space-y-2 border-t border-gray-200 p-4 dark:border-gray-700">
          <a
            href="https://github.com/JQiue/meili-panel"
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center rounded-md px-4 py-2 text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <GitHubIcon className="mr-3 h-5 w-5" />
            Source Code
          </a>
          <button
            onClick={onDisconnect}
            className="flex w-full items-center rounded-md px-4 py-2 text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <LogoutIcon className="mr-3 h-5 w-5" />
            Disconnect
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6">{renderContent()}</main>
    </div>
  );
};
