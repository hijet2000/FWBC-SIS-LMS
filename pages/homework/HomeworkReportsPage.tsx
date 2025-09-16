import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import * as homeworkService from '../../lib/homeworkService';
import { getClasses } from '../../lib/schoolService';
import { listSubjects } from '../../lib/academicsService';
import { exportToCsv } from '../../lib/exporters';
import type { Homework, SchoolClass, Subject, StudentWatchlistItem } from '../../types';

const KpiCard: React.FC<{ title: string; value: string; className?: string }> = ({ title, value, className = '' }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className={`mt-1 text-3xl font-bold ${className}`}>{value}</p>
    </div>
);

const HomeworkReportsPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { addToast } = useToast();

    const [homework, setHomework] = useState<Homework[]>([]);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [watchlist, setWatchlist] = useState<StudentWatchlistItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'watchlist'>('overview');

    const filters = useMemo(() => ({
        classId: searchParams.get('classId') || undefined,
        subjectId: searchParams.get('subjectId') || undefined,
    }), [searchParams]);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            homeworkService.getHomeworkWithStats(filters),
            getClasses(),
            listSubjects(),
            homeworkService.getStudentWatchlist()
        ]).then(([hwData, classData, subjectData, watchlistData]) => {
            setHomework(hwData);
            setClasses(classData);
            setSubjects(subjectData);
            setWatchlist(watchlistData);
        }).catch(() => {
            addToast('Failed to load report data.', 'error');
        }).finally(() => {
            setLoading(false);
        });
    }, [filters, addToast]);
    
    const handleFilterChange = (key: 'classId' | 'subjectId', value: string) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            if (value) newParams.set(key, value);
            else newParams.delete(key);
            return newParams;
        }, { replace: true });
    };
    
    const classMap = useMemo(() => new Map(classes.map(c => [c.id, c.name])), [classes]);
    const subjectMap = useMemo(() => new Map(subjects.map(s => [s.id, s.name])), [subjects]);

    const overallStats = useMemo(() => {
        const stats = { total: 0, submitted: 0, late: 0, onTime: 0, notSubmitted: 0 };
        homework.forEach(hw => {
            if(hw.stats) {
                stats.total += hw.stats.totalStudents;
                stats.submitted += hw.stats.submitted;
                stats.late += hw.stats.late;
                stats.onTime += hw.stats.onTime;
                stats.notSubmitted += hw.stats.notSubmitted;
            }
        });
        const submissionRate = stats.total > 0 ? (stats.submitted / stats.total) * 100 : 0;
        return { ...stats, submissionRate };
    }, [homework]);
    
    const handleExport = () => {
        const dataForExport = activeTab === 'overview' ? 
            homework.map(hw => ({ title: hw.title, className: classMap.get(hw.classId), subjectName: subjectMap.get(hw.subjectId), dueDate: hw.dueDate, submissionRate: hw.stats?.submissionRate.toFixed(1) + '%', onTime: hw.stats?.onTime, late: hw.stats?.late, notSubmitted: hw.stats?.notSubmitted }))
            : watchlist;
            
        const headers = activeTab === 'overview' ?
            [ { key: 'title', label: 'Title' }, { key: 'className', label: 'Class' }, { key: 'subjectName', label: 'Subject' }, { key: 'dueDate', label: 'Due Date' }, { key: 'submissionRate', label: 'Submission Rate (%)' }, { key: 'onTime', label: 'On-Time' }, { key: 'late', label: 'Late' }, { key: 'notSubmitted', label: 'Not Submitted' } ]
            : [ { key: 'studentName', label: 'Student' }, { key: 'lateCount', label: 'Late Submissions' }, { key: 'missedCount', label: 'Missed Submissions' }, { key: 'lastIncidentDate', label: 'Last Incident' } ];

        exportToCsv(`homework_${activeTab}_report.csv`, headers, dataForExport);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Homework Reports</h1>
                <button onClick={handleExport} className="px-4 py-2 text-sm bg-white border rounded-md shadow-sm hover:bg-gray-50">Export CSV</button>
            </div>
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8"><button onClick={() => setActiveTab('overview')} className={`capitalize whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'overview' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>Overview</button><button onClick={() => setActiveTab('watchlist')} className={`capitalize whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'watchlist' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>Student Watchlist</button></nav>
            </div>

            {activeTab === 'overview' && (<>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KpiCard title="Overall Submission Rate" value={`${overallStats.submissionRate.toFixed(1)}%`} className="text-green-600" />
                    <KpiCard title="Total On-Time" value={overallStats.onTime.toString()} className="text-green-600" />
                    <KpiCard title="Total Late" value={overallStats.late.toString()} className="text-yellow-600" />
                    <KpiCard title="Total Missed" value={overallStats.notSubmitted.toString()} className="text-red-600" />
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <select value={filters.classId || ''} onChange={(e) => handleFilterChange('classId', e.target.value)} className="w-full rounded-md border-gray-300"><option value="">All Classes</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                        <select value={filters.subjectId || ''} onChange={(e) => handleFilterChange('subjectId', e.target.value)} className="w-full rounded-md border-gray-300"><option value="">All Subjects</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                    </div>
                </div>
                <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                        <thead className="bg-gray-50"><tr><th className="p-3 text-left text-xs uppercase">Homework</th><th className="p-3 text-left text-xs uppercase">Due Date</th><th className="p-3 text-left text-xs uppercase">Submission Rate</th><th className="p-3 text-center text-xs uppercase">On-Time</th><th className="p-3 text-center text-xs uppercase">Late</th><th className="p-3 text-center text-xs uppercase">Missed</th></tr></thead>
                        <tbody className="bg-white divide-y divide-gray-200">{loading ? <tr><td colSpan={6} className="p-4 text-center">Loading report...</td></tr> : homework.map(hw => (<tr key={hw.id}><td className="p-3 text-sm font-medium"><div>{hw.title}</div><div className="text-xs text-gray-500">{classMap.get(hw.classId)} - {subjectMap.get(hw.subjectId)}</div></td><td className="p-3 text-sm">{hw.dueDate}</td><td className="p-3 text-sm"><div className="w-full bg-gray-200 rounded-full h-4"><div className="bg-indigo-600 h-4 rounded-full text-white text-xs flex items-center justify-center" style={{ width: `${hw.stats?.submissionRate || 0}%` }}>{`${(hw.stats?.submissionRate || 0).toFixed(0)}%`}</div></div></td><td className="p-3 text-sm text-center font-mono text-green-700">{hw.stats?.onTime || 0}</td><td className="p-3 text-sm text-center font-mono text-yellow-700">{hw.stats?.late || 0}</td><td className="p-3 text-sm text-center font-mono text-red-700">{hw.stats?.notSubmitted || 0}</td></tr>))}</tbody>
                    </table>
                </div>
            </>)}

            {activeTab === 'watchlist' && (<div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50"><tr><th className="p-3 text-left text-xs uppercase">Student</th><th className="p-3 text-center text-xs uppercase">Late Submissions</th><th className="p-3 text-center text-xs uppercase">Missed Submissions</th><th className="p-3 text-left text-xs uppercase">Last Incident Date</th></tr></thead>
                    <tbody className="bg-white divide-y divide-gray-200">{loading ? <tr><td colSpan={4} className="p-4 text-center">Analyzing student data...</td></tr> : watchlist.map(item => (<tr key={item.studentId}><td className="p-3 text-sm font-medium text-indigo-600"><Link to={`/school/site_123/students/${item.studentId}`}>{item.studentName}</Link></td><td className="p-3 text-sm text-center font-bold text-yellow-700">{item.lateCount}</td><td className="p-3 text-sm text-center font-bold text-red-700">{item.missedCount}</td><td className="p-3 text-sm">{item.lastIncidentDate}</td></tr>))}</tbody>
                </table>
            </div>)}
        </div>
    );
};

export default HomeworkReportsPage;