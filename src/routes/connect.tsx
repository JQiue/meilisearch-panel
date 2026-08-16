import { createFileRoute, useNavigate, useRouteContext } from "@tanstack/react-router";

import { useConnections } from "../App";
import { ConnectionScreen } from "../components/ConnectionScreen";

import type { StoredConnection } from "../types";

export const Route = createFileRoute("/connect")({
  component: ConnectPage,
});

function ConnectPage() {
  const navigate = useNavigate();
  const connections = useConnections();
  const { addConnection, updateConnection, deleteConnection } = useRouteContext({
    from: "__root__",
  });

  const handleConnect = (conn: StoredConnection) => {
    navigate({ to: "/c/$connectionId/overview", params: { connectionId: conn.id } });
  };

  return (
    <ConnectionScreen
      connections={connections}
      onConnect={handleConnect}
      onAdd={addConnection}
      onUpdate={updateConnection}
      onDelete={deleteConnection}
    />
  );
}
