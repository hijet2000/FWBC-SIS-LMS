import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as transportService from '../../lib/transportService';
import type { AlertSettings } from '../../types';

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

const TransportSettingsPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [settings, setSettings] = useState<AlertSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const fetchData = useCallback(() => {
        setLoading(true);
        transportService.getAlertSettings('site_123') // siteId is hardcoded in service, ok for now
            .then(setSettings)
            .catch(() => addToast('Failed to load settings.', 'error'))
            .finally(() => setLoading(false));
    }, [addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const handleSettingsChange = (update: Partial<AlertSettings>) => {
        if (!settings) return;
        setSettings({ ...settings, ...update });
    };

    const handleSave = async () => {
        if (!settings || !user) return;
        setIsSaving(true);
        try {
            await transportService.updateAlertSettings('site_123', settings);
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
            <h1 className="text-3xl font-bold text-gray-800">Transport Settings</h1>
            
            <SettingsCard title="Parent SMS Alerts">
                <Toggle label="Enable Boarding Alerts" enabled={settings.enabled} onChange={val => handleSettingsChange({ enabled: val })} />
                <Toggle label="Send Alert on Pickup" enabled={settings.onPickup} onChange={val => handleSettingsChange({ onPickup: val })} disabled={!settings.enabled} />
                <Toggle label="Send Alert on Dropoff" enabled={settings.onDropoff} onChange={val => handleSettingsChange({ onDropoff: val })} disabled={!settings.enabled} />
                
                <div className="pt-4 flex justify-end">
                    <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-gray-400">
                        {isSaving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </SettingsCard>
        </div>
    );
};

export default TransportSettingsPage;
