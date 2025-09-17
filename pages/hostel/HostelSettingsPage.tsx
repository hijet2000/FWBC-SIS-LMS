import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as hostelService from '../../lib/hostelService';
// FIX: Import the newly created HostelPolicy type.
import type { HostelPolicy } from '../../types';

const HostelSettingsPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [policy, setPolicy] = useState<HostelPolicy | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setLoading(true);
        // FIX: Call the correct service function `getPolicies`.
        hostelService.getPolicies()
            .then(setPolicy)
            .catch(() => addToast('Failed to load hostel policies.', 'error'))
            .finally(() => setLoading(false));
    }, [addToast]);
    
    const handleSave = async () => {
        if (!policy || !user) return;
        setIsSaving(true);
        try {
            // FIX: Call the correct service function `updatePolicies`.
            await hostelService.updatePolicies(policy, user);
            addToast('Hostel policies saved successfully!', 'success');
        } catch {
            addToast('Failed to save policies.', 'error');
        } finally {
            setIsSaving(false);
        }
    };
    
    if (loading || !policy) return <p>Loading settings...</p>;

    const handlePolicyChange = (field: keyof HostelPolicy, value: any) => {
        setPolicy(prev => prev ? { ...prev, [field]: value } : null);
    };

    return (
        <div className="space-y-6 max-w-2xl">
            <h1 className="text-3xl font-bold text-gray-800">Hostel Settings</h1>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="space-y-6">
                    <div>
                        <h3 className="font-semibold text-lg">Curfew</h3>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                            <div>
                                <label className="text-sm">Curfew Time (HH:mm)</label>
                                <input type="time" value={policy.curfewTime} onChange={e => handlePolicyChange('curfewTime', e.target.value)} className="w-full rounded-md mt-1"/>
                            </div>
                             <div>
                                <label className="text-sm">Late Threshold (Minutes)</label>
                                <input type="number" value={policy.lateThresholdMin} onChange={e => handlePolicyChange('lateThresholdMin', Number(e.target.value))} className="w-full rounded-md mt-1"/>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <h3 className="font-semibold text-lg">Allocations</h3>
                        <div className="mt-2">
                             <label className="text-sm">Gender Rule</label>
                             <select value={policy.genderRule} onChange={e => handlePolicyChange('genderRule', e.target.value as HostelPolicy['genderRule'])} className="w-full rounded-md mt-1">
                                <option value="Enforce">Enforce (Strictly prevent mismatches)</option>
                                <option value="Warn">Warn (Show warning but allow)</option>
                                <option value="Ignore">Ignore (No checks)</option>
                            </select>
                        </div>
                    </div>

                     <div>
                        <h3 className="font-semibold text-lg">Visitors</h3>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                             <div>
                                <label className="text-sm">Max Overstay (Minutes)</label>
                                <input type="number" value={policy.maxOverstayMinutes} onChange={e => handlePolicyChange('maxOverstayMinutes', Number(e.target.value))} className="w-full rounded-md mt-1"/>
                            </div>
                        </div>
                    </div>

                </div>
                 <div className="mt-6 pt-4 border-t flex justify-end">
                    <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-indigo-600 text-white rounded-md shadow-sm disabled:bg-gray-400">
                        {isSaving ? 'Saving...' : 'Save Policies'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HostelSettingsPage;