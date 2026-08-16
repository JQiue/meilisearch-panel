import React, { useState, useMemo } from "react";

import { MeilisearchService } from "../services/meilisearch";

import { PlusIcon, CheckCircleIcon } from "./icons";

import type { Task } from "../types";

interface DumpsProps {
  service: MeilisearchService;
  tasks: Task[];
  refreshTasks: () => void;
}

const statusColorMap: Record<Task["status"], string> = {
  enqueued: "bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200",
  processing: "bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  succeeded: "bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200",
  failed: "bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export const Dumps: React.FC<DumpsProps> = ({ service, tasks, refreshTasks }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const dumpTasks = useMemo(() => {
    return tasks.filter((task) => task.type === "dumpCreation").sort((a, b) => b.uid - a.uid);
  }, [tasks]);

  const handleCreateDump = async () => {
    setLoading(true);
    setMessage("");
    try {
      await service.createDump();
      setMessage("Dump creation task has been enqueued successfully.");
      setTimeout(() => {
        setMessage("");
        refreshTasks();
      }, 3000);
    } catch (e: any) {
      setMessage(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dumps</h1>
        <button
          onClick={handleCreateDump}
          disabled={loading}
          className="flex items-center rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:bg-red-400"
        >
          <PlusIcon className="mr-2 h-5 w-5" />
          {loading ? "Requesting..." : "Create Dump"}
        </button>
      </div>

      {message && (
        <div
          className={`mb-4 flex items-center rounded-md p-3 text-sm ${
            message.startsWith("Error")
              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
              : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
          }`}
        >
          <CheckCircleIcon className="mr-2 h-5 w-5" />
          {message}
        </div>
      )}

      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Dumps are snapshots of your Meilisearch instance. They can be used for backups and
        migrations. Creating a dump is an asynchronous task.
      </p>

      <div className="rounded-lg bg-white shadow-md dark:bg-gray-800">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300">
                Task UID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300">
                Finished At
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {dumpTasks.map((task) => (
              <tr key={task.uid}>
                <td className="px-6 py-4 whitespace-nowrap">{task.uid}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex rounded-full px-2 text-xs leading-5 font-semibold ${
                      statusColorMap[task.status]
                    }`}
                  >
                    {task.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm whitespace-nowrap">{task.duration}</td>
                <td className="px-6 py-4 text-sm whitespace-nowrap">
                  {task.status !== "enqueued" && task.status !== "processing"
                    ? new Date(task.finishedAt).toLocaleString()
                    : "-"}
                </td>
              </tr>
            ))}
            {dumpTasks.length === 0 && (
              <tr>
                <td colSpan={4} className="py-10 text-center text-gray-500 dark:text-gray-400">
                  No dump creation tasks found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
