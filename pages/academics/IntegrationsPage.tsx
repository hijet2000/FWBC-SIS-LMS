import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as liveClassService from '../../lib/liveClassService';
import type { LiveClassIntegrationSettings, IntegrationProvider } from '../../types';

const SettingsCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">{title}</h3>
        <div className="space-y-4">{children}</div>
    </div>
);

const IntegrationsPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [settings, setSettings] = useState<LiveClassIntegrationSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const fetchData = useCallback(() => {
        setLoading(true);
        liveClassService.getIntegrationSettings()
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
            await liveClassService.updateIntegrationSettings(settings, user);
            addToast('Settings saved successfully!', 'success');
        } catch {
            addToast('Failed to save settings.', 'error');
        } finally {
            setIsSaving(false);
        }
    };
    
    if (loading || !settings) return <div className="p-8 text-center">Loading settings...</div>;

    return (
        <div className="space-y-6 max-w-2xl">
            <h1 className="text-3xl font-bold text-gray-800">Live Class Integrations</h1>
            
            <SettingsCard title="Provider Settings">
                <div>
                    <label className="text-sm font-medium">Live Class Provider</label>
                    <select 
                        value={settings.provider} 
                        onChange={e => setSettings({ ...settings, provider: e.target.value as IntegrationProvider })} 
                        className="w-full mt-1 rounded-md"
                    >
                        <option value="SelfHosted">Self-Hosted / Manual</option>
                        <option value="Zoom" disabled>Zoom (Coming Soon)</option>
                        <option value="Google Meet" disabled>Google Meet (Coming Soon)</option>
                    </select>
                </div>

                {settings.provider !== 'SelfHosted' && (
                    <>
                        <div>
                            <label className="text-sm font-medium">API Key</label>
                            <input 
                                type="password" 
                                value={settings.apiKey || ''} 
                                onChange={e => setSettings({ ...settings, apiKey: e.target.value })} 
                                className="w-full mt-1 rounded-md" 
                                placeholder="******************"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">API Secret</label>
                            <input 
                                type="password" 
                                value={settings.apiSecret || ''} 
                                onChange={e => setSettings({ ...settings, apiSecret: e.target.value })} 
                                className="w-full mt-1 rounded-md" 
                                placeholder="******************"
                            />
                        </div>
                    </>
                )}
                 <div className="pt-4 flex justify-end">
                    <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-gray-400">
                        {isSaving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </SettingsCard>
        </div>
    );
};

export default IntegrationsPage;
