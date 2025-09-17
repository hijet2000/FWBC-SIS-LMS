
import React, { useState, useEffect } from 'react';
import { listIssuedCertificates, listTemplates } from '../../lib/certificateService';

const KpiCard: React.FC<{ title: string; value: string | number }> = ({ title, value }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="mt-2 text-4xl font-bold text-gray-800">{value}</p>
    </div>
);

const CertificatesDashboardPage: React.FC = () => {
    const [stats, setStats] = useState({ templates: 0, issued: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            listTemplates(),
            listIssuedCertificates(),
        ]).then(([tplData, issData]) => {
            setStats({
                templates: tplData.length,
                issued: issData.length,
            });
        }).finally(() => setLoading(false));
    }, []);

    if (loading) return <p>Loading dashboard...</p>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Certificates Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KpiCard title="Total Templates" value={stats.templates} />
                <KpiCard title="Total Issued" value={stats.issued} />
            </div>
             <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-lg font-semibold">Quick Actions</h2>
                <div className="mt-4 flex gap-4">
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-md">Issue Batch</button>
                    <button className="px-4 py-2 bg-white border rounded-md">New Template</button>
                </div>
            </div>
        </div>
    );
};

export default CertificatesDashboardPage;
