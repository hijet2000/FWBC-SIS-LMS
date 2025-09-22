import React, { useState } from 'react';
import type { User, InventoryItem, IssueRequest } from '../../types';
import * as inventoryService from '../../lib/inventoryService';
import Modal from '../ui/Modal';
import { useToast } from '../../contexts/ToastContext';

interface FulfillRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  actor: User;
  request: IssueRequest;
  item?: InventoryItem;
}

const FulfillRequestModal: React.FC<FulfillRequestModalProps> = ({ isOpen, onClose, onSaveSuccess, actor, request, item }) => {
    const { addToast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async () => {
        setIsSaving(true);
        try {
            await inventoryService.fulfillIssueRequest(request.id, actor);
            addToast('Request fulfilled and stock updated.', 'success');
            onSaveSuccess();
        } catch(err: any) {
            addToast(err.message || 'Fulfillment failed.', 'error');
        } finally {
            setIsSaving(false);
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Fulfill Issue Request">
            <div className="p-6 space-y-4">
                <p>You are about to fulfill the following request:</p>
                <div className="p-3 bg-gray-50 border rounded-md">
                    <p><strong>Item:</strong> {item?.name}</p>
                    <p><strong>Quantity:</strong> {request.quantity} {item?.unit}</p>
                </div>
                <p className="text-sm text-gray-500">This will create an 'OUT' transaction in the stock ledger for this item. This action cannot be undone.</p>
            </div>
            <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3">
                <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md">Cancel</button>
                <button onClick={handleSubmit} disabled={isSaving} className="px-4 py-2 text-white bg-blue-600 rounded-md disabled:bg-gray-400">
                    {isSaving ? 'Processing...' : 'Confirm Fulfillment'}
                </button>
            </div>
        </Modal>
    );
};

export default FulfillRequestModal;