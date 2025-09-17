import React, { useState, useEffect } from 'react';
import type { User, Student, CurfewException } from '../../types';
import * as hostelService from '../../lib/hostelService';
import Modal from '../ui/Modal';
import { useToast } from '../../contexts/ToastContext';

interface ExceptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  actor: User;
  students: Student[];
}

const ExceptionModal: React.FC<ExceptionModalProps> = ({ isOpen, onClose, onSave, actor, students }) => {
    const { addToast } = useToast();
    const [formData, setFormData] = useState({ studentId: '', fromDate: '', toDate: '', reason: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setFormData({ studentId: '', fromDate: '', toDate: '', reason: '' });
            setError('');
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.studentId || !formData.fromDate || !formData.toDate || !formData.reason) {
            setError('All fields are required.');
            return;
        }
        if (formData.fromDate > formData.toDate) {
            setError('"From" date cannot be after "To" date.');
            return;
        }
        setError('');
        setIsSaving(true);
        try {
            await hostelService.createCurfewException({
                ...formData,
                approvedByUserId: actor.id
            }, actor);
            onSave();
            onClose();
        } catch {
            addToast('Failed to save exception.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Grant Curfew Exception">
            <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4">
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <div>
                        <label>Student</label>
                        <select value={formData.studentId} onChange={e => setFormData({...formData, studentId: e.target.value})} className="w-full rounded-md mt-1" required>
                            <option value="">Select Student...</option>
                            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label>From Date</label>
                            <input type="date" value={formData.fromDate} onChange={e => setFormData({...formData, fromDate: e.target.value})} className="w-full rounded-md mt-1" required />
                        </div>
                        <div>
                            <label>To Date</label>
                            <input type="date" value={formData.toDate} onChange={e => setFormData({...formData, toDate: e.target.value})} className="w-full rounded-md mt-1" required />
                        </div>
                    </div>
                    <div>
                        <label>Reason</label>
                        <textarea value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} className="w-full rounded-md mt-1" rows={3} required />
                    </div>
                </div>
                <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md">Cancel</button>
                    <button type="submit" disabled={isSaving} className="px-4 py-2 text-white bg-indigo-600 rounded-md disabled:bg-gray-400">
                        {isSaving ? 'Saving...' : 'Grant Exception'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ExceptionModal;