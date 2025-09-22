import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as admissionsService from '../../lib/admissionsService';
import { listTeachers } from '../../lib/academicsService';
import type { Postal, PostalDirection, Teacher, User } from '../../types';
import { exportToCsv } from '../../lib/exporters';
import PostalItemModal from '../../components/frontoffice/PostalItemModal';

const PostalPage: React.FC = () => {
    const { siteId } = useParams<{ siteId: string }>();
    const { user } = useAuth();
    const { addToast } = useToast();
    const [searchParams, setSearchParams] = useSearchParams();

    const [items, setItems] = useState<Postal[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const activeTab = searchParams.get('tab') || 'All';

    const fetchData = () => {
        setLoading(true);
        Promise.all([admissionsService.listPostalItems(), listTeachers()])
            .then(([itemData, teacherData]) => {
                setItems(itemData);
                setTeachers(teacherData);
            })
            .catch(() => addToast('Failed to load postal logs.', 'error'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchData();
    }, [addToast]);

    const handleTabChange = (tab: string) => {
        setSearchParams({ tab });
    };

    const handleSaveSuccess = () => {
        setIsModalOpen(false);
        addToast('Postal item logged.', 'success');
        fetchData();
    };

    const handleExport = () => {
        exportToCsv('postal_log.csv', [
            { key: 'date', label: 'Date' }, { key: 'direction', label: 'Direction' },
            { key: 'subject', label: 'Subject' }, { key: 'sender', label: 'Sender' },
            { key: 'recipient', label: 'Recipient' }, { key: 'status', label: 'Status' },
        ], filteredItems);
    };

    const filteredItems = useMemo(() => {
        if (activeTab === 'All') return items;
        return items.filter(i => i.direction === (activeTab as PostalDirection));
    }, [items, activeTab]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Postal Log</h1>
                 <div className="flex gap-2">
                    <button onClick={handleExport} className="px-4 py-2 text-sm bg-white border rounded-md">Export CSV</button>
                    <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md">Add Item</button>
                </div>
            </div>
            
            <div>
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        {(['All', 'Incoming', 'Outgoing'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => handleTabChange(tab)}
                                className={`${
                                    activeTab === tab
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                            >
                                {tab}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50"><tr>
                        <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                        <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Sender/Recipient</th>
                        <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr></thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? <tr><td colSpan={4} className="p-4 text-center">Loading...</td></tr> :
                        filteredItems.map(item => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="p-3 text-sm">
                                    <Link to={`/school/${siteId}/frontoffice/postal/${item.id}`} className="font-medium text-indigo-600 flex items-center gap-2">
                                        {item.confidential && <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
                                        {item.subject}
                                    </Link>
                                </td>
                                <td className="p-3 text-sm">{item.direction === 'Incoming' ? item.sender : item.recipient}</td>
                                <td className="p-3 text-sm">{item.date}</td>
                                <td className="p-3 text-sm">{item.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {user && <PostalItemModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSaveSuccess={handleSaveSuccess} actor={user} hosts={teachers} />}
        </div>
    );
};

export default PostalPage;