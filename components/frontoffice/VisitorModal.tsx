// FIX: Removed invalid CDATA wrapper.
import React, { useState } from 'react';
import type { VisitorLog, Teacher, User } from '../../types';
import { createVisitorLog } from '../../lib/admissionsService';
import Modal from '../ui/Modal';
import { useToast } from '../../contexts/ToastContext';

interface VisitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  actor: User;
  hosts: Teacher[];
}

const VisitorModal: React.FC<VisitorModalProps> = ({ isOpen, onClose, onSaveSuccess, actor, hosts }) => {
    const { addToast } = useToast();
    const [formData, setFormData] = useState({ name: '', company: '', purpose: '', hostUserId: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!formData.name || !formData.purpose) {
            setError('Visitor Name and Purpose are required.');
            return;
        }
        setError('');
        setIsSaving(true);
        try {
            // Auto-generate badge number
            const badgeNo = `B${Date.now().toString().slice(-5)}`;

            const payload: Omit<VisitorLog, 'id'> = {
                ...formData,
                timeIn: new Date().toISOString(),
                badgeNo,
            };
            await createVisitorLog(payload, actor);
            
            if (formData.hostUserId) {
                const host = hosts.find(h => h.id === formData.hostUserId);
                addToast(`Notifying ${host?.name} of their visitor, ${formData.name}.`, 'info');
            }
            addToast('Visitor signed in successfully!', 'success');

            onSaveSuccess();
            onClose();
        } catch {
            setError('Failed to save visitor log.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Check In New Visitor">
            <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4">
                    {error && <p className="text-red-600 text-sm">{error}</p>}
                    <div className="grid grid-cols-2 gap-4">
                        <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Full Name" className="w-full rounded-md" required />
                        <input value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} placeholder="Company (Optional)" className="w-full rounded-md" />
                    </div>
                    <input value={formData.purpose} onChange={e => setFormData({...formData, purpose: e.target.value})} placeholder="Purpose of Visit" className="w-full rounded-md" required />
                    <div>
                        <label htmlFor="hostUserId" className="sr-only">Host</label>
                        <select id="hostUserId" value={formData.hostUserId} onChange={e => setFormData({...formData, hostUserId: e.target.value})} className="w-full rounded-md">
                            <option value="">Select Host (Optional)</option>
                            {hosts.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                        </select>
                    </div>
                </div>
                 <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md">Cancel</button>
                    <button type="submit" disabled={isSaving} className="px-4 py-2 text-white bg-indigo-600 rounded-md disabled:bg-gray-400">{isSaving ? 'Saving...' : 'Sign In Visitor'}</button>
                </div>
            </form>
        </Modal>
    );
};

export default VisitorModal;