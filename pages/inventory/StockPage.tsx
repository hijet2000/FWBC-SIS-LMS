import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as inventoryService from '../../lib/inventoryService';
import * as schoolService from '../../lib/schoolService';
import * as academicsService from '../../lib/academicsService';
import type { InventoryItem, StockTransaction, StockTransactionType, SchoolClass, Teacher, StockEntity, User, Supplier } from '../../types';

// A simple debounce hook
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
    return () => { clearTimeout(handler); };
  }, [value, delay]);
  return debouncedValue;
};

const StockPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [skuInput, setSkuInput] = useState('');
    const debouncedSku = useDebounce(skuInput, 300);

    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [currentStock, setCurrentStock] = useState<number | null>(null);
    const [transactions, setTransactions] = useState<StockTransaction[]>([]);
    const [loading, setLoading] = useState(false);

    const [activeTab, setActiveTab] = useState<StockTransactionType>('IN');
    const [transactionData, setTransactionData] = useState<any>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [metaData, setMetaData] = useState<{ classes: SchoolClass[], teachers: Teacher[], suppliers: Supplier[] }>({ classes: [], teachers: [], suppliers: [] });

    // Fetch meta data for forms
    useEffect(() => {
        Promise.all([
            schoolService.getClasses(), 
            academicsService.listTeachers(),
            inventoryService.listSuppliers()
        ]).then(([classes, teachers, suppliers]) => {
            setMetaData({ classes, teachers, suppliers });
        });
    }, []);

    const resetState = useCallback(() => {
        setSelectedItem(null);
        setCurrentStock(null);
        setTransactions([]);
        setTransactionData({});
    }, []);

    // Fetch item data when SKU changes
    useEffect(() => {
        if (!debouncedSku) {
            resetState();
            return;
        }
        setLoading(true);
        const fetchData = async () => {
            try {
                const item = await inventoryService.getItemBySkuOrId(debouncedSku);
                setSelectedItem(item);
                if (item) {
                    const [stock, txns] = await Promise.all([
                        inventoryService.getCurrentStock(item.id),
                        inventoryService.listTransactionsForItem(item.id),
                    ]);
                    setCurrentStock(stock);
                    setTransactions(txns);
                } else {
                    setCurrentStock(null);
                    setTransactions([]);
                }
            } catch {
                addToast('Failed to fetch item data.', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [debouncedSku, addToast, resetState]);

    const handleTransactionSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItem || !user) return;

        const quantity = Number(transactionData.quantity);
        let finalQuantity = quantity;

        if (activeTab === 'OUT' || activeTab === 'ADJUST') {
            finalQuantity = -Math.abs(quantity);
        } else {
            finalQuantity = Math.abs(quantity);
        }

        const payload: Omit<StockTransaction, 'id' | 'createdAt' | 'actorId'> = {
            itemId: selectedItem.id,
            type: activeTab,
            quantity: finalQuantity,
            unitCost: activeTab === 'IN' ? Number(transactionData.unitCost) : undefined,
            supplierId: activeTab === 'IN' ? transactionData.supplierId : undefined,
            toEntityType: (activeTab === 'OUT' || activeTab === 'RETURN') ? transactionData.toEntityType : undefined,
            toEntityId: (activeTab === 'OUT' || activeTab === 'RETURN') ? transactionData.toEntityId : undefined,
            reason: activeTab === 'ADJUST' ? transactionData.reason : undefined,
            ref: transactionData.ref,
        };

        setIsSubmitting(true);
        try {
            await inventoryService.recordStockTransaction(payload, user);
            addToast(`Transaction recorded for ${selectedItem.name}.`, 'success');
            setSkuInput(selectedItem.sku); // Trigger refetch
            setTransactionData({});
        } catch (err: any) {
            addToast(err.message || 'Transaction failed.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const getEntityName = (type?: StockEntity, id?: string) => {
        if (!type || !id) return 'N/A';
        const map = type === 'Class' ? new Map(metaData.classes.map(c => [c.id, c.name])) : new Map(metaData.teachers.map(t => [t.id, t.name]));
        return map.get(id) || id;
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Stock Management</h1>
            <input
                type="text"
                value={skuInput}
                onChange={e => setSkuInput(e.target.value)}
                placeholder="Scan or Enter SKU/Barcode..."
                className="w-full p-3 text-lg border-2 border-gray-300 rounded-md focus:border-indigo-500 focus:ring-indigo-500"
                autoFocus
            />

            {loading && <p>Searching...</p>}
            {!loading && debouncedSku && !selectedItem && <p className="text-red-500">Item not found.</p>}

            {selectedItem && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 space-y-4">
                        <div className="bg-white p-4 rounded-lg shadow-sm border">
                            <h2 className="text-xl font-bold">{selectedItem.name}</h2>
                            <p className="text-sm text-gray-500 font-mono">{selectedItem.sku}</p>
                            <p className="mt-4 text-4xl font-bold text-indigo-600">{currentStock ?? '...'} <span className="text-lg font-medium text-gray-500">{selectedItem.unit}</span></p>
                            <p className="text-sm text-gray-600">in stock</p>
                        </div>
                        
                        <div className="bg-white p-4 rounded-lg shadow-sm border">
                             <div className="flex border-b">
                                {(['IN', 'OUT', 'ADJUST', 'RETURN'] as StockTransactionType[]).map(tab => (
                                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium ${activeTab === tab ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500'}`}>{tab}</button>
                                ))}
                            </div>
                            <form onSubmit={handleTransactionSubmit} className="pt-4 space-y-3">
                                <input type="number" value={transactionData.quantity || ''} onChange={e => setTransactionData({...transactionData, quantity: e.target.value})} placeholder="Quantity" className="w-full rounded-md" required />
                                {activeTab === 'IN' && <>
                                    <input type="number" value={transactionData.unitCost || ''} onChange={e => setTransactionData({...transactionData, unitCost: e.target.value})} placeholder="Unit Cost (Optional)" step="0.01" className="w-full rounded-md" />
                                    <select value={transactionData.supplierId || ''} onChange={e => setTransactionData({...transactionData, supplierId: e.target.value})} className="w-full rounded-md">
                                        <option value="">Select Supplier (Optional)</option>
                                        {metaData.suppliers.filter(s => s.active).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </>}
                                {(activeTab === 'OUT' || activeTab === 'RETURN') && <>
                                    <select value={transactionData.toEntityType || ''} onChange={e => setTransactionData({...transactionData, toEntityType: e.target.value})} className="w-full rounded-md" required>
                                        <option value="">Select Entity Type...</option>
                                        <option value="Class">Class</option><option value="Teacher">Teacher</option><option value="Room">Room</option>
                                    </select>
                                    {(transactionData.toEntityType === 'Class' || transactionData.toEntityType === 'Teacher') ? (
                                        <select value={transactionData.toEntityId || ''} onChange={e => setTransactionData({...transactionData, toEntityId: e.target.value})} className="w-full rounded-md" required>
                                            <option value="">Select {(transactionData.toEntityType as string).toLowerCase()}...</option>
                                            {(transactionData.toEntityType === 'Class' ? metaData.classes : metaData.teachers).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                        </select>
                                    ) : <input value={transactionData.toEntityId || ''} onChange={e => setTransactionData({...transactionData, toEntityId: e.target.value})} placeholder="Entity Name/ID" className="w-full rounded-md" required />}
                                </>}
                                {activeTab === 'ADJUST' && <input value={transactionData.reason || ''} onChange={e => setTransactionData({...transactionData, reason: e.target.value})} placeholder="Reason for adjustment" className="w-full rounded-md" required />}
                                <input value={transactionData.ref || ''} onChange={e => setTransactionData({...transactionData, ref: e.target.value})} placeholder="Reference (e.g., PO-123)" className="w-full rounded-md" />
                                <button type="submit" disabled={isSubmitting} className="w-full py-2 bg-indigo-600 text-white rounded-md disabled:bg-gray-400">
                                    {isSubmitting ? 'Recording...' : `Record ${activeTab}`}
                                </button>
                            </form>
                        </div>
                    </div>
                    <div className="lg:col-span-2 bg-white p-4 rounded-lg shadow-sm border">
                        <h3 className="text-lg font-semibold mb-2">Transaction History</h3>
                        <div className="max-h-96 overflow-y-auto">
                             <table className="min-w-full text-sm">
                                <thead className="bg-gray-50"><tr>
                                    <th className="p-2 text-left">Date</th><th className="p-2 text-left">Type</th>
                                    <th className="p-2 text-right">Qty</th><th className="p-2 text-left">Details</th>
                                </tr></thead>
                                <tbody className="divide-y">
                                    {transactions.map(txn => (
                                        <tr key={txn.id}>
                                            <td className="p-2 whitespace-nowrap">{new Date(txn.createdAt).toLocaleDateString()}</td>
                                            <td className="p-2 font-medium">{txn.type}</td>
                                            <td className={`p-2 text-right font-bold ${txn.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>{txn.quantity}</td>
                                            <td className="p-2 text-gray-600">{txn.toEntityType ? `${txn.toEntityType}: ${getEntityName(txn.toEntityType, txn.toEntityId)}` : metaData.suppliers.find(s=>s.id === txn.supplierId)?.name || txn.reason}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StockPage;