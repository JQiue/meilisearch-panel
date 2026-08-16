import React, { useState, useEffect, useCallback } from "react";

import { MeilisearchService } from "../services/meilisearch";

import type { Settings } from "../types";

interface SettingsEditorProps {
  indexUid: string;
  service: MeilisearchService;
}

const ArrayInput: React.FC<{
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
}> = ({ label, values, onChange }) => {
  const textValue = values.join(", ");
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(
      e.target.value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    );
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <textarea
        value={textValue}
        onChange={handleChange}
        rows={3}
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-gray-900 shadow-sm focus:border-red-500 focus:ring-red-500 focus:outline-none sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        placeholder="comma, separated, values"
      />
    </div>
  );
};

export const SettingsEditor: React.FC<SettingsEditorProps> = ({ indexUid, service }) => {
  const [settings, setSettings] = useState<Partial<Settings> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await service.getSettings(indexUid);
      setSettings(data);
    } catch (e: any) {
      setError(e.message || "Failed to fetch settings");
    } finally {
      setLoading(false);
    }
  }, [indexUid, service]);

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
    try {
      await service.updateSettings(indexUid, settings);
      setSaveMessage("Settings updated successfully! Changes may take a moment to apply.");
      setTimeout(() => setSaveMessage(""), 5000);
    } catch (e: any) {
      setSaveMessage(`Error: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div>Loading settings...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!settings) return null;

  return (
    <div className="mt-6 rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Index Settings</h2>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-md bg-red-600 px-6 py-2 text-white hover:bg-red-700 disabled:bg-red-400"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {saveMessage && (
        <p
          className={`mb-4 text-sm ${
            saveMessage.startsWith("Error") ? "text-red-500" : "text-green-500"
          }`}
        >
          {saveMessage}
        </p>
      )}

      <div className="space-y-6">
        <ArrayInput
          label="Displayed Attributes"
          values={settings.displayedAttributes || []}
          onChange={(v) => handleSettingChange("displayedAttributes", v)}
        />
        <ArrayInput
          label="Searchable Attributes"
          values={settings.searchableAttributes || []}
          onChange={(v) => handleSettingChange("searchableAttributes", v)}
        />
        <ArrayInput
          label="Filterable Attributes"
          values={settings.filterableAttributes || []}
          onChange={(v) => handleSettingChange("filterableAttributes", v)}
        />
        <ArrayInput
          label="Sortable Attributes"
          values={settings.sortableAttributes || []}
          onChange={(v) => handleSettingChange("sortableAttributes", v)}
        />
        <ArrayInput
          label="Ranking Rules"
          values={settings.rankingRules || []}
          onChange={(v) => handleSettingChange("rankingRules", v)}
        />
      </div>
    </div>
  );
};
