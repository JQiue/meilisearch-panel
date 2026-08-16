import {
  Check,
  ChevronsUpDown,
  ClipboardCopy,
  Copy,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Meilisearch } from "meilisearch";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { Key } from "../types";
import type { TFunction } from "i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface KeyManagementProps {
  service: Meilisearch;
}

/** Meilisearch 标准 API key actions */
const ALL_ACTIONS = [
  "search",
  "documents.add",
  "documents.get",
  "documents.delete",
  "indexes.create",
  "indexes.get",
  "indexes.update",
  "indexes.delete",
  "tasks.get",
  "tasks.cancel",
  "tasks.delete",
  "settings.get",
  "settings.update",
  "stats.get",
  "dumps.create",
  "version",
  "keys.get",
  "keys.create",
  "keys.update",
  "keys.delete",
  "metrics.get",
  "experimental.features.get",
  "experimental.features.update",
] as const;

type ActionName = (typeof ALL_ACTIONS)[number];

/** 每个 action 的作用说明 → i18n key（来源：Meilisearch 官方文档 Available Actions） */
const ACTION_HELPERS: Record<ActionName, string> = {
  search: "keys.action_search",
  "documents.add": "keys.action_documentsAdd",
  "documents.get": "keys.action_documentsGet",
  "documents.delete": "keys.action_documentsDelete",
  "indexes.create": "keys.action_indexesCreate",
  "indexes.get": "keys.action_indexesGet",
  "indexes.update": "keys.action_indexesUpdate",
  "indexes.delete": "keys.action_indexesDelete",
  "tasks.get": "keys.action_tasksGet",
  "tasks.cancel": "keys.action_tasksCancel",
  "tasks.delete": "keys.action_tasksDelete",
  "settings.get": "keys.action_settingsGet",
  "settings.update": "keys.action_settingsUpdate",
  "stats.get": "keys.action_statsGet",
  "dumps.create": "keys.action_dumpsCreate",
  version: "keys.action_version",
  "keys.get": "keys.action_keysGet",
  "keys.create": "keys.action_keysCreate",
  "keys.update": "keys.action_keysUpdate",
  "keys.delete": "keys.action_keysDelete",
  "metrics.get": "keys.action_metricsGet",
  "experimental.features.get": "keys.action_experimentalFeaturesGet",
  "experimental.features.update": "keys.action_experimentalFeaturesUpdate",
};

/** 相对时间：x 天/月/年前 */
function timeAgo(date: string | Date, t: TFunction): string {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);
  if (days >= 365) return t("common.timeYearsAgo", { count: Math.floor(days / 365) });
  if (days >= 30) return t("common.timeMonthsAgo", { count: Math.floor(days / 30) });
  if (days > 0) return t("common.timeDaysAgo", { count: days });
  if (hours > 0) return t("common.timeHoursAgo", { count: hours });
  return t("common.timeJustNow");
}

/** 相对时间：还有多久过期 */
function timeUntil(date: string | Date, t: TFunction): string {
  const diff = new Date(date).getTime() - Date.now();
  const days = Math.ceil(diff / 86400000);
  if (days <= 0) return t("keys.expired");
  if (days === 1) return t("keys.expiresTomorrow");
  if (days < 30) return t("keys.expiresInDays", { count: days });
  return t("keys.expiresMonths", { count: Math.ceil(days / 30) });
}

