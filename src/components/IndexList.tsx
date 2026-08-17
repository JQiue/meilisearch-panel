import { Eye, Plus, Trash2 } from "lucide-react";
import { Meilisearch } from "meilisearch";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import { IndexDetail } from "./IndexDetail";

import type { IndexStatsInfo } from "../routes/c.$connectionId";
import type { Index } from "../types";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface IndexListProps {
  indexes: Index[];
  indexStats: Record<string, IndexStatsInfo>;
  service: Meilisearch;
  refreshData: () => void;
}

export const IndexList: React.FC<IndexListProps> = ({
  indexes,
  indexStats,
  service,
  refreshData,
}) => {
  const { t } = useTranslation();
  const [createOpen, setCreateOpen] = useState(false);
  const [newIndexUid, setNewIndexUid] = useState("");
  const [primaryKey, setPrimaryKey] = useState("");
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Index | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [detailTarget, setDetailTarget] = useState<Index | null>(null);

  const handleCreateIndex = async () => {
    if (!newIndexUid) {
      setError(t("indexes.uidRequired"));
      return;
    }
    setError("");
    try {
      await service.createIndex(newIndexUid, { primaryKey: primaryKey || undefined });
      setNewIndexUid("");
      setPrimaryKey("");
      setCreateOpen(false);
      setTimeout(refreshData, 500); // Give time for task to process
    } catch (e: any) {
      setError(e.message || t("indexes.createFailed"));
    }
  };

  const handleDeleteIndex = async () => {
    if (!deleteTarget) return;
    setDeleteError("");
    try {
      await service.deleteIndex(deleteTarget.uid);
      setDeleteTarget(null);
      setTimeout(refreshData, 500);
    } catch (e: any) {
      setDeleteError(e.message || t("indexes.deleteFailed"));
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("indexes.title")}</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus />
          {t("indexes.createIndex")}
        </Button>
      </div>
      <div className="bg-card rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("indexes.uid")}</TableHead>
              <TableHead>{t("indexes.primaryKey")}</TableHead>
              <TableHead>{t("indexes.documents")}</TableHead>
              <TableHead>{t("common.status")}</TableHead>
              <TableHead>{t("indexes.createdAt")}</TableHead>
              <TableHead>{t("indexes.updatedAt")}</TableHead>
              <TableHead className="text-right">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {indexes.map((index) => {
              const stats = indexStats[index.uid];
              return (
                <TableRow
                  key={index.uid}
                  className="cursor-pointer"
                  onClick={() => setDetailTarget(index)}
                >
                  <TableCell className="text-primary font-mono">{index.uid}</TableCell>
                  <TableCell className="font-mono">
                    {index.primaryKey || t("indexes.notSet")}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {stats ? stats.numberOfDocuments.toLocaleString() : "-"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {stats?.isIndexing ? (
                      <Badge variant="outline" className="gap-1.5">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
                        {t("overview.indexing")}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">{t("overview.idle")}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                    {new Date(index.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                    {new Date(index.updatedAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailTarget(index);
                      }}
                      aria-label={t("indexes.viewDetails", { uid: index.uid })}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(index);
                      }}
                      aria-label={t("common.delete")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {indexes.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground h-24 text-center">
                  {t("indexes.empty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!detailTarget} onOpenChange={(open) => !open && setDetailTarget(null)}>
        <DialogContent className="flex h-[80vh] max-w-4xl! flex-col overflow-hidden">
          {detailTarget && (
            <IndexDetail
              indexUid={detailTarget.uid}
              service={service}
              onBack={() => setDetailTarget(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("indexes.createIndex")}</DialogTitle>
            <DialogDescription>{t("indexes.createDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="index-uid">{t("indexes.indexUid")}</Label>
              <Input
                id="index-uid"
                value={newIndexUid}
                onChange={(e) => setNewIndexUid(e.target.value)}
                placeholder="movies"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="primary-key">{t("indexes.primaryKeyOptional")}</Label>
              <Input
                id="primary-key"
                value={primaryKey}
                onChange={(e) => setPrimaryKey(e.target.value)}
                placeholder="id"
              />
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleCreateIndex}>{t("common.create")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("indexes.deleteIndexTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("indexes.deleteIndexBody", { uid: deleteTarget?.uid })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && <p className="text-destructive text-sm">{deleteError}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteIndex}>{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
