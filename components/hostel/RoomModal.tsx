import React, { useState, useEffect } from 'react';
import type { HostelRoom, User } from '../../types';
import { createRoom, updateRoom } from '../../lib/hostelService';
import Modal from '../ui/Modal';

interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: (message: string) => void;
  initialData: Partial<HostelRoom>;
  actor: User;
}

const RoomModal: React.FC<RoomModalProps> = ({ isOpen, onClose, onSaveSuccess, initialData, actor }) => {
    const isEditing = !!initialData.id;

    const [formData, setFormData] = useState({
        name: '',
        capacity: 4,
        roomType: 'Standard' as HostelRoom['roomType'],
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                capacity: initialData.capacity || 4,
                roomType: initialData.roomType || 'Standard',
            });
        }
    }, [initialData, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError('');
        try {
            if (isEditing) {
                await updateRoom(initialData.id!, {
                    capacity: formData.capacity,
                    roomType: formData.roomType
                }, actor);
                onSaveSuccess('Room updated successfully.');
            } else {
                if (!formData.name) {
                    setError('Room name is required.');
                    setIsSaving(false);
                    return;
                }
                await createRoom({
                    ...formData,
                    floorId: initialData.floorId!,
                }, actor);
                onSaveSuccess('Room created successfully.');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? `Edit Room ${initialData.name}` : 'Add New Room'}>
            <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4">
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <div>
                        <label>Room Name/Number</label>
                        <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full rounded-md mt-1" disabled={isEditing} required={!isEditing} />
                    </div>
                    <div>
                        <label>Capacity</label>
                        <input type="number" value={formData.capacity} onChange={e => setFormData({...formData, capacity: Number(e.target.value)})} className="w-full rounded-md mt-1" min="1" />
                    </div>
                    <div>
                        <label>Room Type</label>
                        <select value={formData.roomType} onChange={e => setFormData({...formData, roomType: e.target.value as HostelRoom['roomType']})} className="w-full rounded-md mt-1">
                            <option>Standard</option>
                            <option>Premium</option>
                            <option>Accessible</option>
                        </select>
                    </div>
                </div>
                <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md">Cancel</button>
                    <button type="submit" disabled={isSaving} className="px-4 py-2 text-white bg-indigo-600 rounded-md disabled:bg-gray-400">{isSaving ? 'Saving...' : 'Save Changes'}</button>
                </div>
            </form>
        </Modal>
    );
};

export default RoomModal;