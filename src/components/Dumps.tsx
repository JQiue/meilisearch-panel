import { CheckCircle2, Plus } from "lucide-react";
import { Meilisearch } from "meilisearch";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type { Task } from "../types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DumpsProps {
  service: Meilisearch;
  tasks: Task[];
  refreshTasks: () => void;
}

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

export const Dumps: React.FC<DumpsProps> = ({ service, tasks, refreshTasks }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const dumpTasks = useMemo(() => {
    return tasks.filter((task) => task.type === "dumpCreation").sort((a, b) => b.uid - a.uid);
  }, [tasks]);

  const handleCreateDump = async () => {
    setLoading(true);
    setMessage("");
    setIsError(false);
    try {
      await service.createDump();
      setMessage(t("dumps.enqueued"));
      setTimeout(() => {
        setMessage("");
        refreshTasks();
      }, 3000);
    } catch (e: any) {
      setMessage(t("dumps.createFailed") + ": " + e.message);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("dumps.title")}</h1>
        <Button onClick={handleCreateDump} disabled={loading}>
          <Plus />
          {loading ? t("dumps.requesting") : t("dumps.createDump")}
        </Button>
      </div>

      {message && (
        <div
          className={`mb-4 flex items-center rounded-md p-3 text-sm ${
            isError ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
          }`}
        >
          <CheckCircle2 className="mr-2 h-5 w-5" />
          {message}
        </div>
      )}

      <p className="text-muted-foreground mb-4 text-sm">{t("dumps.description")}</p>

      <div className="bg-card rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("dumps.taskUid")}</TableHead>
              <TableHead>{t("common.status")}</TableHead>
              <TableHead>{t("common.duration")}</TableHead>
              <TableHead>{t("dumps.finishedAt")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dumpTasks.map((task) => (
              <TableRow key={task.uid}>
                <TableCell className="whitespace-nowrap">{task.uid}</TableCell>
                <TableCell className="whitespace-nowrap">
                  <Badge variant={statusVariantMap[task.status]}>{task.status}</Badge>
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap">{task.duration}</TableCell>
                <TableCell className="text-sm whitespace-nowrap">
                  {task.finishedAt && task.status !== "enqueued" && task.status !== "processing"
                    ? new Date(task.finishedAt).toLocaleString()
                    : "-"}
                </TableCell>
              </TableRow>
            ))}
            {dumpTasks.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground h-24 text-center">
                  {t("dumps.empty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
