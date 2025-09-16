import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as hostelService from '../../lib/hostelService';
import { getStudents } from '../../lib/schoolService';
import type { HostelVisitor, User, Student } from '../../types';
import Modal from '../../components/ui/Modal';

// --- Visitor Modal ---
interface VisitorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    actor: User;
    students: Student[];
}
const VisitorModal: React.FC<VisitorModalProps> = ({ isOpen, onClose, onSave, actor, students }) => {
    const [formData, setFormData] = useState({ studentId: '', visitorName: '', relationship: '' });
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = { ...formData, timeIn: new Date().toISOString() };
        await hostelService.createVisitor(payload, actor);
        onSave();
        onClose();
    };
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Check In Hostel Visitor">
            <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4">
                     <select value={formData.studentId} onChange={e => setFormData({...formData, studentId: e.target.value})} className="w-full rounded-md" required>
                        <option value="">Select Student to Visit...</option>
                        {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <input value={formData.visitorName} onChange={e => setFormData({...formData, visitorName: e.target.value})} placeholder="Visitor Name" className="w-full rounded-md" required />
                    <input value={formData.relationship} onChange={e => setFormData({...formData, relationship: e.target.value})} placeholder="Relationship to Student" className="w-full rounded-md" required />
                </div>
                 <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3"><button type="button" onClick={onClose}>Cancel</button><button type="submit">Check In</button></div>
            </form>
        </Modal>
    );
};

// --- Main Page ---
const HostelVisitorsPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [visitors, setVisitors] = useState<(HostelVisitor & { studentName: string })[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchData = useCallback(() => {
        setLoading(true);
        Promise.all([
            hostelService.listHostelVisitors(),
            getStudents({ limit: 1000 }).then(res => res.students)
        ]).then(([visitorData, studentData]) => {
            setVisitors(visitorData);
            setStudents(studentData);
        }).catch(() => addToast('Failed to load data.', 'error')).finally(() => setLoading(false));
    }, [addToast]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSignOut = async (visitorId: string) => {
        if (!user) return;
        await hostelService.signOutVisitor(visitorId, user);
        addToast('Visitor signed out.', 'success');
        fetchData();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Hostel Visitors</h1>
                <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm">Check In Visitor</button>
            </div>
            
            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50"><tr>
                        <th className="p-3 text-left text-xs uppercase">Visitor</th>
                        <th className="p-3 text-left text-xs uppercase">Visiting Student</th>
                        <th className="p-3 text-left text-xs uppercase">Time In/Out</th>
                        <th className="p-3 text-right text-xs uppercase">Actions</th>
                    </tr></thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? <tr><td colSpan={4} className="p-4 text-center">Loading...</td></tr> :
                        visitors.map(v => (
                            <tr key={v.id}>
                                <td className="p-3 text-sm">{v.visitorName} ({v.relationship})</td>
                                <td className="p-3 text-sm">{v.studentName}</td>
                                <td className="p-3 text-sm">{new Date(v.timeIn).toLocaleString()} - {v.timeOut ? new Date(v.timeOut).toLocaleTimeString() : <span className="text-green-600 font-bold">IN</span>}</td>
                                <td className="p-3 text-right text-sm">
                                    {!v.timeOut && <button onClick={() => handleSignOut(v.id)} className="text-red-600">Sign Out</button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {user && <VisitorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={fetchData} actor={user} students={students} />}
        </div>
    );
};

export default HostelVisitorsPage;
