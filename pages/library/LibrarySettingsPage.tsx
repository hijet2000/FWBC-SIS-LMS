
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as libraryService from '../../lib/libraryService';
import type { LibrarySettings, MemberTypePolicy, LoanPolicy, MemberType } from '../../types';

const SettingsCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">{title}</h3>
        <div className="space-y-4">{children}</div>
    </div>
);

const LibrarySettingsPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [settings, setSettings] = useState<LibrarySettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [newTaxonomyItem, setNewTaxonomyItem] = useState({ type: 'rack' as 'rack' | 'shelf', value: '' });

    const fetchData = useCallback(() => {
        setLoading(true);
        libraryService.getLibrarySettings()
            .then(setSettings)
            .catch(() => addToast('Failed to load settings.', 'error'))
            .finally(() => setLoading(false));
    }, [addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleLoanPolicyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!settings) return;
        const { name, value } = e.target;
        setSettings({
            ...settings,
            loanPolicy: { ...settings.loanPolicy, [name]: Number(value) },
        });
    };
    
    const handleMemberPolicyChange = (type: MemberType, e: React.ChangeEvent<HTMLInputElement>) => {
        if (!settings) return;
        const { name, value } = e.target;
        setSettings({
            ...settings,
            memberTypePolicies: settings.memberTypePolicies.map(p =>
                p.type === type ? { ...p, [name]: Number(value) } : p
            ),
        });
    };
    
    const handleAddTaxonomy = () => {
        if (!settings || !newTaxonomyItem.value.trim()) return;
        const key = newTaxonomyItem.type === 'rack' ? 'racks' : 'shelves';
        setSettings({
            ...settings,
            taxonomy: {
                ...settings.taxonomy,
                [key]: [...settings.taxonomy[key], newTaxonomyItem.value.trim()],
            },
        });
        setNewTaxonomyItem({ type: 'rack', value: '' }); // Reset
    };

    const handleSave = async () => {
        if (!settings || !user) return;
        setIsSaving(true);
        try {
            await libraryService.updateLibrarySettings(settings, user);
            addToast('Settings saved successfully!', 'success');
            fetchData(); // Refetch to confirm
        } catch {
            addToast('Failed to save settings.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading || !settings) return <div className="p-8 text-center">Loading settings...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Library Policies & Settings</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 space-y-6">
                    <SettingsCard title="General Loan Policy">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div><label className="text-sm">Loan Days</label><input type="number" name="loanDays" value={settings.loanPolicy.loanDays} onChange={handleLoanPolicyChange} className="w-full mt-1 rounded-md" /></div>
                            <div><label className="text-sm">Max Renewals</label><input type="number" name="maxRenewals" value={settings.loanPolicy.maxRenewals} onChange={handleLoanPolicyChange} className="w-full mt-1 rounded-md" /></div>
                            <div><label className="text-sm">Grace Days</label><input type="number" name="graceDays" value={settings.loanPolicy.graceDays} onChange={handleLoanPolicyChange} className="w-full mt-1 rounded-md" /></div>
                            <div><label className="text-sm">Fine/Day (£)</label><input type="number" name="finePerDay" value={settings.loanPolicy.finePerDay} onChange={handleLoanPolicyChange} className="w-full mt-1 rounded-md" step="0.01" /></div>
                        </div>
                    </SettingsCard>

                    <SettingsCard title="Member Type Policies">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {settings.memberTypePolicies.map(policy => (
                                <div key={policy.type} className="p-3 bg-gray-50 rounded-md border">
                                    <h4 className="font-semibold">{policy.type}</h4>
                                    <div className="mt-2">
                                        <label className="text-sm">Max Concurrent Loans</label>
                                        <input type="number" name="maxConcurrentLoans" value={policy.maxConcurrentLoans} onChange={(e) => handleMemberPolicyChange(policy.type, e)} className="w-full mt-1 rounded-md" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </SettingsCard>
                     <div className="flex justify-end">
                        <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-gray-400">
                            {isSaving ? 'Saving...' : 'Save All Settings'}
                        </button>
                    </div>
                </div>

                 <div className="lg:col-span-1 space-y-6">
                    <SettingsCard title="Taxonomy (Mock)">
                         <div className="flex gap-2">
                            <select value={newTaxonomyItem.type} onChange={e => setNewTaxonomyItem({ ...newTaxonomyItem, type: e.target.value as any })} className="rounded-md text-sm">
                                <option value="rack">Rack</option>
                                <option value="shelf">Shelf</option>
                            </select>
                            <input value={newTaxonomyItem.value} onChange={e => setNewTaxonomyItem({ ...newTaxonomyItem, value: e.target.value })} placeholder="e.g., A3, History" className="flex-grow rounded-md text-sm" />
                            <button onClick={handleAddTaxonomy} className="px-3 py-1 bg-gray-200 rounded-md text-sm">Add</button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><h4 className="font-semibold">Racks</h4><ul className="text-sm list-disc list-inside">{settings.taxonomy.racks.map(r => <li key={r}>{r}</li>)}</ul></div>
                            <div><h4 className="font-semibold">Shelves</h4><ul className="text-sm list-disc list-inside">{settings.taxonomy.shelves.map(s => <li key={s}>{s}</li>)}</ul></div>
                        </div>
                    </SettingsCard>
                     <SettingsCard title="Formats & Fines (Mock)">
                         <p className="text-sm"><strong>Book Barcode:</strong> {settings.labelFormats.bookBarcode}</p>
                         <p className="text-sm"><strong>Member Barcode:</strong> {settings.labelFormats.memberBarcode}</p>
                         <p className="text-sm"><strong>Fine Rounding:</strong> {settings.fineRounding.replace('_', ' ')}</p>
                    </SettingsCard>
                </div>
            </div>
        </div>
    );
};

export default LibrarySettingsPage;
