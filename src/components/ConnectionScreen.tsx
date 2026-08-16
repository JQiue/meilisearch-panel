import { Pencil, Plus, Server, Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { StoredConnection } from "../types";

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
import { ScrollArea } from "@/components/ui/scroll-area";

interface ConnectionFormProps {
  onSave: (connection: Omit<StoredConnection, "id">) => Promise<void>;
  onCancel: () => void;
  initialData?: StoredConnection | null;
}

const ConnectionForm: React.FC<ConnectionFormProps> = ({ onSave, onCancel, initialData }) => {
  const { t } = useTranslation();
  const [name, setName] = useState(initialData?.name || "");
  const [host, setHost] = useState(initialData?.host || "http://localhost:7700");
  const [apiKey, setApiKey] = useState(initialData?.apiKey || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setHost(initialData.host);
      setApiKey(initialData.apiKey);
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setError(t("connect.instanceNameRequired"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSave({ name, host, apiKey });
    } catch (err: any) {
      setError(err.message || t("connect.failedConnect"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">{t("connect.instanceName")}</Label>
        <Input
          id="name"
          required
          placeholder={t("connect.myLocalMeili")}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="host">{t("connect.meilisearchHost")}</Label>
        <Input
          id="host"
          type="url"
          required
          placeholder="http://localhost:7700"
          value={host}
          onChange={(e) => setHost(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="api-key">{t("connect.apiKey")}</Label>
        <Input
          id="api-key"
          type="password"
          placeholder={t("connect.apiKeyOptional")}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? t("connect.testing") : t("connect.testSave")}
        </Button>
      </DialogFooter>
    </form>
  );
};

interface InstanceManagementScreenProps {
  connections: StoredConnection[];
  onConnect: (connection: StoredConnection) => void;
  onAdd: (connection: Omit<StoredConnection, "id">) => Promise<StoredConnection>;
  onUpdate: (connection: StoredConnection) => Promise<StoredConnection>;
  onDelete: (id: string) => void;
}

export const ConnectionScreen: React.FC<InstanceManagementScreenProps> = ({
  connections,
  onConnect,
  onAdd,
  onUpdate,
  onDelete,
}) => {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [connectionToEdit, setConnectionToEdit] = useState<StoredConnection | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StoredConnection | null>(null);

  const handleSaveConnection = async (data: Omit<StoredConnection, "id">) => {
    if (connectionToEdit) {
      await onUpdate({ ...data, id: connectionToEdit.id });
    } else {
      const newConnection = await onAdd(data);
      onConnect(newConnection);
    }
    setDialogOpen(false);
    setConnectionToEdit(null);
  };

  const openAddDialog = () => {
    setConnectionToEdit(null);
    setDialogOpen(true);
  };

  const openEditDialog = (e: React.MouseEvent, conn: StoredConnection) => {
    e.stopPropagation();
    setConnectionToEdit(conn);
    setDialogOpen(true);
  };

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="bg-card w-full max-w-2xl space-y-8 rounded-xl border p-8 shadow-sm">
        <div className="text-center">
          <h1 className="text-3xl font-bold">{t("connect.panelTitle")}</h1>
          <p className="text-muted-foreground mt-2 text-sm">{t("connect.selectInstance")}</p>
        </div>
        <ScrollArea className="max-h-[50vh]">
          <div className="space-y-4 pr-2">
            {connections.map((conn) => (
              <div
                key={conn.id}
                onClick={() => onConnect(conn)}
                className="hover:bg-muted/50 flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors duration-200"
              >
                <div className="flex min-w-0 items-center">
                  <Server className="text-muted-foreground mr-4 h-6 w-6 shrink-0" />
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-semibold">{conn.name}</h3>
                    <p className="text-muted-foreground truncate font-mono text-sm">{conn.host}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => openEditDialog(e, conn)}
                    aria-label={t("connect.editConnection", { name: conn.name })}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(conn);
                    }}
                    aria-label={t("connect.deleteConnection", { name: conn.name })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onConnect(conn);
                    }}
                  >
                    {t("connect.connect")}
                  </Button>
                </div>
              </div>
            ))}
            {connections.length === 0 && (
              <div className="text-muted-foreground py-10 text-center">
                <p>{t("connect.noInstancesSaved")}</p>
                <p>{t("connect.addToGetStarted")}</p>
              </div>
            )}
          </div>
        </ScrollArea>
        <Button
          variant="outline"
          onClick={openAddDialog}
          className="relative flex w-full items-center justify-center border-dashed"
        >
          <Plus />
          {t("connect.addNewInstance")}
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {connectionToEdit ? t("connect.editInstance") : t("connect.addNewInstance")}
            </DialogTitle>
            <DialogDescription>
              {connectionToEdit ? t("connect.updateDetails") : t("connect.enterDetails")}
            </DialogDescription>
          </DialogHeader>
          <ConnectionForm
            key={connectionToEdit?.id ?? "new"}
            onSave={handleSaveConnection}
            onCancel={() => setDialogOpen(false)}
            initialData={connectionToEdit}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("connect.deleteConnectionTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("connect.deleteConnectionBody", { name: deleteTarget?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) onDelete(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
