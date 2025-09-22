import React, { useState, useMemo } from 'react';
import type { Application, User } from '../../types';
import { sendCommunication } from '../../lib/admissionsService';
import Modal from '../ui/Modal';
import { useToast } from '../../contexts/ToastContext';

interface CommunicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  applications: Application[];
  actor: User;
}

const TEMPLATES = {
    'application-received': {
        name: 'Application Received',
        body: 'Dear {{guardianName}},\n\nThank you for submitting an application for {{applicantName}}. We have received it and will be in touch shortly with the next steps.\n\nSincerely,\nThe Admissions Team',
    },
    'docs-request': {
        name: 'Document Request',
        body: 'Dear {{guardianName}},\n\nRegarding the application for {{applicantName}}, we require some additional documentation. Please log in to the parent portal to see the full list.\n\nSincerely,\nThe Admissions Team',
    },
    'interview-invite': {
        name: 'Interview Invitation',
        body: 'Dear {{guardianName}},\n\nWe are pleased to invite {{applicantName}} for an interview on {{interviewDate}}.\n\nPlease confirm your attendance.\n\nSincerely,\nThe Admissions Team',
    },
    'offer-letter': {
        name: 'Offer of Place',
        body: 'Dear {{guardianName}},\n\nCongratulations! We are delighted to offer {{applicantName}} a place at our school. Please respond to this offer by {{offerExpiry}}.\n\nSincerely,\nThe Admissions Team',
    },
};

const CommunicationModal: React.FC<CommunicationModalProps> = ({ isOpen, onClose, onSaveSuccess, applications, actor }) => {
    const { addToast } = useToast();
    const [templateId, setTemplateId] = useState<keyof typeof TEMPLATES>('application-received');
    const [isSending, setIsSending] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSending(true);
        try {
            const appIds = applications.map(app => app.id);
            const { queued } = await sendCommunication(templateId, appIds, actor);
            if (queued) {
                addToast('Message queued to send outside of quiet hours.', 'info');
            } else {
                addToast('Message sent successfully!', 'success');
            }
            onSaveSuccess();
        } catch {
            addToast('Failed to send communication.', 'error');
        } finally {
            setIsSending(false);
        }
    };
    
    const previewText = useMemo(() => {
        const firstApp = applications[0];
        if (!firstApp) return TEMPLATES[templateId].body;

        return TEMPLATES[templateId].body
            .replace('{{guardianName}}', firstApp.guardians[0]?.name || '[Guardian Name]')
            .replace('{{applicantName}}', firstApp.applicantName || '[Applicant Name]');
    }, [templateId, applications]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Send Communication to ${applications.length} Applicants`}>
            <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4">
                    <div>
                        <label htmlFor="template" className="block text-sm font-medium text-gray-700">Template</label>
                        <select
                            id="template"
                            value={templateId}
                            onChange={e => setTemplateId(e.target.value as keyof typeof TEMPLATES)}
                            className="mt-1 block w-full rounded-md border-gray-300"
                        >
                            {Object.entries(TEMPLATES).map(([id, { name }]) => (
                                <option key={id} value={id}>{name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Preview (for first recipient)</label>
                        <div className="mt-1 p-3 bg-gray-50 border rounded-md text-sm text-gray-600 whitespace-pre-wrap h-48 overflow-y-auto">
                            {previewText}
                        </div>
                    </div>
                </div>
                <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md">Cancel</button>
                    <button type="submit" disabled={isSending} className="px-4 py-2 text-white bg-indigo-600 rounded-md disabled:bg-gray-400">
                        {isSending ? 'Sending...' : `Send to ${applications.length}`}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default CommunicationModal;