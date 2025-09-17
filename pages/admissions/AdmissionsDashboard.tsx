
import React, { useState, useEffect, useMemo } from 'react';
import { listEnquiries, listApplications } from '../../lib/admissionsService';
import type { Enquiry, Application, ApplicationStatus } from '../../types';

const KpiCard: React.FC<{ title: string; value: string | number; description: string }> = ({ title, value, description }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="mt-2 text-3xl font-bold text-gray-800">{value}</p>
        <p className="mt-1 text-xs text-gray-500">{description}</p>
    </div>
);

const AdmissionsDashboard: React.FC = () => {
    const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [enqData, appData] = await Promise.all([listEnquiries(), listApplications()]);
                setEnquiries(enqData);
                setApplications(appData);
            } catch {
                console.error("Failed to load admissions data");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const kpis = useMemo(() => {
        const totalEnquiries = enquiries.length;
        // FIX: Active enquiries are those that are not yet 'Converted' or 'Closed'.
        const activeEnquiries = enquiries.filter(e => e.status !== 'Converted' && e.status !== 'Closed').length;
        const totalApps = applications.length;
        const approvedApps = applications.filter(a => a.status === 'Approved').length;
        const conversionRate = totalEnquiries > 0 ? (applications.filter(a => a.enquiryId).length / totalEnquiries) * 100 : 0;
        
        return {
            totalEnquiries,
            activeEnquiries,
            totalApps,
            approvedApps,
            conversionRate: conversionRate.toFixed(1) + '%',
        };
    }, [enquiries, applications]);

    const appStatusCounts = useMemo(() => {
        // FIX: Initialize only a subset of statuses for the funnel view.
        // Using Partial<> and checking for property existence prevents runtime errors
        // for applications with statuses not displayed on the dashboard.
        const counts: Partial<Record<ApplicationStatus, number>> = { New: 0, Screening: 0, Approved: 0, Rejected: 0, Waitlist: 0 };
        applications.forEach(app => {
            // FIX: Use hasOwnProperty to correctly increment counts, as a count of 0 is falsy.
            if (counts.hasOwnProperty(app.status)) {
                counts[app.status]!++;
            }
        });
        return counts;
    }, [applications]);

    if (loading) return <div className="text-center p-8">Loading admissions dashboard...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Admissions Dashboard</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard title="Total Enquiries" value={kpis.totalEnquiries} description={`${kpis.activeEnquiries} active`} />
                <KpiCard title="Total Applications" value={kpis.totalApps} description={`${kpis.approvedApps} approved`} />
                <KpiCard title="Enquiry → App Rate" value={kpis.conversionRate} description="Conversion rate" />
                 <KpiCard title="Approved Students" value={kpis.approvedApps} description="In this intake" />
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-lg font-semibold text-gray-700 mb-4">Application Funnel</h2>
                <div className="flex items-end justify-around text-center space-x-2">
                    {Object.entries(appStatusCounts).map(([status, count]) => (
                         <div key={status} className="flex flex-col items-center">
                            <div className="bg-indigo-500 text-white rounded-t-lg px-4 py-2 w-24" style={{ height: `${Math.max(20, (count || 0) * 20)}px`, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                                <span className="font-bold text-lg">{count}</span>
                            </div>
                            <div className="text-xs font-medium text-gray-600 uppercase mt-2 w-24 break-words">{status}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdmissionsDashboard;
