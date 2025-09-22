import React, { useState } from 'react';
import Modal from '../ui/Modal';

interface OverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  reasonText: string;
}

const OverrideModal: React.FC<OverrideModalProps> = ({ isOpen, onClose, onConfirm, reasonText }) => {
    const [overrideReason, setOverrideReason] = useState('');
    
    const handleConfirm = () => {
        if (overrideReason.trim()) {
            onConfirm(overrideReason);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Policy Override Required">
            <div className="p-6 space-y-4">
                <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700">
                    <h4 className="font-bold">Policy Violation Detected</h4>
                    <p className="text-sm">{reasonText}</p>
                </div>
                <p>Please provide a reason to override this policy and complete the action.</p>
                <textarea
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="Enter reason for override..."
                    className="w-full p-2 border rounded-md"
                    rows={3}
                />
            </div>
            <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3">
                <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md">Cancel</button>
                <button
                    onClick={handleConfirm}
                    disabled={!overrideReason.trim()}
                    className="px-4 py-2 text-white bg-red-600 rounded-md disabled:bg-gray-400"
                >
                    Confirm Override
                </button>
            </div>
        </Modal>
    );
};

export default OverrideModal;