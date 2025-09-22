import React, { useState, useEffect } from 'react';
import type { Supplier, User } from '../../types';
import * as inventoryService from '../../lib/inventoryService';
import Modal from '../ui/Modal';

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  initialData: Supplier | null;
  actor: User;
}

const SupplierModal: React.FC<SupplierModalProps> = ({ isOpen, onClose, onSaveSuccess, initialData, actor }) => {
    const [formData, setFormData] = useState({
        name: '', contactPerson: '', phone: '', email: '', address: '', active: true
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setFormData(initialData ? {
                name: initialData.name,
                contactPerson: initialData.contactPerson || '',
                phone: initialData.phone || '',
                email: initialData.email || '',
                address: initialData.address || '',
                active: initialData.active,
            } : {
                name: '', contactPerson: '', phone: '', email: '', address: '', active: true
            });
            setError('');
        }
    }, [isOpen, initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setError('Supplier Name is required.');
            return;
        }
        setIsSaving(true);
        try {
            if (initialData) {
                await inventoryService.updateSupplier(initialData.id, formData, actor);
            } else {
                await inventoryService.createSupplier(formData, actor);
            }
            onSaveSuccess();
        } catch {
            setError('Failed to save supplier.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Supplier' : 'Add New Supplier'}>
            <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4">
                    {error && <p className="text-red-600 text-sm">{error}</p>}
                    <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Supplier Name" className="w-full rounded-md" required />
                    <input value={formData.contactPerson} onChange={e => setFormData({ ...formData, contactPerson: e.target.value })} placeholder="Contact Person (Optional)" className="w-full rounded-md" />
                    <div className="grid grid-cols-2 gap-4">
                        <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="Phone (Optional)" className="w-full rounded-md" />
                        <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="Email (Optional)" className="w-full rounded-md" />
                    </div>
                    <textarea value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="Address (Optional)" className="w-full rounded-md" rows={2}></textarea>
                </div>
                <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md">Cancel</button>
                    <button type="submit" disabled={isSaving} className="px-4 py-2 text-white bg-indigo-600 rounded-md disabled:bg-gray-400">{isSaving ? 'Saving...' : 'Save Supplier'}</button>
                </div>
            </form>
        </Modal>
    );
};

export default SupplierModal;