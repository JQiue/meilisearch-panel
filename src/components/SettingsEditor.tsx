import React, { useState, useEffect, useCallback } from 'react';
import { MeilisearchService } from '../services/meilisearch';
import { Settings } from '../types';

interface SettingsEditorProps {
  indexUid: string;
  service: MeilisearchService;
}

const ArrayInput: React.FC<{
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
}> = ({ label, values, onChange }) => {
  const textValue = values.join(', ');
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(
      e.target.value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    );
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <textarea
        value={textValue}
        onChange={handleChange}
        rows={3}
        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm text-gray-900 dark:text-white dark:bg-gray-700 font-mono"
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
  const [saveMessage, setSaveMessage] = useState('');

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await service.getSettings(indexUid);
      setSettings(data);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch settings');
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
    setSaveMessage('');
    try {
      await service.updateSettings(indexUid, settings);
      setSaveMessage('Settings updated successfully! Changes may take a moment to apply.');
      setTimeout(() => setSaveMessage(''), 5000);
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
    <div className="mt-6 bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Index Settings</h2>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 disabled:bg-red-400"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {saveMessage && (
        <p
          className={`mb-4 text-sm ${
            saveMessage.startsWith('Error') ? 'text-red-500' : 'text-green-500'
          }`}
        >
          {saveMessage}
        </p>
      )}

      <div className="space-y-6">
        <ArrayInput
          label="Displayed Attributes"
          values={settings.displayedAttributes || []}
          onChange={(v) => handleSettingChange('displayedAttributes', v)}
        />
        <ArrayInput
          label="Searchable Attributes"
          values={settings.searchableAttributes || []}
          onChange={(v) => handleSettingChange('searchableAttributes', v)}
        />
        <ArrayInput
          label="Filterable Attributes"
          values={settings.filterableAttributes || []}
          onChange={(v) => handleSettingChange('filterableAttributes', v)}
        />
        <ArrayInput
          label="Sortable Attributes"
          values={settings.sortableAttributes || []}
          onChange={(v) => handleSettingChange('sortableAttributes', v)}
        />
        <ArrayInput
          label="Ranking Rules"
          values={settings.rankingRules || []}
          onChange={(v) => handleSettingChange('rankingRules', v)}
        />
      </div>
    </div>
  );
};
