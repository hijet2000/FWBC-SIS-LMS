import React from 'react';
import { useToast } from '../../contexts/ToastContext';
import Modal from '../ui/Modal';

type BiTool = 'Power BI' | 'Looker Studio' | 'Tableau' | 'Metabase';

interface BiConnectionModalProps {
    tool: BiTool;
    onClose: () => void;
}

const mockDetails = {
    server: 'bi.fwbc.school',
    port: 5432,
    database: 'fwbc_analytics_dw',
    user: 'bi_connector_user_tenant_123',
    password: 'mock_password_123_abc',
};

const InfoRow: React.FC<{ label: string; value: string | number; isSensitive?: boolean }> = ({ label, value, isSensitive = false }) => {
    const { addToast } = useToast();
    const handleCopy = () => {
        navigator.clipboard.writeText(String(value));
        addToast(`${label} copied to clipboard!`, 'success');
    };
    
    return (
        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
            <span className="font-medium text-sm text-gray-600">{label}:</span>
            <div className="flex items-center gap-2">
                <span className={`font-mono text-sm ${isSensitive ? 'blur-sm hover:blur-none' : ''}`}>{value}</span>
                <button onClick={handleCopy} className="text-gray-400 hover:text-gray-600" title={`Copy ${label}`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                </button>
            </div>
        </div>
    );
};


const BiConnectionModal: React.FC<BiConnectionModalProps> = ({ tool, onClose }) => {
    return (
        <Modal isOpen={true} onClose={onClose} title={`Connection Details for ${tool}`}>
            <div className="p-6 space-y-4">
                <p className="text-sm text-gray-500">Use the details below to connect your BI tool to the read-only data warehouse. Credentials are tenant-specific and should be stored securely.</p>
                <div className="space-y-2">
                    <InfoRow label="Server" value={mockDetails.server} />
                    <InfoRow label="Port" value={mockDetails.port} />
                    <InfoRow label="Database" value={mockDetails.database} />
                    <InfoRow label="Username" value={mockDetails.user} />
                    <InfoRow label="Password" value={mockDetails.password} isSensitive />
                </div>
                 <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs rounded-md">
                    <strong>Note:</strong> These are mock credentials for demonstration purposes. In a production environment, you would follow secure credential management practices like key rotation.
                </div>
            </div>
            <div className="bg-gray-50 px-6 py-3 flex justify-end">
                <button onClick={onClose} className="px-4 py-2 bg-indigo-600 text-white rounded-md">Close</button>
            </div>
        </Modal>
    );
};

export default BiConnectionModal;
