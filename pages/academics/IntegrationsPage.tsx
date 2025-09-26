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

const Toggle: React.FC<{ label: string; enabled: boolean; onChange: (enabled: boolean) => void; disabled?: boolean }> = ({ label, enabled, onChange, disabled }) => (
    <div className="flex items-center justify-between">
        <label className={`text-sm font-medium ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>{label}</label>
        <button
            type="button"
            onClick={() => onChange(!enabled)}
            disabled={disabled}
            className={`${enabled ? 'bg-indigo-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed`}
            role="switch"
            aria-checked={enabled}
        >
            <span className={`${enabled ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`} />
        </button>
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

                <div className="pt-4 border-t">
                    <h4 className="font-semibold text-gray-700">Recording Policy</h4>
                    <p className="text-xs text-gray-500 mb-2">Configure automatic recording and publishing for finished classes.</p>
                    <div className="space-y-3">
                        <Toggle label="Auto-record all sessions" enabled={settings.autoRecord ?? false} onChange={val => setSettings({...settings, autoRecord: val})} disabled={!settings.enabled} />
                        <Toggle label="Auto-publish to Catch-up" enabled={settings.autoPublishRecording ?? false} onChange={val => setSettings({...settings, autoPublishRecording: val})} disabled={!settings.enabled || !settings.autoRecord} />
                    </div>
                </div>

                 <div className="pt-4 border-t flex justify-between items-center">
                    <button onClick={() => addToast('Connection successful! (Mock)', 'success')} className="px-4 py-2 text-sm bg-white border rounded-md">
                        Test Connection
                    </button>
                    <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-gray-400">
                        {isSaving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </SettingsCard>
        </div>
    );
};

export default IntegrationsPage;
