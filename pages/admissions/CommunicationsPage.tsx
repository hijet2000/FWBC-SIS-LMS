import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { listApplications } from '../../lib/admissionsService';
import type { Application, ApplicationStatus, User } from '../../types';
import CommunicationModal from '../../components/admissions/CommunicationModal';

const CommunicationsPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();

    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [filter, setFilter] = useState<ApplicationStatus | 'all'>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchData = useCallback(() => {
        setLoading(true);
        listApplications()
            .then(setApplications)
            .catch(() => addToast('Failed to load applications.', 'error'))
            .finally(() => setLoading(false));
    }, [addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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
            setSelected(new Set(filteredApps.map(app => app.id)));
        } else {
            setSelected(new Set());
        }
    };

    const handleSendSuccess = () => {
        setIsModalOpen(false);
        setSelected(new Set());
    };
    
    const filteredApps = useMemo(() => {
        if (filter === 'all') return applications;
        return applications.filter(app => app.status === filter);
    }, [applications, filter]);
    
    const selectedApplications = useMemo(() => {
        return applications.filter(app => selected.has(app.id));
    }, [applications, selected]);

    return (
        <div className="space-y-6">
            {user && (
                <CommunicationModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSaveSuccess={handleSendSuccess}
                    applications={selectedApplications}
                    actor={user}
                />
            )}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Parent Communications</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    disabled={selected.size === 0}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    Send Communication ({selected.size})
                </button>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border">
                <select value={filter} onChange={e => setFilter(e.target.value as any)} className="rounded-md border-gray-300">
                    <option value="all">All Statuses</option>
                    {['New', 'Screening', 'DocsMissing', 'Interview', 'Offer', 'Accepted', 'Approved', 'Rejected'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-3"><input type="checkbox" onChange={handleSelectAll} checked={selected.size > 0 && selected.size === filteredApps.length} /></th>
                            <th className="p-3 text-left text-xs font-medium uppercase">Applicant</th>
                            <th className="p-3 text-left text-xs font-medium uppercase">Status</th>
                            <th className="p-3 text-left text-xs font-medium uppercase">Guardian Contact</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? <tr><td colSpan={4} className="p-4 text-center">Loading...</td></tr> :
                        filteredApps.map(app => (
                            <tr key={app.id} className={selected.has(app.id) ? 'bg-indigo-50' : ''}>
                                <td className="p-3"><input type="checkbox" checked={selected.has(app.id)} onChange={() => handleSelect(app.id)} /></td>
                                <td className="p-3 text-sm font-medium">{app.applicantName}</td>
                                <td className="p-3 text-sm">{app.status}</td>
                                <td className="p-3 text-sm text-gray-500">{app.guardians[0]?.email || 'N/A'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CommunicationsPage;