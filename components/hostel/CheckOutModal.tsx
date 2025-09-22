import React, { useState } from 'react';
import type { User, Allocation } from '../../types';
import * as hostelService from '../../lib/hostelService';
import Modal from '../ui/Modal';

interface CheckOutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveSuccess: () => void;
    actor: User;
    allocation: Allocation;
    studentName: string;
}

const CheckOutModal: React.FC<CheckOutModalProps> = ({ isOpen, onClose, onSaveSuccess, actor, allocation, studentName }) => {
    const [formData, setFormData] = useState({ reason: '', depositNotes: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await hostelService.checkOut(allocation.id, formData.reason, formData.depositNotes, actor);
            onSaveSuccess();
            onClose();
        } catch {
            setError('Failed to process check-out.');
        } finally {
            setIsSaving(false);
        }
    };
    
    React.useEffect(() => {
        if(isOpen) {
            setFormData({ reason: '', depositNotes: '' });
            setError('');
        }
    }, [isOpen]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Check-out ${studentName}`}>
            <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4">
                    {error && <p className="text-red-600 text-sm">{error}</p>}
                    <textarea value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} placeholder="Reason for check-out (e.g., End of term)" className="w-full rounded-md" rows={2} />
                    <textarea value={formData.depositNotes} onChange={e => setFormData({...formData, depositNotes: e.target.value})} placeholder="Deposit return notes..." className="w-full rounded-md" rows={2} />
                </div>
                <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md">Cancel</button>
                    <button type="submit" disabled={isSaving} className="px-4 py-2 text-white bg-red-600 rounded-md disabled:bg-gray-400">
                        {isSaving ? 'Processing...' : 'Confirm Check-out'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default CheckOutModal;
