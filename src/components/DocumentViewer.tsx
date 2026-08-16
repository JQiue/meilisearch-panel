import { ChevronDown, ChevronUp, Plus, Search, Trash2 } from "lucide-react";
import { Meilisearch } from "meilisearch";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

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
import { Textarea } from "@/components/ui/textarea";
interface DocumentViewerProps {
  indexUid: string;
  service: Meilisearch;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ indexUid, service }) => {
  const { t } = useTranslation();
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [processingTimeMs, setProcessingTimeMs] = useState<number | null>(null);
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "raw">("list");
  const [rawResponse, setRawResponse] = useState<any>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [newDocsJson, setNewDocsJson] = useState(
    '[\n  {\n    "id": 1,\n    "title": "My first document"\n  }\n]',
  );
  const [deleteDocId, setDeleteDocId] = useState<string | number | null>(null);
  const [actionError, setActionError] = useState("");

  const isSearching = query.trim() !== "";

  const fetchDocuments = useCallback(
    async (currentOffset: number) => {
      setLoading(true);
      setError(null);
      try {
        if (query.trim()) {
          const options: any = { limit, offset: currentOffset };
          if (filter.trim()) options.filter = filter.trim();
          if (sort.trim())
            options.sort = sort
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
          const res = await service.index(indexUid).search(query, options);
          setDocs(res.hits);
          setTotal(res.estimatedTotalHits ?? 0);
          setProcessingTimeMs(res.processingTimeMs);
          setRawResponse(res);
        } else {
          const res = await service.index(indexUid).getDocuments({ limit, offset: currentOffset });
          setDocs(res.results);
          setTotal(res.total);
          setProcessingTimeMs(null);
          setRawResponse(res);
        }
      } catch (e: any) {
        setError(e.message || t("documents.fetchFailed"));
      } finally {
        setLoading(false);
      }
    },
    [indexUid, service, query, filter, sort, limit, t],
  );

  useEffect(() => {
    fetchDocuments(0);
    setOffset(0);
  }, [query, filter, sort, limit]);

  useEffect(() => {
    fetchDocuments(offset);
  }, [offset]);

  const handleDeleteDoc = async () => {
    if (deleteDocId === null) return;
    setActionError("");
    try {
      await service.index(indexUid).deleteDocument(deleteDocId);
      setDeleteDocId(null);
      setTimeout(() => fetchDocuments(offset), 500);
    } catch (e: any) {
      setActionError(t("documents.deleteFailed") + ": " + e.message);
    }
  };

  const handleDeleteAll = async () => {
    setActionError("");
    try {
      await service.index(indexUid).deleteAllDocuments();
      setDeleteAllOpen(false);
      setTimeout(() => fetchDocuments(0), 500);
      setOffset(0);
    } catch (e: any) {
      setActionError(`Error clearing documents: ${e.message}`);
    }
  };

  const handleAddDocuments = async () => {
    setActionError("");
    try {
      const documents = JSON.parse(newDocsJson);
      if (!Array.isArray(documents)) {
        throw new Error("Input must be a JSON array of documents.");
      }
      await service.index(indexUid).addDocuments(documents);
      setAddOpen(false);
      setNewDocsJson('[\n  {\n    "id": 1,\n    "title": "My first document"\n  }\n]');
      setTimeout(() => fetchDocuments(offset), 500);
    } catch (e: any) {
      setActionError(`Error adding documents: ${e.message}`);
    }
  };

  const primaryKey =
    docs.length > 0
      ? Object.keys(docs[0]).find((k) => k === "id") || Object.keys(docs[0])[0]
      : "id";

  return (
    <div>
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              type="text"
              placeholder={t("documents.searchPlaceholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              aria-expanded={showAdvanced}
            >
              {t("documents.advanced")}
              {showAdvanced ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteAllOpen(true)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 />
              {t("documents.clearAll")}
            </Button>
            <Button onClick={() => setAddOpen(true)}>
              <Plus />
              {t("documents.addDocuments")}
            </Button>
          </div>
        </div>

        {showAdvanced && (
          <div className="bg-muted/30 grid grid-cols-1 gap-4 rounded-md border p-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="doc-filter">{t("documents.filter")}</Label>
              <Input
                id="doc-filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder={t("documents.filterPlaceholder")}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-sort">{t("documents.sort")}</Label>
              <Input
                id="doc-sort"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                placeholder={t("documents.sortPlaceholder")}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-limit">{t("documents.limit")}</Label>
              <Input
                id="doc-limit"
                type="number"
                min={1}
                value={limit}
                onChange={(e) => setLimit(Math.max(1, parseInt(e.target.value, 10) || 20))}
              />
            </div>
          </div>
        )}
      </div>

      {/* 状态行：计数 + Raw 切换 */}
      <div className="text-muted-foreground mb-2 flex items-center justify-between text-sm">
        <p>
          {isSearching
            ? t("documents.foundResults", { count: total.toLocaleString() })
            : t("documents.showingRange", {
                from: docs.length > 0 ? offset + 1 : 0,
                to: Math.min(offset + limit, total),
                total: total.toLocaleString(),
              })}
          {processingTimeMs != null && <> · {processingTimeMs}ms</>}
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setViewMode(viewMode === "list" ? "raw" : "list")}
        >
          {viewMode === "list" ? t("documents.rawJson") : t("documents.listView")}
        </Button>
      </div>

      {loading && <p className="text-muted-foreground">{t("common.loading")}</p>}
      {error && <p className="text-destructive">{error}</p>}

      {/* 列表视图 */}
      {viewMode === "list" && (
        <div className="bg-card overflow-hidden rounded-lg border shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("documents.document")}</TableHead>
                  <TableHead className="text-right">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docs.map((doc, index) => (
                  <TableRow key={doc[primaryKey] ?? index}>
                    <TableCell>
                      <pre className="bg-muted max-h-40 overflow-auto rounded-md p-2 font-mono text-xs">
                        {JSON.stringify(doc, null, 2)}
                      </pre>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteDocId(doc[primaryKey])}
                        aria-label={t("documents.deleteDocument")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {docs.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-muted-foreground h-24 text-center">
                      {isSearching ? t("documents.noMatch") : t("documents.noDocuments")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Raw 视图 */}
      {viewMode === "raw" && (
        <pre className="bg-muted max-h-[50vh] overflow-auto rounded-md p-4 font-mono text-xs">
          {rawResponse ? JSON.stringify(rawResponse, null, 2) : t("documents.runSearchFirst")}
        </pre>
      )}

      {/* 分页 */}
      {viewMode === "list" && docs.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            {t("documents.page", { page: Math.floor(offset / limit) + 1 })}
          </p>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
            >
              {t("documents.previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOffset(offset + limit)}
              disabled={offset + limit >= total}
            >
              {t("documents.next")}
            </Button>
          </div>
        </div>
      )}

      {/* 添加文档 */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("documents.addTitle")}</DialogTitle>
            <DialogDescription>{t("documents.addDesc")}</DialogDescription>
          </DialogHeader>
          <Textarea
            value={newDocsJson}
            onChange={(e) => setNewDocsJson(e.target.value)}
            className="h-80 font-mono"
          />
          {actionError && <p className="text-destructive text-sm">{actionError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleAddDocuments}>{t("documents.addDocuments")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      <Dialog open={deleteDocId !== null} onOpenChange={(open) => !open && setDeleteDocId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("documents.deleteConfirmTitle")}</DialogTitle>
            <DialogDescription>
              {t("documents.deleteConfirmBodyDoc", { id: String(deleteDocId) })}
            </DialogDescription>
          </DialogHeader>
          {actionError && <p className="text-destructive text-sm">{actionError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDocId(null)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDeleteDoc}>
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 清空所有文档确认 */}
      <Dialog open={deleteAllOpen} onOpenChange={setDeleteAllOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear all documents?</DialogTitle>
            <DialogDescription>
              This will delete every document in this index ({total.toLocaleString()} documents).
              The index itself will be kept. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {actionError && <p className="text-destructive text-sm">{actionError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteAllOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAll}>
              Clear All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
