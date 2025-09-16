import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import * as catchupService from '../../lib/catchupService';
import { listSubjects } from '../../lib/academicsService';
import { getClasses } from '../../lib/schoolService';
import type { CatchupItem, WatchProgress, Subject, SchoolClass } from '../../types';
import { lmsKeys } from '../../lib/queryKeys';

const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
};

const CatchupCard: React.FC<{ item: CatchupItem; progress?: WatchProgress; search: string; subjectName?: string; className?: string; }> = 
({ item, progress, search, subjectName, className }) => {
    const { siteId } = useParams<{ siteId: string }>();
    let status = 'Start';
    let statusClass = 'bg-indigo-600 hover:bg-indigo-700';
    let subtext = '';

    if (progress?.completed) {
        status = 'Completed';
        statusClass = 'bg-green-600';
        subtext = 'View again';
    } else if (progress && progress.secondsWatched > 0) {
        status = 'Resume';
        statusClass = 'bg-amber-600 hover:bg-amber-700';
        const pct = Math.floor((progress.secondsWatched / item.durationSec) * 100);
        subtext = `${pct}% watched`;
    }

    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col transition-shadow hover:shadow-md">
            <div className="p-4 flex-grow">
                <p className="text-sm text-gray-500">{subjectName} / {className}</p>
                <h3 className="font-semibold text-gray-800 mt-1">{item.title}</h3>
                <div className="text-xs text-gray-400 mt-2 space-x-4">
                    <span>Duration: {formatDuration(item.durationSec)}</span>
                    <span>Published: {item.publishedAt}</span>
                </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
                <Link 
                    to={`/school/${siteId}/library/catchup/view/${item.id}?${search}`}
                    className={`w-full text-center inline-block px-4 py-2 text-sm font-medium text-white ${statusClass} rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2`}
                >
                    {status}
                    {subtext && <span className="block text-xs opacity-80">{subtext}</span>}
                </Link>
            </div>
        </div>
    );
};


const CatchUpListPage: React.FC = () => {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();

    const [items, setItems] = useState<CatchupItem[]>([]);
    const [progress, setProgress] = useState<Record<string, WatchProgress>>({});
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const filters = useMemo(() => ({
        subjectId: searchParams.get('subjectId') || undefined,
        classId: searchParams.get('classId') || undefined,
        q: searchParams.get('q') || undefined,
    }), [searchParams]);

    const queryKey = lmsKeys.catchup.list(filters);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                // HACK: Use a mock student ID for demonstration purposes. In a real app, this would come from the auth context.
                const studentId = user?.scopes.includes('student') ? 's01' : 'admin';
                const [,, queryFilters] = queryKey;
                const cleanFilters = Object.fromEntries(Object.entries(queryFilters).filter(([, v]) => v !== undefined));

                const [itemsData, progressData, subjectsData, classesData] = await Promise.all([
                    catchupService.listCatchup('site_123', cleanFilters),
                    catchupService.listWatchProgressForStudent('site_123', studentId),
                    listSubjects(),
                    getClasses(),
                ]);
                setItems(itemsData);
                setProgress(progressData);
                setSubjects(subjectsData);
                setClasses(classesData);
            } catch {
                setError('Failed to load catch-up lessons.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [queryKey, user]);

    const subjectMap = useMemo(() => new Map(subjects.map(s => [s.id, s.name])), [subjects]);
    const classMap = useMemo(() => new Map(classes.map(c => [c.id, c.name])), [classes]);

    const handleFilterChange = (key: 'subjectId' | 'classId' | 'q', value: string) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            if (value) newParams.set(key, value);
            else newParams.delete(key);
            return newParams;
        }, { replace: true });
    };

    const renderGrid = () => {
        if (loading) {
             return [...Array(4)].map((_, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="mt-4 h-10 bg-gray-100 rounded"></div>
                </div>
            ));
        }
        if (error) {
            return <div className="col-span-full text-center p-8 bg-red-50 text-red-700 rounded-lg">{error}</div>;
        }
        if (items.length === 0) {
            return <div className="col-span-full text-center p-8 bg-gray-50 rounded-lg">No catch-up items match your filters.</div>;
        }
        return items.map(item => (
            <CatchupCard 
                key={item.id} 
                item={item} 
                progress={progress[item.id]}
                search={searchParams.toString()}
                subjectName={subjectMap.get(item.subjectId)}
                className={classMap.get(item.classId)}
            />
        ));
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Catch-Up Classes</h1>
                <p className="mt-1 text-sm text-gray-500">Find and complete missed lessons to stay on track.</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input type="search" placeholder="Search by title..." value={filters.q || ''} onChange={e => handleFilterChange('q', e.target.value)} className="w-full rounded-md border-gray-300" />
                    <select value={filters.subjectId || ''} onChange={e => handleFilterChange('subjectId', e.target.value)} className="w-full rounded-md border-gray-300"><option value="">All Subjects</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                    <select value={filters.classId || ''} onChange={e => handleFilterChange('classId', e.target.value)} className="w-full rounded-md border-gray-300"><option value="">All Classes</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {renderGrid()}
            </div>
        </div>
    );
};

export default CatchUpListPage;