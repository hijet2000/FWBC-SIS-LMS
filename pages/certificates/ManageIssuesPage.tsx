import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { listIssuedCertificates, revokeIssue } from '../../lib/certificateService';
import { IssuedCertificate, IssueStatus } from '../../types';
import Modal from '../../components/ui/Modal';

const ManageIssuesPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [issues, setIssues] = useState<IssuedCertificate[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ q: '', status: '' });
    const [revokingIssue, setRevokingIssue] = useState<IssuedCertificate | null>(null);
    const [revocationReason, setRevocationReason] = useState('');

    const fetchData = () => {
        setLoading(true);
        listIssuedCertificates()
            .then(setIssues)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleRevoke = async () => {
        if (!user || !revokingIssue || !revocationReason) return;
        try {
            await revokeIssue(revokingIssue.id, revocationReason, user);
            addToast('Certificate revoked.', 'success');
            fetchData();
        } catch {
            addToast('Failed to revoke certificate.', 'error');
        } finally {
            setRevokingIssue(null);
            setRevocationReason('');
        }
    };
    
    const filteredIssues = useMemo(() => {
        return issues.filter(iss => {
            const matchesQuery = iss.studentName.toLowerCase().includes(filter.q.toLowerCase()) || iss.serialNumber.includes(filter.q);
            const matchesStatus = filter.status ? iss.status === filter.status : true;
            return matchesQuery && matchesStatus;
        });
    }, [issues, filter]);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Manage Issued Certificates</h1>
            <div className="bg-white p-4 rounded-lg shadow-sm border flex gap-4">
                <input type="search" value={filter.q} onChange={e => setFilter({...filter, q: e.target.value})} placeholder="Search name or serial..." className="w-full rounded-md"/>
                <select value={filter.status} onChange={e => setFilter({...filter, status: e.target.value})} className="w-1/3 rounded-md">
                    <option value="">All Statuses</option>
                    {(['Issued', 'Revoked', 'Expired'] as IssueStatus[]).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                 <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50"><tr>
                        <th className="p-3 text-left text-xs uppercase">Student</th>
                        <th className="p-3 text-left text-xs uppercase">Serial Number</th>
                        <th className="p-3 text-left text-xs uppercase">Details</th>
                        <th className="p-3 text-left text-xs uppercase">Status</th>
                        <th className="p-3 text-right text-xs uppercase">Actions</th>
                    </tr></thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr> :
                        filteredIssues.map(iss => (
                            <tr key={iss.id}>
                                <td className="p-3 font-medium">{iss.studentName}</td>
                                <td className="p-3 text-sm font-mono">{iss.serialNumber}</td>
                                <td className="p-3 text-sm">{iss.details.main}</td>
                                <td className="p-3 text-sm">
                                    <span className={`px-2 py-1 text-xs rounded-full ${iss.status === 'Issued' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{iss.status}</span>
                                    {iss.revocation && <p className="text-xs text-gray-500" title={iss.revocation.reason}>({iss.revocation.reason})</p>}
                                </td>
                                <td className="p-3 text-right text-sm">
                                    {iss.status === 'Issued' && <button onClick={() => setRevokingIssue(iss)} className="text-red-600 font-medium">Revoke</button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {revokingIssue && (
                <Modal isOpen={!!revokingIssue} onClose={() => setRevokingIssue(null)} title={`Revoke Certificate for ${revokingIssue.studentName}`}>
                    <div className="p-6 space-y-4">
                        <textarea value={revocationReason} onChange={e => setRevocationReason(e.target.value)} placeholder="Reason for revocation..." className="w-full rounded-md" required/>
                    </div>
                    <div className="bg-gray-50 px-6 py-3 flex justify-end gap-2">
                        <button onClick={() => setRevokingIssue(null)} className="px-4 py-2 border rounded-md">Cancel</button>
                        <button onClick={handleRevoke} className="px-4 py-2 text-white bg-red-600 rounded-md">Confirm Revocation</button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default ManageIssuesPage;