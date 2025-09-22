import React, { useState } from 'react';
import type { User } from '../../types';
import * as hostelService from '../../lib/hostelService';
import Modal from '../ui/Modal';

interface RoomModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveSuccess: () => void;
    actor: User;
    hostelId: string | null;
}

const RoomModal: React.FC<RoomModalProps> = ({ isOpen, onClose, onSaveSuccess, actor, hostelId }) => {
    const [formData, setFormData] = useState({ roomNumber: '', floor: '', capacity: 4 });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!hostelId || !formData.roomNumber || formData.capacity <= 0) {
            setError('Valid Room Number and Capacity are required.');
            return;
        }
        setIsSaving(true);
        try {
            await hostelService.createRoom({ ...formData, hostelId, capacity: Number(formData.capacity) }, actor);
            onSaveSuccess();
            onClose();
        } catch {
            setError('Failed to save room.');
        } finally {
            setIsSaving(false);
        }
    };
    
    // Reset form when modal opens
    React.useEffect(() => {
        if(isOpen) {
            setFormData({ roomNumber: '', floor: '', capacity: 4 });
            setError('');
        }
    }, [isOpen]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Room">
            <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4">
                    {error && <p className="text-red-600 text-sm">{error}</p>}
                    <input value={formData.roomNumber} onChange={e => setFormData({ ...formData, roomNumber: e.target.value })} placeholder="Room Number (e.g., 101, G02)" className="w-full rounded-md" required />
                    <div className="grid grid-cols-2 gap-4">
                        <input value={formData.floor} onChange={e => setFormData({ ...formData, floor: e.target.value })} placeholder="Floor (e.g., 1, Ground)" className="w-full rounded-md" />
                        <input type="number" value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: Number(e.target.value) })} placeholder="Capacity" className="w-full rounded-md" required min="1" />
                    </div>
                </div>
                <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md">Cancel</button>
                    <button type="submit" disabled={isSaving} className="px-4 py-2 text-white bg-indigo-600 rounded-md disabled:bg-gray-400">{isSaving ? 'Saving...' : 'Save Room & Generate Beds'}</button>
                </div>
            </form>
        </Modal>
    );
};

export default RoomModal;
