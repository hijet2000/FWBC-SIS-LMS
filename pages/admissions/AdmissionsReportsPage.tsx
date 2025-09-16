import React, { useState, useEffect, useMemo } from 'react';
import { listEnquiries, listApplications } from '../../lib/admissionsService';
import type { Enquiry, Application } from '../../types';
import { exportToCsv } from '../../lib/exporters';

const KpiCard: React.FC<{ title: string; value: string | number; }> = ({ title, value }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="mt-1 text-3xl font-bold text-gray-800">{value}</p>
    </div>
);

const AdmissionsReportsPage: React.FC = () => {
    const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        Promise.all([listEnquiries(), listApplications()])
            .then(([enqData, appData]) => {
                setEnquiries(enqData);
                setApplications(appData);
            }).finally(() => setLoading(false));
    }, []);

    const funnelData = useMemo(() => {
        const enqCount = enquiries.length;
        const appCount = applications.length;
        const offerCount = applications.filter(a => ['Offer', 'Accepted', 'Approved'].includes(a.status)).length;
        const acceptedCount = applications.filter(a => ['Accepted', 'Approved'].includes(a.status)).length;
        return [
            { stage: 'Enquiries', count: enqCount },
            { stage: 'Applications', count: appCount },
            { stage: 'Offers Made', count: offerCount },
            { stage: 'Accepted', count: acceptedCount },
        ];
    }, [enquiries, applications]);
    
    const handleExport = () => {
        exportToCsv('admissions_funnel.csv', [{ key: 'stage', label: 'Stage' }, { key: 'count', label: 'Count' }], funnelData);
    };

    if (loading) return <div className="text-center p-8">Loading reports...</div>;

    const maxCount = Math.max(...funnelData.map(d => d.count), 1);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Admissions Reports</h1>
                <button onClick={handleExport} className="px-4 py-2 bg-white border rounded-md">Export Funnel</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {funnelData.map(d => <KpiCard key={d.stage} title={d.stage} value={d.count} />)}
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-lg font-semibold mb-4">Admissions Funnel</h2>
                <div className="space-y-4">
                    {funnelData.map(({ stage, count }) => (
                        <div key={stage} className="flex items-center gap-4">
                            <span className="w-32 text-sm font-medium text-gray-600">{stage}</span>
                            <div className="flex-grow bg-gray-200 rounded-full h-6">
                                <div className="bg-indigo-600 h-6 rounded-full text-white text-xs font-bold flex items-center justify-end pr-2" style={{ width: `${(count / maxCount) * 100}%` }}>
                                    {count}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdmissionsReportsPage;