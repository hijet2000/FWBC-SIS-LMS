import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as financeService from '../../lib/financeService';
import type { LedgerEntry, FinanceCategory, Payee } from '../../types';
import Modal from '../../components/ui/Modal';

const LedgerPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    
    const [entries, setEntries] = useState<LedgerEntry[]>([]);
    const [meta, setMeta] = useState<{ categories: FinanceCategory[], payees: Payee[] }>({ categories: [], payees: [] });
    const [loading, setLoading] = useState(true);
    const [reversingEntry, setReversingEntry] = useState<LedgerEntry | null>(null);

    const fetchData = useCallback(() => {
        setLoading(true);
        Promise.all([
            financeService.listLedgerEntries({}),
            financeService.listCategories(),
            financeService.listPayees()
        ]).then(([entryData, catData, payeeData]) => {
            setEntries(entryData);
            setMeta({ categories: catData, payees: payeeData });
        }).catch(() => addToast('Failed to load ledger data.', 'error'))
          .finally(() => setLoading(false));
    }, [addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const handleConfirmReverse = async () => {
        if (!reversingEntry || !user) return;
        try {
            await financeService.reverseLedgerEntry(reversingEntry.id, user);
            addToast('Transaction reversed successfully.', 'success');
            fetchData();
        } catch (err: any) {
            addToast(err.message || 'Failed to reverse transaction.', 'error');
        } finally {
            setReversingEntry(null);
        }
    };

    const categoryMap = useMemo(() => new Map(meta.categories.map(c => [c.id, c.name])), [meta.categories]);
    const payeeMap = useMemo(() => new Map(meta.payees.map(p => [p.id, p.name])), [meta.payees]);

    const entriesWithBalance = useMemo(() => {
        let balance = 0;
        // Entries are sorted descending by date, so we reverse to calculate running balance correctly
        return entries.slice().reverse().map(e => {
            const amount = e.type === 'INCOME' ? e.amount : -e.amount;
            balance += amount;
            return { ...e, balance };
        }).reverse();
    }, [entries]);

    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">General Ledger</h1>
                {/* Add Entry Modal would be triggered here */}
                <button className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md">Add Entry</button>
            </div>
            
            {reversingEntry && (
                <Modal isOpen={!!reversingEntry} onClose={() => setReversingEntry(null)} title="Confirm Reversal">
                    <div className="p-4">
                        <p>Are you sure you want to reverse the transaction: "{reversingEntry.description}" for {formatCurrency(reversingEntry.amount)}?</p>
                        <p className="text-sm text-gray-500 mt-2">This will create a new, opposing entry in the ledger.</p>
                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={() => setReversingEntry(null)} className="px-4 py-2 border rounded-md">Cancel</button>
                            <button onClick={handleConfirmReverse} className="px-4 py-2 text-white bg-red-600 rounded-md">Confirm Reverse</button>
                        </div>
                    </div>
                </Modal>
            )}

            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50"><tr>
                        <th className="p-3 text-left text-xs uppercase">Date</th>
                        <th className="p-3 text-left text-xs uppercase">Description</th>
                        <th className="p-3 text-left text-xs uppercase">Category</th>
                        <th className="p-3 text-right text-xs uppercase">Income</th>
                        <th className="p-3 text-right text-xs uppercase">Expense</th>
                        <th className="p-3 text-right text-xs uppercase">Balance</th>
                        <th className="p-3 text-right text-xs uppercase">Actions</th>
                    </tr></thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? <tr><td colSpan={7} className="p-4 text-center">Loading...</td></tr> :
                        entriesWithBalance.map(entry => (
                            <tr key={entry.id} className={`${entry.isReversal ? 'bg-gray-100 text-gray-500' : ''}`}>
                                <td className="p-3 text-sm">{entry.date}</td>
                                <td className="p-3 text-sm">
                                    <div className={entry.isReversal ? 'line-through' : ''}>{entry.description}</div>
                                    {entry.payeeId && <div className="text-xs text-gray-400">Payee: {payeeMap.get(entry.payeeId)}</div>}
                                </td>
                                <td className="p-3 text-sm">{categoryMap.get(entry.categoryId)}</td>
                                <td className="p-3 text-sm text-right text-green-600">{entry.type === 'INCOME' ? formatCurrency(entry.amount) : ''}</td>
                                <td className="p-3 text-sm text-right text-red-600">{entry.type === 'EXPENSE' ? formatCurrency(entry.amount) : ''}</td>
                                <td className="p-3 text-sm text-right font-semibold">{formatCurrency(entry.balance)}</td>
                                <td className="p-3 text-right text-sm">
                                    {!entry.isReversal && !entries.some(e => e.reversalOf === entry.id) && (
                                        <button onClick={() => setReversingEntry(entry)} className="text-red-600 font-medium">Reverse</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LedgerPage;