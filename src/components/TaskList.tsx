import { AlertCircle, Ban, Loader2 } from "lucide-react";
import { Meilisearch } from "meilisearch";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type { Task } from "../types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TaskListProps {
  service: Meilisearch;
  initialTasks: Task[];
}

/** 每页任务数 */
const PAGE_SIZE = 20;

const statusVariantMap: Record<
  Task["status"],
  "secondary" | "outline" | "default" | "destructive"
> = {
  enqueued: "secondary",
  processing: "outline",
  succeeded: "default",
  failed: "destructive",
  canceled: "secondary",
};

const STATUS_FILTERS = [
  { value: "", labelKey: "tasks.filterStatus", helperKey: "tasks.showEverything" },
  { value: "enqueued", labelKey: "tasks.statusEnqueued", helperKey: "tasks.enqueued" },
  { value: "processing", labelKey: "tasks.statusProcessing", helperKey: "tasks.processing" },
  { value: "succeeded", labelKey: "tasks.statusSucceeded", helperKey: "tasks.succeeded" },
  { value: "failed", labelKey: "tasks.statusFailed", helperKey: "tasks.failed" },
  { value: "canceled", labelKey: "tasks.statusCanceled", helperKey: "tasks.canceled" },
] as const;

const TYPE_FILTERS = [
  { value: "", labelKey: "tasks.filterType", helperKey: "tasks.showEverything" },
  {
    value: "documentAdditionOrUpdate",
    labelKey: "tasks.typeDocAddLabel",
    helperKey: "tasks.typeDocAdd",
  },
  {
    value: "documentDeletion",
    labelKey: "tasks.typeDocDeleteLabel",
    helperKey: "tasks.typeDocDelete",
  },
  {
    value: "settingsUpdate",
    labelKey: "tasks.typeSettingsLabel",
    helperKey: "tasks.typeSettings",
  },
  {
    value: "indexCreation",
    labelKey: "tasks.typeIndexCreateLabel",
    helperKey: "tasks.typeIndexCreate",
  },
  {
    value: "indexDeletion",
    labelKey: "tasks.typeIndexDeleteLabel",
    helperKey: "tasks.typeIndexDelete",
  },
  {
    value: "indexUpdate",
    labelKey: "tasks.typeIndexUpdateLabel",
    helperKey: "tasks.typeIndexUpdate",
  },
  { value: "dumpCreation", labelKey: "tasks.typeDumpLabel", helperKey: "tasks.typeDump" },
  {
    value: "taskCancelation",
    labelKey: "tasks.typeTaskCancelLabel",
    helperKey: "tasks.typeTaskCancel",
  },
  {
    value: "taskDeletion",
    labelKey: "tasks.typeTaskDeleteLabel",
    helperKey: "tasks.typeTaskDelete",
  },
] as const;