/** ISO 时间字符串/Date → datetime-local input 值（本地时区，分钟精度） */
function toLocalDatetime(iso: string | Date): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 多选下拉（Popover + Command） */
const MultiSelect: React.FC<{
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  emptyText?: string;
  loading?: boolean;
  helperMap?: Record<string, string>;
}> = ({
  options,
  value,
  onChange,
  placeholder = "Select...",
  emptyText = "No options found.",
  loading,
  helperMap,
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const toggle = (option: string) => {
    onChange(value.includes(option) ? value.filter((v) => v !== option) : [...value, option]);
  };

  const remove = (option: string) => {
    onChange(value.filter((v) => v !== option));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-auto min-h-9 w-full justify-between font-normal"
          />
        }
      >
        {value.length === 0 ? (
          <span className="text-muted-foreground">{placeholder}</span>
        ) : (
          <span className="flex flex-wrap gap-1">
            {value.map((v) => (
              <span
                key={v}
                onClick={(e) => {
                  e.stopPropagation();
                  remove(v);
                }}
                className="bg-muted hover:bg-destructive/20 flex cursor-pointer items-center gap-1 rounded px-1.5 py-0.5 font-mono text-xs"
              >
                {v}
                <X className="h-3 w-3" />
              </span>
            ))}
          </span>
        )}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className={cn("w-full p-0", helperMap && "min-w-80!")} align="start">
        <Command>
          <CommandInput placeholder={t("keys.searchPlaceholder")} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {loading ? (
                <div className="text-muted-foreground flex items-center justify-center gap-2 py-6 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("common.loading")}
                </div>
              ) : (
                options.map((option) => (
                  <CommandItem
                    key={option}
                    value={option}
                    onSelect={() => toggle(option)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0",
                        value.includes(option) ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                      <span className="font-mono text-xs">{option}</span>
                      {helperMap?.[option] && (
                        <span className="text-muted-foreground truncate text-xs">
                          {t(helperMap[option])}
                        </span>
                      )}
                    </span>
                  </CommandItem>
                ))
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const KeyCreateForm: React.FC<{
  service: Meilisearch;
  initialData?: Key | null;
  onSave: (key: any) => Promise<void>;
  onCancel: () => void;
}> = ({ service, initialData, onSave, onCancel }) => {
  const { t } = useTranslation();
  const isEditing = !!initialData;
  const [uid, setUid] = useState("");
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [actions, setActions] = useState<ActionName[]>(
    (initialData?.actions as ActionName[]) || ["search"],
  );
  const [indexes, setIndexes] = useState<string[]>(initialData?.indexes || ["*"]);
  const [availableIndexes, setAvailableIndexes] = useState<string[]>([]);
  const [indexesLoading, setIndexesLoading] = useState(true);
  const [expiresAt, setExpiresAt] = useState(
    initialData?.expiresAt ? toLocalDatetime(initialData.expiresAt) : "",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    service
      .getRawIndexes()
      .then((res) => setAvailableIndexes(res.results.map((i) => i.uid)))
      .catch(() => setAvailableIndexes([]))
      .finally(() => setIndexesLoading(false));
  }, [service]);

  const handleSubmit = async () => {
    if (!description) {
      setError(t("keys.descRequired"));
      return;
    }
    if (!isEditing && actions.length === 0) {
      setError(t("keys.selectAtLeastAction"));
      return;
    }
    if (!isEditing && indexes.length === 0) {
      setError(t("keys.selectAtLeastIndex"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      if (isEditing) {
        // Meilisearch API 仅支持更新 name 与 description
        await onSave({ name: name || undefined, description });
      } else {
        await onSave({
          uid: uid || undefined,
          name: name || undefined,
          description,
          actions: [...actions],
          indexes,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        });
      }
    } catch (e: any) {
      setError(e.message || t("keys.saveFailed"));
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!isEditing && (
        <div className="space-y-2">
          <Label htmlFor="key-uid">{t("keys.uidOptional")}</Label>
          <Input
            id="key-uid"
            type="text"
            value={uid}
            onChange={(e) => setUid(e.target.value)}
            placeholder={t("keys.autoGenerated")}
            className="font-mono"
          />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="key-name">{t("keys.nameOptional")}</Label>
        <Input
          id="key-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("keys.namePlaceholder")}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="key-desc">{t("keys.description")}</Label>
        <Input
          id="key-desc"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("keys.descPlaceholder")}
        />
      </div>

      {!isEditing && (
        <>
          <div className="space-y-2">
            <Label>{t("common.actions")}</Label>
            <MultiSelect
              options={[...ALL_ACTIONS]}
              value={actions}
              onChange={(v) => setActions(v as ActionName[])}
              placeholder={t("keys.selectActions")}
              emptyText={t("keys.noMatchingAction")}
              helperMap={ACTION_HELPERS}
            />
            <p className="text-muted-foreground text-xs">
              {actions.length === 0
                ? t("keys.selectAtLeastAction")
                : t("keys.actionsSelected", { count: actions.length, list: actions.join(", ") })}
            </p>
          </div>

          <div className="space-y-2">
            <Label>{t("keys.indexes")}</Label>
            <MultiSelect
              options={["*", ...availableIndexes]}
              value={indexes}
              onChange={setIndexes}
              placeholder={t("keys.selectIndexes")}
              emptyText={indexesLoading ? t("common.loading") : t("keys.noOptions")}
              loading={indexesLoading}
            />
            <p className="text-muted-foreground text-xs">
              {indexes.length === 0
                ? t("keys.selectAtLeastIndex")
                : t("keys.actionsSelected", { count: indexes.length, list: indexes.join(", ") })}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="key-expires">{t("keys.expires")} (optional)</Label>
            <Input
              id="key-expires"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
        </>
      )}

      {isEditing && <p className="text-muted-foreground text-xs">{t("keys.editNote")}</p>}
      {error && <p className="text-destructive text-sm">{error}</p>}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={loading}>
          {loading
            ? isEditing
              ? t("settings.saving")
              : t("keys.creating")
            : isEditing
              ? t("settings.saveChanges")
              : t("keys.createKey")}
        </Button>
      </DialogFooter>
    </div>
  );
};

const NewKeyDialog: React.FC<{ apiKey: Key; onClose: () => void }> = ({ apiKey, onClose }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("keys.keyCreatedTitle")}</DialogTitle>
        </DialogHeader>
        <div className="bg-muted relative rounded-md p-3 pr-10 font-mono text-sm break-all">
          {apiKey.key}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            className="absolute top-2 right-2"
            aria-label={t("keys.copyApiKey")}
          >
            <ClipboardCopy className="h-4 w-4" />
          </Button>
        </div>
        {copied && <p className="text-xs text-green-600 dark:text-green-400">{t("keys.copied")}</p>}
        <DialogFooter>
          <Button onClick={onClose}>{t("common.done")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const KeyManagement: React.FC<KeyManagementProps> = ({ service }) => {
  const { t } = useTranslation();
  const [keys, setKeys] = useState<Key[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Key | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Key | null>(null);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<Key | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [copiedUid, setCopiedUid] = useState<string | null>(null);

  const handleCopyKey = async (uid: string) => {
    try {
      await navigator.clipboard.writeText(uid);
      setCopiedUid(uid);
      setTimeout(() => setCopiedUid(null), 2000);
    } catch (e) {
      console.error("Failed to copy key uid", e);
    }
  };

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await service.getKeys();
      setKeys(res.results);
    } catch (e: any) {
      setError(e.message || t("keys.fetchFailed"));
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleCreateKey = async (keyData: any) => {
    const newKey = await service.createKey(keyData);
    setNewlyCreatedKey(newKey);
    setCreateOpen(false);
  };

  const handleUpdateKey = async (keyData: { name?: string; description?: string }) => {
    if (!editTarget) return;
    await service.updateKey(editTarget.uid, keyData);
    setEditTarget(null);
    fetchKeys();
  };

  const handleDeleteKey = async () => {
    if (!deleteTarget) return;
    setDeleteError("");
    try {
      await service.deleteKey(deleteTarget.uid);
      setDeleteTarget(null);
      fetchKeys();
    } catch (e: any) {
      setDeleteError(e.message || t("keys.deleteFailed"));
    }
  };

  const closeNewKeyDialog = () => {
    setNewlyCreatedKey(null);
    fetchKeys();
  };

  if (loading)
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-9 w-36" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  if (error) return <div className="text-destructive">{error}</div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("keys.title")}</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus />
          {t("keys.createKey")}
        </Button>
      </div>

      <div className="bg-card overflow-x-auto rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("keys.name")}</TableHead>
              <TableHead>{t("keys.description")}</TableHead>
              <TableHead>{t("keys.keyPrefix")}</TableHead>
              <TableHead>{t("common.actions")}</TableHead>
              <TableHead>{t("keys.indexes")}</TableHead>
              <TableHead>{t("keys.expires")}</TableHead>
              <TableHead>{t("keys.created")}</TableHead>
              <TableHead className="text-right">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keys.map((key) => (
              <TableRow key={key.uid}>
                <TableCell className="max-w-[160px] truncate font-medium" title={key.name || "-"}>
                  {key.name || "-"}
                </TableCell>
                <TableCell>
                  <div className="max-w-[280px] truncate" title={key.description || "-"}>
                    {key.description || "-"}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <span>{key.uid.slice(0, 8)}...</span>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleCopyKey(key.uid)}
                      aria-label={t("keys.copyUid", { uid: key.uid })}
                    >
                      {copiedUid === key.uid ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex max-w-xs flex-wrap gap-1">
                    {key.actions.map((action) => (
                      <Badge key={action} variant="secondary" className="font-mono">
                        {action}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex max-w-xs flex-wrap gap-1">
                    {key.indexes.map((index) => (
                      <Badge key={index} variant="outline" className="font-mono">
                        {index}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap">
                  {key.expiresAt ? (
                    <span
                      className={
                        new Date(key.expiresAt).getTime() < Date.now()
                          ? "text-destructive font-medium"
                          : "text-muted-foreground"
                      }
                      title={`${t("keys.expires")} ${new Date(key.expiresAt).toLocaleString()}`}
                    >
                      {timeUntil(key.expiresAt, t)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">{t("common.never")}</span>
                  )}
                </TableCell>
                <TableCell
                  className="text-muted-foreground text-sm whitespace-nowrap"
                  title={new Date(key.createdAt).toLocaleString()}
                >
                  {timeAgo(key.createdAt, t)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditTarget(key)}
                    aria-label={t("keys.editKey", { name: key.name || key.description })}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteTarget(key)}
                    aria-label={t("keys.deleteKey", { name: key.name || key.description })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {keys.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-muted-foreground h-24 text-center">
                  {t("keys.empty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("keys.createKeyTitle")}</DialogTitle>
            <DialogDescription>{t("keys.createKeyDesc")}</DialogDescription>
          </DialogHeader>
          <KeyCreateForm
            service={service}
            onSave={handleCreateKey}
            onCancel={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("keys.editKeyTitle")}</DialogTitle>
            <DialogDescription>{t("keys.editKeyDesc")}</DialogDescription>
          </DialogHeader>
          {editTarget && (
            <KeyCreateForm
              key={editTarget.uid}
              service={service}
              initialData={editTarget}
              onSave={handleUpdateKey}
              onCancel={() => setEditTarget(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {newlyCreatedKey && <NewKeyDialog apiKey={newlyCreatedKey} onClose={closeNewKeyDialog} />}

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("keys.deleteKeyTitle")}</DialogTitle>
            <DialogDescription>{t("keys.deleteKeyBody")}</DialogDescription>
          </DialogHeader>
          {deleteError && <p className="text-destructive text-sm">{deleteError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDeleteKey}>
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
