import { Check, ChevronsUpDown, Loader2, Plus, X } from "lucide-react";
import { Meilisearch } from "meilisearch";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { Settings } from "../types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/** 字段多选：候选来自索引实际文档字段（带示例值），可搜索、可自定义添加 */
const FieldMultiSelect: React.FC<{
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  service: Meilisearch;
  indexUid: string;
  helper?: string;
}> = ({ label, values, onChange, service, indexUid, helper }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [fields, setFields] = useState<Record<string, string> | null>(null);

  // 从索引文档提取字段候选（limit 5 合并字段，覆盖不一致的文档结构）
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const docs = await service.index(indexUid).getDocuments({ limit: 5 });
        if (cancelled || docs.results.length === 0) return;
        const merged: Record<string, unknown> = {};
        for (const doc of docs.results) Object.assign(merged, doc);
        const sample: Record<string, string> = {};
        for (const [name, value] of Object.entries(merged)) {
          sample[name] =
            typeof value === "object" && value !== null
              ? JSON.stringify(value).slice(0, 28)
              : String(value).slice(0, 28);
        }
        setFields(sample);
      } catch {
        /* 无权限或索引为空时忽略，降级为纯自定义输入 */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [indexUid, service]);

  // 候选 = 文档字段 + 已选值（自定义字段保留）
  const docFields = Object.keys(fields ?? {});
  const options = [...new Set([...docFields, ...values])];
  const filtered = options.filter((o) => o.toLowerCase().includes(search.toLowerCase()));
  const canAddCustom = search.trim() !== "" && !options.includes(search.trim());

  const toggle = (option: string) => {
    onChange(values.includes(option) ? values.filter((v) => v !== option) : [...values, option]);
  };

  const addCustom = () => {
    const name = search.trim();
    if (!name || values.includes(name)) return;
    onChange([...values, name]);
    setSearch("");
  };

  const remove = (option: string) => {
    onChange(values.filter((v) => v !== option));
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {helper && <p className="text-muted-foreground text-xs">{helper}</p>}
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
          {values.length === 0 ? (
            <span className="text-muted-foreground">{t("settings.selectFields")}</span>
          ) : (
            <span className="flex flex-wrap gap-1">
              {values.map((v) => (
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
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              placeholder={t("settings.searchFields")}
              value={search}
              onValueChange={setSearch}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canAddCustom) {
                  e.preventDefault();
                  addCustom();
                }
              }}
            />
            <CommandList>
              {fields === null ? (
                <div className="text-muted-foreground flex items-center justify-center gap-2 py-6 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("settings.loadingFields")}
                </div>
              ) : (
                <>
                  <CommandEmpty className="py-3 text-left">
                    {canAddCustom ? (
                      <button
                        onClick={addCustom}
                        className="text-primary hover:bg-muted flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-left text-sm"
                      >
                        <Plus className="h-4 w-4" />
                        {t("settings.addCustomField", { name: search.trim() })}
                      </button>
                    ) : (
                      <span className="text-muted-foreground">{t("settings.noFieldsFound")}</span>
                    )}
                  </CommandEmpty>
                  <CommandGroup heading={t("settings.fieldsFromDocuments")}>
                    {filtered.map((option) => {
                      const sample = fields[option];
                      return (
                        <CommandItem
                          key={option}
                          value={option}
                          onSelect={() => toggle(option)}
                          className="cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "h-4 w-4",
                              values.includes(option) ? "opacity-100" : "opacity-0",
                            )}
                          />
                          <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                            <span className="font-mono text-xs">{option}</span>
                            {sample !== undefined && (
                              <span className="text-muted-foreground truncate text-xs">
                                {sample}
                              </span>
                            )}
                          </span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {values.length > 0 && (
        <p className="text-muted-foreground text-xs">
          {t("settings.fieldCount", { count: values.length })} · {t("settings.clickTagToRemove")}
        </p>
      )}
    </div>
  );
};

interface SettingsEditorProps {
  indexUid: string;
  service: Meilisearch;
}

/** 数组字段：tag 输入（回车/逗号添加、× 删除、自动去重去空、兼容中文逗号） */
const TagInput: React.FC<{
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  helper?: string;
  placeholder?: string;
}> = ({ label, values, onChange, helper, placeholder }) => {
  const { t } = useTranslation();
  const [draft, setDraft] = useState("");

  const commit = (raw: string) => {
    const next = raw
      .split(/[,，]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (next.length === 0) return;
    const deduped = [...new Set([...values, ...next])];
    onChange(deduped);
    setDraft("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === "，") {
      e.preventDefault();
      commit(draft);
    } else if (e.key === "Backspace" && draft === "" && values.length > 0) {
      onChange(values.slice(0, -1)); // 退格删除最后一个 tag
    }
  };

  const remove = (value: string) => {
    onChange(values.filter((v) => v !== value));
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {helper && <p className="text-muted-foreground text-xs">{helper}</p>}
      <div className="bg-muted/30 border-input focus-within:ring-ring/50 flex flex-wrap items-center gap-1.5 rounded-lg border p-2 focus-within:ring-3">
        {values.map((v) => (
          <Badge
            key={v}
            variant="secondary"
            className="cursor-pointer font-mono"
            onClick={() => remove(v)}
            title={t("common.delete")}
          >
            {v} ×
          </Badge>
        ))}
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => commit(draft)}
          placeholder={values.length === 0 ? (placeholder ?? t("settings.typeAndEnter")) : ""}
          className="h-6 min-w-24 flex-1 border-0 bg-transparent shadow-none ring-0 focus-visible:ring-0"
        />
      </div>
      {values.length > 0 && (
        <p className="text-muted-foreground text-xs">
          {t("settings.itemCount", { count: values.length })} · {t("settings.clickTagToRemove")}
        </p>
      )}
    </div>
  );
};

/** JSON 结构设置项（synonyms、typoTolerance 等）——带结构校验 */
const JsonInput: React.FC<{
  label: string;
  value: any;
  onChange: (value: any) => void;
  helper?: string;
  validate?: (parsed: any) => string | null;
}> = ({ label, value, onChange, helper, validate }) => {
  const { t } = useTranslation();
  const [error, setError] = useState("");
  const textValue = value === undefined || value === null ? "" : JSON.stringify(value, null, 2);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const raw = e.target.value.trim();
    if (!raw) {
      setError("");
      onChange(null);
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      const validationError = validate?.(parsed) ?? null;
      if (validationError) {
        setError(validationError);
        return;
      }
      setError("");
      onChange(parsed);
    } catch (e: any) {
      setError(t("settings.invalidJson", { message: e.message }));
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {helper && <p className="text-muted-foreground text-xs">{helper}</p>}
      <Textarea
        value={textValue}
        onChange={handleChange}
        rows={4}
        className="font-mono"
        placeholder="{ }"
      />
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
};

export const SettingsEditor: React.FC<SettingsEditorProps> = ({ indexUid, service }) => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<Partial<Settings> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await service.index(indexUid).getSettings();
      setSettings(data as Partial<Settings>);
    } catch (e: any) {
      setError(e.message || t("settings.fetchFailed"));
    } finally {
      setLoading(false);
    }
  }, [indexUid, service, t]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSettingChange = (key: keyof Settings, value: any) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : { [key]: value }));
  };

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    setSaveMessage("");
    setSaveError(false);
    try {
      await service.index(indexUid).updateSettings(settings);
      setSaveMessage(t("settings.saved"));
      setTimeout(() => setSaveMessage(""), 5000);
    } catch (e: any) {
      setSaveMessage(t("settings.saveError", { message: e.message }));
      setSaveError(true);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading)
    return (
      <div className="mt-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  if (error) return <div className="text-destructive mt-6">{error}</div>;
  if (!settings) return null;

  // distinctAttribute 候选：filterable + searchable + displayed 字段
  const attributeOptions = [
    ...(settings.filterableAttributes || []),
    ...(settings.searchableAttributes || []),
    ...(settings.displayedAttributes || []),
  ].filter((v, i, arr) => arr.indexOf(v) === i);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>{t("settings.title")}</CardTitle>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? t("settings.saving") : t("settings.saveChanges")}
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {saveMessage && (
          <p
            className={`text-sm ${saveError ? "text-destructive" : "text-green-600 dark:text-green-400"}`}
          >
            {saveMessage}
          </p>
        )}
        <FieldMultiSelect
          label={t("settings.displayedAttributes")}
          values={settings.displayedAttributes || []}
          onChange={(v) => handleSettingChange("displayedAttributes", v)}
          service={service}
          indexUid={indexUid}
          helper={t("settings.displayedHelper")}
        />
        <FieldMultiSelect
          label={t("settings.searchableAttributes")}
          values={settings.searchableAttributes || []}
          onChange={(v) => handleSettingChange("searchableAttributes", v)}
          service={service}
          indexUid={indexUid}
          helper={t("settings.searchableHelper")}
        />
        <FieldMultiSelect
          label={t("settings.filterableAttributes")}
          values={settings.filterableAttributes || []}
          onChange={(v) => handleSettingChange("filterableAttributes", v)}
          service={service}
          indexUid={indexUid}
          helper={t("settings.filterableHelper")}
        />
        <FieldMultiSelect
          label={t("settings.sortableAttributes")}
          values={settings.sortableAttributes || []}
          onChange={(v) => handleSettingChange("sortableAttributes", v)}
          service={service}
          indexUid={indexUid}
          helper={t("settings.sortableHelper")}
        />
        <TagInput
          label={t("settings.rankingRules")}
          values={settings.rankingRules || []}
          onChange={(v) => handleSettingChange("rankingRules", v)}
          placeholder="e.g. words, typo, proximity"
        />
        <TagInput
          label={t("settings.stopWords")}
          values={settings.stopWords || []}
          onChange={(v) => handleSettingChange("stopWords", v)}
          helper={t("settings.stopWordsHelper")}
        />
        <div className="space-y-2">
          <Label>{t("settings.distinctAttribute")}</Label>
          <Select
            value={settings.distinctAttribute || "__none__"}
            onValueChange={(v) =>
              handleSettingChange("distinctAttribute", v === "__none__" ? null : v)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("settings.selectAttribute")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">{t("settings.noneDisabled")}</SelectItem>
              {attributeOptions.map((attr) => (
                <SelectItem key={attr} value={attr}>
                  <span className="font-mono">{attr}</span>
                </SelectItem>
              ))}
              {attributeOptions.length === 0 && (
                <SelectItem value="__empty__" disabled>
                  {t("settings.noAttributesDefined")}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          <p className="text-muted-foreground text-xs">{t("settings.distinctHelper")}</p>
        </div>
        <JsonInput
          label={t("settings.synonyms")}
          value={settings.synonyms}
          onChange={(v) => handleSettingChange("synonyms", v)}
          helper={t("settings.synonymsHelper")}
          validate={(parsed) => {
            if (typeof parsed !== "object" || Array.isArray(parsed))
              return t("settings.synonymsMustBeObject");
            for (const [word, list] of Object.entries(parsed)) {
              if (!Array.isArray(list) || !list.every((s) => typeof s === "string"))
                return t("settings.synonymMustMapArray", { word });
            }
            return null;
          }}
        />
        <JsonInput
          label={t("settings.typoTolerance")}
          value={settings.typoTolerance}
          onChange={(v) => handleSettingChange("typoTolerance", v)}
          helper={t("settings.typoToleranceHelper")}
          validate={(parsed) => {
            if (typeof parsed !== "object" || Array.isArray(parsed))
              return t("settings.typoToleranceMustBeObject");
            if ("enabled" in parsed && typeof parsed.enabled !== "boolean")
              return t("settings.enabledMustBeBoolean");
            return null;
          }}
        />
        <JsonInput
          label={t("settings.pagination")}
          value={settings.pagination}
          onChange={(v) => handleSettingChange("pagination", v)}
          helper={t("settings.paginationHelper")}
          validate={(parsed) => {
            if (typeof parsed !== "object" || Array.isArray(parsed))
              return t("settings.paginationMustBeObject");
            if ("maxTotalHits" in parsed && typeof parsed.maxTotalHits !== "number")
              return t("settings.maxTotalHitsMustBeNumber");
            return null;
          }}
        />
      </CardContent>
    </Card>
  );
};
