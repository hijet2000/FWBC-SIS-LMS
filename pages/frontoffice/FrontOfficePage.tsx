import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { getFrontOfficeSummary } from '../../lib/admissionsService';
import KpiCard from '../../components/dashboard/KpiCard';

const ClipboardIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
);
const IdentificationIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 012-2h2a2 2 0 012 2v1m-6 0h6" />
  </svg>
);
const PhoneIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
);
const CalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);


const FrontOfficePage: React.FC = () => {
    const { siteId } = useParams<{ siteId: string }>();
    const { addToast } = useToast();

    const [summary, setSummary] = useState({
        newEnquiries: 0,
        unresolvedVisitors: 0,
        openCalls: 0,
        dueFollowUps: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        getFrontOfficeSummary()
            .then(setSummary)
            .catch(() => addToast('Could not load dashboard data.', 'error'))
            .finally(() => setLoading(false));
    }, [addToast]);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Front Office Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard
                    title="New Enquiries (24h)"
                    value={summary.newEnquiries}
                    icon={<ClipboardIcon className="h-6 w-6" />}
                    linkTo={`/school/${siteId}/frontoffice/enquiries`}
                    loading={loading}
                    className="text-blue-600"
                />
                <KpiCard
                    title="Unresolved Visitors"
                    value={summary.unresolvedVisitors}
                    icon={<IdentificationIcon className="h-6 w-6" />}
                    linkTo={`/school/${siteId}/frontoffice/visitors`}
                    loading={loading}
                    className="text-red-600"
                />
                <KpiCard
                    title="Open Call Logs"
                    value={summary.openCalls}
                    icon={<PhoneIcon className="h-6 w-6" />}
                    linkTo={`/school/${siteId}/frontoffice/calls`}
                    loading={loading}
                    className="text-amber-600"
                />
                <KpiCard
                    title="Follow-ups Due Today"
                    value={summary.dueFollowUps}
                    icon={<CalendarIcon className="h-6 w-6" />}
                    linkTo={`/school/${siteId}/frontoffice/enquiries`}
                    loading={loading}
                    className="text-gray-800"
                />
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-700 mb-4">Quick Actions</h2>
                <div className="flex flex-wrap gap-4">
                    <Link to={`/school/${siteId}/frontoffice/enquiries`} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700">
                        New Enquiry
                    </Link>
                     <Link to={`/school/${siteId}/frontoffice/visitors`} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700">
                        Add Visitor
                    </Link>
                     <Link to={`/school/${siteId}/frontoffice/calls`} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700">
                        Log a Call
                    </Link>
                </div>
            </div>

        </div>
    );
};

export default FrontOfficePage;