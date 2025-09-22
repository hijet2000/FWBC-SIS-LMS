import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as hostelService from '../../lib/hostelService';
import * as schoolService from '../../lib/schoolService';
import type { Allocation, Student } from '../../types';
import AllocationModal from '../../components/hostel/AllocationModal';
import CheckOutModal from '../../components/hostel/CheckOutModal';

const AllocationsPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [allocations, setAllocations] = useState<Allocation[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [hostels, setHostels] = useState<hostelService.HostelWithRoomsAndBeds[]>([]);
    const [loading, setLoading] = useState(true);

    const [isAllocModalOpen, setIsAllocModalOpen] = useState(false);
    const [isCheckOutModalOpen, setIsCheckOutModalOpen] = useState(false);
    const [selectedAllocation, setSelectedAllocation] = useState<Allocation | null>(null);

    const fetchData = useCallback(() => {
        setLoading(true);
        Promise.all([
            hostelService.listAllocations(),
            schoolService.getStudents({ limit: 1000 }).then(res => res.students),
            hostelService.listHostelsWithRoomsAndBeds(),
        ]).then(([allocData, studentData, hostelData]) => {
            setAllocations(allocData);
            setStudents(studentData);
            setHostels(hostelData);
        }).catch(() => addToast('Failed to load data.', 'error'))
          .finally(() => setLoading(false));
    }, [addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const handleSaveSuccess = () => {
        setIsAllocModalOpen(false);
        setIsCheckOutModalOpen(false);
        fetchData();
    };

    const studentMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);
    const hostelMap = useMemo(() => new Map(hostels.map(h => [h.id, h])), [hostels]);

    const activeAllocations = useMemo(() => {
        return allocations.filter(a => a.status !== 'CheckedOut');
    }, [allocations]);
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Hostel Allocations</h1>
                <div className="flex gap-2">
                    <button disabled className="px-4 py-2 text-sm bg-white border rounded-md disabled:opacity-50">Bulk Allocate</button>
                    <button onClick={() => setIsAllocModalOpen(true)} className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md">Allocate Student</button>
                </div>
            </div>

            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50"><tr>
                        <th className="p-3 text-left text-xs uppercase">Student</th>
                        <th className="p-3 text-left text-xs uppercase">Hostel</th>
                        <th className="p-3 text-left text-xs uppercase">Room & Bed</th>
                        <th className="p-3 text-left text-xs uppercase">Check-in Date</th>
                        <th className="p-3 text-left text-xs uppercase">Status</th>
                        <th className="p-3 text-right text-xs uppercase">Actions</th>
                    </tr></thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? <tr><td colSpan={6} className="p-4 text-center">Loading...</td></tr> :
                        activeAllocations.map(alloc => {
                            const student = studentMap.get(alloc.studentId);
                            const hostel = hostelMap.get(alloc.hostelId);
                            const room = hostel?.rooms.find(r => r.id === alloc.roomId);
                            const bed = room?.beds.find(b => b.id === alloc.bedId);
                            return (
                                <tr key={alloc.id}>
                                    <td className="p-3 font-medium">{student?.name}</td>
                                    <td className="p-3 text-sm">{hostel?.name}</td>
                                    <td className="p-3 text-sm">{room?.roomNumber} / Bed {bed?.bedIdentifier}</td>
                                    <td className="p-3 text-sm">{alloc.checkInDate}</td>
                                    <td className="p-3 text-sm"><span className={`px-2 py-1 text-xs rounded-full ${alloc.status === 'CheckedIn' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{alloc.status}</span></td>
                                    <td className="p-3 text-right">
                                        {alloc.status === 'CheckedIn' && (
                                            <button onClick={() => { setSelectedAllocation(alloc); setIsCheckOutModalOpen(true); }} className="text-red-600 font-medium">Check-out</button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            
            {user && (
                <>
                    <AllocationModal 
                        isOpen={isAllocModalOpen} 
                        onClose={() => setIsAllocModalOpen(false)} 
                        onSaveSuccess={handleSaveSuccess}
                        actor={user} 
                        hostels={hostels}
                    />
                    {selectedAllocation && (
                        <CheckOutModal
                            isOpen={isCheckOutModalOpen}
                            onClose={() => setIsCheckOutModalOpen(false)}
                            onSaveSuccess={handleSaveSuccess}
                            actor={user}
                            allocation={selectedAllocation}
                            studentName={studentMap.get(selectedAllocation.studentId)?.name || ''}
                        />
                    )}
                </>
            )}
        </div>
    );
};

export default AllocationsPage;
