import React from 'react';
import { useSettings } from '../../../contexts/SettingsContext';
import { useToast } from '../../../contexts/ToastContext';
import type { LocaleSettings } from '../../../types';

const timezones = ['Europe/London', 'America/New_York', 'Asia/Tokyo'];

const LocalePage: React.FC = () => {
    const { settings, updateSettings, loading } = useSettings();
    const { addToast } = useToast();
    const [isSaving, setIsSaving] = React.useState(false);

    if (loading || !settings) {
        return <div>Loading locale settings...</div>;
    }
    
    const handleLocaleChange = (update: Partial<LocaleSettings>) => {
        if(!settings) return;
        updateSettings({ ...settings, locale: { ...settings.locale, ...update } });
    };

    const handleSave = async () => {
        if (!settings) return;
        setIsSaving(true);
        try {
            await updateSettings(settings);
            addToast('Locale settings saved!', 'success');
        } catch {
             addToast('Failed to save settings.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6 max-w-md">
            <h2 className="text-xl font-bold text-gray-800">Locale & Formats</h2>
            <p className="text-sm text-gray-500">Control how dates, times, and languages are displayed across the system.</p>
            
            <div className="space-y-4">
                <div>
                    <label className="text-sm font-medium">Language</label>
                    <select value={settings.locale.language} onChange={e => handleLocaleChange({ language: e.target.value as any })} className="w-full mt-1 rounded-md border-gray-300">
                        <option value="en-GB">English (United Kingdom)</option>
                        <option value="en-US">English (United States)</option>
                    </select>
                </div>
                <div>
                    <label className="text-sm font-medium">Timezone</label>
                    <select value={settings.locale.timezone} onChange={e => handleLocaleChange({ timezone: e.target.value })} className="w-full mt-1 rounded-md border-gray-300">
                        {timezones.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="text-sm font-medium">Date Format</label>
                    <select value={settings.locale.dateFormat} onChange={e => handleLocaleChange({ dateFormat: e.target.value as any })} className="w-full mt-1 rounded-md border-gray-300">
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    </select>
                </div>
                 <div>
                    <label className="text-sm font-medium">Time Format</label>
                    <select value={settings.locale.timeFormat} onChange={e => handleLocaleChange({ timeFormat: e.target.value as any })} className="w-full mt-1 rounded-md border-gray-300">
                        <option value="24h">24 Hour</option>
                        <option value="12h">12 Hour</option>
                    </select>
                </div>
            </div>

            <div className="pt-4 flex justify-end">
                <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-gray-400">
                    {isSaving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>
        </div>
    );
};

export default LocalePage;
