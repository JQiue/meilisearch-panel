import { createFileRoute } from "@tanstack/react-router";

import { TaskList } from "../components/TaskList";

import { useConnectionData } from "./c.$connectionId";

export const Route = createFileRoute("/c/$connectionId/tasks")({
  component: TasksPage,
});

function TasksPage() {
  const { service, tasks } = useConnectionData();
  return <TaskList service={service} initialTasks={tasks} />;
}
