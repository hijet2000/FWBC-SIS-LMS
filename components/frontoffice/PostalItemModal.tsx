import React, { useState } from 'react';
import type { User, Teacher, Postal } from '../../types';
import { createPostalItem } from '../../lib/admissionsService';
import Modal from '../ui/Modal';

interface PostalItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  actor: User;
  hosts: Teacher[]; // Can be used for recipient dropdown
}

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const PostalItemModal: React.FC<PostalItemModalProps> = ({ isOpen, onClose, onSaveSuccess, actor, hosts }) => {
    const [formData, setFormData] = useState({
        direction: 'Incoming' as Postal['direction'],
        date: getTodayDateString(),
        subject: '',
        sender: '',
        recipient: '',
        carrier: '',
        confidential: false,
        status: 'Received' as Postal['status'],
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const payload: Omit<Postal, 'id'> = {
            ...formData,
            status: formData.direction === 'Incoming' ? 'Received' : 'Dispatched',
        };
        await createPostalItem(payload, actor);
        onSaveSuccess();
        onClose();
        setIsSaving(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Log Postal Item">
            <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <select value={formData.direction} onChange={e => setFormData({...formData, direction: e.target.value as Postal['direction']})} className="rounded-md">
                            <option value="Incoming">Incoming</option>
                            <option value="Outgoing">Outgoing</option>
                        </select>
                        <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="rounded-md" />
                    </div>
                    <input value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} placeholder="Subject / Description" className="w-full rounded-md" required />
                     <div className="grid grid-cols-2 gap-4">
                        <input value={formData.sender} onChange={e => setFormData({...formData, sender: e.target.value})} placeholder="Sender" className="w-full rounded-md" required />
                        <input value={formData.recipient} onChange={e => setFormData({...formData, recipient: e.target.value})} placeholder="Recipient" className="w-full rounded-md" required />
                    </div>
                     <input value={formData.carrier} onChange={e => setFormData({...formData, carrier: e.target.value})} placeholder="Carrier / Ref #" className="w-full rounded-md" />
                     <div className="flex items-center gap-2">
                        <input id="confidential" type="checkbox" checked={formData.confidential} onChange={e => setFormData({...formData, confidential: e.target.checked})} className="rounded" />
                        <label htmlFor="confidential">Confidential</label>
                     </div>
                      <div>
                        <label className="text-sm text-gray-600">Attachments (mock)</label>
                        <div className="p-4 mt-1 text-center border-2 border-dashed rounded-md">
                            <button type="button" className="text-sm text-indigo-600">Click to upload scans</button>
                        </div>
                     </div>
                </div>
                <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md">Cancel</button>
                    <button type="submit" disabled={isSaving} className="px-4 py-2 text-white bg-indigo-600 rounded-md disabled:bg-gray-400">Log Item</button>
                </div>
            </form>
        </Modal>
    );
};

export default PostalItemModal;