import React, { useState, useEffect } from 'react';
import type { OnlineExam, User, Subject, SchoolClass } from '../../types';
import { createExam, updateExam } from '../../lib/examService';
import Modal from '../ui/Modal';

interface ExamModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveSuccess: () => void;
    initialData: OnlineExam | null;
    actor: User;
    subjects: Subject[];
    classes: SchoolClass[];
}

const ExamModal: React.FC<ExamModalProps> = ({ isOpen, onClose, onSaveSuccess, initialData, actor, subjects, classes }) => {
    const [formData, setFormData] = useState({
        title: '', subjectId: '', classId: '', instructions: '',
        durationMinutes: 30, startTime: '', endTime: '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setFormData({
                title: initialData?.title || '',
                subjectId: initialData?.subjectId || '',
                classId: initialData?.classId || '',
                instructions: initialData?.instructions || '',
                durationMinutes: initialData?.durationMinutes || 30,
                startTime: initialData?.startTime ? initialData.startTime.substring(0, 16) : '',
                endTime: initialData?.endTime ? initialData.endTime.substring(0, 16) : '',
            });
            setError('');
        }
    }, [isOpen, initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const payload = {
                ...formData,
                durationMinutes: Number(formData.durationMinutes),
                startTime: new Date(formData.startTime).toISOString(),
                endTime: new Date(formData.endTime).toISOString(),
            };
            if (initialData) {
                await updateExam(initialData.id, payload, actor);
            } else {
                // FIX: Added the required `config` property to the payload for `createExam`.
                await createExam({ ...payload, config: { lockdownMode: false, questionIds: [] } }, actor);
            }
            onSaveSuccess();
        } catch {
            setError('Failed to save exam.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Exam' : 'Create New Exam'}>
            <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    {error && <p className="text-red-600 text-sm">{error}</p>}
                    <input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Exam Title" className="w-full rounded-md" required />
                    <div className="grid grid-cols-2 gap-4">
                        <select value={formData.classId} onChange={e => setFormData({ ...formData, classId: e.target.value })} className="w-full rounded-md" required>
                            <option value="">Select Class</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <select value={formData.subjectId} onChange={e => setFormData({ ...formData, subjectId: e.target.value })} className="w-full rounded-md" required>
                            <option value="">Select Subject</option>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <textarea value={formData.instructions} onChange={e => setFormData({ ...formData, instructions: e.target.value })} placeholder="Instructions" className="w-full rounded-md" rows={4} />
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="text-sm">Start Time</label>
                            <input type="datetime-local" value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} className="w-full rounded-md" required />
                        </div>
                        <div>
                            <label className="text-sm">End Time</label>
                            <input type="datetime-local" value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} className="w-full rounded-md" required />
                        </div>
                        <div>
                            <label className="text-sm">Duration (Mins)</label>
                            <input type="number" value={formData.durationMinutes} onChange={e => setFormData({ ...formData, durationMinutes: Number(e.target.value) })} className="w-full rounded-md" required />
                        </div>
                    </div>
                </div>
                <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md">Cancel</button>
                    <button type="submit" disabled={isSaving} className="px-4 py-2 text-white bg-indigo-600 rounded-md disabled:bg-gray-400">
                        {isSaving ? 'Saving...' : 'Save Exam'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ExamModal;
