import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { listFeeItems, toggleFeeItem } from '../lib/feesService';
import type { FeeItem } from '../types';
import FeeItemModal from '../components/fees/FeeItemModal';

const FeesPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [feeItems, setFeeItems] = useState<FeeItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<FeeItem | null>(null);

    const fetchData = () => {
        setLoading(true);
        listFeeItems()
            .then(setFeeItems)
            .catch(() => addToast('Failed to load fee items.', 'error'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchData();
    }, [addToast]);

    const handleOpenModal = (item: FeeItem | null = null) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleSaveSuccess = (message: string) => {
        setIsModalOpen(false);
        addToast(message, 'success');
        fetchData();
    };
    
    const handleToggle = async (id: string, active: boolean) => {
        await toggleFeeItem(id, !active);
        addToast('Status updated.', 'success');
        fetchData();
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Fees — Structure</h1>
                <button onClick={() => handleOpenModal()} className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm">Add Fee Item</button>
            </div>

            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-3 text-left text-xs uppercase">Name</th>
                            <th className="p-3 text-left text-xs uppercase">Amount</th>
                            <th className="p-3 text-left text-xs uppercase">Frequency</th>
                            <th className="p-3 text-left text-xs uppercase">Status</th>
                            <th className="p-3 text-right text-xs uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr> :
                        feeItems.map(item => (
                            <tr key={item.id}>
                                <td className="p-3 font-medium">{item.name} <span className="text-gray-400 font-mono">{item.code}</span></td>
                                <td className="p-3 text-sm">£{item.amount.toFixed(2)}</td>
                                <td className="p-3 text-sm">{item.frequency}</td>
                                <td className="p-3 text-sm"><span className={`px-2 py-1 text-xs rounded-full ${item.active ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>{item.active ? 'Active' : 'Inactive'}</span></td>
                                <td className="p-3 text-right text-sm space-x-2">
                                    <button onClick={() => handleToggle(item.id, item.active)} className="text-gray-500">{item.active ? 'Deactivate' : 'Activate'}</button>
                                    <button onClick={() => handleOpenModal(item)} className="text-indigo-600">Edit</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {isModalOpen && user && (
                <FeeItemModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSaveSuccess={handleSaveSuccess}
                    initialData={editingItem}
                />
            )}
        </div>
    );
};

export default FeesPage;
