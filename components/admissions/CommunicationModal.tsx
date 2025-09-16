import React, { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { listCommunicationTemplates, sendBulkCommunication } from '../../lib/admissionsService';
import type { CommunicationTemplate, User } from '../../types';
import Modal from '../ui/Modal';

interface CommunicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedApplicationIds: string[];
  actor: User;
}

const CommunicationModal: React.FC<CommunicationModalProps> = ({ isOpen, onClose, selectedApplicationIds, actor }) => {
    const { addToast } = useToast();
    const [templates, setTemplates] = useState<CommunicationTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        if (isOpen) {
            listCommunicationTemplates().then(data => {
                setTemplates(data);
                if (data.length > 0) {
                    setSelectedTemplate(data[0].id);
                }
            });
        }
    }, [isOpen]);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSending(true);
        try {
            await sendBulkCommunication(selectedApplicationIds, selectedTemplate, actor);
            addToast(`Communication sent to ${selectedApplicationIds.length} recipients.`, 'success');
            onClose();
        } catch {
            addToast('Failed to send communications.', 'error');
        } finally {
            setIsSending(false);
        }
    };
    
    const currentTemplate = templates.find(t => t.id === selectedTemplate);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Send Communication to ${selectedApplicationIds.length} Recipients`}>
            <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4">
                    <div>
                        <label htmlFor="template" className="block text-sm font-medium text-gray-700">Template</label>
                        <select id="template" value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)} className="w-full rounded-md mt-1">
                            {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                     {currentTemplate && (
                        <div className="p-3 bg-gray-50 border rounded-md text-xs text-gray-500">
                            <strong>Preview:</strong> {currentTemplate.body}
                        </div>
                    )}
                </div>
                <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md">Cancel</button>
                    <button type="submit" disabled={isSending} className="px-4 py-2 text-white bg-indigo-600 rounded-md disabled:bg-gray-400">
                        {isSending ? 'Sending...' : `Send to ${selectedApplicationIds.length}`}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default CommunicationModal;