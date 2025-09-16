import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getOnlineAdmissionsSettings, updateOnlineAdmissionsSettings } from '../../lib/admissionsService';
import type { OnlineAdmissionsSettings } from '../../types';

const OnlineAdmissionsPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [settings, setSettings] = useState<OnlineAdmissionsSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setLoading(true);
        getOnlineAdmissionsSettings()
            .then(setSettings)
            .catch(() => addToast('Failed to load settings.', 'error'))
            .finally(() => setLoading(false));
    }, [addToast]);

    const handleSave = async () => {
        if (!settings || !user) return;
        setIsSaving(true);
        try {
            await updateOnlineAdmissionsSettings(settings, user);
            addToast('Settings saved successfully.', 'success');
        } catch {
            addToast('Failed to save settings.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <div>Loading settings...</div>;
    if (!settings) return <div>Could not load settings.</div>;

    return (
        <div className="space-y-6 max-w-2xl">
            <h1 className="text-3xl font-bold text-gray-800">Online Admissions Management</h1>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
                <div>
                    <h2 className="text-lg font-semibold">Application Status</h2>
                    <div className="flex items-center justify-between mt-2">
                        <label htmlFor="accepting-apps" className="text-sm font-medium text-gray-700">Accepting new applications</label>
                        <button
                            type="button"
                            id="accepting-apps"
                            onClick={() => setSettings({ ...settings, acceptingNewApplications: !settings.acceptingNewApplications })}
                            className={`${settings.acceptingNewApplications ? 'bg-indigo-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out`}
                            role="switch"
                            aria-checked={settings.acceptingNewApplications}
                        >
                            <span className={`${settings.acceptingNewApplications ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`} />
                        </button>
                    </div>
                </div>
                <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700">Public Message</label>
                    <p className="text-xs text-gray-500 mb-1">This message will be displayed at the top of the public application form.</p>
                    <textarea
                        id="message"
                        rows={3}
                        value={settings.message}
                        onChange={e => setSettings({ ...settings, message: e.target.value })}
                        className="w-full rounded-md border-gray-300"
                    />
                </div>
                <div className="flex justify-end">
                    <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:bg-gray-400">
                        {isSaving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OnlineAdmissionsPage;