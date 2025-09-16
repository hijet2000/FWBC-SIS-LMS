import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { listApplications } from '../../lib/admissionsService';
import { getClasses } from '../../lib/schoolService';
import type { Application, SchoolClass } from '../../types';

const calculateDaysLeft = (expiryDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Compare dates only
    const expiry = new Date(expiryDate);
     expiry.setMinutes(expiry.getMinutes() + expiry.getTimezoneOffset()); // Adjust for timezone
    if (isNaN(expiry.getTime())) return { days: null, text: 'Invalid Date' };
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { days: diffDays, text: `Expired ${-diffDays}d ago`, className: 'text-red-600' };
    if (diffDays <= 7) return { days: diffDays, text: `${diffDays}d left`, className: 'text-yellow-600' };
    return { days: diffDays, text: `${diffDays}d left`, className: 'text-gray-500' };
};

const OffersPage: React.FC = () => {
    const { siteId } = useParams<{ siteId: string }>();
    const { addToast } = useToast();
    const [applications, setApplications] = useState<Application[]>([]);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        Promise.all([listApplications(), getClasses()])
            .then(([appData, classData]) => {
                setApplications(appData.filter(a => a.status === 'Offer' || a.status === 'Accepted'));
                setClasses(classData);
            })
            .catch(() => addToast('Failed to load offers.', 'error'))
            .finally(() => setLoading(false));
    }, [addToast]);

    const classMap = useMemo(() => new Map(classes.map(c => [c.id, c.name])), [classes]);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Offers & Acceptance</h1>
             <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-3 text-left text-xs uppercase">Applicant</th>
                            <th className="p-3 text-left text-xs uppercase">Class</th>
                            <th className="p-3 text-left text-xs uppercase">Status</th>
                            <th className="p-3 text-left text-xs uppercase">Offer Expiry</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? <tr><td colSpan={4} className="p-4 text-center">Loading...</td></tr> :
                        applications.map(app => {
                            const expiry = app.decisionDetails.offerExpiresAt ? calculateDaysLeft(app.decisionDetails.offerExpiresAt) : null;
                            return(
                            <tr key={app.id}>
                                <td className="p-3 text-sm font-medium">
                                    <Link to={`/school/${siteId}/admissions/applications/${app.id}`} className="text-indigo-600 hover:underline">
                                        {app.applicantName}
                                    </Link>
                                </td>
                                <td className="p-3 text-sm">{classMap.get(app.desiredClassId)}</td>
                                <td className="p-3 text-sm"><span className={`px-2 py-1 text-xs rounded-full ${app.status === 'Offer' ? 'bg-indigo-100 text-indigo-800' : 'bg-green-100 text-green-800'}`}>{app.status}</span></td>
                                <td className={`p-3 text-sm ${expiry?.className}`}>{expiry?.text || 'N/A'}</td>
                            </tr>
                        )})}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default OffersPage;