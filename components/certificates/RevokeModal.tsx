import React, { useState } from 'react';
import Modal from '../ui/Modal';
import type { IssuedCertificate } from '../../types';

interface RevokeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  issue: IssuedCertificate;
}

const RevokeModal: React.FC<RevokeModalProps> = ({ isOpen, onClose, onConfirm, issue }) => {
    const [reason, setReason] = useState('');

    const handleConfirm = () => {
        if (reason.trim()) {
            onConfirm(reason);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Revoke Certificate ${issue.serialNo}`}>
            <div className="p-6 space-y-4">
                <p>Are you sure you want to revoke this certificate for <strong>{issue.holderName}</strong>? This action cannot be undone.</p>
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter reason for revocation (required)"
                    className="w-full p-2 border rounded-md"
                    rows={3}
                    required
                />
            </div>
            <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3">
                <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md">Cancel</button>
                <button
                    onClick={handleConfirm}
                    disabled={!reason.trim()}
                    className="px-4 py-2 text-white bg-red-600 rounded-md disabled:bg-gray-400"
                >
                    Confirm Revocation
                </button>
            </div>
        </Modal>
    );
};

export default RevokeModal;
