import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as admissionsService from '../../lib/admissionsService';
import { getClasses } from '../../lib/schoolService';
import type { Application, ApplicationStatus, SchoolClass } from '../../types';

const KpiCard: React.FC<{ title: string; value: string | number; className?: string }> = ({ title, value, className = '' }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className={`mt-1 text-3xl font-bold ${className}`}>{value}</p>
    </div>
);

const statusStyles: Record<ApplicationStatus, string> = {
    Offer: 'bg-indigo-100 text-indigo-800',
    Accepted: 'bg-green-100 text-green-800',
    Approved: 'bg-teal-100 text-teal-800',
    New: '', Screening: '', DocsMissing: '', Interview: '', Rejected: '', Waitlist: '', Withdrawn: '',
};


const OffersPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();

    const [applications, setApplications] = useState<Application[]>([]);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [summary, setSummary] = useState({ pending: 0, accepted: 0, approved: 0 });
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(() => {
        setLoading(true);
        Promise.all([
            admissionsService.listApplications(),
            admissionsService.getOffersSummary(),
            getClasses(),
        ]).then(([appData, summaryData, classData]) => {
            setApplications(appData);
            setSummary(summaryData);
            setClasses(classData);
        }).catch(() => addToast('Failed to load data.', 'error'))
          .finally(() => setLoading(false));
    }, [addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleApprove = async (applicationId: string) => {
        if (!user) return;
        try {
            const result = await admissionsService.approveApplication(applicationId, user);
            addToast(`Approved! Student record created with Admission No: ${result.admissionNo}`, 'success');
            fetchData(); // Refresh all data
        } catch (err: any) {
            addToast(err.message || 'Failed to approve application.', 'error');
        }
    };

    const filteredApplications = useMemo(() => {
        return applications.filter(app => ['Offer', 'Accepted', 'Approved'].includes(app.status));
    }, [applications]);

    const classMap = useMemo(() => new Map(classes.map(c => [c.id, c.name])), [classes]);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Offers & Acceptance</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KpiCard title="Pending Offers" value={summary.pending} className="text-indigo-600" />
                <KpiCard title="Accepted (Pending Approval)" value={summary.accepted} className="text-green-600" />
                <KpiCard title="Approved (Seats Filled)" value={summary.approved} className="text-teal-600" />
            </div>

            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase">Applicant</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase">Class</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase">Offer Expiry</th>
                            <th className="px-4 py-3 text-right text-xs font-medium uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr> :
                        filteredApplications.map(app => (
                            <tr key={app.id}>
                                <td className="px-4 py-4 font-medium">{app.applicantName}</td>
                                <td className="px-4 py-4 text-sm text-gray-600">{classMap.get(app.desiredClassId) || 'N/A'}</td>
                                <td className="px-4 py-4">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[app.status]}`}>
                                        {app.status}
                                    </span>
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-600">{app.decisionDetails.offerExpiresAt || 'N/A'}</td>
                                <td className="px-4 py-4 text-right">
                                    {app.status === 'Accepted' && (
                                        <button 
                                            onClick={() => handleApprove(app.id)}
                                            className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded-md shadow-sm hover:bg-green-700"
                                        >
                                            Approve & Create Student
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default OffersPage;