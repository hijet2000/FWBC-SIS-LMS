import React, { useState, useEffect } from 'react';
import type { User, Student, HostelWithRoomsAndBeds } from '../../types';
import * as hostelService from '../../lib/hostelService';
import Modal from '../ui/Modal';

interface AllocationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveSuccess: () => void;
    actor: User;
    hostels: HostelWithRoomsAndBeds[];
}

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const AllocationModal: React.FC<AllocationModalProps> = ({ isOpen, onClose, onSaveSuccess, actor, hostels }) => {
    const [unallocatedStudents, setUnallocatedStudents] = useState<Student[]>([]);
    const [formData, setFormData] = useState({ studentId: '', hostelId: '', roomId: '', bedId: '', checkInDate: getTodayDateString() });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [policyWarning, setPolicyWarning] = useState('');

    useEffect(() => {
        if (isOpen) {
            hostelService.getUnallocatedStudents().then(setUnallocatedStudents);
            // Reset form
            setFormData({ studentId: '', hostelId: '', roomId: '', bedId: '', checkInDate: getTodayDateString() });
            setError('');
            setPolicyWarning('');
        }
    }, [isOpen]);

    useEffect(() => {
        const student = unallocatedStudents.find(s => s.id === formData.studentId);
        const hostel = hostels.find(h => h.id === formData.hostelId);
        if (!student || !hostel) {
            setPolicyWarning('');
            return;
        }

        if ((student.gender === 'Male' && hostel.type === 'Girls') || (student.gender === 'Female' && hostel.type === 'Boys')) {
            setPolicyWarning(`Warning: Assigning a ${student.gender.toLowerCase()} student to a ${hostel.type.toLowerCase()} hostel.`);
        } else {
            setPolicyWarning('');
        }

    }, [formData.studentId, formData.hostelId, unallocatedStudents, hostels]);

    const handleHostelChange = (hostelId: string) => {
        setFormData({ ...formData, hostelId, roomId: '', bedId: '' });
    };

    const handleRoomChange = (roomId: string) => {
        setFormData({ ...formData, roomId, bedId: '' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { studentId, bedId, checkInDate } = formData;
        if (!studentId || !bedId || !checkInDate) {
            setError('Please complete all fields.');
            return;
        }
        setError('');
        setIsSaving(true);
        try {
            await hostelService.createAllocation({ studentId, bedId, checkInDate }, actor);
            onSaveSuccess();
        } catch (err: any) {
            setError(err.message || 'Failed to create allocation.');
        } finally {
            setIsSaving(false);
        }
    };

    const selectedHostel = hostels.find(h => h.id === formData.hostelId);
    const selectedRoom = selectedHostel?.rooms.find(r => r.id === formData.roomId);
    const availableBeds = selectedRoom?.beds.filter(b => b.status === 'Available');

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Allocate Student to Bed">
            <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4">
                    {error && <p className="text-red-600 text-sm">{error}</p>}
                    {policyWarning && <p className="p-2 bg-yellow-100 text-yellow-800 text-sm rounded-md">{policyWarning}</p>}

                    <select value={formData.studentId} onChange={e => setFormData({ ...formData, studentId: e.target.value })} className="w-full rounded-md" required>
                        <option value="">-- Select Unallocated Student --</option>
                        {unallocatedStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    
                    <select value={formData.hostelId} onChange={e => handleHostelChange(e.target.value)} className="w-full rounded-md" required>
                        <option value="">-- Select Hostel --</option>
                        {hostels.map(h => <option key={h.id} value={h.id}>{h.name} ({h.type})</option>)}
                    </select>

                    <select value={formData.roomId} onChange={e => handleRoomChange(e.target.value)} className="w-full rounded-md" required disabled={!selectedHostel}>
                        <option value="">-- Select Room --</option>
                        {selectedHostel?.rooms.map(r => <option key={r.id} value={r.id}>Room {r.roomNumber}</option>)}
                    </select>

                     <select value={formData.bedId} onChange={e => setFormData({ ...formData, bedId: e.target.value })} className="w-full rounded-md" required disabled={!selectedRoom}>
                        <option value="">-- Select Available Bed --</option>
                        {availableBeds?.map(b => <option key={b.id} value={b.id}>Bed {b.bedIdentifier}</option>)}
                    </select>

                    <input type="date" value={formData.checkInDate} onChange={e => setFormData({ ...formData, checkInDate: e.target.value })} className="w-full rounded-md" required />
                </div>
                <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md">Cancel</button>
                    <button type="submit" disabled={isSaving} className="px-4 py-2 text-white bg-indigo-600 rounded-md disabled:bg-gray-400">
                        {isSaving ? 'Allocating...' : 'Confirm Allocation'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AllocationModal;
