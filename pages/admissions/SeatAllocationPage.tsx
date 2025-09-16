import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getSeatAllocations, updateSeatCapacity } from '../../lib/admissionsService';
import { getClasses } from '../../lib/schoolService';
import type { SeatAllocation, SchoolClass } from '../../types';
import Modal from '../../components/ui/Modal';

// --- Edit Capacity Modal ---
interface EditCapacityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (classId: string, newCapacity: number) => Promise<void>;
    allocation: SeatAllocation;
    className: string;
}
const EditCapacityModal: React.FC<EditCapacityModalProps> = ({ isOpen, onClose, onSave, allocation, className }) => {
    const [capacity, setCapacity] = useState(allocation.capacity);
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        await onSave(allocation.classId, capacity);
        setIsSaving(false);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Edit Capacity for ${className}`}>
            <form onSubmit={handleSubmit}>
                <div className="p-6">
                    <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">Set new capacity</label>
                    <input
                        type="number"
                        id="capacity"
                        value={capacity}
                        onChange={e => setCapacity(Number(e.target.value))}
                        className="mt-1 block w-full rounded-md border-gray-300"
                        min="0"
                        required
                    />
                </div>
                <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md">Cancel</button>
                    <button type="submit" disabled={isSaving} className="px-4 py-2 text-white bg-indigo-600 rounded-md">Save Changes</button>
                </div>
            </form>
        </Modal>
    );
};


// --- Main Page Component ---
const SeatAllocationPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [allocations, setAllocations] = useState<SeatAllocation[]>([]);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingAllocation, setEditingAllocation] = useState<SeatAllocation | null>(null);

    const fetchData = useCallback(() => {
        setLoading(true);
        Promise.all([getSeatAllocations(), getClasses()])
            .then(([allocData, classData]) => {
                setAllocations(allocData);
                setClasses(classData);
            })
            .catch(() => addToast('Failed to load seat allocation data.', 'error'))
            .finally(() => setLoading(false));
    }, [addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveCapacity = async (classId: string, newCapacity: number) => {
        if (!user) return;
        try {
            await updateSeatCapacity(classId, newCapacity, user);
            addToast('Capacity updated successfully.', 'success');
            fetchData();
        } catch {
            addToast('Failed to update capacity.', 'error');
        }
    };

    const classMap = useMemo(() => new Map(classes.map(c => [c.id, c.name])), [classes]);

    const allocationData = useMemo(() => {
        return allocations.map(alloc => {
            const available = alloc.capacity - alloc.allocated;
            const occupancy = alloc.capacity > 0 ? (alloc.allocated / alloc.capacity) * 100 : 0;
            return {
                ...alloc,
                className: classMap.get(alloc.classId) || 'Unknown Class',
                available,
                occupancy,
            };
        });
    }, [allocations, classMap]);

    return (
        <div className="space-y-6">
            {editingAllocation && (
                <EditCapacityModal
                    isOpen={!!editingAllocation}
                    onClose={() => setEditingAllocation(null)}
                    onSave={handleSaveCapacity}
                    allocation={editingAllocation}
                    className={classMap.get(editingAllocation.classId) || ''}
                />
            )}
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Seat Allocation</h1>
                <p className="mt-1 text-sm text-gray-500">Manage class capacity and view allocated seats for the upcoming intake.</p>
            </div>
            
            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase">Class</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase">Capacity</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase">Allocated</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase">Available</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase">Occupancy</th>
                            <th className="px-4 py-3 text-right text-xs font-medium uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? <tr><td colSpan={6} className="p-4 text-center">Loading...</td></tr> :
                        allocationData.map(data => (
                            <tr key={data.classId}>
                                <td className="px-4 py-4 font-medium">{data.className}</td>
                                <td className="px-4 py-4">{data.capacity}</td>
                                <td className="px-4 py-4">{data.allocated}</td>
                                <td className={`px-4 py-4 font-bold ${data.available > 0 ? 'text-green-600' : 'text-red-600'}`}>{data.available}</td>
                                <td className="px-4 py-4">
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${Math.min(data.occupancy, 100)}%` }}></div>
                                    </div>
                                    <span className="text-xs">{data.occupancy.toFixed(1)}%</span>
                                </td>
                                <td className="px-4 py-4 text-right">
                                    <button onClick={() => setEditingAllocation(data)} className="text-indigo-600 hover:underline">Edit Capacity</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SeatAllocationPage;