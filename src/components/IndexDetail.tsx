import { Loader2 } from "lucide-react";
import { Meilisearch } from "meilisearch";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";

import { DocumentViewer } from "./DocumentViewer";
import { SettingsEditor } from "./SettingsEditor";

import type { Index, IndexStats } from "../types";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface IndexDetailProps {
  indexUid: string;
  service: Meilisearch;
  onBack: () => void;
}

type Tab = "stats" | "documents" | "settings";

export const IndexDetail: React.FC<IndexDetailProps> = ({ indexUid, service }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>("stats");
  const [index, setIndex] = useState<Index | null>(null);
  const [stats, setStats] = useState<IndexStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isInitialLoad = useRef(true);

  const fetchData = useCallback(async () => {
    if (isInitialLoad.current) {
      setLoading(true);
    } else {
      setIsPolling(true);
    }
    setError(null);
    try {
      const [indexData, statsData] = await Promise.all([
        service.getRawIndex(indexUid),
        service.index(indexUid).getStats(),
      ]);
      setIndex(indexData);
      setStats(statsData);
      isInitialLoad.current = false;
    } catch (e: any) {
      setError(e.message || t("indexDetail.fetchFailed"));
    } finally {
      setLoading(false);
      setIsPolling(false);
    }
  }, [indexUid, service, t]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Poll for stats
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading)
    return (
      <div className="flex h-full flex-col gap-4 p-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  if (error)
    return <div className="text-destructive flex h-full items-center justify-center">{error}</div>;

  const statsContent = (
    <Card>
      <CardHeader>
        <CardTitle>{t("indexDetail.statistics")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card size="sm">
            <CardHeader>
              <CardDescription>{t("indexDetail.numberOfDocuments")}</CardDescription>
              <CardTitle className="text-2xl">
                {stats?.numberOfDocuments.toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardDescription>{t("indexDetail.indexingStatus")}</CardDescription>
              <CardTitle className="flex items-center gap-2 text-2xl">
                {stats?.isIndexing ? (
                  <Badge variant="outline" className="gap-1.5">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
                    {t("overview.indexing")}
                  </Badge>
                ) : (
                  <Badge variant="secondary">{t("overview.idle")}</Badge>
                )}
                {isPolling && <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
        <div>
          <CardTitle className="mb-2 text-lg font-semibold">
            {t("indexDetail.fieldDistribution")}
          </CardTitle>
          <ScrollArea className="h-64 rounded-lg border">
            <Table>
              <TableHeader className="bg-muted sticky top-0">
                <TableRow>
                  <TableHead>{t("indexDetail.field")}</TableHead>
                  <TableHead>{t("indexDetail.count")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats?.fieldDistribution &&
                  Object.entries(stats.fieldDistribution).map(([field, count]) => (
                    <TableRow key={field}>
                      <TableCell className="font-mono">{field}</TableCell>
                      <TableCell>{count}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3">
        <h1 className="text-3xl font-bold">{index?.uid}</h1>
        <p className="text-muted-foreground text-sm">
          {t("indexes.primaryKey")}: {index?.primaryKey || t("indexDetail.primaryKeyNotSet")}
        </p>
      </div>
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as Tab)}
        className="flex min-h-0 flex-1 flex-col"
      >
        <TabsList>
          <TabsTrigger value="stats">{t("indexDetail.tabsStats")}</TabsTrigger>
          <TabsTrigger value="settings">{t("indexDetail.tabsSettings")}</TabsTrigger>
          <TabsTrigger value="documents">{t("indexDetail.tabsDocuments")}</TabsTrigger>
        </TabsList>
        <TabsContent value="stats" className="mt-4 min-h-0 flex-1">
          <ScrollArea className="h-full pr-4">{statsContent}</ScrollArea>
        </TabsContent>
        <TabsContent value="documents" className="mt-4 min-h-0 flex-1">
          <ScrollArea className="h-full pr-4">
            <DocumentViewer indexUid={indexUid} service={service} />
          </ScrollArea>
        </TabsContent>
        <TabsContent value="settings" className="mt-4 min-h-0 flex-1">
          <ScrollArea className="h-full pr-4">
            <SettingsEditor indexUid={indexUid} service={service} />
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};
