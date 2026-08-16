import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: ({ context }) => {
    const first = context.connections[0];
    if (first) {
      throw redirect({
        to: "/c/$connectionId/overview",
        params: { connectionId: first.id },
      });
    }
    throw redirect({ to: "/connect" });
  },
});
