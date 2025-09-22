import React, { useState } from 'react';
import type { User, InventoryItem } from '../../types';
import * as inventoryService from '../../lib/inventoryService';
import Modal from '../ui/Modal';

interface MintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  actor: User;
  trackableItems: InventoryItem[];
}

const MintModal: React.FC<MintModalProps> = ({ isOpen, onClose, onSaveSuccess, actor, trackableItems }) => {
    const [formData, setFormData] = useState({ itemId: '', quantity: 1 });
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
            await inventoryService.mintAssets(formData.itemId, formData.quantity, actor);
            onSaveSuccess();
        } catch {
            setError('Failed to mint assets.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Mint New Assets">
            <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4">
                    {error && <p className="text-red-600 text-sm">{error}</p>}
                    <select value={formData.itemId} onChange={e => setFormData({ ...formData, itemId: e.target.value })} className="w-full rounded-md" required>
                        <option value="">-- Select Trackable Item --</option>
                        {trackableItems.map(item => <option key={item.id} value={item.id}>{item.name} ({item.sku})</option>)}
                    </select>
                    <input type="number" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })} placeholder="Quantity to Mint" className="w-full rounded-md" required min="1" />
                </div>
                <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md">Cancel</button>
                    <button type="submit" disabled={isSaving} className="px-4 py-2 text-white bg-indigo-600 rounded-md disabled:bg-gray-400">
                        {isSaving ? 'Minting...' : 'Mint Assets'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default MintModal;