import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { listApplications, updateApplication } from '../../lib/admissionsService';
import { getClasses } from '../../lib/schoolService';
import type { Application, ApplicationStatus, SchoolClass } from '../../types';
import KanbanBoard from '../../components/admissions/KanbanBoard';

const ApplicationsPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [searchParams, setSearchParams] = useSearchParams();

    const [applications, setApplications] = useState<Application[]>([]);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'table' | 'list'>('list');

    const filters = useMemo(() => ({
        classId: searchParams.get('classId') || undefined,
        status: searchParams.get('status') || undefined,
    }), [searchParams]);
    
    const fetchData = () => {
        setLoading(true);
        Promise.all([
            listApplications(),
            getClasses()
        ]).then(([appData, classData]) => {
            setApplications(appData);
            setClasses(classData);
        }).catch(() => {
            addToast('Failed to load applications.', 'error');
        }).finally(() => {
            setLoading(false);
        });
    };

    useEffect(() => {
        fetchData();
    }, [addToast]);

    const handleFilterChange = (key: 'classId' | 'status', value: string) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            if (value) newParams.set(key, value);
            else newParams.delete(key);
            return newParams;
        }, { replace: true });
    };
    
    const handleStatusChange = (applicationId: string, newStatus: ApplicationStatus) => {
        if (!user) return;
        const originalApplications = [...applications];
        setApplications(prev => prev.map(app => app.id === applicationId ? { ...app, status: newStatus } : app));
        // Use the new, more flexible updateApplication function
        updateApplication(applicationId, { status: newStatus }, user)
            .catch(() => {
                addToast('Failed to update status.', 'error');
                setApplications(originalApplications);
            });
    };

    const classMap = useMemo(() => new Map(classes.map(c => [c.id, c.name])), [classes]);
    
    const filteredApplications = useMemo(() => {
        return applications.filter(app => 
            (filters.classId ? app.desiredClassId === filters.classId : true) &&
            (filters.status ? app.status === filters.status : true)
        );
    }, [applications, filters]);

    return (
        <div className="space-y-6 flex flex-col h-full">
            <h1 className="text-3xl font-bold text-gray-800">Applications</h1>

            <div className="bg-white p-4 rounded-lg shadow-sm border flex justify-between items-center">
                <div className="flex gap-4">
                    <select value={filters.classId || ''} onChange={e => handleFilterChange('classId', e.target.value)} className="rounded-md">
                        <option value="">All Classes</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select value={filters.status || ''} onChange={e => handleFilterChange('status', e.target.value)} className="rounded-md">
                        <option value="">All Statuses</option>
                        {['New', 'Screening', 'Interview', 'Offer', 'Accepted', 'Approved', 'Rejected'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setView('table')} className={`p-2 rounded ${view === 'table' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>Table</button>
                    <button onClick={() => setView('list')} className={`p-2 rounded ${view === 'list' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>List</button>
                </div>
            </div>
            
            <div className="flex-grow overflow-auto">
                {loading ? <p>Loading applications...</p> :
                    view === 'table' ? (
                        <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                             <p className="p-8 text-center text-gray-500">Table view is under construction. Please use List view.</p>
                        </div>
                    ) : (
                        <KanbanBoard applications={filteredApplications} onStatusChange={handleStatusChange} classMap={classMap} />
                    )
                }
            </div>
        </div>
    );
};

export default ApplicationsPage;