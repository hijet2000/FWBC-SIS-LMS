import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getPolicies, updatePolicy } from '../../lib/libraryService';
import type { LibraryPolicy, MemberType } from '../../types';

const SettingsPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [policies, setPolicies] = useState<LibraryPolicy[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getPolicies().then(setPolicies).finally(() => setLoading(false));
    }, []);

    const handlePolicyChange = (memberType: MemberType, field: keyof LibraryPolicy, value: any) => {
        setPolicies(prev => prev.map(p => 
            p.memberType === memberType ? { ...p, [field]: Number(value) } : p
        ));
    };

    const handleSave = async () => {
        if (!user) return;
        try {
            await Promise.all(policies.map(p => updatePolicy(p, user)));
            addToast('Policies saved successfully!', 'success');
        } catch {
            addToast('Failed to save policies.', 'error');
        }
    };
    
    if (loading) return <p>Loading settings...</p>;

    return (
        <div className="space-y-6 max-w-4xl">
            <h1 className="text-3xl font-bold text-gray-800">Library Settings</h1>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-xl font-semibold mb-4">Borrowing Policies</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {policies.map(policy => (
                        <div key={policy.memberType} className="space-y-4">
                            <h3 className="font-bold text-lg text-indigo-700">{policy.memberType}s</h3>
                            <div>
                                <label className="text-sm">Loan Duration (days)</label>
                                <input type="number" value={policy.loanDays} onChange={e => handlePolicyChange(policy.memberType, 'loanDays', e.target.value)} className="w-full rounded-md mt-1"/>
                            </div>
                            <div>
                                <label className="text-sm">Max Concurrent Loans</label>
                                <input type="number" value={policy.maxConcurrentLoans} onChange={e => handlePolicyChange(policy.memberType, 'maxConcurrentLoans', e.target.value)} className="w-full rounded-md mt-1"/>
                            </div>
                            <div>
                                <label className="text-sm">Max Renewals</label>
                                <input type="number" value={policy.maxRenewals} onChange={e => handlePolicyChange(policy.memberType, 'maxRenewals', e.target.value)} className="w-full rounded-md mt-1"/>
                            </div>
                             <div>
                                <label className="text-sm">Fine Per Day (£)</label>
                                <input type="number" step="0.01" value={policy.finePerDay} onChange={e => handlePolicyChange(policy.memberType, 'finePerDay', e.target.value)} className="w-full rounded-md mt-1"/>
                            </div>
                             <div>
                                <label className="text-sm">Grace Period (days)</label>
                                <input type="number" value={policy.graceDays} onChange={e => handlePolicyChange(policy.memberType, 'graceDays', e.target.value)} className="w-full rounded-md mt-1"/>
                            </div>
                            <div>
                                <label className="text-sm">Lost Item Replacement Fee (£)</label>
                                <input type="number" step="0.01" value={policy.lostReplacementFee || ''} onChange={e => handlePolicyChange(policy.memberType, 'lostReplacementFee', e.target.value)} className="w-full rounded-md mt-1"/>
                            </div>
                        </div>
                    ))}
                </div>
                 <div className="mt-6 pt-4 border-t flex justify-end">
                    <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 text-white rounded-md shadow-sm">Save Policies</button>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;