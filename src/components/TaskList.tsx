import React from 'react';
import { Task } from '../types';

interface TaskListProps {
  tasks: Task[];
}

const statusColorMap: Record<Task['status'], string> = {
  enqueued: 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200',
  processing: 'bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  succeeded: 'bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200',
  failed: 'bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export const TaskList: React.FC<TaskListProps> = ({ tasks }) => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Tasks</h1>
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                UID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Index
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
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
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      statusColorMap[task.status]
                    }`}
                  >
                    {task.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">{task.type}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">{task.indexUid}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{task.duration}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {new Date(task.enqueuedAt).toLocaleString()}
                </td>
              </tr>
            ))}
            {tasks.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-500 dark:text-gray-400">
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
