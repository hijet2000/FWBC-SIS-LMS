import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as homeworkService from '../../lib/homeworkService';
import { getClasses } from '../../lib/schoolService';
import { listSubjects } from '../../lib/academicsService';
import type { Homework, SchoolClass, Subject, HomeworkDashboardStats } from '../../types';
import AssignHomeworkModal from '../../components/homework/AssignHomeworkModal';

const KpiCard: React.FC<{ title: string; value: number; className?: string }> = ({ title, value, className = '' }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className={`mt-1 text-3xl font-bold ${className}`}>{value}</p>
    </div>
);

const getISODateDaysAgo = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
};

const HomeworkListPage: React.FC = () => {
    const { siteId } = useParams<{ siteId: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useAuth();
    const { addToast } = useToast();

    const [homework, setHomework] = useState<Homework[]>([]);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [stats, setStats] = useState<HomeworkDashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const filters = useMemo(() => ({
        classId: searchParams.get('classId') || undefined,
        subjectId: searchParams.get('subjectId') || undefined,
        from: searchParams.get('from') || undefined,
        to: searchParams.get('to') || undefined,
    }), [searchParams]);

    const fetchData = () => {
        setLoading(true);
        Promise.all([
            homeworkService.listHomework(filters),
            getClasses(),
            listSubjects(),
            homeworkService.getHomeworkDashboardStats()
        ]).then(([hwData, classData, subjectData, statsData]) => {
            setHomework(hwData);
            setClasses(classData);
            setSubjects(subjectData);
            setStats(statsData);
        }).catch(() => {
            addToast('Failed to load homework data.', 'error');
        }).finally(() => {
            setLoading(false);
        });
    };

    useEffect(() => {
        fetchData();
    }, [filters, addToast]);

    const handleFilterChange = (key: 'classId' | 'subjectId' | 'from' | 'to', value: string) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            if (value) {
                newParams.set(key, value);
            } else {
                newParams.delete(key);
            }
            return newParams;
        }, { replace: true });
    };
    
    const handleSaveSuccess = () => {
        setIsModalOpen(false);
        addToast('Homework assigned successfully!', 'success');
        fetchData();
    };

    const classMap = useMemo(() => new Map(classes.map(c => [c.id, c.name])), [classes]);
    const subjectMap = useMemo(() => new Map(subjects.map(s => [s.id, s.name])), [subjects]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Homework</h1>
                <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700">Assign Homework</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KpiCard title="Due Today" value={stats?.dueToday ?? 0} className="text-indigo-600" />
                <KpiCard title="Overdue Submissions" value={stats?.overdueSubmissions ?? 0} className="text-red-600" />
                <KpiCard title="Needs Marking" value={stats?.needsMarking ?? 0} className="text-yellow-600" />
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <select value={filters.classId || ''} onChange={(e) => handleFilterChange('classId', e.target.value)} className="w-full rounded-md border-gray-300">
                        <option value="">All Classes</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select value={filters.subjectId || ''} onChange={(e) => handleFilterChange('subjectId', e.target.value)} className="w-full rounded-md border-gray-300">
                        <option value="">All Subjects</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                     <div>
                        <label htmlFor="from-date" className="sr-only">From</label>
                        <input type="date" id="from-date" value={filters.from || ''} onChange={e => handleFilterChange('from', e.target.value)} className="w-full rounded-md border-gray-300" />
                    </div>
                    <div>
                        <label htmlFor="to-date" className="sr-only">To</label>
                        <input type="date" id="to-date" value={filters.to || ''} onChange={e => handleFilterChange('to', e.target.value)} className="w-full rounded-md border-gray-300" />
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr> :
                        homework.length === 0 ? <tr><td colSpan={5} className="p-4 text-center text-gray-500">No homework found.</td></tr> :
                        homework.map(hw => (
                            <tr key={hw.id}>
                                <td className="px-4 py-4 text-sm font-medium text-gray-900">{hw.title}</td>
                                <td className="px-4 py-4 text-sm text-gray-500">{classMap.get(hw.classId)}</td>
                                <td className="px-4 py-4 text-sm text-gray-500">{subjectMap.get(hw.subjectId)}</td>
                                <td className="px-4 py-4 text-sm text-gray-500">{hw.dueDate}</td>
                                <td className="px-4 py-4 text-right text-sm font-medium">
                                    <Link to={`/school/${siteId}/homework/${hw.id}`} className="text-indigo-600 hover:text-indigo-900">Review Submissions</Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && user && (
                <AssignHomeworkModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSaveSuccess={handleSaveSuccess}
                    classes={classes}
                    subjects={subjects}
                    actor={user}
                />
            )}
        </div>
    );
};

export default HomeworkListPage;
