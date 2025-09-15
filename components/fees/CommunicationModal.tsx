import React, { useState } from 'react';
import type { Invoice } from '../../types';
import Modal from '../ui/Modal';
import Toast from '../ui/Toast';

interface CommunicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: Invoice[]; // The selected invoices to send communications for
}

const CommunicationModal: React.FC<CommunicationModalProps> = ({ isOpen, onClose, invoices }) => {
    const [template, setTemplate] = useState('reminder');
    const [isSending, setIsSending] = useState(false);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSending(true);
        // Simulate API call
        await new Promise(res => setTimeout(res, 1000));
        console.log(`Sending '${template}' to ${invoices.length} recipients.`);
        setIsSending(false);
        setToast({ message: 'Communications sent successfully!', type: 'success' });
        setTimeout(() => {
            setToast(null);
            onClose();
        }, 1500);
    };

    return (
        <>
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}
            <Modal isOpen={isOpen} onClose={onClose} title={`Send Communication to ${invoices.length} Recipients`}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <p className="text-sm text-gray-600">You are about to send a bulk communication. Please select a template and confirm.</p>
                        <div>
                            <label htmlFor="template" className="block text-sm font-medium text-gray-700">Template</label>
                            <select id="template" value={template} onChange={e => setTemplate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                                <option value="reminder">Payment Reminder</option>
                                <option value="overdue_notice">Overdue Notice</option>
                                <option value="statement">Account Statement</option>
                            </select>
                        </div>
                        <div className="p-3 bg-gray-50 border rounded-md text-xs text-gray-500">
                            <strong>Preview:</strong> This is a mock preview. The selected template will be sent to the primary contact for each student associated with the selected invoices.
                        </div>
                    </div>
                    <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border">Cancel</button>
                        <button type="submit" disabled={isSending} className="px-4 py-2 text-white bg-indigo-600 rounded-md disabled:bg-gray-400">
                            {isSending ? 'Sending...' : `Send to ${invoices.length}`}
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
};

export default CommunicationModal;
