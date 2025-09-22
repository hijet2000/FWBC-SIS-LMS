import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as certificateService from '../../lib/certificateService';
import type { IssuedCertificate, CertificateTemplate, CertificateStatus } from '../../types';
import { exportToCsv } from '../../lib/exporters';
import RevokeModal from '../../components/certificates/RevokeModal';
import { Link } from 'react-router-dom';

const statusStyles: Record<CertificateStatus, string> = {
    Valid: 'bg-green-100 text-green-800',
    Revoked: 'bg-red-100 text-red-800',
    Expired: 'bg-gray-100 text-gray-800',
};

const ManageIssuesPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [issues, setIssues] = useState<IssuedCertificate[]>([]);
    const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState<IssuedCertificate | null>(null);

    const fetchData = useCallback(() => {
        setLoading(true);
        Promise.all([
            certificateService.listIssuedCertificates(),
            certificateService.getTemplates()
        ]).then(([issueData, templateData]) => {
            setIssues(issueData);
            setTemplates(templateData);
        }).catch(() => addToast('Failed to load data.', 'error'))
          .finally(() => setLoading(false));
    }, [addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRevokeClick = (issue: IssuedCertificate) => {
        setSelectedIssue(issue);
        setIsModalOpen(true);
    };

    const handleRevokeConfirm = async (reason: string) => {
        if (!selectedIssue || !user) return;
        try {
            await certificateService.revokeCertificate(selectedIssue.id, reason, user);
            addToast('Certificate revoked successfully.', 'success');
            fetchData();
        } catch {
            addToast('Failed to revoke certificate.', 'error');
        } finally {
            setIsModalOpen(false);
            setSelectedIssue(null);
        }
    };

    const templateMap = useMemo(() => new Map(templates.map(t => [t.id, t])), [templates]);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Manage Issued Certificates & IDs</h1>
            
            {selectedIssue && (
                <RevokeModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onConfirm={handleRevokeConfirm}
                    issue={selectedIssue}
                />
            )}

            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-3 text-left text-xs uppercase">Holder</th>
                            <th className="p-3 text-left text-xs uppercase">Type</th>
                            <th className="p-3 text-left text-xs uppercase">Serial No.</th>
                            <th className="p-3 text-left text-xs uppercase">Status</th>
                            <th className="p-3 text-left text-xs uppercase">Issued</th>
                            <th className="p-3 text-right text-xs uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? <tr><td colSpan={6} className="p-4 text-center">Loading...</td></tr> :
                        issues.map(issue => {
                            const template = templateMap.get(issue.templateId);
                            return (
                                <tr key={issue.id}>
                                    <td className="p-3 font-medium">{issue.holderName}</td>
                                    <td className="p-3 text-sm">{template?.name || 'Unknown'}</td>
                                    <td className="p-3 text-sm font-mono">{issue.serialNo}</td>
                                    <td className="p-3 text-sm">
                                        <span className={`px-2 py-1 text-xs rounded-full ${statusStyles[issue.status]}`}>{issue.status}</span>
                                    </td>
                                    <td className="p-3 text-sm">{new Date(issue.issuedAt).toLocaleDateString()}</td>
                                    <td className="p-3 text-right text-sm font-medium space-x-2">
                                        <Link to={`/verify/${issue.serialNo}`} target="_blank" className="text-blue-600 hover:underline">Verify</Link>
                                        {issue.status === 'Valid' && (
                                            <button onClick={() => handleRevokeClick(issue)} className="text-red-600 hover:underline">Revoke</button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ManageIssuesPage;