
import React, { useState, useEffect } from 'react';
import type { InventoryItem, User, ItemUnit } from '../../types';
import * as inventoryService from '../../lib/inventoryService';
import Modal from '../ui/Modal';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  initialData: InventoryItem | null;
  actor: User;
  categories: string[];
}

const ItemModal: React.FC<ItemModalProps> = ({ isOpen, onClose, onSaveSuccess, initialData, actor, categories }) => {
    const [formData, setFormData] = useState({
        name: '', sku: '', unit: 'Pcs' as ItemUnit, category: '', reorderLevel: 0, reorderQty: 0,
        location: '', trackAsset: false, photoUrl: '', active: true
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            // FIX: Explicitly map properties from `initialData` to ensure optional fields have default values,
            // matching the inferred type of the `formData` state.
            setFormData(initialData ? {
                name: initialData.name,
                sku: initialData.sku,
                unit: initialData.unit,
                category: initialData.category,
                reorderLevel: initialData.reorderLevel,
                reorderQty: initialData.reorderQty,
                location: initialData.location || '',
                trackAsset: initialData.trackAsset,
                photoUrl: initialData.photoUrl || '',
                active: initialData.active,
            } : {
                name: '', sku: '', unit: 'Pcs', category: '', reorderLevel: 0, reorderQty: 0,
                location: '', trackAsset: false, photoUrl: '', active: true
            });
            setError('');
        }
    }, [isOpen, initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.category.trim()) {
            setError('Name and Category are required.');
            return;
        }
        setIsSaving(true);
        try {
            const payload = {
                ...formData,
                reorderLevel: Number(formData.reorderLevel),
                reorderQty: Number(formData.reorderQty),
            };
            if (initialData) {
                await inventoryService.updateItem(initialData.id, payload, actor);
            } else {
                await inventoryService.createItem(payload, actor);
            }
            onSaveSuccess();
        } catch {
            setError('Failed to save item.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Item' : 'Add New Item'}>
            <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    {error && <p className="text-red-600 text-sm">{error}</p>}
                    <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Item Name" className="w-full rounded-md" required />
                    <input value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} placeholder="SKU (auto-generated if blank)" className="w-full rounded-md" />
                    <div className="grid grid-cols-2 gap-4">
                        <input value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="Category" list="categories" className="w-full rounded-md" required />
                        <datalist id="categories">{categories.map(c => <option key={c} value={c} />)}</datalist>
                        <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value as ItemUnit})} className="w-full rounded-md">
                            {(['Pcs', 'Box', 'Kg', 'Litre', 'Set', 'Other'] as ItemUnit[]).map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <input type="number" value={formData.reorderLevel} onChange={e => setFormData({...formData, reorderLevel: Number(e.target.value)})} placeholder="Reorder Level" className="w-full rounded-md" />
                        <input type="number" value={formData.reorderQty} onChange={e => setFormData({...formData, reorderQty: Number(e.target.value)})} placeholder="Reorder Quantity" className="w-full rounded-md" />
                    </div>
                    <input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="Storage Location (e.g., IT Store)" className="w-full rounded-md" />
                    <input value={formData.photoUrl} onChange={e => setFormData({...formData, photoUrl: e.target.value})} placeholder="Photo URL (Optional)" className="w-full rounded-md" />
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2"><input id="trackAsset" type="checkbox" checked={formData.trackAsset} onChange={e => setFormData({...formData, trackAsset: e.target.checked})} className="rounded" /><label htmlFor="trackAsset">Trackable Asset</label></div>
                        <div className="flex items-center gap-2"><input id="active" type="checkbox" checked={formData.active} onChange={e => setFormData({...formData, active: e.target.checked})} className="rounded" /><label htmlFor="active">Active</label></div>
                    </div>
                </div>
                <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md">Cancel</button>
                    <button type="submit" disabled={isSaving} className="px-4 py-2 text-white bg-indigo-600 rounded-md disabled:bg-gray-400">{isSaving ? 'Saving...' : 'Save Item'}</button>
                </div>
            </form>
        </Modal>
    );
};

export default ItemModal;
