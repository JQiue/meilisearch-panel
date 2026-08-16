import React from "react";

import type { Task } from "../types";

interface TaskListProps {
  tasks: Task[];
}

const statusColorMap: Record<Task["status"], string> = {
  enqueued: "bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200",
  processing: "bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  succeeded: "bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200",
  failed: "bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export const TaskList: React.FC<TaskListProps> = ({ tasks }) => {
  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Tasks</h1>
      <div className="rounded-lg bg-white shadow-md dark:bg-gray-800">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300">
                UID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300">
                Index
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300">
                Enqueued At
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {tasks.map((task) => (
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
                <td className="px-6 py-4 font-mono text-sm whitespace-nowrap">{task.type}</td>
                <td className="px-6 py-4 font-mono text-sm whitespace-nowrap">{task.indexUid}</td>
                <td className="px-6 py-4 text-sm whitespace-nowrap">{task.duration}</td>
                <td className="px-6 py-4 text-sm whitespace-nowrap">
                  {new Date(task.enqueuedAt).toLocaleString()}
                </td>
              </tr>
            ))}
            {tasks.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-gray-500 dark:text-gray-400">
                  No tasks found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
