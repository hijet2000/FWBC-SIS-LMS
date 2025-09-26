import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as attendanceService from '../../lib/attendanceService';
import type { WeeklyEmailSettings } from '../../types';

const SettingsCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">{title}</h3>
        <div className="space-y-4">{children}</div>
    </div>
);

const AttendanceSettingsPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [settings, setSettings] = useState<WeeklyEmailSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const fetchData = useCallback(() => {
        setLoading(true);
        attendanceService.getWeeklyEmailSettings()
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
            await attendanceService.updateWeeklyEmailSettings(settings);
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
            <h1 className="text-3xl font-bold text-gray-800">Attendance Settings</h1>
            
            <SettingsCard title="Weekly Summary Email">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Send weekly summary email to parents</label>
                    <button
                        type="button"
                        onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
                        className={`${settings.enabled ? 'bg-indigo-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
                        role="switch"
                        aria-checked={settings.enabled}
                    >
                        <span className={`${settings.enabled ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`} />
                    </button>
                </div>
                <div>
                    <label htmlFor="send-hour" className="block text-sm font-medium text-gray-700">Send Hour (UTC)</label>
                    <select id="send-hour" value={settings.sendHour} onChange={e => setSettings({ ...settings, sendHour: Number(e.target.value) })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" disabled={!settings.enabled}>
                        {[...Array(24).keys()].map(hour => <option key={hour} value={hour}>{hour.toString().padStart(2, '0')}:00</option>)}
                    </select>
                </div>
                <div className="pt-4 flex justify-end">
                    <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-gray-400">
                        {isSaving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </SettingsCard>
        </div>
    );
};

export default AttendanceSettingsPage;