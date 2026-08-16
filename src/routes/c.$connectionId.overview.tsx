import { createFileRoute } from "@tanstack/react-router";

import { InstanceOverview } from "../components/InstanceOverview";

import { useConnectionData } from "./c.$connectionId";

export const Route = createFileRoute("/c/$connectionId/overview")({
  component: OverviewPage,
});

function OverviewPage() {
  const { service } = useConnectionData();
  return <InstanceOverview service={service} />;
}
