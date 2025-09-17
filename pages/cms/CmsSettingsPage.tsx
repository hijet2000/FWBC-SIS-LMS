
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getCmsSettings, saveCmsSettings } from '../../lib/cmsService';
import { CmsSettings } from '../../types';

const CmsSettingsPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [settings, setSettings] = useState<CmsSettings | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getCmsSettings().then(setSettings).finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        if (!user || !settings) return;
        await saveCmsSettings(settings, user);
        addToast('Settings saved!', 'success');
    };

    if (loading || !settings) return <p>Loading settings...</p>;

    return (
        <div className="space-y-6 max-w-2xl">
            <h1 className="text-3xl font-bold">CMS Settings</h1>
            <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
                <input value={settings.siteTitle} onChange={e => setSettings({...settings, siteTitle: e.target.value})} placeholder="Site Title" className="w-full rounded-md border-gray-300" />
                <input value={settings.tagline} onChange={e => setSettings({...settings, tagline: e.target.value})} placeholder="Tagline" className="w-full rounded-md border-gray-300" />
                 <div className="flex items-center gap-2">
                    <input type="checkbox" id="maintenance" checked={settings.maintenanceMode} onChange={e => setSettings({...settings, maintenanceMode: e.target.checked})} className="h-4 w-4 rounded border-gray-300"/>
                    <label htmlFor="maintenance">Enable Maintenance Mode</label>
                </div>
                <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-md">Save Settings</button>
            </div>
        </div>
    );
};

export default CmsSettingsPage;
