import React, { useState } from 'react';
import type { User, InventoryItem } from '../../types';
import * as inventoryService from '../../lib/inventoryService';
import Modal from '../ui/Modal';

interface RequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  actor: User;
  items: InventoryItem[];
}

const RequestModal: React.FC<RequestModalProps> = ({ isOpen, onClose, onSaveSuccess, actor, items }) => {
    const [formData, setFormData] = useState({ itemId: '', quantity: 1, notes: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.itemId || formData.quantity <= 0) {
            setError('Please select an item and enter a valid quantity.');
            return;
        }
        setIsSaving(true);
        try {
            await inventoryService.createIssueRequest({ ...formData, quantity: Number(formData.quantity), requesterId: actor.id }, actor);
            onSaveSuccess();
            onClose();
        } catch {
            setError('Failed to create request.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="New Issue Request">
            <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4">
                    {error && <p className="text-red-600 text-sm">{error}</p>}
                    <select value={formData.itemId} onChange={e => setFormData({ ...formData, itemId: e.target.value })} className="w-full rounded-md" required>
                        <option value="">-- Select Item --</option>
                        {items.filter(i => i.active).map(item => <option key={item.id} value={item.id}>{item.name} ({item.sku})</option>)}
                    </select>
                    <input type="number" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })} placeholder="Quantity" className="w-full rounded-md" required min="1" />
                    <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Notes / Justification (Optional)" className="w-full rounded-md" rows={3}></textarea>
                </div>
                <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md">Cancel</button>
                    <button type="submit" disabled={isSaving} className="px-4 py-2 text-white bg-indigo-600 rounded-md disabled:bg-gray-400">
                        {isSaving ? 'Submitting...' : 'Submit Request'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default RequestModal;