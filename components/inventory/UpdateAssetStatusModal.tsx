import React, { useState } from 'react';
import type { User, Asset, AssetStatus } from '../../types';
import * as inventoryService from '../../lib/inventoryService';
import Modal from '../ui/Modal';

interface UpdateAssetStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  actor: User;
  asset: Asset;
}

const STATUS_OPTIONS: AssetStatus[] = ['In Stock', 'In Repair', 'Lost', 'Disposed'];

const UpdateAssetStatusModal: React.FC<UpdateAssetStatusModalProps> = ({ isOpen, onClose, onSaveSuccess, actor, asset }) => {
    const [status, setStatus] = useState<AssetStatus>('In Stock');
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await inventoryService.updateAssetStatus(asset.id, status, notes, actor);
            onSaveSuccess();
        } catch {
            // handle error
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Update Status for ${asset.id}`}>
            <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4">
                    <p>Current Status: <strong>{asset.status}</strong></p>
                    <select value={status} onChange={e => setStatus(e.target.value as AssetStatus)} className="w-full rounded-md">
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes / Reason (Optional)" className="w-full rounded-md" rows={3}></textarea>
                </div>
                <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md">Cancel</button>
                    <button type="submit" disabled={isSaving} className="px-4 py-2 text-white bg-indigo-600 rounded-md disabled:bg-gray-400">
                        {isSaving ? 'Updating...' : 'Update Status'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default UpdateAssetStatusModal;