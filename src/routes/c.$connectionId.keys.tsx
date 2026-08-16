import { createFileRoute } from "@tanstack/react-router";

import { KeyManagement } from "../components/KeyManagement";

import { useConnectionData } from "./c.$connectionId";

export const Route = createFileRoute("/c/$connectionId/keys")({
  component: KeysPage,
});

function KeysPage() {
  const { service } = useConnectionData();
  return <KeyManagement service={service} />;
}
