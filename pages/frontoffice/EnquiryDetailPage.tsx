
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as admissionsService from '../../lib/admissionsService';
import { getClasses } from '../../lib/schoolService';
import type { Enquiry, FollowUp, EnquiryStatus, SchoolClass, User } from '../../types';
import Modal from '../../components/ui/Modal';

// --- FollowUpModal Sub-component ---
interface FollowUpModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    enquiryId: string;
    actor: User;
}
const FollowUpModal: React.FC<FollowUpModalProps> = ({ isOpen, onClose, onSave, enquiryId, actor }) => {
    const [formData, setFormData] = useState({ dueAt: '', method: 'Call' as FollowUp['method'], summary: '' });
    const [isSaving, setIsSaving] = useState(false);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        // FIX: The `ownerId` property was missing from the payload. Added `ownerId: actor.id` to satisfy the type.
        await admissionsService.createFollowUp({ enquiryId, ...formData, ownerId: actor.id }, actor);
        onSave();
        onClose();
        setIsSaving(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Schedule Follow-up">
            <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4">
                    <input type="datetime-local" value={formData.dueAt} onChange={e => setFormData({...formData, dueAt: e.target.value})} className="w-full rounded-md" required />
                    <select value={formData.method} onChange={e => setFormData({...formData, method: e.target.value as FollowUp['method']})} className="w-full rounded-md">
                        <option value="Call">Call</option>
                        <option value="Email">Email</option>
                        <option value="Visit">Visit</option>
                    </select>
                    <textarea value={formData.summary} onChange={e => setFormData({...formData, summary: e.target.value})} placeholder="Summary/Purpose..." className="w-full rounded-md" rows={3} required />
                </div>
                <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md">Cancel</button>
                    <button type="submit" disabled={isSaving} className="px-4 py-2 text-white bg-indigo-600 rounded-md disabled:bg-gray-400">{isSaving ? 'Saving...' : 'Schedule'}</button>
                </div>
            </form>
        </Modal>
    );
};

// --- Main Detail Page ---
const EnquiryDetailPage: React.FC = () => {
    const { enquiryId } = useParams<{ enquiryId: string }>();
    const { user } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();

    const [enquiry, setEnquiry] = useState<Enquiry | null>(null);
    const [followUps, setFollowUps] = useState<FollowUp[]>([]);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchData = useCallback(() => {
        if (!enquiryId) return;
        setLoading(true);
        Promise.all([
            admissionsService.getEnquiry(enquiryId),
            admissionsService.listFollowUps(enquiryId),
            getClasses(),
        ]).then(([enq, fu, cls]) => {
            setEnquiry(enq);
            setFollowUps(fu);
            setClasses(cls);
        }).catch(() => addToast('Failed to load enquiry details.', 'error')).finally(() => setLoading(false));
    }, [enquiryId, addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const handleStatusChange = async (newStatus: EnquiryStatus) => {
        if (!enquiry || !user) return;
        try {
            const updated = await admissionsService.updateEnquiry(enquiry.id, { status: newStatus }, user);
            setEnquiry(updated);
            addToast('Status updated.', 'success');
        } catch {
            addToast('Failed to update status.', 'error');
        }
    };
    
    const handleConvert = async () => {
        if (!enquiry || !user) return;
        if(enquiry.status !== 'Qualified') {
            addToast('Only qualified enquiries can be converted.', 'warning');
            return;
        }
        try {
            const newApp = await admissionsService.convertEnquiryToApplication(enquiry.id, user);
            addToast('Converted to application!', 'success');
            navigate(`/school/site_123/admissions/applications?highlight=${newApp.id}`);
        } catch {
             addToast('Conversion failed.', 'error');
        }
    };

    if (loading) return <p>Loading enquiry...</p>;
    if (!enquiry) return <p>Enquiry not found.</p>;

    const classMap = new Map(classes.map(c => [c.id, c.name]));
    const isOverdue = (fu: FollowUp) => !fu.doneAt && new Date(fu.dueAt) < new Date();

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">{enquiry.name}</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Timeline */}
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">Follow-up Timeline</h2>
                            <button onClick={() => setIsModalOpen(true)} className="text-sm text-indigo-600 font-medium">Add Follow-up</button>
                        </div>
                        <div className="space-y-4">
                            {followUps.map(fu => (
                                <div key={fu.id} className="flex gap-3">
                                    <div className={`w-6 h-6 rounded-full flex-shrink-0 mt-1 ${fu.doneAt ? 'bg-green-500' : isOverdue(fu) ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                                    <div>
                                        <p className="font-medium">{fu.method}: {fu.summary}</p>
                                        <p className="text-sm text-gray-500">Due: {new Date(fu.dueAt).toLocaleString()}</p>
                                        {fu.outcome && <p className="text-sm text-gray-600 bg-gray-50 p-1 mt-1 rounded">Outcome: {fu.outcome}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-1 space-y-6">
                    {/* Details & Actions */}
                    <div className="bg-white p-4 rounded-lg shadow-sm border space-y-3">
                         <h2 className="text-lg font-semibold">Details</h2>
                         <p className="text-sm"><strong>Status:</strong> <select value={enquiry.status} onChange={e => handleStatusChange(e.target.value as EnquiryStatus)} className="inline-block w-auto text-sm p-1 rounded-md border-gray-300">{(['New', 'Contacted', 'Qualified', 'Converted', 'Closed'] as EnquiryStatus[]).map(s => <option key={s} value={s}>{s}</option>)}</select></p>
                         <p className="text-sm"><strong>Contact:</strong> {enquiry.phone || enquiry.email}</p>
                         <p className="text-sm"><strong>Source:</strong> {enquiry.source}</p>
                         <p className="text-sm"><strong>Target Class:</strong> {enquiry.targetClassId ? classMap.get(enquiry.targetClassId) : 'N/A'}</p>
                         <p className="text-sm"><strong>Notes:</strong> {enquiry.notes || 'None'}</p>
                         <button onClick={handleConvert} disabled={enquiry.status !== 'Qualified'} className="w-full mt-4 px-4 py-2 text-white bg-green-600 rounded-md disabled:bg-gray-400">Convert to Application</button>
                    </div>
                </div>
            </div>

            {user && <FollowUpModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={fetchData} enquiryId={enquiry.id} actor={user} />}
        </div>
    );
};

export default EnquiryDetailPage;
