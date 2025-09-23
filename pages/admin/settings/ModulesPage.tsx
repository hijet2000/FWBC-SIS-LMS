import React from 'react';
import { useSettings } from '../../../contexts/SettingsContext';
import { useToast } from '../../../contexts/ToastContext';
import type { ModuleSettings, ModuleConfig } from '../../../types';

const Toggle: React.FC<{ label: string; enabled: boolean; onChange: (enabled: boolean) => void; }> = ({ label, enabled, onChange }) => (
    <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={`${enabled ? 'bg-indigo-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
        role="switch"
        aria-checked={enabled}
        aria-label={label}
    >
        <span className={`${enabled ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`} />
    </button>
);

const ModulesPage: React.FC = () => {
    const { settings, updateSettings, loading } = useSettings();
    const { addToast } = useToast();
    const [isSaving, setIsSaving] = React.useState(false);

    const handleToggle = (moduleKey: keyof ModuleSettings, config: ModuleConfig) => {
        if (!settings) return;
        const newSettings = {
            ...settings,
            modules: {
                ...settings.modules,
                [moduleKey]: { ...config, enabled: !config.enabled }
            }
        };
        // Settings context uses optimistic updates, so we don't need to set local state here
        updateSettings(newSettings).catch(() => addToast('Failed to update. State reverted.', 'error'));
    };

    const handleSave = async () => {
        if (!settings) return;
        setIsSaving(true);
        try {
            await updateSettings(settings); // The context already holds the latest state
            addToast('Module settings saved successfully! The sidebar will now update.', 'success');
        } catch {
             addToast('Failed to save settings.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading || !settings) {
        return <div>Loading module settings...</div>;
    }

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800">Modules & Navigation</h2>
            <p className="text-sm text-gray-500">Enable or disable major features of the system. Changes will be reflected in the main sidebar navigation.</p>
            <div className="space-y-4 divide-y divide-gray-200">
                {Object.entries(settings.modules).map(([key, config]) => (
                    <div key={key} className="flex items-center justify-between pt-4 first:pt-0">
                        <div>
                            <h4 className="font-semibold">{config.name}</h4>
                            <p className="text-sm text-gray-500">{config.description}</p>
                        </div>
                        <Toggle 
                            label={`Enable ${config.name}`}
                            enabled={config.enabled} 
                            onChange={() => handleToggle(key as keyof ModuleSettings, config)} 
                        />
                    </div>
                ))}
            </div>
             <div className="pt-4 flex justify-end">
                <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-gray-400">
                    {isSaving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>
        </div>
    );
};

export default ModulesPage;
