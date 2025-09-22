import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as inventoryService from '../../lib/inventoryService';
import type { Supplier } from '../../types';
import { exportToCsv } from '../../lib/exporters';
import SupplierModal from '../../components/inventory/SupplierModal';
import SupplierDetailDrawer from '../../components/inventory/SupplierDetailDrawer';

const SuppliersPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [viewingSupplierId, setViewingSupplierId] = useState<string | null>(null);
    const [filterQuery, setFilterQuery] = useState('');

    const fetchData = useCallback(() => {
        setLoading(true);
        inventoryService.listSuppliers()
            .then(setSuppliers)
            .catch(() => addToast('Failed to load suppliers.', 'error'))
            .finally(() => setLoading(false));
    }, [addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenModal = (supplier: Supplier | null = null) => {
        setEditingSupplier(supplier);
        setIsModalOpen(true);
    };

    const handleSaveSuccess = () => {
        setIsModalOpen(false);
        setEditingSupplier(null);
        fetchData();
    };

    const handleToggleStatus = async (supplier: Supplier) => {
        if (!user) return;
        try {
            await inventoryService.toggleSupplierStatus(supplier.id, !supplier.active, user);
            addToast(`Supplier '${supplier.name}' ${!supplier.active ? 'activated' : 'deactivated'}.`, 'success');
            fetchData();
        } catch {
            addToast('Failed to update status.', 'error');
        }
    };

    const handleExport = () => {
        exportToCsv('inventory_suppliers.csv', [
            { key: 'name', label: 'Name' },
            { key: 'contactPerson', label: 'Contact Person' },
            { key: 'phone', label: 'Phone' },
            { key: 'email', label: 'Email' },
            { key: 'active', label: 'Status' },
        ], filteredSuppliers.map(s => ({ ...s, active: s.active ? 'Active' : 'Inactive' })));
    };

    const filteredSuppliers = useMemo(() => {
        if (!filterQuery) return suppliers;
        const q = filterQuery.toLowerCase();
        return suppliers.filter(s =>
            s.name.toLowerCase().includes(q) ||
            s.contactPerson?.toLowerCase().includes(q) ||
            s.email?.toLowerCase().includes(q)
        );
    }, [suppliers, filterQuery]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Inventory Suppliers</h1>
                <div className="flex gap-2">
                    <button onClick={handleExport} className="px-4 py-2 text-sm bg-white border rounded-md">Export CSV</button>
                    <button onClick={() => handleOpenModal()} className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md">Add Supplier</button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border">
                <input type="search" placeholder="Search by name, contact, or email..." value={filterQuery} onChange={e => setFilterQuery(e.target.value)} className="w-full rounded-md border-gray-300" />
            </div>

            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50"><tr>
                        <th className="p-3 text-left text-xs uppercase">Supplier Name</th>
                        <th className="p-3 text-left text-xs uppercase">Contact Person</th>
                        <th className="p-3 text-left text-xs uppercase">Contact Details</th>
                        <th className="p-3 text-left text-xs uppercase">Status</th>
                        <th className="p-3 text-right text-xs uppercase">Actions</th>
                    </tr></thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr> :
                            filteredSuppliers.map(s => (
                                <tr key={s.id}>
                                    <td className="p-3 font-medium">{s.name}</td>
                                    <td className="p-3 text-sm">{s.contactPerson}</td>
                                    <td className="p-3 text-sm">{s.phone && <div>{s.phone}</div>}{s.email && <div>{s.email}</div>}</td>
                                    <td className="p-3 text-sm"><span className={`px-2 py-1 text-xs rounded-full ${s.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{s.active ? 'Active' : 'Inactive'}</span></td>
                                    <td className="p-3 text-right text-sm font-medium space-x-2">
                                        <button onClick={() => setViewingSupplierId(s.id)} className="text-blue-600">View Details</button>
                                        <button onClick={() => handleOpenModal(s)} className="text-indigo-600">Edit</button>
                                        <button onClick={() => handleToggleStatus(s)} className="text-gray-500">{s.active ? 'Deactivate' : 'Activate'}</button>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>

            {user && (
                <SupplierModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSaveSuccess={handleSaveSuccess} initialData={editingSupplier} actor={user} />
            )}

            <SupplierDetailDrawer isOpen={!!viewingSupplierId} onClose={() => setViewingSupplierId(null)} supplierId={viewingSupplierId} />
        </div>
    );
};

export default SuppliersPage;
