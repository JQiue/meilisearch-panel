import { createFileRoute } from "@tanstack/react-router";

import { Dumps } from "../components/Dumps";

import { useConnectionData } from "./c.$connectionId";

export const Route = createFileRoute("/c/$connectionId/dumps")({
  component: DumpsPage,
});

function DumpsPage() {
  const { service, tasks, refreshData } = useConnectionData();
  return <Dumps service={service} tasks={tasks} refreshTasks={refreshData} />;
}
