import { createFileRoute } from "@tanstack/react-router";

import { IndexList } from "../components/IndexList";

import { useConnectionData } from "./c.$connectionId";

export const Route = createFileRoute("/c/$connectionId/indexes")({
  component: IndexesPage,
});

function IndexesPage() {
  const { service, indexes, indexStats, refreshData } = useConnectionData();

  return (
    <IndexList
      indexes={indexes}
      indexStats={indexStats}
      service={service}
      refreshData={refreshData}
    />
  );
}
