


import React, { useState, useEffect, useMemo } from 'react';
import { listEnquiries, listApplications, getSeatAllocations } from '../../lib/admissionsService';
import { getClasses } from '../../lib/schoolService';
import type { Enquiry, Application, SeatAllocation, SchoolClass } from '../../types';
import { exportToCsv } from '../../lib/exporters';

// A simple card for report sections
const ReportCard: React.FC<{ title: string; children: React.ReactNode; onExport?: () => void }> = ({ title, children, onExport }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-700">{title}</h2>
            {onExport && <button onClick={onExport} className="px-3 py-1 text-xs font-medium bg-white border rounded-md shadow-sm hover:bg-gray-50">Export CSV</button>}
        </div>
        {children}
    </div>
);


const AdmissionsReportsPage: React.FC = () => {
    const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
    const [applications, setApplications] = useState<Application[]>([]);
    const [allocations, setAllocations] = useState<SeatAllocation[]>([]);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            listEnquiries(), 
            listApplications(),
            getSeatAllocations(),
            getClasses()
        ]).then(([enqData, appData, allocData, classData]) => {
            setEnquiries(enqData);
            setApplications(appData);
            setAllocations(allocData);
            setClasses(classData);
        }).finally(() => setLoading(false));
    }, []);

    const classMap = useMemo(() => new Map(classes.map(c => [c.id, c.name])), [classes]);

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

    const capacityData = useMemo(() => {
        return allocations.map(alloc => ({
            className: classMap.get(alloc.classId) || 'Unknown',
            capacity: alloc.capacity,
            allocated: alloc.allocated,
            fillRate: alloc.capacity > 0 ? ((alloc.allocated / alloc.capacity) * 100).toFixed(1) + '%' : 'N/A'
        }));
    }, [allocations, classMap]);
    
    const waitlistData = useMemo(() => {
        return allocations
            .filter(alloc => alloc.waitlisted > 0)
            .map(alloc => ({
                className: classMap.get(alloc.classId) || 'Unknown',
                count: alloc.waitlisted
            }));
    }, [allocations, classMap]);

    const demographicsData = useMemo(() => {
        const counts = applications.reduce((acc, app) => {
            const gender = app.applicantDetails.gender || 'Unknown';
            acc[gender] = (acc[gender] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        return Object.entries(counts).map(([gender, count]) => ({
            gender,
            count,
            percentage: ((count / applications.length) * 100).toFixed(1) + '%'
        }));
    }, [applications]);
    
    // --- Export Handlers ---
    const handleExportFunnel = () => {
        exportToCsv('admissions_funnel_report.csv', 
            [{ key: 'stage', label: 'Stage' }, { key: 'count', label: 'Count' }], 
            funnelData);
    };

    const handleExportCapacity = () => {
        exportToCsv('capacity_fill_rate_report.csv',
            [
                { key: 'className', label: 'Class' }, 
                { key: 'capacity', label: 'Capacity' },
                { key: 'allocated', label: 'Allocated' },
                { key: 'fillRate', label: 'Fill Rate' },
            ],
            capacityData
        );
    };

    const handleExportWaitlist = () => {
        exportToCsv('waitlist_depth_report.csv',
            [{ key: 'className', label: 'Class' }, { key: 'count', label: 'Waitlisted Applicants' }],
            waitlistData
        );
    };

    const handleExportDemographics = () => {
         exportToCsv('applicant_demographics_report.csv',
            [
                { key: 'gender', label: 'Gender' }, 
                { key: 'count', label: 'Count' },
                { key: 'percentage', label: 'Percentage' },
            ],
            demographicsData
        );
    };


    if (loading) return <div className="text-center p-8">Loading reports...</div>;

    const maxFunnelCount = Math.max(...funnelData.map(d => d.count), 1);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Admissions Reports & Exports</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Funnel */}
                <ReportCard title="Admissions Funnel" onExport={handleExportFunnel}>
                    <div className="space-y-4">
                        {funnelData.map(({ stage, count }) => (
                            <div key={stage} className="flex items-center gap-4">
                                <span className="w-32 text-sm font-medium text-gray-600">{stage}</span>
                                <div className="flex-grow bg-gray-200 rounded-full h-6">
                                    {/* FIX: Ensured `count` is treated as a number to prevent type errors during arithmetic operation. */}
                                    <div className="bg-indigo-600 h-6 rounded-full text-white text-xs font-bold flex items-center justify-end pr-2" style={{ width: `${(Number(count) / maxFunnelCount) * 100}%` }}>
                                        {count}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </ReportCard>

                {/* Demographics */}
                <ReportCard title="Applicant Demographics" onExport={handleExportDemographics}>
                    <table className="w-full text-sm">
                        <thead><tr className="border-b"><th className="text-left font-medium p-2">Gender</th><th className="text-right font-medium p-2">Count</th><th className="text-right font-medium p-2">% of Total</th></tr></thead>
                        <tbody>
                            {demographicsData.map(demo => (
                                <tr key={demo.gender} className="border-b">
                                    <td className="p-2">{demo.gender}</td>
                                    <td className="p-2 text-right font-semibold">{demo.count}</td>
                                    <td className="p-2 text-right text-gray-500">{demo.percentage}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </ReportCard>
                
                 {/* Capacity Fill Rate */}
                <ReportCard title="Capacity Fill Rate" onExport={handleExportCapacity}>
                    <table className="w-full text-sm">
                         <thead><tr className="border-b"><th className="text-left font-medium p-2">Class</th><th className="text-right font-medium p-2">Capacity</th><th className="text-right font-medium p-2">Allocated</th><th className="text-right font-medium p-2">Fill Rate</th></tr></thead>
                         <tbody>
                            {capacityData.map(c => (
                                <tr key={c.className} className="border-b">
                                    <td className="p-2 font-medium">{c.className}</td>
                                    <td className="p-2 text-right">{c.capacity}</td>
                                    <td className="p-2 text-right">{c.allocated}</td>
                                    <td className="p-2 text-right font-semibold">{c.fillRate}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </ReportCard>
                
                {/* Waitlist Depth */}
                <ReportCard title="Waitlist Depth" onExport={handleExportWaitlist}>
                     <table className="w-full text-sm">
                        <thead><tr className="border-b"><th className="text-left font-medium p-2">Class</th><th className="text-right font-medium p-2"># on Waitlist</th></tr></thead>
                        <tbody>
                            {waitlistData.length > 0 ? waitlistData.map(w => (
                                <tr key={w.className} className="border-b">
                                    <td className="p-2 font-medium">{w.className}</td>
                                    <td className="p-2 text-right font-semibold">{w.count}</td>
                                </tr>
                            )) : <tr><td colSpan={2} className="p-4 text-center text-gray-500">No students on waitlists.</td></tr>}
                        </tbody>
                    </table>
                </ReportCard>

            </div>
        </div>
    );
};

export default AdmissionsReportsPage;
