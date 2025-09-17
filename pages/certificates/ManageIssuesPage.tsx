
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { listIssuedCertificates, revokeCertificate } from '../../lib/certificateService';

const ManageIssuesPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [issues, setIssues] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = () => {
        setLoading(true);
        listIssuedCertificates()
            .then(setIssues)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleRevoke = async (issueId: string) => {
        if (!user || !window.confirm('Are you sure you want to revoke this certificate? This action cannot be undone.')) return;
        try {
            await revokeCertificate(issueId, user);
            addToast('Certificate revoked.', 'success');
            fetchData();
        } catch {
            addToast('Failed to revoke certificate.', 'error');
        }
    };
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Manage Issued Certificates</h1>
            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                 <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50"><tr>
                        <th className="p-3 text-left text-xs uppercase">Student</th>
                        <th className="p-3 text-left text-xs uppercase">Details</th>
                        <th className="p-3 text-left text-xs uppercase">Issue Date</th>
                        <th className="p-3 text-left text-xs uppercase">Verification Code</th>
                        <th className="p-3 text-right text-xs uppercase">Actions</th>
                    </tr></thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr> :
                        issues.map(iss => (
                            <tr key={iss.id}>
                                <td className="p-3 font-medium">{iss.studentName}</td>
                                <td className="p-3 text-sm">{iss.details}</td>
                                <td className="p-3 text-sm">{iss.issueDate}</td>
                                <td className="p-3 text-sm font-mono">{iss.verificationCode}</td>
                                <td className="p-3 text-right text-sm">
                                    <button onClick={() => handleRevoke(iss.id)} className="text-red-600 hover:underline">Revoke</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ManageIssuesPage;
