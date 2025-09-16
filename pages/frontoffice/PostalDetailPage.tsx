import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as admissionsService from '../../lib/admissionsService';
import { listTeachers } from '../../lib/academicsService';
import type { Postal, Handover, Teacher, User } from '../../types';
import HandoverModal from '../../components/frontoffice/HandoverModal';

const PostalDetailPage: React.FC = () => {
    const { postalId } = useParams<{ postalId: string }>();
    const { user } = useAuth();
    const { addToast } = useToast();

    const [item, setItem] = useState<Postal | null>(null);
    const [handovers, setHandovers] = useState<Handover[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchData = useCallback(() => {
        if (!postalId) return;
        setLoading(true);
        Promise.all([
            admissionsService.getPostalItem(postalId),
            admissionsService.listHandovers(postalId),
            listTeachers()
        ]).then(([itemData, handoverData, teacherData]) => {
            setItem(itemData);
            setHandovers(handoverData);
            setTeachers(teacherData);
        }).catch(() => addToast('Failed to load item details.', 'error')).finally(() => setLoading(false));
    }, [postalId, addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const handleSaveSuccess = () => {
        setIsModalOpen(false);
        addToast('Handover logged.', 'success');
        fetchData();
    };
    
    const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, t.name])), [teachers]);

    if (loading) return <p>Loading item...</p>;
    if (!item) return <p>Item not found.</p>;

    return (
        <div className="space-y-6">
            <Link to="/school/site_123/frontoffice/postal" className="text-sm text-indigo-600">&larr; Back to Postal Log</Link>
            <h1 className="text-3xl font-bold text-gray-800">{item.subject}</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <h2 className="text-lg font-semibold mb-2">Details</h2>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <p><strong>Direction:</strong> {item.direction}</p>
                            <p><strong>Date:</strong> {item.date}</p>
                            <p><strong>Sender:</strong> {item.sender}</p>
                            <p><strong>Recipient:</strong> {item.recipient}</p>
                            <p><strong>Carrier/Ref:</strong> {item.carrier || item.refNo || 'N/A'}</p>
                            <p><strong>Status:</strong> {item.status}</p>
                        </div>
                    </div>
                     <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <h2 className="text-lg font-semibold mb-2">Attachments</h2>
                        {item.attachments?.length ? (
                            <ul className="list-disc list-inside text-sm">
                                {item.attachments.map(att => <li key={att.name}><a href={att.url} className="text-indigo-600">{att.name}</a></li>)}
                            </ul>
                        ) : <p className="text-sm text-gray-500">No attachments.</p>}
                    </div>
                </div>
                <div className="lg:col-span-1">
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-lg font-semibold">Handover History</h2>
                            <button onClick={() => setIsModalOpen(true)} className="text-sm text-indigo-600">Log Handover</button>
                        </div>
                        <div className="space-y-3">
                            {handovers.map(h => (
                                <div key={h.id} className="text-sm">
                                    <p>Handed to <strong>{teacherMap.get(h.toUserId) || 'Unknown'}</strong></p>
                                    <p className="text-xs text-gray-500">{new Date(h.handedAt).toLocaleString()}</p>
                                </div>
                            ))}
                            {handovers.length === 0 && <p className="text-sm text-gray-500">No handovers logged.</p>}
                        </div>
                    </div>
                </div>
            </div>

            {user && <HandoverModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSaveSuccess={handleSaveSuccess} actor={user} postalId={item.id} hosts={teachers} />}
        </div>
    );
};

export default PostalDetailPage;