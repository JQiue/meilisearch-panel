import { Meilisearch } from "meilisearch";
import { version as sdkVersion } from "meilisearch/package.json";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { InstanceStats, VersionInfo } from "../types";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface InstanceOverviewProps {
  service: Meilisearch;
}

const StatCard: React.FC<{ title: string; value: string; subtitle?: string }> = ({
  title,
  value,
  subtitle,
}) => (
  <Card>
    <CardHeader>
      <CardDescription>{title}</CardDescription>
      <CardTitle className="truncate text-3xl font-semibold">{value}</CardTitle>
      {subtitle && (
        <CardDescription className="truncate font-mono text-xs" title={subtitle}>
          {subtitle}
        </CardDescription>
      )}
    </CardHeader>
  </Card>
);

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

export const InstanceOverview: React.FC<InstanceOverviewProps> = ({ service }) => {
  const { t } = useTranslation();
  const [version, setVersion] = useState<VersionInfo | null>(null);
  const [stats, setStats] = useState<InstanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [versionData, statsData] = await Promise.all([
        service.getVersion(),
        service.getStats(),
      ]);
      setVersion({
        commitSha: versionData.commitSha,
        buildDate: versionData.commitDate,
        pkgVersion: versionData.pkgVersion,
      });
      setStats(statsData);
    } catch (e: any) {
      setError(e.message || t("overview.fetchFailed"));
    } finally {
      setLoading(false);
    }
  }, [service, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading)
    return (
      <div>
        <Skeleton className="mb-6 h-9 w-64" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      </div>
    );
  if (error) return <div className="text-destructive">{error}</div>;
  if (!version || !stats) return <div className="text-muted-foreground">{t("common.noData")}</div>;

  const totalDocuments = Object.values(stats.indexes).reduce(
    (sum, indexStats) => sum + indexStats.numberOfDocuments,
    0,
  );

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">{t("overview.title")}</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("overview.instanceVersion")}
          value={version.pkgVersion}
          subtitle={`commit ${version.commitSha.slice(0, 8)} · ${new Date(version.buildDate).toLocaleDateString()}`}
        />
        <StatCard title={t("overview.sdkVersion")} value={sdkVersion} />
        <StatCard title={t("overview.databaseSize")} value={formatBytes(stats.databaseSize)} />
        <StatCard title={t("overview.usedDbSize")} value={formatBytes(stats.usedDatabaseSize)} />
        <StatCard title={t("overview.indexes")} value={String(Object.keys(stats.indexes).length)} />
        <StatCard title={t("overview.totalDocuments")} value={totalDocuments.toLocaleString()} />
        <StatCard
          title={t("overview.lastUpdated")}
          value={new Date(stats.lastUpdate).toLocaleString()}
        />
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{t("overview.indexStatus")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("overview.indexUid")}</TableHead>
                  <TableHead>{t("common.status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(stats.indexes).map(([uid, indexStats]) => (
                  <TableRow key={uid}>
                    <TableCell className="text-primary font-mono whitespace-nowrap">
                      {uid}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {indexStats.isIndexing ? (
                        <Badge variant="outline" className="gap-1.5">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
                          {t("overview.indexing")}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">{t("overview.idle")}</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {Object.keys(stats.indexes).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-muted-foreground h-24 text-center">
                      {t("overview.noIndexes")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
