import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import * as homeworkService from '../../lib/homeworkService';
import { getClasses } from '../../lib/schoolService';
import { listSubjects } from '../../lib/academicsService';
import { exportToCsv } from '../../lib/exporters';
import type { Homework, SchoolClass, Subject } from '../../types';

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
    const [loading, setLoading] = useState(true);

    const filters = useMemo(() => ({
        classId: searchParams.get('classId') || undefined,
        subjectId: searchParams.get('subjectId') || undefined,
    }), [searchParams]);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            homeworkService.getHomeworkWithStats(filters),
            getClasses(),
            listSubjects()
        ]).then(([hwData, classData, subjectData]) => {
            setHomework(hwData);
            setClasses(classData);
            setSubjects(subjectData);
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
        const stats = { total: 0, submitted: 0, late: 0, notSubmitted: 0 };
        homework.forEach(hw => {
            if(hw.stats) {
                stats.total += hw.stats.totalStudents;
                stats.submitted += hw.stats.submitted;
                stats.late += hw.stats.late;
                stats.notSubmitted += hw.stats.notSubmitted;
            }
        });
        const submissionRate = stats.total > 0 ? (stats.submitted / stats.total) * 100 : 0;
        const lateRate = stats.submitted > 0 ? (stats.late / stats.submitted) * 100 : 0;
        const notSubmittedRate = stats.total > 0 ? (stats.notSubmitted / stats.total) * 100 : 0;

        return {
            submissionRate: `${submissionRate.toFixed(1)}%`,
            lateRate: `${lateRate.toFixed(1)}%`,
            notSubmittedRate: `${notSubmittedRate.toFixed(1)}%`,
        };
    }, [homework]);
    
    const handleExport = () => {
        const dataForExport = homework.map(hw => ({
            title: hw.title,
            className: classMap.get(hw.classId),
            subjectName: subjectMap.get(hw.subjectId),
            dueDate: hw.dueDate,
            submissionRate: hw.stats?.submissionRate.toFixed(1) + '%',
            onTime: hw.stats?.onTime,
            late: hw.stats?.late,
            notSubmitted: hw.stats?.notSubmitted,
        }));
        exportToCsv('homework_report.csv', [
            { key: 'title', label: 'Title' },
            { key: 'className', label: 'Class' },
            { key: 'subjectName', label: 'Subject' },
            { key: 'dueDate', label: 'Due Date' },
            { key: 'submissionRate', label: 'Submission Rate (%)' },
            { key: 'onTime', label: 'On-Time' },
            { key: 'late', label: 'Late' },
            { key: 'notSubmitted', label: 'Not Submitted' },
        ], dataForExport);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Homework Reports</h1>
                <button onClick={handleExport} className="px-4 py-2 text-sm bg-white border rounded-md shadow-sm hover:bg-gray-50">Export CSV</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KpiCard title="Overall Submission Rate" value={overallStats.submissionRate} className="text-green-600" />
                <KpiCard title="Late Submission Rate" value={overallStats.lateRate} className="text-yellow-600" />
                <KpiCard title="Non-Submission Rate" value={overallStats.notSubmittedRate} className="text-red-600" />
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select value={filters.classId || ''} onChange={(e) => handleFilterChange('classId', e.target.value)} className="w-full rounded-md border-gray-300">
                        <option value="">All Classes</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select value={filters.subjectId || ''} onChange={(e) => handleFilterChange('subjectId', e.target.value)} className="w-full rounded-md border-gray-300">
                        <option value="">All Subjects</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                 <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-3 text-left text-xs uppercase">Homework</th>
                            <th className="p-3 text-left text-xs uppercase">Due Date</th>
                            <th className="p-3 text-left text-xs uppercase">Submission Rate</th>
                            <th className="p-3 text-center text-xs uppercase">On-Time</th>
                            <th className="p-3 text-center text-xs uppercase">Late</th>
                            <th className="p-3 text-center text-xs uppercase">Missed</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? <tr><td colSpan={6} className="p-4 text-center">Loading report...</td></tr> :
                        homework.map(hw => (
                            <tr key={hw.id}>
                                <td className="p-3 text-sm font-medium">
                                    <div>{hw.title}</div>
                                    <div className="text-xs text-gray-500">{classMap.get(hw.classId)} - {subjectMap.get(hw.subjectId)}</div>
                                </td>
                                <td className="p-3 text-sm">{hw.dueDate}</td>
                                <td className="p-3 text-sm">
                                    <div className="w-full bg-gray-200 rounded-full h-4">
                                        <div className="bg-indigo-600 h-4 rounded-full text-white text-xs flex items-center justify-center" style={{ width: `${hw.stats?.submissionRate || 0}%` }}>
                                            {`${(hw.stats?.submissionRate || 0).toFixed(0)}%`}
                                        </div>
                                    </div>
                                </td>
                                <td className="p-3 text-sm text-center font-mono text-green-700">{hw.stats?.onTime || 0}</td>
                                <td className="p-3 text-sm text-center font-mono text-yellow-700">{hw.stats?.late || 0}</td>
                                <td className="p-3 text-sm text-center font-mono text-red-700">{hw.stats?.notSubmitted || 0}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default HomeworkReportsPage;
