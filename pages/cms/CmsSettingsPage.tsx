
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as cmsService from '../../lib/cmsService';
import type { WebsiteSettings } from '../../types';

const CmsSettingsPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [settings, setSettings] = useState<WebsiteSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const fetchData = useCallback(() => {
        setLoading(true);
        cmsService.getSettings()
            .then(setSettings)
            .catch(() => addToast('Failed to load settings.', 'error'))
            .finally(() => setLoading(false));
    }, [addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSave = async () => {
        if (!settings || !user) return;
        setIsSaving(true);
        try {
            await cmsService.updateSettings(settings, user);
            addToast('Settings saved successfully!', 'success');
        } catch {
            addToast('Failed to save settings.', 'error');
        } finally {
            setIsSaving(false);
        }
    };
    
    if (loading || !settings) return <div>Loading settings...</div>;

    return (
        <div className="space-y-6 max-w-lg">
            <h1 className="text-3xl font-bold text-gray-800">Website Settings</h1>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
                <div>
                    <label className="text-sm font-medium">Site Title</label>
                    <input value={settings.siteTitle} onChange={e => setSettings({ ...settings, siteTitle: e.target.value })} className="w-full p-2 border rounded-md mt-1" />
                </div>
                <div>
                    <label className="text-sm font-medium">Primary Color</label>
                    <div className="flex items-center gap-2 mt-1">
                        <input type="color" value={settings.primaryColor} onChange={e => setSettings({ ...settings, primaryColor: e.target.value })} />
                        <input value={settings.primaryColor} onChange={e => setSettings({ ...settings, primaryColor: e.target.value })} className="p-2 border rounded-md" />
                    </div>
                </div>
                <div>
                    <label className="text-sm font-medium">Logo URL</label>
                    <input value={settings.logoUrl || ''} onChange={e => setSettings({ ...settings, logoUrl: e.target.value })} className="w-full p-2 border rounded-md mt-1" />
                </div>
                 <div className="pt-4 flex justify-end">
                    <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-gray-400">
                        {isSaving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CmsSettingsPage;
