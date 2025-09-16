import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useToast } from '../../contexts/ToastContext';
import * as hostelService from '../../lib/hostelService';
import { useAuth } from '../../auth/AuthContext';
import type { Allocation } from '../../types';
import AllocationModal from '../../components/hostel/AllocationModal';

const HostelAllocationsPage: React.FC = () => {
    const { addToast } = useToast();
    const { user } = useAuth();
    const [allocations, setAllocations] = useState<(Allocation & { studentName: string, hostelName: string, roomName: string, bedName: string })[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filter, setFilter] = useState('');

    const fetchData = useCallback(() => {
        setLoading(true);
        hostelService.listAllocations()
            .then(setAllocations)
            .catch(() => addToast('Failed to load allocations.', 'error'))
            .finally(() => setLoading(false));
    }, [addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCheckout = async (allocationId: string) => {
        if (!user) return;
        await hostelService.checkoutStudent(allocationId, user);
        addToast('Student checked out.', 'success');
        fetchData();
    };

    const handleSaveSuccess = () => {
        setIsModalOpen(false);
        addToast('New allocation saved!', 'success');
        fetchData();
    };

    const filteredAllocations = useMemo(() => {
        const q = filter.toLowerCase();
        return allocations.filter(a => 
            !a.checkOutDate && (
            a.studentName.toLowerCase().includes(q) ||
            a.hostelName.toLowerCase().includes(q) ||
            a.roomName.toLowerCase().includes(q)
        ));
    }, [allocations, filter]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Hostel Allocations</h1>
                <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm">New Allocation</button>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border">
                <input
                    type="search"
                    placeholder="Search student, hostel, room..."
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    className="w-full md:w-1/2 rounded-md border-gray-300"
                />
            </div>

             <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50"><tr>
                        <th className="p-3 text-left text-xs uppercase">Student</th>
                        <th className="p-3 text-left text-xs uppercase">Hostel</th>
                        <th className="p-3 text-left text-xs uppercase">Room</th>
                        <th className="p-3 text-left text-xs uppercase">Bed</th>
                        <th className="p-3 text-left text-xs uppercase">Check-in Date</th>
                        <th className="p-3 text-right text-xs uppercase">Actions</th>
                    </tr></thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? <tr><td colSpan={6} className="p-4 text-center">Loading...</td></tr> :
                        filteredAllocations.map(alloc => (
                            <tr key={alloc.id}>
                                <td className="p-3 font-medium">{alloc.studentName}</td>
                                <td className="p-3 text-sm">{alloc.hostelName}</td>
                                <td className="p-3 text-sm">{alloc.roomName}</td>
                                <td className="p-3 text-sm">{alloc.bedName}</td>
                                <td className="p-3 text-sm">{alloc.checkInDate}</td>
                                <td className="p-3 text-right text-sm">
                                    <button onClick={() => handleCheckout(alloc.id)} className="text-red-600 hover:underline">Check Out</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {user && <AllocationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveSuccess} actor={user} />}
        </div>
    );
};

export default HostelAllocationsPage;
