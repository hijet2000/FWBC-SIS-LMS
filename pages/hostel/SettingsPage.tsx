import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as hostelService from '../../lib/hostelService';
import type { HostelSettings } from '../../types';

const SettingsCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">{title}</h3>
        <div className="space-y-4">{children}</div>
    </div>
);

const SettingsPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [settings, setSettings] = useState<HostelSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const fetchData = useCallback(() => {
        setLoading(true);
        hostelService.getHostelSettings()
            .then(setSettings)
            .catch(() => addToast('Failed to load settings.', 'error'))
            .finally(() => setLoading(false));
    }, [addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        if (!settings) return;
        const { name, value, type, checked } = e.target as HTMLInputElement;
        setSettings({
            ...settings,
            [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
        });
    };

    const handleSave = async () => {
        if (!settings || !user) return;
        setIsSaving(true);
        try {
            await hostelService.updateHostelSettings(settings, user);
            addToast('Hostel settings saved successfully!', 'success');
        } catch {
            addToast('Failed to save settings.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading || !settings) return <div className="p-8 text-center">Loading settings...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Hostel Policies & Settings</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <SettingsCard title="Curfew Policy">
                    <div>
                        <label className="text-sm font-medium">Default Curfew Time</label>
                        <input type="time" name="curfewTime" value={settings.curfewTime} onChange={handleChange} className="w-full mt-1 rounded-md" />
                    </div>
                     <div>
                        <label className="text-sm font-medium">Late Threshold (Minutes)</label>
                        <input type="number" name="lateThresholdMin" value={settings.lateThresholdMin} onChange={handleChange} className="w-full mt-1 rounded-md" />
                    </div>
                </SettingsCard>

                <SettingsCard title="Visitor Policy">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">ID Required for Visitors</label>
                        <input type="checkbox" name="idRequiredForVisitors" checked={settings.idRequiredForVisitors} onChange={handleChange} />
                    </div>
                     <div>
                        <label className="text-sm font-medium">Max Visitors per Student per Day</label>
                        <input type="number" name="maxVisitorsPerDay" value={settings.maxVisitorsPerDay} onChange={handleChange} className="w-full mt-1 rounded-md" />
                    </div>
                </SettingsCard>

                <SettingsCard title="Allocation Policy">
                     <div>
                        <label className="text-sm font-medium">Gender Rule</label>
                        <select name="genderRule" value={settings.genderRule} onChange={handleChange} className="w-full mt-1 rounded-md">
                            <option value="Enforce">Enforce (Block mismatch)</option>
                            <option value="Warn">Warn (Allow with warning)</option>
                        </select>
                    </div>
                </SettingsCard>
            </div>

            <div className="flex justify-end">
                <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-gray-400">
                    {isSaving ? 'Saving...' : 'Save All Settings'}
                </button>
            </div>
        </div>
    );
};

export default SettingsPage;