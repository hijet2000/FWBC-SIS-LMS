import React, { useState } from 'react';
import Modal from '../ui/Modal';
import type { OverdueLoanDetails } from '../../types';

interface NoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  overdueLoans: OverdueLoanDetails[];
}

const NoticeModal: React.FC<NoticeModalProps> = ({ isOpen, onClose, onConfirm, overdueLoans }) => {
    const [isSending, setIsSending] = useState(false);

    const handleConfirm = async () => {
        setIsSending(true);
        await onConfirm();
        setIsSending(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Confirm Overdue Notices">
            <div className="p-6 space-y-4">
                <p>You are about to send overdue notices for <strong>{overdueLoans.length}</strong> loan(s).</p>
                <div className="max-h-48 overflow-y-auto bg-gray-50 p-2 rounded-md border text-sm">
                    <ul>
                        {overdueLoans.map(loan => (
                            <li key={loan.id}>{loan.memberName} - "{loan.bookTitle}"</li>
                        ))}
                    </ul>
                </div>
                <p className="text-xs text-gray-500">This is a mock action. In a real system, this would send templated emails or SMS messages.</p>
            </div>
            <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3">
                <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md">Cancel</button>
                <button
                    onClick={handleConfirm}
                    disabled={isSending}
                    className="px-4 py-2 text-white bg-indigo-600 rounded-md disabled:bg-gray-400"
                >
                    {isSending ? 'Sending...' : `Send ${overdueLoans.length} Notice(s)`}
                </button>
            </div>
        </Modal>
    );
};

export default NoticeModal;
