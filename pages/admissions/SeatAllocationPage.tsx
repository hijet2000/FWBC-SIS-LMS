
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getSeatAllocations, updateSeatCapacity, listApplications } from '../../lib/admissionsService';
import { getClasses } from '../../lib/schoolService';
import type { SeatAllocation, SchoolClass, Application, ApplicationStatus } from '../../types';
import Modal from '../../components/ui/Modal';
import DrillDownModal from '../../components/admissions/DrillDownModal';

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

    useEffect(() => {
        if (isOpen) {
            setCapacity(allocation.capacity);
        }
    }, [isOpen, allocation.capacity]);

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
    const [applications, setApplications] = useState<Application[]>([]);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingAllocation, setEditingAllocation] = useState<SeatAllocation | null>(null);
    const [drillDown, setDrillDown] = useState<{
        isOpen: boolean;
        title: string;
        apps: Application[];
    }>({ isOpen: false, title: '', apps: [] });

    const fetchData = useCallback(() => {
        setLoading(true);
        Promise.all([getSeatAllocations(), getClasses(), listApplications()])
            .then(([allocData, classData, appData]) => {
                setAllocations(allocData);
                setClasses(classData);
                setApplications(appData);
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

    const handleDrillDown = (classId: string, className: string, status: ApplicationStatus) => {
        const appsToDisplay = applications.filter(app => app.desiredClassId === classId && app.status === status);
        const titleMap: Partial<Record<ApplicationStatus, string>> = {
            Approved: 'Allocated Students',
            Offer: 'Applicants with Pending Offers',
            Waitlist: 'Waitlisted Applicants'
        };
        const modalTitle = `${titleMap[status] || status} for ${className}`;
        
        setDrillDown({ isOpen: true, title: modalTitle, apps: appsToDisplay });
    };

    const classMap = useMemo(() => new Map(classes.map(c => [c.id, c.name])), [classes]);

    const allocationData = useMemo(() => {
        return allocations.map(alloc => {
            const trueAvailable = alloc.capacity - alloc.allocated - alloc.pendingOffers;
            const committedOccupancy = alloc.capacity > 0 ? (alloc.allocated / alloc.capacity) * 100 : 0;
            const provisionalOccupancy = alloc.capacity > 0 ? ((alloc.allocated + alloc.pendingOffers) / alloc.capacity) * 100 : 0;
            return {
                ...alloc,
                className: classMap.get(alloc.classId) || 'Unknown Class',
                trueAvailable,
                committedOccupancy,
                provisionalOccupancy,
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
             <DrillDownModal 
                isOpen={drillDown.isOpen}
                onClose={() => setDrillDown({ isOpen: false, title: '', apps: [] })}
                title={drillDown.title}
                applications={drillDown.apps}
            />
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
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase">Pending Offers</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase">Waitlisted</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase">Available Slots</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase">Occupancy</th>
                            <th className="px-4 py-3 text-right text-xs font-medium uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? <tr><td colSpan={8} className="p-4 text-center">Loading...</td></tr> :
                        allocationData.map(data => (
                            <tr key={data.classId}>
                                <td className="px-4 py-4 font-medium">{data.className}</td>
                                <td className="px-4 py-4">{data.capacity}</td>
                                <td className="px-4 py-4">
                                    <button disabled={data.allocated === 0} onClick={() => handleDrillDown(data.classId, data.className, 'Approved')} className="disabled:text-gray-500 disabled:no-underline text-indigo-600 hover:underline">{data.allocated}</button>
                                </td>
                                <td className="px-4 py-4">
                                     <button disabled={data.pendingOffers === 0} onClick={() => handleDrillDown(data.classId, data.className, 'Offer')} className="disabled:text-gray-500 disabled:no-underline text-indigo-600 hover:underline">{data.pendingOffers}</button>
                                </td>
                                <td className="px-4 py-4">
                                     <button disabled={data.waitlisted === 0} onClick={() => handleDrillDown(data.classId, data.className, 'Waitlist')} className="disabled:text-gray-500 disabled:no-underline text-indigo-600 hover:underline">{data.waitlisted}</button>
                                </td>
                                <td className={`px-4 py-4 font-bold ${data.trueAvailable >= 0 ? 'text-green-600' : 'text-red-600'}`}>{data.trueAvailable}</td>
                                <td className="px-4 py-4">
                                    <div className="w-full bg-gray-200 rounded-full h-4 relative" title={`Filled: ${data.committedOccupancy.toFixed(0)}%, Provisional: ${data.provisionalOccupancy.toFixed(0)}%`}>
                                        <div className="bg-yellow-400 h-4 rounded-l-full" style={{ width: `${Math.min(data.provisionalOccupancy, 100)}%` }}></div>
                                        <div className="bg-indigo-600 h-4 rounded-l-full absolute top-0 left-0" style={{ width: `${Math.min(data.committedOccupancy, 100)}%` }}></div>
                                    </div>
                                    <div className="text-xs flex justify-between">
                                        <span>{data.committedOccupancy.toFixed(0)}% Filled</span>
                                        <span>{data.provisionalOccupancy.toFixed(0)}% Prov.</span>
                                    </div>
                                </td>
                                <td className="px-4 py-4 text-right">
                                    <button onClick={() => setEditingAllocation(data)} className="text-indigo-600 hover:underline">Edit Capacity</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
              <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-indigo-600"></div> Allocated</span>
              <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-yellow-400"></div> Pending Offers</span>
            </div>
        </div>
    );
};

export default SeatAllocationPage;