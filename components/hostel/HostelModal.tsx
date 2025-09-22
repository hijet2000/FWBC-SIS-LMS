import React, { useState } from 'react';
import type { HostelType, User } from '../../types';
import * as hostelService from '../../lib/hostelService';
import Modal from '../ui/Modal';

interface HostelModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveSuccess: () => void;
    actor: User;
}

const HostelModal: React.FC<HostelModalProps> = ({ isOpen, onClose, onSaveSuccess, actor }) => {
    const [formData, setFormData] = useState({ name: '', type: 'Boys' as HostelType });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) {
            setError('Hostel name is required.');
            return;
        }
        setIsSaving(true);
        try {
            await hostelService.createHostel(formData, actor);
            onSaveSuccess();
            onClose();
        } catch {
            setError('Failed to save hostel.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Hostel">
            <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4">
                    {error && <p className="text-red-600 text-sm">{error}</p>}
                    <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Hostel Name (e.g., Eagle House)" className="w-full rounded-md" required />
                    <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as HostelType })} className="w-full rounded-md">
                        {(['Boys', 'Girls', 'Mixed', 'Staff'] as HostelType[]).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md">Cancel</button>
                    <button type="submit" disabled={isSaving} className="px-4 py-2 text-white bg-indigo-600 rounded-md disabled:bg-gray-400">{isSaving ? 'Saving...' : 'Save Hostel'}</button>
                </div>
            </form>
        </Modal>
    );
};

export default HostelModal;
