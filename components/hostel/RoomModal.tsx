import React, { useState, useEffect } from 'react';
import type { HostelRoom, User } from '../../types';
import { updateRoom } from '../../lib/hostelService';
import Modal from '../ui/Modal';

interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  room: HostelRoom;
  actor: User;
}

const RoomModal: React.FC<RoomModalProps> = ({ isOpen, onClose, onSave, room, actor }) => {
    const [formData, setFormData] = useState<{ capacity: number; roomType: HostelRoom['roomType'] }>({ capacity: 4, roomType: 'Standard' });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (room) {
            setFormData({ capacity: room.capacity, roomType: room.roomType });
        }
    }, [room]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        await updateRoom(room.id, formData, actor);
        onSave();
        setIsSaving(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Edit Room ${room.name}`}>
            <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4">
                    <div>
                        <label>Capacity</label>
                        <input type="number" value={formData.capacity} onChange={e => setFormData({...formData, capacity: Number(e.target.value)})} className="w-full rounded-md mt-1" />
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
                    <button type="submit" disabled={isSaving} className="px-4 py-2 text-white bg-indigo-600 rounded-md">{isSaving ? 'Saving...' : 'Save Changes'}</button>
                </div>
            </form>
        </Modal>
    );
};

export default RoomModal;