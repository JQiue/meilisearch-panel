import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";

import type { RouterContext } from "../App";

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => <Outlet />,
});
