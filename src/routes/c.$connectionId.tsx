import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import {
  Archive,
  BarChart3,
  ChevronsUpDown,
  Code2,
  Database,
  Key,
  ListChecks,
  LogOut,
  Server,
} from "lucide-react";
import { Meilisearch } from "meilisearch";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import type { Index, StoredConnection, Task } from "../types";

import { useConnections } from "@/App";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/c/$connectionId")({
  beforeLoad: ({ params, context }) => {
    const connection = context.connections.find((c) => c.id === params.connectionId);
    if (!connection) {
      throw redirect({ to: "/connect" });
    }
  },
  component: ConnectionLayout,
});

export interface IndexStatsInfo {
  numberOfDocuments: number;
  isIndexing: boolean;
}

export interface ConnectionLayoutData {
  service: Meilisearch;
  connection: StoredConnection;
  indexes: Index[];
  indexStats: Record<string, IndexStatsInfo>;
  tasks: Task[];
  refreshData: () => void;
}

export const ConnectionDataContext = createContext<ConnectionLayoutData | null>(null);

export function useConnectionData() {
  const data = useContext(ConnectionDataContext);
  if (!data) {
    throw new Error("useConnectionData must be used within a connection layout route");
  }
  return data;
}

function ConnectionLayout() {
  const { t } = useTranslation();
  const { connectionId } = Route.useParams();
  const location = useLocation();
  const connections = useConnections();
  const navigate = useNavigate();

  const connection = connections.find((c) => c.id === connectionId)!;

  const service = useMemo(
    () => new Meilisearch({ host: connection.host, apiKey: connection.apiKey }),
    [connection],
  );

  const [indexes, setIndexes] = useState<Index[]>([]);
  const [indexStats, setIndexStats] = useState<Record<string, IndexStatsInfo>>({});
  const [tasks, setTasks] = useState<Task[]>([]);
  const [healthy, setHealthy] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [indexesRes, tasksRes, statsRes] = await Promise.all([
        service.getRawIndexes(),
        // 默认按 UID 降序（最新在前），与任务页分页一致；limit 100 覆盖侧边栏徽章与索引筛选选项
        service.tasks.getTasks({ limit: 100 }),
        service.getStats(),
      ]);
      setIndexes(indexesRes.results);
      setTasks(tasksRes.results);
      setIndexStats(
        Object.fromEntries(
          Object.entries(statsRes.indexes).map(([uid, s]) => [
            uid,
            { numberOfDocuments: s.numberOfDocuments, isIndexing: s.isIndexing },
          ]),
        ),
      );
    } catch (e: any) {
      setError(e.message || "Failed to fetch data.");
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Poll for updates
    return () => clearInterval(interval);
  }, [fetchData]);

  // 健康状态轮询
  useEffect(() => {
    const checkHealth = async () => {
      try {
        await service.health();
        setHealthy(true);
      } catch {
        setHealthy(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, [service]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
        setShowSwitcher(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSwitchInstance = (conn: StoredConnection) => {
    setShowSwitcher(false);
    navigate({ to: "/c/$connectionId/overview", params: { connectionId: conn.id } });
  };

  const handleDisconnect = () => {
    navigate({ to: "/connect" });
  };

  // 当前激活的路由（用于 SidebarMenuButton 高亮）
  const isActive = (path: string) => location.pathname.startsWith(`/c/${connectionId}${path}`);

  const activeTasks = tasks.filter(
    (task) => task.status === "processing" || task.status === "enqueued",
  ).length;

  const outletContext: ConnectionLayoutData = {
    service,
    connection,
    indexes,
    indexStats,
    tasks,
    refreshData: fetchData,
  };

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="px-2 pt-2 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <img src="/meilisearch.ico" alt="MeiliSearch" className="h-6 w-6 shrink-0" />
              <span className="text-xl font-bold text-red-600 group-data-[collapsible=icon]:hidden">
                MeiliSearch Panel
              </span>
            </div>
          </div>
          <div ref={switcherRef} className="relative flex justify-center p-2">
            <SidebarMenuButton
              size="lg"
              onClick={() => setShowSwitcher(!showSwitcher)}
              aria-expanded={showSwitcher}
              tooltip={connection.name}
            >
              <Server />
              <span
                className="truncate font-semibold group-data-[collapsible=icon]:hidden"
                title={connection.name}
              >
                {connection.name}
              </span>
              <ChevronsUpDown className="ml-auto h-4 w-4 opacity-50 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
            {showSwitcher && (
              <div className="bg-popover absolute top-full z-10 mt-1 w-full min-w-56 rounded-md border shadow-lg">
                <ScrollArea className="max-h-48">
                  {connections
                    .filter((c) => c.id !== connection.id)
                    .map((conn) => (
                      <button
                        key={conn.id}
                        onClick={() => handleSwitchInstance(conn)}
                        className="hover:bg-muted text-muted-foreground block w-full truncate px-3 py-2 text-left text-sm"
                        title={conn.name}
                      >
                        {conn.name}
                      </button>
                    ))}
                  {connections.length <= 1 && (
                    <p className="text-muted-foreground px-3 py-2 text-center text-sm">
                      {t("nav.noOtherInstances")}
                    </p>
                  )}
                </ScrollArea>
              </div>
            )}
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<Link to="/c/$connectionId/overview" params={{ connectionId }} />}
                    isActive={isActive("/overview")}
                    tooltip={t("nav.overview")}
                  >
                    <BarChart3 />
                    <span>{t("nav.overview")}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<Link to="/c/$connectionId/indexes" params={{ connectionId }} />}
                    isActive={isActive("/indexes")}
                    tooltip={t("nav.indexes")}
                  >
                    <Database />
                    <span>{t("nav.indexes")}</span>
                    <SidebarMenuBadge>{indexes.length}</SidebarMenuBadge>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<Link to="/c/$connectionId/tasks" params={{ connectionId }} />}
                    isActive={isActive("/tasks")}
                    tooltip={t("nav.tasks")}
                  >
                    <ListChecks />
                    {/* <Cog /> */}
                    <span>{t("nav.tasks")}</span>
                    {activeTasks > 0 && (
                      <SidebarMenuBadge className="bg-destructive/10 text-destructive">
                        {activeTasks}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<Link to="/c/$connectionId/keys" params={{ connectionId }} />}
                    isActive={isActive("/keys")}
                    tooltip={t("nav.apiKeys")}
                  >
                    <Key />
                    <span>{t("nav.apiKeys")}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<Link to="/c/$connectionId/dumps" params={{ connectionId }} />}
                    isActive={isActive("/dumps")}
                    tooltip={t("nav.dumps")}
                  >
                    <Archive />
                    <span>{t("nav.dumps")}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarSeparator />
          <div className="flex items-center justify-between px-1 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-1">
            {/* 健康状态圆点 */}
            <Button
              variant="ghost"
              size="icon"
              className="group-data-[collapsible=icon]:order-last"
              title={
                healthy === null
                  ? t("nav.checkingHealth")
                  : healthy
                    ? t("nav.instanceHealthy")
                    : t("nav.instanceUnreachable")
              }
              aria-label={
                healthy === null
                  ? t("nav.checkingHealth")
                  : healthy
                    ? t("nav.instanceHealthy")
                    : t("nav.instanceUnreachable")
              }
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  healthy === null
                    ? "bg-muted-foreground/40 animate-pulse"
                    : healthy
                      ? "bg-green-500"
                      : "bg-destructive"
                }`}
              />
            </Button>
            <div className="flex items-center group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-1">
              <LanguageToggle />
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                title={t("nav.sourceCode")}
                aria-label={t("nav.sourceCode")}
                render={
                  <a
                    href="https://github.com/JQiue/meilisearch-panel"
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                <Code2 className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDisconnect}
                title={t("nav.disconnect")}
                aria-label={t("nav.disconnect")}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <ScrollArea className="h-full">
          <div className="p-6">
            <ConnectionDataContext.Provider value={outletContext}>
              {error && (
                <div className="border-destructive/30 bg-destructive/10 text-destructive mb-4 rounded-md border px-4 py-2 text-sm">
                  {t("common.error")}: {error}
                </div>
              )}
              {indexes.length === 0 && loading ? (
                <div className="space-y-4 p-8">
                  <Skeleton className="h-9 w-48" />
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-28 w-full" />
                    ))}
                  </div>
                </div>
              ) : (
                <Outlet />
              )}
            </ConnectionDataContext.Provider>
          </div>
        </ScrollArea>
      </SidebarInset>
    </SidebarProvider>
  );
}
