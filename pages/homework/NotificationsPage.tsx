import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as homeworkService from '../../lib/homeworkService';
import type { HomeworkNotificationSettings } from '../../types';

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


const NotificationsPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [settings, setSettings] = useState<HomeworkNotificationSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const [isSimulating, setIsSimulating] = useState(false);
    const [simLogs, setSimLogs] = useState<string[]>([]);

    const fetchData = useCallback(() => {
        setLoading(true);
        homeworkService.getNotificationSettings()
            .then(setSettings)
            .catch(() => addToast('Failed to load settings.', 'error'))
            .finally(() => setLoading(false));
    }, [addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSettingsChange = (update: Partial<HomeworkNotificationSettings>) => {
        if (!settings) return;
        setSettings({ ...settings, ...update });
    };
    
    const handleTriggerChange = (key: keyof HomeworkNotificationSettings['triggers'], value: boolean) => {
        if (!settings) return;
        setSettings({
            ...settings,
            triggers: {
                ...settings.triggers,
                [key]: value
            }
        });
    };
    
    const handleSave = async () => {
        if (!settings || !user) return;
        setIsSaving(true);
        try {
            await homeworkService.updateNotificationSettings(settings, user);
            addToast('Settings saved successfully!', 'success');
        } catch {
            addToast('Failed to save settings.', 'error');
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleSimulateCron = async () => {
        setIsSimulating(true);
        setSimLogs([]);
        try {
            const logs = await homeworkService.simulateCronJob();
            setSimLogs(logs);
            addToast('Cron simulation complete.', 'info');
        } catch {
            addToast('Cron simulation failed.', 'error');
        } finally {
            setIsSimulating(false);
        }
    };


    if (loading || !settings) return <div className="text-center p-8">Loading settings...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Homework Notifications</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <SettingsCard title="General">
                        <Toggle label="Enable Smart Notifications" enabled={settings.enabled} onChange={val => handleSettingsChange({enabled: val})} />
                    </SettingsCard>

                    <SettingsCard title="Notification Triggers">
                        <Toggle label="On Assignment Publish" enabled={settings.triggers.onPublish} onChange={val => handleTriggerChange('onPublish', val)} disabled={!settings.enabled} />
                        <Toggle label="Pre-due Reminder" enabled={settings.triggers.preDueReminder} onChange={val => handleTriggerChange('preDueReminder', val)} disabled={!settings.enabled} />
                        <Toggle label="On Overdue" enabled={settings.triggers.onOverdue} onChange={val => handleTriggerChange('onOverdue', val)} disabled={!settings.enabled} />
                        <Toggle label="On Feedback Returned" enabled={settings.triggers.onFeedback} onChange={val => handleTriggerChange('onFeedback', val)} disabled={!settings.enabled} />
                    </SettingsCard>
                     <SettingsCard title="Scheduling">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Reminder Lead Time (days before due)</label>
                            <input type="number" value={settings.reminderDaysBefore} onChange={e => handleSettingsChange({ reminderDaysBefore: Number(e.target.value)})} className="mt-1 block w-full rounded-md border-gray-300" min="1" max="14" disabled={!settings.enabled || !settings.triggers.preDueReminder} />
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Quiet Hours Start (UTC)</label>
                                <input type="number" value={settings.quietHours.start} onChange={e => handleSettingsChange({ quietHours: {...settings.quietHours, start: Number(e.target.value)} })} className="mt-1 block w-full rounded-md border-gray-300" min="0" max="23" disabled={!settings.enabled} />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Quiet Hours End (UTC)</label>
                                <input type="number" value={settings.quietHours.end} onChange={e => handleSettingsChange({ quietHours: {...settings.quietHours, end: Number(e.target.value)} })} className="mt-1 block w-full rounded-md border-gray-300" min="0" max="23" disabled={!settings.enabled} />
                            </div>
                        </div>
                    </SettingsCard>
                     <div className="flex justify-end">
                        <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-gray-400">
                            {isSaving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </div>

                 <div className="lg:col-span-1">
                    <SettingsCard title="Time-based Simulation">
                        <p className="text-sm text-gray-500">
                            Since this is a demo, there is no real background scheduler. Click this button to simulate the daily job that sends pre-due and overdue reminders.
                        </p>
                        <button onClick={handleSimulateCron} disabled={isSimulating} className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400">
                            {isSimulating ? 'Simulating...' : 'Simulate Daily Cron Job'}
                        </button>
                        {simLogs.length > 0 && (
                            <div className="mt-4">
                                <h4 className="font-semibold text-sm">Simulation Log:</h4>
                                <pre className="mt-2 p-2 bg-gray-900 text-white text-xs rounded-md h-64 overflow-y-auto">
                                    {simLogs.join('\n')}
                                </pre>
                            </div>
                        )}
                    </SettingsCard>
                </div>
            </div>
        </div>
    );
};

export default NotificationsPage;