import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import * as hrService from '../../lib/hrService';
import KpiCard from '../../components/dashboard/KpiCard';

const UsersIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m9 5.197a6 6 0 006-5.197M15 21a6 6 0 00-9-5.197" /></svg>
);
const CalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);
const BriefcaseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const HrDashboardPage: React.FC = () => {
    const { siteId } = useParams<{ siteId: string }>();
    const { addToast } = useToast();
    const [summary, setSummary] = useState({ totalEmployees: 0, onLeave: 0, pendingLeave: 0 });
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(() => {
        setLoading(true);
        hrService.getHrDashboardSummary()
            .then(setSummary)
            .catch(() => addToast('Failed to load dashboard data.', 'error'))
            .finally(() => setLoading(false));
    }, [addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">HR Dashboard</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KpiCard
                    title="Total Employees"
                    value={summary.totalEmployees}
                    icon={<UsersIcon className="h-6 w-6" />}
                    linkTo={`/school/${siteId}/hr/employees`}
                    loading={loading}
                    className="text-gray-800"
                />
                <KpiCard
                    title="Staff On Leave"
                    value={summary.onLeave}
                    icon={<BriefcaseIcon className="h-6 w-6" />}
                    linkTo={`/school/${siteId}/hr/leave`}
                    loading={loading}
                    className="text-amber-600"
                />
                <KpiCard
                    title="Pending Leave Requests"
                    value={summary.pendingLeave}
                    icon={<CalendarIcon className="h-6 w-6" />}
                    linkTo={`/school/${siteId}/hr/leave`}
                    loading={loading}
                    className="text-blue-600"
                />
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-700 mb-4">Coming Soon</h2>
                <p className="text-gray-500">Charts for department headcount and recent HR activity will be displayed here.</p>
            </div>
        </div>
    );
};

export default HrDashboardPage;
