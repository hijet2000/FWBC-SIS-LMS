import React, { useState, useEffect } from 'react';
import type { User, Student, Bed } from '../../types';
import * as hostelService from '../../lib/hostelService';
import { getStudents } from '../../lib/schoolService';
import Modal from '../ui/Modal';
import { useToast } from '../../contexts/ToastContext';

interface AllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  actor: User;
}

const AllocationModal: React.FC<AllocationModalProps> = ({ isOpen, onClose, onSave, actor }) => {
    const { addToast } = useToast();
    const [students, setStudents] = useState<Student[]>([]);
    const [beds, setBeds] = useState<Bed[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [selectedBedId, setSelectedBedId] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            Promise.all([getStudents({ limit: 1000 }), hostelService.getAvailableBeds()])
                .then(([{ students }, availableBeds]) => {
                    // Filter out students who are already allocated
                    hostelService.listAllocations().then(allocations => {
                        const allocatedStudentIds = new Set(allocations.filter(a => !a.checkOutDate).map(a => a.studentId));
                        setStudents(students.filter(s => !allocatedStudentIds.has(s.id)));
                    });
                    setBeds(availableBeds);
                })
                .catch(() => addToast('Failed to load data for allocation.', 'error'))
                .finally(() => setLoading(false));
        }
    }, [isOpen, addToast]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        await hostelService.createAllocation(selectedStudentId, selectedBedId, actor);
        onSave();
        setIsSaving(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="New Student Allocation">
            <form onSubmit={handleSubmit}>
                {loading ? <div className="p-6">Loading...</div> :
                <div className="p-6 space-y-4">
                    <div>
                        <label>Student</label>
                        <select value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} className="w-full rounded-md mt-1" required>
                            <option value="">Select Student...</option>
                            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label>Available Bed</label>
                        <select value={selectedBedId} onChange={e => setSelectedBedId(e.target.value)} className="w-full rounded-md mt-1" required>
                            <option value="">Select Bed...</option>
                            {beds.map(b => <option key={b.id} value={b.id}>Room {b.roomId} - Bed {b.name}</option>)}
                        </select>
                    </div>
                </div>
                }
                <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md">Cancel</button>
                    <button type="submit" disabled={isSaving || loading || !selectedStudentId || !selectedBedId} className="px-4 py-2 text-white bg-indigo-600 rounded-md disabled:bg-gray-400">
                        {isSaving ? 'Saving...' : 'Allocate Student'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AllocationModal;
