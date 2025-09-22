import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as inventoryService from '../../lib/inventoryService';
import type { InventoryItem } from '../../types';
import { exportToCsv } from '../../lib/exporters';
import ItemModal from '../../components/inventory/ItemModal';

const ItemsPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

    const [filters, setFilters] = useState({ q: '', category: 'all', status: 'all', trackAsset: 'all' });

    const fetchData = useCallback(() => {
        setLoading(true);
        inventoryService.listItems()
            .then(setItems)
            .catch(() => addToast('Failed to load inventory items.', 'error'))
            .finally(() => setLoading(false));
    }, [addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenModal = (item: InventoryItem | null = null) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleSaveSuccess = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        fetchData();
    };
    
    const handleToggleStatus = async (item: InventoryItem) => {
        if (!user) return;
        try {
            await inventoryService.toggleItemStatus(item.id, !item.active, user);
            addToast(`Item '${item.name}' ${!item.active ? 'activated' : 'deactivated'}.`, 'success');
            fetchData();
        } catch {
            addToast('Failed to update status.', 'error');
        }
    };
    
    const handlePrintLabel = (item: InventoryItem) => {
        addToast(`Printing label for ${item.sku}... (Mock Action)`, 'info');
    };
    
    const handleMerge = () => {
        addToast('Searching for duplicates to merge... (Mock Action)', 'info');
    };
    
    const handleExport = () => {
        exportToCsv('inventory_items.csv', [
            { key: 'sku', label: 'SKU' },
            { key: 'name', label: 'Name' },
            { key: 'category', label: 'Category' },
            { key: 'unit', label: 'Unit' },
            { key: 'reorderLevel', label: 'Reorder Level' },
            { key: 'location', label: 'Location' },
            { key: 'trackAsset', label: 'Tracked Asset' },
            { key: 'active', label: 'Status' },
        ], filteredItems.map(i => ({...i, active: i.active ? 'Active' : 'Inactive' })));
    };

    const categories = useMemo(() => Array.from(new Set(items.map(i => i.category))), [items]);

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const q = filters.q.toLowerCase();
            return (
                (filters.q ? item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q) : true) &&
                (filters.category === 'all' ? true : item.category === filters.category) &&
                (filters.status === 'all' ? true : (filters.status === 'active' ? item.active : !item.active)) &&
                (filters.trackAsset === 'all' ? true : (filters.trackAsset === 'yes' ? item.trackAsset : !item.trackAsset))
            );
        });
    }, [items, filters]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Inventory Items</h1>
                <div className="flex gap-2">
                    <button onClick={handleMerge} className="px-4 py-2 text-sm bg-white border rounded-md">Merge Duplicates</button>
                    <button onClick={handleExport} className="px-4 py-2 text-sm bg-white border rounded-md">Export CSV</button>
                    <button onClick={() => handleOpenModal()} className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md">Add Item</button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border space-y-4">
                <input type="search" placeholder="Search by name or SKU..." value={filters.q} onChange={e => setFilters({...filters, q: e.target.value})} className="w-full rounded-md border-gray-300" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <select value={filters.category} onChange={e => setFilters({...filters, category: e.target.value})} className="rounded-md"><option value="all">All Categories</option>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select>
                    <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})} className="rounded-md"><option value="all">All Statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
                    <select value={filters.trackAsset} onChange={e => setFilters({...filters, trackAsset: e.target.value})} className="rounded-md"><option value="all">All Types</option><option value="yes">Tracked Asset</option><option value="no">Consumable</option></select>
                </div>
            </div>

            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50"><tr>
                        <th className="p-3 text-left text-xs uppercase"></th>
                        <th className="p-3 text-left text-xs uppercase">Item</th>
                        <th className="p-3 text-left text-xs uppercase">Category</th>
                        <th className="p-3 text-left text-xs uppercase">Reorder Lvl</th>
                        <th className="p-3 text-left text-xs uppercase">Asset</th>
                        <th className="p-3 text-left text-xs uppercase">Status</th>
                        <th className="p-3 text-right text-xs uppercase">Actions</th>
                    </tr></thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? <tr><td colSpan={7} className="p-4 text-center">Loading...</td></tr> :
                        filteredItems.map(item => (
                            <tr key={item.id}>
                                <td className="p-3"><img src={item.photoUrl || 'https://placehold.co/100x100/EBF4FF/7F8A9A?text=No+Img'} alt={item.name} className="w-10 h-10 rounded object-cover bg-gray-100" /></td>
                                <td className="p-3"><div className="font-medium">{item.name}</div><div className="text-xs text-gray-500 font-mono">{item.sku}</div></td>
                                <td className="p-3 text-sm">{item.category}</td>
                                <td className="p-3 text-sm">{item.reorderLevel} {item.unit}</td>
                                <td className="p-3 text-sm">{item.trackAsset ? 'Yes' : 'No'}</td>
                                <td className="p-3 text-sm"><span className={`px-2 py-1 text-xs rounded-full ${item.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{item.active ? 'Active' : 'Inactive'}</span></td>
                                <td className="p-3 text-right text-sm font-medium space-x-2">
                                    <button onClick={() => handlePrintLabel(item)} className="text-gray-500">Print Label</button>
                                    <button onClick={() => handleOpenModal(item)} className="text-indigo-600">Edit</button>
                                    <button onClick={() => handleToggleStatus(item)} className="text-gray-500">{item.active ? 'Deactivate' : 'Activate'}</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {user && (
                <ItemModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSaveSuccess={handleSaveSuccess} initialData={editingItem} actor={user} categories={categories} />
            )}
        </div>
    );
};

export default ItemsPage;