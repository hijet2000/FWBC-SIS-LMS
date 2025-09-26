import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link, useParams } from 'react-router-dom';
import { listAttendanceRecords, exportAnalyticsCSV, exportAnalyticsPDF } from '../lib/attendanceService';
import { getClasses } from '../lib/schoolService';
import type { AttendanceRecord, SchoolClass } from '../types';
import Heatmap from '../components/attendance/Heatmap';

const getISODateDaysAgo = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
};

const DashboardCard: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
    <div className={`bg-white p-6 rounded-lg shadow-sm border border-gray-200 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">{title}</h3>
        {children}
    </div>
);

const AttendanceExportsPage: React.FC = () => {
    const { siteId: routeSiteId } = useParams<{ siteId: string }>();
    const siteId = routeSiteId || 'fwbc';
    const [searchParams, setSearchParams] = useSearchParams();
    
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const classId = searchParams.get('classId') || '';
    const from = searchParams.get('from') || getISODateDaysAgo(29);
    const to = searchParams.get('to') || getISODateDaysAgo(0);

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [classesData, recordsData] = await Promise.all([
                    getClasses(),
                    listAttendanceRecords({ classId, from, to }),
                ]);
                setClasses(classesData);
                setRecords(recordsData);
            } catch {
                setError('Failed to load dashboard data.');
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, [classId, from, to]);

    const kpis = useMemo(() => {
        const total = records.length;
        if (total === 0) return { total: 0, presentRate: 0, lateCount: 0 };
        const presentCount = records.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
        const lateCount = records.filter(r => r.status === 'LATE').length;
        const presentRate = total > 0 ? (presentCount / total) * 100 : 0;
        return { total, presentRate: presentRate.toFixed(1), lateCount };
    }, [records]);

    const handleFilterChange = (key: 'classId' | 'from' | 'to', value: string) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            if (value) newParams.set(key, value);
            else newParams.delete(key);
            return newParams;
        }, { replace: true });
    };
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Exports & Reports Dashboard</h1>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div>
                        <label htmlFor="class-filter" className="block text-sm font-medium text-gray-700">Class</label>
                        <select id="class-filter" value={classId} onChange={e => handleFilterChange('classId', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                            <option value="">All Classes</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="from-date" className="block text-sm font-medium text-gray-700">From</label>
                        <input type="date" id="from-date" value={from} onChange={e => handleFilterChange('from', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="to-date" className="block text-sm font-medium text-gray-700">To</label>
                        <input type="date" id="to-date" value={to} onChange={e => handleFilterChange('to', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                    </div>
                </div>
            </div>

            {loading ? <div className="text-center text-gray-500">Loading dashboard...</div> : error ? <div className="text-center text-red-600">{error}</div> : (
            <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <DashboardCard title="Total Records"><p className="text-4xl font-bold text-gray-800">{kpis.total}</p></DashboardCard>
                    <DashboardCard title="Present Rate"><p className="text-4xl font-bold text-green-600">{kpis.presentRate}%</p></DashboardCard>
                    <DashboardCard title="Late Count"><p className="text-4xl font-bold text-amber-600">{kpis.lateCount}</p></DashboardCard>
                </div>

                <DashboardCard title={`Daily Present Rate Heatmap (${from} to ${to})`}>
                    <Heatmap records={records} from={from} to={to} />
                </DashboardCard>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <DashboardCard title="Server Exports">
                        <p className="text-sm text-gray-500 mb-4">Generate and download detailed reports from the server.</p>
                        <div className="flex flex-wrap gap-2">
                             <button onClick={() => exportAnalyticsCSV()} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">Analytics CSV</button>
                             <button onClick={() => exportAnalyticsPDF()} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">Analytics PDF</button>
                        </div>
                    </DashboardCard>
                    
                    <DashboardCard title="Email Settings">
                        <p className="text-sm text-gray-500 mb-4">Settings for weekly attendance summaries have been moved to their own page.</p>
                         <Link to={`/school/${siteId}/attendance/settings`} className="inline-block px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
                            Go to Settings
                        </Link>
                    </DashboardCard>
                </div>
            </>
            )}
        </div>
    );
};

export default AttendanceExportsPage;