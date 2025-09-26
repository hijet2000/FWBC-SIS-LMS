

import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { listEnquiries, createEnquiry } from '../../lib/admissionsService';
import { getClasses } from '../../lib/schoolService';
import type { Enquiry, EnquiryStatus, EnquirySource, SchoolClass, User } from '../../types';
import Modal from '../../components/ui/Modal';
import { exportToCsv } from '../../lib/exporters';

// --- New Enquiry Modal ---
interface EnquiryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    actor: User;
    classes: SchoolClass[];
    existingEnquiries: Enquiry[];
}
const EnquiryModal: React.FC<EnquiryModalProps> = ({ isOpen, onClose, onSave, actor, classes, existingEnquiries }) => {
    const [formData, setFormData] = useState({ name: '', phone: '', email: '', source: 'Call' as EnquirySource, targetClassId: '', preferredIntake: '2025-2026 Term 1', notes: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [isDuplicate, setIsDuplicate] = useState(false);
    
    useEffect(() => {
        if (!formData.name && !formData.phone && !formData.email) {
            setIsDuplicate(false);
            return;
        }
        const duplicate = existingEnquiries.some(e => 
            e.name.toLowerCase() === formData.name.toLowerCase() &&
            (e.phone && e.phone === formData.phone) || (e.email && e.email === formData.email)
        );
        setIsDuplicate(duplicate);
    }, [formData.name, formData.phone, formData.email, existingEnquiries]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!formData.name || (!formData.phone && !formData.email)) {
            setError('Name and either Phone or Email are required.');
            return;
        }
        setError('');
        setIsSaving(true);
        try {
            // FIX: The createEnquiry function expects the `ownerUserId` property.
            // This is assigned from the `actor` prop, which represents the currently logged-in user.
            await createEnquiry({ ...formData, ownerUserId: actor.id }, actor);
            onSave();
            onClose();
        } catch {
            setError('Failed to save enquiry.');
        } finally {
            setIsSaving(false);
        }
    };
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="New Enquiry">
            <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4">
                    {isDuplicate && <p className="p-2 bg-yellow-100 text-yellow-800 text-sm rounded-md">Warning: An enquiry with a similar name and contact already exists.</p>}
                    {error && <p className="text-red-600 text-sm">{error}</p>}
                    <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Enquirer Name" className="w-full rounded-md" required />
                    <div className="grid grid-cols-2 gap-4">
                        <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="Phone Number" className="w-full rounded-md" />
                        <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Email Address" className="w-full rounded-md" />
                    </div>
                    <select value={formData.source} onChange={e => setFormData({...formData, source: e.target.value as EnquirySource})} className="w-full rounded-md">
                        {(['Call', 'Web', 'Walk-in', 'Referral', 'Social'] as EnquirySource[]).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                     <select value={formData.targetClassId} onChange={e => setFormData({...formData, targetClassId: e.target.value})} className="w-full rounded-md">
                        <option value="">Select Target Class (Optional)</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Notes..." className="w-full rounded-md" rows={3}></textarea>
                </div>
                 <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md">Cancel</button>
                    <button type="submit" disabled={isSaving} className="px-4 py-2 text-white bg-indigo-600 rounded-md disabled:bg-gray-400">{isSaving ? 'Saving...' : 'Save Enquiry'}</button>
                </div>
            </form>
        </Modal>
    );
};


// --- Main Page Component ---
const EnquiriesPage: React.FC = () => {
    const { siteId } = useParams<{ siteId: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useAuth();
    const { addToast } = useToast();
    
    const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const filters = useMemo(() => ({
        status: searchParams.get('status') || undefined,
        source: searchParams.get('source') || undefined,
    }), [searchParams]);

    const fetchData = () => {
        setLoading(true);
        Promise.all([listEnquiries(), getClasses()])
            .then(([enqData, classData]) => {
                setEnquiries(enqData);
                setClasses(classData);
            }).catch(() => addToast('Failed to load data.', 'error')).finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchData();
    }, [addToast]);
    
    const handleFilterChange = (key: string, value: string) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            if(value) newParams.set(key, value);
            else newParams.delete(key);
            return newParams;
        });
    };
    
    const filteredEnquiries = useMemo(() => {
        return enquiries.filter(e => 
            (filters.status ? e.status === filters.status : true) &&
            (filters.source ? e.source === filters.source : true)
        );
    }, [enquiries, filters]);
    
    const handleSaveSuccess = () => {
        addToast('Enquiry created successfully!', 'success');
        fetchData();
    };

    const handleExport = () => {
        exportToCsv('enquiries.csv', [
            { key: 'createdAt', label: 'Date' },
            { key: 'name', label: 'Name' },
            { key: 'status', label: 'Status' },
            { key: 'source', label: 'Source' },
            { key: 'phone', label: 'Phone' },
            { key: 'email', label: 'Email' },
        ], filteredEnquiries.map(e => ({...e, createdAt: new Date(e.createdAt).toLocaleDateString() })));
    };
    
    const statusStyles: Record<EnquiryStatus, string> = { New: 'bg-blue-100 text-blue-800', Contacted: 'bg-yellow-100 text-yellow-800', Qualified: 'bg-teal-100 text-teal-800', Converted: 'bg-green-100 text-green-800', Closed: 'bg-gray-100 text-gray-800' };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Enquiries</h1>
                <div className="flex gap-2">
                    <button onClick={handleExport} className="px-4 py-2 text-sm font-medium bg-white border rounded-md shadow-sm">Export CSV</button>
                    <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700">New Enquiry</button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="grid grid-cols-2 gap-4">
                    <select value={filters.status || ''} onChange={e => handleFilterChange('status', e.target.value)} className="w-full rounded-md">
                        <option value="">All Statuses</option>
                        {(['New', 'Contacted', 'Qualified', 'Converted', 'Closed'] as EnquiryStatus[]).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                     <select value={filters.source || ''} onChange={e => handleFilterChange('source', e.target.value)} className="w-full rounded-md">
                        <option value="">All Sources</option>
                        {(['Call', 'Web', 'Walk-in', 'Referral', 'Social'] as EnquirySource[]).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>
            
            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50"><tr>
                        <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Enquirer</th>
                        <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                        <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr></thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? <tr><td colSpan={4} className="p-4 text-center">Loading...</td></tr> :
                        filteredEnquiries.map(enq => (
                            <tr key={enq.id} className="hover:bg-gray-50">
                                <td className="p-3 text-sm">
                                    <Link to={`/school/${siteId}/frontoffice/enquiries/${enq.id}`} className="font-medium text-indigo-600 hover:text-indigo-900">{enq.name}</Link>
                                    <div className="text-gray-500">{enq.phone || enq.email}</div>
                                </td>
                                <td className="p-3 text-sm">{enq.source}</td>
                                <td className="p-3 text-sm"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[enq.status]}`}>{enq.status}</span></td>
                                <td className="p-3 text-sm">{new Date(enq.createdAt).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {user && <EnquiryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveSuccess} actor={user} classes={classes} existingEnquiries={enquiries} />}
        </div>
    );
};

export default EnquiriesPage;