export const TaskList: React.FC<TaskListProps> = ({ service, initialTasks }) => {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [indexFilter, setIndexFilter] = useState<string | null>(null);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Task | null>(null);
  const [cancelError, setCancelError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  // 游标分页：stack 记录每页的 from 游标（栈底 null = 第一页）
  const [cursorStack, setCursorStack] = useState<(number | null)[]>([null]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [totalTasks, setTotalTasks] = useState(0);

  const indexOptions = useMemo(() => {
    const uids = new Set<string>();
    initialTasks.forEach((t) => t.indexUid && uids.add(t.indexUid));
    return [...uids].sort();
  }, [initialTasks]);

  const fetchTasks = useCallback(
    async (from: number | null) => {
      setLoading(true);
      setError(null);
      try {
        const params: any = { limit: PAGE_SIZE, reverse: true };
        if (from !== null) params.from = from;
        if (statusFilter) params.statuses = [statusFilter];
        if (typeFilter) params.types = [typeFilter];
        if (indexFilter) params.indexUids = [indexFilter];
        const res = await service.tasks.getTasks(params);
        setTasks(res.results);
        setTotalTasks(res.total);
        setNextCursor(res.next);
      } catch (e: any) {
        setError(e.message || t("tasks.fetchFailed"));
      } finally {
        setLoading(false);
      }
    },
    [service, statusFilter, typeFilter, indexFilter, t],
  );

  // 首次加载 & 筛选条件变化 → 重置到第一页
  useEffect(() => {
    setCursorStack([null]);
    setNextCursor(null);
    fetchTasks(null);
  }, [fetchTasks]);

  const goNext = () => {
    if (nextCursor === null) return;
    setCursorStack((stack) => [...stack, nextCursor]);
    fetchTasks(nextCursor);
  };

  const goPrev = () => {
    const newStack = cursorStack.slice(0, -1);
    if (newStack.length === 0) return;
    setCursorStack(newStack);
    fetchTasks(newStack[newStack.length - 1]);
  };

  const currentPage = cursorStack.length;
  const totalPages = Math.max(1, Math.ceil(totalTasks / PAGE_SIZE));
  const hasPrev = currentPage > 1;
  const hasNext = nextCursor !== null;

  const handleCancelTask = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    setCancelError("");
    try {
      await service.tasks.cancelTasks({ uids: [cancelTarget.uid] });
      setCancelTarget(null);
      // 取消后刷新当前页
      fetchTasks(cursorStack[cursorStack.length - 1]);
    } catch (e: any) {
      setCancelError(e.message || t("tasks.cancelFailed"));
    } finally {
      setCancelling(false);
    }
  };

  const isCancelable = (task: Task) => task.status === "enqueued" || task.status === "processing";

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">{t("tasks.title")}</h1>

      {/* 筛选工具栏 */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs">{t("common.status")}</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t("tasks.filterStatus")} />
            </SelectTrigger>
            <SelectContent className="min-w-64!">
              {STATUS_FILTERS.map((s) => (
                <SelectItem key={s.value} value={s.value} helper={t(s.helperKey)}>
                  {t(s.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs">{t("common.type")}</Label>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={t("tasks.filterType")} />
            </SelectTrigger>
            <SelectContent className="min-w-72!">
              {TYPE_FILTERS.map((flt) => (
                <SelectItem key={flt.value} value={flt.value} helper={t(flt.helperKey)}>
                  {t(flt.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {indexOptions.length > 1 && (
          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs">{t("common.index")}</Label>
            <Select value={indexFilter} onValueChange={setIndexFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t("tasks.filterIndex")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t("tasks.filterIndex")}</SelectItem>
                {indexOptions.map((uid) => (
                  <SelectItem key={uid} value={uid}>
                    {uid}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {loading && (
        <p className="text-muted-foreground mb-4 flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> {t("tasks.loading")}
        </p>
      )}
      {error && <p className="text-destructive mb-4 text-sm">{error}</p>}

      <div className="bg-card rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>UID</TableHead>
              <TableHead>{t("common.status")}</TableHead>
              <TableHead>{t("common.type")}</TableHead>
              <TableHead>{t("common.index")}</TableHead>
              <TableHead>{t("common.duration")}</TableHead>
              <TableHead>{t("tasks.enqueuedAt")}</TableHead>
              <TableHead className="text-right">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow
                key={task.uid}
                className={task.status === "failed" ? "cursor-pointer" : undefined}
                onClick={() => task.status === "failed" && setDetailTask(task)}
              >
                <TableCell className="whitespace-nowrap">{task.uid}</TableCell>
                <TableCell className="whitespace-nowrap">
                  <Badge variant={statusVariantMap[task.status]}>{task.status}</Badge>
                </TableCell>
                <TableCell className="font-mono text-sm whitespace-nowrap">{task.type}</TableCell>
                <TableCell className="font-mono text-sm whitespace-nowrap">
                  {task.indexUid || "-"}
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap">{task.duration || "-"}</TableCell>
                <TableCell className="text-sm whitespace-nowrap">
                  {new Date(task.enqueuedAt).toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {task.status === "failed" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailTask(task);
                      }}
                      aria-label={t("tasks.viewError", { uid: task.uid })}
                    >
                      <AlertCircle className="h-4 w-4" />
                    </Button>
                  )}
                  {isCancelable(task) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCancelTarget(task);
                      }}
                      aria-label={t("tasks.cancelTask", { uid: task.uid })}
                    >
                      <Ban className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {tasks.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground h-24 text-center">
                  {t("tasks.empty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分页 */}
      {tasks.length > 0 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                text={t("common.previous")}
                onClick={(e) => {
                  e.preventDefault();
                  if (hasPrev) goPrev();
                }}
                className={hasPrev ? "cursor-pointer" : "pointer-events-none opacity-50"}
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink isActive className="pointer-events-none">
                {t("common.pageOf", { page: currentPage, total: totalPages })}
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                text={t("common.next")}
                onClick={(e) => {
                  e.preventDefault();
                  if (hasNext) goNext();
                }}
                className={hasNext ? "cursor-pointer" : "pointer-events-none opacity-50"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* 失败任务详情 */}
      <Dialog open={!!detailTask} onOpenChange={(open) => !open && setDetailTask(null)}>
        <DialogContent className="overflow-hidden">
          <DialogHeader>
            <DialogTitle>{t("tasks.failedTitle", { uid: detailTask?.uid })}</DialogTitle>
            <DialogDescription className="font-mono text-xs break-all">
              {detailTask?.type} · {detailTask?.indexUid || t("common.noIndex")}
            </DialogDescription>
          </DialogHeader>
          {detailTask?.error && (
            <div className="min-w-0 space-y-2">
              <p className="text-destructive text-sm font-semibold break-words">
                {detailTask.error.message}
              </p>
              <pre className="bg-muted max-h-60 w-full overflow-x-auto overflow-y-auto rounded-md p-3 font-mono text-xs">
                {JSON.stringify(
                  {
                    code: detailTask.error.code,
                    type: detailTask.error.type,
                    link: detailTask.error.link,
                    details: detailTask.details ?? null,
                  },
                  null,
                  2,
                )}
              </pre>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 取消任务确认 */}
      <Dialog open={!!cancelTarget} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("tasks.cancelTitle", { uid: cancelTarget?.uid })}</DialogTitle>
            <DialogDescription>
              {t("tasks.cancelBody", {
                type: cancelTarget?.type,
                index: cancelTarget?.indexUid || t("common.noIndex"),
                status: cancelTarget?.status,
              })}
            </DialogDescription>
          </DialogHeader>
          {cancelError && <p className="text-destructive text-sm">{cancelError}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCancelTarget(null)}>
              {t("common.keep")}
            </Button>
            <Button variant="destructive" onClick={handleCancelTask} disabled={cancelling}>
              {cancelling ? t("tasks.cancelling") : t("tasks.cancelTaskBtn")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
