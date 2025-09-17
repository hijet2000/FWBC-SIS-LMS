
import React, { useState } from 'react';
import type { User, Teacher, Handover } from '../../types';
import { createHandover } from '../../lib/admissionsService';
import Modal from '../ui/Modal';

interface HandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  actor: User;
  postalId: string;
  hosts: Teacher[];
}

const HandoverModal: React.FC<HandoverModalProps> = ({ isOpen, onClose, onSaveSuccess, actor, postalId, hosts }) => {
    const [toUserId, setToUserId] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!toUserId) return;
        setIsSaving(true);
        // FIX: Add 'fromUserId' to the payload to satisfy the Omit<Handover, "id"> type required by createHandover.
        const payload: Omit<Handover, "id"> = {
            postalId,
            toUserId,
            fromUserId: actor.id,
            handedAt: new Date().toISOString(),
        };
        await createHandover(payload, actor);
        onSaveSuccess();
        onClose();
        setIsSaving(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Log Handover">
            <form onSubmit={handleSubmit}>
                <div className="p-6">
                    <label htmlFor="host-select">Handed over to:</label>
                    <select id="host-select" value={toUserId} onChange={e => setToUserId(e.target.value)} className="w-full rounded-md mt-1" required>
                        <option value="">Select Staff Member...</option>
                        {hosts.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                    </select>
                </div>
                 <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md">Cancel</button>
                    <button type="submit" disabled={isSaving || !toUserId} className="px-4 py-2 text-white bg-indigo-600 rounded-md disabled:bg-gray-400">Log Handover</button>
                </div>
            </form>
        </Modal>
    );
};

export default HandoverModal;
