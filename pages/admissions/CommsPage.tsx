import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { listApplications } from '../../lib/admissionsService';
import { getClasses } from '../../lib/schoolService';
import type { Application, ApplicationStatus, SchoolClass } from '../../types';
import CommunicationModal from '../../components/admissions/CommunicationModal';

const CommsPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    
    const [applications, setApplications] = useState<Application[]>([]);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<ApplicationStatus | ''>('');
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        setLoading(true);
        Promise.all([listApplications(), getClasses()])
            .then(([appData, classData]) => {
                setApplications(appData);
                setClasses(classData);
            })
            .catch(() => addToast('Failed to load applications.', 'error'))
            .finally(() => setLoading(false));
    }, [addToast]);
    
    const filteredApplications = useMemo(() => {
        if (!filterStatus) return applications;
        return applications.filter(a => a.status === filterStatus);
    }, [applications, filterStatus]);

    const handleSelect = (appId: string) => {
        setSelected(prev => {
            const newSet = new Set(prev);
            if (newSet.has(appId)) {
                newSet.delete(appId);
            } else {
                newSet.add(appId);
            }
            return newSet;
        });
    };
    
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelected(new Set(filteredApplications.map(a => a.id)));
        } else {
            setSelected(new Set());
        }
    };
    
    const classMap = useMemo(() => new Map(classes.map(c => [c.id, c.name])), [classes]);

    return (
        <div className="space-y-6">
            {user && (
                <CommunicationModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    selectedApplicationIds={Array.from(selected)}
                    actor={user}
                />
            )}
            <h1 className="text-3xl font-bold text-gray-800">Parent Communications</h1>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border flex justify-between">
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="rounded-md">
                    <option value="">Filter by Status...</option>
                    {['New', 'DocsMissing', 'Interview', 'Offer', 'Accepted'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={() => setIsModalOpen(true)} disabled={selected.size === 0} className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:bg-gray-400">
                    Send Communication ({selected.size})
                </button>
            </div>
            
            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-3 w-12"><input type="checkbox" onChange={handleSelectAll} className="rounded" /></th>
                            <th className="p-3 text-left text-xs uppercase">Applicant</th>
                            <th className="p-3 text-left text-xs uppercase">Status</th>
                            <th className="p-3 text-left text-xs uppercase">Guardian Contact</th>
                        </tr>
                    </thead>
                     <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? <tr><td colSpan={4} className="p-4 text-center">Loading...</td></tr> :
                        filteredApplications.map(app => (
                            <tr key={app.id}>
                                <td className="p-3"><input type="checkbox" checked={selected.has(app.id)} onChange={() => handleSelect(app.id)} className="rounded"/></td>
                                <td className="p-3 text-sm font-medium">{app.applicantName}</td>
                                <td className="p-3 text-sm">{app.status}</td>
                                <td className="p-3 text-sm">{app.guardians[0]?.email || app.guardians[0]?.phone || 'N/A'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CommsPage;